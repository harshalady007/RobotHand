import json, re
asr=json.load(open('asr_words.json'))
script="""For nearly ten years, the world's most wanted terrorist remained at large. Then, one night, everything changed.
May 1, 2011.|2 Abbottabad, Pakistan. While much of the world slept, American helicopters crossed into Pakistani airspace,|2 carrying an elite team on a secret mission.
Their target? Osama bin Laden, the mastermind|2 behind the September 11th attacks. But how did they find him?
Intelligence analysts had spent years tracing his trusted couriers. Eventually, that trail led them to a mysterious compound surrounded by high walls, with no obvious signs of ordinary life.
After months of surveillance, the mission was approved. Under the cover of darkness, US|2 Navy SEALs entered the compound.
The raid lasted less than an hour. Bin_Laden was killed and his body was taken away for identification.
Hours later, President Barack Obama announced the news to the world. After nearly a decade of searching, the hunt was over.
But one question remains. How had the world's most wanted man been hiding in plain sight, so close to a major Pakistani military academy?
This is Redrawn.Stories,|3 where history reveals the stories behind world-changing|2 events."""
toks=[]
for w in script.split():
    if '|' in w: t,n=w.split('|'); toks.append((t,int(n)))
    else: toks.append((w,1))
print(sum(n for _,n in toks),len(asr)); assert sum(n for _,n in toks)==len(asr)
out=[];i=0
for t,n in toks: out.append({'w':t.replace('_',' '),'a':asr[i]['a']}); i+=n
for k,w in enumerate(out):
    w['b']=out[k+1]['a'] if k+1<len(out) else w['a']+0.6
    if re.search(r'[.?!]$',w['w']): w['b']=min(w['b'],w['a']+0.75)
json.dump(out,open('words_edit.json','w'))
print(' '.join(f"{x['w']}@{x['a']:.2f}" for x in out))
