import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter
import os; CEIL=float(os.environ.get("CEIL","0.62")); SR=48000; rng=np.random.default_rng(7)
TL=json.load(open('timeline_full.json')); words=TL['words']; D=TL['duration']; shots=json.load(open('video3d/shots.json')); pauses=TL['pauses']; EVT=json.load(open('video3d/events.json'))
N=int(D*SR); mix_sfx=np.zeros(N,np.float32)
def W(w,n=1):
    k=0
    for x in words:
        if ''.join(c for c in x['w'] if c.isalnum() or c=="'").lower()==''.join(c for c in w if c.isalnum() or c=="'").lower():
            k+=1
            if k==n: return x['a']
    raise Exception(w)
def add(buf,t,x,g=1.0):
    i=int(t*SR); 
    if i<0:
        x=x[-i:]; i=0
    if i>=len(buf): return
    e=min(len(buf),i+len(x)); buf[i:e]+=g*x[:e-i]
def env_exp(n,tau): return np.exp(-np.arange(n)/SR/tau)
def noise(n): return rng.standard_normal(n).astype(np.float32)
def bp(x,lo,hi,o=2): return sosfilt(butter(o,[lo,hi],'bandpass',fs=SR,output='sos'),x).astype(np.float32)
def lp(x,f,o=2): return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x).astype(np.float32)
def hp(x,f,o=2): return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x).astype(np.float32)
def sweep_noise(dur,f0,f1,q=.5,env=None):
    n=int(dur*SR); x=noise(n); out=np.zeros(n,np.float32); segs=14
    for s in range(segs):
        a=int(n*s/segs); b=int(n*(s+1)/segs); u=(s+.5)/segs; fc=f0*(f1/f0)**u; out[a:b]=bp(x,max(40,fc*(1-q*.6)),min(SR*.45,fc*(1+q*.9)))[a:b]
    if env is None: env=np.sin(np.linspace(0,np.pi,n))**1.5
    return out*env.astype(np.float32)
def whoosh(dur=.45,up=True,g=1.0):
    x=sweep_noise(dur,300,5000,.7) if up else sweep_noise(dur,5000,300,.7); return x*g
def sine_sweep(dur,f0,f1,curve='exp'):
    n=int(dur*SR); t=np.arange(n)/SR; f=f0*(f1/f0)**(t/dur); ph=2*np.pi*np.cumsum(f)/SR; return np.sin(ph).astype(np.float32)
def hit(g=1.0,dur=.8):
    n=int(dur*SR); x=sine_sweep(dur,150,38)*env_exp(n,.22); x+=lp(noise(n),900)*env_exp(n,.07)*.9; x+=hp(noise(n),3000)*env_exp(n,.03)*.35
    return np.tanh(x*1.6)*.9*g
def boom(g=1.0,dur=2.8):
    n=int(dur*SR); x=sine_sweep(dur,90,24)*env_exp(n,.7)*1.2+lp(noise(n),500)*env_exp(n,.5)*1.2+lp(noise(n),2500)*env_exp(n,.12)*.6
    return np.tanh(x*1.4)*.95*g
def riser(dur,g=1.0):
    n=int(dur*SR); env=(np.linspace(0,1,n)**2.2).astype(np.float32); x=sweep_noise(dur,200,7000,.9,env)*1.4
    s=sine_sweep(dur,180,1800)*env*.25; return (x+s)*g
def pop(f0=500,f1=1100,dur=.12,g=1.0):
    n=int(dur*SR); return sine_sweep(dur,f0,f1)*env_exp(n,.04)*g
def tick(g=1.0,f=2500):
    n=int(.03*SR); return hp(noise(n),f)*env_exp(n,.006)*g
def chime(f=880,dur=1.2,g=1.0):
    n=int(dur*SR); t=np.arange(n)/SR; return sum(np.sin(2*np.pi*f*m*t)*a for m,a in [(1,1),(2.01,.5),(3.02,.25),(4.2,.12)]).astype(np.float32)*env_exp(n,.35)*g*.4
def wind(dur,g=1.0,lo=200,hi=900):
    n=int(dur*SR); x=noise(n); mod=(.6+.4*np.sin(2*np.pi*np.cumsum(.25+.15*np.sin(np.arange(n)/SR*.7))/SR)).astype(np.float32); return bp(x,lo,hi)*mod*g
def waterroar(dur,g=1.0):
    n=int(dur*SR); x=noise(n); return (bp(x,300,2500,1)*1.0+bp(noise(n),2500,7000)*.6)*g
def engine(dur,f=70,g=1.0,rate=1.0):
    n=int(dur*SR); t=np.arange(n)/SR; ph=2*np.pi*np.cumsum(f*(1+.04*np.sin(t*7)))/SR; x=(2*((ph/(2*np.pi))%1)-1).astype(np.float32); x=lp(x,400)*.5+lp(noise(n),300)*.4; return x*g
def rotor(dur,g=1.0):
    n=int(dur*SR); out=np.zeros(n,np.float32); per=int(SR/19); burst=lp(noise(int(.02*SR)),700)*env_exp(int(.02*SR),.006)
    for i in range(0,n-len(burst),per): out[i:i+len(burst)]+=burst*(1+.2*rng.random())
    return (out*3+lp(noise(n),200)*.15)*g
def crackle(dur,g=1.0):
    n=int(dur*SR); out=np.zeros(n,np.float32)
    for _ in range(int(dur*140)):
        i=rng.integers(0,n-300); out[i:i+300]+=hp(noise(300),2000)*env_exp(300,.0015)*rng.random()
    return out*g
def jetflyby(dur=1.6,g=1.0):
    n=int(dur*SR); t=np.linspace(0,1,n); f=lambda u:6000*(1-u)+500*u; x=noise(n); out=np.zeros(n,np.float32); segs=24
    for s in range(segs):
        a=int(n*s/segs); b=int(n*(s+1)/segs); fc=f((s+.5)/segs); out[a:b]=bp(x,fc*.5,fc*1.4)[a:b]
    env=np.exp(-((t-.45)/.28)**2); return out*env.astype(np.float32)*1.4*g+lp(noise(n),300)*env*.4*g
def duck_env(vo,win=.12):
    e=np.abs(vo); k=int(win*SR); e=np.convolve(e,np.ones(k)/k,'same'); e=e/ (np.percentile(e,95)+1e-9); return np.clip(e,0,1)


S=mix_sfx
extra=lambda n_,tau=.3: env_exp(n_,tau)
def siren(dur,g=1.0):
    n=int(dur*SR); t_=np.arange(n)/SR; f=820+170*np.sign(np.sin(2*np.pi*1.6*t_)); ph=2*np.pi*np.cumsum(f)/SR
    return (np.sign(np.sin(ph))*.35+np.sin(ph)*.6).astype(np.float32)*np.minimum(1,np.minimum(t_/.05,(dur-t_)/.2))*g
def horn(dur=1.1,f=118,g=1.0):
    n=int(dur*SR); t_=np.arange(n)/SR; x=sum(np.sin(2*np.pi*f*m*t_)*a for m,a in [(1,1),(2,.6),(3,.35),(1.5,.4)]).astype(np.float32)
    return lp(x,1200)*np.minimum(1,np.minimum(t_/.06,(dur-t_)/.3))*g*.7
def clink(g=1.0):
    n=int(.35*SR); t_=np.arange(n)/SR; return sum(np.sin(2*np.pi*f*t_)*a for f,a in [(1900,1),(3100,.6),(4700,.35)]).astype(np.float32)*env_exp(n,.07)*g*.5
def splash(g=1.0,dur=1.3):
    n=int(dur*SR); return (lp(noise(n),3500)*env_exp(n,.28)*1.0+hp(noise(n),2500)*env_exp(n,.12)*.5+sine_sweep(dur,180,60)*env_exp(n,.18)*.6)*g
def sea(dur,g=1.0):
    n=int(dur*SR); x=lp(noise(n),700); mod=(.6+.4*np.sin(2*np.pi*np.cumsum(.18+.05*np.sin(np.arange(n)/SR*.4))/SR)).astype(np.float32); return x*mod*g
def jetroar(dur,g=1.0,up=True):
    n=int(dur*SR); u=np.linspace(0,1,n)**1.3; x=lp(noise(n),2500)*(.3+.9*u)+engine(dur,95,.5)*(.4+u); return x.astype(np.float32)*np.minimum(1,np.linspace(0,1,n)*6)*g

shots=json.load(open('video3d/shots.json'))
def rumble(dur,g=1.0,f=120):
    n=int(dur*SR); return lp(noise(n),f)*g*(.7+.3*np.sin(2*np.pi*np.cumsum(.9+.3*np.sin(np.arange(n)/SR))/SR)).astype(np.float32)
def turbofan(dur,g=1.0,f0=500,f1=1900):
    n=int(dur*SR); u=np.linspace(0,1,n); f=f0+(f1-f0)*u**1.4; ph=2*np.pi*np.cumsum(f)/SR; whine=(np.sin(ph)*.5+np.sin(2*ph)*.2).astype(np.float32)*u**1.2
    return (whine*.5+lp(noise(n),1800)*(.15+.7*u**1.5)+engine(dur,70,.5)*(.3+.9*u))*g*np.minimum(1,np.linspace(0,1,n)*8).astype(np.float32)
def beep(f=1000,dur=.12,g=1.0):
    n=int(dur*SR); t_=np.arange(n)/SR; return (np.sin(2*np.pi*f*t_)*np.minimum(1,np.minimum(t_/.01,(dur-t_)/.02))*g).astype(np.float32)
def thud(g=1.0): n=int(.18*SR); return (sine_sweep(.18,110,45)*env_exp(n,.06)+lp(noise(n),400)*env_exp(n,.03)*.5)*g
def paper(g=1.0): n=int(.25*SR); return hp(noise(n),1800)*env_exp(n,.07)*g*.5
def impact(t,g=1.0,big=True):
    add(S,t-.02,hit(1.4*g,.9),1.0); add(S,t,boom(1.0*g,3.2 if big else 2.0),1.0); add(S,t+.05,crackle(1.6,1.2),.5); add(S,t,whoosh(.5,False),.7)
S=mix_sfx
cuts=[s[1] for s in shots[1:] if s[1]<EVT['follow']-.1]
for i,t0 in enumerate(cuts,1):
    add(S,t0-.17,whoosh(.36,i%3!=0),.55)
for t_ in EVT['pop']: add(S,t_-.02,pop(520,1150,.1),.7)
# --- opening: clock ticks + city ambience, footsteps, calm
add(S,0,rumble(EVT['stop'],.5,260),.5)
for k in range(5): add(S,.4+k*.5,tick(1.0,1800),.6)
for k in range(3): add(S,.3+k*.9,horn(.35,320+40*k,.5),.25)
tw0=W('Tuesday')
for k in range(int((EVT['stop']-tw0)/.46)): add(S,tw0+.1+k*.46,thud(.35),.6)
# the world stopped: everything cuts out under a sub drop
ts=EVT['stop']; add(S,ts-.04,hit(1.5,1.0),1.0); add(S,ts,boom(.9,2.4),.9); add(S,ts-.3,riser(.34,.8),.7)
# calendar slam
tc=W('September')-.02; add(S,tc,hit(1.3,.8),1.0); add(S,tc-.04,paper(1.0),.9); add(S,tc+.18,tick(1.0,1500),.7)
# 19 silhouettes: low drone + steps + stamp
t19=W('19')-.02; add(S,t19,hit(1.3,.8),1.0); add(S,t19-.5,rumble(2.0,.7,90),.5)
for k in range(8): add(S,t19+.1+k*.24,thud(.3),.5)
# four planes: engine spool, tyre rumble, liftoff
tt=EVT['takeoff']; add(S,W('took')-.15,turbofan(tt-W('took')+.5,1.2,380,1500),.95); add(S,W('took')-.1,rumble(tt-W('took')+.1,1.0,200),.7)
add(S,tt-.02,whoosh(.4,True),.5); add(S,tt+.05,jetflyby(2.2,1.1),.8); add(S,W('four')-.02,hit(1.2,.7),.95)
# coordinated attack arcs on the globe
for i in range(4): add(S,W('coordinated')+i*.16,whoosh(.45,True),.6); add(S,W('coordinated')+i*.16+.4,pop(900,500,.1),.5)
for t_ in [W('coordinated'),W('coordinated')+.15,W('attack')]: add(S,t_,pop(260,90,.22),1.0); add(S,t_+.2,hit(.5,.4),.7)
# flag: wind flutter + riser into the pause
tf0=W('against')+.2; add(S,tf0,wind(W('Two')-tf0+.6,1.2,300,1400),.7); add(S,tf0,bp(noise(int(1.2*SR)),700,2600)*.15,.5)
# plane 1 and 2: turbofan approach then impact + sustained fire crackle
h1,h2=EVT['hits'][0],EVT['hits'][1]
add(S,h1-1.0,turbofan(1.0,1.2,600,2200),.95); impact(h1,1.0); add(S,h2-.7,turbofan(.7,1.2,700,2400),.95); impact(h2,1.0)
add(S,h1+.3,crackle(EVT['hits'][4]-h1,.8),.5); add(S,h1,rumble(EVT['hits'][4]-h1+.6,.7,150),.35)
# distant sirens through the aftermath
add(S,h2+.8,siren(2.2,.7),.22); add(S,EVT['hits'][2]-.4,siren(1.6,.6),.18)
# Pentagon
h3=EVT['hits'][2]; add(S,h3-.8,turbofan(.8,1.3,700,2600),.95); impact(h3,1.0)
# Pennsylvania: stressed high whine, dive, impact + dirt thud
h4=EVT['hits'][3]; add(S,h4-1.0,turbofan(1.0,1.2,900,3200),.95); add(S,h4-1.0,sine_sweep(1.0,700,2400)*np.linspace(0,1,SR)[:SR]*.25,.5); impact(h4,1.0)
# cabin: engine drone, trolley rumble + running steps
tcb=W('after'); add(S,tcb,rumble(2.0,.9,300),.45); add(S,tcb,engine(2.0,60,.5),.4)
for k in range(7): add(S,tcb+.2+k*.25,thud(.5),.7)
add(S,W('fought')-.05,hit(1.2,.8),1.0); add(S,tcb+.1,lp(noise(int(1.6*SR)),900)*.2,.5)
# collapse: sub rumble swell + dust whoosh
f2,f1=EVT['hits'][4],EVT['hits'][5]
add(S,f2-.05,hit(1.4,1.0),1.0); add(S,f2,rumble(2.2,1.6,110),1.0); add(S,f2,boom(1.4,3.0),.9); add(S,f1-.05,hit(1.4,1.0),.9); add(S,f1,boom(1.2,3.0),.8); add(S,f2,whoosh(1.4,False),.8)
# memorial: water, counter ticks that speed up, resolve chime at 2,977
tm0=W('2,977')-.02; tm1=W('people')-.1
add(S,tm0,sea(W('America')-tm0+.2,1.2),.7); add(S,tm0,hp(noise(int(3.8*SR)),2500)*.06,.5)
tk=tm0
while tk<tm1: add(S,tk,tick(.9,2200),.7); tk+=max(.03,.12*(1-(tk-tm0)/(tm1-tm0))+.03)
add(S,tm1,chime(523,2.0),.9); add(S,tm1+.08,chime(659,2.0),.8); add(S,tm1+.16,chime(784,2.4),.8)
# war on terror + Afghanistan: arc whoosh, rotors, jets
tw=W('war')-.05; add(S,tw,whoosh(.9,True),.8); add(S,tw+.05,hit(1.2,.8),1.0); add(S,tw+.3,jetflyby(1.4,.8),.6)
ta0=EVT['afg']; add(S,ta0,rotor(2.0,1.3)*np.linspace(.5,1,int(2.0*SR)).astype(np.float32),.9); add(S,ta0,hp(noise(int(2.0*SR)),3000)*.04,.5); add(S,ta0+.9,jetflyby(1.6,1.2),.95); add(S,ta0+.9,hit(.8,.5),.6); add(S,ta0+1.0,jetflyby(1.5,1.1),.8); add(S,ta0,wind(2.0,.8,200,900),.4)
# security checkpoint: PA chime, belt hum, detector beeps, murmur
tk0=EVT['chk']; add(S,tk0,chime(880,1.0),.5); add(S,tk0+.45,chime(660,1.2),.5); add(S,tk0,engine(1.8,120,.4),.3); add(S,tk0,bp(noise(int(1.8*SR)),300,1400)*.1,.5)
add(S,W('security')-.02,hit(.9,.5),.9); add(S,tk0+.9,beep(1000,.12),.6); add(S,tk0+1.05,beep(1000,.12),.6); add(S,W('changed')-.02,hit(.9,.5),.8)
# airports across the world: pings spread by longitude
AP=[-73.78,-.46,2.55,8.57,55.36,77.1,72.87,103.99,139.78,116.6,151.18,-46.47,28.25,-118.4,-79.63,-99.07,31.4,28.74,-3.56,113.92,126.44,36.93,3.32,-70.79,37.41,144.84,100.75,46.7]
tair=W('across')-.04
for lo in AP: add(S,tair+1.5*min(1,max(0,(lo+62)/174))-.1,pop(900+int((lo+120)*3),1500,.1),.5)
add(S,tair,whoosh(.9,True),.7)
# one morning / never the same: wind + tribute swell
t1=W('One',2)-.02; add(S,t1,wind(2.2,1.0,150,700),.45); add(S,t1,hit(.9,.6),.8)
tnv=W('lost',2); add(S,tnv+.2,riser(1.6,.9),.7)
for k,f in enumerate([392,494,587,784]): add(S,tnv+1.7+k*.1,chime(f,2.2),.55)
# never forget
tn=W('Never',2)-.02; add(S,tn,hit(1.5,1.0),1.0); add(S,tn,boom(1.0,2.8),.8); add(S,tn,whoosh(.6,False),.6)
# end card
aR=EVT['redrawn']; add(S,aR,whoosh(.5,True),.9); add(S,aR+.1,hit(1.1,.7),.9)
for k,f in enumerate([784,988,1175,1568]): add(S,aR+.25+k*.08,chime(f,1.4),.8)
tp=EVT['press']; add(S,tp-.05,pop(500,300,.06),1.2); add(S,tp+.02,tick(1.0,1200),1.0); add(S,tp+.06,chime(1318,1.2),.9); add(S,tp+.2,chime(1760,1.5),.8)
# pauses: riser into the word + hit on it
for p in pauses:
    d=p['t1']-p['t0']; add(S,p['t0']-.02,riser(d+.1,.7),.8); add(S,p['t1']-.02,hit(.8,.5),.8)
# ---------- music: tension pulse ----------
t=np.arange(N)/SR
bpm=104; beat=60/bpm
mus=np.zeros(N,np.float32)
def saw(f,n): 
    ph=(np.cumsum(np.full(n,f))/SR)%1; return (2*ph-1).astype(np.float32)
drone=lp(saw(55,N)+.7*saw(55.4,N),260)*.5+np.sin(2*np.pi*55*t).astype(np.float32)*.6
prog=[(55,110,130.8),(51.9,103.8,123.5),(46.25,92.5,110),(49,98,116.5)]
pad=np.zeros(N,np.float32)
seglen=int(8*beat*SR)
for i in range(0,N,seglen):
    f=prog[(i//seglen)%4]; n=min(seglen,N-i)
    chord=sum(lp(saw(ff,n)+saw(ff*1.007,n),1400) for ff in f[1:])*.15
    pad[i:i+n]=chord*np.sin(np.linspace(0,np.pi,n))**.6
mus+=drone*.55+pad*.8
# heartbeat/kick pulse each beat, 16th hats
kick=sine_sweep(.22,130,42)*env_exp(int(.22*SR),.09)
inten=np.clip(.35+t/D*.9,0,1.2)
for b in range(int(D/beat)):
    tb_=b*beat; g=.55*inten[min(N-1,int(tb_*SR))]; add(mus,tb_,kick,g)
    if b%2==1: add(mus,tb_+beat/2,tick(.5,5000)*1.0,.5*g)
    for q in (1,3): add(mus,tb_+q*beat/4,tick(.3,7000),.25*g)
# dip during pauses: music drops to near silence then pops back
dip=np.ones(N,np.float32)
for p in pauses:
    a=int((p['t0']+.02)*SR); b=int(p['t1']*SR); dip[a:b]=.12
    dip=np.minimum(dip,1)
dip=np.convolve(dip,np.ones(int(.03*SR))/int(.03*SR),'same')
# fade in/out
mus*=dip*np.clip(t/.5,0,1)*np.clip((D-t)/1.2,0,1)
vo,sr=sf.read('w/vo_final.wav',dtype='float32'); vo=vo[:N] if len(vo)>=N else np.pad(vo,(0,N-len(vo)))
dv=duck_env(vo); duck=1-.75*np.clip(dv*1.6,0,1); duck=np.convolve(duck,np.ones(int(.1*SR))/int(.1*SR),'same').astype(np.float32)
sfx_duck=1-.55*np.clip(dv*1.6,0,1); sfx_duck=np.convolve(sfx_duck,np.ones(int(.05*SR))/int(.05*SR),'same').astype(np.float32)
def comp(x,thr_db=-22,ratio=3.5,att=.004,rel=.15):
    lvl=np.abs(x).astype(np.float64); a=np.exp(-1/(att*SR)); r=np.exp(-1/(rel*SR)); env=np.zeros_like(lvl); e=0
    # fast envelope follower (vectorised with lfilter for release, approximate)
    env=lfilter([1-r],[1,-r],lvl)
    env=np.maximum(env,lvl*0)  # smoothed
    pk=np.maximum.reduce([lvl, env])
    db=20*np.log10(np.maximum(env*1.8,1e-6)); over=np.maximum(0,db-thr_db); gr=-over*(1-1/ratio); g=10**(gr/20)
    g=lfilter([1-a],[1,-a],g)
    return (x*g).astype(np.float32)
def limiter(x,thr=.88,look=.002,rel=.05):
    n=int(look*SR); from scipy.ndimage import maximum_filter1d
    env=maximum_filter1d(np.abs(x),size=2*n+1); g=np.minimum(1,thr/np.maximum(env,1e-9))
    g=np.minimum.accumulate(g[::-1])[::-1] if False else g
    k=int(rel*SR); g=np.convolve(np.pad(g,(k//2,k//2),mode='edge'),np.ones(k)/k,'valid')[:len(x)]
    g=np.minimum(g,np.minimum(1,thr/np.maximum(env,1e-9)))
    return (x*g).astype(np.float32)
sfxb=comp(S*.20*sfx_duck,-26,4.0)
vo_c=comp(vo,-30,2.5,.004,.2)*1.6
mix=vo_c+mus*.15*duck+sfxb*1.0
import pyloudnorm as _p
_m=_p.Meter(SR)
for _n,_x in (('vo',vo_c),("music",mus*.15*duck),('sfx',sfxb)): print('stem',_n,round(_m.integrated_loudness(_x.astype(np.float64)),1))
mix=comp(mix,-24,3.0,.003,.12)
mix=limiter(mix,.9)
sf.write('mix_pre.wav',mix,SR)
import pyloudnorm as pyln
m=pyln.Meter(SR); L=m.integrated_loudness(mix.astype(np.float64)); print('loudness before',L)
g=10**((-14-L)/20); out=limiter((mix*g).astype(np.float32),.78,.002,.04).astype(np.float64)
for _ in range(3):
    L2=m.integrated_loudness(out); print('iter',L2); out=out*10**((-14-L2)/20); out=limiter(out.astype(np.float32),.78,.002,.04).astype(np.float64)
from scipy.signal import resample_poly
def tp_limit(x,thr=.85):
    x4=resample_poly(x,4,1).astype(np.float32)
    n=int(.0015*SR*4); from scipy.ndimage import maximum_filter1d
    env=maximum_filter1d(np.abs(x4),size=2*n+1); g=np.minimum(1,thr/np.maximum(env,1e-9)); k=int(.003*SR*4)
    g=np.convolve(np.pad(g,(k//2,k//2),mode='edge'),np.ones(k)/k,'valid')[:len(x4)]; g=np.minimum(g,np.minimum(1,thr/np.maximum(env,1e-9)))
    return resample_poly(x4*g,1,4).astype(np.float32)[:len(x)]
for it in range(5):
    out=tp_limit(out.astype(np.float32),CEIL).astype(np.float64); L2=m.integrated_loudness(out); print('tp-iter',it,L2,np.abs(out).max())
    if abs(L2+14)<.05: break
    out=out*10**((-14-L2)/20)
out=tp_limit(out.astype(np.float32),CEIL).astype(np.float64)
print('peak',np.max(np.abs(out)),'loud',m.integrated_loudness(out))
sf.write('mix_final.wav',out.astype(np.float32),SR); print('ok',D)
