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
    "Medida": [r"\bmedida", r"\blongitud", r"\bcentimetros?\b", r"\bmetros?\b", r"\bmedir\b"],
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
    texto = norm(archivo + " " + titulo)
    for palabras, tipo in [(("cuaderno",), "Cuaderno"),
                           (("programacion", "secuencia", "situacion de aprendizaje"), "Programación"),
                           (("bingo", "juego", "domino", "cartas", "tablero", "loteria"), "Juego"),
                           (("presentacion",), "Presentación"),
                           (("ficha",), "Ficha")]:
        if any(p in texto for p in palabras):
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
    return {p for p in re.findall(r"[a-z0-9]+", texto) if p not in PALABRAS_VACIAS and (len(p) > 2 or p.isdigit())}


def emparejar(nuevos):
    """Une en un recurso cada presentación y ficha subidas a la vez al mismo curso que comparten palabras
    del nombre o del título (p. ej. «Mision_Medida.pdf» y «Ficha_multinivel_Medida.pdf»)."""
    pres = [m for m in nuevos if m.get("tipo") == "Presentación" and "recurso" not in m]
    fichas = [m for m in nuevos if m.get("tipo") == "Ficha" and "recurso" not in m]
    pares = []
    for p in pres:
        for f in fichas:
            comunes = palabras_clave(p) & palabras_clave(f)
            if comunes and p.get("etapas") == f.get("etapas"):
                pares.append((len(comunes), p, f))
    usados = set()
    for _, p, f in sorted(pares, key=lambda x: -x[0]):
        if p["archivo"] in usados or f["archivo"] in usados:
            continue
        usados |= {p["archivo"], f["archivo"]}
        nombre = titulo_limpio(str(f.get("titulo") or p.get("titulo")))
        p["recurso"] = f["recurso"] = nombre
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


def main():
    catalogo = cargar_catalogo()
    if catalogo is None:
        return terminar()
    por_archivo = {m.get("archivo"): m for m in catalogo if isinstance(m, dict)}
    if "--optimizar-todo" in sys.argv:
        for pdf in sorted(MATERIALES.glob("*.pdf")):
            optimizar(pdf)
    regenerar, llegados, nuevos = set(), set(), []

    # 1. Buzón subir/<curso>/
    for pdf in sorted(SUBIR.rglob("*")) if SUBIR.is_dir() else []:
        if not pdf.is_file() or pdf.suffix.lower() != ".pdf":
            continue
        partes = pdf.relative_to(SUBIR).parts
        carpeta = partes[0] if len(partes) > 1 else ""
        recurso = partes[1].strip() if len(partes) > 2 else None
        recurso_nombre, tipo = convencion(pdf.stem)
        recurso = recurso_nombre or recurso
        if not se_puede_abrir(pdf):
            avisos.append(f"{pdf.relative_to(RAIZ)}: el PDF está dañado o protegido con contraseña; se ha dejado en "
                          "subir/ sin publicar. Bórralo y vuelve a subirlo exportado de nuevo.")
            continue
        etapas = CARPETAS.get(carpeta)
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
        if destino.name in por_archivo:
            regenerar.add(destino.name)
            cambios.append(f"Sustituido: {destino.name} (se conservan título, curso y descripción)")
            if not repetido:
                avisos.append(f"{destino.name} ya existía y se ha sustituido por el nuevo. Si era un material distinto, "
                              "recupera el anterior desde el historial de GitHub y sube este con otro nombre.")
        else:
            m = entrada_nueva(destino, etapas, recurso, tipo)
            catalogo.append(m); por_archivo[m["archivo"]] = m; nuevos.append(m)
            cambios.append(f"Nuevo: {m['archivo']} → «{m['titulo']}», {m['tipo']}, "
                           f"{', '.join(etapas) or 'sin curso'}" + (f", recurso «{recurso}»" if recurso else ""))

    # Presentación y ficha subidas a la vez con nombres distintos: se agrupan si se parecen
    emparejar(nuevos)

    # 2. PDF subidos directamente a materiales/
    for pdf in sorted(MATERIALES.glob("*")):
        if pdf.is_file() and pdf.suffix.lower() == ".pdf" and pdf.name not in por_archivo:
            if not se_puede_abrir(pdf):
                avisos.append(f"materiales/{pdf.name}: el PDF está dañado o protegido con contraseña; no se publica.")
                continue
            optimizar(pdf)
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
    return terminar()


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
