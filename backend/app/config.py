from typing import Annotated, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict, NoDecode
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "GymTracker API"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    CORS_ORIGINS: Annotated[List[str], NoDecode] = []
    
    # Database
    DATABASE_URL: str = ""
    
    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    AUTO_INIT_DB: bool = False

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if value is None or value == "":
            return []
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache()
def get_settings() -> Settings:
    return Settings()
