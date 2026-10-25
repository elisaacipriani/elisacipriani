(function () {
  "use strict";

  // All positions use the source photograph's coordinates, including the locator.
  // Only the visible original-resolution tiles are decoded for each close-up.
  window.createNireEntrance = function (host) {
    const image = host.image;
    const surface = document.getElementById("nire-detail-pan");
    const locator = document.getElementById("nire-locator");
    const zoomIn = document.getElementById("nire-zoom-in");
    const zoomOut = document.getElementById("nire-zoom-out");
    const pointers = new Map();
    let pinch = null, magnification = 1;
    const marker = document.getElementById("nire-locator-window");
    const fallback = document.createElement("canvas");
    fallback.className = "nire-closeup";
    fallback.setAttribute("aria-hidden", "true");
    fallback.hidden = true;
    host.container.prepend(fallback);
    const ctx = fallback.getContext("2d");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const original = { width: 7020, height: 9928, tileWidth: 1755, tileHeight: 1986 };
    const tiles = new Map();
    let mask = null, active = false, moving = false, focus = null;
    let zoom = 1, progress = 0, raf = 0, generation = 0, refresh = 0, drag = null;
    let detail = null, detailBounds = null, animationEnd = null;

    function prepareMask() {
      if (mask || !image.naturalWidth) return;
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(768, image.naturalWidth);
      canvas.height = Math.round(canvas.width * image.naturalHeight / image.naturalWidth);
      const c = canvas.getContext("2d", { willReadFrequently: true });
      c.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = c.getImageData(0, 0, canvas.width, canvas.height).data;
      const ink = new Uint8Array(canvas.width * canvas.height);
      for (let i = 0; i < ink.length; i++) ink[i] = Math.max(pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]) > 10 ? 1 : 0;
      mask = { width: canvas.width, height: canvas.height, ink };
    }
    function hitTest(x, y, tolerance) {
      if (!image.naturalWidth) return image.complete;
      prepareMask();
      if (!mask) return true;
      const point = host.pointAt(x, y);
      const px = Math.round(point.x / host.world.width * mask.width);
      const py = Math.round(point.y / host.world.height * mask.height);
      const radius = Math.max(2, Math.ceil((tolerance || 20) * mask.width / (host.view().scale * host.world.width)));
      for (let dy = -radius; dy <= radius; dy++) {
        const row = py + dy;
        if (row < 0 || row >= mask.height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const column = px + dx;
          if (column < 0 || column >= mask.width || dx * dx + dy * dy > radius * radius) continue;
          if (mask.ink[row * mask.width + column]) return true;
        }
      }
      return false;
    }
    function baseView() { return host.scene() ? host.scene().baseView() : host.view(); }
    function targetZoom() {
      const v = baseView();
      return Math.max(6.2, v.width * 2.6 / (v.scale * host.world.width), v.height * 3 / (v.scale * host.world.height));
    }
    function flatView() {
      const v = host.view();
      const anchor = { x: v.x + focus.x * v.scale, y: v.y + focus.y * v.scale };
      const center = { x: anchor.x + (v.width / 2 - anchor.x) * progress, y: anchor.y + (v.height / 2 - anchor.y) * progress };
      return { ...v, scale: v.scale * zoom, x: (v.x - anchor.x) * zoom + center.x, y: (v.y - anchor.y) * zoom + center.y };
    }
    function pointAt(x, y) {
      if (host.scene()) return host.scene().pointAt(x, y);
      const v = flatView();
      return { x: (x - v.x) / v.scale, y: (y - v.y) / v.scale };
    }
    function viewportBounds() {
      const v = baseView();
      const corners = [[0, 0], [v.width, 0], [0, v.height], [v.width, v.height]].map(([x, y]) => pointAt(x, y));
      return {
        left: Math.min(...corners.map(p => p.x)) / host.world.width,
        top: Math.min(...corners.map(p => p.y)) / host.world.height,
        right: Math.max(...corners.map(p => p.x)) / host.world.width,
        bottom: Math.max(...corners.map(p => p.y)) / host.world.height
      };
    }
    function updateLocator() {
      const b = viewportBounds();
      const left = Math.max(0, b.left), top = Math.max(0, b.top);
      Object.assign(marker.style, {
        left: `${left * 100}%`, top: `${top * 100}%`,
        width: `${Math.max(0, Math.min(1, b.right) - left) * 100}%`,
        height: `${Math.max(0, Math.min(1, b.bottom) - top) * 100}%`
      });
      locator.dataset.focusX = (focus.x / host.world.width).toFixed(5);
      locator.dataset.focusY = (focus.y / host.world.height).toFixed(5);
    }
    function draw() {
      if (!active || !focus) return;
      const scene = host.scene();
      fallback.hidden = Boolean(scene);
      if (scene) scene.setFocus(focus, zoom, progress);
      else {
        const v = flatView(), dpr = Math.min(devicePixelRatio || 1, 2);
        if (fallback.width !== Math.round(v.width * dpr) || fallback.height !== Math.round(v.height * dpr)) {
          fallback.width = Math.round(v.width * dpr); fallback.height = Math.round(v.height * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, v.width, v.height);
        const width = host.world.width * v.scale, height = host.world.height * v.scale;
        if (image.naturalWidth) ctx.drawImage(image, v.x, v.y, width, height);
        if (detail) ctx.drawImage(detail, v.x + detailBounds.x * width, v.y + detailBounds.y * height, detailBounds.width * width, detailBounds.height * height);
      }
      zoomIn.disabled = zoom >= targetZoom()*5-.01;
      zoomOut.disabled = zoom <= targetZoom()*.65+.01;
      surface.dataset.zoom = (zoom/targetZoom()).toFixed(3);
      updateLocator();
    }
    function tile(column, row) {
      const key = `${column}-${row}`;
      if (!tiles.has(key)) {
        const picture = new Image();
        picture.decoding = "async";
        const loaded = new Promise(resolve => { picture.onload = () => resolve(picture); picture.onerror = () => resolve(null); });
        picture.src = `assets/images/nire/details/${key}.jpg`;
        tiles.set(key, loaded);
      }
      const loaded = tiles.get(key);
      // Keep a small working set when the visitor explores many different parts.
      tiles.delete(key); tiles.set(key, loaded);
      while (tiles.size > 6) tiles.delete(tiles.keys().next().value);
      return loaded;
    }
    async function loadDetail() {
      if (!active || !focus) return;
      const token = ++generation;
      const b = viewportBounds();
      const pad = .025;
      const left = Math.max(0, Math.floor((b.left - pad) * original.width));
      const top = Math.max(0, Math.floor((b.top - pad) * original.height));
      const right = Math.min(original.width, Math.ceil((b.right + pad) * original.width));
      const bottom = Math.min(original.height, Math.ceil((b.bottom + pad) * original.height));
      if (right <= left || bottom <= top) return;
      const requests = [];
      for (let row = Math.floor(top / original.tileHeight); row <= Math.floor((bottom - 1) / original.tileHeight); row++) {
        for (let col = Math.floor(left / original.tileWidth); col <= Math.floor((right - 1) / original.tileWidth); col++) {
          requests.push(tile(col, row).then(picture => ({ picture, col, row })));
        }
      }
      const loaded = await Promise.all(requests);
      if (!active || token !== generation) return;
      const crop = document.createElement("canvas");
      const limit = Math.min(4096, host.scene() ? host.scene().maxTextureSize() : 4096);
      const ratio = Math.min(1, limit / (right - left), limit / (bottom - top));
      crop.width = Math.max(1, Math.round((right - left) * ratio));
      crop.height = Math.max(1, Math.round((bottom - top) * ratio));
      const c = crop.getContext("2d");
      c.scale(crop.width / (right - left), crop.height / (bottom - top));
      // The regular photograph is also a fallback for a tile that fails to load.
      if (image.naturalWidth) c.drawImage(image, -left, -top, original.width, original.height);
      loaded.forEach(({ picture, col, row }) => {
        if (picture) c.drawImage(picture, col * original.tileWidth - left, row * original.tileHeight - top);
      });
      detail = crop;
      detailBounds = { x: left / original.width, y: top / original.height, width: (right - left) / original.width, height: (bottom - top) / original.height };
      if (host.scene()) host.scene().setDetail(crop, detailBounds);
      surface.dataset.resolution = `${crop.width}×${crop.height}`;
      draw();
    }
    function queueDetail() { clearTimeout(refresh); refresh = setTimeout(loadDetail, 100); }
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
      focus = host.pointAt(origin.x, origin.y);
      active = true;
      magnification = 1;
      zoom = targetZoom(); progress = 1;
      // Determine the exact final viewport before requesting the source tiles.
      draw();
      loadDetail();
      zoom = 1; progress = 0; draw();
      await animate(1, targetZoom(), 0, 1);
      queueDetail();
    }
    async function close() {
      clearTimeout(refresh); generation++;
      await animate(zoom, 1, progress, 0);
      reset();
    }
    function reset() {
      active = moving = false; drag = pinch = null; pointers.clear(); generation++;
      clearTimeout(refresh); cancelAnimationFrame(raf); raf = 0;
      if (animationEnd) animationEnd();
      animationEnd = null;
      if (host.scene()) { host.scene().setFocus(null); host.scene().setDetail(null); }
      tiles.clear();
      detail = detailBounds = null;
      fallback.hidden = true;
      delete surface.dataset.resolution;
    }
    function center(point) {
      if (!active || moving) return;
      focus = { x: Math.max(0, Math.min(host.world.width, point.x)), y: Math.max(0, Math.min(host.world.height, point.y)) };
      draw(); queueDetail();
    }
    function zoomAt(factor, x, y) {
      if (!active || moving) return;
      const before = pointAt(x, y);
      zoom = Math.max(targetZoom()*.65, Math.min(targetZoom()*5, zoom*factor));
      magnification = zoom/targetZoom();
      draw();
      const after = pointAt(x, y);
      center({ x: focus.x+before.x-after.x, y: focus.y+before.y-after.y });
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
          center({x:focus.x+previous.x-current.x,y:focus.y+previous.y-current.y});
        }
        pinch=next; return;
      }
      if (!drag || drag.id !== event.pointerId) return;
      const previous = pointAt(drag.x, drag.y), next = pointAt(event.clientX, event.clientY);
      center({ x: focus.x + previous.x - next.x, y: focus.y + previous.y - next.y });
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
      center({ x: focus.x + next.x - middle.x, y: focus.y + next.y - middle.y });
    });
    locator.addEventListener("click", event => {
      const rect = locator.getBoundingClientRect();
      if (event.detail === 0) center({ x: host.world.width / 2, y: host.world.height * .4 });
      else center({ x: (event.clientX - rect.left) / rect.width * host.world.width, y: (event.clientY - rect.top) / rect.height * host.world.height });
    });
    window.addEventListener("resize", () => {
      if (!active) return;
      requestAnimationFrame(() => { if (!active) return; if (!moving) zoom = targetZoom()*magnification; draw(); queueDetail(); });
    });
    document.addEventListener("nire-inspection-change", () => { if(active) { updateLocator(); queueDetail(); } });
    document.addEventListener("nire-scene-lost", () => { if (active) { draw(); queueDetail(); } });
    return { hitTest, open, close, reset };
  };
}());
