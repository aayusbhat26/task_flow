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
- Prepaid plans (Pro, Business) with Razorpay checkout and a built-in test gateway for development

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

Three processes share one database:

```
Next.js web      :3000  ─┐
Express auth     :3003  ─┼──  PostgreSQL :5432
Socket.IO server :3002  ─┘
```

The production demo packs them into one Docker container behind a reverse proxy, because Render's free tier shares 750 instance hours and 512 MB of memory. Prisma migrations run at container start. The three services are a process split, not independently deployable microservices.

## Deployment

The public demo is a single Render Free Docker web service with Neon PostgreSQL. It is demo-grade: 512 MB RAM, 0.1 CPU, a 15-minute idle sleep, and ephemeral uploads. It is not presented as production or high-scale infrastructure.

## Testing and verification

- Browser-tested flows: threads and reply indicators, reactions, typing, polls, channel brief, DSA rooms and history, OAuth linking, password setup, billing test checkout.
- Fresh-database migration replay verified against PostgreSQL.
- Production builds verified for the web app, auth service, and socket server.
- A synthetic 120-user, 91-day dataset (18,720 tasks, 8,424 DSA records) was used locally for UI and query checks. It is not loaded into the public demo.

## Known limits

- Demo-grade deployment, not production infrastructure. No high-availability or scale claims.
- Presence is kept in memory in the single socket process.
- Uploads on Render are ephemeral; there is no persistent object storage.
- No Redis or CRDT layer is wired in.
- Billing uses one-time orders with a plan expiry date; automatic renewals are not implemented.
- OAuth requires your own Google and GitHub app credentials.

## Usage notice

This repository is a portfolio showcase of the deployed product. No license is granted for reuse, redistribution, or redeployment. To explore the product, use the live demo above.
