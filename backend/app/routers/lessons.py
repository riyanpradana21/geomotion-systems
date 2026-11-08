import json
from fastapi import APIRouter, HTTPException, Path
from typing import List
from ..database import get_db
from ..schemas import LessonResponse

router = APIRouter(prefix="/api", tags=["lessons"])

@router.get("/lessons", response_model=List[LessonResponse])
def get_lessons():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lessons ORDER BY dimension, estimated_minutes")
        rows = cursor.fetchall()

    results = []
    for r in rows:
        results.append(LessonResponse(
            id=r["id"],
            shape_id=r["shape_id"],
            title=r["title"],
            dimension=r["dimension"],
            difficulty=r["difficulty"],
            estimated_minutes=r["estimated_minutes"],
            instructions=r["instructions"],
            steps=json.loads(r["steps"]),
            fun_fact=r["fun_fact"],
            criteria=json.loads(r["criteria"])
        ))
    return results

@router.get("/lessons/{id}", response_model=LessonResponse)
def get_lesson(id: str = Path(..., description="The unique ID of the lesson")):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lessons WHERE id = ?", (id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return LessonResponse(
        id=row["id"],
        shape_id=row["shape_id"],
        title=row["title"],
        dimension=row["dimension"],
        difficulty=row["difficulty"],
        estimated_minutes=row["estimated_minutes"],
        instructions=row["instructions"],
        steps=json.loads(row["steps"]),
        fun_fact=row["fun_fact"],
        criteria=json.loads(row["criteria"])
    )
