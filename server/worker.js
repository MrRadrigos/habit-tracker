const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPTS = {
  ru: 'Ты доброжелательный коуч по привычкам. Дай один краткий персональный инсайт (2–3 предложения) на основе данных пользователя. Без списков, без markdown. Тон — тёплый и мотивирующий.',
  en: 'You are a supportive habit coach. Give one short personal insight (2–3 sentences) based on the user data. No lists, no markdown. Warm, motivating tone.',
};

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
  });
}

function buildUserMessage(summary, lang) {
  const header =
    lang === 'en' ? 'User habits this week:\n' : 'Привычки пользователя за неделю:\n';
  const lines = summary
    .map(
      (s) =>
        `- ${String(s.name).slice(0, 60)}: streak ${Number(s.streak) || 0}d, week ${
          Number(s.weekRate) || 0
        }%`
    )
    .join('\n');
  return header + lines;
}

function isValidPayload(body) {
  if (!body || typeof body !== 'object') return false;
  if (!Array.isArray(body.summary)) return false;
  if (body.summary.length === 0 || body.summary.length > 50) return false;
  for (const s of body.summary) {
    if (typeof s?.name !== 'string') return false;
  }
  if (body.lang !== 'ru' && body.lang !== 'en') return false;
  return true;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    const url = new URL(request.url);
    if (url.pathname !== '/insight' || request.method !== 'POST') {
      return json({ error: 'not_found' }, 404);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'server_misconfigured' }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }
    if (!isValidPayload(body)) {
      return json({ error: 'invalid_payload' }, 400);
    }

    const { summary, lang } = body;

    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 220,
        system: SYSTEM_PROMPTS[lang],
        messages: [{ role: 'user', content: buildUserMessage(summary, lang) }],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return json({ error: 'upstream_error', status: upstream.status, detail }, 502);
    }

    const data = await upstream.json();
    const text = data?.content?.[0]?.text?.trim();
    if (!text) return json({ error: 'empty_response' }, 502);
    return json({ text });
  },
};
