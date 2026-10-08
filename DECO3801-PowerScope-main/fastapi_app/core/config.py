from urllib.parse import quote_plus
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AliasChoices, computed_field

class Settings(BaseSettings):
    # Reading from project root .env file
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] /".env"),
        case_sensitive=False,
        extra="ignore"
    )

    
    db_dsn: str | None = Field(default=None, validation_alias=AliasChoices("DB_DSN"))

    db_host: str = Field(
        "timescaledb",
        validation_alias=AliasChoices("DB_HOST", "POSTGRES_HOST", "postgres_host"),
    )
    db_port: int = Field(
        5432,
        validation_alias=AliasChoices("DB_PORT", "POSTGRES_PORT", "postgres_port"),
    )
    db_name: str = Field(
        "energy_db",
        validation_alias=AliasChoices("DB_NAME", "POSTGRES_DB", "postgres_db"),
    )
    db_user: str = Field(
        "postgres",
        validation_alias=AliasChoices("DB_USER", "POSTGRES_USER", "postgres_user"),
    )
    db_password: str = Field(
        "",
        validation_alias=AliasChoices("DB_PASSWORD", "POSTGRES_PASSWORD", "postgres_password"),
    )

    db_pool_size: int = Field(10, validation_alias=AliasChoices("DB_POOL_SIZE"))
    db_max_overflow: int = Field(20, validation_alias=AliasChoices("DB_MAX_OVERFLOW"))
    allowed_origins: str = Field("", validation_alias=AliasChoices("ALLOWED_ORIGINS"))

settings = Settings()