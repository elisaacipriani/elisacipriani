(function () {
  "use strict";

  // A white spatial tree and a separate surface for the visitor's own artwork.
  window.createNireScene = function (ink, world, inkBounds) {
    const canvas = document.createElement("canvas");
    canvas.className = "nire-scene";
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl", { alpha: false, antialias: true, preserveDrawingBuffer: true });
    if (!gl) return null;
    const aspect = world.height / world.width;
    const maxRenderSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let enabled = !reduced.matches;
    let treeMotion = true;
    let held = false;
    let visible = !document.hidden;
    let dirty = true;
    let inkDirty = true;
    let treeVisible = false;
    let modelReveal = 0;
    let treeAngle = .045;
    const turnDuration = 30;
    let time = 0;
    let previous = 0;
    let angle = .045;
    let tilt = -.012;
    let lastFrame = 0;
    let raf = 0;
    let view = { width: 1, height: 1, scale: 1, cx: 0, cy: 0, dpr: 1 };
    let baseView = { ...view };
    let focus = null;
    let focusAngle = 0, focusTilt = 0, focusStartAngle = 0, focusStartTilt = 0;
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
      uniform float uRelief;
      varying vec2 vUV;
      float relief(vec2 uv) {
        return uRelief * (.105 * sin(uv.x * 6.8 + uv.y * 3.2) + .045 * cos(uv.y * 9.5 - uv.x * 2.8));
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
      }`;
    const fragmentSource = `
      precision highp float;
      uniform sampler2D uInk;
      uniform sampler2D uVolumeMask;
      uniform vec4 uVolumeBounds;
      uniform float uVolume;
      uniform vec4 uInkBounds;
      uniform float uOpacity;
      uniform float uPaint;
      varying vec2 vUV;
      void main() {
        vec4 ink = texture2D(uInk, (vUV - uInkBounds.xy) / uInkBounds.zw);
        ink.a *= uPaint;
        vec2 volumeUV=(vUV-uVolumeBounds.xy)/max(uVolumeBounds.zw,vec2(.00001));
        if(uVolume>0.0&&volumeUV.x>=0.0&&volumeUV.x<=1.0&&volumeUV.y>=0.0&&volumeUV.y<=1.0)ink.a*=1.0-texture2D(uVolumeMask,volumeUV).r;
        if (ink.a < .005) discard;
        gl_FragColor = vec4(ink.rgb,ink.a*uOpacity);
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
    ["uViewport", "uCenter", "uWidth", "uAspect", "uAngle", "uTilt", "uShell", "uRelief", "uInk", "uVolumeMask", "uVolumeBounds", "uVolume", "uInkBounds", "uOpacity", "uPaint"].forEach((key) => {
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
    const inkTexture = texture(1);
    gl.uniform1i(locations.uInk, 1);
    gl.uniform1i(locations.uVolumeMask, 4);
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
    const materials = window.createNireMaterials ? window.createNireMaterials(gl, (stats) => {
      if(stats){canvas.dataset.materials="white";canvas.dataset.materialTriangles=String(stats.triangles);}
      dirty=true;request();
    }) : null;
    const modelReady=()=>Boolean(filaments&&filaments.ready()&&materials&&materials.ready());
    const sculpture = window.createNireSculpture ? window.createNireSculpture(gl) : null;
    if (!sculpture) texture(4);
    if(filaments)filaments.load();
    if(materials)materials.load();

    function draw(ratio) {
      if (gl.isContextLost()) return;
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
      // Supersample close-ups within a fixed pixel budget. The camera and input
      // stay in CSS pixels, so higher rendering resolution cannot stretch shapes.
      const requested = treeVisible && focus ? Math.max(view.dpr, 1.5) : view.dpr;
      const dpr = ratio || Math.min(requested, Math.sqrt(8000000 / (view.width * view.height)), maxRenderSize / Math.max(view.width, view.height));
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
      gl.uniform1f(locations.uRelief, treeVisible ? .32 : 1);
      const sculpt = treeVisible && modelReady() ? modelReveal : 0;
      const materialStrength=sculpt;
      gl.uniform1f(locations.uVolume,!treeVisible&&sculpture&&sculpture.active()?1:0);
      gl.uniform4fv(locations.uVolumeBounds,sculpture?sculpture.bounds():[0,0,0,0]);
      // Close relief shells give the fine lines a little physical thickness.
      for (const shell of treeVisible ? [] : [-.022, -.011, 0]) {
        gl.uniform1f(locations.uShell, shell / (focus ? focus.zoom : 1));
        gl.uniform1f(locations.uOpacity, shell === 0 ? 1 : .17);
        gl.uniform1f(locations.uPaint, shell === 0 ? 1 : 0);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      }
      if (sculpt > 0 || materialStrength > 0) {
        // Culling by an inverse photograph is invalid at the side and rear.
        // The closed geometry itself handles every viewing direction.
        const area = null;
        if(sculpt>0)filaments.draw(view, world, angle, tilt, sculpt, inspection, area);
        if(materialStrength>0)materials.draw(view,world,angle,tilt,materialStrength,inspection);
      }
      if(!treeVisible&&sculpture)sculpture.draw(view,world,angle,tilt);
      canvas.dataset.renderMode=treeVisible?(modelReveal>=1?'model':'loading'):'surface';
      dirty = false;
    }
    function inspectionMoving() {
      return focus && !reduced.matches && Math.abs(inspection.x-inspection.targetX)+Math.abs(inspection.y-inspection.targetY) > .001;
    }
    function revealPending(){return treeVisible&&modelReady()&&modelReveal<1;}
    function orbitMoving(){return !held&&(treeVisible?treeMotion&&modelReady()&&modelReveal>=1:enabled);}
    function tick(now) {
      raf = 0;
      if (visible && now - lastFrame >= 32) {
        const elapsed = previous ? Math.min((now - previous) / 1000, .15) : 0;
        if(revealPending()){modelReveal=Math.min(1,modelReveal+elapsed/.8);dirty=true;}
        if (orbitMoving()) {
          if(treeVisible){
            treeAngle+=elapsed*Math.PI*2/turnDuration;
            angle=treeAngle;tilt=-.012;
          }else{
            time+=elapsed;
            angle=.08+Math.sin(time*.23)*.36;
            tilt=-.025+Math.sin(time*.17)*.035;
          }
          dirty = true;
        }
        if (inspectionMoving()) {
          inspection.x += (inspection.targetX-inspection.x)*.12;
          inspection.y += (inspection.targetY-inspection.y)*.12;
          angle = focusAngle + inspection.x*.035*focus.progress;
          tilt = focusTilt + inspection.y*.02*focus.progress;
          applyFocus(); dirty = true;
          document.dispatchEvent(new Event("nire-inspection-change"));
        }
        previous = now;
        lastFrame = now;
        if (dirty) draw();
      }
      if (visible && (orbitMoving() || dirty || inspectionMoving() || revealPending())) raf = requestAnimationFrame(tick);
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
        scale: imageWidth / world.width, dpr: Math.min(devicePixelRatio || 1, 3)
      };
      baseView = { ...view };
      applyFocus();
      dirty = true;
      request();
      return view;
    }
    function project(u, v, height) {
      const x = u - .5;
      const y = (.5 - v) * aspect;
      const z = height===undefined ? treeVisible&&modelReveal>=.5&&window.NireTreeForm ? window.NireTreeForm.depth(u,v) : (treeVisible ? .32 : 1) * (.105 * Math.sin(u * 6.8 + v * 3.2) + .045 * Math.cos(v * 9.5 - u * 2.8)) : height;
      const rx = Math.cos(angle) * x + Math.sin(angle) * z;
      const rz = -Math.sin(angle) * x + Math.cos(angle) * z;
      const ry = Math.cos(tilt) * y - Math.sin(tilt) * rz;
      const depth = Math.sin(tilt) * y + Math.cos(tilt) * rz;
      const factor = view.scale * world.width * 4 / (4 - depth);
      return { x: view.cx + rx * factor, y: view.cy - ry * factor };
    }
    function pointAt(x, y) {
      if(treeVisible&&modelReveal>=.5&&focus){
        // Pan on the camera plane through the selected 3D point. Unlike a
        // photograph inverse this remains defined when branches face sideways.
        const u=focus.point.x/world.width,v=focus.point.y/world.height;
        const z=focus.point.z===undefined?window.NireTreeForm.depth(u,v):focus.point.z/world.width;
        const px=u-.5,py=(.5-v)*aspect,c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
        const rx=c*px+s*z,rz=-s*px+c*z,ry=ct*py-st*rz,depth=st*py+ct*rz;
        const anchor=project(u,v,z),scale=view.scale*world.width*4/(4-depth);
        const cameraX=rx+(x-anchor.x)/scale,cameraY=ry-(y-anchor.y)/scale;
        const worldY=ct*cameraY+st*depth,rotatedZ=-st*cameraY+ct*depth;
        return{x:(c*cameraX-s*rotatedZ+.5)*world.width,y:(aspect*.5-worldY)*world.width,z:(s*cameraX+c*rotatedZ)*world.width};
      }
      let u = .5 + (x - view.cx) / (view.scale * world.width) * (Math.cos(angle)<0?-1:1);
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
    function pickPoint(x,y,tolerance=20){
      if(!treeVisible||!modelReady()||modelReveal<.5)return null;
      const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
      let nearest=null,best=tolerance*tolerance,nearestDepth=-Infinity;
      const groups=[...filaments.pickPoints(),...materials.pickPoints()];
      for(const points of groups){
        for(let i=0;i<points.length;i+=4){
          const px=points[i],py=points[i+1],pz=points[i+2],r=points[i+3];
          const rx=c*px+s*pz,rz=-s*px+c*pz,ry=ct*py-st*rz,depth=st*py+ct*rz;
          const scale=view.scale*world.width*4/(4-depth);
          const dx=view.cx+rx*scale-x,dy=view.cy-ry*scale-y;
          const distance=r?Math.max(0,Math.hypot(dx,dy)-r*scale)**2:dx*dx+dy*dy;
          if(distance<best || distance===best&&depth>nearestDepth){
            best=distance;nearestDepth=depth;
            nearest={x:(px+.5)*world.width,y:(aspect*.5-py)*world.width,z:pz*world.width};
          }
        }
      }
      return nearest;
    }
    function applyFocus() {
      view = { ...baseView };
      if (!focus) return;
      const anchor = project(focus.point.x / world.width, focus.point.y / world.height,focus.point.z===undefined?undefined:focus.point.z/world.width);
      const x = anchor.x + (view.width / 2 - anchor.x) * focus.progress;
      const y = anchor.y + (view.height / 2 - anchor.y) * focus.progress;
      view.cx = (view.cx - anchor.x) * focus.zoom + x;
      view.cy = (view.cy - anchor.y) * focus.zoom + y;
      view.scale *= focus.zoom;
    }
    document.querySelector(".nire-studio").prepend(canvas);
    document.body.classList.add("has-nire-scene");
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; previous = 0; request(); });
    reduced.addEventListener("change", (event) => { if (event.matches&&!treeVisible) api.setEnabled(false); });
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      visible = false;
      if (raf) cancelAnimationFrame(raf);
      document.body.classList.remove("has-nire-scene");
      document.dispatchEvent(new Event("nire-scene-lost"));
    });
    const api = {
      resize, pointAt, pickPoint,
      modelVisible:()=>treeVisible&&modelReveal>=.5,
      baseView: () => ({ ...baseView }),
      setFocus(point, zoom, progress) {
        if (point && !focus) {
          focusStartAngle=angle;focusStartTilt=tilt;
          // Keep the selected part in the same spatial orientation when zooming.
          focusAngle=angle;focusTilt=tilt;
        }
        if (!point && focus) {
          angle = treeAngle; tilt = -.012;
          inspection.x = inspection.y = inspection.targetX = inspection.targetY = 0;
        }
        focus = point ? { point, zoom, progress } : null;
        if (focus) {
          angle = focusStartAngle+(focusAngle-focusStartAngle)*progress+inspection.x*.035*progress;
          tilt = focusStartTilt+(focusTilt-focusStartTilt)*progress+inspection.y*.02*progress;
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
      hasSculpture: () => Boolean(sculpture),
      setSculpture(model) {
        if(!sculpture)return;
        sculpture.set(model);
        canvas.dataset.userVolume=String(sculpture.vertices());
        dirty=true;request();
      },
      maxTextureSize: () => gl.getParameter(gl.MAX_TEXTURE_SIZE),
      projectPoint: (point) => project(point.x / world.width, point.y / world.height,point.z===undefined?undefined:point.z/world.width),
      enabled: () => treeVisible?treeMotion:enabled,
      setEnabled(value) { if(treeVisible)treeMotion=Boolean(value);else enabled=Boolean(value);previous = 0; document.dispatchEvent(new Event("nire-motion-change")); request(); },
      hold(value) { held = value; previous = 0; request(); },
      update() { inkDirty = dirty = true; request(); },
      flush() { if (dirty) draw(); },
      setTreeVisible(value) { if (treeVisible !== value) {
        treeVisible = value;
        if(!value){angle=.08;tilt=-.025;time=0;}
        dirty = true;previous=0;document.dispatchEvent(new Event("nire-motion-change"));request();
      } },
      copyTo(ctx) { draw(2); ctx.drawImage(canvas, 0, 0, view.width, view.height); draw(); },
      view: () => ({ ...view, angle, tilt })
    };
    resize();
    return api;
  };
}());
