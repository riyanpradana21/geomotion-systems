import json
from fastapi import APIRouter
from typing import List, Optional
from ..database import get_db
from ..schemas import ShapeResponse

router = APIRouter(prefix="/api", tags=["shapes"])

@router.get("/shapes", response_model=List[ShapeResponse])
def get_shapes(dimension: Optional[str] = None):
    with get_db() as conn:
        cursor = conn.cursor()
        if dimension:
            cursor.execute("SELECT * FROM shapes WHERE dimension = ? ORDER BY id", (dimension,))
        else:
            cursor.execute("SELECT * FROM shapes ORDER BY dimension, id")
        rows = cursor.fetchall()

    results = []
    for r in rows:
        results.append(ShapeResponse(
            id=r["id"],
            name=r["name"],
            dimension=r["dimension"],
            description=r["description"],
            properties=json.loads(r["properties"]),
            tips=json.loads(r["tips"]),
            difficulty=r["difficulty"],
            icon_name=r["icon_name"]
        ))
    return results
