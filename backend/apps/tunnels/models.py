"""
Tunnels App
  - Tunnel  : Represents a user's tunnel (alias → WebSocket → local server)
"""

import uuid
import hashlib
import secrets
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Tunnel(models.Model):
    """
    Represents a persistent tunnel owned by a user.

    Sections:
        Identity   — id, user, alias
        Auth       — token_hash (raw token is NEVER stored)
        Config     — local_port (display only)
        State      — is_active, status, last_connected_at
        Timestamps — created_at, updated_at
    """

    STATUS_DISCONNECTED = "disconnected"
    STATUS_CONNECTED = "connected"
    STATUS_ERROR = "error"

    STATUS_CHOICES = [
        (STATUS_DISCONNECTED, "Disconnected"),
        (STATUS_CONNECTED, "Connected"),
        (STATUS_ERROR, "Error"),
    ]

    # ─── Identity ─────────────────────────────────────────
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tunnels",
        db_index=True,
        help_text="Owner of this tunnel.",
    )
    alias = models.SlugField(
        max_length=30,
        unique=True,
        db_index=True,
        help_text="Public alias (e.g. 'my-app'). Unique across all users.",
    )

    # ─── Auth ──────────────────────────────────────────────
    token_hash = models.CharField(
        max_length=64,  # SHA-256 hex = 64 chars
        db_index=True,
        help_text="SHA-256 hash of the raw tunnel token. Raw token is never stored.",
    )

    # ─── Config (display only) ────────────────────────────
    local_port = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="The local port the agent forwards to. Stored for display only.",
    )

    # ─── State ────────────────────────────────────────────
    is_active = models.BooleanField(
        default=True,
        help_text="When False, the tunnel is disabled and connections are rejected.",
    )
    status = models.CharField(
        max_length=16,
        choices=STATUS_CHOICES,
        default=STATUS_DISCONNECTED,
        db_index=True,
        help_text="Live connection state updated by the WebSocket consumer.",
    )
    last_connected_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the agent last successfully connected.",
    )
    bandwidth_bytes = models.BigIntegerField(
        default=0,
        help_text="Total data transferred through this tunnel in bytes.",
    )

    # ─── Timestamps ───────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tunnels"
        ordering = ["-created_at"]
        verbose_name = "Tunnel"
        verbose_name_plural = "Tunnels"
        indexes = [
            models.Index(fields=["alias"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["is_active", "status"]),
        ]

    def __str__(self):
        return f"Tunnel({self.alias} → :{self.local_port}, user={self.user.email}, status={self.status})"

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Return SHA-256 hex digest of a raw token string."""
        return hashlib.sha256(raw_token.encode()).hexdigest()

    @staticmethod
    def generate_raw_token() -> str:
        """Generate a cryptographically secure 64-char token."""
        return "tk_" + secrets.token_hex(32)  # 64 hex chars + prefix
