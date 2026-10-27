"""One closed, weathered boulder. Coordinates are local; height is one unit.

Large fracture planes define the body, shallow chips interrupt those planes,
and progressively smaller erosion gives the silhouette its mineral character.
No reference photograph or other artist's text is part of the mesh.
"""
from pathlib import Path
import gzip
import json
import struct
import numpy as np
from scipy.ndimage import map_coordinates
from scipy.spatial import ConvexHull
from skimage.measure import marching_cubes
import fast_simplification
from build_nire_spatial import original_paint_volumes

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/images/nire'
rng = np.random.default_rng(7319)
step = .006
axes = [np.arange(-.58, .55, step), np.arange(-.61, .65, step), np.arange(-.46, .46, step)]
x, y, z = np.meshgrid(*axes, indexing='ij')
points = []
# Off-centre upper crest and broader shoulders, with a blunt tapered base.
for yy, cx, cz, rx, rz in [(-.52,.005,.0,.115,.11),(-.45,.005,.0,.23,.19),(-.25,-.02,.0,.33,.24),(-.03,.01,.0,.39,.27),(.16,-.035,-.015,.31,.26),(.30,-.09,-.01,.245,.23),(.44,-.145,-.02,.16,.16),(.53,-.16,-.025,.065,.055)]:
    for t in np.linspace(0,2*np.pi,10,endpoint=False):
        r = rng.uniform(.91,1.07)
        points.append([cx+rx*np.cos(t)*r, yy+rng.uniform(-.025,.025), cz+rz*np.sin(t)*r])
hull=ConvexHull(points)
field=np.full(x.shape,-10.,dtype=np.float32)
for a,b,c,d in hull.equations:
    plane=a*x+b*y+c*z+d
    # A small worn bevel between geological faces, instead of melted lobes.
    field=np.maximum(field,plane)+np.maximum(.008-np.abs(field-plane),0)**2/(.032)
for center,radii in [((-.335,.125,.205),(.155,.125,.12)),((.18,.31,.235),(.17,.09,.09)),((.305,-.14,.19),(.10,.18,.075))]:
    cavity=(1-np.sqrt(((x-center[0])/radii[0])**2+((y-center[1])/radii[1])**2+((z-center[2])/radii[2])**2))*min(radii)
    field=np.maximum(field,cavity)
def noise(freq,seed):
    grid=np.random.default_rng(seed).uniform(-1,1,(40,40,40)).astype(np.float32)
    return map_coordinates(grid,[x*freq+19,y*freq+19,z*freq+19],order=3,mode='wrap',prefilter=True)
for freq,amplitude,seed in [(5,.015,45),(14,.007,53),(37,.0034,61),(93,.0017,77)]:
    field+=noise(freq,seed)*amplitude
v,f,_,_=marching_cubes(field,level=0,spacing=(step,step,step),allow_degenerate=False)
v+=np.array([a[0] for a in axes])
v,f=fast_simplification.simplify(v,f,target_reduction=.17,agg=5)
# The normals follow the actual worn surfaces, including the back and cavities.
n=np.zeros_like(v)
face_n=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
for j in range(3):np.add.at(n,f[:,j],face_n)
n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
center=(v.min(0)+v.max(0))/2
height=np.ptp(v[:,1]);v=(v-center)/height
v[:,0]*=1.13
# Correct the normals after the non-uniform aspect adjustment.
n[:,0]/=1.13;n/=np.linalg.norm(n,axis=1,keepdims=True)
edges=np.sort(np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1)
_,counts=np.unique(edges,axis=0,return_counts=True)
assert np.all(counts==2),'Boulder must be a closed solid'
# Uint16 batches work on mobile WebGL without a large-index extension.
raw=bytearray(b'NIRB'+struct.pack('<II',1,0));batches=[]
for i in range(0,len(f),18000):
    faces=f[i:i+18000];ids,remap=np.unique(faces,return_inverse=True)
    data=np.column_stack([v[ids],n[ids]]).astype('<f4')
    indices=remap.reshape(-1).astype('<u2')
    raw.extend(struct.pack('<II',len(ids),len(indices)));raw.extend(data.tobytes());raw.extend(indices.tobytes());batches.append(len(ids))
struct.pack_into('<I',raw,8,len(batches))
(OUT/'boulder.bin').write_bytes(raw)
(OUT/'boulder.bin.gz').write_bytes(gzip.compress(raw,compresslevel=9,mtime=0))
slots=[]
original_paint_volumes(OUT,json.loads((OUT/'form.json').read_text())['paths'],lambda point:3.,slots)
slot=next(s for s in slots if s['kind']==3 and s['island']==9)
offset=np.array([848.,850.,0.]);offset[:2]-=slot['center'][:2]
anchor=slot['center']+slot['transform']@offset
flip=np.diag([1.,-1.,1.])
attachment={'sourceMark':'3:9','nativeCenter':anchor.tolist(),'center':[anchor[0]/2262-.5,(1600-anchor[1])/2262,anchor[2]/2262],'frame':(flip@slot['transform']@flip).tolist(),'heightInSourcePixels':125}
metadata={'version':2,'vertices':len(v),'triangles':len(f),'batches':len(batches),'closed':True,'bounds':[v.min(0).tolist(),v.max(0).tolist()],'attachment':attachment}
(OUT/'boulder.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(metadata))
