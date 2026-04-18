from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
import json


# Session Schemas
class SessionCreate(BaseModel):
    day_id: Optional[int] = None
    date: str  # YYYY-MM-DD


class SessionUpdate(BaseModel):
    total_duration: Optional[int] = None
    is_completed: Optional[int] = None


class SessionResponse(BaseModel):
    id: int
    profile_id: int
    day_id: Optional[int] = None
    date: str
    timestamp: int
    total_duration: Optional[int] = 0
    is_completed: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Exercise Result Schemas
class ExerciseResultCreate(BaseModel):
    exercise_name: str
    set_number: int
    actual_reps: Optional[int] = None
    actual_weight: Optional[str] = None
    feeling: Optional[str] = None  # easy, good, hard, failed
    duration: Optional[int] = None


class ExerciseResultResponse(BaseModel):
    id: int
    session_id: int
    exercise_name: str
    set_number: int
    actual_reps: Optional[int] = None
    actual_weight: Optional[str] = None
    feeling: Optional[str] = None
    duration: Optional[int] = None
    timestamp: int

    model_config = ConfigDict(from_attributes=True)


# Combined schemas for responses
class SessionWithResults(BaseModel):
    id: int
    profile_id: int
    day_id: Optional[int] = None
    date: str
    timestamp: int
    total_duration: Optional[int] = 0
    is_completed: int
    created_at: Optional[datetime] = None
    exercise_results: List[ExerciseResultResponse] = []

    model_config = ConfigDict(from_attributes=True)