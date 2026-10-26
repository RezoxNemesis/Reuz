// Reuz: a clockwork-flavoured clock app. Glass UI, a tap-to-flip clock face, a spin dial and an
// old rotary-phone dial for setting timers and alarms, and native alarms/widgets through
// window.ReuzNative when running inside the Android app.
// NOTE: this file is one template literal. Do not use backticks, dollar-brace, or backslashes
// inside it: they would be changed before the browser sees the code.
export const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0a0c12">
<meta name="color-scheme" content="dark">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 108 108'%3E%3Crect width='108' height='108' rx='24' fill='%230b0d18'/%3E%3Ccircle cx='54' cy='54' r='30' fill='none' stroke='%23ffb454' stroke-width='5'/%3E%3Cpath d='M54 54L46 49.5M54 54L66 47' stroke='%23fff' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E">
<title>Reuz Clock</title>
<style>
:root { --bg:#0a0c12; --ink:#eef2fb; --muted:#98a4bd; --accent:#7cc4ff; --accent2:#b38cff; --brass:#ffc46b; --brass2:#ff9b45; --good:#5eead4; --bad:#ff8a8a; --glass:rgba(255,255,255,.07); --glass-border:rgba(255,255,255,.15); --ease:cubic-bezier(.2,.8,.2,1); --spring:cubic-bezier(.34,1.45,.5,1); }
* { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
html, body { height:100%; margin:0; }
body { background:var(--bg); color:var(--ink); font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; overflow:hidden; -webkit-font-smoothing:antialiased; user-select:none; -webkit-user-select:none; }
input, select { user-select:text; -webkit-user-select:text; }
.aurora { position:fixed; inset:-20%; z-index:0; pointer-events:none; background:radial-gradient(40% 40% at 18% 28%,rgba(124,196,255,.30),transparent 60%),radial-gradient(35% 35% at 82% 68%,rgba(179,140,255,.28),transparent 60%),radial-gradient(30% 28% at 55% 95%,rgba(255,170,80,.22),transparent 60%); filter:blur(40px); animation:drift 20s var(--ease) infinite alternate; }
@keyframes drift { 0% { transform:translate3d(-3%,-2%,0) scale(1); } 100% { transform:translate3d(3%,2%,0) scale(1.08); } }
.glass { background:var(--glass); border:1px solid var(--glass-border); backdrop-filter:blur(24px) saturate(160%); -webkit-backdrop-filter:blur(24px) saturate(160%); box-shadow:0 20px 60px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.14); }
.app { position:fixed; inset:0; z-index:1; display:flex; flex-direction:column; }
.top { display:flex; align-items:center; justify-content:space-between; padding:max(14px,env(safe-area-inset-top)) 18px 6px; }
.brandrow { display:flex; align-items:center; gap:11px; min-width:0; }
.logo { width:38px; height:38px; border-radius:12px; flex:none; box-shadow:0 6px 18px rgba(255,155,69,.25); }
.brand { font-weight:750; letter-spacing:.05em; font-size:18px; line-height:1.1; background:linear-gradient(120deg,#fff,var(--brass),var(--accent2)); -webkit-background-clip:text; background-clip:text; color:transparent; }
.tagline { font-size:12px; color:var(--muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
main { position:relative; flex:1; overflow:hidden; }
.panel { position:absolute; inset:0; overflow:auto; padding:10px 18px 124px; opacity:0; visibility:hidden; transform:translateX(var(--dx,0)) scale(.985); transition:opacity .16s ease, transform .3s var(--ease), visibility 0s .16s; -webkit-overflow-scrolling:touch; }
.panel.active { opacity:1; visibility:visible; transform:none; transition:opacity .3s ease .1s, transform .45s var(--ease) .08s, visibility 0s 0s; }
.card { border-radius:26px; padding:20px; margin-bottom:14px; }
.tap { position:relative; overflow:hidden; }
.ripple { position:absolute; border-radius:50%; pointer-events:none; background:radial-gradient(circle,rgba(255,255,255,.34),rgba(255,255,255,0) 68%); transform:scale(0); opacity:.9; animation:rip .65s var(--ease) forwards; }
@keyframes rip { to { transform:scale(1); opacity:0; } }
/* Clock hero: flips between a digital and an analog face */
.flipper { position:relative; perspective:1400px; margin:6px 0 14px; cursor:pointer; touch-action:manipulation; }
.flip-inner { position:relative; height:clamp(300px,47vh,390px); transform-style:preserve-3d; transition:transform .95s var(--spring); }
.flipper.flipped .flip-inner { transform:rotateY(180deg); }
.flipper.pop { animation:pop .5s var(--ease); }
@keyframes pop { 40% { transform:scale(.97); } 100% { transform:scale(1); } }
.face { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden; border-radius:30px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; background:linear-gradient(150deg,rgba(255,255,255,.14),rgba(255,255,255,.04)); border:1px solid var(--glass-border); box-shadow:0 24px 64px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.18); }
.face.back { transform:rotateY(180deg); }
.fx { position:absolute; inset:0; border-radius:30px; overflow:hidden; pointer-events:none; z-index:2; }
.hint { position:absolute; bottom:12px; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.34); }
.bigtime { font-size:clamp(46px,14.5vw,96px); font-weight:650; letter-spacing:.015em; font-variant-numeric:tabular-nums; line-height:1.05; white-space:nowrap; }
.bigtime .ap { font-size:.28em; margin-left:.3em; color:var(--brass); letter-spacing:.08em; }
.colon { display:inline-block; animation:blink 1s steps(2,jump-none) infinite; opacity:.9; }
@keyframes blink { 50% { opacity:.35; } }
.digit { display:inline-block; }
.digit.changing { animation:flip .5s var(--ease); }
.digit.wave { animation:wave .7s var(--spring) both; animation-delay:calc(var(--i) * 55ms); }
@keyframes flip { 0% { transform:translateY(-35%); opacity:.15; filter:blur(4px); } 100% { transform:none; opacity:1; filter:none; } }
@keyframes wave { 0% { transform:translateY(60%) rotateX(80deg); opacity:0; } 100% { transform:none; opacity:1; } }
.sub { margin-top:12px; font-size:clamp(15px,3vw,20px); color:var(--muted); }
.zone { margin-top:14px; display:inline-flex; gap:8px; align-items:center; padding:6px 14px; border-radius:999px; font-size:13px; color:var(--muted); background:rgba(255,255,255,.06); border:1px solid var(--glass-border); }
.dot { width:8px; height:8px; border-radius:50%; background:var(--good); box-shadow:0 0 10px var(--good); animation:pulse 2s infinite; }
@keyframes pulse { 50% { opacity:.35; } }
.analog { height:100%; width:auto; max-width:100%; overflow:visible; }
.grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.mini { margin:0; padding:16px 18px; }
.label { font-size:11px; text-transform:uppercase; letter-spacing:.09em; color:var(--muted); }
.value { margin-top:7px; font-size:19px; font-weight:650; font-variant-numeric:tabular-nums; }
.note { margin-top:3px; font-size:12px; color:var(--muted); }
.daybar { margin-top:14px; height:8px; border-radius:99px; background:rgba(255,255,255,.08); overflow:hidden; }
.daybar > i { display:block; height:100%; width:0; border-radius:99px; background:linear-gradient(90deg,var(--accent),var(--accent2),var(--brass)); transition:width 1s linear; }
.row { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:20px; margin-bottom:10px; background:rgba(255,255,255,.055); border:1px solid var(--glass-border); }
.row .main { flex:1; min-width:0; }
.row .title { font-weight:620; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.row .meta { font-size:13px; color:var(--muted); margin-top:3px; }
.row .right { font-size:21px; font-weight:650; font-variant-numeric:tabular-nums; white-space:nowrap; }
.row.dim { opacity:.55; }
.row.wrap { flex-wrap:wrap; }
.row .acts { flex:0 0 100%; display:flex; gap:8px; }
.row .acts .iconbtn { flex:1; }
.row .acts .iconbtn.danger { flex:0 0 52px; }
.timelink { background:none; border:0; border-bottom:1.5px dashed rgba(255,196,107,.6); color:var(--ink); font:inherit; font-size:21px; font-weight:650; font-variant-numeric:tabular-nums; padding:2px 0; cursor:pointer; white-space:nowrap; }
.timelink:active { color:var(--brass); }
.row .glyph { font-size:20px; width:26px; text-align:center; flex:none; }
.best { color:var(--good); }
.worst { color:var(--bad); }
.iconbtn { border:0; background:rgba(255,255,255,.09); color:var(--ink); border-radius:13px; padding:9px 12px; font:inherit; font-size:13px; cursor:pointer; transition:transform .2s var(--ease), background .2s; }
.iconbtn:active { transform:scale(.93); }
.iconbtn.danger { color:var(--bad); }
.ring { width:46px; height:46px; flex:none; transform:rotate(-90deg); }
.ring circle { fill:none; stroke-width:4.5; }
.ring .track { stroke:rgba(255,255,255,.1); }
.ring .prog { stroke:var(--brass); stroke-linecap:round; transition:stroke-dashoffset .3s linear; }
.toggle { position:relative; width:52px; height:30px; border-radius:99px; background:rgba(255,255,255,.14); border:1px solid var(--glass-border); cursor:pointer; transition:background .3s var(--ease); flex:none; padding:0; }
.toggle::after { content:""; position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; transition:transform .35s var(--spring); box-shadow:0 2px 6px rgba(0,0,0,.3); }
.toggle[aria-checked="true"] { background:linear-gradient(120deg,var(--brass2),var(--brass)); }
.toggle[aria-checked="true"]::after { transform:translateX(22px); }
.chips { display:flex; gap:8px; flex-wrap:wrap; margin:12px 0 0; justify-content:center; }
.chip { border:1px solid var(--glass-border); background:rgba(255,255,255,.06); color:var(--ink); border-radius:999px; padding:9px 15px; font:inherit; font-size:14px; cursor:pointer; transition:transform .2s var(--ease), background .2s, border-color .2s; }
.chip:active { transform:scale(.94); }
.chip.on { background:rgba(255,196,107,.18); border-color:rgba(255,196,107,.65); color:var(--brass); }
.chips.days { flex-wrap:nowrap; gap:6px; }
.chip.day { width:38px; height:38px; padding:0; display:grid; place-items:center; flex:none; }
.form { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
select, input { font:inherit; font-size:16px; color:var(--ink); background:rgba(255,255,255,.07); border:1px solid var(--glass-border); border-radius:14px; padding:12px 14px; outline:none; transition:border-color .2s, box-shadow .2s; min-width:0; }
select, input[type="text"] { flex:1 1 140px; }
select:focus, input:focus { border-color:var(--brass); box-shadow:0 0 0 4px rgba(255,196,107,.16); }
select option { background:#151923; color:#eef2fb; }
.btn { font:inherit; font-weight:650; border:0; border-radius:17px; padding:14px 20px; color:#1a1004; background:linear-gradient(120deg,var(--brass),var(--brass2)); cursor:pointer; transition:transform .2s var(--ease), opacity .2s; box-shadow:0 10px 26px rgba(255,155,69,.28); }
.btn:active { transform:scale(.97); }
.btn:disabled { opacity:.6; }
.btn.ghost { background:rgba(255,255,255,.1); color:var(--ink); border:1px solid var(--glass-border); box-shadow:none; }
.btn.wide { width:100%; }
.pill { border-radius:999px; padding:9px 16px; color:var(--ink); font:inherit; font-size:14px; cursor:pointer; border:1px solid var(--glass-border); transition:transform .25s var(--ease), background .25s; }
.pill:active { transform:scale(.96); }
.controls { display:flex; gap:10px; margin-top:20px; justify-content:center; flex-wrap:wrap; }
.empty { text-align:center; color:var(--muted); padding:26px 10px; line-height:1.5; }
.timebtn { display:block; width:100%; background:none; border:0; color:inherit; font:inherit; cursor:pointer; padding:6px 0; }
.timebtn .bigtime { transition:transform .25s var(--ease); }
.timebtn:active .bigtime { transform:scale(.97); }
.edit-hint { font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--brass); margin-bottom:2px; }
.swwrap { position:relative; width:min(78vw,300px); aspect-ratio:1; margin:0 auto; display:grid; place-items:center; }
.swwrap svg { position:absolute; inset:0; width:100%; height:100%; transform:rotate(-90deg); }
.swwrap .t { fill:none; stroke:rgba(255,255,255,.1); stroke-width:6; }
.swwrap .p { fill:none; stroke:url(#swg); stroke-width:6; stroke-linecap:round; }
.swwrap .bigtime { font-size:clamp(36px,11vw,62px); }
/* Capsule tab bar: a glass lens that stretches to the tapped tab */
.tabs { position:fixed; left:50%; transform:translateX(-50%); bottom:max(12px,env(safe-area-inset-bottom)); z-index:3; display:flex; padding:6px; border-radius:999px; width:min(94vw,460px); }
.capsule { position:absolute; top:6px; bottom:6px; left:0; width:0; border-radius:999px; background:linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,.07)); border:1px solid rgba(255,255,255,.38); box-shadow:inset 0 1px 0 rgba(255,255,255,.55), inset 0 -8px 14px rgba(255,255,255,.05), 0 8px 22px rgba(0,0,0,.35), 0 0 24px rgba(255,196,107,.22); backdrop-filter:blur(10px) saturate(190%); -webkit-backdrop-filter:blur(10px) saturate(190%); pointer-events:none; transition:left .34s var(--spring), width .34s var(--spring), transform .3s var(--ease); }
.capsule.stretch { transition:left .17s cubic-bezier(.3,.8,.3,1), width .17s cubic-bezier(.3,.8,.3,1), transform .17s ease; transform:scaleY(.9); }
.capsule.still { transition:none; }
.tab { position:relative; z-index:1; flex:1; border:0; background:transparent; color:var(--muted); font:inherit; font-size:11.5px; padding:9px 2px; border-radius:999px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:3px; transition:color .3s; }
.tab svg { width:22px; height:22px; transition:transform .4s var(--spring), color .3s; }
.tab[aria-selected="true"] { color:var(--ink); }
.tab[aria-selected="true"] svg { transform:translateY(-1px) scale(1.12); color:var(--brass); }
.overlay { position:fixed; inset:0; z-index:5; background:rgba(3,4,8,.58); opacity:0; pointer-events:none; transition:opacity .35s var(--ease); }
.overlay.open { opacity:1; pointer-events:auto; }
.sheet { position:fixed; left:50%; bottom:0; z-index:6; width:min(100%,560px); transform:translate(-50%,105%); transition:transform .5s var(--ease); border-radius:30px 30px 0 0; padding:20px 20px max(20px,env(safe-area-inset-bottom)); max-height:96vh; overflow:auto; background:rgba(20,24,38,.72); }
.sheet.open { transform:translate(-50%,0); }
.grab { width:44px; height:5px; border-radius:99px; background:rgba(255,255,255,.25); margin:0 auto 12px; }
.sheet h2 { margin:0 0 6px; font-size:18px; font-weight:620; text-align:center; }
label { display:block; font-size:13px; color:var(--muted); margin:16px 0 6px; }
.sheet select, .sheet input[type="text"] { width:100%; }
[hidden] { display:none !important; }
.seg.c3 { grid-template-columns:repeat(3,1fr); }
.seg.c4 { grid-template-columns:repeat(4,1fr); }
.pro { font-size:10px; font-weight:700; letter-spacing:.12em; color:#1a1004; background:linear-gradient(120deg,var(--brass),var(--brass2)); border-radius:99px; padding:3px 8px; flex:none; }
.wake { text-align:left; margin-top:6px; }
.wake .seg { margin:2px 0 8px; }
.perks { list-style:none; margin:10px 0 14px; padding:0; display:grid; gap:10px; }
.perks li { display:flex; gap:12px; align-items:flex-start; font-size:14px; color:var(--ink); }
.perks li b { display:block; font-weight:620; }
.perks li small { color:var(--muted); font-size:12.5px; }
.perks .dot { width:28px; height:28px; border-radius:9px; flex:none; display:grid; place-items:center; background:rgba(255,196,107,.16); color:var(--brass); font-size:14px; }
.plans { display:grid; gap:8px; margin-bottom:10px; }
.plan { font:inherit; color:var(--ink); text-align:left; display:flex; justify-content:space-between; align-items:center; gap:10px; padding:14px 16px; border-radius:16px; border:1px solid var(--glass-border); background:rgba(255,255,255,.07); cursor:pointer; }
.plan.best { border-color:rgba(255,196,107,.7); background:rgba(255,196,107,.12); }
.plan small { color:var(--muted); display:block; font-size:12px; }
.plan b { font-weight:650; }
.fine { display:block; color:var(--muted); font-size:11.5px; line-height:1.45; margin-top:10px; text-align:center; }
.fine a { color:var(--brass); }
.seg { grid-template-columns:1fr 1fr; gap:6px; padding:4px; border-radius:15px; background:rgba(255,255,255,.06); }
.seg button { font:inherit; color:var(--muted); background:transparent; border:0; border-radius:11px; padding:10px; cursor:pointer; transition:background .3s var(--ease), color .3s; }
.seg button[aria-pressed="true"] { background:rgba(255,255,255,.16); color:var(--ink); box-shadow:0 4px 14px rgba(0,0,0,.25); }
.actions { display:flex; gap:10px; margin-top:18px; }
.actions .btn { flex:1; }
.status { min-height:20px; font-size:13px; color:var(--muted); margin-top:12px; text-align:center; }
.status.err { color:var(--bad); }
.setrow { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 2px; border-top:1px solid rgba(255,255,255,.08); }
.setrow small { display:block; color:var(--muted); font-size:12px; margin-top:2px; }
/* Dial sheet */
.readout { display:flex; align-items:flex-end; justify-content:center; gap:4px; margin:6px 0 4px; }
.readout.shake { animation:shake .4s; }
@keyframes shake { 20% { transform:translateX(-8px); } 40% { transform:translateX(8px); } 60% { transform:translateX(-5px); } 80% { transform:translateX(4px); } }
.fld { background:none; border:0; color:var(--muted); font:inherit; cursor:pointer; padding:4px 10px 6px; border-radius:16px; text-align:center; transition:background .25s, color .25s; }
.fld .num { display:block; font-size:clamp(44px,13vw,60px); font-weight:650; font-variant-numeric:tabular-nums; line-height:1.05; }
.fld small { font-size:11px; letter-spacing:.1em; text-transform:uppercase; }
.fld.on { color:var(--ink); background:rgba(255,196,107,.14); box-shadow:inset 0 0 0 1px rgba(255,196,107,.5); }
.fld.on .num { color:var(--brass); }
.sep { font-size:44px; font-weight:600; color:var(--muted); padding-bottom:22px; }
.preview { text-align:center; min-height:20px; font-size:13px; color:var(--muted); margin-bottom:10px; }
.preview.err { color:var(--bad); }
.dials { position:relative; width:min(300px,78vw,38vh); aspect-ratio:1; margin:6px auto 8px; perspective:900px; }
.dialview { position:absolute; inset:0; opacity:0; pointer-events:none; transform:rotateY(75deg) scale(.88); transition:opacity .35s ease, transform .55s var(--spring); }
.dialview.active { opacity:1; pointer-events:auto; transform:none; }
.dialview svg { width:100%; height:100%; display:block; touch-action:none; }
.dialtools { display:flex; gap:10px; justify-content:center; margin:2px 0 6px; min-height:40px; }
.hubdigit { transform-origin:150px 150px; }
.hubdigit.pop { animation:hubpop .45s var(--spring); }
@keyframes hubpop { 0% { transform:scale(1.5); opacity:.4; } 100% { transform:scale(1); opacity:1; } }
.toast { position:fixed; left:50%; bottom:calc(max(12px,env(safe-area-inset-bottom)) + 84px); transform:translate(-50%,20px); z-index:4; padding:11px 18px; border-radius:999px; font-size:14px; opacity:0; pointer-events:none; transition:opacity .3s, transform .4s var(--spring); white-space:nowrap; max-width:92vw; overflow:hidden; text-overflow:ellipsis; }
.toast.show { opacity:1; transform:translate(-50%,0); }
.alert { position:fixed; left:50%; top:50%; z-index:7; width:min(88vw,380px); transform:translate(-50%,-46%) scale(.94); opacity:0; pointer-events:none; transition:opacity .4s var(--ease), transform .5s var(--spring); border-radius:30px; padding:26px 22px; text-align:center; background:rgba(22,26,42,.8); }
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
    <div class="brandrow">
      <svg class="logo" viewBox="0 0 108 108" aria-hidden="true"><defs><linearGradient id="lbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2342"/><stop offset="1" stop-color="#090b14"/></linearGradient><linearGradient id="lbr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd98c"/><stop offset="1" stop-color="#ff9b45"/></linearGradient></defs><rect width="108" height="108" fill="url(#lbg)"/><circle cx="54" cy="54" r="30" fill="none" stroke="url(#lbr)" stroke-width="4.2"/><g fill="url(#lbr)"><circle cx="74.4" cy="47.4" r="3.1"/><circle cx="68.9" cy="38.5" r="3.1"/><circle cx="59.9" cy="33.3" r="3.1"/><circle cx="49.5" cy="33" r="3.1"/><circle cx="40.2" cy="37.5" r="3.1"/><circle cx="34.1" cy="45.9" r="3.1"/><circle cx="32.6" cy="56.2" r="3.1"/><circle cx="36.2" cy="66" r="3.1"/><circle cx="43.9" cy="73" r="3.1"/><circle cx="54" cy="75.5" r="3.1"/></g><circle cx="72.6" cy="64.8" r="3.1" fill="#7cc4ff"/><g stroke="#f4f7ff" stroke-linecap="round"><line x1="54" y1="54" x2="46.2" y2="49.5" stroke-width="3.4"/><line x1="54" y1="54" x2="66.1" y2="47" stroke-width="2.6"/></g><circle cx="54" cy="54" r="2.6" fill="url(#lbr)"/></svg>
      <div><div class="brand">Reuz</div><div class="tagline" id="tagline">Time, wound up just right</div></div>
    </div>
    <button class="pill glass tap" id="openSettings" aria-haspopup="dialog" aria-controls="sheet">Settings</button>
  </header>
  <main>
    <section class="panel active" id="p-clock" aria-label="Clock">
      <div class="flipper" id="flipper" role="button" tabindex="0" aria-label="Clock face. Tap to flip between digital and analog.">
        <div class="flip-inner">
          <div class="face front">
            <div class="bigtime" id="time" aria-label="Current time"></div>
            <div class="sub" id="date"></div>
            <div class="zone"><span class="dot"></span><span id="zone">Loading…</span></div>
            <div class="hint">tap to flip</div>
          </div>
          <div class="face back" id="analogFace"></div>
        </div>
        <div class="fx" id="heroFx"></div>
      </div>
      <div class="grid">
        <div class="card glass mini tap"><div class="label">Next alarm</div><div class="value" id="nextAlarm">None set</div><div class="note" id="nextAlarmNote">Sleep like a rock</div></div>
        <div class="card glass mini tap"><div class="label">Timers running</div><div class="value" id="timerCount">0</div><div class="note" id="timerNote">Nothing ticking</div></div>
      </div>
      <div class="card glass" style="margin-top:12px"><div class="label">Today so far</div><div class="daybar"><i id="dayfill"></i></div><div class="note" id="daynote"></div></div>
    </section>
    <section class="panel" id="p-world" aria-label="World clock">
      <div class="card glass">
        <div class="form">
          <select id="worldSel" aria-label="Pick a city timezone"></select>
          <input id="worldCustom" type="text" placeholder="Or type an IANA name" autocomplete="off" autocapitalize="off" spellcheck="false">
          <button class="btn tap" id="worldAdd">Add city</button>
        </div>
      </div>
      <div id="worldList"></div>
    </section>
    <section class="panel" id="p-timer" aria-label="Timer">
      <div class="card glass" style="text-align:center">
        <div class="edit-hint">Tap the time to dial it in</div>
        <button class="timebtn" id="timerDraft" aria-label="Set timer duration"><div class="bigtime" id="timerNew">05:00</div></button>
        <div class="chips" id="timerPresets"></div>
        <div class="chips" id="focusPresets" hidden aria-label="Focus sessions"></div>
        <div class="form" style="margin-top:16px">
          <input id="timerLabel" type="text" placeholder="Label (optional)" maxlength="40">
          <button class="btn tap" id="timerAdd">Start timer</button>
        </div>
      </div>
      <div id="timerList"></div>
    </section>
    <section class="panel" id="p-stop" aria-label="Stopwatch">
      <div class="card glass" style="text-align:center">
        <div class="swwrap">
          <svg viewBox="0 0 100 100"><defs><linearGradient id="swg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc46b"/><stop offset="1" stop-color="#ff9b45"/></linearGradient></defs><circle class="t" cx="50" cy="50" r="44"/><circle class="p" id="swRing" cx="50" cy="50" r="44" stroke-dasharray="276.5" stroke-dashoffset="276.5"/></svg>
          <div class="bigtime" id="swTime">00:00.00</div>
        </div>
        <div class="controls">
          <button class="btn tap" id="swStart">Start</button>
          <button class="btn ghost tap" id="swLap">Lap</button>
          <button class="btn ghost tap" id="swReset">Reset</button>
        </div>
      </div>
      <div id="swLaps"></div>
    </section>
    <section class="panel" id="p-alarm" aria-label="Alarms">
      <div class="card glass" style="text-align:center">
        <div class="edit-hint">Tap the time to dial it in</div>
        <button class="timebtn" id="alarmDraft" aria-label="Set alarm time"><div class="bigtime" id="alarmNew">07:00</div></button>
        <div class="chips days" id="dayChips" role="group" aria-label="Repeat days"></div>
        <div class="wake" id="wakeBox" hidden>
          <div class="edit-hint" style="margin-top:16px">Wake-up</div>
          <div class="setrow"><div>Dismiss challenge<small>Dial a code or solve a sum to switch off</small></div><span class="pro">PRO</span></div>
          <div class="seg c3" id="segChallenge" role="group" aria-label="Dismiss challenge">
            <button type="button" data-ch="off" aria-pressed="true">Off</button>
            <button type="button" data-ch="dial" aria-pressed="false">Dial</button>
            <button type="button" data-ch="math" aria-pressed="false">Math</button>
          </div>
          <div class="setrow"><div>Smart window<small>Ring early, at a light-sleep moment</small></div><span class="pro">PRO</span></div>
          <div class="seg c4" id="segWindow" role="group" aria-label="Smart wake window">
            <button type="button" data-win="0" aria-pressed="true">Off</button>
            <button type="button" data-win="10" aria-pressed="false">10 min</button>
            <button type="button" data-win="20" aria-pressed="false">20 min</button>
            <button type="button" data-win="30" aria-pressed="false">30 min</button>
          </div>
          <div class="setrow"><div>Gentle volume<small>Start soft and rise over a minute</small></div><button class="toggle" id="optGentle" role="switch" aria-checked="true" aria-label="Gentle volume"></button></div>
        </div>
        <div class="form" style="margin-top:16px">
          <input id="alarmLabel" type="text" placeholder="Label (optional)" maxlength="40">
          <button class="btn tap" id="alarmAdd">Add alarm</button>
        </div>
      </div>
      <div id="alarmList"></div>
    </section>
  </main>
  <nav class="tabs glass" id="tabs" role="tablist" aria-label="Sections">
    <div class="capsule still" id="capsule" aria-hidden="true"></div>
    <button class="tab" role="tab" data-tab="clock" aria-selected="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Clock</button>
    <button class="tab" role="tab" data-tab="world" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>World</button>
    <button class="tab" role="tab" data-tab="timer" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>Timer</button>
    <button class="tab" role="tab" data-tab="stop" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4M9 2h6M19 6l1.5-1.5"/></svg>Stopwatch</button>
    <button class="tab" role="tab" data-tab="alarm" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 004 0"/></svg>Alarms</button>
  </nav>
</div>

<div class="overlay" id="overlay"></div>
<div class="toast glass" id="toast" role="status"></div>

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
  <div class="setrow" style="margin-top:14px"><div>Tick sounds<small>The clockwork click while you dial</small></div><button class="toggle" id="optSound" role="switch" aria-checked="true" aria-label="Tick sounds"></button></div>
  <div class="setrow"><div>Haptics<small>A little buzz with every tick</small></div><button class="toggle" id="optHaptics" role="switch" aria-checked="true" aria-label="Haptics"></button></div>
  <div class="setrow" id="proRow" hidden><div>Reuz Pro<small id="proState">Dismiss challenges, smart wake and focus timers</small></div><button class="btn ghost" type="button" id="proOpen" style="padding:9px 14px">Upgrade</button></div>
  <div class="setrow"><div>Privacy policy<small>What Reuz stores and why</small></div><button class="btn ghost" type="button" id="privacyOpen" style="padding:9px 14px">Read</button></div>
  <div class="actions">
    <button class="btn ghost" type="button" id="cancel">Cancel</button>
    <button class="btn" type="button" id="save">Save</button>
  </div>
  <div class="status" id="status" role="status"></div>
</section>

<section class="sheet glass" id="paySheet" role="dialog" aria-modal="true" aria-labelledby="payTitle">
  <div class="grab"></div>
  <h2 id="payTitle">Reuz Pro</h2>
  <ul class="perks">
    <li><span class="dot">&#9742;</span><span><b>Dismiss challenges</b><small>Dial a code on the rotary or solve a sum. No more snoozing through it.</small></span></li>
    <li><span class="dot">&#9790;</span><span><b>Smart wake window</b><small>Reuz rings early, when your phone feels you stirring, inside a window you choose.</small></span></li>
    <li><span class="dot">&#9201;</span><span><b>Focus timers</b><small>Pomodoro, Deep and Flow sessions that start their break by themselves.</small></span></li>
  </ul>
  <div class="plans" id="plans"></div>
  <div class="actions">
    <button class="btn ghost" type="button" id="payRestore">Restore purchase</button>
    <button class="btn ghost" type="button" id="payClose">Not now</button>
  </div>
  <div class="status" id="payMsg" role="status"></div>
  <small class="fine">Subscriptions renew automatically until you cancel them in Google Play. Manage or cancel any time in Play Store &gt; Payments &amp; subscriptions. Clocks, alarms, timers, widgets and gentle volume stay free.</small>
</section>

<section class="sheet glass" id="dialSheet" role="dialog" aria-modal="true" aria-labelledby="dialTitle">
  <div class="grab"></div>
  <h2 id="dialTitle">Set time</h2>
  <div class="readout" id="readout"></div>
  <div class="preview" id="dialPreview"></div>
  <div class="seg" role="group" aria-label="Dial style">
    <button type="button" id="modeSpin" aria-pressed="true">Spin dial</button>
    <button type="button" id="modeRotary" aria-pressed="false">Rotary phone</button>
  </div>
  <div class="dials" id="dials">
    <div class="dialview active" id="viewSpin">
      <svg id="knob" viewBox="0 0 300 300" aria-label="Spin dial. Drag around the ring to set the value.">
        <defs>
          <radialGradient id="kdisc" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#2b3358"/><stop offset="1" stop-color="#0d1020"/></radialGradient>
          <linearGradient id="kbrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd98c"/><stop offset="1" stop-color="#ff9b45"/></linearGradient>
          <filter id="kglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
        </defs>
        <circle cx="150" cy="150" r="142" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.14)"/>
        <circle cx="150" cy="150" r="96" fill="url(#kdisc)" stroke="rgba(255,255,255,.12)"/>
        <g id="kticks"></g>
        <g id="knums" fill="rgba(255,255,255,.4)" font-size="13" text-anchor="middle" dominant-baseline="central"></g>
        <circle id="karc" cx="150" cy="150" r="116" fill="none" stroke="url(#kbrass)" stroke-width="5" stroke-linecap="round" transform="rotate(-90 150 150)" stroke-dasharray="0 999"/>
        <g id="kgrip"><circle cx="150" cy="150" r="70" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="10" stroke-dasharray="3 22"/><circle cx="150" cy="86" r="4" fill="#ffc46b"/></g>
        <text id="kval" x="150" y="152" text-anchor="middle" dominant-baseline="central" font-size="50" font-weight="650" fill="#fff"></text>
        <text id="kunit" x="150" y="186" text-anchor="middle" font-size="12" letter-spacing="2" fill="#98a4bd"></text>
        <circle id="khaloG" r="14" fill="#ff9b45" filter="url(#kglow)" opacity=".8"/>
        <circle id="khalo" r="13" fill="url(#kbrass)" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>
      </svg>
    </div>
    <div class="dialview" id="viewRotary">
      <svg id="rotary" viewBox="0 0 300 300" aria-label="Rotary phone dial. Drag a number around to the stop, then let go.">
        <defs>
          <radialGradient id="rbase" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#1a2038"/><stop offset="1" stop-color="#0a0d1a"/></radialGradient>
          <linearGradient id="rbrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd98c"/><stop offset="1" stop-color="#ff9b45"/></linearGradient>
          <linearGradient id="rplate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4268"/><stop offset="1" stop-color="#171c33"/></linearGradient>
          <mask id="rholes" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="300"><rect width="300" height="300" fill="#fff"/><g id="rmask"></g></mask>
        </defs>
        <circle cx="150" cy="150" r="146" fill="url(#rbase)" stroke="rgba(255,255,255,.14)"/>
        <g id="rnums" fill="#ffd98c" font-size="22" font-weight="700" text-anchor="middle" dominant-baseline="central"></g>
        <g id="rplateg"><g mask="url(#rholes)"><circle cx="150" cy="150" r="140" fill="url(#rplate)"/><circle cx="150" cy="150" r="140" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/></g><g id="rrims" fill="none" stroke="url(#rbrass)" stroke-width="2.4"></g></g>
        <g id="rstop"></g>
        <circle cx="150" cy="150" r="38" fill="url(#rbrass)"/>
        <circle cx="150" cy="150" r="31" fill="#10142a"/>
        <text id="rhub" class="hubdigit" x="150" y="151" text-anchor="middle" dominant-baseline="central" font-size="30" font-weight="700" fill="#ffd98c">R</text>
      </svg>
    </div>
  </div>
  <div class="dialtools" id="dialTools"><button class="iconbtn tap" id="dialBack" style="display:none">⌫ Back</button><button class="iconbtn tap" id="dialClear" style="display:none">Clear</button></div>
  <div class="actions"><button class="btn ghost tap" type="button" id="dialCancel">Cancel</button><button class="btn tap" type="button" id="dialDone">Set</button></div>
</section>

<section class="alert glass" id="alert" role="alertdialog" aria-live="assertive" aria-labelledby="alertTitle">
  <div class="big" id="alertTitle"></div>
  <div class="small" id="alertBody"></div>
  <button class="btn" id="alertDismiss">Dismiss</button>
</section>

<script>
(function () {
  "use strict";
  var KEY = "reuz.v3", OLD_KEY = "reuz.v2";
  var ALL = 127;
  var DAYS = ["S","M","T","W","T","F","S"];
  var DAYNAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var ZONES = ["UTC","Asia/Kolkata","Asia/Dubai","Asia/Singapore","Asia/Tokyo","Europe/London","Europe/Paris","Europe/Berlin","America/New_York","America/Chicago","America/Los_Angeles","Australia/Sydney","Pacific/Auckland"];
  var TABS = ["clock","world","timer","stop","alarm"];
  var home = { timezone: "UTC", format: "24h" };
  var draftFormat = "24h";
  var alertQueue = [];
  var alertOpen = false;
  var fmtParts = null;
  var native = (window.ReuzNative && typeof window.ReuzNative.sync === "function") ? window.ReuzNative : null;
  var API = native ? "https://reuz.prakasharuntandon634.workers.dev" : ""; // used for the privacy page link only
  var pro = false;
  if (native && native.isPro) { try { pro = !!native.isPro(); } catch (e) {} }
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function $(id) { return document.getElementById(id); }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hm(h, m) { return pad(h) + ":" + pad(m); }
  function isDigit(ch) { return ch >= "0" && ch <= "9"; }
  function validZone(z) { try { new Intl.DateTimeFormat("en-US", { timeZone: z }); return typeof z === "string" && z.length > 0 && z.length <= 64; } catch (e) { return false; } }
  function svgEl(tag, attrs) { var e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  // ---------- State
  function defaults() {
    return { worldZones: ["Europe/London", "America/New_York", "Asia/Tokyo"], timers: [], alarms: [],
      sw: { running: false, startedAt: 0, baseMs: 0, laps: [] },
      ui: { face: "digital", sound: true, haptics: true, draftTimerMs: 300000, draftAlarm: { h: 7, m: 0 }, draftDays: ALL, draftWake: { challenge: "off", window: 0, gentle: true } } };
  }
  function load() {
    var base = defaults();
    try {
      var raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY);
      if (!raw) return base;
      var d = JSON.parse(raw);
      if (Array.isArray(d.worldZones)) base.worldZones = d.worldZones.filter(validZone);
      if (Array.isArray(d.timers)) base.timers = d.timers;
      if (Array.isArray(d.alarms)) base.alarms = d.alarms.map(function (a) { if (typeof a.days !== "number") a.days = ALL; return a; });
      if (d.sw && typeof d.sw === "object") base.sw = Object.assign(base.sw, d.sw);
      if (d.ui && typeof d.ui === "object") {
        base.ui = Object.assign(base.ui, d.ui);
        if (!base.ui.draftAlarm || typeof base.ui.draftAlarm.h !== "number") base.ui.draftAlarm = { h: 7, m: 0 };
        if (!base.ui.draftWake || typeof base.ui.draftWake !== "object") base.ui.draftWake = { challenge: "off", window: 0, gentle: true };
      }
    } catch (e) { return defaults(); }
    return base;
  }
  var data = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} syncNative(); }

  // ---------- Native bridge (Android app)
  function daysText(mask) {
    if (!mask || mask === ALL) return "Every day";
    if (mask === 62) return "Weekdays";
    if (mask === 65) return "Weekends";
    var out = [];
    for (var i = 0; i < 7; i++) if (mask & (1 << i)) out.push(DAYNAMES[i]);
    return out.join(", ");
  }
  function scheduleList() {
    var out = [];
    data.alarms.forEach(function (a) {
      if (a.enabled) out.push({ id: "alarm-" + a.id, hour: a.hour, minute: a.minute, days: a.days, title: "Rise and shine", body: a.label || hm(a.hour, a.minute),
        challenge: pro ? (a.challenge || "off") : "off", window: pro ? (a.window || 0) : 0, gentle: a.gentle !== false });
    });
    data.timers.forEach(function (t) {
      if (t.state === "running") out.push({ id: "timer-" + t.id, at: t.endAt, title: "Ding! Time is up", body: t.label });
    });
    return out;
  }
  function syncNative() { if (!native) return; try { native.sync(JSON.stringify(scheduleList())); } catch (e) {} }
  function requestNotify() {
    if (native) { try { if (!native.canNotify()) native.requestNotifications(); } catch (e) {} }
    else if ("Notification" in window && Notification.permission === "default") { try { Notification.requestPermission(); } catch (e) {} }
  }
  function browserNotify(title, body) {
    if (native || !("Notification" in window) || Notification.permission !== "granted") return;
    try { new Notification(title, { body: body }); } catch (e) {}
  }

  // ---------- Clockwork sound and haptics
  var sfx = { ctx: null, noise: null };
  function audio() {
    if (!sfx.ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { sfx.ctx = new C(); } catch (e) { return null; }
      var len = Math.floor(sfx.ctx.sampleRate * 0.05), buf = sfx.ctx.createBuffer(1, len, sfx.ctx.sampleRate), ch = buf.getChannelData(0);
      for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
      sfx.noise = buf;
    }
    if (sfx.ctx.state === "suspended") { try { sfx.ctx.resume(); } catch (e) {} }
    return sfx.ctx;
  }
  // strength: 0 soft ratchet, 1 normal tick, 2 heavy clunk
  function tick(strength) {
    if (data.ui.haptics) {
      if (native && native.haptic) { try { native.haptic(strength === 2 ? "heavy" : "tick"); } catch (e) {} }
      else if (navigator.vibrate) { try { navigator.vibrate(strength === 2 ? 14 : 5); } catch (e) {} }
    }
    if (!data.ui.sound) return;
    var ctx = audio();
    if (!ctx) return;
    var t = ctx.currentTime, peak = strength === 2 ? 0.6 : (strength === 1 ? 0.34 : 0.17);
    var src = ctx.createBufferSource(); src.buffer = sfx.noise;
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = strength === 2 ? 1400 : 2700; bp.Q.value = 1.3;
    var g = ctx.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination); src.start(t);
    var o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(strength === 2 ? 300 : 560, t); o.frequency.exponentialRampToValueAtTime(strength === 2 ? 110 : 210, t + 0.05);
    og.gain.setValueAtTime(peak * 0.55, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o.connect(og); og.connect(ctx.destination); o.start(t); o.stop(t + 0.07);
  }
  function beep() {
    var ctx = audio();
    if (!ctx) return;
    [0, 0.22, 0.44].forEach(function (d) {
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + d;
      o.type = "sine"; o.frequency.value = 880; g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.2);
    });
  }

  // ---------- Toast and in-page alert
  var toastTimer = 0;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }
  function showAlert(title, body) { alertQueue.push({ title: title, body: body }); if (!alertOpen) nextAlert(); }
  function nextAlert() {
    var a = alertQueue.shift();
    if (!a) { alertOpen = false; return; }
    alertOpen = true;
    $("alertTitle").textContent = a.title; $("alertBody").textContent = a.body || "";
    $("alert").classList.add("open"); beep();
  }
  $("alertDismiss").onclick = function () { $("alert").classList.remove("open"); setTimeout(nextAlert, 420); };

  // ---------- Ripples on anything tappable
  function ripple(el, e) {
    if (reduced) return;
    var r = el.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.1, s = document.createElement("span");
    s.className = "ripple"; s.style.width = s.style.height = size + "px";
    s.style.left = (e.clientX - r.left - size / 2) + "px"; s.style.top = (e.clientY - r.top - size / 2) + "px";
    el.appendChild(s); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 700);
  }
  document.addEventListener("pointerdown", function (e) {
    var t = e.target.closest && e.target.closest(".tap");
    if (t) ripple(t, e);
  }, true);

  // ---------- Home time helpers
  function rebuildFmt() {
    try { fmtParts = new Intl.DateTimeFormat("en-GB", { timeZone: home.timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }); }
    catch (e) { fmtParts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }); }
  }
  function partsIn(fmt, d) {
    var o = { h: 0, m: 0, s: 0 };
    fmt.formatToParts(d).forEach(function (x) {
      if (x.type === "hour") o.h = Number(x.value) % 24;
      if (x.type === "minute") o.m = Number(x.value);
      if (x.type === "second") o.s = Number(x.value);
    });
    return o;
  }
  function homeParts(d) { return partsIn(fmtParts, d); }
  var fcache = {};
  function F(zone, kind) {
    var key = zone + "|" + kind + "|" + home.format;
    if (fcache[key]) return fcache[key];
    var opts;
    if (kind === "time") opts = { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: home.format === "12h" };
    else if (kind === "day") opts = { timeZone: zone, weekday: "short", day: "numeric", month: "short" };
    else if (kind === "hour") opts = { timeZone: zone, hour: "2-digit", hourCycle: "h23" };
    else if (kind === "full") opts = { timeZone: zone, weekday: "long", day: "numeric", month: "long", year: "numeric" };
    else opts = { timeZone: zone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" };
    fcache[key] = new Intl.DateTimeFormat("en-GB", opts);
    return fcache[key];
  }
  function offsetMin(zone, d) {
    var p = F(zone, "off").formatToParts(d), v = {};
    p.forEach(function (x) { v[x.type] = Number(x.value); });
    var asUtc = Date.UTC(v.year, v.month - 1, v.day, v.hour % 24, v.minute, v.second);
    return Math.round((asUtc - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  }
  function greeting(h) {
    if (h >= 5 && h < 12) return "Rise and shine";
    if (h >= 12 && h < 17) return "Good afternoon";
    if (h >= 17 && h < 22) return "Good evening";
    return "Burning the midnight oil?";
  }
  function inText(ms) {
    var m = Math.round(ms / 60000);
    if (m < 1) return "in under a minute";
    var d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    if (d > 0) return "in " + d + "d " + h + "h";
    if (h > 0) return "in " + h + "h " + mm + "m";
    return "in " + mm + "m";
  }
  function nextOccurrence(hour, minute, days, now) {
    for (var i = 0; i < 8; i++) {
      var d = new Date(now.getTime()); d.setDate(now.getDate() + i); d.setHours(hour, minute, 0, 0);
      if (d > now && (!days || days === ALL || (days & (1 << d.getDay())))) return d;
    }
    return null;
  }

  // ---------- Capsule tab bar and panels
  var tabs = document.querySelectorAll(".tab"), capsule = $("capsule"), tabsEl = $("tabs"), currentTab = "clock", capTimer = 0;
  function tabBtn(name) { return tabsEl.querySelector('[data-tab="' + name + '"]'); }
  function placeCapsule(name, animate) {
    var b = tabBtn(name);
    if (!b) return;
    var toL = b.offsetLeft, toW = b.offsetWidth, fromL = capsule.offsetLeft, fromW = capsule.offsetWidth;
    clearTimeout(capTimer);
    if (!animate || reduced || !fromW) {
      capsule.className = "capsule still"; capsule.style.left = toL + "px"; capsule.style.width = toW + "px";
      void capsule.offsetWidth; capsule.className = "capsule"; return;
    }
    var left = Math.min(fromL, toL), right = Math.max(fromL + fromW, toL + toW);
    capsule.className = "capsule stretch"; capsule.style.left = left + "px"; capsule.style.width = (right - left) + "px";
    capTimer = setTimeout(function () { capsule.className = "capsule"; capsule.style.left = toL + "px"; capsule.style.width = toW + "px"; }, 150);
  }
  function showTab(name) {
    if (TABS.indexOf(name) < 0) return;
    var idx = TABS.indexOf(name);
    tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.getAttribute("data-tab") === name)); });
    document.querySelectorAll(".panel").forEach(function (p) {
      var pi = TABS.indexOf(p.id.slice(2));
      p.style.setProperty("--dx", (pi === idx ? 0 : (pi < idx ? -34 : 34)) + "px");
      p.classList.toggle("active", pi === idx);
    });
    if (name !== currentTab) { tick(1); placeCapsule(name, true); }
    currentTab = name;
    renderAll();
    if (name === "clock" && data.ui.face === "analog") animLoop();
  }
  tabs.forEach(function (t) { t.onclick = function () { showTab(t.getAttribute("data-tab")); }; });
  window.addEventListener("resize", function () { placeCapsule(currentTab, false); });

  // ---------- Clock tab
  // The digit elements persist, so a flip or wave animation is never cut short by a re-render.
  var tspans = null, tkey = "";
  function buildTime(h12) {
    var el = $("time"), html = "", i;
    for (i = 0; i < 8; i++) html += (i === 2 || i === 5) ? '<span class="colon">:</span>' : '<span class="digit">0</span>';
    if (h12) html += '<span class="ap"></span>';
    el.innerHTML = html;
    tspans = { digits: el.querySelectorAll(".digit"), ap: el.querySelector(".ap"), ready: false };
    tkey = h12 ? "12" : "24";
    tspans.digits.forEach(function (s) { s.addEventListener("animationend", function () { s.classList.remove("wave", "changing"); }); });
  }
  function renderTime(p) {
    var h12 = home.format === "12h";
    if (tkey !== (h12 ? "12" : "24")) buildTime(h12);
    var text = pad(h12 ? (p.h % 12 || 12) : p.h) + pad(p.m) + pad(p.s);
    for (var i = 0; i < 6; i++) {
      var ch = text.charAt(i), s = tspans.digits[i];
      if (s.textContent === ch) continue;
      s.textContent = ch;
      if (tspans.ready && !reduced && !s.classList.contains("wave")) { s.classList.remove("changing"); void s.offsetWidth; s.classList.add("changing"); }
    }
    tspans.ready = true;
    if (tspans.ap) tspans.ap.textContent = p.h < 12 ? "AM" : "PM";
  }
  function renderClock() {
    var d = new Date(), p = homeParts(d);
    renderTime(p);
    $("date").textContent = F(home.timezone, "full").format(d);
    $("zone").textContent = home.timezone.replace("_", " ") + " · " + (home.format === "12h" ? "12-hour" : "24-hour");
    $("tagline").textContent = greeting(p.h);
    var next = null;
    data.alarms.forEach(function (a) {
      if (!a.enabled) return;
      var o = nextOccurrence(a.hour, a.minute, a.days, d);
      if (o && (!next || o < next.at)) next = { at: o, a: a };
    });
    $("nextAlarm").textContent = next ? hm(next.a.hour, next.a.minute) + (next.a.label ? " · " + next.a.label : "") : "None set";
    $("nextAlarmNote").textContent = next ? "Rings " + inText(next.at - d) : "Sleep like a rock";
    var running = data.timers.filter(function (t) { return t.state === "running"; });
    $("timerCount").textContent = String(running.length);
    var soon = null;
    running.forEach(function (t) { var r = t.endAt - d.getTime(); if (r > 0 && (soon === null || r < soon)) soon = r; });
    $("timerNote").textContent = soon === null ? "Nothing ticking" : "Next ends " + inText(soon);
    var frac = (p.h * 3600 + p.m * 60 + p.s) / 86400;
    $("dayfill").style.width = (frac * 100).toFixed(2) + "%";
    $("daynote").textContent = Math.round(frac * 100) + "% of the day is behind you";
  }

  // Analog face
  var analog = { built: false };
  function buildAnalog() {
    if (analog.built) return;
    var f = $("analogFace");
    var svg = svgEl("svg", { viewBox: "0 0 300 300", "class": "analog" });
    // userSpaceOnUse: a bounding-box gradient paints nothing on perfectly vertical or horizontal lines.
    var defs = svgEl("defs", {}), g1 = svgEl("linearGradient", { id: "abrass", gradientUnits: "userSpaceOnUse", x1: "0", y1: "0", x2: "300", y2: "300" });
    g1.appendChild(svgEl("stop", { offset: "0", "stop-color": "#ffd98c" })); g1.appendChild(svgEl("stop", { offset: "1", "stop-color": "#ff9b45" }));
    defs.appendChild(g1); svg.appendChild(defs);
    svg.appendChild(svgEl("circle", { cx: 150, cy: 150, r: 146, fill: "rgba(255,255,255,.04)", stroke: "rgba(255,255,255,.16)" }));
    for (var i = 0; i < 60; i++) {
      var a = i / 60 * Math.PI * 2, major = i % 5 === 0, r1 = major ? 124 : 134, r2 = 142;
      svg.appendChild(svgEl("line", { x1: 150 + r1 * Math.sin(a), y1: 150 - r1 * Math.cos(a), x2: 150 + r2 * Math.sin(a), y2: 150 - r2 * Math.cos(a), stroke: major ? "url(#abrass)" : "rgba(255,255,255,.3)", "stroke-width": major ? 3 : 1.3, "stroke-linecap": "round" }));
    }
    [["12", 150, 98], ["3", 202, 150], ["6", 150, 202], ["9", 98, 150]].forEach(function (n) {
      var t = svgEl("text", { x: n[1], y: n[2], "text-anchor": "middle", "dominant-baseline": "central", "font-size": 24, "font-weight": 300, fill: "#eef2fb" }); t.textContent = n[0]; svg.appendChild(t);
    });
    var br = svgEl("text", { x: 150, y: 124, "text-anchor": "middle", "font-size": 10, "letter-spacing": 4, fill: "#ffc46b" }); br.textContent = "REUZ"; svg.appendChild(br);
    analog.hour = svgEl("g", {}); analog.hour.appendChild(svgEl("line", { x1: 150, y1: 158, x2: 150, y2: 92, stroke: "#f4f7ff", "stroke-width": 7, "stroke-linecap": "round" }));
    analog.min = svgEl("g", {}); analog.min.appendChild(svgEl("line", { x1: 150, y1: 160, x2: 150, y2: 58, stroke: "#f4f7ff", "stroke-width": 5, "stroke-linecap": "round" }));
    analog.sec = svgEl("g", {}); analog.sec.appendChild(svgEl("line", { x1: 150, y1: 176, x2: 150, y2: 40, stroke: "url(#abrass)", "stroke-width": 2.2, "stroke-linecap": "round" }));
    svg.appendChild(analog.hour); svg.appendChild(analog.min); svg.appendChild(analog.sec);
    svg.appendChild(svgEl("circle", { cx: 150, cy: 150, r: 7, fill: "url(#abrass)" })); svg.appendChild(svgEl("circle", { cx: 150, cy: 150, r: 3, fill: "#10142a" }));
    var hint = document.createElement("div"); hint.className = "hint"; hint.textContent = "tap to flip";
    f.appendChild(svg); f.appendChild(hint); analog.built = true;
  }
  function updateAnalog() {
    var d = new Date(), p = homeParts(d), sec = p.s + d.getMilliseconds() / 1000, min = p.m + sec / 60, hr = (p.h % 12) + min / 60;
    analog.sec.setAttribute("transform", "rotate(" + (sec * 6).toFixed(2) + " 150 150)");
    analog.min.setAttribute("transform", "rotate(" + (min * 6).toFixed(2) + " 150 150)");
    analog.hour.setAttribute("transform", "rotate(" + (hr * 30).toFixed(2) + " 150 150)");
  }
  var looping = false;
  function animLoop() {
    if (looping) return;
    looping = true;
    (function frame() {
      if (data.ui.face !== "analog" || currentTab !== "clock" || document.hidden) { looping = false; return; }
      updateAnalog(); requestAnimationFrame(frame);
    })();
  }
  function applyFace(animate) {
    var fl = $("flipper"), analogOn = data.ui.face === "analog";
    buildAnalog();
    fl.classList.toggle("flipped", analogOn);
    if (analogOn) { updateAnalog(); animLoop(); }
    else if (animate && !reduced) {
      document.querySelectorAll("#time .digit").forEach(function (el, i) { el.style.setProperty("--i", i); el.classList.remove("wave"); void el.offsetWidth; el.classList.add("wave"); });
    }
  }
  var heroPoint = null;
  $("flipper").addEventListener("pointerdown", function (e) { heroPoint = { clientX: e.clientX, clientY: e.clientY }; ripple($("heroFx"), e); });
  $("flipper").addEventListener("click", function (e) {
    var fl = $("flipper"), pt = heroPoint || { clientX: e.clientX, clientY: e.clientY };
    setTimeout(function () { ripple($("heroFx"), pt); }, 140);
    fl.classList.remove("pop"); void fl.offsetWidth; fl.classList.add("pop");
    tick(2);
    data.ui.face = data.ui.face === "analog" ? "digital" : "analog";
    save(); applyFace(true);
  });
  $("flipper").addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("flipper").click(); } });

  // ---------- Settings sheet and layers
  var tzSel = $("tz"), tzCustom = $("tzCustom"), statusEl = $("status"), overlay = $("overlay"), openLayer = null;
  ZONES.forEach(function (z) { var o = document.createElement("option"); o.value = z; o.textContent = z; tzSel.appendChild(o); });
  function openSheet(el) { if (openLayer && openLayer !== el) openLayer.classList.remove("open"); openLayer = el; el.classList.add("open"); overlay.classList.add("open"); }
  function closeSheet() { if (openLayer) openLayer.classList.remove("open"); openLayer = null; overlay.classList.remove("open"); }
  function setToggle(id, on) { $(id).setAttribute("aria-checked", String(!!on)); }
  function applyHome(s) {
    if (s && validZone(s.timezone)) home.timezone = s.timezone;
    if (s && (s.format === "12h" || s.format === "24h")) home.format = s.format;
    if (native) { try { native.setHome(home.timezone, home.format); } catch (e) {} }
    rebuildFmt(); renderClock(); renderWorld(); renderDraftAlarm(); renderAlarms();
  }
  function loadHome() {
    if (native) {
      // In the app the home zone lives on the phone, so it works offline and is never shared.
      var saved = null;
      try { saved = JSON.parse(native.getHome()); } catch (e) {}
      var device = "UTC";
      try { device = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) {}
      applyHome(saved && validZone(saved.timezone) ? saved : { timezone: validZone(device) ? device : "UTC", format: home.format });
      return;
    }
    fetch(API + "/api/settings", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(applyHome)
      .catch(function () { $("zone").textContent = "Offline · " + home.timezone; });
  }
  function setFormatButtons(f) {
    draftFormat = f;
    document.querySelectorAll("[data-format]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-format") === f)); });
  }
  function openSettings() {
    var known = ZONES.indexOf(home.timezone) >= 0;
    tzSel.value = known ? home.timezone : ZONES[0]; tzCustom.value = known ? "" : home.timezone;
    setFormatButtons(home.format); setToggle("optSound", data.ui.sound); setToggle("optHaptics", data.ui.haptics);
    statusEl.textContent = ""; statusEl.className = "status"; openSheet($("sheet"));
  }
  function saveHome() {
    var tz = tzCustom.value.trim() || tzSel.value;
    if (!validZone(tz)) { statusEl.textContent = "That timezone isn't recognised."; statusEl.className = "status err"; return; }
    if (native) { applyHome({ timezone: tz, format: draftFormat }); statusEl.textContent = "Saved"; setTimeout(closeSheet, 500); return; }
    $("save").disabled = true; statusEl.textContent = "Saving…"; statusEl.className = "status";
    fetch(API + "/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ timezone: tz, format: draftFormat }) })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (s) { applyHome(s); statusEl.textContent = "Saved"; setTimeout(closeSheet, 500); })
      .catch(function () { statusEl.textContent = "Couldn't save. Check your connection."; statusEl.className = "status err"; })
      .then(function () { $("save").disabled = false; });
  }
  $("openSettings").onclick = openSettings;
  overlay.onclick = function () { closeSheet(); };
  $("cancel").onclick = closeSheet;
  $("save").onclick = saveHome;
  $("optSound").onclick = function () { data.ui.sound = !data.ui.sound; setToggle("optSound", data.ui.sound); save(); tick(1); };
  $("optHaptics").onclick = function () { data.ui.haptics = !data.ui.haptics; setToggle("optHaptics", data.ui.haptics); save(); tick(1); };
  document.querySelectorAll("[data-format]").forEach(function (b) { b.onclick = function () { setFormatButtons(b.getAttribute("data-format")); }; });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

  // ---------- World clocks
  var worldSel = $("worldSel");
  ZONES.forEach(function (z) { var o = document.createElement("option"); o.value = z; o.textContent = z; worldSel.appendChild(o); });
  function offsetText(diff) {
    if (diff === 0) return "Same time as home";
    var a = Math.abs(diff), h = Math.floor(a / 60), m = a % 60, s = (h ? h + "h" : "") + (m ? (h ? " " : "") + m + "m" : "");
    return s + (diff > 0 ? " ahead" : " behind");
  }
  function renderWorld() {
    var list = $("worldList");
    if (!data.worldZones.length) { list.innerHTML = '<div class="empty">No cities yet.<br>Add one and I will keep its clock wound.</div>'; return; }
    var html = "";
    data.worldZones.forEach(function (z, i) {
      html += '<div class="row tap"><div class="glyph" data-wg="' + i + '"></div><div class="main"><div class="title">' + esc(z.replace("_", " ")) + '</div><div class="meta" data-wday="' + i + '"></div></div>'
        + '<div class="right" data-wtime="' + i + '"></div>'
        + '<button class="iconbtn danger" data-wdel="' + i + '" aria-label="Remove ' + esc(z) + '">✕</button></div>';
    });
    list.innerHTML = html; tickWorld();
  }
  function tickWorld() {
    var d = new Date(), homeOff = 0;
    try { homeOff = offsetMin(home.timezone, d); } catch (e) {}
    data.worldZones.forEach(function (z, i) {
      var t = document.querySelector('[data-wtime="' + i + '"]'), day = document.querySelector('[data-wday="' + i + '"]'), gl = document.querySelector('[data-wg="' + i + '"]');
      if (!t || !day) return;
      t.textContent = F(z, "time").format(d);
      var off = 0; try { off = offsetMin(z, d); } catch (e) {}
      day.textContent = F(z, "day").format(d) + " · " + offsetText(off - homeOff);
      var hr = Number(F(z, "hour").format(d));
      if (gl) gl.textContent = (hr >= 6 && hr < 18) ? "☀" : "☾";
    });
  }
  $("worldAdd").onclick = function () {
    var z = $("worldCustom").value.trim() || worldSel.value;
    if (!validZone(z)) { toast("I don't know that timezone. Try Africa/Nairobi."); return; }
    if (data.worldZones.indexOf(z) < 0) data.worldZones.push(z);
    $("worldCustom").value = ""; tick(1); save(); renderWorld();
  };
  $("worldList").onclick = function (e) {
    var b = e.target.closest("[data-wdel]");
    if (!b) return;
    data.worldZones.splice(Number(b.getAttribute("data-wdel")), 1); save(); renderWorld();
  };

  // ---------- Timers
  function fmtHMS(ms) {
    var s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? h + ":" + pad(m) + ":" + pad(sec) : pad(m) + ":" + pad(sec);
  }
  function renderDraftTimer() { $("timerNew").textContent = fmtHMS(data.ui.draftTimerMs); }
  [1, 5, 10, 25].forEach(function (m) {
    var c = document.createElement("button");
    c.className = "chip tap"; c.textContent = m + " min";
    c.onclick = function () { data.ui.draftTimerMs = m * 60000; tick(1); save(); renderDraftTimer(); };
    $("timerPresets").appendChild(c);
  });
  function timerRemaining(t) {
    if (t.state !== "running") return t.remainingMs;
    if (t.startAt && Date.now() < t.startAt) return t.durationMs;
    return Math.max(0, t.endAt - Date.now());
  }
  var CIRC = 2 * Math.PI * 19;
  function renderTimers() {
    var list = $("timerList");
    if (!data.timers.length) { list.innerHTML = '<div class="empty">Nothing ticking.<br>Wind one up above.</div>'; return; }
    var html = "";
    data.timers.forEach(function (t) {
      var running = t.state === "running", label = t.state === "paused" ? "Resume" : (running ? "Pause" : "Start");
      html += '<div class="row wrap"><svg class="ring" viewBox="0 0 46 46"><circle class="track" cx="23" cy="23" r="19"/><circle class="prog" data-ring="' + t.id + '" cx="23" cy="23" r="19" stroke-dasharray="' + CIRC.toFixed(2) + '" stroke-dashoffset="0"/></svg>'
        + '<div class="main"><div class="title">' + esc(t.label) + '</div><div class="meta">' + fmtHMS(t.durationMs) + " · " + (t.startAt && Date.now() < t.startAt && running ? "starts after focus" : esc(t.state)) + '</div></div>'
        + '<div class="right" data-remain="' + t.id + '"></div>'
        + '<div class="acts"><button class="iconbtn tap" data-tstart="' + t.id + '">' + label + '</button>'
        + '<button class="iconbtn tap" data-treset="' + t.id + '">Reset</button>'
        + '<button class="iconbtn danger" data-tdel="' + t.id + '" aria-label="Delete timer">✕</button></div></div>';
    });
    list.innerHTML = html; tickTimers();
  }
  function tickTimers() {
    data.timers.forEach(function (t) {
      var el = document.querySelector('[data-remain="' + t.id + '"]'), ring = document.querySelector('[data-ring="' + t.id + '"]');
      var left = timerRemaining(t);
      if (el) el.textContent = (t.state === "running" && left <= 0) ? "Done" : fmtHMS(left);
      if (ring) ring.setAttribute("stroke-dashoffset", (CIRC * (1 - clamp(left / t.durationMs, 0, 1))).toFixed(2));
    });
  }
  function finishTimer(t, quiet) {
    data.timers = data.timers.filter(function (x) { return x.id !== t.id; });
    if (quiet) toast("Ding! " + t.label + " finished");
    else { showAlert("Ding! Time is up", t.label); browserNotify("Ding! Time is up", t.label); }
    save(); renderTimers();
  }
  $("timerDraft").onclick = function () {
    var ms = data.ui.draftTimerMs, s = Math.floor(ms / 1000);
    openDial({ kind: "timer", title: "Set timer", vals: [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60], field: 1, done: "Use this time",
      onDone: function (v) { data.ui.draftTimerMs = (v[0] * 3600 + v[1] * 60 + v[2]) * 1000; save(); renderDraftTimer(); } });
  };
  $("timerAdd").onclick = function () {
    var ms = data.ui.draftTimerMs;
    if (!(ms >= 1000)) { toast("Dial in a time first."); return; }
    var t = { id: uid(), label: $("timerLabel").value.trim() || (fmtHMS(ms) + " timer"), durationMs: ms, remainingMs: ms, endAt: Date.now() + ms, state: "running" };
    data.timers.unshift(t); $("timerLabel").value = ""; requestNotify(); tick(2); toast("Wound up. " + fmtHMS(ms) + " and counting."); save(); renderTimers();
  };
  $("timerList").onclick = function (e) {
    var s = e.target.closest("[data-tstart]"), r = e.target.closest("[data-treset]"), d = e.target.closest("[data-tdel]");
    var el = s || r || d;
    if (!el) return;
    var id = el.getAttribute(s ? "data-tstart" : r ? "data-treset" : "data-tdel");
    var t = data.timers.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    if (s) {
      if (t.state === "running") { t.remainingMs = Math.min(t.durationMs, Math.max(0, t.endAt - Date.now())); t.state = "paused"; t.endAt = 0; t.startAt = 0; }
      else { if (t.remainingMs <= 0) t.remainingMs = t.durationMs; t.endAt = Date.now() + t.remainingMs; t.state = "running"; requestNotify(); }
    } else if (r) { t.state = "idle"; t.endAt = 0; t.remainingMs = t.durationMs; }
    else { data.timers = data.timers.filter(function (x) { return x.id !== id; }); }
    tick(1); save(); renderTimers();
  };

  // ---------- Stopwatch
  function swElapsed() { var s = data.sw; return s.running ? s.baseMs + (Date.now() - s.startedAt) : s.baseMs; }
  function fmtSW(ms) {
    var cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60, h = Math.floor(ms / 3600000);
    return (h > 0 ? h + ":" + pad(m) : pad(m)) + ":" + pad(s) + "." + pad(cs);
  }
  function renderSW() {
    var ms = swElapsed();
    $("swTime").textContent = fmtSW(ms);
    $("swRing").setAttribute("stroke-dashoffset", (276.5 * (1 - (ms % 60000) / 60000)).toFixed(2));
    $("swStart").textContent = data.sw.running ? "Pause" : (data.sw.baseMs > 0 ? "Resume" : "Start");
    var laps = data.sw.laps;
    if (!laps.length) { $("swLaps").innerHTML = '<div class="empty">Hit Lap to mark a moment.</div>'; return; }
    var splits = laps.map(function (l, i) { return i === 0 ? l : l - laps[i - 1]; });
    var best = Math.min.apply(null, splits), worst = Math.max.apply(null, splits), html = "";
    for (var i = laps.length - 1; i >= 0; i--) {
      var cls = laps.length > 2 ? (splits[i] === best ? " best" : (splits[i] === worst ? " worst" : "")) : "";
      html += '<div class="row"><div class="main"><div class="title">Lap ' + (i + 1) + '</div><div class="meta' + cls + '">Split ' + fmtSW(splits[i]) + (cls === " best" ? " · fastest" : (cls === " worst" ? " · slowest" : "")) + '</div></div><div class="right">' + fmtSW(laps[i]) + "</div></div>";
    }
    $("swLaps").innerHTML = html;
  }
  $("swStart").onclick = function () {
    var s = data.sw;
    if (s.running) { s.baseMs = swElapsed(); s.running = false; } else { s.startedAt = Date.now(); s.running = true; }
    tick(2); save(); renderSW();
  };
  $("swLap").onclick = function () { if (data.sw.running) { data.sw.laps.push(swElapsed()); tick(1); save(); renderSW(); } };
  $("swReset").onclick = function () { data.sw = { running: false, startedAt: 0, baseMs: 0, laps: [] }; tick(1); save(); renderSW(); };

  // ---------- Alarms
  function renderDraftAlarm() {
    var a = data.ui.draftAlarm, text = hm(a.h, a.m);
    if (home.format === "12h") text = pad(a.h % 12 || 12) + ":" + pad(a.m) + (a.h < 12 ? " AM" : " PM");
    $("alarmNew").textContent = text;
  }
  function renderDayChips() {
    var box = $("dayChips"), html = "";
    for (var i = 0; i < 7; i++) html += '<button type="button" class="chip day tap' + ((data.ui.draftDays & (1 << i)) ? " on" : "") + '" data-day="' + i + '" aria-pressed="' + !!(data.ui.draftDays & (1 << i)) + '" aria-label="' + DAYNAMES[i] + '">' + DAYS[i] + "</button>";
    box.innerHTML = html;
  }
  $("dayChips").onclick = function (e) {
    var b = e.target.closest("[data-day]");
    if (!b) return;
    var bit = 1 << Number(b.getAttribute("data-day")), next = data.ui.draftDays ^ bit;
    if (next === 0) { toast("Pick at least one day."); return; }
    data.ui.draftDays = next; tick(1); save(); renderDayChips();
  };
  function alarmClockText(a) {
    if (home.format !== "12h") return hm(a.hour, a.minute);
    return pad(a.hour % 12 || 12) + ":" + pad(a.minute) + (a.hour < 12 ? " AM" : " PM");
  }
  function renderAlarms() {
    var list = $("alarmList");
    if (!data.alarms.length) { list.innerHTML = '<div class="empty">No alarms.<br>Sleep like a rock.</div>'; return; }
    var now = new Date(), html = "";
    data.alarms.slice().sort(function (a, b) { return (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute); }).forEach(function (a) {
      var o = a.enabled ? nextOccurrence(a.hour, a.minute, a.days, now) : null;
      html += '<div class="row' + (a.enabled ? "" : " dim") + '"><div class="main"><div class="title">' + esc(a.label || "Alarm") + '</div><div class="meta">' + esc(daysText(a.days)) + '</div><div class="meta">' + (o ? "Rings " + inText(o - now) : "Off") + '</div>' + (wakeText(a) ? '<div class="meta">' + esc(wakeText(a)) + '</div>' : "") + '</div>'
        + '<button class="timelink" data-aedit="' + a.id + '" aria-label="Edit alarm time">' + alarmClockText(a) + '</button>'
        + '<button class="toggle" role="switch" aria-checked="' + a.enabled + '" data-atog="' + a.id + '" aria-label="Enable alarm"></button>'
        + '<button class="iconbtn danger" data-adel="' + a.id + '" aria-label="Delete alarm">✕</button></div>';
    });
    list.innerHTML = html;
  }
  $("alarmDraft").onclick = function () {
    var d = data.ui.draftAlarm;
    openDial({ kind: "alarm", title: "Set alarm", vals: [d.h, d.m], field: 0, done: "Use this time",
      onDone: function (v) { data.ui.draftAlarm = { h: v[0], m: v[1] }; save(); renderDraftAlarm(); } });
  };
  $("alarmAdd").onclick = function () {
    var d = data.ui.draftAlarm;
    data.alarms.push({ id: uid(), hour: d.h, minute: d.m, label: $("alarmLabel").value.trim(), enabled: true, days: data.ui.draftDays, lastFired: "",
      challenge: data.ui.draftWake.challenge, window: data.ui.draftWake.window, gentle: data.ui.draftWake.gentle });
    $("alarmLabel").value = ""; requestNotify(); tick(2);
    var o = nextOccurrence(d.h, d.m, data.ui.draftDays, new Date());
    toast(o ? "Alarm set. Rings " + inText(o - new Date()) : "Alarm set.");
    save(); renderAlarms(); renderClock();
  };
  $("alarmList").onclick = function (e) {
    var t = e.target.closest("[data-atog]"), d = e.target.closest("[data-adel]"), ed = e.target.closest("[data-aedit]");
    if (ed) {
      var al = data.alarms.filter(function (x) { return x.id === ed.getAttribute("data-aedit"); })[0];
      if (!al) return;
      openDial({ kind: "alarm", title: "Edit alarm", vals: [al.hour, al.minute], field: 0, done: "Save alarm",
        onDone: function (v) { al.hour = v[0]; al.minute = v[1]; al.lastFired = ""; save(); renderAlarms(); renderClock(); } });
      return;
    }
    if (t) { var a = data.alarms.filter(function (x) { return x.id === t.getAttribute("data-atog"); })[0]; if (a) a.enabled = !a.enabled; }
    else if (d) { data.alarms = data.alarms.filter(function (x) { return x.id !== d.getAttribute("data-adel"); }); }
    else return;
    tick(1); save(); renderAlarms(); renderClock();
  };

  // ---------- The dial sheet: a spin knob and an old rotary phone
  var FIELDS = {
    timer: [{ n: 24, label: "hours" }, { n: 60, label: "min" }, { n: 60, label: "sec" }],
    alarm: [{ n: 24, label: "hour" }, { n: 60, label: "min" }]
  };
  var D = { cfg: null, vals: [], field: 0, mode: "spin", fresh: true };
  var dialSheet = $("dialSheet");
  function fieldN() { return FIELDS[D.cfg.kind][D.field].n; }
  function toDigits() { return D.vals.map(pad).join(""); }
  function fromDigits(s) { D.vals = FIELDS[D.cfg.kind].map(function (f, i) { return Number(s.slice(i * 2, i * 2 + 2)); }); }
  function zeros() { return new Array(FIELDS[D.cfg.kind].length * 2 + 1).join("0"); }
  function renderReadout() {
    var html = "";
    FIELDS[D.cfg.kind].forEach(function (f, i) {
      if (i) html += '<span class="sep">:</span>';
      html += '<button type="button" class="fld' + (D.mode === "spin" && i === D.field ? " on" : "") + '" data-fi="' + i + '"><span class="num">' + pad(D.vals[i]) + "</span><small>" + f.label + "</small></button>";
    });
    $("readout").innerHTML = html;
    var pv = $("dialPreview"), now = new Date();
    pv.className = "preview";
    if (D.cfg.kind === "timer") {
      var total = D.vals[0] * 3600 + D.vals[1] * 60 + D.vals[2];
      if (total < 1) pv.textContent = "Dial in a duration";
      else if (total > 86400) { pv.textContent = "That is over a day. I will cap it at 24 hours."; pv.className = "preview err"; }
      else { var end = new Date(now.getTime() + total * 1000); pv.textContent = "Ends at " + hm(end.getHours(), end.getMinutes()); }
    } else {
      if (D.vals[0] > 23 || D.vals[1] > 59) { pv.textContent = "Hours go to 23, minutes to 59"; pv.className = "preview err"; }
      else { var o = nextOccurrence(D.vals[0], D.vals[1], ALL, now); pv.textContent = o ? "Rings " + inText(o - now) : ""; }
    }
  }
  $("readout").onclick = function (e) {
    var b = e.target.closest("[data-fi]");
    if (!b || D.mode !== "spin") return;
    D.field = Number(b.getAttribute("data-fi")); tick(1); buildKnob(); renderReadout();
  };
  function openDial(cfg) {
    D.cfg = cfg; D.vals = cfg.vals.slice(); D.field = cfg.field || 0; D.fresh = true;
    $("dialTitle").textContent = cfg.title; $("dialDone").textContent = cfg.done || "Set";
    setMode("spin", true); buildKnob(); renderReadout(); openSheet(dialSheet);
  }
  function closeDial() { closeSheet(); }
  function setMode(m, instant) {
    D.mode = m;
    $("modeSpin").setAttribute("aria-pressed", String(m === "spin")); $("modeRotary").setAttribute("aria-pressed", String(m === "rotary"));
    $("viewSpin").classList.toggle("active", m === "spin"); $("viewRotary").classList.toggle("active", m === "rotary");
    $("dialBack").style.display = m === "rotary" ? "" : "none"; $("dialClear").style.display = m === "rotary" ? "" : "none";
    if (m === "rotary") { D.fresh = true; $("rhub").textContent = "R"; }
    if (D.cfg) renderReadout();
    if (!instant) tick(1);
  }
  $("modeSpin").onclick = function () { setMode("spin"); };
  $("modeRotary").onclick = function () { setMode("rotary"); };
  $("dialCancel").onclick = closeDial;
  $("dialDone").onclick = function () {
    var v = D.vals.slice(), msg = "";
    if (D.cfg.kind === "timer") {
      var total = v[0] * 3600 + v[1] * 60 + v[2];
      if (total < 1) msg = "Dial in a duration first.";
      else { total = Math.min(total, 86400); v = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]; }
    } else if (v[0] > 23 || v[1] > 59) msg = "That time does not exist on my dial.";
    if (msg) { toast(msg); var r = $("readout"); r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake"); return; }
    tick(2); closeDial(); D.cfg.onDone(v);
  };

  // Spin knob
  var KC = 150, KR = 116;
  function buildKnob() {
    var N = fieldN(), major = N === 24 ? 6 : 5, h = "", nums = "", i;
    for (i = 0; i < N; i++) {
      var a = i / N * Math.PI * 2, mj = i % major === 0, r1 = mj ? 127 : 131, r2 = 139;
      h += '<line data-i="' + i + '" x1="' + (KC + r1 * Math.sin(a)).toFixed(2) + '" y1="' + (KC - r1 * Math.cos(a)).toFixed(2) + '" x2="' + (KC + r2 * Math.sin(a)).toFixed(2) + '" y2="' + (KC - r2 * Math.cos(a)).toFixed(2) + '" stroke="' + (mj ? "rgba(255,255,255,.62)" : "rgba(255,255,255,.26)") + '" stroke-width="' + (mj ? 2.4 : 1.3) + '" stroke-linecap="round"/>';
      if (mj) { var rn = 100; nums += '<text x="' + (KC + rn * Math.sin(a)).toFixed(1) + '" y="' + (KC - rn * Math.cos(a)).toFixed(1) + '">' + i + "</text>"; }
    }
    $("kticks").innerHTML = h; $("knums").innerHTML = nums;
    $("kunit").textContent = FIELDS[D.cfg.kind][D.field].label.toUpperCase();
    updateKnob();
  }
  function updateKnob() {
    var N = fieldN(), v = D.vals[D.field], a = v / N * Math.PI * 2, x = KC + KR * Math.sin(a), y = KC - KR * Math.cos(a), C = 2 * Math.PI * KR;
    $("khalo").setAttribute("cx", x.toFixed(2)); $("khalo").setAttribute("cy", y.toFixed(2));
    $("khaloG").setAttribute("cx", x.toFixed(2)); $("khaloG").setAttribute("cy", y.toFixed(2));
    $("karc").setAttribute("stroke-dasharray", (C * v / N).toFixed(2) + " " + C.toFixed(2));
    $("kgrip").setAttribute("transform", "rotate(" + (v / N * 360).toFixed(1) + " 150 150)");
    $("kval").textContent = pad(v);
    var ticks = $("kticks").children;
    for (var i = 0; i < ticks.length; i++) ticks[i].setAttribute("stroke-opacity", i === v ? "1" : "");
  }
  var knob = $("knob"), kd = null;
  function knobPoint(e) {
    var r = knob.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    return { deg: (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360, dist: Math.hypot(dx, dy) / (r.width / 300) };
  }
  function knobSet(deg) {
    var N = fieldN(), v = Math.round(deg / 360 * N) % N;
    if (v === D.vals[D.field]) return;
    D.vals[D.field] = v; kd.changed = true;
    tick(v % (N === 24 ? 6 : 5) === 0 ? 2 : 1);
    updateKnob(); renderReadout();
  }
  knob.addEventListener("pointerdown", function (e) {
    var p = knobPoint(e);
    if (p.dist < 64) return;
    try { knob.setPointerCapture(e.pointerId); } catch (x) {}
    kd = { id: e.pointerId, changed: false }; knobSet(p.deg); e.preventDefault();
  });
  knob.addEventListener("pointermove", function (e) { if (kd && e.pointerId === kd.id) knobSet(knobPoint(e).deg); });
  function knobEnd(e) {
    if (!kd || e.pointerId !== kd.id) return;
    var changed = kd.changed; kd = null;
    if (changed && D.cfg.kind === "alarm" && D.field === 0) { D.field = 1; setTimeout(function () { tick(1); buildKnob(); renderReadout(); }, 160); }
  }
  knob.addEventListener("pointerup", knobEnd); knob.addEventListener("pointercancel", function () { kd = null; });

  // Rotary phone dial. Digit n sits (20 + 28n) degrees counterclockwise of the finger stop.
  var STOP = 120, SVGNS = "http://www.w3.org/2000/svg", returning = false, plateRot = 0;
  function rotNeeded(n) { return 20 + 28 * n; }
  function holeAt(n) { var a = (STOP - rotNeeded(n)) * Math.PI / 180; return { x: 150 + 100 * Math.sin(a), y: 150 - 100 * Math.cos(a) }; }
  function buildRotary() {
    var mask = $("rmask"), nums = $("rnums"), rims = $("rrims"), stop = $("rstop"), n;
    for (n = 1; n <= 10; n++) {
      var p = holeAt(n), label = String(n % 10);
      mask.appendChild(svgEl("circle", { cx: p.x.toFixed(2), cy: p.y.toFixed(2), r: 23, fill: "#000" }));
      rims.appendChild(svgEl("circle", { cx: p.x.toFixed(2), cy: p.y.toFixed(2), r: 23 }));
      var t = svgEl("text", { x: p.x.toFixed(2), y: p.y.toFixed(2) }); t.textContent = label; nums.appendChild(t);
    }
    var sa = STOP * Math.PI / 180, sx = 150 + 134 * Math.sin(sa), sy = 150 - 134 * Math.cos(sa);
    stop.appendChild(svgEl("rect", { x: sx - 6, y: sy - 18, width: 12, height: 36, rx: 6, fill: "url(#rbrass)", transform: "rotate(" + (STOP - 90 + 90) + " " + sx.toFixed(2) + " " + sy.toFixed(2) + ")" }));
  }
  function setPlate(deg) { plateRot = deg; $("rplateg").setAttribute("transform", "rotate(" + deg.toFixed(2) + " 150 150)"); }
  var rot = $("rotary"), rd = null;
  function rotPoint(e) { var r = rot.getBoundingClientRect(), k = 300 / r.width; return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k }; }
  function rotAngle(p) { return Math.atan2(p.x - 150, -(p.y - 150)) * 180 / Math.PI; }
  function pushDigit(d) {
    var s = D.fresh ? zeros() : toDigits();
    D.fresh = false; fromDigits((s + d).slice(-(FIELDS[D.cfg.kind].length * 2)));
    renderReadout();
    var hub = $("rhub"); hub.textContent = String(d); hub.classList.remove("pop"); void hub.getBoundingClientRect(); hub.classList.add("pop");
  }
  function startReturn(from, digit) {
    if (from <= 0.5) { setPlate(0); return; }
    returning = true;
    var cur = from, last = performance.now(), ticked = Math.floor(from / 28);
    function frame(t) {
      var dt = Math.min(0.05, (t - last) / 1000); last = t;
      cur = Math.max(0, cur - 380 * dt); setPlate(cur);
      var step = Math.floor(cur / 28);
      while (ticked > step) { tick(1); ticked--; }
      if (cur <= 0) { returning = false; if (digit !== null) { tick(2); pushDigit(digit); } return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  rot.addEventListener("pointerdown", function (e) {
    if (returning || rd) return;
    var p = rotPoint(e), hit = 0, n;
    for (n = 1; n <= 10; n++) { var h = holeAt(n); if (Math.hypot(p.x - h.x, p.y - h.y) <= 28) { hit = n; break; } }
    if (!hit) return;
    try { rot.setPointerCapture(e.pointerId); } catch (x) {}
    rd = { id: e.pointerId, n: hit, prev: rotAngle(p), delta: 0, step: 0 }; tick(0); e.preventDefault();
  });
  rot.addEventListener("pointermove", function (e) {
    if (!rd || e.pointerId !== rd.id) return;
    var a = rotAngle(rotPoint(e)), d = a - rd.prev;
    if (d > 180) d -= 360; if (d < -180) d += 360;
    rd.prev = a; rd.delta = clamp(rd.delta + d, 0, rotNeeded(rd.n)); setPlate(rd.delta);
    var step = Math.floor(rd.delta / 28);
    if (step > rd.step) tick(0);
    rd.step = step;
  });
  function rotEnd(e) {
    if (!rd || e.pointerId !== rd.id) return;
    var reached = rd.delta >= rotNeeded(rd.n) - 7, n = rd.n, delta = rd.delta; rd = null;
    startReturn(delta, reached ? n % 10 : null);
  }
  rot.addEventListener("pointerup", rotEnd);
  rot.addEventListener("pointercancel", function (e) { if (rd) { var dl = rd.delta; rd = null; startReturn(dl, null); } });
  $("dialBack").onclick = function () {
    var s = toDigits(); D.fresh = false; fromDigits("0" + s.slice(0, -1)); tick(1); renderReadout();
  };
  $("dialClear").onclick = function () { D.fresh = false; fromDigits(zeros()); tick(1); renderReadout(); };

  // ---------- Reuz Pro: wake-up options, focus sessions and the paywall
  var paySheet = $("paySheet"), plansBox = $("plans"), payMsg = $("payMsg");
  var FOCUS = [["Pomodoro", 25, 5], ["Deep", 50, 10], ["Flow", 90, 15]];
  function wakeText(a) {
    if (!native) return "";
    var bits = [];
    if (a.challenge === "dial") bits.push("Dial challenge"); else if (a.challenge === "math") bits.push("Math challenge");
    if (a.window) bits.push("Smart " + a.window + " min");
    return bits.join(" · ");
  }
  function setSeg(id, attr, value) {
    document.querySelectorAll("#" + id + " [" + attr + "]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute(attr) === String(value))); });
  }
  function renderWake() {
    var w = data.ui.draftWake;
    setSeg("segChallenge", "data-ch", w.challenge); setSeg("segWindow", "data-win", w.window); setToggle("optGentle", w.gentle);
  }
  function renderPro() {
    $("wakeBox").hidden = !native;
    $("proRow").hidden = !native;
    $("focusPresets").hidden = !native;
    $("proState").textContent = pro ? "Active. Thank you!" : "Dismiss challenges, smart wake and focus timers";
    $("proOpen").textContent = pro ? "Manage" : "Upgrade";
    if (!pro && (data.ui.draftWake.challenge !== "off" || data.ui.draftWake.window)) { data.ui.draftWake.challenge = "off"; data.ui.draftWake.window = 0; }
    renderWake();
  }
  function renderPlans(list) {
    var html = "";
    list.forEach(function (p) {
      html += '<button type="button" class="plan tap' + (p.sku === "reuz_pro_yearly" ? " best" : "") + '" data-sku="' + esc(p.sku) + '"><span><b>' + esc(p.title) + '</b><small>' + esc(p.note) + '</small></span><b>' + esc(p.price) + '</b></button>';
    });
    plansBox.innerHTML = html || '<div class="empty">Prices are loading…</div>';
  }
  function loadPlans() {
    var list = [];
    try { list = JSON.parse(native.products()); } catch (e) {}
    renderPlans(list);
  }
  function openPay() {
    if (!native) return;
    payMsg.textContent = ""; payMsg.className = "status";
    loadPlans(); openSheet(paySheet);
    setTimeout(function () { if (paySheet.classList.contains("open")) loadPlans(); }, 1500);
  }
  function needPro() { if (pro) return true; openPay(); return false; }
  window.reuzPro = function (on) {
    pro = !!on; renderPro(); syncNative();
    if (pro) { payMsg.textContent = "Reuz Pro is on. Enjoy!"; setTimeout(function () { if (openLayer === paySheet) closeSheet(); }, 900); }
  };
  window.reuzBilling = function (msg) { payMsg.textContent = String(msg || ""); payMsg.className = "status"; loadPlans(); };
  plansBox.onclick = function (e) {
    var b = e.target.closest("[data-sku]");
    if (!b || !native) return;
    payMsg.textContent = "Opening Google Play…";
    try { native.buy(b.getAttribute("data-sku")); } catch (x) { payMsg.textContent = "Billing isn't available right now."; }
  };
  $("payRestore").onclick = function () { payMsg.textContent = "Checking Google Play…"; try { native.restore(); } catch (x) {} };
  $("payClose").onclick = closeSheet;
  $("proOpen").onclick = function () {
    if (pro) { try { native.manageSubscriptions(); } catch (x) {} } else openPay();
  };
  $("privacyOpen").onclick = function () { if (native) location.href = API + "/privacy"; else window.open("/privacy", "_blank"); };
  $("segChallenge").onclick = function (e) {
    var b = e.target.closest("[data-ch]"); if (!b) return;
    var v = b.getAttribute("data-ch");
    if (v !== "off" && !needPro()) return;
    data.ui.draftWake.challenge = v; tick(1); save(); renderWake();
  };
  $("segWindow").onclick = function (e) {
    var b = e.target.closest("[data-win]"); if (!b) return;
    var v = Number(b.getAttribute("data-win"));
    if (v && !needPro()) return;
    data.ui.draftWake.window = v; tick(1); save(); renderWake();
  };
  $("optGentle").onclick = function () { data.ui.draftWake.gentle = !data.ui.draftWake.gentle; tick(1); save(); renderWake(); };
  FOCUS.forEach(function (f) {
    var c = document.createElement("button");
    c.className = "chip tap"; c.textContent = f[0] + " " + f[1] + " / " + f[2];
    c.onclick = function () {
      if (!needPro()) return;
      var now = Date.now(), fm = f[1] * 60000, bm = f[2] * 60000;
      var focus = { id: uid(), label: f[0] + " focus", durationMs: fm, remainingMs: fm, endAt: now + fm, state: "running" };
      var rest = { id: uid(), label: "Break", durationMs: bm, remainingMs: bm, startAt: now + fm, endAt: now + fm + bm, state: "running" };
      data.timers.unshift(rest); data.timers.unshift(focus);
      requestNotify(); tick(2); toast(f[0] + " started. Break follows by itself."); save(); renderTimers();
    };
    $("focusPresets").appendChild(c);
  });

  // ---------- Background checks (browser mode alerts; in the Android app the phone rings instead)
  function checkAlarms(now) {
    if (native) return;
    var changed = false;
    data.alarms.forEach(function (a) {
      if (!a.enabled || now.getHours() !== a.hour || now.getMinutes() !== a.minute) return;
      if (a.days && a.days !== ALL && !(a.days & (1 << now.getDay()))) return;
      var key = now.toDateString() + " " + hm(a.hour, a.minute);
      if (a.lastFired === key) return;
      a.lastFired = key; changed = true;
      showAlert("Rise and shine", a.label || hm(a.hour, a.minute)); browserNotify("Rise and shine", a.label || hm(a.hour, a.minute));
    });
    if (changed) save();
  }
  function checkTimers() {
    var now = Date.now();
    data.timers.slice().forEach(function (t) {
      if (t.state !== "running") return;
      if (native) { if (now - t.endAt > 3000) finishTimer(t, true); }
      else if (t.endAt <= now) finishTimer(t, false);
    });
  }
  function renderAll() { renderClock(); renderWorld(); renderTimers(); renderSW(); renderAlarms(); renderDraftTimer(); renderDraftAlarm(); }
  var beat = 0;
  setInterval(function () {
    renderClock(); checkAlarms(new Date()); checkTimers();
    if (currentTab === "world") tickWorld();
    if (currentTab === "timer") tickTimers();
    if (currentTab === "stop") renderSW();
    if (++beat % 40 === 0 && currentTab === "alarm") renderAlarms();
  }, 250);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { renderAll(); syncNative(); if (data.ui.face === "analog") animLoop(); } });

  rebuildFmt(); buildRotary(); renderDayChips(); renderAll(); renderPro(); applyFace(false);
  document.querySelectorAll(".panel").forEach(function (p) { var pi = TABS.indexOf(p.id.slice(2)); p.style.setProperty("--dx", (pi === 0 ? 0 : 34) + "px"); });
  setTimeout(function () { placeCapsule("clock", false); }, 30);
  loadHome(); syncNative();
})();
</script>
</body>
</html>
`;
