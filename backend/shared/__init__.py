"""
shared — Application-wide utilities

Public API:
    from shared.constants   import SLUG_MIN_LENGTH, RESERVED_SLUGS, ...
    from shared.exceptions  import ValidationError, URLNotFoundError, ...
    from shared.decorators  import login_required, admin_required, owner_required
    from shared.middlewares import JWTAuthMiddleware
"""
