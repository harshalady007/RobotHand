import json, re, numpy as np, soundfile as sf
asr=json.load(open('asr_words.json'))
script="""One valley, two nations, both willing to fight for it. This is Kashmir. In 1947,|3 Britain split India in two and left Kashmir undecided. Within months, India and Pakistan were at war, then again, and again. In 1972,|3 the fighting froze into a line. The line of control, not a border, a ceasefire|2 that never ended. But why does this valley matter so much? Water. The rivers that feed the Indus flow through Kashmir. For Pakistan, they're a lifeline|2 for farms and cities. For India, their power, irrigation, and control upstream. Location. Kashmir sits where South Asia meets China, Afghanistan, and Central Asia. Whoever holds these mountains holds the high ground, from Siachen, the world's highest battlefield, to the passes below. And identity. For India, it's a crown it won't give up. For Pakistan, it's the unfinished story of its birth. Add China, which holds Aksai_Chin|2 to the east, and you get three nuclear powers around one valley, with millions of people living in between. So, is Kashmir a bridge to peace, or the fuse to a bigger conflict? Follow Redrawn Stories. The world was never drawn once."""
# fix: lifeline & ceasefire are 2 asr words; handle tokens
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
# dramatic pauses: (word text/occurrence -> seconds)
def idx(txt,nth=1):
    k=0
    for j,w in enumerate(words):
        if w['w'].strip('.,?!').lower()==txt.lower():
            k+=1
            if k==nth: return j
    raise Exception(txt)
P=[(idx('This'),.32),(idx('Not'),.18),(idx('But'),.30),(idx('Water'),.38),(idx('Location'),.22),(idx('And'),.22),(idx('Add'),.2),(idx('So',2),.42),(idx('Follow'),.30)]
# 'And' first occurrence is "and left"? choose "And identity" explicitly
P=[(j,s) for j,s in P]
for j,w in enumerate(words):
    if w['w']=='And' : P[5]=(j,.22)
a,sr=sf.read('ve48.wav',dtype='float32')
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
sf.write('vo_final.wav',vo,sr)
cut_t=[c/sr for c,_,_ in cuts]
def F(t): return PRE+t+sum(s for (c,s,_),ct in zip(cuts,cut_t) if t>=c/sr)
tw=[{'w':w['w'],'a':round(F(w['a']),3),'b':round(F(w['b']),3)} for w in words]
# words right before a cut: keep b <= cut start
D=len(vo)/sr
pauses=[{'t0':round(F(c/sr)-sec,3),'t1':round(F(c/sr),3)} for (c,sec,_) in cuts]
json.dump({'duration':round(D,3),'pre':PRE,'words':tw,'pauses':pauses},open('timeline_full.json','w'))
json.dump({'duration':round(D,3),'pre':PRE,'words':tw},open('video3d/timeline.json','w'))
print('dur',D); print(' '.join(f"{x['w']}@{x['a']:.2f}" for x in tw))
