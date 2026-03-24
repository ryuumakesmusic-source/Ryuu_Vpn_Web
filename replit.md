# RYUU VPN — Monorepo

## Overview

Full-stack VPN subscription service for Myanmar users. Dark cyberpunk-themed React/Vite frontend, Express 5 backend, PostgreSQL (Drizzle ORM), Remnawave VPN panel integration, and Telegram bots for admin notifications and Mini App.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: v24
- **Package manager**: pnpm v10
- **TypeScript**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind + Framer Motion
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Security**: helmet (CSP headers), express-rate-limit, input validation

## Structure

```
├── artifacts/
│   ├── ryuu-vpn/           # React/Vite frontend (port 26090 dev)
│   └── api-server/         # Express 5 API server (port 8080)
├── lib/
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── api-spec/           # OpenAPI spec + Orval codegen
│   ├── api-client-react/   # Generated React Query hooks
│   └── api-zod/            # Generated Zod schemas
├── scripts/                # Utility scripts
└── pnpm-workspace.yaml
```

## Environment Variables (Required on VPS)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | JWT signing secret |
| `REMNAWAVE_URL` | Remnawave panel base URL |
| `REMNAWAVE_API_KEY` | Remnawave API key |
| `TELEGRAM_BOT_TOKEN` | **Notification bot** token — sends payment alerts to admins |
| `TELEGRAM_ADMIN_CHAT_IDS` | Comma-separated Telegram chat IDs for admin notifications |
| `MINI_BOT_TOKEN` | **Mini App bot** token — handles /start command, sends Mini App button |
| `MINI_APP_URL` | Full URL of the app (e.g. https://ryuukakkoii.site) |
| `BOT_WEBHOOK_SECRET` | Optional secret for Telegram webhook verification |

> `REMNAWAVE_*` vars are read lazily (per-call), so the server starts even if they're missing — useful in dev.

## Setting Up the Mini App Bot Webhook (on VPS)

After deploying, register the webhook once:
```bash
curl -X POST https://api.telegram.org/bot<MINI_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ryuukakkoii.site/api/bot/webhook","secret_token":"<BOT_WEBHOOK_SECRET>"}'
```

## API Routes

### Auth (`/api/auth`)
- `POST /register` — create account (rate limited: 5/hour per IP)
- `POST /login` — login (rate limited: 10/15min per IP, blocks on failures only)
- `GET /me` — current user info

### Dashboard (`/api/dashboard`)
- `GET /stats` — VPN stats, data usage, balance
- `GET /subscription` — subscription URL
- `GET /plans` — available plans
- `GET /purchase-status` — monthly purchase count and limits
- `POST /buy-plan` — buy a plan (deducts balance, activates on Remnawave)
- `POST /gift-plan` — gift a plan to another user

### Top-Up (`/api/topup`)
- `POST /request` — submit top-up with screenshot (sends photo to admin Telegram)
- `GET /my` — user's own top-up history (status only, no screenshot data)

### Admin (`/api/admin`) — requires admin JWT
- `GET /topups` — list all top-ups (no screenshot data in list)
- `GET /topups/:id/screenshot` — lazy-load screenshot for a specific top-up
- `POST /topups/:id/approve` — approve + credit balance + notify admin channel
- `POST /topups/:id/reject` — reject + notify admin channel
- `GET /users` — list all users
- `POST /users/:id/set-admin` — promote/demote admin (cannot self-demote)
- `POST /users/:id/set-balance` — set balance directly

### Bot (`/api/bot`)
- `POST /webhook` — Telegram webhook handler for Mini App bot (/start, /help)

## Security Features

- **Helmet**: CSP, X-Frame-Options, X-Content-Type-Options, and more on all responses
- **Rate limiting**: Login (10 fails/15min), Register (5/hour) per IP
- **Timing-safe login**: dummy bcrypt hash computed for missing users to prevent user enumeration
- **Input length caps**: username 32 chars, password 128 chars
- **Password strength**: bcrypt cost factor 12
- **Admin self-protection**: admin cannot demote themselves
- **Separate bot tokens**: NOTI_BOT_TOKEN (admin alerts) vs MINI_BOT_TOKEN (user Mini App)
- **Screenshot lazy-load**: screenshots not sent in list API, fetched on-demand per item
- **JSON body limit**: 1MB (multipart/form-data files handled separately by multer)

## Business Rules

- Max 2 plan purchases per user per calendar month
- No downgrade: Premium/Ultra users cannot buy Starter
- No self-gifting
- Recipient inherits the downgrade restriction when gifted to
- Admin-seeded users: `ryuu` (ryuu123) and `sayuri` (sayuri123) on every cold start (idempotent)

## Plans

| ID | Name | Data | Validity | Price |
|---|---|---|---|---|
| starter | Starter Plan | 50 GB | 30 days | 3,000 Ks |
| premium | Premium Value | 120 GB | 30 days | 5,000 Ks |
| ultra | Ultra Pro | 250 GB | 30 days | 10,000 Ks |

## Payment Methods

- KBZ Pay / AYA Pay: 09954901109 (Saw Pyae Sone Oo)
- Wave Pay / KBZ Pay / AYA Pay: 09965172570 (Hnin Ei Lwin Kyaw)
- CB Pay: Fn 0027600500030392 (U Saw Pyae Sone Oo)

## Deployment (VPS via Docker Compose)

```bash
docker compose up -d --build
```

The Dockerfile builds: pnpm install → frontend vite build → API esbuild bundle. The API server serves the built frontend as static files in production.

## Development

```bash
pnpm install
pnpm --filter @workspace/db run push          # Sync DB schema
# Start workflows: "artifacts/api-server: API Server" and "artifacts/ryuu-vpn: web"
```
