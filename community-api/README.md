# Aportes al ñire

## Archivo de objetos y estampitas

Los relatos de Elisa se toman únicamente de los textos que ella proporciona. No completar, extender ni interpretar su escritura con frases propias. Si una ficha todavía no tiene relato, su lista `paragraphs` queda vacía. Las traducciones conservan el contenido sin agregar ideas. Los títulos no proporcionados se limitan al nombre del objeto o a una indicación de «Sin título».

La entrada alterna cada 300 ms el dibujo inicial y los objetos con imagen de la colección. Excluye las fichas pendientes, la foto reservada y las imágenes duplicadas. Las imágenes se precargan antes de entrar en la secuencia. Se detiene al salir de la entrada o al ocultar la pestaña; con movimiento reducido se muestra el dibujo inicial quieto. Al tocar la secuencia se abre el archivo.

La sección Colección abre con un dibujo pequeño de Elisa centrado sobre blanco pleno. Al tocarlo aparece un listado de veinte fichas con un abecedario vertical para filtrar. Las catorce entradas todavía sin contenido se señalan como «Por incorporar»; no son obras inventadas ni aportes guardados. Cada ficha abre una vista individual: primero el objeto centrado, luego su columna de texto y sus referencias. El listado completo permanece oculto durante esa lectura. La estructura del árbol anterior ya no forma parte de la colección visible. La sección abre en `coleccion.html`. La dirección anterior redirige a esta página y conserva el idioma y la ficha enlazada. Los datos están en `assets/js/nire-archive-data.js`; las fotografías originales se conservan y se muestran en blanco y negro. La ficha de la piedra incluye una columna de referencias de Marina Abramović con créditos separados del relato de Elisa.

Los aportes nuevos son estampitas planas de 600 × 800 con imagen propia, dibujo negro y una palabra. Se guardan junto con título, relato, firma opcional y una asociación en `/api/nire/archive`. La API local y el Worker usan la tabla `archive_entries`. La tabla `elements` y su API anterior permanecen conservadas; no se convierten ni se borran los aportes anteriores.

La imagen se exporta como JPEG. La API valida dimensiones, cabecera, tamaño, texto plano e identificador, y aplica el mismo guardado confirmado, límite diario e idempotencia de la colección anterior. Un borrador se reinicia al salir del editor. Una estampita guardada continúa disponible al recargar, reiniciar el servidor o entrar desde otro navegador.

La vista local sirve ambas colecciones con `python3 scripts/serve-nire.py --port 8765`. La activación pública sigue requiriendo la cuenta de Cloudflare y la configuración indicadas más abajo; no se simula un guardado global mediante almacenamiento del navegador.

Las tres digitalizaciones entregadas el 30 de octubre están en `assets/images/nire/archive/drawings/`. Son SVG de contornos extraídos de la tinta, con fondo transparente y originales conservados. Se pueden reconstruir con `scripts/digitize-archive-drawings.py` y sus dependencias de análisis de imagen.

Validación del archivo:

    python3 scripts/test_nire_archive.py
    node community-api/archive.test.mjs

## Colección 3D anterior, conservada

Los trazos, material, color y posición se guardan en una base compartida. Un aporte se considera aplicado después de que el servidor confirma la escritura. Reintentar la misma solicitud no duplica el elemento.

El dibujo en curso se conserva al pasar a colocarlo y volver a editarlo. Al salir al ñire, navegar a otra sección o recargar la página, el editor se reinicia: dibujo, vista 3D, mensaje, material, color y tamaño. Esto no borra los elementos que ya se aplicaron al árbol.

El editor permite un mensaje opcional de hasta 240 caracteres. Se guarda como texto plano junto con el elemento y aparece en su círculo al tocarlo. El tamaño se ajusta del 25% al 200% mientras se coloca la pieza; el punto de unión permanece fijo y la escala se guarda con la posición. Los aportes anteriores sin mensaje siguen funcionando sin migrar la base.

## Vista previa local

Desde la raíz del portfolio:

    python3 scripts/serve-nire.py --port 8765

Sirve el portfolio y la API. Los aportes persisten en .nire-data/elements.sqlite3, también después de reiniciar y desde otros navegadores. Esta carpeta no se publica ni se incluye en Git. Conservar una copia de ese archivo para respaldar los aportes de prueba.

## Activación pública: Cloudflare Worker + D1

Hace falta una cuenta de Cloudflare. La web puede seguir en GitHub Pages; no requiere mover el dominio ni exponer claves en el navegador.

Desde esta carpeta, con Node y Wrangler:

    npx wrangler login
    npx wrangler d1 create nire-community

Copiar el database_id devuelto a wrangler.toml. Después:

    npx wrangler d1 execute nire-community --remote --file=schema.sql
    npx wrangler deploy

En assets/js/nire-community-config.js, cambiar apiOrigin por el origen HTTPS del Worker publicado y publicar los archivos del portfolio. No agregar una ruta al origen: el cliente completa `/api/nire/archive` para el archivo o `/api/nire/elements` para la colección anterior.

La lista de orígenes permitidos está en wrangler.toml. El archivo recibe una estampita JPEG de 600 × 800 y texto plano. La colección anterior recibe trazos limitados, tres materiales, color y una transformación acotada. Ninguna acepta HTML ejecutable, SVG ni URLs de imágenes externas. Cada colección limita a 30 aportes diarios por dirección de red, guarda solo su hash y no ofrece borrado público. Los borradores se envían únicamente al confirmar su conservación.

Los aportes quedan en D1 hasta que el propietario los retire; “para siempre” depende de conservar la cuenta, la base y sus respaldos. La configuración preparada no activa una cuenta ni publica nada por sí sola.

Documentación oficial: https://developers.cloudflare.com/d1/worker-api/prepared-statements/ y https://developers.cloudflare.com/workers/wrangler/configuration/

## Verificación

    python3 scripts/test_nire_community.py
    node community-api/worker.test.mjs
    node scripts/test-nire-inflate.cjs

El segundo comando requiere Node con node:sqlite. Ejecuta el código del Worker y sus consultas reales con un adaptador de la API de D1 sobre SQLite. El despliegue remoto requiere la cuenta indicada arriba y no se simula como si ya estuviera activo.

La silueta cerrada se transforma en un cuerpo redondeado en assets/js/nire-inflate.js. Se guardan los trazos originales: la vista previa y el elemento colocado en el árbol generan el mismo volumen a partir de ellos. El último test verifica volumen, profundidad, normales y superficies sin bordes abiertos para gotas, círculos, contornos con pequeñas aberturas y figuras hechas en varios trazos.
