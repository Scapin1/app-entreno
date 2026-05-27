from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "GymTracker API"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    # Comma-separated list of origins (e.g. "https://a.com,https://b.com")
    # Kept as string to avoid pydantic-settings JSON parsing differences across versions.
    CORS_ORIGINS: str = ""
    
    # Database
    DATABASE_URL: str = ""
    
    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    AUTO_INIT_DB: bool = False

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
