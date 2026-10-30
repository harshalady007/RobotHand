import json, re, numpy as np, soundfile as sf
asr=json.load(open('w/asr_words.json'))
script="""Who rules the Middle East? Wrong question. Here's why. Saudi Arabia. The oil, the cash, the holiest sites in Islam. Israel, the sharpest intelligence, the strongest army in the region. Iran, no need for a front line, its proxies are everywhere. Turkey, a massive army and an empire's ambition. And the United States, bases in the region, allies on every side. Always in the room. Here's the twist. Not one of them holds the whole map. Money, weapons, faith, alliances, all crashing into each other. Nobody owns the board. Everyone is playing for it. So, who really rules the|2 Middle East? Nobody. And that's exactly why it never stops. Follow Redrawn Stories for the real power plays behind the headlines."""
toks=[]
for w in script.split():
    if '|' in w: t,n=w.split('|'); toks.append((t,int(n)))
    else: toks.append((w,1))
# ceasefire|2 and lifeline|2 given above; "they're a lifeline|2" -> 'lifeline' 2 words. ok
n=sum(n for _,n in toks); print(n,len(asr)); assert n==len(asr)
words=[];i=0
for t,k in toks:
    words.append({'w':t.replace('_',' '),'a':asr[i]['a'],'i0':i}); i+=k
for k,w in enumerate(words):
    w['b']=words[k+1]['a'] if k+1<len(words) else w['a']+0.7
    if re.search(r'[.?!]$',w['w']): w['b']=min(w['b'],w['a']+0.75)
# dramatic pauses
def idx(txt,nth=1):
    k=0
    for j,w in enumerate(words):
        if w['w'].strip('.,?!').lower()==txt.lower():
            k+=1
            if k==nth: return j
    raise Exception(txt)
P=[(idx('Wrong'),.28),(idx('Here\'s',2),.30),(idx('Not'),.22),(idx('Nobody',1),.28),(idx('So'),.30),(idx('Nobody',2),.45),(idx('Follow'),.34)]
a,sr=sf.read('w/ve48.wav',dtype='float32')
PRE=.30; ENDT=2.4
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
# words right before a cut: keep b <= cut start
D=len(vo)/sr
pauses=[{'t0':round(F(c/sr)-sec,3),'t1':round(F(c/sr),3)} for (c,sec,_) in cuts]
json.dump({'duration':round(D,3),'pre':PRE,'words':tw,'pauses':pauses},open('w/timeline_full.json','w'))
json.dump({'duration':round(D,3),'pre':PRE,'words':tw},open('video3d/timeline.json','w'))
print('dur',D); print(' '.join(f"{x['w']}@{x['a']:.2f}" for x in tw))
