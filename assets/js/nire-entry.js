(function () {
  "use strict";

  // Explore the actual spatial model; no flat drawing or photograph is shown.
  window.createNireEntrance = function (host) {
    const surface = document.getElementById("nire-detail-pan");
    const zoomIn = document.getElementById("nire-zoom-in");
    const zoomOut = document.getElementById("nire-zoom-out");
    const pointers = new Map();
    let pinch = null, magnification = 1;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let active = false, moving = false, focus = null;
    let zoom = 1, progress = 0, raf = 0, drag = null;
    let animationEnd = null;

    function hitTest(x,y,tolerance){
      const scene=host.scene();
      return Boolean(scene&&scene.modelVisible()&&scene.pickPoint(x,y,tolerance));
    }
    function baseView() { return host.scene() ? host.scene().baseView() : host.view(); }
    function targetZoom() {
      const v = baseView();
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
      active = moving = false; drag = pinch = null; pointers.clear();
      cancelAnimationFrame(raf); raf = 0;
      if (animationEnd) animationEnd();
      animationEnd = null;
      if(host.scene())host.scene().setFocus(null);
    }
    function center(point) {
      if (!active || moving) return;
      focus = { x: Math.max(0, Math.min(host.world.width, point.x)), y: Math.max(0, Math.min(host.world.height, point.y)) };
      if(Number.isFinite(point.z))focus.z=point.z;
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
      event.preventDefault();
      if (host.scene()) host.scene().inspect(null);
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      surface.setPointerCapture(event.pointerId);
      if (pointers.size===1) drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      else { drag = null; pinch = pinchState(); }
      surface.classList.add("is-dragging");
    });
    surface.addEventListener("pointermove", event => {
      if (!active || moving) return;
      if (!pointers.has(event.pointerId)) {
        if (event.pointerType!=="touch" && host.scene()) host.scene().inspect(event.clientX/baseView().width*2-1,event.clientY/baseView().height*2-1);
        return;
      }
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
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
      pointers.delete(event.pointerId);
      pinch=null;
      if(pointers.size===1) {
        const [id,p]=pointers.entries().next().value;
        drag={id,x:p.x,y:p.y};
      } else { drag=null; surface.classList.remove("is-dragging"); }
    }
    surface.addEventListener("pointerup", release);
    surface.addEventListener("pointercancel", release);
    surface.addEventListener("lostpointercapture", release);
    surface.addEventListener("keydown", event => {
      if (!active || moving) return;
      if (["+","=","-","_"].includes(event.key)) {
        event.preventDefault(); zoomCentered(["+","="].includes(event.key)?1.3:1/1.3);return;
      }
      if (!event.key.startsWith("Arrow")) return;
      event.preventDefault();
      const middle = pointAt(baseView().width / 2, baseView().height / 2);
      const next = pointAt(baseView().width / 2 + ({ ArrowLeft: -80, ArrowRight: 80 }[event.key] || 0), baseView().height / 2 + ({ ArrowUp: -80, ArrowDown: 80 }[event.key] || 0));
      shiftFocus(next,middle);
    });
    window.addEventListener("resize", () => {
      if (!active) return;
      requestAnimationFrame(() => { if (!active) return; if (!moving) zoom = targetZoom()*magnification; draw(); });
    });
    document.addEventListener("nire-scene-lost", () => { if (active) { draw(); } });
    return { hitTest, open, close, reset };
  };
}());
