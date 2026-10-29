const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const tl = JSON.parse(fs.readFileSync('timeline.json')); const list = JSON.parse(fs.readFileSync(process.argv[2]));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('LOG', m.text()); }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('http://localhost:8774/index.html'); await pg.waitForFunction('window.ready', { timeout: 240000 });
  await pg.evaluate(`setup(${JSON.stringify(tl)})`); await pg.evaluate('window.NOCAP=true'); if (process.argv[3] === 'hires') await pg.evaluate('hires(true)'); const el = await pg.$('#out');
  for (const [name, set, p, l, fov, t, fx, chs] of list) { await pg.evaluate(`dbg(${JSON.stringify(set)},${JSON.stringify(p)},${JSON.stringify(l)},${fov},${t},${JSON.stringify(fx || '')},${JSON.stringify(chs || '')})`); await el.screenshot({ path: `../stills/dbg_${name}.jpg`, type: 'jpeg', quality: 88 }); }
  await b.close();
})();
