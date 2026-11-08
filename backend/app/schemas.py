from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ShapeResponse(BaseModel):
    id: str
    name: str
    dimension: str
    description: str
    properties: Dict[str, Any]
    tips: List[str]
    difficulty: str
    icon_name: str

class LessonResponse(BaseModel):
    id: str
    shape_id: str
    title: str
    dimension: str
    difficulty: str
    estimated_minutes: int
    instructions: str
    steps: List[str]
    fun_fact: str
    criteria: List[str]

class HistoryCreate(BaseModel):
    shape_name: str = Field(..., min_length=1, max_length=100)
    recognized_shape: str = Field(..., min_length=1, max_length=100)
    similarity_score: float = Field(..., ge=0.0, le=100.0)
    status: str = Field(..., pattern="^(success|partial|unknown)$")
    characteristics: Dict[str, Any]
    feedback: str = ""
    duration_seconds: int = Field(default=0, ge=0)
    thumbnail_data: Optional[str] = ""

class HistoryResponse(BaseModel):
    id: int
    shape_name: str
    recognized_shape: str
    similarity_score: float
    status: str
    characteristics: Dict[str, Any]
    feedback: str
    duration_seconds: int
    thumbnail_data: Optional[str]
    created_at: str

class HealthResponse(BaseModel):
    status: str
    service: str
    database: str
    shapes_count: int
    lessons_count: int
    history_count: int
