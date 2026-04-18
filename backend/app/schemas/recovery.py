from pydantic import BaseModel, ConfigDict
from typing import Optional


class RecoveryCreate(BaseModel):
    block_index: Optional[int] = 0
    exercise_index: Optional[int] = 0
    current_set: Optional[int] = 1
    is_resting: Optional[int] = 0
    rest_seconds: Optional[int] = 0


class RecoveryUpdate(BaseModel):
    block_index: Optional[int] = None
    exercise_index: Optional[int] = None
    current_set: Optional[int] = None
    is_resting: Optional[int] = None
    rest_seconds: Optional[int] = None


class RecoveryResponse(BaseModel):
    id: int
    profile_id: int
    block_index: int
    exercise_index: int
    current_set: int
    is_resting: int
    rest_seconds: int
    timestamp: int

    model_config = ConfigDict(from_attributes=True)