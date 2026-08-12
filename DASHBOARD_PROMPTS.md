# Industry Dashboard Prompts

Reusable, copy-paste prompts for generating full business dashboards — one per industry.
Each is written to produce a complete, interactive dashboard in the **Flux** style we built
(monochrome/grayscale cards, big rounded tiles, bold numbers, light/dark toggle, Plus Jakarta Sans),
backed by the same **zero-dependency Node + `node:sqlite` + scrypt-auth** stack.

## How to use
1. Copy one prompt block below.
2. Paste it to Claude Code (or any capable AI) in this repo.
3. Adjust the bracketed `[…]` placeholders (brand name, colors, currency, integrations).
4. Optionally append: *"Reuse the existing Flux auth backend and design tokens; add these as new
   protected pages and API endpoints."*

---

## Shared design + tech baseline (prepend to any prompt if starting fresh)

> Build a responsive, single-page business dashboard as a self-contained `.html` file plus a
> zero-dependency Node backend (`node:http`, `node:sqlite`, `node:crypto` scrypt for auth,
> httpOnly SameSite=Strict session cookies). Visual style: monochrome grayscale, white cards with
> ~26px radius and soft shadows, a few inverted dark tiles for emphasis, bold tabular numbers,
> Plus Jakarta Sans, a blurred organic background, and a persisted light/dark toggle. Include a
> left sidebar (logo, nav sections, settings), a top bar (greeting, Create button, search,
> notifications, avatar, logout), KPI stat tiles, at least one line/area chart and one radial/donut
> gauge rendered as inline SVG (no chart libraries), and toast notifications. All CTAs must work and
> persist to SQLite per authenticated user. Escape all user content (render via textContent).
> Provide a "Download / Export report" action (CSV + printable view). Make it accessible and
> keyboard-navigable.

---

## 1) E-commerce Dashboard

> Build an **e-commerce operations dashboard** for `[Store Name]` (currency `[₱/$/€]`) using the
> shared Flux design + tech baseline above.
>
> **Top KPI tiles:** Revenue (today / MTD / YTD with % vs prior period), Orders, Average Order
> Value (AOV), Conversion Rate, Refund/Return Rate, Gross Margin, Cart Abandonment Rate,
> Customer Lifetime Value (LTV), Repeat-Purchase Rate.
>
> **Core sections:**
> - **Sales over time** — area chart with range switch (7d / 30d / 90d / YTD) and channel breakdown
>   (web, mobile, marketplace).
> - **Revenue by channel & by category** — stacked bars + donut.
> - **Top products** — table with units sold, revenue, margin, stock status, sell-through rate.
> - **Inventory health** — low-stock and out-of-stock alerts, days-of-cover, reorder suggestions.
> - **Orders queue** — status pipeline (paid → packed → shipped → delivered → returned) with counts
>   and a searchable/filterable order list; row actions (view, mark shipped, refund).
> - **Customers** — new vs returning, top spenders, cohort retention grid, geographic map/list.
> - **Funnel** — sessions → product views → add-to-cart → checkout → purchase with drop-off %.
> - **Marketing tie-in** — revenue by coupon/campaign, ROAS if ad spend is provided.
>
> **Reports/exports:** daily sales summary, tax report, inventory valuation, best/worst sellers,
> refund log — all exportable to CSV and a printable PDF-style view.
>
> **Extra features that add value:** AI restock forecasting, anomaly alerts (sudden refund spike or
> traffic drop), abandoned-cart recovery list with one-click email draft, product-bundle
> recommendations, low-margin product flagging, and a goal tracker (e.g. monthly revenue target with
> pace-to-goal ring).

---

## 2) Digital Marketing Agency Dashboard

> Build a **digital-marketing performance dashboard** for `[Agency/Client Name]` using the shared
> Flux design + tech baseline above. Support **multiple clients/workspaces** with a client switcher.
>
> **Top KPI tiles:** Total Spend, Leads/Conversions, Cost per Lead (CPL), Cost per Acquisition (CPA),
> ROAS/ROI, Impressions, Clicks, CTR, Engagement Rate, Blended Conversion Rate.
>
> **Core sections:**
> - **Channel performance** — table + bars across Google Ads, Meta, TikTok, LinkedIn, Email, SEO
>   (spend, clicks, conversions, CPA, ROAS per channel).
> - **Spend vs results over time** — dual-axis line/area with budget pacing (spent vs planned, days
>   left, projected end-of-month spend).
> - **Campaign leaderboard** — best/worst campaigns by ROAS with status toggles (pause/scale flags).
> - **Funnel & attribution** — impressions → clicks → leads → MQL → SQL → customer, with
>   first-touch vs last-touch comparison.
> - **SEO/content module** — keyword rankings, organic traffic trend, top landing pages, backlinks.
> - **Social module** — follower growth, reach, engagement, top posts.
> - **Lead inbox** — incoming leads with source, score, and status (new / contacted / won / lost).
> - **Client reporting** — white-label monthly report generator.
>
> **Reports/exports:** automated monthly client report (branded), channel breakdown CSV, budget-
> pacing report, executive one-pager.
>
> **Extra features that add value:** AI-written performance summary ("what changed and why"), budget
> reallocation suggestions toward best-ROAS channels, anomaly/underperformance alerts, A/B test
> tracker, UTM builder, and goal tracking per client (lead target, CPA ceiling) with pace rings.

---

## 3) Real Estate Dashboard

> Build a **real-estate brokerage/agent dashboard** for `[Brokerage Name]` (currency `[₱/$/€]`)
> using the shared Flux design + tech baseline above.
>
> **Top KPI tiles:** Active Listings, New Leads, Deals in Escrow, Closed Deals (MTD/YTD),
> Total Sales Volume, Commission Earned, Average Days on Market (DOM), List-to-Sale Price Ratio,
> Lead-to-Close Conversion Rate.
>
> **Core sections:**
> - **Sales pipeline** — Kanban/stage view: Lead → Qualified → Showing → Offer → Under Contract →
>   Closed, with deal value per stage and drag-to-advance.
> - **Listings** — card/table grid with photo, price, status (active/pending/sold), DOM, price
>   changes, views/inquiries; row actions (edit, mark sold, schedule showing).
> - **Volume & commission over time** — area chart with monthly targets.
> - **Lead sources** — donut (referral, portal, social, walk-in) with cost-per-lead if ad spend given.
> - **Property performance** — price per sqm/sqft, neighborhood comparison, inventory by type
>   (condo, house, lot, commercial).
> - **Agent leaderboard** — deals, volume, commission, conversion per agent.
> - **Appointments/showings calendar** — upcoming showings, open houses, follow-up reminders.
> - **Client CRM** — buyer/seller contacts with saved-search matching (auto-match new listings to
>   buyer criteria).
>
> **Reports/exports:** commission statement, listing performance report, pipeline forecast, closed-
> deals log, CMA (comparative market analysis) summary — CSV + printable.
>
> **Extra features that add value:** AI price/valuation estimate from comps, days-on-market forecast,
> automatic buyer↔listing matching with alerts, mortgage/affordability calculator widget, follow-up
> nudges for stale leads, and monthly commission goal ring.

---

## 4) Dental Practice Dashboard

> Build a **dental-practice management dashboard** for `[Clinic Name]` (currency `[₱/$/€]`) using the
> shared Flux design + tech baseline above. Handle patient data privately and note HIPAA/consent
> considerations; avoid exposing PII in shared/exported views by default.
>
> **Top KPI tiles:** Today's Appointments, Production (billed) MTD, Collections & Collection Rate,
> New Patients, Chair/Provider Utilization %, No-show/Cancellation Rate, Treatment Acceptance Rate,
> Outstanding A/R, Recall/Hygiene Reappointment Rate.
>
> **Core sections:**
> - **Appointment schedule** — day/week calendar by operatory and provider; status (confirmed,
>   checked-in, in-chair, completed, no-show); quick actions (confirm, reschedule, check-in).
> - **Production & collections over time** — area chart with target line; by provider and by
>   procedure category.
> - **Treatment plans** — presented vs accepted vs scheduled, with acceptance % and pending value.
> - **Patient flow** — new vs returning, recall due list, overdue hygiene recalls.
> - **Revenue by procedure** — donut/bars (cleanings, fillings, crowns, ortho, implants, etc.).
> - **Insurance & claims** — claims submitted / pending / paid / denied, aging A/R buckets
>   (0-30/31-60/61-90/90+).
> - **Patient roster** — searchable list with next appointment, balance, last visit, treatment status.
> - **Reviews/recall reminders** — SMS/email reminder queue and post-visit review requests.
>
> **Reports/exports:** daily production report, collections & A/R aging, provider productivity,
> insurance claim status, recall/no-show report — CSV + printable end-of-day summary.
>
> **Extra features that add value:** automated appointment reminders + confirmations, no-show risk
> scoring, waitlist auto-fill for cancellations, treatment-acceptance follow-up prompts, per-provider
> production goals with pace rings, and a simple patient-satisfaction (NPS) tracker.

---

## 5) HVAC Service Business Dashboard

> Build an **HVAC field-service dashboard** for `[Company Name]` (currency `[₱/$/€]`) using the
> shared Flux design + tech baseline above.
>
> **Top KPI tiles:** Jobs Today / This Week, Revenue (MTD/YTD), Average Ticket Value, Technician
> Utilization %, First-Time Fix Rate, Open Work Orders, Overdue Jobs, Active Maintenance Contracts,
> Callback/Warranty Rate, Outstanding Invoices.
>
> **Core sections:**
> - **Dispatch board** — today's jobs by technician and time slot; status (scheduled → en route →
>   on-site → completed → invoiced); drag-to-assign, map/route view.
> - **Work orders** — searchable/filterable list (install, repair, maintenance, emergency) with
>   priority, customer, equipment, assigned tech, and actions (assign, reschedule, mark complete).
> - **Revenue & jobs over time** — area chart with seasonality view (cooling vs heating season) and
>   revenue by service type.
> - **Technician performance** — jobs completed, revenue, avg time on-site, first-time-fix,
>   callbacks, upsell rate.
> - **Service agreements** — active/expiring maintenance contracts, upcoming PM (preventive
>   maintenance) visits due, renewal pipeline.
> - **Inventory/parts** — stock levels on common parts, truck stock, low-stock reorder alerts.
> - **Invoicing & payments** — invoiced vs collected, aging receivables, unpaid list.
> - **Customer & equipment history** — per-address equipment records, warranty status, past service.
>
> **Reports/exports:** daily job summary, technician productivity, revenue by service type, A/R aging,
> contract renewal report, parts usage — CSV + printable.
>
> **Extra features that add value:** automated PM scheduling from contracts, seasonal demand forecast
> and staffing suggestion, route optimization, membership/renewal reminders, upsell recommendations
> (e.g. filter/plan upgrades) per job, SLA/overdue alerts, and monthly revenue goal ring.

---

## Optional cross-industry add-ons (mention in any prompt)
- **Role-based access** (owner / manager / staff) on top of the existing auth.
- **Notifications center** with a bell dropdown and unread badges.
- **Global search** across records.
- **CSV import** to seed real data.
- **Audit log** of who changed what.
- **Mobile-first responsive** layout and a printable report stylesheet.
- **AI insights panel** ("summarize this month," "what needs attention today").
