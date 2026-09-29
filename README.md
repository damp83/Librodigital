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
  - Modo claro y oscuro.
- `catalogo.json` — la lista de materiales.
- `materiales/` — los PDF. `portadas/` — una imagen JPG por material.
- `subir/` — el buzón para añadir materiales.
- `lib/` — el visor PDF.js (Mozilla, licencia Apache 2.0), alojado aquí mismo:
  la web no carga nada de servidores externos.
- `scripts/actualizar_catalogo.py` y `.github/workflows/publicar.yml` — la automatización.
- `sw.js`, `manifest.webmanifest` e `icono-*.png` — el uso sin conexión y la app instalable.

Los marcadores, las notas, la última página vista y las marcas de «trabajado»
se guardan solo en el navegador de cada dispositivo.

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
