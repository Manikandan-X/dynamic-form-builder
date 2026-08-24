from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str
    app_version: str
    debug: bool = False

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    redis_url: str

    celery_broker_url: str
    celery_result_backend: str

    # Comma-separated list of allowed frontend origins, e.g.
    # "http://localhost:5173,http://localhost:4173"
    cors_origins: str = "http://localhost:5173"

    # -----------------------------------------------------
    # File upload settings
    # -----------------------------------------------------

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 10

    # Comma-separated list of allowed file extensions
    # (no dots, lowercase)
    allowed_upload_extensions: str = (
        "pdf,doc,docx,xls,xlsx,csv,txt,"
        "png,jpg,jpeg,gif,webp,zip"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def cors_allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_upload_extensions_list(self) -> list[str]:
        return [ext.strip().lower() for ext in self.allowed_upload_extensions.split(",") if ext.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


settings = Settings()
