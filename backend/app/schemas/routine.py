from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime

from app.schemas.training_day import DayResponse


class RoutineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class RoutineUpdate(BaseModel):
    name: Optional[str] = None


class RoutineResponse(BaseModel):
    id: int
    profile_id: int
    name: str
    is_active: Optional[int] = 1
    is_selected: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    training_days: Optional[List[DayResponse]] = None

    model_config = ConfigDict(from_attributes=True)
