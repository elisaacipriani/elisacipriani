"""A spatial herbarium: seed heads, dry flowers, translucent leaves and grasses.

Every specimen grows from an actual point of the existing tree. The small stone
is a separate preserved asset. This script creates geometry, not image planes.
"""
from pathlib import Path
import gzip,json,struct
import numpy as np
from scipy.interpolate import CubicSpline
from scipy.spatial import cKDTree

OUT=Path(__file__).resolve().parents[1]/'assets/images/nire'
form=json.loads((OUT/'form.json').read_text())
rng=np.random.default_rng(1647)
segments=[(np.array(a,float),np.array(b,float)) for path in form['paths'] for a,b in zip(path[:-1],path[1:]) if np.linalg.norm(np.array(a)[:2]-np.array(b)[:2])>.01]
batches=[];specimens=[];occluders=[]
def norm(v):return v/max(np.linalg.norm(v),1.e-10)
def anchor(x,y):
    candidates=[]
    for a,b in segments:
        t=np.clip(np.dot(np.array([x,y])-a[:2],(b-a)[:2])/np.dot((b-a)[:2],(b-a)[:2]),0,1)
        p=a+(b-a)*t;candidates.append((np.linalg.norm(p[:2]-[x,y]),p))
    p=min(candidates,key=lambda item:item[0])[1]
    return np.array([p[0]-1131,1600-p[1],p[2]])
def smooth(points,count=36):
    points=np.array(points,float);t=np.r_[0,np.cumsum(np.linalg.norm(np.diff(points,axis=0),axis=1))];t/=t[-1]
    return CubicSpline(t,points,axis=0,bc_type='natural')(np.linspace(0,1,count))
def normal(p,f):
    out=np.zeros_like(p);n=np.cross(p[f[:,1]]-p[f[:,0]],p[f[:,2]]-p[f[:,0]])
    for j in range(3):np.add.at(out,f[:,j],n)
    return out/np.maximum(np.linalg.norm(out,axis=1,keepdims=True),1.e-12)
def add(p,f,kind,color,uv=None):
    p=np.array(p,float);f=np.array(f,int)
    if not len(f):return
    if uv is None:uv=np.zeros((len(p),2))
    # All elements are rigid, real 3D geometry with a consistent physical scale.
    scale=2.1 if specimens[-1]['name']=='gramínea aérea' else 1.65
    world=((p*scale)@rotation.T+origin)/2262
    n=normal(p,f)@rotation.T
    c=np.tile(color,(len(p),1))
    records=np.column_stack([world,n,c,uv,np.ones(len(p))]).astype('<f4')
    for i in range(0,len(f),16000):
        used,ix=np.unique(f[i:i+16000].ravel(),return_inverse=True)
        batches.append((kind,len(specimens)-1,records[used],ix.astype('<u2'),world[used].mean(0)))
def tube(points,radius=.55,kind=0,color=(.37,.32,.23),sides=8):
    points=np.array(points,float);tangent=np.gradient(points,axis=0);tangent/=np.maximum(np.linalg.norm(tangent,axis=1,keepdims=True),1.e-9)
    p=[];uv=[]
    for i,(q,t) in enumerate(zip(points,tangent)):
        axis=norm(np.cross(t,[0,0,1] if abs(t[2])<.85 else [1,0,0]));other=np.cross(t,axis)
        r=radius if np.isscalar(radius) else radius[i]
        for j,theta in enumerate(np.arange(sides)*2*np.pi/sides):p.append(q+r*(axis*np.cos(theta)+other*np.sin(theta)));uv.append([i/(len(points)-1),j/sides])
    f=[]
    for i in range(len(points)-1):
        for j in range(sides):
            a=i*sides+j;b=i*sides+(j+1)%sides;c=(i+1)*sides+j;d=(i+1)*sides+(j+1)%sides
            f.extend([[a,b,c],[b,d,c]])
    add(p,f,kind,color,uv)
def sphere(center,radius,kind=1,color=(.69,.76,.72),scale=(1,1,1),lat=18,lon=24):
    if kind==3:kind=8
    if kind==1 and radius>3:
        size=2.1 if specimens[-1]['name']=='gramínea aérea' else 1.65
        occluders.append((((np.array(center)*size)@rotation.T+origin)/2262,radius*size/2262))
    p=[];uv=[]
    for i in range(lat+1):
        phi=np.pi*i/lat
        for j in range(lon+1):
            theta=2*np.pi*j/lon
            v=np.array([np.sin(phi)*np.cos(theta),np.cos(phi),np.sin(phi)*np.sin(theta)])
            variation=1.0
            if kind==1 and radius>3:
                variation+=.006*np.sin(theta*3+phi*2)*np.sin(phi)**2-.035*np.exp(-(phi/.19)**2)
            elif kind==8:
                variation+=.008*np.sin(theta*3+phi*5)*np.sin(phi)**2
            p.append(np.array(center)+v*np.array(scale)*radius*variation);uv.append([j/lon,i/lat])
    f=[]
    for i in range(lat):
        for j in range(lon):
            a=i*(lon+1)+j;f.extend([[a,a+lon+1,a+1],[a+1,a+lon+1,a+lon+2]])
    add(p,np.asarray(f)[:,[0,2,1]],kind,color,uv)
def disk(center,radius,kind=3,color=(.65,.77,.54),tilt=.35,phase=0):
    # A cupped tissue surface; the fine veins come from the photographic material.
    center=np.array(center,float);u=np.array([np.cos(phase),.15,np.sin(phase)]);u=norm(u);v=norm(np.cross([np.sin(tilt),0,np.cos(tilt)],u));n=np.cross(u,v)
    p=[center+n*radius*.09];uv=[[0,0]];rings=14;sides=64
    for r in range(1,rings+1):
        rr=r/rings
        for j in range(sides):
            t=j/sides*2*np.pi;rim=1+.018*np.sin(t*7+phase)+.012*np.cos(t*11)
            p.append(center+radius*rr*rim*(u*np.cos(t)+v*np.sin(t))+n*radius*(.09*(1-rr*rr)+.035*np.sin(t*2+phase)*rr**2));uv.append([rr*np.cos(t),rr*np.sin(t)])
    f=[[0,1+j,1+(j+1)%sides] for j in range(sides)]
    for r in range(rings-1):
        for j in range(sides):
            a=1+r*sides+j;b=1+r*sides+(j+1)%sides;c=a+sides;d=b+sides;f.extend([[a,b,c],[b,d,c]])
    add(p,f,kind,color,uv)
def flower(center,radius,petals=9):
    center=np.array(center,float)
    axis=norm(np.array([rng.uniform(-.2,.2),rng.uniform(.45,.8),rng.uniform(.6,1)]));u=norm(np.cross([0,1,0],axis));v=np.cross(axis,u)
    for j in range(petals):
        theta=j/petals*2*np.pi+rng.uniform(-.12,.12);radial=u*np.cos(theta)+v*np.sin(theta);side=norm(np.cross(radial,axis));p=[];uv=[];rows=15;cols=9
        length=radius*rng.uniform(.91,1.1);petal_phase=rng.uniform(0,6.28)
        for i in range(rows+1):
            t=i/rows;width=length*.23*np.sin(np.pi*t)**.72*(1+.035*np.sin(t*19+petal_phase))
            for k in range(cols+1):
                s=k/cols*2-1
                p.append(center+radial*length*t+side*s*width+axis*length*(.24*t*t+.12*s*s*np.sin(np.pi*t)+.012*np.sin(t*14+petal_phase)*s));uv.append([s,t])
        f=[]
        for i in range(rows):
            for k in range(cols):
                a=i*(cols+1)+k;f.extend([[a,a+1,a+cols+1],[a+1,a+cols+2,a+cols+1]])
        add(p,f,2,(.91,.89,.79),uv)
    sphere(center+axis*radius*.08,radius*.21,1,(.66,.60,.41),scale=(1,.75,1))
    for j in range(17):
        t=j*2.3999;r=radius*.18*np.sqrt((j+.5)/17);q=center+u*r*np.cos(t)+v*r*np.sin(t)+axis*radius*.22
        sphere(q,radius*.023,0,(.48,.42,.27),lat=6,lon=8)
def specimen(name,x,y,yaw=0):
    global origin,rotation
    origin=anchor(x,y);c,s=np.cos(yaw),np.sin(yaw);rotation=np.array([[c,0,s],[0,1,0],[-s,0,c]])
    specimens.append({'id':len(specimens),'name':name,'anchor':(origin/2262).tolist()})

# Glaucous seed clusters: round waxy surfaces, tiny dimples, woody pedicels.
for name,x,y,yaw in [('semillas de agua',760,1040,.15),('semillas de aire',1260,690,-.7),('semillas pequeñas',1670,650,.6)]:
    specimen(name,x,y,yaw);height=rng.uniform(130,170);stem=smooth([[0,0,0],[-10,height*.5,4],[2,height,0]],36);tube(stem,.8)
    for j in range(15):
        t=j*2.39996;rr=12*np.sqrt((j+.6)/15);q=np.array([rr*np.cos(t),height-7-j*4.6,rr*np.sin(t)])
        tube(smooth([[0,height*.52,0],q*.6+np.array([0,height*.18,0]),q],16),.40)
        r=rng.uniform(7,9.5);sphere(q,r,1,(.68,.76,.73),lat=32,lon=48)
        sphere(q+np.array([0,r*.94,0]),r*.19,0,(.43,.48,.39),scale=(1,.3,1),lat=8,lon=12)
        for k in range(5):
            phi=k/5*2*np.pi;tip=q+np.array([r*.23*np.cos(phi),r*.98,r*.23*np.sin(phi)])
            tube([q+[0,r*.91,0],tip],.24,0,(.57,.61,.47),5)

# Open umbels and dry papery flowers, placed where the old broad white marks lay.
for name,x,y,yaw in [('flor de papel',990,600,.5),('herbario suspendido',1430,570,-.3),('pequeña flor',1485,1080,.8),('flores secas',640,810,-.5)]:
    specimen(name,x,y,yaw);height=rng.uniform(145,190);bend=rng.uniform(-25,25)
    tube(smooth([[0,0,0],[bend*.6,height*.5,9],[bend,height,0]],40),np.linspace(.85,.38,40),0,(.41,.40,.28))
    top=np.array([bend,height,0]);flower(top,26 if name=='flor de papel' else 18,10)
    for j in range(8):
        t=j*2.39996;end=top+np.array([np.cos(t)*rng.uniform(25,55),rng.uniform(-55,-12),np.sin(t)*rng.uniform(15,37)])
        base=np.array([bend*.6,height*.55,4]);tube(smooth([base,(base+end)/2+[0,12,0],end],24),.32)
        flower(end,rng.uniform(5,9),6)
        for k in range(3):
            q=end+np.array([np.cos(k*2.1)*7,12+rng.uniform(0,9),np.sin(k*2.1)*7]);tube([end,q],.16,6,(.63,.58,.44),5)

# Transparent seed cases / lunaria-like leaf membranes, with visible inner veins.
for name,x,y,yaw in [('hojas de luz',1140,1180,.0),('membranas verdes',1540,600,-.4)]:
    specimen(name,x,y,yaw);tube(smooth([[0,0,0],[-12,85,10],[9,178,0]],42),.70,0,(.37,.44,.26))
    for j,(q,r) in enumerate([((-28,69,9),29),((32,106,-5),34),((-14,156,2),28)]):
        q=np.array(q);tube(smooth([[0,q[1]-25,0],q*.6+[0,15,0],q],18),.46,0,(.46,.55,.29));disk(q,r,3,(.60,.75,.47),tilt=.25+j*.4,phase=j*.43+.2)
    # An opal seed rests inside the clearest leaf.
    sphere([-14,156,0],4.2,1,(.82,.84,.71),lat=16,lon=20)

# One suspended air plant: slender tapered blades around a small dark bulb.
specimen('gramínea aérea',1790,640,.35)
sphere([0,15,0],13,0,(.34,.34,.21),scale=(.77,1.55,.75),lat=24,lon=32)
for j in range(17):
    theta=j*2.39996;height=rng.uniform(145,255);spread=rng.uniform(17,45);root=np.array([np.cos(theta)*6,21,np.sin(theta)*6])
    curve=smooth([root,[np.cos(theta)*spread*.8,height*.30,np.sin(theta)*spread*.8],[np.cos(theta+.6)*spread,height*.68,np.sin(theta+.6)*spread],[np.cos(theta+.2)*spread*.60,height,np.sin(theta+.2)*spread*.60]],60)
    p=[];uv=[]
    for i,q in enumerate(curve):
        t=i/(len(curve)-1);width=(1.4+1.8*np.sin(theta)**2)*np.sin(np.pi*(t*.88+.08))*(1-t)**.4
        tangent=norm(curve[min(i+1,len(curve)-1)]-curve[max(0,i-1)]);side=norm(np.cross(tangent,[0,0,1]));n=np.cross(tangent,side)
        for k in range(5):
            s=k/4*2-1;p.append(q+side*s*width+n*.4*(1-s*s));uv.append([s,t])
    f=[]
    for i in range(len(curve)-1):
        for k in range(4):
            a=i*5+k;f.extend([[a,a+1,a+5],[a+1,a+6,a+5]])
    add(p,f,4,(.39+rng.uniform(-.04,.04),.49+rng.uniform(-.03,.05),.21),uv)
for j in range(9):
    theta=j*2.3999;start=[np.cos(theta)*8,3,np.sin(theta)*8];end=[np.cos(theta)*rng.uniform(8,17),-rng.uniform(16,38),np.sin(theta)*11]
    tube(smooth([start,[end[0]*.6,-9,end[2]],end],18),.19,6,(.45,.39,.25),5)

# Fine copper / ochre trajectories hold tiny seeds, rather than thick tendrils.
for name,x,y,yaw in [('hilo cobrizo',1320,470,.25),('hilo ocre',690,840,-.45)]:
    specimen(name,x,y,yaw)
    curve=smooth([[0,0,0],[-46,105,12],[34,196,-13],[78,265,6],[17,283,22],[-20,240,8]],130)
    tube(curve,.46,5,(.65,.29,.17),8)
    for j in range(11):
        q=curve[16+j*9];s=np.array([rng.uniform(8,18),rng.uniform(6,17),rng.uniform(-9,9)]);tube([q,q+s],.18,0,(.55,.46,.29),5);sphere(q+s,1.6,1,(.77,.72,.53),lat=8,lon=12)

# A glass seed pod with a delicate inner stalk at the lower central branch.
specimen('cápsula de rocío',1170,1320,.3)
tube(smooth([[0,0,0],[9,42,0],[-3,91,0]],30),.65)
sphere([-3,112,0],25,3,(.65,.82,.78),scale=(.62,1.20,.61),lat=40,lon=64)
tube(smooth([[-3,91,0],[-8,115,2],[-4,140,0]],30),.32,0,(.44,.53,.33))
for j in range(7):sphere([-3+np.cos(j*2.4)*5,100+j*4,np.sin(j*2.4)*4],2.3,1,(.74,.78,.62),lat=12,lon=16)

# A low hanging seed case gives the installation a quiet contact with the glass.
specimen('semilla suspendida',1110,2070,-.35)
tube(smooth([[0,0,0],[-9,-56,3],[18,-105,5]],40),.35,0,(.45,.42,.29))
sphere([18,-119,5],15,3,(.71,.81,.72),scale=(.60,1.25,.64),lat=32,lon=48)
sphere([18,-120,5],7.2,1,(.40,.44,.25),scale=(.70,1.08,.72),lat=24,lon=32)

# Merge opaque pieces by specimen/material to keep phone draw calls bounded.
groups={};merged=[]
for batch in batches:
    if batch[0] in (3,8):merged.append(batch)
    else:groups.setdefault((batch[0],batch[1]),[]).append(batch)
for (kind,ident),parts in groups.items():
    records=np.concatenate([part[2] for part in parts]);offsets=np.r_[0,np.cumsum([len(part[2]) for part in parts])]
    faces=np.concatenate([part[3].reshape(-1,3).astype(np.int32)+offset for part,offset in zip(parts,offsets)])
    for i in range(0,len(faces),16000):
        used,ix=np.unique(faces[i:i+16000].ravel(),return_inverse=True)
        merged.append((kind,ident,records[used],ix.astype('<u2'),records[used,:3].mean(0)))
batches=merged
# Approximate crevice occlusion from the real neighbouring seeds. This stays
# attached to the material through the complete spatial rotation.
centers=np.array([item[0] for item in occluders]);radii=np.array([item[1] for item in occluders]);near=cKDTree(centers)
for kind,ident,records,indices,center in batches:
    if kind in (3,8):continue
    distance,ids=near.query(records[:,:3],k=min(6,len(centers)))
    delta=centers[ids]-records[:,:3,None].transpose(0,2,1)
    direction=delta/np.maximum(distance[:,:,None],1.e-10)
    facing=np.clip(np.sum(direction*records[:,None,3:6],axis=2),0,1)
    gap=np.maximum(0,distance-radii[ids]);shade=np.exp(-gap/np.maximum(radii[ids]*.60,1.e-7))*facing
    records[:,11]=np.clip(1-shade.sum(axis=1)*.27,.32,1)
binary=bytearray(struct.pack('<4sII',b'NIRP',2,len(batches)))
for kind,ident,records,indices,center in batches:
    binary+=struct.pack('<IIII3f',kind,ident,len(records),len(indices),*center)+records.tobytes()+indices.tobytes()
(OUT/'botany.bin').write_bytes(binary);(OUT/'botany.bin.gz').write_bytes(gzip.compress(binary,9,mtime=0))
meta={'version':2,'specimens':specimens,'batches':len(batches),'triangles':sum(len(b[3])//3 for b in batches),'materials':['stem','seed','petal','leaf tissue','grass','copper','fibre','vein','glass capsule'],'photographicMaterials':['leaf-albedo-v2.png','seed-wax-v2.png'],'bakedContactOcclusion':True}
(OUT/'botany.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'specimens':len(specimens),'batches':len(batches),'triangles':meta['triangles'],'compressedBytes':len(gzip.compress(binary,9,mtime=0))}))
