/**
 * 100X Longevity API — Cloudflare Worker.
 * Serves the web build in dist/ as static assets; only /api/* runs this code.
 *   /api/auth/*  email + password accounts (D1)
 *   /api/ask     answers a signed-in user's question with Claude Haiku 5.5 on Workers AI (AI binding, no API key)
 *
 * Bindings and vars (wrangler.toml): DB (D1), AI (Workers AI), MODEL, MAX_TOKENS, ASK_LIMIT_PER_HOUR
 * Optional secret OPENROUTER_API_KEY: only used if the AI binding is missing.
 */
import { handleAsk } from './ask.js';
import { handleAuth } from './auth.js';
import { json } from './http.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/auth/')) return handleAuth(request, env, pathname);
    if (pathname === '/api/ask') return handleAsk(request, env);
    return json({ error: 'Not found' }, 404);
  },
};
