# coding: utf-8

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn

from config import TEMP_DIR
from routers import send_redbag, open_redbag, history

app = FastAPI()

# 挂载静态文件目录，用于提供临时图片访问
app.mount("/temp_images", StaticFiles(directory=TEMP_DIR), name="temp_images")

app.include_router(send_redbag.router)
app.include_router(open_redbag.router)
app.include_router(history.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)