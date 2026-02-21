"""
ShortURL Model
The core model of the entire system.

Every field is documented with its purpose so nothing is ambiguous.
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ShortURL(models.Model):
    """
    Represents a shortened URL with all its configuration.

    Sections:
        Identity        — id, user, original_url, slug, title, description
        State           — is_active, is_flagged, flag_reason
        Privacy         — is_private, password_hash, is_single_use, token
        Limits          — max_clicks, click_count
        Scheduling      — expires_at, activates_at
        Dynamic Routing — redirect_rules (JSON)
        Integrations    — webhook_url, qr_code
        URL Health      — is_url_reachable, url_status_code, last_checked_at
        Timestamps      — created_at, updated_at
    """

    # ─── Identity ──────────────────────────────────────────
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="short_urls",
        null=True,
        blank=True,
        db_index=True,
        help_text="Owner of this short URL. Null = anonymous link.",
    )
    original_url = models.TextField(
        help_text="The full long URL this short link redirects to.",
    )
    slug = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="The short identifier (e.g. 'abc123'). Must be unique across all users.",
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Optional human-readable label for the link.",
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="Optional notes or description for this link.",
    )

    # ─── State ─────────────────────────────────────────────
    is_active = models.BooleanField(
        default=True,
        help_text="When False, the link is disabled and redirects will be blocked.",
    )
    is_flagged = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True = link was detected as unsafe or reported by admin.",
    )
    flag_reason = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Reason for flagging (e.g. 'MALWARE', 'PHISHING', 'ADMIN_REVIEW').",
    )

    # ─── Privacy & Protection ──────────────────────────────
    is_private = models.BooleanField(
        default=False,
        help_text="When True, redirect requires a password.",
    )
    password_hash = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="bcrypt hash of the URL password. Only set when is_private=True.",
    )
    is_single_use = models.BooleanField(
        default=False,
        help_text="When True, the link can only be clicked once.",
    )
    token = models.CharField(
        max_length=128,
        blank=True,
        default="",
        db_index=True,
        help_text="Secret token for single-use or token-gated access.",
    )
    used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of when a single-use link was accessed.",
    )

    # ─── Click Limits ──────────────────────────────────────
    max_clicks = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum number of times this link can be clicked. Null = unlimited.",
    )
    click_count = models.PositiveIntegerField(
        default=0,
        help_text="Denormalized total click counter. Updated atomically on each click.",
    )

    # ─── Scheduling ────────────────────────────────────────
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="After this datetime, the link redirects to the expiry page. Null = no expiry.",
    )
    activates_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Before this datetime, the link is not yet available. Null = active immediately.",
    )

    # ─── Dynamic Redirect Rules ────────────────────────────
    redirect_rules = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "JSON array of conditional redirect rules. "
            "Rules are evaluated in order; first match wins. "
            "Example: [{'condition': 'device=mobile', 'target_url': 'https://m.example.com'}, "
            "{'condition': 'country=US', 'target_url': 'https://us.example.com'}]"
        ),
    )

    # ─── Integrations ──────────────────────────────────────
    webhook_url = models.URLField(
        blank=True,
        default="",
        help_text="When set, a POST request is fired to this URL on every click.",
    )
    qr_enabled = models.BooleanField(
        default=False,
        help_text="When True, a QR code can be generated on-the-fly for this link via /qr/<slug>.",
    )

    # ─── URL Health ────────────────────────────────────────
    is_url_reachable = models.BooleanField(
        null=True,
        blank=True,
        help_text="Result of the most recent HTTP reachability check. Null = not yet checked.",
    )
    url_status_code = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="HTTP status code from the most recent reachability check (e.g. 200, 404, 301).",
    )
    last_checked_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the URL health was last verified.",
    )

    # ─── Timestamps ────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "short_urls"
        ordering = ["-created_at"]
        verbose_name = "Short URL"
        verbose_name_plural = "Short URLs"
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["is_active", "is_flagged"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self):
        owner = self.user.email if self.user else "anonymous"
        return f"/{self.slug} → {self.original_url[:50]} ({owner})"

    # ─── Computed Properties ──────────────────────────────

    @property
    def is_expired(self) -> bool:
        """True if the link has passed its expiration date."""
        if not self.expires_at:
            return False
        from django.utils import timezone
        return timezone.now() > self.expires_at

    @property
    def is_scheduled(self) -> bool:
        """True if the link is not yet active (before activates_at)."""
        if not self.activates_at:
            return False
        from django.utils import timezone
        return timezone.now() < self.activates_at

    @property
    def is_click_limit_reached(self) -> bool:
        """True if the link has hit its click limit."""
        if self.max_clicks is None:
            return False
        return self.click_count >= self.max_clicks

    @property
    def is_single_use_exhausted(self) -> bool:
        """True if this is a single-use link that has already been used."""
        return self.is_single_use and self.used_at is not None

    @property
    def short_url(self) -> str:
        """Full short URL string (e.g. https://yourdomain.com/abc123)."""
        from django.conf import settings
        return f"{settings.BASE_URL}/{self.slug}"
