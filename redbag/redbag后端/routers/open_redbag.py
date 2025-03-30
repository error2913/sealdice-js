from io import BytesIO
import json
from fastapi import APIRouter, Query, Response

from services.image_utils import draw_open_redbag

router = APIRouter()

@router.get("/open_redbag")
async def open_redbag(user_id: int = Query(), user_name: str = Query(), sender_user_name: str = Query(), total: int = Query(), remaining: int = Query(), history: str = Query()):
    try: 
        history_data = json.loads(history)
    except:
        history_data = []
        
    image = draw_open_redbag(user_id, user_name, sender_user_name, total, remaining, history_data)
    
    buf = BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="image/png")
