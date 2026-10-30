import sys
from PIL import Image
fs=sys.argv[2:]; ims=[Image.open(f).resize((405,720)) for f in fs]
sh=Image.new('RGB',(405*len(ims),720))
for i,im in enumerate(ims): sh.paste(im,(i*405,0))
sh.save(sys.argv[1])
