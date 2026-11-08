from fastapi import APIRouter
from ..database import get_db
from ..schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health", response_model=HealthResponse)
def check_health():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM shapes")
        shapes_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM lessons")
        lessons_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM learning_history")
        history_count = cursor.fetchone()[0]
        
    return HealthResponse(
        status="ok",
        service="Simple AI Camera Geometry Backend",
        database="connected",
        shapes_count=shapes_count,
        lessons_count=lessons_count,
        history_count=history_count
    )
