"""
URLs App Configuration
"""
from django.apps import AppConfig


class UrlsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.urls"
    label = "urls"
    verbose_name = "Short URLs"
