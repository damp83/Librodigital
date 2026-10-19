"""Mantiene al día el catálogo del aula.

Lo ejecuta GitHub Actions en cada cambio de la rama main (.github/workflows/publicar.yml),
pero también se puede lanzar a mano:  pip install pypdfium2 pillow pikepdf && python scripts/actualizar_catalogo.py
(con --optimizar-todo comprime también, sin pérdida, los PDF que ya estaban publicados).

Qué hace:
  1. Mueve los PDF de subir/<curso>/ a materiales/ y los añade al catálogo
     (o sustituye el archivo si ya existía uno con el mismo nombre, sin tocar sus datos).
     Los PDF llamados «<Nombre del recurso> - presentación.pdf», «<Nombre del recurso> - ficha.pdf»…
     (o subidos a subir/<curso>/<Nombre del recurso>/) se agrupan en un mismo recurso.
     Los PDF nuevos se comprimen sin pérdida. Un PDF dañado se queda en subir/ con un aviso,
     sin bloquear la publicación del resto.
  2. Añade al catálogo los PDF que estén en materiales/ y no figuren en él.
  3. Quita del catálogo los materiales cuyo PDF se ha borrado.
  4. Recalcula páginas y peso, y genera las portadas que falten.
  5. Comprueba que catalogo.json está bien escrito. Si no, termina con error
     y la web publicada no se toca.
"""
import datetime
import json
import os
import re
import shutil
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CATALOGO = RAIZ / "catalogo.json"
MATERIALES = RAIZ / "materiales"
PORTADAS = RAIZ / "portadas"
SUBIR = RAIZ / "subir"

ETAPAS = ["3 años", "4 años", "5 años", "1.º", "2.º"]
TIPOS = ["Cuaderno", "Ficha", "Presentación", "Juego", "Programación"]
CARPETAS = {
    "3-anios": ["3 años"],
    "4-anios": ["4 años"],
    "5-anios": ["5 años"],
    "1-primaria": ["1.º"],
    "2-primaria": ["2.º"],
    "varios-cursos": list(ETAPAS),
}
# Temas de contenido (filtro «Contenido» de la web). Se asignan solos a los materiales nuevos
# buscando estas palabras en el título y la descripción; después se pueden corregir en catalogo.json.
TEMAS = {   # expresiones regulares sobre el texto sin tildes y en minúsculas
    "Espacio y series": [r"\bposiciones\b", r"\borientacion", r"\bseries?\b", r"\bsimetri", r"\bclasifica", r"\bordenar\b", r"\bescalera\b"],
    "Cantidad y conteo": [r"\bcantidad", r"\bcorrespondencia\b", r"\bcontar\b", r"\bconteo\b", r"\bcardinal\b", r"\bvalor hasta\b"],
    "Composición y descomposición": [r"\bdescompo", r"\bcompo(ner|sicion)", r"\b2 por 1\b", r"\b1 por 2\b", r"\bmuros?\b", r"\bvestidos\b", r"\bdobles\b", r"\brepartos?\b"],
    "Parejas del 10": [r"\bparejas del 10\b", r"\bamigos del 10\b"],
    "Suma y resta": [r"\bsuma", r"\bresta", r"\boperaciones\b", r"\bjuntar\b", r"\bseparar\b", r"\bcalculo\b"],
    "Diagrama partes-todo": [r"\bpartes[- ]todo\b", r"\bparte que falta\b"],
    "Problemas": [r"\bproblemas?\b"],
    "Geometría": [r"\bgeoplano", r"\bpoligon", r"\bsegmentos?\b", r"\btriangul", r"\bcuadrados?\b", r"\brectangul",
                  r"\bperimetro", r"\bfiguras? (planas|geometricas)", r"\bgeometria\b"],   # «bosque geométrico» no es geometría
    "Multiplicación": [r"\bmultiplic", r"\bveces\b", r"\btablas? de multiplicar\b"],
    "Medida": [r"\bmedida", r"\blongitud", r"\bcentimetros?\b", r"\bmetros?\b", r"\bmedir\b",
               r"\bhoras?\b", r"\breloj", r"\bintervalos de tiempo\b", r"\bdinero\b", r"\bmonedas?\b", r"\bbilletes?\b"],
    "Decenas y valor posicional": [r"\bdecenas?\b", r"\bdieces\b", r"\bdiez y unos\b", r"\bvalor posicional\b", r"\bpanel del 100\b", r"\bamigos del 100\b", r"\bcentenas?\b", r"\bdel 1 al 99\b"],
}
LADO_PORTADA = 360        # píxeles del lado mayor de la portada
AVISO_PESO_KB = 2048      # a partir de aquí se avisa de que conviene comprimir el PDF
# «La decena - presentación.pdf» -> recurso «La decena», tipo Presentación
CONVENCION = re.compile(r"^(.+?)\s+-\s+(presentaci[oó]n|ficha|cuaderno|juego|programaci[oó]n)(?:\s*\d+)?$", re.I)
TIPO_DE_PALABRA = {"presentacion": "Presentación", "ficha": "Ficha", "cuaderno": "Cuaderno",
                   "juego": "Juego", "programacion": "Programación"}

# Palabras que no sirven para saber si una presentación y una ficha son del mismo tema
PALABRAS_VACIAS = {"ficha", "fichas", "multinivel", "presentacion", "corregido", "corregida", "version", "final",
                   "de", "del", "la", "las", "el", "los", "y", "e", "con", "en", "un", "una", "para", "por", "al",
                   "regletas", "cuisenaire", "primaria", "infantil", "anios", "anos", "detectives", "detective",
                   "mision", "agencia", "matematico", "matematicos", "matematica", "matematicas", "bloom", "revisada"}

errores, avisos, cambios = [], [], []


def norm(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()


def nombre_seguro(nombre):
    """«Mi ficha (v2).PDF» -> «Mi_ficha_v2.pdf»: sin tildes ni espacios, para que los enlaces sean limpios."""
    base = unicodedata.normalize("NFKD", Path(nombre).stem).encode("ascii", "ignore").decode()
    base = re.sub(r"[^A-Za-z0-9_-]+", "_", base).strip("_-") or "material"
    return re.sub(r"_+", "_", base) + ".pdf"


def abrir_pdf(ruta):
    import pypdfium2 as pdfium
    return pdfium.PdfDocument(str(ruta))


def se_puede_abrir(ruta):
    try:
        doc = abrir_pdf(ruta); n = len(doc); doc.close()
        return n > 0
    except Exception:
        return False


def optimizar(ruta):
    """Compresión sin pérdida (se ve exactamente igual). Solo se queda con el resultado si ocupa menos y abre bien."""
    try:
        import pikepdf
    except ImportError:
        return
    tmp = ruta.with_suffix(".tmp.pdf")
    try:
        with pikepdf.open(ruta) as pdf:
            n = len(pdf.pages)
            pdf.save(tmp, compress_streams=True, recompress_flate=True,
                     object_stream_mode=pikepdf.ObjectStreamMode.generate)
        doc = abrir_pdf(tmp); ok = len(doc) == n; doc.close()
        if ok and tmp.stat().st_size < ruta.stat().st_size * 0.97:
            antes = ruta.stat().st_size
            tmp.replace(ruta)
            cambios.append(f"Comprimido: {ruta.name} ({antes // 1024} → {ruta.stat().st_size // 1024} KB, sin pérdida)")
    except Exception:
        pass
    finally:
        tmp.unlink(missing_ok=True)


PESADO_KB = AVISO_PESO_KB  # a partir de aquí se intenta aligerar el PDF (el mismo límite del aviso)
CALIDAD_JPEG = 85
JPEG_DENSO = 0.12         # bytes por píxel: un JPEG que pasa de esto se guardó con más calidad de la que se nota
CALIDAD_FOTO = 65         # calidad para volver a guardar esos JPEG (diapositivas con fotos): no se nota ni ampliando


def fondo_comun(pdf):
    """Muchas diapositivas repiten en cada página el mismo fondo dibujado (miles de puntos o líneas). Si todas
    las páginas empiezan con el mismo dibujo, se guarda una sola vez y cada página lo reutiliza. Devuelve si lo ha hecho."""
    import pikepdf
    paginas = list(pdf.pages)
    if len(paginas) < 3:
        return False
    datos = []
    for pg in paginas:
        c = pg.obj.get("/Contents")
        if c is None:
            return False
        datos.append(b"\n".join(x.read_bytes() for x in c) if isinstance(c, pikepdf.Array) else c.read_bytes())
    comun = os.path.commonprefix(datos)
    corte = max(comun.rfind(b"\nf*\n"), comun.rfind(b"\nf\n"), comun.rfind(b"\nS\n"))   # al acabar un trazo completo
    if corte < 50 * 1024:
        return False
    corte = comun.index(b"\n", corte + 1) + 1
    caja = paginas[0].obj.get("/MediaBox")
    fondo = pdf.make_stream(datos[0][:corte])
    fondo.Type, fondo.Subtype = pikepdf.Name.XObject, pikepdf.Name.Form
    fondo.BBox, fondo.Resources = caja, paginas[0].obj.Resources
    for pg, d in zip(paginas, datos):
        pg.obj.Contents = pdf.make_stream(b"q /AulaFondo Do Q\n" + d[corte:])
        rec = pg.obj.Resources
        if "/XObject" not in rec:
            rec.XObject = pikepdf.Dictionary()
        rec.XObject.AulaFondo = fondo
    return True


def se_ve_igual(original, nuevo):
    """Compara las páginas dibujadas de los dos PDF (a media resolución). El ruido del JPEG es una diferencia pequeña
    repartida por toda la página; algo que falte o cambie de sitio deja píxeles muy distintos."""
    from PIL import ImageChops, ImageStat
    a, b = abrir_pdf(original), abrir_pdf(nuevo)
    try:
        if len(a) != len(b):
            return False
        for i in range(len(a)):
            x, y = (d[i].render(scale=0.6).to_pil().convert("L") for d in (a, b))
            if x.size != y.size:
                return False
            dif = ImageChops.difference(x, y); h = dif.histogram()
            if ImageStat.Stat(dif).mean[0] > 4 or sum(h[48:]) > sum(h) * 0.005:
                return False
        return True
    finally:
        a.close(); b.close()


def aligerar(ruta):
    """Para PDF pesados: pasa a JPEG de buena calidad las imágenes grandes sin comprimir, vuelve a guardar con
    calidad CALIDAD_FOTO los JPEG guardados con calidad de sobra (misma resolución, conservando la transparencia) y guarda una
    sola vez el fondo que se repite en todas las páginas. Solo se queda con el resultado si se ve igual, tiene las
    mismas páginas y ocupa bastante menos."""
    if ruta.stat().st_size < PESADO_KB * 1024:
        return
    try:
        import pikepdf, io
        from PIL import Image
    except ImportError:
        return
    tmp = ruta.with_suffix(".tmp.pdf")
    try:
        hecho = []
        with pikepdf.open(ruta) as pdf:
            if fondo_comun(pdf):
                hecho.append("fondo repetido guardado una sola vez")
            hechas, jpeg = set(), 0
            for pagina in pdf.pages:
                for img in pagina.images.values():
                    if img.objgen in hechas:
                        continue
                    hechas.add(img.objgen)
                    filtro, crudo = img.get("/Filter"), len(img.read_raw_bytes())
                    ancho, alto = int(img.get("/Width", 0)), int(img.get("/Height", 0))
                    if ancho < 400 or crudo < 100 * 1024 or img.get("/BitsPerComponent", 8) != 8:
                        continue
                    if filtro == pikepdf.Name.DCTDecode:
                        if crudo / (ancho * alto) < JPEG_DENSO:
                            continue
                    elif filtro != pikepdf.Name.FlateDecode or crudo < 200 * 1024:
                        continue
                    pil = pikepdf.PdfImage(img).as_pil_image()
                    if pil.mode not in ("RGB", "L"):
                        pil = pil.convert("RGB")
                    foto = filtro == pikepdf.Name.DCTDecode
                    salida = io.BytesIO(); pil.save(salida, "JPEG", quality=CALIDAD_FOTO if foto else CALIDAD_JPEG, optimize=True, progressive=foto)
                    if salida.tell() >= crudo * (0.8 if foto else 1):   # un JPEG ya aligerado no se vuelve a tocar
                        continue
                    img.write(salida.getvalue(), filter=pikepdf.Name.DCTDecode)
                    img.ColorSpace = pikepdf.Name.DeviceGray if pil.mode == "L" else pikepdf.Name.DeviceRGB
                    img.BitsPerComponent = 8
                    if "/DecodeParms" in img:
                        del img["/DecodeParms"]
                    jpeg += 1
            if jpeg:
                hecho.append(f"{jpeg} imágenes en JPEG más ligero, misma resolución")
            pdf.save(tmp, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
        if hecho and tmp.stat().st_size < ruta.stat().st_size * 0.7 and se_ve_igual(ruta, tmp):
            antes = ruta.stat().st_size
            tmp.replace(ruta)
            cambios.append(f"Aligerado: {ruta.name} ({antes / 1048576:.1f} → {ruta.stat().st_size / 1048576:.1f} MB, {'; '.join(hecho)})")
    except Exception as e:
        avisos.append(f"{ruta.name}: no se ha podido aligerar ({e}); se publica tal cual.")
    finally:
        tmp.unlink(missing_ok=True)


def convencion(stem):
    """Devuelve (recurso, tipo) si el nombre sigue la forma «Recurso - tipo»; si no, (None, None)."""
    c = CONVENCION.match(stem.replace("_", " ").strip())
    return (c.group(1).strip(), TIPO_DE_PALABRA[norm(c.group(2))]) if c else (None, None)


def deducir_temas(m):
    texto = norm(" ".join(str(m.get(k, "")) for k in ("titulo", "desc", "recurso")))
    return [t for t, patrones in TEMAS.items() if any(re.search(p, texto) for p in patrones)]


def titulo_limpio(t):
    t = re.sub(r"\s*\((\d\.?\s*º|[345]\s*años)[^)]*\)\s*$", "", t.strip())   # quita «(2º Primaria)» al final
    t = re.sub(r"^ficha( multinivel)?\s*:\s*", "", t, flags=re.I)             # el tipo ya se muestra aparte
    return t[:1].upper() + t[1:]


def deducir_tipo(archivo, titulo, apaisado):
    """El nombre del archivo manda; después, el título. Las diapositivas apaisadas solo se toman por juego si lo
    dice el nombre del archivo (un título como «El tablero mágico de la geometría» es de una presentación)."""
    tipos = [(("cuaderno",), "Cuaderno"),
             (("programacion", "secuencia", "situacion de aprendizaje"), "Programación"),
             (("bingo", "juego", "domino", "cartas", "loteria"), "Juego"),
             (("presentacion",), "Presentación"),
             (("ficha",), "Ficha")]
    for texto, es_titulo in ((norm(archivo.replace("_", " ")), False), (norm(titulo), True)):
        for palabras, tipo in tipos:
            if any(re.search(r"\b" + p, texto) for p in palabras):
                if tipo == "Juego" and es_titulo and apaisado:
                    continue
                return tipo
    return "Presentación" if apaisado else "Ficha"


def entrada_nueva(ruta, etapas, recurso=None, tipo=None):
    doc = abrir_pdf(ruta)
    meta = doc.get_metadata_dict()
    ancho, alto = doc[0].get_size()
    doc.close()
    titulo = (meta.get("Title") or "").strip()
    if not titulo or re.match(r"^(microsoft|untitled|sin t[ií]tulo|presentaci[oó]n de powerpoint|documento)", titulo, re.I):
        titulo = recurso or ruta.stem
    if convencion(titulo)[0]:                 # «La decena - ficha» -> «La decena» (el tipo ya se muestra aparte)
        titulo = convencion(titulo)[0]
    if " " not in titulo:                     # título sacado del nombre del archivo: «Mi_ficha» -> «Mi ficha»
        titulo = re.sub(r"[_-]+", " ", titulo).strip()
    titulo = titulo_limpio(titulo)
    return {
        "archivo": ruta.name,
        "titulo": titulo,
        "etapas": etapas,
        "tipo": tipo or deducir_tipo(ruta.name, titulo, ancho > alto),
        **({"recurso": recurso} if recurso else {}),
        "desc": (meta.get("Subject") or "").strip(),
        "pags": 0,
        "peso": 0,
        "fecha": datetime.date.today().isoformat(),
    }


def generar_portada(ruta_pdf):
    doc = abrir_pdf(ruta_pdf)
    pagina = doc[0]
    ancho, alto = pagina.get_size()
    imagen = pagina.render(scale=LADO_PORTADA / max(ancho, alto)).to_pil().convert("RGB")
    imagen.save(PORTADAS / (ruta_pdf.stem + ".jpg"), "JPEG", quality=82, optimize=True, progressive=True)
    doc.close()


def palabras_clave(m):
    texto = norm(Path(m["archivo"]).stem.replace("_", " ") + " " + str(m.get("titulo", "")))
    palabras = {p for p in re.findall(r"[a-z0-9]+", texto) if p not in PALABRAS_VACIAS and (len(p) > 2 or p.isdigit())}
    return {p[:-1] if p.endswith("s") and len(p) > 4 else p for p in palabras}   # «horas» y «hora» cuentan igual


# El curso escrito en el título o la descripción del PDF: «(2º Primaria)», «Infantil 5 años»…
CURSO_EN_TEXTO = [("3 años", r"\b3 anos\b"), ("4 años", r"\b4 anos\b"), ("5 años", r"\b5 anos\b"),
                  ("1.º", r"\b(1\.?o?|primero) (de )?(educacion )?primaria\b"), ("2.º", r"\b(2\.?o?|segundo) (de )?(educacion )?primaria\b")]
def deducir_etapas(texto):
    t = norm(texto)
    return [e for e, patron in CURSO_EN_TEXTO if re.search(patron, t)]


def emparejar(nuevos):
    """Une en un recurso cada presentación y ficha subidas a la vez al mismo curso que comparten palabras
    del nombre o del título (p. ej. «Mision_Medida.pdf» y «Ficha_multinivel_Medida.pdf»)."""
    pres = [m for m in nuevos if m.get("tipo") == "Presentación" and "recurso" not in m]
    fichas = [m for m in nuevos if m.get("tipo") == "Ficha" and "recurso" not in m]
    pares = []
    for p in pres:
        for f in fichas:
            comunes = palabras_clave(p) & palabras_clave(f)
            mismo_curso = p.get("etapas") == f.get("etapas") or not p.get("etapas") or not f.get("etapas")
            if comunes and mismo_curso:
                pares.append((len(comunes), p, f))
    usados = set()
    for _, p, f in sorted(pares, key=lambda x: -x[0]):
        if p["archivo"] in usados or f["archivo"] in usados:
            continue
        usados |= {p["archivo"], f["archivo"]}
        nombre = titulo_limpio(str(f.get("titulo") or p.get("titulo")))
        p["recurso"] = f["recurso"] = nombre
        if not p.get("etapas") or not f.get("etapas"):   # si solo una sabe su curso, la otra toma el mismo
            p["etapas"] = f["etapas"] = list(p.get("etapas") or f.get("etapas"))
        cambios.append(f"Agrupados en «{nombre}»: {p['archivo']} (presentación) y {f['archivo']} (ficha)")
        avisos.append(f"«{nombre}»: la presentación y la ficha se han agrupado solas porque se subieron a la vez y "
                      "tienen nombres parecidos. Si no van juntas, borra su línea «recurso» en catalogo.json.")


def cargar_catalogo():
    try:
        datos = json.loads(CATALOGO.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errores.append(f"catalogo.json no se puede leer (línea {e.lineno}, columna {e.colno}): {e.msg}. "
                       "Suele ser una coma o unas comillas de más o de menos cerca de esa línea.")
        return None
    if not isinstance(datos, list):
        errores.append("catalogo.json debe ser una lista entre corchetes [ ... ].")
        return None
    return datos


def validar(catalogo):
    vistos = set()
    for i, m in enumerate(catalogo, 1):
        if not isinstance(m, dict):
            errores.append(f"El elemento {i} de catalogo.json no es un material entre llaves {{ ... }}.")
            continue
        nombre = m.get("archivo") or f"elemento {i}"
        if not isinstance(m.get("archivo"), str) or not (MATERIALES / m["archivo"]).is_file():
            errores.append(f"{nombre}: no existe materiales/{m.get('archivo')}.")
        if nombre in vistos:
            errores.append(f"{nombre}: aparece dos veces en el catálogo.")
        vistos.add(nombre)
        if not isinstance(m.get("titulo"), str) or not m["titulo"].strip():
            errores.append(f"{nombre}: falta el título.")
        if not isinstance(m.get("etapas"), list) or any(e not in ETAPAS for e in m["etapas"]):
            errores.append(f"{nombre}: «etapas» debe ser una lista con valores de {ETAPAS}.")
        if m.get("tipo") not in TIPOS:
            errores.append(f"{nombre}: «tipo» debe ser uno de {TIPOS}.")
        if "desc" in m and not isinstance(m["desc"], str):
            errores.append(f"{nombre}: «desc» debe ser un texto entre comillas.")
        if "recurso" in m and (not isinstance(m["recurso"], str) or not m["recurso"].strip()):
            errores.append(f"{nombre}: «recurso» debe ser un nombre entre comillas.")
        if "temas" in m and (not isinstance(m["temas"], list) or not all(isinstance(t, str) and t.strip() for t in m["temas"])):
            errores.append(f"{nombre}: «temas» debe ser una lista de textos entre comillas, por ejemplo [\"Suma y resta\"].")
        elif any(t not in TEMAS for t in m.get("temas", [])):
            avisos.append(f"{nombre}: tema nuevo {[t for t in m['temas'] if t not in TEMAS]}; aparecerá como filtro aparte.")
        if "fecha" in m:
            try:
                datetime.date.fromisoformat(m["fecha"])
            except (TypeError, ValueError):
                errores.append(f"{nombre}: «fecha» debe tener la forma AAAA-MM-DD.")


def escribir_catalogo(catalogo):
    """Un material por bloque y las listas cortas en una línea, para que sea fácil de editar a mano."""
    orden = ["archivo", "titulo", "etapas", "tipo", "recurso", "temas", "desc", "pags", "peso", "fecha"]
    bloques = []
    for m in catalogo:
        claves = [k for k in orden if k in m] + [k for k in m if k not in orden]
        lineas = [f"    {json.dumps(k, ensure_ascii=False)}: {json.dumps(m[k], ensure_ascii=False)}" for k in claves]
        bloques.append("  {\n" + ",\n".join(lineas) + "\n  }")
    CATALOGO.write_text("[\n" + ",\n".join(bloques) + "\n]\n", encoding="utf-8")


# ---------------------------------------------------------------------------
# Revisión de textos: al publicar una ficha o presentación nueva, se leen sus páginas y se avisa de lo que
# parece una errata (no se cambia nada: es un aviso en «Actions» para que la persona lo mire).
#  - cuentas escritas que no cuadran: «70 + 60 = 120», «(80 + 20) + 30 = 100 + 30 = 140»;
#  - un 1 con el nombre en plural: «1 placas», «1 naranjas»;
#  - palabras repetidas: «el el»;
#  - «pasan de 10» para la reagrupación: con 10 justos también se forma un diez («llegan a 10»).
# Las cuentas de los ejercicios «Detective del error» (con BIEN / MAL al lado) se saltan: ahí el error es a propósito.
# ---------------------------------------------------------------------------
PLURALES_UNO = ("placas", "naranjas", "regletas", "unidades", "dieces", "decenas", "centenas", "euros", "céntimos",
                "monedas", "billetes", "piezas", "cromos", "canicas", "horas", "minutos", "veces", "cuadros", "puntos")
REPETIBLES = ("el", "la", "los", "las", "un", "una", "de", "del", "que", "y", "en", "a", "con", "se", "es", "por", "para", "lo", "al")
SIGNOS = "+\\-−×x·"
OPERACION = re.compile(r"[\d(][\d \t" + SIGNOS + r"()]*?(?:=[\d \t" + SIGNOS + r"()]+)+")
# ejercicios en los que el error es a propósito (detective del error, ¿está bien o mal?)
ERROR_A_PROPOSITO = re.compile(r"✔|✘|\bBIEN\b|\bMAL\b|bien o mal|[Cc]orrecto:|[Dd]etective del error|[Ll]o correcto|[Tt]acha|¿[Ee]s verdad|[Vv]erdadero o falso")

def valor(expresion):
    """Calcula «70 + (30 + 20)» o «3 · 4»; None si no es una cuenta completa (huecos, letras, decimales…)."""
    e = expresion.strip().replace("−", "-").replace("×", "*").replace("·", "*")
    e = re.sub(r"(?<=[\d)])\s*x\s*(?=[\d(])", "*", e)
    if not e or not re.fullmatch(r"[\d\s+\-*()]+", e) or not re.search(r"\d", e) or re.search(r"[+\-*(]\s*$|^\s*[+\-*)]", e):
        return None
    if re.search(r"\d\s+\d|[+\-*]\s*[+\-*]", e) or e.count("(") != e.count(")"):   # «10 10 10» son etiquetas de regletas, no una cuenta
        return None
    try:
        return eval(e, {"__builtins__": {}}, {})
    except Exception:
        return None

def separar_cuentas(texto):
    """Varias cuentas seguidas en la misma línea («2 + 2 = 4 20 + 20 = 40», o con « · » entre ellas en los
    solucionarios) se separan; « · » solo es «veces» cuando no separa cuentas completas («3 · 4 = 12»)."""
    texto = re.sub(r"^\s*\d+\)\s*", "", texto)                          # «3) …» es el número del ejercicio
    trozos = texto.split(" · ")
    if len(trozos) > 1 and all("=" in t for t in trozos):
        return [c for t in trozos for c in separar_cuentas(t)]
    if len(trozos) > 2:   # « · » a la vez de «veces» y de separador: no se puede saber cuál es cuál
        return []
    if len(trozos) == 2 and "=" not in trozos[0]:   # «3 · 4 = 12» es «veces» si son números de las tablas
        a, b = re.match(r"\s*(\d*)", trozos[0]).group(1), re.match(r"\s*(\d*)", trozos[1]).group(1)
        if not (a and b and int(a) <= 12 and int(b) <= 12):
            return separar_cuentas(trozos[1])
    # «… = 4 20 + 20 …»: un número seguido de otro número sin signo entre ellos empieza otra cuenta
    return [c for c in re.split(r"(?<=[\d)])[ \t]+(?=[\d(])", texto) if "=" in c]

def revisar_textos(ruta):
    try:
        doc = abrir_pdf(ruta)
        paginas = [doc[i].get_textpage().get_text_range() for i in range(len(doc))]
        doc.close()
    except Exception:
        return []
    return revisar_paginas(paginas)

def revisar_paginas(paginas):
    hallazgos, pasan = [], False
    for n, texto in enumerate(paginas, 1):
        texto = texto.replace("\r", "")
        for m in OPERACION.finditer(texto):
            antes, despues = texto[max(0, m.start() - 200):m.start()], texto[m.end():m.end() + 160]
            if re.search(r"[A-Za-zÁÉÍÓÚáéíóúñÑ][ \t]*$", antes) or re.match(r"[ \t]*[A-Za-zÁÉÍÓÚáéíóúñÑ]", despues):
                continue   # «38 = 3 dieces», «ramas (8) = 48»: forma parte de una frase, no es una cuenta suelta
            if ERROR_A_PROPOSITO.search(despues) or ERROR_A_PROPOSITO.search(antes):
                continue
            if re.match(r"[ \t]*\n[ \t]*[+\-−×·]", despues) or re.search(r"[+\-−×·=][ \t]*\n[ \t]*$", antes):
                continue   # la cuenta sigue en la otra línea: no se puede comprobar entera
            for cuenta in separar_cuentas(m.group(0)):
                valores = [valor(p) for p in cuenta.split("=")]
                # solo cuentas completas: si falta algo es un hueco para rellenar (o dos ejercicios pegados)
                partes = [p.strip() for p in cuenta.split("=")]
                # «17 = 10» o «20 + 20 = 10 + 10»: falta un signo dibujado o un hueco; una cuenta de verdad tiene
                # alguna operación y algún resultado (un número solo)
                if not any(re.fullmatch(r"\d+", p) for p in partes) or all(re.fullmatch(r"\d+", p) for p in partes):
                    continue
                if len(valores) >= 2 and None not in valores and len(set(valores)) > 1:
                    hallazgos.append(f"pág. {n}: la cuenta «{' '.join(cuenta.split())}» no cuadra")
        for m in re.finditer(r"(?<![\d,.])1 (" + "|".join(PLURALES_UNO) + r")\b", texto):
            hallazgos.append(f"pág. {n}: «1 {m.group(1)}» debería ir en singular")
        for m in re.finditer(r"(?<![\wáéíóúñ])(" + "|".join(REPETIBLES) + r")\s+\1(?![\wáéíóúñ])", texto, re.I):
            hallazgos.append(f"pág. {n}: palabra repetida «{' '.join(m.group(0).split())}»")
        pasan = pasan or bool(re.search(r"pasan? de 10\b", texto))
    if pasan:
        hallazgos.append("dice «pasan de 10» al reagrupar: con 10 justos también se forma un diez; quizá mejor «llegan a 10»")
    vistos, unicos = set(), []
    for h in hallazgos:
        if h not in vistos:
            vistos.add(h); unicos.append(h)
    return unicos

def avisar_revision(ruta):
    hallazgos = revisar_textos(ruta)
    if hallazgos:
        avisos.append(f"Revisión de textos de {ruta.name} (solo es un aviso, mira si es una errata): " + "; ".join(hallazgos[:8])
                      + (f"; y {len(hallazgos) - 8} más" if len(hallazgos) > 8 else ""))


def main():
    catalogo = cargar_catalogo()
    if catalogo is None:
        return terminar()
    por_archivo = {m.get("archivo"): m for m in catalogo if isinstance(m, dict)}
    if "--optimizar-todo" in sys.argv:
        for pdf in sorted(MATERIALES.glob("*.pdf")):
            optimizar(pdf)
    if "--revisar-todo" in sys.argv:    # revisión de textos de todos los PDF publicados
        for pdf in sorted(MATERIALES.glob("*.pdf")):
            avisar_revision(pdf)
    if "--aligerar-todo" in sys.argv:   # los PDF ya publicados que pesan demasiado
        for pdf in sorted(MATERIALES.glob("*.pdf")):
            aligerar(pdf)
    regenerar, llegados, nuevos, de_raiz = set(), set(), [], []

    # 1. Buzón subir/<curso>/ (y los PDF subidos por error a la carpeta principal del repositorio)
    en_raiz = sorted(p for p in RAIZ.glob("*") if p.is_file() and p.suffix.lower() == ".pdf")
    for pdf in (sorted(SUBIR.rglob("*")) if SUBIR.is_dir() else []) + en_raiz:
        if not pdf.is_file() or pdf.suffix.lower() != ".pdf":
            continue
        raiz = pdf.parent == RAIZ
        partes = pdf.relative_to(RAIZ if raiz else SUBIR).parts
        carpeta = None if raiz else (partes[0] if len(partes) > 1 else "")
        recurso = partes[1].strip() if not raiz and len(partes) > 2 else None
        recurso_nombre, tipo = convencion(pdf.stem)
        recurso = recurso_nombre or recurso
        if not se_puede_abrir(pdf):
            avisos.append(f"{pdf.relative_to(RAIZ)}: el PDF está dañado o protegido con contraseña; se ha dejado en "
                          "subir/ sin publicar. Bórralo y vuelve a subirlo exportado de nuevo.")
            continue
        etapas = CARPETAS.get(carpeta) if carpeta is not None else []   # en la raíz, el curso se busca en el PDF
        if etapas is None:
            avisos.append(f"{pdf.relative_to(RAIZ)}: la carpeta «{carpeta or 'subir'}» no es de ningún curso; "
                          "el material queda en «Sin curso asignado».")
            etapas = []
        destino = MATERIALES / nombre_seguro(pdf.name)
        repetido = destino.name in llegados
        if repetido:
            avisos.append(f"{pdf.relative_to(RAIZ)}: se ha subido a la vez otro PDF que se llama igual "
                          f"({destino.name}); solo se ha quedado este último. Cambia el nombre de uno de ellos.")
        llegados.add(destino.name)
        shutil.move(str(pdf), destino)
        optimizar(destino)
        aligerar(destino)
        avisar_revision(destino)
        if destino.name in por_archivo:
            regenerar.add(destino.name)
            cambios.append(f"Sustituido: {destino.name} (se conservan título, curso y descripción)")
            if not repetido:
                avisos.append(f"{destino.name} ya existía y se ha sustituido por el nuevo. Si era un material distinto, "
                              "recupera el anterior desde el historial de GitHub y sube este con otro nombre.")
        else:
            m = entrada_nueva(destino, etapas, recurso, tipo)
            if raiz:
                doc = abrir_pdf(destino); meta = doc.get_metadata_dict(); doc.close()   # el título original, con su «(2º Primaria)»
                m["etapas"] = deducir_etapas(" ".join([meta.get("Title") or "", meta.get("Subject") or "", m.get("desc", ""), pdf.stem]))
                de_raiz.append(m)
            catalogo.append(m); por_archivo[m["archivo"]] = m; nuevos.append(m)
            cambios.append(f"Nuevo: {m['archivo']} → «{m['titulo']}», {m['tipo']}, "
                           f"{', '.join(etapas) or 'sin curso'}" + (f", recurso «{recurso}»" if recurso else ""))

    # Presentación y ficha subidas a la vez con nombres distintos: se agrupan si se parecen
    emparejar(nuevos)
    for m in de_raiz:   # después de emparejar: una presentación sin curso toma el de su ficha
        avisos.append(f"{m['archivo']} estaba en la carpeta principal y no en subir/<curso>/; se ha publicado igual"
                      + (f" en {', '.join(m['etapas'])} (curso leído en el PDF o en su pareja)." if m["etapas"] else
                         ". No se sabe su curso: ponlo en catalogo.json o súbelo otra vez a su carpeta."))

    # 2. PDF subidos directamente a materiales/
    for pdf in sorted(MATERIALES.glob("*")):
        if pdf.is_file() and pdf.suffix.lower() == ".pdf" and pdf.name not in por_archivo:
            if not se_puede_abrir(pdf):
                avisos.append(f"materiales/{pdf.name}: el PDF está dañado o protegido con contraseña; no se publica.")
                continue
            optimizar(pdf); aligerar(pdf)
            m = entrada_nueva(pdf, [], *convencion(pdf.stem))
            catalogo.append(m); por_archivo[m["archivo"]] = m
            cambios.append(f"Nuevo: {m['archivo']} → «{m['titulo']}» (sin curso: súbelo a subir/<curso>/ "
                           "o pon sus «etapas» en catalogo.json)")

    # 3. Materiales cuyo PDF ya no existe
    for m in list(catalogo):
        if isinstance(m, dict) and isinstance(m.get("archivo"), str) and not (MATERIALES / m["archivo"]).is_file():
            catalogo.remove(m)
            cambios.append(f"Retirado: {m['archivo']} (se borró el PDF)")

    # 4. Páginas, peso y portadas
    PORTADAS.mkdir(exist_ok=True)
    for m in catalogo:
        if not isinstance(m, dict) or not isinstance(m.get("archivo"), str):
            continue
        ruta = MATERIALES / m["archivo"]
        try:
            doc = abrir_pdf(ruta); pags = len(doc); doc.close()
        except Exception:  # PDF dañado o protegido: no bloquea la publicación del resto
            avisos.append(f"{m['archivo']}: el PDF no se puede abrir (¿dañado o con contraseña?). "
                          "Súbelo de nuevo exportado otra vez.")
            continue
        m["pags"], m["peso"] = pags, round(ruta.stat().st_size / 1024)
        if m["peso"] > AVISO_PESO_KB:
            avisos.append(f"{m['archivo']} pesa {m['peso'] / 1024:.1f} MB: tarda en abrirse en el móvil; conviene comprimirlo.")
        if not str(m.get("desc", "")).strip():
            avisos.append(f"{m['archivo']}: no tiene descripción («desc» en catalogo.json).")
        if not m.get("etapas"):
            avisos.append(f"{m['archivo']}: no tiene curso; aparece en «Sin curso asignado».")
        portada = PORTADAS / (ruta.stem + ".jpg")
        if m["archivo"] in regenerar or not portada.exists():
            try:
                generar_portada(ruta)
            except Exception:
                avisos.append(f"{m['archivo']}: no se ha podido dibujar la portada; la web la dibujará sola.")

    # Portadas que ya no corresponden a ningún material
    vivos = {Path(m["archivo"]).stem for m in catalogo if isinstance(m, dict) and isinstance(m.get("archivo"), str)}
    for jpg in PORTADAS.glob("*.jpg"):
        if jpg.stem not in vivos:
            jpg.unlink()

    # Temas de contenido para los materiales que aún no los tienen
    for m in catalogo:
        if isinstance(m, dict) and "temas" not in m and m.get("tipo") != "Programación":
            m["temas"] = deducir_temas(m)
            if m["temas"]:
                cambios.append(f"Temas: {m['archivo']} → {', '.join(m['temas'])}")

    # 5. Comprobación final
    validar(catalogo)
    escribir_catalogo(catalogo)
    if not errores:
        escribir_sitemap(catalogo)
    return terminar()


WEB = "https://damp83.github.io/Librodigital/"

def escribir_sitemap(catalogo):
    """sitemap.xml para que los buscadores encuentren la web y cada PDF (las vistas con # no se indexan)."""
    from urllib.parse import quote
    from xml.sax.saxutils import escape
    fechas = [m["fecha"] for m in catalogo if isinstance(m, dict) and m.get("fecha")]
    urls = [(WEB, max(fechas) if fechas else None)]
    urls += [(WEB + "materiales/" + quote(m["archivo"]), m.get("fecha")) for m in catalogo
             if isinstance(m, dict) and m.get("archivo") and m.get("tipo") != "Programación"]
    lineas = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, fecha in urls:
        lineas.append("  <url><loc>" + escape(url) + "</loc>" + ("<lastmod>" + fecha + "</lastmod>" if fecha else "") + "</url>")
    texto = "\n".join(lineas + ["</urlset>", ""])
    destino = RAIZ / "sitemap.xml"
    if not destino.exists() or destino.read_text(encoding="utf-8") != texto:
        destino.write_text(texto, encoding="utf-8")


def terminar():
    resumen = ["## Catálogo del aula", ""]
    resumen += ["### Cambios", *[f"- {c}" for c in cambios], ""] if cambios else ["Sin materiales nuevos.", ""]
    if avisos:
        resumen += ["### Avisos", *[f"- {a}" for a in avisos], ""]
    if errores:
        resumen += ["### Errores (la web NO se ha actualizado)", *[f"- {e}" for e in errores], ""]
    texto = "\n".join(resumen)
    print(texto)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(texto + "\n")
    for e in errores:
        print(f"::error title=Catálogo::{e}")
    for a in avisos:
        print(f"::warning title=Catálogo::{a}")
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main())
