# Natural Earth (India point-of-view) -> equirectangular globe texture. PoK + Aksai Chin sit inside India's boundary, hatched.
import json, math, hashlib
from PIL import Image, ImageDraw, ImageChops
from shapely.geometry import shape
from shapely.ops import unary_union
C=json.load(open('ne/ne_10m_admin_0_countries_ind.geojson'))['features']
D=json.load(open('ne/ne_10m_admin_0_disputed_areas.geojson'))['features']
W,H,SS=6144,3072,2
w,h=W*SS,H*SS
P=lambda lon,lat:((lon+180)/360*w,(90-lat)/180*h)
PAL=['#f3e2b8','#e9d7a8','#f2d3b0','#e3e8b8','#d9e8c4','#f0dcc8','#ead9b5','#e6e0c0']
FIX={'USA':'#6fa8ee','CAN':'#9cc4f4','MEX':'#8fb8f0','CHN':'#f08a7c','RUS':'#e8a39f','IND':'#ffc27a','PAK':'#9bd98f','JPN':'#f7d56a','KOR':'#a9d68f','PRK':'#d9b0a0','DEU':'#b9c8f0','GBR':'#b9c8f0','FRA':'#b9c8f0','ITA':'#b9c8f0','ESP':'#b9c8f0','POL':'#b9c8f0','TUR':'#c9d6a0','AUS':'#f4cf8e','IRN':'#d7c0b8','SAU':'#efd9a0','QAT':'#efd9a0','ARE':'#efd9a0','BHR':'#efd9a0'}
img=Image.new('RGB',(w,h),'#8fd3f4'); d=ImageDraw.Draw(img)
for lon in range(-180,181,30): d.line([P(lon,-90),P(lon,90)],fill='#7cc6ec',width=3*SS)
for lat in range(-60,91,30): d.line([P(-180,lat),P(180,lat)],fill='#7cc6ec',width=3*SS)
def polys(g): return list(g.geoms) if hasattr(g,'geoms') else [g]
for f in C:
    a3=f['properties']['ADM0_A3']
    if a3=='ATA': col='#f4f8fc'
    else: col=FIX.get(a3) or PAL[int(hashlib.md5(a3.encode()).hexdigest(),16)%len(PAL)]
    for p in polys(shape(f['geometry'])):
        if p.geom_type!='Polygon': continue
        d.polygon([P(*c) for c in p.exterior.coords],fill=col)
def hatch(geom,col,gap=14,ang=1):
    m=Image.new('L',(w,h),0); md=ImageDraw.Draw(m)
    for p in polys(geom):
        if p.geom_type=='Polygon': md.polygon([P(*c) for c in p.exterior.coords],fill=255)
    bb=m.getbbox()
    if not bb: return
    hp=Image.new('L',(w,h),0); hd=ImageDraw.Draw(hp)
    for x in range(bb[0]-(bb[3]-bb[1]),bb[2]+(bb[3]-bb[1]),gap*SS): hd.line([(x,bb[1]),(x+(bb[3]-bb[1])*ang,bb[3])],fill=255,width=3*SS)
    img.paste(Image.new('RGB',(w,h),col),(0,0),ImageChops.multiply(m,hp))
pak=unary_union([shape(f['geometry']) for f in D if f['properties'].get('BRK_A3') in('B08','B09')])
chn=unary_union([shape(f['geometry']) for f in D if f['properties'].get('BRK_A3') in('B07','B06')])
hatch(pak,'#157a2a'); hatch(chn,'#b3231c')
for f in C:
    for p in polys(shape(f['geometry'])):
        if p.geom_type=='Polygon': d.line([P(*c) for c in p.exterior.coords],fill='#4a3226',width=int(2.4*SS),joint='curve')
img=img.resize((W,H),Image.LANCZOS)
img.save('video3d/assets/map_world.png')
json.dump({'W':W,'H':H},open('video3d/assets/map_world.json','w'))
print('ok',img.size)
# US lower-48 outline for the glowing "borders" ring
usa=[shape(f['geometry']) for f in C if f['properties']['ADM0_A3']=='USA'][0]
big=max(polys(usa),key=lambda p:p.area)
big=big.simplify(.12)
json.dump({'us':[list(c) for c in big.exterior.coords]},open('video3d/assets/us_outline.json','w'))
print('us pts',len(big.exterior.coords))
