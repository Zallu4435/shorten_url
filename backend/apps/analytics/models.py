"""
Click Model
Records every click event on a ShortURL with full context:
  - Who clicked (IP, device, browser, OS)
  - Where they came from (referrer, country, city)
  - When they clicked (timestamp)
  - Whether this was a unique visit (first time this IP hit this URL)
"""

import uuid
from django.db import models


class Click(models.Model):
    """
    Immutable click event record.
    Each row = one click on a ShortURL.

    Fields:
        id          : UUID primary key
        short_url   : Foreign key to ShortURL
        ip_address  : Visitor's IP address (used for unique detection)
        user_agent  : Raw browser User-Agent string
        referrer    : HTTP Referer header (where the click came from)
        country     : Geo-lookup result from IP
        city        : Geo-lookup result from IP
        region      : Geo-lookup result from IP (state/province)
        device_type : mobile / tablet / desktop / bot / unknown
        browser     : Chrome / Firefox / Safari / Edge / etc.
        os          : Windows / macOS / Android / iOS / Linux / etc.
        is_unique   : True = first time this IP has clicked this URL
        created_at  : Exact timestamp of the click
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    short_url = models.ForeignKey(
        "urls.ShortURL",
        on_delete=models.CASCADE,
        related_name="clicks",
        db_index=True,
        help_text="The short URL that was clicked.",
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Visitor's IP address.",
    )
    user_agent = models.TextField(
        blank=True,
        default="",
        help_text="Raw HTTP User-Agent string.",
    )
    referrer = models.TextField(
        blank=True,
        default="",
        help_text="HTTP Referer header — where the click originated from.",
    )

    # ─── Geo Data ─────────────────────────────────────────
    country = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True,
        help_text="Country name from IP geolocation.",
    )
    country_code = models.CharField(
        max_length=5,
        blank=True,
        default="",
        help_text="ISO 3166-1 alpha-2 country code (e.g. 'US', 'IN', 'GB').",
    )
    city = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="City from IP geolocation.",
    )
    region = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="State/province from IP geolocation.",
    )

    # ─── Device & Browser ─────────────────────────────────
    device_type = models.CharField(
        max_length=20,
        blank=True,
        default="unknown",
        db_index=True,
        help_text="mobile / tablet / desktop / bot / unknown",
    )
    browser = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True,
        help_text="Browser name (e.g. Chrome, Firefox, Safari).",
    )
    browser_version = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Browser version string.",
    )
    os = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True,
        help_text="Operating system name (e.g. Windows, macOS, Android, iOS).",
    )
    os_version = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="OS version string.",
    )

    # ─── Uniqueness ────────────────────────────────────────
    is_unique = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True = first time this IP has clicked this specific short URL.",
    )

    # ─── Timestamp ─────────────────────────────────────────
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Exact timestamp of the click event.",
    )

    class Meta:
        db_table = "clicks"
        ordering = ["-created_at"]
        verbose_name = "Click"
        verbose_name_plural = "Clicks"
        indexes = [
            models.Index(fields=["short_url", "-created_at"]),
            models.Index(fields=["short_url", "ip_address"]),
            models.Index(fields=["short_url", "is_unique"]),
            models.Index(fields=["short_url", "device_type"]),
            models.Index(fields=["short_url", "country"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Click on /{self.short_url.slug} from {self.ip_address or 'unknown'} at {self.created_at}"
