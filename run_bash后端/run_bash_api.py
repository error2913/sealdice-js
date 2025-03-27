import os
import re
from fastapi import FastAPI, Query, HTTPException
import subprocess

app = FastAPI()

LINES_THRESHOLD = 20
CHARS_THRESHOLD_IN_LINE = 47
CHARS_THRESHOLD = 1000

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
        # 获取当前环境变量
        env = os.environ.copy()
        
        # 执行命令并捕获输出、错误信息和退出状态码
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)

        return {
            "output": cut_str(remove_ansi(result.stdout)),
            "error": cut_str(remove_ansi(result.stderr)),
            "retcode": result.returncode
        }
    except Exception as e:
        # 如果发生异常，返回错误信息
        print(f"执行命令时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"执行命令时发生错误: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3011)