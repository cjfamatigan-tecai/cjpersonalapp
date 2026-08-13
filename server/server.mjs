/* ============================================================
   FLUX — secure backend (zero npm dependencies)
   Node built-ins only: http, node:sqlite, node:crypto, fs, path
   - Passwords hashed with scrypt + per-user random salt
   - Sessions: random token in httpOnly, SameSite=Strict cookie
   - Per-user task/goal storage in SQLite
   ============================================================ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');          // serves the CJ-WebPort folder
const PORT = process.env.PORT || 5000;
const SESSION_DAYS = 7;

/* ---------------- database ---------------- */
// DB_PATH lets a host point the SQLite file at a persistent disk (e.g. /data/flux.db).
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    pass_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    icon TEXT NOT NULL DEFAULT 'flag',
    title TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT 'Today',
    bell INTEGER NOT NULL DEFAULT 0,
    pinned INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS prefs (
    user_id INTEGER PRIMARY KEY,
    data TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS slack (
    user_id INTEGER PRIMARY KEY,
    webhook TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS resets (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS reset_codes (
    user_id INTEGER PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
// migrations for existing databases (no-op if the column already exists)
try { db.exec('ALTER TABLE tasks ADD COLUMN archived INTEGER NOT NULL DEFAULT 0'); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'"); } catch {}

// the owner account gets the admin role; everyone else is a customer
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'cjfamatigan@gmail.com').toLowerCase();

/* ---------------- crypto helpers ---------------- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}
function verifyPassword(pw, stored) {
  const [saltHex, hashHex] = String(stored).split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(pw, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}
const newToken = () => crypto.randomBytes(32).toString('hex');

/* ---------------- session helpers ---------------- */
function createSession(userId) {
  const token = newToken();
  const expires = Date.now() + SESSION_DAYS * 864e5;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)').run(token, userId, expires);
  return { token, expires };
}
function getUserByToken(token) {
  if (!token) return null;
  const row = db.prepare(`
    SELECT u.id, u.name, u.email, u.role FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > ?`).get(token, Date.now());
  return row || null;
}
function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

/* ---------------- seed data for new users ---------------- */
function seedUser(userId) {
  const g = db.prepare('INSERT INTO goals (user_id, text, done, position) VALUES (?,?,?,?)');
  [['Read 2 books this month', 1], ['Exercise every day', 1], ['Finish the design course', 0], ['Launch the side project', 0]]
    .forEach(([text, done], i) => g.run(userId, text, done, i));
  const t = db.prepare('INSERT INTO tasks (user_id, icon, title, date, bell, pinned, position) VALUES (?,?,?,?,?,?,?)');
  t.run(userId, 'star', 'Prepare the client presentation', 'Today', 1, 1, 0);
  t.run(userId, 'gift', 'Buy Susan a gift for her birthday', 'Today', 1, 0, 1);
  t.run(userId, 'flag', 'Review Q3 marketing report', 'Tomorrow', 0, 0, 2);
  t.run(userId, 'cross', "Doctor's appointment", 'This week', 0, 0, 3);
  const now = Date.now();
  const off = n => { const x = new Date(); x.setDate(x.getDate() + n); return ymd(x); };
  const ev = db.prepare('INSERT INTO events (user_id, title, date, time, note, created_at) VALUES (?,?,?,?,?,?)');
  ev.run(userId, 'Team standup', off(0), '09:30', 'Daily sync', now);
  ev.run(userId, 'Client demo', off(1), '14:00', 'Walk through the new dashboard', now);
  ev.run(userId, 'Dentist appointment', off(3), '11:00', '', now);
  ev.run(userId, 'Design review', off(6), '16:00', 'Review v2 mockups', now);
  ev.run(userId, 'Sprint planning', off(9), '10:00', '', now);
  ev.run(userId, 'Project deadline — ship v1', off(12), '', 'Final QA and release', now);
  const doc = db.prepare('INSERT INTO documents (user_id, title, body, updated_at) VALUES (?,?,?,?)');
  doc.run(userId, 'Welcome to Flux', 'This is your workspace.\n\nEverything here — tasks, goals, calendar events, and documents — is saved securely to your account and syncs across the app.\n\nTry the search (Ctrl+K), the Create button, and the light/dark toggle.', now);
  doc.run(userId, 'Client meeting notes', 'Agenda\n1. Product roadmap\n2. Timeline and milestones\n3. Budget and resourcing\n\nAction items:\n- Send proposal by Friday\n- Schedule follow-up demo', now - 3600e3);
  doc.run(userId, 'Project brief', 'Goal: deliver a clean, monochrome productivity dashboard with multi-user auth.\n\nScope: tasks, goals, calendar, statistics, documents, and industry dashboards.', now - 7200e3);
}

// Always-available demo login (recreated on every boot, so it survives the free tier's
// ephemeral database being wiped when the instance sleeps). Disable with SEED_DEMO=0.
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@flux.app';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'fluxdemo123';
function ensureDemoUser() {
  if (process.env.SEED_DEMO === '0') return;
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL)) return;
  const info = db.prepare('INSERT INTO users (name, email, pass_hash, created_at) VALUES (?,?,?,?)')
    .run('Demo User', DEMO_EMAIL, hashPassword(DEMO_PASSWORD), Date.now());
  seedUser(Number(info.lastInsertRowid));
  console.log(`Demo login ready → ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

// Always-available ADMIN login for the owner. On every boot this makes sure the admin account
// exists with a known password and the admin role — so you can always sign in, even after the
// free tier wipes the database or if you forgot the password. Disable with SEED_ADMIN=0; change
// the password with ADMIN_PASSWORD. (Once you have a persistent disk you can set SEED_ADMIN=0
// to keep whatever password you set in Settings.)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'fluxadmin123';
function ensureAdminUser() {
  if (process.env.SEED_ADMIN === '0') return;
  const hash = hashPassword(ADMIN_PASSWORD);
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);
  if (existing) {
    db.prepare('UPDATE users SET pass_hash = ?, role = ? WHERE id = ?').run(hash, 'admin', existing.id);
  } else {
    const info = db.prepare('INSERT INTO users (name, email, pass_hash, created_at, role) VALUES (?,?,?,?,?)')
      .run('Christian Jay', ADMIN_EMAIL, hash, Date.now(), 'admin');
    seedUser(Number(info.lastInsertRowid));
  }
  console.log(`Admin login ready → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

/* ---------------- request utilities ---------------- */
function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie;
  if (!raw) return out;
  raw.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '', size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > 1e6) { reject(new Error('payload too large')); req.destroy(); return; }
      body += c;
    });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('invalid json')); } });
    req.on('error', reject);
  });
}
function isSecure(req) {
  return req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
}
function sendJson(res, status, obj, cookie) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (cookie) headers['Set-Cookie'] = cookie;
  res.writeHead(status, headers);
  res.end(JSON.stringify(obj));
}
function sessionCookie(req, token, expires) {
  const parts = [
    `flux_sid=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    `Expires=${new Date(expires).toUTCString()}`,
  ];
  if (isSecure(req)) parts.push('Secure');
  return parts.join('; ');
}
function clearCookie(req) {
  const parts = ['flux_sid=', 'HttpOnly', 'Path=/', 'SameSite=Strict', 'Max-Age=0'];
  if (isSecure(req)) parts.push('Secure');
  return parts.join('; ');
}

/* ---------------- validation ---------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validEmail = e => typeof e === 'string' && e.length <= 254 && EMAIL_RE.test(e);
const validPw = p => typeof p === 'string' && p.length >= 8 && p.length <= 200;
const clean = s => String(s == null ? '' : s).slice(0, 300).trim();
const cleanLong = s => String(s == null ? '' : s).slice(0, 20000);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// only official Slack incoming-webhook URLs are accepted (prevents SSRF to arbitrary hosts)
const SLACK_RE = /^https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_\-\/]+$/;
async function postToSlack(webhook, text) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: ctrl.signal,
    });
    return r.ok;
  } catch { return false; } finally { clearTimeout(t); }
}

/* ---------------- email (HTTP APIs — no dependencies) ----------------
   Configure with env vars:
     RESEND_API_KEY   (https://resend.com)   — or —   SENDGRID_API_KEY
     FLUX_MAIL_FROM   e.g. "Flux <no-reply@yourdomain.com>"
   With none set, the reset link falls back to the server console / localhost.
--------------------------------------------------------------------- */
const MAIL_FROM = process.env.FLUX_MAIL_FROM || 'Flux <onboarding@resend.dev>';
const emailConfigured = () => !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
async function sendEmail({ to, subject, html }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    if (process.env.RESEND_API_KEY) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: MAIL_FROM, to, subject, html }),
        signal: ctrl.signal,
      });
      return r.ok;
    }
    if (process.env.SENDGRID_API_KEY) {
      const fromEmail = (MAIL_FROM.match(/<([^>]+)>/) || [null, MAIL_FROM])[1];
      const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: fromEmail }, subject, content: [{ type: 'text/html', value: html }] }),
        signal: ctrl.signal,
      });
      return r.ok;
    }
    return false;
  } catch { return false; } finally { clearTimeout(t); }
}
const ymd = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
const today = () => ymd(new Date());

/* ---------------- rate limiting ---------------- */
const attempts = new Map(); // key -> { count, first }
const RL_WIN = 15 * 60 * 1000, RL_MAX = 8;
// request-based limiter (used for /forgot): increments on every call
function rateLimited(key) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > RL_WIN) { attempts.set(key, { count: 1, first: now }); return false; }
  rec.count++;
  return rec.count > RL_MAX;
}
// failure-based limiter (used for /login): only counts FAILED attempts, cleared on success,
// so logging in and out normally never trips the block
function loginBlocked(key) {
  const rec = attempts.get(key);
  return !!(rec && rec.count > RL_MAX && Date.now() - rec.first <= RL_WIN);
}
function noteLoginFail(key) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > RL_WIN) attempts.set(key, { count: 1, first: now });
  else rec.count++;
}
function clearLoginFails(key) { attempts.delete(key); }

/* ---------------- state serializer ---------------- */
function userState(userId) {
  const tasks = db.prepare('SELECT id, icon, title, date, bell, pinned FROM tasks WHERE user_id = ? AND archived = 0 ORDER BY pinned DESC, position ASC, id ASC').all(userId)
    .map(t => ({ ...t, bell: !!t.bell, pinned: !!t.pinned }));
  const goals = db.prepare('SELECT id, text, done FROM goals WHERE user_id = ? ORDER BY position ASC, id ASC').all(userId)
    .map(g => ({ ...g, done: !!g.done }));
  return { tasks, goals };
}

function listEvents(userId) {
  return db.prepare('SELECT id, title, date, time, note FROM events WHERE user_id = ? ORDER BY date ASC, time ASC, id ASC').all(userId);
}
function listDocuments(userId) {
  return db.prepare('SELECT id, title, substr(body,1,140) AS excerpt, updated_at FROM documents WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
}
function getDocument(userId, id) {
  return db.prepare('SELECT id, title, body, updated_at FROM documents WHERE id = ? AND user_id = ?').get(id, userId);
}
function computeStats(userId) {
  const t = db.prepare('SELECT COUNT(*) c, COALESCE(SUM(pinned),0) p, COALESCE(SUM(bell),0) b FROM tasks WHERE user_id = ?').get(userId);
  const g = db.prepare('SELECT COUNT(*) c, COALESCE(SUM(done),0) d FROM goals WHERE user_id = ?').get(userId);
  const dc = db.prepare('SELECT COUNT(*) c FROM documents WHERE user_id = ?').get(userId);
  const events = db.prepare('SELECT date FROM events WHERE user_id = ?').all(userId);
  const t0 = today();
  const upcoming = events.filter(e => e.date >= t0).length;
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const next7 = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(); x.setDate(x.getDate() + i);
    const ds = ymd(x);
    next7.push({ label: dow[x.getDay()], date: ds, value: events.filter(e => e.date === ds).length });
  }
  return {
    tasks: { total: t.c, pinned: t.p, reminders: t.b },
    goals: { total: g.c, done: g.d, pct: g.c ? Math.round(g.d / g.c * 100) : 0 },
    events: { total: events.length, upcoming },
    documents: { total: dc.c },
    next7,
  };
}

/* ---------------- API handler ---------------- */
async function handleApi(req, res, url) {
  const cookies = parseCookies(req);
  const me = getUserByToken(cookies.flux_sid);
  const seg = url.pathname.split('/').filter(Boolean); // ['api', ...]
  const route = '/' + seg.slice(1).join('/');
  const method = req.method;

  // --- public auth routes ---
  if (route === '/signup') {
    if (method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const name = clean(b.name), email = clean(b.email).toLowerCase(), pw = b.password;
    if (!name) return sendJson(res, 400, { error: 'Name is required.' });
    if (!validEmail(email)) return sendJson(res, 400, { error: 'Enter a valid email address.' });
    if (!validPw(pw)) return sendJson(res, 400, { error: 'Password must be at least 8 characters.' });
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return sendJson(res, 409, { error: 'You have already registered this account. Please sign in instead.' });
    const role = email === ADMIN_EMAIL ? 'admin' : 'customer';
    const info = db.prepare('INSERT INTO users (name, email, pass_hash, created_at, role) VALUES (?,?,?,?,?)')
      .run(name, email, hashPassword(pw), Date.now(), role);
    const uid = Number(info.lastInsertRowid);
    seedUser(uid);
    const { token, expires } = createSession(uid);
    return sendJson(res, 201, { user: { id: uid, name, email, role } }, sessionCookie(req, token, expires));
  }

  if (route === '/login') {
    if (method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const email = clean(b.email).toLowerCase(), pw = b.password || '';
    const ip = req.socket.remoteAddress || 'unknown';
    const rlKey = ip + '|' + email;
    if (loginBlocked(rlKey)) return sendJson(res, 429, { error: 'Too many failed attempts. Try again in 15 minutes.' });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(pw, user.pass_hash)) {
      noteLoginFail(rlKey); // only failures count toward the limit
      return sendJson(res, 401, { error: 'Invalid email or password.' });
    }
    clearLoginFails(rlKey); // successful login resets the counter
    // safety net: ensure the owner email always has the admin role
    let role = user.role || 'customer';
    if (user.email === ADMIN_EMAIL && role !== 'admin') { db.prepare('UPDATE users SET role=? WHERE id=?').run('admin', user.id); role = 'admin'; }
    const { token, expires } = createSession(user.id);
    return sendJson(res, 200, { user: { id: user.id, name: user.name, email: user.email, role } }, sessionCookie(req, token, expires));
  }

  if (route === '/logout') {
    if (method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
    destroySession(cookies.flux_sid);
    return sendJson(res, 200, { ok: true }, clearCookie(req));
  }

  // --- forgot / reset password (public) ---
  if (route === '/forgot') {
    if (method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const email = clean(b.email).toLowerCase();
    const ip = req.socket.remoteAddress || 'unknown';
    if (rateLimited('forgot|' + ip)) return sendJson(res, 429, { error: 'Too many requests. Try again in 15 minutes.' });
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    const payload = { ok: true }; // always generic — never reveal whether the email exists
    if (user) {
      db.prepare('DELETE FROM reset_codes WHERE user_id = ?').run(user.id);
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0'); // 6-digit code
      const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
      db.prepare('INSERT INTO reset_codes (user_id, code, expires_at, attempts) VALUES (?,?,?,0)').run(user.id, code, expires);
      const html = `<div style="font-family:system-ui,sans-serif;max-width:480px">
        <h2 style="font-weight:800">Your Flux verification code</h2>
        <p>Use this code to reset your password. It expires in 15 minutes.</p>
        <p style="font-size:34px;font-weight:800;letter-spacing:8px;background:#f3f3f5;color:#17181a;padding:16px 20px;border-radius:14px;text-align:center">${code}</p>
        <p style="color:#9a9ba0;font-size:13px">If you didn't request this, you can safely ignore this email.</p></div>`;
      const emailed = emailConfigured() ? await sendEmail({ to: email, subject: `Your Flux code: ${code}`, html }) : false;
      console.log(`[reset code] ${email} -> ${code}${emailed ? ' (emailed)' : ''}`);
      // if it couldn't be emailed (no provider configured, or send failed), return the code so the
      // reset still works. Once RESEND_API_KEY is set and delivery succeeds, the code is emailed
      // instead and never returned here.
      if (!emailed) payload.devCode = code;
    }
    return sendJson(res, 200, payload);
  }
  if (route === '/reset') {
    if (method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const email = clean(b.email).toLowerCase();
    const code = String(b.code || '').trim();
    if (!validPw(b.password)) return sendJson(res, 400, { error: 'Password must be at least 8 characters.' });
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) return sendJson(res, 400, { error: 'Invalid email or code.' });
    const row = db.prepare('SELECT * FROM reset_codes WHERE user_id = ?').get(user.id);
    if (!row || row.expires_at < Date.now()) return sendJson(res, 400, { error: 'This code has expired. Request a new one.' });
    if (row.attempts >= 5) { db.prepare('DELETE FROM reset_codes WHERE user_id = ?').run(user.id); return sendJson(res, 429, { error: 'Too many attempts. Request a new code.' }); }
    if (row.code !== code) {
      db.prepare('UPDATE reset_codes SET attempts = attempts + 1 WHERE user_id = ?').run(user.id);
      return sendJson(res, 400, { error: 'Incorrect code. Please try again.' });
    }
    db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(hashPassword(b.password), user.id);
    db.prepare('DELETE FROM reset_codes WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id); // sign out everywhere
    return sendJson(res, 200, { ok: true });
  }

  // --- everything below requires auth ---
  if (!me) return sendJson(res, 401, { error: 'Not authenticated.' });

  if (route === '/me' && method === 'GET') return sendJson(res, 200, { user: me });
  if (route === '/me' && method === 'PATCH') {
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const name = clean(b.name);
    if (!name) return sendJson(res, 400, { error: 'Name is required.' });
    db.prepare('UPDATE users SET name=? WHERE id=?').run(name, me.id);
    return sendJson(res, 200, { user: { id: me.id, name, email: me.email, role: me.role } });
  }
  // admin only: list everyone who has registered
  if (route === '/admin/users' && method === 'GET') {
    if (me.role !== 'admin') return sendJson(res, 403, { error: 'Admin only.' });
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
    return sendJson(res, 200, { users });
  }
  if (route === '/password' && method === 'POST') {
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    if (!validPw(b.next)) return sendJson(res, 400, { error: 'New password must be at least 8 characters.' });
    const u = db.prepare('SELECT pass_hash FROM users WHERE id=?').get(me.id);
    if (!verifyPassword(b.current || '', u.pass_hash)) return sendJson(res, 401, { error: 'Current password is incorrect.' });
    db.prepare('UPDATE users SET pass_hash=? WHERE id=?').run(hashPassword(b.next), me.id);
    return sendJson(res, 200, { ok: true });
  }
  if (route === '/prefs' && method === 'GET') {
    const row = db.prepare('SELECT data FROM prefs WHERE user_id=?').get(me.id);
    let data = {}; try { if (row) data = JSON.parse(row.data); } catch {}
    return sendJson(res, 200, { prefs: data });
  }
  if (route === '/prefs' && method === 'PUT') {
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const data = (b && typeof b.data === 'object' && b.data) ? b.data : {};
    const json = JSON.stringify(data).slice(0, 500000); // allows a small embedded avatar image
    db.prepare('INSERT INTO prefs (user_id, data) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data').run(me.id, json);
    return sendJson(res, 200, { prefs: JSON.parse(json) });
  }
  if (route === '/account' && method === 'DELETE') {
    // explicit deletes (SQLite foreign-key cascade is off by default)
    for (const tbl of ['tasks', 'goals', 'events', 'documents', 'prefs', 'slack', 'sessions']) {
      db.prepare(`DELETE FROM ${tbl} WHERE user_id = ?`).run(me.id);
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(me.id);
    return sendJson(res, 200, { ok: true }, clearCookie(req));
  }
  if (route === '/state') return sendJson(res, 200, userState(me.id));

  // --- tasks ---
  if (route === '/tasks' && method === 'POST') {
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const title = clean(b.title);
    if (!title) return sendJson(res, 400, { error: 'Task title required.' });
    const icon = ['flag', 'star', 'gift', 'cross'].includes(b.icon) ? b.icon : 'flag';
    const pos = (db.prepare('SELECT COALESCE(MAX(position),-1)+1 AS p FROM tasks WHERE user_id=?').get(me.id)).p;
    db.prepare('INSERT INTO tasks (user_id, icon, title, date, bell, pinned, position) VALUES (?,?,?,?,?,?,?)')
      .run(me.id, icon, title, clean(b.date) || 'Today', 0, 0, pos);
    return sendJson(res, 201, userState(me.id));
  }
  if (route === '/tasks/archived' && method === 'GET') {
    const rows = db.prepare('SELECT id, icon, title, date, bell, pinned FROM tasks WHERE user_id=? AND archived=1 ORDER BY id DESC').all(me.id)
      .map(t => ({ ...t, bell: !!t.bell, pinned: !!t.pinned }));
    return sendJson(res, 200, { tasks: rows });
  }
  const taskMatch = route.match(/^\/tasks\/(\d+)$/);
  if (taskMatch) {
    const id = Number(taskMatch[1]);
    const owned = db.prepare('SELECT * FROM tasks WHERE id=? AND user_id=?').get(id, me.id);
    if (!owned) return sendJson(res, 404, { error: 'Task not found.' });
    if (method === 'DELETE') {
      db.prepare('DELETE FROM tasks WHERE id=? AND user_id=?').run(id, me.id);
      return sendJson(res, 200, userState(me.id));
    }
    if (method === 'PATCH') {
      let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      const title = b.title !== undefined ? clean(b.title) : owned.title;
      if (!title) return sendJson(res, 400, { error: 'Task title required.' });
      const bell = b.bell !== undefined ? (b.bell ? 1 : 0) : owned.bell;
      const pinned = b.pinned !== undefined ? (b.pinned ? 1 : 0) : owned.pinned;
      const archived = b.archived !== undefined ? (b.archived ? 1 : 0) : owned.archived;
      db.prepare('UPDATE tasks SET title=?, bell=?, pinned=?, archived=? WHERE id=? AND user_id=?')
        .run(title, bell, pinned, archived, id, me.id);
      return sendJson(res, 200, userState(me.id));
    }
  }

  // --- goals ---
  if (route === '/goals' && method === 'POST') {
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const text = clean(b.text);
    if (!text) return sendJson(res, 400, { error: 'Goal text required.' });
    const pos = (db.prepare('SELECT COALESCE(MAX(position),-1)+1 AS p FROM goals WHERE user_id=?').get(me.id)).p;
    db.prepare('INSERT INTO goals (user_id, text, done, position) VALUES (?,?,0,?)').run(me.id, text, pos);
    return sendJson(res, 201, userState(me.id));
  }
  const goalMatch = route.match(/^\/goals\/(\d+)$/);
  if (goalMatch) {
    const id = Number(goalMatch[1]);
    const owned = db.prepare('SELECT * FROM goals WHERE id=? AND user_id=?').get(id, me.id);
    if (!owned) return sendJson(res, 404, { error: 'Goal not found.' });
    if (method === 'DELETE') {
      db.prepare('DELETE FROM goals WHERE id=? AND user_id=?').run(id, me.id);
      return sendJson(res, 200, userState(me.id));
    }
    if (method === 'PATCH') {
      let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      const done = b.done !== undefined ? (b.done ? 1 : 0) : owned.done;
      const text = b.text !== undefined ? clean(b.text) : owned.text;
      if (!text) return sendJson(res, 400, { error: 'Goal text required.' });
      db.prepare('UPDATE goals SET done=?, text=? WHERE id=? AND user_id=?').run(done, text, id, me.id);
      return sendJson(res, 200, userState(me.id));
    }
  }

  // --- calendar events ---
  if (route === '/events' && method === 'GET') return sendJson(res, 200, { events: listEvents(me.id) });
  if (route === '/events' && method === 'POST') {
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const title = clean(b.title);
    if (!title) return sendJson(res, 400, { error: 'Event title required.' });
    const date = clean(b.date);
    if (!DATE_RE.test(date)) return sendJson(res, 400, { error: 'Valid date (YYYY-MM-DD) required.' });
    db.prepare('INSERT INTO events (user_id, title, date, time, note, created_at) VALUES (?,?,?,?,?,?)')
      .run(me.id, title, date, clean(b.time), clean(b.note), Date.now());
    return sendJson(res, 201, { events: listEvents(me.id) });
  }
  const evMatch = route.match(/^\/events\/(\d+)$/);
  if (evMatch) {
    const id = Number(evMatch[1]);
    const owned = db.prepare('SELECT * FROM events WHERE id=? AND user_id=?').get(id, me.id);
    if (!owned) return sendJson(res, 404, { error: 'Event not found.' });
    if (method === 'DELETE') {
      db.prepare('DELETE FROM events WHERE id=? AND user_id=?').run(id, me.id);
      return sendJson(res, 200, { events: listEvents(me.id) });
    }
    if (method === 'PATCH') {
      let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      const title = b.title !== undefined ? clean(b.title) : owned.title;
      if (!title) return sendJson(res, 400, { error: 'Event title required.' });
      const date = b.date !== undefined ? clean(b.date) : owned.date;
      if (!DATE_RE.test(date)) return sendJson(res, 400, { error: 'Valid date required.' });
      const time = b.time !== undefined ? clean(b.time) : owned.time;
      const note = b.note !== undefined ? clean(b.note) : owned.note;
      db.prepare('UPDATE events SET title=?, date=?, time=?, note=? WHERE id=? AND user_id=?').run(title, date, time, note, id, me.id);
      return sendJson(res, 200, { events: listEvents(me.id) });
    }
  }

  // --- documents ---
  if (route === '/documents' && method === 'GET') return sendJson(res, 200, { documents: listDocuments(me.id) });
  if (route === '/documents' && method === 'POST') {
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const title = clean(b.title) || 'Untitled';
    const info = db.prepare('INSERT INTO documents (user_id, title, body, updated_at) VALUES (?,?,?,?)')
      .run(me.id, title, cleanLong(b.body), Date.now());
    return sendJson(res, 201, { id: Number(info.lastInsertRowid), documents: listDocuments(me.id) });
  }
  const docMatch = route.match(/^\/documents\/(\d+)$/);
  if (docMatch) {
    const id = Number(docMatch[1]);
    const owned = db.prepare('SELECT id FROM documents WHERE id=? AND user_id=?').get(id, me.id);
    if (!owned) return sendJson(res, 404, { error: 'Document not found.' });
    if (method === 'GET') return sendJson(res, 200, { document: getDocument(me.id, id) });
    if (method === 'DELETE') {
      db.prepare('DELETE FROM documents WHERE id=? AND user_id=?').run(id, me.id);
      return sendJson(res, 200, { documents: listDocuments(me.id) });
    }
    if (method === 'PATCH') {
      let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
      const cur = getDocument(me.id, id);
      const title = b.title !== undefined ? (clean(b.title) || 'Untitled') : cur.title;
      const body = b.body !== undefined ? cleanLong(b.body) : cur.body;
      db.prepare('UPDATE documents SET title=?, body=?, updated_at=? WHERE id=? AND user_id=?').run(title, body, Date.now(), id, me.id);
      return sendJson(res, 200, { document: getDocument(me.id, id), documents: listDocuments(me.id) });
    }
  }

  // --- statistics (computed live) ---
  if (route === '/stats' && method === 'GET') return sendJson(res, 200, computeStats(me.id));

  // --- Slack incoming-webhook integration (webhook stored server-side, never returned) ---
  if (route === '/slack/status' && method === 'GET') {
    const row = db.prepare('SELECT webhook FROM slack WHERE user_id=?').get(me.id);
    return sendJson(res, 200, { connected: !!row });
  }
  if (route === '/slack/connect' && method === 'POST') {
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const webhook = String(b.webhook || '').trim();
    if (!SLACK_RE.test(webhook)) return sendJson(res, 400, { error: 'Enter a valid Slack webhook URL (https://hooks.slack.com/services/…).' });
    db.prepare('INSERT INTO slack (user_id, webhook) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET webhook=excluded.webhook').run(me.id, webhook);
    const ok = await postToSlack(webhook, `✅ Flux connected to Slack by ${me.name}.`);
    return sendJson(res, 200, { connected: true, delivered: ok });
  }
  if (route === '/slack/disconnect' && method === 'POST') {
    db.prepare('DELETE FROM slack WHERE user_id=?').run(me.id);
    return sendJson(res, 200, { connected: false });
  }
  if (route === '/slack/test' && method === 'POST') {
    const row = db.prepare('SELECT webhook FROM slack WHERE user_id=?').get(me.id);
    if (!row) return sendJson(res, 400, { error: 'Slack is not connected.' });
    const ok = await postToSlack(row.webhook, `🔔 Test message from Flux — hi ${me.name}!`);
    return ok ? sendJson(res, 200, { ok: true }) : sendJson(res, 502, { error: 'Slack did not accept the message. Check the webhook URL.' });
  }
  if (route === '/slack/notify' && method === 'POST') {
    let b; try { b = await readJson(req); } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const row = db.prepare('SELECT webhook FROM slack WHERE user_id=?').get(me.id);
    if (!row) return sendJson(res, 200, { ok: false, connected: false });
    const text = clean(b.text) || 'Update from Flux';
    const ok = await postToSlack(row.webhook, text);
    return sendJson(res, 200, { ok, connected: true });
  }

  return sendJson(res, 404, { error: 'Unknown endpoint.' });
}

/* ---------------- static file serving ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};
// Everything in the app requires a login. The base URL opens the sign-in screen.
const PROTECTED = new Set([
  '/dashboard.html', '/ecommerce.html', '/marketing.html',
  '/realestate.html', '/dental.html', '/hvac.html',
  '/calendar.html', '/statistics.html', '/documents.html', '/mytasks.html',
]);

function serveStatic(req, res, url) {
  let urlPath = decodeURIComponent(url.pathname);
  // base URL → the sign-in screen (login → dashboard). Portfolio stays at /index.html.
  if (urlPath === '/') urlPath = '/login.html';

  // gate protected pages behind a valid session
  if (PROTECTED.has(urlPath)) {
    const me = getUserByToken(parseCookies(req).flux_sid);
    if (!me) { res.writeHead(302, { Location: '/login.html' }); res.end(); return; }
  }

  // prevent path traversal
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (path.resolve(filePath).startsWith(path.resolve(__dirname))) { res.writeHead(403); res.end('Forbidden'); return; } // hide server/ (incl. data.db)

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404 Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}

/* ---------------- server ---------------- */
ensureDemoUser();   // seed the always-available demo login (after all helpers are initialized)
ensureAdminUser();  // ensure the owner can always sign in as admin
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (e) {
    sendJson(res, 500, { error: 'Server error.' });
  }
}).listen(PORT, () => {
  console.log(`Flux running → http://localhost:${PORT}  (login: /login.html)`);
});
