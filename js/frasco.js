/* ============================================================
   701 PARFUM — Frascos del inicio
   Cada frasco es un video real del producto convertido en secuencia
   de imágenes con fondo transparente: el cuadro que se muestra
   depende de cuánto scrolleaste. Se hace así —y no con un <video>—
   porque hacer "seek" de un video con el scroll da tirones, sobre
   todo en celulares. Además, sin elemento de video no hay audio
   posible.

   Los tres frascos (negro, bianco, scarlet) usan el MISMO índice de
   cuadro en cada momento, así giran todos juntos, como si fuera una
   sola toma. El negro es el principal (más grande, prioridad de
   carga); bianco y scarlet lo acompañan a los costados, más chicos.
   ============================================================ */
(function () {
  'use strict';

  const header = document.querySelector('.parallax__header');
  const capa = document.querySelector('.p-layer--bottle');
  if (!header || !capa) return;

  const esChico = matchMedia('(max-width: 700px)').matches;

  const CONFIGS = [
    { canvasId: 'hero-frasco-bianco', respaldoId: 'hero-foto-bianco', carpeta: 'assets/frasco-bianco', cantidad: 60, rel: 260 / 805, principal: false },
    { canvasId: 'hero-frasco', respaldoId: 'hero-foto', carpeta: 'assets/frasco', cantidad: 60, rel: 308 / 700, principal: true },
    { canvasId: 'hero-frasco-scarlet', respaldoId: 'hero-foto-scarlet', carpeta: 'assets/frasco-scarlet', cantidad: 60, rel: 260 / 634, principal: false },
  ];

  const instancias = CONFIGS.map(crear).filter(Boolean);
  if (!instancias.length) return;

  function crear(cfg) {
    const lienzo = document.getElementById(cfg.canvasId);
    const respaldo = document.getElementById(cfg.respaldoId);
    if (!lienzo) return null;
    const columna = lienzo.closest('.p-layer__frasco');
    const boton = columna ? columna.querySelector('.frasco-ficha') : null;

    const ctx = lienzo.getContext('2d', { alpha: true });
    const ruta = (i) => `${cfg.carpeta}/f${String(i).padStart(2, '0')}.webp`;
    const cuadros = new Array(cfg.cantidad);

    const inst = {
      cfg, boton, arrancado: false, indiceActual: -1, anchoCSS: 0, altoCSS: 0,

      /* anchoColumna es lo que realmente ocupa la columna en la fila:
         el frasco casi siempre es más angosto que su botón de ficha
         (sobre todo bianco/scarlet), así que si no se reserva el ancho
         del botón, los tres botones se pisan entre sí. */
      medir(alto, anchoColumna) {
        const ancho = alto * cfg.rel;
        inst.anchoCSS = ancho; inst.altoCSS = alto;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        lienzo.width = Math.round(ancho * dpr);
        lienzo.height = Math.round(alto * dpr);
        lienzo.style.width = ancho + 'px';
        lienzo.style.height = alto + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (columna) columna.style.width = Math.max(ancho, anchoColumna || 0) + 'px';
        if (inst.indiceActual >= 0) inst.pintar(inst.indiceActual, true);
      },

      pintar(i, forzar) {
        if (i === inst.indiceActual && !forzar) return;
        let j = i;
        if (!cuadros[j]) {
          for (let d = 1; d < cfg.cantidad; d++) {
            if (cuadros[i - d]) { j = i - d; break; }
            if (cuadros[i + d]) { j = i + d; break; }
          }
        }
        const img = cuadros[j];
        if (!img) return;
        inst.indiceActual = i;
        ctx.clearRect(0, 0, inst.anchoCSS, inst.altoCSS);
        ctx.drawImage(img, 0, 0, inst.anchoCSS, inst.altoCSS);
      },
    };

    function cargar(i, prioridad) {
      const img = new Image();
      img.decoding = 'async';
      if (prioridad) img.fetchPriority = 'high';
      img.onload = () => {
        cuadros[i] = img;
        if (i === 0 && !inst.arrancado) {
          inst.arrancado = true;
          medirTodos();
          inst.pintar(0, true);
          lienzo.classList.add('esta-listo');
          if (respaldo) respaldo.style.display = 'none';
        }
      };
      img.src = ruta(i);
    }

    /* El primero va solo, para mostrar algo cuanto antes. El del
       frasco principal además va con prioridad de red. */
    cargar(0, cfg.principal);
    requestIdleCallbackSeguro(() => {
      for (let i = 1; i < cfg.cantidad; i++) cargar(i, false);
    });

    return inst;
  }

  function requestIdleCallbackSeguro(fn) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 1200 });
    else setTimeout(fn, 300);
  }

  /* ---------- Tamaño: los tres a la vez, para que entren juntos ---------- */
  function medirTodos() {
    const cw = capa.getBoundingClientRect().width;
    const gapPx = esChico ? 8 : 22;

    const altoPrincipal = Math.min(innerHeight * (esChico ? 0.30 : 0.335), esChico ? 300 : 440);
    const altoLateral = altoPrincipal * (esChico ? 0.6 : 0.68);

    /* Cada columna ocupa lo que sea más ancho entre el frasco y su
       botón de ficha (el botón casi siempre gana). */
    const anchosColumna = instancias.map((inst) => {
      const anchoFrasco = (inst.cfg.principal ? altoPrincipal : altoLateral) * inst.cfg.rel;
      const anchoBoton = inst.boton ? inst.boton.getBoundingClientRect().width : 0;
      return Math.max(anchoFrasco, anchoBoton);
    });
    const totalAncho = anchosColumna.reduce((a, b) => a + b, 0) + gapPx * (instancias.length - 1);
    const maxAncho = cw * 0.94;
    const factor = totalAncho > maxAncho ? maxAncho / totalAncho : 1;

    instancias.forEach((inst, idx) => {
      const alto = (inst.cfg.principal ? altoPrincipal : altoLateral) * factor;
      inst.medir(alto, anchosColumna[idx] * factor);
    });
  }

  /* ---------- El scroll manda, y manda igual para los tres ---------- */
  function avance() {
    const r = header.getBoundingClientRect();
    const recorrido = r.height - innerHeight;
    return Math.min(1, Math.max(0, -r.top / (recorrido || 1)));
  }

  let pendiente = false;
  function alScrollear() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      const prog = avance();
      instancias.forEach((inst) => {
        if (!inst.arrancado) return;
        inst.pintar(Math.round(prog * (inst.cfg.cantidad - 1)));
      });
    });
  }

  addEventListener('scroll', alScrollear, { passive: true });
  addEventListener('resize', () => { medirTodos(); alScrollear(); });

  /* Lenis mueve el scroll sin disparar el evento nativo en todos
     los casos, así que se le pide el aviso directamente. */
  const engancharLenis = setInterval(() => {
    if (window.__lenis) {
      window.__lenis.on('scroll', alScrollear);
      clearInterval(engancharLenis);
    }
  }, 200);
  setTimeout(() => clearInterval(engancharLenis), 8000);
})();
