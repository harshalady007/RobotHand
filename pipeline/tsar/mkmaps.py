# Natural Earth (India-POV countries) -> video3d/assets/map_arctic.png/json + earth.png.  run from pipeline/tsar
import json, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from shapely.geometry import shape, box
C=json.load(open('ne/ne_10m_admin_0_countries_ind.geojson'))['features']
LAND=json.load(open('ne/ne_110m_land.geojson'))['features']
FONT='work/mont900.ttf'
# ---------------- Earth equirect ----------------
def earth():
    W,H=2048,1024; SS=1
    img=Image.new('RGB',(W,H),'#2f94e6'); d=ImageDraw.Draw(img)
    # soft ocean bands
    for y in range(H):
        lat=90-y/H*180; k=min(1,abs(lat)/90)
        d.line([(0,y),(W,y)],fill=(int(47+60*k**3),int(148+40*k**3),int(230+10*k)))
    P=lambda lon,lat:((lon+180)/360*W,(90-lat)/180*H)
    for f in LAND:
        g=shape(f['geometry']); polys=list(g.geoms) if hasattr(g,'geoms') else [g]
        for p in polys:
            pts=[P(*c) for c in p.exterior.coords]
            cen=p.centroid
            d.polygon(pts,fill='#7cc65a')
            for h in p.interiors: d.polygon([P(*c) for c in h.coords],fill='#2f94e6')
    # polar ice / greenland / deserts tint by latitude
    ov=Image.new('RGBA',(W,H),(0,0,0,0)); od=ImageDraw.Draw(ov)
    for f in LAND:
        g=shape(f['geometry']); polys=list(g.geoms) if hasattr(g,'geoms') else [g]
        for p in polys:
            c=p.centroid
            col=None
            if c.y<-62 or (c.y>60 and c.x<-20 and c.x>-60 and p.area>100): col=(246,250,255,255)
            elif 15<c.y<32 and -17<c.x<50 and p.area>500: col=(228,208,140,235)
            elif c.y>55 and p.area>300: col=(205,226,200,255)
            if col: od.polygon([P(*q) for q in p.exterior.coords],fill=col)
    img=Image.alpha_composite(img.convert('RGBA'),ov).convert('RGB')
    img.save('video3d/assets/earth.png'); print('earth')
# ---------------- Arctic map ----------------
COS=math.cos(math.radians(69))
PAL={'RUS':'#f7b08f','FIN':'#8fcdf2','NOR':'#f09aa0','SWE':'#f4e38a','EST':'#cfe3b0','LVA':'#d7e7a8','LTU':'#cfe3b0','BLR':'#d6c6ea','UKR':'#f6e7a0','POL':'#e8d0c8','DNK':'#e8d0c8','ISL':'#e6eef8','GRL':'#f1f6fb','KAZ':'#e2e8c0','GBR':'#e8d8c0','IRL':'#cfe3b0','DEU':'#e0d6c4','NLD':'#e0d6c4','CZE':'#e0d6c4'}
def arctic(lon0=8,lon1=76,lat0=54,lat1=82,W=2048):
    s=W/((lon1-lon0)*COS); H=int((lat1-lat0)*s); SS=2; w,h=W*SS,H*SS; k=s*SS
    P=lambda lon,lat:((lon-lon0)*COS*k,(lat1-lat)*k)
    img=Image.new('RGB',(w,h),'#a3d9f4'); d=ImageDraw.Draw(img)
    clip=box(lon0-2,lat0-2,lon1+2,lat1+2)
    def polys(g):
        g=g.intersection(clip)
        if g.is_empty: return []
        return list(g.geoms) if hasattr(g,'geoms') else [g]
    for f in C:
        g=shape(f['geometry'])
        if not g.intersects(clip): continue
        col=PAL.get(f['properties']['ADM0_A3'],'#e6ddc8')
        for p in polys(g):
            if p.geom_type!='Polygon': continue
            d.polygon([P(*c) for c in p.exterior.coords],fill=col)
            for hole in p.interiors: d.polygon([P(*c) for c in hole.coords],fill='#a3d9f4')
    for f in C:
        g=shape(f['geometry'])
        if not g.intersects(clip): continue
        for p in polys(g):
            if p.geom_type=='Polygon': d.line([P(*c) for c in p.exterior.coords],fill='#4a3a30',width=int(3*SS),joint='curve')
    img=img.resize((W,H),Image.LANCZOS); d=ImageDraw.Draw(img)
    P2=lambda lon,lat:((lon-lon0)*COS*s,(lat1-lat)*s)
    def lab(txt,lon,lat,sz,col,rot=0):
        f=ImageFont.truetype(FONT,sz); x,y=P2(lon,lat)
        tmp=Image.new('RGBA',(W,H),(0,0,0,0)); td=ImageDraw.Draw(tmp); bb=td.textbbox((0,0),txt,font=f); tw,th=bb[2]-bb[0],bb[3]-bb[1]
        t2=Image.new('RGBA',(tw+40,th+40),(0,0,0,0)); t2d=ImageDraw.Draw(t2); t2d.text((20-bb[0],20-bb[1]),txt,font=f,fill=col,stroke_width=max(4,sz//9),stroke_fill='#ffffff')
        t2=t2.rotate(rot,expand=True,resample=Image.BICUBIC); img.paste(t2,(int(x-t2.width/2),int(y-t2.height/2)),t2)
    for t in [('RUSSIA',50,63,92,'#7a2a10',0),('FINLAND',26.5,65.2,50,'#0b4a78',-80),('NORWAY',13.5,67.5,46,'#7a1420',-60),('SWEDEN',16.5,63.0,44,'#6b5700',-75),('BARENTS SEA',40,73.2,44,'#1d5a8a',8),('KARA SEA',72,74.5,40,'#1d5a8a',0),('NORWEGIAN SEA',9.5,72.5,34,'#1d5a8a',0),('Novaya Zemlya',57.5,76.8,32,'#7a2a10',-48),('BELARUS',28,53.9,30,'#4b3a7a',0)]:
        lab(*t)
    img.save('video3d/assets/map_arctic.png')
    meta={'lon0':lon0,'lon1':lon1,'lat0':lat0,'lat1':lat1,'W':W,'H':H,'cos':COS,'k':s}
    json.dump(meta,open('video3d/assets/map_arctic.json','w')); print('arctic',W,H)
import os; os.makedirs('video3d/assets',exist_ok=True)
earth(); arctic()
