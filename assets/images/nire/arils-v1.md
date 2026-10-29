# Coral pomegranate arils

The shape and interior follow Elisa's reference supplied on 2026-10-28 (`codex-clipboard-189fbe74-74ba-4d6a-bb28-1a7a02916576.png`). Its red pigment is not used. The accepted coral texture, base RGB mixture and absorption RGB in `nire-coral-material.js` remain in use.

`build-nire-bubbles.py` produces a closed tapered rounded superellipsoid, with analytic normals. The 45 large arils retain their original centers, scale and radius parameters; each receives a stable orientation. `aril-mesh.bin` exports the same canonical surface for the 133 miniature marks. Its lower-resolution companion renders distant marks with the same shape and material, and the full surface takes over for close-ups.

The shared optical shader models wet skin, refracted scene contents, fruit flesh, fine pulp membranes, and a separate tapered inner seed reached by a ray through the volume. The inner seed has a curved surface and thickness rather than a painted oval. Both renderers share this shader and `bubble-skin-v1.png`. Instanced rendering is used when available; a regular indexed-draw fallback supports other WebGL 1 implementations.
