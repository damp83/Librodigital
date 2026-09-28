# Aula de Matemáticas Manipulativas

Aula virtual estática con los cuadernos, fichas, presentaciones y juegos de matemáticas
manipulativas con regletas Cuisenaire (metodología OAOA y J. A. Fernández Bravo),
de Educación Infantil 3 años a 2.º de Primaria.

**Autor:** Diego Alberto Moya · **Licencia:** CC BY-NC-SA 4.0

## Qué incluye

- `index.html` — la aula completa:
  - **Biblioteca** con portadas, agrupada por curso, con buscador (no distingue tildes),
    filtros por curso y tipo, botones *Abrir*, *Descargar* y *Marcar como trabajado*.
  - **Lector tipo libro digital**: barra lateral (Inicio, Contenido, Marcador, Buscar, Notas),
    vista de una o dos páginas, zoom, pantalla completa, «Última página vista», paso de página
    con flechas, teclado o deslizando el dedo. Funciona igual en ordenador, tableta y móvil.
  - Modo claro y oscuro.
- `materiales/` — los PDF (18 materiales, 419 páginas).
- `portadas/` — una imagen JPG por material (primera página del PDF).
- `lib/` — el visor PDF.js (Mozilla, licencia Apache 2.0), alojado aquí mismo:
  la web no carga nada de servidores externos.

Los marcadores, las notas, la última página vista y las marcas de «trabajado»
se guardan solo en el navegador de cada dispositivo.

## Publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub, por ejemplo `aula-matematicas`.
2. Sube el contenido de esta carpeta (los archivos, no la carpeta):
   - Desde la web: *Add file → Upload files*, arrastra `index.html`, `.nojekyll`,
     `LICENCIA.txt` y las carpetas `materiales`, `portadas` y `lib`.
   - Desde la terminal:
     ```bash
     git init
     git add .
     git commit -m "Aula de matemáticas manipulativas"
     git branch -M main
     git remote add origin https://github.com/USUARIO/aula-matematicas.git
     git push -u origin main
     ```
3. En el repositorio: *Settings → Pages → Build and deployment*, elige **Deploy from a branch**,
   rama `main` y carpeta `/ (root)`. Guarda.
4. En un par de minutos estará publicado en `https://USUARIO.github.io/aula-matematicas/`.

> Si abres `index.html` con doble clic desde tu ordenador, la biblioteca se ve, pero el
> lector necesita un servidor. Para probarlo en local: `python3 -m http.server` dentro
> de la carpeta y entra en `http://localhost:8000`.

## Añadir un material nuevo

1. Copia el PDF dentro de `materiales/`.
2. Abre `index.html` y añade una entrada a la lista `MATERIALES`:
   ```js
   {"archivo":"Mi_material.pdf","titulo":"Mi material","etapas":["1.º"],
    "tipo":"Ficha","desc":"Descripción breve.","pags":10,"peso":120},
   ```
   `tipo`: Cuaderno, Ficha, Presentación, Juego o Programación.
   `etapas`: «3 años», «4 años», «5 años», «1.º» o «2.º» (si pones varias, aparece en
   «Para varios cursos»). `peso` es el tamaño en KB.
3. Portada (opcional): guarda una imagen de la primera página como `portadas/Mi_material.jpg`.
   Si no la pones, la web la dibuja sola a partir del PDF.
4. Guarda y vuelve a subir los cambios.

## Enlaces directos

Cada material y cada página tienen su propia dirección, útil para mandar a las familias:
`https://USUARIO.github.io/aula-matematicas/#/leer/Cuaderno_1Primaria_multinivel.pdf/12`
abre el cuaderno de 1.º directamente en la página 12.
