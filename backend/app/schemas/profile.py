from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
import json

from app.constants.profile_avatars import PROFILE_AVATAR_PRESETS


def parse_days(days_val):
    """Parse days from string to list."""
    if days_val is None:
        return [0, 1, 2, 3, 4, 5, 6]
    if isinstance(days_val, list):
        return days_val
    if isinstance(days_val, str):
        try:
            return json.loads(days_val)
        except:
            return [0, 1, 2, 3, 4, 5, 6]
    return [0, 1, 2, 3, 4, 5, 6]


class ProfileCreate(BaseModel):
    name: str
    image: Optional[str] = None
    days: Optional[List[int]] = [0, 1, 2, 3, 4, 5, 6]

    @field_validator('image')
    @classmethod
    def validate_image(cls, v):
        if v is None:
            return v
        if v not in PROFILE_AVATAR_PRESETS:
            raise ValueError('Invalid profile image')
        return v


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    days: Optional[List[int]] = None

    @field_validator('image')
    @classmethod
    def validate_image(cls, v):
        if v is None:
            return v
        if v not in PROFILE_AVATAR_PRESETS:
            raise ValueError('Invalid profile image')
        return v


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    name: str
    image: Optional[str] = None
    email: Optional[str] = None
    days: List[int]
    is_active: Optional[int] = 1
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator('days', mode='before')
    @classmethod
    def validate_days(cls, v):
        return parse_days(v)
