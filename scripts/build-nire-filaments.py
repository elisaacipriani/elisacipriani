"""Trace the original ÑIRE drawing and embed its connected branches in space.

Development dependencies: Pillow, numpy, scipy, scikit-image, manifold3d.
Usage: python build-nire-filaments.py ORIGINAL_IMAGE [OUTPUT_DIRECTORY]
Run build-nire-materials.py first to exclude those pigments from the veins.
The browser reads the finished mesh; no Python dependencies are used by the site.
"""
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import distance_transform_edt, gaussian_filter, label
from scipy.spatial import cKDTree
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import minimum_spanning_tree
from skimage.filters import apply_hysteresis_threshold
from skimage.measure import approximate_polygon
from skimage.morphology import skeletonize

source = Path(sys.argv[1])
output = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parents[1] / 'assets/images/nire'
output.mkdir(parents=True, exist_ok=True)
original = Image.open(source)
source_size = original.size
width, height = 2262, 3200
rgb = np.array(original.convert('RGB').resize((width, height), Image.Resampling.LANCZOS))
original.close()
light = gaussian_filter(rgb.max(axis=2).astype(np.float32), .55)
# Colored paint is reconstructed as its own material. It must not also create
# vein skeletons, connecting beads or filling the broad rose and copper bodies.
material_path=output/'material-mask.png'
if not material_path.exists():material_path=Path(__file__).resolve().parents[1]/'assets/images/nire/material-mask.png'
if material_path.exists():
    material=np.asarray(Image.open(material_path).convert('RGB'))
    r,g,b=[rgb[:,:,i].astype(np.float32) for i in range(3)]
    pigment=((material[:,:,0]>32)&(b<np.minimum(r,g)*.82))|((material[:,:,1]>32)&(r>g*1.35)&(b>g*1.1))|((material[:,:,2]>32)&(r>b*1.1)&(g<r*.88))
    light[pigment]=0

# Trace the source marks before reducing them to a connected linear frame.
original_ink = apply_hysteresis_threshold(light, 5, 20)
skeleton = skeletonize(original_ink)
labels, _ = label(skeleton, np.ones((3, 3)))
sizes = np.bincount(labels.ravel()); sizes[0] = 0
skeleton = np.isin(labels, np.flatnonzero(sizes >= 350))
ys, xs = np.nonzero(skeleton)
coords = np.column_stack([ys, xs])
lookup = {tuple(point): i for i, point in enumerate(coords)}
rows, cols, weights = [], [], []
for i, (y, x) in enumerate(coords):
    for dy, dx in ((0,1),(1,-1),(1,0),(1,1)):
        neighbour = (y+dy,x+dx)
        if neighbour not in lookup:
            continue
        rows.append(i); cols.append(lookup[neighbour])
        weights.append(np.hypot(dx,dy)/(10+(float(light[y,x])+float(light[neighbour]))/2))
graph = coo_matrix((weights,(rows,cols)),shape=(len(coords),len(coords))).tocsr()
forest = minimum_spanning_tree(graph+graph.T).tocoo()
neighbours = [set() for _ in coords]
for a,b in zip(forest.row,forest.col):
    neighbours[a].add(b); neighbours[b].add(a)
# Keep the long gesture of each contour; remove the small twigs and rungs.
for _ in range(12):
    remove = set()
    for start in [i for i,n in enumerate(neighbours) if len(n)==1]:
        path = [start]; previous = -1; current = start; length = 0
        while len(neighbours[current]) <= 2:
            choices = neighbours[current]-{previous}
            if not choices:
                break
            following = next(iter(choices))
            length += np.linalg.norm(coords[following]-coords[current])
            previous,current = current,following; path.append(current)
            if length >= 180 or len(neighbours[current]) != 2:
                break
        if length < 180 and len(neighbours[current]) > 2:
            remove.update(path[:-1])
    if not remove:
        break
    for i in remove:
        for j in neighbours[i]: neighbours[j].discard(i)
        neighbours[i].clear()
# Treat the main source contours as one frame, across the gaps hidden by paint.
seen=set();structures=[]
for start,links in enumerate(neighbours):
    if not links or start in seen:continue
    stack=[start];component=[];seen.add(start)
    while stack:
        current=stack.pop();component.append(current)
        for following in neighbours[current]:
            if following not in seen:seen.add(following);stack.append(following)
    structures.append(component)
structures.sort(key=len,reverse=True)
structure=set(structures[0])
remaining=[component for component in structures[1:] if len(component)>=260]
bridges=0
while remaining:
    core=np.array(sorted(structure));tree=cKDTree(coords[core])
    choices=[]
    for index,component in enumerate(remaining):
        distance,nearest=tree.query(coords[component])
        best=int(np.argmin(distance))
        choices.append((distance[best],index,component[best],core[nearest[best]]))
    distance,index,a,b=min(choices)
    if distance>420:break
    neighbours[a].add(b);neighbours[b].add(a)
    structure.update(remaining.pop(index));bridges+=1
# Small detached ornaments stay out of the shared frame.
for i in range(len(neighbours)):
    if i not in structure:neighbours[i].clear()

def sample_segment(a,b):
    count=max(2,int(np.ceil(np.linalg.norm(b-a)/.35))+1)
    return np.linspace(a,b,count)

def restrained_path(points):
    # Long straight runs, with only a small quadratic fillet at each corner.
    # There is no interpolating spline, so no overshoot, S-curves or extra loops.
    parts=[];last=points[0]
    for i in range(1,len(points)-1):
        a,b,c=points[i-1:i+2]
        incoming=b-a;outgoing=c-b
        before=np.linalg.norm(incoming);after=np.linalg.norm(outgoing)
        cut=min(2.5,before*.12,after*.12)
        enter=b-incoming/before*cut;leave=b+outgoing/after*cut
        parts.append(sample_segment(last,enter)[:-1])
        t=np.linspace(0,1,max(5,int(np.ceil(cut*2/.25))+1))[:,None]
        parts.append(((1-t)**2*enter+2*(1-t)*t*b+t*t*leave)[:-1])
        last=leave
    parts.append(sample_segment(last,points[-1]))
    return np.concatenate(parts)

# Simplify the gesture itself, rather than smoothing every small source wiggle.
visited = set(); strokes = []
for start, links in enumerate(neighbours):
    if not links or len(links)==2:
        continue
    for following in links:
        key = tuple(sorted((start,following)))
        if key in visited:
            continue
        path = [start]; previous,current = start,following; visited.add(key)
        while True:
            path.append(current)
            if len(neighbours[current])!=2:
                break
            following = next(iter(neighbours[current]-{previous}))
            key = tuple(sorted((current,following)))
            if key in visited:
                break
            visited.add(key); previous,current = current,following
        raw = coords[path].astype(float)
        points = approximate_polygon(raw,tolerance=26.0)
        if len(points)<2:
            continue
        arc = np.r_[0,np.cumsum(np.linalg.norm(np.diff(points,axis=0),axis=1))]
        if arc[-1]<3:
            continue
        smooth = restrained_path(points)
        strokes.append(smooth)
samples = np.concatenate(strokes)
# Embed the connected source graph in space. Each branch keeps its long, straight
# gesture while forks leave the drawing plane in alternating directions.
node_lookup={};nodes=[];links=[]
def node_index(point):
    key=tuple(np.round(point,3))
    if key not in node_lookup:node_lookup[key]=len(nodes);nodes.append(point)
    return node_lookup[key]
for i,stroke in enumerate(strokes):
    a,b=node_index(stroke[0]),node_index(stroke[-1])
    length=float(np.linalg.norm(np.diff(stroke,axis=0),axis=1).sum())
    links.append((a,b,i,length))
node_links=[[] for _ in nodes]
for a,b,i,length in links:node_links[a].append((b,i,length));node_links[b].append((a,i,length))
root=max(range(len(nodes)),key=lambda i:nodes[i][0])
depth=np.full(len(nodes),np.nan);depth[root]=0
queue=[(root,.0)];fork=0
while queue:
    at,slope=queue.pop(0)
    children=sorted([link for link in node_links[at] if np.isnan(depth[link[0]])],key=lambda link:-link[2])
    if len(children)>1:fork+=1
    for rank,(other,index,length) in enumerate(children):
        lean=slope if len(children)==1 or rank==0 else 1.1*np.sin(fork*2.399963+rank*2.1)
        if rank>0 and abs(lean)<.45:lean=.65 if fork%2 else -.65
        depth[other]=depth[at]+length*lean
        queue.append((other,lean))
assert np.all(np.isfinite(depth)),'The spatial branch graph must stay connected'
depth=(depth-(depth.max()+depth.min())*.5)*(width*.92/max(1,depth.max()-depth.min()))
stroke_depth=[];form_paths=[]
for a,b,i,length in links:
    stroke=strokes[i];arc=np.r_[0,np.cumsum(np.linalg.norm(np.diff(stroke,axis=0),axis=1))]
    z=depth[a]+(depth[b]-depth[a])*arc/max(1e-10,arc[-1]);stroke_depth.append(z)
    simple=approximate_polygon(stroke,tolerance=.25)
    _,kept=cKDTree(stroke).query(simple)
    path=np.column_stack([simple[:,1],simple[:,0],z[kept]])
    form_paths.append(np.round(path,4).tolist())
(output/'form.json').write_text(json.dumps({'width':width,'height':height,'depthSpan':float(np.ptp(depth)),'paths':form_paths},separators=(',',':'))+'\n')
network = np.zeros((height,width),bool)
rounded = np.rint(samples).astype(int)
network[np.clip(rounded[:,0],0,height-1),np.clip(rounded[:,1],0,width-1)] = True
_, body_count = label(network,np.ones((3,3)))
Image.fromarray((network*255).astype(np.uint8)).save(output/'vein-network.png',optimize=True)
if '--outline-only' in sys.argv:
    (output/'outline.json').write_text(json.dumps({'paths':[stroke.tolist() for stroke in strokes],'connectedComponents':body_count,'junctions':sum(len(n)>2 for n in neighbours)},separators=(',',':')))
    print(json.dumps({'paths':len(strokes),'connectedComponents':body_count,'junctions':sum(len(n)>2 for n in neighbours),'joinedInterruptions':bridges}))
    sys.exit(0)

# Keep the source-photo transition clean while the spatial solid loads.
ink_distance=distance_transform_edt(original_ink)
thin=original_ink&(ink_distance<7)
Image.fromarray((thin*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(.7)).save(output/'filament-mask.png',optimize=True)
from build_nire_spatial import build_spatial_tree
build_spatial_tree(output,source_size,{'connectedGaps':bridges,'junctions':sum(len(n)>2 for n in neighbours),'tracedPaths':len(strokes),'centerlinePixels':int(network.sum())})
