# script + ASR times + dramatic pauses -> w/vo_final.wav, video3d/timeline.json, timeline_full.json  (9/11 reel)
import json, re, numpy as np, soundfile as sf
asr=json.load(open('w/asr_words.json'))
script="""8:46|3 AM,|2 a normal Tuesday. Then, the world stopped. September 11,|1 2001.|3 19 Al_Qaeda hijackers took over four passenger planes in one coordinated|2 attack against the United States. Two planes struck the twin towers in New York City. A third hit the Pentagon and the fourth crashed in Pennsylvania after passengers fought back. Both towers fell and 2,977|6 people lost their lives. America launched the war on terror. U.S.|2 forces invaded Afghanistan and airport security changed across the world. One morning, thousands of lives lost, a world that would never be the same. Never forget. Follow Redrawn Stories."""
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
nz=lambda s: re.sub(r"[^A-Za-z0-9']",'',s).lower()
def idx(txt,nth=1):
    k=0
    for j,w in enumerate(words):
        if nz(w['w'])==nz(txt):
            k+=1
            if k==nth: return j
    raise Exception(txt)
# nth occurrences (case-insens.): Then1 19(1) Two1 Both1 America1 One2("one coordinated" is #1) Never2("never be" is #1) Follow1
P=[(idx('Then'),.34),(idx('19'),.14),(idx('Two'),.22),(idx('Both'),.30),(idx('America'),.26),(idx('One',2),.36),(idx('Never',2),.42),(idx('Follow'),.34)]
for j,_ in P: print('pause before',words[j]['w'],'| asr:',asr[words[j]['i0']]['w'],words[j]['a'])
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
