# script + ASR times + dramatic pauses -> w/vo_final.wav, video3d/timeline.json, timeline_full.json
import json, re, numpy as np, soundfile as sf
asr=json.load(open('w/asr_words.json'))
script="""Why does America need military bases 10,000|2 miles from home? Because distance is the enemy, and bases erase it. In Europe, they form NATO's front line. In Japan and South_Korea, they anchor America's grip on East Asia. When a crisis hits, troops, jets, and supplies move in hours, not weeks. These bases guard allies and keep global shipping lanes open so trade keeps flowing. But look closer. Every base is also a message to rivals. We're already here. America doesn't just defend its borders. It parks its power around the world. That's not just defense. That's dominance. Follow at redrawn.stories|3 for the stories behind global power."""
toks=[]
for w in script.split():
    if '|' in w: t,n=w.split('|'); toks.append((t,int(n)))
    else: toks.append((w,1))
n=sum(n for _,n in toks); print(n,len(asr)); assert n==len(asr)
words=[];i=0
for t,k in toks:
    words.append({'w':t.replace('_',' '),'a':asr[i]['a'],'i0':i}); i+=k
for k,w in enumerate(words):
    w['b']=words[k+1]['a'] if k+1<len(words) else w['a']+0.9
    if re.search(r'[.?!]$',w['w']): w['b']=min(w['b'],w['a']+0.75)
def idx(txt,nth=1):
    k=0
    for j,w in enumerate(words):
        if re.sub(r"[^A-Za-z0-9']",'',w['w']).lower()==re.sub(r"[^A-Za-z0-9']",'',txt).lower():
            k+=1
            if k==nth: return j
    raise Exception(txt)
# nth occurrences (case-insens.): Because1 In1(In Europe) When1 These1 But1 We're1 dominance1 Follow1
P=[(idx('Because'),.30),(idx('In',1),.22),(idx('When'),.28),(idx('These'),.18),(idx('But'),.34),(idx("We're"),.30),(idx('dominance'),.30),(idx('Follow'),.32)]
for j,_ in P: print('pause before',words[j]['w'],asr[words[j]['i0']]['w'],words[j]['a'])
a,sr=sf.read('w/ve48.wav',dtype='float32')
PRE=.30; ENDT=2.2
cuts=[]
for j,s in sorted(P):
    t=words[j]['a']
    lo=int((t-.14)*sr); hi=int((t-.01)*sr); win=int(.03*sr)
    best=None
    for st in range(lo,hi-win,int(.004*sr)):
        e=np.sqrt(np.mean(a[st:st+win]**2))
        if best is None or e<best[0]: best=(e,st)
    cuts.append((best[1]+win//2,s,t))
out=[np.zeros(int(PRE*sr),dtype=np.float32)];prev=0
for c,s,t in cuts:
    out.append(a[prev:c]); out.append(np.zeros(int(s*sr),dtype=np.float32)); prev=c
out.append(a[prev:]); out.append(np.zeros(int(ENDT*sr),dtype=np.float32))
vo=np.concatenate(out)
sf.write('w/vo_final.wav',vo,sr)
cut_t=[c/sr for c,_,_ in cuts]
def F(t): return PRE+t+sum(s for (c,s,_),ct in zip(cuts,cut_t) if t>=c/sr)
tw=[{'w':w['w'],'a':round(F(w['a']),3),'b':round(F(w['b']),3)} for w in words]
D=len(vo)/sr
pauses=[{'t0':round(F(c/sr)-sec,3),'t1':round(F(c/sr),3)} for (c,sec,_) in cuts]
json.dump({'duration':round(D,3),'pre':PRE,'words':tw,'pauses':pauses},open('timeline_full.json','w'))
json.dump({'duration':round(D,3),'pre':PRE,'words':tw},open('video3d/timeline.json','w'))
print('dur',D); print(' '.join(f"{x['w']}@{x['a']:.2f}" for x in tw))
