"""A macro-only collection of mineral pools and translucent, porous relics.

Keeps the tree's vertex positions, normals and topology exactly unchanged.
Run after rebuilding the spatial tree. Dependencies match build_nire_spatial.py.
"""
from pathlib import Path
import gzip, hashlib, json, struct
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, map_coordinates, gaussian_filter
from scipy.spatial import cKDTree, Delaunay
from skimage.measure import find_contours, approximate_polygon, marching_cubes
import fast_simplification
import manifold3d as m
from build_nire_spatial import original_paint_volumes

out=Path(__file__).resolve().parents[1]/'assets/images/nire'
form=json.loads((out/'form.json').read_text());slots=[]
def radius(point):
    x,y=point[0]/2262,point[1]/3200
    return 2.65+np.exp(-((x-.5)/.065)**2)*np.clip((y-.29)/.22,0,1)*3.8+np.clip((y-.28)/.5,0,1)*.7
original_paint_volumes(out,form['paths'],radius,slots)
rock=next(s for s in slots if s['kind']==2)
mask=np.asarray(Image.open(out/'material-mask.png'))[:,:,1]>127
edge=distance_transform_edt(mask)
signed=gaussian_filter(edge-distance_transform_edt(~mask),.8)
y,x=np.nonzero(edge>15);candidates=np.column_stack([x,y]).astype(float)
clearance=edge[y,x];chosen=[int(clearance.argmax())]
nearest=np.full(len(candidates),np.inf)
for _ in range(13):
    nearest=np.minimum(nearest,np.linalg.norm(candidates-candidates[chosen[-1]],axis=1))
    score=np.minimum(nearest,clearance*2.5)
    index=int(score.argmax())
    if score[index]<34:break
    chosen.append(index)
seeds=candidates[chosen];tree=cKDTree(seeds)
levels=64+(seeds[:,1]-seeds[:,1].mean())*.032-(seeds[:,0]-seeds[:,0].mean())*.008+np.sin(np.arange(len(seeds))*1.7)*1.2
smooth=lambda a,b,v:np.clip((v-a)/(b-a),0,1)**2*(3-2*np.clip((v-a)/(b-a),0,1))
def pools(xy):
    x,y=xy[:,0],xy[:,1]
    warped=xy+np.column_stack([2.4*(np.sin(x*.095+y*.037)+.7*np.sin(y*.15-x*.08)),1.8*(np.sin(y*.071-x*.022)+.5*np.cos(x*.14+y*.031))])
    d,i=tree.query(warped,k=2)
    e=map_coordinates(edge,[y,x],order=1,mode='constant',cval=0)
    inner=np.minimum(e-6,(d[:,1]-d[:,0])*.5)
    level=levels[i[:,0]]
    rim=70+(y-seeds[:,1].mean())*.032-(x-seeds[:,0].mean())*.008
    top=rim-(rim-(level-8))*smooth(1.3,9.3,inner)
    return i[:,0],inner,level,top,e

def normals(p,f):
    result=np.zeros_like(p);n=np.cross(p[f[:,1]]-p[f[:,0]],p[f[:,2]]-p[f[:,0]])
    for k in range(3):np.add.at(result,f[:,k],n)
    return result/np.maximum(1e-12,np.linalg.norm(result,axis=1,keepdims=True))

def world(slot,local):
    offset=local.copy();offset[:,:2]-=slot['center'][:2]
    return offset@slot['transform'].T+slot['center']

batches=[];picking=[];counts={'terrain':0,'water':0,'membranes':0};basin_count=0

def pack(kind,slot,local,faces,depth,seed):
    native=world(slot,local);normal=normals(native,faces)
    points=np.column_stack([native[:,0]/2262-.5,(1600-native[:,1])/2262,native[:,2]/2262])
    normal[:,1]*=-1
    faces=faces[:,[0,2,1]]
    local_shader=local.copy();local_shader[:,:2]-=np.mean(slot['vertices'][:,:2],axis=0)
    records=np.column_stack([points,normal,local_shader,np.full(len(points),kind),depth,np.full(len(points),seed)]).astype('<f4')
    for first in range(0,len(faces),16000):
        used,index=np.unique(faces[first:first+16000].ravel(),return_inverse=True)
        assert len(used)<65536
        batches.append((kind,records[used],index.astype('<u2'),points[used].mean(axis=0)))
    counts[['terrain','water','membranes'][kind]]+=len(faces)

mask_y,mask_x=np.nonzero(mask)
left=min(int(np.floor(rock['vertices'][:,0].min())),int(mask_x.min()))-8;right=max(int(np.ceil(rock['vertices'][:,0].max())),int(mask_x.max()))+8
top_y=min(int(np.floor(rock['vertices'][:,1].min())),int(mask_y.min()))-8;bottom=max(int(np.ceil(rock['vertices'][:,1].max())),int(mask_y.max()))+8
gy,gx=np.mgrid[top_y:bottom+1,left:right+1];grid=np.column_stack([gx.ravel(),gy.ravel()])
ids,inside,levels_grid,bed_grid,edge_grid=pools(grid)

# Reconstruct a closed heightfield at a uniform native resolution. This avoids
# folding old bevel triangles across the new basins or creating collapsed faces.
base=14*rock['depth']*np.sqrt(np.maximum(0,1-(1-np.clip(edge_grid/16,0,1))**2))
top_grid=np.maximum(1.2,base+(bed_grid-base)*smooth(3,10.5,edge_grid)).reshape(gx.shape)
zlevels=np.arange(-84,84.1,1.5,dtype=np.float32)
field=np.minimum(signed[top_y:bottom+1,left:right+1,None],top_grid[:,:,None]-np.abs(zlevels)[None,None,:]).astype(np.float32)
p,f,_,_=marching_cubes(field,0,spacing=(1,1,1.5),allow_degenerate=False)
p+=np.array([top_y,left,float(zlevels[0])]);p=p[:,[1,0,2]]
volume=np.einsum('ij,ij->i',p[f[:,0]],np.cross(p[f[:,1]],p[f[:,2]])).sum()/6
if volume<0:f=f[:,[0,2,1]]
solid=m.Manifold(m.Mesh(p.astype(np.float32),f.astype(np.uint32)))
assert solid.status()==m.Error.NoError,str(solid.status())
solid=max(solid.decompose(),key=lambda body:body.volume()).simplify(.18)
mesh=solid.to_mesh();p=np.asarray(mesh.vert_properties)[:,:3].astype(np.float64);f=np.asarray(mesh.tri_verts).astype(np.int32)
parent=np.arange(len(p))
for a,b in zip(mesh.merge_from_vert,mesh.merge_to_vert):parent[a]=b
while np.any(parent[parent]!=parent):parent=parent[parent]
used,inverse=np.unique(parent,return_inverse=True);p=p[used];f=inverse[f]
edges=np.sort(np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1)
assert np.all(np.unique(edges,axis=0,return_counts=True)[1]==2),'The mineral island must be watertight'
_,_,lev,bed,_=pools(p[:,:2]);dep=np.clip((lev-bed)/8,0,1)*smooth(.10,.65,np.abs(normals(p,f)[:,2]))
pack(0,rock,p,f,dep,0)
water_field=np.minimum(levels_grid-bed_grid,edge_grid-11)
for cell in range(len(seeds)):
    field=np.where(ids==cell,water_field,-1).reshape(gx.shape)
    if field.max()<1:continue
    boundary=[]
    for contour in find_contours(field,0):
        contour=approximate_polygon(contour,.2)
        for a,b in zip(contour[:-1],contour[1:]):
            n=max(1,int(np.ceil(np.linalg.norm(b-a)/1.5)))
            boundary.extend(np.linspace(a,b,n,endpoint=False))
    if not boundary:continue
    boundary=np.asarray(boundary)[:,[1,0]]+np.array([left,top_y])
    gy2,gx2=np.mgrid[top_y:bottom:2.,left:right:2.];interior=np.column_stack([gx2.ravel(),gy2.ravel()])
    ci,di,cl,cb,ce=pools(interior);interior=interior[(ci==cell)&(np.minimum(cl-cb,ce-11)>.3)]
    xy=np.unique(np.round(np.concatenate([boundary,interior]),5),axis=0)
    if len(xy)<10:continue
    faces=Delaunay(xy).simplices
    tri=xy[faces];samples=np.concatenate([tri.mean(axis=1),(tri[:,0]+tri[:,1])/2,(tri[:,1]+tri[:,2])/2,(tri[:,2]+tri[:,0])/2])
    si,sd,sl,sb,se=pools(samples)
    keep=((si==cell)&(np.minimum(sl-sb,se-11)>-.3)).reshape(4,-1).all(axis=0)
    keep&=np.max(np.linalg.norm(tri-np.roll(tri,1,axis=1),axis=2),axis=1)<6
    faces=faces[keep]
    if len(faces)<8:continue
    _,_,lev,bed,_=pools(xy);water_depth=np.clip((lev-bed)/8,0,1)
    # Separate front/back water surfaces give the same discovery at rear angles.
    for sign in [1,-1]:
        local=np.column_stack([xy,np.full(len(xy),sign*levels[cell])])
        face=faces.copy();cross=np.cross(local[face[:,1]]-local[face[:,0]],local[face[:,2]]-local[face[:,0]])
        if np.mean(cross[:,2])*sign<0:face=face[:,[0,2,1]]
        pack(1,rock,local,face,water_depth,float(cell+1))
    basin_count+=1

# Thin layered relics follow two remaining white marks; they do not replace the
# connected frame or add standalone columns to the tree's silhouette.
for slot in slots:
    if slot['kind']!=3 or slot['island'] not in []:continue
    p=slot['vertices'].copy();f=slot['faces'].copy()
    p,f=fast_simplification.simplify(p,f,target_reduction=.80,agg=4)
    center=p[:,:2].mean(axis=0);p[:,:2]=center+(p[:,:2]-center)*.96
    for sign in [1,-1]:
        face=f[np.all(p[f,2]*sign>.05,axis=1)]
        used,inverse=np.unique(face.ravel(),return_inverse=True);local=p[used].copy();face=inverse.reshape(-1,3)
        dx=local[:,0]-center[0];dy=local[:,1]-center[1]
        lift=np.clip((dx-dx.min())/max(1e-8,np.ptp(dx)),0,1)
        local[:,0]+=lift*8;local[:,1]-=lift*7
        peel=1.0+lift*lift*18+np.sin(dx*.032+dy*.017)*.8*lift
        local[:,2]=sign*(np.abs(local[:,2])*slot['depth']+peel)
        pack(2,slot,local,face,np.zeros(len(local)),float(slot['island']))

binary=bytearray(struct.pack('<4sIHHI',b'NIRU',1,2262,3200,len(batches)))
for kind,record,indices,center in batches:
    binary+=struct.pack('<III3f',kind,len(record),len(indices),*center)+record.tobytes()+indices.tobytes()
(out/'universe.bin').write_bytes(binary)
(out/'universe.bin.gz').write_bytes(gzip.compress(bytes(binary),compresslevel=9,mtime=0))

# A material channel marks the white broad surfaces, without touching geometry.
raw=bytearray((out/'filaments.bin').read_bytes());at=20;before=hashlib.sha256();after=hashlib.sha256()
porous=[]
for slot in slots:
    if slot['kind']==3 and slot['island']!=9:
        local=slot['vertices'].copy();local[:,2]*=slot['depth'];porous.extend(world(slot,local).tolist())
near=cKDTree(np.asarray(porous))
for _ in range(struct.unpack_from('<I',raw,12)[0]):
    nv,ni=struct.unpack_from('<II',raw,at);at+=24
    records=np.ndarray((nv,28),np.uint8,buffer=raw,offset=at)
    before.update(records[:,:24].copy().tobytes())
    native=np.ndarray((nv,),dtype=np.dtype({'names':['p'],'formats':[('<f4',3)],'offsets':[0],'itemsize':28}),buffer=raw,offset=at)['p']
    distance,_=near.query(native)
    records[:,25]=np.rint((1-smooth(1.2,4,distance))*255).astype(np.uint8)
    records[records[:,24]>0,25]=0
    after.update(records[:,:24].copy().tobytes());at+=nv*28
    before.update(raw[at:at+ni*2]);after.update(raw[at:at+ni*2]);at+=ni*2
assert before.digest()==after.digest(),'The original tree geometry must remain unchanged'
(out/'filaments.bin').write_bytes(raw);(out/'filaments.bin.gz').write_bytes(gzip.compress(bytes(raw),compresslevel=9,mtime=0))
meta={'basins':basin_count,'waterFaces':basin_count*2,'membraneFaces':0,'porousMarks':0,'triangles':counts,'batches':len(batches),'geometryUnchanged':True,'treeGeometryHash':before.hexdigest(),'source':'macro mineral pools and clear water in the botanical herbarium'}
(out/'universe.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta,indent=2),flush=True)
