# 🔗 URL Shortener — Frontend

Modern, production-grade Next.js frontend for the URL shortening service. Built with a MAANG-level design philosophy — clean, precise, and data-dense — inspired by Linear, Vercel, and Stripe.

> **Backend:** Django + GraphQL (Neon PostgreSQL) — `backend/` ✅ Complete  
> **Frontend:** Next.js 15 App Router — `frontend/` 🔨 In Progress

---

## 🚀 Quick Start

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8000/graphql/

# Start development server
npm run dev
```

**Frontend:** http://localhost:3000  
**Backend (GraphQL):** http://localhost:8000/graphql/

---

## 🛠️ Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| **Next.js** | 15+ | Framework — App Router, SSR, routing |
| **TypeScript** | 5+ | Type safety throughout |
| **Tailwind CSS** | 3+ | Utility-first styling (shadcn requirement) |
| **shadcn/ui** | latest | Component library (Radix UI primitives) |
| **Apollo Client** | 3+ | GraphQL queries, mutations, caching |
| **React Hook Form** | 7+ | Form state management |
| **Zod** | 3+ | Schema validation |
| **Recharts** | 2+ | Analytics charts (via shadcn Chart) |
| **next-themes** | latest | Dark/light mode |
| **Lucide React** | latest | Icon set (shadcn default) |
| **Sonner** | latest | Toast notifications |
| **Geist Font** | — | Vercel's clean, modern typeface |

---

## 🎨 Design System

### Colors (Dark Mode First)
```
Background:   zinc-950  (#09090b)
Surface:      zinc-900  (#18181b)
Border:       zinc-800  (#27272a)
Muted text:   zinc-400  (#a1a1aa)
Primary text: zinc-50   (#fafafa)
Accent:       violet-600 → indigo-500 (gradient)
Success:      emerald-500
Danger:       red-500
```

### Design Principles (MAANG-Level)
- **Precision over decoration** — no gratuitous visual effects
- **Information density** — compact but never crowded (inspired by Linear)
- **One primary CTA per screen** — clear visual hierarchy
- **Skeleton loaders everywhere** — never show empty states abruptly
- **Responsive first** — sidebar collapses to bottom nav on mobile
- **Dark-first** — light mode is supported but dark is the default

### Typography
- **Headings:** Geist Sans — bold, tight tracking
- **Body:** Geist Sans — regular weight, relaxed
- **Slugs/Code:** Geist Mono — distinct, readable

---

## 📄 Pages

### Public Pages
| Route | Description |
|---|---|
| `/` | Landing — hero, live demo, features, how it works |
| `/login` | Login form with Zod validation |
| `/register` | Register form |
| `/link/protected` | Password gate for private links |
| `/link/[type]` | Error pages: `expired`, `not-found`, `inactive`, `limit-reached`, `used` |

### Dashboard Pages (Auth Required)
| Route | Description |
|---|---|
| `/dashboard` | Overview — stat cards + clicks chart + recent links |
| `/links` | All links — searchable, sortable data table |
| `/links/new` | Create short URL with AI slug suggestions |
| `/links/[id]` | Link detail + full analytics charts |
| `/analytics` | Cross-link analytics overview |
| `/settings` | Account settings + password change |

### Admin Pages (Admin Role Required)
| Route | Description |
|---|---|
| `/admin` | Platform stats dashboard |
| `/admin/users` | User management — activate, promote, delete |
| `/admin/urls` | URL management — flag, unflag, deactivate |

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                    # Root — Geist font, ThemeProvider, Apollo
│   ├── globals.css                   # Tailwind + CSS design tokens
│   │
│   ├── (marketing)/                  # Public route group (no shell)
│   │   ├── page.tsx                  # Landing page
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (app)/                        # Auth-protected route group
│   │   ├── layout.tsx                # Sidebar + Topbar shell
│   │   ├── dashboard/page.tsx        # Overview
│   │   ├── links/
│   │   │   ├── page.tsx              # Links table
│   │   │   ├── new/page.tsx          # Create form
│   │   │   └── [id]/page.tsx         # Link detail + analytics
│   │   ├── analytics/page.tsx
│   │   ├── settings/page.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── users/page.tsx
│   │       └── urls/page.tsx
│   │
│   └── link/                         # Public link error/gate pages
│       ├── protected/page.tsx
│       └── [type]/page.tsx
│
├── components/
│   ├── ui/                           # shadcn components (auto-generated)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── MobileNav.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthGuard.tsx
│   ├── links/
│   │   ├── LinkCard.tsx
│   │   ├── LinksTable.tsx
│   │   ├── CreateLinkForm.tsx
│   │   ├── EditLinkSheet.tsx
│   │   ├── DeleteLinkDialog.tsx
│   │   ├── QRCodeModal.tsx
│   │   └── SlugSuggestions.tsx
│   ├── analytics/
│   │   ├── StatCard.tsx
│   │   ├── ClicksChart.tsx
│   │   ├── DeviceChart.tsx
│   │   ├── CountryChart.tsx
│   │   ├── BrowserChart.tsx
│   │   └── ReferrerTable.tsx
│   └── admin/
│       ├── PlatformStats.tsx
│       ├── UsersTable.tsx
│       └── UrlsTable.tsx
│
├── lib/
│   ├── apollo.ts                     # Apollo Client setup (auth headers)
│   ├── auth.ts                       # JWT decode + localStorage helpers
│   ├── utils.ts                      # cn(), formatDate(), formatNumber()
│   └── graphql/
│       ├── queries.ts                # All GraphQL query strings
│       └── mutations.ts              # All GraphQL mutation strings
│
├── hooks/
│   ├── useAuth.ts                    # Auth state + login/logout
│   ├── useLinks.ts                   # Link CRUD
│   ├── useAnalytics.ts               # Analytics queries
│   └── useCopyToClipboard.ts
│
├── context/
│   └── AuthContext.tsx               # Global JWT auth state
│
├── types/
│   └── index.ts                      # All TypeScript interfaces
│
├── .env.example
├── .env.local                        # gitignored
├── next.config.ts
├── tailwind.config.ts
└── components.json                   # shadcn config
```

---

## 🧩 Components (shadcn/ui)

### Core UI (shadcn)
`Button` · `Input` · `Label` · `Textarea` · `Badge` · `Card`  
`Table` · `Dialog` · `Sheet` · `Tabs` · `Select` · `Switch`  
`DropdownMenu` · `Tooltip` · `Avatar` · `Separator` · `Progress`  
`Skeleton` · `Alert` · `Form` · `Command` · `Popover`

### Custom Charts (shadcn/chart via Recharts)
- `ClicksChart` — Time-series line chart (30-day clicks)
- `DeviceChart` — Donut chart (mobile/desktop/tablet/bot)
- `CountryChart` — Horizontal bar chart (top 10 countries)
- `BrowserChart` — Horizontal bar chart (browser breakdown)

### Custom Components
- `StatCard` — Animated count-up metric card with trend indicator
- `LinkCard` — Compact link row with copy, QR, edit, delete actions
- `SlugSuggestions` — Gemini AI suggestion chips inline in create form
- `QRCodeModal` — QR display + one-click download
- `AuthGuard` — HOC that redirects unauthenticated users to `/login`

---

## 🔌 GraphQL Integration

All data fetching goes through Apollo Client talking to the Django backend.

```typescript
// lib/apollo.ts
const httpLink = new HttpLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_URL });

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('accessToken');
  operation.setContext({
    headers: { authorization: token ? `Bearer ${token}` : '' }
  });
  return forward(operation);
});
```

### Auth Flow
```
Register/Login → { accessToken, refreshToken }
    ↓
accessToken   → localStorage (15 min lifespan)
refreshToken  → httpOnly cookie via API route (7 days)
    ↓
Apollo authLink → injects Bearer token on every request
    ↓
Token expired → useAuth hook auto-refreshes via refreshToken mutation
```

---

## 🌍 Environment Variables

```env
# Backend GraphQL endpoint
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8000/graphql/

# Backend base URL (for redirect constructs)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## 🏗️ Build Status

| Step | What Gets Built | Status |
|---|---|---|
| 1 | Next.js init, Tailwind, shadcn, Apollo, Geist font | 🔨 Now |
| 2 | Design tokens, globals.css, TypeScript types | ⏳ |
| 3 | Auth context, JWT helpers, all GraphQL operations | ⏳ |
| 4 | Login + Register pages | ⏳ |
| 5 | Dashboard shell: Sidebar + Topbar + route protection | ⏳ |
| 6 | Landing page | ⏳ |
| 7 | Dashboard overview | ⏳ |
| 8 | Links: list, create (+ AI), detail | ⏳ |
| 9 | Analytics charts | ⏳ |
| 10 | Settings page | ⏳ |
| 11 | Admin pages | ⏳ |
| 12 | Public link pages (password gate + error pages) | ⏳ |
| 13 | Polish: skeletons, responsive, animations | ⏳ |

---

## 🔒 Security Notes

- Access tokens stored in `localStorage` with 15-minute expiry
- Refresh tokens stored in `httpOnly` cookies via Next.js API route
- All authenticated routes wrapped in `AuthGuard` — redirects to `/login`
- Admin routes check `user.isAdmin` — non-admins get 403 redirect
- Password inputs never logged or stored in component state after submit
