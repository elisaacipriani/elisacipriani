(function () {
  "use strict";

  window.createNireCollage = function (host) {
    const $ = (id) => document.getElementById(id);
    const canvas = host.canvas;
    const panels = { text: $("nire-text-panel"), image: $("nire-photo-panel") };
    const textTool = $("nire-text-tool"), photoTool = $("nire-photo-tool"), moveTool = $("nire-move-tool");
    const content = $("nire-text-content"), font = $("nire-text-font"), color = $("nire-text-color");
    const settings = $("nire-object-settings"), selection = $("nire-selection");
    const resizeHandle = $("nire-resize-object"), rotateHandle = $("nire-rotate-object");
    const size = $("nire-object-size"), angle = $("nire-object-angle"), opacity = $("nire-object-opacity");
    const fileInput = $("nire-photo-input"), gallery = $("nire-photo-gallery"), photoMessage = $("nire-photo-message");
    const fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    const fontWeights = { light: 300, regular: 400, bold: 700 };
    const fontFor = (key, size) => `${fontWeights[key] || fontWeights.light} ${size}px ${fontFamily}`;
    const assets = new Map();
    const measure = document.createElement("canvas").getContext("2d");
    let objects = [], selectedId = null, panel = null, mode = "draw", gesture = null, pending = null;
    let nextId = 0, uploadGeneration = 0, importOffset = 0, photoStatus = "";
    let language = document.documentElement.lang === "en" ? "en" : "es";
    const copy = {
      es: {
        text: "Texto", photos: "Fotos", move: "Mover", textMenu: "Menú de texto", photoMenu: "Menú de fotos", moveTool: "Seleccionar y mover elementos",
        close: "Cerrar menú", yourWords: "Tus palabras", textPlaceholder: "Escribí lo que quieras…", font: "Tipografía", color: "Color",
        addText: "Agregar texto", updateText: "Aplicar cambios", newText: "Crear otro texto", choosePhotos: "Elegir fotos", yourPhotos: "Tus fotos",
        dropHint: "También podés arrastrarlas al lienzo.", moveHint: "Arrastrá el elemento para moverlo. Usá los controles para cambiar el tamaño o girarlo.",
        size: "Tamaño", angle: "Giro", opacity: "Opacidad", deleteObject: "Quitar elemento", resizeHandle: "Cambiar tamaño del elemento", rotateHandle: "Girar elemento",
        textAdded: "Texto agregado. Podés arrastrarlo para moverlo.", photoAdded: "Foto agregada. Podés arrastrarla para moverla.", updated: "Elemento actualizado.", removed: "Elemento quitado.",
        selected: "Elemento seleccionado. Arrastralo o usá las flechas para moverlo.", importing: "Abriendo fotos…", photoError: "No pudimos abrir esa foto. Probá con JPG, PNG o WebP.",
        galleryHint: "Tocá una foto para agregar otra copia.", moving: "Modo mover. Elegí un texto o una foto en el lienzo.", dropHere: "Soltá tus fotos para agregarlas."
      },
      en: {
        text: "Text", photos: "Photos", move: "Move", textMenu: "Text menu", photoMenu: "Photo menu", moveTool: "Select and move elements",
        close: "Close menu", yourWords: "Your words", textPlaceholder: "Write anything you like…", font: "Typeface", color: "Color",
        addText: "Add text", updateText: "Apply changes", newText: "Create another text", choosePhotos: "Choose photos", yourPhotos: "Your photos",
        dropHint: "You can also drop them onto the canvas.", moveHint: "Drag the element to move it. Use the handles to resize or rotate it.",
        size: "Size", angle: "Rotation", opacity: "Opacity", deleteObject: "Remove element", resizeHandle: "Resize element", rotateHandle: "Rotate element",
        textAdded: "Text added. Drag it to move it.", photoAdded: "Photo added. Drag it to move it.", updated: "Element updated.", removed: "Element removed.",
        selected: "Element selected. Drag it or use the arrow keys to move it.", importing: "Opening photos…", photoError: "We could not open that photo. Try JPG, PNG or WebP.",
        galleryHint: "Choose a photo to add another copy.", moving: "Move mode. Choose a text or photo on the canvas.", dropHere: "Drop your photos to add them."
      }
    };
    const t = (key) => copy[language][key] || key;
    const notify = (key) => host.notify(t(key));
    const selected = () => objects.find((object) => object.id === selectedId) || null;
    const clone = (object) => ({ ...object });
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    const degrees = (radians) => radians * 180 / Math.PI;
    const radians = (value) => value * Math.PI / 180;
    const normalizeAngle = (value) => ((value + 180) % 360 + 360) % 360 - 180;
    function setPhotoMessage(key) { photoStatus = key; photoMessage.textContent = t(key); }

    function localize() {
      language = document.documentElement.lang === "en" ? "en" : "es";
      document.querySelectorAll("[data-collage-copy]").forEach((node) => { node.textContent = t(node.dataset.collageCopy); });
      document.querySelectorAll("[data-collage-label]").forEach((node) => {
        node.setAttribute("aria-label", t(node.dataset.collageLabel));
        if (node.tagName === "BUTTON") node.title = t(node.dataset.collageLabel);
      });
      document.querySelectorAll("[data-collage-placeholder]").forEach((node) => { node.placeholder = t(node.dataset.collagePlaceholder); });
      $("nire-add-text").textContent = t(selected()?.kind === "text" ? "updateText" : "addText");
      if (photoStatus) photoMessage.textContent = t(photoStatus);
      syncSettings();
    }
    new MutationObserver(localize).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

    function syncMode() {
      const selecting = mode === "select";
      moveTool.setAttribute("aria-pressed", String(selecting));
      document.body.classList.toggle("nire-select-mode", selecting);
      canvas.style.cursor = selecting ? "default" : "";
      document.querySelectorAll("[data-brush]").forEach((button) => button.setAttribute("aria-pressed", String(!selecting && button.dataset.brush === host.brush())));
      host.hold();
    }
    function closePanel(returnFocus) {
      panel = null;
      panels.text.hidden = panels.image.hidden = true;
      textTool.setAttribute("aria-expanded", "false");
      photoTool.setAttribute("aria-expanded", "false");
      host.hold();
      if (returnFocus) canvas.focus({ preventScroll: true });
    }
    function openPanel(kind, focus) {
      if (!host.canEdit()) return;
      host.finish();
      flushPending();
      document.dispatchEvent(new CustomEvent("nire-panel-open", { detail: kind }));
      panel = kind;
      mode = "select";
      panels.text.hidden = kind !== "text";
      panels.image.hidden = kind !== "image";
      textTool.setAttribute("aria-expanded", String(kind === "text"));
      photoTool.setAttribute("aria-expanded", String(kind === "image"));
      const object = selected();
      if (object && object.kind !== kind) selectedId = null;
      syncMode();
      syncSettings();
      if (focus && kind === "text") content.focus({ preventScroll: true });
    }
    function selectObject(id, open) {
      flushPending();
      selectedId = id;
      const object = selected();
      mode = "select";
      syncMode();
      if (object?.kind === "text") {
        content.value = object.text;
        font.value = object.font;
        color.value = object.color;
      }
      if (open && object) openPanel(object.kind, false);
      syncSettings();
      updateSelection();
      if (object) notify("selected");
    }
    function commitUpdate(object, before) {
      if (!object || JSON.stringify(object) === JSON.stringify(before)) return;
      host.commit({ type: "collage-update", id: object.id, value: clone(object) });
    }
    function flushPending() {
      if (!pending) return;
      const object = objects.find((item) => item.id === pending.id);
      commitUpdate(object, pending.before);
      pending = null;
    }
    function syncSettings() {
      const object = selected();
      settings.hidden = !object;
      $("nire-new-text").hidden = object?.kind !== "text";
      $("nire-add-text").textContent = t(object?.kind === "text" ? "updateText" : "addText");
      if (!object) { updateSelection(); return; }
      panels[object.kind].querySelector(".nire-settings-slot").appendChild(settings);
      const width = Math.round(object.width * host.view().scale);
      size.max = Math.max(1200, width);
      size.value = clamp(width, 20, Number(size.max));
      angle.value = Math.round(normalizeAngle(object.rotation));
      opacity.value = Math.round(object.opacity * 100);
      $("nire-object-size-value").textContent = `${width} px`;
      $("nire-object-angle-value").textContent = `${Math.round(object.rotation)}°`;
      $("nire-object-opacity-value").textContent = `${Math.round(object.opacity * 100)}%`;
      updateSelection();
    }

    function center(offset) {
      const rect = document.getElementById("nire-art-space").getBoundingClientRect();
      const shift = offset || 0;
      return host.pointAt(rect.left + rect.width / 2 + shift, rect.top + rect.height / 2 + shift);
    }
    function addObject(object) {
      objects.push(object);
      host.commit({ type: "collage-add", value: clone(object) });
      selectObject(object.id, true);
      host.render();
      canvas.focus({ preventScroll: true });
    }
    function textMetrics(text, fontKey, fontSize, maxWidth) {
      measure.font = fontFor(fontKey, fontSize);
      const lines = [];
      for (const paragraph of text.split("\n")) {
        let line = "";
        for (const character of Array.from(paragraph)) {
          if (line && measure.measureText(line + character).width > maxWidth - fontSize * .2) {
            const space = line.lastIndexOf(" ");
            if (space > 0) { lines.push(line.slice(0, space)); line = line.slice(space + 1) + character; }
            else { lines.push(line); line = character; }
          } else line += character;
        }
        lines.push(line.trimEnd());
      }
      return { width: Math.max(fontSize * .5, ...lines.map((line) => measure.measureText(line).width)) + fontSize * .2, height: lines.length * fontSize * 1.2, lines };
    }
    $("nire-text-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const text = content.value.trim();
      if (!text) { content.focus(); return; }
      flushPending();
      const existing = selected()?.kind === "text" ? selected() : null;
      const view = host.view();
      const fontKey = fontWeights[font.value] ? font.value : "light";
      let fontSize = existing ? existing.fontSize : Math.min(52, view.width * .1) / view.scale;
      const maxWidth = Math.min(620, view.width * .63) / view.scale;
      let metrics = textMetrics(text, fontKey, fontSize, maxWidth);
      const fit = Math.min(1, view.width * .63 / (metrics.width * view.scale), view.height * .5 / (metrics.height * view.scale));
      fontSize *= fit;
      metrics = textMetrics(text, fontKey, fontSize, maxWidth);
      const values = { text, font: fontKey, color: color.value, fontSize, ...metrics };
      if (existing) {
        const before = clone(existing);
        Object.assign(existing, values);
        commitUpdate(existing, before);
        syncSettings();
        host.render();
        notify("updated");
      } else {
        addObject({ id: `element-${++nextId}`, kind: "text", ...center(), rotation: 0, opacity: 1, ...values });
        notify("textAdded");
      }
    });
    $("nire-new-text").addEventListener("click", () => {
      selectObject(null, false);
      content.value = "";
      content.focus({ preventScroll: true });
    });

    async function assetFromFile(file) {
      const url = URL.createObjectURL(file);
      const image = new Image();
      try {
        image.src = url;
        await image.decode();
        const factor = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
        const normalized = document.createElement("canvas");
        normalized.width = Math.max(1, Math.round(image.naturalWidth * factor));
        normalized.height = Math.max(1, Math.round(image.naturalHeight * factor));
        normalized.getContext("2d").drawImage(image, 0, 0, normalized.width, normalized.height);
        const preview = document.createElement("canvas");
        const previewScale = 160 / Math.max(normalized.width, normalized.height);
        preview.width = Math.max(1, Math.round(normalized.width * previewScale));
        preview.height = Math.max(1, Math.round(normalized.height * previewScale));
        preview.getContext("2d").drawImage(normalized, 0, 0, preview.width, preview.height);
        const thumbnail = preview.toDataURL("image/png");
        return { id: `photo-${++nextId}`, image: normalized, width: normalized.width, height: normalized.height, thumbnail, name: file.name };
      } finally {
        image.src = "";
        URL.revokeObjectURL(url);
      }
    }
    function addPhoto(asset, point) {
      const view = host.view();
      const width = Math.min(320, view.width * .4);
      const fit = Math.min(width / asset.width, view.height * .42 / asset.height);
      addObject({ id: `element-${++nextId}`, kind: "image", assetId: asset.id, name: asset.name, ...(point || center((importOffset++ % 5) * 15)), width: asset.width * fit / view.scale, height: asset.height * fit / view.scale, rotation: 0, opacity: 1 });
      notify("photoAdded");
    }
    function addGalleryButton(asset) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nire-photo-thumbnail";
      button.title = asset.name;
      button.setAttribute("aria-label", asset.name);
      const image = new Image();
      image.src = asset.thumbnail;
      image.alt = "";
      button.appendChild(image);
      button.addEventListener("click", () => addPhoto(asset));
      gallery.appendChild(button);
    }
    async function importFiles(files, destination) {
      if (!host.canEdit()) return;
      const list = Array.from(files).filter((file) => file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif|bmp|svg|heic)$/i.test(file.name));
      if (!list.length) { setPhotoMessage("photoError"); return; }
      openPanel("image", false);
      const generation = uploadGeneration;
      let failed = false;
      setPhotoMessage("importing");
      $("nire-upload-photos").setAttribute("aria-busy", "true");
      for (const file of list) {
        if (generation !== uploadGeneration) break;
        try {
          const asset = await assetFromFile(file);
          if (generation !== uploadGeneration) break;
          assets.set(asset.id, asset);
          addGalleryButton(asset);
          addPhoto(asset, destination ? host.pointAt(destination.x, destination.y) : null);
        } catch (error) { failed = true; }
      }
      $("nire-upload-photos").removeAttribute("aria-busy");
      setPhotoMessage(failed ? "photoError" : "galleryHint");
      fileInput.value = "";
    }
    $("nire-upload-photos").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => importFiles(fileInput.files));
    function hasFiles(event) { return Array.from(event.dataTransfer?.types || []).includes("Files"); }
    document.querySelector(".nire-studio").addEventListener("dragover", (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (!host.canEdit()) { event.dataTransfer.dropEffect = "none"; return; }
      event.dataTransfer.dropEffect = "copy";
      document.body.classList.add("nire-dropping");
    });
    document.querySelector(".nire-studio").addEventListener("dragleave", (event) => {
      if (!event.relatedTarget || !document.querySelector(".nire-studio").contains(event.relatedTarget)) document.body.classList.remove("nire-dropping");
    });
    document.querySelector(".nire-studio").addEventListener("drop", (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      document.body.classList.remove("nire-dropping");
      if (!host.canEdit()) return;
      const destination = event.target.closest(".nire-panel, .nire-sidebar") ? null : { x: event.clientX, y: event.clientY };
      importFiles(event.dataTransfer.files, destination);
    });

    function pointFor(event) { return host.pointAt(event.clientX, event.clientY); }
    function localPoint(object, point) {
      const a = radians(-object.rotation), x = point.x - object.x, y = point.y - object.y;
      return { x: Math.cos(a) * x - Math.sin(a) * y, y: Math.sin(a) * x + Math.cos(a) * y };
    }
    function hitTest(point) {
      for (let i = objects.length - 1; i >= 0; i--) {
        const object = objects[i], local = localPoint(object, point);
        if (Math.abs(local.x) <= object.width / 2 && Math.abs(local.y) <= object.height / 2) return object;
      }
      return null;
    }
    function beginGesture(kind, object, event, target) {
      flushPending();
      event.preventDefault();
      const start = pointFor(event);
      gesture = { kind, id: event.pointerId, target, start, initial: clone(object), changed: false };
      target.setPointerCapture(event.pointerId);
      canvas.style.cursor = kind === "move" ? "grabbing" : "default";
      host.hold();
    }
    function moveGesture(event) {
      if (!gesture || gesture.id !== event.pointerId) return false;
      const object = selected();
      if (!object) return false;
      const point = pointFor(event), before = gesture.initial;
      if (gesture.kind === "move") {
        object.x = before.x + point.x - gesture.start.x;
        object.y = before.y + point.y - gesture.start.y;
      } else if (gesture.kind === "resize") {
        const initialDistance = Math.hypot(gesture.start.x - before.x, gesture.start.y - before.y);
        const factor = clamp(Math.hypot(point.x - before.x, point.y - before.y) / Math.max(initialDistance, 1), .1, 8);
        object.width = before.width * factor;
        object.height = before.height * factor;
        if (object.kind === "text") object.fontSize = before.fontSize * factor;
      } else {
        const startAngle = Math.atan2(gesture.start.y - before.y, gesture.start.x - before.x);
        object.rotation = normalizeAngle(before.rotation + degrees(Math.atan2(point.y - before.y, point.x - before.x) - startAngle));
      }
      gesture.changed = true;
      syncSettings();
      host.render();
      return true;
    }
    function endGesture(event) {
      if (!gesture || event && event.pointerId !== gesture.id) return false;
      const current = gesture;
      const object = selected();
      gesture = null;
      if (event?.type === "pointercancel" && object) Object.assign(object, current.initial);
      else if (current.changed) commitUpdate(object, current.initial);
      if (current.target.hasPointerCapture(current.id)) current.target.releasePointerCapture(current.id);
      canvas.style.cursor = mode === "select" ? "default" : "";
      host.hold();
      host.render();
      return true;
    }
    for (const [handle, kind] of [[resizeHandle, "resize"], [rotateHandle, "rotate"]]) {
      handle.addEventListener("pointerdown", (event) => { const object = selected(); if (object && event.button === 0 && event.isPrimary) beginGesture(kind, object, event, handle); });
      handle.addEventListener("pointermove", moveGesture);
      handle.addEventListener("pointerup", endGesture);
      handle.addEventListener("pointercancel", endGesture);
      handle.addEventListener("lostpointercapture", endGesture);
      handle.addEventListener("keydown", (event) => {
        if (!event.key.startsWith("Arrow")) return;
        const object = selected();
        if (!object) return;
        event.preventDefault();
        const before = clone(object), direction = event.key === "ArrowUp" || event.key === "ArrowRight" ? 1 : -1;
        if (kind === "rotate") object.rotation = normalizeAngle(object.rotation + direction * (event.shiftKey ? 15 : 2));
        else {
          const factor = direction > 0 ? 1.05 : .95;
          object.width *= factor; object.height *= factor;
          if (object.kind === "text") object.fontSize *= factor;
        }
        commitUpdate(object, before); syncSettings(); host.render();
      });
    }

    function corners(object) {
      const a = radians(object.rotation), c = Math.cos(a), s = Math.sin(a);
      return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => {
        const lx = x * object.width / 2, ly = y * object.height / 2;
        return host.projectPoint({ x: object.x + lx * c - ly * s, y: object.y + lx * s + ly * c });
      });
    }
    function updateSelection() {
      const object = mode === "select" ? selected() : null;
      selection.toggleAttribute("hidden", !object);
      resizeHandle.hidden = rotateHandle.hidden = !object;
      if (!object) return;
      const points = corners(object), view = host.view();
      selection.setAttribute("viewBox", `0 0 ${view.width} ${view.height}`);
      $("nire-selection-outline").setAttribute("points", points.map((point) => `${point.x},${point.y}`).join(" "));
      const center = host.projectPoint(object);
      const top = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
      const distance = Math.max(1, Math.hypot(top.x - center.x, top.y - center.y));
      const rotationPoint = { x: top.x + (top.x - center.x) / distance * 26, y: top.y + (top.y - center.y) / distance * 26 };
      for (const [handle, point] of [[resizeHandle, points[2]], [rotateHandle, rotationPoint]]) {
        handle.style.left = `${clamp(point.x, 14, view.width - 14)}px`;
        handle.style.top = `${clamp(point.y, 65, view.height - 14)}px`;
      }
    }

    for (const control of [size, angle, opacity]) {
      control.addEventListener("input", () => {
        const object = selected();
        if (!object) return;
        if (!pending) pending = { id: object.id, before: clone(object) };
        if (control === size) {
          const factor = Number(size.value) / Math.max(1, object.width * host.view().scale);
          object.width *= factor; object.height *= factor;
          if (object.kind === "text") object.fontSize *= factor;
        } else if (control === angle) object.rotation = Number(angle.value);
        else object.opacity = Number(opacity.value) / 100;
        syncSettings();
        host.render();
      });
      control.addEventListener("change", flushPending);
    }
    function removeSelected() {
      flushPending();
      const object = selected();
      if (!object) return;
      objects = objects.filter((item) => item.id !== object.id);
      selectedId = null;
      host.commit({ type: "collage-delete", id: object.id });
      syncSettings(); host.hold(); host.render(); notify("removed");
    }
    $("nire-delete-object").addEventListener("click", removeSelected);
    textTool.addEventListener("click", () => {
      if (panel === "text") { closePanel(true); return; }
      if (selected()?.kind !== "text") { content.value = ""; color.value = host.color(); }
      openPanel("text", true);
    });
    photoTool.addEventListener("click", () => { if (panel === "image") closePanel(true); else openPanel("image", false); });
    moveTool.addEventListener("click", () => { host.finish(); closePanel(false); mode = "select"; syncMode(); notify("moving"); canvas.focus({ preventScroll: true }); });
    document.querySelectorAll("[data-close-panel]").forEach((button) => button.addEventListener("click", () => closePanel(true)));
    canvas.addEventListener("dblclick", (event) => {
      const object = hitTest(pointFor(event));
      if (object) { selectObject(object.id, true); if (object.kind === "text") content.focus(); }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && panel) { event.preventDefault(); closePanel(true); }
    });
    document.addEventListener("nire-panel-open", (event) => {
      if (event.detail !== "text" && event.detail !== "image") { endGesture(); flushPending(); closePanel(false); }
    });
    $("nire-rotation").addEventListener("click", () => { selectedId = null; closePanel(false); updateSelection(); host.hold(); }, true);

    const api = {
      reset() { objects = []; },
      apply(operation) {
        if (operation.type === "collage-add") objects.push(clone(operation.value));
        else if (operation.type === "collage-update") { const object = objects.find((item) => item.id === operation.id); if (object) Object.assign(object, operation.value); }
        else if (operation.type === "collage-delete") objects = objects.filter((item) => item.id !== operation.id);
        else return false;
        return true;
      },
      reconcile() {
        if (!selected()) selectedId = null;
        if (selected()?.kind === "text") { content.value = selected().text; font.value = selected().font; color.value = selected().color; }
        syncSettings(); host.hold();
      },
      hasContent: () => objects.length > 0,
      holdsMotion: () => Boolean(selectedId || panel || gesture),
      draw(ctx) {
        for (const object of objects) {
          ctx.save(); ctx.translate(object.x, object.y); ctx.rotate(radians(object.rotation)); ctx.globalAlpha = object.opacity;
          if (object.kind === "image") {
            const asset = assets.get(object.assetId);
            if (asset) ctx.drawImage(asset.image, -object.width / 2, -object.height / 2, object.width, object.height);
          } else {
            ctx.font = fontFor(object.font, object.fontSize);
            ctx.fillStyle = object.color; ctx.textBaseline = "top";
            (object.lines || object.text.split("\n")).forEach((line, index) => ctx.fillText(line, -object.width / 2 + object.fontSize * .1, -object.height / 2 + index * object.fontSize * 1.2));
          }
          ctx.restore();
        }
      },
      updateSelection,
      flush() { endGesture(); flushPending(); },
      clearInteraction() { endGesture(); flushPending(); selectedId = null; mode = "draw"; uploadGeneration++; closePanel(false); syncMode(); syncSettings(); },
      activateDraw() { endGesture(); flushPending(); selectedId = null; mode = "draw"; closePanel(false); syncMode(); updateSelection(); },
      useColor(value, commit = true) {
        const object = selected();
        if (object?.kind !== "text") return;
        if (!pending) pending = { id: object.id, before: clone(object) };
        object.color = value; color.value = value;
        if (commit) flushPending();
        host.render();
      },
      pointerDown(event) {
        if (mode !== "select") return false;
        host.finish();
        closePanel(false);
        const object = hitTest(pointFor(event));
        selectObject(object?.id || null, false);
        canvas.focus({ preventScroll: true });
        if (object) beginGesture("move", object, event, canvas);
        else event.preventDefault();
        return true;
      },
      pointerMove(event) { if (mode !== "select") return false; moveGesture(event); return true; },
      pointerUp: endGesture,
      keyDown(event) {
        if (mode !== "select") return false;
        const object = selected();
        if (event.key === "Escape") { selectedId = null; closePanel(false); syncSettings(); host.hold(); return true; }
        if (!object) return true;
        if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); removeSelected(); return true; }
        if (event.key.startsWith("Arrow")) {
          event.preventDefault();
          const before = clone(object), point = host.projectPoint(object), distance = event.shiftKey ? 20 : 3;
          if (event.key === "ArrowLeft") point.x -= distance;
          if (event.key === "ArrowRight") point.x += distance;
          if (event.key === "ArrowUp") point.y -= distance;
          if (event.key === "ArrowDown") point.y += distance;
          Object.assign(object, host.pointAt(point.x, point.y));
          commitUpdate(object, before); syncSettings(); host.render();
        }
        return true;
      }
    };
    localize();
    return api;
  };
}());
