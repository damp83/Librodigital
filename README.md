# Aula de Matemáticas Manipulativas

Aula virtual estática con los cuadernos, fichas, presentaciones y juegos de matemáticas
manipulativas con regletas Cuisenaire (metodología OAOA y J. A. Fernández Bravo),
de Educación Infantil 3 años a 2.º de Primaria.

**Web:** https://damp83.github.io/Librodigital/
**Autor:** Diego Alberto Moya · **Licencia:** CC BY-NC-SA 4.0

## Añadir un material nuevo

1. En GitHub, entra en la carpeta `subir/` y después en la del curso:
   `3-anios`, `4-anios`, `5-anios`, `1-primaria`, `2-primaria` o `varios-cursos`.
2. Pulsa *Add file → Upload files*, arrastra el PDF y pulsa **Commit changes**.
3. En uno o dos minutos el material aparece en la web con la etiqueta **Nuevo**
   (la lleva 30 días) y su portada.

No hace falta nada más: GitHub mueve el PDF a `materiales/`, lo comprime sin pérdida de calidad,
dibuja la portada, cuenta las páginas y lo añade a `catalogo.json`. El progreso y los avisos
se ven en la pestaña **Actions** (pulsa en la ejecución para ver el resumen).

- **Título y descripción** se toman de las propiedades del PDF (*Título* y *Asunto*).
  Si el PDF no las tiene, el título sale del nombre del archivo y la descripción queda vacía.
- **Tipo** se deduce del nombre o del título: «cuaderno» → Cuaderno; «secuencia» o
  «programación» → Programación; «bingo», «juego», «dominó»… → Juego; «presentación» → Presentación;
  «ficha» → Ficha. Si no hay pista, las páginas apaisadas se toman como Presentación y el resto como Ficha.
- **Nombre del archivo:** se quitan tildes, espacios y símbolos para que los enlaces sean limpios
  («Mi ficha (v2).pdf» → `Mi_ficha_v2.pdf`).

### Subir una presentación con su ficha (un recurso)

Para que salgan juntas en la misma tarjeta, ponles el mismo nombre seguido de un guion y el tipo,
y súbelas a la vez a la carpeta del curso:

- `La decena - presentación.pdf`
- `La decena - ficha.pdf`

Saldrán en la tarjeta «La decena». Tipos admitidos detrás del guion: presentación, ficha,
cuaderno, juego y programación (con o sin tilde; se puede añadir un número: `La decena - ficha 2.pdf`).
En el lector aparecen unas pestañas para pasar de la presentación a la ficha.

Desde un ordenador también vale arrastrar una carpeta con el nombre del recurso que contenga los PDF.

Si se te olvida y subes a la vez una presentación y una ficha con nombres distintos
(«Mision_Medida.pdf» y «Ficha_multinivel_Medida.pdf»), se agrupan solas cuando comparten alguna
palabra del nombre o del título; el recurso toma el título de la ficha. En *Actions* sale un aviso
con cada pareja agrupada; si alguna no iba junta, borra su línea `"recurso"` en `catalogo.json`.

Para agrupar materiales que ya están subidos, pon el mismo `"recurso"` en sus bloques de
`catalogo.json` (ver abajo).

### Si algo sale mal

- **PDF dañado o con contraseña:** se queda en `subir/` sin publicarse y aparece un aviso en *Actions*.
  El resto de materiales se publica con normalidad. Bórralo y súbelo exportado de nuevo.
- **Dos PDF con el mismo nombre:** si ya existía uno con ese nombre, el nuevo lo sustituye y sale
  un aviso. Para recuperar el anterior, ábrelo en `materiales/` → *History*.

### Sustituir un material por una versión corregida

Súbelo a `subir/<curso>/` **con el mismo nombre de archivo** que el que está en `materiales/`.
Se reemplaza el PDF y su portada, y se conservan el título, el curso y la descripción.

### Corregir título, curso, tipo o descripción

Edita `catalogo.json` con el lápiz de GitHub. Cada material es un bloque así:

```json
  {
    "archivo": "Mi_ficha.pdf",
    "titulo": "Mi ficha",
    "etapas": ["1.º", "2.º"],
    "tipo": "Ficha",
    "recurso": "Mi recurso",
    "desc": "Descripción breve.",
    "pags": 10,
    "peso": 120,
    "fecha": "2026-09-28"
  },
```

- `etapas`: «3 años», «4 años», «5 años», «1.º» y/o «2.º». Con varias, sale en «Para varios cursos».
- `tipo`: Cuaderno, Ficha, Presentación, Juego o Programación.
- `recurso` (opcional): los materiales con el mismo nombre salen juntos en una tarjeta con ese título.
- `pags` y `peso` se calculan solos. `fecha` es el día en que se añadió (quítala para quitar «Nuevo»).
- El orden de los bloques es el orden en que se ven dentro de cada curso.

Si al editar se escapa una coma o unas comillas, **la web no se estropea**: la publicación se
detiene, la web sigue como estaba y en *Actions* aparece en rojo qué línea hay que corregir.

### Retirar un material

Borra su PDF de `materiales/` (abre el archivo → menú ⋯ → *Delete file*).
Su entrada del catálogo y su portada se quitan solas.

## Qué incluye

- `index.html` — la aula completa:
  - **Biblioteca** con portadas, agrupada por curso, con buscador (no distingue tildes),
    filtros por curso y tipo, botones *Abrir*, *Descargar* y *Marcar como trabajado*.
  - **Lector tipo libro digital**: barra lateral (Inicio, Contenido, Marcador, Buscar, Notas),
    vista de una o dos páginas, zoom, pantalla completa, «Última página vista», paso de página
    con flechas, teclado o deslizando el dedo. Funciona igual en ordenador, tableta y móvil.
  - **Seguir donde lo dejé**: al volver a la biblioteca, un aviso lleva al último material y página.
  - **Modo proyección** (botón *Proyectar* o tecla **P**): solo la página, a pantalla completa y sobre
    negro, para la pizarra digital. Las flechas se esconden solas; funcionan el teclado
    (flechas, espacio, Av Pág/Re Pág, Inicio/Fin) y los mandos de presentación. **Esc** sale.
  - **Sin conexión**: los materiales abiertos se guardan en el dispositivo y se pueden volver a abrir
    sin internet (llevan la marca «✓ sin conexión»). Al final de la biblioteca, *Guardar todos los
    materiales* los deja todos listos antes de clase. En el iPad o el móvil se puede instalar como
    app: *Compartir → Añadir a pantalla de inicio*.
    Si un móvil conserva una copia antigua del código y la mezcla con la página nueva (las fichas de
    las herramientas no harían nada), la web lo detecta, borra esa copia (los PDF guardados se quedan)
    y se recarga sola una vez; si aun así no puede, lo avisa en pantalla.
  - **Filtro «Contenido»**: además de curso y tipo, se filtra por tema (descomposición, parejas del 10,
    problemas, medida…). Los temas se asignan solos al subir un PDF y se corrigen en `catalogo.json` (campo `"temas"`).
  - **Ruta del curso** (`#/ruta`, enlace en la cabecera): las 15 unidades de la *Secuencia didáctica OAOA*,
    trimestre a trimestre, con objetivo, indicador de logro, la página de la unidad en la secuencia, las
    fichas del cuaderno anual de ese trimestre y los recursos relacionados. Marca el trimestre actual.
    Los datos están en `ruta.json` (se puede editar; las pruebas avisan si algo no existe).
  - **Para las familias** (`#/familias`): guía para acompañar en casa, las diez regletas con su valor,
    consejos y un botón para imprimir regletas de papel a tamaño real para recortar.
  - **Imprimir páginas sueltas**: en el lector, botón *Imprimir*: esta página, un rango o todo el material
    (y *Guardar como PDF* para quedarse solo con esas páginas). Desde ahí también se descarga el PDF.
  - **Rotulador** (botón *Rotulador* o tecla **R**, también en proyección): escribir y subrayar sobre la
    página con el dedo, el lápiz o el ratón. Se mantiene al pasar de página o hacer zoom y se borra al
    cerrar el material.
  - **Compartir**: en cada tarjeta y en el lector (con la página actual). Enlace, WhatsApp, correo y
    código QR descargable para imprimir.
  - **Herramientas para el aula**:
    - *Regletas virtuales* (`#/regletas`): arrastrar, girar (doble toque o **G**), duplicar (**D**),
      quitar (papelera o **Supr**), regla numerada y tamaño ajustable. Las teclas 1–9 y 0 ponen regletas.
      Se guarda lo que hay en el tablero.
    - *Bombo del bingo* (`#/bombo`): los cuatro niveles del bingo de las regletas, todos del 1 al 99,
      bingo de decenas, del amigo del 100 y al revés. Números sin repetir con sus regletas, tablero de
      los que han salido y voz opcional. Barra espaciadora para sacar número.
    - *Cálculo mental* (`#/calculo`): rondas proyectables de 5 a 20 preguntas de nueve tipos (uno más y uno
      menos, sumas y restas hasta 10, parejas del 10, dobles, paso por la decena, truco del cero, amigos del
      100, dieces y unos), con regletas, tiempo opcional por pregunta y resumen final. Barra espaciadora.
    - *Panel del 100* (`#/panel`): cruz numérica (±1, ±10) con la opción de adivinarla, tapar casillas (a mano
      o 10 al azar), pintar patrones y rango hasta 30, 50 o 100. Flechas para mover la cruz.
    - *Partes y todo* (`#/partes`): el diagrama partes-todo en barras de regletas o en círculos, retos por
      nivel (hasta 5, 10, 20 o decenas), «¡Abracadabra!» para ocultar una parte o el todo, valores editables
      y la familia de operaciones.
    - *Marco del 10* (`#/marco`): fichas rojas y azules en uno o dos marcos (hasta 20), con «faltan… para 10»
      y la suma de colores; juego *Relámpago*: la cantidad se ve 1–5 s y se tapa («¿cuántas había?»).
    - *Muros numéricos* (`#/muros`): del muro del 2 al del 10 (las parejas del 10), completos o con
      «¡Abracadabra!» (la segunda regleta de cada fila oculta), con sumas y en orden o desordenados.
    - *Geoplano* (`#/geoplano`, en `geoplano.js`): gomas de seis colores entre clavos (5×5, 7×7 o 10×10).
      Se toca un clavo para empezar, los siguientes para estirar la goma y el primero (naranja) para cerrarla;
      un vértice se arrastra a otro clavo. De cada figura dice su nombre (cuadrado, rectángulo, triángulo
      rectángulo, rombo, trapecio, pentágono…), lados, vértices, área en cuadraditos y perímetro.
      Modos *Copia la figura* (un modelo al lado; vale copiarlo en otro sitio) y *Simetría* (dibujar el
      reflejo al otro lado del eje), los dos con «Comprobar». Con teclado: flechas e Intro.
    - *Calculadora* (`#/calculadora`, en `calculadora.js`): teclas grandes para la pizarra y cinta con las
      operaciones. *Factor constante*: al repetir «=» se repite la última operación (0 + 2 = = = → 2, 4, 6…);
      la serie sale en fichas con pares e impares de colores y marcada en un panel del 100.
      *¿Qué saldrá?* tapa el resultado hasta tocar la pantalla; *Tecla rota* propone conseguir un número
      sin poder usar una cifra. Funciona con el teclado del ordenador.
    - *Pirámides numéricas* (`#/piramides`, en `piramides.js`): cada bloque es la suma de los dos de abajo.
      Niveles *Fácil* (está la base: solo sumar), *Medio* (sumar y restar) y *Difícil* (casi todo arriba:
      bajar restando); 3, 4 o 5 pisos y números hasta 10, 20 o 100. Toda pirámide se puede resolver paso a paso.
      Ayudas: *Pista* (marca un bloque que ya se puede calcular y la operación: «5 + 3 = ?» o «12 − 5 = ?»),
      *Partes y todo* (al elegir un bloque se marcan sus dos partes), *Regletas* dentro de los bloques,
      *Corregir al momento* o con «Comprobar», y «Ver la solución». Teclado en pantalla y del ordenador.
  - **Modo aula por curso** (`#/aula/3-anios`, `4-anios`, `5-anios`, `1-primaria`, `2-primaria`): una pantalla
    sencilla para las tabletas o la pizarra de una clase, con las fichas del trimestre actual, «Seguir» con
    la última ficha abierta, los materiales y las herramientas de ese curso con iconos grandes y el reto en
    su nivel. La tableta recuerda su clase y vuelve a ella aunque se abra la web desde el principio. Para
    salir, mantener pulsado «Salir» 3 segundos. El enlace y su QR están en la ruta de cada curso.
  - **Reto de la semana**: en la portada, un reto para Infantil y otro para Primaria, con pista, solución,
    enlace a una herramienta y botón de compartir. Se edita en `reto.json` (una entrada por semana con su
    fecha de inicio); la web muestra sola la semana en curso.
  - Modo claro y oscuro.
- `catalogo.json` — la lista de materiales.
- `materiales/` — los PDF. `portadas/` — una imagen JPG por material.
- `subir/` — el buzón para añadir materiales.
- `lib/` — el visor PDF.js (Mozilla, licencia Apache 2.0), alojado aquí mismo:
  la web no carga nada de servidores externos.
- `scripts/actualizar_catalogo.py` y `.github/workflows/publicar.yml` — la automatización.
- `herramientas.js` — regletas virtuales, bombo, compartir y rotulador. `lib/qrcode.js` genera los QR (MIT).
- `sw.js`, `manifest.webmanifest` e `icono-*.png` — el uso sin conexión y la app instalable.
- `lib/fuentes/` — la tipografía Poppins (la misma de los materiales), con su licencia libre SIL OFL.

Los marcadores, las notas, la última página vista y las marcas de «trabajado»
se guardan solo en el navegador de cada dispositivo.

## Pruebas automáticas

Antes de cada publicación, GitHub comprueba la web con `pruebas/pruebas.mjs`: que `ruta.json` apunta a
materiales y páginas que existen, que la biblioteca carga sin errores y es accesible, que **todos** los
PDF se abren en el lector, que las herramientas funcionan y que en el móvil nada se sale de la pantalla.
Si algo falla, **no se publica** y la web sigue como estaba; el motivo aparece en *Actions*. Las mismas
pruebas se pasan en cada pull request.

## Publicación

La web se publica con GitHub Actions en cada cambio de la rama `main`.
En *Settings → Pages → Build and deployment → Source* debe estar elegido **GitHub Actions**.

Para probarla en tu ordenador hace falta un servidor (con doble clic en `index.html` no carga
la lista): `python3 -m http.server` dentro de la carpeta y entra en `http://localhost:8000`.
Para actualizar el catálogo a mano: `pip install pypdfium2 pillow` y
`python scripts/actualizar_catalogo.py`.

## Enlaces directos

Cada material y cada página tienen su propia dirección, útil para mandar a las familias:
`https://damp83.github.io/Librodigital/#/leer/Cuaderno_1Primaria_multinivel.pdf/12`
abre el cuaderno de 1.º directamente en la página 12.
