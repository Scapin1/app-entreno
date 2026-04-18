from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class WeightCreate(BaseModel):
    weight: str  # Stored as string to handle decimals
    date: str  # YYYY-MM-DD


class WeightResponse(BaseModel):
    id: int
    profile_id: int
    weight: str
    date: str
    timestamp: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
