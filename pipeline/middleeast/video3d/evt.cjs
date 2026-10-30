const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const tl = JSON.parse(fs.readFileSync('timeline.json'));
 const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
 const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } }); pg.on('pageerror', e => console.log('ERR', e.message)); await pg.goto('http://localhost:8774/index.html'); await pg.waitForFunction('window.ready', { timeout: 240000 });
 const shots = await pg.evaluate(`setup(${JSON.stringify(tl)})`); fs.writeFileSync('shots.json', JSON.stringify(shots));
 // run a few draws so the end-card press time is registered
 await pg.evaluate('render(59)'); fs.writeFileSync('events.json', JSON.stringify(await pg.evaluate('window.EVT'))); await b.close(); })();
