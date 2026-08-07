from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./kovacevic.db"
    secret_key: str = "dev-secret-key-change-in-production"
    allowed_origins: list[str] = ["http://localhost:3000"]
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 20

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
