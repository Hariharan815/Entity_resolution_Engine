from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import audit, auth, export, feedback, resolve, results, sessions, stats, upload
from app.db.connection import test_connection
from app.db.schema import create_all_tables

app = FastAPI(title="INFYNDTASK Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(resolve.router)
app.include_router(results.router)
app.include_router(feedback.router)
app.include_router(export.router)
app.include_router(audit.router)
app.include_router(stats.router)
app.include_router(auth.router, prefix="/auth")
app.include_router(sessions.router)


@app.on_event("startup")
def startup_event() -> None:
    try:
        create_all_tables()
    except Exception as exc:
        print(f"Warning: table initialization failed: {exc}")

    if not test_connection():
        print("Warning: Database unavailable. Check MySQL connection settings in .env")


@app.get("/")
def root() -> dict:
    return {
        "message": "INFYNDTASK backend is running",
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
