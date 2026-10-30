# Natural Earth (India point-of-view) -> Middle East table map + one transparent overlay per power.
# Frame is lon 24..64 / lat 8..43, so Kashmir (PoK / Aksai Chin) is out of frame; the India-POV file is still used.
import json, math
from PIL import Image, ImageDraw, ImageFont
from shapely.geometry import shape, box
C=json.load(open('ne/ne_10m_admin_0_countries_ind.geojson'))['features']
COS=math.cos(math.radians(27)); FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
lon0,lon1,lat0,lat1,W=24,64,8,43,3072
s=W/((lon1-lon0)*COS); H=int((lat1-lat0)*s); SS=2; w,h=W*SS,H*SS; k=s*SS
P=lambda lon,lat:((lon-lon0)*COS*k,(lat1-lat)*k)
clip=box(lon0-1,lat0-1,lon1+1,lat1+1)
def polys(g):
    g=g.intersection(clip)
    if g.is_empty: return []
    return list(g.geoms) if hasattr(g,'geoms') else [g]
def draw(d,codes,fill=None,line=None,lw=3):
    for f in C:
        if codes is not None and f['properties']['ADM0_A3'] not in codes: continue
        g=shape(f['geometry'])
        if not g.intersects(clip): continue
        for p in polys(g):
            if p.geom_type!='Polygon': continue
            pts=[P(*c) for c in p.exterior.coords]
            if fill: d.polygon(pts,fill=fill)
            if line: d.line(pts,fill=line,width=int(lw*SS),joint='curve')
# neutral base: sand land, blue sea, thin borders
img=Image.new('RGB',(w,h),'#a7d8f0'); d=ImageDraw.Draw(img)
draw(d,None,fill='#f1e3bb',line='#8a7452',lw=2.2)
labels=[('SAUDI ARABIA',44.5,24,58),('IRAN',54,32.2,64),('IRAQ',43.8,33,36),('TURKEY',35.5,39,44),('EGYPT',30,26.5,42),('SYRIA',38.5,35,26),('YEMEN',47.5,15.8,30),('OMAN',57,20.5,32),('UAE',54.3,23.7,22),('JORDAN',36.7,30.7,18),('ISRAEL',34.9,31.2,14),('KUWAIT',47.6,29.3,14),('QATAR',51.2,25.35,13),('LIBYA',27,29.5,28),('SUDAN',30,16,34),('AFGHANISTAN',63,34.5,20)]
def lab(img,txt,lon,lat,sz,col='#6b5a3a'):
    f=ImageFont.truetype(FONT,sz); x,y=(lon-lon0)*COS*s,(lat1-lat)*s
    d2=ImageDraw.Draw(img); bb=d2.textbbox((0,0),txt,font=f); d2.text((x-(bb[2]-bb[0])/2,y-(bb[3]-bb[1])/2),txt,font=f,fill=col,stroke_width=max(2,sz//12),stroke_fill='#fff6df')
img=img.resize((W,H),Image.LANCZOS)
for t in labels: lab(img,*t)
img.save('video3d/assets/map_me.png')
json.dump({'lon0':lon0,'lon1':lon1,'lat0':lat0,'lat1':lat1,'W':W,'H':H,'cos':COS},open('video3d/assets/map_me.json','w'))
def overlay(name,codes,col,edge):
    o=Image.new('RGBA',(w,h),(0,0,0,0)); od=ImageDraw.Draw(o)
    draw(od,codes,fill=col,line=edge,lw=4.5)
    o=o.resize((W,H),Image.LANCZOS); o.save(f'video3d/assets/ov_{name}.png')
overlay('sa',{'SAU'},(46,170,86,235),(255,255,255,255))
overlay('il',{'ISR'},(60,130,240,255),(255,255,255,255))
overlay('ir',{'IRN'},(226,70,50,235),(255,255,255,255))
overlay('tr',{'TUR'},(245,140,25,245),(255,255,255,255))
overlay('ott',{'TUR','SYR','LBN','ISR','PSE','JOR','IRQ','EGY','YEM','KWT'},(255,214,70,215),(255,240,170,255))
print(W,H)
