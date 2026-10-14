from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Application Tracker CRM"
    database_url: str = "sqlite:///./app.db"
    secret_key: str = "dev-only-secret-key-change-me-in-production-0123456789"
    access_token_expire_minutes: int = 30
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
