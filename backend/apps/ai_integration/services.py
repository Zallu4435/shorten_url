"""
AI Integration Service Layer — Google Gemini

Features:
  1. suggest_slugs(url, count)           → Suggest creative, memorable slug aliases
  2. generate_url_metadata(url)          → Auto-generate a title + description for a URL
  3. analyze_redirect_rules(url)         → Suggest smart redirect rules based on URL content

All features gracefully return empty/fallback results if:
  - The GEMINI_API_KEY is not configured
  - The Gemini API call fails for any reason
  Never raise exceptions to the GraphQL layer — AI is enhancement, not infrastructure.
"""

import json
import logging
import re
from urllib.parse import urlparse

from django.conf import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Gemini Client — initialized lazily
# ─────────────────────────────────────────────

_gemini_client = None


def _get_client():
    """
    Initialize and return the Gemini GenerativeModel client.
    Returns None if GEMINI_API_KEY is not set.
    Uses lazy initialization so the import doesn't crash on startup without a key.
    """
    global _gemini_client

    if _gemini_client is not None:
        return _gemini_client

    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        logger.debug("GEMINI_API_KEY not set — AI features disabled.")
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model_name = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
        _gemini_client = genai.GenerativeModel(model_name)
        logger.info(f"Gemini client initialized with model: {model_name}")
        return _gemini_client
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")
        return None


def _call_gemini(prompt: str, timeout: int = 15) -> str | None:
    """
    Send a prompt to Gemini and return the raw text response.
    Returns None on any failure.
    """
    client = _get_client()
    if not client:
        return None

    try:
        response = client.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "max_output_tokens": 512,
            },
        )
        return response.text.strip()
    except Exception as e:
        logger.warning(f"Gemini API call failed: {e}")
        return None


# ═══════════════════════════════════════════════════════════
# FEATURE 1: SLUG SUGGESTIONS
# ═══════════════════════════════════════════════════════════

def suggest_slugs(url: str, count: int = 5) -> list:
    """
    Given a long URL, ask Gemini to suggest short, memorable, URL-safe slug aliases.

    Returned slugs are filtered through the slug validation rules (format only;
    DB uniqueness is NOT checked here — do that before using them).

    Args:
        url   : The original long URL to shorten
        count : How many suggestions to return (1–10)

    Returns:
        List of dicts: [{"slug": str, "reason": str}, ...]
        Returns [] if AI is unavailable or fails.
    """
    count = max(1, min(count, 10))

    # Extract domain + path hint for Gemini context
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "")
    path_hint = parsed.path.strip("/").replace("/", "-").replace("_", "-")[:50]
    context = f"{domain}/{path_hint}" if path_hint else domain

    prompt = f"""You are a URL slug generator. Your job is to create short, memorable, URL-safe aliases for links.

URL to shorten: {url}
URL context (domain/path): {context}

Generate exactly {count} slug suggestions. Each slug must:
- Be 3 to 30 characters long
- Use ONLY lowercase letters (a-z), digits (0-9), hyphens (-), or underscores (_)
- Start and end with a letter or digit (not a hyphen/underscore)
- Be creative, memorable, and relevant to the URL content
- Be distinct from each other
- NOT be generic words like "link", "url", "click", "here", "site"

Respond with ONLY a valid JSON array. No explanation text before or after. Format:
[
  {{"slug": "example-slug", "reason": "Brief reason why this slug fits (max 10 words)"}},
  ...
]"""

    raw = _call_gemini(prompt)
    if not raw:
        return []

    return _parse_slug_suggestions(raw, count)


def _parse_slug_suggestions(raw: str, count: int) -> list:
    """Parse and validate Gemini's slug suggestion JSON output."""
    # Extract JSON array from response (handle markdown code blocks)
    json_match = re.search(r"\[[\s\S]*\]", raw)
    if not json_match:
        logger.debug(f"Could not find JSON array in Gemini slug response: {raw[:200]}")
        return []

    try:
        suggestions = json.loads(json_match.group())
    except json.JSONDecodeError as e:
        logger.debug(f"Failed to parse Gemini slug JSON: {e}")
        return []

    validated = []
    slug_pattern = re.compile(r"^[a-z0-9][a-z0-9_\-]*[a-z0-9]$|^[a-z0-9]{1}$")

    for item in suggestions:
        if not isinstance(item, dict):
            continue

        slug = str(item.get("slug", "")).strip().lower()
        reason = str(item.get("reason", "")).strip()

        # Validate slug format
        if not slug or not slug_pattern.match(slug):
            continue
        if len(slug) < 3 or len(slug) > 30:
            continue

        validated.append({"slug": slug, "reason": reason})

        if len(validated) >= count:
            break

    logger.info(f"Gemini returned {len(validated)} valid slug suggestions.")
    return validated


# ═══════════════════════════════════════════════════════════
# FEATURE 2: URL METADATA GENERATION
# ═══════════════════════════════════════════════════════════

def generate_url_metadata(url: str) -> dict:
    """
    Given a URL, ask Gemini to infer and generate a good title and description
    based on available signals (domain, path, query params).
    Used to pre-fill the title/description fields when creating a short URL.

    Args:
        url : The original long URL

    Returns:
        {"title": str, "description": str}
        Returns {"title": "", "description": ""} on failure.
    """
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "")
    full_path = parsed.path + ("?" + parsed.query if parsed.query else "")

    prompt = f"""You are a link metadata assistant. Based only on the URL structure (domain, path, query parameters), infer what this link is about and generate metadata for it.

URL: {url}
Domain: {domain}
Path: {full_path[:200]}

Generate concise, accurate metadata. If you cannot infer the content from the URL alone, make a reasonable guess based on the domain.

Respond with ONLY a valid JSON object. No explanation. Format:
{{
  "title": "A clear, concise title (max 60 characters)",
  "description": "A brief description of what this link points to (max 160 characters)"
}}"""

    raw = _call_gemini(prompt)
    if not raw:
        return {"title": "", "description": ""}

    return _parse_metadata(raw)


def _parse_metadata(raw: str) -> dict:
    """Parse Gemini's metadata JSON response."""
    json_match = re.search(r"\{[\s\S]*\}", raw)
    if not json_match:
        return {"title": "", "description": ""}

    try:
        data = json.loads(json_match.group())
        return {
            "title": str(data.get("title", ""))[:255].strip(),
            "description": str(data.get("description", ""))[:500].strip(),
        }
    except (json.JSONDecodeError, TypeError):
        return {"title": "", "description": ""}


# ═══════════════════════════════════════════════════════════
# FEATURE 3: REDIRECT RULE SUGGESTIONS
# ═══════════════════════════════════════════════════════════

def suggest_redirect_rules(url: str) -> list:
    """
    Based on the URL content, suggest useful dynamic redirect rules.
    For example, if the URL looks like an e-commerce site, Gemini might suggest
    a mobile-specific rule.

    Args:
        url : The original long URL

    Returns:
        List of rule dicts: [{"condition": str, "target_url": str, "description": str}]
        Returns [] if AI unavailable or no useful rules can be suggested.

    Supported condition formats (from services.py):
        device=mobile | device=tablet | device=desktop
        hour>=N       | hour<=N
    """
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "")

    prompt = f"""You are a URL redirect rules advisor. Given a URL, suggest smart dynamic redirect rules.

Original URL: {url}
Domain: {domain}

Available condition types ONLY (use exactly these formats):
- "device=mobile"   → redirect mobile visitors
- "device=tablet"   → redirect tablet visitors
- "device=desktop"  → redirect desktop visitors
- "hour>=N"         → redirect during hours >= N (0-23, UTC)
- "hour<=N"         → redirect during hours <= N (0-23, UTC)

Rules:
- Only suggest rules that make practical sense for this URL
- The target_url should be a plausible alternative URL (e.g., mobile version of the site)
- Suggest 1 to 3 rules. If no rules are useful, return an empty array.
- Keep descriptions brief and practical

Respond with ONLY a valid JSON array. No explanation. Format:
[
  {{
    "condition": "device=mobile",
    "target_url": "https://m.example.com",
    "description": "Redirect mobile users to the mobile-optimized version"
  }}
]"""

    raw = _call_gemini(prompt)
    if not raw:
        return []

    return _parse_redirect_rules(raw)


def _parse_redirect_rules(raw: str) -> list:
    """Parse and validate Gemini's redirect rule suggestions."""
    json_match = re.search(r"\[[\s\S]*\]", raw)
    if not json_match:
        return []

    try:
        rules = json.loads(json_match.group())
    except json.JSONDecodeError:
        return []

    valid_condition_pattern = re.compile(
        r"^(device=(mobile|tablet|desktop)|hour>=[0-9]{1,2}|hour<=[0-9]{1,2})$"
    )

    validated = []
    for rule in rules:
        if not isinstance(rule, dict):
            continue
        condition = str(rule.get("condition", "")).strip().lower()
        target_url = str(rule.get("target_url", "")).strip()
        description = str(rule.get("description", "")).strip()

        if not valid_condition_pattern.match(condition):
            continue
        if not target_url.startswith(("http://", "https://")):
            continue

        validated.append({
            "condition": condition,
            "target_url": target_url,
            "description": description,
        })

    return validated[:3]  # Max 3 suggestions
