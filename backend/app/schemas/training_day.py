from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List, Any
import json


class DayCreate(BaseModel):
    day_number: int
    title: str
    type: Optional[str] = None
    focus: Optional[str] = None
    implements: Optional[List[str]] = None
    blocks: Optional[List[dict]] = None  # Stored as JSON
    routine_id: Optional[int] = None


class DayUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    focus: Optional[str] = None
    implements: Optional[List[str]] = None
    blocks: Optional[List[dict]] = None
    is_active: Optional[int] = None
    routine_id: Optional[int] = None


class DayResponse(BaseModel):
    id: int
    profile_id: int
    day_number: int
    title: str
    type: Optional[str] = None
    focus: Optional[str] = None
    implements: Optional[List[str]] = None
    blocks: Optional[List[Any]] = None
    is_active: Optional[int] = 1

    model_config = ConfigDict(from_attributes=True)

    @field_validator('implements', mode='before')
    @classmethod
    def parse_implements(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return None
        return None

    @field_validator('blocks', mode='before')
    @classmethod
    def parse_blocks(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return None
        return None