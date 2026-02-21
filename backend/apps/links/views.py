"""
Short URL Redirect View
The most performance-critical endpoint in the system.

This is a plain Django class-based view (NOT GraphQL) for maximum speed.
It handles the full 12-step redirect flow for every /{slug} hit.

Flow:
  1.  Lookup slug in DB        → 404 redirect on miss
  2.  Check is_active          → inactive error page
  3.  Check activates_at       → "not yet active" page
  4.  Check expires_at         → expired error page
  5.  Check max_clicks         → click limit error page
  6.  Check is_private         → redirect to password prompt page
  7.  Verify password (bcrypt) → wrong password error
  8.  Check is_single_use      → mark used, block future
  9.  Evaluate redirect_rules  → dynamic redirect (device/time/geo)
  10. Log click (async thread) → non-blocking, never slows redirect
  11. Increment click_count    → atomic F() expression
  12. Fire webhook (async)     → non-blocking
  13. HTTP 301 Redirect        → original_url (or dynamic target)
"""

import logging
import threading

from django.conf import settings
from django.http import HttpResponseRedirect, JsonResponse, HttpResponse
from django.utils import timezone
from django.views import View

from apps.links import services as url_services
from apps.links import repository as url_repository
from shared.exceptions import (
    URLNotFoundError,
    URLInactiveError,
    URLExpiredError,
    URLNotYetActiveError,
    ClickLimitReachedError,
    WrongPasswordError,
    SingleUseLinkError,
    AppException,
)

logger = logging.getLogger(__name__)


class ShortURLRedirectView(View):
    """
    Handles GET /{slug}

    On success: HTTP 301 redirect to the original URL.
    On error:   Redirect to the appropriate frontend error page.

    Password for private links: pass via ?p=<password> query parameter.
    Single-use token access:    pass via ?t=<token> query parameter.
    """

    def get(self, request, slug: str, *args, **kwargs):
        """
        Main redirect handler.
        All side-effects (click logging, increment, webhook) are async.
        """
        # Extract optional password from query params
        # Frontend sends this when user submits the password form
        password = request.GET.get("p", None) or None

        try:
            # ── Steps 1–9: Validation & Rule Evaluation ─────────
            result = url_services.resolve_slug(
                slug=slug,
                password=password,
                request=request,
            )

            # ── Step 6b: Private link — needs password ───────────
            if result["requires_password"]:
                return self._redirect_to_password_page(slug)

            short_url = result["short_url"]
            redirect_url = result["redirect_url"]

            # ── Step 8b: Mark single-use link as used ────────────
            # Must happen BEFORE async processing to prevent race conditions
            if short_url.is_single_use:
                url_repository.mark_used(slug)

            # ── Steps 10–12: Async side effects ──────────────────
            threading.Thread(
                target=self._process_click_side_effects,
                args=(short_url, request),
                daemon=True,
            ).start()

            # ── Step 13: HTTP 301 Redirect ────────────────────────
            logger.info(f"Redirect: /{slug} → {redirect_url[:80]}")
            return HttpResponseRedirect(redirect_url, status=301)

        # ── Error Handling → Frontend Error Pages ────────────────
        except URLNotFoundError:
            return self._redirect_to_frontend("not-found", slug, "This link does not exist.")

        except URLInactiveError:
            return self._redirect_to_frontend("inactive", slug, "This link has been disabled.")

        except URLNotYetActiveError as e:
            return self._redirect_to_frontend("not-yet-active", slug, str(e))

        except URLExpiredError:
            return self._redirect_to_frontend("expired", slug, "This link has expired.")

        except ClickLimitReachedError:
            return self._redirect_to_frontend("limit-reached", slug, "This link has reached its click limit.")

        except WrongPasswordError:
            return self._redirect_to_password_page(slug, error="Incorrect password. Please try again.")

        except SingleUseLinkError:
            return self._redirect_to_frontend("used", slug, "This single-use link has already been accessed.")

        except AppException as e:
            logger.warning(f"AppException on redirect for /{slug}: {e}")
            return self._redirect_to_frontend("error", slug, str(e))

        except Exception as e:
            logger.error(f"Unexpected error on redirect for /{slug}: {e}", exc_info=True)
            return self._redirect_to_frontend("error", slug, "An unexpected error occurred.")

    # ─────────────────────────────────────────────────────────
    # Async Side Effects (Step 10, 11, 12)
    # ─────────────────────────────────────────────────────────

    def _process_click_side_effects(self, short_url, request) -> None:
        """
        Runs in a background thread — never blocks the redirect response.

        Steps:
          10. Log click event (IP, device, geo, unique flag)
          11. Increment click_count atomically
          12. Fire webhook (if configured)
        """
        try:
            # Step 10: Log click
            from apps.analytics.services import log_click_event
            log_click_event(short_url=short_url, request=request)

            # Step 11: Atomic increment
            url_repository.increment_click_count(short_url.slug)

            # Step 12: Webhook
            if short_url.webhook_url:
                self._fire_webhook(short_url)

        except Exception as e:
            # Never let async errors surface to the user
            logger.error(
                f"Error in click side-effects for /{short_url.slug}: {e}",
                exc_info=True,
            )

    def _fire_webhook(self, short_url) -> None:
        """POST a webhook notification to the configured URL."""
        try:
            payload = {
                "event": "link_clicked",
                "slug": short_url.slug,
                "short_url": short_url.short_url,
                "original_url": short_url.original_url,
                "click_count": short_url.click_count + 1,  # +1 = current click
                "timestamp": timezone.now().isoformat(),
            }
            url_services.fire_webhook(short_url.webhook_url, payload)
        except Exception as e:
            logger.warning(f"Webhook fire failed for /{short_url.slug}: {e}")

    # ─────────────────────────────────────────────────────────
    # Error Response Helpers
    # ─────────────────────────────────────────────────────────

    def _redirect_to_frontend(self, error_type: str, slug: str, message: str = "") -> HttpResponseRedirect:
        """
        Redirect to the Next.js frontend error page.

        Frontend routes expected:
          /link/not-found     → 404 page
          /link/expired       → Link expired page
          /link/inactive      → Link disabled page
          /link/not-yet-active→ Scheduled link page
          /link/limit-reached → Click limit page
          /link/used          → Single-use exhausted page
          /link/error         → Generic error page
        """
        from urllib.parse import quote
        base = f"{settings.FRONTEND_URL}/link/{error_type}"
        params = f"?slug={quote(slug)}"
        if message:
            params += f"&message={quote(message)}"
        return HttpResponseRedirect(f"{base}{params}", status=302)

    def _redirect_to_password_page(self, slug: str, error: str = "") -> HttpResponseRedirect:
        """
        Redirect to the frontend password prompt page for private links.
        Frontend expected route: /link/protected?slug=<slug>
        """
        from urllib.parse import quote
        url = f"{settings.FRONTEND_URL}/link/protected?slug={quote(slug)}"
        if error:
            url += f"&error={quote(error)}"
        return HttpResponseRedirect(url, status=302)


# ─────────────────────────────────────────────────────────────────
# API Endpoint: Verify Password (JSON — used by frontend password form)
# ─────────────────────────────────────────────────────────────────

class VerifyURLPasswordView(View):
    """
    POST /{slug}/verify
    Called by the frontend password form via AJAX.
    Returns JSON with the redirect URL on success, or an error on failure.

    Request body (JSON):
        { "password": "user_supplied_password" }

    Response (success):
        { "success": true, "redirect_url": "https://..." }

    Response (failure):
        { "success": false, "error": "Incorrect password." }
    """

    def post(self, request, slug: str, *args, **kwargs):
        import json

        try:
            body = json.loads(request.body)
            password = body.get("password", "")
        except (json.JSONDecodeError, AttributeError):
            return JsonResponse({"success": False, "error": "Invalid request body."}, status=400)

        if not password:
            return JsonResponse({"success": False, "error": "Password is required."}, status=400)

        try:
            result = url_services.resolve_slug(
                slug=slug,
                password=password,
                request=request,
            )

            if result["requires_password"]:
                return JsonResponse(
                    {"success": False, "error": "Password is required."},
                    status=403,
                )

            # Mark single-use
            short_url = result["short_url"]
            if short_url.is_single_use:
                url_repository.mark_used(slug)

            # Async side-effects
            threading.Thread(
                target=ShortURLRedirectView()._process_click_side_effects,
                args=(short_url, request),
                daemon=True,
            ).start()

            return JsonResponse({
                "success": True,
                "redirect_url": result["redirect_url"],
            })

        except WrongPasswordError:
            return JsonResponse(
                {"success": False, "error": "Incorrect password."},
                status=403,
            )
        except AppException as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
        except Exception as e:
            logger.error(f"Error in password verify for /{slug}: {e}", exc_info=True)
            return JsonResponse({"success": False, "error": "An error occurred."}, status=500)


# ─────────────────────────────────────────────────────────────────
# QR Code Image Endpoint (On-the-Fly Generation)
# ─────────────────────────────────────────────────────────────────

class QRCodeView(View):
    """
    GET /qr/<slug>

    Generates and streams a QR code PNG image for the given short URL on demand.
    No files are written to disk — the image is produced in memory every request.

    The QR code is deterministic: the same slug always produces the same image.
    This URL is safe to share, embed in HTML, and use as a download source.

    Responses:
        200 image/png  — Success: streams the QR code PNG.
        404 text/plain — Slug does not exist.
        403 text/plain — QR code was not enabled for this link.
    """

    def get(self, request, slug: str, *args, **kwargs):
        from apps.links.utils import generate_qr_code

        try:
            short_url_obj = url_repository.get_by_slug(slug)
        except URLNotFoundError:
            return HttpResponse("Short URL not found.", status=404, content_type="text/plain")

        if not short_url_obj.qr_enabled:
            return HttpResponse(
                "QR code was not enabled for this link.",
                status=403,
                content_type="text/plain",
            )

        png_bytes = generate_qr_code(short_url_obj.short_url)

        response = HttpResponse(png_bytes, content_type="image/png")
        # Cache for 24h — same slug always produces the same image
        response["Cache-Control"] = "public, max-age=86400, immutable"
        response["Content-Disposition"] = f'inline; filename="qr-{slug}.png"'
        logger.info(f"QR code served on-the-fly for /{slug}")
        return response
