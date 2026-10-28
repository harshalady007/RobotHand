import asyncio, json, sys
from playwright.async_api import async_playwright
jobs=[('osama3d',8774,[2.0,40.2,40.5,20.6])]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for proj,port,ts in jobs:
      pg=await b.new_page(viewport={'width':1080,'height':1920})
      await pg.goto(f'http://localhost:{port}/index.html'); await pg.wait_for_function('window.ready',timeout=120000)
      tl=json.load(open(f'/home/claude/{proj}/timeline.json'))
      await pg.evaluate(f'setup({json.dumps(tl)})'); await pg.evaluate('window.NOCAP=true')
      el=await pg.query_selector('#out')
      for t in ts:
        await pg.evaluate(f'render({t})'); await el.screenshot(path=f'/home/claude/covers/{proj}_{t:05.2f}.png')
      await pg.close()
    await b.close()
asyncio.run(main())
