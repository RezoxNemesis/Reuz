# Reuz

A clock app with a direct MCP connection, so Claude can read and change the clock.

## What it does

- `/` shows a live clock page.
- `/api/clock` returns the current time as JSON.
- `/mcp/<token>` is the MCP endpoint Claude connects to. It needs the access token.

Claude's tools:
- `get_clock` reads the time, timezone and format.
- `set_timezone` changes the timezone (any IANA name, e.g. `Asia/Kolkata`).
- `set_format` switches between `12h` and `24h`.

## One-time setup

1. In Cloudflare, open the **reuz** Worker (created on first deploy from this repo).
2. Go to **Settings → Variables and secrets** and add a **Secret** named `MCP_TOKEN`.
   Use a long random string, at least 32 characters. Do not put it in the repo.
3. The connector URL is `https://<your-worker-host>/mcp/<MCP_TOKEN>`.
   Add it in Claude under **Settings → Connectors → Add custom connector**.

Until `MCP_TOKEN` is set, the MCP endpoint returns 503 and refuses all requests.

## Local development

```
npm install
npm test
echo 'MCP_TOKEN=local-test-token-at-least-32-chars-long' > .dev.vars
npx wrangler dev --local
BASE=http://127.0.0.1:8787 MCP_TOKEN=local-test-token-at-least-32-chars-long scripts/smoke.sh
```

`.dev.vars` is gitignored and must never be committed.
