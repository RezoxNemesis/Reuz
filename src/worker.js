import { DurableObject } from "cloudflare:workers";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";
import { DEFAULT_SETTINGS, FORMATS, formatClock, isValidTimezone, normalizeSettings } from "./clock.js";
import { PAGE_HTML } from "./page.js";
import { PRIVACY_HTML } from "./legal.js";

// One Durable Object holds the clock settings and the access token, so both persist between requests.
export class ClockState extends DurableObject {
  async getSettings() {
    const stored = await this.ctx.storage.get("settings");
    return normalizeSettings(stored ?? DEFAULT_SETTINGS);
  }
  async saveSettings(next) {
    const clean = normalizeSettings(next);
    await this.ctx.storage.put("settings", clean);
    return clean;
  }
  async getToken() {
    return (await this.ctx.storage.get("mcpToken")) ?? null;
  }
  // First visit only: create the token once. Later visits get nothing back.
  async setupToken() {
    const existing = await this.ctx.storage.get("mcpToken");
    if (existing) return { created: false };
    const token = newToken();
    await this.ctx.storage.put("mcpToken", token);
    return { created: true, token };
  }
  // Replacing the token requires presenting the current one.
  async rotateToken(presented) {
    const current = await this.ctx.storage.get("mcpToken");
    if (!current || !sameSecret(presented, current)) return null;
    const token = newToken();
    await this.ctx.storage.put("mcpToken", token);
    return token;
  }
}

function newToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const html = (body, status = 200) =>
  new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });

// Constant-time string comparison so the token cannot be guessed by timing.
function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const page = (title, message) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;background:#0b0d12;color:#e8ecf5;margin:0;padding:24px;max-width:720px}code{display:block;word-break:break-all;background:#161b26;padding:12px;border-radius:8px;margin:12px 0;user-select:all}p{color:#9aa6bd}</style>
</head><body><h1>${title}</h1>${message}</body></html>`;

function clockServer(stub) {
  const server = new McpServer({ name: "Reuz Clock", version: "0.2.0" });
  const text = (value) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] });

  server.registerTool(
    "get_clock",
    {
      description: "Read the current time shown by the Reuz clock, in its configured timezone and 12h/24h format.",
      inputSchema: {},
    },
    async () => text(formatClock(new Date(), await stub.getSettings())),
  );

  server.registerTool(
    "set_timezone",
    {
      description: "Change the clock timezone using an IANA name such as Asia/Kolkata, Europe/London or America/New_York.",
      inputSchema: { timezone: z.string().min(1).max(64) },
    },
    async ({ timezone }) => {
      if (!isValidTimezone(timezone)) {
        return { isError: true, content: [{ type: "text", text: `Unknown timezone: ${timezone}` }] };
      }
      const current = await stub.getSettings();
      const saved = await stub.saveSettings({ ...current, timezone });
      return text(formatClock(new Date(), saved));
    },
  );

  server.registerTool(
    "set_format",
    {
      description: "Switch the clock between 12-hour and 24-hour time.",
      inputSchema: { format: z.enum(["12h", "24h"]) },
    },
    async ({ format }) => {
      const current = await stub.getSettings();
      const saved = await stub.saveSettings({ ...current, format });
      return text(formatClock(new Date(), saved));
    },
  );

  return server;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const stub = env.CLOCK.getByName("main");

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return html(PAGE_HTML);
    }

    if (url.pathname === "/privacy") {
      return html(PRIVACY_HTML);
    }

    if (url.pathname === "/api/clock") {
      return json(formatClock(new Date(), await stub.getSettings()));
    }

    // Settings for the clock page. Only the timezone and format can change here; the MCP token is never returned.
    if (url.pathname === "/api/settings") {
      if (request.method === "GET") {
        return json(await stub.getSettings());
      }
      if (request.method === "POST") {
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Send JSON with timezone and format." }, 400);
        }
        if (!isValidTimezone(body?.timezone) || !FORMATS.includes(body?.format)) {
          return json({ error: "Unknown timezone or format." }, 400);
        }
        return json(await stub.saveSettings({ timezone: body.timezone, format: body.format }));
      }
      return json({ error: "Method not allowed" }, 405);
    }

    // First visit creates the token and shows the connector URL once. Later visits never reveal it.
    if (url.pathname === "/setup") {
      const result = await stub.setupToken();
      if (!result.created) {
        return html(page("Already set up", "<p>The connector URL was shown on the first visit. To replace it, use the reset link that was shown then, or ask for a new reset.</p>"), 409);
      }
      const link = `${url.origin}/mcp/${result.token}`;
      return html(page("Reuz is ready", `<p>Copy this connector URL into Claude under Settings → Connectors → Add custom connector. It is shown only once.</p><code>${link}</code><p>To replace it later, open <code style="display:inline;padding:2px 6px">${url.origin}/setup/reset?token=YOUR_CURRENT_TOKEN</code>.</p>`));
    }

    // Replacing the token needs the current token, so only its owner can do it.
    if (url.pathname === "/setup/reset") {
      const presented = url.searchParams.get("token") ?? "";
      const next = await stub.rotateToken(presented);
      if (!next) return html(page("Not allowed", "<p>The current token is required to reset.</p>"), 401);
      return html(page("New connector URL", `<p>Replace the old connector URL with this one. It is shown only once.</p><code>${url.origin}/mcp/${next}</code>`));
    }

    if (url.pathname.startsWith("/mcp/")) {
      const presented = url.pathname.slice("/mcp/".length);
      const current = await stub.getToken();
      if (!current) {
        return json({ error: "Not set up yet. Open /setup once to create the connector URL." }, 503);
      }
      if (!sameSecret(presented, current)) {
        return json({ error: "Unauthorized" }, 401);
      }
      return createMcpHandler(() => clockServer(stub), { route: url.pathname, responseMode: "auto" })(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};
