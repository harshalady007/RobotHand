import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter
SR=48000; rng=np.random.default_rng(7)
TL=json.load(open('timeline_full.json')); words=TL['words']; D=TL['duration']; shots=json.load(open('video3d/shots.json')); pauses=TL['pauses']
N=int(D*SR); mix_sfx=np.zeros(N,np.float32)
def W(w,n=1):
    k=0
    for x in words:
        if ''.join(c for c in x['w'] if c.isalnum() or c=="'").lower()==w.lower():
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
cuts=[s[1] for s in shots[1:]]
for i,s in enumerate(shots[1:],1):
    t0=s[1]; dur=s[2]-s[1]
    if t0>=W('Follow')-.1: continue
    if dur<.9: add(S,t0-.08,whoosh(.22,i%2==0),.5); add(S,t0,hit(.4,.3),.5)
    else: add(S,t0-.18,whoosh(.4,i%3!=0),.55)
# hook
add(S,0,hit(1.3),1.0); add(S,0.0,riser(.3),.4); add(S,.28,boom(.8,1.8),.9)
# stamps / big beats
big=[(W('Kashmir',1),1.0),(W('1947'),1.0),(W('war'),1.0),(W('1972'),.9),(W('Water'),1.0),(W('Location'),1.0),(W('three'),1.1),(W('AksaiChin'),.7),(W('identity'),.8),(W('Siachen'),.6)]
for t,g in big: add(S,t-.03,hit(g),.9)
for nm,g in [('1965',.8),('1971',.8),('1999',.8)]: pass
# pauses: riser into the word + hit on it, music dips handled later
for p in pauses:
    d=p['t1']-p['t0']; add(S,p['t0']-.02,riser(d+.1,.7),.8); add(S,p['t1']-.02,hit(.8,.5),.8)
# war: jets + booms
c7=W('Within')-.06
add(S,c7+.2,jetflyby(1.7),.9); add(S,c7+1.2,jetflyby(1.5),.7)
for t in [shots[8][1]+.1,shots[8][1]+.4,W('war'),W('war')+.25]: add(S,t,boom(.8,1.8),.8)
# micro shots (1965 tank, 1971 jets, 1999 explosion)
mi=[i for i,s in enumerate(shots) if s[0]=='kash']
m1=shots[9][1]; m2=shots[10][1]; m3=shots[11][1]
add(S,m1,engine(m2-m1,55,.5),.8); add(S,m1+.3,boom(1.0,1.2),.9); add(S,m1+.3,hp(noise(int(.1*SR)),1500)*env_exp(int(.1*SR),.02),.6)
add(S,m2,jetflyby(.8),.9); add(S,m2+.1,boom(.7,1.2),.7); add(S,m2+.3,boom(.7,1.2),.7)
add(S,m3+.15,boom(1.1,2.0),.9)
# froze: ice crack + wind
tf=W('froze')
add(S,tf-.02,crackle(.5,1.0),1.2); add(S,tf,sine_sweep(.4,2500,300)*env_exp(int(.4*SR),.12),.5); add(S,tf-.4,wind(2.0,.8),.7)
# pins drop + ticks
for t0 in [W('Kashmir',1),W('Location')+.02]:
    add(S,t0,pop(260,90,.25),1.2)
    tf2=np.sqrt(2*4.5/30)
    add(S,t0+tf2,hit(.5,.4),.7); add(S,t0+tf2+.35,pop(300,120,.12),.5)
# LoC reveal ticks
c11=[s for s in shots if s[0]=='map'][3]
tl=[s for s in shots if s[0]=='map']
# find LoC map shot as the one starting at ~ The(2)
t_loc=W('The',2)-.06; t_nb=W('not')-.06
for i in range(16): add(S,t_loc+.1+i*(t_nb-t_loc-.3)/16,tick(.8,1800+i*100),.8)
# rivers (water trickle) over river map shot
t_r0=W('Water')+.78; t_r1=W('flow')-.05
add(S,t_r0,bp(noise(int((t_r1-t_r0)*SR)),600,4000)*np.sin(np.linspace(0,np.pi,int((t_r1-t_r0)*SR)))*.6,.7)
# dam: water roar
add(S,W('Water')-.05,waterroar(2.4,.9),.7); add(S,W('power')-1.0,waterroar(3.5,.7),.6)
# tractor putt
t_a=W('For',2)-.05; t_b=W('farms')+.55
add(S,t_a,engine(t_b-t_a,40,.8),.8)
# valve squeak
tv=W('and',5)-.05
sq=sine_sweep(1.0,900,1400)*np.sin(np.linspace(0,np.pi,SR))*.25; add(S,tv+.2,sq,.6); add(S,tv,hit(.4,.3),.5)
# arrows
for w_,n_ in [('South',1),('China',1),('Afghanistan',1),('Central',1)]: add(S,W(w_,n_)-.05,whoosh(.35,True),.7)
# summit wind + flag flutter
th=shots[[i for i,s in enumerate(shots) if s[1]>=W('Whoever')-.07][0]][1]
add(S,th,wind(2.6,1.2,300,1400),.8); add(S,th,crackle(2.6,.35),.5)
# glacier wind + heli rotor slap approaching
tg=W('from',1)-.05; te=W('and',7)-.06
add(S,tg,wind(te-tg,1.4,150,800),.9)
n=int((te-tg)*SR); rr=rotor(te-tg)*np.linspace(.25,1,n)[:len(rotor(te-tg))] if False else rotor(te-tg)*(np.linspace(.2,1,n)).astype(np.float32); add(S,tg-.6,rr,.55)
# convoy
tc=W('to',2)-.08
add(S,tc,engine(te-tc,60,.8),.9); add(S,tc,lp(noise(int((te-tc)*SR)),1500)*.35,.5)
# identity: birds
for i,tb in enumerate([te+.1,te+.5,te+.9]): add(S,tb,sine_sweep(.18,2600,3600)*np.sin(np.linspace(0,np.pi,int(.18*SR)))*.3,.6); 
# crown chimes
tcr=W('crown')
for k,f in enumerate([1046,1318,1568,2093]): add(S,tcr+k*.07,chime(f,1.5),.9)
# book scratch
tb0=W('unfinished')-.1; tb1=W('Add')-.06
for i in range(int((tb1-tb0)*5)): add(S,tb0+.4+i*.2,bp(noise(int(.12*SR)),2500,7000)*np.sin(np.linspace(0,np.pi,int(.12*SR)))*.5,.5)
# Aksai pin
add(S,W('AksaiChin')+.0,pop(300,700,.2),1.0)
# nuclear pings/alarm
for t in [W('three'),W('nuclear'),W('powers')-.1]: add(S,t,chime(660,1.0),1.0); add(S,t,sine_sweep(.5,70,50)*env_exp(int(.5*SR),.25),.9)
# bridge: dove flaps + chime
tb=W('So',2)
add(S,tb+.3,chime(784,1.8),.8); add(S,tb+.5,chime(1175,1.8),.6)
for i in range(12): add(S,tb+.4+i*.14,bp(noise(int(.07*SR)),400,1800)*env_exp(int(.07*SR),.02),.4)
# fuse sizzle + boom
tfu=W('or')-.04+.2; tbo=W('Follow')-.05-.55
add(S,tfu,crackle(tbo-tfu,1.0)*np.linspace(.4,1.3,int((tbo-tfu)*SR)).astype(np.float32)[:int((tbo-tfu)*SR)],.9)
add(S,tfu,hp(noise(int((tbo-tfu)*SR)),4000)*.12,.7)
add(S,tbo-.04,hit(1.4,1.0),1.0); add(S,tbo,boom(1.6,3.0),1.0)
# end card: logo shine + follow tap
tl_=W('Redrawn')-.1
add(S,tl_,whoosh(.5,True),.9); add(S,tl_+.1,hit(1.1,.7),.9)
for k,f in enumerate([784,988,1175,1568]): add(S,tl_+.25+k*.08,chime(f,1.4),.8)
tp=W('The',11)+.55
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
vo,sr=sf.read('vo_final.wav',dtype='float32'); vo=vo[:N] if len(vo)>=N else np.pad(vo,(0,N-len(vo)))
dv=duck_env(vo); duck=1-.55*np.clip(dv*1.6,0,1); duck=np.convolve(duck,np.ones(int(.1*SR))/int(.1*SR),'same').astype(np.float32)
sfx_duck=1-.25*np.clip(dv*1.6,0,1); sfx_duck=np.convolve(sfx_duck,np.ones(int(.05*SR))/int(.05*SR),'same').astype(np.float32)
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
sfxb=comp(S*.32*sfx_duck,-26,4.0)
vo_c=comp(vo,-30,2.5,.004,.2)*1.6
mix=vo_c+mus*.30*duck+sfxb*1.0
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
    out=tp_limit(out.astype(np.float32),.62).astype(np.float64); L2=m.integrated_loudness(out); print('tp-iter',it,L2,np.abs(out).max())
    if abs(L2+14)<.05: break
    out=out*10**((-14-L2)/20)
out=tp_limit(out.astype(np.float32),.62).astype(np.float64)
print('peak',np.max(np.abs(out)),'loud',m.integrated_loudness(out))
sf.write('mix_final.wav',out.astype(np.float32),SR); print('ok',D)
