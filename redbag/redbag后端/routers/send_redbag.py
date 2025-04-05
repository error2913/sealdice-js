from io import BytesIO
import os
import uuid
from fastapi import APIRouter, BackgroundTasks, Query, Request, Response
from fastapi.responses import JSONResponse

from config import TEMP_DIR, cleanup_temp_files
from services.image_utils import draw_redbag, draw_exclusive_redbag

router = APIRouter()

@router.post("/send_redbag")
async def send_redbag(request: Request, background_tasks: BackgroundTasks):
    try: 
        body = await request.json()
        user_id = body.get("user_id")
        user_name = body.get("user_name")
        amount = body.get("amount")
        total = body.get("total")
        text = body.get("text", "恭喜发财，大吉大利")
        
        if len(text) > 9:
            return JSONResponse(content={"error": "text length must be less than 9"}, status_code=400)
        
        image = draw_redbag(user_id, user_name, amount, total, text)
        
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

@router.post("/send_exclusive_redbag")
async def send_exclusive_redbag(request: Request, background_tasks: BackgroundTasks):
    try: 
        body = await request.json()
        user_id = body.get("user_id")
        user_name = body.get("user_name")
        target_user_id = body.get("target_user_id")
        target_user_name = body.get("target_user_name")
        amount = body.get("amount")
        text = body.get("text", "恭喜发财，大吉大利")
        
        if len(text) > 9:
            return JSONResponse(content={"error": "text length must be less than 9"}, status_code=400)
        
        image = draw_exclusive_redbag(user_id, user_name, target_user_id, target_user_name, amount, text)
        
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
