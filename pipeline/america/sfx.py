import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter
import os; CEIL=float(os.environ.get("CEIL","0.62")); SR=48000; rng=np.random.default_rng(7)
TL=json.load(open('timeline_full.json')); words=TL['words']; D=TL['duration']; shots=json.load(open('video3d/shots.json')); pauses=TL['pauses']
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

# ---------- event list ----------
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
for i,s in enumerate(shots[1:],1):
    t0=s[1]; dur=s[2]-s[1]
    if t0>=W('Follow')-.1: continue
    if dur<1.3: add(S,t0-.08,whoosh(.22,i%2==0),.5); add(S,t0,hit(.4,.3),.5)
    else: add(S,t0-.18,whoosh(.4,i%3!=0),.55)
t10k=W('10,000'); tBec=W('Because'); tAnd1=W('and',1); tIn1=W('In',1); tIn2=W('In',2); tAnc=W('anchor'); tWhen=W('When'); tTr=W('troops'); tHrs=W('hours'); tThese=W('These'); tGl1=W('global',1); tTrade=W('trade'); tBut=W('But'); tEvery=W('Every'); tWere=W("We're"); tAm2=W('America',2); tIt2=W('It',2); tAround=W('around'); tTh1=W("That's",1); tTh2=W("That's",2); tFol=W('Follow'); tJets=W('jets')
# hook: hit + boom, jet taking off (afterburner roar swells)
add(S,0,hit(1.3),1.0); add(S,0.0,riser(.3),.4); add(S,.28,boom(.8,1.8),.8); add(S,0,jetroar(t10k,1.0),.85)
add(S,.4,engine(t10k-.4,45,.6),.5)
# pauses: riser into the word + hit on it (music dips handled below)
for p in pauses:
    d=p['t1']-p['t0']; add(S,p['t0']-.02,riser(d+.1,.7),.8); add(S,p['t1']-.02,hit(.8,.5),.8)
# 10,000 mi counter ticks + arc whoosh + pin drop
add(S,t10k-.02,pop(300,90,.25),1.0); add(S,t10k+.1,whoosh(.9,True),.7)
for k in range(20): add(S,t10k+k*(tBec-.3-t10k)/20,tick(.6,2200+k*60),.8)
# distance: low menace + ocean
add(S,tBec,sea(tAnd1-tBec,1.0),.8); add(S,W('distance')-.03,hit(1.2),1.0); add(S,W('distance')-.03,sine_sweep(.9,70,38)*env_exp(int(.9*SR),.4),.9)
add(S,W('enemy')-.05,hit(.9,.5),.9)
# bases erase it: 3 pins + arcs
for t_ in [W('bases',2)-.05,W('erase')-.05,W('it')-.05]:
    add(S,t_,pop(260,90,.22),1.1); add(S,t_+.2,hit(.5,.4),.7); add(S,t_+.05,whoosh(.4,True),.5)
add(S,W('erase')-.04,hit(1.0),.9)
# Europe: NATO stamp
add(S,W("NATO's")-.03,hit(1.1),.95); add(S,W('Europe')-.05,pop(500,1100,.1),.8)
# Japan / Korea pins
for d in [0,.08,.16,.2,.5,.56,.7]:
    t_=W('Japan')+d; add(S,t_,pop(260,90,.2),.8); add(S,t_+.18,hit(.35,.3),.6)
add(S,W('Japan')+.15,pop(700,1400,.1),.8); add(S,W('South Korea')+.1,pop(700,1400,.1),.8)
# anchor: chain rattle, splash, GRIP stamp
ta=tAnc+.05; tf=np.sqrt(2*5.1/9.81)
add(S,ta,crackle(tf,1.4)*np.linspace(.4,1.4,int(tf*SR)).astype(np.float32)[:int(tf*SR)],.9)
for k in range(5): add(S,ta+k*.13,clink(.8),.6)
add(S,ta+tf-.02,splash(1.2),1.0); add(S,ta+tf,boom(.7,1.2),.6)
add(S,W('grip')-.03,hit(1.1),.95)
# crisis siren + stamp
add(S,tWhen,siren(tTr-tWhen+.2,.8),.7); add(S,W('crisis')-.05,hit(1.2),1.0)
# troops: rotor slap + turbine whine; jets fly-by
add(S,tTr-.2,rotor(2.0,1.2)*np.linspace(.4,1,int(2.0*SR)).astype(np.float32),.8); add(S,tTr-.2,hp(noise(int(2.0*SR)),3000)*.05,.5)
add(S,tJets-.1,jetflyby(1.6),.95)
add(S,tJets-.02,hit(.7,.4),.7)
# supplies: truck diesel + gear whine, plane hum
tsup=W('supplies'); add(S,tsup-.5,engine(1.9,38,.9),.85); add(S,tsup-.5,lp(noise(int(1.9*SR)),600)*.25,.6); add(S,tsup-.3,engine(1.8,70,.5),.4)
# hours / weeks: clock ticks, calendar flip, red X
t0c=tHrs
for k in range(int(1.0/.07)): add(S,t0c+k*.07,tick(.7,2600+(k%2)*600),.8)
add(S,t0c-.02,pop(700,1300,.12),.9)
tw=W('weeks')-.1; add(S,tw,whoosh(.25,True),.6); add(S,tw+.15,hit(.6,.4),.8); add(S,tw+.45,hit(.9,.5),1.0); add(S,tw+.4,sine_sweep(.2,900,200),.4)
add(S,tHrs,jetflyby(1.7),.8)
# allies / shipping: ship horns + sea
add(S,tThese,sea(tTrade-tThese,.9),.6)
add(S,W('allies')-.1,horn(1.1,118),.7); add(S,W('shipping')-.1,horn(1.3,92),.7); add(S,tThese,engine(tTrade-tThese,38,.5),.45)
# trade lanes: flowing pings
for k in range(14): add(S,tTrade+k*.1,pop(900+30*k,1300+30*k,.08),.35)
add(S,tTrade-.02,whoosh(.5,True),.6); add(S,tTrade+.45,hit(.5,.4),.6)
# look closer: zoom sweep + sparkle
add(S,tBut+.0,riser(tEvery-tBut-.1,.8),.6); add(S,tBut+.05,chime(1320,1.0),.5); add(S,tEvery-.04,hit(.7,.4),.8)
# every base: pins pop; rivals: red arcs, envelopes
for i in range(11): add(S,tEvery+i*.05,pop(300+i*20,100,.15),.5)
tm=W('message')+.05
for i in range(6): add(S,tm+i*.05,whoosh(.5,True),.45); add(S,tm+.35+i*.12,pop(1000,600,.07),.35)
add(S,W('message'),hit(.8,.5),.8); add(S,W('rivals')-.3,chime(660,1.0),.6); add(S,W('rivals')-.28,sine_sweep(.4,90,60)*env_exp(int(.4*SR),.2),.7)
# we're already here
add(S,tWere+.05,hit(1.2),1.0); add(S,tWere+.05,boom(.8,1.6),.8); add(S,W('already')-.04,hit(.7,.4),.8)
# borders: US ring + shield clang
add(S,tAm2,pop(500,900,.12),.7); add(S,W('defend')-.02,clink(1.0),.9); add(S,W('defend')-.02,sine_sweep(.3,300,120),.4); add(S,tAm2,wind(tIt2-tAm2,.8,300,1200),.4)
# parks its power: tarmac rumble
add(S,tIt2,hit(.7,.4),.7); add(S,tIt2,lp(noise(int((tAround-tIt2)*SR)),500)*.5,.5); add(S,W('parks')-.04,hit(.8,.5),.8)
# around the world: staggered pins
for k in range(40): add(S,tAround-.1+(k/40)*.95,pop(250+(k%7)*40,80,.12),.5)
add(S,tAround-.05,whoosh(.8,True),.7)
# not just defense: shield X
tn=W('not',2); add(S,tn+.2,hit(1.0,.6),.9); add(S,tTh1,clink(.8),.7)
# dominance: big boom + riser tail
td=W('dominance')-.03; add(S,td,hit(1.5,1.0),1.0); add(S,td,boom(1.6,3.0),1.0); add(S,td,whoosh(.6,False),.8)
# end card: logo shine + follow tap
aR=W('redrawnstories')-.05
add(S,aR,whoosh(.5,True),.9); add(S,aR+.1,hit(1.1,.7),.9)
for k,f in enumerate([784,988,1175,1568]): add(S,aR+.25+k*.08,chime(f,1.4),.8)
tp=W('global',2)+.15
add(S,tp-.05,pop(500,300,.06),1.2); add(S,tp+.02,tick(1.0,1200),1.0); add(S,tp+.06,chime(1318,1.2),.9); add(S,tp+.2,chime(1760,1.5),.8)
# ---------- music: tension pulse ----------
t=np.arange(N)/SR
bpm=104; beat=60/bpm
mus=np.zeros(N,np.float32)
def saw(f,n): 
    ph=(np.cumsum(np.full(n,f))/SR)%1; return (2*ph-1).astype(np.float32)
drone=lp(saw(55,N)+.7*saw(55.4,N),260)*.5+np.sin(2*np.pi*55*t).astype(np.float32)*.6
prog=[(55,110,130.8),(43.65,87.3,110),(49,98,123.5),(55,110,130.8)]
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
