from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ResolveRequest(BaseModel):
    upload_id: Optional[str] = None
    rows: List[Dict[str, Any]] = Field(default_factory=list)


class FeedbackRequest(BaseModel):
    group_id: str
    upload_id: str
    decision: str
    notes: Optional[str] = ""
    reviewer: str = "unknown"
    timestamp: Optional[datetime] = None


class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UploadResponse(BaseModel):
    filename: str
    total_records: int
    rows: List[Dict[str, Any]] = Field(default_factory=list)


class StatsResponse(BaseModel):
    total_records: int = 0
    accuracy: float = 0.0
    duplicates: int = 0
    conflicts: int = 0
