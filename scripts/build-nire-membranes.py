"""An abstract collection of continuous, chambered translucent bodies.

The boulder and the spatial tree are separate preserved assets. Envelopes are
closed manifold surfaces; internal septa meet their inside, not loose petals.
No flower, leaf, berry or grass geometry is included in this collection.
"""
from pathlib import Path
import gzip, json, struct
import numpy as np
from scipy.interpolate import CubicSpline
from scipy.spatial import cKDTree

OUT = Path(__file__).resolve().parents[1] / 'assets/images/nire'
form = json.loads((OUT / 'form.json').read_text())
segments = [(np.asarray(a, float), np.asarray(b, float))
            for path in form['paths'] for a, b in zip(path[:-1], path[1:])
            if np.linalg.norm(np.asarray(a)[:2] - np.asarray(b)[:2]) > .01]
batches, specimens, envelope_checks = [], [], []


def unit(p):
    p = np.asarray(p, float)
    return p / max(np.linalg.norm(p), 1.e-12)


def anchor(x, y):
    choices = []
    for a, b in segments:
        d = (b - a)[:2]
        t = np.clip(np.dot(np.array([x, y]) - a[:2], d) / np.dot(d, d), 0, 1)
        p = a + (b - a) * t
        choices.append((np.linalg.norm(p[:2] - [x, y]), p))
    p = min(choices, key=lambda q: q[0])[1]
    return np.array([p[0] - 1131, 1600 - p[1], p[2]])


def normals(p, f):
    n = np.zeros_like(p)
    face = np.cross(p[f[:, 1]] - p[f[:, 0]], p[f[:, 2]] - p[f[:, 0]])
    for j in range(3):
        np.add.at(n, f[:, j], face)
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1.e-12)


def add(p, f, kind, color, uv=None, thickness=None):
    p, f = np.asarray(p, float), np.asarray(f, int)
    uv = np.zeros((len(p), 2)) if uv is None else np.asarray(uv)
    thickness = np.ones(len(p)) if thickness is None else np.asarray(thickness)
    # Keep each envelope in one Uint16 batch. No transparency seams between
    # arbitrarily sliced strips of a single closed body.
    assert len(p) < 65536
    world = ((p * size) @ rotation.T + origin) / 2262
    record = np.column_stack([world, normals(p, f) @ rotation.T,
                              np.tile(color, (len(p), 1)), uv, thickness]).astype('<f4')
    assert np.isfinite(record).all()
    batches.append((kind, len(specimens) - 1, record, f.astype('<u2').ravel(), world.mean(0)))


def tube(points, radius, color, sides=10):
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
    add(vertices, faces, 5, color)


def specimen(name, x, y, yaw=0, roll=0, scale=1.65):
    global origin, rotation, size
    origin, size = anchor(x, y), scale
    c, s, cr, sr = np.cos(yaw), np.sin(yaw), np.cos(roll), np.sin(roll)
    rotation = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]]) @ np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]])
    specimens.append({'id': len(specimens), 'name': name, 'anchor': (origin / 2262).tolist()})


def membrane(points, radius, flatten, tint, chambers=14, phase=0):
    points = np.asarray(points, float)
    at = np.r_[0, np.cumsum(np.linalg.norm(np.diff(points, axis=0), axis=1))]
    at /= at[-1]
    spline = CubicSpline(at, points, axis=0, bc_type='natural')

    def section(t, theta):
        centre = spline(t)
        tangent = unit(spline(t, 1))
        # Parallel frames, independent of triangle winding and camera angle.
        u = unit(np.cross(tangent, [0, 0, 1]))
        v = np.cross(tangent, u)
        profile = max(0, np.sin(np.pi * t)) ** .48
        envelope = radius * profile * (1.15 - .39 * t + .09 * np.sin(t * 5 + phase))
        ribphase = t * chambers + .27 * np.sin(theta * 2 + phase) + .17 * np.sin(theta * 3 + t * 9)
        # Restrained fused chambers, not a stack of separate beads.
        ridge = np.exp(-((np.sin(np.pi * ribphase)) / .34) ** 2)
        r = envelope * (1 - .022 * ridge * profile)
        fold = 1 + .018 * np.sin(theta * 3 + t * 6 + phase) * profile
        p = centre + u * np.cos(theta) * r * fold + v * np.sin(theta) * r * flatten * fold
        p += v * (.15 * np.sin(theta * 17 + t * 31) + .055 * np.sin(theta * 29 - t * 171)) * profile
        return p, centre, tangent, u, v, r, profile, ridge

    rows, sides = 248, 128
    vertices, texcoord, thickness = [spline(0)], [[0, 0]], [.30]
    for i in range(1, rows):
        # Concentrate rings at the rounded poles.
        t = .5 - .5 * np.cos(np.pi * i / rows)
        for j in range(sides):
            theta = j * 2 * np.pi / sides
            p, _, _, _, _, _, profile, ridge = section(t, theta)
            vertices.append(p)
            texcoord.append([t, theta / (2 * np.pi)])
            thickness.append(.18 + .18 * profile + .14 * ridge * profile)
    end = len(vertices)
    vertices.append(spline(1)); texcoord.append([1, 0]); thickness.append(.30)
    faces = [[0, 1 + (j + 1) % sides, 1 + j] for j in range(sides)]
    for i in range(rows - 2):
        for j in range(sides):
            a, b = 1 + i * sides + j, 1 + i * sides + (j + 1) % sides
            faces.extend([[a, b, a + sides], [b, b + sides, a + sides]])
    for j in range(sides):
        a, b = 1 + (rows - 2) * sides + j, 1 + (rows - 2) * sides + (j + 1) % sides
        faces.append([a, b, end])
    vertices, faces = np.asarray(vertices), np.asarray(faces)
    volume = np.sum(np.einsum('ij,ij->i', vertices[faces[:, 0]],
                    np.cross(vertices[faces[:, 1]], vertices[faces[:, 2]]))) / 6
    if volume < 0:
        faces = faces[:, [0, 2, 1]]
    edges = np.sort(np.vstack([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]]), axis=1)
    _, counts = np.unique(edges, axis=0, return_counts=True)
    assert np.all(counts == 2), 'The envelope must be closed, with no cracks.'
    envelope_checks.append({'specimen': len(specimens) - 1, 'closed': True,
                            'components': 1, 'triangles': len(faces)})
    add(vertices, faces, 9, tint, texcoord, thickness)
    middle = ((spline(.5) * size) @ rotation.T + origin) / 2262
    specimens[-1]['focus'] = middle.tolist()

    # Rounded internal galleries share the one external skin. They are enclosed
    # in the body; their actual curved walls refract the image rather than
    # drawing hard flat dividers across its silhouette.
    sample_t = np.linspace(0, 1, 1600)
    sample_c = spline(sample_t)
    sample_frames = [section(t, 0) for t in sample_t]
    sample_u = np.array([frame[3] for frame in sample_frames])
    sample_v = np.array([frame[4] for frame in sample_frames])
    sample_r = np.maximum(np.array([frame[5] for frame in sample_frames]), 1.e-7)
    nearest_centre = cKDTree(sample_c)
    for k in range(1, chambers + 1):
        t = (k - .45) / chambers + .003 * np.sin(k * 2.3 + phase)
        _, centre, tangent, u, v, r, profile, _ = section(t, 0)
        centre += u * r * .05 * np.sin(k * 1.7) + v * r * flatten * .04
        # The small obliquity and irregular spacing keep the galleries from
        # looking like machine-cut sections of an object.
        slant = .16 * np.sin(k * 2.1 + phase)
        along = unit(u + tangent * slant)
        cross = unit(tangent - u * slant)
        spacing = np.linalg.norm(spline(t, 1)) / chambers
        axes = np.array([r * (.97 + .015 * np.sin(k * 3.1)),
                         spacing * (.62 + .04 * np.sin(k * 2.7 + phase)),
                         r * flatten * (.94 + .02 * np.cos(k * 2.3))])
        lat, lon = 32, 64
        p, uv, wall = [centre + cross * axes[1]], [[0, 0]], [.12]
        for i in range(1, lat):
            phi = np.pi * i / lat
            for j in range(lon):
                theta = 2 * np.pi * j / lon
                directions = np.array([np.sin(phi) * np.cos(theta), np.cos(phi), np.sin(phi) * np.sin(theta)])
                local = directions * axes
                q = centre + along * local[0] + cross * local[1] + v * local[2]
                q += cross * .30 * np.sin(theta * 3 + k) * np.sin(phi) ** 2
                p.append(q); uv.append([i / lat, j / lon]); wall.append(.10 + .06 * np.sin(phi) ** 2)
        end = len(p); p.append(centre - cross * axes[1]); uv.append([1, 0]); wall.append(.12)
        f = [[0, 1 + (j + 1) % lon, 1 + j] for j in range(lon)]
        for i in range(lat - 2):
            for j in range(lon):
                a, b = 1 + i * lon + j, 1 + i * lon + (j + 1) % lon
                f.extend([[a, b, a + lon], [b, b + lon, a + lon]])
        for j in range(lon):
            a, b = 1 + (lat - 2) * lon + j, 1 + (lat - 2) * lon + (j + 1) % lon
            f.append([a, b, end])
        p, f = np.asarray(p), np.asarray(f)
        # Keep the galleries strictly inside the enclosing tissue, including
        # at a tight bend or rounded tip. No separate bubbles outside the body.
        nearest = nearest_centre.query(p)[1]
        d = p - sample_c[nearest]
        local_u = np.sum(d * sample_u[nearest], axis=1)
        local_v = np.sum(d * sample_v[nearest], axis=1)
        distance = np.sqrt(local_u ** 2 + (local_v / flatten) ** 2)
        factor = np.minimum(1, sample_r[nearest] * .935 / np.maximum(distance, 1.e-8))
        p -= (sample_u[nearest] * local_u[:, None] + sample_v[nearest] * local_v[:, None]) * (1 - factor[:, None])
        volume = np.sum(np.einsum('ij,ij->i', p[f[:, 0]], np.cross(p[f[:, 1]], p[f[:, 2]]))) / 6
        if volume < 0: f = f[:, [0, 2, 1]]
        add(p, f, 11, tint, uv, wall)


crescent = [[-35, 113, 3], [-55, 99, 3], [-59, 68, 1], [-41, 36, 0],
            [-7, 21, 1], [30, 27, 0], [57, 43, -2], [68, 67, -5]]
specimen('membrana nacarada', 1140, 1180, yaw=.18, roll=-.12, scale=1.80)
membrane(crescent, 25, .67, (.97, .89, .72), chambers=16, phase=.4)

specimen('pliegue de ámbar', 1430, 570, yaw=-.40, roll=.35, scale=1.55)
membrane([[-8, 0, 1], [-36, 26, 0], [-36, 62, 4], [-13, 99, 4],
          [24, 126, 1], [54, 129, -2]], 19, .58, (.98, .85, .65), chambers=12, phase=1.6)

specimen('cámara opalina', 640, 810, yaw=.36, roll=-.15, scale=1.45)
membrane([[-8, 0, 0], [-20, 24, 0], [-12, 53, 3], [5, 80, 4],
          [17, 107, 0]], 27, .59, (.91, .94, .86), chambers=10, phase=2.1)

specimen('lámina suspendida', 1485, 1080, yaw=-.57, roll=.24, scale=1.65)
membrane([[0, 0, 0], [19, 17, 1], [51, 27, 3], [78, 48, 4],
          [91, 75, 0]], 20, .52, (.96, .91, .81), chambers=11, phase=3.7)

# Two quiet, abstract trajectories remain part of the tree's collection.
for name, x, y, yaw in [('traza cobriza', 1320, 470, .25), ('traza ocre', 690, 840, -.45)]:
    specimen(name, x, y, yaw, scale=1.65)
    points = np.array([[0, 0, 0], [-30, 74, 9], [26, 143, -9], [49, 184, 3], [14, 201, 16]], float)
    t = np.r_[0, np.cumsum(np.linalg.norm(np.diff(points, axis=0), axis=1))]; t /= t[-1]
    tube(CubicSpline(t, points, axis=0, bc_type='natural')(np.linspace(0, 1, 96)), .39, (.53, .31, .20))

binary = bytearray(struct.pack('<4sII', b'NIRP', 2, len(batches)))
for kind, ident, record, indices, centre in batches:
    binary += struct.pack('<IIII3f', kind, ident, len(record), len(indices), *centre)
    binary += record.tobytes() + indices.tobytes()
(OUT / 'membranes.bin').write_bytes(binary)
compressed = gzip.compress(binary, 9, mtime=0)
(OUT / 'membranes.bin.gz').write_bytes(compressed)
meta = {'version': 2, 'collection': 'continuous translucent abstractions',
        'specimens': specimens, 'batches': len(batches),
        'triangles': sum(len(b[3]) // 3 for b in batches),
        'materials': {'5': 'fine copper', '9': 'closed translucent tissue', '11': 'rounded internal galleries'},
        'photographicMaterials': ['membrane-tissue-v1.png', 'seed-wax-v2.png'],
        'envelopes': envelope_checks}
(OUT / 'membranes.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'specimens': len(specimens), 'batches': len(batches), 'triangles': meta['triangles'],
                  'closedEnvelopes': len(envelope_checks), 'compressedBytes': len(compressed)}))
