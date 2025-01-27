# coding: utf-8

from fastapi import FastAPI
import uvicorn

from routers import send_redbag, open_redbag, history

app = FastAPI()

app.include_router(send_redbag.router)
app.include_router(open_redbag.router)
app.include_router(history.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)