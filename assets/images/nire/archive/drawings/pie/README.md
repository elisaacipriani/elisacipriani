# Digitalización del dibujo del pie

## Prompt de la edición activa: quitar las anotaciones

Herramienta integrada de edición de imágenes. Entrada: `digitalizacion.png`. Salida: `digitalizacion-sin-texto.png`.

Use case: precise-object-edit / background-extraction. Edit target: the supplied transparent PNG of Elisa's black pen drawing of a large foot and a small person above it. REMOVE ALL HANDWRITTEN TEXT AROUND THE DRAWING: the several lines of words at the upper left, the isolated partial word at middle left, and both large lines of writing along the bottom. Replace those text pixels with full transparency. Preserve the actual drawing exactly: the entire large foot with all five toes and toenails, the small person with spiky hair above the foot, the long curved contour on the left, and every non-text ink mark belonging to this drawing. Keep all existing gaps, irregular lines, proportions, black ink, line weight, and tiny details unchanged. Do not redesign, retrace, simplify, smooth, add parts, complete contours, or add any letters or caption. Keep the background genuinely transparent. Trim the now-empty outer space so the complete drawing is centered with a small transparent margin on all sides, without cutting any existing non-text stroke. The result must contain only the existing drawing, with no words anywhere.

## Versiones y procedencia

Recibido de Elisa el 31 de octubre de 2026. Ficha independiente 21, «Sin título».

- `original.png`: captura recibida, sin modificar (638 × 820).
- `digitalizacion.png`: primera edición con las notas manuscritas alrededor. Versión anterior conservada como registro; ya no se muestra en la ficha.
- `digitalizacion-sin-texto.png`: versión activa, editada con la herramienta integrada de imágenes, fondo transparente (1106 × 1422). Por pedido posterior de Elisa, se quitaron todas las anotaciones de alrededor. Se conserva el dibujo del pie, la figura pequeña y los trazos no textuales, centrados en el encuadre. No hay texto editorial añadido a la ficha.

Fuente: `/var/folders/48/1s5r9r4n00qclm6dljs830d40000gn/T/TemporaryItems/NSIRD_screencaptureui_nUCdl1/Screenshot 2026-10-31 at 8.16.06 PM.png`.

## Prompt utilizado para la primera digitalización

Use case: background-extraction. Edit target: the supplied photograph of Elisa's handwritten pen drawing and notes. Create a faithful scanned facsimile on a genuinely transparent background, for her personal art archive. Remove only the beige paper, lighting gradients, shadows, and paper edges. Preserve ALL original black ink: the large foot, the small person above it, every surrounding handwritten note, every tiny stroke, and their exact relative position, shape, irregularity, line weight, and framing. The top, left, and bottom notes are partially cut off in the source: retain those existing partial letters AS DRAWN; do not complete them, interpret them, typeset them, replace them, or invent additional text. Keep the entire image's contents, including marks at every edge. Dark neutral black ink only, no colored tint, no white painted backdrop, no paper texture, no border, no new objects, no smoothing into a different illustration. This is precise archival background removal, not a redesign. Preserve the source portrait aspect ratio.
