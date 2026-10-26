// Checks the Pro flows with a stub of the Android bridge. Usage: BASE=http://127.0.0.1:8787 OUT=/tmp node scripts/pro-check.cjs
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const OUT = process.env.OUT || '/tmp';
const results = [];
const check = (name, ok, extra) => results.push({ name, ok: !!ok, extra });
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => {
    window.__synced = []; window.__bought = []; window.__pro = false;
    window.ReuzNative = {
      sync: (j) => { window.__synced.push(JSON.parse(j)); }, canNotify: () => true, requestNotifications() {},
      setHome(tz, f) { window.__home = [tz, f]; }, getHome: () => '', haptic() {},
      isPro: () => window.__pro,
      products: () => JSON.stringify([
        { sku: 'reuz_pro_yearly', title: 'Yearly', note: 'Best value', price: '₹499.00' },
        { sku: 'reuz_pro_monthly', title: 'Monthly', note: 'Billed monthly', price: '₹59.00' },
        { sku: 'reuz_pro_lifetime', title: 'Lifetime', note: 'Once', price: '₹1,499.00' }]),
      buy(sku) { window.__bought.push(sku); }, restore() {}, manageSubscriptions() {},
    };
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(e.message));
  await pg.goto(BASE + '/', { waitUntil: 'load' });
  await pg.waitForTimeout(600);

  check('home zone comes from the device in the app', await pg.evaluate(() => !!window.__home));
  await pg.click('[data-tab="alarm"]'); await pg.waitForTimeout(700);
  check('wake options visible in the app', await pg.evaluate(() => !document.getElementById('wakeBox').hidden));
  await pg.screenshot({ path: OUT + '/p-alarm.png' });

  await pg.click('[data-ch="dial"]'); await pg.waitForTimeout(700);
  check('free user is sent to the paywall', await pg.evaluate(() => document.getElementById('paySheet').classList.contains('open')));
  check('challenge stays off without Pro', await pg.evaluate(() => document.querySelector('[data-ch="off"]').getAttribute('aria-pressed') === 'true'));
  check('prices listed', (await pg.locator('.plan').count()) === 3);
  await pg.screenshot({ path: OUT + '/p-paywall.png' });
  await pg.click('[data-sku="reuz_pro_yearly"]');
  check('buy is passed to Google Play', await pg.evaluate(() => window.__bought[0] === 'reuz_pro_yearly'));

  await pg.evaluate(() => window.reuzPro(true)); await pg.waitForTimeout(1300);
  check('paywall closes once Pro is on', await pg.evaluate(() => !document.getElementById('paySheet').classList.contains('open')));
  await pg.click('[data-ch="dial"]'); await pg.click('[data-win="20"]'); await pg.waitForTimeout(300);
  await pg.click('#alarmAdd'); await pg.waitForTimeout(500);
  const last = await pg.evaluate(() => window.__synced[window.__synced.length - 1]);
  const alarm = last.find(x => x.id.startsWith('alarm-'));
  check('alarm carries challenge and window', alarm && alarm.challenge === 'dial' && alarm.window === 20 && alarm.gentle === true, alarm);
  await pg.screenshot({ path: OUT + '/p-alarm2.png' });

  await pg.evaluate(() => window.reuzPro(false)); await pg.waitForTimeout(200);
  const lastFree = await pg.evaluate(() => window.__synced[window.__synced.length - 1]);
  const a2 = lastFree.find(x => x.id.startsWith('alarm-'));
  check('without Pro the phone gets no challenge', a2 && a2.challenge === 'off' && a2.window === 0, a2);
  await pg.evaluate(() => window.reuzPro(true));

  await pg.click('[data-tab="timer"]'); await pg.waitForTimeout(700);
  check('focus presets visible', (await pg.locator('#focusPresets .chip').count()) === 3);
  await pg.click('#focusPresets .chip >> nth=0'); await pg.waitForTimeout(500);
  const timers = await pg.evaluate(() => window.__synced[window.__synced.length - 1].filter(x => x.id.startsWith('timer-')));
  check('focus starts two timers, break after focus', timers.length === 2 && timers[1].at - timers[0].at === 5 * 60000, timers);
  const rows = await pg.textContent('#timerList');
  check('break shows it starts after focus', /starts after focus/.test(rows), rows.slice(0, 120));
  await pg.screenshot({ path: OUT + '/p-focus.png' });

  await pg.click('#openSettings'); await pg.waitForTimeout(700);
  check('settings shows Pro state', /Active/.test(await pg.textContent('#proState')));
  await pg.screenshot({ path: OUT + '/p-settings.png' });
  check('no overflow', !(await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  check('no page errors', errors.length === 0, errors);
  await b.close();
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  ' + JSON.stringify(r.extra))));
  const failed = results.filter(r => !r.ok);
  console.log(failed.length ? failed.length + ' FAILED' : 'ALL PASSED');
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(2); });
