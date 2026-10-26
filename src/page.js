// The clock page. It reads the same settings the MCP tools change, so Claude's changes show up here.
export const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reuz Clock</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b0d12; color: #e8ecf5; font-family: system-ui, sans-serif; }
  main { text-align: center; padding: 24px; }
  #time { font-size: clamp(48px, 14vw, 128px); font-variant-numeric: tabular-nums; font-weight: 600; letter-spacing: 0.02em; }
  #date { margin-top: 12px; font-size: clamp(16px, 3vw, 22px); color: #9aa6bd; }
  #zone { margin-top: 8px; font-size: 14px; color: #5f6b82; }
</style>
</head>
<body>
<main>
  <div id="time">--:--:--</div>
  <div id="date"></div>
  <div id="zone"></div>
</main>
<script>
  async function refresh() {
    try {
      const res = await fetch('/api/clock', { cache: 'no-store' });
      const data = await res.json();
      document.getElementById('time').textContent = data.time;
      document.getElementById('date').textContent = data.date;
      document.getElementById('zone').textContent = data.timezone + ' · ' + data.format;
    } catch (e) {
      document.getElementById('zone').textContent = 'Reconnecting…';
    }
  }
  refresh();
  setInterval(refresh, 1000);
</script>
</body>
</html>
`;
