"""Restore the earlier small spherical clusters, with a coral skin material.

Seed 1647, height, radius, anchor, yaw and scale reproduce the earlier clusters
from build-nire-botany.py. Spheres have exact equal radii on all three axes.
The rejected elongated membrane bodies are not part of this collection.
"""
from pathlib import Path
import gzip, json, struct
import numpy as np
from scipy.interpolate import CubicSpline

OUT = Path(__file__).resolve().parents[1] / 'assets/images/nire'
form = json.loads((OUT / 'form.json').read_text())
segments = [(np.array(a, float), np.array(b, float))
            for path in form['paths'] for a, b in zip(path[:-1], path[1:])
            if np.linalg.norm(np.array(a)[:2] - np.array(b)[:2]) > .01]
rng = np.random.default_rng(1647)
batches, specimens, bubbles = [], [], []


def unit(v):
    return v / max(np.linalg.norm(v), 1.e-12)


def anchor(x, y):
    candidates = []
    for a, b in segments:
        d = (b - a)[:2]
        t = np.clip(np.dot(np.array([x, y]) - a[:2], d) / np.dot(d, d), 0, 1)
        p = a + (b - a) * t
        candidates.append((np.linalg.norm(p[:2] - [x, y]), p))
    p = min(candidates, key=lambda item: item[0])[1]
    return np.array([p[0] - 1131, 1600 - p[1], p[2]])


def smooth(points, count=36):
    points = np.asarray(points, float)
    t = np.r_[0, np.cumsum(np.linalg.norm(np.diff(points, axis=0), axis=1))]
    return CubicSpline(t / t[-1], points, axis=0, bc_type='natural')(np.linspace(0, 1, count))


def specimen(name, x, y, yaw):
    global origin, rotation
    origin = anchor(x, y)
    c, s = np.cos(yaw), np.sin(yaw)
    rotation = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    specimens.append({'id': len(specimens), 'name': name, 'anchor': (origin / 2262).tolist()})


def add(p, faces, kind, ident, color, normal=None, centre=None):
    p, faces = np.asarray(p, float), np.asarray(faces, int)
    if normal is None:
        normal = np.zeros_like(p)
        n = np.cross(p[faces[:, 1]] - p[faces[:, 0]], p[faces[:, 2]] - p[faces[:, 0]])
        for j in range(3): np.add.at(normal, faces[:, j], n)
        normal /= np.maximum(np.linalg.norm(normal, axis=1, keepdims=True), 1.e-12)
    world = ((p * 1.65) @ rotation.T + origin) / 2262
    record = np.column_stack([world, normal @ rotation.T, np.tile(color, (len(p), 1)),
                              np.zeros((len(p), 2)), np.ones(len(p))]).astype('<f4')
    assert np.isfinite(record).all() and len(record) < 65536
    centre = world.mean(0) if centre is None else ((np.array(centre) * 1.65) @ rotation.T + origin) / 2262
    batches.append((kind, ident, record, faces.astype('<u2').ravel(), centre))


def tube(points, radius, ident, kind=0, color=(.37, .32, .23), sides=10):
    points = np.asarray(points, float)
    tangent = np.gradient(points, axis=0)
    tangent /= np.linalg.norm(tangent, axis=1, keepdims=True)
    vertices, faces = [], []
    for q, t in zip(points, tangent):
        u = unit(np.cross(t, [0, 0, 1] if abs(t[2]) < .85 else [1, 0, 0]))
        v = np.cross(t, u)
        for theta in np.arange(sides) * np.pi * 2 / sides:
            vertices.append(q + radius * (u * np.cos(theta) + v * np.sin(theta)))
    for i in range(len(points) - 1):
        for j in range(sides):
            a, b = i * sides + j, i * sides + (j + 1) % sides
            faces.extend([[a, b, a + sides], [b, b + sides, a + sides]])
    add(vertices, faces, kind, ident, color)


def sphere(center, radius, cluster):
    lat, lon = 48, 72
    normals = [[0, 1, 0]]
    for i in range(1, lat):
        phi = np.pi * i / lat
        for j in range(lon):
            theta = 2 * np.pi * j / lon
            normals.append([np.sin(phi) * np.cos(theta), np.cos(phi), np.sin(phi) * np.sin(theta)])
    normals.append([0, -1, 0])
    normals = np.asarray(normals)
    vertices = np.array(center) + normals * radius
    faces = [[0, 1 + (j + 1) % lon, 1 + j] for j in range(lon)]
    for i in range(lat - 2):
        for j in range(lon):
            a, b = 1 + i * lon + j, 1 + i * lon + (j + 1) % lon
            faces.extend([[a, b, a + lon], [b, b + lon, a + lon]])
    end = len(vertices) - 1
    for j in range(lon):
        a, b = 1 + (lat - 2) * lon + j, 1 + (lat - 2) * lon + (j + 1) % lon
        faces.append([a, b, end])
    faces = np.asarray(faces)
    ident = len(bubbles)
    add(vertices, faces, 12, ident, (.99, .56, .44), normals, center)
    centre = ((np.array(center) * 1.65) @ rotation.T + origin) / 2262
    bubbles.append({'id': ident, 'cluster': cluster, 'center': centre.tolist(),
                    'radius': radius * 1.65 / 2262, 'sourceRadius': radius, 'sourceScale': 1.65})


for name, x, y, yaw in [('burbujas de agua', 760, 1040, .15),
                        ('burbujas de aire', 1260, 690, -.7),
                        ('burbujas pequeñas', 1670, 650, .6)]:
    specimen(name, x, y, yaw)
    cluster = len(specimens) - 1
    height = rng.uniform(130, 170)
    cluster_bubbles = []
    for j in range(15):
        t, rr = j * 2.39996, 12 * np.sqrt((j + .6) / 15)
        q = np.array([rr * np.cos(t), height - 7 - j * 4.6, rr * np.sin(t)])
        radius = rng.uniform(7, 9.5)
        sphere(q, radius, cluster)
        cluster_bubbles.append((q, radius))
    # Stop the support at the surface of the lowest sphere. The former opaque
    # berries hid intersecting stems; transparent bubbles must not contain a
    # bundle of thick woody rods through their centres.
    q, radius = cluster_bubbles[-1]
    approach = np.array([-5, q[1] * .50, 3])
    end = q - unit(q - approach) * radius
    tube(smooth([[0, 0, 0], approach, end], 36), .62, 100 + cluster)
    specimens[-1]['focus'] = bubbles[cluster * 15 + 7]['center']

for name, x, y, yaw in [('traza cobriza', 1320, 470, .25), ('traza ocre', 690, 840, -.45)]:
    specimen(name, x, y, yaw)
    tube(smooth([[0, 0, 0], [-30, 74, 9], [26, 143, -9], [49, 184, 3], [14, 201, 16]], 96),
         .39, 100 + len(specimens) - 1, 5, (.53, .31, .20))

# Opaque pedicels share a batch, while every transparent sphere remains a
# complete surface that can be sorted from back to front during the rotation.
groups, merged = {}, []
for b in batches:
    if b[0] == 12: merged.append(b)
    else: groups.setdefault((b[0], b[1]), []).append(b)
for (kind, ident), parts in groups.items():
    record = np.concatenate([b[2] for b in parts])
    offsets = np.r_[0, np.cumsum([len(b[2]) for b in parts])]
    indices = np.concatenate([b[3].astype(np.int32) + offset for b, offset in zip(parts, offsets)]).astype('<u2')
    assert len(record) < 65536
    merged.append((kind, ident, record, indices, record[:, :3].mean(0)))
batches = merged
binary = bytearray(struct.pack('<4sII', b'NIRP', 2, len(batches)))
for kind, ident, record, indices, centre in batches:
    binary += struct.pack('<IIII3f', kind, ident, len(record), len(indices), *centre)
    binary += record.tobytes() + indices.tobytes()
(OUT / 'bubbles.bin').write_bytes(binary)
compressed = gzip.compress(binary, 9, mtime=0)
(OUT / 'bubbles.bin.gz').write_bytes(compressed)
meta = {'version': 2, 'collection': 'restored coral translucent bubbles', 'specimens': specimens,
        'bubbles': bubbles, 'batches': len(batches), 'triangles': sum(len(b[3]) // 3 for b in batches),
        'source': 'original 1647 clusters, unchanged centers and radii',
        'materials': {'0': 'woody pedicel', '5': 'copper trace', '12': 'translucent coral skin'},
        'photographicMaterials': ['bubble-skin-v1.png']}
(OUT / 'bubbles.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'bubbles': len(bubbles), 'specimens': len(specimens),
                  'triangles': meta['triangles'], 'compressedBytes': len(compressed)}))
