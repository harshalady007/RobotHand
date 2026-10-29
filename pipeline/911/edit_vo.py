# vo_orig.mp3 -> vo_tight.wav (48k mono): gaps >.38s -> .20s, .14-.38s -> .08s (cut from the middle of the gap)
import subprocess, numpy as np, soundfile as sf
subprocess.run(['ffmpeg','-y','-v','error','-i','w/vo_orig.mp3','-ar','48000','-ac','1','w/vo48_raw.wav'],check=True)
a,sr=sf.read('w/vo48_raw.wav',dtype='float32')
hop=int(.01*sr); n=len(a)//hop
rms=np.array([np.sqrt(np.mean(a[i*hop:(i+1)*hop]**2)) for i in range(n)])
sil=rms<0.012*rms.max()
out=[];i=0;pos=0
while i<n:
    if sil[i]:
        k=i
        while k<n and sil[k]: k+=1
        g=(k-i)*.01
        tgt=.20 if g>.38 else (.08 if g>=.14 else g)
        if i==0: tgt=0
        keep=int(tgt*sr); s=i*hop; e=k*hop
        if tgt<g:
            h=keep//2; out.append(a[pos:s+h]); pos=e-(keep-h)
        i=k
    else: i+=1
out.append(a[pos:])
v=np.concatenate(out); sf.write('w/vo_tight.wav',v,sr); print(len(a)/sr,'->',len(v)/sr)
