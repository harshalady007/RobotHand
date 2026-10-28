import json
W=json.load(open('/home/claude/osama/words_edit.json'))
def wa(w,n=1):
    k=0
    for x in W:
        if x['w'].strip('.,?!').lower()==w:
            k+=1
            if k==n: return x['a']
PRE=0.9
CUTS=[wa('may')-.08, 41.69]   # after "changed." and after "compound."
INS=[0.40,0.35]
print('cuts',CUTS)
def F(t): return PRE+t+sum(i for c,i in zip(CUTS,INS) if t>=c)
out=[{'w':x['w'],'a':round(F(x['a']),3),'b':round(F(x['b']),3)} for x in W]
voD=68.762
D=round(F(voD)+1.2,3)
json.dump({'duration':D,'pre':PRE,'cuts':CUTS,'ins':INS,'words':out},open('/home/claude/osama3d/timeline.json','w'))
print('dur',D)
