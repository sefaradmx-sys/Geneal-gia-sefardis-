from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://lmc:lmc@localhost:5432/lmc"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "cambia-esto-en-produccion-la-mv-census"
    jwt_ttl_minutes: int = 720
    bootstrap_admin_user: str = "admin"
    bootstrap_admin_password: str = ""
    bootstrap_admin_email: str = "admin@localhost"
    demo_seed: bool = True
    cors_origins: str = "http://localhost:3000"
    youtube_api_key: str = ""
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "la-mv-census/0.1"
    x_bearer_token: str = ""
    collect_rss: bool = False
    rss_feeds: str = ""
    web_daily_cap: int = 200
    web_delay_seconds: float = 2.0
    user_agent: str = "LA-MV-Census/0.1 (uso interno; contacto admin@localhost)"

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def rss_feed_list(self) -> list[str]:
        return [item.strip() for item in self.rss_feeds.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
