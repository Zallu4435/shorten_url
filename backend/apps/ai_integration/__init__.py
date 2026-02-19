"""
apps.ai_integration — Google Gemini AI Features

No models. Pure service layer.

Services:
    from apps.ai_integration.services import (
        suggest_slugs,          # Creative slug alias suggestions for a URL
        generate_url_metadata,  # Auto-generate title + description from URL
        suggest_redirect_rules, # Smart dynamic redirect rule suggestions
    )

Key behaviours:
  - Lazy client initialisation: no crash on startup if GEMINI_API_KEY is not set
  - All functions return [] or {} (empty) on failure — AI is enhancement, not infrastructure
  - Responses are validated and sanitized before returning (slugs re-checked against regex)
"""
