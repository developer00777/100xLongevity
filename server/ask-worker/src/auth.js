// Email + password accounts on D1. Passwords are stored as salted PBKDF2-SHA256 hashes;
// sessions are random bearer tokens of which only the SHA-256 is stored.
import { json, readJson } from './http.js';

const ITERATIONS = 100_000; // the Workers runtime does not allow more for PBKDF2
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_AFTER = 10; // failed sign-ins per email inside the window
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const b64url = (buf) => b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha256hex = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

// Used when the email is unknown, so a failed sign-in takes the same time either way.
const DUMMY_SALT = new Uint8Array(16);

async function createSession(env, userId) {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  await env.DB.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256hex(token), userId, now, now + SESSION_MS).run();
  return token;
}

// The signed-in user for an `Authorization: Bearer <token>` request, or null.
export async function currentUser(request, env) {
  const m = /^Bearer (\S+)$/.exec(request.headers.get('Authorization') ?? '');
  if (!m || !env.DB) return null;
  return env.DB.prepare('SELECT users.id, users.email, sessions.id AS session_id FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ? AND sessions.expires_at > ?')
    .bind(await sha256hex(m[1]), Date.now()).first();
}

function credentials(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  return { email, password };
}

async function signup(request, env) {
  const { email, password } = credentials(await readJson(request));
  if (!EMAIL.test(email) || email.length > 254) return json({ error: 'invalid_email' }, 400);
  if (password.length < 8 || password.length > 128) return json({ error: 'weak_password' }, 400);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare('INSERT INTO users (id, email, password_hash, password_salt, password_iterations, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, email, b64(hash), b64(salt), ITERATIONS, Date.now()).run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e))) return json({ error: 'email_taken' }, 409);
    throw e;
  }
  return json({ token: await createSession(env, id), user: { email } }, 201);
}

async function login(request, env) {
  const { email, password } = credentials(await readJson(request));
  const now = Date.now();
  const fails = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_failures WHERE email = ? AND at > ?').bind(email, now - LOCKOUT_WINDOW_MS).first('n');
  if (fails >= LOCKOUT_AFTER) return json({ error: 'too_many_attempts' }, 429);
  const user = await env.DB.prepare('SELECT id, password_hash, password_salt, password_iterations FROM users WHERE email = ?').bind(email).first();
  const hash = await pbkdf2(password, user ? unb64(user.password_salt) : DUMMY_SALT, user?.password_iterations ?? ITERATIONS);
  if (!user || !crypto.subtle.timingSafeEqual(hash, unb64(user.password_hash))) {
    await env.DB.prepare('INSERT INTO login_failures (email, at) VALUES (?, ?)').bind(email, now).run();
    return json({ error: 'invalid_credentials' }, 401);
  }
  await env.DB.prepare('DELETE FROM login_failures WHERE email = ? OR at < ?').bind(email, now - LOCKOUT_WINDOW_MS).run();
  return json({ token: await createSession(env, user.id), user: { email } });
}

const SIGNED_IN = {
  'GET /api/auth/me': async (user) => json({ user: { email: user.email } }),
  'POST /api/auth/logout': async (user, env) => {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(user.session_id).run();
    return json({ ok: true });
  },
  // Apple requires in-app account deletion for apps that let people create accounts.
  'DELETE /api/auth/account': async (user, env) => {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM ask_events WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id),
    ]);
    return json({ ok: true });
  },
};

export async function handleAuth(request, env, path) {
  if (!env.DB) return json({ error: 'not_configured' }, 503);
  const route = `${request.method} ${path}`;
  if (route === 'POST /api/auth/signup') return signup(request, env);
  if (route === 'POST /api/auth/login') return login(request, env);
  const handler = SIGNED_IN[route];
  if (!handler) return json({ error: 'Not found' }, 404);
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'unauthorized' }, 401);
  return handler(user, env);
}
