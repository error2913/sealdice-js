# coding: utf-8
# author: 错误
# description: 执行Bash命令并返回输出的前几行、错误信息和退出状态码。目前仅支持Linux环境。
# version: 1.0.0

import asyncio
from collections import deque
import os
import re
import signal
from typing import Any, Dict
from fastapi import FastAPI, Query, HTTPException
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = FastAPI()

LINES_THRESHOLD = 50
CHARS_THRESHOLD_IN_LINE = 97
CHARS_THRESHOLD = 5000

# 进程管理器
class ProcessManager:
    def __init__(self):
        self.processes: Dict[str, Dict[str, Any]] = {}
        self.lock = asyncio.Lock()
        self.id_lock = asyncio.Lock()
        self.counter = 0
        
    async def _generate_pid(self) -> str:
        async with self.id_lock:
            # 查找可用的PID（处理计数器循环后的冲突）
            max_attempts = 100
            for _ in range(max_attempts):
                self.counter = (self.counter + 1) % 1_000_000
                pid = f"{self.counter:06}"
                if pid not in self.processes:
                    return pid
            raise RuntimeError("无法生成唯一进程ID")
    
    async def create_process(self, cmd: str) -> str:
        async with self.lock:
            process_id = await self._generate_pid()
            self.processes[process_id] = {
                "cmd": cmd,
                "stdout": deque(maxlen=1000),  # 保留最近1000行
                "stderr": deque(maxlen=1000),
                "retcode": None,
                "create_time": asyncio.get_event_loop().time(),
                "task": None,
                "done": False
            }
            task = asyncio.create_task(self._run_process(process_id, cmd))
            self.processes[process_id]["task"] = task
            return process_id
    
    async def _run_process(self, process_id: str, cmd: str):
        try:
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                preexec_fn=os.setsid
            )
            
            # 创建输出读取任务
            stdout_task = asyncio.create_task(self._read_stream(process_id, 'stdout', process.stdout))
            stderr_task = asyncio.create_task(self._read_stream(process_id, 'stderr', process.stderr))
            
            # 等待进程结束
            retcode = await process.wait()
            await asyncio.gather(stdout_task, stderr_task)
            
            async with self.lock:
                self.processes[process_id]["retcode"] = retcode
                self.processes[process_id]["done"] = True

        except Exception as e:
            logger.error(f"进程执行失败: {str(e)}")
            async with self.lock:
                self.processes[process_id]["stderr"].append(f"Process execution failed: {str(e)}")
                self.processes[process_id]["done"] = True

    async def _read_stream(self, process_id: str, stream_type: str, stream):
        async for line in stream:
            decoded_line = remove_ansi(line.decode(errors='replace').rstrip())
            async with self.lock:
                if process_id in self.processes:
                    self.processes[process_id][stream_type].append(decoded_line)
    
    async def get_process(self, pid: str, lines: int = 10):
        async with self.lock:
            if pid not in self.processes:
                return None
            
            proc = self.processes[pid]
            return {
                "output": "\n".join(list(proc["stdout"])[-lines:]),
                "error": "\n".join(list(proc["stderr"])[-lines:]),
                "retcode": proc["retcode"],
                "done": proc["done"]
            }
    
    async def delete_process(self, process_id: str):
        async with self.lock:
            if process_id in self.processes:
                await self._terminate_process(process_id)
                del self.processes[process_id]
                return True
            return False
    
    async def _terminate_process(self, process_id: str):
        proc = self.processes.get(process_id)
        if proc and not proc["done"]:
            try:
                task = proc["task"]
                task.cancel()
                # 如果进程仍在运行则终止进程组
                if proc["task"].done():
                    return
                try:
                    pgid = os.getpgid(proc["task"].get_loop())
                    os.killpg(pgid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            except Exception as e:
                logger.error(f"终止进程失败: {str(e)}")

pm = ProcessManager()

def remove_ansi(text):
    """
    移除文本中的 ANSI 转义序列，保留文本内容
    """
    ansi_escape = re.compile(r'\x1b\[([0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', text)

def cut_str(s: str) -> str:
    """
    截取字符串
    """
    omit_str = ''
    
    lines = s.strip().split("\n")
    if len(lines) > LINES_THRESHOLD:
        omit_str += f"\n...省略{len(lines) - LINES_THRESHOLD}行"
        lines = lines[:LINES_THRESHOLD]
    
    result = "\n".join([
        line[:CHARS_THRESHOLD_IN_LINE] + '...' if len(line) > CHARS_THRESHOLD_IN_LINE else line 
        for line in lines 
        if line.strip()
    ])
    
    if len(result) > CHARS_THRESHOLD:
        omit_str += f"\n...省略{len(result) - CHARS_THRESHOLD}字符"
        result = result[:CHARS_THRESHOLD]
    return result + omit_str

@app.get("/bash")
async def run_bash_command(cmd: str = Query(..., description="Bash命令字符串")):
    """
    执行Bash命令并返回输出的前几行、错误信息和退出状态码。
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

        return {
            "output": cut_str(remove_ansi(stdout.decode(errors='replace'))),
            "error": cut_str(remove_ansi(stderr.decode(errors='replace'))),
            "retcode": process.returncode
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"执行命令时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"执行命令时发生错误: {str(e)}")

@app.get("/create_process")
async def create_process(cmd: str = Query(..., description="Bash命令字符串")):
    """创建新进程并返回UUID"""
    try:
        pid = await pm.create_process(cmd)
        return {"pid": pid}
    except Exception as e:
        logger.error(f"创建进程失败: {str(e)}")
        raise HTTPException(status_code=500, detail="进程创建失败")

@app.get("/check_process")
async def check_process(
    pid: str = Query(..., description="进程UUID"),
    lines: int = Query(10, ge=1, le=100, description="获取的行数")
):
    """查看进程输出"""
    proc_info = await pm.get_process(pid, lines)
    if not proc_info:
        raise HTTPException(status_code=404, detail="进程不存在或已过期")
    
    return {
        "output": remove_ansi(proc_info["output"]),
        "error": remove_ansi(proc_info["error"]),
        "retcode": proc_info["retcode"],
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