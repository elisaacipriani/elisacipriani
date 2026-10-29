"""Trace only Elisa's selected upper drawing into native line geometry.

The supplied photograph is read as geometry data; no edited raster is produced.
The selection excludes the boat, platforms, flowers and figures below it.
Original stroke centres and widths become one closed, gently spatial body.
"""
from pathlib import Path
import gzip, json, struct
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt
from scipy.interpolate import CubicSpline
from scipy.spatial import cKDTree
from nire_line_surface import connect_strokes, build_surface
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



strokes, svg = [], []
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
    stroke = np.column_stack([p*2262, radius*2262, strength])
    if closed: stroke = np.vstack([stroke, stroke[0]])
    strokes.append(stroke)
    d = 'M' + ' L'.join(f'{x:.2f},{y:.2f}' for x, y in xy) + (' Z' if closed else '')
    stroke = max(.45, float(np.median(radius) * 2262 / scale * 2))
    opacity = float(np.clip(np.median(strength) * .8 + .2, .45, 1))
    svg.append(f'<path d="{d}" stroke-width="{stroke:.2f}" opacity="{opacity:.2f}"/>')

# One implicit surface replaces the old independently capped ten-sided tubes.
joined, bridges = connect_strokes(strokes)
vertices, normal, faces = build_surface(joined)
samples = np.concatenate(joined)
density = samples[cKDTree(samples[:, :3]).query(vertices)[1], 4]
record = np.column_stack([vertices/2262, normal, density]).astype('<f4')
paths = [np.round(stroke[:, :4]/2262, 8).tolist() for stroke in joined]
batches = []
batch_size = len(faces) if len(vertices) < 60000 else 16000
for at in range(0, len(faces), batch_size):
    ids, inverse = np.unique(faces[at:at+batch_size], return_inverse=True)
    assert len(ids) < 65536
    batches.append((record[ids], inverse.reshape(-1, 3)))
binary = bytearray(struct.pack('<4sII', b'NIRD', 1, len(batches)))
for batch_record, batch_faces in batches:
    ix = batch_faces.astype('<u2').ravel()
    binary += struct.pack('<II', len(batch_record), len(ix)) + batch_record.tobytes() + ix.tobytes()
(OUT / 'elisa-top-drawing.bin').write_bytes(binary)
(OUT / 'elisa-top-drawing.bin.gz').write_bytes(gzip.compress(binary, 9, mtime=0))
low, high = (vertices/2262).min(0), (vertices/2262).max(0)
meta = {'version': 2, 'format': 'NIRD v1', 'components': 1, 'closed': True, 'openEdges': 0, 'connectedGaps': bridges, 'vertices': len(vertices), 'title': 'Dibujo de Elisa Cipriani · fragmento superior',
        'source': 'references/elisa-drawing-original.jpg', 'sourceSize': [width, height],
        'selection': 'Only the circled upper composition; no lower flowers, figures, platforms or boat.',
        'method': 'Original pencil contours fused into one closed native surface with smooth branch unions and repaired tracing gaps.',
        'paths': paths, 'strokes': len(strokes), 'triangles': len(faces),
        'material': 'White matte layered surface from the supplied photograph, with pores and shallow raised edges',
        'bounds': [low.tolist(), high.tolist()], 'center': ((low + high) / 2).tolist(),
        'attachment': {'nativeTarget': anchor_target.tolist(), 'anchor': (origin / 2262).tolist(),
                       'sourceRoot': root.tolist(), 'sourceScale': scale, 'yaw': yaw}}
(OUT / 'elisa-top-drawing.json').write_text(json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + '\n')
vector = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 650 400" fill="none" stroke="#30332e" stroke-linecap="round" stroke-linejoin="round">' + ''.join(svg) + '</svg>\n'
(OUT / 'elisa-top-drawing.svg').write_text(vector)
print(json.dumps({'strokes': len(strokes), 'components': 1, 'connectedGaps': bridges, 'triangles': meta['triangles'], 'bounds': meta['bounds'],
                  'compressedBytes': len(gzip.compress(binary, 9, mtime=0))}))
