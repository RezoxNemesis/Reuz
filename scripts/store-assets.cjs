// Makes the Google Play screenshots, icon and feature graphic. Usage: BASE=http://127.0.0.1:8787 node scripts/store-assets.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const OUT = __dirname + '/../store';
const stub = (pro) => () => {
  window.ReuzNative = {
    sync() {}, canNotify: () => true, requestNotifications() {}, setHome() {}, haptic() {},
    getHome: () => JSON.stringify({ timezone: 'Asia/Kolkata', format: '12h' }),
    isPro: () => PRO, products: () => JSON.stringify([
      { sku: 'reuz_pro_yearly', title: 'Yearly', note: 'Best value, billed once a year', price: '₹499.00' },
      { sku: 'reuz_pro_monthly', title: 'Monthly', note: 'Billed every month', price: '₹59.00' },
      { sku: 'reuz_pro_lifetime', title: 'Lifetime', note: 'One payment, yours for good', price: '₹1,499.00' }]),
    buy() {}, restore() {}, manageSubscriptions() {},
  };
};
(async () => {
  const b = await chromium.launch();
  async function open(pro) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
    await ctx.addInitScript('var PRO=' + pro + ';(' + stub(pro).toString() + ')()');
    const pg = await ctx.newPage();
    await pg.goto(BASE + '/', { waitUntil: 'load' });
    await pg.waitForTimeout(900);
    return pg;
  }
  const shot = (pg, n) => pg.screenshot({ path: `${OUT}/screenshots/${n}.png` });
  let pg = await open(true);
  await shot(pg, '1-clock');
  await pg.click('#flipper'); await pg.waitForTimeout(1500); await shot(pg, '2-analog');
  await pg.click('#flipper'); await pg.waitForTimeout(1300);
  await pg.click('[data-tab="timer"]'); await pg.waitForTimeout(600);
  await pg.click('#timerDraft'); await pg.waitForTimeout(900); await shot(pg, '3-dial');
  await pg.click('#modeRotary'); await pg.waitForTimeout(900); await shot(pg, '4-rotary');
  await pg.click('#dialDone'); await pg.waitForTimeout(700);
  await pg.click('#focusPresets .chip >> nth=0'); await pg.waitForTimeout(700); await shot(pg, '6-focus');
  await pg.click('[data-tab="alarm"]'); await pg.waitForTimeout(700);
  await pg.click('[data-ch="dial"]'); await pg.click('[data-win="20"]'); await pg.waitForTimeout(300);
  await shot(pg, '5-wake');
  await pg.context().close();
  pg = await open(false);
  await pg.click('[data-tab="alarm"]'); await pg.waitForTimeout(700);
  await pg.click('[data-ch="dial"]'); await pg.waitForTimeout(900); await shot(pg, '7-pro');
  await pg.context().close();

  const svg = fs.readFileSync(OUT + '/logo.svg', 'utf8');
  const ictx = await b.newContext({ viewport: { width: 512, height: 512 } });
  const ip = await ictx.newPage();
  await ip.setContent('<body style="margin:0">' + svg.replace('width="108" height="108"', 'width="512" height="512"') + '</body>');
  await ip.screenshot({ path: OUT + '/icon-512.png' });
  await ictx.close();

  const fctx = await b.newContext({ viewport: { width: 1024, height: 500 } });
  const fp = await fctx.newPage();
  await fp.setContent(`<body style="margin:0;width:1024px;height:500px;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;background:radial-gradient(900px 500px at 15% 10%,#25346a 0%,#0b0d12 60%),#0b0d12;display:flex;align-items:center;padding:0 70px;box-sizing:border-box;gap:50px">
    <div style="width:300px;height:300px;flex:none;border-radius:68px;overflow:hidden">${svg.replace('width="108" height="108"', 'width="300" height="300"')}</div>
    <div><div style="font-size:92px;font-weight:700;letter-spacing:-2px;background:linear-gradient(120deg,#ffd98c,#ff9b45);-webkit-background-clip:text;color:transparent">Reuz</div>
    <div style="font-size:38px;font-weight:300;margin-top:6px">Wake up on purpose.</div>
    <div style="font-size:20px;color:#9aa6bd;margin-top:18px">Rotary alarms · smart wake · focus timers</div></div></body>`);
  await fp.screenshot({ path: OUT + '/feature-graphic.png' });
  await b.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
