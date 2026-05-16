<h1 align="center">🔗 AI-Powered URL Shortener</h1>

<h3 align="center">
Production-Ready URL Management Platform
</h3>

<p align="center">
A full-stack URL shortening platform built with Django, GraphQL, PostgreSQL, and Next.js, featuring secure redirects, advanced analytics, QR generation, private links, and AI-assisted slug suggestions.
</p>

<p align="center">
  <strong>Backend:</strong> ✅ Stable &nbsp;|&nbsp;
  <strong>Frontend:</strong> 🚧 In Progress
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Django_5-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white" alt="GraphQL" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/JWTAuth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-graphql-api">GraphQL API</a>
</p>

---

# 📌 Overview

This project is a production-focused URL shortening platform designed around fast redirects, secure link management, and analytics-driven insights.

The backend is built with Django and GraphQL for structured API development, while PostgreSQL powers scalable analytics and click tracking. AI-powered slug suggestions and metadata generation are integrated using Google Gemini.

Core capabilities include:

- Custom short links
- QR code generation
- Password-protected URLs
- Geo-based analytics
- AI-generated slug suggestions
- Dynamic redirect rules
- JWT authentication

---

# 🚀 Features

## 🔐 Authentication & Security

- JWT access & refresh tokens
- Refresh token rotation
- Password-protected URLs
- SSRF protection
- Safe Browsing URL validation
- Rate limiting & abuse prevention

---

## 🔗 URL Management

- Custom aliases
- Expiration-based links
- Single-use URLs
- Dynamic redirect rules
- QR code generation
- Private & public links

---

## 📊 Analytics

- Unique click tracking
- Country & city analytics
- Browser & OS detection
- Device analytics
- Click history aggregation
- Real-time redirect statistics

---

## 🤖 AI Features

- AI-generated slug suggestions
- Automatic metadata generation
- Smart alias recommendations
- Content-aware URL naming

---

# 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, TailwindCSS, Shadcn/UI |
| Backend | Django 5, Graphene GraphQL |
| Database | PostgreSQL (Neon) |
| Authentication | JWT |
| AI Integration | Google Gemini |
| Analytics | MaxMind GeoLite2 |
| Security | Google Safe Browsing API |

---

# 🏗️ System Architecture

```text
Client Application
        │
        ▼
 Next.js Frontend
        │
 GraphQL API / JWT
        │
        ▼
 Django Backend
        │
 ┌──────┼──────────┬──────────┐
 ▼      ▼          ▼          ▼
PostgreSQL Gemini  GeoLite2  Safe Browsing
```

---

# ⚡ Engineering Highlights

- Optimized redirect pipeline
- Atomic click counting using Django F() expressions
- Async analytics logging
- Composite database indexing
- Collision-safe slug generation
- Structured GraphQL schema design
- Modular Django app architecture

---

# 🔄 Redirect Pipeline

The redirect endpoint is implemented as a dedicated Django view for minimal latency and efficient request handling.

### Redirect Flow

```text
1. Validate slug
2. Verify link availability
3. Check expiration & click limits
4. Validate private access
5. Apply redirect rules
6. Track analytics asynchronously
7. Increment click counters atomically
8. Return HTTP redirect response
```

---

# 🔒 Security Features

- bcrypt password hashing
- JWT token rotation
- SSRF mitigation
- Private IP blocking
- URL reputation checks
- Protected private links
- Rate limiting middleware

---

# 📈 Performance Optimizations

- Async analytics processing
- Optimized PostgreSQL indexing
- Atomic database updates
- Lightweight redirect views
- Aggregated analytics queries
- Connection pooling via Neon

---

# 🏁 Quick Start

## Prerequisites

- Python 3.10+
- PostgreSQL database
- Node.js

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/shorten-url.git

cd shorten-url
```

---

## 2️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate environment
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## 3️⃣ Configure Environment Variables

Create `.env` inside the backend directory.

```env
SECRET_KEY=your-secret-key

DATABASE_URL=postgresql://user:password@host/dbname

JWT_SECRET_KEY=your-jwt-secret

JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7

GEMINI_API_KEY=your-gemini-api-key

GOOGLE_SAFE_BROWSING_API_KEY=your-safe-browsing-key

BASE_URL=http://localhost:8000

FRONTEND_URL=http://localhost:3000
```

---

## 4️⃣ Run Database Migrations

```bash
python manage.py makemigrations

python manage.py migrate
```

---

## 5️⃣ Start Development Server

```bash
python manage.py runserver
```

### Local URLs

| Service | URL |
|---|---|
| Backend API | `http://localhost:8000/graphql/` |
| Redirect Endpoint | `http://localhost:8000/{slug}` |
| Frontend | `http://localhost:3000` |

---

# 📡 GraphQL API

## Authentication

### Login Mutation

```graphql
mutation {
  login(
    email: "user@example.com",
    password: "secure123"
  ) {
    accessToken
    refreshToken
  }
}
```

---

## Create Short URL

```graphql
mutation {
  createShortUrl(
    originalUrl: "https://example.com"
    slug: "custom-link"
    isPrivate: false
  ) {
    id
    slug
    shortUrl
    qrCode
  }
}
```

---

## Analytics Query

```graphql
query {
  getAnalytics(urlId: "uuid") {
    totalClicks
    uniqueClicks

    clicksByCountry {
      country
      count
    }
  }
}
```

---

# 📂 Project Structure

```bash
shorten_url/
│
├── backend/
│   ├── apps/
│   │   ├── users/
│   │   ├── links/
│   │   ├── analytics/
│   │   ├── admin_panel/
│   │   └── ai_integration/
│   │
│   ├── shared/
│   ├── config/
│   └── schema.py
│
├── frontend/
│
└── README.md
```

---

# 🚀 Deployment Stack

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway / Render |
| Database | Neon PostgreSQL |
| AI Layer | Google Gemini |
| Analytics DB | PostgreSQL |

---

# 📸 Screenshots

<p align="center">
  <img src="./screenshot/dashboard.png" alt="Frontend Dashboard" width="100%" />
</p>

---

# 🧪 Future Improvements

- Redis caching layer
- Celery background jobs
- WebSocket-based live analytics
- Team collaboration support
- API rate limiting dashboard
- Multi-region deployments

---

# 📝 License

Released under the MIT License.