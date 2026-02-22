"""
URL Shortener — Django Settings
Configured for:
  - Neon PostgreSQL (via DATABASE_URL)
  - JWT Authentication (custom implementation)
  - GraphQL via Graphene-Django
  - CORS for Next.js frontend
"""

import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

# ─────────────────────────────────────────────
# Base Directory & Environment
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

# ─────────────────────────────────────────────
# Security
# ─────────────────────────────────────────────
SECRET_KEY = os.environ.get("SECRET_KEY", "unsafe-default-key-change-in-production")
DEBUG = os.environ.get("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",")

# ─────────────────────────────────────────────
# Installed Applications
# ─────────────────────────────────────────────
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "graphene_django",
    "corsheaders",
]

LOCAL_APPS = [
    "apps.users",
    "apps.links",
    "apps.analytics",
    "apps.admin_panel",
    "apps.ai_integration",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ─────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",       # Must be first
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Static files
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "shared.middlewares.JWTCookieMiddleware",
]

# ─────────────────────────────────────────────
# URL Configuration
# ─────────────────────────────────────────────
ROOT_URLCONF = "config.urls"

# ─────────────────────────────────────────────
# Templates
# ─────────────────────────────────────────────
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ─────────────────────────────────────────────
# WSGI / ASGI
# ─────────────────────────────────────────────
WSGI_APPLICATION = "config.wsgi.application"

# ─────────────────────────────────────────────
# Database — Neon PostgreSQL
# ─────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL", "")

DATABASES = {
    "default": dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,          # Keep connection alive for 10 minutes
        conn_health_checks=True,   # Health check on reuse
        ssl_require=True,          # Neon requires SSL
    )
}

# ─────────────────────────────────────────────
# Custom User Model
# ─────────────────────────────────────────────
AUTH_USER_MODEL = "users.CustomUser"

# ─────────────────────────────────────────────
# Password Validation
# ─────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─────────────────────────────────────────────
# Internationalization
# ─────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ─────────────────────────────────────────────
# Static & Media Files
# ─────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# QR Code Storage
QR_CODE_STORAGE_PATH = os.environ.get("QR_CODE_STORAGE_PATH", "media/qr_codes/")

# ─────────────────────────────────────────────
# Default Primary Key
# ─────────────────────────────────────────────
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─────────────────────────────────────────────
# CORS — Allow Next.js Frontend
# ─────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000"
).split(",")

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# ─────────────────────────────────────────────
# GraphQL — Graphene-Django
# ─────────────────────────────────────────────
GRAPHENE = {
    "SCHEMA": "schema.schema",                  # Root schema location
    "MIDDLEWARE": [
        "shared.middlewares.JWTAuthMiddleware",  # Inject user into context
    ],
}

# ─────────────────────────────────────────────
# JWT Configuration
# ─────────────────────────────────────────────
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "unsafe-jwt-key-change-in-production")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRY_MINUTES = int(
    os.environ.get("JWT_ACCESS_TOKEN_EXPIRY_MINUTES", 15)
)
JWT_REFRESH_TOKEN_EXPIRY_DAYS = int(
    os.environ.get("JWT_REFRESH_TOKEN_EXPIRY_DAYS", 7)
)

# ─────────────────────────────────────────────
# URL Safety — Google Safe Browsing
# ─────────────────────────────────────────────
GOOGLE_SAFE_BROWSING_API_KEY = os.environ.get("GOOGLE_SAFE_BROWSING_API_KEY", "")
GOOGLE_SAFE_BROWSING_URL = (
    "https://safebrowsing.googleapis.com/v4/threatMatches:find"
)

# ─────────────────────────────────────────────
# AI Integration — Google Gemini
# Get your key: https://aistudio.google.com/app/apikey
# ─────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")

# ─────────────────────────────────────────────
# GeoIP2 — MaxMind GeoLite2 City Database
# ─────────────────────────────────────────────
# Download: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
# Set GEOIP2_DATABASE_PATH=/absolute/path/to/GeoLite2-City.mmdb
GEOIP2_DATABASE_PATH = os.environ.get("GEOIP2_DATABASE_PATH", "")

# If path is relative, resolve it against BASE_DIR
if GEOIP2_DATABASE_PATH and not os.path.isabs(GEOIP2_DATABASE_PATH):
    GEOIP2_DATABASE_PATH = str(BASE_DIR / GEOIP2_DATABASE_PATH)

# ─────────────────────────────────────────────
# Application URLs
# ─────────────────────────────────────────────
BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# ─────────────────────────────────────────────
# Rate Limiting
# ─────────────────────────────────────────────
MAX_URLS_PER_HOUR = int(os.environ.get("MAX_URLS_PER_HOUR", 50))
MAX_URLS_PER_DAY = int(os.environ.get("MAX_URLS_PER_DAY", 200))

# CSRF — Trusted Origins for Cookies
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# Secure Cookie Settings
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

# In production, use Secure cookies and security headers
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # HTTPS / SSL
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    
    # HSTS (Strict-Transport-Security)
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Browser features
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name}: {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}
