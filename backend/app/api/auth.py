from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from passlib.hash import bcrypt

from app.db.connection import get_connection
from app.db.service import get_user_by_email, insert_user
from app.models.schemas import LoginRequest, SignUpRequest

router = APIRouter(tags=["auth"])
DB_UNAVAILABLE = "Database unavailable. Check MySQL connection settings in .env"


def _initials(name: str) -> str:
    parts = [p for p in (name or "").split() if p]
    return "".join(p[0].upper() for p in parts)[:3]


@router.post("/signup")
def signup(payload: SignUpRequest) -> Dict[str, Any]:
    conn = None
    try:
        conn = get_connection()
        hashed = bcrypt.hash(payload.password)
        insert_user(conn, payload.name, payload.email, hashed)
        return {
            "success": True,
            "user": {
                "name": payload.name,
                "email": payload.email,
                "plan": "Free",
                "initials": _initials(payload.name),
            },
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()


@router.post("/login")
def login(payload: LoginRequest) -> Dict[str, Any]:
    conn = None
    try:
        conn = get_connection()
        user = get_user_by_email(conn, payload.email)
        if not user or not bcrypt.verify(payload.password, user.get("password_hash") or ""):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return {
            "success": True,
            "user": {
                "name": user.get("name"),
                "email": user.get("email"),
                "plan": user.get("plan", "Free"),
                "initials": _initials(user.get("name", "")),
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=DB_UNAVAILABLE) from exc
    finally:
        if conn is not None:
            conn.close()
