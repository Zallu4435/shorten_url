"""
Tunnel Services
Business logic: token generation, validation, alias validation, rate limiting.
"""

import re
import logging
from django.conf import settings
from .models import Tunnel
from . import repository

logger = logging.getLogger(__name__)

# Alias: 3–30 chars, lowercase letters, digits, hyphens only
_ALIAS_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$")


# ─── Alias Validation ─────────────────────────────────────────

def validate_alias(alias: str) -> str | None:
    """
    Validate alias format.
    Returns None if valid, or an error message string if invalid.
    """
    if not alias:
        return "Alias is required."
    if not _ALIAS_PATTERN.match(alias):
        return (
            "Alias must be 3–30 characters, lowercase letters, digits, and hyphens only. "
            "Cannot start or end with a hyphen."
        )
    if repository.alias_exists(alias):
        return f"Alias '{alias}' is already taken. Please choose another."
    return None


# ─── Token Management ─────────────────────────────────────────

def generate_token_pair() -> tuple[str, str]:
    """
    Generate a new tunnel token.
    Returns: (raw_token, token_hash)
    Raw token is returned once to the user and NEVER stored.
    """
    raw = Tunnel.generate_raw_token()
    hashed = Tunnel.hash_token(raw)
    return raw, hashed


def verify_token(raw_token: str) -> Tunnel | None:
    """
    Validate a raw token from an agent.
    Returns the matching Tunnel or None if invalid.
    """
    token_hash = Tunnel.hash_token(raw_token)
    return repository.get_tunnel_by_token_hash(token_hash)


# ─── Rate Limiting ────────────────────────────────────────────

def check_tunnel_limit(user) -> str | None:
    """
    Check if the user has hit their tunnel limit.
    Returns None if OK, or error message if limit reached.
    """
    max_tunnels = getattr(settings, "MAX_TUNNELS_PER_USER", 5)
    count = repository.count_user_tunnels(user)
    if count >= max_tunnels:
        return (
            f"You've reached your tunnel limit ({count}/{max_tunnels}). "
            "Delete an existing tunnel to create a new one."
        )
    return None


# ─── Tunnel Lifecycle ─────────────────────────────────────────

def create_tunnel(user, alias: str, local_port: int | None = None) -> tuple[Tunnel | None, str | None, str | None]:
    """
    Create a new tunnel.
    Returns: (tunnel, raw_token, error_message)
    raw_token is returned once and must be sent to the user immediately.
    """
    # Check limit
    limit_error = check_tunnel_limit(user)
    if limit_error:
        return None, None, limit_error

    # Validate alias
    alias_error = validate_alias(alias)
    if alias_error:
        return None, None, alias_error

    # Generate token
    raw_token, token_hash = generate_token_pair()

    tunnel = repository.create_tunnel(
        user=user,
        alias=alias,
        token_hash=token_hash,
        local_port=local_port,
    )
    logger.info("Tunnel created: alias=%s user=%s", alias, user.email)
    return tunnel, raw_token, None


def regenerate_token(tunnel_id: str, user) -> tuple[str | None, str | None]:
    """
    Revoke old token and generate a new one.
    Returns: (raw_token, error_message)
    """
    tunnel = repository.get_tunnel_by_id(tunnel_id, user=user)
    if not tunnel:
        return None, "Tunnel not found."

    raw_token, token_hash = generate_token_pair()
    repository.update_tunnel_token(tunnel_id, token_hash)
    logger.info("Token regenerated: alias=%s user=%s", tunnel.alias, user.email)
    return raw_token, None


def delete_tunnel(tunnel_id: str, user) -> str | None:
    """
    Delete a tunnel. Returns None on success or error message.
    """
    deleted = repository.delete_tunnel(tunnel_id, user)
    if not deleted:
        return "Tunnel not found."
    logger.info("Tunnel deleted: id=%s user=%s", tunnel_id, user.email)
    return None
