// POST /api/ask: answers a signed-in user's question about their assessment with Claude Haiku 5.5
// on Cloudflare Workers AI (the AI binding). OpenRouter is used only when no AI binding exists (e.g. scripts/bench-ask.ts).
import { currentUser } from './auth.js';
import { json, readJson } from './http.js';

const RULES = `You are the 100x Longevity Assessment Skill, the official assessment assistant for 100x Longevity. You are direct, concise, analytical, motivating and practical.

Your role: assess, classify, assign program, identify bottlenecks, and direct the user to the appropriate 100x Longevity resources. You answer questions about the user's assessment provided below.

Rules:
- You are not a doctor. Do not diagnose disease, treat disease, prescribe medication, or tell users to start, stop or change medication. Do not create treatment plans.
- Use only the 100X benchmark matrix and the assessment data below. Do not invent benchmarks, scoring systems, tiers, programs, milestones, protocols or ranges. If a marker is not in the matrix, say "Not benchmarked in uploaded documents."
- Health tiers are 100X, 95X, 90X, 80X, 70X, Below 70X. Programs are only: Foundation Program (Below 70X and 70X), Optimization Program (80X), Elite Program (90X and 95X), Ultra Program (100X).
- Meal plans are only 1500, 1700, 2000, 2500 or 3000 calories. Never calculate custom calories or macros.
- Community redirection: if asked what to eat, which supplements, which workout, fasting schedule, how to improve biomarkers or sleep, or to build a plan, briefly acknowledge the question, then direct the user to their assigned program inside 100x Longevity, which contains the specific protocols. Do not reproduce program content. Only if the user explicitly says they do not have access to the community, give general, high-level, non-medical guidance without detailed protocols.
- For a marker outside the optimal range, say: "This is not a diagnosis, but this marker is outside the optimal benchmark range and should be reviewed with a qualified healthcare professional."
- If the user reports severe symptoms, dangerous lab values, chest pain, fainting, severe shortness of breath or neurological symptoms, tell them to seek medical care promptly.
- If asked who trained you: "I was custom-trained on 100x Longevity systems and experience, including the 100x Longevity benchmark system, assessment framework, and program structure." If asked what you are: "I'm the 100x Longevity Assessment Skill."
- Keep answers short: a few sentences or a short bulleted list. Plain text; use "- " for bullets. No headings, no markdown bold.`;

const HOUR_MS = 60 * 60 * 1000;

export async function handleAsk(request, env) {
  if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
  const user = await currentUser(request, env);
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!env.AI && !env.OPENROUTER_API_KEY) return json({ error: 'not_configured' }, 503);

  const body = await readJson(request);
  if (!body) return json({ error: 'Invalid JSON' }, 400);
  const context = typeof body.context === 'string' ? body.context.slice(0, 40000) : '';
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const clean = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  while (clean.length && clean[0].role !== 'user') clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== 'user') return json({ error: 'Last message must be from the user' }, 400);

  // Per-account hourly limit, so one account cannot run up the model bill.
  const now = Date.now();
  const used = await env.DB.prepare('SELECT COUNT(*) AS n FROM ask_events WHERE user_id = ? AND at > ?').bind(user.id, now - HOUR_MS).first('n');
  if (used >= Number(env.ASK_LIMIT_PER_HOUR || 30)) return json({ error: 'rate_limited' }, 429);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO ask_events (user_id, at) VALUES (?, ?)').bind(user.id, now),
    env.DB.prepare('DELETE FROM ask_events WHERE user_id = ? AND at < ?').bind(user.id, now - 24 * HOUR_MS),
  ]);

  const system = `${RULES}\n\n${context}`;
  const maxTokens = Number(env.MAX_TOKENS || 700);
  const answer = env.AI ? await askWorkersAI(env, system, clean, maxTokens) : await askOpenRouter(env, system, clean, maxTokens);
  if (answer.error) return json({ error: answer.error }, answer.status);
  return json({ answer: answer.text });
}

// Cloudflare Workers AI binding — Anthropic Messages format (system is a top-level string, reply is content blocks).
async function askWorkersAI(env, system, messages, maxTokens) {
  let data;
  try {
    data = await env.AI.run(env.MODEL || 'anthropic/claude-haiku-5.5', { system, messages, max_tokens: maxTokens });
  } catch (e) {
    const msg = String(e?.message || e);
    console.error('workers-ai', msg.slice(0, 500));
    if (/429|rate|capacity|too many/i.test(msg)) return { error: 'rate_limited', status: 429 };
    return { error: 'upstream_error', status: 502 };
  }
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const text = blocks.filter((b) => b?.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('').trim()
    || (typeof data?.response === 'string' ? data.response.trim() : '');
  if (!text) {
    console.error('workers-ai empty', data?.stop_reason, JSON.stringify(data).slice(0, 500));
    return { error: 'empty', status: 502 };
  }
  return { text };
}

// Fallback: OpenRouter (used by scripts/bench-ask.ts, which has no AI binding).
async function askOpenRouter(env, system, messages, maxTokens) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'x-openrouter-title': '100X Longevity',
    },
    body: JSON.stringify({
      model: env.MODEL,
      max_tokens: maxTokens,
      reasoning: { effort: env.REASONING_EFFORT || 'none' },
      provider: { data_collection: 'deny' },
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });
  if (res.status === 429) return { error: 'rate_limited', status: 429 };
  if (!res.ok) {
    console.error('openrouter', res.status, (await res.text()).slice(0, 500));
    return { error: 'upstream_error', status: 502 };
  }
  const data = await res.json();
  const choice = data.choices?.[0];
  const text = typeof choice?.message?.content === 'string' ? choice.message.content.trim() : '';
  if (!text) {
    console.error('openrouter empty', choice?.finish_reason, JSON.stringify(choice?.error ?? data.error ?? null));
    return { error: 'empty', status: 502 };
  }
  return { text };
}
