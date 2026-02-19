"""
config — Django project configuration

Modules:
    config.settings  → All settings (DB, JWT, GraphQL, CORS, AI, GeoIP, etc.)
    config.urls      → Root URL routing (/graphql + /{slug} + /{slug}/verify)
    config.wsgi      → WSGI application entry point

Usage:
    DJANGO_SETTINGS_MODULE=config.settings
"""
