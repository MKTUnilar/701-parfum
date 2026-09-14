/* ============================================================
   701 PARFUM — Avisos y panel arrastrable
   Portado a JS puro siguiendo el enfoque de animación de
   Emil Kowalski (Sonner / Vaul):
     · curvas de salida, nunca lineales
     · duraciones cortas (150–420 ms)
     · sólo transform y opacity (no molestan al layout)
     · el gesto manda: se puede arrastrar e interrumpir
   ============================================================ */
(function () {
  'use strict';

  const menosMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     AVISOS APILADOS  (estilo Sonner)
     ============================================================ */
  const capa = document.getElementById('avisos');
  const vivos = [];            // el más nuevo primero
  const VISIBLES = 3;
  const ESPERA = 4000;

  function acomodar() {
    vivos.forEach((a, i) => {
      const dentro = i < VISIBLES;
      const escala = 1 - i * 0.055;
      const y = -i * 13 + a.dy;
      a.el.style.zIndex = String(60 - i);
      a.el.style.opacity = a.saliendo ? '0' : (dentro ? String(1 - i * 0.22) : '0');
      a.el.style.transform = a.saliendo
        ? `translate3d(${a.dx}px, ${a.dy + 80}px, 0) scale(.9)`
        : `translate3d(${a.dx}px, ${y}px, 0) scale(${escala})`;
    });
  }

  function sacar(a) {
    if (a.saliendo) return;
    a.saliendo = true;
    clearTimeout(a.reloj);
    acomodar();
    setTimeout(() => {
      const i = vivos.indexOf(a);
      if (i > -1) vivos.splice(i, 1);
      a.el.remove();
      acomodar();
    }, menosMovimiento ? 0 : 320);
  }

  function programar(a) {
    clearTimeout(a.reloj);
    a.reloj = setTimeout(() => sacar(a), ESPERA);
  }

  /* Se puede empujar el aviso para sacarlo antes */
  function permitirArrastre(a) {
    let activo = false, y0 = 0, x0 = 0;

    a.el.addEventListener('pointerdown', (e) => {
      if (a.saliendo) return;
      activo = true;
      y0 = e.clientY; x0 = e.clientX;
      a.el.setPointerCapture(e.pointerId);
      a.el.style.transition = 'none';
      clearTimeout(a.reloj);
    });

    a.el.addEventListener('pointermove', (e) => {
      if (!activo) return;
      const dy = e.clientY - y0;
      const dx = e.clientX - x0;
      a.dy = dy > 0 ? dy : dy * 0.25;      // arrastrar hacia arriba cuesta más
      a.dx = dx * 0.6;
      acomodar();
    });

    const soltar = () => {
      if (!activo) return;
      activo = false;
      a.el.style.transition = '';
      if (a.dy > 42 || Math.abs(a.dx) > 90) { sacar(a); return; }
      a.dy = 0; a.dx = 0;
      acomodar();
      programar(a);
    };
    a.el.addEventListener('pointerup', soltar);
    a.el.addEventListener('pointercancel', soltar);

    a.el.addEventListener('pointerenter', () => clearTimeout(a.reloj));
    a.el.addEventListener('pointerleave', () => { if (!activo) programar(a); });
  }

  function mostrarAviso(texto) {
    if (!capa) return;
    const el = document.createElement('li');
    el.className = 'aviso';
    el.innerHTML = '<span class="aviso__ok">✦</span><span class="aviso__txt"></span>';
    el.querySelector('.aviso__txt').textContent = texto;
    capa.appendChild(el);

    const a = { el, dy: 0, dx: 0, saliendo: false, reloj: null };
    vivos.unshift(a);

    /* Entra desde abajo: primero se ubica fuera, después se suelta */
    el.style.transition = 'none';
    el.style.opacity = '0';
    el.style.transform = 'translate3d(0, 110%, 0) scale(.94)';
    void el.offsetHeight;
    el.style.transition = '';
    acomodar();

    permitirArrastre(a);
    programar(a);

    while (vivos.length > VISIBLES + 1) sacar(vivos[vivos.length - 1]);
  }

  /* ============================================================
     PANEL DEL CARRITO  (estilo Vaul)
     En celular es una hoja que sube desde abajo y se puede bajar
     con el dedo; el fondo se achica un poco mientras está abierta.
     ============================================================ */
  const panel = document.getElementById('cart');
  const app = document.getElementById('app');
  const agarradera = document.getElementById('cart-agarradera');
  const esHoja = () => matchMedia('(max-width: 700px)').matches;

  function fondoAbierto(abierto) {
    /* Los avisos se corren para no quedar debajo del panel */
    document.body.classList.toggle('con-panel', abierto);
    if (!app) return;
    app.classList.toggle('app--atras', abierto && esHoja());
  }

  if (panel && agarradera) {
    let activo = false, y0 = 0, dy = 0, t0 = 0, alto = 0;

    const zonaLibre = (e) => {
      /* Se arrastra desde la agarradera o el encabezado; la lista
         se deja para hacer scroll normal. */
      const cuerpo = panel.querySelector('.cart__body');
      return !cuerpo || !cuerpo.contains(e.target) || cuerpo.scrollTop <= 0;
    };

    panel.addEventListener('pointerdown', (e) => {
      if (!esHoja() || !panel.classList.contains('is-open')) return;
      if (!zonaLibre(e)) return;
      activo = true; y0 = e.clientY; dy = 0; t0 = performance.now();
      alto = panel.offsetHeight;
      panel.classList.add('cart--arrastrando');
    });

    panel.addEventListener('pointermove', (e) => {
      if (!activo) return;
      const d = e.clientY - y0;
      if (d < 0) { dy = d * 0.2; }            // resistencia al tirar para arriba
      else { dy = d; e.preventDefault(); }
      panel.style.transform = `translate3d(0, ${dy}px, 0)`;
      const p = Math.min(1, dy / alto);
      if (app) app.style.setProperty('--retroceso', String(1 - p));
    });

    const soltar = (e) => {
      if (!activo) return;
      activo = false;
      panel.classList.remove('cart--arrastrando');
      panel.style.transform = '';
      if (app) app.style.removeProperty('--retroceso');

      const vel = dy / Math.max(1, performance.now() - t0);   // px por ms
      if (dy > alto * 0.28 || vel > 0.55) {
        const cerrar = document.getElementById('cart-close');
        if (cerrar) cerrar.click();
      }
      dy = 0;
    };
    panel.addEventListener('pointerup', soltar);
    panel.addEventListener('pointercancel', soltar);
  }

  /* ============================================================
     Se expone para que app.js lo use
     ============================================================ */
  window.UI = {
    aviso: mostrarAviso,
    fondoAbierto,
  };
})();
