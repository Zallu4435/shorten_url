"""
Users Models
  - CustomUser  : Email-based authentication, UUID primary key
  - RefreshToken: Stores refresh tokens (hashed) for JWT invalidation support
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# ─────────────────────────────────────────────
# Custom User Manager
# ─────────────────────────────────────────────

class CustomUserManager(BaseUserManager):
    """
    Manager for CustomUser.
    Email is the unique identifier for authentication (not username).
    """

    def create_user(self, email: str, username: str, password: str = None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        if not username:
            raise ValueError("Username is required.")

        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)  # Handles hashing via AbstractBaseUser
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, username: str, password: str = None, **extra_fields):
        extra_fields.setdefault("is_admin", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", True)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, username, password, **extra_fields)


# ─────────────────────────────────────────────
# Custom User Model
# ─────────────────────────────────────────────

class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model using email as the primary login identifier.

    Fields:
        id          : UUID primary key (not sequential int — safer for APIs)
        email       : Unique email (used for login)
        username    : Unique display name
        is_admin    : Admin role — grants access to admin panel
        is_active   : Account active flag — inactive users cannot log in
        is_verified : Email verification status
        is_staff    : Required by Django admin
        created_at  : Account creation timestamp
        updated_at  : Last modification timestamp
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier (UUID)."
    )
    email = models.EmailField(
        unique=True,
        db_index=True,
        help_text="Primary login identifier. Must be unique."
    )
    username = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Public display name. Must be unique."
    )
    is_admin = models.BooleanField(
        default=False,
        help_text="Admin users have access to the admin dashboard and elevated permissions."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive users cannot log in. Use this instead of deleting accounts."
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Email verification status. Verified users have full access."
    )
    is_staff = models.BooleanField(
        default=False,
        help_text="Required by Django admin interface."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # AbstractBaseUser settings
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = CustomUserManager()

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.username} <{self.email}>"

    @property
    def full_display_name(self) -> str:
        return self.username

    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return self.is_admin


# ─────────────────────────────────────────────
# Refresh Token Model
# ─────────────────────────────────────────────

class RefreshToken(models.Model):
    """
    Stores hashed refresh tokens for JWT rotation and revocation.

    Security design:
      - Raw token is NEVER stored — only SHA-256 hash is stored.
      - Raw token is returned to client once and never seen again.
      - Revocation is instant: set is_revoked=True or delete the row.

    Fields:
        id          : UUID primary key
        user        : Owner of this token
        token_hash  : SHA-256 hash of the raw refresh token (indexed for fast lookup)
        expires_at  : When this token expires (7 days default)
        is_revoked  : True = token is invalidated (logout)
        created_at  : When the token was issued
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="refresh_tokens",
        db_index=True
    )
    token_hash = models.CharField(
        max_length=64,    # SHA-256 hex = 64 chars
        unique=True,
        db_index=True,
        help_text="SHA-256 hash of the raw refresh token."
    )
    expires_at = models.DateTimeField(
        help_text="When this refresh token expires."
    )
    is_revoked = models.BooleanField(
        default=False,
        help_text="True = token has been revoked (user logged out)."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "refresh_tokens"
        ordering = ["-created_at"]
        verbose_name = "Refresh Token"
        verbose_name_plural = "Refresh Tokens"
        indexes = [
            models.Index(fields=["token_hash"]),
            models.Index(fields=["user", "is_revoked"]),
        ]

    def __str__(self):
        return f"RefreshToken(user={self.user.email}, revoked={self.is_revoked})"

    @property
    def is_expired(self) -> bool:
        """Check if this token has passed its expiry date."""
        from django.utils import timezone
        return timezone.now() > self.expires_at

    @property
    def is_valid(self) -> bool:
        """Token is valid if not revoked and not expired."""
        return not self.is_revoked and not self.is_expired
