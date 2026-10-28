const { chromium } = require('playwright'); const fs = require('fs'); const { spawn } = require('child_process');
(async () => {
  const mode = process.argv[2]; const tl = JSON.parse(fs.readFileSync('timeline.json'));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('LOG', m.text()); }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('http://localhost:8774/index.html'); await pg.waitForFunction('window.ready', { timeout: 180000 });
  const shots = await pg.evaluate(`setup(${JSON.stringify(tl)})`); fs.writeFileSync('shots.json', JSON.stringify(shots)); console.log(shots.length, 'shots');
  const el = await pg.$('#out');
  if (mode === 'stills') {
    if (process.argv[4] === 'nocap') await pg.evaluate('window.NOCAP=true');
    for (const t of process.argv[3].split(',')) { await pg.evaluate(`render(${t})`); await el.screenshot({ path: `../stills/s_${('0' + parseFloat(t).toFixed(2)).slice(-5)}.jpg`, type: 'jpeg', quality: 85 }); }
  } else {
    const a = +process.argv[3], bb = +process.argv[4]; const out = `part_${String(a).padStart(5, '0')}.mp4`;
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = a; f < bb; f++) { await pg.evaluate(`render(${f / 30})`); const buf = await el.screenshot({ type: 'jpeg', quality: 93 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if ((f - a) % 60 === 0) console.log('frame', f, '/', bb, Math.round((Date.now() - t0) / 1000), 's'); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await b.close();
})();
