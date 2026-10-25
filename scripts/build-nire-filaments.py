"""Build a connected vascular skin from the original ÑIRE drawing.

Development dependencies: Pillow, numpy, scipy, scikit-image, fast-simplification.
Usage: python build-nire-filaments.py ORIGINAL_IMAGE [OUTPUT_DIRECTORY]
Run build-nire-materials.py first to exclude those pigments from the veins.
The browser reads the finished mesh; no Python dependencies are used by the site.
"""
import gzip
import json
import math
from pathlib import Path
import struct
import sys

import fast_simplification
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import distance_transform_edt, gaussian_filter, label, convolve, map_coordinates
from scipy.spatial import cKDTree
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from skimage.filters import apply_hysteresis_threshold
from skimage.graph import route_through_array
from skimage.measure import marching_cubes
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
if material_path.exists():
    material=np.asarray(Image.open(material_path).convert('RGB'))
    r,g,b=[rgb[:,:,i].astype(np.float32) for i in range(3)]
    pigment=((material[:,:,0]>32)&(b<np.minimum(r,g)*.82))|((material[:,:,1]>32)&(r>g*1.35)&(b>g*1.1))|((material[:,:,2]>32)&(r>b*1.1)&(g<r*.88))
    light[pigment]=0

# Hysteresis follows the faint connecting lines instead of cutting them wherever
# their brightness changes. Broad painted areas may carry the underlying veins.
original_ink = apply_hysteresis_threshold(light, 7, 22)
skeleton = skeletonize(original_ink)
labels, _ = label(skeleton, np.ones((3, 3)))
sizes = np.bincount(labels.ravel()); sizes[0] = 0
main_id = int(sizes.argmax())
network = labels == main_id
candidates = [int(i) for i in np.argsort(-sizes) if i != main_id and sizes[i] >= 60]
bridges = 0
# Restore the few remaining interruptions along the original faint paint. Small
# isolated pigment fragments are omitted from the vascular body.
for component in candidates:
    points = np.argwhere(labels == component)
    target = np.argwhere(network)
    distances, indices = cKDTree(target[::2]).query(points)
    nearest = int(distances.argmin())
    if distances[nearest] > 110:
        continue
    a = points[nearest]; b = target[::2][indices[nearest]]
    low = np.maximum(0, np.minimum(a, b)-16)
    high = np.minimum([height, width], np.maximum(a, b)+17)
    region = light[low[0]:high[0], low[1]:high[1]]
    cost = 1 + 12*np.exp(-region/11)
    route, _ = route_through_array(cost, tuple(a-low), tuple(b-low), fully_connected=True)
    route = np.asarray(route)+low
    network[route[:, 0], route[:, 1]] = True
    network[points[:, 0], points[:, 1]] = True
    bridges += 1
network = skeletonize(network)
# Remove short terminal hairs while keeping every connection and closed loop.
for _ in range(2):
    degree = convolve(network.astype(np.uint8), np.ones((3, 3), np.uint8), mode='constant')-network
    tips = np.argwhere(network & (degree == 1))
    remove = []
    for tip in tips:
        path = [tuple(tip)]; previous = None; current = tuple(tip)
        while len(path) <= 9:
            neighbours = [(y, x) for y in range(max(0,current[0]-1), min(height,current[0]+2)) for x in range(max(0,current[1]-1), min(width,current[1]+2)) if network[y,x] and (y,x) != current and (y,x) != previous]
            if len(neighbours) != 1:
                break
            previous, current = current, neighbours[0]
            path.append(current)
            if degree[current] != 2:
                break
        if len(path) <= 9 and degree[current] > 2:
            remove.extend(path[:-1])
    if remove:
        coords = np.asarray(remove); network[coords[:,0], coords[:,1]] = False
_, body_count = label(network, np.ones((3, 3)))
assert body_count == 1, f'Expected one vascular network, got {body_count}'
Image.fromarray((network*255).astype(np.uint8)).save(output/'vein-network.png', optimize=True)

ys, xs = np.nonzero(network)
pad = 4
origin = np.array([int(ys.min())-pad, int(xs.min())-pad])
end = np.array([int(ys.max())+pad+1, int(xs.max())+pad+1])
shape = tuple(end-origin)
local = np.zeros(shape, bool)
local[ys-origin[0], xs-origin[1]] = True
distance = distance_transform_edt(~local).astype(np.float32)
# One gently varying diameter replaces thick isolated cylindrical fragments.
radius = 1.18
field2d = gaussian_filter(radius*radius-distance*distance, .38) + .29
levels = np.linspace(-1.8, 1.8, 13, dtype=np.float32)
field = field2d[:, :, None]-levels[None, None, :]**2
vertices, faces, normals, _ = marching_cubes(field, level=0, spacing=(1,1,float(levels[1]-levels[0])), allow_degenerate=False)
del field, distance, field2d
# Keep the continuous skin, while removing redundant surface triangles.
vertices, faces = fast_simplification.simplify(vertices, faces, target_reduction=.8, agg=5)
vertices = vertices.astype(np.float32)
vertices[:,2] += levels[0]
vertices[:,:2] += origin
# Taubin smoothing rounds the shared surface without shrinking the thin veins.
edges = np.sort(np.concatenate([faces[:,[0,1]], faces[:,[1,2]], faces[:,[2,0]]]),axis=1)
unique_edges, occurrences = np.unique(edges, axis=0, return_counts=True)
boundary_edges = int(np.count_nonzero(occurrences != 2))
assert boundary_edges == 0, f'Open vascular surface: {boundary_edges} edges'
rows = np.r_[unique_edges[:,0],unique_edges[:,1]]
cols = np.r_[unique_edges[:,1],unique_edges[:,0]]
adjacency = coo_matrix((np.ones(len(rows),np.float32),(rows,cols)),shape=(len(vertices),len(vertices))).tocsr()
mesh_components = connected_components(adjacency, directed=False, return_labels=False)
assert mesh_components == 1, f'Expected one mesh, got {mesh_components}'
weight = np.asarray(adjacency.sum(axis=1)).ravel()
for _ in range(3):
    for step in (.33,-.34):
        average = adjacency @ vertices / weight[:,None]
        vertices += step*(average-vertices)
# Recompute normals after smoothing; the whole skin shares welded junctions.
triangles = vertices[faces]
face_normals = np.cross(triangles[:,1]-triangles[:,0],triangles[:,2]-triangles[:,0])
normals = np.zeros_like(vertices)
for corner in range(3):
    np.add.at(normals, faces[:,corner], face_normals)
normals /= np.maximum(1e-10,np.linalg.norm(normals,axis=1,keepdims=True))
if np.mean(normals[:,2]*vertices[:,2]) < 0:
    normals *= -1
# Use local source pigment, with smooth color through the repaired connections.
ink_weight = gaussian_filter(original_ink.astype(np.float32),2)
color_image = np.stack([gaussian_filter(rgb[:,:,c].astype(np.float32)*original_ink,2)/np.maximum(.001,ink_weight) for c in range(3)],axis=2)
color = np.stack([map_coordinates(color_image[:,:,c],[vertices[:,0],vertices[:,1]],order=1,mode='nearest') for c in range(3)],axis=1)
color = np.clip(color,0,255).astype(np.uint8)
# Remove the flat, broken thin marks beneath the continuous modeled surface.
ink_distance = distance_transform_edt(original_ink)
thin = original_ink & (ink_distance < 7)
mask = Image.fromarray((thin*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(.7))
mask.save(output/'filament-mask.png', optimize=True)
# Split only for WebGL's 16-bit indices. Shared boundary vertices have exactly
# the same quantized positions and normals, so there are no visible batch seams.
centers = vertices[faces,:2].mean(axis=1)
keys = (np.floor(centers[:,0]/192).astype(int)*32+np.floor(centers[:,1]/192).astype(int))
order = np.argsort(keys,kind='stable')
keys = keys[order]
breaks = np.r_[0,np.flatnonzero(keys[1:]!=keys[:-1])+1,len(order)]
batches = []
for first,last in zip(breaks,breaks[1:]):
    selected = faces[order[first:last]]
    # Dense fine cracks in the painted crown can exceed one index buffer.
    for start in range(0,len(selected),16000):
        selected_faces = selected[start:start+16000]
        used, indices = np.unique(selected_faces.ravel(), return_inverse=True)
        assert len(used) <= 65535
        positions = vertices[used]
        records = np.zeros((len(used),12),np.uint8)
        packed = np.column_stack([positions[:,1]*8,positions[:,0]*8,positions[:,2]*8192])
        records[:,:6] = np.rint(packed).astype('<i2').view(np.uint8).reshape(-1,6)
        records[:,6:9] = np.rint(normals[used][:,[1,0,2]]*127).astype(np.int8).view(np.uint8)
        records[:,9:12] = color[used]
        bounds = [float(positions[:,1].min()/width),float(positions[:,0].min()/height),float(positions[:,1].max()/width),float(positions[:,0].max()/height)]
        batches.append((records, indices.astype('<u2'), bounds))
mesh = bytearray(struct.pack('<4sIHHII',b'NIRV',2,width,height,len(batches),mesh_components))
for records,indices,bounds in batches:
    mesh += struct.pack('<II4f',len(records),len(indices),*bounds)
    mesh += records.tobytes()+indices.tobytes()
(output/'filaments.bin').write_bytes(mesh)
(output/'filaments.bin.gz').write_bytes(gzip.compress(bytes(mesh),compresslevel=9,mtime=0))
meta = {'sourceSize':list(source_size),'traceSize':[width,height],'bodies':body_count,'meshComponents':int(mesh_components),'openEdges':boundary_edges,'connectedGaps':bridges,'centerlinePixels':int(network.sum()),'vertices':len(vertices),'triangles':len(faces),'batches':len(batches),'diameterInSourcePixels':radius*2,'format':'NIRV v2: one closed vascular skin, spatial batches with welded boundaries'}
(output/'filaments.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(meta,indent=2))
