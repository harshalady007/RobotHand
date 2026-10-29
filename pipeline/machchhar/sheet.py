import sys,glob
from PIL import Image, ImageDraw
fs=sys.argv[2:]; out=sys.argv[1]
n=len(fs); cols=min(n,6); w,h=216,384
rows=(n+cols-1)//cols
S=Image.new('RGB',(cols*w,rows*(h+0)),'#000')
for i,f in enumerate(fs):
    im=Image.open(f).resize((w,h)); d=ImageDraw.Draw(im); d.text((6,6),f.split('_')[-1][:-4],fill='#ff0')
    S.paste(im,((i%cols)*w,(i//cols)*h))
S.save(out)
