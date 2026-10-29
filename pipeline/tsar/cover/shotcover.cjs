const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:1080,height:1920}});
 const [,, qs, out]=process.argv; await pg.goto('http://localhost:8775/cover.html?'+qs); await pg.waitForFunction('window.ready'); await pg.waitForTimeout(400); await pg.screenshot({path:out}); await b.close(); })();
