# Aportes al ñire

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

En assets/js/nire-community-config.js, cambiar apiOrigin por el origen HTTPS del Worker publicado y publicar los archivos del portfolio. No agregar /api/nire/elements al origen: el cliente completa esa ruta.

La lista de orígenes permitidos está en wrangler.toml. La API acepta únicamente trazos limitados, tres materiales, color y una transformación acotada; no acepta HTML, archivos ni código. Limita a 30 aportes diarios por dirección de red, guarda solo su hash y no ofrece borrado público. Los borradores no se envían hasta pulsar APPLY.

Los aportes quedan en D1 hasta que el propietario los retire; “para siempre” depende de conservar la cuenta, la base y sus respaldos. La configuración preparada no activa una cuenta ni publica nada por sí sola.

Documentación oficial: https://developers.cloudflare.com/d1/worker-api/prepared-statements/ y https://developers.cloudflare.com/workers/wrangler/configuration/

## Verificación

    python3 scripts/test_nire_community.py
    node community-api/worker.test.mjs
    node scripts/test-nire-inflate.cjs

El segundo comando requiere Node con node:sqlite. Ejecuta el código del Worker y sus consultas reales con un adaptador de la API de D1 sobre SQLite. El despliegue remoto requiere la cuenta indicada arriba y no se simula como si ya estuviera activo.

La silueta cerrada se transforma en un cuerpo redondeado en assets/js/nire-inflate.js. Se guardan los trazos originales: la vista previa y el elemento colocado en el árbol generan el mismo volumen a partir de ellos. El último test verifica volumen, profundidad, normales y superficies sin bordes abiertos para gotas, círculos, contornos con pequeñas aberturas y figuras hechas en varios trazos.
