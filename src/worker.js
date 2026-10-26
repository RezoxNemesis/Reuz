import { DurableObject } from "cloudflare:workers";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";
import { DEFAULT_SETTINGS, formatClock, isValidTimezone, normalizeSettings } from "./clock.js";
import { PAGE_HTML } from "./page.js";

// One Durable Object holds the clock settings so they persist between requests.
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
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

// Constant-time string comparison so the token cannot be guessed by timing.
function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function clockServer(stub) {
  const server = new McpServer({ name: "Reuz Clock", version: "0.1.0" });
  const text = (value) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] });

  server.registerTool(
    "get_clock",
    {
      description: "Read the current time shown by the Reuz clock, in its configured timezone and 12h/24h format.",
      inputSchema: {},
    },
    async () => {
      const settings = await stub.getSettings();
      return text(formatClock(new Date(), settings));
    },
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
      return new Response(PAGE_HTML, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }

    if (url.pathname === "/api/clock") {
      return json(formatClock(new Date(), await stub.getSettings()));
    }

    if (url.pathname.startsWith("/mcp/")) {
      const token = url.pathname.slice("/mcp/".length);
      if (!env.MCP_TOKEN) {
        return json({ error: "MCP access is not configured yet. Set the MCP_TOKEN secret." }, 503);
      }
      if (!sameSecret(token, env.MCP_TOKEN)) {
        return json({ error: "Unauthorized" }, 401);
      }
      return createMcpHandler(() => clockServer(stub), { route: url.pathname, responseMode: "auto" })(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};
