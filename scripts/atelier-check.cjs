// User-flow and layout checks for the Reuz interface.
// Usage: node scripts/atelier-check.cjs
// Optional: BASE=http://127.0.0.1:8787 OUT=/tmp/reuz-ui CHROMIUM_PATH=/path/to/chromium
// Without BASE, serves PAGE_HTML and the clock/settings endpoints locally.
// Use --serve to keep only the fixture running for other UI checks.
const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');

function playwright() {
  try { return require('playwright'); }
  catch (error) {
    if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
    return require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
  }
}

async function fixture() {
  const [{ PAGE_HTML }, { normalizeSettings, formatClock }] = await Promise.all([
    import('../src/page.js'), import('../src/clock.js'),
  ]);
  let settings = { timezone: 'UTC', format: '24h' };
  const server = http.createServer(async (request, response) => {
    response.setHeader('cache-control', 'no-store');
    if (request.url === '/') {
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end(PAGE_HTML);
    } else if (request.url === '/api/settings') {
      if (request.method === 'POST') {
        let body = '';
        for await (const chunk of request) body += chunk;
        settings = normalizeSettings(JSON.parse(body));
      }
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(settings));
    } else if (request.url === '/api/clock') {
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(formatClock(new Date(), settings)));
    } else {
      response.statusCode = request.url === '/favicon.ico' ? 204 : 404;
      response.end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { base: 'http://127.0.0.1:' + server.address().port, close: () => new Promise(resolve => server.close(resolve)) };
}

const tabs = ['clock', 'world', 'timer', 'stop', 'alarm'];
const checks = [];
function pass(name) { checks.push(name); console.log('PASS ' + name); }

async function selectTab(page, tab) {
  await page.locator('[data-tab="' + tab + '"]').click();
  await page.waitForFunction(id => document.getElementById('p-' + id).classList.contains('active'), tab);
  // Let moving panels and the navigation capsule settle before measuring layout.
  await page.waitForTimeout(450);
}

async function noOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert.ok(dimensions.scroll <= dimensions.width + 1, label + ': horizontal overflow ' + JSON.stringify(dimensions));
  const active = await page.locator('.panel.active').evaluate(element => ({
    left: element.getBoundingClientRect().left,
    right: element.getBoundingClientRect().right,
  }));
  assert.ok(active.left >= -1 && active.right <= dimensions.width + 1, label + ': active panel extends beyond viewport');
  const clipped = await page.locator('.panel.active button, .panel.active input, .panel.active select, .panel.active .row, #tabs').evaluateAll(elements => elements.filter(element => {
    const box = element.getBoundingClientRect();
    return box.width && box.height && getComputedStyle(element).visibility === 'visible' && (box.left < -1 || box.right > innerWidth + 1);
  }).map(element => element.id || element.className));
  assert.deepEqual(clipped, [], label + ': clipped cards or controls');
}

async function layoutSweep(browser, base, viewport, out) {
  const name = viewport.width + 'x' + viewport.height;
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => /\d/.test(document.getElementById('time').textContent));
  for (const tab of tabs) {
    await selectTab(page, tab);
    assert.equal(await page.locator('[data-tab="' + tab + '"]').getAttribute('aria-selected'), 'true', name + ': selected tab');
    const visible = await page.locator('.panel').evaluateAll(elements => elements.filter(element => getComputedStyle(element).visibility === 'visible').map(element => element.id));
    assert.deepEqual(visible, ['p-' + tab], name + ': only selected panel is visible');
    await noOverflow(page, name + ' ' + tab);
    if (out) await page.screenshot({ path: path.join(out, name + '-' + tab + '.png'), fullPage: true });
  }
  // Sheets must remain usable when the display is short or narrow.
  await page.locator('#openSettings').click();
  await page.waitForFunction(() => document.getElementById('sheet').classList.contains('open'));
  await page.locator('#cancel').click();
  await page.waitForFunction(() => !document.getElementById('sheet').classList.contains('open'));
  await selectTab(page, 'world');
  await page.locator('#openCitySheet').click();
  await page.waitForFunction(() => document.getElementById('citySheet').classList.contains('open'));
  await page.locator('#cityCancel').click();
  await selectTab(page, 'timer');
  await page.locator('#timerDraft').click();
  await page.waitForFunction(() => document.getElementById('dialSheet').classList.contains('open'));
  await page.locator('#dialCancel').click();
  assert.deepEqual(errors, [], name + ': browser errors');
  await context.close();
  pass(name + ': all sections, settings, city/dial sheets and overflow');
}

async function userFlows(browser, base, out) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.grantPermissions(['notifications']);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => /\d/.test(document.getElementById('time').textContent));

  await page.locator('#flipper').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.getElementById('flipper').classList.contains('flipped'));
  assert.ok(await page.locator('#analogFace svg').count(), 'analog clock rendered');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.getElementById('flipper').classList.contains('flipped'));
  await page.locator('#homeAlarm').click();
  await page.waitForFunction(() => document.getElementById('p-alarm').classList.contains('active'));
  await selectTab(page, 'clock');
  await page.locator('#homeTimers').click();
  await page.waitForFunction(() => document.getElementById('p-timer').classList.contains('active'));
  pass('clock face keyboard control and summary navigation');

  await selectTab(page, 'world');
  const citiesBefore = await page.locator('#worldList [data-wdel]').count();
  await page.locator('#openCitySheet').click();
  await page.waitForFunction(() => document.getElementById('citySheet').classList.contains('open'));
  await page.locator('#worldCustom').fill('Africa/Nairobi');
  await page.locator('#worldAdd').click();
  await page.waitForFunction(() => !document.getElementById('citySheet').classList.contains('open'));
  assert.equal(await page.locator('#worldList [data-wdel]').count(), citiesBefore + 1, 'world city added');
  await page.locator('#worldSearch').fill('Nairobi');
  assert.equal(await page.locator('#worldList [data-wdel]:visible').count(), 1, 'city search filters results');
  await page.locator('#worldSearch').fill('');
  await page.getByRole('button', { name: 'Remove Africa/Nairobi', exact: true }).click();
  assert.equal(await page.locator('#worldList [data-wdel]').count(), citiesBefore, 'world city removed');
  pass('world city add, search and remove');

  await selectTab(page, 'timer');
  await page.locator('#timerSpin').click();
  await page.waitForFunction(() => document.getElementById('dialSheet').classList.contains('open'));
  assert.equal(await page.locator('#modeSpin').getAttribute('aria-pressed'), 'true', 'spin mode chosen');
  await page.locator('#dialCancel').click();
  await page.locator('#timerRotary').click();
  await page.waitForFunction(() => document.getElementById('dialSheet').classList.contains('open'));
  assert.equal(await page.locator('#modeRotary').getAttribute('aria-pressed'), 'true', 'rotary mode chosen');
  await page.locator('#dialCancel').click();
  await page.locator('#timerPresets').getByRole('button', { name: '1 min', exact: true }).click();
  await page.locator('#timerLabel').fill('Tea');
  await page.locator('#timerAdd').click();
  assert.match(await page.locator('#timerList').innerText(), /Tea[\s\S]*running/, 'timer starts');
  const runningTime = await page.locator('#timerList [data-remain]').innerText();
  await page.waitForFunction(previous => document.querySelector('#timerList [data-remain]').textContent !== previous, runningTime);
  await page.locator('#timerList [data-tstart]').click();
  assert.match(await page.locator('#timerList').innerText(), /paused/, 'timer pauses');
  const pausedTime = await page.locator('#timerList [data-remain]').innerText();
  await page.waitForTimeout(200);
  assert.equal(await page.locator('#timerList [data-remain]').innerText(), pausedTime, 'paused timer stays still');
  await page.locator('#timerList [data-tstart]').click();
  assert.match(await page.locator('#timerList').innerText(), /running/, 'timer resumes');
  await page.locator('#timerList [data-treset]').click();
  assert.equal(await page.locator('#timerList [data-remain]').innerText(), '01:00', 'timer resets');
  await page.locator('#timerList [data-tdel]').click();
  assert.equal(await page.locator('#timerList [data-tdel]').count(), 0, 'timer deletes');
  pass('timer dial choices, preset, start, pause, resume, reset and delete');

  await selectTab(page, 'stop');
  await page.locator('#swStart').click();
  await page.waitForFunction(() => document.getElementById('swTime').textContent !== '00:00.00');
  await page.waitForTimeout(180);
  await page.locator('#swLap').click();
  assert.match(await page.locator('#swLaps').innerText(), /Lap 1/, 'stopwatch records lap');
  await page.locator('#swStart').click();
  const stoppedTime = await page.locator('#swTime').innerText();
  await page.waitForTimeout(180);
  assert.equal(await page.locator('#swTime').innerText(), stoppedTime, 'stopwatch pauses');
  await page.locator('#swReset').click();
  assert.equal(await page.locator('#swTime').innerText(), '00:00.00', 'stopwatch resets');
  assert.doesNotMatch(await page.locator('#swLaps').innerText(), /Lap 1/, 'stopwatch clears laps');
  pass('stopwatch start, lap, pause and reset');

  await selectTab(page, 'alarm');
  await page.locator('#alarmDraft').click();
  await page.waitForFunction(() => document.getElementById('dialSheet').classList.contains('open'));
  await page.locator('#dialDone').click();
  await page.locator('[data-day="0"]').click();
  await page.locator('[data-day="6"]').click();
  await page.locator('#alarmLabel').fill('Morning walk');
  await page.locator('#alarmAdd').click();
  assert.match(await page.locator('#alarmList').innerText(), /Morning walk[\s\S]*Weekdays/, 'weekday alarm saves');
  await page.locator('#alarmList [data-atog]').click();
  assert.equal(await page.locator('#alarmList [data-atog]').getAttribute('aria-checked'), 'false', 'alarm toggles off');
  await page.locator('#alarmList [data-aedit]').click();
  await page.waitForFunction(() => document.getElementById('dialSheet').classList.contains('open'));
  await page.locator('#dialCancel').click();
  await page.locator('#alarmList [data-adel]').click();
  assert.equal(await page.locator('#alarmList [data-adel]').count(), 0, 'alarm deletes');
  pass('alarm dial, repeat days, save, toggle, edit and delete');

  await page.locator('#openSettings').click();
  await page.locator('#tzCustom').fill('Asia/Kolkata');
  await page.locator('[data-format="12h"]').click();
  await page.locator('[data-theme-choice="light"]').click();
  await page.locator('#save').click();
  await page.waitForFunction(() => !document.getElementById('sheet').classList.contains('open'));
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light', 'theme applies');
  await selectTab(page, 'clock');
  assert.match(await page.locator('#zone').innerText(), /Asia\/Kolkata/, 'settings apply timezone');
  assert.match(await page.locator('#time').innerText(), /am|pm/i, 'settings apply 12 hour clock');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light', 'theme applies after reload');
  await page.locator('#openSettings').click();
  assert.equal(await page.locator('[data-theme-choice="light"]').getAttribute('aria-pressed'), 'true', 'theme survives reload');
  await page.locator('[data-theme-choice="dark"]').click();
  await page.locator('#cancel').click();
  await noOverflow(page, 'settings saved');
  // A timer alert takes keyboard priority over an already open settings sheet.
  await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('reuz.v3'));
    stored.timers = [{ id: 'qa-alert', label: 'Focus finished', durationMs: 1500, remainingMs: 1500, endAt: Date.now() + 1500, state: 'running' }];
    localStorage.setItem('reuz.v3', JSON.stringify(stored));
  });
  await page.reload({ waitUntil: 'load' });
  await page.locator('#openSettings').click();
  await page.waitForFunction(() => document.getElementById('alert').classList.contains('open'));
  assert.equal(await page.evaluate(() => document.activeElement.id), 'alertDismiss', 'timer alert receives focus');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'alertDismiss', 'Tab stays in timer alert');
  await page.locator('#alertDismiss').click();
  await page.waitForFunction(() => document.getElementById('sheet').contains(document.activeElement));
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(() => document.getElementById('sheet').contains(document.activeElement)), 'focus returns to settings');
  await page.locator('#cancel').click();
  await selectTab(page, 'clock');
  pass('timer completion keeps alert and settings keyboard focus usable');
  if (out) await page.screenshot({ path: path.join(out, 'flows-complete.png'), fullPage: true });
  assert.deepEqual(errors, [], 'user flows: browser errors');
  await context.close();
  pass('timezone, clock format and persisted theme settings; no browser errors');
}

module.exports = { fixture };

if (require.main === module) (async () => {
  if (process.argv.includes('--serve')) {
    const local = await fixture();
    console.log('Fixture listening at ' + local.base);
    return;
  }
  let local, browser;
  try {
    if (!process.env.BASE) local = await fixture();
    const base = process.env.BASE || local.base;
    const out = process.env.OUT;
    if (out) await mkdir(out, { recursive: true });
    const { chromium } = playwright();
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
    for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await layoutSweep(browser, base, viewport, out);
    }
    await userFlows(browser, base, out);
    console.log('ALL PASSED (' + checks.length + ' groups)');
  } finally {
    if (browser) await browser.close();
    if (local) await local.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
