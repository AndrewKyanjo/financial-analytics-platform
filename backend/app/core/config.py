from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Real-Time Financial Analytics Platform"
    api_prefix: str = "/api"
    database_url: str = Field(
        default="postgresql+psycopg2://fin_app_user@localhost:5432/financial_analytics",
        alias="DATABASE_URL",
    )
    jwt_secret_key: str = Field(
        default="change-me-in-env",
        alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        alias="CORS_ORIGINS",
    )
    forecast_model_version: str = "poly2-v1"
    forecast_polynomial_degree: int = 2
    default_forecast_horizon: int = 7
    kpi_push_interval_seconds: int = 5

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
