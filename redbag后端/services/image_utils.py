import os
import random
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import requests

def draw_redbag_top():
    image = Image.new('RGB', (2000, 400), color = (255, 0, 0))
    mask = Image.new('L', image.size, 0)
    ImageDraw.Draw(mask).ellipse((-2000, -5650, 4000, 350), fill=255)
    image.putalpha(mask)
    
    return image

def draw_redbag_bottom():
    image = Image.new('RGB', (2000, 3360), color = (255, 0, 0))
    mask = Image.new('L', image.size, 255)
    ImageDraw.Draw(mask).ellipse((-2000, -3300, 4000, 2700), fill=0)
    image.putalpha(mask)
    
    button = Image.new('RGB', (500, 500), color = (255, 215, 0))
    mask = Image.new('L', button.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 500, 500), fill=255)
    button.putalpha(mask)
    
    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=200)
    ImageDraw.Draw(button).text((150, 150), "開", font=font, fill=(255, 0, 0))
    
    image.paste(button, (750, 2450), button)
    
    return image

redbag_top = draw_redbag_top()
redbag_bottom = draw_redbag_bottom()

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
        files = [f for f in os.listdir("./resources/background") if f.endswith((".jpg", ".png", ".jpeg"))]
        if not files:
            raise Exception("No files found")
        random_file = random.choice(files)
        path = os.path.join("./resources/background", random_file)
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

def draw_redbag_title(draw: ImageDraw, title: str):
    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=150)
    text_bbox = font.getbbox(title)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=150 * 1800 // text_size[0])
        text_bbox = font.getbbox(title)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text(((2000 - text_size[0]) // 2, 200), title, font=font, fill=(255, 215, 0))
    
def draw_message(draw: ImageDraw, text: str):
    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=200)
    text_bbox = font.getbbox(text)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text(((2000 - text_size[0]) // 2, 1400), text, font=font, fill=(255, 215, 0))
    
def draw_info(draw: ImageDraw, info: str):
    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=100)
    text_bbox = font.getbbox(info)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=100 * 1800 // text_size[0])
        text_bbox = font.getbbox(info)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text(((2000 - text_size[0]) // 2, 3100), info, font=font, fill=(255, 215, 0))

def draw_redbag(user_id: int, user_name: str, amount: int, total: int, text: str):
    image = get_background(2000, 3360)

    image.paste(redbag_bottom, (0, 0), redbag_bottom)

    # 获取并粘贴头像
    avatar = get_avatar(user_id)
    image.paste(avatar, (650, 445), avatar)

    draw = ImageDraw.Draw(image)
    draw_redbag_title(draw, f"来自<{user_name}>的红包")
    draw_message(draw, text)
    draw_info(draw, f"金额：{amount} 数量：{total}")
    
    return image

def draw_exclusive_redbag(user_id: int, user_name: str, target_user_id: int, target_user_name: str, amount: int, text: str):
    image = get_background(2000, 3360)

    image.paste(redbag_bottom, (0, 0), redbag_bottom)

    # 获取并粘贴头像
    avatar = get_avatar(user_id)
    avatar = avatar.resize((500, 500))
    image.paste(avatar, (400, 445), avatar)
        
    target_avatar = get_avatar(target_user_id)
    target_avatar = target_avatar.resize((500, 500))
    image.paste(target_avatar, (1100, 445), target_avatar)

    draw = ImageDraw.Draw(image)
    draw_redbag_title(draw, f"<{user_name}>发给<{target_user_name}>的专属红包")
    draw_message(draw, text)
    draw_info(draw, f"金额：{amount}")
    
    return image

def draw_history_title(total: int, count: int, remaining: int):
    image = Image.new('RGB', (2000, 200), color = (255, 255, 255))
    
    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=80)
    text = f"已领取{count}/{total}个，剩余金额{remaining}"
    text_bbox = font.getbbox(text)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=80 * 1800 // text_size[0])
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

    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=100)
    text_bbox = font.getbbox(user_name)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1200:
        font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=100 * 1200 // text_size[0])
        text_bbox = font.getbbox(user_name)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text((400, (400 - text_size[1]) // 2), user_name, font=font, fill=(0, 0, 0))

    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=100)
    text = f"{amount}"
    text_bbox = font.getbbox(text)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 400:
        font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=100 * 400 // text_size[0])
        text_bbox = font.getbbox(text)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    draw.text((1600 + (400 - text_size[0]) // 2, (400 - text_size[1]) // 2), text, font=font, fill=(0, 0, 0))
    
    return image

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

def draw_history(total: int, remaining: int, history_data: list):
    images = [draw_history_title(total, len(history_data), remaining)]
    
    for item in history_data:
        images.append(draw_history_content(int(item["uid"][3:]), item["un"], item["amount"]))
    
    images.append(Image.new('RGB', (2000, 100), color = (255, 255, 255)))
    image = vistack_images(images)
    
    return image

def draw_open_redbag(user_id: int, user_name: str, sender_user_name: str, total: int, remaining: int, history_data: list):
    image = get_background(2000, 1500)

    image.paste(redbag_top, (0, 0), redbag_top)
    
    avatar = get_avatar(user_id)
    image.paste(avatar, (650, 455), avatar)

    font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=150)
    title = f"<{user_name}>领取了<{sender_user_name}>的红包"
    text_bbox = font.getbbox(title)
    text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    if text_size[0] > 1800:
        font = ImageFont.truetype("./resources/fonts/HYWenHei-85W.ttf", size=150 * 1800 // text_size[0])
        text_bbox = font.getbbox(title)
        text_size = (text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1])
    ImageDraw.Draw(image).text(((2000 - text_size[0]) // 2, 1155 + (345 - text_size[1]) // 2), title, font=font, fill=(255, 215, 0))
    
    images = [image, draw_history_title(total, len(history_data), remaining)]
    
    for item in history_data:
        images.append(draw_history_content(int(item["uid"][3:]), item["un"], item["amount"]))
    
    images.append(Image.new('RGB', (2000, 100), color = (255, 255, 255)))
    image = vistack_images(images)
    
    return image
