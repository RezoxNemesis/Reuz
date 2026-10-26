// Reuz: a clock app with World clocks, Timer, Stopwatch and Alarms. Glass UI, transitions, and
// native notifications through window.ReuzNative when running inside the Android app.
export const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0d12">
<title>Reuz Clock</title>
<style>
:root { --bg:#0b0d12; --ink:#eef2fb; --muted:#9aa6bd; --accent:#7cc4ff; --accent2:#b38cff; --good:#5eead4; --bad:#ff8a8a; --glass:rgba(255,255,255,.08); --glass-border:rgba(255,255,255,.16); --ease:cubic-bezier(.2,.8,.2,1); }
* { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
html, body { height:100%; margin:0; }
body { background:var(--bg); color:var(--ink); font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; overflow:hidden; -webkit-font-smoothing:antialiased; }
.aurora { position:fixed; inset:-20%; z-index:0; pointer-events:none; background:radial-gradient(40% 40% at 20% 30%,rgba(124,196,255,.32),transparent 60%),radial-gradient(35% 35% at 80% 70%,rgba(179,140,255,.32),transparent 60%),radial-gradient(30% 30% at 50% 90%,rgba(94,234,212,.22),transparent 60%); filter:blur(40px); animation:drift 18s var(--ease) infinite alternate; }
@keyframes drift { 0% { transform:translate3d(-3%,-2%,0) scale(1); } 100% { transform:translate3d(3%,2%,0) scale(1.08); } }
.glass { background:var(--glass); border:1px solid var(--glass-border); backdrop-filter:blur(24px) saturate(160%); -webkit-backdrop-filter:blur(24px) saturate(160%); box-shadow:0 20px 60px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.12); }
.app { position:fixed; inset:0; z-index:1; display:flex; flex-direction:column; }
.top { display:flex; align-items:center; justify-content:space-between; padding:max(14px,env(safe-area-inset-top)) 18px 6px; }
.brand { font-weight:700; letter-spacing:.04em; font-size:17px; background:linear-gradient(120deg,#fff,var(--accent),var(--accent2)); -webkit-background-clip:text; background-clip:text; color:transparent; }
main { position:relative; flex:1; overflow:hidden; }
.panel { position:absolute; inset:0; overflow:auto; padding:10px 18px 110px; opacity:0; transform:translateY(14px) scale(.99); pointer-events:none; transition:opacity .45s var(--ease), transform .45s var(--ease); -webkit-overflow-scrolling:touch; }
.panel.active { opacity:1; transform:none; pointer-events:auto; }
.card { border-radius:24px; padding:20px; margin-bottom:14px; }
.hero { text-align:center; padding:30px 22px; margin-top:6px; }
.bigtime { font-size:clamp(46px,14vw,112px); font-weight:650; letter-spacing:.02em; font-variant-numeric:tabular-nums; line-height:1.05; white-space:nowrap; }
.grad { background:linear-gradient(120deg,#fff 10%,var(--accent) 60%,var(--accent2)); -webkit-background-clip:text; background-clip:text; color:transparent; }
.digit { display:inline-block; }
.digit.changing { animation:flip .5s var(--ease); }
@keyframes flip { 0% { transform:translateY(-35%); opacity:.15; filter:blur(4px); } 100% { transform:none; opacity:1; filter:none; } }
.muted { color:var(--muted); }
.sub { margin-top:12px; font-size:clamp(15px,3vw,20px); color:var(--muted); }
.zone { margin-top:14px; display:inline-flex; gap:8px; align-items:center; padding:6px 14px; border-radius:999px; font-size:13px; color:var(--muted); background:rgba(255,255,255,.06); border:1px solid var(--glass-border); }
.dot { width:8px; height:8px; border-radius:50%; background:var(--good); box-shadow:0 0 10px var(--good); animation:pulse 2s infinite; }
@keyframes pulse { 50% { opacity:.35; } }
.grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.mini { margin:0; padding:18px; }
.label { font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
.value { margin-top:8px; font-size:20px; font-weight:600; font-variant-numeric:tabular-nums; }
.row { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:18px; margin-bottom:10px; background:rgba(255,255,255,.05); border:1px solid var(--glass-border); transition:transform .25s var(--ease), background .25s; }
.row:hover { background:rgba(255,255,255,.09); }
.row .main { flex:1; min-width:0; }
.row .title { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row .meta { font-size:13px; color:var(--muted); margin-top:3px; font-variant-numeric:tabular-nums; }
.row .right { font-size:20px; font-weight:600; font-variant-numeric:tabular-nums; }
.iconbtn { border:0; background:rgba(255,255,255,.08); color:var(--ink); border-radius:12px; padding:8px 12px; font:inherit; font-size:13px; cursor:pointer; transition:transform .2s var(--ease), background .2s; }
.iconbtn:active { transform:scale(.94); }
.iconbtn.danger { color:var(--bad); }
.toggle { position:relative; width:52px; height:30px; border-radius:99px; background:rgba(255,255,255,.14); border:1px solid var(--glass-border); cursor:pointer; transition:background .3s var(--ease); flex:none; }
.toggle::after { content:""; position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; transition:transform .35s var(--ease); box-shadow:0 2px 6px rgba(0,0,0,.3); }
.toggle[aria-checked="true"] { background:linear-gradient(120deg,var(--accent),var(--accent2)); }
.toggle[aria-checked="true"]::after { transform:translateX(22px); }
.chips { display:flex; gap:8px; flex-wrap:wrap; margin:10px 0 0; }
.chip { border:1px solid var(--glass-border); background:rgba(255,255,255,.06); color:var(--ink); border-radius:999px; padding:8px 14px; font:inherit; font-size:14px; cursor:pointer; transition:transform .2s var(--ease), background .2s; }
.chip:active { transform:scale(.95); }
.form { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
select, input { font:inherit; font-size:16px; color:var(--ink); background:rgba(255,255,255,.07); border:1px solid var(--glass-border); border-radius:14px; padding:12px 14px; outline:none; transition:border-color .2s, box-shadow .2s; min-width:0; }
select, input[type="text"], input[type="number"], input[type="time"] { flex:1 1 140px; }
select:focus, input:focus { border-color:var(--accent); box-shadow:0 0 0 4px rgba(124,196,255,.18); }
select option { background:#151923; color:#eef2fb; }
.btn { font:inherit; font-weight:600; border:0; border-radius:16px; padding:13px 18px; color:#06121a; background:linear-gradient(120deg,var(--accent),var(--accent2)); cursor:pointer; transition:transform .2s var(--ease), opacity .2s; }
.btn:active { transform:scale(.97); }
.btn:disabled { opacity:.6; }
.btn.ghost { background:rgba(255,255,255,.1); color:var(--ink); border:1px solid var(--glass-border); }
.btn.wide { flex:1; }
.pill { border-radius:999px; padding:9px 16px; color:var(--ink); font:inherit; font-size:14px; cursor:pointer; border:1px solid var(--glass-border); transition:transform .25s var(--ease), background .25s; }
.pill:hover { background:rgba(255,255,255,.14); }
.pill:active { transform:scale(.96); }
.controls { display:flex; gap:10px; margin-top:20px; justify-content:center; flex-wrap:wrap; }
.empty { text-align:center; color:var(--muted); padding:28px 10px; }
.tabs { position:fixed; left:50%; transform:translateX(-50%); bottom:max(12px,env(safe-area-inset-bottom)); z-index:3; display:flex; gap:4px; padding:6px; border-radius:24px; width:min(94vw,460px); }
.tab { flex:1; border:0; background:transparent; color:var(--muted); font:inherit; font-size:12px; padding:9px 2px; border-radius:18px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:3px; transition:background .35s var(--ease), color .35s; }
.tab svg { width:22px; height:22px; }
.tab[aria-selected="true"] { color:var(--ink); background:rgba(255,255,255,.14); box-shadow:0 4px 14px rgba(0,0,0,.25); }
.overlay { position:fixed; inset:0; z-index:5; background:rgba(3,4,8,.55); opacity:0; pointer-events:none; transition:opacity .35s var(--ease); }
.overlay.open { opacity:1; pointer-events:auto; }
.sheet { position:fixed; left:50%; bottom:0; z-index:6; width:min(100%,560px); transform:translate(-50%,105%); transition:transform .5s var(--ease); border-radius:28px 28px 0 0; padding:22px 22px max(22px,env(safe-area-inset-bottom)); max-height:92vh; overflow:auto; }
.sheet.open { transform:translate(-50%,0); }
.grab { width:44px; height:5px; border-radius:99px; background:rgba(255,255,255,.25); margin:0 auto 14px; }
.sheet h2 { margin:0 0 6px; font-size:18px; font-weight:600; }
label { display:block; font-size:13px; color:var(--muted); margin:16px 0 6px; }
.sheet select, .sheet input { width:100%; }
.seg { display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:4px; border-radius:14px; background:rgba(255,255,255,.06); }
.seg button { font:inherit; color:var(--muted); background:transparent; border:0; border-radius:10px; padding:10px; cursor:pointer; transition:background .3s var(--ease), color .3s; }
.seg button[aria-pressed="true"] { background:rgba(255,255,255,.16); color:var(--ink); box-shadow:0 4px 14px rgba(0,0,0,.25); }
.actions { display:flex; gap:10px; margin-top:20px; }
.actions .btn { flex:1; }
.status { min-height:20px; font-size:13px; color:var(--muted); margin-top:12px; text-align:center; }
.status.err { color:var(--bad); }
.alert { position:fixed; left:50%; top:50%; z-index:7; width:min(88vw,380px); transform:translate(-50%,-46%) scale(.94); opacity:0; pointer-events:none; transition:opacity .4s var(--ease), transform .5s var(--ease); border-radius:28px; padding:26px 22px; text-align:center; }
.alert.open { opacity:1; pointer-events:auto; transform:translate(-50%,-50%) scale(1); }
.alert .big { font-size:26px; font-weight:700; }
.alert .small { color:var(--muted); margin-top:8px; font-size:15px; }
.alert .btn { margin-top:20px; width:100%; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation:none !important; transition:none !important; } }
</style>
</head>
<body>
<div class="aurora" aria-hidden="true"></div>
<div class="app">
  <header class="top">
    <div class="brand">Reuz</div>
    <button class="pill glass" id="openSettings" aria-haspopup="dialog" aria-controls="sheet">Settings</button>
  </header>
  <main>
    <section class="panel active" id="p-clock" aria-label="Clock">
      <div class="card glass hero">
        <div class="bigtime" id="time" aria-label="Current time"></div>
        <div class="sub" id="date"></div>
        <div class="zone"><span class="dot"></span><span id="zone">Loading…</span></div>
      </div>
      <div class="grid">
        <div class="card glass mini"><div class="label">Next alarm</div><div class="value" id="nextAlarm">None set</div></div>
        <div class="card glass mini"><div class="label">Timers running</div><div class="value" id="timerCount">0</div></div>
      </div>
    </section>
    <section class="panel" id="p-world" aria-label="World clock">
      <div class="card glass">
        <div class="form">
          <select id="worldSel" aria-label="Pick a city timezone"></select>
          <input id="worldCustom" type="text" placeholder="Or type an IANA name" autocomplete="off" autocapitalize="off" spellcheck="false">
          <button class="btn" id="worldAdd">Add city</button>
        </div>
      </div>
      <div id="worldList"></div>
    </section>
    <section class="panel" id="p-timer" aria-label="Timer">
      <div class="card glass hero">
        <div class="bigtime" id="timerNew">00:00</div>
        <div class="chips" id="timerPresets"></div>
        <div class="form" style="margin-top:16px">
          <input id="timerMin" type="number" min="1" max="1440" value="5" aria-label="Minutes">
          <input id="timerLabel" type="text" placeholder="Label (optional)" maxlength="40">
          <button class="btn" id="timerAdd">Add timer</button>
        </div>
      </div>
      <div id="timerList"></div>
    </section>
    <section class="panel" id="p-stop" aria-label="Stopwatch">
      <div class="card glass hero">
        <div class="bigtime" id="swTime">00:00.00</div>
        <div class="controls">
          <button class="btn" id="swStart">Start</button>
          <button class="btn ghost" id="swLap">Lap</button>
          <button class="btn ghost" id="swReset">Reset</button>
        </div>
      </div>
      <div id="swLaps"></div>
    </section>
    <section class="panel" id="p-alarm" aria-label="Alarms">
      <div class="card glass">
        <div class="form">
          <input id="alarmTime" type="time" value="07:00" aria-label="Alarm time">
          <input id="alarmLabel" type="text" placeholder="Label (optional)" maxlength="40">
          <button class="btn" id="alarmAdd">Add alarm</button>
        </div>
      </div>
      <div id="alarmList"></div>
    </section>
  </main>
  <nav class="tabs glass" role="tablist" aria-label="Sections">
    <button class="tab" role="tab" data-tab="clock" aria-selected="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Clock</button>
    <button class="tab" role="tab" data-tab="world" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>World</button>
    <button class="tab" role="tab" data-tab="timer" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>Timer</button>
    <button class="tab" role="tab" data-tab="stop" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4M9 2h6M19 6l1.5-1.5"/></svg>Stopwatch</button>
    <button class="tab" role="tab" data-tab="alarm" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 004 0"/></svg>Alarms</button>
  </nav>
</div>

<div class="overlay" id="overlay"></div>
<section class="sheet glass" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
  <div class="grab"></div>
  <h2 id="sheetTitle">Clock settings</h2>
  <label for="tz">Home timezone</label>
  <select id="tz"></select>
  <label for="tzCustom">Or type any IANA name</label>
  <input id="tzCustom" type="text" placeholder="e.g. Africa/Nairobi" autocomplete="off" autocapitalize="off" spellcheck="false">
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

<section class="alert glass" id="alert" role="alertdialog" aria-live="assertive" aria-labelledby="alertTitle">
  <div class="big" id="alertTitle"></div>
  <div class="small" id="alertBody"></div>
  <button class="btn" id="alertDismiss">Dismiss</button>
</section>

<script>
(function () {
  var KEY = "reuz.v2";
  var ZONES = ["UTC","Asia/Kolkata","Asia/Dubai","Asia/Singapore","Asia/Tokyo","Europe/London","Europe/Paris","Europe/Berlin","America/New_York","America/Chicago","America/Los_Angeles","Australia/Sydney","Pacific/Auckland"];
  var home = { timezone: "UTC", format: "24h" };
  var draftFormat = "24h";
  var lastDigits = "";
  var alertQueue = [];
  var alertOpen = false;
  var native = (window.ReuzNative && typeof window.ReuzNative.sync === "function") ? window.ReuzNative : null;

  function $(id) { return document.getElementById(id); }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function validZone(z) { try { new Intl.DateTimeFormat("en-US", { timeZone: z }); return typeof z === "string" && z.length > 0 && z.length <= 64; } catch (e) { return false; } }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hm(h, m) { return pad(h) + ":" + pad(m); }

  function defaults() {
    return { worldZones: ["Europe/London", "America/New_York", "Asia/Tokyo"], timers: [], alarms: [], sw: { running: false, startedAt: 0, baseMs: 0, laps: [] } };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      var d = JSON.parse(raw);
      var base = defaults();
      base.worldZones = Array.isArray(d.worldZones) ? d.worldZones.filter(validZone) : base.worldZones;
      base.timers = Array.isArray(d.timers) ? d.timers : [];
      base.alarms = Array.isArray(d.alarms) ? d.alarms : [];
      if (d.sw && typeof d.sw === "object") base.sw = Object.assign(base.sw, d.sw);
      return base;
    } catch (e) { return defaults(); }
  }
  var data = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    syncNative();
  }

  // ---- Native schedule: alarms (daily) and running timers (one-off), kept in sync with the Android app.
  function scheduleList() {
    var out = [];
    data.alarms.forEach(function (a) {
      if (a.enabled) out.push({ id: "alarm-" + a.id, hour: a.hour, minute: a.minute, title: "Alarm", body: a.label || hm(a.hour, a.minute) });
    });
    data.timers.forEach(function (t) {
      if (t.state === "running") out.push({ id: "timer-" + t.id, at: t.endAt, title: "Timer finished", body: t.label });
    });
    return out;
  }
  function syncNative() {
    if (!native) return;
    try { native.sync(JSON.stringify(scheduleList())); } catch (e) {}
  }
  function requestNotify() {
    if (native) {
      try { if (!native.canNotify()) native.requestNotifications(); } catch (e) {}
    } else if ("Notification" in window && Notification.permission === "default") {
      try { Notification.requestPermission(); } catch (e) {}
    }
  }
  function browserNotify(title, body) {
    if (native || !("Notification" in window) || Notification.permission !== "granted") return;
    try { new Notification(title, { body: body }); } catch (e) {}
  }

  // ---- Alerts: an in-app card with a short tone, shown while the page is open.
  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 880; g.gain.value = 0.18;
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.7);
    } catch (e) {}
  }
  function showAlert(title, body) {
    alertQueue.push({ title: title, body: body });
    if (!alertOpen) nextAlert();
  }
  function nextAlert() {
    var a = alertQueue.shift();
    if (!a) { alertOpen = false; return; }
    alertOpen = true;
    $("alertTitle").textContent = a.title;
    $("alertBody").textContent = a.body || "";
    $("alert").classList.add("open");
    beep();
  }
  $("alertDismiss").onclick = function () {
    $("alert").classList.remove("open");
    setTimeout(nextAlert, 420);
  };

  // ---- Tabs
  var tabs = document.querySelectorAll(".tab");
  function showTab(name) {
    tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.getAttribute("data-tab") === name)); });
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.toggle("active", p.id === "p-" + name); });
    renderAll();
  }
  tabs.forEach(function (t) { t.onclick = function () { showTab(t.getAttribute("data-tab")); }; });

  // ---- Clock tab and home time
  function fmtHome(d) {
    var h12 = home.format === "12h";
    var text = new Intl.DateTimeFormat("en-GB", { timeZone: home.timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: h12 }).format(d);
    var m = text.match(/^(.*?)\s*(am|pm)?$/i);
    return { core: m ? m[1] : text, ap: m && m[2] ? m[2].toUpperCase() : "" };
  }
  function renderClock() {
    var d = new Date();
    var p = fmtHome(d);
    var html = "";
    for (var i = 0; i < p.core.length; i++) {
      var ch = p.core.charAt(i);
      if (/\d/.test(ch)) {
        var changed = lastDigits.length > 0 && lastDigits.charAt(i) !== ch;
        html += '<span class="digit' + (changed ? " changing" : "") + '">' + ch + "</span>";
      } else { html += ch; }
    }
    if (p.ap) html += '<span style="font-size:.3em;margin-left:.3em;color:var(--muted)">' + p.ap + "</span>";
    $("time").innerHTML = html;
    lastDigits = p.core;
    $("date").textContent = new Intl.DateTimeFormat("en-GB", { timeZone: home.timezone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
    $("zone").textContent = home.timezone + " · " + (home.format === "12h" ? "12-hour" : "24-hour");
    var next = nextAlarm(d);
    $("nextAlarm").textContent = next ? next.label : "None set";
    $("timerCount").textContent = String(data.timers.filter(function (t) { return t.state === "running"; }).length);
  }
  function nextAlarm(now) {
    var best = null;
    data.alarms.forEach(function (a) {
      if (!a.enabled) return;
      var d = new Date(now.getTime());
      d.setHours(a.hour, a.minute, 0, 0);
      if (d <= now) d.setDate(d.getDate() + 1);
      if (!best || d < best.at) best = { at: d, label: hm(a.hour, a.minute) + (a.label ? " · " + a.label : "") };
    });
    return best;
  }

  // ---- Settings sheet
  var tzSel = $("tz"), tzCustom = $("tzCustom"), statusEl = $("status"), sheet = $("sheet"), overlay = $("overlay");
  ZONES.forEach(function (z) { var o = document.createElement("option"); o.value = z; o.textContent = z; tzSel.appendChild(o); });
  function applyHome(s) {
    if (s && validZone(s.timezone)) home.timezone = s.timezone;
    if (s && (s.format === "12h" || s.format === "24h")) home.format = s.format;
    if (native) { try { native.setHome(home.timezone, home.format); } catch (e) {} }
    renderClock();
  }
  function loadHome() {
    fetch("/api/settings", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(applyHome)
      .catch(function () { $("zone").textContent = "Offline · " + home.timezone; });
  }
  function setFormatButtons(f) {
    draftFormat = f;
    document.querySelectorAll("[data-format]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-format") === f)); });
  }
  function openSheet() {
    var known = ZONES.indexOf(home.timezone) >= 0;
    tzSel.value = known ? home.timezone : ZONES[0];
    tzCustom.value = known ? "" : home.timezone;
    setFormatButtons(home.format);
    statusEl.textContent = ""; statusEl.className = "status";
    sheet.classList.add("open"); overlay.classList.add("open");
  }
  function closeSheet() { sheet.classList.remove("open"); overlay.classList.remove("open"); }
  function saveHome() {
    var tz = tzCustom.value.trim() || tzSel.value;
    if (!validZone(tz)) { statusEl.textContent = "That timezone isn't recognised."; statusEl.className = "status err"; return; }
    $("save").disabled = true; statusEl.textContent = "Saving…"; statusEl.className = "status";
    fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ timezone: tz, format: draftFormat }) })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (s) { applyHome(s); statusEl.textContent = "Saved"; setTimeout(closeSheet, 500); })
      .catch(function () { statusEl.textContent = "Couldn't save. Check your connection."; statusEl.className = "status err"; })
      .then(function () { $("save").disabled = false; });
  }
  $("openSettings").onclick = openSheet;
  overlay.onclick = closeSheet;
  $("cancel").onclick = closeSheet;
  $("save").onclick = saveHome;
  document.querySelectorAll("[data-format]").forEach(function (b) { b.onclick = function () { setFormatButtons(b.getAttribute("data-format")); }; });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

  // ---- World clocks
  var worldSel = $("worldSel");
  ZONES.forEach(function (z) { var o = document.createElement("option"); o.value = z; o.textContent = z; worldSel.appendChild(o); });
  function renderWorld() {
    var list = $("worldList");
    if (!data.worldZones.length) { list.innerHTML = '<div class="empty">No cities yet. Add one above.</div>'; return; }
    var html = "";
    data.worldZones.forEach(function (z, i) {
      html += '<div class="row"><div class="main"><div class="title">' + esc(z) + '</div><div class="meta" data-wday="' + i + '"></div></div>'
        + '<div class="right" data-wtime="' + i + '"></div>'
        + '<button class="iconbtn danger" data-wdel="' + i + '" aria-label="Remove ' + esc(z) + '">Remove</button></div>';
    });
    list.innerHTML = html;
    tickWorld();
  }
  function tickWorld() {
    var d = new Date();
    data.worldZones.forEach(function (z, i) {
      var t = $("p-world") && document.querySelector('[data-wtime="' + i + '"]');
      var day = document.querySelector('[data-wday="' + i + '"]');
      if (!t || !day) return;
      var p = new Intl.DateTimeFormat("en-GB", { timeZone: z, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: home.format === "12h" }).format(d);
      t.textContent = p;
      day.textContent = new Intl.DateTimeFormat("en-GB", { timeZone: z, weekday: "short", day: "numeric", month: "short" }).format(d);
    });
  }
  $("worldAdd").onclick = function () {
    var z = $("worldCustom").value.trim() || worldSel.value;
    if (!validZone(z)) { showAlert("Unknown timezone", "Type a name such as Africa/Nairobi."); return; }
    if (data.worldZones.indexOf(z) < 0) data.worldZones.push(z);
    $("worldCustom").value = "";
    save(); renderWorld();
  };
  $("worldList").onclick = function (e) {
    var b = e.target.closest("[data-wdel]");
    if (!b) return;
    data.worldZones.splice(Number(b.getAttribute("data-wdel")), 1);
    save(); renderWorld();
  };

  // ---- Timers
  var presets = [1, 5, 10, 25];
  presets.forEach(function (m) {
    var c = document.createElement("button");
    c.className = "chip"; c.textContent = m + " min";
    c.onclick = function () { $("timerMin").value = m; $("timerNew").textContent = pad(m) + ":00"; };
    $("timerPresets").appendChild(c);
  });
  function timerRemaining(t) { return t.state === "running" ? Math.max(0, t.endAt - Date.now()) : t.remainingMs; }
  function fmtHMS(ms) {
    var s = Math.ceil(ms / 1000);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? h + ":" + pad(m) + ":" + pad(sec) : pad(m) + ":" + pad(sec);
  }
  function renderTimers() {
    var list = $("timerList");
    if (!data.timers.length) { list.innerHTML = '<div class="empty">No timers. Set one above.</div>'; return; }
    var html = "";
    data.timers.forEach(function (t) {
      var running = t.state === "running";
      var label = t.state === "paused" ? "Resume" : (running ? "Pause" : "Start");
      html += '<div class="row"><div class="main"><div class="title">' + esc(t.label) + '</div><div class="meta">' + Math.round(t.durationMs / 60000) + " min · " + esc(t.state) + '</div></div>'
        + '<div class="right" data-remain="' + t.id + '"></div>'
        + '<button class="iconbtn" data-tstart="' + t.id + '">' + label + '</button>'
        + '<button class="iconbtn" data-treset="' + t.id + '">Reset</button>'
        + '<button class="iconbtn danger" data-tdel="' + t.id + '" aria-label="Delete timer">✕</button></div>';
    });
    list.innerHTML = html;
    tickTimers();
  }
  function tickTimers() {
    data.timers.forEach(function (t) {
      var el = document.querySelector('[data-remain="' + t.id + '"]');
      if (!el) return;
      var left = timerRemaining(t);
      el.textContent = (t.state === "running" && left <= 0) ? "Done" : fmtHMS(left);
    });
  }
  function finishTimer(t) {
    data.timers = data.timers.filter(function (x) { return x.id !== t.id; });
    showAlert("Timer finished", t.label);
    browserNotify("Timer finished", t.label);
    save(); renderTimers();
  }
  $("timerAdd").onclick = function () {
    var min = Math.floor(Number($("timerMin").value));
    if (!(min >= 1 && min <= 1440)) { showAlert("Pick a time", "Enter between 1 and 1440 minutes."); return; }
    var t = { id: uid(), label: $("timerLabel").value.trim() || (min + " min timer"), durationMs: min * 60000, remainingMs: min * 60000, endAt: 0, state: "idle" };
    data.timers.push(t);
    $("timerLabel").value = "";
    requestNotify();
    save(); renderTimers();
  };
  $("timerList").onclick = function (e) {
    var s = e.target.closest("[data-tstart]"), r = e.target.closest("[data-treset]"), d = e.target.closest("[data-tdel]");
    var id = (s || r || d) && (s || r || d).getAttribute(s ? "data-tstart" : r ? "data-treset" : "data-tdel");
    if (!id) return;
    var t = data.timers.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    if (s) {
      if (t.state === "running") { t.remainingMs = Math.max(0, t.endAt - Date.now()); t.state = "paused"; t.endAt = 0; }
      else { if (t.remainingMs <= 0) t.remainingMs = t.durationMs; t.endAt = Date.now() + t.remainingMs; t.state = "running"; requestNotify(); }
    } else if (r) {
      t.state = "idle"; t.endAt = 0; t.remainingMs = t.durationMs;
    } else {
      data.timers = data.timers.filter(function (x) { return x.id !== id; });
    }
    save(); renderTimers();
  };

  // ---- Stopwatch
  function swElapsed() { var s = data.sw; return s.running ? s.baseMs + (Date.now() - s.startedAt) : s.baseMs; }
  function fmtSW(ms) {
    var cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60, h = Math.floor(ms / 3600000);
    return (h > 0 ? h + ":" + pad(m) : pad(m)) + ":" + pad(s) + "." + pad(cs);
  }
  function renderSW() {
    $("swTime").textContent = fmtSW(swElapsed());
    $("swStart").textContent = data.sw.running ? "Pause" : (data.sw.baseMs > 0 ? "Resume" : "Start");
    var laps = data.sw.laps;
    if (!laps.length) { $("swLaps").innerHTML = ""; return; }
    var html = "";
    for (var i = laps.length - 1; i >= 0; i--) {
      var split = i === 0 ? laps[0] : laps[i] - laps[i - 1];
      html += '<div class="row"><div class="main"><div class="title">Lap ' + (i + 1) + '</div><div class="meta">Split ' + fmtSW(split) + '</div></div><div class="right">' + fmtSW(laps[i]) + "</div></div>";
    }
    $("swLaps").innerHTML = html;
  }
  $("swStart").onclick = function () {
    var s = data.sw;
    if (s.running) { s.baseMs = swElapsed(); s.running = false; }
    else { s.startedAt = Date.now(); s.running = true; }
    save(); renderSW();
  };
  $("swLap").onclick = function () { if (data.sw.running) { data.sw.laps.push(swElapsed()); save(); renderSW(); } };
  $("swReset").onclick = function () { data.sw = { running: false, startedAt: 0, baseMs: 0, laps: [] }; save(); renderSW(); };

  // ---- Alarms
  function renderAlarms() {
    var list = $("alarmList");
    if (!data.alarms.length) { list.innerHTML = '<div class="empty">No alarms yet. Add one above.</div>'; return; }
    var html = "";
    data.alarms.slice().sort(function (a, b) { return (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute); }).forEach(function (a) {
      html += '<div class="row"><div class="main"><div class="title">' + esc(a.label || "Alarm") + '</div><div class="meta">Every day</div></div>'
        + '<div class="right">' + hm(a.hour, a.minute) + '</div>'
        + '<button class="toggle" role="switch" aria-checked="' + a.enabled + '" data-atog="' + a.id + '" aria-label="Enable alarm"></button>'
        + '<button class="iconbtn danger" data-adel="' + a.id + '" aria-label="Delete alarm">✕</button></div>';
    });
    list.innerHTML = html;
  }
  $("alarmAdd").onclick = function () {
    var v = $("alarmTime").value;
    var parts = v.split(":");
    if (parts.length !== 2) { showAlert("Pick a time", "Choose a time for the alarm."); return; }
    var h = Number(parts[0]), m = Number(parts[1]);
    if (!(h >= 0 && h < 24 && m >= 0 && m < 60)) { showAlert("Pick a time", "Choose a valid time."); return; }
    data.alarms.push({ id: uid(), hour: h, minute: m, label: $("alarmLabel").value.trim(), enabled: true, lastFired: "" });
    $("alarmLabel").value = "";
    requestNotify();
    save(); renderAlarms(); renderClock();
  };
  $("alarmList").onclick = function (e) {
    var t = e.target.closest("[data-atog]"), d = e.target.closest("[data-adel]");
    if (t) {
      var a = data.alarms.filter(function (x) { return x.id === t.getAttribute("data-atog"); })[0];
      if (a) a.enabled = !a.enabled;
    } else if (d) {
      data.alarms = data.alarms.filter(function (x) { return x.id !== d.getAttribute("data-adel"); });
    } else return;
    save(); renderAlarms(); renderClock();
  };

  // ---- Background checks: timers finishing and alarms going off while the page is open.
  function checkAlarms(now) {
    if (native) return; // the Android app schedules alarms with the system instead
    var changed = false;
    data.alarms.forEach(function (a) {
      if (!a.enabled) return;
      if (now.getHours() === a.hour && now.getMinutes() === a.minute) {
        var key = now.toDateString() + " " + hm(a.hour, a.minute);
        if (a.lastFired !== key) {
          a.lastFired = key; changed = true;
          showAlert("Alarm", a.label || hm(a.hour, a.minute));
          browserNotify("Alarm", a.label || hm(a.hour, a.minute));
        }
      }
    });
    if (changed) save();
  }
  function checkTimers() {
    if (native) return; // the Android app notifies when a timer ends
    var now = Date.now();
    data.timers.slice().forEach(function (t) { if (t.state === "running" && t.endAt <= now) finishTimer(t); });
  }
  function renderAll() {
    renderClock(); renderWorld(); renderTimers(); renderSW(); renderAlarms();
  }
  setInterval(function () {
    renderClock();
    checkAlarms(new Date());
    checkTimers();
    tickWorld(); tickTimers(); renderSW();
    var timerCountEl = $("timerCount");
    if (timerCountEl) timerCountEl.textContent = String(data.timers.filter(function (t) { return t.state === "running"; }).length);
  }, 250);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { renderAll(); syncNative(); } });

  // Presets and the new-timer display follow the minutes input.
  $("timerMin").oninput = function () { var m = Math.floor(Number(this.value)); $("timerNew").textContent = (m >= 1 && m <= 1440) ? pad(m) + ":00" : "--:--"; };
  $("timerMin").dispatchEvent(new Event("input"));

  renderAll();
  loadHome();
  syncNative();
})();
</script>
</body>
</html>
`;
