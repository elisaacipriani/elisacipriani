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
      precision mediump float;
      uniform sampler2D uPhoto;
      uniform sampler2D uInk;
      uniform vec4 uInkBounds;
      uniform float uOpacity;
      uniform float uPaint;
      uniform float uTree;
      varying vec2 vUV;
      varying float vLight;
      void main() {
        vec4 photo = vec4(0.0);
        if (vUV.x >= 0.0 && vUV.x <= 1.0 && vUV.y >= 0.0 && vUV.y <= 1.0) photo = texture2D(uPhoto, vUV);
        vec4 ink = texture2D(uInk, (vUV - uInkBounds.xy) / uInkBounds.zw);
        ink.a *= uPaint;
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
    const locations = {};
    ["uViewport", "uCenter", "uWidth", "uAspect", "uAngle", "uTilt", "uShell", "uPhoto", "uInk", "uInkBounds", "uOpacity", "uPaint", "uTree"].forEach((key) => {
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
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, "aUV");
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
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
    gl.uniform1i(locations.uPhoto, 0);
    gl.uniform1i(locations.uInk, 1);
    gl.uniform1f(locations.uAspect, aspect);
    gl.uniform4f(locations.uInkBounds, inkBounds.x / world.width, inkBounds.y / world.height, inkBounds.width / world.width, inkBounds.height / world.height);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    function uploadPhoto() {
      if (!image.naturalWidth) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, photoTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      textureReady = true;
      dirty = true;
      document.body.classList.add("has-nire-scene");
    }
    image.addEventListener("load", uploadPhoto);
    if (image.complete) uploadPhoto();

    function draw(ratio) {
      if (!textureReady || gl.isContextLost()) return;
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
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(locations.uViewport, view.width, view.height);
      gl.uniform2f(locations.uCenter, view.cx, view.cy);
      gl.uniform1f(locations.uWidth, view.scale * world.width);
      gl.uniform1f(locations.uAngle, angle);
      gl.uniform1f(locations.uTilt, tilt);
      gl.uniform1f(locations.uTree, treeVisible ? 1 : 0);
      // Close relief shells give the fine lines a little physical thickness.
      for (const shell of [-.022, -.011, 0]) {
        gl.uniform1f(locations.uShell, shell);
        gl.uniform1f(locations.uOpacity, shell === 0 ? 1 : .17);
        gl.uniform1f(locations.uPaint, shell === 0 ? 1 : 0);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      }
      dirty = false;
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
        previous = now;
        lastFrame = now;
        if (dirty) draw();
      }
      if (visible && (enabled && !held || dirty)) raf = requestAnimationFrame(tick);
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
      projectPoint: (point) => project(point.x / world.width, point.y / world.height),
      enabled: () => enabled,
      setEnabled(value) { enabled = value; previous = 0; document.dispatchEvent(new Event("nire-motion-change")); request(); },
      hold(value) { held = value; previous = 0; request(); },
      update() { inkDirty = dirty = true; request(); },
      setTreeVisible(value) { if (treeVisible !== value) { treeVisible = value; dirty = true; request(); } },
      copyTo(ctx) { draw(2); ctx.drawImage(canvas, 0, 0, view.width, view.height); draw(); },
      view: () => ({ ...view, angle, tilt })
    };
    resize();
    return api;
  };
}());
