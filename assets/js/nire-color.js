(function () {
  "use strict";

  window.createNireColorPicker = function (host) {
    const $ = (id) => document.getElementById(id);
    const hue = $("nire-color-hue"), saturation = $("nire-color-saturation"), value = $("nire-color-value");
    const square = $("nire-color-sv"), marker = $("nire-color-marker"), hexInput = $("nire-color-hex");
    const panel = $("nire-color-panel"), tool = $("nire-color-tool"), message = $("nire-color-message");
    const presets = Array.from(panel.querySelectorAll("[data-color]"));
    let opened = false, pointer = null, language = "es";
    const copy = {
      es: {
        hue: "Tono", hueLabel: "Tono del color", color: "Color", chooseColor: "Elegir cualquier color", close: "Cerrar selector de color",
        saturation: "Saturación", brightness: "Brillo", svLabel: "Saturación y brillo", hexLabel: "Código hexadecimal del color", presets: "Colores del árbol",
        svHelp: "Arrastrá para elegir el color. Con las flechas izquierda y derecha cambiás la saturación; con arriba y abajo, el brillo.",
        invalid: "Escribí un color válido, por ejemplo #34A8FF."
      },
      en: {
        hue: "Hue", hueLabel: "Color hue", color: "Color", chooseColor: "Choose any color", close: "Close color picker",
        saturation: "Saturation", brightness: "Brightness", svLabel: "Saturation and brightness", hexLabel: "Hexadecimal color code", presets: "Colors of the tree",
        svHelp: "Drag to choose a color. Left and right arrows change saturation; up and down arrows change brightness.",
        invalid: "Enter a valid color, for example #34A8FF."
      }
    };
    const t = (key) => copy[language][key] || key;
    const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
    function fromHex(hex, previousHue) {
      const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
      const max = Math.max(r, g, b), min = Math.min(r, g, b), difference = max - min;
      let h = previousHue || 0;
      if (difference) {
        if (max === r) h = 60 * ((g - b) / difference % 6);
        else if (max === g) h = 60 * ((b - r) / difference + 2);
        else h = 60 * ((r - g) / difference + 4);
        h = (h + 360) % 360;
      }
      return { h, s: max ? difference / max : 0, v: max };
    }
    function toHex(color) {
      const h = (color.h % 360 + 360) % 360 / 60, c = color.v * color.s;
      const x = c * (1 - Math.abs(h % 2 - 1)), m = color.v - c;
      const channels = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h)];
      return "#" + channels.map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0")).join("");
    }
    let hsv = fromHex(host.initial, 0);

    function render() {
      const hex = toHex(hsv);
      hue.value = hsv.h;
      hue.setAttribute("aria-valuetext", `${Math.round(hsv.h)}°`);
      saturation.value = hsv.s * 100;
      value.value = hsv.v * 100;
      $("nire-color-saturation-value").textContent = `${Math.round(hsv.s * 100)}%`;
      $("nire-color-value-value").textContent = `${Math.round(hsv.v * 100)}%`;
      square.style.setProperty("--picker-hue", hsv.h);
      marker.style.left = `${hsv.s * 100}%`;
      marker.style.top = `${(1 - hsv.v) * 100}%`;
      $("nire-color-preview").style.backgroundColor = hex;
      hexInput.value = hex.toUpperCase();
      hexInput.removeAttribute("aria-invalid");
      message.textContent = "";
      tool.title = `${t("chooseColor")} · ${hex.toUpperCase()}`;
      tool.setAttribute("aria-label", tool.title);
      presets.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.color === hex)));
    }
    function emit(commit) {
      render();
      host.change(toHex(hsv), commit);
    }
    function localize() {
      language = document.documentElement.lang === "en" ? "en" : "es";
      document.querySelectorAll("[data-picker-copy]").forEach((node) => { node.textContent = t(node.dataset.pickerCopy); });
      document.querySelectorAll("[data-picker-label]").forEach((node) => {
        node.setAttribute("aria-label", t(node.dataset.pickerLabel));
        if (node.tagName === "BUTTON") node.title = t(node.dataset.pickerLabel);
      });
      render();
    }
    new MutationObserver(localize).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    function close(focus) {
      if (!opened) return;
      opened = false;
      panel.hidden = true;
      tool.setAttribute("aria-expanded", "false");
      host.commit();
      host.hold();
      if (focus) tool.focus({ preventScroll: true });
    }
    tool.addEventListener("click", (event) => {
      if (!host.canEdit()) return;
      if (opened) { close(false); return; }
      document.dispatchEvent(new CustomEvent("nire-panel-open", { detail: "color" }));
      opened = true;
      panel.hidden = false;
      tool.setAttribute("aria-expanded", "true");
      host.hold();
      if (event.detail === 0) square.focus({ preventScroll: true });
    });
    $("nire-close-color").addEventListener("click", () => close(true));
    document.addEventListener("nire-panel-open", (event) => { if (event.detail !== "color") close(false); });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && opened) { event.preventDefault(); event.stopPropagation(); close(true); }
    }, true);

    for (const [control, key, factor] of [[hue, "h", 1], [saturation, "s", .01], [value, "v", .01]]) {
      control.addEventListener("input", () => { hsv[key] = Number(control.value) * factor; emit(false); });
      control.addEventListener("change", () => emit(true));
    }
    function chooseAt(event) {
      const rect = square.getBoundingClientRect();
      hsv.s = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      hsv.v = 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1);
    }
    square.addEventListener("pointerdown", (event) => {
      if (pointer !== null || event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      pointer = event.pointerId;
      square.setPointerCapture(pointer);
      square.focus({ preventScroll: true });
      chooseAt(event);
      emit(false);
    });
    square.addEventListener("pointermove", (event) => { if (event.pointerId === pointer) { chooseAt(event); emit(false); } });
    function release(event) {
      if (event.pointerId !== pointer) return;
      if (event.type === "pointerup") chooseAt(event);
      pointer = null;
      emit(true);
      if (square.hasPointerCapture(event.pointerId)) square.releasePointerCapture(event.pointerId);
    }
    square.addEventListener("pointerup", release);
    square.addEventListener("pointercancel", release);
    square.addEventListener("lostpointercapture", release);
    square.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? .05 : .01;
      if (!event.key.startsWith("Arrow")) return;
      event.preventDefault();
      if (event.key === "ArrowLeft") hsv.s = clamp(hsv.s - step, 0, 1);
      if (event.key === "ArrowRight") hsv.s = clamp(hsv.s + step, 0, 1);
      if (event.key === "ArrowUp") hsv.v = clamp(hsv.v + step, 0, 1);
      if (event.key === "ArrowDown") hsv.v = clamp(hsv.v - step, 0, 1);
      emit(true);
    });
    function readHex() {
      let candidate = hexInput.value.trim().replace(/^#/, "");
      if (/^[a-f\d]{3}$/i.test(candidate)) candidate = candidate.split("").map((character) => character + character).join("");
      if (!/^[a-f\d]{6}$/i.test(candidate)) {
        hexInput.setAttribute("aria-invalid", "true");
        message.textContent = t("invalid");
        return;
      }
      hsv = fromHex("#" + candidate, hsv.h);
      emit(true);
    }
    hexInput.addEventListener("change", readHex);
    hexInput.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); readHex(); } });
    presets.forEach((button) => button.addEventListener("click", () => { hsv = fromHex(button.dataset.color, hsv.h); emit(true); }));
    localize();
    return { close, isOpen: () => opened };
  };
}());
