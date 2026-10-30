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
# ---------------- Middle East events ----------------
G=9.81
for i,t0 in enumerate(EVT['cuts'],1): add(S,t0-.17,whoosh(.36,i%3!=0),.55)
for t_ in EVT['pops']: add(S,t_-.02,pop(520,1150,.1),.7)
def rocket(dur=1.2,g=1.0):
    n=int(dur*SR); u=np.linspace(0,1,n); return (lp(noise(n),3000)*(.2+.8*u**1.5)+sweep_noise(dur,400,4000,.8,u**2))*g
def scrape(dur=.5,g=1.0):
    n=int(dur*SR); return bp(noise(n),500,3500)*np.sin(np.linspace(0,np.pi,n))**.8*g*.6
def clack(g=1.0):
    n=int(.15*SR); t_=np.arange(n)/SR; return (np.sin(2*np.pi*900*t_)*env_exp(n,.015)+hp(noise(n),2500)*env_exp(n,.008)*.6)*g
def radar_ping(g=1.0):
    n=int(.9*SR); t_=np.arange(n)/SR; return (np.sin(2*np.pi*1480*t_)+.4*np.sin(2*np.pi*2220*t_)).astype(np.float32)*env_exp(n,.28)*g*.5
def buzzer(g=1.0,dur=.55):
    n=int(dur*SR); t_=np.arange(n)/SR; return (np.sign(np.sin(2*np.pi*110*t_))*.35+np.sign(np.sin(2*np.pi*117*t_))*.3).astype(np.float32)*np.minimum(1,np.minimum(t_/.01,(dur-t_)/.05))*g
def slash(g=1.0): return sweep_noise(.22,6000,1200,.8)*g*1.2
def creak(g=1.0):
    n=int(.55*SR); t_=np.arange(n)/SR; f=240+90*np.sin(2*np.pi*3.5*t_); ph=2*np.pi*np.cumsum(f)/SR; return (np.sign(np.sin(ph))*.15+np.sin(ph)*.2).astype(np.float32)*np.sin(np.linspace(0,np.pi,n))*g
# hook
add(S,W('Who')-.3,riser(.5,.8),.7); add(S,W('Who'),hit(1.3,.8),1.0); add(S,W('East'),hit(1.0,.7),.8)
tw=W('Wrong'); add(S,tw-.02,hit(1.4,.9),1.0); add(S,tw+.02,buzzer(1.0,.5),.7); add(S,tw+.2,slash(1.0),.9); add(S,W("Here's")-.05,pop(400,900,.12),.7)
# Saudi: pumpjack creak + diesel chug, tanker pass, coin shower, cash chime
ts=W('Saudi'); add(S,ts-.02,hit(1.0,.7),.9); add(S,ts,engine(2.4,48,1.0),.6)
for k in range(2): add(S,ts+.2+k*1.2,creak(1.0),.5)
add(S,ts+.3,rumble(2.4,1.0,140),.7); add(S,ts+.5,engine(2.0,62,.8),.5)
tc=W('cash')-.18; add(S,tc-.02,hit(1.3,.8),1.0)
for i in range(40):
    d=(i*0.037)%1.5; T=tc+d+ (2*(26+14*((i*7)%10)/10)/G)**.5   # landing time of a coin falling ~26-40 m
    add(S,T,clink(.8+.4*rng.random()),.45)
add(S,tc+.1,chime(1568,1.4),.6); add(S,tc+.18,chime(2093,1.2),.5)
# mosque: warm bell chimes + soft wind (no prayer audio)
th=W('holiest')-.05; add(S,th,hit(.9,.7),.8); add(S,th,wind(W('Israel')-th,.8,250,1000),.4)
for k,f in enumerate([392,494,587,784]): add(S,th+.1+k*.28,chime(f,2.2),.5)
# Israel: radar sweep pings, satellite beeps, jet pass
ti=W('Israel')-.02; add(S,ti,hit(1.0,.7),.9)
for k in range(2): add(S,ti+.3+k*.9,radar_ping(.9),.7)
for k in range(4): add(S,W('sharpest')+k*.28,beep(2100,.05),.35)
tj=W('strongest')-.1; add(S,tj,jetflyby(2.0,1.2),.9); add(S,tj+.1,turbofan(1.7,1.0,500,1700),.55); add(S,tj+.05,hit(1.2,.7),.9)
# Iran: map stamp, X slash, proxies tubes
tir=W('Iran'); add(S,tir-.02,hit(1.2,.8),1.0); add(S,tir+.12,clunk(.8),.7)
add(S,W('front')-.05,hit(.9,.6),.8); add(S,W('line')+.0,slash(1.0),.9); add(S,W('line')+.05,buzzer(.8,.4),.6)
px=W('proxies')
for i in range(4): add(S,px-.1+i*.13,thud(.9),.6); add(S,px-.1+i*.13+.2,pop(700+i*100,1500,.1),.7)
for i in range(4): add(S,px+.0+i*.13,whoosh(.45,True),.5)
# Turkey: marching steps + tank rumble
tt=W('Turkey')-.04; add(S,tt,hit(1.2,.8),1.0)
k=tt
while k<W('an')-.1: add(S,k,thud(.8),.6); add(S,k+.02,clack(.5),.3); k+=.34
add(S,tt,rumble(W('an')-tt,1.2,110),.7); add(S,tt+.05,engine(W('an')-tt,52,.9),.5)
add(S,W('massive')-.05,hit(1.0,.7),.8)
te=W("empire's")-.1; add(S,te-.3,riser(.45,.8),.6); add(S,te,hit(1.2,.8),1.0)
for k,f in enumerate([330,415,494,659]): add(S,te+.1+k*.2,chime(f,2.0),.5)
# US: ship horn, sea ambience, jet take-off, base pins
tu=W('United')-.05; add(S,tu,hit(1.1,.7),.9); add(S,tu+.05,horn(1.4,98,1.0),.7); add(S,tu,sea(20.5-tu,1.0),.7); add(S,tu+.8,splash(.7,1.0),.3)
tb=W('bases')-.05; add(S,tb,hit(1.1,.7),.9); add(S,tb-.1,turbofan(1.5,1.2,500,1900),.9); add(S,tb+.5,jetroar(1.3,1.0,True),.6)
tl=20.5+.15
for i in range(7): add(S,tl+i*.15+.2,pop(600+i*70,1200,.09),.6); add(S,tl+i*.15+.22,thud(.7),.4)
for i in range(3): add(S,W('allies')+i*.15,whoosh(.4,True),.5)
add(S,W('Always')-.02,hit(.9,.6),.7)
# twist + not one holds the map
ttw=W("Here's",2)-.04; add(S,ttw-.3,riser(.3,.8),.6); add(S,ttw,hit(1.5,1.0),1.0); add(S,ttw,boom(.8,2.0),.6); add(S,W('twist'),clang(.8),.5)
tn=W('Not')-.02; add(S,tn,hit(1.2,.8),1.0)
for i in range(4): add(S,W('Not')-.1+i*.2+.15,thud(.9),.7); add(S,W('Not')-.1+i*.2+.17,pop(500+i*90,900,.1),.5)
add(S,W('whole'),buzzer(.6,.3),.4)
# clash: coin clink, rocket whoosh, faith bell, flag flutter, crash
tp=[W('Money')-.05,W('weapons')-.05,W('faith')-.05,W('alliances')-.05]
for i,t0 in enumerate(tp):
    tf=t0+(2*12/G)**.5; add(S,t0,whoosh(.4,False),.5); add(S,tf,thud(1.0),.8)
add(S,tp[0]+.5,clink(1.0),.6); add(S,tp[0]+.6,clink(.8),.5); add(S,tp[1]+.2,rocket(.9,.8),.5); add(S,tp[2]+.5,chime(523,1.6),.6); add(S,tp[3]+.5,wind(.9,.8,500,2500),.4)
th2=EVT['tHit']; add(S,th2-.7,riser(.7,1.0),.8); add(S,th2-.02,hit(1.7,1.0),1.0); add(S,th2,boom(1.0,3.0),.9); add(S,th2+.05,crackle(1.3,1.2),.6); add(S,th2+.05,whoosh(.6,False),.8)
for i in range(4): add(S,th2+.4+i*.13,thud(.9),.5); add(S,th2+.42+i*.13,clink(.8),.4)
# board: slides + clacks
tb2=W('Nobody')-.05; add(S,tb2,hit(1.1,.7),.9); add(S,tb2+.1,clack(1.0),.7)
tpl=W('Everyone')-.04
for i in range(18): add(S,tpl+.15+i*.06,scrape(.35+.1*rng.random(),.8),.45); add(S,tpl+.55+i*.07,clack(.9),.5)
add(S,W('Everyone'),crowd(1.6,.7),.4)
# crown: tension then drop
tso=W('So')-.05; add(S,tso-.05,hit(1.0,.7),.8); add(S,tso,riser(W('Nobody',2)-tso-.1,1.2),.7)
tnb=EVT['tDrop']; add(S,tnb-.02,hit(1.6,1.0),1.0); add(S,tnb,boom(.9,2.4),.7); add(S,tnb,whoosh(1.2,False),.5)
T=(2*10/G)**.5; tt_=tnb+T; v=G*T*.32; vv=v; clang_t=[tt_]
u=tt_
while vv>.6: u+=2*vv/G; vv*=.32; clang_t.append(u)
for i,tc_ in enumerate(clang_t): add(S,tc_,clang(1.1/(1+i*.7)),.9); add(S,tc_,thud(1.0/(1+i)),.7)
add(S,tt_,hit(1.2,.8),1.0); add(S,tt_,crackle(.7,1.0),.4)
# never stops: pulses
tns=W('never')-.06; add(S,tns,hit(1.3,.8),1.0)
for i in range(6): add(S,tns+.15+i*.25,whoosh(.4,i%2==0),.45); add(S,tns+.15+i*.25,thud(.6),.4)
# end card
aR=EVT['redrawn']; add(S,aR,whoosh(.5,True),.9); add(S,aR+.1,hit(1.1,.7),.9)
for k,f in enumerate([784,988,1175,1568]): add(S,aR+.25+k*.08,chime(f,1.4),.8)
tp2=W('headlines')+.15; add(S,tp2-.05,pop(500,300,.06),1.2); add(S,tp2+.02,tick(1.0,1200),1.0); add(S,tp2+.06,chime(1318,1.2),.9); add(S,tp2+.2,chime(1760,1.5),.8)
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
