# 701 PARFUM — Tienda online

Sitio de e-commerce para el emprendimiento de perfumes **@701_parfum**.
Hecho en HTML + CSS + JavaScript puro: **no necesita instalar nada ni compilar**.
Se abre haciendo doble clic en `index.html` y se puede publicar gratis.

---

## 1. Cómo reciben los pedidos

**Los pedidos van a tu WhatsApp: 297 592-5565.** Al tocar "Finalizar pedido" se
abre tu chat con el detalle ya escrito —productos, cantidades, cuáles son por
encargo, subtotal, envío y total— más los campos de nombre, dirección y forma
de pago para que el cliente complete.

En `js/data.js` figura así:

```js
whatsapp: '5492975925565',
```

Es el número en formato internacional: `54` (Argentina) + `9` (celular) + `297`
+ `5925565`. Si alguna vez lo dejás vacío (`''`), los pedidos vuelven solos al
DM de Instagram.

---

## 2. Precios

Están todos en **$ 50.000**, como pediste. Se cambian en `js/data.js`, en la
línea `precios` de cada perfume:

```js
precios: { '100 ml': 50000 },
```

Si algún perfume tiene otro precio, cambiale solo ese número. Si vendés varios
tamaños del mismo, agregá más y aparece un selector en la ficha:

```js
precios: { '50 ml': 35000, '100 ml': 50000 },
```

La moneda está en `$` (pesos). Para pasar a guaraníes, cambiá `moneda: 'ARS'`
por `moneda: 'PYG'` y los precios se muestran como `50.000 Gs.`.

**Envío:** está como "A coordinar". Si querés cobrar un monto fijo, en `CONFIG`
poné `envio: 15000` (por ejemplo), y si querés promo de envío gratis,
`envioGratisDesde: 200000`.

---

## 3. Stock inmediato o por encargo

Cada producto muestra su disponibilidad con un punto de color: **verde** si es
stock inmediato, **dorado** si es por encargo. Aparece en la tarjeta, en la
ficha y también en el mensaje de WhatsApp —al lado de los que hay que encargar
dice "(por encargo)"—, así lo ves de una sin tener que revisar.

En `js/data.js`, cada producto tiene esta línea:

```js
stock: true,    // Stock inmediato: lo tenés ahora, sale ya
stock: false,   // Por encargo: lo traés a pedido
```

**Están los 52 en `true`.** Cambiá a `false` los que en realidad haya que
encargar — es lo único de esto que te queda por revisar.

---

## 4. El panel del dueño

Para no tener que tocar código, hay un panel con formularios:

### El recorrido completo

1. En la tienda, bajá hasta el pie y tocá el botón **Dueño** (tiene un candadito).
2. Te pide la contraseña: **`701parfum`**. Sin ella no se ve nada del panel.
3. Entrás y editás lo que quieras.
4. Para salir, arriba a la izquierda está **Volver a la tienda**.

También podés entrar directo escribiendo **https://701-parfum.vercel.app/panel**

También se entra desde la propia tienda: bajá hasta el final y en el pie hay un
botón con un candadito que dice **Dueño**. Está apagado en gris para que al
cliente no le llame la atención, y se enciende en dorado al pasarle por encima.

Va del lado izquierdo a propósito: en la esquina derecha está el botón flotante
de WhatsApp y se pisaban — el click se lo comía el botón verde.

Si preferís que no se vea, borrá ese bloque de `index.html` (está comentado para
que lo encuentres) y seguí entrando por `/panel`.

**Sobre el borrador:** si te vas del panel con cambios a medio hacer, no se
pierden — quedan guardados en tu navegador y al volver te los reencuentra solos,
avisándote "Retomamos donde habías quedado". Lo único que no pasa solo es la
publicación: eso son los tres pasos de abajo.

Desde ahí podés cambiar precios, editar cualquier perfume, agregar nuevos,
duplicar uno parecido, borrar, marcar "Más vendido" o "Por encargo", ocultar
productos y cambiar tu WhatsApp o la moneda.

### Cómo se publica lo que hacés ahí

La web es **estática**: no tiene servidor ni base de datos. Es a propósito —
así no depende de ningún servicio que se caiga ni que haya que pagar todos los
meses. La contra es que el panel no puede guardar solo en la nube. El circuito
es de tres pasos:

1. **Editás** en el panel. Los cambios quedan guardados en tu navegador aunque
   cierres la pestaña, y la web sigue mostrando lo anterior.
2. **Descargás el archivo** con el botón de arriba: se baja un `data.js`.
3. **Reemplazás** `js/data.js` de la carpeta del proyecto por el que bajaste, y
   corrés:
   ```bash
   cd "/Users/usuario/Desktop/calude/paginas wep/perfumes" && vercel --prod --yes
   ```

Recién ahí lo ve el público.

### Sobre la clave
Es un pestillo, no una cerradura: alguien que sepa mirar el código de la página
puede encontrarla. No es grave — aunque entre, sólo juega con una copia en **su**
navegador. Para cambiar la tienda de verdad hace falta tu cuenta de Vercel.
Si querés cambiarla, está en la primera línea de `js/panel.js` (`const LLAVE`).

El panel está bloqueado para Google en `robots.txt` y con `noindex`.

### La foto, con un botón
En la ficha del producto hay un botón **"Elegir foto…"**. Tomás la foto de tu
computadora o del celular y el panel hace el resto solo:

- la **recorta a 9:16** (el formato de las tarjetas), centrada
- la achica a **506×900** y la pasa a **WebP**, que pesa mucho menos
- le pone el **nombre correcto** a partir del título del perfume
- te la muestra para que veas cómo va a quedar

Después tocás **"Descargar foto lista"** y la guardás en `assets/img/`. Sale ya
con el nombre que corresponde, así que no hay que renombrar nada.

Una foto de celular de 4 MB queda en unos 60 KB, sin que tengas que abrir
ningún editor.

**Por qué hay que guardarla a mano:** ninguna web puede escribir archivos en
carpetas de tu computadora — lo impide el navegador por seguridad, no es una
limitación de este panel.

Mientras la foto no esté en la carpeta, marcá "Ocultar de la web" para que el
producto no aparezca a medias.

---

## 5. Las fotos y el catálogo

**52 perfumes, los 52 con su foto.** No queda ninguno con frasco de relleno.

Las fotos son las que dejaste en `assets/img nuevas/`: las identifiqué una por
una y las puse en el producto que corresponde. Se conservan **en 9:16, sin
recortar**, y la tarjeta tiene esa misma forma, así que entran completas y se
ven grandes. Pesan 63 KB promedio (3,2 MB las 52).

### Seis productos que no estaban
Entre tus fotos había seis perfumes que no figuraban en el catálogo. Los agregué
con marca, familia, notas, duración y precio:

- **Odyssey Go Mango** (Armaf)
- **Art of Universe** (Lattafa Pride) — las notas salieron del librito de la foto
- **Island Cream Macaroon** (1Scents Delights)
- **Asad Bourbon** (Lattafa)
- **Bon Bon** (Armaf Delights)
- **Liquid Brun** (French Avenue)

Revisá que las descripciones y las notas te cierren: las escribí a partir de lo
que se ve en el frasco y la caja.

### Para cambiar o agregar una foto
Guardala en `assets/img/` con el nombre que dice el campo `img` de ese producto
en `js/data.js`. **La extensión da igual** (`.webp`, `.jpg`, `.jpeg`, `.png`):
la web las prueba hasta encontrarla. Lo ideal es 9:16, ~900 px de alto.

Si la foto no está en 9:16 igual entra: se muestra completa y el hueco se llena
con la misma foto ampliada y desenfocada de fondo.

### Si un producto no aparece
Fijate si tiene `oculto: true` en `js/data.js`. Esa línea lo esconde del
catálogo — se usa para los que no tienen foto. Borrala y vuelve a aparecer.
Hoy no hay ninguno oculto.

### La carpeta con los originales
`assets/img nuevas/` tiene tus 52 fotos originales (7 MB). El sitio no las usa
—usa las ya procesadas de `assets/img/`— así que podés borrarla antes de
publicar para que la web pese menos. La dejo por si querés rehacer algo.

### En celular se ven de a dos por fila
Abajo de 560 px de ancho el catálogo pasa a dos columnas. Como la tarjeta queda
angosta (unos 155 px), adentro se achica todo: el nombre, las etiquetas de notas
—se muestran dos en vez de tres— y el precio, y el botón "Agregar" pasa a ocupar
el ancho completo debajo del precio en vez de al costado.

### Al pasar el mouse por un producto
La foto se acerca despacio, un destello cruza el vidrio como la luz en una
vidriera, el nombre pasa a dorado, crece una línea dorada debajo y aparece
"Ver detalle". Sólo en equipos con mouse: en pantalla táctil el efecto quedaría
pegado después de tocar.

---

## 6. Qué hace cada botón

Todos los controles de la página hacen algo. El repaso completo:

| Dónde | Qué hace |
|---|---|
| Logo (arriba y en el pie) | vuelve al inicio de la página |
| Catálogo / Hombre / Mujer / Unisex | filtran el catálogo y bajan hasta él |
| Nosotros / Preguntas | bajan a esa sección |
| Lupa | abre el buscador; filtra mientras escribís |
| Bolsa | abre el carrito |
| Menú (☰) | abre la navegación en celular |
| **El frasco del inicio** | abre la ficha del Veneno |
| **Chip “Veneno · French Avenue”** | lo mismo, con el nombre a la vista |
| **“Scroll”** | baja al catálogo |
| Filtros de categoría | filtran |
| Ordenar | reordena el catálogo |
| Foto del producto / “Ver detalle” | abre la ficha |
| “Agregar” | suma al pedido y avisa |
| En la ficha: tamaños | cambian el precio |
| En el carrito: − / + | cambian la cantidad |
| “Eliminar” | saca el producto |
| “Finalizar pedido” | copia el pedido y abre el chat |
| Preguntas frecuentes | se despliegan |
| Botón flotante | abre el chat |

### Dos errores que estaban rompiendo la página

**1. Ningún botón funcionaba.** La ficha de producto estaba oculta con el
atributo `hidden` de HTML, pero el CSS le fijaba un `display: grid` — y esa
regla le gana al `hidden`. Resultado: la ficha quedaba invisible (transparente)
pero **cubriendo la pantalla entera por encima de todo lo demás**, y se comía
cada click. Se veía todo perfecto y no respondía nada. Lo mismo pasaba con el
cartel de “no encontramos fragancias”, que ocupaba 266 px del catálogo sin
mostrarse. Arreglado con una regla que hace que `hidden` siempre gane.

Esto no se detecta probando con código: un `click()` desde JavaScript atraviesa
las capas invisibles. Sólo aparece clickeando de verdad, o revisando qué
elemento recibe el click en cada punto de la pantalla.

**2. El chip del Veneno chocaba con el “Scroll”.** Al bajar, las capas del hero
se mueven a distinta velocidad y el cursor de scroll terminaba encima del chip.
Ahora el cursor se desvanece apenas empezás a bajar, que es cuando ya no sirve.

**Una cosa más que corregí:** como todos los perfumes valen lo mismo, las opciones
“Menor precio” y “Mayor precio” del selector no hacían absolutamente nada. Ahora
las opciones **se arman solas según el catálogo**: si todos los precios son
iguales no aparecen, y en su lugar está “Marca A–Z”. Si algún día ponés precios
distintos, las de precio vuelven solas.

---

## 7. Cómo funciona el pedido

1. El cliente agrega perfumes al carrito (se guarda solo, aunque cierre la página).
2. Toca **“Finalizar pedido”**.
3. Se copia el pedido completo —productos, cantidades, subtotal, envío, total y
   los campos de nombre / dirección / forma de pago— y se abre tu chat de
   Instagram para que lo pegue. (Con WhatsApp cargado, el mensaje va solo.)
4. Vos confirmás stock, envío y pago por el chat.

No hay pasarela de pago ni base de datos: no cobra comisiones ni tiene costo mensual.

---

## 8. La web publicada

**Está en línea: https://701-parfum.vercel.app**

Ese es el link para poner en la bio de Instagram.

### Para actualizarla
Cada vez que cambies un precio, una foto o agregues un perfume, corré esto y en
unos segundos está arriba:

```bash
cd "/Users/usuario/Desktop/calude/paginas wep/perfumes" && vercel --prod --yes
```

### El comando de la primera vez (ya hecho)

```bash
cd "/Users/usuario/Desktop/calude/paginas wep/perfumes" && vercel --prod
```

La primera vez pregunta tres cosas: si querés crear el proyecto (sí), con qué
nombre (`701-parfum` está bien) y en qué carpeta está el código (Enter, ya
estás parado ahí). Después de eso te devuelve la dirección.

Para actualizar la web más adelante —cambiaste un precio, agregaste un
perfume— es el mismo comando otra vez.

### Qué se sube y qué no

Se suben **4,7 MB** en 127 archivos. Quedan afuera, por el archivo
`.vercelignore`:

- `assets/img nuevas/` — tus 52 fotos originales (7 MB). El sitio usa las ya
  procesadas, subirlas sería peso al pedo.
- `_sin-uso/` — el frasco 3D viejo, guardado por si se quiere volver atrás.
- Este README, que es para vos y no para el visitante.

### Lo que ya quedó preparado

| Qué | Para qué |
|---|---|
| `vercel.json` | Las fotos se guardan un año en el navegador del visitante, así la segunda visita abre al instante. El código se revisa siempre, para que un cambio de precio se vea enseguida. |
| `assets/og.jpg` | La vista previa al compartir el link. Sin esto, pegarlo en tu bio de Instagram o mandarlo por DM mostraba un cuadro vacío. |
| `favicon.ico` · `favicon.svg` · `apple-touch-icon.png` | El ícono de la pestaña y el que queda si alguien guarda la web en la pantalla de inicio del celular. |
| `robots.txt` | Para que Google pueda indexarla. |

### Antes de apretar el botón, revisá

1. **Los precios.** Están todos en $ 50.000. Si alguno cambió, es en `js/data.js`.
2. **La disponibilidad.** Los 52 figuran como stock inmediato. Marcá con
   `stock: false` los que haya que encargar.
3. **Los seis productos nuevos** —Odyssey Go Mango, Art of Universe, Island
   Cream Macaroon, Asad Bourbon, Bon Bon y Liquid Brun—: las descripciones y las
   notas las escribí mirando el frasco y la caja, no la ficha del fabricante.
4. **La dirección final.** Cuando la tengas, agregala en `index.html` donde dice
   `og:url` (hay un comentario que lo marca). Sirve para que la vista previa
   funcione bien en todos lados.

---

## 9. Estructura de archivos

```
perfumes/
├── index.html            → la página entera
├── vercel.json           → configuración del hosting
├── .vercelignore         → lo que NO se sube
├── favicon.ico/.svg      → ícono de la pestaña
├── apple-touch-icon.png  → ícono en el celular
├── robots.txt            → permiso para Google
├── css/styles.css        → todos los estilos
├── js/data.js            → ⭐ productos, precios y configuración (lo que vas a editar)
├── js/app.js             → catálogo, filtros, carrito y pedido
├── js/interacciones.js   → avisos apilados y panel arrastrable
├── js/parallax.js        → parallax del inicio
├── js/agujero.js         → el agujero negro del fondo
├── js/frasco.js          → el frasco que gira con el scroll
├── assets/img/           → las 52 fotos de producto
├── assets/frasco/        → los 60 cuadros del frasco del inicio
├── assets/og.jpg         → vista previa al compartir
├── assets/img nuevas/    → tus originales (no se suben)
└── _sin-uso/             → el frasco 3D viejo (no se sube)
```

## 10. El logotipo del inicio

El "701 Parfum" del inicio no es texto suelto: es un logotipo armado en dos
alturas —el número grande arriba, "Parfum" entre dos filetes finos abajo— para
que se lea como marca y no como una frase.

Todo va en **dorado con degradado metálico**, y cada 8 segundos lo recorre un
**destello** angosto, como el reflejo que cruza una pieza de metal. El oro
quieto se ve chato; el que tiene un reflejo que pasa se ve como metal.

Detrás del texto hay un **halo oscuro** que no se ve pero es el que hace que el
título se lea: el disco de gas del agujero negro pasa justo por ahí y, sin eso,
el dorado del título se confundía con el dorado del gas y las letras
desaparecían.

Para retocarlo, en `css/styles.css`: el tamaño en `.marca__num`, la velocidad
del destello en la animación `brilloMarca`, y la fuerza del halo en
`.parallax__layer-title::before`.

---

## 11. Sobre las animaciones

Tres piezas trabajando juntas, todas por CDN (no hay que instalar nada):

- **GSAP + ScrollTrigger + Lenis** → el parallax del inicio: 4 capas que se mueven
  a distinta velocidad al scrollear (halo → bruma → título → frasco) y el scroll suave.
- **Secuencia de cuadros** (`js/frasco.js`) → el frasco del inicio, que gira
  según cuánto scrolleaste. Sin video, sin audio y sin librerías.
- **WebGL a mano** (`js/agujero.js`) → el agujero negro del fondo. Portado a
  JavaScript puro desde un componente de React: los shaders son GLSL y no
  necesitan React para nada.
- **Sistema de movimiento propio** (`js/interacciones.js` + las variables de
  `css/styles.css`), escrito siguiendo el enfoque de **Emil Kowalski**.

### El sistema de movimiento

Emil Kowalski es el autor de **Sonner** (los avisos) y **Vaul** (los paneles
deslizables), y del curso *Animations on the Web*. Sus librerías son de React,
así que acá no se pueden instalar: lo que está hecho es **portar el
comportamiento y aplicar sus reglas a mano**.

Las reglas, que están como variables de CSS y se usan en toda la web:

| Variable | Valor | Para qué |
|---|---|---|
| `--ease-suave` | `cubic-bezier(.32,.72,0,1)` | La curva de Vaul/Sonner: arranca rápido y frena largo. Paneles y avisos. |
| `--ease-entra` | `cubic-bezier(.16,1,.3,1)` | Lo que aparece. Sin rebote. |
| `--ease-sale` | `cubic-bezier(.4,0,1,1)` | Lo que se va: al revés que lo anterior. |
| `--t-rapido` | `150 ms` | Respuesta al toque (botones). |
| `--t-medio` | `260 ms` | Tarjetas, ficha de producto. |
| `--t-lento` | `420 ms` | Panel del carrito, avisos. |

Lo que cambia en la práctica:

- **Nada usa `linear`.** Una animación lineal se siente mecánica; las curvas de
  salida se sienten físicas.
- **Sólo se animan `transform` y `opacity`**, que no obligan al navegador a
  recalcular la página. Por eso todo va a 60 fps.
- **Todo lo clickeable se hunde** al apretarlo (`scale(.97)`). Es el detalle que
  hace que una web se sienta “de app”.
- **Los avisos se apilan** (estilo Sonner): el nuevo entra desde abajo y empuja a
  los anteriores hacia atrás, más chicos y más transparentes. Se pueden
  **empujar con el dedo** para sacarlos antes, y se pausan si pasás el mouse.
- **El carrito en celular es una hoja** (estilo Vaul): sube desde abajo, tiene
  agarradera, y **se cierra arrastrándola hacia abajo** — si soltás a mitad de
  camino, vuelve. Mientras está abierta, **el fondo se achica** para dar
  profundidad. En pantalla grande sigue siendo el panel lateral de siempre.
- Todo respeta “reducir movimiento” del sistema.

- Si algún día el CDN no carga, el sitio activa solo una versión propia del parallax:
  nunca queda roto. Y si falla el JavaScript, se ve el primer cuadro del frasco como
  imagen fija.
- Si el visitante tiene activado “reducir movimiento” en su sistema, todo se queda quieto.
- Para cambiar la intensidad del parallax, editá los `yPercent` en `js/parallax.js`
  (más alto = esa capa se mueve más).
