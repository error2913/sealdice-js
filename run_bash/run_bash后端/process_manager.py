import asyncio
from collections import deque
import os
import re
import signal
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)

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
                "stdout": deque(maxlen=10000),
                "stderr": deque(maxlen=10000),
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
            decoded_line = line.decode(errors='replace').rstrip()
            async with self.lock:
                if process_id in self.processes:
                    self.processes[process_id][stream_type].append(decoded_line)
    
    async def get_process(self, pid: str, start_index: int = 0, end_index: int = None):
        async with self.lock:
            if pid not in self.processes:
                return None
            
            proc = self.processes[pid]

            output_lines = list(proc["stdout"])[start_index:end_index]
            error_lines = list(proc["stderr"])[start_index:end_index]
            
            return {
                "output": "\n".join(output_lines),
                "error": "\n".join(error_lines),
                "retcode": proc["retcode"],
                "lines": len(proc["stdout"]),
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
