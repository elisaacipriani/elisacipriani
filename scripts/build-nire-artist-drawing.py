"""Trace only Elisa's selected upper drawing into native line geometry.

The supplied photograph is read as geometry data; no edited raster is produced.
The selection excludes the boat, platforms, flowers and figures below it.
Original stroke centres and widths become closed, gently spatial graphite lines.
"""
from pathlib import Path
import gzip, json, struct
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt
from scipy.interpolate import CubicSpline
from skimage.filters import apply_hysteresis_threshold
from skimage.morphology import closing, disk, remove_small_objects, skeletonize
from skimage.measure import approximate_polygon

OUT = Path(__file__).resolve().parents[1] / 'assets/images/nire'
SOURCE = OUT / 'references/elisa-drawing-original.jpg'
photo = np.asarray(Image.open(SOURCE).convert('L'), dtype=float) / 255
height, width = photo.shape
selection = np.zeros(photo.shape, bool)
# The outlined upper composition, including its two small lower-left droplets.
# These disjoint rectangles also avoid the unrelated star/flower underneath.
selection[16:259, 15:643] = True
selection[250:376, 15:134] = True
selection[377:400, 94:122] = True
selection[190:259, 145:257] = False
selection[230:259, 257:280] = False
contrast = gaussian_filter(photo, 5) - photo
ink = apply_hysteresis_threshold(contrast, .022, .045) & selection
ink = remove_small_objects(closing(ink, disk(1)), max_size=7)
distance = distance_transform_edt(ink)
ys, xs = np.nonzero(skeletonize(ink))
pixels = set(zip(xs.tolist(), ys.tolist()))
adjacent = {}
for x, y in pixels:
    neighbours = []
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            q = (x + dx, y + dy)
            if not (dx or dy) or q not in pixels: continue
            # Do not add the diagonal shortcut across an existing pixel corner.
            if dx and dy and ((x + dx, y) in pixels or (x, y + dy) in pixels): continue
            neighbours.append(q)
    adjacent[x, y] = sorted(neighbours)


def edge(a, b):
    return (a, b) if a < b else (b, a)


visited, traces = set(), []


def follow(a, b):
    path = [a, b]
    visited.add(edge(a, b))
    while len(adjacent[b]) == 2:
        candidates = [q for q in adjacent[b] if edge(b, q) not in visited]
        if not candidates: break
        q = candidates[0]
        visited.add(edge(b, q)); path.append(q)
        a, b = b, q
        if b == path[0]: break
    length = np.linalg.norm(np.diff(path, axis=0), axis=1).sum()
    if length >= 2.5: traces.append(path)


for p in sorted(pixels):
    if len(adjacent[p]) != 2:
        for q in adjacent[p]:
            if edge(p, q) not in visited: follow(p, q)
for p in sorted(pixels):
    for q in adjacent[p]:
        if edge(p, q) not in visited: follow(p, q)

form = json.loads((OUT / 'form.json').read_text())
anchor_target = np.array([1200, 1580])
choices = []
for path in form['paths']:
    for a, b in zip(path[:-1], path[1:]):
        a, b = np.array(a, float), np.array(b, float)
        d = (b - a)[:2]
        if np.dot(d, d) < .0001: continue
        t = np.clip(np.dot(anchor_target - a[:2], d) / np.dot(d, d), 0, 1)
        q = a + (b - a) * t
        choices.append((np.linalg.norm(q[:2] - anchor_target), q))
anchor = min(choices, key=lambda q: q[0])[1]
origin = np.array([anchor[0] - 1131, 1600 - anchor[1], anchor[2]])
attachment_points = [p for p in pixels if len(adjacent[p]) == 1]
root = np.array(min(attachment_points, key=lambda p: (p[0] - 20) ** 2 + (p[1] - 285) ** 2))
scale, yaw = .60, .06
c, s = np.cos(yaw), np.sin(yaw)
rotation = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def depth(x, y):
    return 30 * np.sin((x - 110) * np.pi / 450) + 16 * np.sin(y * np.pi / 200)


root_depth = depth(*root)


def world(points):
    x, y = points[:, 0], points[:, 1]
    reach = np.linalg.norm(points - root, axis=1)
    p = np.column_stack([(x - root[0]) * scale, (root[1] - y) * scale,
                         depth(x, y) - root_depth + 170 * (1 - np.exp(-reach / 95))])
    return (p @ rotation.T + origin) / 2262


def normals(p, f):
    out = np.zeros_like(p)
    face = np.cross(p[f[:, 1]] - p[f[:, 0]], p[f[:, 2]] - p[f[:, 0]])
    for j in range(3): np.add.at(out, f[:, j], face)
    out /= np.maximum(np.linalg.norm(out, axis=1, keepdims=True), 1.e-16)
    return out


parts, paths, svg = [], [], []
for trace in traces:
    source = np.asarray(trace, float)
    closed = np.array_equal(source[0], source[-1])
    if len(source) > 6:
        smoothed = gaussian_filter(source, (1.15 if len(source) > 16 else .45, 0), mode='wrap' if closed else 'nearest')
        smoothed[0], smoothed[-1] = source[0], source[-1]
    else: smoothed = source
    simplified = approximate_polygon(smoothed, tolerance=.65)
    if closed and len(simplified) < 4: simplified = source
    t = np.r_[0, np.cumsum(np.linalg.norm(np.diff(simplified, axis=0), axis=1))]
    if t[-1] < .1: continue
    samples = max(4, int(np.ceil(t[-1] / .75)))
    if len(simplified) > 2:
        xy = CubicSpline(t, simplified, axis=0, bc_type='periodic' if closed else 'natural')(
            np.linspace(0, t[-1], samples, endpoint=not closed))
    else:
        xy = np.linspace(simplified[0], simplified[-1], samples)
    px, py = np.rint(xy).astype(int).T
    radius = np.clip((distance[py, px] - .45) * scale, .15, 1.60) / 2262
    radius = gaussian_filter(radius, 1.6)
    radius = radius * .45 + np.median(radius) * .55
    strength = np.clip(contrast[py, px] / .23, .28, 1)
    strength = gaussian_filter(strength, .6)
    p = world(xy)
    if closed: tangent = np.roll(p, -1, axis=0) - np.roll(p, 1, axis=0)
    else: tangent = np.gradient(p, axis=0)
    tangent /= np.maximum(np.linalg.norm(tangent, axis=1, keepdims=True), 1.e-15)
    # Parallel transport keeps fine lines smooth, without twisting at a bend.
    u = np.cross(tangent[0], [0, 0, 1])
    if np.linalg.norm(u) < .01: u = np.cross(tangent[0], [1, 0, 0])
    u /= np.linalg.norm(u)
    vertices, density = [], []
    sides = 10
    for i, (q, direction) in enumerate(zip(p, tangent)):
        u -= direction * np.dot(u, direction)
        if np.linalg.norm(u) < .001: u = np.cross(direction, [0, 0, 1])
        u /= max(np.linalg.norm(u), 1.e-12)
        v = np.cross(direction, u)
        for theta in np.arange(sides) * 2 * np.pi / sides:
            vertices.append(q + radius[i] * (u * np.cos(theta) + v * np.sin(theta)))
            density.append(strength[i])
    faces = []
    for i in range(len(p) if closed else len(p) - 1):
        nxt = (i + 1) % len(p)
        for j in range(sides):
            a, b = i * sides + j, i * sides + (j + 1) % sides
            cc, d = nxt * sides + j, nxt * sides + (j + 1) % sides
            faces.extend([[a, b, cc], [b, d, cc]])
    if not closed:
        start, end = len(vertices), len(vertices) + 1
        vertices.extend([p[0], p[-1]]); density.extend([strength[0], strength[-1]])
        for j in range(sides):
            faces.append([start, (j + 1) % sides, j])
            a, b = (len(p) - 1) * sides + j, (len(p) - 1) * sides + (j + 1) % sides
            faces.append([end, a, b])
    vertices, faces = np.asarray(vertices), np.asarray(faces)
    record = np.column_stack([vertices, normals(vertices, faces), density]).astype('<f4')
    assert np.isfinite(record).all()
    parts.append((record, faces))
    # Picking uses the traced lines, so the small pencil marks remain tappable.
    paths.append(np.round(np.column_stack([p, radius]), 8).tolist())
    d = 'M' + ' L'.join(f'{x:.2f},{y:.2f}' for x, y in xy) + (' Z' if closed else '')
    stroke = max(.45, float(np.median(radius) * 2262 / scale * 2))
    opacity = float(np.clip(np.median(strength) * .8 + .2, .45, 1))
    svg.append(f'<path d="{d}" stroke-width="{stroke:.2f}" opacity="{opacity:.2f}"/>')

batches, records, indices, offset = [], [], [], 0
for record, faces in parts:
    if offset + len(record) > 60000:
        batches.append((np.concatenate(records), np.concatenate(indices)))
        records, indices, offset = [], [], 0
    records.append(record); indices.append(faces + offset); offset += len(record)
if records: batches.append((np.concatenate(records), np.concatenate(indices)))
binary = bytearray(struct.pack('<4sII', b'NIRD', 1, len(batches)))
for record, faces in batches:
    ix = faces.astype('<u2').ravel()
    binary += struct.pack('<II', len(record), len(ix)) + record.tobytes() + ix.tobytes()
(OUT / 'elisa-top-drawing.bin').write_bytes(binary)
(OUT / 'elisa-top-drawing.bin.gz').write_bytes(gzip.compress(binary, 9, mtime=0))
vertices = np.concatenate([p[0][:, :3] for p in parts])
low, high = vertices.min(0), vertices.max(0)
meta = {'version': 1, 'title': 'Dibujo de Elisa Cipriani · fragmento superior',
        'source': 'references/elisa-drawing-original.jpg', 'sourceSize': [width, height],
        'selection': 'Only the circled upper composition; no lower flowers, figures, platforms or boat.',
        'method': 'Deterministic tracing of the original pencil into native spatial line geometry; no generated reinterpretation.',
        'paths': paths, 'strokes': len(parts), 'triangles': sum(len(p[1]) for p in parts),
        'bounds': [low.tolist(), high.tolist()], 'center': ((low + high) / 2).tolist(),
        'attachment': {'nativeTarget': anchor_target.tolist(), 'anchor': (origin / 2262).tolist(),
                       'sourceRoot': root.tolist(), 'sourceScale': scale, 'yaw': yaw}}
(OUT / 'elisa-top-drawing.json').write_text(json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + '\n')
vector = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 650 400" fill="none" stroke="#30332e" stroke-linecap="round" stroke-linejoin="round">' + ''.join(svg) + '</svg>\n'
(OUT / 'elisa-top-drawing.svg').write_text(vector)
print(json.dumps({'strokes': len(parts), 'triangles': meta['triangles'], 'bounds': meta['bounds'],
                  'compressedBytes': len(gzip.compress(binary, 9, mtime=0))}))
