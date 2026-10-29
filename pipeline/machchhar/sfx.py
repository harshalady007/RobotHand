import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter
import os; CEIL=float(os.environ.get("CEIL","0.62")); SR=48000; rng=np.random.default_rng(7)
TL=json.load(open('w/timeline_full.json')); words=TL['words']; D=TL['duration']; shots=json.load(open('video3d/shots.json')); pauses=TL['pauses']; EVT=json.load(open('video3d/events.json'))
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
def alarm(dur,g=1.0):
    n=int(dur*SR); t_=np.arange(n)/SR; f=np.where((t_*4)%1<.5,880,660); ph=2*np.pi*np.cumsum(f)/SR; return (np.sin(ph)*.6+np.sign(np.sin(ph))*.15).astype(np.float32)*np.minimum(1,np.minimum(t_/.02,(dur-t_)/.05))*g
def fall_whistle(dur,g=1.0):
    n=int(dur*SR); return sine_sweep(dur,2200,260)*np.minimum(1,np.linspace(0,1,n)*5).astype(np.float32)*g*.5+lp(noise(n),3000)*.25*g
def gasp(g=1.0): n=int(.45*SR); return bp(noise(n),500,2200)*np.sin(np.linspace(0,np.pi,n))**1.5*g
def clang(g=1.0):
    n=int(.7*SR); t_=np.arange(n)/SR; return sum(np.sin(2*np.pi*f*t_)*a for f,a in [(620,1),(1480,.7),(2310,.5),(3350,.3)]).astype(np.float32)*env_exp(n,.18)*g*.5
def buzz(dur,g=1.0): n=int(dur*SR); t_=np.arange(n)/SR; return (np.sign(np.sin(2*np.pi*120*t_))*.3+np.sin(2*np.pi*240*t_)*.3).astype(np.float32)*np.minimum(1,np.minimum(t_/.01,(dur-t_)/.03))*g
def clunk(g=1.0): n=int(.25*SR); return (sine_sweep(.25,260,70)*env_exp(n,.06)+lp(noise(n),1200)*env_exp(n,.03))*g
def chirp(g=1.0): n=int(.4*SR); return hp(noise(n),2500)*env_exp(n,.12)*g*.9
def crowd(dur,g=1.0): n=int(dur*SR); x=bp(noise(n),300,2800)*(.6+.4*np.sin(np.arange(n)/SR*7)); return x.astype(np.float32)*np.minimum(1,np.minimum(np.arange(n)/SR/.2,(dur-np.arange(n)/SR)/.4))*g
def cheerfx(dur,g=1.0):
    out=crowd(dur,g)
    for _ in range(int(dur*14)): add(out,rng.random()*dur,hp(noise(int(.05*SR)),1500)*env_exp(int(.05*SR),.012),g*.5)
    return out
def footsteps(t0,t1,step=.2,g=1.0):
    k=t0
    while k<t1: add(S,k,thud(g),.7); k+=step*(.85+.3*rng.random())
cuts=[s[1] for s in shots[1:] if s[1]<EVT['follow']-.1]
for i,t0 in enumerate(cuts,1): add(S,t0-.17,whoosh(.36,i%3!=0),.55)
for t_ in EVT['pops']: add(S,t_-.02,pop(520,1150,.1),.7)
# hook: stab sting + gasp, plane falls
ts=W('stabbed'); add(S,ts-.04,hit(1.5,.9),1.0); add(S,ts,clang(1.0),.8); add(S,ts+.1,gasp(1.0),.6); add(S,ts-.4,riser(.4,.8),.6)
tp_=W('plunging'); add(S,tp_-.03,hit(1.3,.8),1.0); add(S,tp_,fall_whistle(1.2,1.0),.8); add(S,tp_-.2,turbofan(1.4,1.1,500,2000),.9)
t182=W('182'); add(S,t182-.02,hit(1.3,.8),1.0); add(S,t182,chime(392,1.6),.5); add(S,t182,crowd(2.2,.5),.5); add(S,t182+.5,gasp(.8),.5)
tm=W('man'); add(S,tm-.02,hit(1.1,.7),.9); add(S,tm,boom(.8,1.8),.6)
# Dubai: calendar slam, engine spool, tyre rumble, lift-off
tsep=W('September')-.02; add(S,tsep,hit(1.3,.8),1.0); add(S,tsep-.04,paper(1.0),.9)
tl=EVT['tLift']; add(S,W('September')-.05,turbofan(tl-W('September')+.3,1.3,420,1500),.95); add(S,W('September')-.05,rumble(tl-W('September'),1.2,180),.7); add(S,tl-.03,whoosh(.5,True),.5); add(S,tl,jetflyby(2.2,1.1),.8)
tf=W('Flight'); add(S,tf-.02,hit(.9,.6),.8)
# map: route draws, pings
tr=W('flying'); add(S,tr,whoosh(.7,True),.7); add(S,tr+.35,pop(700,1300,.1),.6); add(S,W('Tel Aviv'),pop(900,1500,.12),.7)
# calm then attack
add(S,W('Smit')-.05,chime(660,1.2),.4)
th=EVT['hit']; add(S,th-.03,hit(1.6,.9),1.0); add(S,th,clang(1.1),.9); add(S,th+.05,gasp(.9),.6); add(S,th,boom(.9,2.0),.7); add(S,W('allegedly'),riser(.5,.7),.5)
# dive: howl, alarms, masks, chaos
tpg=W('plunges'); add(S,tpg-.04,hit(1.4,.9),1.0); add(S,tpg-.04,fall_whistle(2.0,1.1),.85); add(S,tpg-.1,turbofan(1.8,1.2,600,2300),.9); add(S,tpg+.3,alarm(1.8,.7),.5)
tch=W('chaos'); add(S,tch-.02,hit(1.3,.8),1.0); add(S,tch,crowd(1.7,1.1),.7); add(S,tch,alarm(1.6,.8),.5); add(S,tch+.1,gasp(1.0),.7); add(S,tch+.4,gasp(.8),.6)
for k in range(7): add(S,tch+.1+k*.22,thud(.6),.6)
for k in range(5): add(S,tch+.2+k*.3,clink(.8),.5)
# wounded: heartbeat, tinnitus-like tone
tw=W('Severely'); add(S,tw-.02,hit(1.0,.7),.8)
for k in range(5): add(S,tw+k*.62,thud(.9),.8); add(S,tw+k*.62+.18,thud(.6),.6)
add(S,tw,np.sin(2*np.pi*3200*np.arange(int(1.8*SR))/SR).astype(np.float32)*np.linspace(.12,0,int(1.8*SR)).astype(np.float32),.5)
trf=W('refuses',2); add(S,trf-.04,hit(1.4,.9),1.0); add(S,trf-.04,riser(.3,.8),.6)
# reach + button + door
tb=W('button'); add(S,tb-.3,riser(.5,.9),.7); add(S,tb-.02,hit(1.3,.8),1.0)
for k in range(3): add(S,tb+.25+k*.35,beep(1500,.08),.5)
tpr=EVT['press']; add(S,tpr-.02,clunk(1.3),1.0); add(S,tpr,buzz(.5,.8),.7); add(S,tpr+.1,chime(1318,1.2),.7); add(S,tpr+.35,clunk(1.0),.8); add(S,tpr+.3,bp(noise(int(.7*SR)),200,1500)*np.sin(np.linspace(0,np.pi,int(.7*SR)))**1.5*.5,.7)
# passengers rush, overpower
tpa=W('Passengers'); footsteps(tpa,W('overpower')+.1,.16,1.0); add(S,tpa,crowd(2.2,1.2),.7); add(S,W('overpower')-.02,hit(1.3,.8),1.0); add(S,W('overpower'),clang(.7),.5); add(S,W('overpower')+.1,gasp(.9),.5)
# two pilots: calm
t2=W('Two'); add(S,t2-.02,hit(.9,.6),.8); add(S,t2,chime(523,1.4),.4); add(S,t2+.1,chime(659,1.4),.4)
# landing: approach, touchdown chirp, reverse thrust roar
tt=EVT['td']; add(S,tt-1.6,turbofan(1.6,1.2,500,1700),.9); add(S,tt-.03,hit(1.2,.7),1.0); add(S,tt,chirp(1.3),.9); add(S,tt+.05,rumble(1.8,1.2,160),.8); add(S,tt+.1,jetroar(2.0,1.0,False),.8)
# Tabuk map
add(S,W('Tabuk')-.04,hit(.9,.6),.9); add(S,W('Tabuk'),pop(800,1400,.12),.8)
# everyone survived: cheer + chimes
tsv=W('survived'); add(S,tsv-.1,hit(1.2,.7),1.0); add(S,tsv-.1,cheerfx(2.4,1.0),.8)
for k,f in enumerate([523,659,784,1047]): add(S,tsv+k*.09,chime(f,2.0),.6)
# ambulance siren
add(S,W('And',6)-.1,siren(2.4,.8),.35); add(S,W('courage')-.05,hit(1.1,.7),.9); add(S,W('courage'),chime(587,2.0),.5)
# defining moment: swell
td=W('defining'); add(S,td-.5,riser(.5,.8),.7); add(S,td-.02,hit(1.3,.8),1.0); add(S,td,chime(392,2.4),.6); add(S,td+.1,chime(587,2.4),.5); add(S,td+.2,chime(784,2.4),.5)
add(S,W('terrifying'),gasp(.6),.3)
tw2=W('Wounded',2); add(S,tw2-.02,hit(1.0,.7),.8)
for k in range(3): add(S,tw2+k*.62,thud(.9),.7)
# name + flag
tn=W('Captain',4)-.02; add(S,tn-.4,riser(.4,.8),.6); add(S,tn,hit(1.5,1.0),1.0); add(S,tn,boom(.9,2.4),.8)
add(S,tn,wind(W('Follow')-tn,1.0,300,1500),.5)
for k,f in enumerate([392,494,587,784,988]): add(S,tn+.2+k*.12,chime(f,2.4),.55)
add(S,W('remember')-.02,hit(1.0,.7),.9)
# end card
aR=EVT['redrawn']; add(S,aR,whoosh(.5,True),.9); add(S,aR+.1,hit(1.1,.7),.9)
for k,f in enumerate([784,988,1175,1568]): add(S,aR+.25+k*.08,chime(f,1.4),.8)
tp=W('stories',2)+.25; add(S,tp-.05,pop(500,300,.06),1.2); add(S,tp+.02,tick(1.0,1200),1.0); add(S,tp+.06,chime(1318,1.2),.9); add(S,tp+.2,chime(1760,1.5),.8)
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
mix=vo_c+mus*.26*duck+sfxb*1.0
import pyloudnorm as _p
_m=_p.Meter(SR)
for _n,_x in (('vo',vo_c),("music",mus*.26*duck),('sfx',sfxb)): print('stem',_n,round(_m.integrated_loudness(_x.astype(np.float64)),1))
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
out=out*10**(float(os.environ.get('GAIN_DB','0'))/20)
sf.write('mix_final.wav',out.astype(np.float32),SR); print('ok',D)
