import sherpa_onnx, soundfile as sf, numpy as np, json
d='w/sherpa-onnx-zipformer-en-2023-06-26/'
rec=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=d+'encoder-epoch-99-avg-1.int8.onnx',decoder=d+'decoder-epoch-99-avg-1.int8.onnx',joiner=d+'joiner-epoch-99-avg-1.int8.onnx',tokens=d+'tokens.txt',num_threads=2,decoding_method='greedy_search')
a,sr=sf.read('w/ve16.wav',dtype='float32')
hop=160; rms=np.array([np.sqrt(np.mean(a[i:i+hop]**2)) for i in range(0,len(a)-hop,hop)])
sil=rms<0.02*rms.max(); runs=[];i=0
while i<len(sil):
    if sil[i]:
        k=i
        while k<len(sil) and sil[k]: k+=1
        if (k-i)*hop/sr>=0.18: runs.append(((i+k)//2)*hop/sr)
        i=k
    else: i+=1
cuts=[0]
for r in runs:
    if r-cuts[-1]>6: cuts.append(r)
cuts.append(len(a)/sr)
words=[]
for s,e in zip(cuts[:-1],cuts[1:]):
    st=rec.create_stream(); st.accept_waveform(sr,a[int(s*sr):int(e*sr)]); rec.decode_stream(st); r=st.result
    cur=None
    for tok,ts in zip(r.tokens,r.timestamps):
        if tok.startswith(('▁',' ')) or cur is None:
            if cur: words.append(cur)
            cur={'w':tok.replace('▁','').strip(),'a':round(s+ts,3)}
        else: cur['w']+=tok
    if cur: words.append(cur)
    print(f'[{s:.2f}-{e:.2f}]',r.text)
json.dump(words,open('w/asr_words.json','w'))
print(len(words)); print([(w['w'],w['a']) for w in words[:12]])
