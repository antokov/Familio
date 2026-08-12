from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./kovacevic.db"
    secret_key: str = "dev-secret-key-change-in-production"
    allowed_origins: list[str] = ["http://localhost:3000"]
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 20
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-5"
    ntfy_url: str | None = None
    ntfy_topic: str = "familio-events"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
