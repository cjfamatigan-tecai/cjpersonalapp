# CJ WebPort

Personal portfolio site for **Christian Jay Famatigan** — Threat Intelligence & Technical Support Specialist.

## Structure

```
index.html            Single-file site (HTML + inline CSS + inline JS, Tailwind via CDN)
brand_assets/          Headshot used in the hero section
serve.mjs              Zero-dependency local dev server (Node built-ins only)
```

There is no build step and no npm dependencies — the page is entirely self-contained aside from two CDN links (Tailwind CSS and Google Fonts).

## Running locally

Requires only Node.js (any recent version).

```bash
node serve.mjs
```

Then open `http://localhost:3000` in a browser.

You can also just open `index.html` directly in a browser without a server, though a local server is recommended so the relative asset path resolves consistently.

## Deploying

The portfolio (`index.html`) is static — any static host works (Netlify, GitHub Pages, Vercel, etc.).

---

## Flux dashboard app

`server/server.mjs` is a zero-dependency Node backend (Node 22.5+) powering the **Flux** app:
secure multi-user auth, tasks, goals, calendar, statistics, documents, teams, industry
dashboards, a Slack webhook integration, and password reset.

### One-click deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/cjfamatigan-tecai/cjpersonalapp)

Click the button → sign in to Render → **Authorize GitHub** → **Apply**. Render reads
`render.yaml` and provisions the web service + persistent disk automatically, then gives you an
HTTPS URL. (First deploy ~2 min.) See below for the manual steps and the free/no-disk option.

Run it:

```bash
npm start          # http://localhost:5000  (set PORT to change)
```

It needs an always-on Node host (Render / Railway / Fly / a VPS), **not** a static host.
Use HTTPS in production — the session cookie's `Secure` flag turns on automatically.

### Password-reset email (optional)

Reset links are generated as secure, single-use, 1-hour tokens. To actually email them,
set **one** provider via environment variables (both use plain HTTPS APIs — still no npm deps):

```bash
# Option A — Resend (https://resend.com)
RESEND_API_KEY=re_xxx
FLUX_MAIL_FROM="Flux <no-reply@yourdomain.com>"

# Option B — SendGrid
SENDGRID_API_KEY=SG.xxx
FLUX_MAIL_FROM="no-reply@yourdomain.com"
```

With no key set, the reset link is logged to the server console and (on localhost only)
shown on the Forgot-password page for convenience.

### Data

User data is stored in `server/data.db` (SQLite, gitignored). Delete `server/data.db*` to reset.
