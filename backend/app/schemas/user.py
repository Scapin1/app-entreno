from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
