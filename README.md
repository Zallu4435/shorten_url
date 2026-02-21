# 🔗 URL Shortener — Full-Stack Production App

A production-grade, full-stack URL shortening service built with **Django + GraphQL** (backend) and **Next.js** (frontend — coming next). Features custom aliases, rich analytics, privacy controls, QR codes, dynamic redirects, webhooks, admin controls, and AI-powered slug suggestions via **Google Gemini**.

> **Backend status: ✅ Complete & Stable (Links App Refactored)**  
> **Frontend status: � In Progress (Hooks Consolidated)**

---

## 🚀 Quick Start (Backend)

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# → Fill in DATABASE_URL (Neon), SECRET_KEY, JWT_SECRET_KEY

# 4. Run migrations
python manage.py makemigrations users links analytics
python manage.py migrate

# 5. Start development server
python manage.py runserver
```

**GraphiQL Playground:** http://localhost:8000/graphql/  
**Short URL Redirect:** http://localhost:8000/{slug}

---

## 📁 Monorepo Structure

```
shorten_url/
├── backend/              # Django + Graphene-Django (GraphQL)
│   ├── apps/
│   │   ├── users/        # Auth — JWT register/login/refresh/logout
│   │   ├── links/         # Core — shorten, validate, redirect, QR
│   │   ├── analytics/    # Clicks — log, aggregate, geo, charts
│   │   ├── admin_panel/  # Admin — stats, user/URL management
│   │   └── ai_integration/ # Gemini — slug suggestions, metadata
│   ├── shared/           # Constants, exceptions, JWT middleware, decorators
│   ├── config/           # Django settings, URL routing, WSGI
│   └── schema.py         # Root GraphQL schema (all apps merged)
├── frontend/             # Next.js App Router (Tailwind + Shadcn/UI)
└── README.md
```

---

## 🛠️ Tech Stack

| Layer              | Technology                        | Reason                                          |
|--------------------|-----------------------------------|-------------------------------------------------|
| Frontend           | Next.js (App Router)              | SSR, fast routing, reusable components          |
| Backend / API      | Django 5 + Graphene-Django        | Robust MVC + GraphQL, clean architecture        |
| Database           | PostgreSQL via **Neon** (cloud)   | Serverless, scalable, connection pooling        |
| Authentication     | JWT (access + refresh tokens)     | Stateless, secure, session revocation           |
| QR Code Generation | Python `qrcode` + Pillow          | Reliable QR generation, stored as media         |
| URL Safety Check   | Google Safe Browsing API          | Detects phishing, malware, unwanted software    |
| AI Integration     | **Google Gemini** (via AI Studio) | Slug suggestions, metadata, redirect rules      |
| Geo Analytics      | MaxMind GeoLite2 (optional)       | Country/city lookup from IP address             |
| Static Files       | WhiteNoise                        | Efficient static file serving in production     |

---

## 🗃️ Database Schema

### `CustomUser`
| Field         | Type        | Notes                          |
|---------------|-------------|--------------------------------|
| id            | UUID (PK)   | Auto-generated                 |
| email         | String      | Unique, used for login         |
| username      | String      | Unique display name            |
| password_hash | String      | bcrypt hashed                  |
| is_admin      | Boolean     | Admin role flag                |
| is_active     | Boolean     | Account active flag            |
| is_verified   | Boolean     | Email verification flag        |
| created_at    | DateTime    | Auto-set on create             |
| updated_at    | DateTime    | Auto-updated                   |

### `RefreshToken`
| Field      | Type      | Notes                          |
|------------|-----------|--------------------------------|
| id         | UUID (PK) |                                |
| user       | FK → User |                                |
| token_hash | String    | bcrypt hashed refresh token    |
| expires_at | DateTime  | 7-day expiry                   |
| is_revoked | Boolean   | Invalidated on logout          |
| created_at | DateTime  |                                |

### `ShortURL`
| Field            | Type        | Notes                                        |
|------------------|-------------|----------------------------------------------|
| id               | UUID (PK)   |                                              |
| user             | FK → User   | Nullable (anonymous links allowed)           |
| original_url     | TextField   | The long URL                                 |
| slug             | String      | Unique short identifier (DB indexed)         |
| short_url        | String      | Full short URL (computed: BASE_URL/slug)     |
| title            | String      | Optional user-defined label                  |
| description      | String      | Optional notes                               |
| is_active        | Boolean     | Manually activate/deactivate                 |
| is_private       | Boolean     | Requires password to access                  |
| password_hash    | String      | bcrypt hash — private URL password           |
| is_single_use    | Boolean     | One-time access link                         |
| max_clicks       | Integer     | Click limit (null = unlimited)               |
| click_count      | Integer     | Denormalized atomic counter (fast reads)     |
| expires_at       | DateTime    | Link expires after this time                 |
| activates_at     | DateTime    | Link becomes active from this time           |
| redirect_rules   | JSON        | Dynamic redirect rules (device/time/geo)     |
| webhook_url      | String      | POST to this URL on every click              |
| qr_code          | String      | File path to generated QR code image         |
| is_url_reachable | Boolean     | HTTP reachability check result               |
| url_status_code  | Integer     | HTTP status code from health check           |
| last_checked_at  | DateTime    | When URL health was last verified            |
| is_flagged       | Boolean     | Marked as suspicious/malicious by admin      |
| flag_reason      | String      | Why the URL was flagged                      |
| created_at       | DateTime    |                                              |
| updated_at       | DateTime    |                                              |

### `Click`
| Field           | Type            | Notes                              |
|-----------------|-----------------|------------------------------------|
| id              | UUID (PK)       | Immutable event record             |
| short_url       | FK → ShortURL   | DB indexed                         |
| ip_address      | String          | Extracted from request headers     |
| user_agent      | String          | Raw user-agent string              |
| referrer        | String          | Where the click came from          |
| country         | String          | Geo-lookup from IP (GeoLite2)      |
| country_code    | String          | ISO 3166-1 alpha-2 code            |
| city            | String          | Geo city                           |
| region          | String          | Geo region/state                   |
| device_type     | String          | mobile / desktop / tablet / bot    |
| browser         | String          | Chrome / Firefox / Safari / Edge   |
| browser_version | String          | Major version number               |
| os              | String          | Windows / macOS / Android / iOS    |
| os_version      | String          | OS version                         |
| is_unique       | Boolean         | First click from this IP on URL    |
| created_at      | DateTime        | DB indexed for time-series queries |

---

## 🔐 Authentication Flow

```
POST Register  → { accessToken (15 min), refreshToken (7 days) }
POST Login     → { accessToken (15 min), refreshToken (7 days) }
                         ↓
    All API requests → Header: Authorization: Bearer <accessToken>
                         ↓
POST RefreshToken  → New accessToken using valid refreshToken (rotation)
POST Logout        → Revokes refreshToken in DB (all sessions clearable)
```

- Access tokens: **15-minute** lifespan (stateless JWT)
- Refresh tokens: **7-day** lifespan, stored as bcrypt hash in Neon DB
- Token rotation: every refresh issues a new refresh token and revokes the old one
- Admin deactivation: immediately revokes all user sessions

---

## ✅ URL Validation — 6 Layers

### Layer 1 — Format Validation (instant, no network)
- Valid URL format (`urllib.parse` + regex)
- Allowed schemes: `http://`, `https://` only — blocks `javascript://`, `ftp://`, etc.
- Max URL length: 2048 characters
- No localhost or private IPs (`127.x`, `192.168.x`, `10.x`, `172.16-31.x`) — **SSRF protection**
- No raw IP-only URLs — must have a valid domain
- Unicode / IDN domain normalization

### Layer 2 — DNS Resolution (network)
- Domain must resolve via DNS (A/AAAA record must exist)
- Dead/non-existent domains are rejected

### Layer 3 — HTTP Reachability (network)
- Sends `HEAD` request (5s timeout), fallback to `GET`
- Follows up to 5 redirects
- Records final `url_status_code` and `is_url_reachable` flag
- Updates `last_checked_at` timestamp

### Layer 4 — Safety & Blacklist Check (network)
- Google Safe Browsing API → detects phishing, malware, unwanted software
- Internal custom blocklist of known bad TLDs and domains
- Sets `is_flagged = True` + `flag_reason` if unsafe

### Layer 5 — Slug Validation
- Slugs must be unique in DB
- Reserved words blocked: `api`, `admin`, `login`, `register`, `dashboard`, `graphql`, `static`, `health`, `redirect`, `me`, `link`, `analytics`, etc.
- Allowed characters: `a-z`, `0-9`, `-`, `_`
- Length: min 3 chars, max 50 chars

### Layer 6 — Business Rules
- Duplicate URL detection (warns if user already shortened this URL)
- Rate limiting: max URLs per user per hour/day
- `expires_at` must be in the future
- `activates_at` must be before `expires_at` if both set
- `max_clicks` must be a positive integer
- Private URL passwords must meet minimum length requirements

---

## 🔄 Redirect Flow — 12 Steps

When a user visits `http://localhost:8000/{slug}`:

```
1.  Lookup slug in DB                     → 302 to /link/not-found if missing
2.  Check is_active                       → 302 to /link/inactive
3.  Check activates_at                    → 302 to /link/not-yet-active
4.  Check expires_at                      → 302 to /link/expired
5.  Check click_count vs max_clicks       → 302 to /link/limit-reached
6.  Check is_private                      → 302 to /link/protected?slug=...
7.  Verify password (bcrypt compare)      → 302 to /link/protected?error=... if wrong
8.  Check is_single_use                   → Mark used, block future access
9.  Evaluate redirect_rules (JSON)        → Dynamic redirect by device/time/geo
10. Log Click (async daemon thread)       → IP, device, country, is_unique, referrer
11. Increment click_count (atomic F())    → Never misses a count
12. Fire webhook (async daemon thread)    → POST JSON payload to webhook_url
13. HTTP 301 Redirect                     → original_url (or dynamic redirect target)
```

**Key design:** Steps 10, 11, 12 run in a daemon thread — the 301 response returns **instantly** without waiting.

### Password Verification (Private Links)
```
POST /{slug}/verify   Body: { "password": "..." }
→ { "success": true, "redirect_url": "https://..." }
→ { "success": false, "error": "Incorrect password." }
```

---

## 🧩 GraphQL API Reference

**Endpoint:** `POST /graphql/`  
**Headers:** `Authorization: Bearer <accessToken>` (for authenticated queries)

### 🔑 Auth Mutations
```graphql
mutation {
  register(email: "user@example.com", username: "alice", password: "secure123") {
    accessToken
    refreshToken
    user { id email username }
  }
}

mutation {
  login(email: "user@example.com", password: "secure123") {
    accessToken refreshToken
  }
}

mutation {
  refreshToken(refreshToken: "...") { accessToken refreshToken }
}

mutation {
  logout(refreshToken: "...") { success message }
}
```

### 👤 User Queries
```graphql
query {
  me { id email username isAdmin isActive createdAt }
}
```

### 🔗 URL Mutations
```graphql
mutation {
  createShortUrl(
    originalUrl: "https://example.com/very/long/url"
    slug: "my-custom-alias"          # optional
    title: "My Link"                  # optional
    isPrivate: false
    password: "secret"               # if isPrivate = true
    expiresAt: "2026-12-31T00:00:00Z"
    activatesAt: "2026-01-01T00:00:00Z"
    maxClicks: 1000
    isSingleUse: false
    webhookUrl: "https://hooks.example.com/endpoint"
    redirectRules: "[{\"condition\":\"device=mobile\",\"target\":\"https://m.example.com\"}]"
  ) {
    id slug shortUrl qrCode createdAt
  }
}

mutation { updateShortUrl(id: "uuid", title: "Updated", isActive: false) { id slug } }
mutation { deleteShortUrl(id: "uuid") { success message } }
```

### 🔗 URL Queries
```graphql
query { myUrls(page: 1, limit: 20) { urls { id slug originalUrl clickCount } total } }
query { getUrl(id: "uuid") { slug originalUrl clickCount isActive expiresAt } }
query { resolveSlug(slug: "abc", password: "secret") { redirectUrl requiresPassword } }
```

### 📊 Analytics Queries
```graphql
query {
  getAnalytics(urlId: "uuid", startDate: "2026-01-01", endDate: "2026-12-31") {
    totalClicks
    uniqueClicks
    clicksByDevice  { deviceType count }
    clicksByCountry { country countryCode count }
    clicksByBrowser { browser count }
    clicksByOs      { os count }
    clicksByDate    { date count }
    clicksByReferrer { referrer count }
  }
}

query { clickHistory(urlId: "uuid", page: 1, limit: 20) { clicks { id ipAddress country deviceType createdAt } total } }
query { myAnalytics { totalUrls totalClicks uniqueClicks topUrls { slug clickCount } } }
```

### 🛡️ Admin Queries (admin only)
```graphql
query {
  platformStats {
    totalUsers activeUsers newUsersToday
    totalUrls activeUrls flaggedUrls newUrlsToday
    totalClicks clicksToday clicksThisWeek clicksThisMonth
  }
}
query { allUsers(page: 1, limit: 20, search: "alice", isActive: true) { users { id email isAdmin } total } }
query { userDetail(userId: "uuid") { user { email } urlCount totalClicks } }
query { allUrls(page: 1, flaggedOnly: true, search: "spam") { urls { slug isActive isFlagged } total } }
```

### 🛡️ Admin Mutations (admin only)
```graphql
mutation { activateUser(userId: "uuid") { id isActive } }
mutation { deactivateUser(userId: "uuid") { id isActive } }
mutation { makeAdmin(userId: "uuid") { id isAdmin } }
mutation { removeAdmin(userId: "uuid") { id isAdmin } }
mutation { adminDeleteUser(userId: "uuid") { success message } }

mutation { flagUrl(urlId: "uuid", reason: "PHISHING") { id isFlagged } }
mutation { unflagUrl(urlId: "uuid") { id isFlagged } }
mutation { adminActivateUrl(urlId: "uuid") { id isActive } }
mutation { adminDeactivateUrl(urlId: "uuid") { id isActive } }
mutation { adminDeleteUrl(urlId: "uuid") { success message } }
```

### 🤖 AI Queries (Gemini — requires GEMINI_API_KEY)
```graphql
# Get creative slug suggestions for a URL
query {
  suggestSlugs(url: "https://github.com/tensorflow/tensorflow", count: 5) {
    slug
    reason
  }
}

# Auto-generate title + description from URL structure
query {
  generateUrlMetadata(url: "https://stripe.com/docs/payments") {
    title
    description
  }
}

# Get smart dynamic redirect rule suggestions
query {
  suggestRedirectRules(url: "https://twitter.com/profile") {
    condition
    targetUrl
    description
  }
}
```

---

## 🌍 Environment Variables

```env
# ── Django Core ──────────────────────────────
SECRET_KEY=your-super-secret-django-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# ── Database — Neon PostgreSQL ───────────────
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require

# ── JWT Authentication ────────────────────────
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7

# ── URL Safety ────────────────────────────────
GOOGLE_SAFE_BROWSING_API_KEY=your-api-key

# ── AI — Google Gemini ────────────────────────
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash          # or gemini-1.5-pro for smarter responses

# ── GeoIP (Optional) ─────────────────────────
# Download GeoLite2-City.mmdb from MaxMind
GEOIP2_DATABASE_PATH=/path/to/GeoLite2-City.mmdb

# ── Application URLs ──────────────────────────
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# ── Media & Storage ───────────────────────────
QR_CODE_STORAGE_PATH=media/qr_codes/

# ── CORS ──────────────────────────────────────
CORS_ALLOWED_ORIGINS=http://localhost:3000

# ── Rate Limiting ─────────────────────────────
MAX_URLS_PER_HOUR=50
MAX_URLS_PER_DAY=200
```

---

## 📦 Backend Folder Structure

```
backend/
├── manage.py
├── requirements.txt
├── .env                   ← copy from .env.example + fill in secrets
├── .env.example           ← template with all variables documented
│
├── config/
│   ├── settings.py        ← DB, JWT, GraphQL, CORS, GeoIP, Gemini settings
│   ├── urls.py            ← /graphql + /{slug} redirect + /{slug}/verify
│   └── wsgi.py
│
├── apps/
│   ├── users/
│   │   ├── models.py      ← CustomUser (UUID PK, bcrypt), RefreshToken
│   │   ├── repository.py  ← create, get_by_email/id, activate, revoke_tokens
│   │   ├── services.py    ← register, login, JWT gen, refresh rotation, logout
│   │   └── graphql/
│   │       ├── types.py   ← UserType, AuthPayloadType, MessageType
│   │       ├── queries.py ← me
│   │       └── mutations.py ← Register, Login, RefreshToken, Logout
│   │
│   ├── links/
│   │   ├── models.py      ← ShortURL (18 fields, 4 DB indexes)
│   │   ├── repository.py  ← CRUD + atomic click counter + flag/unflag
│   │   ├── services.py    ← 6-layer validation + create/resolve/update/delete
│   │   ├── utils.py       ← slug generator (collision-safe) + QR code
│   │   ├── views.py       ← ShortURLRedirectView + VerifyURLPasswordView
│   │   └── graphql/
│   │       ├── types.py   ← ShortURLType, PaginatedURLsType, ResolveSlugPayloadType
│   │       ├── queries.py ← myUrls, getUrl, resolveSlug
│   │       └── mutations.py ← CreateShortUrl, UpdateShortUrl, DeleteShortUrl
│   │
│   ├── analytics/
│   │   ├── models.py      ← Click (18 fields, 6 DB indexes)
│   │   ├── repository.py  ← log_click, uniqueness check, 7 aggregations, pagination
│   │   ├── services.py    ← log_click_event (IP/UA/geo parsing), analytics summaries
│   │   └── graphql/
│   │       ├── types.py   ← ClickType, 6 breakdown types, AnalyticsSummaryType
│   │       └── queries.py ← getAnalytics, clickHistory, myAnalytics
│   │
│   ├── admin_panel/
│   │   ├── services.py    ← platformStats, user CRUD, URL flag/unflag/delete
│   │   └── graphql/
│   │       ├── types.py   ← PlatformStatsType, PaginatedUsersType, UserDetailType
│   │       ├── queries.py ← platformStats, allUsers, userDetail, allUrls
│   │       └── mutations.py ← 5 user mutations + 5 URL mutations
│   │
│   └── ai_integration/
│       ├── services.py    ← Gemini client (lazy init), 3 features, JSON parsing
│       └── graphql/
│           ├── types.py   ← SlugSuggestionType, URLMetadataType, RedirectRuleSuggestionType
│           └── queries.py ← suggestSlugs, generateUrlMetadata, suggestRedirectRules
│
├── shared/
│   ├── constants.py       ← All app-wide constants (slugs, JWT, QR, rate limits)
│   ├── exceptions.py      ← 20+ custom exceptions (all extend GraphQLError)
│   ├── middlewares.py     ← JWTAuthMiddleware → attaches user to GraphQL context
│   └── decorators.py      ← @login_required, @admin_required, @owner_required
│
└── schema.py              ← Root GraphQL schema (all 5 apps merged)
```

---

## 🔒 Security Highlights

| Feature | Implementation |
|---|---|
| Passwords | **bcrypt** hashed (user accounts + private URL passwords) |
| JWT Access Tokens | **15-minute** expiry — stateless |
| JWT Refresh Tokens | **7-day** expiry, stored **hashed** in DB, revocable |
| Token Rotation | Every refresh issues a new refresh token |
| SSRF Protection | Private IPs and localhost blocked at validation layer |
| Rate Limiting | Max URLs per user per hour/day (configurable) |
| URL Safety | Google Safe Browsing API blocks malicious URLs |
| Admin Deactivation | Immediately revokes all user refresh tokens |
| CSRF | Redirect endpoint uses `csrf_exempt` (stateless JSON API) |
| SQL Injection | Django ORM — parameterized queries by default |

---

## 📊 Performance Design

| Concern | Solution |
|---|---|
| Redirect speed | Plain Django view (not GraphQL), single DB lookup |
| Click logging | Async daemon thread — never blocks the 301 response  |
| Click counting | Atomic `F()` expression — no race conditions |
| Analytics queries | 6 DB indexes on the Click table for fast aggregations |
| URL lookup | Indexed `slug` column — O(1) lookup |
| Connection pooling | Neon with `conn_max_age=600` (persistent connections) |
| Gemini API | Lazy client init — no crash on startup without key |
| Webhook firing | Async daemon thread — never blocks redirects |

---

## 🏗️ Build Status

| Step | What Was Built                                          | Status     |
|------|---------------------------------------------------------|------------|
| 1    | Project foundation — settings, config, WSGI             | ✅ Done    |
| 2    | Shared layer — constants, exceptions, middleware         | ✅ Done    |
| 3    | Users app — models, services, repository, GraphQL        | ✅ Done    |
| 4    | URLs app — models, 6-layer validation, redirect service  | ✅ Done    |
| 5    | Analytics app — Click model, aggregations, GraphQL       | ✅ Done    |
| 6    | Redirect endpoint — Django view for /{slug}             | ✅ Done    |
| 7    | Admin panel — platform stats, user/URL management        | ✅ Done    |
| 8    | AI integration — Gemini slug/metadata/rules             | ✅ Done    |
| 9    | Migrations applied to Neon PostgreSQL                   | ✅ Live    |
| 10   | Frontend — Next.js App Router                           | 🔜 Next   |

---

## 📝 Notes

- The redirect endpoint (`/{slug}`) is a **plain Django view** — not GraphQL — for maximum speed
- Click logging, count increment, and webhook firing all run in **async daemon threads**
- The `click_count` on `ShortURL` is a **denormalized atomic counter** for instant reads
- GeoIP lookup is **optional** — analytics still work without the MaxMind database
- Gemini AI features **gracefully return empty results** if no API key is configured — they are enhancements, not infrastructure
- Google OAuth login can be added later without touching existing auth code
