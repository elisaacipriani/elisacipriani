"""Create two closed, cast-glass / basalt sculptures for the mineral gallery.

Development dependencies: numpy, scipy. No runtime modelling dependency.
"""
from pathlib import Path
import gzip
import json
import struct
import numpy as np

out=Path(__file__).resolve().parents[1]/'assets/images/nire'
segments=192;layers=272

def noise(points):
    grid=np.floor(points);f=points-grid;u=f*f*(3-2*f)
    def h(dx,dy,dz):
        p=np.mod((grid+np.array([dx,dy,dz]))*.1031,1)
        p+=np.sum(p*(p[:,[1,2,0]]+33.33),axis=1)[:,None]
        return np.mod((p[:,0]+p[:,1])*p[:,2],1)
    mix=lambda a,b,t:a+(b-a)*t
    return mix(mix(mix(h(0,0,0),h(1,0,0),u[:,0]),mix(h(0,1,0),h(1,1,0),u[:,0]),u[:,1]),mix(mix(h(0,0,1),h(1,0,1),u[:,0]),mix(h(0,1,1),h(1,1,1),u[:,0]),u[:,1]),u[:,2])

bodies=[];all_positions=[];body_meta=[]
for body_id,(height,width,depth,xoffset,zoffset,yaw,seed) in enumerate([(320,190,145,-105,-9,-.18,3.7),(390,150,128,78,19,.13,8.3)]):
    theta=np.arange(segments)/segments*2*np.pi
    # Broad, rounded stone faces; a narrower and chipped glass neck.
    cx=np.sign(np.cos(theta))*np.abs(np.cos(theta))**.59
    cz=np.sign(np.sin(theta))*np.abs(np.sin(theta))**.59
    # The crown is one solid fractured ridge, not a raised rim around a hollow.
    crown_x=np.array([-1,-.77,-.57,-.36,-.17,.02,.22,.43,.70,1])
    crown_y=np.array([.88,.91,.88,.91,1.03,1.055,1.015,.94,.86,.82] if body_id==0 else [.80,.86,.86,.94,1.06,1.05,.98,.97,.88,.81])
    def crown(x,z):
        return height*(np.interp(x,crown_x,crown_y)+z*.018+.008*np.sin(x*17+z*8+seed))
    top=crown(cx,cz)
    positions=[];locals=[];fractions=[]
    for j in range(layers+1):
        t=j/layers
        taper=np.interp(t,[0,.20,.40,.52,.65,.80,1],[1,.98,.94,.88,.79,.70,.65] if body_id==0 else [1,.96,.88,.83,.70,.63,.56])
        bevel=.95+.05*min(1,t/.018)
        lean=(-.07 if body_id==0 else .045)*height*t**1.3
        px=cx*width*.5*taper*bevel+lean
        pz=cz*depth*.5*(1-.18*t)*bevel
        py=top*t
        p=np.column_stack([px,py,pz])
        macro=noise(p*np.array([.043,.010,.043])+seed)-.5
        micro=noise(p*.29+seed*2)-.5
        relief=(macro*(6.5 if t<.56 else 3.3)+micro*.65)*min(1,t/.03)
        p[:,0]+=cx*relief;p[:,2]+=cz*relief
        positions.extend(p.tolist());locals.extend(np.column_stack([p[:,0]/height,np.full(segments,t),p[:,2]/height]).tolist());fractions.extend([t]*segments)
    faces=[]
    for j in range(layers):
        for k in range(segments):
            a=j*segments+k;b=j*segments+(k+1)%segments;c=(j+1)*segments+k;d=(j+1)*segments+(k+1)%segments
            faces.extend([[a,c,b],[b,c,d]])
    bottom=len(positions);positions.append([0,0,0]);locals.append([0,0,0]);fractions.append(0)
    for k in range(segments):faces.append([bottom,k,(k+1)%segments])
    previous=np.arange(layers*segments,(layers+1)*segments)
    # Concentric rings follow the same crown heightfield through the interior.
    # Every ring therefore belongs to the solid block and meets the edge cleanly.
    top_center=np.array([(-.07 if body_id==0 else .045)*height,0,0.])
    for r in np.linspace(.96,.04,24):
        ring=[]
        for k in range(segments):
            edge=np.asarray(positions[layers*segments+k])
            p=top_center+(edge-top_center)*r;p[1]=crown(cx[k]*r,cz[k]*r)
            ring.append(len(positions));positions.append(p.tolist());locals.append([p[0]/height,1,p[2]/height]);fractions.append(1)
        for k in range(segments):
            a,b=previous[k],previous[(k+1)%segments];c,d=ring[k],ring[(k+1)%segments]
            faces.extend([[a,c,b],[b,c,d]])
        previous=ring
    tip=len(positions);positions.append([top_center[0],float(crown(0,0)),0]);locals.append([top_center[0]/height,1,0]);fractions.append(1)
    for k in range(segments):faces.append([previous[k],tip,previous[(k+1)%segments]])
    p=np.asarray(positions,np.float64);tri=np.asarray(faces,np.int32)
    volume=np.einsum('ij,ij->i',p[tri[:,0]],np.cross(p[tri[:,1]],p[tri[:,2]])).sum()/6
    if volume<0:tri=tri[:,[0,2,1]]
    edges=np.sort(np.concatenate([tri[:,[0,1]],tri[:,[1,2]],tri[:,[2,0]]]),axis=1)
    unique,counts=np.unique(edges,axis=0,return_counts=True)
    assert np.all(counts==2),'Each mineral piece must be closed'
    directed=np.concatenate([tri[:,[0,1]],tri[:,[1,2]],tri[:,[2,0]]])
    assert len(np.unique(directed,axis=0))==len(directed),'Surface winding must agree at every seam'
    normal=np.zeros_like(p);fn=np.cross(p[tri[:,1]]-p[tri[:,0]],p[tri[:,2]]-p[tri[:,0]])
    for corner in range(3):np.add.at(normal,tri[:,corner],fn)
    normal/=np.maximum(1e-12,np.linalg.norm(normal,axis=1,keepdims=True))
    rotation=np.array([[np.cos(yaw),0,np.sin(yaw)],[0,1,0],[-np.sin(yaw),0,np.cos(yaw)]])
    p=p@rotation.T;p+=np.array([xoffset,0,zoffset]);normal=normal@rotation.T
    records=np.column_stack([p,normal,np.asarray(locals),np.asarray(fractions),np.full(len(p),body_id)]).astype('<f4')
    assert len(p)<65536
    bodies.append((records,tri.astype('<u2').ravel()))
    all_positions.extend(p.tolist());body_meta.append({'height':height,'vertices':len(p),'triangles':len(tri),'openEdges':0})
points=np.asarray(all_positions)
binary=bytearray(struct.pack('<4sIII',b'NIRP',1,len(bodies),0))
for records,indices in bodies:
    binary+=struct.pack('<II',len(records),len(indices))+records.tobytes()+indices.tobytes()
(out/'mineral-pieces.bin').write_bytes(binary)
(out/'mineral-pieces.bin.gz').write_bytes(gzip.compress(bytes(binary),compresslevel=9,mtime=0))
metadata={'pieces':body_meta,'bounds':{'min':points.min(axis=0).tolist(),'max':points.max(axis=0).tolist()},'material':'weathered basalt base, olive cast glass, clear fractured tips','format':'NIRP v1'}
(out/'mineral-pieces.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(metadata,indent=2))
