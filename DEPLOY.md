# Deploying Flux

Flux is a Node app (Node 24) with a SQLite database — it needs an **always-on Node host**, not a
static host. Two easy, well-supported options are below. Both give you a free **HTTPS URL** you can
share with your client; the session cookie's `Secure` flag turns on automatically over HTTPS.

> Data lives in a SQLite file. Point `DB_PATH` at a **persistent disk/volume** so data survives
> restarts and redeploys. Without a persistent disk, data is ephemeral (fine for a throwaway demo).

---

## Step 0 — Push the repo to GitHub (one time)

From the `CJ-WebPort` folder:

```bash
git add -A
git commit -m "Flux app + deploy config"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

`server/data.db*` and `node_modules/` are gitignored, so no local data or deps get pushed.

---

## Option A — Render (uses the included `render.yaml`)

1. Go to **render.com** → **New** → **Blueprint**.
2. Connect your GitHub and pick this repo. Render reads `render.yaml` and creates the web service
   **plus a 1 GB persistent disk** mounted at `/data` (with `DB_PATH=/data/flux.db`).
3. Click **Apply**. First deploy takes a couple of minutes.
4. (Optional) Real reset emails: in the service's **Environment**, add
   `RESEND_API_KEY` (from resend.com) and `FLUX_MAIL_FROM` (e.g. `Flux <no-reply@yourdomain.com>`),
   then **Manual Deploy → Deploy latest**.
5. Open the provided `https://flux-xxxx.onrender.com` URL. Sign up and demo.

Notes
- The persistent disk requires a paid **Starter** instance. For a free, ephemeral demo, change
  `plan: starter` → `plan: free` and remove the `disk:` block in `render.yaml` (data resets on redeploy).
- Free instances sleep when idle and take ~30s to wake on the first request.

---

## Option B — Railway

1. Go to **railway.app** → **New Project** → **Deploy from GitHub repo** → pick this repo.
   Railway auto-detects Node (via `.node-version`) and runs `npm start`.
2. Add a **Volume**: project → your service → **Volumes** → New Volume, mount path `/data`.
3. **Variables** → add:
   - `DB_PATH = /data/flux.db`
   - (optional) `RESEND_API_KEY = re_xxx` and `FLUX_MAIL_FROM = "Flux <no-reply@yourdomain.com>"`
4. **Settings → Networking → Generate Domain** for a public HTTPS URL.
5. Redeploy if needed, then open the URL.

---

## Environment variables (reference)

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | Port to listen on (host sets this automatically) | `5000` |
| `DB_PATH` | SQLite file location — put it on the disk/volume | `/data/flux.db` |
| `NODE_VERSION` | Pin Node (Render) | `24` |
| `RESEND_API_KEY` *(optional)* | Send real reset emails via Resend | `re_...` |
| `SENDGRID_API_KEY` *(optional)* | Alternative email provider | `SG...` |
| `FLUX_MAIL_FROM` *(optional)* | From address for emails | `Flux <no-reply@yourdomain.com>` |

Without an email key, password-reset links are logged to the server console (and shown on the
Forgot-password page only over plain http, never over HTTPS).

---

## After deploying — quick checklist
- [ ] Visit the HTTPS URL, create an account (rich seed data appears).
- [ ] Confirm light/dark, search (Ctrl+K), Create menu, calendar, statistics, documents.
- [ ] Try **Forgot password** — with an email key set, the link arrives by email; otherwise check logs.
- [ ] If using a paid disk/volume, redeploy once and confirm your data persisted.
