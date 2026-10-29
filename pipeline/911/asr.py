import sherpa_onnx, soundfile as sf, numpy as np
d='w/sherpa-onnx-whisper-base.en/'
rec=sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d+'base.en-encoder.int8.onnx',decoder=d+'base.en-decoder.int8.onnx',tokens=d+'base.en-tokens.txt',num_threads=2)
a,sr=sf.read('w/vo16.wav',dtype='float32')
# chunk on silences to <=25s
hop=160; rms=np.array([np.sqrt(np.mean(a[i:i+hop]**2)) for i in range(0,len(a)-hop,hop)])
sil=rms<0.02*rms.max()
# find silence runs >=0.25s
runs=[];i=0
while i<len(sil):
    if sil[i]:
        k=i
        while k<len(sil) and sil[k]: k+=1
        if (k-i)*hop/sr>=0.2: runs.append(((i+k)//2)*hop/sr)
        i=k
    else: i+=1
cuts=[0];
for r in runs:
    if r-cuts[-1]>8: cuts.append(r)
cuts.append(len(a)/sr)
out=[]
for s,e in zip(cuts[:-1],cuts[1:]):
    st=rec.create_stream(); st.accept_waveform(sr,a[int(s*sr):int(e*sr)]); rec.decode_stream(st)
    r=st.result; print(f'[{s:6.2f}-{e:6.2f}] {r.text}'); out.append((s,e,r.text))
print('timestamps attr:', getattr(r,'timestamps',None)[:5] if getattr(r,'timestamps',None) else None)
