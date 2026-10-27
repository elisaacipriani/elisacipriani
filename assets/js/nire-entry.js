(function () {
  "use strict";

  // Explore the actual spatial model; no flat drawing or photograph is shown.
  window.createNireEntrance = function (host) {
    const surface = document.getElementById("nire-detail-pan");
    const zoomIn = document.getElementById("nire-zoom-in");
    const zoomOut = document.getElementById("nire-zoom-out");
    const pointers = new Map();
    let pinch = null, tap = null, magnification = 1;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let active = false, moving = false, focus = null, feature = null, featureCenter = null, featureSize = 1;
    let zoom = 1, progress = 0, raf = 0, drag = null;
    let resizeFrame=0;
    let animationEnd = null;
    const lensLayer=document.createElement('div');
    lensLayer.className='nire-mist-fields';lensLayer.setAttribute('aria-live','polite');lensLayer.setAttribute('aria-atomic','true');surface.append(lensLayer);
    const lenses=[];

    function lensRadius(){
      const v=baseView();return Math.min(180,v.width*(v.width<600?.32:.18),v.height*.27);
    }
    function updateLenses(){
      const scene=host.scene();if(!scene)return;
      const v=baseView(),radius=lensRadius(),diameter=radius*2;
      for(const lens of lenses){
        const p=scene.projectPoint(lens.point);
        const x=Math.max(radius+12,Math.min(v.width-radius-12,p.x));
        const y=Math.max(radius+12,Math.min(v.height-radius-12,p.y));
        Object.assign(lens.node.style,{left:`${x}px`,top:`${y}px`,width:`${diameter}px`,height:`${diameter}px`});
      }
      surface.dataset.lenses=String(lenses.length);
    }
    function addLens(point){
      lenses.length=0;lensLayer.replaceChildren();
      const node=document.createElement('article');node.className='nire-mist-lens nire-rock-lens';
      const drawing=point.material==='drawing',bubble=point.material==='bubble',crystal=point.material==='crystal';
      if(drawing)node.classList.add('nire-drawing-lens');
      if(bubble)node.classList.add('nire-bubble-lens');
      if(crystal)node.classList.add('nire-crystal-lens');
      const label=drawing?'drawingFactLabel':bubble?'bubbleFactLabel':crystal?'crystalFactLabel':'rockFactLabel';
      node.dataset.nireLabel=label;node.setAttribute('aria-label',host.text(label));
      const content=document.createElement('div');content.className='nire-rock-copy';
      const stone=point.material==='boulder';
      const parts=drawing||bubble?[[drawing?'drawingFact':'bubbleFact','p','nire-rock-fact']]:[[crystal?'crystalTitle':stone?'boulderTitle':'rockTitle','h2','nire-rock-title'],[crystal?'crystalFact':stone?'boulderFact':'rockFact','p','nire-rock-fact']];
      for(const[key,tag,name]of parts){
        const part=document.createElement(tag);part.className=name;part.dataset.nireCopy=key;part.textContent=host.text(key);
        content.append(part);
      }
      node.append(content);lensLayer.append(node);
      lenses.push({node,point:{...point}});updateLenses();
      if(!reduced.matches)node.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.97)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:450,easing:'cubic-bezier(.22,1,.36,1)'});
    }
    function revealAt(x,y,keyboard=false){
      const scene=host.scene();if(!scene)return;
      for(let i=lenses.length-1;i>=0;i--){
        const r=lenses[i].node.getBoundingClientRect();
        if(Math.hypot(x-r.x-r.width/2,y-r.y-r.height/2)<lensRadius()){
          lenses.splice(i,1)[0].node.remove();updateLenses();return;
        }
      }
      let point=scene.pickPoint(x,y,12);
      const readable=p=>p&&['rock','boulder','drawing','bubble','crystal'].includes(p.material);
      // Fine line art and glass arches enclose open space. Their reflection is
      // also available inside the explored fragment and from its centre.
      if(!readable(point)&&['elisaDrawing','poppyTear'].includes(feature)){
        const info=scene.featureInfo(feature);
        if(info){
          const center=scene.projectPoint(info.point),ratio=scene.view().scale/baseView().scale;
          if(keyboard||(Math.abs(x-center.x)<=info.screen.width*ratio/2&&Math.abs(y-center.y)<=info.screen.height*ratio/2))point=info.point;
        }
      }
      if(readable(point))addLens(point);
    }

    function hitTest(x,y,tolerance){
      const scene=host.scene();
      return Boolean(scene&&scene.modelVisible()&&scene.pickPoint(x,y,tolerance));
    }
    function baseView() { return host.scene() ? host.scene().baseView() : host.view(); }
    function targetZoom() {
      const v = baseView();
      const specimen=feature&&host.scene()?.featureInfo(feature);if(specimen)return specimen.zoom;
      return Math.max(6.2, v.width * 2.6 / (v.scale * host.world.width), v.height * 3 / (v.scale * host.world.height));
    }
    function pointAt(x,y){
      const scene=host.scene();
      return scene?scene.pointAt(x,y):host.pointAt(x,y);
    }
    function draw() {
      if (!active || !focus) return;
      const scene = host.scene();
      if(scene)scene.setFocus(focus,zoom,progress);
      zoomIn.disabled = zoom >= targetZoom()*5-.01;
      zoomOut.disabled = zoom <= targetZoom()*.65+.01;
      surface.dataset.zoom = (zoom/targetZoom()).toFixed(3);
      updateLenses();
    }
    function animate(fromZoom, toZoom, fromProgress, toProgress) {
      moving = true;
      const duration = reduced.matches ? 0 : 900;
      return new Promise(resolve => {
        animationEnd = resolve;
        const began = performance.now();
        const tick = now => {
          const t = duration ? Math.min(1, (now - began) / duration) : 1;
          const ease = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          zoom = fromZoom + (toZoom - fromZoom) * ease;
          progress = fromProgress + (toProgress - fromProgress) * ease;
          draw();
          if (t < 1) raf = requestAnimationFrame(tick);
          else { raf = 0; moving = false; animationEnd = null; resolve(); }
        };
        raf = requestAnimationFrame(tick);
      });
    }
    async function open(origin) {
      const scene=host.scene();
      focus = scene&&scene.modelVisible()
        ? scene.pickPoint(origin.x,origin.y,32)||{x:host.world.width*.475,y:host.world.height*.397}
        : host.pointAt(origin.x, origin.y);
      feature=focus.feature||null;featureCenter=null;
      if(feature){const info=scene.featureInfo(feature);if(info){focus=info.point;featureCenter={...info.point};featureSize=info.size;}}
      active = true;
      magnification = 1;
      zoom = targetZoom(); progress = 1;
      // Keep the camera centered on the selected 3D point throughout the zoom.
      draw();
      zoom = 1; progress = 0; draw();
      await animate(1, targetZoom(), 0, 1);
    }
    async function close() {
      await animate(zoom, 1, progress, 0);
      reset();
    }
    function reset() {
      active = moving = false; drag = pinch = tap = null; pointers.clear();
      feature=featureCenter=null;
      lenses.length=0;lensLayer.replaceChildren();surface.dataset.lenses='0';
      cancelAnimationFrame(raf); raf = 0;
      cancelAnimationFrame(resizeFrame);resizeFrame=0;
      if (animationEnd) animationEnd();
      animationEnd = null;
      if(host.scene())host.scene().setFocus(null);
    }
    function center(point) {
      if (!active || moving) return;
      focus = { x: Math.max(0, Math.min(host.world.width, point.x)), y: Math.max(0, Math.min(host.world.height, point.y)) };
      if(Number.isFinite(point.z))focus.z=point.z;
      if(feature)focus.feature=feature;
      draw();
    }
    function shiftFocus(previous,next){
      const point={x:focus.x+previous.x-next.x,y:focus.y+previous.y-next.y};
      if(Number.isFinite(previous.z)&&Number.isFinite(next.z)){
        const base=focus.z===undefined?window.NireTreeForm.depth(focus.x/host.world.width,focus.y/host.world.height)*host.world.width:focus.z;
        point.z=base+previous.z-next.z;
      }
      center(point);
    }
    function zoomAt(factor, x, y) {
      if (!active || moving) return;
      const before = pointAt(x, y);
      zoom = Math.max(targetZoom()*.65, Math.min(targetZoom()*5, zoom*factor));
      magnification = zoom/targetZoom();
      draw();
      const after = pointAt(x, y);
      shiftFocus(before,after);
    }
    function zoomCentered(factor) {
      const v = baseView();
      zoomAt(factor, v.width/2, v.height/2);
    }
    zoomIn.addEventListener("click", () => zoomCentered(1.5));
    zoomOut.addEventListener("click", () => zoomCentered(1/1.5));
    surface.addEventListener("wheel", event => {
      if (!active || moving) return;
      event.preventDefault();
      const delta = event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?baseView().height:1);
      zoomAt(Math.exp(Math.max(-.4,Math.min(.4,-delta*.002))),event.clientX,event.clientY);
    }, { passive: false });
    function pinchState() {
      const [a,b] = [...pointers.values()];
      return { x: (a.x+b.x)/2, y: (a.y+b.y)/2, distance: Math.hypot(a.x-b.x,a.y-b.y) };
    }
    surface.addEventListener("pointerdown", event => {
      if (!active || moving || event.button !== 0) return;
      if(event.target.closest('.nire-rock-copy'))return;
      event.preventDefault();
      if (host.scene()) host.scene().inspect(null);
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      surface.setPointerCapture(event.pointerId);
      if (pointers.size===1){
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        tap={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};
      }else { tap = drag = null; pinch = pinchState(); }
      surface.classList.add("is-dragging");
    });
    surface.addEventListener("pointermove", event => {
      if (!active || moving) return;
      if (!pointers.has(event.pointerId)) {
        if (event.pointerType!=="touch" && host.scene()) host.scene().inspect(event.clientX/baseView().width*2-1,event.clientY/baseView().height*2-1);
        return;
      }
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(tap&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>6)tap=null;
      if (pointers.size>1) {
        const next = pinchState();
        if (pinch && pinch.distance>4) {
          zoomAt(next.distance/pinch.distance,next.x,next.y);
          const previous=pointAt(pinch.x,pinch.y),current=pointAt(next.x,next.y);
          shiftFocus(previous,current);
        }
        pinch=next; return;
      }
      if (!drag || drag.id !== event.pointerId) return;
      const previous = pointAt(drag.x, drag.y), next = pointAt(event.clientX, event.clientY);
      shiftFocus(previous,next);
      drag.x = event.clientX; drag.y = event.clientY;
    });
    function release(event) {
      const clicked=event.type==='pointerup'&&tap&&tap.id===event.pointerId&&pointers.size===1&&performance.now()-tap.time<750;
      tap=null;
      pointers.delete(event.pointerId);
      pinch=null;
      if(pointers.size===1) {
        const [id,p]=pointers.entries().next().value;
        drag={id,x:p.x,y:p.y};
      } else { drag=null; surface.classList.remove("is-dragging"); }
      if(clicked)revealAt(event.clientX,event.clientY);
    }
    surface.addEventListener("pointerup", release);
    surface.addEventListener("pointercancel", release);
    surface.addEventListener("lostpointercapture", release);
    surface.addEventListener("keydown", event => {
      if (!active || moving) return;
      if(event.target.closest('.nire-rock-copy'))return;
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();const v=baseView();revealAt(v.width/2,v.height/2,true);return;
      }
      if (["+","=","-","_"].includes(event.key)) {
        event.preventDefault(); zoomCentered(["+","="].includes(event.key)?1.3:1/1.3);return;
      }
      if (!event.key.startsWith("Arrow")) return;
      event.preventDefault();
      const middle = pointAt(baseView().width / 2, baseView().height / 2);
      const next = pointAt(baseView().width / 2 + ({ ArrowLeft: -80, ArrowRight: 80 }[event.key] || 0), baseView().height / 2 + ({ ArrowUp: -80, ArrowDown: 80 }[event.key] || 0));
      shiftFocus(next,middle);
    });
    function resizeDetail(){
      if (!active) return;
      cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(() => {
        resizeFrame=0;if (!active) return;
        if(feature&&featureCenter){
          const info=host.scene()?.featureInfo(feature);
          if(info){
            const ratio=info.size/featureSize;
            for(const a of ['x','y','z']){
              focus[a]=info.point[a]+(focus[a]-featureCenter[a])*ratio;
              for(const lens of lenses)if(lens.point.feature===feature)lens.point[a]=info.point[a]+(lens.point[a]-featureCenter[a])*ratio;
            }
            featureCenter={...info.point};featureSize=info.size;
          }
        }
        if (!moving) zoom = targetZoom()*magnification; draw();
      });
    }
    window.addEventListener('resize',resizeDetail);
    document.addEventListener('nire-scene-resize',resizeDetail);
    document.addEventListener("nire-scene-lost", () => { if (active) { draw(); } });
    document.addEventListener('nire-inspection-change',()=>{if(active)updateLenses();});
    return { hitTest, open, close, reset };
  };
}());
