"""
Users Service Layer
All business logic for user authentication and token management.

Responsibilities:
  - Validate registration inputs
  - Hash & verify passwords
  - Generate JWT access + refresh tokens
  - Validate and rotate refresh tokens
  - Enforce business rules (password strength, email format, etc.)
"""

import hashlib
import logging
import secrets
import re
from datetime import timedelta

import jwt
from django.conf import settings
from django.utils import timezone

from apps.users import repository
from apps.users.models import CustomUser
from shared.exceptions import (
    AuthenticationError,
    ValidationError,
    WeakPasswordError,
    InvalidTokenError,
    RefreshTokenExpiredError,
    RefreshTokenRevokedError,
    DuplicateEmailError,
    ConflictError,
)
from shared.constants import USER_PASSWORD_MIN_LENGTH

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Registration
# ─────────────────────────────────────────────

def register_user(email: str, username: str, password: str) -> dict:
    """
    Register a new user account.

    Steps:
      1. Validate inputs (email format, username, password strength)
      2. Check for duplicates
      3. Create user in DB
      4. Generate access + refresh tokens
      5. Return user + tokens

    Returns:
        {
            "user": CustomUser,
            "access_token": str,
            "refresh_token": str,
        }
    """
    # Validate
    _validate_email(email)
    _validate_username(username)
    _validate_password(password)

    # Check for existing email (provides a cleaner error than DB constraint)
    if repository.email_exists(email):
        raise DuplicateEmailError()

    if repository.username_exists(username):
        raise ConflictError(
            f"The username '{username}' is already taken. Please choose another."
        )

    # Create user (password hashing handled by Django's AbstractBaseUser)
    user = repository.create_user(
        email=email,
        username=username,
        password=password,
    )

    # Issue tokens
    access_token = generate_access_token(user)
    refresh_token = generate_and_store_refresh_token(user)

    logger.info(f"User registered successfully: {user.email}")

    return {
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


# ─────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────

def login_user(email: str, password: str) -> dict:
    """
    Authenticate a user and issue JWT tokens.

    Steps:
      1. Fetch user by email
      2. Verify password
      3. Check account is active
      4. Generate fresh access + refresh tokens
      5. Return user + tokens

    Returns:
        {
            "user": CustomUser,
            "access_token": str,
            "refresh_token": str,
        }
    """
    # Generic error message — never reveal which field was wrong
    auth_error = AuthenticationError("Invalid email or password.")

    try:
        user = repository.get_user_by_email(email)
    except Exception:
        raise auth_error

    # Verify password using Django's built-in check
    if not user.check_password(password):
        logger.warning(f"Failed login attempt for: {email}")
        raise auth_error

    if not user.is_active:
        raise AuthenticationError("Your account has been deactivated. Please contact support.")

    # Generate tokens
    access_token = generate_access_token(user)
    refresh_token = generate_and_store_refresh_token(user)

    logger.info(f"User logged in: {user.email}")

    return {
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


# ─────────────────────────────────────────────
# Token Refresh
# ─────────────────────────────────────────────

def refresh_tokens(raw_refresh_token: str) -> dict:
    """
    Issue a new access token (and rotate refresh token) using a valid refresh token.

    Token rotation:
      - Old refresh token is revoked
      - New refresh token is generated and stored
      - New access token is generated

    Returns:
        {
            "access_token": str,
            "refresh_token": str,
        }
    """
    # Hash the incoming token to look it up in DB
    token_hash = _hash_token(raw_refresh_token)

    try:
        stored_token = repository.get_refresh_token_by_hash(token_hash)
    except Exception:
        raise InvalidTokenError("Invalid or unrecognized refresh token.")

    # Check revocation
    if stored_token.is_revoked:
        logger.warning(
            f"Attempt to use revoked refresh token for user: {stored_token.user.email}"
        )
        raise RefreshTokenRevokedError()

    # Check expiry
    if stored_token.is_expired:
        raise RefreshTokenExpiredError()

    # Check user account is still active
    user = stored_token.user
    if not user.is_active:
        raise AuthenticationError("This account is no longer active.")

    # Revoke old token (rotation — one-time use refresh token)
    repository.revoke_refresh_token(token_hash)

    # Issue new tokens
    new_access_token = generate_access_token(user)
    new_refresh_token = generate_and_store_refresh_token(user)

    logger.info(f"Tokens refreshed for user: {user.email}")

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
    }


# ─────────────────────────────────────────────
# Logout
# ─────────────────────────────────────────────

def logout_user(raw_refresh_token: str) -> bool:
    """
    Revoke the given refresh token, effectively logging the user out.
    Returns True on success.
    """
    token_hash = _hash_token(raw_refresh_token)
    repository.revoke_refresh_token(token_hash)
    logger.info("User logged out — refresh token revoked.")
    return True


# ─────────────────────────────────────────────
# JWT Token Generation
# ─────────────────────────────────────────────

def generate_access_token(user: CustomUser) -> str:
    """
    Generate a JWT access token for the given user.

    Payload:
        user_id  : UUID string of the user
        email    : User's email
        is_admin : Admin flag (for frontend to show/hide admin UI)
        type     : "access" (distinguishes from other token types)
        iat      : Issued at timestamp
        exp      : Expiry timestamp (15 minutes from now)
    """
    now = timezone.now()
    expiry = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRY_MINUTES)

    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "username": user.username,
        "is_admin": user.is_admin,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expiry.timestamp()),
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return token


def generate_and_store_refresh_token(user: CustomUser) -> str:
    """
    Generate a cryptographically random refresh token, store its hash in DB,
    and return the raw token to be sent to the client.

    Security:
      - Raw token (64 bytes of URL-safe randomness) is returned ONCE
      - SHA-256 hash of raw token is stored in DB
      - Even if DB is compromised, raw tokens cannot be recovered
    """
    # Generate raw token
    raw_token = secrets.token_urlsafe(64)

    # Hash for DB storage
    token_hash = _hash_token(raw_token)

    # Compute expiry
    expires_at = timezone.now() + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRY_DAYS
    )

    # Store in DB
    repository.create_refresh_token(
        user=user,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    return raw_token


# ─────────────────────────────────────────────
# Input Validation
# ─────────────────────────────────────────────

def _validate_email(email: str) -> None:
    """Validate email format."""
    if not email or not email.strip():
        raise ValidationError("Email is required.")

    email = email.strip()
    pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        raise ValidationError(f"'{email}' is not a valid email address.")

    if len(email) > 254:
        raise ValidationError("Email address is too long.")


def _validate_username(username: str) -> None:
    """
    Validate username:
      - 3–50 characters
      - Only letters, digits, underscores, hyphens
      - Cannot start or end with hyphen/underscore
    """
    if not username or not username.strip():
        raise ValidationError("Username is required.")

    username = username.strip()

    if len(username) < 3:
        raise ValidationError("Username must be at least 3 characters long.")

    if len(username) > 50:
        raise ValidationError("Username must be no more than 50 characters.")

    pattern = r"^[a-zA-Z0-9][a-zA-Z0-9_\-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$"
    if not re.match(pattern, username):
        raise ValidationError(
            "Username can only contain letters, digits, hyphens, and underscores, "
            "and cannot start or end with a hyphen or underscore."
        )


def _validate_password(password: str) -> None:
    """
    Validate password strength:
      - Minimum 8 characters
      - At least one uppercase letter
      - At least one lowercase letter
      - At least one digit
    """
    if not password:
        raise WeakPasswordError("Password is required.")

    if len(password) < USER_PASSWORD_MIN_LENGTH:
        raise WeakPasswordError(
            f"Password must be at least {USER_PASSWORD_MIN_LENGTH} characters long."
        )

    if not re.search(r"[A-Z]", password):
        raise WeakPasswordError("Password must contain at least one uppercase letter.")

    if not re.search(r"[a-z]", password):
        raise WeakPasswordError("Password must contain at least one lowercase letter.")

    if not re.search(r"\d", password):
        raise WeakPasswordError("Password must contain at least one number.")


# ─────────────────────────────────────────────
# Internal Utilities
# ─────────────────────────────────────────────

def _hash_token(raw_token: str) -> str:
    """
    SHA-256 hash of a raw token string.
    Used for storing refresh tokens securely in the database.
    """
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
