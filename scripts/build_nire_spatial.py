"""Build a genuinely spatial, watertight mineral tree from form.json.

Development-only dependencies: manifold3d, numpy and scipy. The website receives
the finished mesh and has no modelling-library dependency.
"""
from pathlib import Path
import gzip
import json
import struct
import sys

import manifold3d as m
import numpy as np
from scipy.sparse import coo_matrix
from scipy.spatial import cKDTree

def original_paint_volumes(output,paths,radius):
    """Attach the source drawing's broad marks to the same spatial branches.

    Each mark keeps its original contour in a rigid branch frame. Its closest
    source contact sets that frame, so it cannot float beside its own branch.
    The final Boolean, rather than the renderer, joins these marks to the tree.
    """
    raw=(output/'materials.bin').read_bytes();at=16;groups={}
    assert struct.unpack_from('<4sI',raw)==(b'NIRM',3)
    for _ in range(struct.unpack_from('<I',raw,12)[0]):
        kind,island,nv,ni,*_=struct.unpack_from('<IIII4f',raw,at);at+=32
        records=np.ndarray((nv,),dtype=np.dtype({'names':['p','n'],'formats':[('<f4',3),('<f4',3)],'offsets':[0,12],'itemsize':28}),buffer=raw,offset=at)
        p=records['p'].copy();n=records['n'].copy();at+=nv*28
        faces=np.frombuffer(raw,dtype='<u2',count=ni,offset=at).astype(np.int32).reshape(-1,3);at+=ni*2
        groups.setdefault((kind,island),[]).append((p,n,faces))
    samples=[];segments=[];sample_segment=[]
    for path in paths:
        for a,b in zip(path[:-1],path[1:]):
            a,b=np.asarray(a),np.asarray(b);length=np.linalg.norm((b-a)[:2])
            if length<1e-5:continue
            i=len(segments);segments.append((a,b))
            points=np.linspace(a,b,max(2,int(np.ceil(length/2))+1))
            samples.extend(points);sample_segment.extend([i]*len(points))
    samples=np.asarray(samples);sample_segment=np.asarray(sample_segment)
    tree=cKDTree(samples[:,:2]);solids=[];contacts=[]
    for (kind,island),chunks in groups.items():
        p=np.concatenate([chunk[0] for chunk in chunks]);n=np.concatenate([chunk[1] for chunk in chunks])
        offsets=np.r_[0,np.cumsum([len(chunk[0]) for chunk in chunks])]
        faces=np.concatenate([chunk[2]+offset for chunk,offset in zip(chunks,offsets)])
        vertices,used,inverse=np.unique(p,axis=0,return_index=True,return_inverse=True)
        n=n[used];faces=inverse[faces]
        distance,nearest=tree.query(vertices[:,:2]);index=int(distance.argmin())
        a,b=segments[sample_segment[nearest[index]]];delta=b-a;length=np.linalg.norm(delta[:2])
        t=np.clip(np.dot(vertices[index,:2]-a[:2],delta[:2])/length**2,0,1)
        center=a+delta*t;along=np.r_[delta[:2]/length,0];side=np.array([-along[1],along[0],0.])
        tangent=delta/np.linalg.norm(delta);normal=np.cross(tangent,side)
        basis=np.column_stack([tangent,side,normal]);flat=np.column_stack([along,side,[0,0,1.]])
        transform=basis@flat.T;depth=1.6 if kind==2 else 1.3
        local=vertices-center;local[:,2]=vertices[:,2]*depth
        positions=local@transform.T+center
        normals=n.copy();normals[:,2]/=depth;normals=normals@transform.T
        volume=np.einsum('ij,ij->i',positions[faces[:,0]],np.cross(positions[faces[:,1]],positions[faces[:,2]])).sum()/6
        if volume<0:faces=faces[:,[0,2,1]]
        shape=m.Manifold(m.Mesh(np.asarray(positions,dtype=np.float32),np.asarray(faces,dtype=np.uint32))).simplify(.13)
        assert shape.status()==m.Error.NoError,f'Original mark {kind}:{island}: {shape.status()}'
        q=int(np.linalg.norm(positions-center,axis=1).argmin());end=positions[q];d=end-center;gap=float(np.linalg.norm(d));r=float(radius(center))
        joins=[shape]
        if gap>r*.65:
            axis=d/gap;up=np.array([0.,0.,1.]) if abs(axis[2])<.9 else np.array([0.,1.,0.])
            first=np.cross(up,axis);first/=np.linalg.norm(first);second=np.cross(axis,first)
            joins.append(m.Manifold.cylinder(gap,r,max(2.8,r*.8),24).transform(np.column_stack([first,second,axis,center])))
            joins.append(m.Manifold.sphere(max(2.8,r*.8),16).translate(end))
        joined=m.Manifold.batch_boolean(joins,m.OpType.Add)
        assert len(joined.decompose())==1,f'Original mark {kind}:{island} must meet its branch contact'
        solids.append(joined);contacts.append({'mark':f'{kind}:{island}','contactGap':round(gap,3)})
    print(json.dumps({'sourceMarks':contacts}),flush=True)
    return solids,contacts

def build_spatial_tree(output,source_size=None,trace_metadata=None):
    output=Path(output)
    data=json.loads((output/'form.json').read_text())
    width,height=data['width'],data['height']
    parts=[];joints={}
    def radius(point):
        x,y=point[0]/width,point[1]/height
        return 2.65+np.exp(-((x-.5)/.065)**2)*np.clip((y-.29)/.22,0,1)*3.8+np.clip((y-.28)/.5,0,1)*.7
    for path in data['paths']:
        for point in path:joints[tuple(point)]=radius(point)
        for a,b in zip(path[:-1],path[1:]):
            a,b=np.asarray(a),np.asarray(b);delta=b-a;length=np.linalg.norm(delta)
            if length<.00001:continue
            axis=delta/length;up=np.array([0.,0.,1.]) if abs(axis[2])<.9 else np.array([0.,1.,0.])
            side=np.cross(up,axis);side/=np.linalg.norm(side);other=np.cross(axis,side)
            transform=np.column_stack([side,other,axis,a])
            parts.append(m.Manifold.cylinder(float(length),float(radius(a)),float(radius(b)),24).transform(transform))
    for point,r in joints.items():parts.append(m.Manifold.sphere(float(r),16).translate(point))
    paint,contacts=original_paint_volumes(output,data['paths'],radius)
    parts.extend(paint)
    solid=m.Manifold.batch_boolean(parts,m.OpType.Add)
    assert solid.status()==m.Error.NoError,str(solid.status())
    assert len(solid.decompose())==1,'The spatial sculpture must be one body'
    solid=solid.simplify(.015).refine_to_length(3.8)
    mesh=solid.to_mesh()
    vertices=np.asarray(mesh.vert_properties)[:,:3].astype(np.float64)
    faces=np.asarray(mesh.tri_verts).astype(np.int32)
    # Respect the Boolean kernel's topology. Equal coordinates can be separate
    # vertices at a tangential contact and must not be blindly welded together.
    parent=np.arange(len(vertices))
    for a,b in zip(mesh.merge_from_vert,mesh.merge_to_vert):parent[a]=b
    while np.any(parent[parent]!=parent):parent=parent[parent]
    used,inverse=np.unique(parent,return_inverse=True)
    vertices=vertices[used];faces=inverse[faces]
    edges=np.sort(np.concatenate([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]),axis=1)
    unique,counts=np.unique(edges,axis=0,return_counts=True)
    assert np.all(counts==2),'The Boolean surface must be closed'
    row=np.r_[unique[:,0],unique[:,1]];col=np.r_[unique[:,1],unique[:,0]]
    adjacency=coo_matrix((np.ones(len(row)),(row,col)),shape=(len(vertices),len(vertices))).tocsr()
    degree=np.asarray(adjacency.sum(axis=1)).ravel()
    def normals_at(points):
        triangles=points[faces];face_normals=np.cross(triangles[:,1]-triangles[:,0],triangles[:,2]-triangles[:,0])
        normals=np.zeros_like(points)
        for corner in range(3):np.add.at(normals,faces[:,corner],face_normals)
        normals/=np.maximum(1e-12,np.linalg.norm(normals,axis=1,keepdims=True))
        return normals
    normals=normals_at(vertices)
    p=vertices*.71;grid=np.floor(p);u=p-grid;u=u*u*(3-2*u)
    def h(dx,dy,dz):
        q=np.mod((grid+np.array([dx,dy,dz]))*.1031,1);q+=np.sum(q*(q[:,[1,2,0]]+33.33),axis=1)[:,None]
        return np.mod((q[:,0]+q[:,1])*q[:,2],1)
    mix=lambda a,b,t:a+(b-a)*t
    noise=mix(mix(mix(h(0,0,0),h(1,0,0),u[:,0]),mix(h(0,1,0),h(1,1,0),u[:,0]),u[:,1]),mix(mix(h(0,0,1),h(1,0,1),u[:,0]),mix(h(0,1,1),h(1,1,1),u[:,0]),u[:,1]),u[:,2])
    vertices+=normals*((noise-.5)*.30)[:,None]
    normals=normals_at(vertices)
    normals=normals*.8+(adjacency@normals/degree[:,None])*.2
    normals/=np.maximum(1e-12,np.linalg.norm(normals,axis=1,keepdims=True))
    max_edge=float(np.linalg.norm(vertices[unique[:,0]]-vertices[unique[:,1]],axis=1).max())
    assert max_edge<12,'A stretched face escaped the spatial solid builder'
    centers=vertices[faces,:2].mean(axis=1)
    keys=np.floor(centers[:,1]/192).astype(int)*32+np.floor(centers[:,0]/192).astype(int)
    order=np.argsort(keys,kind='stable');keys=keys[order]
    breaks=np.r_[0,np.flatnonzero(keys[1:]!=keys[:-1])+1,len(order)]
    batches=[]
    for first,last in zip(breaks,breaks[1:]):
        selected=faces[order[first:last]]
        for start in range(0,len(selected),16000):
            used,indices=np.unique(selected[start:start+16000].ravel(),return_inverse=True)
            assert len(used)<65536
            positions=vertices[used];records=np.zeros((len(used),28),np.uint8)
            records[:,:12]=np.ascontiguousarray(positions,dtype='<f4').view(np.uint8).reshape(-1,12)
            records[:,12:24]=np.ascontiguousarray(normals[used],dtype='<f4').view(np.uint8).reshape(-1,12)
            records[:,24:27]=[245,245,245]
            bounds=[positions[:,0].min()/width,positions[:,1].min()/height,positions[:,0].max()/width,positions[:,1].max()/height]
            batches.append((records,indices.astype('<u2'),bounds))
    binary=bytearray(struct.pack('<4sIHHII',b'NIRV',4,width,height,len(batches),1))
    for records,indices,bounds in batches:
        binary+=struct.pack('<II4f',len(records),len(indices),*bounds)+records.tobytes()+indices.tobytes()
    (output/'filaments.bin').write_bytes(binary)
    (output/'filaments.bin.gz').write_bytes(gzip.compress(bytes(binary),compresslevel=9,mtime=0))
    previous=json.loads((output/'filaments.json').read_text()) if (output/'filaments.json').exists() else {}
    meta={**previous,**(trace_metadata or {}),'sourceSize':list(source_size or previous.get('sourceSize',[7020,9928])),'traceSize':[width,height],'bodies':1,'meshComponents':1,'openEdges':0,'integratedSourceMarks':len(paint),'sourceContacts':contacts,'style':'Original drawing, united into one white spatial body','vertices':len(vertices),'triangles':len(faces),'batches':len(batches),'maxEdgeInSourcePixels':max_edge,'spatialBounds':{'min':vertices.min(axis=0).tolist(),'max':vertices.max(axis=0).tolist()},'format':'NIRV v4: one closed spatial solid'}
    (output/'filaments.json').write_text(json.dumps(meta,indent=2)+'\n')
    print(json.dumps(meta,indent=2),flush=True)

if __name__=='__main__':build_spatial_tree(Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'assets/images/nire')
