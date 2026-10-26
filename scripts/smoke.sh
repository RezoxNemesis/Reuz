#!/usr/bin/env bash
# Smoke test against a running Worker. Usage: BASE=http://127.0.0.1:8787 MCP_TOKEN=... scripts/smoke.sh
set -euo pipefail
BASE="${BASE:-http://127.0.0.1:8787}"
: "${MCP_TOKEN:?set MCP_TOKEN}"
U="$BASE/mcp/$MCP_TOKEN"
H=(-H 'content-type: application/json' -H 'accept: application/json, text/event-stream')
curl -fsS "$BASE/" >/dev/null && echo "ok page"
curl -fsS "$BASE/api/clock" | grep -q '"time"' && echo "ok api"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/mcp/wrong" "${H[@]}" -d '{}')
[ "$code" = "401" ] && echo "ok wrong token rejected"
curl -fsS -D /tmp/reuz-h.txt "${H[@]}" -X POST "$U" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"1"}}}' >/dev/null && echo "ok initialize"
SID=$(grep -i '^mcp-session-id' /tmp/reuz-h.txt | tr -d '\r' | awk '{print $2}' || true)
S=(); [ -n "$SID" ] && S=(-H "mcp-session-id: $SID")
curl -fsS "${H[@]}" "${S[@]}" -X POST "$U" -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' >/dev/null
curl -fsS "${H[@]}" "${S[@]}" -X POST "$U" -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"set_timezone","arguments":{"timezone":"Asia/Kolkata"}}}' | grep -q 'Asia/Kolkata' && echo "ok set_timezone"
echo "smoke passed"
