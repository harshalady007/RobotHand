import numpy as np, soundfile as sf, subprocess
subprocess.run(['ffmpeg','-v','error','-y','-i','vo_orig.mp3','-ar','48000','-ac','1','vo48.wav'])
a,sr=sf.read('vo48.wav',dtype='float32')
hop=int(sr*.01); rms=np.array([np.sqrt(np.mean(a[i:i+hop]**2)) for i in range(0,len(a)-hop,hop)])
thr=0.018*rms.max(); sil=rms<thr
# silence runs
runs=[];i=0
while i<len(sil):
    if sil[i]:
        k=i
        while k<len(sil) and sil[k]: k+=1
        runs.append((i,k)); i=k
    else: i+=1
keep=[];cur=0; log=[]
for (i,k) in runs:
    d=(k-i)*.01
    if i==0: cur=max(0,k*hop-int(.05*sr)); continue
    if d<0.14: continue
    tgt=0.24 if d>0.38 else 0.11
    s=i*hop+int(.03*sr); e=k*hop-int(.03*sr)
    keep.append((cur,s)); # speech up to silence start
    cur=e-int((tgt-.06)*sr) if e-int((tgt-.06)*sr)>s else e
    log.append((round(i*.01,2),round(d,2),tgt))
keep.append((cur,len(a)))
parts=[]
for s,e in keep:
    seg=a[s:e].copy()
    f=int(.008*sr); seg[:f]*=np.linspace(0,1,f); seg[-f:]*=np.linspace(1,0,f)
    parts.append(seg)
out=np.concatenate(parts); sf.write('vo_tight.wav',out,sr)
print('orig',len(a)/sr,'tight',len(out)/sr, 'gaps',len(log))
