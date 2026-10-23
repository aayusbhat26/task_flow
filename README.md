# TaskFlow

A chat-native work OS: tasks, notes, mind maps, focus sessions, and real-time team collaboration in one workspace.

**Live demo:** [taskflow-render.onrender.com](https://taskflow-render.onrender.com/en)

The demo runs on Render Free + Neon PostgreSQL. The free instance may take a few seconds to wake after idle periods.

## What it is

TaskFlow treats chat as the workspace instead of a separate app. Channels carry messages, threads, polls, task cards, and a rolling channel brief, while tasks, notes, mind maps, focus sessions, and DSA practice sit alongside them.

## Features

**Plan and think**

- Rich-text tasks with tags, priorities, due dates, and assignments
- Notes with autosave and a markdown preview
- Mind maps with a shared canvas
- Calendar view for tasks and deadlines
- Pomodoro timer with rounds, breaks, and history

**Work together**

- Workspaces with role-based access: owner, admin, editor, viewer
- Invite links and member management
- Real-time chat with channels, threads, reactions, typing indicators, presence, pinned messages, and read state
- WebRTC call signaling for workspace calls
- Points, levels, streaks, leaderboard, and achievements

**Chat-native tools**

- Slash commands: `/poll`, `/task`, `/brief`, `/dsa`, `/help`
- Live polls with single or multiple choice, anonymous voting, and close times
- Task cards that create real tasks, notifications, and assignees
- Channel brief with pinned decisions, active threads, deadlines, and recent files

**DSA practice**

- DSA question bank with topics, difficulty, tags, and company data
- Co-working rooms with shared timers, participants, solve/end flows, and tracked active minutes
- Complete room history with attendance and time per participant
- Progress tracking, notes, ratings, and points for solved questions

**Accounts and billing**

- Credentials sign-in plus Google and GitHub OAuth
- Verified-email account linking: one account can use both providers
- OAuth-only accounts can set an email password from Settings
- Prepaid plans (Pro, Business) with Razorpay checkout and a built-in test gateway for local development

## Tech stack

| Layer | Technology |
| --- | --- |
| Web | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| i18n | next-intl (English, Telugu) |
| Database | PostgreSQL 16, Prisma ORM 5.22 (62 models) |
| Auth | NextAuth v4, Express auth service, JWT, bcrypt |
| Realtime | Socket.IO 4 |
| Billing | Razorpay (orders, signature verification, webhooks) |
| Deployment | Docker, Render Free, Neon PostgreSQL |

## Architecture

Development runs three processes over one database:

```
Next.js web      :3000  ─┐
Express auth     :3003  ─┼──  PostgreSQL :5432
Socket.IO server :3002  ─┘
```

Production uses a single Docker container because Render's free tier shares 750 instance hours and 512 MB of memory:

```
Render :$PORT
  └── Node reverse proxy
        ├── /socket.io/*  -> Socket.IO  :3002
        └── everything    -> Next.js    :3000
                             Express auth :3003 (internal)
Startup: Prisma migrations, then curated DSA seed if the table is empty
```

The three services are a process split, not independently deployable microservices.

## Getting started

### Requirements

- Node.js 20+
- PostgreSQL 16+
- npm

### Install

```bash
git clone https://github.com/aayusbhat26/task_flow.git
cd task_flow
npm install
npm install --prefix auth-service
npm install --prefix socket-server
```

### Configure

```bash
cp env.example .env
```

Set these values in `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/taskflow?schema=public"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
JWT_SECRET="<openssl rand -base64 32>"

AUTH_SERVICE_URL="http://localhost:3003"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3002"
```

Google and GitHub OAuth are optional. If you enable them, register these redirect URIs with each provider:

```text
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/github
```

Billing is optional in development. The built-in test gateway is enabled by `BILLING_ALLOW_TEST_PAYMENTS=true`; it simulates payments and moves no money. To use Razorpay, add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and optionally `RAZORPAY_WEBHOOK_SECRET`.

Never commit `.env`.

### Database and run

```bash
npx prisma migrate deploy
npx prisma generate
npm run seed:curated   # 116 curated DSA questions
npm run dev
```

`npm run dev` starts the web app, auth service, and socket server together. Open `http://localhost:3000`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run web, auth, and socket together |
| `npm run dev:next` | Next.js dev server only |
| `npm run dev:auth` | Auth service only |
| `npm run dev:socket` | Socket.IO server only |
| `npm run build` | Production Next.js build |
| `npm start` | Start the production build |
| `npm run seed:curated` | Seed curated DSA questions |
| `npm run seed:scale` | Generate the synthetic scale-test dataset locally |
| `npm run import-dsa` | Import the DSA question bank |

## Deployment

The public demo runs on one Render Free Docker web service with Neon PostgreSQL. Setup, environment variables, health checks, and limitations are documented in [deploy/RENDER.md](deploy/RENDER.md).

Key points:

- `DATABASE_URL` is the pooled Neon URL; `DIRECT_URL` is the direct URL used for migrations.
- Migrations run at container start.
- `/api/live` is a no-database liveness endpoint used by health checks and the keepalive.
- A GitHub Actions workflow pings `/api/live` every five minutes. GitHub schedules are best-effort; an external monitor is more reliable.
- Free tier: 512 MB RAM, 0.1 CPU, 15-minute sleep, ephemeral uploads. One service only.
- `BILLING_ALLOW_TEST_PAYMENTS` must stay `false` on a public deployment. Use Razorpay test keys for a realistic checkout without real charges.

## Testing and verification

- Browser-tested flows: threads and reply indicators, reactions, typing, polls, channel brief, DSA rooms and history, OAuth linking, password setup, billing test checkout.
- Fresh-database migration replay verified against PostgreSQL.
- Production builds verified for the web app, auth service, and socket server.
- A synthetic 120-user, 91-day dataset (18,720 tasks, 8,424 DSA records) is available locally for UI and query checks. It is not loaded into the public demo.

## Known limits

- Demo-grade deployment, not production infrastructure. No high-availability or scale claims.
- Presence is kept in memory in the single socket process.
- Uploads on Render are ephemeral; there is no persistent object storage.
- No Redis or CRDT layer is wired in.
- Billing uses one-time orders with a plan expiry date; automatic renewals are not implemented.
- OAuth requires your own Google and GitHub app credentials.

## Repository layout

```text
app/            Next.js routes and API handlers
components/     UI, chat, DSA, settings, billing
lib/            Auth, billing, Prisma, chat access, points
prisma/         Schema, migrations, seed data
auth-service/   Express authentication service
socket-server/  Socket.IO realtime server
deploy/         Docker, Render, Oracle, compose, operational docs
scripts/        Seeding and DSA import utilities
```
