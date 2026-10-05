/* =============================================================
   OPINIONES DE CLIENTES  ·  carrusel "coverflow" 3D
   Para sumar una captura: copiá la imagen a assets/clientes/ y
   agregá su nombre acá abajo. Si la lista está vacía, la sección
   no se muestra en la página.
   ============================================================= */
const CLIENTES = [
  'cliente-01.webp',
  'cliente-02.webp',
  'cliente-03.webp',
  'cliente-04.webp',
  'cliente-05.webp',
  'cliente-06.webp',
  'cliente-07.webp',
];

(function () {
  const sec = document.getElementById('clientes');
  const stage = document.getElementById('clientes-escena');
  const visor = document.getElementById('clientes-visor');
  const visorImg = document.getElementById('clientes-visor-img');
  const btnPrev = document.getElementById('clientes-prev');
  const btnNext = document.getElementById('clientes-next');
  const aviso = document.getElementById('clientes-aviso');
  const region = document.getElementById('clientes-carrusel');
  if (!sec || !stage) return;

  /* Mismos valores que el componente original, ajustados a tarjetas verticales */
  const MAX_VISIBLES = 3;      // cuántas se ven a cada lado del centro
  const ESCALA_PASO = 0.15;
  const ESCALA_MIN = 0.4;
  const UMBRAL_DIST = 60;      // px de arrastre para pasar de una a otra
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  let items = [];
  let activo = 0;
  let total = 0;

  /* La separación y la profundidad se adaptan al ancho de la pantalla */
  const medidas = () => (window.innerWidth <= 700
    ? { espacio: 92, profundidad: 150, giro: 42 }
    : { espacio: 190, profundidad: 180, giro: 45 });

  function url(f) { return /^(https?:|\/|assets\/)/.test(f) ? f : 'assets/clientes/' + f; }

  function pintar() {
    const m = medidas();
    items.forEach((el, i) => {
      const off = i - activo;
      const visible = Math.abs(off) <= MAX_VISIBLES;
      const esActivo = off === 0;
      const escala = Math.max(1 - Math.abs(off) * ESCALA_PASO, ESCALA_MIN);
      if (reduce.matches) {
        el.style.transform = `translate(-50%,-50%) translateX(${off * m.espacio}px)`;
        el.style.opacity = esActivo ? 1 : 0;
      } else {
        el.style.transform =
          `translate(-50%,-50%) translateX(${off * m.espacio}px) translateZ(${-Math.abs(off) * m.profundidad}px) ` +
          `rotateY(${-off * m.giro}deg) scale(${escala})`;
        el.style.opacity = visible ? 1 : 0;
      }
      el.style.zIndex = total - Math.abs(off);
      el.style.pointerEvents = visible ? 'auto' : 'none';
      el.classList.toggle('is-activo', esActivo);
      el.setAttribute('aria-hidden', esActivo ? 'false' : 'true');
      el.tabIndex = esActivo ? 0 : -1;
    });
    btnPrev.disabled = activo === 0;
    btnNext.disabled = activo === total - 1;
    aviso.textContent = `Captura ${activo + 1} de ${total}`;
  }

  function ir(n) {
    activo = Math.min(Math.max(n, 0), total - 1);
    pintar();
  }

  function abrirVisor(src) {
    visorImg.src = src;
    if (visor.showModal) visor.showModal(); else visor.setAttribute('open', '');
  }

  /* Se puede llamar de nuevo con otra lista (por ejemplo, para probar) */
  function pintarClientes(archivos) {
    stage.innerHTML = '';
    items = [];
    total = archivos.length;
    sec.hidden = !total;
    document.querySelectorAll('[data-link-clientes]').forEach((a) => { a.hidden = !total; });
    if (!total) return;

    archivos.forEach((f, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cover__item';
      b.setAttribute('aria-label', 'Captura de cliente ' + (i + 1));
      const img = document.createElement('img');
      img.src = url(f); img.alt = 'Historia de un cliente'; img.draggable = false;
      if (i > 2) img.loading = 'lazy';
      b.appendChild(img);
      /* Tocar una de los costados la trae al centro; tocar la del centro la agranda */
      b.addEventListener('click', () => {
        if (i === activo) abrirVisor(url(f)); else ir(i);
      });
      stage.appendChild(b);
      items.push(b);
    });
    activo = Math.floor((total - 1) / 2);   // arranca en el medio: se ven los dos lados
    pintar();
  }

  btnPrev.addEventListener('click', () => ir(activo - 1));
  btnNext.addEventListener('click', () => ir(activo + 1));

  region.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(activo + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(activo - 1); }
  });

  /* Deslizar con el dedo o el mouse */
  let x0 = null, movio = false;
  stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; movio = false; });
  stage.addEventListener('pointermove', (e) => {
    if (x0 !== null && Math.abs(e.clientX - x0) > 8) movio = true;
  });
  window.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > UMBRAL_DIST) ir(activo + (dx < 0 ? 1 : -1));
  });
  /* Si fue un arrastre, que no cuente como toque */
  stage.addEventListener('click', (e) => { if (movio) { e.stopPropagation(); e.preventDefault(); movio = false; } }, true);

  visor.addEventListener('click', () => { visor.close ? visor.close() : visor.removeAttribute('open'); });
  window.addEventListener('resize', () => { if (total) pintar(); });
  reduce.addEventListener?.('change', () => { if (total) pintar(); });

  window.pintarClientes = pintarClientes;
  pintarClientes(CLIENTES);
})();
