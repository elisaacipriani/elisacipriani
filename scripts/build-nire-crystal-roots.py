"""A connected aerial-root crown for the small glass specimen.

Smooth unions join the tapered roots at their forks. The website receives one
closed glass surface, with real depth and optical radius stored per vertex.
"""
from pathlib import Path
import gzip
import json
import struct
import numpy as np
from scipy.interpolate import CubicSpline
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree
from skimage.measure import marching_cubes
import fast_simplification

OUT = Path(__file__).resolve().parents[1] / 'assets/images/nire'
ANCHOR = np.array([1379.1056 - 1131, 1600 - 1195.3345, 169.4764])
STEP = .25
primary = [
    [[.3,-6,.5],[-11,-34,5],[-15,-65,10],[-23,-100,6],[-28,-138,1],[-18,-177,-3]],
    [[0,-9,-.4],[7,-35,-10],[12,-65,-22],[10,-109,-20],[20,-157,-12]],
    [[1,-8,.3],[-8,-38,-6],[-12,-80,-14],[-2,-128,-16],[-8,-196,-6]],
    [[1,-11,1],[11,-37,7],[20,-65,12],[24,-113,5],[15,-183,12]],
    [[.5,-13,0],[-2,-36,14],[2,-78,24],[-3,-120,26],[5,-165,18]],
    [[.5,-10,-1],[-14,-38,-8],[-25,-80,-24],[-24,-119,-23],[-32,-151,-14]],
    [[1,-12,.5],[16,-34,-7],[30,-72,-11],[33,-104,-4],[28,-143,2]],
]


def sample(points, radius):
    p = np.array(points, float)
    distances = np.r_[0, np.cumsum(np.linalg.norm(np.diff(p, axis=0), axis=1))]
    curve = CubicSpline(distances / distances[-1], p, axis=0,
                        bc_type=((1, (p[1]-p[0])*distances[-1]/np.linalg.norm(p[1]-p[0])),
                                 (1, np.array([0., -distances[-1], 0.]))))
    t = np.linspace(0, 1, int(np.ceil(distances[-1] / .65)) + 1)
    return curve(t), .23 + (radius - .23) * (1 - t)**.65


paths = [sample([[0,1,0],[.4,-4,.7],[1,-11,1],[.8,-18,1]], 2.65)]
for points, radius in zip(primary, [1.75,1.65,1.85,1.7,1.5,1.55,1.55]):
    paths.append(sample(points, radius))
forks = [
    (0,.34,[-36,-120,18]), (0,.66,[-40,-166,-8]),
    (1,.43,[31,-135,-37]), (1,.70,[11,-178,-31]),
    (2,.39,[-22,-142,-32]),
    (3,.38,[42,-126,19]), (3,.70,[37,-184,25]),
    (4,.50,[17,-148,39]), (5,.43,[-43,-134,-14]),
    (6,.45,[44,-134,-14]),
]
for index, fraction, end in forks:
    parent, radii = paths[index + 1]
    at = int(fraction * (len(parent) - 1))
    start, end = parent[at], np.array(end, float)
    delta = end - start
    controls = [start, start + delta * [.32,.26,.32],
                start + delta * [.93,.69,.93], end]
    paths.append(sample(controls, min(1.12, radii[at] * .82)))

points = np.concatenate([p for p, _ in paths])
bottom = np.floor((points.min(0) - 5) / STEP) * STEP
top = np.ceil((points.max(0) + 5) / STEP) * STEP
axes = [np.arange(a, b + STEP*.5, STEP, dtype=np.float32) for a, b in zip(bottom, top)]
field = np.full(tuple(len(a) for a in axes), 1000, dtype=np.float32)

# Work within each root's bounding box. Capsules along the same root use an
# exact minimum; smoothing only between roots avoids a beaded surface.
for path, radii in paths:
    pad = float(radii.max()) + 1.1
    lo = np.maximum(0, np.floor((path.min(0)-pad-bottom)/STEP).astype(int))
    hi = np.minimum(field.shape, np.ceil((path.max(0)+pad-bottom)/STEP).astype(int)+1)
    block = np.full(tuple(hi-lo), 1000, dtype=np.float32)
    for a, b, ra, rb in zip(path[:-1], path[1:], radii[:-1], radii[1:]):
        margin = max(ra, rb) + .75
        sl = np.maximum(lo, np.floor((np.minimum(a,b)-margin-bottom)/STEP).astype(int))
        sh = np.minimum(hi, np.ceil((np.maximum(a,b)+margin-bottom)/STEP).astype(int)+1)
        x, y, z = [axes[i][sl[i]:sh[i]].reshape(tuple(-1 if i==j else 1 for j in range(3))) for i in range(3)]
        delta = b-a
        t = np.clip(((x-a[0])*delta[0]+(y-a[1])*delta[1]+(z-a[2])*delta[2])/np.dot(delta,delta),0,1)
        distance = np.sqrt((x-a[0]-t*delta[0])**2+(y-a[1]-t*delta[1])**2+(z-a[2]-t*delta[2])**2)-(ra+(rb-ra)*t)
        target = tuple(slice(sl[i]-lo[i],sh[i]-lo[i]) for i in range(3))
        np.minimum(block[target], distance, out=block[target])
    target = tuple(slice(lo[i],hi[i]) for i in range(3))
    old = field[target]
    blend = np.maximum(.65-np.abs(old-block),0)/.65
    field[target] = np.minimum(old,block) - blend*blend*.65*.25

v, f, _, _ = marching_cubes(field, level=0, spacing=(STEP,)*3, allow_degenerate=False)
del field
v += bottom
v, f = fast_simplification.simplify(v, f, target_reduction=.80, agg=5)

# Small tangential smoothing removes voxel faceting while preserving the crown,
# taper, circular sections and the fine branch tips.
edges = np.sort(np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1)
unique, counts = np.unique(edges,axis=0,return_counts=True)
assert np.all(counts==2), 'Every root must be a closed surface'
rows = np.r_[unique[:,0],unique[:,1]]
cols = np.r_[unique[:,1],unique[:,0]]
graph = coo_matrix((np.ones(len(rows)),(rows,cols)),shape=(len(v),len(v))).tocsr()
components, _ = connected_components(graph)
assert components == 1, 'All roots must meet the same crown'
degree = np.asarray(graph.sum(axis=1))
for weight in [.24,-.25,.24,-.25]:
    v += weight*(graph@v/degree-v)
volume = np.einsum('ij,ij->i',v[f[:,0]],np.cross(v[f[:,1]],v[f[:,2]])).sum()/6
if volume < 0: f=f[:,[0,2,1]]
normal = np.zeros_like(v)
face_n = np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
for j in range(3): np.add.at(normal,f[:,j],face_n)
normal /= np.maximum(np.linalg.norm(normal,axis=1,keepdims=True),1e-12)
nearest = cKDTree(points).query(v)[1]
optical = np.concatenate([r for _,r in paths])[nearest] / 2262
world = (v + ANCHOR) / 2262

raw = bytearray(struct.pack('<4sII',b'NIRP',2,0))
batches = []
batch_size = len(f) if len(v) < 65536 else 26000
for i in range(0,len(f),batch_size):
    faces = f[i:i+batch_size]
    ids, remap = np.unique(faces,return_inverse=True)
    record = np.column_stack([world[ids],normal[ids],np.ones((len(ids),3)),np.zeros((len(ids),2)),optical[ids]]).astype('<f4')
    indices = remap.reshape(-1).astype('<u2')
    center = (record[:,:3].min(0)+record[:,:3].max(0))/2
    assert len(ids) < 65536 and np.isfinite(record).all()
    raw += struct.pack('<IIII3f',13,210+len(batches),len(ids),len(indices),*center)
    raw += record.tobytes()+indices.tobytes()
    batches.append(len(ids))
struct.pack_into('<I',raw,8,len(batches))
(OUT/'crystal-roots.bin').write_bytes(raw)
(OUT/'crystal-roots.bin.gz').write_bytes(gzip.compress(raw,9,mtime=0))
landmarks = [((p[int(len(p)*.62)]+ANCHOR)/2262).tolist() for p,_ in paths[1:8]]
metadata = {'version':1,'primaryRoots':7,'sideRoots':len(forks),'tips':7+len(forks),
            'vertices':len(v),'triangles':len(f),'batches':len(batches),'closed':True,'components':int(components),
            'bounds':[world.min(0).tolist(),world.max(0).tolist()],'landmarks':landmarks,
            'material':'clear optical glass, shared with the arched stems and drops'}
(OUT/'crystal-roots.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(metadata))
