/* ============================================================
   701 PARFUM — Lógica de la tienda
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const fmt = (n) => {
    if (CONFIG.moneda === 'ARS') {
      return '$ ' + n.toLocaleString('es-AR');
    }
    return n.toLocaleString('es-PY').replace(/,/g, '.') + ' Gs.';
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const precioDesde = (p) => Math.min(...Object.values(p.precios));
  const tamanos     = (p) => Object.keys(p.precios);

  /* Frasco SVG generado cuando el producto no tiene foto */
  function frasco(p) {
    const [c1, c2] = p.tono;
    const id = 'g_' + p.id;
    return `
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.nombre)}">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
        <linearGradient id="${id}_v" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="rgba(255,255,255,.28)"/>
          <stop offset="45%" stop-color="rgba(255,255,255,.04)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,.30)"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#${id})"/>
      <circle cx="200" cy="196" r="120" fill="rgba(255,255,255,.05)"/>
      <g transform="translate(200 208)">
        <rect x="-16" y="-138" width="32" height="26" rx="4" fill="rgba(255,255,255,.22)"/>
        <rect x="-26" y="-118" width="52" height="26" rx="6" fill="#c9a227"/>
        <rect x="-11" y="-96" width="22" height="16" fill="rgba(255,255,255,.18)"/>
        <rect x="-62" y="-82" width="124" height="164" rx="16"
              fill="rgba(255,255,255,.13)" stroke="rgba(255,255,255,.34)" stroke-width="2"/>
        <rect x="-62" y="-82" width="124" height="164" rx="16" fill="url(#${id}_v)"/>
        <rect x="-46" y="-6" width="92" height="58" rx="6" fill="rgba(0,0,0,.30)"/>
        <text x="0" y="24" text-anchor="middle" font-family="Georgia,serif" font-size="21"
              fill="rgba(255,255,255,.92)" letter-spacing="3">701</text>
        <text x="0" y="42" text-anchor="middle" font-family="Helvetica,Arial" font-size="9"
              fill="rgba(255,255,255,.72)" letter-spacing="3">PARFUM</text>
      </g>
    </svg>`;
  }

  /* Da igual en qué formato guardes la foto: se prueban todos. Así podés
     soltar el archivo como .webp, .jpg, .jpeg o .png sin cambiar nada. */
  const FORMATOS = ['webp', 'jpg', 'jpeg', 'png'];

  /* Rutas a probar para un producto: primero la que figura en data.js y
     después el mismo nombre con los otros formatos, sin repetir ninguno. */
  const rutasPosibles = (p) => {
    const base = p.img.replace(/\.[a-z0-9]+$/i, '');
    const propia = (p.img.split('.').pop() || '').toLowerCase();
    return [p.img].concat(
      FORMATOS.filter((f) => f !== propia).map((f) => base + '.' + f)
    );
  };

  const media = (p) => p.img
    ? `<img src="${esc(p.img)}" alt="${esc(p.nombre)}" loading="lazy" data-pid="${p.id}" data-intento="0">`
    : frasco(p);

  /* Cuando la foto carga, esa misma imagen se usa de fondo desenfocado.
     Se hace acá y no en el marcado por dos motivos: no se pide ningún archivo
     de más (ya está cargada), y se usa el formato que realmente funcionó. */
  document.addEventListener('load', (ev) => {
    const el = ev.target;
    if (el.tagName !== 'IMG' || !el.dataset.pid || !el.currentSrc) return;
    const caja = el.closest('.card__media, .modal__media');
    if (caja) caja.style.setProperty('--foto', `url("${el.currentSrc}")`);
  }, true);

  /* Si la foto no está en ese formato se prueba el siguiente, y si no hay
     ninguna se dibuja el frasco: la página nunca queda con un hueco. */
  document.addEventListener('error', (ev) => {
    const el = ev.target;
    if (el.tagName !== 'IMG' || !el.dataset.pid) return;
    const p = PRODUCTOS.find((x) => x.id === el.dataset.pid);
    if (!p) return;

    const rutas = rutasPosibles(p);
    const intento = parseInt(el.dataset.intento || '0', 10) + 1;
    if (intento < rutas.length) {
      el.dataset.intento = String(intento);
      el.src = rutas[intento];
      return;
    }
    el.outerHTML = frasco(p);
  }, true);

  /* ---------- Canal de contacto ----------
     Si CONFIG.whatsapp tiene un número válido se usa WhatsApp (con el mensaje
     ya escrito). Si está vacío, todo va al DM de Instagram: como Instagram no
     permite prellenar el texto, el pedido se copia al portapapeles. */
  const HAY_WSP = /^\d{8,15}$/.test(String(CONFIG.whatsapp || ''));
  const CANAL = HAY_WSP ? 'WhatsApp' : 'Instagram';

  const contactoURL = (msg) => HAY_WSP
    ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`
    : `https://ig.me/m/${CONFIG.instagram}`;

  function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).catch(() => {});
    }
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  /* ============================================================
     ESTADO
     ============================================================ */
  const LS_KEY = '701parfum_carrito_v1';
  let carrito = [];
  let filtro  = 'todos';
  let busqueda = '';
  let orden   = 'destacados';

  function cargarCarrito() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const data = raw ? JSON.parse(raw) : [];
      // Se descartan items cuyo producto ya no existe en el catálogo
      carrito = Array.isArray(data)
        ? data.filter((i) => PRODUCTOS.some((p) => p.id === i.id && p.precios[i.tamano] != null))
        : [];
    } catch (e) { carrito = []; }
  }
  const guardarCarrito = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(carrito)); } catch (e) {}
  };

  /* ============================================================
     CATÁLOGO
     ============================================================ */
  const grid = $('#grid');

  /* Los productos sin foto llevan `oculto: true` en data.js y no se listan.
     Se los saca acá y no del archivo para no perder precio, notas ni
     descripción: al subir la foto se borra esa línea y vuelven. */
  const visibles = () => PRODUCTOS.filter((p) => !p.oculto);

  function filtrados() {
    const q = busqueda.trim().toLowerCase();
    let lista = visibles().filter((p) => {
      if (filtro !== 'todos' && p.categoria !== filtro) return false;
      if (!q) return true;
      return [p.nombre, p.marca || '', p.familia, p.descripcion, p.categoria, ...p.notas]
        .join(' ').toLowerCase().includes(q);
    });

    const cmp = {
      'precio-asc':  (a, b) => precioDesde(a) - precioDesde(b),
      'precio-desc': (a, b) => precioDesde(b) - precioDesde(a),
      'nombre':      (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
      'marca':       (a, b) => (a.marca || 'zz').localeCompare(b.marca || 'zz', 'es')
                               || a.nombre.localeCompare(b.nombre, 'es'),
      'destacados':  (a, b) => (b.destacado === true) - (a.destacado === true),
    }[orden];

    return lista.slice().sort(cmp);
  }

  function cardHTML(p) {
    const cat = { hombre: 'Hombre', mujer: 'Mujer', unisex: 'Unisex' }[p.categoria] || p.categoria;
    return `
    <article class="card reveal" data-id="${p.id}">
      <div class="card__media">
        ${media(p)}
        ${p.destacado ? '<span class="card__tag">Más vendido</span>' : ''}
        <button class="card__quick" data-ver="${p.id}">Ver detalle</button>
      </div>
      <div class="card__body">
        <span class="card__cat">${esc(cat)}${p.marca ? ' · ' + esc(p.marca) : ''}</span>
        <h3 class="card__name">${esc(p.nombre)}</h3>
        <p class="card__fam">${esc(p.familia)} · ${esc(p.duracion)}</p>
        <div class="card__notas">${p.notas.slice(0, 3).map((n) => `<span class="nota">${esc(n)}</span>`).join('')}</div>
        <p class="card__stock ${p.stock ? 'es-ya' : 'es-encargo'}">
          <i aria-hidden="true"></i>${p.stock ? 'Stock inmediato' : 'Por encargo'}
        </p>
        <div class="card__foot">
          <span class="card__precio"><small>${tamanos(p).length > 1 ? 'Desde' : esc(tamanos(p)[0])}</small><strong>${fmt(precioDesde(p))}</strong></span>
          <button class="card__add" data-add="${p.id}">Agregar</button>
        </div>
      </div>
    </article>`;
  }

  function render() {
    const lista = filtrados();
    grid.innerHTML = lista.map(cardHTML).join('');
    $('#vacio').hidden = lista.length > 0;
    $('#resultado-info').textContent = lista.length
      ? `${lista.length} ${lista.length === 1 ? 'fragancia' : 'fragancias'}${filtro !== 'todos' ? ' en ' + filtro : ''}`
      : '';
    observarReveal();
  }

  /* ============================================================
     CARRITO
     ============================================================ */
  function agregar(id, tamano, cant = 1) {
    const p = PRODUCTOS.find((x) => x.id === id);
    if (!p) return;
    const t = tamano && p.precios[tamano] != null ? tamano : tamanos(p)[0];
    const item = carrito.find((i) => i.id === id && i.tamano === t);
    if (item) item.cant += cant;
    else carrito.push({ id, tamano: t, cant });
    guardarCarrito();
    pintarCarrito();
    toast(`${p.nombre} (${t}) agregado al pedido`);
  }

  function cambiarCant(idx, delta) {
    const item = carrito[idx];
    if (!item) return;
    item.cant += delta;
    if (item.cant <= 0) carrito.splice(idx, 1);
    guardarCarrito();
    pintarCarrito();
  }

  function quitar(idx) {
    carrito.splice(idx, 1);
    guardarCarrito();
    pintarCarrito();
  }

  const subtotal = () => carrito.reduce((acc, i) => {
    const p = PRODUCTOS.find((x) => x.id === i.id);
    return acc + (p ? p.precios[i.tamano] * i.cant : 0);
  }, 0);

  const unidades = () => carrito.reduce((a, i) => a + i.cant, 0);

  /* Devuelve el costo del envío, o null si es "a coordinar" */
  function costoEnvio() {
    if (!carrito.length) return 0;
    if (CONFIG.envio == null) return null;
    if (CONFIG.envioGratisDesde && subtotal() >= CONFIG.envioGratisDesde) return 0;
    return CONFIG.envio;
  }

  const textoEnvio = (env) => env == null ? 'A coordinar' : (env === 0 ? 'Gratis' : fmt(env));

  function pintarCarrito() {
    const n = unidades();
    const badge = $('#cart-count');
    badge.textContent = n;
    badge.classList.toggle('is-zero', n === 0);

    const body = $('#cart-body');
    const foot = $('#cart-foot');

    if (!carrito.length) {
      body.innerHTML = `
        <div class="cart-vacio">
          <div class="cart-vacio__ico">🛍️</div>
          <p>Tu pedido está vacío.<br>Agregá una fragancia para empezar.</p>
          <button class="btn btn--ghost" data-cerrar-carrito>Ver catálogo</button>
        </div>`;
      foot.innerHTML = '';
      return;
    }

    body.innerHTML = carrito.map((i, idx) => {
      const p = PRODUCTOS.find((x) => x.id === i.id);
      return `
      <div class="cart-item">
        <div class="cart-item__media">${media(p)}</div>
        <div>
          <div class="cart-item__name">${esc(p.nombre)}</div>
          <div class="cart-item__size">${esc(i.tamano)}</div>
          <div class="cart-item__row">
            <div class="qty">
              <button data-menos="${idx}" aria-label="Quitar una unidad">−</button>
              <span>${i.cant}</span>
              <button data-mas="${idx}" aria-label="Agregar una unidad">+</button>
            </div>
            <span class="cart-item__precio">${fmt(p.precios[i.tamano] * i.cant)}</span>
          </div>
          <button class="cart-item__del" data-del="${idx}">Eliminar</button>
        </div>
      </div>`;
    }).join('');

    const sub = subtotal();
    const env = costoEnvio();
    const falta = CONFIG.envioGratisDesde - sub;

    foot.innerHTML = `
      <div class="cart-line"><span>Subtotal (${unidades()} art.)</span><span>${fmt(sub)}</span></div>
      <div class="cart-line"><span>Envío</span><span>${textoEnvio(env)}</span></div>
      ${falta > 0 && CONFIG.envioGratisDesde
        ? `<p class="cart-envio-nota">Te faltan ${fmt(falta)} para el envío gratis ✦</p>` : ''}
      <div class="cart-line cart-line--total"><span>Total</span><span>${fmt(sub + (env || 0))}</span></div>
      <button class="btn ${HAY_WSP ? 'btn--wsp' : 'btn--ig'}" id="btn-checkout">Finalizar pedido por ${CANAL}</button>
      <p class="cart-legal">${HAY_WSP
        ? 'Te confirmamos stock, envío y forma de pago por el chat.'
        : 'Copiamos tu pedido y abrimos el chat: pegalo y te confirmamos stock, envío y pago.'}</p>`;
  }

  function mensajePedido() {
    const lineas = carrito.map((i) => {
      const p = PRODUCTOS.find((x) => x.id === i.id);
      const disp = p.stock ? '' : '  (por encargo)';
      return `• ${p.marca ? p.marca + ' ' : ''}${p.nombre} — ${i.tamano} × ${i.cant} = ${fmt(p.precios[i.tamano] * i.cant)}${disp}`;
    });
    const sub = subtotal();
    const env = costoEnvio();
    return [
      `¡Hola ${CONFIG.marca}! Quiero hacer este pedido:`, '',
      ...lineas, '',
      `Subtotal: ${fmt(sub)}`,
      `Envío: ${textoEnvio(env)}`,
      `TOTAL: ${fmt(sub + (env || 0))}`, '',
      'Mis datos:',
      'Nombre: ',
      'Ciudad / dirección: ',
      'Forma de pago: ',
    ].join('\n');
  }

  /* ============================================================
     MODAL DE PRODUCTO
     ============================================================ */
  const modal = $('#modal');
  let modalTamano = null;
  let modalProd = null;

  function abrirModal(id) {
    const p = PRODUCTOS.find((x) => x.id === id);
    if (!p) return;
    modalProd = p;
    modalTamano = tamanos(p)[0];
    pintarModal();
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    document.body.classList.add('no-scroll');
    if (window.__lenis) window.__lenis.stop();
  }

  function pintarModal() {
    const p = modalProd;
    const cat = { hombre: 'Hombre', mujer: 'Mujer', unisex: 'Unisex' }[p.categoria] || p.categoria;
    $('#modal-grid').innerHTML = `
      <div class="modal__media">${media(p)}</div>
      <div class="modal__info">
        <span class="modal__cat">${p.marca ? esc(p.marca) + ' · ' : ''}${esc(cat)} · ${esc(p.familia)}</span>
        <h3 class="modal__nombre" id="modal-nombre">${esc(p.nombre)}</h3>
        <p class="modal__desc">${esc(p.descripcion)}</p>
        <div class="card__notas">${p.notas.map((n) => `<span class="nota">${esc(n)}</span>`).join('')}</div>
        <div class="modal__dato"><span>Duración estimada</span><b>${esc(p.duracion)}</b></div>
        <div class="modal__dato"><span>Disponibilidad</span><b class="${p.stock ? 'stock-ya' : 'stock-encargo'}">${p.stock ? 'Stock inmediato' : 'Por encargo'}</b></div>
        <p class="modal__label">Elegí el tamaño</p>
        <div class="tallas">
          ${tamanos(p).map((t) => `<button class="talla ${t === modalTamano ? 'is-active' : ''}" data-talla="${esc(t)}">${esc(t)}</button>`).join('')}
        </div>
        <div class="modal__precio">${fmt(p.precios[modalTamano])}</div>
        <button class="btn btn--gold btn--block" data-add-modal="${p.id}">Agregar al pedido</button>
      </div>`;
  }

  function cerrarModal() {
    modal.classList.remove('is-open');
    setTimeout(() => { modal.hidden = true; }, 250);
    if (!$('#cart').classList.contains('is-open')) {
      document.body.classList.remove('no-scroll');
      if (window.__lenis) window.__lenis.start();
    }
  }

  /* ============================================================
     UI: carrito, menú, buscador
     ============================================================ */
  const cart = $('#cart');
  const overlay = $('#overlay');

  function abrirCarrito() {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    cart.classList.add('is-open');
    cart.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    if (window.__lenis) window.__lenis.stop();
    if (window.UI) window.UI.fondoAbierto(true);
  }
  function cerrarCarrito() {
    cart.classList.remove('is-open');
    cart.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('is-visible');
    setTimeout(() => { overlay.hidden = true; }, 300);
    document.body.classList.remove('no-scroll');
    if (window.__lenis) window.__lenis.start();
    if (window.UI) window.UI.fondoAbierto(false);
  }

  function toast(msg) {
    if (window.UI && window.UI.aviso) window.UI.aviso(msg);
  }

  /* Animación al entrar en viewport */
  let io;
  function observarReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach((el) => el.classList.add('is-in'));
      return;
    }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -60px 0px' });
    }
    $$('.reveal:not(.is-in)').forEach((el) => io.observe(el));
  }

  /* ============================================================
     EVENTOS
     ============================================================ */
  function initEventos() {
    /* Delegación global de clicks */
    document.addEventListener('click', (ev) => {
      const t = ev.target;

      const add = t.closest('[data-add]');
      if (add) { agregar(add.dataset.add); return; }

      const ver = t.closest('[data-ver]');
      if (ver) {
        if (PRODUCTOS.some((p) => p.id === ver.dataset.ver)) abrirModal(ver.dataset.ver);
        return;
      }

      const cardMedia = t.closest('.card__media');
      if (cardMedia) { abrirModal(cardMedia.closest('.card').dataset.id); return; }

      const talla = t.closest('[data-talla]');
      if (talla) { modalTamano = talla.dataset.talla; pintarModal(); return; }

      const addModal = t.closest('[data-add-modal]');
      if (addModal) { agregar(addModal.dataset.addModal, modalTamano); cerrarModal(); abrirCarrito(); return; }

      const menos = t.closest('[data-menos]');
      if (menos) { cambiarCant(+menos.dataset.menos, -1); return; }

      const mas = t.closest('[data-mas]');
      if (mas) { cambiarCant(+mas.dataset.mas, 1); return; }

      const del = t.closest('[data-del]');
      if (del) { quitar(+del.dataset.del); return; }

      if (t.closest('[data-cerrar-carrito]')) { cerrarCarrito(); return; }

      if (t.closest('#btn-checkout')) {
        if (!carrito.length) return;
        const pedido = mensajePedido();
        if (HAY_WSP) {
          window.open(contactoURL(pedido), '_blank', 'noopener');
        } else {
          copiar(pedido).then(() => {
            toast('Pedido copiado ✦ pegalo en el chat de Instagram');
            window.open(contactoURL(pedido), '_blank', 'noopener');
          });
        }
        return;
      }

      /* Filtros desde el nav / footer */
      const navCat = t.closest('[data-cat]');
      if (navCat && !navCat.classList.contains('chip')) {
        filtro = navCat.dataset.cat;
        sincronizarChips();
        render();
        cerrarMenu();
        return;
      }

      const chip = t.closest('.chip');
      if (chip) {
        filtro = chip.dataset.cat;
        sincronizarChips();
        render();
        return;
      }
    });

    /* Carrito */
    $('#btn-carrito').addEventListener('click', abrirCarrito);
    $('#cart-close').addEventListener('click', cerrarCarrito);
    overlay.addEventListener('click', cerrarCarrito);

    /* Modal */
    $('#modal-close').addEventListener('click', cerrarModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!modal.hidden) cerrarModal();
      else if (cart.classList.contains('is-open')) cerrarCarrito();
    });

    /* Orden */
    $('#orden').addEventListener('change', (e) => { orden = e.target.value; render(); });

    /* Buscador */
    const sb = $('#searchbar');
    const input = $('#input-buscar');
    $('#btn-buscar').addEventListener('click', () => {
      sb.hidden = !sb.hidden;
      if (!sb.hidden) input.focus();
    });
    let debounce;
    input.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        busqueda = e.target.value;
        render();
        if (busqueda) document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
      }, 220);
    });

    /* Limpiar filtros */
    $('#btn-limpiar').addEventListener('click', () => {
      filtro = 'todos'; busqueda = ''; input.value = '';
      sincronizarChips(); render();
    });

    /* Menú móvil */
    $('#btn-menu').addEventListener('click', () => {
      $('#nav').classList.toggle('is-open');
      $('#btn-menu').classList.toggle('is-open');
    });
    $$('#nav a').forEach((a) => a.addEventListener('click', cerrarMenu));

    /* Header al hacer scroll, y el cursor de "scroll" que se retira */
    window.addEventListener('scroll', () => {
      $('#header').classList.toggle('is-scrolled', window.scrollY > 20);
      document.body.classList.toggle('ya-scrolleo', window.scrollY > 40);
    }, { passive: true });
  }

  function cerrarMenu() {
    $('#nav').classList.remove('is-open');
    $('#btn-menu').classList.remove('is-open');
  }

  function sincronizarChips() {
    $$('.chip').forEach((c) => c.classList.toggle('is-active', c.dataset.cat === filtro));
  }

  /* ============================================================
     ARRANQUE
     ============================================================ */
  /* Las opciones de orden se arman según lo que hay: si todos los perfumes
     valen lo mismo, ordenar por precio no haría nada, así que no se ofrece. */
  function armarOrden() {
    const sel = $('#orden');
    if (!sel) return;
    const distintos = new Set(PRODUCTOS.map((p) => precioDesde(p))).size;
    const opciones = [
      ['destacados', 'Destacados'],
      ['nombre', 'Nombre A–Z'],
      ['marca', 'Marca A–Z'],
    ];
    if (distintos > 1) {
      opciones.push(['precio-asc', 'Menor precio'], ['precio-desc', 'Mayor precio']);
    }
    sel.innerHTML = opciones
      .map(([v, t]) => `<option value="${v}">${t}</option>`)
      .join('');
    sel.value = orden;
  }

  /* Alto real de la barra superior + la cabecera. El hero se corre esa
     cantidad hacia arriba para ocupar la pantalla entera desde el principio. */
  function medirTope() {
    const barra = document.querySelector('.topbar');
    const cab = $('#header');
    const alto = (barra ? barra.offsetHeight : 0) + (cab ? cab.offsetHeight : 0);
    if (alto > 0) document.documentElement.style.setProperty('--tope', alto + 'px');
  }

  function initTextos() {
    document.title = `${CONFIG.marca} — ${CONFIG.slogan}`;
    $('#year').textContent = new Date().getFullYear();
    /* El número se cuenta solo: no queda desactualizado al sumar productos */
    const stat = $('#stat-total');
    if (stat) stat.textContent = visibles().length;
    $('#footer-slogan').textContent = CONFIG.slogan;
    $('#footer-ciudad').textContent = CONFIG.ciudad;
    /* Barra superior: la promo de envío gratis solo si está configurada */
    const promo = $('#tb-promo');
    if (CONFIG.envioGratisDesde) {
      $('#tb-envio-gratis').textContent = fmt(CONFIG.envioGratisDesde);
    } else if (promo) {
      promo.textContent = 'Consultanos por stock y envíos';
    }
    $('#footer-ig').textContent = '@' + CONFIG.instagram;
    $('#footer-ig').href = `https://www.instagram.com/${CONFIG.instagram}/`;
    $('#footer-ig2').textContent = '@' + CONFIG.instagramAlt;
    $('#footer-ig2').href = `https://www.instagram.com/${CONFIG.instagramAlt}/`;

    const saludo = contactoURL(`¡Hola ${CONFIG.marca}! Quiero consultar por sus fragancias 🌿`);
    ['#hero-wsp', '#nos-wsp', '#cta-wsp', '#footer-wsp', '#fab-wsp'].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      el.href = saludo;
      el.target = '_blank';
      el.rel = 'noopener';
    });

    /* Los textos y el botón flotante se adaptan al canal activo */
    if (!HAY_WSP) {
      $('#hero-wsp').textContent = 'Consultar por Instagram';
      $('#nos-wsp').textContent = 'Escribinos por Instagram';
      $('#footer-wsp').textContent = 'Instagram';
      const fab = $('#fab-wsp');
      fab.classList.add('fab--ig');
      fab.setAttribute('aria-label', 'Escribinos por Instagram');
      fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.5"/>' +
        '<circle cx="12" cy="12" r="4.2"/>' +
        '<circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/></svg>';
      $$('#faq details p').forEach((p) => {
        p.innerHTML = p.innerHTML.replace(/WhatsApp/g, 'Instagram');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTextos();
    medirTope();
    addEventListener('resize', medirTope);
    armarOrden();
    cargarCarrito();
    render();
    pintarCarrito();
    initEventos();
    $$('.beneficio, .sec-head, .nosotros__txt, .nosotros__stats, .faq__list').forEach((el) => el.classList.add('reveal'));
    observarReveal();
  });
})();
