from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import init_db
from .seed_data import seed_database
from .routers import health, shapes, lessons, history, three_d

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed initial lessons/shapes
    init_db()
    seed_database()
    yield

app = FastAPI(
    title="Simple AI Camera Geometry API",
    description="Backend service providing geometry learning metadata, lessons, shapes reference, and learning history for child learners.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(shapes.router)
app.include_router(lessons.router)
app.include_router(history.router)
app.include_router(three_d.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
