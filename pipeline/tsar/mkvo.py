# script + dramatic pauses -> vo_final.wav, video3d/timeline.json   (run from work/)
import json, re, numpy as np, soundfile as sf
asr=json.load(open('asr_words.json'))
# ASR heard "Follow @historywithaddie ..." (another page) -> dropped; reel ends after "testing."
script="""One explosion. Its shockwave|2 travelled around the entire Earth three times. October 30th, 1961,|3 the Arctic Ocean. The Soviet Union was about to test a weapon the world had never seen. It was called the Tsar Bomba. The original design was 100|2 megatons. Engineers cut it to 50 to reduce radioactive fallout.|2 Even at half power, it was more than 3,000|2 times the bomb dropped on Hiroshima. It was carried by a modified Tu-95|4 bomber. The bomber had to get away fast, so the bomb was released on a parachute. At 11:32|3 Moscow time, it detonated about four kilometres above a frozen island. The fireball|2 was about eight kilometres wide. The mushroom cloud climbed to about 64|2 kilometres high into the upper atmosphere. The bomber was far away and the shockwave|2 still knocked it down a thousand metres. Windows shattered as far away as Finland. In Russian, the weapon was nicknamed Kuzka's mother, a threat. And one of its designers, Andrei Sakharov, became one of the loudest voices calling for limits on nuclear testing."""
toks=[]
for w in script.split():
    if '|' in w: t,n=w.split('|'); toks.append((t,int(n)))
    else: toks.append((w,1))
n=sum(n for _,n in toks); print(n,len(asr)); assert n==188
words=[];i=0
for t,k in toks:
    words.append({'w':t,'a':asr[i]['a']}); i+=k
for k,w in enumerate(words):
    w['b']=words[k+1]['a'] if k+1<len(words) else w['a']+0.7
    if re.search(r'[.?!]$',w['w']): w['b']=min(w['b'],w['a']+0.75)
def idx(txt,nth=1):
    k=0
    for j,w in enumerate(words):
        if re.sub(r"[^a-z0-9']","",w['w'].lower())==re.sub(r"[^a-z0-9']","",txt.lower()):
            k+=1
            if k==nth: return j
    raise Exception(txt)
P=[(idx('Its'),.26),(idx('The',3),.24),(idx('It',1),.34),(idx('The',6),.24),(idx('Engineers'),.16),(idx('Even'),.26),(idx('It',4),.2),(idx('The',8),.22),(idx('At',2),.26),(idx('it',5),.38),(idx('The',10),.30),(idx('The',11),.24),(idx('The',13),.32),(idx('Windows'),.22),(idx('In',1),.26),(idx('And',2),.24)]
for j,s in P: print(words[j]['w'],words[j]['a'],s)
a,sr=sf.read('ve48.wav',dtype='float32')
PRE=.30; ENDT=3.6
# end: cut before ASR "Follow" in quietest window, fade out
tend=asr[188]['a']; lo=int((tend-.45)*sr); hi=int((tend-.02)*sr); win=int(.03*sr)
best=min(range(lo,hi-win,int(.004*sr)),key=lambda s:np.sqrt(np.mean(a[s:s+win]**2))); endc=best+win//2
a=a[:endc].copy(); f=int(.05*sr); a[-f:]*=np.linspace(1,0,f)
cuts=[]
for j,s in sorted(P):
    t=words[j]['a']; lo=int((t-.14)*sr); hi=int((t-.01)*sr); best=None
    for st in range(lo,hi-win,int(.004*sr)):
        e=np.sqrt(np.mean(a[st:st+win]**2))
        if best is None or e<best[0]: best=(e,st)
    cuts.append((best[1]+win//2,s,t))
out=[np.zeros(int(PRE*sr),dtype=np.float32)];prev=0
for c,s,t in cuts:
    out.append(a[prev:c]); out.append(np.zeros(int(s*sr),dtype=np.float32)); prev=c
out.append(a[prev:]); out.append(np.zeros(int(ENDT*sr),dtype=np.float32))
vo=np.concatenate(out); sf.write('vo_final.wav',vo,sr)
def F(t): return PRE+t+sum(s for (c,s,_) in cuts if t>=c/sr)
tw=[{'w':w['w'],'a':round(F(w['a']),3),'b':round(F(w['b']),3)} for w in words]
D=len(vo)/sr; vend=F(endc/sr)
pauses=[{'t0':round(F(c/sr)-sec,3),'t1':round(F(c/sr),3)} for (c,sec,_) in cuts]
json.dump({'duration':round(D,3),'pre':PRE,'voEnd':round(vend,3),'words':tw,'pauses':pauses},open('timeline_full.json','w'))
json.dump({'duration':round(D,3),'pre':PRE,'voEnd':round(vend,3),'words':tw,'pauses':pauses},open('../video3d/timeline.json','w'))
print('dur',D,'voEnd',vend); print(' '.join(f"{x['w']}@{x['a']:.2f}" for x in tw))
