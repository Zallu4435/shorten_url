"""
Users Repository
Pure database operations — no business logic here.
All DB access for the users app goes through this layer.
"""

import logging
from datetime import datetime
from django.db import IntegrityError

from apps.users.models import CustomUser, RefreshToken
from shared.exceptions import (
    UserNotFoundError,
    DuplicateEmailError,
    ConflictError,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# User Operations
# ─────────────────────────────────────────────

def create_user(email: str, username: str, password: str) -> CustomUser:
    """
    Create a new user account.
    Raises DuplicateEmailError if email already exists.
    Raises ConflictError if username already exists.
    """
    try:
        user = CustomUser.objects.create_user(
            email=email.lower().strip(),
            username=username.strip(),
            password=password,
        )
        logger.info(f"New user created: {user.email} (id={user.id})")
        return user
    except IntegrityError as e:
        error_msg = str(e).lower()
        if "email" in error_msg:
            raise DuplicateEmailError()
        if "username" in error_msg:
            raise ConflictError(
                f"The username '{username}' is already taken. Please choose another."
            )
        logger.error(f"IntegrityError creating user: {e}")
        raise ConflictError("Account could not be created due to a conflict.")


def get_user_by_email(email: str) -> CustomUser:
    """
    Fetch a user by email address.
    Raises UserNotFoundError if not found.
    """
    try:
        return CustomUser.objects.get(email=email.lower().strip())
    except CustomUser.DoesNotExist:
        raise UserNotFoundError(f"No account found with email '{email}'.")


def get_user_by_id(user_id: str) -> CustomUser:
    """
    Fetch a user by their UUID.
    Raises UserNotFoundError if not found.
    """
    try:
        return CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        raise UserNotFoundError("User not found.")
    except Exception as e:
        logger.error(f"Error fetching user by id={user_id}: {e}")
        raise UserNotFoundError("User not found.")


def get_user_by_username(username: str) -> CustomUser:
    """
    Fetch a user by username.
    Raises UserNotFoundError if not found.
    """
    try:
        return CustomUser.objects.get(username=username.strip())
    except CustomUser.DoesNotExist:
        raise UserNotFoundError(f"No account found with username '{username}'.")


def update_user(user_id: str, **fields) -> CustomUser:
    """
    Update user fields.
    Supported fields: username, is_active, is_verified, is_admin.
    Returns updated user instance.
    """
    try:
        updated_count = CustomUser.objects.filter(id=user_id).update(**fields)
        if updated_count == 0:
            raise UserNotFoundError()
        return get_user_by_id(user_id)
    except UserNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error updating user id={user_id}: {e}")
        raise


def deactivate_user(user_id: str) -> CustomUser:
    """Soft-delete a user by marking them as inactive."""
    return update_user(user_id, is_active=False)


def get_all_users(page: int = 1, limit: int = 20) -> dict:
    """
    Paginated list of all users (admin use).
    Returns dict with `users` queryset and `total` count.
    """
    from shared.constants import MAX_PAGE_SIZE
    limit = min(limit, MAX_PAGE_SIZE)
    offset = (page - 1) * limit

    total = CustomUser.objects.count()
    users = CustomUser.objects.all().order_by("-created_at")[offset:offset + limit]

    return {"users": users, "total": total, "page": page, "limit": limit}


def email_exists(email: str) -> bool:
    """Check if an email is already registered."""
    return CustomUser.objects.filter(email=email.lower().strip()).exists()


def username_exists(username: str) -> bool:
    """Check if a username is already taken."""
    return CustomUser.objects.filter(username=username.strip()).exists()


# ─────────────────────────────────────────────
# Refresh Token Operations
# ─────────────────────────────────────────────

def create_refresh_token(user: CustomUser, token_hash: str, expires_at: datetime) -> RefreshToken:
    """
    Persist a new refresh token (hashed) in the database.
    """
    token = RefreshToken.objects.create(
        user=user,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    logger.debug(f"Refresh token created for user: {user.email}")
    return token


def get_refresh_token_by_hash(token_hash: str) -> RefreshToken:
    """
    Fetch a refresh token record by its hash.
    Raises UserNotFoundError if not found.
    """
    try:
        return RefreshToken.objects.select_related("user").get(token_hash=token_hash)
    except RefreshToken.DoesNotExist:
        from shared.exceptions import InvalidTokenError
        raise InvalidTokenError("Refresh token not found or already revoked.")


def revoke_refresh_token(token_hash: str) -> None:
    """Mark a specific refresh token as revoked (logout)."""
    updated = RefreshToken.objects.filter(token_hash=token_hash).update(is_revoked=True)
    if updated:
        logger.info("Refresh token revoked.")


def revoke_all_user_tokens(user: CustomUser) -> int:
    """
    Revoke ALL active refresh tokens for a user.
    Used when: password change, account ban, security reset.
    Returns the number of tokens revoked.
    """
    count = RefreshToken.objects.filter(
        user=user, is_revoked=False
    ).update(is_revoked=True)
    logger.info(f"Revoked {count} refresh token(s) for user: {user.email}")
    return count

