(function () {
  "use strict";

  // A spatial herbarium and a separate surface for the visitor's own artwork.
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
    let treeMotion = !reduced.matches;
    let held = false;
    let interacting = false;
    let visible = !document.hidden;
    let dirty = true;
    let inkDirty = true;
    let treeVisible = false;
    let modelReveal = 0;
    let universeReveal = 0;
    const initialTreeAngle = .045, initialTreeTilt = -.012;
    const turnDuration = 30;
    let treeAngle = initialTreeAngle;
    const overview = { zoom: 1, x: 0, y: 0 };
    let returningToTree = null;
    let time = 0;
    let previous = 0;
    let angle = initialTreeAngle;
    let tilt = initialTreeTilt;
    let raf = 0;
    let view = { width: 1, height: 1, scale: 1, cx: 0, cy: 0, dpr: 1 };
    let baseView = { ...view };
    let focus = null;
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
    gl.clearColor(232/255,234/255,232/255,1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const filaments = window.createNireFilaments ? window.createNireFilaments(gl, (stats) => {
      canvas.dataset.filaments = String(stats.paths);
      canvas.dataset.bodies = String(stats.bodies);
      canvas.dataset.triangles = String(stats.triangles);
      dirty = true; request();
    }) : null;
    const materials = window.createNireMaterials ? window.createNireMaterials(gl, (stats) => {
      if(stats){canvas.dataset.materials="coral";canvas.dataset.materialTriangles=String(stats.triangles);}
      dirty=true;request();
    }) : null;
    const modelReady=()=>Boolean(filaments&&filaments.ready()&&materials&&materials.ready());
    // The herbarium replaces the earlier broad painted / terrace objects.
    const universe=null;
    const boulder=window.createNireBoulder?window.createNireBoulder(gl,stats=>{
      canvas.dataset.boulder='ready';canvas.dataset.boulderTriangles=String(stats.triangles);dirty=true;request();
    }):null;
    const artistDrawing=window.createNireArtistDrawing?window.createNireArtistDrawing(gl,stats=>{
      canvas.dataset.artistDrawing='ready';canvas.dataset.artistDrawingStrokes=String(stats.strokes);canvas.dataset.artistDrawingTriangles=String(stats.triangles);dirty=true;request();
    }):null;
    const stage=window.createNireStage?window.createNireStage(gl):null;
    const botany=window.createNireBotany?window.createNireBotany(gl,stats=>{
      canvas.dataset.botany=String(stats.specimens.length);canvas.dataset.bubbles=String(stats.bubbles?.length||0);canvas.dataset.botanicalTriangles=String(stats.triangles);dirty=true;request();
      canvas.dataset.crystal=stats.crystal?'ready':'unavailable';canvas.dataset.crystalTriangles=String(stats.crystal?.triangles||0);
      canvas.dataset.crystalRoots=String(stats.crystal?.roots||0);canvas.dataset.crystalRootTips=String(stats.crystal?.tips||0);
    }):null;
    function discoveryAmount(){
      return treeVisible&&focus&&focus.point.feature!=='boulder'&&universe&&universe.ready()?focus.progress*universeReveal*Math.max(0,Math.min(1,(focus.zoom-2)/2)):0;
    }
    const sculpture = window.createNireSculpture ? window.createNireSculpture(gl) : null;
    const elements=window.createNireElements?window.createNireElements(gl,count=>{
      canvas.dataset.communityElements=String(count);dirty=true;request();
    }):null;
    if (!sculpture) texture(4);
    if(filaments)filaments.load();
    if(materials)materials.load();
    if(boulder)boulder.load();
    if(artistDrawing)artistDrawing.load();
    if(botany)botany.load();

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
      const dark=Boolean(window.NireAppearance?.isDark());
      gl.clearColor(dark?0:232/255,dark?0:234/255,dark?0:232/255,1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if(stage)stage.draw(view,world,treeVisible,dark);
      // The backdrop uses its own full-screen program; restore the paint surface.
      gl.useProgram(program);
      for(let i=0;i<attributeCount;i++)gl.disableVertexAttribArray(i);
      gl.bindBuffer(gl.ARRAY_BUFFER,surfaceBuffer);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,surfaceIndex);
      gl.uniform2f(locations.uViewport, view.width, view.height);
      gl.uniform2f(locations.uCenter, view.cx, view.cy);
      gl.uniform1f(locations.uWidth, view.scale * world.width);
      gl.uniform1f(locations.uAngle, angle);
      gl.uniform1f(locations.uTilt, tilt);
      gl.uniform1f(locations.uRelief, treeVisible ? .32 : 1);
      const sculpt = treeVisible && modelReady() ? modelReveal : 0;
      const materialStrength=sculpt;
      const discovery=discoveryAmount();
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
        if(sculpt>0)filaments.draw(view, world, angle, tilt, sculpt, inspection, area,discovery);
        if(boulder)boulder.draw(view,baseView,world,angle,tilt,sculpt);
        if(artistDrawing)artistDrawing.draw(view,world,angle,tilt,sculpt);
        if(materialStrength>0)materials.draw(view,world,angle,tilt,materialStrength,inspection,discovery,botany?.waxTexture());
        if(discovery>0)universe.draw(view,world,angle,tilt,sculpt*discovery,inspection);
        if(botany)botany.draw(view,world,angle,tilt,sculpt);
        if(elements)elements.draw(view,world,angle,tilt,dark);
      }
      if(!treeVisible&&sculpture)sculpture.draw(view,world,angle,tilt);
      canvas.dataset.renderMode=treeVisible?(modelReveal>=1?'model':'loading'):'surface';
      canvas.dataset.universe=discovery>.99?'revealed':discovery>0?'revealing':'hidden';
      dirty = false;
    }
    function revealPending(){return treeVisible&&modelReady()&&modelReveal<1;}
    function universePending(){return treeVisible&&focus&&universe&&universe.ready()&&universeReveal<1;}
    function orbitMoving(){
      if(held||interacting)return false;
      return treeVisible ? treeMotion&&!focus&&modelReady()&&modelReveal>=1 : enabled;
    }
    function tick(now) {
      raf = 0;
      if (visible) {
        const elapsed = previous ? Math.min((now - previous) / 1000, .15) : 0;
        if(revealPending()){modelReveal=Math.min(1,modelReveal+elapsed/.8);dirty=true;}
        if(universePending()){universeReveal=Math.min(1,universeReveal+elapsed/.65);dirty=true;}
        if (orbitMoving()) {
          if(treeVisible){
            treeAngle=(treeAngle+elapsed*Math.PI*2/turnDuration)%(Math.PI*2);
            angle=treeAngle;
            tilt=initialTreeTilt;
          }else{
            time+=elapsed;
            angle=.08+Math.sin(time*.23)*.36;
            tilt=-.025+Math.sin(time*.17)*.035;
          }
          dirty = true;
        }
        previous = now;
        if (dirty) draw();
      }
      if (visible && (orbitMoving() || dirty || revealPending() || universePending())) raf = requestAnimationFrame(tick);
    }
    function request() { if (!raf && visible) raf = requestAnimationFrame(tick); }
    function resize() {
      const studio = document.querySelector(".nire-studio").getBoundingClientRect();
      const space = document.getElementById("nire-art-space").getBoundingClientRect();
      const imageWidth = Math.min(space.width * .96, space.height / aspect * 1.17);
      view = {
        width: studio.width, height: studio.height,
        cx: space.left - studio.left + space.width / 2,
        cy: space.top - studio.top + space.height / 2 + imageWidth * aspect * .075,
        scale: imageWidth / world.width, dpr: Math.min(devicePixelRatio || 1, 3)
      };
      baseView = { ...view };
      applyFocus();
      dirty = true;
      request();
      document.dispatchEvent(new Event('nire-scene-resize'));
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
        // Pan on the camera plane through the selected 3D point while
        // preserving the tree's fixed viewing direction.
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
      const discovery=discoveryAmount();
      const groups=[...filaments.pickPoints().map(points=>({points,kinds:filaments.pickMaterials()})),...materials.pickPoints().map(points=>({points,material:'bubble'}))];
      for(const {points,kinds,material} of groups){
        for(let i=0;i<points.length;i+=4){
          if(discovery>.99&&kinds&&kinds[i/4])continue;
          const px=points[i],py=points[i+1],pz=points[i+2],r=points[i+3];
          const rx=c*px+s*pz,rz=-s*px+c*pz,ry=ct*py-st*rz,depth=st*py+ct*rz;
          const scale=view.scale*world.width*4/(4-depth);
          const dx=view.cx+rx*scale-x,dy=view.cy-ry*scale-y;
          const distance=r?Math.max(0,Math.hypot(dx,dy)-r*scale)**2:dx*dx+dy*dy;
          if(distance<best || distance===best&&depth>nearestDepth){
            best=distance;nearestDepth=depth;
            nearest={x:(px+.5)*world.width,y:(aspect*.5-py)*world.width,z:pz*world.width,material:material||(kinds&&kinds[i/4]?'rock':'white')};
          }
        }
      }
      if(discovery>.5){
        const hit=universe.pickPoint(view,world,angle,tilt,x,y);
        if(hit&&(!nearest||best>16||hit.depth>=nearestDepth-.0003)){
          const p=hit.point;nearestDepth=hit.depth;best=0;nearest={x:(p[0]+.5)*world.width,y:(aspect*.5-p[1])*world.width,z:p[2]*world.width,material:'rock'};
        }
      }
      const stone=boulder&&boulder.pickPoint(view,baseView,world,angle,tilt,x,y);
      if(stone&&(!nearest||best>16||stone.depth>=nearestDepth-.0003)){
        const p=stone.point;nearestDepth=stone.depth;best=0;nearest={x:(p[0]+.5)*world.width,y:(aspect*.5-p[1])*world.width,z:p[2]*world.width,material:'boulder',feature:'boulder'};
      }
      const plant=botany&&botany.pickPoint(view,world,angle,tilt,x,y);
      // The narrow glass surface has an exact ray hit. A nearby sampled branch
      // should occlude that hit only when it is actually under the pointer.
      if(plant&&(!nearest||best>(plant.kind===13?1:16)||plant.depth>=nearestDepth-.0003)){
        const p=plant.point;nearestDepth=plant.depth;best=0;nearest={x:(p[0]+.5)*world.width,y:(aspect*.5-p[1])*world.width,z:p[2]*world.width,material:plant.kind===13?'crystal':plant.kind===12?'bubble':'botanical',specimen:plant.id};
        if(plant.kind===13)nearest.feature='poppyTear';
      }
      const drawing=artistDrawing&&artistDrawing.pickPoint(view,world,angle,tilt,x,y,Math.min(9,tolerance));
      if(drawing&&(!nearest||drawing.distance<best||(drawing.distance<=best&&drawing.depth>=nearestDepth-.0003))){
        nearestDepth=drawing.depth;
        const p=drawing.point;nearest={x:(p[0]+.5)*world.width,y:(aspect*.5-p[1])*world.width,z:p[2]*world.width,material:'drawing',feature:'elisaDrawing'};
      }
      const element=elements?.pick(x,y,p=>project(p.x/world.width,p.y/world.height,p.z/world.width),view,world,angle,tilt);
      if(element){
        const px=element.x/world.width-.5,py=aspect*.5-element.y/world.width,pz=element.z/world.width;
        const depth=Math.sin(tilt)*py+Math.cos(tilt)*(-Math.sin(angle)*px+Math.cos(angle)*pz);
        if(!nearest||depth>=nearestDepth-.0003)nearest=element;
      }
      return nearest;
    }
    function constrainTreeView(camera){
      // The entry frame is locked. Camera travel grows with magnification,
      // and contracts back to the original center as the visitor zooms out.
      camera.scale=Math.max(baseView.scale,camera.scale);
      const extra=camera.scale/baseView.scale-1;
      const x=baseView.width*extra/2,y=baseView.height*extra/2;
      camera.cx=Math.max(baseView.cx-x,Math.min(baseView.cx+x,camera.cx));
      camera.cy=Math.max(baseView.cy-y,Math.min(baseView.cy+y,camera.cy));
      return camera;
    }
    function overviewView(){
      if(!treeVisible)return {...baseView};
      const camera=constrainTreeView({...baseView,scale:baseView.scale*overview.zoom,cx:baseView.cx+overview.x,cy:baseView.cy+overview.y});
      overview.x=camera.cx-baseView.cx;overview.y=camera.cy-baseView.cy;
      return camera;
    }
    function resetOverview(){
      overview.zoom=1;overview.x=overview.y=0;
      treeAngle=angle=initialTreeAngle;tilt=initialTreeTilt;
      returningToTree=focus=null;
      inspection.x=inspection.y=inspection.targetX=inspection.targetY=0;
      previous=0;applyFocus();dirty=true;request();
    }
    function applyFocus() {
      view = overviewView();
      if (!focus) return;
      const anchor = project(focus.point.x / world.width, focus.point.y / world.height,focus.point.z===undefined?undefined:focus.point.z/world.width);
      const x = anchor.x + (view.width / 2 - anchor.x) * focus.progress;
      const y = anchor.y + (view.height / 2 - anchor.y) * focus.progress;
      view.cx = (view.cx - anchor.x) * focus.zoom + x;
      view.cy = (view.cy - anchor.y) * focus.zoom + y;
      view.scale *= focus.zoom;
      constrainTreeView(view);
    }
    document.querySelector(".nire-studio").prepend(canvas);
    document.body.classList.add("has-nire-scene");
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; previous = 0; request(); });
    document.addEventListener('nire-appearance-change',()=>{dirty=true;request();});
    reduced.addEventListener("change", (event) => {
      if(event.matches){enabled=treeMotion=false;previous=0;document.dispatchEvent(new Event("nire-motion-change"));request();}
    });
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      visible = false;
      if (raf) cancelAnimationFrame(raf);
      document.body.classList.remove("has-nire-scene");
      document.dispatchEvent(new Event("nire-scene-lost"));
    });
    const api = {
      resize, pointAt, pickPoint,
      setElements(value){elements?.set(value);},
      previewElement(value){elements?.setPreview(value);},
      featureInfo(name){
        if(name.startsWith('community:')){
          const info=elements?.feature(name);if(!info)return null;
          const camera=overviewView(),p=info.point,px=p.x/world.width-.5,py=aspect*.5-p.y/world.width,pz=p.z/world.width;
          const rx=Math.cos(angle)*px+Math.sin(angle)*pz,rz=-Math.sin(angle)*px+Math.cos(angle)*pz;
          const ry=Math.cos(tilt)*py-Math.sin(tilt)*rz,depth=Math.sin(tilt)*py+Math.cos(tilt)*rz,factor=camera.scale*world.width*4/(4-depth),size=info.size*camera.scale*4/(4-depth);
          return {...info,zoom:Math.max(1.4,Math.min(80,Math.min(camera.width,camera.height)*.62/size)),screen:{x:camera.cx+rx*factor,y:camera.cy-ry*factor,width:size,height:size}};
        }
        const info=name==='boulder'&&boulder&&boulder.ready()?boulder.feature(baseView,world,angle,tilt):name==='elisaDrawing'&&artistDrawing&&artistDrawing.ready()?artistDrawing.feature(baseView,world,angle,tilt):name==='poppyTear'&&botany?botany.crystalFeature(baseView,world,angle,tilt):null;
        if(!info)return null;
        const screen={...info.screen,x:baseView.cx+(info.screen.x-baseView.cx)*overview.zoom+overview.x,y:baseView.cy+(info.screen.y-baseView.cy)*overview.zoom+overview.y};
        for(const key of ['width','height','scale'])if(Number.isFinite(screen[key]))screen[key]*=overview.zoom;
        return {...info,zoom:info.zoom/overview.zoom,screen};
      },
      modelVisible:()=>treeVisible&&modelReveal>=.5,
      baseView: overviewView,
      overviewZoom:()=>overview.zoom,
      resetOverview,
      beginReturnToTree(){
        // Return along the shorter arc, always to the original entry pose.
        const delta=Math.atan2(Math.sin(angle-initialTreeAngle),Math.cos(angle-initialTreeAngle));
        returningToTree={...overview,angle:initialTreeAngle+delta};
      },
      zoomOverview(factor,x,y){
        if(!treeVisible||focus)return;
        const old=overviewView(),next=Math.max(1,Math.min(32,overview.zoom*factor)),ratio=next/overview.zoom;
        overview.x=x+(old.cx-x)*ratio-baseView.cx;overview.y=y+(old.cy-y)*ratio-baseView.cy;overview.zoom=next;
        applyFocus();dirty=true;request();
      },
      panOverview(x,y){
        if(!treeVisible||focus||overview.zoom<=1)return;
        overview.x+=x;overview.y+=y;applyFocus();dirty=true;request();
      },
      interact(value){interacting=Boolean(value);previous=0;request();},
      setFocus(point, zoom, progress) {
        if(point&&point.feature!=='boulder'&&universe)universe.load();
        if(!point&&returningToTree)resetOverview();
        focus = point ? { point, zoom, progress } : null;
        if(treeVisible){
          angle=focus&&returningToTree ? initialTreeAngle+(returningToTree.angle-initialTreeAngle)*progress : treeAngle;
          tilt=initialTreeTilt;
        }
        if(focus&&returningToTree){
          overview.zoom=Math.exp(Math.log(returningToTree.zoom)*progress);
          overview.x=returningToTree.x*progress;overview.y=returningToTree.y*progress;
        }
        applyFocus(); dirty = true; request();
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
      setEnabled(value) {
        if(treeVisible)treeMotion=Boolean(value);else enabled=Boolean(value);
        previous=0;document.dispatchEvent(new Event("nire-motion-change"));request();
      },
      hold(value) { held = value; previous = 0; request(); },
      update() { inkDirty = dirty = true; request(); },
      flush() { if (dirty) draw(); },
      setTreeVisible(value) { if (treeVisible !== value) {
        treeVisible = value;
        if(value){treeAngle=angle=initialTreeAngle;tilt=initialTreeTilt;}
        else{angle=.08;tilt=-.025;time=0;}
        applyFocus();
        dirty = true;previous=0;document.dispatchEvent(new Event("nire-motion-change"));request();
      } },
      copyTo(ctx) { draw(2); ctx.drawImage(canvas, 0, 0, view.width, view.height); draw(); },
      view: () => ({ ...view, angle, tilt })
    };
    resize();
    return api;
  };
}());
