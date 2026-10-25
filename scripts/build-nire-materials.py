"""Reconstruct the distinct pigments of ÑIRE as source-aligned 3D materials.

Development dependencies: Pillow, numpy, scipy, scikit-image, fast-simplification.
Usage: python build-nire-materials.py ORIGINAL_IMAGE [OUTPUT_DIRECTORY]
"""
import gzip
import json
from pathlib import Path
import struct
import sys

import fast_simplification
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import label, gaussian_filter, distance_transform_edt, map_coordinates, binary_fill_holes, binary_dilation
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from skimage.color import rgb2hsv
from skimage.feature import peak_local_max
from skimage.measure import marching_cubes
from skimage.morphology import closing, disk, remove_small_holes
from skimage.segmentation import watershed

source=Path(sys.argv[1])
out=Path(sys.argv[2]) if len(sys.argv)>2 else Path(__file__).resolve().parents[1]/'assets/images/nire'
out.mkdir(parents=True,exist_ok=True)
w,h=2262,3200
rgb=np.array(Image.open(source).convert('RGB').resize((w,h),Image.Resampling.LANCZOS))
hsv=rgb2hsv(rgb);hue=hsv[:,:,0]*360;saturation=hsv[:,:,1];value=hsv[:,:,2]
yellow=(hue>43)&(hue<85)&(saturation>.18)&(value>.13)
pink=((hue>312)|(hue<5))&(saturation>.22)&(value>.25)
orange=(hue>5)&(hue<43)&(saturation>.22)&(value>.12)

pink=closing(pink,disk(4));labs,n=label(pink);sizes=np.bincount(labs.ravel());sizes[0]=0
pink=remove_small_holes(labs==sizes.argmax(),max_size=90)
orange=closing(orange,disk(5));labs,n=label(orange);sizes=np.bincount(labs.ravel());sizes[0]=0
orange=np.isin(labs,np.flatnonzero(sizes>650))
# Give each painted orange island a continuous interior; cracks become texture.
labs,n=label(orange)
for index in range(1,n+1):orange|=binary_fill_holes(labs==index)
orange&=~pink
signal=gaussian_filter(rgb.max(axis=2).astype(np.float32)*yellow,1.1)
peaks=peak_local_max(signal,min_distance=4,threshold_abs=36,labels=yellow.astype(np.uint8))
markers=np.zeros((h,w),np.int32)
for i,(y,x) in enumerate(peaks,1):markers[y,x]=i
parts=watershed(-signal,markers,mask=yellow)
beads=[]
yellow_mask=Image.new('L',(w,h));ydraw=ImageDraw.Draw(yellow_mask)
for index in range(1,len(peaks)+1):
    ys,xs=np.nonzero(parts==index)
    if len(xs)<4 or len(xs)>750:continue
    weights=signal[ys,xs];x=float(np.average(xs,weights=weights));y=float(np.average(ys,weights=weights))
    radius=float(np.clip(np.sqrt(len(xs)/np.pi)*.86,1.3,10.5))
    color=np.average(rgb[ys,xs],axis=0,weights=weights)/255
    beads.append((x,y,radius,color))
    rr=radius*2.15+4
    ydraw.ellipse((x-rr,y-rr,x+rr,y+rr),fill=255)

batches=[];islands={};metadata={'yellow':{'beads':len(beads),'surface':'analytic sphere; rigid center; no surface shear'},'pink':{},'orange':{}}
# Spheres are evaluated analytically in the browser, with exact round silhouettes
# at every zoom. Their centers follow the drawing; their shape stays rigid.
(out/'beads.json').write_text(json.dumps({'width':w,'height':h,'beads':[[x,y,r,*color.tolist()] for x,y,r,color in beads]},separators=(',',':'))+'\n')

def pack(material,island,vertices,faces,normals,color):
    centers=vertices[faces,:2].mean(axis=1)
    keys=np.floor(centers[:,1]/192).astype(int)*32+np.floor(centers[:,0]/192).astype(int)
    order=np.argsort(keys,kind='stable');keys=keys[order]
    breaks=np.r_[0,np.flatnonzero(keys[1:]!=keys[:-1])+1,len(order)]
    for first,last in zip(breaks,breaks[1:]):
        selected=faces[order[first:last]]
        for start in range(0,len(selected),14000):
            used,indices=np.unique(selected[start:start+14000].ravel(),return_inverse=True)
            p=vertices[used];records=np.zeros((len(used),28),np.uint8)
            records[:,:12]=p.astype('<f4').view(np.uint8).reshape(-1,12)
            records[:,12:24]=normals[used].astype('<f4').view(np.uint8).reshape(-1,12)
            records[:,24:27]=np.clip(np.rint(color[used]*255),0,255).astype(np.uint8)
            bounds=[float(p[:,0].min()/w),float(p[:,1].min()/h),float(p[:,0].max()/w),float(p[:,1].max()/h)]
            batches.append((material,island,records,indices.astype('<u2'),bounds))

color_image=gaussian_filter(rgb.astype(np.float32),[5,5,0])/255

def bodies(mask,material,thickness,edge_width):
    labs,count=label(mask)
    total_triangles=0;open_edges=0
    for component in range(1,count+1):
        ys,xs=np.nonzero(labs==component)
        islands[f'{material}:{component}']=[float(xs.mean()/w),float(ys.mean()/h)]
        left,top,right,bottom=int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1
        padding=12
        local=binary_dilation(np.pad((labs==component)[top:bottom,left:right],padding),iterations=1)
        inside=distance_transform_edt(local);outside=distance_transform_edt(~local)
        raw_signed=(inside-outside).astype(np.float32)
        signed=gaussian_filter(raw_signed,3.2 if material==2 else 1.6)+.25
        if signed.max()<=.25:signed=gaussian_filter(raw_signed,.55)+.25
        # A constant face and a continuous elliptical bevel lift a painted shape
        # into a quiet solid, without the old swollen, root-like center ridges.
        bevel=np.clip(signed/edge_width,0,1)
        field2d=np.where(signed>0,1-(1-bevel)**2,signed/edge_width)
        slopes=np.gradient(field2d*thickness**2)
        levels=np.linspace(-thickness*1.04,thickness*1.04,41,dtype=np.float32)
        field=field2d[:,:,None]-(levels[None,None,:]/thickness)**2
        pos,tri,_,_=marching_cubes(field,0,spacing=(1,1,float(levels[1]-levels[0])),allow_degenerate=False)
        pos[:,2]+=levels[0];pos[:,0]+=top-padding;pos[:,1]+=left-padding
        original_pos,original_tri=pos,tri
        for reduction in (.5,.3,0):
            if reduction:pos,tri=fast_simplification.simplify(original_pos,original_tri,target_reduction=reduction,agg=4)
            else:pos,tri=original_pos.copy(),original_tri.copy()
            edges=np.sort(np.concatenate([tri[:,[0,1]],tri[:,[1,2]],tri[:,[2,0]]]),axis=1)
            unique,times=np.unique(edges,axis=0,return_counts=True)
            if np.all(times==2):break
        # A whole skin with soft junctions, rather than separate crack segments.
        edges=np.sort(np.concatenate([tri[:,[0,1]],tri[:,[1,2]],tri[:,[2,0]]]),axis=1)
        unique,times=np.unique(edges,axis=0,return_counts=True)
        open_edges+=int(np.count_nonzero(times!=2))
        rows=np.r_[unique[:,0],unique[:,1]];cols=np.r_[unique[:,1],unique[:,0]]
        matrix=coo_matrix((np.ones(len(rows)),(rows,cols)),shape=(len(pos),len(pos))).tocsr()
        components,labels3d=connected_components(matrix,directed=False,return_labels=True)
        if components!=1:
            sizes3d=np.bincount(labels3d)
            raise ValueError(f'Material {material} island {component}: {components} skin components, sizes {sorted(sizes3d,reverse=True)[:8]}')
        degree=np.asarray(matrix.sum(axis=1)).ravel()
        for _ in range(2):
            for factor in (.25,-.26):pos+=factor*(matrix@pos/degree[:,None]-pos)
        sample=[pos[:,0]-top+padding,pos[:,1]-left+padding]
        normal=np.column_stack([-map_coordinates(slopes[0],sample,order=1,mode='nearest'),-map_coordinates(slopes[1],sample,order=1,mode='nearest'),2*pos[:,2]])
        normal/=np.maximum(1e-12,np.linalg.norm(normal,axis=1,keepdims=True))
        geometric=np.cross(pos[tri[:,1]]-pos[tri[:,0]],pos[tri[:,2]]-pos[tri[:,0]])
        if np.sum(geometric*normal[tri].mean(axis=1))<0:tri=tri[:,[0,2,1]]
        color=np.stack([map_coordinates(color_image[:,:,c],[pos[:,0],pos[:,1]],order=1,mode='nearest')for c in range(3)],axis=1)
        if material==2:
            # Preserve the two distinct rose tones, including the deeper core.
            hot=np.clip((color[:,0]-color[:,1]-.15)*3.8,0,1)
            color=np.array([.91,.62,.79])[None,:]*(1-hot[:,None])+np.array([.95,.28,.60])[None,:]*hot[:,None]
        else:
            light=np.clip(color.max(axis=1),.12,.8)
            color=np.array([.94,.45,.22])[None,:]*(.48+light[:,None]*.65)
        pack(material,component,pos[:,[1,0,2]],tri,normal[:,[1,0,2]],color)
        total_triangles+=len(tri)
    assert open_edges==0
    return {'bodies':count,'openEdges':open_edges,'triangles':total_triangles,'thicknessInSourcePixels':thickness*2}

metadata['pink']=bodies(pink,2,14,16)
metadata['orange']=bodies(orange,3,7,10)
atlas=Image.merge('RGB',(yellow_mask.filter(ImageFilter.GaussianBlur(.7)),Image.fromarray((pink*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(.8)),Image.fromarray((orange*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(.8))))
atlas.save(out/'material-mask.png',optimize=True)
mesh=bytearray(struct.pack('<4sIHHI',b'NIRM',3,w,h,len(batches)))
for material,island,records,indices,bounds in batches:
    mesh+=struct.pack('<IIII4f',material,island,len(records),len(indices),*bounds)+records.tobytes()+indices.tobytes()
(out/'material-islands.json').write_text(json.dumps(islands,separators=(',',':'))+'\n')
(out/'materials.bin').write_bytes(mesh)
(out/'materials.bin.gz').write_bytes(gzip.compress(bytes(mesh),compresslevel=9,mtime=0))
metadata['batches']=len(batches);metadata['sourceSize']=[w,h]
(out/'materials.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(metadata,indent=2))
