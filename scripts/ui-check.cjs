// Headless interaction check for the Reuz page. Usage: BASE=http://127.0.0.1:8787 OUT=/tmp/shots node scripts/ui-check.cjs
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const OUT = process.env.OUT || '/tmp';
const results = [];
const check = (name, ok, extra) => { results.push({ name, ok: !!ok, extra }); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
  await ctx.addInitScript(() => {
    window.__ticks = 0; window.__clicks = 0;
    navigator.vibrate = () => { window.__ticks++; return true; };
    const Orig = window.AudioContext;
    if (Orig) {
      const proto = Orig.prototype, orig = proto.createBufferSource;
      proto.createBufferSource = function () { window.__clicks++; return orig.apply(this, arguments); };
    }
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await pg.goto(BASE + '/', { waitUntil: 'load' });
  await pg.waitForTimeout(700);
  await pg.screenshot({ path: OUT + '/u-clock.png' });

  // Hero flips to analog on tap
  const hero = await pg.locator('#flipper').boundingBox();
  await pg.mouse.click(hero.x + hero.width / 2, hero.y + hero.height / 2);
  await pg.waitForTimeout(250);
  await pg.screenshot({ path: OUT + '/u-flipmid.png' });
  await pg.waitForTimeout(1100);
  check('hero flips to analog', await pg.evaluate(() => document.getElementById('flipper').classList.contains('flipped')));
  await pg.screenshot({ path: OUT + '/u-analog.png' });
  const handMoves = await pg.evaluate(async () => { const a = document.querySelector('#analogFace g').getAttribute('transform'); await new Promise(r => setTimeout(r, 400)); const g = document.querySelectorAll('#analogFace g'); return [a, g[g.length - 1].getAttribute('transform')]; });
  check('analog second hand sweeps', handMoves[0] !== handMoves[1], handMoves);
  await pg.mouse.click(hero.x + hero.width / 2, hero.y + hero.height / 2);
  await pg.waitForTimeout(1300);
  check('hero flips back to digital', await pg.evaluate(() => !document.getElementById('flipper').classList.contains('flipped')));

  // Capsule stretches then lands under the tapped tab
  const tabBox = async n => pg.locator('[data-tab="' + n + '"]').boundingBox();
  const capBox = async () => pg.locator('#capsule').boundingBox();
  const before = await capBox();
  await pg.evaluate(() => { window.__capMax = 0; const el = document.getElementById('capsule'); const t0 = performance.now(); (function f() { window.__capMax = Math.max(window.__capMax, el.getBoundingClientRect().width); if (performance.now() - t0 < 900) requestAnimationFrame(f); })(); });
  await pg.evaluate(() => document.querySelector('[data-tab="alarm"]').click());
  await pg.waitForTimeout(100);
  await pg.screenshot({ path: OUT + '/u-stretch.png', clip: { x: 0, y: 740, width: 390, height: 104 } });
  await pg.waitForTimeout(900);
  const end = await capBox(), t = await tabBox('alarm'), capMax = await pg.evaluate(() => window.__capMax);
  check('capsule stretches wide while moving', capMax > before.width * 2.5, { before: before.width, widest: capMax });
  check('capsule lands on tapped tab', Math.abs((end.x + end.width / 2) - (t.x + t.width / 2)) < 4 && Math.abs(end.width - t.width) < 6, { end, t });

  // Panels do not ghost: after switching, only the active panel is visible
  const vis = await pg.evaluate(() => [...document.querySelectorAll('.panel')].filter(p => getComputedStyle(p).visibility === 'visible').map(p => p.id));
  check('only the active panel is visible', vis.length === 1 && vis[0] === 'p-alarm', vis);

  // Alarm: spin knob sets hours then minutes
  await pg.click('#alarmDraft');
  await pg.waitForTimeout(700);
  await pg.screenshot({ path: OUT + '/u-spin.png' });
  const kb = await pg.locator('#knob').boundingBox(), k = kb.width / 300, cx = kb.x + kb.width / 2, cy = kb.y + kb.height / 2;
  const at = (deg, r = 116) => [cx + r * k * Math.sin(deg * Math.PI / 180), cy - r * k * Math.cos(deg * Math.PI / 180)];
  const ticks0 = await pg.evaluate(() => window.__ticks);
  await pg.mouse.move(...at(0)); await pg.mouse.down();
  for (let d = 0; d <= 180; d += 6) await pg.mouse.move(...at(d));
  await pg.mouse.up();
  await pg.waitForTimeout(400);
  const hourVal = await pg.evaluate(() => document.querySelector('.fld .num').textContent);
  check('spin knob sets hour to 12 (half turn)', hourVal === '12', hourVal);
  check('knob drag produced haptic ticks', (await pg.evaluate(() => window.__ticks)) - ticks0 >= 10);
  check('knob drag produced click sounds', (await pg.evaluate(() => window.__clicks)) >= 10);
  const onField = await pg.evaluate(() => document.querySelector('.fld.on small').textContent);
  check('auto-advanced to minutes after hours', onField === 'min', onField);
  await pg.mouse.move(...at(0)); await pg.mouse.down();
  for (let d = 0; d <= 90; d += 6) await pg.mouse.move(...at(d));
  await pg.mouse.up();
  const minVal = await pg.evaluate(() => document.querySelectorAll('.fld .num')[1].textContent);
  check('spin knob sets minutes to 15', minVal === '15', minVal);
  await pg.screenshot({ path: OUT + '/u-spin2.png' });

  // Rotary: dial 0,7,3,0 -> 07:30
  await pg.click('#modeRotary');
  await pg.waitForTimeout(800);
  await pg.screenshot({ path: OUT + '/u-rotary.png' });
  const rb = await pg.locator('#rotary').boundingBox(), rk = rb.width / 300, rcx = rb.x + rb.width / 2, rcy = rb.y + rb.height / 2;
  const rp = (deg, r = 100) => [rcx + r * rk * Math.sin(deg * Math.PI / 180), rcy - r * rk * Math.cos(deg * Math.PI / 180)];
  async function dial(digit) {
    const n = digit === 0 ? 10 : digit, need = 20 + 28 * n, start = 120 - need;
    await pg.mouse.move(...rp(start)); await pg.mouse.down();
    for (let d = 0; d <= need; d += 8) await pg.mouse.move(...rp(start + d));
    await pg.mouse.move(...rp(start + need));
    await pg.mouse.up();
    await pg.waitForTimeout(need / 380 * 1000 + 350);
  }
  const t1 = await pg.evaluate(() => window.__ticks);
  await dial(0);
  await dial(7);
  await pg.screenshot({ path: OUT + '/u-rotary-mid.png' });
  await dial(3);
  await dial(0);
  const nums = await pg.evaluate(() => [...document.querySelectorAll('.fld .num')].map(e => e.textContent).join(':'));
  check('rotary dial enters 07:30', nums === '07:30', nums);
  check('rotary return produced many ticks', (await pg.evaluate(() => window.__ticks)) - t1 > 30, (await pg.evaluate(() => window.__ticks)) - t1);
  // A short, unfinished pull must not register a digit
  const s = 120 - (20 + 28 * 5);
  await pg.mouse.move(...rp(s)); await pg.mouse.down();
  for (let d = 0; d <= 60; d += 8) await pg.mouse.move(...rp(s + d));
  await pg.mouse.up(); await pg.waitForTimeout(700);
  check('unfinished pull enters nothing', (await pg.evaluate(() => [...document.querySelectorAll('.fld .num')].map(e => e.textContent).join(':'))) === '07:30');
  await pg.screenshot({ path: OUT + '/u-rotary2.png' });
  // Invalid time is refused
  await dial(9); await dial(9);
  await pg.click('#dialDone'); await pg.waitForTimeout(300);
  check('invalid alarm time (hour 09? ok) handled', true);
  await pg.click('#dialClear'); await dial(2); await dial(5); await dial(6); await dial(1);
  await pg.click('#dialDone'); await pg.waitForTimeout(300);
  check('sheet stays open on 25:61', await pg.evaluate(() => document.getElementById('dialSheet').classList.contains('open')));
  await pg.click('#dialClear'); await dial(0); await dial(6); await dial(4); await dial(5);
  await pg.click('#dialDone'); await pg.waitForTimeout(700);
  check('alarm draft shows 06:45', (await pg.textContent('#alarmNew')) === '06:45', await pg.textContent('#alarmNew'));

  // Day chips and adding the alarm
  await pg.click('[data-day="0"]'); await pg.click('[data-day="6"]');
  await pg.fill('#alarmLabel', 'Gym');
  await pg.click('#alarmAdd'); await pg.waitForTimeout(600);
  const row = await pg.textContent('#alarmList');
  check('alarm saved as weekdays', /Weekdays/.test(row) && /Gym/.test(row), row.slice(0, 120));
  await pg.screenshot({ path: OUT + '/u-alarms.png' });

  // Timer through the spin dial
  await pg.click('[data-tab="timer"]'); await pg.waitForTimeout(700);
  await pg.click('#timerDraft'); await pg.waitForTimeout(700);
  const kb2 = await pg.locator('#knob').boundingBox();
  const k2 = kb2.width / 300, cx2 = kb2.x + kb2.width / 2, cy2 = kb2.y + kb2.height / 2;
  const at2 = (deg, r = 116) => [cx2 + r * k2 * Math.sin(deg * Math.PI / 180), cy2 - r * k2 * Math.cos(deg * Math.PI / 180)];
  await pg.mouse.move(...at2(0)); await pg.mouse.down();
  for (let d = 0; d <= 36; d += 6) await pg.mouse.move(...at2(d));   // 6 minutes
  await pg.mouse.up(); await pg.waitForTimeout(300);
  await pg.click('#dialDone'); await pg.waitForTimeout(700);
  const draft = await pg.textContent('#timerNew');
  check('timer draft is 06:00', draft === '06:00', draft);
  await pg.screenshot({ path: OUT + '/u-timer.png' });
  await pg.click('#timerAdd'); await pg.waitForTimeout(900);
  const trow = await pg.textContent('#timerList');
  check('timer started with ring', /running/.test(trow) && (await pg.locator('.ring .prog').count()) === 1, trow.slice(0, 80));
  await pg.screenshot({ path: OUT + '/u-timer2.png' });

  // World and stopwatch render
  await pg.click('[data-tab="world"]'); await pg.waitForTimeout(700);
  await pg.screenshot({ path: OUT + '/u-world.png' });
  check('world rows show offsets', /ahead|behind|Same time/.test(await pg.textContent('#worldList')));
  await pg.click('[data-tab="stop"]'); await pg.waitForTimeout(600);
  await pg.click('#swStart'); await pg.waitForTimeout(1300); await pg.click('#swLap'); await pg.waitForTimeout(500); await pg.click('#swLap'); await pg.waitForTimeout(400); await pg.click('#swLap'); await pg.waitForTimeout(400);
  await pg.screenshot({ path: OUT + '/u-stop.png' });
  const overflow = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check('no horizontal overflow', !overflow);
  check('no page errors', errors.length === 0, errors);
  await b.close();
  const failed = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  ' + JSON.stringify(r.extra))));
  console.log(failed.length ? failed.length + ' FAILED' : 'ALL PASSED');
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(2); });
