from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    # Supabase (or any Postgres) connection string, e.g.
    # postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:5432/postgres
    database_url: str

    secret_key: str = "dev-secret-change-me"
    access_token_minutes: int = 60 * 12

    # Not used by the app yet — kept for future Supabase Storage/Auth API calls,
    # as opposed to database_url which is the direct Postgres connection we use today.
    supabase_url: str = ""
    supabase_secret_key: str = ""

    cors_origins: str = "http://localhost:5500,http://127.0.0.1:5500,null"

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    cloudinary_folder: str = "sai_kumar_studio"

    # Cloudflare R2 (replacing Cloudinary as the image store)
    r2_account_id: str = ""
    r2_access_key: str = ""
    r2_secret_key: str = ""
    r2_bucket: str = ""
    r2_public_base_url: str = ""  # e.g. https://pub-xxxx.r2.dev or a bound custom domain, no trailing slash

    admin_email: str = "owner@saikumarstudio.in"
    admin_password: str = "ChangeMe@2026"
    admin_name: str = "Studio Owner"

    # Razorpay — falls back to a built-in mock mode (no real charges) while these are unset.
    razorpay_key_id: str = "rzp_test_placeholder"
    razorpay_key_secret: str = "rzp_secret_placeholder"
    razorpay_webhook_secret: str = "whsec_placeholder"

    # SMTP — OTP codes are returned in the API response (debug_otp) while this is unconfigured.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Sai Kumar Studio"
    smtp_use_tls: bool = True

    debug_otp: bool = True
    refresh_token_days: int = 14

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def cloudinary_configured(self) -> bool:
        return bool(self.cloudinary_cloud_name and self.cloudinary_api_key and self.cloudinary_api_secret)

    @property
    def r2_configured(self) -> bool:
        return bool(
            self.r2_account_id
            and self.r2_access_key
            and self.r2_secret_key
            and self.r2_bucket
            and self.r2_public_base_url
        )

    @property
    def razorpay_mock(self) -> bool:
        return self.razorpay_key_id in ("", "rzp_test_placeholder")

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password and self.smtp_from_email)


@lru_cache
def get_settings() -> Settings:
    return Settings()
