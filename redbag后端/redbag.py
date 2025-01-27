# coding: utf-8

import json
import os
import random
from fastapi import FastAPI, Response, Query
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import requests

app = FastAPI()

def draw_redbag_bottom():
    image = Image.new('RGB', (2000, 3360), color = (255, 0, 0))
    mask = Image.new('L', image.size, 255)
    ImageDraw.Draw(mask).ellipse((-2000, -3300, 4000, 2700), fill=0)
    image.putalpha(mask)
    
    button = Image.new('RGB', (500, 500), color = (255, 215, 0))
    mask = Image.new('L', button.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 500, 500), fill=255)
    button.putalpha(mask)
    
    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=200)
    ImageDraw.Draw(button).text((150, 150), "開", font=font, fill=(255, 0, 0))
    
    image.paste(button, (750, 2450), button)
    
    return image

def get_avatar(user_id: int) -> Image:
    url = f"http://q1.qlogo.cn/g?b=qq&nk={user_id}&s=640"
    response = requests.get(url)
    if response.status_code == 200:
        avatar = Image.open(BytesIO(response.content)).resize((700, 700)).convert("RGBA")
    else:
        avatar = Image.new('RGBA', (700, 700), color = (255, 255, 255))

    mask = Image.new('L', avatar.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, avatar.size[0], avatar.size[1]), fill=255)
    avatar.putalpha(mask)
    
    return avatar
    
def get_background(x: int, y: int):
    background = Image.new('RGB', (x, y), color = (255, 255, 255))

    try :
        files = [f for f in os.listdir("./resource/background") if f.endswith((".jpg", ".png", ".jpeg"))]
        if not files:
            raise Exception("No files found")
        random_file = random.choice(files)
        path = os.path.join("./resource/background", random_file)
        image = Image.open(path).convert("RGBA")
        
        og_wid, og_h = image.size
        og_ratio = og_wid / og_h
        ratio = x / y
        if og_ratio > ratio:
            image = image.resize((int(og_ratio * y), y), Image.Resampling.LANCZOS)
        else:
            image = image.resize((x, int(x / og_ratio)), Image.Resampling.LANCZOS)
        
        left = abs(x - image.size[0]) // 2
        top = abs(y - image.size[1]) // 2
        right = left + x
        bottom = top + y
        image = image.crop((left, top, right, bottom))
    except:
        image = Image.new('RGB', (x, y), color = (255, 0, 0))
    
    channel = Image.new('L', (x, y), 160)
    image.putalpha(channel)
    
    background.paste(image, (0, 0), image)
    
    return background

def draw_redbag_top():
    image = Image.new('RGB', (2000, 400), color = (255, 0, 0))
    mask = Image.new('L', image.size, 0)
    ImageDraw.Draw(mask).ellipse((-2000, -5650, 4000, 350), fill=255)
    image.putalpha(mask)
    
    return image

def draw_history_title(total: int, count: int, remaining: int):
    image = Image.new('RGB', (2000, 200), color = (255, 255, 255))
    
    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=80)
    text = f"已领取{count}/{total}个，剩余金额{remaining}"
    text_bbox = font.getbbox(text)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=80 * 1800 // text_size[0])
        text_bbox = font.getbbox(text)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    ImageDraw.Draw(image).text(((2000 - text_size[0]) // 2, (200 - text_size[1]) // 2), text, font=font, fill=(128, 128, 128))
    
    return image

def draw_history_content(user_id: int, user_name: str, amount: int):
    avatar = get_avatar(user_id)
    avatar = avatar.resize((300, 300))
    image = Image.new('RGB', (2000, 400), color = (255, 255, 255))
    image.paste(avatar, (50, 50), avatar)

    draw = ImageDraw.Draw(image)

    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=100)
    text_bbox = font.getbbox(user_name)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1200:
        font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=100 * 1200 // text_size[0])
        text_bbox = font.getbbox(user_name)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text((400, (400 - text_size[1]) // 2), user_name, font=font, fill=(0, 0, 0))

    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=100)
    text = f"{amount}"
    text_bbox = font.getbbox(text)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 400:
        font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=100 * 400 // text_size[0])
        text_bbox = font.getbbox(text)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text((1600 + (400 - text_size[0]) // 2, (400 - text_size[1]) // 2), text, font=font, fill=(0, 0, 0))
    
    return image

def vistack_images(images: list[Image.Image]):
    images.append(Image.new('RGB', (2000, 100), color = (255, 255, 255)))
    
    h = sum([x.size[1] for x in images])
        
    image = Image.new('RGB', (2000, h), color = (255, 255, 255))
    draw = ImageDraw.Draw(image)
    for i in range(len(images)):
        image.paste(images[i], (0, sum([x.size[1] for x in images[:i]])))
        if i != len(images) - 1:
            draw.line((0, sum([x.size[1] for x in images[:i+1]]), 2000, sum([x.size[1] for x in images[:i+1]])), fill=(128, 128, 128), width=10)
    
    return image

@app.get("/send_redbag")
async def send_redbag(user_id: int = Query(), user_name: str = Query(), amount: int = Query(), total: int = Query(), text: str = Query("大吉大利", max_length = 9)):
    image = get_background(2000, 3360)
        
    bottom = draw_redbag_bottom()
    image.paste(bottom, (0, 0), bottom)

    # 获取并粘贴头像
    avatar = get_avatar(user_id)
    image.paste(avatar, (650, 445), avatar)

    draw = ImageDraw.Draw(image)
 
     # 绘制标题
    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=150)
    title = f"来自<{user_name}>的红包"
    text_bbox = font.getbbox(title)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=150 * 1800 // text_size[0])
        text_bbox = font.getbbox(title)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text(((2000 - text_size[0]) // 2, 200), title, font=font, fill=(255, 215, 0))
       
    # 绘制祝福语
    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=200)
    text_bbox = font.getbbox(text)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text(((2000 - text_size[0]) // 2, 1400), text, font=font, fill=(255, 215, 0))
    
    # 绘制金额和数量
    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=100)
    info = f"金额：{amount} 数量：{total}"
    text_bbox = font.getbbox(info)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=100 * 1800 // text_size[0])
        text_bbox = font.getbbox(info)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text(((2000 - text_size[0]) // 2, 3100), info, font=font, fill=(255, 215, 0))
    
    buf = BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="image/png")

@app.get("/send_exclusive_redbag")
async def send_exclusive_redbag(user_id: int = Query(), user_name: str = Query(), target_user_id: int = Query(), target_user_name: str = Query(), amount: int = Query(), text: str = Query("大吉大利", max_length = 9)):
    image = get_background(2000, 3360)
        
    bottom = draw_redbag_bottom()
    image.paste(bottom, (0, 0), bottom)

    # 获取并粘贴头像
    avatar = get_avatar(user_id)
    avatar = avatar.resize((500, 500))
    image.paste(avatar, (400, 445), avatar)
        
    target_avatar = get_avatar(target_user_id)
    target_avatar = target_avatar.resize((500, 500))
    image.paste(target_avatar, (1100, 445), target_avatar)

    draw = ImageDraw.Draw(image)

    # 绘制标题
    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=150)
    title = f"<{user_name}>发给<{target_user_name}>的专属红包"
    text_bbox = font.getbbox(title)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=150 * 1800 // text_size[0])
        text_bbox = font.getbbox(title)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text(((2000 - text_size[0]) // 2, 200), title, font=font, fill=(255, 215, 0))
        
    # 绘制祝福语
    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=200)
    text_bbox = font.getbbox(text)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text(((2000 - text_size[0]) // 2, 1400), text, font=font, fill=(255, 215, 0))

    # 绘制金额和数量
    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=100)
    info = f"金额：{amount}"
    text_bbox = font.getbbox(info)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=100 * 1800 // text_size[0])
        text_bbox = font.getbbox(info)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text(((2000 - text_size[0]) // 2, 3100), info, font=font, fill=(255, 215, 0))
    
    buf = BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="image/png")

@app.get("/open_redbag")
async def open_redbag(user_id: int = Query(), user_name: str = Query(), sender_user_name: str = Query(), amount: int = Query(), total: int = Query(), remaining: int = Query(), history: str = Query()):
    try: 
        history_data = json.loads(history)
    except:
        history_data = []
        
    image = get_background(2000, 1500)
    
    top = draw_redbag_top()
    image.paste(top, (0, 0), top)
    
    avatar = get_avatar(user_id)
    image.paste(avatar, (650, 455), avatar)

    font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=150)
    title = f"<{user_name}>领取了<{sender_user_name}>的红包"
    text_bbox = font.getbbox(title)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resource/fonts/HYWenHei-85W.ttf", size=150 * 1800 // text_size[0])
        text_bbox = font.getbbox(title)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    ImageDraw.Draw(image).text(((2000 - text_size[0]) // 2, 1200), title, font=font, fill=(255, 215, 0))
    
    images = [image, draw_history_title(total, len(history_data), remaining)]
    
    for item in history_data:
        images.append(draw_history_content(int(item["uid"][3:]), item["un"], item["amount"]))
    
    image = vistack_images(images)
    
    buf = BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="image/png")

@app.get("/history")
async def history(total: int = Query(), remaining: int = Query(), history: str = Query()):
    try:
        history_data = json.loads(history)
    except:
        history_data = []
        
    images = [draw_history_title(total, len(history_data), remaining)]
    
    for item in history_data:
        images.append(draw_history_content(int(item["uid"][3:]), item["un"], item["amount"]))
    
    image = vistack_images(images)
    
    buf = BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="image/png")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)