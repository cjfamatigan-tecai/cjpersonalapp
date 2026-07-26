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

Any static host works (Netlify, GitHub Pages, Vercel, etc.) — just point it at the repository root; no build command is needed.
