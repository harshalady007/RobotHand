const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const tl = JSON.parse(fs.readFileSync('timeline.json'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('console', m => console.log('LOG', m.text())); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('http://localhost:8774/index.html'); await pg.waitForFunction('window.ready', { timeout: 240000 });
  await pg.evaluate(`setup(${JSON.stringify(tl)})`);
  console.log(JSON.stringify(await pg.evaluate(process.argv[2])));
  await b.close();
})();
