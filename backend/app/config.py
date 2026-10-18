"""
App settings, loaded from environment variables (or a .env file).

CONCEPT: pydantic-settings
  A BaseSettings class reads each field from an env var with the same name
  (case-insensitive), validates the type, and raises a clear error at startup
  if something required is missing. This keeps secrets out of the code.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    mongodb_uri: str  # required: no default, so startup fails loudly if missing
    db_name: str = "food_ordering"

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    # Stored as a comma-separated string in .env, exposed as a list below.
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


# lru_cache makes this a singleton: the .env file is read once, not per request.
@lru_cache
def get_settings() -> Settings:
    return Settings()
