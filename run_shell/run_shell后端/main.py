# coding: utf-8
# author: 错误
# description: 执行Shell命令并返回输出的前几行、错误信息和退出状态码。目前仅支持Linux环境。
# version: 1.1.0

import asyncio
from collections import deque
import os
import signal
import time
import uuid
from fastapi import BackgroundTasks, FastAPI, Query, HTTPException, Request
import logging

from fastapi.staticfiles import StaticFiles

from process_manager import ProcessManager
from image_utils import draw_image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = FastAPI()

LINES_THRESHOLD = 100

pm = ProcessManager()

# 创建临时目录
TEMP_DIR = "temp_images"
os.makedirs(TEMP_DIR, exist_ok=True)

# 挂载静态文件目录，用于提供临时图片访问
app.mount("/temp_images", StaticFiles(directory=TEMP_DIR), name="temp_images")

# 文件过期时间（秒）
FILE_EXPIRE_TIME = 120

def cleanup_temp_files():
    now = time.time()
    for filename in os.listdir(TEMP_DIR):
        filepath = os.path.join(TEMP_DIR, filename)
        if os.path.isfile(filepath):
            file_creation_time = os.path.getctime(filepath)
            if now - file_creation_time > FILE_EXPIRE_TIME:
                try:
                    os.remove(filepath)
                    logger.info(f"Deleted expired file: {filename}")
                except Exception as e:
                    logger.error(f"Failed to delete file {filename}: {e}")

def cut_str(s: str) -> str:
    """
    截取字符串
    """
    lines = s.split("\n")
    
    if len(lines) > LINES_THRESHOLD:
        omit_str = f"\n...省略{len(lines) - LINES_THRESHOLD}行"
        lines = lines[:LINES_THRESHOLD]
        lines.append(omit_str)
    
    return "\n".join(lines)

@app.get("/run")
async def run_command(request: Request, background_tasks: BackgroundTasks, cmd: str = Query(..., description="Shell命令字符串")):
    """
    执行Shell命令并返回输出的前几行、错误信息和退出状态码。
    """
    # 检查命令是否为空
    if not cmd:
        raise HTTPException(status_code=400, detail="命令不能为空")

    try:
        # 创建子进程
        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            preexec_fn=os.setsid
        )
        
        # 等待子进程完成或超时
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=10)
        except asyncio.TimeoutError:
            logger.warning(f"命令执行超时: {cmd}")
            
            # 终止整个进程树
            try:
                pgid = os.getpgid(process.pid)
                os.killpg(pgid, signal.SIGKILL)
                logger.debug(f"已终止进程组 {pgid}")
            except ProcessLookupError:
                pass  # 进程可能已自行退出
            
            # 二次确认清理
            await process.wait()
            raise HTTPException(
                status_code=408,
                detail=f"命令执行超时（已强制终止进程树）: {cmd}"
            )
            
        output_image = draw_image(cut_str(stdout.decode(errors='replace')))
        if output_image:
            output_temp_filename = f"{uuid.uuid4()}.png"
            output_temp_filepath = os.path.join(TEMP_DIR, output_temp_filename)
            output_image.save(output_temp_filepath)
        else:
            output_temp_filename = None
        
        error_image = draw_image(cut_str(stderr.decode(errors='replace')))
        if error_image:
            error_temp_filename = f"{uuid.uuid4()}.png"
            error_temp_filepath = os.path.join(TEMP_DIR, error_temp_filename)
            error_image.save(error_temp_filepath)
        else:
            error_temp_filename = None
            
        # 添加后台任务，清理过期文件
        background_tasks.add_task(cleanup_temp_files)
        
        base_url = str(request.base_url)

        return {
            "output_url": f"{base_url}temp_images/{output_temp_filename}" if output_temp_filename else None,
            "error_url": f"{base_url}temp_images/{error_temp_filename}" if error_temp_filename else None,
            "retcode": process.returncode
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"执行命令时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"执行命令时发生错误: {str(e)}")

@app.get("/create_process")
async def create_process(cmd: str = Query(..., description="Shell命令字符串")):
    """创建新进程并返回UUID"""
    try:
        pid = await pm.create_process(cmd)
        return {"pid": pid}
    except Exception as e:
        logger.error(f"创建进程失败: {str(e)}")
        raise HTTPException(status_code=500, detail="进程创建失败")

@app.get("/check_process")
async def check_process(
    request: Request, background_tasks: BackgroundTasks,
    pid: str = Query(..., description="进程UUID"),
    start_index: int = Query(None, description="起始行索引"),
    end_index: int = Query(None, description="结束行索引")
):
    """查看进程输出"""
    proc_info = await pm.get_process(pid, start_index, end_index)
    if not proc_info:
        raise HTTPException(status_code=404, detail="进程不存在或已过期")
    
    output_image = draw_image(proc_info["output"])
    if output_image:
        output_temp_filename = f"{uuid.uuid4()}.png"
        output_temp_filepath = os.path.join(TEMP_DIR, output_temp_filename)
        output_image.save(output_temp_filepath)
    else:
        output_temp_filename = None
    
    error_image = draw_image(proc_info["error"])
    if error_image:
        error_temp_filename = f"{uuid.uuid4()}.png"
        error_temp_filepath = os.path.join(TEMP_DIR, error_temp_filename)
        error_image.save(error_temp_filepath)
    else:
        error_temp_filename = None
        
    # 添加后台任务，清理过期文件
    background_tasks.add_task(cleanup_temp_files)
    
    base_url = str(request.base_url)
    
    return {
        "output_url": f"{base_url}temp_images/{output_temp_filename}" if output_temp_filename else None,
        "error_url": f"{base_url}temp_images/{error_temp_filename}" if error_temp_filename else None,
        "retcode": proc_info["retcode"],
        "lines": proc_info["lines"],
        "done": proc_info["done"]
    }

@app.get("/del_process")
async def del_process(pid: str = Query(..., description="进程UUID")):
    """删除指定进程"""
    success = await pm.delete_process(pid)
    if not success:
        raise HTTPException(status_code=404, detail="进程不存在")
    return {"status": "已删除"}

@app.get("/list_process")
async def list_process():
    """列出所有进程"""
    async with pm.lock:
        return {pid: {"cmd": proc["cmd"], "done": proc["done"]} for pid, proc in pm.processes.items()}

if __name__ == "__main__":
    import uvicorn
    logger.info("启动服务，监听端口：3011")
    uvicorn.run(app, host="127.0.0.1", port=3011)