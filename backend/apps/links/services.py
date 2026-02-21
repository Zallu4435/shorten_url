"""
URLs Service Layer — The Core of the System

All business logic for URL shortening:
  - 6 layers of URL validation (format → DNS → HTTP → safety → slug → business rules)
  - URL creation with all options (privacy, expiry, click limits, dynamic rules, etc.)
  - Slug resolution (redirect logic with all 12 checks)
  - Update and delete with ownership enforcement
  - QR code generation
  - Duplicate detection
  - Password verification for private URLs
"""

import logging
import re
import socket
import threading
from datetime import datetime
from urllib.parse import urlparse, urlunparse

import bcrypt
import requests
import dns.resolver
from django.conf import settings
from django.utils import timezone

from apps.links import repository
from apps.links.models import ShortURL
from apps.links.utils import generate_unique_slug
from shared.constants import (
    ALLOWED_URL_SCHEMES,
    BLOCKED_HOSTNAMES,
    MAX_URL_LENGTH,
    SLUG_MIN_LENGTH,
    SLUG_MAX_LENGTH,
    RESERVED_SLUGS,
    URL_REACHABILITY_TIMEOUT_SECONDS,
    URL_MAX_REDIRECTS,
    URL_PASSWORD_MIN_LENGTH,
    WEBHOOK_TIMEOUT_SECONDS,
)
from shared.exceptions import (
    InvalidURLFormatError,
    URLTooLongError,
    BlockedURLError,
    DNSResolutionError,
    URLNotReachableError,
    URLFlaggedError,
    InvalidSlugError,
    ReservedSlugError,
    DuplicateSlugError,
    DuplicateURLError,
    ValidationError,
    URLNotFoundError,
    PermissionDeniedError,
    URLExpiredError,
    URLInactiveError,
    URLNotYetActiveError,
    ClickLimitReachedError,
    WrongPasswordError,
    SingleUseLinkError,
    RateLimitError,
    WeakPasswordError,
    CircularURLError,
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# LAYER 1: FORMAT VALIDATION
# ═══════════════════════════════════════════════════════════

def validate_url_format(url: str) -> str:
    """
    Validate and normalize the URL format.
    Returns the cleaned URL on success, raises on failure.

    Checks:
      - Not empty
      - Max length
      - Has valid scheme (http/https only)
      - Has a real domain (not just a scheme)
      - Not pointing to private/local IPs (SSRF protection)
      - Not pointing to blocked hostnames (localhost, etc.)
      - Normalize the URL
    """
    if not url or not url.strip():
        raise InvalidURLFormatError("URL cannot be empty.")

    url = url.strip()

    # Max length check
    if len(url) > MAX_URL_LENGTH:
        raise URLTooLongError(MAX_URL_LENGTH)

    # Parse the URL
    try:
        parsed = urlparse(url)
    except Exception:
        raise InvalidURLFormatError("Could not parse the URL. Please check the format.")

    # Scheme check
    if parsed.scheme not in ALLOWED_URL_SCHEMES:
        raise InvalidURLFormatError(
            f"URL must start with 'http://' or 'https://'. "
            f"Got: '{parsed.scheme}://' — scheme '{parsed.scheme}' is not allowed."
        )

    # Domain presence
    if not parsed.netloc:
        raise InvalidURLFormatError(
            "URL must include a valid domain (e.g. https://example.com/path)."
        )

    # Extract hostname (strip port if present)
    hostname = parsed.hostname
    if not hostname:
        raise InvalidURLFormatError("URL has an invalid or missing hostname.")

    # ── Circular Redirect Protection ───────────────────────
    # Block URLs that already point to this service to prevent recursion
    base_url_hostname = urlparse(settings.BASE_URL).hostname
    if base_url_hostname and hostname.lower() == base_url_hostname.lower():
        raise CircularURLError()

    # Blocked hostname check (localhost, local, etc.)
    if hostname.lower() in BLOCKED_HOSTNAMES:
        raise BlockedURLError(
            f"URLs pointing to '{hostname}' are not allowed for security reasons."
        )

    # Normalize: lowercase scheme and hostname
    normalized = urlunparse((
        parsed.scheme.lower(),
        parsed.netloc.lower(),
        parsed.path,
        parsed.params,
        parsed.query,
        parsed.fragment,
    ))

    return normalized


# ═══════════════════════════════════════════════════════════
# LAYER 2: DNS RESOLUTION CHECK
# ═══════════════════════════════════════════════════════════

def check_dns_resolution(url: str) -> None:
    """
    Verify the domain resolves via DNS.
    Uses a multi-step approach:
      1. Try dnspython (A then AAAA) for granular control.
      2. Fallback to socket.getaddrinfo (OS resolver) for maximum compatibility.
    Raises DNSResolutionError if domain cannot be resolved.
    """
    hostname = urlparse(url).hostname
    if not hostname:
        raise DNSResolutionError("Invalid hostname")

    # Step 1: Try dnspython (A record)
    try:
        dns.resolver.resolve(hostname, "A", lifetime=3)
        logger.debug(f"dnspython: A record resolved for {hostname}")
        return
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.exception.Timeout, dns.resolver.NoNameservers):
        pass

    # Step 2: Try dnspython (AAAA record)
    try:
        dns.resolver.resolve(hostname, "AAAA", lifetime=3)
        logger.debug(f"dnspython: AAAA record resolved for {hostname}")
        return
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.exception.Timeout, dns.resolver.NoNameservers):
        pass

    # Step 3: Fallback to socket.getaddrinfo (system resolver)
    # This is often more resilient as it respects the OS configuration and cache.
    try:
        socket.getaddrinfo(hostname, None)
        logger.debug(f"socket: resolved {hostname} via system resolver")
        return
    except socket.gaierror as e:
        logger.warning(f"DNS resolution failed for {hostname}: {e}")
        raise DNSResolutionError(hostname)
    except Exception as e:
        logger.error(f"Unexpected error resolving {hostname}: {e}")
        raise DNSResolutionError(hostname)


# ═══════════════════════════════════════════════════════════
# LAYER 3: HTTP REACHABILITY CHECK
# ═══════════════════════════════════════════════════════════

def check_url_reachability(url: str) -> int:
    """
    Send an HTTP request to verify the URL is reachable.
    Returns the final HTTP status code.
    Raises URLNotReachableError if the URL cannot be reached.

    Strategy:
      1. Try HEAD request (fast, low bandwidth)
      2. Fallback to GET if HEAD fails or returns 405
      3. Follow up to URL_MAX_REDIRECTS redirects
    """
    headers = {
        "User-Agent": "URLShortener/1.0 (Link Validator; +https://github.com/your/project)",
    }

    # Use a Session so we can cap max redirects correctly.
    # requests.head/get don't accept max_redirects as a kwarg — it must be set on the Session.
    session = requests.Session()
    session.max_redirects = URL_MAX_REDIRECTS

    try:
        response = session.head(
            url,
            headers=headers,
            allow_redirects=True,
            timeout=URL_REACHABILITY_TIMEOUT_SECONDS,
        )

        # Some servers don't support HEAD — fall back to GET
        if response.status_code in (405, 501):
            raise requests.exceptions.InvalidURL("HEAD not supported")

        logger.debug(f"URL reachable: {url} — status: {response.status_code}")
        return response.status_code

    except requests.TooManyRedirects:
        raise URLNotReachableError(
            f"Too many redirects (max {URL_MAX_REDIRECTS}). This usually indicates a redirect loop."
        )
    except requests.Timeout:
        raise URLNotReachableError(
            f"The server at {url} took too long to respond (timeout after {URL_REACHABILITY_TIMEOUT_SECONDS}s)."
        )
    except requests.exceptions.SSLError:
        raise URLNotReachableError(
            "SSL/TLS handshake failed. This typically means the site has an invalid or expired certificate."
        )
    except requests.exceptions.ConnectionError:
        raise URLNotReachableError(
            "Could not establish a connection to the server. Please check the domain name and your internet connection."
        )
    except Exception:
        # Fallback: Try GET request
        try:
            response = session.get(
                url,
                headers=headers,
                allow_redirects=True,
                timeout=URL_REACHABILITY_TIMEOUT_SECONDS,
                stream=True,   # Don't download the full body
            )
            
            # If we get a response but it's an error status
            if response.status_code >= 400:
                if response.status_code == 404:
                    msg = "The page was not found (404). Please verify the path is correct."
                elif response.status_code == 403:
                    msg = "Access was denied (403). The server is blocking automated requests."
                elif response.status_code >= 500:
                    msg = f"The destination server returned a server error ({response.status_code})."
                else:
                    msg = f"The destination server returned status code {response.status_code}."
                raise URLNotReachableError(msg)

            response.close()
            logger.debug(f"URL reachable (GET fallback): {url} — status: {response.status_code}")
            return response.status_code
        except (requests.Timeout, requests.exceptions.Timeout):
            raise URLNotReachableError("The destination server is too slow to respond (timed out).")
        except URLNotReachableError:
            raise
        except Exception as e:
            logger.warning(f"URL not reachable: {url} — {e}")
            raise URLNotReachableError(
                "This URL could not be verified. It might be down, private, or blocking our diagnostic tool."
            )


# ═══════════════════════════════════════════════════════════
# LAYER 4: SAFETY CHECK (Google Safe Browsing)
# ═══════════════════════════════════════════════════════════

def _normalize_url_for_safety(url: str) -> str:
    """
    Simplify the URL for the Safe Browsing API.
    - Remove fragments
    - Ensure a path exists (e.g., http://google.com becomes http://google.com/)
    """
    try:
        parsed = urlparse(url)
        # Safe Browsing doesn't need fragments
        path = parsed.path if parsed.path else "/"
        return urlunparse((
            parsed.scheme,
            parsed.netloc,
            path,
            parsed.params,
            parsed.query,
            None  # Remove fragment
        ))
    except Exception:
        return url

def check_url_safety(url: str) -> tuple:
    """
    Check the URL against Google Safe Browsing API v4.
    Returns (is_safe: bool, reason: str).

    If no API key is configured, skips the check and returns (True, "").
    Does NOT block on API failure — if the API is down, the URL is allowed.
    """
    api_key = getattr(settings, "GOOGLE_SAFE_BROWSING_API_KEY", "")
    if not api_key:
        logger.debug("Google Safe Browsing API key not configured — skipping safety check.")
        return True, ""

    # Normalize for API compatibility
    canonical_url = _normalize_url_for_safety(url)

    payload = {
        "client": {
            "clientId": "url-shortener-pro",
            "clientVersion": "2.0.0",
        },
        "threatInfo": {
            "threatTypes": [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": canonical_url}],
        },
    }

    try:
        api_url = f"{settings.GOOGLE_SAFE_BROWSING_URL}?key={api_key}"
        response = requests.post(api_url, json=payload, timeout=5)
        
        if response.status_code != 200:
            logger.warning(f"Google Safe Browsing API returned status {response.status_code}: {response.text}")
            return True, "" # Fail open

        data = response.json()

        if "matches" in data and data["matches"]:
            threat_type = data["matches"][0].get("threatType", "UNKNOWN_THREAT")
            logger.warning(f"URL flagged by Safe Browsing: {url} — {threat_type}")
            return False, threat_type

        return True, ""

    except Exception as e:
        logger.warning(f"Google Safe Browsing check failed (allowing URL): {e}")
        return True, ""  # Fail open


# ═══════════════════════════════════════════════════════════
# LAYER 5: SLUG VALIDATION
# ═══════════════════════════════════════════════════════════

def validate_custom_slug(slug: str) -> str:
    """
    Validate and normalize a user-provided custom alias.
    Returns the normalized slug on success.

    Checks:
      - Not empty
      - Length (3–50 chars)
      - Allowed characters only (a-z, 0-9, -, _)
      - Not a reserved word
      - Not already taken in DB
    """
    if not slug or not slug.strip():
        raise InvalidSlugError("Custom alias cannot be empty.")

    slug = slug.strip().lower()

    # Length
    if len(slug) < SLUG_MIN_LENGTH:
        raise InvalidSlugError(
            f"Alias is too short. Minimum {SLUG_MIN_LENGTH} characters required."
        )
    if len(slug) > SLUG_MAX_LENGTH:
        raise InvalidSlugError(
            f"Alias is too long. Maximum {SLUG_MAX_LENGTH} characters allowed."
        )

    # Character set: a-z, 0-9, -, _ only; must start and end with alphanumeric
    pattern = r"^[a-z0-9][a-z0-9_\-]*[a-z0-9]$|^[a-z0-9]{1}$"
    if not re.match(pattern, slug):
        raise InvalidSlugError(
            "Alias can only contain lowercase letters, digits, hyphens (-), and underscores (_). "
            "It must start and end with a letter or digit."
        )

    # Reserved words
    if slug in RESERVED_SLUGS:
        raise ReservedSlugError(slug)

    # Uniqueness check
    if repository.slug_exists(slug):
        raise DuplicateSlugError(slug)

    return slug


# ═══════════════════════════════════════════════════════════
# LAYER 6: BUSINESS RULES
# ═══════════════════════════════════════════════════════════

def apply_business_rules(
    user,
    original_url: str,
    expires_at: datetime = None,
    activates_at: datetime = None,
    max_clicks: int = None,
    password: str = None,
) -> None:
    """
    Enforce business-level rules that don't fit into other layers.

    Checks:
      - Rate limiting (URLs per hour/day)
      - Duplicate URL detection per user
      - Expiry date must be in the future
      - Activation date must be before expiry date
      - max_clicks must be positive
      - Private URL password strength
    """
    # Rate limiting (only for authenticated users)
    if user:
        _check_rate_limit(user)

    # Date logic
    now = timezone.now()

    if expires_at:
        if expires_at <= now:
            raise ValidationError("Expiration date must be in the future.")

    if activates_at:
        if activates_at <= now:
            raise ValidationError("Activation date must be in the future.")

        if expires_at and activates_at >= expires_at:
            raise ValidationError(
                "Activation date must be before the expiration date."
            )

    # Click limit
    if max_clicks is not None and max_clicks <= 0:
        raise ValidationError("Click limit must be a positive number.")

    # Password strength for private URLs
    if password:
        if len(password) < URL_PASSWORD_MIN_LENGTH:
            raise WeakPasswordError(
                f"URL password must be at least {URL_PASSWORD_MIN_LENGTH} characters long."
            )


def _check_rate_limit(user) -> None:
    """
    Check if the user has exceeded their URL creation rate limits.
    Raises RateLimitError if exceeded.
    """
    from datetime import timedelta

    max_per_hour = getattr(settings, "MAX_URLS_PER_HOUR", 50)
    max_per_day = getattr(settings, "MAX_URLS_PER_DAY", 200)

    one_hour_ago = timezone.now() - timedelta(hours=1)
    one_day_ago = timezone.now() - timedelta(days=1)

    hourly_count = ShortURL.objects.filter(
        user=user,
        created_at__gte=one_hour_ago,
    ).count()

    if hourly_count >= max_per_hour:
        raise RateLimitError(
            f"You've created {hourly_count} links in the past hour. "
            f"Limit is {max_per_hour}/hour. Please wait before creating more."
        )

    daily_count = ShortURL.objects.filter(
        user=user,
        created_at__gte=one_day_ago,
    ).count()

    if daily_count >= max_per_day:
        raise RateLimitError(
            f"You've reached today's limit of {max_per_day} links. Please try again tomorrow."
        )


# ═══════════════════════════════════════════════════════════
# MAIN: CREATE SHORT URL
# ═══════════════════════════════════════════════════════════

def create_short_url(
    original_url: str,
    user=None,
    slug: str = None,
    title: str = "",
    description: str = "",
    is_private: bool = False,
    password: str = None,
    is_single_use: bool = False,
    max_clicks: int = None,
    expires_at: datetime = None,
    activates_at: datetime = None,
    redirect_rules: list = None,
    webhook_url: str = "",
    qr_enabled: bool = False,
) -> ShortURL:
    """
    Full URL shortening pipeline — runs all 6 validation layers then creates.

    Args:
        original_url   : The long URL to shorten (required)
        user           : The authenticated user (None for anonymous)
        slug           : Custom alias (optional — auto-generated if not provided)
        title          : Optional label
        description    : Optional notes
        is_private     : Require password to access
        password       : Password for private links
        is_single_use  : One-time access link
        max_clicks     : Click limit
        expires_at     : Expiration datetime
        activates_at   : Scheduled activation datetime
        redirect_rules : JSON rules for dynamic redirects
        webhook_url    : URL to POST to on every click
        qr_enabled     : Whether the user wants a QR code for this link

    Returns:
        ShortURL instance

    Raises:
        Any of the validation exceptions from Layers 1–6
    """
    # ── Layer 1: Format ────────────────────────────────────
    original_url = validate_url_format(original_url)

    # ── Layer 2: DNS ───────────────────────────────────────
    check_dns_resolution(original_url)

    # ── Layer 3: HTTP Reachability ─────────────────────────
    try:
        status_code = check_url_reachability(original_url)
        is_reachable = True
    except URLNotReachableError:
        raise  # Re-raise — don't allow unreachable URLs

    # ── Layer 4: Safety ────────────────────────────────────
    is_safe, threat_reason = check_url_safety(original_url)
    if not is_safe:
        raise URLFlaggedError(threat_reason)

    # ── Layer 5: Slug ──────────────────────────────────────
    if slug:
        slug = validate_custom_slug(slug)
    else:
        slug = generate_unique_slug()

    # ── Layer 6: Business Rules ────────────────────────────
    apply_business_rules(
        user=user,
        original_url=original_url,
        expires_at=expires_at,
        activates_at=activates_at,
        max_clicks=max_clicks,
        password=password,
    )

    # ── Duplicate URL check ────────────────────────────────
    duplicate = repository.find_duplicate_url(user, original_url)
    if duplicate:
        raise DuplicateURLError(existing_slug=duplicate.slug)

    # ── Hash password ─────────────────────────────────────
    password_hash = ""
    if is_private and password:
        password_hash = _hash_url_password(password)
    elif is_private and not password:
        raise ValidationError("A password is required for private links.")

    # ── Generate single-use token ─────────────────────────
    import secrets
    token = secrets.token_urlsafe(32) if is_single_use else ""

    # ── Persist to DB ─────────────────────────────────────
    short_url = repository.create_short_url(
        slug=slug,
        original_url=original_url,
        user=user,
        title=title,
        description=description,
        is_private=is_private,
        password_hash=password_hash,
        is_single_use=is_single_use,
        token=token,
        max_clicks=max_clicks,
        expires_at=expires_at,
        activates_at=activates_at,
        redirect_rules=redirect_rules or [],
        webhook_url=webhook_url or "",
        is_url_reachable=is_reachable,
        url_status_code=status_code,
        qr_enabled=qr_enabled,
    )

    logger.info(f"Short URL created: /{slug} by user={getattr(user, 'email', 'anonymous')}")
    return short_url


# ═══════════════════════════════════════════════════════════
# RESOLVE SLUG (Redirect Logic — 12 steps)
# ═══════════════════════════════════════════════════════════

def resolve_slug(slug: str, password: str = None, request=None) -> dict:
    """
    Validate a slug for redirection. Runs all 12 redirect checks.
    Called by the redirect view (apps/urls/views.py) on every click.

    Args:
        slug     : The short URL identifier
        password : Password for private URLs (optional)
        request  : Django HTTP request (for device/IP detection)

    Returns:
        {
            "redirect_url": str,      — The final URL to redirect to
            "short_url": ShortURL,    — The ShortURL instance (for click logging)
            "requires_password": bool,
        }

    Raises:
        URLNotFoundError, URLInactiveError, URLExpiredError,
        URLNotYetActiveError, ClickLimitReachedError,
        PrivateLinkError, WrongPasswordError, SingleUseLinkError
    """
    # Step 1: Lookup
    short_url = repository.get_by_slug(slug)

    # Step 2: Active?
    if not short_url.is_active or short_url.is_flagged:
        raise URLInactiveError()

    # Step 2.1: Owner Active? (Dynamic check for soft-deleted accounts)
    if short_url.user and not short_url.user.is_active:
        logger.warning(f"Redirect blocked for /{slug}: Owner account is inactive.")
        raise URLInactiveError()

    # Step 3: Scheduled? (not yet active)
    if short_url.is_scheduled:
        raise URLNotYetActiveError(activates_at=short_url.activates_at)

    # Step 4: Expired?
    if short_url.is_expired:
        raise URLExpiredError()

    # Step 5: Click limit?
    if short_url.is_click_limit_reached:
        raise ClickLimitReachedError()

    # Step 6: Private link — password required?
    if short_url.is_private:
        if not password:
            return {
                "redirect_url": None,
                "short_url": short_url,
                "requires_password": True,
            }

        # Step 7: Verify password
        if not _verify_url_password(password, short_url.password_hash):
            raise WrongPasswordError()

    # Step 8: Single-use exhausted?
    if short_url.is_single_use_exhausted:
        raise SingleUseLinkError()

    # Step 9: Dynamic redirect rules
    redirect_url = _apply_redirect_rules(short_url, request)

    return {
        "redirect_url": redirect_url or short_url.original_url,
        "short_url": short_url,
        "requires_password": False,
    }


# ═══════════════════════════════════════════════════════════
# UPDATE / DELETE
# ═══════════════════════════════════════════════════════════

def update_short_url(url_id: str, user, **fields) -> ShortURL:
    """
    Update a ShortURL. Enforces ownership (admins can update any URL).
    Validates changed fields before updating.
    """
    # Fetch and verify ownership
    try:
        short_url = repository.get_by_id(url_id)
    except URLNotFoundError:
        raise

    if short_url.user_id and str(short_url.user_id) != str(user.id) and not user.is_admin:
        raise PermissionDeniedError("You can only edit your own short links.")

    # If original_url is being changed, run full validation
    if "original_url" in fields:
        original_url = fields["original_url"]
        if original_url != short_url.original_url:
            # Re-run Layer 1–4 validation
            original_url = validate_url_format(original_url)
            check_dns_resolution(original_url)
            try:
                check_url_reachability(original_url)
            except URLNotReachableError:
                raise
            is_safe, threat_reason = check_url_safety(original_url)
            if not is_safe:
                raise URLFlaggedError(threat_reason)
            
            fields["original_url"] = original_url

    # If slug is being changed, validate it
    if "slug" in fields:
        new_slug = fields["slug"]
        if new_slug != short_url.slug:
            # Validate format
            new_slug = validate_custom_slug_format(new_slug)
            
            # Uniqueness check (excluding this URL)
            if repository.slug_exists(new_slug):
                raise DuplicateSlugError(new_slug)
            
            fields["slug"] = new_slug

    # If password is being changed, rehash
    if "password" in fields:
        new_password = fields.pop("password")
        if new_password:
            fields["password_hash"] = _hash_url_password(new_password)
        else:
            fields["password_hash"] = ""

    # Re-validate expiry/activation if provided
    if "expires_at" in fields or "activates_at" in fields:
        expires_at = fields.get("expires_at", short_url.expires_at)
        activates_at = fields.get("activates_at", short_url.activates_at)
        apply_business_rules(
            user=user,
            original_url=short_url.original_url,
            expires_at=expires_at,
            activates_at=activates_at,
        )

    return repository.update_short_url(url_id, **fields)


def validate_custom_slug_format(slug: str) -> str:
    """
    Validate and normalize a user-provided custom alias (format only).
    """
    if not slug or not slug.strip():
        raise InvalidSlugError("Custom alias cannot be empty.")

    slug = slug.strip().lower()

    if len(slug) < SLUG_MIN_LENGTH:
        raise InvalidSlugError(
            f"Alias is too short. Minimum {SLUG_MIN_LENGTH} characters required."
        )
    if len(slug) > SLUG_MAX_LENGTH:
        raise InvalidSlugError(
            f"Alias is too long. Maximum {SLUG_MAX_LENGTH} characters allowed."
        )

    pattern = r"^[a-z0-9][a-z0-9_\-]*[a-z0-9]$|^[a-z0-9]{1}$"
    if not re.match(pattern, slug):
        raise InvalidSlugError(
            "Alias can only contain lowercase letters, digits, hyphens (-), and underscores (_). "
            "It must start and end with a letter or digit."
        )

    if slug in RESERVED_SLUGS:
        raise ReservedSlugError(slug)

    return slug


def delete_short_url(url_id: str, user) -> bool:
    """
    Delete a ShortURL. Enforces ownership.
    """
    try:
        short_url = repository.get_by_id(url_id)
    except URLNotFoundError:
        raise

    if short_url.user_id and str(short_url.user_id) != str(user.id) and not user.is_admin:
        raise PermissionDeniedError("You can only delete your own short links.")

    return repository.delete_short_url(url_id)


# ═══════════════════════════════════════════════════════════
# INTERNAL HELPERS
# ═══════════════════════════════════════════════════════════

def _hash_url_password(password: str) -> str:
    """Hash a URL password using bcrypt."""
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def _verify_url_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False




def _apply_redirect_rules(short_url: ShortURL, request) -> str | None:
    """
    Evaluate the dynamic redirect_rules JSON and return the matching target URL.
    Returns None if no rule matches (falls back to original_url).

    Rules format:
        [
            {"condition": "device=mobile", "target_url": "https://m.example.com"},
            {"condition": "country=US",    "target_url": "https://us.example.com"},
            {"condition": "hour>=9",       "target_url": "https://business.example.com"},
        ]
    """
    if not short_url.redirect_rules or not request:
        return None

    device_type = _detect_device_type(request)
    current_hour = timezone.now().hour

    for rule in short_url.redirect_rules:
        condition = rule.get("condition", "")
        target_url = rule.get("target_url", "")

        if not condition or not target_url:
            continue

        if _evaluate_condition(condition, device_type, current_hour, request):
            logger.debug(f"Dynamic redirect rule matched: '{condition}' → {target_url}")
            return target_url

    return None


def _evaluate_condition(condition: str, device_type: str, hour: int, request) -> bool:
    """
    Evaluate a single redirect rule condition string.
    Supports: device=mobile|desktop|tablet, hour>=N, hour<=N, country=XX
    """
    condition = condition.strip().lower()

    # Device match: device=mobile
    device_match = re.match(r"device=(\w+)", condition)
    if device_match:
        return device_type == device_match.group(1).lower()

    # Hour >= : hour>=9
    hour_gte_match = re.match(r"hour>=(\d+)", condition)
    if hour_gte_match:
        return hour >= int(hour_gte_match.group(1))

    # Hour <= : hour<=17
    hour_lte_match = re.match(r"hour<=(\d+)", condition)
    if hour_lte_match:
        return hour <= int(hour_lte_match.group(1))

    return False


def _detect_device_type(request) -> str:
    """Detect device type from User-Agent header."""
    try:
        from user_agents import parse
        ua_string = request.META.get("HTTP_USER_AGENT", "")
        ua = parse(ua_string)
        if ua.is_mobile:
            return "mobile"
        if ua.is_tablet:
            return "tablet"
        if ua.is_bot:
            return "bot"
        return "desktop"
    except Exception:
        return "unknown"


def fire_webhook(webhook_url: str, payload: dict) -> None:
    """
    Fire a webhook POST request to the configured URL.
    Non-blocking — run in a background thread.
    Silently fails if the webhook endpoint is down.
    """
    def _send():
        try:
            requests.post(
                webhook_url,
                json=payload,
                timeout=WEBHOOK_TIMEOUT_SECONDS,
            )
            logger.debug(f"Webhook fired: {webhook_url}")
        except Exception as e:
            logger.warning(f"Webhook failed for {webhook_url}: {e}")

    threading.Thread(target=_send, daemon=True).start()
