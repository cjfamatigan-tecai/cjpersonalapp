# Flux — Client Demo Script

A 5–7 minute click-through that shows every working feature in a natural order.

## Before the call
1. Start the server:
   ```bash
   cd "CJ-WebPort"
   npm start          # serves on http://localhost:5000 (or set PORT)
   ```
2. Open `http://localhost:5000/login.html`.
3. **Create a fresh account** right before the demo (e.g. `demo@client.com` / `demo12345`).
   A new account is pre-seeded with tasks, goals, a month of calendar events, and documents, so every screen looks alive.
4. Pick your theme (light or dark) with the moon icon — both look great; dark reads well on a projector.

---

## The walkthrough

### 1. Sign in (30s)
- Show the login screen — clean, branded, with light/dark support.
- Mention: **real authentication** — passwords are hashed (scrypt), sessions are secure httpOnly cookies, every account's data is private.
- Sign in → lands on the personal dashboard.

### 2. Personal dashboard (60s)
- Point out the **animated charts**: the weekly line draws on, the progress rings sweep in.
- **Overall Information** stat tiles, **Weekly progress**, **Month progress**.
- **Month goals** — click a goal to check it off; the ring and counter update live and save instantly.

### 3. Tasks (60s)
- In **Task in process**, open a task's ⋯ menu → **Pin**, **Edit**, **Archive**, **Delete**. Pin one (it jumps to front with 📌).
- Toggle a **reminder** bell.
- Click **Open archive** → show archived tasks, **Restore** one.
- Sidebar → **My Tasks** for the full task manager (In progress + Archived).

### 4. Create menu (30s)
- Click **Create** → **New task / goal / event / document**. Add a task live — it appears immediately.

### 5. Global search (30s)  ⭐ crowd-pleaser
- Press **Ctrl/⌘ + K** (or the search icon). Type a few letters.
- Results are grouped across **Tasks, Goals, Events, Documents**. Click one to jump straight to it.

### 6. Calendar (30s)
- Sidebar → **Calendar**. Today is highlighted; seeded events show as dots.
- Click a day → add an event. Show the upcoming list + delete.

### 7. Statistics (30s)
- Sidebar → **Statistics**. Everything is **computed live** from the account's real data and **auto-refreshes**.
- Animated gauge (goal completion), next-7-days bar chart, content-mix donut. **Export report** to CSV.

### 8. Documents (30s)
- Sidebar → **Documents**. Open a doc, edit, **Save** (or Ctrl/⌘+S). Create a new one.

### 9. Industry dashboards (90s)  ⭐ the "wow"
- Sidebar → **E-commerce** (then Marketing / Real Estate / Dental / HVAC).
- For each: KPI tiles, **animated** area chart with range switch (7d/30d/90d), donut, filterable tables (click the status chips), and **Export CSV**.
- Press **Ctrl/⌘ + K** here too — the search filters this dashboard's tables and jumps to the row.
- Change **currency** in Settings and show the numbers update.

### 10. Settings & account (30s)
- Click the **profile avatar** (top-right) → **Settings** / **Log out**.
- In Settings: edit name, **change password** (real, server-verified), theme, currency.
- **Teams** in the sidebar — add / select / remove.

### 11. Wrap
- Recap: "Everything you saw is real and saved per user — no mockups. It's a secure, multi-user product, built with zero external dependencies, deployable to any Node host."

---

## Quick FAQ for the client
- **Is the data real?** Yes — stored per user in a database; it persists and is private to each account.
- **Is it secure?** Passwords are hashed, sessions use httpOnly + SameSite cookies, inputs are validated, and pages are gated behind login.
- **Can my team use it?** Yes — multi-user with signup; each person gets their own private workspace.
- **Where can it run?** Any Node host (Render, Railway, Fly, a VPS). Use HTTPS in production (the secure-cookie flag turns on automatically).
- **Can it integrate with our tools?** A real Slack incoming-webhook integration is already built (posts to a channel on actions); more can be added.

## Reset between demos
Each new signup gets fresh seeded data, so just **create a new account** for a clean run. To wipe everything, stop the server and delete `server/data.db*`.
