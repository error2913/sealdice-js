import os
import uuid
from fastapi import APIRouter, BackgroundTasks, Request
from fastapi.responses import JSONResponse

from config import TEMP_DIR, cleanup_temp_files
from services.image_utils import draw_history

router = APIRouter()

@router.post("/history")
async def history(request: Request, background_tasks: BackgroundTasks):
    try:
        body = await request.json()
        total = body.get("total")
        remaining = body.get("remaining")
        history = body.get("history")
        
        image = draw_history(total, remaining, history)
        
        # 生成临时文件名
        temp_filename = f"{uuid.uuid4()}.png"
        temp_filepath = os.path.join(TEMP_DIR, temp_filename)
        
        # 保存图片到临时目录
        image.save(temp_filepath)
            
        # 添加后台任务，清理过期文件
        background_tasks.add_task(cleanup_temp_files)
        
        # 返回临时图片 URL
        base_url = str(request.base_url)
        image_url = f"{base_url}temp_images/{temp_filename}"
        return JSONResponse(content={"image_url": image_url})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)