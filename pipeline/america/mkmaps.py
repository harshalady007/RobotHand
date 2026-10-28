import json, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from shapely.geometry import shape, box, LineString, MultiLineString
from shapely.ops import unary_union
C=json.load(open('ne/ne_10m_admin_0_countries_ind.geojson'))['features']
D=json.load(open('ne/ne_10m_admin_0_disputed_areas.geojson'))['features']
R=json.load(open('ne/ne_10m_rivers_lake_centerlines.geojson'))['features']
LK=json.load(open('ne/ne_10m_lakes.geojson'))['features']
COS=math.cos(math.radians(34))
PAL={'IND':'#ffc27a','PAK':'#9bd98f','CHN':'#f3877a','AFG':'#ecd581','NPL':'#c9b9e8','BTN':'#e8c0a0','TJK':'#b9d5ee','KGZ':'#c5e6cf','UZB':'#e9dcb5','TKM':'#e7cfa0','KAZ':'#e2e8c0','IRN':'#d7c8c0','MMR':'#cfe3b0','BGD':'#bfe0c8','OMN':'#e8d8b8','ARE':'#e8d8b8','MNG':'#dfd5c0','LKA':'#cfe3b0'}
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
    # paper land base
    for f in C:
        g=shape(f['geometry']); col=PAL.get(f['properties']['ADM0_A3'],'#e6ddc8')
        if not g.intersects(clip): continue
        for p in polys(g):
            if p.geom_type!='Polygon': continue
            d.polygon([P(*c) for c in p.exterior.coords],fill=col)
    # lakes
    for f in LK:
        g=shape(f['geometry'])
        if g.intersects(clip):
            for p in polys(g):
                if p.geom_type=='Polygon' and p.area>0.05: d.polygon([P(*c) for c in p.exterior.coords],fill='#a7d8f0')
    # hatch regions
    def hatch(geom,col,gap=26,ang=1):
        m=Image.new('L',(w,h),0); md=ImageDraw.Draw(m)
        for p in polys(geom):
            if p.geom_type=='Polygon': md.polygon([P(*c) for c in p.exterior.coords],fill=255)
        hp=Image.new('L',(w,h),0); hd=ImageDraw.Draw(hp)
        for x in range(-h,w+h,gap*SS): hd.line([(x,0),(x+h*ang,h)],fill=255,width=5*SS//2)
        from PIL import ImageChops
        mm=ImageChops.multiply(m,hp); img.paste(Image.new('RGB',(w,h),col),(0,0),mm)
    pak=unary_union([shape(f['geometry']) for f in D if f['properties'].get('BRK_A3') in('B08','B09')])
    chn=unary_union([shape(f['geometry']) for f in D if f['properties'].get('BRK_A3') in('B07','B06')])
    # tint disputed bases lighter
    hatch(pak,'#157a2a'); hatch(chn,'#b3231c')
    # borders
    for f in C:
        g=shape(f['geometry'])
        if not g.intersects(clip): continue
        for p in polys(g):
            if p.geom_type=='Polygon':
                d.line([P(*c) for c in p.exterior.coords],fill='#3a2a22',width=int(3.2*SS),joint='curve')
    # LoC = boundary of pak area inside India's outer boundary
    ind=[shape(f['geometry']) for f in C if f['properties']['ADM0_A3']=='IND'][0]
    outer=ind.boundary
    loc=pak.boundary.difference(outer.buffer(0.04))
    loc=loc.intersection(clip)
    segs=[]
    for l in (loc.geoms if hasattr(loc,'geoms') else [loc]):
        if l.length>0.05: segs.append([list(c) for c in l.coords])
    # rivers
    rv=[]
    for f in R:
        n=f['properties'].get('name')
        if n in('Indus','Jhelum','Chenab','Ravi','Sutlej'):
            g=shape(f['geometry']).intersection(clip)
            for l in (g.geoms if hasattr(g,'geoms') else [g]):
                if l.is_empty: continue
                ll=list(l.geoms) if hasattr(l,'geoms') else [l]
                for x in ll:
                    pts=[P(*c) for c in x.coords]
                    d.line(pts,fill='#1f7fd0',width=int(5*SS),joint='curve'); rv.append({'n':n,'p':[list(c) for c in x.coords]})
    img=img.resize((W,H),Image.LANCZOS); d=ImageDraw.Draw(img); k=s
    P2=lambda lon,lat:((lon-lon0)*COS*k,(lat1-lat)*k)
    # paper grain/vignette
    for (txt,lon,lat,sz,col,rot) in labels:
        f=ImageFont.truetype('mont900.ttf',sz); x,y=P2(lon,lat)
        tmp=Image.new('RGBA',(W,H),(0,0,0,0)); td=ImageDraw.Draw(tmp)
        bb=td.textbbox((0,0),txt,font=f); tw,th=bb[2]-bb[0],bb[3]-bb[1]
        t2=Image.new('RGBA',(tw+40,th+40),(0,0,0,0)); t2d=ImageDraw.Draw(t2)
        t2d.text((20-bb[0],20-bb[1]),txt,font=f,fill=col,stroke_width=max(4,sz//9),stroke_fill='#ffffff')
        t2=t2.rotate(rot,expand=True,resample=Image.BICUBIC)
        img.paste(t2,(int(x-t2.width/2),int(y-t2.height/2)),t2)
    img.save(f'video3d/assets/{name}.png')
    meta={'lon0':lon0,'lon1':lon1,'lat0':lat0,'lat1':lat1,'W':W,'H':H,'cos':COS,'loc':segs,'rivers':rv,'k':s}
    json.dump(meta,open(f'video3d/assets/{name}.json','w'))
    print(name,W,H,len(segs),len(rv))
mk('map_wide',60,92,20,44,2048,[('INDIA',79,24.5,70,'#7a3b00',0),('PAKISTAN',68.6,29.2,52,'#0b4d1c',60),('CHINA',84,36.5,80,'#7a1410',0),('AFGHANISTAN',65.2,34.4,44,'#6b5700',50),('NEPAL',84.2,28.6,28,'#4b3a7a',-10),('TAJIKISTAN',71.6,38.6,30,'#1d4a78',0),('KYRGYZ.',74.6,41.6,30,'#1d6a3e',0),('UZBEK.',65,41.4,30,'#6b5a20',0),('IRAN',60.8,28,40,'#5a4a42',0)])
mk('map_close',70,82.5,30,38.5,2048,[('INDIA',77.8,31.4,62,'#7a3b00',0),('PAKISTAN',72.2,31.0,40,'#0b4d1c',0),('CHINA',80.3,37.6,60,'#7a1410',0),('AFGHANISTAN',70.9,35.9,30,'#6b5700',0),('occupied by',73.2,36.3,26,'#0b4d1c',0),('Pakistan',73.2,35.9,32,'#0b4d1c',0),('occupied by',79.0,35.3,22,'#7a1410',0),('China',79.0,34.95,28,'#7a1410',0)])
