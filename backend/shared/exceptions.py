"""
Custom Application Exceptions
All exceptions inherit from AppException, which provides:
  - message  : human-readable error message
  - code     : machine-readable error code (for frontend handling)
  - status   : HTTP-equivalent status code (for logging/context)

Usage in GraphQL resolvers:
    raise AuthenticationError("You must be logged in.")
    raise NotFoundError("Short URL not found.")
"""

from graphql import GraphQLError


# ─────────────────────────────────────────────
# Base Exception
# ─────────────────────────────────────────────

class AppException(GraphQLError):
    """
    Base class for all application exceptions.
    Extends GraphQLError so Graphene-Django handles them natively
    and returns them in the `errors` array of the GraphQL response.
    """
    code: str = "INTERNAL_ERROR"
    status: int = 500

    def __init__(self, message: str, code: str = None, status: int = None):
        super().__init__(message)
        if code:
            self.code = code
        if status:
            self.status = status
        # Attach extensions for frontend consumption
        self.extensions = {
            "code": self.code,
            "status": self.status,
        }

    def __str__(self):
        return self.message


# ─────────────────────────────────────────────
# Authentication & Authorization (401, 403)
# ─────────────────────────────────────────────

class AuthenticationError(AppException):
    """Raised when user is not authenticated (no token / invalid token)."""
    code = "UNAUTHENTICATED"
    status = 401

    def __init__(self, message: str = "Authentication required. Please log in."):
        super().__init__(message)


class TokenExpiredError(AppException):
    """Raised when the JWT access token has expired."""
    code = "TOKEN_EXPIRED"
    status = 401

    def __init__(self, message: str = "Your session has expired. Please refresh your token."):
        super().__init__(message)


class InvalidTokenError(AppException):
    """Raised when the JWT token is malformed or invalid."""
    code = "INVALID_TOKEN"
    status = 401

    def __init__(self, message: str = "Invalid authentication token."):
        super().__init__(message)


class RefreshTokenExpiredError(AppException):
    """Raised when the refresh token has expired."""
    code = "REFRESH_TOKEN_EXPIRED"
    status = 401

    def __init__(self, message: str = "Your session has fully expired. Please log in again."):
        super().__init__(message)


class RefreshTokenRevokedError(AppException):
    """Raised when the refresh token has been revoked (user logged out)."""
    code = "REFRESH_TOKEN_REVOKED"
    status = 401

    def __init__(self, message: str = "This session has been revoked. Please log in again."):
        super().__init__(message)


class PermissionDeniedError(AppException):
    """Raised when authenticated user lacks sufficient permissions."""
    code = "FORBIDDEN"
    status = 403

    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(message)


# ─────────────────────────────────────────────
# Resource Errors (404)
# ─────────────────────────────────────────────

class NotFoundError(AppException):
    """Raised when a requested resource doesn't exist."""
    code = "NOT_FOUND"
    status = 404

    def __init__(self, message: str = "The requested resource was not found."):
        super().__init__(message)


class UserNotFoundError(NotFoundError):
    """Raised when a user lookup fails."""
    code = "USER_NOT_FOUND"

    def __init__(self, message: str = "User not found."):
        super().__init__(message)


class URLNotFoundError(NotFoundError):
    """Raised when a short URL lookup fails."""
    code = "URL_NOT_FOUND"

    def __init__(self, message: str = "Short URL not found."):
        super().__init__(message)


# ─────────────────────────────────────────────
# Validation Errors (422)
# ─────────────────────────────────────────────

class ValidationError(AppException):
    """Raised when input data fails validation."""
    code = "VALIDATION_ERROR"
    status = 422

    def __init__(self, message: str = "Invalid input data."):
        super().__init__(message)


class InvalidURLFormatError(ValidationError):
    """Raised when the submitted URL is not a valid URL format."""
    code = "INVALID_URL_FORMAT"

    def __init__(self, message: str = "The provided URL is not valid. Must start with http:// or https://."):
        super().__init__(message)


class URLTooLongError(ValidationError):
    """Raised when the submitted URL exceeds max length."""
    code = "URL_TOO_LONG"

    def __init__(self, max_length: int = 2048):
        super().__init__(f"URL exceeds the maximum allowed length of {max_length} characters.")


class BlockedURLError(ValidationError):
    """Raised when the URL targets a private/local IP or blocked hostname."""
    code = "BLOCKED_URL"

    def __init__(self, message: str = "This URL targets a blocked or private address."):
        super().__init__(message)


class InvalidSlugError(ValidationError):
    """Raised when a custom alias violates slug rules."""
    code = "INVALID_SLUG"

    def __init__(self, message: str = "Invalid custom alias. Use only letters, numbers, hyphens, and underscores (3-50 chars)."):
        super().__init__(message)


class ReservedSlugError(ValidationError):
    """Raised when a custom alias is a reserved system word."""
    code = "RESERVED_SLUG"

    def __init__(self, slug: str = ""):
        message = f"The alias '{slug}' is reserved and cannot be used." if slug else "This alias is reserved."
        super().__init__(message)


class WeakPasswordError(ValidationError):
    """Raised when a password doesn't meet minimum requirements."""
    code = "WEAK_PASSWORD"

    def __init__(self, message: str = "Password is too weak. Minimum 8 characters required."):
        super().__init__(message)


# ─────────────────────────────────────────────
# Conflict Errors (409)
# ─────────────────────────────────────────────

class ConflictError(AppException):
    """Raised when an action conflicts with existing data."""
    code = "CONFLICT"
    status = 409

    def __init__(self, message: str = "Conflict with existing data."):
        super().__init__(message)


class DuplicateSlugError(ConflictError):
    """Raised when the chosen slug is already taken."""
    code = "DUPLICATE_SLUG"

    def __init__(self, slug: str = ""):
        message = f"The alias '{slug}' is already taken. Please choose a different one." if slug else "This alias is already taken."
        super().__init__(message)


class DuplicateEmailError(ConflictError):
    """Raised when a user tries to register with an already-used email."""
    code = "DUPLICATE_EMAIL"

    def __init__(self, message: str = "An account with this email already exists."):
        super().__init__(message)


class DuplicateURLError(ConflictError):
    """Raised when a user tries to shorten a URL they already shortened."""
    code = "DUPLICATE_URL"

    def __init__(self, existing_slug: str = ""):
        message = (
            f"You've already shortened this URL. Your existing short link: /{existing_slug}"
            if existing_slug
            else "You've already shortened this URL."
        )
        super().__init__(message)


# ─────────────────────────────────────────────
# URL State Errors (for redirect flow)
# ─────────────────────────────────────────────

class URLInactiveError(AppException):
    """Raised when a short URL is manually deactivated."""
    code = "URL_INACTIVE"
    status = 410

    def __init__(self, message: str = "This link is currently inactive."):
        super().__init__(message)


class URLExpiredError(AppException):
    """Raised when a short URL has passed its expiration date."""
    code = "URL_EXPIRED"
    status = 410

    def __init__(self, message: str = "This link has expired."):
        super().__init__(message)


class URLNotYetActiveError(AppException):
    """Raised when a scheduled URL is accessed before its activation time."""
    code = "URL_NOT_YET_ACTIVE"
    status = 425

    def __init__(self, activates_at=None):
        message = (
            f"This link is not active yet. It will be available from {activates_at}."
            if activates_at
            else "This link is not active yet."
        )
        super().__init__(message)


class ClickLimitReachedError(AppException):
    """Raised when a short URL has hit its maximum allowed clicks."""
    code = "CLICK_LIMIT_REACHED"
    status = 410

    def __init__(self, message: str = "This link has reached its maximum number of clicks."):
        super().__init__(message)


class PrivateLinkError(AppException):
    """Raised when a private URL is accessed without the correct password."""
    code = "PRIVATE_LINK"
    status = 403

    def __init__(self, message: str = "This link is password-protected. Please provide the correct password."):
        super().__init__(message)


class WrongPasswordError(AppException):
    """Raised when the password provided for a private URL is incorrect."""
    code = "WRONG_PASSWORD"
    status = 403

    def __init__(self, message: str = "Incorrect password for this link."):
        super().__init__(message)


class SingleUseLinkError(AppException):
    """Raised when a single-use link has already been used."""
    code = "LINK_ALREADY_USED"
    status = 410

    def __init__(self, message: str = "This is a single-use link and has already been accessed."):
        super().__init__(message)


# ─────────────────────────────────────────────
# URL Safety / Reachability Errors
# ─────────────────────────────────────────────

class URLNotReachableError(AppException):
    """Raised when the URL fails the HTTP reachability check."""
    code = "URL_NOT_REACHABLE"
    status = 422

    def __init__(self, message: str = "The URL could not be reached. Please check it and try again."):
        super().__init__(message)


class URLFlaggedError(AppException):
    """Raised when the URL is detected as malicious or unsafe."""
    code = "URL_FLAGGED_UNSAFE"
    status = 422

    def __init__(self, reason: str = ""):
        message = (
            f"This URL has been flagged as unsafe: {reason}"
            if reason
            else "This URL has been flagged as potentially unsafe and cannot be shortened."
        )
        super().__init__(message)


class DNSResolutionError(AppException):
    """Raised when the domain cannot be resolved via DNS."""
    code = "DNS_RESOLUTION_FAILED"
    status = 422

    def __init__(self, domain: str = ""):
        message = (
            f"The domain '{domain}' could not be resolved. Please check the URL."
            if domain
            else "The domain could not be resolved."
        )
        super().__init__(message)


# ─────────────────────────────────────────────
# Rate Limiting (429)
# ─────────────────────────────────────────────

class RateLimitError(AppException):
    """Raised when a user exceeds their rate limit."""
    code = "RATE_LIMIT_EXCEEDED"
    status = 429

    def __init__(self, message: str = "You've created too many links recently. Please slow down."):
        super().__init__(message)
