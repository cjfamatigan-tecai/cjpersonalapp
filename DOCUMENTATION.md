# Flux — Documentation

Source-of-truth documentation for the Flux app (and the portfolio it ships alongside).

## Table of Contents
1. [Overview & architecture](#overview--architecture)
2. [Pages](#pages)
3. [Authentication](#authentication)
4. [Personal dashboard features](#personal-dashboard-features)
5. [My Tasks](#my-tasks)
6. [Calendar](#calendar)
7. [Statistics](#statistics)
8. [Documents](#documents)
9. [Teams](#teams)
10. [Slack integration](#slack-integration)
11. [Business dashboards](#business-dashboards)
12. [Global UI: search, create, profile, theme](#global-ui)
13. [API reference](#api-reference)
14. [Deployment](#deployment)
15. [Known limitations](#known-limitations)

---

## Overview & architecture
Flux is a monochrome, multi-user productivity dashboard. **Zero npm dependencies** — the backend
(`server/server.mjs`) uses only Node built-ins: `node:http`, `node:sqlite`, `node:crypto`.

- **Frontend:** self-contained HTML pages with inline CSS/JS. The industry dashboards share
  `assets/flux.css` + `assets/flux.js` (design system, auth-aware shell, SVG charts, search, exports).
- **Backend:** SQLite (`server/data.db`, or `DB_PATH`), scrypt-hashed passwords, httpOnly
  SameSite=Strict session cookies, per-user data isolation, input validation, login rate-limiting,
  path-traversal + `server/` lockdown.
- **Run:** `npm start` → http://localhost:5000 (or `PORT`).

## Pages
| URL | File | Access | Purpose |
|---|---|---|---|
| `/` | → `login.html` | public | Base URL opens the sign-in screen |
| `/login.html` | login.html | public | Sign in / sign up (+ optional profile photo) |
| `/forgot.html` | forgot.html | public | Request a password-reset link |
| `/reset.html` | reset.html | public | Set a new password via token |
| `/dashboard.html` | dashboard.html | login | Personal dashboard |
| `/mytasks.html` | mytasks.html | login | Full task manager (active + archived) |
| `/calendar.html` | calendar.html | login | Month calendar + events |
| `/statistics.html` | statistics.html | login | Live, auto-refreshing metrics |
| `/documents.html` | documents.html | login | Text documents |
| `/ecommerce,marketing,realestate,dental,hvac.html` | — | login | Industry dashboards (shared shell) |
| `/index.html` | index.html | public | Portfolio site (Christian Jay Famatigan) |

## Authentication
- **Sign up:** name, email, password (min 8). Optional profile photo (cropped/compressed client-side).
  On success a **"Welcome to Flux"** email is sent to the new user (fire-and-forget; delivered when an
  email provider is configured, and to any recipient once a domain is verified in Resend).
  Duplicate email → **"You have already registered this account. Please sign in instead."** (the login
  page then flips to sign-in with the email preserved).
- **Sign in / out:** session cookie; logout clears it.
- **Forgot / reset (verification code):** on `forgot.html` the user enters their email and Flux emails
  a **6-digit code** (15-min expiry, max 5 attempts, single-use). On `reset.html` they enter email +
  code + new password to change it. If `RESEND_API_KEY`/`SENDGRID_API_KEY` is set the code is emailed;
  if it can't be emailed (no provider, or send failed) the code is returned and shown on the forgot page so
  the reset still works — and it's carried into the reset page automatically.
- **Email providers:** set **`GMAIL_USER` + `GMAIL_APP_PASSWORD`** (Gmail SMTP — sends to ANY recipient,
  no domain needed; uses nodemailer), or `RESEND_API_KEY`/`SENDGRID_API_KEY` (needs a verified domain to
  email non-owner addresses). Gmail takes priority when configured. The welcome and reset-code emails
  use the same sender.
- **Demo account:** `demo@flux.app` / `fluxdemo123`, auto-recreated on every server boot (disable with
  `SEED_DEMO=0`). Survives the free-tier database being wiped.
- **Roles:** every user has a role — **admin** or **customer** (default). The owner email
  (`ADMIN_EMAIL`, default `cjfamatigan@gmail.com`) is made **admin** on signup (and promoted on login
  if needed); everyone else is a **customer**. Admins see an "Admin" badge and a **Manage users**
  item in the profile menu that lists everyone who has registered (`GET /api/admin/users`, admin-only).

## Personal dashboard features
- Stat tiles (Overall Information), animated Weekly-progress area chart, Month-progress rings.
- **Month goals:** click to complete; ring + counter update and persist.
- **Task in process:** cards with ⋯ menu (Pin, Edit, **Archive**, Delete), reminder bell, Add task.
- **Open archive:** modal of archived tasks with Restore / Delete.
- **Last Projects:** data-driven with a working **Sort by** dropdown (Progress / Name / Status).
- **Download Report:** exports a CSV summary of tasks, goals and projects.

## My Tasks
Dedicated page: **In progress** (reminder, pin, edit, archive, delete, add) and **Archived**
(restore, delete). Syncs with the dashboard.

## Calendar
Real month grid, today highlighted, event dots. Click a day to add an event; upcoming list with delete.

## Statistics
Computed live from the account and **auto-refreshes every 15s**: KPI tiles, goal-completion gauge,
"events next 7 days" bars, content-mix donut, summary. CSV export.

## Documents
Two-pane list + editor; create, edit (Ctrl/⌘+S), delete; "updated" timestamps.

## Teams
Sidebar list; click to set the active team, ✕ to remove, "Add team" to create. Persisted per user.

## Slack integration
Real incoming-webhook (Settings via the Integrations item on the dashboard). Webhook stored
server-side (never returned to the browser); posts happen server-side; URL allowlisted to
`hooks.slack.com` (SSRF-safe). Adding a task posts to the channel when connected.

## Business dashboards
E-commerce, Marketing, Real Estate, Dental, HVAC — each with KPI tiles, animated area chart (range
switch), donut, filterable tables (status chips), and CSV export. Built on the shared shell.

## Global UI
- **Search (Ctrl/⌘+K):** dashboard searches across tasks/goals/events/documents; business dashboards
  filter their tables and jump to the row.
- **Create menu:** New task / goal / event / document (all functional).
- **Profile menu:** click the avatar → name/email, Dashboard/Settings, Log out. Available on the
  personal dashboard **and** the business dashboards (shared shell).
- **Theme toggle:** shows a moon in light mode / sun in dark mode with a rotate-in animation;
  choice persists in `localStorage`. On login/forgot/reset (top-right) and in-app.
- **Avatar:** initials by default; a profile photo (Settings → Photo or at signup) overrides it,
  shown across the app.

## API reference
Auth: `POST /api/signup|login|logout|forgot|reset`, `GET/PATCH /api/me`, `POST /api/password`,
`DELETE /api/account`. Data: `GET /api/state`, `POST /api/tasks`, `PATCH|DELETE /api/tasks/:id`,
`GET /api/tasks/archived`, `POST /api/goals`, `PATCH|DELETE /api/goals/:id`,
`GET/POST /api/events`, `PATCH|DELETE /api/events/:id`,
`GET/POST /api/documents`, `GET/PATCH|DELETE /api/documents/:id`, `GET /api/stats`,
`GET/PUT /api/prefs`, Slack: `GET /api/slack/status`, `POST /api/slack/connect|disconnect|test|notify`.

## Deployment
Node host (Render/Railway). `render.yaml` now uses a **Starter instance + 1 GB persistent disk**
(`DB_PATH=/data/flux.db`) so accounts survive redeploys/sleep, and declares `RESEND_API_KEY`
(set its value in the dashboard) so verification codes email for real. `.node-version` pins Node 24.
See `DEPLOY.md`. Live: https://flux-rhwx.onrender.com

## Known limitations
| Area | Limitation |
|---|---|
| Free-tier data | No persistent disk → SQLite wiped on redeploy/sleep (demo account is auto-reseeded) |
| Reset code email | Only sends if `RESEND_API_KEY`/`SENDGRID_API_KEY` is configured (else shown on localhost) |
| Business dashboards | Show realistic sample data, not connected to a real data source yet |
| Slack "Settings" (shell) | Business-dashboard profile menu links to the personal dashboard for full Settings |

---
_Last updated: 2026-08-14 — added admin/customer roles (owner email is admin) with an admin "Manage users" panel; login rate-limiter now counts only failed attempts; render.yaml switched to a persistent disk + Resend email key; password reset uses a 6-digit email code._
