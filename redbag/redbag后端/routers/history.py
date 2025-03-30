from io import BytesIO
import json
from fastapi import APIRouter, Query, Response

from services.image_utils import draw_history

router = APIRouter()

@router.get("/history")
async def history(total: int = Query(), remaining: int = Query(), history: str = Query()):
    try:
        history_data = json.loads(history)
    except:
        history_data = []
        
    image = draw_history(total, remaining, history_data)
    
    buf = BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="image/png")