import json, sys, subprocess, asyncio, time
from playwright.async_api import async_playwright
tl=json.load(open('/home/claude/osama3d/timeline.json'))
mode=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1080,'height':1920})
    pg.on('console',lambda m: print('LOG',m.text) if m.type in ('error','warning') else None); pg.on('pageerror',lambda e: print('ERR',e))
    await pg.goto('http://localhost:8774/index.html'); await pg.wait_for_function('window.ready',timeout=120000)
    shots=await pg.evaluate(f'setup({json.dumps(tl)})'); print(len(shots),'shots'); json.dump(shots,open('/home/claude/osama3d/shots.json','w'))
    el=await pg.query_selector('#out')
    if mode=='stills':
      ts=[float(x) for x in sys.argv[2].split(',')]
      for t in ts:
        await pg.evaluate(f'render({t})'); await el.screenshot(path=f'/home/claude/osama3d/stills/s_{t:05.2f}.jpg',type='jpeg',quality=85)
    elif mode=='ranges':
      fps=30
      for rg in sys.argv[2].split(','):
        a,bb=[int(x) for x in rg.split('-')]; bb+=1
        out=f'/home/claude/osama3d/fix_{a:05d}.mp4'
        ff=subprocess.Popen(['ffmpeg','-y','-v','error','-f','image2pipe','-framerate',str(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE)
        for f in range(a,bb):
          await pg.evaluate(f'render({f/fps})'); ff.stdin.write(await el.screenshot(type='jpeg',quality=93))
        ff.stdin.close(); ff.wait(); print('done',rg,flush=True)
    else:
      a,bb=int(sys.argv[2]),int(sys.argv[3]); fps=30
      out=f'/home/claude/osama3d/part_{a:05d}.mp4'
      ff=subprocess.Popen(['ffmpeg','-y','-v','error','-f','image2pipe','-framerate',str(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE)
      t0=time.time()
      for f in range(a,bb):
        await pg.evaluate(f'render({f/fps})'); ff.stdin.write(await el.screenshot(type='jpeg',quality=93))
        if (f-a)%60==0: print('frame',f,'/',bb, round(time.time()-t0),'s',flush=True)
      ff.stdin.close(); ff.wait()
    await b.close()
asyncio.run(main())
