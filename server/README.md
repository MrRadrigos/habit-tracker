# Habit insights proxy

Tiny Cloudflare Worker that holds the Anthropic API key server-side and exposes
a single `POST /insight` endpoint that the mobile app calls.

## One-time deploy

1. Install Wrangler CLI: `npm i -g wrangler`
2. Login to Cloudflare: `wrangler login`
3. From this folder: `wrangler deploy`
   You'll get a URL like `https://habit-insights.<your-subdomain>.workers.dev`.
4. Set the API key as a Cloudflare secret (it never lands in code or git):
   `wrangler secret put ANTHROPIC_API_KEY`
   Paste your `sk-ant-...` key when prompted.

## Wire the app

Edit `app.json` at the repo root and put the worker URL into `expo.extra.insightsUrl`,
e.g.:

```
"extra": {
  "insightsUrl": "https://habit-insights.your-subdomain.workers.dev/insight"
}
```

The app reads it via `expo-constants`. If `insightsUrl` is empty, the app falls
back to a local insight generator (no AI).

## Endpoint contract

`POST /insight`

```json
{
  "summary": [
    { "name": "Meditation", "streak": 4, "weekRate": 86 }
  ],
  "lang": "ru"
}
```

Response: `{ "text": "..." }`
