// Tactile steel, smoked glass and warm amber. Kept separate from the app logic so
// every clock surface and native WebView uses the same lightweight finish.
export const ATELIER_CSS = `
:root {
  color-scheme: dark;
  --bg:#0c1012; --ink:#f2f3f1; --muted:#b5bfc4;
  --accent:#ffb947; --accent2:#ff9833; --brass:#ffb947; --brass2:#ff982c;
  --good:#ffc363; --bad:#ffaaa3;
  --glass:rgba(39,48,53,.65); --glass-border:rgba(220,233,237,.24);
  --panel-top:rgba(76,88,94,.47); --panel-bottom:rgba(20,28,32,.79);
  --glass-shine:rgba(255,255,255,.21); --surface:rgba(16,23,27,.7);
  --surface-soft:rgba(211,228,237,.055); --line:rgba(224,235,241,.13);
  --shadow:rgba(0,0,0,.48); --dial:#11191e; --dial-edge:#596166;
  --body-texture:rgba(211,219,220,.023); --amber-wash:rgba(237,152,67,.18);
  --warm-ink:#251706;
}
html[data-theme="light"], body[data-theme="light"] {
  color-scheme:light;
  --bg:#e6e5df; --ink:#252c2f; --muted:#58646a;
  --accent:#9d570e; --accent2:#ad6119; --brass:#a65b0c; --brass2:#e79b39;
  --good:#9b5c12; --bad:#b63c32;
  --glass:rgba(251,252,249,.77); --glass-border:rgba(66,76,79,.24);
  --panel-top:rgba(255,255,255,.92); --panel-bottom:rgba(209,216,215,.72);
  --glass-shine:rgba(255,255,255,.94); --surface:rgba(246,248,245,.88);
  --surface-soft:rgba(76,91,97,.055); --line:rgba(52,66,72,.15);
  --shadow:rgba(53,56,47,.18); --dial:#edf0ec; --dial-edge:#8f999b;
  --body-texture:rgba(57,67,67,.027); --amber-wash:rgba(200,135,57,.18);
  --warm-ink:#251706;
}
@media (prefers-color-scheme:light) {
  html:not([data-theme="dark"]):not([data-theme="light"]), html[data-theme="system"] {
    color-scheme:light;
    --bg:#e6e5df; --ink:#252c2f; --muted:#58646a;
    --accent:#9d570e; --accent2:#ad6119; --brass:#a65b0c; --brass2:#e79b39;
    --good:#9b5c12; --bad:#b63c32;
    --glass:rgba(251,252,249,.77); --glass-border:rgba(66,76,79,.24);
    --panel-top:rgba(255,255,255,.92); --panel-bottom:rgba(209,216,215,.72);
    --glass-shine:rgba(255,255,255,.94); --surface:rgba(246,248,245,.88);
    --surface-soft:rgba(76,91,97,.055); --line:rgba(52,66,72,.15);
    --shadow:rgba(53,56,47,.18); --dial:#edf0ec; --dial-edge:#8f999b;
    --body-texture:rgba(57,67,67,.027); --amber-wash:rgba(200,135,57,.18);
    --warm-ink:#251706;
  }
}
html, body { overscroll-behavior:none; }
body {
  background-color:var(--bg);
  background-image:radial-gradient(ellipse at 0% 12%,var(--amber-wash),transparent 44%),radial-gradient(ellipse at 100% 92%,var(--amber-wash),transparent 42%),linear-gradient(128deg,transparent 0 26%,var(--surface-soft) 26.2% 35%,transparent 35.2%),repeating-linear-gradient(90deg,transparent 0 72px,var(--body-texture) 73px 74px),repeating-linear-gradient(0deg,transparent 0 98px,var(--body-texture) 99px 100px);
  font-family:Roboto,"Segoe UI",system-ui,-apple-system,sans-serif;
  font-weight:400;
}
.aurora {
  inset:0; filter:none; animation:none;
  background:linear-gradient(144deg,transparent 10%,var(--amber-wash) 17%,transparent 23% 72%,var(--amber-wash) 85%,transparent 94%);
  opacity:.9;
}
.app::before {
  content:""; position:absolute; inset:0; pointer-events:none; z-index:-1;
  background:linear-gradient(90deg,transparent 0 79%,var(--surface-soft) 79.3% 80%,transparent 80.2%),linear-gradient(180deg,var(--surface-soft),transparent 30%);
}
.glass, .row, .face {
  border-color:var(--glass-border);
  background:linear-gradient(135deg,var(--panel-top),var(--panel-bottom) 65%);
  box-shadow:inset 0 1px 0 var(--glass-shine),inset 0 -1px 0 rgba(0,0,0,.18),0 8px 22px var(--shadow);
  backdrop-filter:blur(14px) saturate(115%); -webkit-backdrop-filter:blur(14px) saturate(115%);
}
.top {
  width:calc(100% - 28px); max-width:652px; min-height:57px;
  margin:max(10px,env(safe-area-inset-top)) auto 5px; padding:7px 9px;
  border:1px solid var(--line); border-radius:21px;
  background:linear-gradient(115deg,var(--surface-soft),var(--surface) 70%);
  box-shadow:inset 0 1px 0 var(--glass-shine),0 7px 17px rgba(0,0,0,.14);
}
.brandrow { gap:9px; }
.logo { width:35px; height:35px; border-radius:50%; box-shadow:0 0 0 1px rgba(255,185,71,.28),0 2px 12px rgba(255,166,52,.14); }
#lbg stop:first-child { stop-color:#323735; }
#lbg stop:last-child { stop-color:#0b1012; }
.brand { color:var(--ink); background:none; font-weight:650; font-size:18px; letter-spacing:-.03em; }
.tagline { margin-top:3px; font-size:11px; color:var(--muted); }
#openSettings { display:grid; place-items:center; min-width:44px; min-height:44px; padding:9px 11px; border-radius:50%; background:var(--surface); border-color:var(--line); }
#openSettings svg { width:23px; height:23px; }
.panel { padding:9px 14px calc(102px + env(safe-area-inset-bottom)); width:100%; max-width:680px; margin:0 auto; scrollbar-width:thin; scrollbar-color:var(--dial-edge) transparent; }
.section-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:8px 3px 14px; }
.section-heading h1, .section-heading h2 { margin:0; font-size:20px; font-weight:600; letter-spacing:-.035em; }
.section-heading p { margin:4px 0 0; font-size:12px; color:var(--muted); }
.heading-mark { color:var(--muted); font-size:9px; letter-spacing:.13em; white-space:nowrap; }
.eyebrow { margin:0 0 6px; color:var(--brass); font-size:10px; font-weight:650; letter-spacing:.17em; text-transform:uppercase; }
.card { padding:17px; border-radius:21px; margin-bottom:13px; }
.flipper { margin:0 0 15px; }
.flip-inner { height:clamp(260px,40vh,360px); }
.face { border:0; background:transparent; box-shadow:none; padding:18px 2px; border-radius:24px; }
.face.front { background:radial-gradient(ellipse at 50% 70%,var(--surface-soft),transparent 70%); }
.bigtime { color:var(--ink); font-size:clamp(44px,15.1vw,88px); font-weight:650; line-height:1.1; letter-spacing:-.055em; text-shadow:0 2px 12px var(--shadow); }
.bigtime .ap { color:var(--brass); letter-spacing:0; }
.clock-seconds, .seconds { color:var(--brass); }
.clock-greeting { font-size:12px; color:var(--muted); letter-spacing:.03em; margin-bottom:18px; }
.sub { margin-top:10px; font-size:14px; color:var(--ink); letter-spacing:0; }
.zone { margin-top:14px; font-size:11px; padding:7px 11px; border:1px solid var(--line); background:var(--glass); box-shadow:inset 0 1px 0 var(--glass-shine); }
.dot { width:7px; height:7px; background:var(--brass); box-shadow:0 0 8px rgba(255,179,65,.35); animation:none; }
.hint { bottom:10px; font-size:9px; letter-spacing:.16em; color:var(--muted); opacity:.7; }
.grid { gap:12px; }
.home-summary .mini, .mini { padding:15px 14px; min-height:120px; }
.home-summary button { font:inherit; color:var(--ink); text-align:left; cursor:pointer; }
.summary-icon { display:flex; width:23px; height:25px; margin-bottom:9px; color:var(--brass); filter:drop-shadow(0 0 5px rgba(255,179,65,.18)); }
.summary-icon svg { width:23px; height:23px; }
.label { color:var(--muted); font-size:11px; text-transform:none; letter-spacing:0; }
.value { font-size:17px; font-weight:600; margin-top:5px; letter-spacing:-.025em; }
.note { margin-top:4px; font-size:11px; line-height:1.4; }
.day-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.day-head .label { color:var(--ink); font-size:12px; }
.day-percent { color:var(--brass); font-size:13px; font-weight:650; }
.daybar { height:6px; margin:14px 0 8px; background:var(--line); box-shadow:inset 0 1px 3px rgba(0,0,0,.2); }
.daybar > i { background:linear-gradient(90deg,#ffac3b,#ffd891); box-shadow:0 0 9px rgba(255,183,71,.5); }
.row { padding:15px; border-radius:19px; margin-bottom:11px; }
.row .title { font-size:14px; font-weight:500; }
.row .meta { font-size:11px; line-height:1.45; }
.row .right, .timelink { font-size:23px; font-weight:600; letter-spacing:-.04em; }
.row.dim { opacity:.65; }
.row .acts { gap:7px; margin-top:2px; }
.row .glyph { color:var(--brass); }
.timelink { min-height:44px; border-bottom-color:var(--brass); }
.world-toolbar { padding:0; border-radius:19px; margin-bottom:12px; }
.world-toolbar .form { gap:8px; }
.search-shell { display:flex; align-items:center; gap:9px; flex:1 1 100%; min-width:0; min-height:47px; padding:0 13px; margin:0; border:1px solid var(--glass-border); border-radius:15px; background:var(--surface); box-shadow:inset 0 1px 4px rgba(0,0,0,.12),0 1px 0 var(--glass-shine); }
.search-shell svg { width:19px; height:19px; flex:none; color:var(--muted); }
.search-shell input { width:100%; min-width:0; border:0; box-shadow:none; background:transparent; padding:10px 0; }
.search-shell:focus-within { outline:2px solid var(--brass); outline-offset:3px; }
.search-shell input:focus, .search-shell input:focus-visible { outline:none; box-shadow:none; }
.city-plus { width:44px; min-height:44px; padding:0; border-radius:50%; font-size:29px; font-weight:400; }
.world-toolbar select { flex:1 1 180px; }
.world-toolbar #worldAdd { min-width:44px; }
.world-card { position:relative; display:flex; align-items:center; gap:12px; min-height:123px; padding:13px 12px 13px 16px; overflow:hidden; }
.world-copy { flex:1; min-width:0; }
.world-copy .title { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; color:var(--ink); }
.world-zone { margin-top:3px; color:var(--muted); font-size:9px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.world-time { color:var(--ink); font-size:32px; font-weight:650; line-height:1.05; letter-spacing:-.035em; font-variant-numeric:tabular-nums; margin:6px 0 4px; }
.world-copy .meta { font-size:10px; line-height:1.5; }
.world-offset { color:var(--muted); font-size:10px; line-height:1.5; margin-top:1px; }
.world-offset > span:first-child { color:var(--brass); }
.world-dial { flex:none; width:89px; height:89px; filter:drop-shadow(0 4px 7px var(--shadow)); }
.world-bezel { fill:var(--dial-edge); stroke:var(--glass-shine); stroke-width:1; }
.world-disc { fill:var(--dial); stroke:rgba(0,0,0,.6); stroke-width:1.5; }
.world-dial text { fill:var(--muted); }
.world-dial line[data-wh] { stroke:var(--ink); }
.world-dial line[data-wm] { stroke:var(--brass); }
.local-badge { position:absolute; right:15px; top:9px; color:var(--brass); font-size:8px; font-weight:600; letter-spacing:.13em; }
.world-remove { position:absolute; right:0; top:0; z-index:2; background:none; border:0; box-shadow:none; width:44px; min-width:44px; padding:0 0 10px 10px; color:var(--muted) !important; font-size:23px; }
.world-actions { position:absolute; top:5px; right:2px; }
.world-actions .iconbtn { background:transparent; width:38px; padding:8px; }
.world-card .world-dial { margin-right:12px; }
.btn {
  min-height:48px; border-radius:16px; padding:13px 18px; color:var(--warm-ink);
  background:linear-gradient(150deg,#ffd27c,#ffad36 48%,#ff9624);
  border:1px solid rgba(255,222,163,.55); font-size:14px; font-weight:650;
  box-shadow:inset 0 1px 1px rgba(255,255,255,.5),inset 0 -1px 0 rgba(172,82,0,.28),0 5px 13px rgba(255,153,37,.18),0 4px 8px var(--shadow);
}
.btn.ghost, .iconbtn, .pill, .chip {
  background:linear-gradient(155deg,var(--panel-top),var(--panel-bottom));
  color:var(--ink); border:1px solid var(--glass-border);
  box-shadow:inset 0 1px 0 var(--glass-shine),0 3px 7px rgba(0,0,0,.13);
}
.btn.ghost { box-shadow:inset 0 1px 0 var(--glass-shine),0 3px 7px rgba(0,0,0,.13); }
.iconbtn { min-height:44px; min-width:44px; border-radius:13px; }
.pill { min-height:44px; }
.chip { min-height:44px; border-radius:14px; font-size:12px; padding:9px 13px; }
.chip.on { color:var(--warm-ink); background:linear-gradient(145deg,#ffd075,#ffa52e); border-color:#ffd17e; box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 4px 12px rgba(255,167,47,.18); }
.chips { gap:7px; }
.chips.days { justify-content:center; overflow-x:auto; gap:4px; padding:4px 0; }
.chips.days { justify-content:safe center; gap:2px; }
.chip.day { width:44px; height:44px; border-radius:50%; flex:0 0 44px; font-size:12px; }
.toggle { width:52px; height:32px; border-color:var(--glass-border); background:var(--line); box-shadow:inset 0 2px 5px rgba(0,0,0,.2); }
.toggle::before { content:""; position:absolute; inset:-7px -3px; }
.toggle::after { width:24px; height:24px; top:3px; left:3px; background:linear-gradient(150deg,#fff,#cdd3d3); box-shadow:0 1px 4px rgba(0,0,0,.4),inset 0 1px 0 #fff; }
.toggle[aria-checked="true"] { background:linear-gradient(140deg,#ffc35b,#ff9d26); box-shadow:0 0 17px rgba(255,166,42,.21),inset 0 1px 0 rgba(255,255,255,.3); }
.toggle[aria-checked="true"]::after { transform:translateX(20px); }
select, input { min-height:46px; padding:11px 13px; background:var(--surface); color:var(--ink); border-color:var(--glass-border); border-radius:13px; box-shadow:inset 0 2px 4px rgba(0,0,0,.10),0 1px 0 var(--glass-shine); font-size:14px; }
input::placeholder { color:var(--muted); opacity:.9; }
select option { background:var(--bg); color:var(--ink); }
.form { gap:9px; }
.form .btn { flex:1 1 120px; }
.field-caption { color:var(--muted); font-size:11px; margin:12px 2px 6px; text-align:left; }
.edit-hint { color:var(--muted); font-size:10px; letter-spacing:.09em; }
.seg { display:grid; background:var(--surface); border:1px solid var(--line); border-radius:15px; padding:4px; gap:4px; box-shadow:inset 0 2px 5px rgba(0,0,0,.12); }
.seg button { min-height:44px; padding:9px; border-radius:11px; font-size:12px; }
.seg button[aria-pressed="true"] { background:linear-gradient(145deg,#ffd078,#ffa52e); color:var(--warm-ink); box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 3px 8px rgba(0,0,0,.18); }
.instrument-card { padding:14px 12px 15px; border-radius:23px; background:linear-gradient(140deg,var(--surface),var(--panel-bottom)); }
#timerPresets { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; margin:0 0 9px; }
#timerPresets .chip { padding:8px 4px; font-size:12px; }
#focusPresets { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); margin:0 0 8px; gap:6px; }
#focusPresets .chip { padding:9px 4px; font-size:11px; border-radius:13px; }
.dial-stage { position:relative; width:min(100%,300px); aspect-ratio:1; margin:10px auto 12px; padding:8px; }
.instrument-face {
  position:relative; isolation:isolate; display:grid; place-items:center;
  width:100%; height:100%; aspect-ratio:1; padding:0; margin:0; border-radius:50%;
  border:7px solid transparent;
  background:radial-gradient(circle at 38% 25%,var(--panel-top),var(--dial) 63%) padding-box,conic-gradient(from 18deg,#343d40,#bac0bd 10%,#30383b 22%,#11191d 41%,#8c9290 61%,#313a3d 76%,#cccebf 87%,#343d40) border-box;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.42),inset 0 0 0 4px rgba(0,0,0,.5),inset 0 0 18px rgba(0,0,0,.48),0 0 0 1px rgba(0,0,0,.8),0 0 0 2px var(--dial-edge),0 9px 17px var(--shadow);
}
.instrument-face::before { content:""; position:absolute; pointer-events:none; inset:6px; border:1px solid var(--glass-border); border-radius:50%; box-shadow:inset 0 1px 0 var(--glass-shine),0 0 0 3px rgba(0,0,0,.18); z-index:0; }
.instrument-face::after { content:""; position:absolute; pointer-events:none; inset:10px; border-radius:50%; background:linear-gradient(135deg,rgba(255,255,255,.07),transparent 43% 68%,rgba(255,185,71,.04)); z-index:0; }
.instrument-ticks, .swwrap svg.instrument-ticks { position:absolute; inset:0; width:100%; height:100%; transform:none; color:var(--muted); z-index:1; pointer-events:none; }
.instrument-ticks text { fill:var(--ink); font-size:13px; font-weight:500; }
.instrument-ticks line { stroke:var(--muted); }
.instrument-ticks .major { stroke:var(--brass); }
.dial-readout { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; pointer-events:none; }
.instrument-face .bigtime, .swwrap .bigtime { font-size:clamp(34px,12vw,59px); font-weight:600; letter-spacing:-.045em; line-height:1; }
.timer-instrument .dial-readout { width:60%; aspect-ratio:1; gap:9px; border-radius:50%; border:1px solid var(--line); background:linear-gradient(145deg,var(--dial-edge),var(--dial) 73%); box-shadow:inset 0 1px 0 var(--glass-shine),0 8px 16px var(--shadow); }
.timer-instrument .instrument-face .bigtime { font-size:clamp(29px,9.7vw,43px); }
.dial-caption { color:var(--muted); font-size:10px; text-align:center; letter-spacing:.18em; text-transform:uppercase; }
.dial-caption span + span { margin-left:18px; }
.instrument-screws { position:absolute; inset:0; pointer-events:none; }
.instrument-screws i { position:absolute; display:block; width:10px; height:10px; border-radius:50%; background:linear-gradient(135deg,#b3b5ac,#465054 45%,#101619); border:1px solid rgba(0,0,0,.8); box-shadow:0 1px 2px var(--shadow),inset 0 1px 0 rgba(255,255,255,.4); }
.instrument-screws i::after { content:""; position:absolute; left:2px; right:2px; top:4px; height:1px; background:#101619; transform:rotate(-35deg); }
.instrument-screws i:nth-child(1) { top:0; left:0; }
.instrument-screws i:nth-child(2) { top:0; right:0; }
.instrument-screws i:nth-child(3) { bottom:0; left:0; }
.instrument-screws i:nth-child(4) { bottom:0; right:0; }
.timer-modes { margin:2px 0 13px; }
.timer-instrument > input, .timer-instrument > .btn { width:100%; margin-top:9px; }
.timer-instrument .field-caption { margin-top:7px; margin-bottom:3px; }
.timer-instrument > .form { margin-top:12px; }
.timer-instrument .form input, .timer-instrument .form .btn { flex-basis:100%; }
.swwrap { width:100%; height:100%; max-width:none; }
.swwrap > svg:not(.instrument-ticks) { z-index:1; inset:2px; width:calc(100% - 4px); height:calc(100% - 4px); }
.swwrap .t { stroke:var(--line); stroke-width:1.7; }
.swwrap .p { stroke-width:2.1; filter:drop-shadow(0 0 2px rgba(255,170,48,.5)); }
#swTime { font-size:clamp(32px,10.6vw,52px); }
.controls { margin-top:15px; gap:8px; flex-wrap:nowrap; }
.controls .btn { flex:1; min-width:0; padding:12px 9px; }
#swLaps .row { box-shadow:inset 0 1px 0 var(--glass-shine),0 5px 13px var(--shadow); }
#p-alarm > .card { padding:19px 15px; }
#alarmDraft .bigtime { font-size:clamp(55px,19vw,85px); text-align:left; margin:6px 0; }
#p-alarm .edit-hint { text-align:left; }
#p-alarm .form input, #p-alarm .form .btn { flex-basis:100%; }
.wake { margin-top:14px; text-align:left; }
.setrow { padding:13px 2px; border-color:var(--line); font-size:13px; }
.setrow small { font-size:11px; line-height:1.4; }
.wake .setrow { gap:10px; }
.pro { background:linear-gradient(145deg,#ffce76,#ffa52e); color:var(--warm-ink); font-size:9px; padding:3px 7px; }
.tabs {
  width:calc(100% - 24px); max-width:480px; bottom:max(10px,env(safe-area-inset-bottom));
  padding:5px; border-radius:25px; background:linear-gradient(130deg,var(--panel-top),var(--panel-bottom));
  border:1px solid var(--glass-border); box-shadow:inset 0 1px 0 var(--glass-shine),inset 0 -1px 0 var(--line),0 8px 24px var(--shadow);
  backdrop-filter:blur(20px) saturate(120%); -webkit-backdrop-filter:blur(20px) saturate(120%);
}
.tab { min-height:54px; padding:7px 0 6px; font-size:9px; gap:5px; letter-spacing:0; }
.tab svg { width:21px; height:21px; stroke-width:1.7; }
.tab[aria-selected="true"] { color:var(--brass); }
.tab[aria-selected="true"] svg { transform:translateY(-1px); filter:drop-shadow(0 0 5px rgba(255,183,63,.4)); }
.capsule { top:5px; bottom:5px; border-radius:20px; background:linear-gradient(160deg,rgba(255,200,119,.18),var(--surface-soft)); border:1px solid rgba(255,194,106,.19); box-shadow:inset 0 1px 0 rgba(255,228,188,.2),0 0 17px rgba(255,163,44,.1); backdrop-filter:none; -webkit-backdrop-filter:none; }
.overlay { background:rgba(3,7,9,.68); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); }
.sheet { background:linear-gradient(145deg,var(--panel-top),var(--surface) 40%,var(--panel-bottom)); border-radius:27px 27px 0 0; padding:15px 18px max(20px,env(safe-area-inset-bottom)); border:1px solid var(--glass-border); box-shadow:inset 0 1px 0 var(--glass-shine),0 -12px 50px var(--shadow); }
.sheet h2 { font-size:18px; letter-spacing:-.02em; margin-bottom:13px; }
.sheet label { margin-top:14px; color:var(--muted); font-size:12px; }
.settings-heading { padding:1px 0 3px; text-align:center; }
.settings-heading p { margin:5px 0; color:var(--muted); font-size:12px; }
.city-results { display:grid; gap:7px; margin-top:12px; }
.city-result { display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; min-height:65px; padding:11px 13px; font:inherit; text-align:left; color:var(--ink); border-radius:15px; border:1px solid var(--line); background:linear-gradient(145deg,var(--panel-top),var(--panel-bottom)); box-shadow:inset 0 1px 0 var(--glass-shine); cursor:pointer; }
.city-result b { display:block; font-size:14px; font-weight:500; }
.city-result small { display:block; color:var(--muted); font-size:11px; margin-top:4px; }
.city-result-plus { display:grid; place-items:center; flex:none; width:34px; height:34px; border-radius:50%; font-size:24px; color:var(--warm-ink); background:linear-gradient(145deg,#ffd078,#ffa52e); box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 3px 8px rgba(0,0,0,.18); }
.grab { width:36px; height:4px; background:var(--muted); opacity:.45; margin-bottom:15px; }
.readout { margin:5px 0 7px; }
.fld { min-height:64px; min-width:62px; }
.fld .num { font-size:45px; }
.fld small { font-size:9px; }
.fld.on { background:var(--surface-soft); box-shadow:inset 0 0 0 1px var(--brass); }
.sep { font-size:35px; }
.dials { width:min(300px,77vw,37vh); margin:12px auto; border-radius:50%; background:var(--dial); box-shadow:0 0 0 1px var(--glass-border),0 0 0 5px var(--surface),0 5px 16px var(--shadow); }
#kdisc stop:first-child, #rbase stop:first-child { stop-color:var(--dial-edge); }
#kdisc stop:last-child, #rbase stop:last-child { stop-color:var(--dial); }
#rplate stop:first-child { stop-color:var(--dial-edge); }
#rplate stop:last-child { stop-color:var(--dial); }
#kval { fill:var(--ink); }
#kunit, #knums { fill:var(--muted); }
#rotary > circle[fill="#10142a"] { fill:var(--dial); }
#analogFace .analog { filter:drop-shadow(0 5px 12px var(--shadow)); }
#analogFace .analog text[fill="#eef2fb"] { fill:var(--ink); }
#analogFace .analog line[stroke="#f4f7ff"] { stroke:var(--ink); }
.dialtools { gap:8px; }
.alert { background:linear-gradient(140deg,var(--panel-top),var(--surface)); border-color:var(--glass-border); }
.toast { font-size:12px; background:var(--surface); color:var(--ink); bottom:calc(max(10px,env(safe-area-inset-bottom)) + 77px); }
.empty { color:var(--muted); font-size:13px; padding:22px 10px; }
.fine { font-size:10px; line-height:1.5; }
button, [role="button"], a, input, select { touch-action:manipulation; }
button:focus-visible, [role="button"]:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible { outline:2px solid var(--brass); outline-offset:4px; }
button:disabled { cursor:default; }
@media (hover:hover) { .btn:hover { filter:brightness(1.05); } .iconbtn:hover, .chip:hover, .pill:hover { border-color:var(--brass); } }
@media (max-width:359px) {
  .top { width:calc(100% - 20px); margin-top:8px; }
  .panel { padding-left:10px; padding-right:10px; }
  .tagline { font-size:10px; max-width:175px; }
  .card { padding:14px; }
  .instrument-card { padding:12px 9px; }
  .flip-inner { height:245px; }
  .bigtime { font-size:14.3vw; }
  .home-summary .mini { padding:13px 11px; }
  .world-card { gap:8px; padding-left:12px; }
  .world-dial { width:75px; height:75px; }
  .world-time { font-size:29px; }
  .world-copy .title { font-size:12px; }
  .controls .btn { font-size:12px; padding-left:5px; padding-right:5px; }
  .tab { font-size:8px; }
}
@media (max-height:700px) and (orientation:portrait) {
  .top { min-height:53px; margin-top:max(7px,env(safe-area-inset-top)); padding-top:5px; padding-bottom:5px; }
  .flip-inner { height:clamp(210px,36vh,265px); }
  .home-summary .mini { min-height:110px; }
  .section-heading { margin-top:3px; margin-bottom:11px; }
  .dial-stage { max-width:285px; }
}
@media (min-width:700px) and (orientation:portrait) {
  .flip-inner { height:420px; }
  .home-summary .mini { min-height:145px; }
  .card { padding:23px; }
  .world-card { min-height:145px; }
  .world-dial { width:110px; height:110px; }
  .world-time { font-size:38px; }
  .dial-stage { width:358px; }
}
@media (orientation:landscape) and (max-height:600px) {
  .top { max-width:none; width:calc(100% - 28px); min-height:48px; margin-top:max(6px,env(safe-area-inset-top)); margin-bottom:3px; padding:3px 8px; border-radius:17px; }
  .logo { width:32px; height:32px; }
  .brand { font-size:16px; }
  .tagline { font-size:10px; }
  #openSettings { min-height:40px; }
  .panel { max-width:950px; padding-top:7px; padding-bottom:83px; }
  .tabs { bottom:max(6px,env(safe-area-inset-bottom)); padding:4px; max-width:460px; border-radius:21px; }
  .tab { min-height:45px; padding:4px 0; gap:2px; }
  .tab svg { width:18px; height:18px; }
  .capsule { top:4px; bottom:4px; }
  .section-heading { margin:3px 2px 10px; }
  #p-clock { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); column-gap:17px; align-content:start; }
  #p-clock > .section-heading { grid-column:1 / -1; }
  #p-clock .flipper { grid-row:2 / 4; margin:0; }
  .flip-inner { height:225px; }
  .face { padding:8px 0; }
  .bigtime { font-size:clamp(44px,7.3vw,72px); }
  .sub { font-size:12px; }
  .clock-greeting { margin-bottom:10px; }
  .home-summary .mini { min-height:105px; padding:11px; }
  .summary-icon { margin-bottom:5px; }
  #p-clock > .card { margin-top:9px !important; }
  .instrument-card { position:relative; min-height:260px; padding:12px 14px 12px 290px; }
  .instrument-card > .dial-stage { position:absolute; top:6px; left:8px; width:260px; height:260px; margin:0; }
  .instrument-card > #timerPresets { margin-top:5px; }
  .instrument-card .dial-stage .bigtime { font-size:43px; }
  #swTime { font-size:38px; }
  #p-stop .instrument-card { display:flex; flex-direction:column; justify-content:center; }
  #p-stop .controls { flex-wrap:wrap; }
  #p-stop .controls .btn { flex:1 1 100%; }
  #p-alarm > .card { padding:15px; }
  #alarmDraft .bigtime { font-size:58px; }
  .sheet { max-height:98vh; }
  .dials { width:min(220px,50vh); }
  #dialSheet .dials { width:min(190px,48vh); }
}
@media (prefers-reduced-motion:reduce) {
  *, *::before, *::after { animation:none !important; transition:none !important; scroll-behavior:auto !important; }
}
`;
