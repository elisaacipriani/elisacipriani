"""Offline smooth union of fine spatial strokes into one closed surface."""
from collections import defaultdict
from itertools import product
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from scipy.spatial import cKDTree
from skimage.measure import marching_cubes
import fast_simplification


def connect_strokes(paths):
    """Repair small tracing gaps with the shortest connections between strokes."""
    paths = [np.asarray(p, dtype=float) for p in paths]
    points = np.concatenate(paths)
    owner = np.repeat(np.arange(len(paths)), [len(p) for p in paths])
    parents = np.arange(len(paths))

    def find(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i

    def join(a, b):
        a, b = find(a), find(b)
        if a != b: parents[b] = a

    pairs = cKDTree(points[:, :3]).query_pairs(points[:, 3].max()*2+.2, output_type='ndarray')
    distance = np.linalg.norm(points[pairs[:, 0], :3]-points[pairs[:, 1], :3], axis=1)
    for a, b in pairs[distance <= points[pairs[:, 0], 3]+points[pairs[:, 1], 3]+.08]:
        join(owner[a], owner[b])
    bridges = []
    while True:
        labels = np.array([find(i) for i in owner])
        unique, counts = np.unique(labels, return_counts=True)
        if len(unique) == 1: break
        core = unique[np.argmax(counts)]
        inside, outside = np.flatnonzero(labels == core), np.flatnonzero(labels != core)
        distances, nearest = cKDTree(points[inside, :3]).query(points[outside, :3])
        at = int(np.argmin(distances)); a, b = outside[at], inside[nearest[at]]
        # Keep the original radii at both contacts and a fine, gradual join.
        count = max(3, int(np.ceil(distances[at]/.35))+1)
        bridge = np.linspace(points[a], points[b], count)
        bridge[:, 3] = np.maximum(.24, bridge[:, 3])
        bridges.append(bridge)
        join(owner[a], owner[b])
    return paths+bridges, len(bridges)


def topology(vertices, faces):
    edges = np.sort(np.concatenate([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]]), axis=1)
    edges, counts = np.unique(edges, axis=0, return_counts=True)
    if not np.all(counts == 2):
        raise ValueError(f'Surface must be closed: {np.count_nonzero(counts != 2)} invalid edges')
    rows, cols = np.r_[edges[:, 0], edges[:, 1]], np.r_[edges[:, 1], edges[:, 0]]
    graph = coo_matrix((np.ones(len(rows)), (rows, cols)), shape=(len(vertices), len(vertices))).tocsr()
    count, _ = connected_components(graph)
    if count != 1: raise ValueError(f'Strokes must form one body, got {count}')
    return graph


def build_surface(paths, step=.10, cells=32):
    """Sparse signed-distance meshing, with shared samples at tile boundaries.

    Exact capsule minima along a stroke keep its width constant. Smooth unions
    between strokes remove caps and collars at the actual branch contacts.
    """
    segments = []
    tiles = defaultdict(lambda: defaultdict(list))
    span = step*cells
    for pid, path in enumerate(paths):
        for a, b in zip(path[:-1], path[1:]):
            if np.linalg.norm(b[:3]-a[:3]) < 1.e-7: continue
            index = len(segments); segments.append((a, b))
            pad = max(a[3], b[3])+.55
            low = np.floor((np.minimum(a[:3], b[:3])-pad)/span).astype(int)
            high = np.floor((np.maximum(a[:3], b[:3])+pad)/span).astype(int)
            for key in product(*(range(lo, hi+1) for lo, hi in zip(low, high))):
                tiles[key][pid].append(index)
    chunks, triangles, offset = [], [], 0
    print(f'Meshing {len(paths)} joined strokes in {len(tiles)} sparse tiles', flush=True)
    for number, (key, groups) in enumerate(sorted(tiles.items())):
        origin = np.array(key)*cells
        axes = [(np.arange(cells+1)+origin[i])*step for i in range(3)]
        field = np.full((cells+1,)*3, 1000, dtype=np.float32)
        for pid in sorted(groups):
            stroke = np.full_like(field, 1000)
            for index in groups[pid]:
                a, b = segments[index]; pad = max(a[3], b[3])+.4
                low = np.maximum(0, np.floor((np.minimum(a[:3], b[:3])-pad)/step).astype(int)-origin)
                high = np.minimum(cells+1, np.ceil((np.maximum(a[:3], b[:3])+pad)/step).astype(int)-origin+1)
                if np.any(high <= low): continue
                sl = tuple(slice(lo, hi) for lo, hi in zip(low, high))
                x, y, z = [axes[i][low[i]:high[i]].reshape(tuple(-1 if i == j else 1 for j in range(3))) for i in range(3)]
                delta = b[:3]-a[:3]
                t = np.clip(((x-a[0])*delta[0]+(y-a[1])*delta[1]+(z-a[2])*delta[2])/np.dot(delta, delta), 0, 1)
                sdf = np.sqrt((x-a[0]-t*delta[0])**2+(y-a[1]-t*delta[1])**2+(z-a[2]-t*delta[2])**2)-(a[3]+(b[3]-a[3])*t)
                np.minimum(stroke[sl], sdf, out=stroke[sl])
            blend = np.maximum(.20-np.abs(field-stroke), 0)/.20
            field = np.minimum(field, stroke)-blend*blend*.20*.25
        if field.min() < 0 < field.max():
            v, f, _, _ = marching_cubes(field, 0, spacing=(step,)*3, allow_degenerate=False)
            chunks.append(v.astype(float)+origin*step);triangles.append(f+offset);offset += len(v)
        if number and number % 1000 == 0: print(f'  {number}/{len(tiles)} tiles', flush=True)
    vertices = np.concatenate(chunks)
    faces = np.concatenate(triangles)
    # A tile edge uses identical SDF samples. Weld its duplicate vertices before
    # computing normals, so neither lighting seams nor disconnected parts remain.
    _, used, inverse = np.unique(np.round(vertices, 5), axis=0, return_index=True, return_inverse=True)
    vertices, faces = vertices[used], inverse[faces]
    keep = (faces[:, 0] != faces[:, 1]) & (faces[:, 1] != faces[:, 2]) & (faces[:, 2] != faces[:, 0])
    faces = faces[keep]
    topology(vertices, faces)
    print(f'Closed connected surface: {len(vertices)} vertices, {len(faces)} triangles', flush=True)
    if len(faces) > 500000:
        vertices, faces = fast_simplification.simplify(vertices, faces, target_reduction=1-500000/len(faces), agg=5)
    graph = topology(vertices, faces)
    degree = np.asarray(graph.sum(axis=1))
    for weight in [.22, -.225, .22, -.225]:
        vertices += weight*(graph@vertices/degree-vertices)
    volume = np.einsum('ij,ij->i', vertices[faces[:, 0]], np.cross(vertices[faces[:, 1]], vertices[faces[:, 2]])).sum()/6
    if volume < 0: faces = faces[:, [0, 2, 1]]
    normals = np.zeros_like(vertices)
    face_n = np.cross(vertices[faces[:, 1]]-vertices[faces[:, 0]], vertices[faces[:, 2]]-vertices[faces[:, 0]])
    for j in range(3): np.add.at(normals, faces[:, j], face_n)
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1.e-15)
    return vertices, normals, faces
