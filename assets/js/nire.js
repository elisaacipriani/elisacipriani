(function () {
  "use strict";

  const canvas = document.getElementById("nire-canvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const cursor = document.getElementById("nire-cursor");
  const status = document.getElementById("nire-status");
  const undo = document.getElementById("nire-undo");
  const redo = document.getElementById("nire-redo");
  const clear = document.getElementById("nire-clear");
  const save = document.getElementById("nire-save");
  const sizeInput = document.getElementById("nire-size");
  const rotation = document.getElementById("nire-rotation");
  const treeRotation = document.getElementById("nire-tree-rotation");
  const start = document.getElementById("nire-start");
  const detailContent = document.getElementById("nire-detail");
  const develop = document.getElementById("nire-develop");
  const backToTree = document.getElementById("nire-back-tree");
  const introContent = document.getElementById("nire-intro-content");
  const sidebar = document.getElementById("nire-sidebar");
  const layer = document.createElement("canvas");
  const paint = layer.getContext("2d");
  const composite = document.createElement("canvas");
  const composition = composite.getContext("2d");
  // Strokes live in the photograph's coordinates, so they stay on the same
  // branches when the screen is resized or the phone is rotated.
  const world = { width: 1600, height: 1600 * 3200 / 2262 };
  const inkBounds = { x: -world.width * 1.5, y: -world.height * 2, width: world.width * 4, height: world.height * 5, scale: .32 };
  layer.width = Math.round(inkBounds.width * inkBounds.scale);
  layer.height = Math.round(inkBounds.height * inkBounds.scale);
  composite.width = layer.width;
  composite.height = layer.height;
  paint.setTransform(inkBounds.scale, 0, 0, inkBounds.scale, -inkBounds.x * inkBounds.scale, -inkBounds.y * inkBounds.scale);
  const state = {
    brush: "paint", color: "#ed75ac", size: 24,
    history: [], head: 0, stroke: null, renderer: null, started: false, entering: false, detail: false,
    pointer: null, keyboard: false,
    keyPosition: { x: 0, y: 0 },
    view: { width: 1, height: 1, scale: 1, x: 0, y: 0, dpr: 1 }
  };
  const stamps = new Map();
  let frame = 0;
  let language = "es";
  let collage = null;
  let colorPicker = null;
  let volume = null;
  let scene = window.createNireScene ? window.createNireScene(composite, world, inkBounds) : null;
  const copy = {
    es: {
      homeLabel: "ELISA CIPRIANI: ir al menú principal", subtitle: "creá tu universo", rotation: "Giro", pauseRotation: "Pausar giro", resumeRotation: "Activar giro",
      tools: "Pinturas y herramientas",
      introduction: "Este proyecto experimental parte de un encuentro con el ñire, árbol nativo del bosque andino patagónico de Argentina. El encuentro y la reconstrucción de la imagen de ese árbol fueron llevados a la digitalidad.",
      brushes: "Pinturas", paint: "Pincel", thread: "Hilo", pigment: "Pigmento",
      colors: "Colores", pink: "Rosa", violet: "Violeta", yellow: "Amarillo",
      coral: "Terracota", green: "Verde", chalk: "Tiza", size: "Grosor", sizeLabel: "Grosor del trazo",
      undo: "Deshacer", redo: "Rehacer", clear: "Clear", clearLabel: "Borrar todo y empezar de cero", save: "Guardar",
      startHint: "Tocá una parte del árbol para explorar sus detalles.", startLabel: "Tocá una parte del árbol para explorar sus detalles",
      develop: "DEVELOP YOUR OWN ÑIRE", backTree: "Volver al árbol", detailLabel: "Detalle del árbol", detailHint: "Arrastrá para recorrer. Acercá para ver más.", zoomIn: "Acercar", zoomOut: "Alejar", locatorLabel: "Ubicar otra parte del árbol", detailKeyboard: "Arrastrá o usá las flechas para recorrer. Acercá con +, la rueda o dos dedos. Escape vuelve al árbol completo.", detailOpened: "Detalle del árbol. Podés recorrerlo o elegir DEVELOP YOUR OWN ÑIRE para dibujar.", pieceStarted: "Lienzo listo. Elegí una pintura o agregá tus textos y fotos para crear tu propia pieza.",
      note: "Un árbol. Infinitos universos.",
      canvas: "Lienzo negro para crear tu universo",
      keyboard: "Con el lienzo enfocado, usá las flechas para moverte y espacio para empezar o terminar un trazo. Deshacé con Control o Comando y Z.",
      drawn: "Trazo agregado.", undone: "Cambio deshecho.", redone: "Cambio recuperado.",
      cleared: "Todo borrado. Podés empezar de cero o deshacer para recuperar tu universo.", saved: "Tu universo está listo para descargar.",
      saving: "Guardando…", saveError: "No se pudo guardar la imagen. Intentá de nuevo.",
      loadError: "No se pudo cargar el árbol. Podés dibujar sobre el lienzo negro.",
      started: "Dibujo con teclado activado. Usá las flechas para dibujar y espacio para terminar."
    },
    en: {
      homeLabel: "ELISA CIPRIANI: main menu", subtitle: "create your universe", rotation: "Rotate", pauseRotation: "Pause rotation", resumeRotation: "Start rotation",
      tools: "Paints and tools",
      introduction: "This experimental project began with an encounter with the ñire, a tree native to Argentina’s Andean Patagonian forest. That encounter and the reconstruction of the tree’s image were brought into the digital world.",
      brushes: "Paints", paint: "Brush", thread: "Thread", pigment: "Pigment",
      colors: "Colors", pink: "Pink", violet: "Violet", yellow: "Yellow",
      coral: "Terracotta", green: "Green", chalk: "Chalk", size: "Size", sizeLabel: "Stroke size",
      undo: "Undo", redo: "Redo", clear: "Clear", clearLabel: "Clear canvas and start again", save: "Save",
      startHint: "Touch a part of the tree to explore its details.", startLabel: "Touch a part of the tree to explore its details",
      develop: "DEVELOP YOUR OWN ÑIRE", backTree: "Back to the tree", detailLabel: "Tree close-up", detailHint: "Drag to explore. Zoom in to see more.", zoomIn: "Zoom in", zoomOut: "Zoom out", locatorLabel: "Locate another part of the tree", detailKeyboard: "Drag or use the arrow keys to explore. Zoom with +, the wheel or two fingers. Escape returns to the whole tree.", detailOpened: "Tree close-up. Explore it or choose DEVELOP YOUR OWN ÑIRE to draw.", pieceStarted: "Canvas ready. Choose a paint or add your words and photos to create your own piece.",
      note: "One tree. Infinite universes.",
      canvas: "Black canvas for creating your universe",
      keyboard: "Focus the canvas, use the arrow keys to move, and press space to start or finish a stroke. Undo with Control or Command and Z.",
      drawn: "Stroke added.", undone: "Change undone.", redone: "Change restored.",
      cleared: "Everything cleared. Start again, or undo to restore your universe.", saved: "Your universe is ready to download.",
      saving: "Saving…", saveError: "The image could not be saved. Please try again.",
      loadError: "The tree could not be loaded. You can draw on the black canvas.",
      started: "Keyboard drawing enabled. Use the arrows to draw and space to finish."
    }
  };
  const t = (key) => copy[language][key] || key;
  const announce = (key) => { status.textContent = t(key); };

  function localize() {
    language = document.documentElement.lang === "en" ? "en" : "es";
    document.querySelectorAll("[data-nire-copy]").forEach((node) => {
      node.textContent = t(node.dataset.nireCopy);
    });
    document.querySelectorAll("[data-nire-label]").forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.nireLabel));
      if (node.tagName === "BUTTON") node.title = t(node.dataset.nireLabel);
    });
    canvas.setAttribute("aria-label", t("canvas"));
    document.querySelectorAll("[data-brush]").forEach((button) => {
      button.title = t(button.dataset.brush);
      button.setAttribute("aria-label", t(button.dataset.brush));
    });
    syncRotation();
    syncTree();
  }
  function syncTree() {
    const showTree = !state.started;
    if (scene) scene.setTreeVisible(showTree);
    syncHold();
  }
  function syncRotation() {
    rotation.hidden = !scene;
    const enabled = scene && scene.enabled();
    rotation.setAttribute("aria-pressed", String(Boolean(enabled)));
    rotation.setAttribute("aria-label", t(enabled ? "pauseRotation" : "resumeRotation"));
    rotation.title = t(enabled ? "pauseRotation" : "resumeRotation");
    treeRotation.hidden=!scene||state.started||state.detail;
    treeRotation.setAttribute("aria-pressed",String(Boolean(enabled)));
    treeRotation.setAttribute("aria-label",t(enabled?"pauseRotation":"resumeRotation"));
    treeRotation.title=t(enabled?"pauseRotation":"resumeRotation");
  }
  rotation.addEventListener("click", () => { if (scene) { scene.setEnabled(!scene.enabled()); syncRotation(); } });
  rotation.addEventListener("click", () => { if (colorPicker) colorPicker.close(false); });
  treeRotation.addEventListener("click",()=>{if(scene){scene.setEnabled(!scene.enabled());syncRotation();}});
  document.addEventListener("nire-motion-change", syncRotation);
  new MutationObserver(localize).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  localize();

  // Replaying a stroke uses the same grain, instead of randomizing the artwork
  // each time someone undoes a stroke.
  function seeded(seed) {
    let value = seed >>> 0;
    return function () {
      value += 0x6D2B79F5;
      let n = value;
      n = Math.imul(n ^ n >>> 15, n | 1);
      n ^= n + Math.imul(n ^ n >>> 7, n | 61);
      return ((n ^ n >>> 14) >>> 0) / 4294967296;
    };
  }
  function rgb(hex) { return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)); }
  function tint(color, amount, alpha) {
    const channels = color.map((value) => Math.max(0, Math.min(255, Math.round(value + amount))));
    return `rgba(${channels.join(",")},${alpha})`;
  }

  function makeStamp(color, variant) {
    const stamp = document.createElement("canvas");
    stamp.width = stamp.height = 128;
    const ctx = stamp.getContext("2d");
    const random = seeded(4307 + variant * 761);
    const channels = rgb(color);
    const shape = new Path2D();
    for (let i = 0; i <= 48; i++) {
      const angle = i / 48 * Math.PI * 2;
      const radius = .84 + random() * .16;
      const x = 64 + Math.cos(angle) * 55 * radius;
      const y = 64 + Math.sin(angle) * 44 * radius;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    ctx.fillStyle = tint(channels, 0, .77);
    ctx.fill(shape);
    ctx.save();
    ctx.clip(shape);
    // Fine gaps, bristle marks, and flecks give the paint a dry material edge.
    for (let i = 0; i < 220; i++) {
      const x = random() * 128;
      const y = random() * 128;
      ctx.fillStyle = tint(channels, (random() - .45) * 80, .12 + random() * .24);
      ctx.fillRect(x, y, .4 + random() * 1.8, 1 + random() * 12);
    }
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 130; i++) {
      ctx.fillStyle = `rgba(0,0,0,${.1 + random() * .6})`;
      ctx.fillRect(random() * 128, random() * 128, .5 + random() * 1.4, 1 + random() * 6);
    }
    ctx.restore();
    return stamp;
  }

  function getStamps(color) {
    if (!stamps.has(color)) {
      if (stamps.size >= 24) stamps.delete(stamps.keys().next().value);
      stamps.set(color, [0, 1, 2].map((variant) => makeStamp(color, variant)));
    }
    return stamps.get(color);
  }
  function rendererFor(stroke) {
    return { random: seeded(stroke.seed), distance: 0, ends: null, angle: 0 };
  }

  function dab(stroke, point, angle, renderer) {
    const random = renderer.random;
    const size = stroke.size * (.55 + point.pressure * .65);
    if (stroke.brush === "pigment") {
      const channels = rgb(stroke.color);
      const count = Math.max(9, Math.round(size * .8));
      for (let i = 0; i < count; i++) {
        const theta = random() * Math.PI * 2;
        const radius = Math.sqrt(random()) * size * .7;
        const x = point.x + Math.cos(theta) * radius;
        const y = point.y + Math.sin(theta) * radius;
        paint.fillStyle = tint(channels, (random() - .5) * 55, .2 + random() * .7);
        paint.beginPath();
        paint.ellipse(x, y, .3 + random() * size * .045, .3 + random() * size * .065, theta, 0, Math.PI * 2);
        paint.fill();
      }
    } else {
      const variants = getStamps(stroke.color);
      const stamp = variants[Math.floor(random() * variants.length)];
      paint.save();
      paint.translate(point.x, point.y);
      paint.rotate(angle + (random() - .5) * .35);
      paint.globalAlpha = .56 + random() * .18;
      const width = size * (1.05 + random() * .18);
      const height = size * (.7 + random() * .15);
      paint.drawImage(stamp, -width / 2, -height / 2, width, height);
      paint.restore();
    }
  }

  function threadSegment(stroke, from, to, renderer) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const angle = distance > .01 ? Math.atan2(to.y - from.y, to.x - from.x) : renderer.angle;
    renderer.angle = angle;
    renderer.distance += distance;
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    const channels = rgb(stroke.color);
    const ends = [];
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * stroke.size * .13 + Math.sin(renderer.distance / 30 + i * 2.1) * stroke.size * .045;
      const end = { x: to.x + nx * offset, y: to.y + ny * offset };
      const start = renderer.ends ? renderer.ends[i] : { x: from.x + nx * offset, y: from.y + ny * offset };
      paint.beginPath();
      paint.moveTo(start.x, start.y);
      paint.lineTo(end.x + (distance < .01 ? .3 : 0), end.y);
      paint.lineWidth = Math.max(.5, stroke.size * .031 * (.6 + to.pressure));
      paint.lineCap = "round";
      paint.lineJoin = "round";
      paint.strokeStyle = tint(channels, i === 1 ? 12 : -15, i === 1 ? .78 : .37);
      paint.stroke();
      ends.push(end);
    }
    renderer.ends = ends;
  }

  function segment(stroke, from, to, renderer, first) {
    if (stroke.brush === "thread") {
      threadSegment(stroke, from, to, renderer);
      return;
    }
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const spacing = Math.max(1, stroke.size * (stroke.brush === "pigment" ? .21 : .1));
    const steps = Math.max(1, Math.ceil(distance / spacing));
    const angle = distance > .1 ? Math.atan2(dy, dx) : 0;
    if (first) { dab(stroke, to, angle, renderer); return; }
    for (let i = 1; i <= steps; i++) {
      const ratio = i / steps;
      dab(stroke, {
        x: from.x + dx * ratio,
        y: from.y + dy * ratio,
        pressure: from.pressure + (to.pressure - from.pressure) * ratio
      }, angle, renderer);
    }
  }

  function renderView() {
    frame = 0;
    const view = state.view;
    composition.clearRect(0, 0, composite.width, composite.height);
    composition.drawImage(layer, 0, 0);
    if (collage) {
      composition.save();
      composition.setTransform(inkBounds.scale, 0, 0, inkBounds.scale, -inkBounds.x * inkBounds.scale, -inkBounds.y * inkBounds.scale);
      collage.draw(composition);
      composition.restore();
      collage.updateSelection();
    }
    context.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    context.clearRect(0, 0, view.width, view.height);
    if (volume) volume.update(composite);
    if (scene) scene.update();
    else context.drawImage(composite, view.x + inkBounds.x * view.scale, view.y + inkBounds.y * view.scale, inkBounds.width * view.scale, inkBounds.height * view.scale);
  }
  function scheduleView() { if (!frame) frame = requestAnimationFrame(renderView); }
  function syncHold() {
    if (scene) scene.hold(Boolean(state.entering || state.detail || state.stroke || state.keyboard || state.pointer !== null || volume && volume.holdsMotion() || collage && collage.holdsMotion() || colorPicker && colorPicker.isOpen()));
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const space = document.getElementById("nire-art-space").getBoundingClientRect();
    const sceneView = scene ? scene.resize() : null;
    const scale = sceneView ? sceneView.scale : Math.min(space.width * .96 / world.width, space.height * 1.17 / world.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cx = sceneView ? sceneView.cx : space.left + space.width / 2;
    const cy = sceneView ? sceneView.cy : space.top + space.height / 2 + world.height * scale * .13;
    state.view = { width, height, scale, dpr, x: cx - world.width * scale / 2, y: cy - world.height * scale / 2 };
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    state.keyPosition.x = Math.min(width, state.keyPosition.x || width * .5);
    state.keyPosition.y = Math.min(height, state.keyPosition.y || height * .5);
    scheduleView();
  }
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener("nire-scene-lost", () => { scene = null; syncRotation(); resize(); });
  resize();

  function hasPaint() {
    for (let i = state.head - 1; i >= 0; i--) {
      if (state.history[i].type === "clear") return false;
      if (state.history[i].type === "stroke" && state.history[i].points.length) return true;
    }
    return false;
  }
  function syncControls() {
    undo.disabled = state.head === 0;
    redo.disabled = state.head === state.history.length;
    const hasObjects = collage && collage.hasContent();
    clear.disabled = !state.started || !hasPaint() && !hasObjects;
    syncTree();
    document.body.classList.toggle("has-painted", Boolean(hasPaint() || hasObjects));
  }
  function replay() {
    paint.save();
    paint.resetTransform();
    paint.clearRect(0, 0, layer.width, layer.height);
    paint.restore();
    if (collage) collage.reset();
    if (volume) volume.reset();
    let first = state.head - 1;
    while (first >= 0 && state.history[first].type !== "clear") first--;
    for (let i = first + 1; i < state.head; i++) {
      const stroke = state.history[i];
      if (collage && collage.apply(stroke)) continue;
      if (volume && volume.apply(stroke)) continue;
      const renderer = rendererFor(stroke);
      segment(stroke, stroke.points[0], stroke.points[0], renderer, true);
      for (let j = 1; j < stroke.points.length; j++) segment(stroke, stroke.points[j - 1], stroke.points[j], renderer, false);
    }
    if (collage) collage.reconcile();
    scheduleView();
    syncControls();
  }

  function pointAt(x, y, pressure) {
    if (scene) return { ...scene.pointAt(x, y), pressure };
    const view = state.view;
    return { x: (x - view.x) / view.scale, y: (y - view.y) / view.scale, pressure };
  }
  function begin(point) {
    const seed = window.crypto.getRandomValues(new Uint32Array(1))[0];
    state.stroke = { type: "stroke", brush: state.brush, color: state.color, size: state.size / state.view.scale, seed, points: [point] };
    state.renderer = rendererFor(state.stroke);
    segment(state.stroke, point, point, state.renderer, true);
    document.body.classList.add("has-painted");
    scheduleView();
  }
  function extend(point) {
    const stroke = state.stroke;
    if (!stroke) return;
    const previous = stroke.points[stroke.points.length - 1];
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < .35) return;
    stroke.points.push(point);
    segment(stroke, previous, point, state.renderer, false);
    scheduleView();
  }
  function finish() {
    if (state.stroke) {
      state.history.splice(state.head);
      state.history.push(state.stroke);
      state.head = state.history.length;
      state.stroke = state.renderer = null;
      announce("drawn");
    }
    state.keyboard = false;
    syncHold();
    syncControls();
  }
  function pointerPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(state.view.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(state.view.height, event.clientY - rect.top));
    const pressure = event.pointerType === "pen" ? Math.max(.12, event.pressure) : .65;
    return pointAt(x, y, pressure);
  }
  function showCursor(x, y) {
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    cursor.classList.add("is-visible");
  }
  canvas.addEventListener("pointerdown", (event) => {
    if (!state.started) return;
    if (colorPicker) colorPicker.close(false);
    if (state.pointer !== null || event.button !== 0 || !event.isPrimary) return;
    if (volume && volume.pointerDown(event)) return;
    if (collage && collage.pointerDown(event)) { cursor.classList.remove("is-visible"); return; }
    event.preventDefault();
    canvas.classList.remove("is-keyboard-active");
    finish();
    canvas.focus({ preventScroll: true });
    state.pointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    if (scene) scene.hold(true);
    begin(pointerPoint(event));
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!state.started) return;
    if (volume && volume.pointerMove(event)) return;
    if (collage && collage.pointerMove(event)) return;
    if (event.pointerType !== "touch") showCursor(event.clientX, event.clientY);
    if (event.pointerId !== state.pointer) return;
    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
    (events.length ? events : [event]).forEach((sample) => extend(pointerPoint(sample)));
  });
  function releasePointer(event) {
    if (!state.started) return;
    if (volume && volume.pointerUp(event)) return;
    if (collage && collage.pointerUp(event)) return;
    if (event.pointerId !== state.pointer) return;
    if (event.type === "pointerup") extend(pointerPoint(event));
    state.pointer = null;
    finish();
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (event.pointerType === "touch") cursor.classList.remove("is-visible");
  }
  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("lostpointercapture", releasePointer);
  canvas.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));
  canvas.addEventListener("blur", () => {
    if (state.keyboard) finish();
    cursor.classList.remove("is-visible");
  });

  function undoStroke() {
    if (!state.started) return;
    if (volume) volume.close(false);
    if (collage) collage.flush();
    finish();
    if (state.head === 0) return;
    state.head--;
    replay();
    announce("undone");
  }
  function redoStroke() {
    if (!state.started) return;
    if (volume) volume.close(false);
    if (collage) collage.flush();
    finish();
    if (state.head === state.history.length) return;
    state.head++;
    replay();
    announce("redone");
  }
  undo.addEventListener("click", undoStroke);
  redo.addEventListener("click", redoStroke);
  clear.addEventListener("click", () => {
    if (!state.started) return;
    if (volume) volume.close(false);
    if (colorPicker) colorPicker.close(false);
    finish();
    if (!hasPaint() && !(collage && collage.hasContent())) return;
    if (collage) collage.clearInteraction();
    state.history.splice(state.head);
    state.history.push({ type: "clear" });
    state.head = state.history.length;
    replay();
    announce("cleared");
  });
  const entrance = window.createNireEntrance ? window.createNireEntrance({
    world, container: document.querySelector(".nire-studio"),
    view: () => state.view, scene: () => scene,
    pointAt: (x, y) => pointAt(x, y, .65)
  }) : null;
  start.addEventListener("pointermove", (event) => {
    if (state.entering || state.started || state.detail) return;
    const rect = canvas.getBoundingClientRect();
    const hit = !entrance || entrance.hitTest(event.clientX - rect.left, event.clientY - rect.top, 20);
    start.style.cursor = hit ? "zoom-in" : "default";
  });
  start.addEventListener("click", async (event) => {
    if (state.started || state.entering || state.detail) return;
    if(!scene){develop.click();return;}
    if(!scene.modelVisible())return;
    const rect = canvas.getBoundingClientRect();
    const origin = event.detail === 0
      ? { x: rect.width / 2, y: rect.height / 2 }
      : { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const tolerance = window.matchMedia("(pointer: coarse)").matches ? 32 : 20;
    if (event.detail !== 0 && entrance && !entrance.hitTest(origin.x, origin.y, tolerance)) return;
    state.entering = state.detail = true;
    syncRotation();
    start.hidden = true;
    introContent.hidden = true;
    detailContent.hidden = false;
    detailContent.classList.add("is-zooming");
    develop.disabled = backToTree.disabled = true;
    document.body.classList.add("nire-detail-open");
    syncHold();
    try { if (entrance) await entrance.open(origin); } catch (_) { /* The drawing action remains available if graphics fail. */ }
    state.entering = false;
    detailContent.classList.remove("is-zooming");
    develop.disabled = backToTree.disabled = false;
    document.getElementById("nire-detail-pan").focus({ preventScroll: true });
    announce("detailOpened");
  });
  async function returnToTree() {
    if (!state.detail || state.entering) return;
    state.entering = true;
    develop.disabled = backToTree.disabled = true;
    detailContent.classList.add("is-zooming");
    try { if (entrance) await entrance.close(); } catch (_) { if (entrance) entrance.reset(); }
    state.detail = state.entering = false;
    syncRotation();
    detailContent.hidden = true;
    detailContent.classList.remove("is-zooming");
    introContent.hidden = false;
    start.hidden = false;
    document.body.classList.remove("nire-detail-open");
    syncHold();
    start.focus({ preventScroll: true });
  }
  backToTree.addEventListener("click", returnToTree);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && state.detail) { event.preventDefault(); returnToTree(); }
  });
  develop.addEventListener("click", () => {
    if (state.started || state.entering) return;
    state.started = true;
    syncRotation();
    state.detail = false;
    if (entrance) entrance.reset();
    if (colorPicker) colorPicker.close(false);
    state.history = [];
    state.head = 0;
    if (collage) collage.clearInteraction();
    document.body.classList.remove("nire-intro", "nire-detail-open");
    introContent.hidden = detailContent.hidden = true;
    start.hidden = true;
    sidebar.hidden = false;
    canvas.removeAttribute("inert");
    canvas.removeAttribute("aria-hidden");
    canvas.tabIndex = 0;
    resize();
    replay();
    if (frame) cancelAnimationFrame(frame);
    renderView();
    if (scene) scene.flush();
    updateSave();
    canvas.focus({ preventScroll: true });
    announce("pieceStarted");
  });

  canvas.addEventListener("keydown", (event) => {
    if (!state.started) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (volume && volume.keyDown(event)) return;
    if (collage && collage.keyDown(event)) return;
    if (event.key === " " || event.key.startsWith("Arrow")) canvas.classList.add("is-keyboard-active");
    if (event.key === " ") {
      event.preventDefault();
      if (event.repeat || state.pointer !== null) return;
      if (state.keyboard) finish();
      else {
        if (scene) scene.hold(true);
        begin(pointAt(state.keyPosition.x, state.keyPosition.y, .65));
        state.keyboard = true;
        announce("started");
      }
      showCursor(state.keyPosition.x, state.keyPosition.y);
    } else if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      const distance = event.shiftKey ? 20 : 5;
      const position = state.keyPosition;
      if (event.key === "ArrowLeft") position.x -= distance;
      if (event.key === "ArrowRight") position.x += distance;
      if (event.key === "ArrowUp") position.y -= distance;
      if (event.key === "ArrowDown") position.y += distance;
      position.x = Math.max(0, Math.min(state.view.width, position.x));
      position.y = Math.max(0, Math.min(state.view.height, position.y));
      if (state.keyboard) extend(pointAt(position.x, position.y, .65));
      showCursor(position.x, position.y);
    } else if (event.key === "Escape") {
      finish();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (!state.started) return;
    if (event.target.matches("input, textarea, select, [contenteditable=true]")) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redoStroke(); else undoStroke();
    }
  });

  function updateSize() {
    state.size = Number(sizeInput.value);
    const preview = document.getElementById("nire-size-preview");
    preview.style.width = preview.style.height = `${3 + state.size / 6}px`;
    cursor.style.width = cursor.style.height = `${state.size}px`;
  }
  sizeInput.addEventListener("input", updateSize);
  updateSize();
  document.querySelectorAll("[data-brush]").forEach((button) => {
    button.addEventListener("click", () => {
      if (colorPicker) colorPicker.close(false);
      finish();
      if (volume) volume.close(false);
      if (collage) collage.activateDraw();
      state.brush = button.dataset.brush;
      document.querySelectorAll("[data-brush]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      announce(state.brush);
    });
  });
  function applyColor(color, commit) {
    finish();
    state.color = color;
    document.documentElement.style.setProperty("--paint", color);
    const [r, g, b] = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
    document.documentElement.style.setProperty("--ui-accent", r * .2126 + g * .7152 + b * .0722 >= 90 ? color : "#c7c4bd");
    cursor.style.borderColor = color;
    if (collage) collage.useColor(color, commit);
  }

  function updateSave(){save.disabled=!state.started;}
  updateSave();

  save.addEventListener("click", async () => {
    if (!state.started) return;
    if (colorPicker) colorPicker.close(false);
    if (collage) collage.flush();
    finish();
    if (scene) scene.hold(true);
    save.disabled = true;
    const label = save.querySelector("span");
    label.textContent = t("saving");
    try {
      if (frame) cancelAnimationFrame(frame);
      renderView();
      if (volume) volume.flush();
      const output = document.createElement("canvas");
      const view = state.view;
      const ratio = 2;
      output.width = Math.round(view.width * ratio);
      output.height = Math.round(view.height * ratio);
      const ctx = output.getContext("2d");
      ctx.scale(ratio, ratio);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, view.width, view.height);
      if (scene) scene.copyTo(ctx);
      else {
        ctx.drawImage(composite, view.x + inkBounds.x * view.scale, view.y + inkBounds.y * view.scale, inkBounds.width * view.scale, inkBounds.height * view.scale);
      }
      const blob = await new Promise((resolve) => output.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image export failed");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "nire-mi-universo.png";
      link.target = "_blank";
      link.rel = "noopener";
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      announce("saved");
    } catch (error) {
      announce("saveError");
    } finally {
      syncHold();
      label.textContent = t("save");
      updateSave();
    }
  });
  if (window.createNireCollage) collage = window.createNireCollage({
    canvas, view: () => state.view, color: () => state.color, brush: () => state.brush, canEdit: () => state.started,
    pointAt: (x, y) => { const point = pointAt(x, y, .65); return { x: point.x, y: point.y }; },
    projectPoint: (point) => scene ? scene.projectPoint(point) : { x: state.view.x + point.x * state.view.scale, y: state.view.y + point.y * state.view.scale },
    finish, hold: syncHold, render: scheduleView,
    notify: (message) => { status.textContent = message; },
    commit: (operation) => {
      state.history.splice(state.head);
      state.history.push(operation);
      state.head = state.history.length;
      syncControls();
    }
  });
  if (window.createNireVolume) volume = window.createNireVolume({
    canvas,world,inkBounds,view:()=>state.view,canEdit:()=>state.started,
    supported:()=>Boolean(scene&&scene.hasSculpture()),
    point:(x,y)=>pointAt(x,y,.65),
    project:p=>scene?scene.projectPoint(p):{x:state.view.x+p.x*state.view.scale,y:state.view.y+p.y*state.view.scale},
    set:model=>{if(scene)scene.setSculpture(model);},
    prepare:()=>{cursor.classList.remove("is-visible");if(collage)collage.clearInteraction();if(colorPicker)colorPicker.close(false);},
    finish,hold:syncHold,render:scheduleView,notify:message=>{status.textContent=message;},
    commit:operation=>{state.history.splice(state.head);state.history.push(operation);state.head=state.history.length;replay();}
  });
  if (window.createNireColorPicker) colorPicker = window.createNireColorPicker({
    initial: state.color, canEdit: () => state.started, change: applyColor, hold: syncHold,
    commit: () => { if (collage) collage.flush(); }
  });
  syncControls();
}());
