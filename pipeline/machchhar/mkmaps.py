# Natural Earth (India point-of-view) -> flat map plane texture for the Dubai / Tel Aviv / Tabuk story.
# PoK + Aksai Chin sit inside India's boundary, hatched and labelled "occupied by Pakistan / China".
import json, math
from PIL import Image, ImageDraw, ImageFont, ImageChops
from shapely.geometry import shape, box
from shapely.ops import unary_union
C=json.load(open('ne/ne_10m_admin_0_countries_ind.geojson'))['features']
D=json.load(open('ne/ne_10m_admin_0_disputed_areas.geojson'))['features']
COS=math.cos(math.radians(27))
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
PAL={'IND':'#ffc27a','PAK':'#9bd98f','CHN':'#f3b0a4','AFG':'#ecd581','NPL':'#c9b9e8','SAU':'#efd9a0','ARE':'#f4c9a0','ISR':'#bcd7f5','JOR':'#e3c8dc','EGY':'#f0e2b0','IRN':'#d7c8c0','IRQ':'#e8d0c0','OMN':'#e8d8b8','SYR':'#d9e6c0','LBN':'#c8e6d8','TUR':'#e6e0c0','YEM':'#e9d6c0','KWT':'#e0e0b0','QAT':'#e8d0c8','BHR':'#e8d0c8','PSE':'#f5e0e0','LKA':'#cfe3b0','BGD':'#bfe0c8','TKM':'#e7cfa0','UZB':'#e9dcb5'}
def mk(name,lon0,lon1,lat0,lat1,W,labels):
    s=W/((lon1-lon0)*COS); H=int((lat1-lat0)*s)
    SS=2; w,h=W*SS,H*SS; k=s*SS
    P=lambda lon,lat:((lon-lon0)*COS*k,(lat1-lat)*k)
    img=Image.new('RGB',(w,h),'#a7d8f0'); d=ImageDraw.Draw(img)
    clip=box(lon0-1,lat0-1,lon1+1,lat1+1)
    def polys(g):
        g=g.intersection(clip)
        if g.is_empty: return []
        return list(g.geoms) if hasattr(g,'geoms') else [g]
    for f in C:
        g=shape(f['geometry']); col=PAL.get(f['properties']['ADM0_A3'],'#e6ddc8')
        if not g.intersects(clip): continue
        for p in polys(g):
            if p.geom_type=='Polygon': d.polygon([P(*c) for c in p.exterior.coords],fill=col)
    def hatch(geom,col,gap=22):
        m=Image.new('L',(w,h),0); md=ImageDraw.Draw(m)
        for p in polys(geom):
            if p.geom_type=='Polygon': md.polygon([P(*c) for c in p.exterior.coords],fill=255)
        hp=Image.new('L',(w,h),0); hd=ImageDraw.Draw(hp)
        for x in range(-h,w+h,gap*SS): hd.line([(x,0),(x+h,h)],fill=255,width=4*SS//2)
        img.paste(Image.new('RGB',(w,h),col),(0,0),ImageChops.multiply(m,hp))
    pak=unary_union([shape(f['geometry']) for f in D if f['properties'].get('BRK_A3') in('B08','B09')])
    chn=unary_union([shape(f['geometry']) for f in D if f['properties'].get('BRK_A3') in('B07','B06')])
    hatch(pak,'#157a2a'); hatch(chn,'#b3231c')
    for f in C:
        g=shape(f['geometry'])
        if not g.intersects(clip): continue
        for p in polys(g):
            if p.geom_type=='Polygon': d.line([P(*c) for c in p.exterior.coords],fill='#3a2a22',width=int(3.0*SS),joint='curve')
    img=img.resize((W,H),Image.LANCZOS)
    P2=lambda lon,lat:((lon-lon0)*COS*s,(lat1-lat)*s)
    for (txt,lon,lat,sz,col,rot) in labels:
        f=ImageFont.truetype(FONT,sz); x,y=P2(lon,lat)
        tmp=Image.new('RGBA',(10,10)); td=ImageDraw.Draw(tmp); bb=td.textbbox((0,0),txt,font=f); tw,th=bb[2]-bb[0],bb[3]-bb[1]
        t2=Image.new('RGBA',(tw+40,th+40),(0,0,0,0)); t2d=ImageDraw.Draw(t2)
        t2d.text((20-bb[0],20-bb[1]),txt,font=f,fill=col,stroke_width=max(3,sz//9),stroke_fill='#ffffff')
        t2=t2.rotate(rot,expand=True,resample=Image.BICUBIC)
        img.paste(t2,(int(x-t2.width/2),int(y-t2.height/2)),t2)
    img.save(f'video3d/assets/{name}.png')
    json.dump({'lon0':lon0,'lon1':lon1,'lat0':lat0,'lat1':lat1,'W':W,'H':H,'cos':COS},open(f'video3d/assets/{name}.json','w'))
    print(name,W,H)
mk('map_me',26,82,6,42,4096,[
 ('INDIA',78.5,22,80,'#7a3b00',0),('PAKISTAN',68.5,29,50,'#0b4d1c',0),('SAUDI ARABIA',44,24,62,'#6b5200',0),('UAE',54.2,23.6,30,'#7a3b00',0),
 ('ISRAEL',34.9,31.2,17,'#1d4a78',90),('JORDAN',36.8,31.3,21,'#6a2a5a',0),('IRAN',55,32,60,'#5a4a42',0),('IRAQ',43.5,33,36,'#6a4a3a',0),('EGYPT',30,26.5,42,'#6b5a20',0),
 ('OMAN',57.5,20.2,32,'#6b5a20',0),('AFGHANISTAN',66.5,34.4,28,'#6b5700',0),('CHINA',82,38,44,'#7a1410',0),
 ('occupied by',73.6,36.9,15,'#0b4d1c',0),('Pakistan',73.6,36.2,18,'#0b4d1c',0),('occupied by',79.6,34.6,13,'#7a1410',0),('China',79.6,34.0,16,'#7a1410',0)])
