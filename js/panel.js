/* ============================================================
   701 PARFUM — Panel del dueño
   Edita el catálogo con formularios y genera el archivo
   js/data.js actualizado, listo para publicar.

   La web es estática: no hay servidor ni base de datos donde
   guardar. Por eso el panel trabaja en tu navegador y el paso
   final es descargar el archivo y publicarlo. Es a propósito:
   así la tienda no depende de ningún servicio que se caiga ni
   que haya que pagar.
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ============================================================
     LLAVE DE ENTRADA
     Ojo: esto es un pestillo, no una cerradura. Sirve para que
     nadie entre de casualidad, pero alguien que sepa mirar el
     código de la página la puede ver. No importa: aunque entre,
     sólo puede jugar con una copia en SU navegador — para
     cambiar la tienda de verdad hace falta tu cuenta de Vercel.
     Cambiala por la que quieras.
     ============================================================ */
  const LLAVE = '701parfum';

  const guardado = {
    leer: (k, x) => { try { return JSON.parse(localStorage.getItem(k)) ?? x; } catch (e) { return x; } },
    escribir: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  const CLAVE_BORRADOR = '701_panel_borrador';

  let productos = [];
  let config = {};
  let editando = null;      // índice del producto abierto, o 'nuevo'
  let filtro = '';
  let hayCambios = false;

  /* ============================================================
     ARRANQUE
     ============================================================ */
  function entrar() {
    const borrador = guardado.leer(CLAVE_BORRADOR, null);
    if (borrador && borrador.productos) {
      productos = borrador.productos;
      config = borrador.config;
      hayCambios = true;
      aviso('Retomamos donde habías quedado. Si querés empezar de cero, tocá "Descartar cambios".', 'ojo');
    } else {
      productos = JSON.parse(JSON.stringify(PRODUCTOS));
      config = JSON.parse(JSON.stringify(CONFIG));
    }
    $('#puerta').hidden = true;
    $('#panel').hidden = false;
    pintarConfig();
    pintarLista();
    marcarEstado();
  }

  $('#form-llave').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#llave').value.trim() === LLAVE) {
      sessionStorage.setItem('701_panel_ok', '1');
      entrar();
    } else {
      $('#error-llave').textContent = 'Esa no es la clave.';
      $('#llave').select();
    }
  });

  if (sessionStorage.getItem('701_panel_ok') === '1') entrar();

  /* ============================================================
     LISTA DE PRODUCTOS
     ============================================================ */
  function pintarLista() {
    const q = filtro.trim().toLowerCase();
    const lista = productos
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => !q || (p.nombre + ' ' + (p.marca || '') + ' ' + p.categoria).toLowerCase().includes(q));

    $('#cuenta').textContent = productos.length + ' productos' +
      (q ? ' · ' + lista.length + ' coinciden' : '');

    $('#lista').innerHTML = lista.map(({ p, i }) => `
      <li class="fila ${p.oculto ? 'esta-oculto' : ''}">
        <div class="fila__foto">${p.img
          ? `<img src="../${p.img}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'sin-foto',textContent:'sin foto'}))">`
          : '<span class="sin-foto">sin foto</span>'}</div>
        <div class="fila__datos">
          <strong>${esc(p.nombre)}</strong>
          <span>${esc(p.marca || '—')} · ${esc(p.categoria)} · ${esc(Object.keys(p.precios)[0])} · ${fmtPrecio(Object.values(p.precios)[0])}</span>
          <span class="fila__marcas">
            ${p.destacado ? '<i class="m m-oro">Más vendido</i>' : ''}
            ${p.stock ? '<i class="m m-verde">Stock inmediato</i>' : '<i class="m m-oro">Por encargo</i>'}
            ${p.oculto ? '<i class="m m-gris">Oculto</i>' : ''}
          </span>
        </div>
        <div class="fila__botones">
          <button data-editar="${i}">Editar</button>
          <button data-duplicar="${i}" title="Crear uno igual para modificar">Duplicar</button>
          <button data-borrar="${i}" class="peligro">Borrar</button>
        </div>
      </li>`).join('') || '<li class="vacio">No hay productos con ese nombre.</li>';
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fmtPrecio = (n) => config.moneda === 'PYG'
    ? n.toLocaleString('es-PY').replace(/,/g, '.') + ' Gs.'
    : '$ ' + n.toLocaleString('es-AR');

  /* ============================================================
     FORMULARIO DE UN PRODUCTO
     ============================================================ */
  const VACIO = {
    id: '', nombre: '', marca: '', categoria: 'hombre', familia: '',
    descripcion: '', notas: [], duracion: '8–10 h', precios: { '100 ml': 50000 },
    img: '', tono: ['#2a2a30', '#c9a227'], destacado: false, stock: true,
  };

  function abrirFicha(i) {
    editando = i;
    const p = i === 'nuevo' ? JSON.parse(JSON.stringify(VACIO)) : productos[i];
    const tam = Object.keys(p.precios);

    $('#ficha-titulo').textContent = i === 'nuevo' ? 'Producto nuevo' : 'Editando: ' + p.nombre;
    $('#f-nombre').value = p.nombre;
    $('#f-marca').value = p.marca || '';
    $('#f-categoria').value = p.categoria;
    $('#f-familia').value = p.familia;
    $('#f-descripcion').value = p.descripcion;
    $('#f-notas').value = (p.notas || []).join(', ');
    $('#f-duracion').value = p.duracion;
    $('#f-tamano').value = tam[0] || '100 ml';
    $('#f-precio').value = p.precios[tam[0]] ?? 50000;
    $('#f-img').value = p.img || '';
    $('#f-destacado').checked = !!p.destacado;
    $('#f-stock').value = p.stock ? 'si' : 'no';
    $('#f-oculto').checked = !!p.oculto;
    $('#f-tono1').value = (p.tono || [])[0] || '#2a2a30';
    $('#f-tono2').value = (p.tono || [])[1] || '#c9a227';

    limpiarFotoPreparada();
    verFoto();
    $('#ficha').hidden = false;
    $('#f-nombre').focus();
  }

  function cerrarFicha() {
    limpiarFotoPreparada();
    $('#ficha').hidden = true;
    editando = null;
  }

  /* El nombre sugiere el nombre de archivo de la foto */
  function sugerirArchivo(nombre) {
    return 'assets/img/' + nombre.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.webp';
  }

  function verFoto() {
    if (fotoLista) return;                 // ya se está mostrando la recién preparada
    const ruta = $('#f-img').value.trim();
    const caja = $('#f-vista');
    if (!ruta) { caja.innerHTML = '<span class="sin-foto">sin foto</span>'; return; }
    caja.innerHTML = `<img src="../${ruta}" alt=""
      onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'sin-foto',textContent:'todavía no está el archivo'}))">`;
  }

  /* ============================================================
     ELEGIR UNA FOTO DEL DISPOSITIVO
     El navegador no puede escribir en la carpeta del proyecto —ninguna
     web puede—, así que lo que hace acá es preparar la foto: la recorta
     a 9:16, la achica a 506x900 y la convierte a WebP, igual que las 52
     que ya están. Después te la deja descargar con el nombre exacto que
     tiene que llevar, y vos la arrastrás a assets/img/.
     ============================================================ */
  const FOTO_ANCHO = 506, FOTO_ALTO = 900;   // 9:16, lo que usa la tienda
  let fotoLista = null;                      // {blob, nombre, url}

  function limpiarFotoPreparada() {
    if (fotoLista && fotoLista.url) URL.revokeObjectURL(fotoLista.url);
    fotoLista = null;
    $('#btn-bajar-foto').hidden = true;
    $('#f-instruccion').hidden = true;
    $('#f-estado').textContent =
      'Elegí una foto de tu computadora o celular. La recorto y la optimizo sola, y te la dejo lista para guardar.';
  }

  $('#btn-elegir').addEventListener('click', () => $('#f-archivo').click());

  $('#f-archivo').addEventListener('change', (e) => {
    const archivo = e.target.files && e.target.files[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      $('#f-estado').textContent = 'Ese archivo no es una imagen.';
      return;
    }
    $('#f-estado').textContent = 'Preparando la foto…';
    prepararFoto(archivo);
    e.target.value = '';   // permite volver a elegir la misma
  });

  function prepararFoto(archivo) {
    const img = new Image();
    img.onload = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = FOTO_ANCHO;
      lienzo.height = FOTO_ALTO;
      const cx = lienzo.getContext('2d');

      /* Recorte centrado a 9:16: se queda con el centro de la foto en vez
         de deformarla. Si la foto ya viene vertical, casi no recorta. */
      const escala = Math.max(FOTO_ANCHO / img.width, FOTO_ALTO / img.height);
      const w = img.width * escala, h = img.height * escala;
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, (FOTO_ANCHO - w) / 2, (FOTO_ALTO - h) / 2, w, h);

      const nombreArchivo = ($('#f-img').value.trim() ||
        sugerirArchivo($('#f-nombre').value || 'perfume'))
        .replace(/\.[a-z0-9]+$/i, '') + '.webp';

      lienzo.toBlob((blob) => {
        if (!blob) { $('#f-estado').textContent = 'No se pudo preparar la foto.'; return; }
        limpiarFotoPreparada();
        fotoLista = {
          blob,
          nombre: nombreArchivo.split('/').pop(),
          url: URL.createObjectURL(blob),
        };
        $('#f-img').value = nombreArchivo;
        $('#f-vista').innerHTML = '<img src="' + fotoLista.url + '" alt="">';
        $('#f-estado').textContent =
          'Lista: ' + FOTO_ANCHO + '×' + FOTO_ALTO + ', ' + Math.round(blob.size / 1024) + ' KB.';
        $('#btn-bajar-foto').hidden = false;
        $('#f-instruccion').hidden = false;
        $('#f-instruccion').innerHTML =
          'Descargala y guardala en <code>assets/img/</code> con el nombre <b>' +
          esc(fotoLista.nombre) + '</b>. Sale ya con ese nombre.';
      }, 'image/webp', 0.84);
    };
    img.onerror = () => { $('#f-estado').textContent = 'No pude abrir esa imagen.'; };
    img.src = URL.createObjectURL(archivo);
  }

  $('#btn-bajar-foto').addEventListener('click', () => {
    if (!fotoLista) return;
    const a = document.createElement('a');
    a.href = fotoLista.url;
    a.download = fotoLista.nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    aviso('Foto descargada. Guardala en assets/img/ de la carpeta del proyecto.', 'ok');
  });

  $('#f-img').addEventListener('input', verFoto);
  $('#f-nombre').addEventListener('input', () => {
    if (editando === 'nuevo' && !$('#f-img').value.trim()) {
      $('#f-img').value = sugerirArchivo($('#f-nombre').value);
      verFoto();
    }
  });
  $('#btn-sugerir').addEventListener('click', () => {
    $('#f-img').value = sugerirArchivo($('#f-nombre').value);
    verFoto();
  });

  $('#form-ficha').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = $('#f-nombre').value.trim();
    if (!nombre) return;

    const precio = parseInt($('#f-precio').value, 10);
    if (!Number.isFinite(precio) || precio < 0) { alert('El precio tiene que ser un número.'); return; }

    const base = editando === 'nuevo' ? {} : productos[editando];
    let id = base.id || nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (editando === 'nuevo') {
      let n = 2, orig = id;
      while (productos.some((p) => p.id === id)) id = orig + '-' + n++;
    }

    const nuevo = {
      id,
      nombre,
      marca: $('#f-marca').value.trim(),
      categoria: $('#f-categoria').value,
      familia: $('#f-familia').value.trim(),
      descripcion: $('#f-descripcion').value.trim(),
      notas: $('#f-notas').value.split(',').map((s) => s.trim()).filter(Boolean),
      duracion: $('#f-duracion').value.trim(),
      precios: { [$('#f-tamano').value.trim() || '100 ml']: precio },
      img: $('#f-img').value.trim(),
      tono: [$('#f-tono1').value, $('#f-tono2').value],
      destacado: $('#f-destacado').checked,
      stock: $('#f-stock').value === 'si',
    };
    if ($('#f-oculto').checked) nuevo.oculto = true;

    if (editando === 'nuevo') productos.push(nuevo);
    else productos[editando] = nuevo;

    cambio();
    cerrarFicha();
    pintarLista();
    aviso(editando === 'nuevo' ? 'Producto agregado.' : 'Cambios guardados en el borrador.', 'ok');
  });

  /* ============================================================
     CONFIGURACIÓN GENERAL
     ============================================================ */
  function pintarConfig() {
    $('#c-whatsapp').value = config.whatsapp || '';
    $('#c-instagram').value = config.instagram || '';
    $('#c-moneda').value = config.moneda || 'ARS';
    $('#c-envio').value = config.envio == null ? '' : config.envio;
    $('#c-slogan').value = config.slogan || '';
  }

  $('#form-config').addEventListener('submit', (e) => {
    e.preventDefault();
    config.whatsapp = $('#c-whatsapp').value.replace(/[^0-9]/g, '');
    config.instagram = $('#c-instagram').value.trim().replace(/^@/, '');
    config.moneda = $('#c-moneda').value;
    const env = $('#c-envio').value.trim();
    config.envio = env === '' ? null : parseInt(env, 10);
    config.slogan = $('#c-slogan').value.trim();
    cambio();
    pintarLista();
    aviso('Configuración actualizada en el borrador.', 'ok');
  });

  /* ============================================================
     GENERAR EL ARCHIVO
     ============================================================ */
  const txt = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

  function generarArchivo() {
    const cab = `/* =============================================================
   701 PARFUM — Configuración y catálogo
   Generado desde el panel el ${new Date().toLocaleString('es-AR')}.
   Se puede editar a mano igual: es un archivo de texto común.
   ============================================================= */

const CONFIG = {
  marca: ${txt(config.marca)},
  slogan: ${txt(config.slogan)},
  instagram: ${txt(config.instagram)},
  instagramAlt: ${txt(config.instagramAlt || '')},

  // WhatsApp con código de país, sin +, sin espacios ni guiones.
  // Vacío ('') = los pedidos van al DM de Instagram.
  whatsapp: ${txt(config.whatsapp || '')},

  moneda: ${txt(config.moneda)},            // pesos argentinos
  envio: ${config.envio == null ? 'null' : config.envio},              // null = "a coordinar"
  envioGratisDesde: ${config.envioGratisDesde || 0},

  email: ${txt(config.email || '')},
  ciudad: ${txt(config.ciudad || '')},
};

/* -------------------------------------------------------------
   CATÁLOGO
   categoria: 'hombre' | 'mujer' | 'unisex'
   stock: true = "Stock inmediato" · false = "Por encargo"
   oculto: true = no aparece en la web (por ejemplo, si falta la foto)
   ------------------------------------------------------------- */
const PRODUCTOS = [
`;

    const cuerpo = productos.map((p) => {
      const precios = Object.entries(p.precios)
        .map(([k, v]) => `${txt(k)}: ${v}`).join(', ');
      return `  {
    id: ${txt(p.id)},
    nombre: ${txt(p.nombre)},
    marca: ${txt(p.marca || '')},
    categoria: ${txt(p.categoria)},
    familia: ${txt(p.familia)},
    descripcion: ${txt(p.descripcion)},
    notas: [${(p.notas || []).map(txt).join(', ')}],
    duracion: ${txt(p.duracion)},
    precios: { ${precios} },
    img: ${txt(p.img || '')},
    tono: [${(p.tono || []).map(txt).join(', ')}],
    destacado: ${!!p.destacado},
    stock: ${!!p.stock},${p.oculto ? '\n    oculto: true,' : ''}
  },`;
    }).join('\n');

    return cab + cuerpo + '\n];\n';
  }

  function descargar() {
    const texto = generarArchivo();

    /* Control antes de dejar bajar el archivo: si tiene un error de
       sintaxis, la tienda entera deja de cargar. Mejor avisar acá. */
    try {
      new Function(texto + '\nreturn [CONFIG, PRODUCTOS];')();
    } catch (err) {
      alert('El archivo salió con un error y no lo voy a dejar descargar,\n' +
            'porque rompería la tienda:\n\n' + err.message);
      return;
    }

    const blob = new Blob([texto], { type: 'text/javascript;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    aviso('Archivo descargado. Ahora seguí los tres pasos de abajo.', 'ok');
  }

  /* ============================================================
     VARIOS
     ============================================================ */
  function cambio() {
    hayCambios = true;
    guardado.escribir(CLAVE_BORRADOR, { productos, config });
    marcarEstado();
  }

  function marcarEstado() {
    $('#estado').textContent = hayCambios
      ? 'Tenés cambios sin publicar'
      : 'Sin cambios';
    $('#estado').className = hayCambios ? 'estado con-cambios' : 'estado';
    $('#btn-descargar').disabled = false;
  }

  let relojAviso;
  function aviso(texto, tipo) {
    const el = $('#aviso');
    el.textContent = texto;
    el.className = 'aviso visible ' + (tipo || '');
    clearTimeout(relojAviso);
    relojAviso = setTimeout(() => { el.className = 'aviso'; }, 5000);
  }

  document.addEventListener('click', (e) => {
    const ed = e.target.closest('[data-editar]');
    if (ed) return abrirFicha(+ed.dataset.editar);

    const du = e.target.closest('[data-duplicar]');
    if (du) {
      const copia = JSON.parse(JSON.stringify(productos[+du.dataset.duplicar]));
      copia.nombre += ' (copia)';
      copia.id = '';
      productos.push(copia);
      editando = productos.length - 1;
      productos[editando].id = copia.nombre.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      cambio(); pintarLista(); abrirFicha(editando);
      return;
    }

    const bo = e.target.closest('[data-borrar]');
    if (bo) {
      const i = +bo.dataset.borrar;
      if (confirm('¿Borrar "' + productos[i].nombre + '" del catálogo?\n\nSe puede deshacer descartando los cambios, mientras no publiques.')) {
        productos.splice(i, 1);
        cambio(); pintarLista();
        aviso('Producto borrado del borrador.', 'ojo');
      }
      return;
    }
  });

  $('#btn-nuevo').addEventListener('click', () => abrirFicha('nuevo'));
  $('#btn-cerrar-ficha').addEventListener('click', cerrarFicha);
  $('#ficha').addEventListener('click', (e) => { if (e.target.id === 'ficha') cerrarFicha(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#ficha').hidden) cerrarFicha(); });

  $('#buscar').addEventListener('input', (e) => { filtro = e.target.value; pintarLista(); });
  $('#btn-descargar').addEventListener('click', descargar);

  $('#btn-descartar').addEventListener('click', () => {
    if (!confirm('¿Descartar todos los cambios y volver a lo que está publicado?')) return;
    localStorage.removeItem(CLAVE_BORRADOR);
    productos = JSON.parse(JSON.stringify(PRODUCTOS));
    config = JSON.parse(JSON.stringify(CONFIG));
    hayCambios = false;
    pintarConfig(); pintarLista(); marcarEstado();
    aviso('Listo, volvimos a la versión publicada.', 'ojo');
  });

  /* No se avisa al salir: el borrador queda guardado en este navegador y al
     volver al panel se retoma solo. Lo que sí importa —que todavía no se
     publicó— lo dice el cartel "Tenés cambios sin publicar" de la barra. */
})();
