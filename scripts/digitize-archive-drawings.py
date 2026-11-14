"""Vectorise Elisa's supplied ink drawings without redrawing their geometry.
Only SVG paths are generated; the original screenshots are preserved verbatim.
"""
from pathlib import Path
import json,shutil
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import gaussian_filter
from skimage.filters import apply_hysteresis_threshold
from skimage.morphology import remove_small_objects
from skimage.measure import find_contours,approximate_polygon
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/images/nire/archive/drawings'
OUT.mkdir(parents=True,exist_ok=True)
SOURCES=[
 ('01','/var/folders/48/1s5r9r4n00qclm6dljs830d40000gn/T/TemporaryItems/NSIRD_screencaptureui_ki1VQl/Screenshot 2026-10-30 at 6.59.51\u202fPM.png',.18,.31),
 ('02','/var/folders/48/1s5r9r4n00qclm6dljs830d40000gn/T/TemporaryItems/NSIRD_screencaptureui_bzNmcK/Screenshot 2026-10-30 at 6.59.58\u202fPM.png',.16,.27),
 ('03','/var/folders/48/1s5r9r4n00qclm6dljs830d40000gn/T/TemporaryItems/NSIRD_screencaptureui_xykmAg/Screenshot 2026-10-30 at 7.01.09\u202fPM.png',.025,.085),
]
records=[]
for number,name,low,high in SOURCES:
 source=Path(name)
 if not source.exists():
  matches=list(source.parent.glob('Screenshot*.png'))
  if len(matches)!=1:raise FileNotFoundError(source)
  source=matches[0]
 shutil.copy2(source,OUT/f'dibujo-{number}-original.png')
 photo=np.asarray(Image.open(source).convert('L'),float)/255
 h,w=photo.shape
 background=gaussian_filter(photo,18)
 contrast=np.clip(1-photo/np.maximum(background,.1),0,1)
 selection=np.ones((h,w),bool)
 if number=='02':
  mask=Image.new('1',(w,h));d=ImageDraw.Draw(mask)
  points=[(16,0),(.902*w,0),(.943*w,.5*h),(.978*w,.70*h),(.947*w,.87*h),(.874*w,h),(16,h)]
  d.polygon(points,fill=1);selection=np.asarray(mask,bool)
 ink=apply_hysteresis_threshold(contrast,low,high)&selection
 ink=remove_small_objects(ink,min_size=3)
 yy,xx=np.nonzero(ink)
 if not len(xx):raise RuntimeError('No ink found')
 minx,maxx,miny,maxy=max(0,int(xx.min())-12),min(w,int(xx.max())+13),max(0,int(yy.min())-12),min(h,int(yy.max())+13)
 paths=[]
 for contour in find_contours(np.pad(ink.astype(float),1),.5,fully_connected='high'):
  if len(contour)<4:continue
  points=approximate_polygon(contour-1,tolerance=.18)
  area=abs(np.sum(points[:-1,1]*points[1:,0]-points[1:,1]*points[:-1,0]))/2
  if area<.55:continue
  path='M'+' L'.join(f'{x:.2f},{y:.2f}' for y,x in points)+' Z'
  paths.append(path)
 title=f'Dibujo {number} — Elisa Cipriani'
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{minx} {miny} {maxx-minx} {maxy-miny}"><title>{title}</title><desc>Digitalización fiel del trazo, sin fondo de papel. Las variaciones de grosor pertenecen al dibujo original.</desc><path fill="#151515" fill-rule="evenodd" d="'+''.join(paths)+'"/></svg>'
 target=OUT/f'dibujo-{number}.svg';target.write_text(svg)
 records.append({'id':number,'source':source.name,'originalSize':[w,h],'viewBox':[minx,miny,maxx-minx,maxy-miny],'paths':len(paths),'inkPixels':int(ink.sum()),'file':target.name})
 print(records[-1])
(OUT/'digitalizaciones.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
