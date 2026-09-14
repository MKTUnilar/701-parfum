/* ============================================================
   701 PARFUM — Hero parallax
   Usa GSAP + ScrollTrigger + Lenis si están disponibles (CDN).
   Si el CDN no carga, cae a un parallax propio con requestAnimationFrame,
   así la página nunca queda rota ni sin animación.
   ============================================================ */
(function () {
  'use strict';

  const root = document.querySelector('.parallax');
  if (!root) return;

  const header  = root.querySelector('.parallax__header');
  const trigger = root.querySelector('[data-parallax-layers]');
  if (!header || !trigger) return;

  /* Desplazamiento final de cada capa, en % de su propia altura.
     Más alto = la capa "se hunde" más rápido (queda al fondo). */
  const LAYERS = [
    { layer: '3', yPercent: 40 },
    { layer: '4', yPercent: 10 },
  ];

  const nodos = LAYERS.map((l) => ({
    yPercent: l.yPercent,
    els: Array.from(trigger.querySelectorAll(`[data-parallax-layer="${l.layer}"]`)),
  }));

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Versión GSAP ---------- */
  function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: header,
        start: '0% 0%',   // el tope del bloque toca el tope del viewport
        end: '100% 0%',   // hasta que su base toca el tope del viewport
        scrub: 0,
      },
    });

    nodos.forEach((n, i) => {
      tl.to(n.els, { yPercent: n.yPercent, ease: 'none' }, i === 0 ? undefined : '<');
    });

    initLenis();
  }

  /* ---------- Scroll suave (Lenis) ---------- */
  function initLenis() {
    if (!window.Lenis) return;

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 });
    window.__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    document.documentElement.style.scrollBehavior = 'auto';

    /* Los enlaces internos pasan por Lenis para que el scroll sea suave */
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (href === '#') { e.preventDefault(); lenis.scrollTo(0); return; }
      const destino = document.querySelector(href);
      if (destino) { e.preventDefault(); lenis.scrollTo(destino, { offset: -70 }); }
    });
  }

  /* ---------- Fallback sin librerías ---------- */
  function initFallback() {
    let ticking = false;

    function pintar() {
      const rect = header.getBoundingClientRect();
      const recorrido = rect.height - window.innerHeight;
      const avance = Math.min(1, Math.max(0, -rect.top / (recorrido || 1)));

      nodos.forEach((n) => {
        n.els.forEach((el) => {
          el.style.transform = `translate3d(0, ${avance * n.yPercent}%, 0)`;
        });
      });
      ticking = false;
    }

    function alScrollear() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(pintar);
    }

    window.addEventListener('scroll', alScrollear, { passive: true });
    window.addEventListener('resize', alScrollear);
    pintar();
  }

  /* ---------- El puntero mueve las capas ----------
     Cada capa se corre distinto según su profundidad, así el hero deja de
     ser un fondo plano y se siente como una escena con volumen. */
  function initPuntero() {
    const piezas = [
      { el: root.querySelector('.marca'),             amp: 9 },
      { el: root.querySelector('.parallax__sub'),     amp: 6 },
      { el: root.querySelector('.hero__eyebrow'),     amp: 4 },
    ].filter((p) => p.el);

    let destX = 0, destY = 0, x = 0, y = 0, animando = false;

    function pintar() {
      x += (destX - x) * 0.06;
      y += (destY - y) * 0.06;
      piezas.forEach((p) => {
        p.el.style.transform = `translate3d(${(-x * p.amp).toFixed(2)}px, ${(-y * p.amp).toFixed(2)}px, 0)`;
      });
      if (Math.abs(destX - x) > 0.001 || Math.abs(destY - y) > 0.001) requestAnimationFrame(pintar);
      else animando = false;
    }

    window.addEventListener('pointermove', (e) => {
      destX = (e.clientX / window.innerWidth) * 2 - 1;
      destY = (e.clientY / window.innerHeight) * 2 - 1;
      if (!animando) { animando = true; requestAnimationFrame(pintar); }
    }, { passive: true });
  }

  /* ---------- Arranque ---------- */
  window.addEventListener('load', () => {
    if (reduce) return;                       // respeta "reducir movimiento"
    if (window.gsap && window.ScrollTrigger) initGSAP();
    else initFallback();
    if (window.matchMedia('(pointer: fine)').matches) initPuntero();
  });
})();
