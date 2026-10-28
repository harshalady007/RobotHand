import asyncio, sys
from playwright.async_api import async_playwright
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1080,'height':1920})
    for k in ['osama']:
      for safe in ['','1']:
        await pg.goto(f'http://localhost:8773/cover.html?c={k}&safe={safe}'); await pg.wait_for_function('window.ready'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f'/home/claude/covers/cover_{k}{"_safe" if safe else ""}.png')
    await b.close()
asyncio.run(m())
