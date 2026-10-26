// Reuz clock page: glass UI, smooth transitions, and a settings sheet that saves through /api/settings.
export const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0d12">
<title>Reuz Clock</title>
<style>
:root { --bg:#0b0d12; --ink:#eef2fb; --muted:#9aa6bd; --accent:#7cc4ff; --accent2:#b38cff; --glass:rgba(255,255,255,.08); --glass-border:rgba(255,255,255,.16); --ease:cubic-bezier(.2,.8,.2,1); }
* { box-sizing:border-box; }
html, body { height:100%; margin:0; }
body { background:var(--bg); color:var(--ink); font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; overflow:hidden; -webkit-font-smoothing:antialiased; }
.aurora { position:fixed; inset:-20%; z-index:0; background:radial-gradient(40% 40% at 20% 30%,rgba(124,196,255,.35),transparent 60%),radial-gradient(35% 35% at 80% 70%,rgba(179,140,255,.35),transparent 60%),radial-gradient(30% 30% at 50% 90%,rgba(94,234,212,.25),transparent 60%); filter:blur(40px); animation:drift 18s var(--ease) infinite alternate; }
@keyframes drift { 0% { transform:translate3d(-3%,-2%,0) scale(1); } 100% { transform:translate3d(3%,2%,0) scale(1.08); } }
.app { position:relative; z-index:1; min-height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:max(24px,env(safe-area-inset-top)) 20px max(24px,env(safe-area-inset-bottom)); }
.topbar { position:fixed; top:max(14px,env(safe-area-inset-top)); right:16px; z-index:2; }
.glass { background:var(--glass); border:1px solid var(--glass-border); backdrop-filter:blur(24px) saturate(160%); -webkit-backdrop-filter:blur(24px) saturate(160%); box-shadow:0 20px 60px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.12); }
.pill { border-radius:999px; padding:10px 18px; color:var(--ink); font:inherit; font-size:14px; cursor:pointer; transition:transform .25s var(--ease), background .25s; }
.pill:hover { background:rgba(255,255,255,.14); }
.pill:active { transform:scale(.96); }
.card { border-radius:28px; padding:32px 26px; text-align:center; max-width:min(92vw,720px); width:100%; opacity:0; transform:translateY(16px) scale(.98); animation:rise .9s var(--ease) .1s forwards; }
@keyframes rise { to { opacity:1; transform:none; } }
#time { font-size:clamp(52px,15vw,132px); font-weight:650; letter-spacing:.02em; font-variant-numeric:tabular-nums; display:flex; justify-content:center; align-items:baseline; line-height:1.05; }
.digit { display:inline-block; background:linear-gradient(120deg,#fff 10%,var(--accent) 60%,var(--accent2)); -webkit-background-clip:text; background-clip:text; color:transparent; }
.digit.changing { animation:flip .5s var(--ease); }
@keyframes flip { 0% { transform:translateY(-35%); opacity:.15; filter:blur(4px); } 100% { transform:none; opacity:1; filter:none; } }
.sep { opacity:.5; }
.ampm { font-size:.3em; margin-left:.3em; color:var(--muted); align-self:flex-start; margin-top:.4em; }
#date { margin-top:16px; font-size:clamp(16px,3.2vw,22px); color:var(--muted); }
.zone { margin-top:14px; display:inline-flex; gap:8px; align-items:center; padding:6px 14px; border-radius:999px; font-size:13px; color:var(--muted); background:rgba(255,255,255,.06); border:1px solid var(--glass-border); }
.dot { width:8px; height:8px; border-radius:50%; background:#5eead4; box-shadow:0 0 10px #5eead4; animation:pulse 2s infinite; }
@keyframes pulse { 50% { opacity:.35; } }
.overlay { position:fixed; inset:0; z-index:5; background:rgba(3,4,8,.55); opacity:0; pointer-events:none; transition:opacity .35s var(--ease); }
.overlay.open { opacity:1; pointer-events:auto; }
.sheet { position:fixed; left:50%; bottom:0; z-index:6; width:min(100%,560px); transform:translate(-50%,105%); transition:transform .5s var(--ease); border-radius:28px 28px 0 0; padding:22px 22px max(22px,env(safe-area-inset-bottom)); max-height:92vh; overflow:auto; }
.sheet.open { transform:translate(-50%,0); }
.grab { width:44px; height:5px; border-radius:99px; background:rgba(255,255,255,.25); margin:0 auto 14px; }
.sheet h2 { margin:0 0 6px; font-size:18px; font-weight:600; }
label { display:block; font-size:13px; color:var(--muted); margin:16px 0 6px; }
select, input { width:100%; font:inherit; font-size:16px; color:var(--ink); background:rgba(255,255,255,.07); border:1px solid var(--glass-border); border-radius:14px; padding:12px 14px; outline:none; transition:border-color .2s, box-shadow .2s; }
select:focus, input:focus { border-color:var(--accent); box-shadow:0 0 0 4px rgba(124,196,255,.18); }
select option { background:#151923; color:#eef2fb; }
.seg { display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:4px; border-radius:14px; background:rgba(255,255,255,.06); }
.seg button { font:inherit; color:var(--muted); background:transparent; border:0; border-radius:10px; padding:10px; cursor:pointer; transition:background .3s var(--ease), color .3s; }
.seg button[aria-pressed="true"] { background:rgba(255,255,255,.16); color:var(--ink); box-shadow:0 4px 14px rgba(0,0,0,.25); }
.actions { display:flex; gap:10px; margin-top:20px; }
.btn { flex:1; font:inherit; font-weight:600; border:0; border-radius:16px; padding:14px; color:#06121a; background:linear-gradient(120deg,var(--accent),var(--accent2)); cursor:pointer; transition:transform .2s var(--ease), opacity .2s; }
.btn:active { transform:scale(.98); }
.btn:disabled { opacity:.6; }
.btn.ghost { background:rgba(255,255,255,.1); color:var(--ink); border:1px solid var(--glass-border); }
.status { min-height:20px; font-size:13px; color:var(--muted); margin-top:12px; text-align:center; }
.status.err { color:#ff8a8a; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation:none !important; transition:none !important; } .card { opacity:1; transform:none; } }
</style>
</head>
<body>
<div class="aurora" aria-hidden="true"></div>
<div class="topbar"><button class="pill glass" id="openSettings" aria-haspopup="dialog" aria-controls="sheet">Settings</button></div>
<main class="app">
  <section class="card glass">
    <div id="time" aria-label="Current time"></div>
    <div id="date"></div>
    <div class="zone"><span class="dot"></span><span id="zone">Loading…</span></div>
  </section>
</main>
<div class="overlay" id="overlay"></div>
<section class="sheet glass" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
  <div class="grab"></div>
  <h2 id="sheetTitle">Clock settings</h2>
  <label for="tz">Timezone</label>
  <select id="tz"></select>
  <label for="tzCustom">Or type any IANA name</label>
  <input id="tzCustom" placeholder="e.g. Africa/Nairobi" autocomplete="off" autocapitalize="off" spellcheck="false">
  <label>Format</label>
  <div class="seg" role="group" aria-label="Time format">
    <button type="button" data-format="24h" aria-pressed="true">24-hour</button>
    <button type="button" data-format="12h" aria-pressed="false">12-hour</button>
  </div>
  <div class="actions">
    <button class="btn ghost" type="button" id="cancel">Cancel</button>
    <button class="btn" type="button" id="save">Save</button>
  </div>
  <div class="status" id="status" role="status"></div>
</section>
<script>
(function () {
  var ZONES = ["UTC","Asia/Kolkata","Asia/Dubai","Asia/Singapore","Asia/Tokyo","Europe/London","Europe/Paris","Europe/Berlin","America/New_York","America/Chicago","America/Los_Angeles","Australia/Sydney","Pacific/Auckland"];
  var state = { timezone: "UTC", format: "24h" };
  var draftFormat = "24h";
  var lastChars = "";
  function $(id) { return document.getElementById(id); }
  var timeEl = $("time"), dateEl = $("date"), zoneEl = $("zone"), sheet = $("sheet"), overlay = $("overlay");
  var statusEl = $("status"), tzSel = $("tz"), tzCustom = $("tzCustom"), saveBtn = $("save");

  ZONES.forEach(function (z) { var o = document.createElement("option"); o.value = z; o.textContent = z; tzSel.appendChild(o); });

  function validZone(z) { try { new Intl.DateTimeFormat("en-US", { timeZone: z }); return true; } catch (e) { return false; } }

  function render() {
    var d = new Date();
    var text = new Intl.DateTimeFormat("en-GB", { timeZone: state.timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: state.format === "12h" }).format(d);
    var m = text.match(/^(.*?)\s*(am|pm)?$/i);
    var core = m ? m[1] : text;
    var ap = m && m[2] ? m[2] : "";
    var html = "";
    for (var i = 0; i < core.length; i++) {
      var ch = core.charAt(i);
      if (/\d/.test(ch)) {
        var changed = lastChars.length > 0 && lastChars.charAt(i) !== ch;
        html += '<span class="digit' + (changed ? ' changing' : '') + '">' + ch + '</span>';
      } else {
        html += '<span class="sep">' + ch + '</span>';
      }
    }
    if (ap) html += '<span class="ampm">' + ap.toUpperCase() + '</span>';
    timeEl.innerHTML = html;
    lastChars = core;
    dateEl.textContent = new Intl.DateTimeFormat("en-GB", { timeZone: state.timezone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
    zoneEl.textContent = state.timezone + " · " + (state.format === "12h" ? "12-hour" : "24-hour");
  }

  function applySettings(s) {
    if (s && validZone(s.timezone)) state.timezone = s.timezone;
    if (s && (s.format === "12h" || s.format === "24h")) state.format = s.format;
    render();
  }

  function load() {
    fetch("/api/settings", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(applySettings)
      .catch(function () { zoneEl.textContent = "Offline · " + state.timezone; });
  }

  function setFormatButtons(f) {
    draftFormat = f;
    document.querySelectorAll("[data-format]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-format") === f));
    });
  }

  function openSheet() {
    var known = ZONES.indexOf(state.timezone) >= 0;
    tzSel.value = known ? state.timezone : ZONES[0];
    tzCustom.value = known ? "" : state.timezone;
    setFormatButtons(state.format);
    statusEl.textContent = "";
    statusEl.className = "status";
    sheet.classList.add("open");
    overlay.classList.add("open");
  }

  function closeSheet() {
    sheet.classList.remove("open");
    overlay.classList.remove("open");
  }

  function save() {
    var tz = tzCustom.value.trim() || tzSel.value;
    if (!validZone(tz)) {
      statusEl.textContent = "That timezone isn't recognised.";
      statusEl.className = "status err";
      return;
    }
    saveBtn.disabled = true;
    statusEl.textContent = "Saving…";
    statusEl.className = "status";
    fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ timezone: tz, format: draftFormat }),
    })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (s) { applySettings(s); statusEl.textContent = "Saved"; setTimeout(closeSheet, 500); })
      .catch(function () { statusEl.textContent = "Couldn't save. Check your connection."; statusEl.className = "status err"; })
      .then(function () { saveBtn.disabled = false; });
  }

  $("openSettings").onclick = openSheet;
  overlay.onclick = closeSheet;
  $("cancel").onclick = closeSheet;
  saveBtn.onclick = save;
  document.querySelectorAll("[data-format]").forEach(function (b) {
    b.onclick = function () { setFormatButtons(b.getAttribute("data-format")); };
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

  render();
  load();
  setInterval(render, 1000);
  setInterval(load, 30000);
})();
</script>
</body>
</html>
`;
