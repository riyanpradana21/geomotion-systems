import json
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from ..database import get_db
from ..schemas import HistoryCreate, HistoryResponse

router = APIRouter(prefix="/api", tags=["history"])

@router.post("/history", response_model=HistoryResponse, status_code=201)
def record_history(payload: HistoryCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO learning_history (
                shape_name, recognized_shape, similarity_score, status, characteristics, feedback, duration_seconds, thumbnail_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.shape_name,
            payload.recognized_shape,
            payload.similarity_score,
            payload.status,
            json.dumps(payload.characteristics),
            payload.feedback,
            payload.duration_seconds,
            payload.thumbnail_data or ""
        ))
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM learning_history WHERE id = ?", (new_id,))
        row = cursor.fetchone()

    return HistoryResponse(
        id=row["id"],
        shape_name=row["shape_name"],
        recognized_shape=row["recognized_shape"],
        similarity_score=row["similarity_score"],
        status=row["status"],
        characteristics=json.loads(row["characteristics"]),
        feedback=row["feedback"],
        duration_seconds=row["duration_seconds"],
        thumbnail_data=row["thumbnail_data"],
        created_at=str(row["created_at"])
    )

@router.get("/history", response_model=List[HistoryResponse])
def get_history(
    limit: int = 50,
    offset: int = 0,
    shape: Optional[str] = None
):
    with get_db() as conn:
        cursor = conn.cursor()
        if shape:
            cursor.execute(
                "SELECT * FROM learning_history WHERE shape_name LIKE ? OR recognized_shape LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?",
                (f"%{shape}%", f"%{shape}%", limit, offset)
            )
        else:
            cursor.execute("SELECT * FROM learning_history ORDER BY id DESC LIMIT ? OFFSET ?", (limit, offset))
        rows = cursor.fetchall()

    results = []
    for r in rows:
        results.append(HistoryResponse(
            id=r["id"],
            shape_name=r["shape_name"],
            recognized_shape=r["recognized_shape"],
            similarity_score=r["similarity_score"],
            status=r["status"],
            characteristics=json.loads(r["characteristics"]) if r["characteristics"] else {},
            feedback=r["feedback"],
            duration_seconds=r["duration_seconds"],
            thumbnail_data=r["thumbnail_data"],
            created_at=str(r["created_at"])
        ))
    return results

@router.delete("/history/{id}")
def delete_history(id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM learning_history WHERE id = ?", (id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="History record not found")
        cursor.execute("DELETE FROM learning_history WHERE id = ?", (id,))
        
    return {"message": f"History item {id} deleted successfully", "id": id}
