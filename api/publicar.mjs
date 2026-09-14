/* =============================================================
   701 PARFUM — Publicación automática desde el panel del dueño

   Qué hace: recibe el catálogo nuevo, lo guarda como js/data.js en
   GitHub, y con eso Vercel republica la web sola en ~30 segundos.

   Necesita dos variables de entorno cargadas en Vercel:
     PANEL_CLAVE   → la clave para entrar al panel
     GITHUB_TOKEN  → token de GitHub con permiso de escritura en el repo

   Ninguna de las dos vive en el código: se cargan en el panel de
   Vercel (Settings → Environment Variables) y solo existen en el
   servidor. El navegador nunca las ve.
   ============================================================= */

const REPO   = 'MKTUnilar/701-parfum';
const RAMA   = 'main';
const ARCHIVO = 'js/data.js';

/* Le damos un techo al tamaño: el catálogo real ronda los 30 KB.
   Si llega algo mucho más grande, es un error o un abuso. */
const TOPE_BYTES = 2 * 1024 * 1024;

function gh(ruta, opciones = {}) {
  return fetch('https://api.github.com/repos/' + REPO + ruta, {
    ...opciones,
    headers: {
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': '701-parfum-panel',
      ...(opciones.headers || {}),
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  const { clave, contenido, accion } = req.body || {};

  /* ---------- 1. Que el servidor esté bien configurado ---------- */
  if (!process.env.PANEL_CLAVE || !process.env.GITHUB_TOKEN) {
    return res.status(500).json({
      ok: false,
      error: 'Falta configurar PANEL_CLAVE o GITHUB_TOKEN en Vercel.',
    });
  }

  /* ---------- 2. Verificar la clave ----------
     Acá, en el servidor. Nunca en el navegador: si estuviera en el
     JavaScript de la página, cualquiera la leería con "ver código". */
  if (typeof clave !== 'string' || clave !== process.env.PANEL_CLAVE) {
    return res.status(401).json({ ok: false, error: 'Clave incorrecta.' });
  }

  /* El panel usa esto solo para saber si la clave sirve, sin publicar. */
  if (accion === 'verificar') {
    return res.status(200).json({ ok: true });
  }

  /* ---------- 3. Revisar lo que llega ---------- */
  if (typeof contenido !== 'string' || !contenido.trim()) {
    return res.status(400).json({ ok: false, error: 'No llegó el catálogo.' });
  }
  if (Buffer.byteLength(contenido, 'utf8') > TOPE_BYTES) {
    return res.status(413).json({ ok: false, error: 'El archivo es demasiado grande.' });
  }
  /* Que de verdad parezca el data.js y no cualquier otra cosa. */
  if (!contenido.includes('const CONFIG') || !contenido.includes('const PRODUCTOS')) {
    return res.status(400).json({
      ok: false,
      error: 'El archivo no tiene la forma esperada; no se publicó nada.',
    });
  }

  try {
    /* ---------- 4. Pedir la versión actual ----------
       GitHub exige el `sha` del archivo que estamos reemplazando. Es su
       forma de evitar que dos ediciones simultáneas se pisen entre sí. */
    const actual = await gh('/contents/' + ARCHIVO + '?ref=' + RAMA);
    if (!actual.ok) {
      const detalle = await actual.text();
      return res.status(502).json({
        ok: false,
        error: 'No pude leer el archivo en GitHub (' + actual.status + ').',
        detalle: detalle.slice(0, 300),
      });
    }
    const { sha } = await actual.json();

    /* ---------- 5. Guardar la versión nueva ---------- */
    const fecha = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    const guardar = await gh('/contents/' + ARCHIVO, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Actualizar catalogo desde el panel (' + fecha + ')',
        content: Buffer.from(contenido, 'utf8').toString('base64'),
        sha,
        branch: RAMA,
      }),
    });

    if (!guardar.ok) {
      const detalle = await guardar.text();
      return res.status(502).json({
        ok: false,
        error: 'GitHub rechazó el cambio (' + guardar.status + ').',
        detalle: detalle.slice(0, 300),
      });
    }

    const datos = await guardar.json();
    return res.status(200).json({
      ok: true,
      commit: (datos.commit && datos.commit.sha || '').slice(0, 7),
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Error inesperado: ' + err.message });
  }
}
