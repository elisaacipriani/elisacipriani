(function () {
  "use strict";

  // A shallow relief made from the original photograph. The same surface carries
  // the paint, so the image and every new stroke share one perspective.
  window.createNireScene = function (image, ink, world, inkBounds) {
    const canvas = document.createElement("canvas");
    canvas.className = "nire-scene";
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl", { alpha: false, antialias: true, preserveDrawingBuffer: true });
    if (!gl) return null;
    const aspect = world.height / world.width;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let enabled = !reduced.matches;
    let held = false;
    let visible = !document.hidden;
    let dirty = true;
    let inkDirty = true;
    let textureReady = true;
    let treeVisible = false;
    let time = 0;
    let previous = 0;
    let angle = .08;
    let tilt = -.025;
    let lastFrame = 0;
    let raf = 0;
    let view = { width: 1, height: 1, scale: 1, cx: 0, cy: 0, dpr: 1 };
    let baseView = { ...view };
    let focus = null;
    let detailCoordinates = [0,0,0,0];
    let focusAngle = 0, focusTilt = 0;
    const inspection = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const vertexSource = `
      attribute vec2 aUV;
      uniform vec2 uViewport;
      uniform vec2 uCenter;
      uniform float uWidth;
      uniform float uAspect;
      uniform float uAngle;
      uniform float uTilt;
      uniform float uShell;
      varying vec2 vUV;
      varying float vLight;
      float relief(vec2 uv) {
        return .105 * sin(uv.x * 6.8 + uv.y * 3.2) + .045 * cos(uv.y * 9.5 - uv.x * 2.8);
      }
      vec3 rotate(vec3 p) {
        float c = cos(uAngle), s = sin(uAngle);
        p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
        c = cos(uTilt); s = sin(uTilt);
        return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
      }
      void main() {
        vUV = aUV;
        float z = relief(aUV);
        vec3 p = rotate(vec3(aUV.x - .5, (.5 - aUV.y) * uAspect, z + uShell));
        float w = 4.0 - p.z;
        vec2 center = vec2(2.0 * uCenter.x / uViewport.x - 1.0, 1.0 - 2.0 * uCenter.y / uViewport.y);
        gl_Position = vec4(center * w + p.xy * uWidth * 8.0 / uViewport, 0.0, w);
        float dx = (relief(aUV + vec2(.001, 0.0)) - z) / .001;
        float dy = (relief(aUV + vec2(0.0, .001)) - z) / (.001 * uAspect);
        vec3 normal = normalize(rotate(vec3(-dx, dy, 1.0)));
        vLight = .86 + .14 * max(0.0, dot(normal, normalize(vec3(-.4, .5, 1.0))));
      }`;
    const fragmentSource = `
      precision highp float;
      uniform sampler2D uPhoto;
      uniform sampler2D uInk;
      uniform sampler2D uDetail;
      uniform sampler2D uFilamentMask;
      uniform sampler2D uVolumeMask;
      uniform sampler2D uMaterialsMask;
      uniform float uMaterialStrength;
      uniform vec4 uVolumeBounds;
      uniform float uVolume;
      uniform float uSculpt;
      uniform vec4 uDetailBounds;
      uniform vec4 uInkBounds;
      uniform float uOpacity;
      uniform float uPaint;
      uniform float uTree;
      varying vec2 vUV;
      varying float vLight;
      void main() {
        vec4 photo = vec4(0.0);
        if (vUV.x >= 0.0 && vUV.x <= 1.0 && vUV.y >= 0.0 && vUV.y <= 1.0) photo = texture2D(uPhoto, vUV);
        vec2 detailUV = (vUV - uDetailBounds.xy) / max(uDetailBounds.zw, vec2(.00001));
        if (uDetailBounds.z > 0.0 && detailUV.x >= 0.0 && detailUV.x <= 1.0 && detailUV.y >= 0.0 && detailUV.y <= 1.0) photo = texture2D(uDetail, detailUV);
        vec3 materials=texture2D(uMaterialsMask,vUV).rgb;
        float material=max(max(materials.r,materials.g),materials.b);
        photo.rgb *= (1.0-texture2D(uFilamentMask,vUV).r*uSculpt*.98*(1.0-material))*(1.0-material*uMaterialStrength);
        vec4 ink = texture2D(uInk, (vUV - uInkBounds.xy) / uInkBounds.zw);
        ink.a *= uPaint;
        vec2 volumeUV=(vUV-uVolumeBounds.xy)/max(uVolumeBounds.zw,vec2(.00001));
        if(uVolume>0.0&&volumeUV.x>=0.0&&volumeUV.x<=1.0&&volumeUV.y>=0.0&&volumeUV.y<=1.0)ink.a*=1.0-texture2D(uVolumeMask,volumeUV).r;
        float light = max(max(photo.r, photo.g), photo.b);
        float edge = smoothstep(0.0, .02, vUV.y) * smoothstep(0.0, .012, vUV.x) * smoothstep(0.0, .012, 1.0 - vUV.x);
        float photoAlpha = smoothstep(.012, .035, light) * edge * uTree;
        float alpha = ink.a + photoAlpha * (1.0 - ink.a);
        if (alpha < .005) discard;
        vec3 color = (photo.rgb * vLight * photoAlpha * (1.0 - ink.a) + ink.rgb * ink.a) / alpha;
        gl_FragColor = vec4(color, alpha * uOpacity);
      }`;
    function shader(type, source) {
      const result = gl.createShader(type);
      gl.shaderSource(result, source);
      gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
      return result;
    }
    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Unable to link ÑIRE surface");
    } catch (error) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return null;
    }
    gl.useProgram(program);
    const attributeCount = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    const locations = {};
    ["uViewport", "uCenter", "uWidth", "uAspect", "uAngle", "uTilt", "uShell", "uPhoto", "uInk", "uDetail", "uDetailBounds", "uFilamentMask", "uSculpt", "uVolumeMask", "uVolumeBounds", "uVolume", "uMaterialsMask", "uMaterialStrength", "uInkBounds", "uOpacity", "uPaint", "uTree"].forEach((key) => {
      locations[key] = gl.getUniformLocation(program, key);
    });
    const positions = [];
    const indices = [];
    const columns = 120;
    const rows = 144;
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= columns; x++) positions.push(
        (inkBounds.x + x / columns * inkBounds.width) / world.width,
        (inkBounds.y + y / rows * inkBounds.height) / world.height
      );
    }
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const i = y * (columns + 1) + x;
        indices.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1);
      }
    }
    const surfaceBuffer = gl.createBuffer();
    const surfaceIndex = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, surfaceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, "aUV");
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surfaceIndex);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    function texture(unit) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      const result = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, result);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      return result;
    }
    const photoTexture = texture(0);
    const inkTexture = texture(1);
    const detailTexture = texture(2);
    gl.uniform1i(locations.uPhoto, 0);
    gl.uniform1i(locations.uInk, 1);
    gl.uniform1i(locations.uDetail, 2);
    gl.uniform1i(locations.uFilamentMask, 3);
    gl.uniform1i(locations.uVolumeMask, 4);
    gl.uniform1i(locations.uMaterialsMask, 5);
    gl.uniform4f(locations.uDetailBounds, 0, 0, 0, 0);
    gl.uniform1f(locations.uAspect, aspect);
    gl.uniform4f(locations.uInkBounds, inkBounds.x / world.width, inkBounds.y / world.height, inkBounds.width / world.width, inkBounds.height / world.height);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const filaments = window.createNireFilaments ? window.createNireFilaments(gl, (stats) => {
      canvas.dataset.filaments = String(stats.paths);
      canvas.dataset.bodies = String(stats.bodies);
      canvas.dataset.triangles = String(stats.triangles);
      dirty = true; request();
    }) : null;
    if (!filaments) {
      // Keep the photograph available on devices without the additional shader.
      texture(3);
    }
    const materials = window.createNireMaterials ? window.createNireMaterials(gl, (stats) => {
      if(stats){canvas.dataset.materials="yellow pink orange";canvas.dataset.materialTriangles=String(stats.yellow+stats.pink+stats.orange);}
      dirty=true;request();
    }) : null;
    if(!materials)texture(5);
    const sculpture = window.createNireSculpture ? window.createNireSculpture(gl) : null;
    if (!sculpture) texture(4);
    function uploadPhoto() {
      if (!image.naturalWidth) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, photoTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      textureReady = true;
      dirty = true;
      document.body.classList.add("has-nire-scene");
      if (filaments) filaments.load();
      if (materials) materials.load();
    }
    image.addEventListener("load", uploadPhoto);
    if (image.complete) uploadPhoto();

    function draw(ratio) {
      if (!textureReady || gl.isContextLost()) return;
      gl.useProgram(program);
      for (let i = 0; i < attributeCount; i++) gl.disableVertexAttribArray(i);
      gl.bindBuffer(gl.ARRAY_BUFFER, surfaceBuffer);
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surfaceIndex);
      if (inkDirty) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, inkTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ink);
        inkDirty = false;
      }
      const dpr = ratio || view.dpr;
      const width = Math.round(view.width * dpr);
      const height = Math.round(view.height * dpr);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform2f(locations.uViewport, view.width, view.height);
      gl.uniform2f(locations.uCenter, view.cx, view.cy);
      gl.uniform1f(locations.uWidth, view.scale * world.width);
      gl.uniform1f(locations.uAngle, angle);
      gl.uniform1f(locations.uTilt, tilt);
      gl.uniform1f(locations.uTree, treeVisible ? 1 : 0);
      const sculpt = focus && treeVisible && filaments && filaments.ready()
        ? Math.min(1, Math.max(0, (focus.zoom-1)/2.5)) * focus.progress : 0;
      gl.uniform1f(locations.uSculpt, sculpt);
      const materialStrength=focus&&treeVisible&&materials&&materials.ready()?Math.min(1,Math.max(0,(focus.zoom-1)/2.5))*focus.progress:0;
      gl.uniform1f(locations.uMaterialStrength,materialStrength);
      gl.uniform1f(locations.uVolume,!treeVisible&&sculpture&&sculpture.active()?1:0);
      gl.uniform4fv(locations.uVolumeBounds,sculpture?sculpture.bounds():[0,0,0,0]);
      // Close relief shells give the fine lines a little physical thickness.
      for (const shell of [-.022, -.011, 0]) {
        gl.uniform1f(locations.uShell, shell / (focus ? focus.zoom : 1));
        gl.uniform1f(locations.uOpacity, shell === 0 ? 1 : .17);
        gl.uniform1f(locations.uPaint, shell === 0 ? 1 : 0);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      }
      if (sculpt > 0 || materialStrength > 0) {
        const corners = [[0,0],[view.width,0],[0,view.height],[view.width,view.height]].map(([x,y]) => pointAt(x,y));
        const area = {
          left: Math.min(...corners.map(p => p.x))/world.width, right: Math.max(...corners.map(p => p.x))/world.width,
          top: Math.min(...corners.map(p => p.y))/world.height, bottom: Math.max(...corners.map(p => p.y))/world.height
        };
        if(sculpt>0)filaments.draw(view, world, angle, tilt, sculpt, inspection, area);
        if(materialStrength>0)materials.draw(view,world,angle,tilt,materialStrength,inspection,area,detailCoordinates);
      }
      if(!treeVisible&&sculpture)sculpture.draw(view,world,angle,tilt);
      dirty = false;
    }
    function inspectionMoving() {
      return focus && !reduced.matches && Math.abs(inspection.x-inspection.targetX)+Math.abs(inspection.y-inspection.targetY) > .001;
    }
    function tick(now) {
      raf = 0;
      if (visible && now - lastFrame >= 32) {
        const elapsed = previous ? Math.min((now - previous) / 1000, .05) : 0;
        if (enabled && !held) {
          time += elapsed;
          angle = .08 + Math.sin(time * .23) * .36;
          tilt = -.025 + Math.sin(time * .17) * .035;
          dirty = true;
        }
        if (inspectionMoving()) {
          inspection.x += (inspection.targetX-inspection.x)*.18;
          inspection.y += (inspection.targetY-inspection.y)*.18;
          angle = focusAngle + inspection.x*.12*focus.progress;
          tilt = focusTilt + inspection.y*.075*focus.progress;
          applyFocus(); dirty = true;
          document.dispatchEvent(new Event("nire-inspection-change"));
        }
        previous = now;
        lastFrame = now;
        if (dirty) draw();
      }
      if (visible && (enabled && !held || dirty || inspectionMoving())) raf = requestAnimationFrame(tick);
    }
    function request() { if (!raf && visible) raf = requestAnimationFrame(tick); }
    function resize() {
      const studio = document.querySelector(".nire-studio").getBoundingClientRect();
      const space = document.getElementById("nire-art-space").getBoundingClientRect();
      const imageWidth = Math.min(space.width * .96, space.height / aspect * 1.17);
      view = {
        width: studio.width, height: studio.height,
        cx: space.left - studio.left + space.width / 2,
        cy: space.top - studio.top + space.height / 2 + imageWidth * aspect * .13,
        scale: imageWidth / world.width, dpr: Math.min(devicePixelRatio || 1, 2)
      };
      baseView = { ...view };
      applyFocus();
      dirty = true;
      request();
      return view;
    }
    function project(u, v) {
      const x = u - .5;
      const y = (.5 - v) * aspect;
      const z = .105 * Math.sin(u * 6.8 + v * 3.2) + .045 * Math.cos(v * 9.5 - u * 2.8);
      const rx = Math.cos(angle) * x + Math.sin(angle) * z;
      const rz = -Math.sin(angle) * x + Math.cos(angle) * z;
      const ry = Math.cos(tilt) * y - Math.sin(tilt) * rz;
      const depth = Math.sin(tilt) * y + Math.cos(tilt) * rz;
      const factor = view.scale * world.width * 4 / (4 - depth);
      return { x: view.cx + rx * factor, y: view.cy - ry * factor };
    }
    function pointAt(x, y) {
      let u = .5 + (x - view.cx) / (view.scale * world.width);
      let v = .5 + (y - view.cy) / (view.scale * world.height);
      // Invert the curved perspective surface; drawing stays under the pointer.
      for (let i = 0; i < 7; i++) {
        const p = project(u, v);
        const dx = x - p.x, dy = y - p.y;
        if (Math.abs(dx) + Math.abs(dy) < .05) break;
        const px = project(u + .0001, v);
        const py = project(u, v + .0001);
        const a = (px.x - p.x) / .0001, b = (py.x - p.x) / .0001;
        const c = (px.y - p.y) / .0001, d = (py.y - p.y) / .0001;
        const determinant = a * d - b * c;
        if (Math.abs(determinant) < .001) break;
        u += (d * dx - b * dy) / determinant;
        v += (-c * dx + a * dy) / determinant;
      }
      return { x: u * world.width, y: v * world.height };
    }
    function applyFocus() {
      view = { ...baseView };
      if (!focus) return;
      const anchor = project(focus.point.x / world.width, focus.point.y / world.height);
      const x = anchor.x + (view.width / 2 - anchor.x) * focus.progress;
      const y = anchor.y + (view.height / 2 - anchor.y) * focus.progress;
      view.cx = (view.cx - anchor.x) * focus.zoom + x;
      view.cy = (view.cy - anchor.y) * focus.zoom + y;
      view.scale *= focus.zoom;
    }
    document.querySelector(".nire-studio").prepend(canvas);
    document.body.classList.add("has-nire-scene");
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; previous = 0; request(); });
    reduced.addEventListener("change", (event) => { if (event.matches) api.setEnabled(false); });
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      visible = false;
      if (raf) cancelAnimationFrame(raf);
      document.body.classList.remove("has-nire-scene");
      document.dispatchEvent(new Event("nire-scene-lost"));
    });
    const api = {
      resize, pointAt,
      baseView: () => ({ ...baseView }),
      setFocus(point, zoom, progress) {
        if (point && !focus) { focusAngle = angle; focusTilt = tilt; }
        if (!point && focus) {
          angle = focusAngle; tilt = focusTilt;
          inspection.x = inspection.y = inspection.targetX = inspection.targetY = 0;
        }
        focus = point ? { point, zoom, progress } : null;
        if (focus) {
          angle = focusAngle + inspection.x*.12*progress;
          tilt = focusTilt + inspection.y*.075*progress;
        }
        applyFocus(); dirty = true; draw();
      },
      inspect(x, y) {
        if (!focus || reduced.matches) return;
        if (x === null) { inspection.targetX = inspection.x; inspection.targetY = inspection.y; return; }
        inspection.targetX = Math.max(-1, Math.min(1, x));
        inspection.targetY = Math.max(-1, Math.min(1, y));
        request();
      },
      setDetail(source, bounds) {
        if (gl.isContextLost()) return;
        gl.useProgram(program);
        if (source) {
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, detailTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
          detailCoordinates=[bounds.x,bounds.y,bounds.width,bounds.height];
          gl.uniform4fv(locations.uDetailBounds,detailCoordinates);
        } else {
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, detailTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
          detailCoordinates=[0,0,0,0];
          gl.uniform4fv(locations.uDetailBounds,detailCoordinates);
        }
        dirty = true;
        request();
      },
      hasSculpture: () => Boolean(sculpture),
      setSculpture(model) {
        if(!sculpture)return;
        sculpture.set(model);
        canvas.dataset.userVolume=String(sculpture.vertices());
        dirty=true;request();
      },
      maxTextureSize: () => gl.getParameter(gl.MAX_TEXTURE_SIZE),
      projectPoint: (point) => project(point.x / world.width, point.y / world.height),
      enabled: () => enabled,
      setEnabled(value) { enabled = value; previous = 0; document.dispatchEvent(new Event("nire-motion-change")); request(); },
      hold(value) { held = value; previous = 0; request(); },
      update() { inkDirty = dirty = true; request(); },
      flush() { if (dirty) draw(); },
      setTreeVisible(value) { if (treeVisible !== value) { treeVisible = value; dirty = true; request(); } },
      copyTo(ctx) { draw(2); ctx.drawImage(canvas, 0, 0, view.width, view.height); draw(); },
      view: () => ({ ...view, angle, tilt })
    };
    resize();
    return api;
  };
}());
