"""Coral translucent arils on the existing three small clusters.

The original 1647 centers, radii, anchors and scale are retained. Each aril is
one closed rounded wedge; the same canonical mesh renders the tiny source dots.
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


def aril_mesh(lat=64, lon=96):
    power = 2.6
    directions = [[0, 1, 0]]
    for i in range(1, lat):
        phi = np.pi*i/lat
        for j in range(lon):
            theta = 2*np.pi*j/lon
            directions.append([np.sin(phi)*np.cos(theta), np.cos(phi), np.sin(phi)*np.sin(theta)])
    directions.append([0, -1, 0])
    v = np.sign(directions)*np.abs(directions)**(2/power)
    y = v[:, 1].copy(); taper = .83+.18*y
    p = np.column_stack([v[:, 0]*.90*taper+.12*(1-y*y), y*1.05,
                         v[:, 2]*.70*taper+.045*y])
    faces = [[0, 1+(j+1)%lon, 1+j] for j in range(lon)]
    for i in range(lat-2):
        for j in range(lon):
            a, b = 1+i*lon+j, 1+i*lon+(j+1)%lon
            faces.extend([[a,b,a+lon],[b,b+lon,a+lon]])
    end = len(p)-1
    for j in range(lon):
        a, b = 1+(lat-2)*lon+j, 1+(lat-2)*lon+(j+1)%lon
        faces.append([a,b,end])
    faces = np.asarray(faces)
    # Analytic normals of the tapered superellipsoid remain smooth across its
    # rounded faces, poles and the exported 16-bit batches.
    q = np.column_stack([(p[:,0]-.12*(1-y*y))/(.90*taper), y,
                         (p[:,2]-.045*y)/(.70*taper)])
    g = np.sign(q)*np.abs(q)**(power-1)
    gx, gz = g[:,0]/(.90*taper), g[:,2]/(.70*taper)
    gy = (g[:,1]+g[:,0]*(.24*y/(.90*taper)-q[:,0]*.18/taper)
          +g[:,2]*(-.045/(.70*taper)-q[:,2]*.18/taper))/1.05
    normal = np.column_stack([gx,gy,gz]);normal/=np.linalg.norm(normal,axis=1,keepdims=True)
    edges = np.sort(np.concatenate([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]),axis=1)
    assert np.all(np.unique(edges,axis=0,return_counts=True)[1]==2)
    assert np.all(np.isfinite(normal))
    return p,normal,faces


ARIL_POSITION, ARIL_NORMAL, ARIL_FACES = aril_mesh()
canonical = np.column_stack([ARIL_POSITION,ARIL_NORMAL]).astype('<f4')
mesh = struct.pack('<4sIII',b'NIRA',1,len(canonical),ARIL_FACES.size)+canonical.tobytes()+ARIL_FACES.astype('<u2').tobytes()
(OUT/'aril-mesh.bin').write_bytes(mesh)
(OUT/'aril-mesh.bin.gz').write_bytes(gzip.compress(mesh,9,mtime=0))
low_position,low_normal,low_faces=aril_mesh(24,36)
low_record=np.column_stack([low_position,low_normal]).astype('<f4')
low_mesh=struct.pack('<4sIII',b'NIRA',1,len(low_record),low_faces.size)+low_record.tobytes()+low_faces.astype('<u2').tobytes()
(OUT/'aril-mesh-low.bin').write_bytes(low_mesh)
(OUT/'aril-mesh-low.bin.gz').write_bytes(gzip.compress(low_mesh,9,mtime=0))


def aril(center, radius, cluster):
    ident = len(bubbles)
    # Variation does not consume the layout RNG, so all original centers and
    # physical radii remain identical to the accepted clusters.
    roll=.48*np.sin(ident*2.39996+.4);yaw=.52*np.sin(ident*1.73+.8)
    cz,sz,cy,sy=np.cos(roll),np.sin(roll),np.cos(yaw),np.sin(yaw)
    frame=np.array([[cy*cz,-cy*sz,sy],[sz,cz,0],[-sy*cz,sy*sz,cy]])
    vertices=np.asarray(center)+(ARIL_POSITION@frame.T)*radius
    normals=ARIL_NORMAL@frame.T
    add(vertices,ARIL_FACES,12,ident,(.99,.56,.44),normals,center)
    centre=((np.asarray(center)*1.65)@rotation.T+origin)/2262
    bubbles.append({'id':ident,'cluster':cluster,'center':centre.tolist(),
                    'radius':radius*1.65/2262,'sourceRadius':radius,'sourceScale':1.65,
                    'frame':(rotation@frame).tolist(),'shape':'rounded tapered aril'})


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
        aril(q, radius, cluster)
        cluster_bubbles.append((q, radius))
    # Stop the support at the surface of the lowest aril. The former opaque
    # berries hid intersecting stems; transparent bubbles must not contain a
    # bundle of thick woody rods through their centres.
    q, radius = cluster_bubbles[-1]
    approach = np.array([-5, q[1] * .50, 3])
    # Contact follows the tapered aril, so the support cannot stop at the
    # former spherical envelope and leave a gap below its narrower base.
    direction=unit(approach-q)
    frame=rotation.T@np.asarray(bubbles[-1]['frame'])
    local=frame.T@direction
    low,high=0.,1.5
    for _ in range(32):
        mid=(low+high)/2;p=local*mid;y=p[1]/1.05;taper=.83+.18*y
        qx=(p[0]-.12*(1-y*y))/(.90*taper);qz=(p[2]-.045*y)/(.70*taper)
        value=abs(qx)**2.6+abs(y)**2.6+abs(qz)**2.6-1
        if value>0:high=mid
        else:low=mid
    end=q+direction*radius*((low+high)/2)*.985
    tube(smooth([[0, 0, 0], approach, end], 36), .62, 100 + cluster)
    specimens[-1]['focus'] = bubbles[cluster * 15 + 7]['center']

for name, x, y, yaw in [('traza cobriza', 1320, 470, .25), ('traza ocre', 690, 840, -.45)]:
    specimen(name, x, y, yaw)
    tube(smooth([[0, 0, 0], [-30, 74, 9], [26, 143, -9], [49, 184, 3], [14, 201, 16]], 96),
         .39, 100 + len(specimens) - 1, 5, (.53, .31, .20))

# Opaque pedicels share a batch, while every transparent aril remains a
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
meta = {'version': 3, 'collection': 'translucent coral pomegranate arils', 'specimens': specimens,
        'bubbles': bubbles, 'batches': len(batches), 'triangles': sum(len(b[3]) // 3 for b in batches),
        'source': 'original 1647 clusters, unchanged centers and radii',
        'shape': 'one closed tapered rounded superellipsoid per aril',
        'canonicalMesh': 'aril-mesh.bin',
        'materials': {'0': 'woody pedicel', '5': 'copper trace', '12': 'clear coral flesh, visible inner seed and wet skin'},
        'photographicMaterials': ['bubble-skin-v1.png']}
(OUT / 'bubbles.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'bubbles': len(bubbles), 'specimens': len(specimens),
                  'triangles': meta['triangles'], 'compressedBytes': len(compressed)}))
