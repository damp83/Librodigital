"""Mantiene al día el catálogo del aula.

Lo ejecuta GitHub Actions en cada cambio de la rama main (.github/workflows/publicar.yml),
pero también se puede lanzar a mano:  pip install pypdfium2 pillow && python scripts/actualizar_catalogo.py

Qué hace:
  1. Mueve los PDF de subir/<curso>/ a materiales/ y los añade al catálogo
     (o sustituye el archivo si ya existía uno con el mismo nombre, sin tocar sus datos).
     Los PDF de una subcarpeta, subir/<curso>/<Nombre del recurso>/, se agrupan en un
     mismo recurso (por ejemplo, una presentación y su ficha).
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
LADO_PORTADA = 360        # píxeles del lado mayor de la portada
AVISO_PESO_KB = 2048      # a partir de aquí se avisa de que conviene comprimir el PDF

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


def entrada_nueva(ruta, etapas, recurso=None):
    doc = abrir_pdf(ruta)
    meta = doc.get_metadata_dict()
    ancho, alto = doc[0].get_size()
    doc.close()
    titulo = (meta.get("Title") or "").strip()
    if not titulo or re.match(r"^(microsoft|untitled|sin t[ií]tulo|presentaci[oó]n de powerpoint|documento)", titulo, re.I):
        titulo = ruta.stem
    if " " not in titulo:                     # título sacado del nombre del archivo: «Mi_ficha» -> «Mi ficha»
        titulo = re.sub(r"[_-]+", " ", titulo).strip()
    titulo = titulo_limpio(titulo)
    return {
        "archivo": ruta.name,
        "titulo": titulo,
        "etapas": etapas,
        "tipo": deducir_tipo(ruta.name, titulo, ancho > alto),
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
        if "fecha" in m:
            try:
                datetime.date.fromisoformat(m["fecha"])
            except (TypeError, ValueError):
                errores.append(f"{nombre}: «fecha» debe tener la forma AAAA-MM-DD.")


def escribir_catalogo(catalogo):
    """Un material por bloque y las listas cortas en una línea, para que sea fácil de editar a mano."""
    orden = ["archivo", "titulo", "etapas", "tipo", "recurso", "desc", "pags", "peso", "fecha"]
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
    regenerar = set()

    # 1. Buzón subir/<curso>/
    for pdf in sorted(SUBIR.rglob("*")) if SUBIR.is_dir() else []:
        if not pdf.is_file() or pdf.suffix.lower() != ".pdf":
            continue
        partes = pdf.relative_to(SUBIR).parts
        carpeta = partes[0] if len(partes) > 1 else ""
        recurso = partes[1].strip() if len(partes) > 2 else None
        etapas = CARPETAS.get(carpeta)
        if etapas is None:
            avisos.append(f"{pdf.relative_to(RAIZ)}: la carpeta «{carpeta or 'subir'}» no es de ningún curso; "
                          "el material queda en «Sin curso asignado».")
            etapas = []
        destino = MATERIALES / nombre_seguro(pdf.name)
        shutil.move(str(pdf), destino)
        if destino.name in por_archivo:
            regenerar.add(destino.name)
            cambios.append(f"Sustituido: {destino.name} (se conservan título, curso y descripción)")
        else:
            m = entrada_nueva(destino, etapas, recurso)
            catalogo.append(m); por_archivo[m["archivo"]] = m
            cambios.append(f"Nuevo: {m['archivo']} → «{m['titulo']}», {m['tipo']}, "
                           f"{', '.join(etapas) or 'sin curso'}" + (f", recurso «{recurso}»" if recurso else ""))

    # 2. PDF subidos directamente a materiales/
    for pdf in sorted(MATERIALES.glob("*")):
        if pdf.is_file() and pdf.suffix.lower() == ".pdf" and pdf.name not in por_archivo:
            m = entrada_nueva(pdf, [])
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
        except Exception as e:  # PDF dañado o protegido
            errores.append(f"{m['archivo']}: no se puede abrir el PDF ({e}).")
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
            generar_portada(ruta)

    # Portadas que ya no corresponden a ningún material
    vivos = {Path(m["archivo"]).stem for m in catalogo if isinstance(m, dict) and isinstance(m.get("archivo"), str)}
    for jpg in PORTADAS.glob("*.jpg"):
        if jpg.stem not in vivos:
            jpg.unlink()

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
