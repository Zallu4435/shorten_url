"""
Root URL Configuration
  - /graphql/            → GraphQL endpoint (Graphene-Django)
  - /media/              → Served media files (QR codes etc.) in DEBUG mode
  - /<slug>              → Short URL redirect (Django view — fast, not GraphQL)
  - /<slug>/verify       → Password verification endpoint (JSON API)
"""

from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt

from apps.urls.views import ShortURLRedirectView, VerifyURLPasswordView, QRCodeView

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # GraphQL API — all queries & mutations go through here
    path(
        "graphql/",
        csrf_exempt(GraphQLView.as_view(graphiql=settings.DEBUG)),
        name="graphql",
    ),

    # Password verification for private links (JSON endpoint — called by frontend form)
    # Must be declared BEFORE the slug catch-all to avoid conflict
    re_path(
        r"^(?P<slug>[a-zA-Z0-9_\-]{3,50})/verify$",
        csrf_exempt(VerifyURLPasswordView.as_view()),
        name="url-verify-password",
    ),

    # QR code on-the-fly endpoint — generates PNG in memory, no disk storage
    # Must be declared BEFORE the slug catch-all to avoid conflict
    re_path(
        r"^qr/(?P<slug>[a-zA-Z0-9_\-]{3,50})$",
        QRCodeView.as_view(),
        name="url-qr-code",
    ),

    # ─── Short URL Redirect — must be LAST (catch-all for slugs) ───
    # Matches slugs: 3–50 chars, lowercase/uppercase letters, digits, hyphens, underscores
    re_path(
        r"^(?P<slug>[a-zA-Z0-9_\-]{3,50})$",
        ShortURLRedirectView.as_view(),
        name="url-redirect",
    ),
]

# Serve media files (QR code images) in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
