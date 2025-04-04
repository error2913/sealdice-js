from io import BytesIO
import json
import logging
import os
import time
import uuid
from fastapi import BackgroundTasks, FastAPI, Query, Request, Response
from PIL import Image, ImageDraw, ImageFont
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import requests
import uvicorn

app = FastAPI()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

def get_avatar(user_id: int) -> Image:
    url = f"http://q1.qlogo.cn/g?b=qq&nk={user_id}&s=640"
    response = requests.get(url)
    if response.status_code == 200:
        avatar = Image.open(BytesIO(response.content)).resize((200, 200)).convert("RGBA")
    else:
        avatar = Image.new('RGBA', (200, 200), color = (255, 255, 255))

    mask = Image.new('L', avatar.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, avatar.size[0], avatar.size[1]), fill=255)
    avatar.putalpha(mask)
    
    return avatar

def vistack_images(images: list[Image.Image]):
    if not images:
        return Image.new('RGB', (2000, 2000), color = (255, 255, 255))
    
    h = sum([x.size[1] for x in images])
        
    image = Image.new('RGB', (2000, h), color = (255, 255, 255))
    draw = ImageDraw.Draw(image)
    for i in range(len(images)):
        image.paste(images[i], (0, sum([x.size[1] for x in images[:i]])))
        if i != len(images) - 1:
            draw.line((0, sum([x.size[1] for x in images[:i+1]]), 2000, sum([x.size[1] for x in images[:i+1]])), fill=(128, 128, 128), width=10)
    
    return image

def draw_title(title: str):
    image = Image.new('RGB', (2000, 300), color = (255, 255, 255))
    
    font = ImageFont.truetype("./resources/fonts/YinPinHongMengTi.ttf", size=200)
    text_bbox = font.getbbox(title)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resources/fonts/YinPinHongMengTi.ttf", size=200 * 1800 // text_size[0])
        text_bbox = font.getbbox(title)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    ImageDraw.Draw(image).text(((2000 - text_size[0]) // 2, (200 - text_size[1]) // 2), title, font=font, fill=(0, 0, 0))
    
    return image

def draw_content(user_id: int, user_name: str, value: int | str, index: int):
    avatar = get_avatar(user_id)
    image = Image.new('RGB', (2000, 300), color = (255, 255, 255))
    image.paste(avatar, (200, 50), avatar)

    draw = ImageDraw.Draw(image)
    
    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=70)
    text = f"{index}"
    text_bbox = font.getbbox(text)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 200:
        font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=70 * 200 // text_size[0])
        text_bbox = font.getbbox(text)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text(((200 - text_size[0]) // 2, (300 - text_size[1]) // 2), text, font=font, fill=(0, 0, 0))

    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=100)
    text_bbox = font.getbbox(user_name)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1100:
        font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=100 * 1100 // text_size[0])
        text_bbox = font.getbbox(user_name)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text((500, (300 - text_size[1]) // 2), user_name, font=font, fill=(0, 0, 0))

    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=100)
    text = f"{value}"
    text_bbox = font.getbbox(text)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 400:
        font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=100 * 400 // text_size[0])
        text_bbox = font.getbbox(text)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text((1600 + (400 - text_size[0]) // 2, (300 - text_size[1]) // 2), text, font=font, fill=(0, 0, 0))
    
    return image

@app.post("/chart")
async def chart(request: Request, background_tasks: BackgroundTasks):
    try:
        body = await request.json()
        title = body.get("title")
        data = body.get("data")
        
        images = [draw_title(title)]
        
        for i in range(len(data)):
            item = data[i]
            images.append(draw_content(int(item["uid"][3:]), item["un"], item["value"], i + 1))
            
        images.append(Image.new('RGB', (2000, 100), color = (255, 255, 255)))
        image = vistack_images(images)
            
        buf = BytesIO()
        image.save(buf, format='PNG')
        buf.seek(0)
        
                # 生成临时文件名
        temp_filename = f"{uuid.uuid4()}.png"
        temp_filepath = os.path.join(TEMP_DIR, temp_filename)
        
        # 保存图片到临时目录
        with open(temp_filepath, "wb") as f:
            f.write(buf.getvalue())
            
        # 添加后台任务，清理过期文件
        background_tasks.add_task(cleanup_temp_files)

        # 返回临时图片 URL
        base_url = str(request.base_url)
        image_url = f"{base_url}temp_images/{temp_filename}"
        return JSONResponse(content={"image_url": image_url})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3003)