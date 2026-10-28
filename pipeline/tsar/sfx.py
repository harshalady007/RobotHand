import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter
SR=48000; rng=np.random.default_rng(7)
TL=json.load(open('work/timeline_full.json')); words=TL['words']; D=TL['duration']; shots=json.load(open('video3d/shots.json')); pauses=TL['pauses']
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

# ---------- event list (TSAR BOMBA) ----------
S=mix_sfx
VEND=TL['voEnd']
def glass(g=1.0):
    n=int(.45*SR); x=hp(noise(n),3500)*env_exp(n,.05)*.8
    for k in range(7):
        t0=rng.random()*.18; f=rng.uniform(3500,7500); m=int(.12*SR); tt=np.arange(m)/SR
        add(x,t0,(np.sin(2*np.pi*f*tt)*env_exp(m,.025)).astype(np.float32),.25)
    return x*g
def thud(g=1.0): n=int(.4*SR); return (sine_sweep(.4,110,45)*env_exp(n,.1)+lp(noise(n),500)*env_exp(n,.04)*.5)*g
def sonar(g=1.0,f=900): n=int(1.1*SR); t=np.arange(n)/SR; return (np.sin(2*np.pi*f*t*(1-.35*t))*env_exp(n,.28)).astype(np.float32)*g
def whomp(dur=1.4,g=1.0): n=int(dur*SR); return (lp(noise(n),180)*env_exp(n,.35)*1.5+sine_sweep(dur,70,32)*env_exp(n,.5))*g
def prop_drone(dur,f=96,g=1.0):
    n=int(dur*SR); t=np.arange(n)/SR; x=np.zeros(n,np.float32)
    for k,ff in enumerate([f,f*1.013,f*.987,f*1.027]): ph=2*np.pi*np.cumsum(np.full(n,ff)*(1+.01*np.sin(t*5+k)))/SR; x+=((2*((ph/(2*np.pi))%1)-1)).astype(np.float32)
    mod=(.75+.25*np.sin(2*np.pi*14*t)).astype(np.float32)
    return (lp(x*mod,900,2)*.35+lp(noise(n),600)*.12)*g
def cloth(dur,g=1.0): n=int(dur*SR); return bp(noise(n),300,2600)*np.sin(np.linspace(0,np.pi,n)).astype(np.float32)*1.1*g
def geiger(dur,g=1.0):
    n=int(dur*SR); out=np.zeros(n,np.float32); k=int(dur*45)
    for i in range(k):
        u=i/k; t0=(u**1.4)*dur; add(out,t0,(hp(noise(300),2500)*env_exp(300,.0012)).astype(np.float32),1.0)
    return out*g
def cheer(dur,g=1.0):
    n=int(dur*SR); x=bp(noise(n),500,2800)*(.6+.4*np.sin(np.linspace(0,dur*9,n))).astype(np.float32); out=x*np.sin(np.linspace(0,np.pi,n)).astype(np.float32)**.7
    for i in range(int(dur*40)): add(out,rng.random()*dur,(hp(noise(400),1500)*env_exp(400,.003)).astype(np.float32),.5)
    return out*g
# whoosh on every cut
for i,s in enumerate(shots[1:],1):
    t0=s[1]; dur=s[2]-s[1]
    if t0>=VEND+.05: continue
    if dur<1.0: add(S,t0-.08,whoosh(.22,i%2==0),.5); add(S,t0,hit(.35,.3),.45)
    else: add(S,t0-.18,whoosh(.4,i%3!=0),.55)
# hook: riser into the explosion + boom + rumble
t_ex=W('explosion')
add(S,0.0,riser(t_ex+.02,.9),.6); add(S,t_ex-.02,hit(1.4),1.0); add(S,t_ex,boom(1.6,3.2),1.0); add(S,t_ex+.3,whomp(2.4),.7)
# space: shockwave laps
s0=1.95; s1=5.4
add(S,s0-.05,whoosh(.4,True),.9); add(S,s0,sweep_noise(s1-s0,120,900,.8,np.ones(int((s1-s0)*SR),np.float32)*.6),.5)
for i in range(1,4): add(S,s0+(s1-s0)*i/3,sonar(1.0,700+150*i),1.0); add(S,s0+(s1-s0)*i/3,hit(.7+.15*i,.5),.8)
add(S,s1,boom(1.1,2.0),.9)
# map date + pin drop
tc4=W('october')-.06
add(S,tc4+.08,pop(260,90,.25),1.2); add(S,tc4+.08+np.sqrt(2*4.5/30),hit(.5,.4),.7)
add(S,W('october')+.02,hit(.8,.4),.9); add(S,W('october')+.02,tick(1.0,1500),.8)
# arctic ocean: wind + ice crack
ta=W('arctic')-.1; add(S,ta,wind(1.6,1.2,180,900),.8); add(S,ta+.5,crackle(.5,.9),.7)
# soviet: flag + low brass swell
ts=W('soviet')-.03; add(S,ts,crackle(1.6,.35),.5); add(S,ts,sweep_noise(1.2,200,500,.4),.4)
for k,f in enumerate([196,247,294]): add(S,ts+.1,(np.sin(2*np.pi*f*np.arange(int(1.6*SR))/SR)*env_exp(int(1.6*SR),.6)*.15).astype(np.float32),.9)
# tarp pull + reveal
tp0=W('never')-.1; add(S,tp0,cloth(.75,1.0),.9); add(S,W('seen'),hit(1.2),1.0); add(S,W('seen'),boom(.8,1.6),.6)
# tsar bomba stamp
add(S,W('tsar')-.02,hit(1.3),1.0); add(S,W('tsar')-.02,riser(.3,.6),.0)
# board 100 + chalk
tb=W('100')-.05; add(S,tb,hit(1.0,.6),.9)
for i in range(6): add(S,tb+.1+i*.06,bp(noise(int(.05*SR)),2500,6000)*env_exp(int(.05*SR),.015),.4)
# bar chart growth then cut to 50
tg0=W('original'); tg1=W('100')+.5
t50=W('50')
add(S,t50-.15,sine_sweep(.55,1400,400)*env_exp(int(.55*SR),.2)*.4,.8)
for k in range(3): add(S,t50-.05+k*.08,hp(noise(int(.03*SR)),4000)*env_exp(int(.03*SR),.008),.9)
add(S,t50+.3,thud(1.0),.9); add(S,t50+.32,chime(1100,.8),.5)
# fallout: geiger + warning
tr0=W('radioactive')-.1; tr1=W('fallout')+.5
add(S,tr0,geiger(tr1-tr0,1.0),.9); add(S,tr0,pop(900,1400,.15),.8); add(S,W('fallout')+.0,sine_sweep(.3,500,120)*env_exp(int(.3*SR),.12),.7)
# half power
add(S,W('half')-.15,hit(.9,.5),.9); add(S,W('half')-.15,sonar(.7,520),.5)
# dot grid ticks (accelerating) + hit on Hiroshima circle
tg_a=W('3000')-.1; tg_b=W('hiroshima')-.15
for i in range(60): u=i/60; add(S,tg_a+(tg_b-tg_a)*(u**1.5),tick(.6,1600+u*3200),.7)
add(S,W('hiroshima')-.05,hit(1.0,.6),.9); add(S,W('hiroshima')+.25,chime(988,1.0),.6)
# Tu-95 drone (props) + flyby
t_p0=W('it',4)-.1; t_p1=W('parachute')+.8
dd=prop_drone(t_p1-t_p0,96,1.0)
add(S,t_p0,dd,.7)
add(S,W('fast')-.2,whoosh(.8,True),.6)
# release clunk + chute fwoomp
tr_=W('released')
add(S,tr_,hit(.7,.3),.9); add(S,tr_+.03,tick(1.0,900),.9)
add(S,tr_+.45,lp(noise(int(.5*SR)),1200)*env_exp(int(.5*SR),.12)*1.4,.9); add(S,tr_+.45,whomp(.8,.8),.6); add(S,tr_+.5,cloth(.7,1.0),.5)
# 11:32 clock: tick-tock + ding
tclk=W('at',2)-.06; tend=37.5
k=0
while tclk+k*.5<tend-.2: add(S,tclk+.1+k*.5,tick(1.1 if k%2==0 else .8,1200 if k%2==0 else 900),.9); k+=1
add(S,tend-.55,chime(1320,1.6),.8); add(S,tend-.55,chime(990,1.6),.6)
# silence before the blast: chute wind then dead air, then BOOM
tdet=W('detonated')
add(S,tend,wind(tdet-tend-.05,.5,300,1200),.6)
add(S,tdet-.02,hit(1.6,1.0),1.0); add(S,tdet,boom(2.0,4.0),1.0); add(S,tdet,riser(.0001,1),0); add(S,tdet,crackle(.6,1.3),.9)
add(S,tdet+.2,whomp(3.2),.9); add(S,tdet+1.1,boom(1.2,3.0),.7)
add(S,tdet+.1,lp(noise(int(4*SR)),700)*env_exp(int(4*SR),1.2)*1.2,.8)
# frozen island: rolling fireball roar
add(S,tdet+.8,waterroar(3.5,.8)*env_exp(int(3.5*SR),1.6),.5)
# fireball / 8 km measure
add(S,W('fireball')-.05,hit(.9,.5),.8); t8=W('kilometres',2)-.3; add(S,t8,sine_sweep(.6,300,1400)*env_exp(int(.6*SR),.25)*.4,.7); add(S,t8+.6,chime(1175,.8),.6)
# mushroom rise: deep rumble + rising pitch counter ticks
tm0=W('mushroom')-.1; tm1=W('upper')
add(S,tm0,sweep_noise(tm1-tm0,60,300,.5)*1.4,.9); add(S,tm0,sine_sweep(tm1-tm0,45,120)*np.sin(np.linspace(0,np.pi,int((tm1-tm0)*SR))).astype(np.float32)*.7,.8)
t64=W('64')-.05
for i in range(20): u=i/20; add(S,t64+u*(W('kilometres',3)+.5-t64),tick(.7,1200+u*3500),.8)
add(S,W('64')-.05,hit(1.0,.6),.9)
# upper atmosphere: thin wind + high drone
tu=W('upper')-.06; add(S,tu,wind(W('bomber',3)-tu,.6,1500,4500),.6); add(S,tu,(np.sin(2*np.pi*660*np.arange(int(1.6*SR))/SR)*np.sin(np.linspace(0,np.pi,int(1.6*SR)))*.1).astype(np.float32),.7)
# bomber far away: faint prop drone; shockwave hit; time-lapse whine; plane plunge groan
tb3=W('bomber',3)-.06; add(S,tb3,prop_drone(W('shockwave',2)-tb3,92,.8),.5)
tw2=W('shockwave',2)-.08
add(S,tw2-.1,sine_sweep(.7,300,2200)*np.linspace(.2,1,int(.7*SR)).astype(np.float32)*.3,.7)
add(S,W('still')-.45,hit(1.5),1.0); add(S,W('still')-.45,boom(1.4,2.4),.8); add(S,W('still')-.4,crackle(.5,.9),.7)
tpl=W('still')-.4; tpe=W('metres')+.2
add(S,tpl,(sine_sweep(tpe-tpl,90,60)*np.sin(np.linspace(0,np.pi,int((tpe-tpl)*SR))).astype(np.float32)*.5),.8)
add(S,tpl,wind(tpe-tpl,1.0,400,3500)*np.linspace(.2,1,int((tpe-tpl)*SR)).astype(np.float32)[:int((tpe-tpl)*SR)],.9)
for i in range(14): u=i/14; add(S,tpl+.2+u*(tpe-tpl-.4),tick(.7,900+u*1500),.7)
# village: shock sweep + glass crashes
twv=W('windows')+.23
add(S,twv+.05,whoosh(.7,False),.9); 
hx=[-15,-5,6,16]; wins=sorted([h+d for h in hx for d in (-2.6,2.6)])
for xw in wins:
    tbk=twv+(26-xw)/40
    if 54.7<=tbk<=56.5: add(S,tbk,glass(1.0),.9)
add(S,twv+.4,hit(.7,.4),.5)
# map: sonar pings as the shock rings reach Finland
tf0=W('as',2)-.05
for i,dl in enumerate([.0,.3,.6]): add(S,tf0+dl,sonar(1.0,500+120*i),.7)
add(S,W('finland')-.02,hit(1.0),.9)
# kuzka's mother: fist thumps + threat sting
tk=W("Kuzka's")
for i,dl in enumerate([0,.4,.8]): add(S,tk-.05+dl,thud(1.2),.9)
add(S,W('threat')-.04,hit(1.2),.9); add(S,W('threat')-.04,riser(.001,1),0)
# sakharov: pencil + soft chime
ts_=W('andrei')-.04; add(S,ts_,chime(660,1.6),.6); add(S,ts_+.2,chime(990,1.6),.5)
for i in range(int(1.2*6)): add(S,ts_+.3+i*.16,bp(noise(int(.08*SR)),2500,6500)*np.sin(np.linspace(0,np.pi,int(.08*SR))).astype(np.float32)*.5,.35)
# loudest voices: crowd + mic
tl2=W('became')+.4; add(S,tl2,cheer(W('limits')+.5-tl2,1.0),.7)
add(S,W('loudest')-.05,hit(.8,.5),.8)
# final sign slam
tn=W('nuclear')-.05; add(S,tn,hit(1.1),1.0); add(S,tn+.02,thud(1.0),.8); add(S,W('testing'),chime(784,1.8),.7); add(S,W('testing')+.2,chime(1175,1.8),.6)
# end card: logo shine + handle + follow tap
aR=VEND+.35
add(S,aR-.1,whoosh(.5,True),.9); add(S,aR,hit(1.1,.7),.9)
for k_,f in enumerate([784,988,1175,1568]): add(S,aR+.15+k_*.08,chime(f,1.4),.8)
add(S,aR+.7,pop(500,900,.1),.7)
press=aR+2.1
add(S,aR+.85,whoosh(.35,True),.5)
add(S,press-.05,pop(500,300,.06),1.2); add(S,press+.02,tick(1.0,1200),1.0); add(S,press+.06,chime(1318,1.2),.9); add(S,press+.2,chime(1760,1.5),.8)
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
for b in range(int(VEND/beat)):
    tb_=b*beat; g=.55*inten[min(N-1,int(tb_*SR))]; add(mus,tb_,kick,g)
    if b%2==1: add(mus,tb_+beat/2,tick(.5,5000)*1.0,.5*g)
    for q in (1,3): add(mus,tb_+q*beat/4,tick(.3,7000),.25*g)
for k_,f in enumerate([261.6,329.6,392.0,523.3]):
    n_=int((D-VEND)*SR); e_=np.sin(np.linspace(0,np.pi,n_)).astype(np.float32)**.8
    add(mus,VEND-.1,(np.sin(2*np.pi*f*np.arange(n_)/SR)*e_*.25).astype(np.float32),1.0)
# dip during pauses: music drops to near silence then pops back
dip=np.ones(N,np.float32)
for p in pauses:
    a=int((p['t0']+.02)*SR); b=int(p['t1']*SR); dip[a:b]=.12
    dip=np.minimum(dip,1)
dip=np.convolve(dip,np.ones(int(.03*SR))/int(.03*SR),'same')
# fade in/out
mus*=dip*np.clip(t/.5,0,1)*np.clip((D-t)/1.2,0,1)
vo,sr=sf.read('work/vo_final.wav',dtype='float32'); vo=vo[:N] if len(vo)>=N else np.pad(vo,(0,N-len(vo)))
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
sf.write('work/mix_pre.wav',mix,SR)
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
sf.write('work/mix_final.wav',out.astype(np.float32),SR); print('ok',D)
