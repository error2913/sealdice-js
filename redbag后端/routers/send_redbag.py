from io import BytesIO
from fastapi import APIRouter, Query, Response

from services.image_utils import draw_redbag, draw_exclusive_redbag

router = APIRouter()

@router.get("/send_redbag")
async def send_redbag(user_id: int = Query(), user_name: str = Query(), amount: int = Query(), total: int = Query(), text: str = Query("恭喜发财，大吉大利", max_length = 9)):
    image = draw_redbag(user_id, user_name, amount, total, text)
    
    buf = BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="image/png")

@router.get("/send_exclusive_redbag")
async def send_exclusive_redbag(user_id: int = Query(), user_name: str = Query(), target_user_id: int = Query(), target_user_name: str = Query(), amount: int = Query(), text: str = Query("恭喜发财，大吉大利", max_length = 9)):
    image = draw_exclusive_redbag(user_id, user_name, target_user_id, target_user_name, amount, text)
    
    buf = BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="image/png")
