"""
Authentication & Authorization Decorators
Used on GraphQL resolvers and mutation methods.

Usage:
    from shared.decorators import login_required, admin_required

    class MyQuery(graphene.ObjectType):
        @login_required
        def resolve_my_field(root, info, **kwargs):
            ...

    class CreateShortUrl(graphene.Mutation):
        @classmethod
        @login_required
        def mutate(cls, root, info, **kwargs):
            ...
"""

import logging
from functools import wraps

from shared.exceptions import AuthenticationError, PermissionDeniedError

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────

def _get_user(info):
    """
    Safely extract the authenticated user from the GraphQL context.
    Returns None if no user is present.
    """
    return getattr(info.context, "user", None)


def _is_authenticated(user) -> bool:
    """Check that user exists and their account is active."""
    return user is not None and getattr(user, "is_active", False)


def _is_admin(user) -> bool:
    """Check that user is authenticated and has admin privileges."""
    return _is_authenticated(user) and getattr(user, "is_admin", False)


# ─────────────────────────────────────────────
# @login_required
# ─────────────────────────────────────────────

def login_required(func):
    """
    Decorator that ensures the calling user is authenticated.

    Raises AuthenticationError (401) if:
      - No token provided in the request
      - Token is expired or invalid
      - User account is inactive

    Works with both regular resolvers and classmethods (mutations):
        @login_required
        def resolve_me(root, info): ...

        @classmethod
        @login_required
        def mutate(cls, root, info, **kwargs): ...
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # args may be (root, info) for resolvers or (cls, root, info) for classmethods
        info = _extract_info(args)
        user = _get_user(info)

        if not _is_authenticated(user):
            logger.warning(
                f"Unauthenticated access attempt on: {func.__qualname__}"
            )
            raise AuthenticationError()

        return func(*args, **kwargs)

    return wrapper


# ─────────────────────────────────────────────
# @admin_required
# ─────────────────────────────────────────────

def admin_required(func):
    """
    Decorator that ensures the calling user is an admin.

    Raises AuthenticationError (401) if not logged in.
    Raises PermissionDeniedError (403) if logged in but not an admin.

    Works with both regular resolvers and classmethods (mutations).
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        info = _extract_info(args)
        user = _get_user(info)

        if not _is_authenticated(user):
            logger.warning(
                f"Unauthenticated admin access attempt on: {func.__qualname__}"
            )
            raise AuthenticationError()

        if not _is_admin(user):
            logger.warning(
                f"Non-admin user '{user.email}' attempted admin action: {func.__qualname__}"
            )
            raise PermissionDeniedError(
                "Admin access required to perform this action."
            )

        return func(*args, **kwargs)

    return wrapper


# ─────────────────────────────────────────────
# @owner_required
# ─────────────────────────────────────────────

def owner_required(get_resource_user_id):
    """
    Decorator factory that ensures the calling user owns the resource.
    Admins always bypass this check.

    Args:
        get_resource_user_id: callable(args, kwargs) → user_id string
            A function that extracts the owner's user ID from the resolver args.

    Example:
        @owner_required(lambda args, kwargs: ShortURL.objects.get(id=kwargs['id']).user_id)
        def resolve_delete_url(root, info, id, **kwargs): ...

    Raises:
        AuthenticationError  — if not logged in
        PermissionDeniedError — if logged in but not the owner (and not admin)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            info = _extract_info(args)
            user = _get_user(info)

            if not _is_authenticated(user):
                raise AuthenticationError()

            # Admins bypass ownership check
            if _is_admin(user):
                return func(*args, **kwargs)

            # Check ownership
            try:
                resource_user_id = get_resource_user_id(args, kwargs)
                if str(resource_user_id) != str(user.id):
                    raise PermissionDeniedError(
                        "You do not have permission to modify this resource."
                    )
            except Exception as e:
                # If we can't determine ownership, deny access
                if isinstance(e, (AuthenticationError, PermissionDeniedError)):
                    raise
                logger.error(f"Error checking resource ownership: {e}")
                raise PermissionDeniedError()

            return func(*args, **kwargs)

        return wrapper
    return decorator


# ─────────────────────────────────────────────
# Internal Helper
# ─────────────────────────────────────────────

def _extract_info(args):
    """
    Extracts the GraphQL `info` object from resolver arguments.

    Graphene resolvers have one of these signatures:
      - Regular resolver:  (root, info, **kwargs)       → args[1]
      - Classmethod:       (cls, root, info, **kwargs)  → args[2]

    We detect the pattern by checking if args[0] is a class (type) or instance.
    """
    import inspect
    if args and inspect.isclass(args[0]):
        # Classmethod: (cls, root, info, ...)
        return args[2] if len(args) > 2 else args[1]
    else:
        # Regular method: (root, info, ...)
        return args[1]
