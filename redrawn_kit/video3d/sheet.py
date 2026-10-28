import sys, glob
from PIL import Image, ImageDraw
ts=sys.argv[1].split(','); out=sys.argv[2]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 8
ims=[Image.open(f'stills/s_{float(t):05.2f}.jpg').resize((270,480)) for t in ts]
rows=(len(ims)+cols-1)//cols; S=Image.new('RGB',(cols*270,rows*500),'black'); d=ImageDraw.Draw(S)
for i,(im,t) in enumerate(zip(ims,ts)): x,y=(i%cols)*270,(i//cols)*500; S.paste(im,(x,y)); d.text((x+5,y+482),t,fill='white')
S.save(out,quality=85)
