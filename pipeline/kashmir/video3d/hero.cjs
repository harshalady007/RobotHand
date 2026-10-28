const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const tl = JSON.parse(fs.readFileSync('timeline.json'));
 const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
 const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } }); await pg.goto('http://localhost:8774/index.html'); await pg.waitForFunction('window.ready', { timeout: 180000 });
 await pg.evaluate(`setup(${JSON.stringify(tl)})`); await pg.evaluate('window.NOCAP=true'); const el = await pg.$('#out');
 for (const t of process.argv[2].split(',')) { await pg.evaluate(`render(${t})`); await el.screenshot({ path: `../cover/coverimg/hero_${t}.png` }); }
 await b.close(); })();
