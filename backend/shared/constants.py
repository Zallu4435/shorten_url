"""
Shared Constants
All application-wide constants in one place.
"""

# ─────────────────────────────────────────────
# Slug Configuration
# ─────────────────────────────────────────────

SLUG_MIN_LENGTH = 3
SLUG_MAX_LENGTH = 50

# Characters allowed in slugs: lowercase letters, digits, hyphen, underscore
SLUG_ALLOWED_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789-_"

# Auto-generated slug length (when user doesn't provide a custom alias)
SLUG_AUTO_LENGTH = 7

# ─────────────────────────────────────────────
# Reserved Slugs — these cannot be used as short URL aliases
# ─────────────────────────────────────────────
RESERVED_SLUGS = frozenset([
    # System routes
    "api", "graphql", "admin", "static", "media", "health", "ping",
    "favicon", "robots", "sitemap", "manifest",

    # Auth routes
    "login", "logout", "register", "signup", "signin", "auth",
    "token", "refresh", "verify", "reset", "password", "forgot",
    "oauth", "callback", "authorize",

    # App routes
    "dashboard", "analytics", "settings", "profile", "account",
    "me", "user", "users", "url", "urls", "link", "links",
    "short", "shorten", "redirect", "r",

    # Admin routes
    "admin-panel", "moderation", "ban", "report", "flag",

    # Content pages
    "about", "contact", "help", "support", "faq", "terms",
    "privacy", "legal", "blog", "pricing", "home",

    # Common words that could cause confusion
    "null", "none", "undefined", "true", "false", "new",
    "create", "edit", "update", "delete", "remove",
])

# ─────────────────────────────────────────────
# URL Validation
# ─────────────────────────────────────────────

# Allowed URL schemes — only HTTP and HTTPS
ALLOWED_URL_SCHEMES = frozenset(["http", "https"])

# Maximum length of the original URL (characters)
MAX_URL_LENGTH = 2048

# HTTP check settings
URL_REACHABILITY_TIMEOUT_SECONDS = 5
URL_MAX_REDIRECTS = 5

# Private/reserved IP ranges — blocked for SSRF protection
BLOCKED_IP_PATTERNS = [
    "127.",        # Loopback
    "0.",          # This network
    "10.",         # Private Class A
    "172.16.",     # Private Class B (start)
    "172.17.",
    "172.18.",
    "172.19.",
    "172.20.",
    "172.21.",
    "172.22.",
    "172.23.",
    "172.24.",
    "172.25.",
    "172.26.",
    "172.27.",
    "172.28.",
    "172.29.",
    "172.30.",
    "172.31.",    # Private Class B (end)
    "192.168.",   # Private Class C
    "169.254.",   # Link-local
    "::1",        # IPv6 loopback
    "fc",         # IPv6 private (ULA)
    "fd",         # IPv6 private (ULA)
]

BLOCKED_HOSTNAMES = frozenset([
    "localhost",
    "localhost.localdomain",
    "broadcasthost",
    "local",
    "internal",
    "intranet",
    "corp",
    "home",
    "lan",
])

# ─────────────────────────────────────────────
# JWT Token Configuration
# ─────────────────────────────────────────────

# These match the settings.py env values — used for reference in services
JWT_ACCESS_TOKEN_EXPIRY_MINUTES = 15
JWT_REFRESH_TOKEN_EXPIRY_DAYS = 7
JWT_ALGORITHM = "HS256"

# ─────────────────────────────────────────────
# Password Requirements
# ─────────────────────────────────────────────

# User account password minimums
USER_PASSWORD_MIN_LENGTH = 8

# Private URL password minimums (shorter is fine for URLs)
URL_PASSWORD_MIN_LENGTH = 4

# ─────────────────────────────────────────────
# Rate Limiting Defaults
# ─────────────────────────────────────────────

DEFAULT_MAX_URLS_PER_HOUR = 50
DEFAULT_MAX_URLS_PER_DAY = 200

# ─────────────────────────────────────────────
# Analytics
# ─────────────────────────────────────────────

DEVICE_TYPES = ["mobile", "tablet", "desktop", "bot", "unknown"]

UNKNOWN_VALUE = "unknown"

# ─────────────────────────────────────────────
# QR Code
# ─────────────────────────────────────────────

QR_CODE_BOX_SIZE = 20        # 20px per module → ~600px output at version 1 (print-safe)
QR_CODE_BORDER = 4           # 4-module quiet zone (ISO/IEC 18004 minimum)
QR_CODE_ERROR_CORRECTION = "H"  # H=30% error correction — professional standard for printed QR codes

# ─────────────────────────────────────────────
# Pagination
# ─────────────────────────────────────────────

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# ─────────────────────────────────────────────
# Webhook
# ─────────────────────────────────────────────

WEBHOOK_TIMEOUT_SECONDS = 5
WEBHOOK_MAX_RETRIES = 3
