/**
 * 100X Longevity API — Cloudflare Worker.
 * Serves the web build in dist/ as static assets; only /api/* runs this code.
 *   /api/auth/*  email + password accounts (D1)
 *   /api/ask     answers a signed-in user's question through OpenRouter; the API key never reaches the app
 *
 * Secrets (set with `npx wrangler secret put NAME`):
 *   OPENROUTER_API_KEY  required for Ask
 * Bindings and vars (wrangler.toml): DB (D1), MODEL, MAX_TOKENS, REASONING_EFFORT, ASK_LIMIT_PER_HOUR
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
