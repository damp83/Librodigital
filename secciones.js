/* =====================================================================
   SECCIONES
   - Ruta del curso (#/ruta): las 15 unidades de la Secuencia OAOA con sus materiales (ruta.json)
   - Para las familias (#/familias): guía para casa y regletas para recortar
   - Imprimir páginas sueltas desde el lector
   Usa las utilidades de index.html y herramientas.js ($, svg, esc, L, MATERIALES, REGLETA…).
   ===================================================================== */

/* ---------------------------------------------------------------------
   RUTA DEL CURSO
   --------------------------------------------------------------------- */
let RUTA = null;
const NOMBRE_TRIM = ["1.er trimestre", "2.º trimestre", "3.er trimestre"];

function trimestreActual(){   // septiembre-diciembre, enero-marzo, abril-junio; en verano, ninguno
  const m = new Date().getMonth() + 1;
  return m >= 9 ? 0 : m <= 3 ? 1 : m <= 6 ? 2 : -1;
}
function enlaceMaterial(archivo, pagina, texto, detalle, icono){
  return '<a class="trim-enlace" href="#/leer/'+encodeURIComponent(archivo)+(pagina ? "/"+pagina : "")+'">'+svg(icono || "abrir")+
         '<span>'+esc(texto)+(detalle ? '<small>'+esc(detalle)+'</small>' : '')+'</span></a>';
}
/* Un nombre de ruta.json puede ser un recurso (presentación + ficha) o un archivo suelto */
function enlacesRecurso(nombre){
  const partes = MATERIALES.filter(m=> m.recurso===nombre || m.archivo===nombre)
                           .sort((a,b)=>ORDEN_TIPO(a.tipo)-ORDEN_TIPO(b.tipo));
  return partes.map(p=> enlaceMaterial(p.archivo, null, p.recurso ? p.recurso : p.titulo, p.tipo+" · "+pagsTexto(p.pags), ICONO_TIPO[p.tipo])).join("");
}

async function iniciarRuta(){
  const cont = $("rutaCuerpo");
  if(!RUTA){
    cont.innerHTML = '<p class="p-nota">Cargando la ruta…</p>';
    try{ RUTA = await (await fetch("ruta.json", {cache:"no-cache"})).json(); }
    catch(e){ cont.innerHTML = '<p class="p-nota">No se ha podido cargar la ruta del curso.</p>'; return; }
  }
  const guardada = leer("aula-ruta-curso", null);
  pintarRuta(RUTA.cursos.some(c=>c.etapa===guardada) ? guardada : RUTA.cursos[0].etapa);
}
function pintarRuta(etapa){
  guardar("aula-ruta-curso", etapa);
  const curso = RUTA.cursos.find(c=>c.etapa===etapa), ahora = trimestreActual(), cont = $("rutaCuerpo");
  const secuencia = MATERIALES.find(m=>m.archivo===RUTA.secuencia);
  const paraVarios = MATERIALES.filter(m=> m.etapas.length>1 && m.etapas.includes(etapa) && m.archivo!==RUTA.secuencia);
  cont.style.setProperty("--c", COLOR_ETAPA[etapa]);
  cont.innerHTML =
    '<div class="p-cabeza"><p class="eti-pag">Secuencia didáctica OAOA</p>'+
      '<h2>Ruta del curso</h2>'+
      '<p class="p-intro">Qué se trabaja cada trimestre, cómo saber si se ha conseguido y con qué materiales. '+
      'Está sacada de la <i>Secuencia didáctica anual OAOA</i>.</p></div>'+
    '<div class="ruta-cursos" role="group" aria-label="Curso">'+RUTA.cursos.map(c=>
      '<button data-etapa="'+esc(c.etapa)+'" aria-pressed="'+(c.etapa===etapa)+'"><i style="background:'+COLOR_ETAPA[c.etapa]+'"></i>'+esc(NOMBRE_ETAPA[c.etapa])+'</button>').join("")+'</div>'+
    '<p class="ruta-enfoque"><b>Enfoque del curso:</b> '+esc(curso.enfoque)+'</p>'+
    '<div class="reto-botones"><a class="bt azul" href="#/aula/'+SLUG_DE[etapa]+'">'+svg("candado")+'Modo aula de '+esc(NOMBRE_ETAPA[etapa])+'</a>'+
      '<button class="bt suave" id="rutaEnlaceAula">'+svg("compartir")+'Enlace y QR para las tabletas</button></div>'+
    '<div class="trimestres">'+curso.trimestres.map((t,i)=>{
      const enlaces = [];
      if(secuencia && t.secuencia) enlaces.push(enlaceMaterial(secuencia.archivo, t.secuencia, "La unidad en la secuencia", "Actividades por niveles · pág. "+t.secuencia, "ruta"));
      if(curso.cuaderno && t.cuaderno) enlaces.push(enlaceMaterial(curso.cuaderno, t.cuaderno[0], "Fichas del cuaderno anual", "Páginas "+t.cuaderno[0]+" a "+t.cuaderno[1], "notas"));
      (t.recursos||[]).forEach(r=> enlaces.push(enlacesRecurso(r)));
      return '<article class="trim'+(i===ahora ? ' ahora' : '')+'">'+
        '<div class="trim-cab"><span class="trim-num">'+NOMBRE_TRIM[i]+' · '+esc(t.meses)+'</span>'+(i===ahora ? '<span class="ahora-eti">Ahora</span>' : '')+'</div>'+
        '<h3>'+esc(t.titulo)+'</h3>'+
        '<p>'+esc(t.objetivo)+'</p>'+
        '<p class="indicador"><b>Indicador de logro:</b> '+esc(t.indicador)+'</p>'+
        '<div class="trim-enlaces">'+enlaces.join("")+'</div></article>';
    }).join("")+'</div>'+
    '<section class="ruta-todo"><h3>Para todo el curso</h3><div class="trim-enlaces">'+
        paraVarios.map(m=> enlaceMaterial(m.archivo, null, m.titulo, m.tipo+" · "+textoCurso(m), ICONO_TIPO[m.tipo])).join("")+
        '<a class="trim-enlace" href="#/regletas">'+svg("contenido")+'<span>Regletas virtuales<small>Herramienta para la pizarra digital</small></span></a>'+
        (etapa!=="3 años" ? '<a class="trim-enlace" href="#/bombo">'+svg("bola")+'<span>Bombo del bingo<small>Herramienta para el aula</small></span></a>' : '')+
        (etapa!=="3 años" ? '<a class="trim-enlace" href="#/calculo">'+svg("contenido")+'<span>Cálculo mental<small>'+(etapa.includes("años") ? "Uno más, sumas y parejas del 10" : "Calentamiento diario de 5 a 10 minutos")+'</small></span></a>' : '')+
        (["5 años","1.º","2.º"].includes(etapa) ? '<a class="trim-enlace" href="#/partes">'+svg("ruta")+'<span>Partes y todo<small>El diagrama partes-todo con regletas</small></span></a>' : '')+
        (["1.º","2.º"].includes(etapa) ? '<a class="trim-enlace" href="#/panel">'+svg("contenido")+'<span>Panel del 100<small>Cruces numéricas y patrones</small></span></a>' : '')+
        (["5 años","1.º"].includes(etapa) ? '<a class="trim-enlace" href="#/marco">'+svg("contenido")+'<span>Marco del 10<small>Cantidades de un vistazo</small></span></a>' : '')+
        (["5 años","1.º"].includes(etapa) ? '<a class="trim-enlace" href="#/muros">'+svg("contenido")+'<span>Muros numéricos<small>'+(etapa==="1.º" ? "El muro del 10 y las parejas" : "Muros del 3 al 10")+'</small></span></a>' : '')+
      '</div></section>';
  $("rutaEnlaceAula").onclick = ()=> abrirCompartir("Modo aula · "+NOMBRE_ETAPA[etapa], "#/aula/"+SLUG_DE[etapa]);
  cont.querySelectorAll(".ruta-cursos button").forEach(b=> b.onclick = ()=>{ pintarRuta(b.dataset.etapa); cont.querySelector('.ruta-cursos [aria-pressed="true"]')?.focus(); });
}

/* ---------------------------------------------------------------------
   PARA LAS FAMILIAS
   --------------------------------------------------------------------- */
let familiasLista = false;
function iniciarFamilias(){
  if(familiasLista) return;
  familiasLista = true;
  pintarIconos($("vFamilias"));
  $("famRegletas").innerHTML = REGLETA.slice(1).map((r,i)=>{
    const n = i+1;
    return '<div class="tr-fila"><span><b>'+n+'</b> · '+r.n+'</span>'+
           '<span class="tr-reg" style="width:calc('+n+' * min(9%, 52px));background:'+r.c+';color:'+r.t+
           (n===1 ? ';box-shadow:inset 0 0 0 1px #c8ced6' : '')+'">'+n+'</span></div>';
  }).join("");
  $("famRecortables").onclick = imprimirRecortables;
}

/* ---------------------------------------------------------------------
   IMPRIMIR (páginas sueltas del lector y regletas para recortar)
   --------------------------------------------------------------------- */
function lanzarImpresion(){
  const limpiar = ()=>{
    document.body.classList.remove("imprimiendo");
    $("impresion").querySelectorAll("img").forEach(i=> URL.revokeObjectURL(i.src));
    $("impresion").innerHTML = "";
  };
  document.body.classList.add("imprimiendo");
  addEventListener("afterprint", limpiar, {once:true});
  setTimeout(()=> window.print(), 50);
}

function imprimirRecortables(){
  const ancho = 180;   // mm útiles en un A4 con márgenes de 10 mm
  let filas = "";
  for(let n=1; n<=10; n++){
    const r = REGLETA[n], cuantas = Math.floor(ancho / (n*10));
    const fila = '<div class="rc-fila">'+Array.from({length:cuantas}, ()=>
      '<span class="rc-pieza" style="width:'+(n*10)+'mm;background:'+r.c+';color:'+r.t+'">'+n+'</span>').join("")+'</div>';
    filas += fila + fila;   // dos filas de cada una
  }
  $("impresion").innerHTML = '<div class="recortables"><h1>Regletas para recortar</h1>'+
    '<p>Aula de Matemáticas Manipulativas · Imprime al 100 % («tamaño real»): cada cuadradito mide 1 cm. Recorta por las líneas negras.</p>'+filas+'</div>';
  lanzarImpresion();
}

function abrirImprimir(){
  if(!L.doc) return;
  const v = visibles(L.pag);
  $("diActual").textContent = v.length>1 ? "Las páginas que se ven ("+v.join(" y ")+")" : "Esta página ("+v[0]+")";
  $("diTodo").textContent = "Todo el material ("+pagsTexto(L.n)+")";
  $("diDesde").value = v[0]; $("diHasta").value = v[v.length-1];
  $("diDesde").max = $("diHasta").max = L.n;
  $("diEstado").textContent = "";
  document.querySelector('input[name="diQue"][value="actual"]').checked = true;
  $("diImprimir").disabled = false;
  $("dImprimir").showModal();
}
async function imprimirPaginas(){
  const que = document.querySelector('input[name="diQue"]:checked').value, v = visibles(L.pag);
  let desde = v[0], hasta = v[v.length-1];
  if(que==="todo"){ desde = 1; hasta = L.n; }
  if(que==="rango"){
    desde = Math.max(1, Math.min(L.n, parseInt($("diDesde").value,10) || 1));
    hasta = Math.max(desde, Math.min(L.n, parseInt($("diHasta").value,10) || desde));
  }
  const total = hasta - desde + 1, estado = $("diEstado"), boton = $("diImprimir"), doc = L.doc;
  if(total > 40 && !confirm("Vas a imprimir "+total+" páginas. Prepararlas puede tardar un poco. ¿Seguir?")) return;
  boton.disabled = true;
  const cont = $("impresion"); cont.innerHTML = "";
  try{
    for(let p=desde; p<=hasta; p++){
      estado.textContent = "Preparando la página "+p+" ("+(p-desde+1)+" de "+total+")…";
      const pg = await doc.getPage(p), v1 = pg.getViewport({scale:1});
      const vp = pg.getViewport({scale: Math.min(2.4, 1700 / Math.max(v1.width, v1.height))});   // unos 150 ppp en A4
      const c = document.createElement("canvas"); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      await pg.render({canvasContext: c.getContext("2d"), viewport: vp}).promise;
      const blob = await new Promise(ok=> c.toBlob(ok, "image/jpeg", .92));
      const img = new Image(); img.alt = "Página "+p; img.src = URL.createObjectURL(blob);
      await img.decode().catch(()=>{});
      cont.appendChild(img);
      if(L.doc !== doc) throw new Error("cerrado");
    }
  }catch(e){ estado.textContent = "No se han podido preparar las páginas."; boton.disabled = false; cont.innerHTML = ""; return; }
  estado.textContent = ""; boton.disabled = false;
  $("dImprimir").close();
  lanzarImpresion();
}
$("lImprimir").onclick = abrirImprimir;
$("diImprimir").onclick = imprimirPaginas;
$("diCerrar").onclick = ()=> $("dImprimir").close();
$("dImprimir").addEventListener("click", e=>{ if(e.target===$("dImprimir")) $("dImprimir").close(); });
["diDesde","diHasta"].forEach(id=> $(id).addEventListener("focus", ()=>{ document.querySelector('input[name="diQue"][value="rango"]').checked = true; }));
pintarIconos($("dImprimir"));

/* ---------------------------------------------------------------------
   RETO DE LA SEMANA (reto.json): la semana más reciente que ya ha empezado
   --------------------------------------------------------------------- */
let RETO = null, retoFiltrando = false;
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

async function cargarReto(){
  try{
    const datos = await (await fetch("reto.json", {cache:"no-cache"})).json();
    const hoy = new Date(), dia = hoy.getFullYear()+"-"+String(hoy.getMonth()+1).padStart(2,"0")+"-"+String(hoy.getDate()).padStart(2,"0");
    RETO = (datos.semanas||[]).filter(s=> s.desde <= dia && (s.retos||[]).length).sort((a,b)=> a.desde < b.desde ? 1 : -1)[0] || null;
  }catch(e){ RETO = null; }
  pintarReto();
  if(vistaAbierta==="clase") iniciarClase();   // el reto de la clase, si llegó después
}
function mostrarReto(filtrando){ retoFiltrando = filtrando; pintarReto(); }
function pintarReto(){
  const cont = $("reto");
  if(!RETO || retoFiltrando){ cont.hidden = true; return; }
  const niveles = RETO.retos.map(r=>r.nivel), guardado = leer("aula-reto-nivel", null);
  const nivel = niveles.includes(guardado) ? guardado : niveles[0], r = RETO.retos.find(x=>x.nivel===nivel);
  const [a, m, d] = RETO.desde.split("-").map(Number);
  cont.innerHTML =
    '<div class="reto-cab"><span class="reto-eti">'+svg("bola")+'Reto de la semana</span>'+
      '<span class="reto-fecha">Semana del '+d+' de '+MESES[m-1]+'</span>'+
      '<h2 id="retoTit" class="sr">Reto de la semana</h2><span style="flex:1"></span>'+
      (niveles.length>1 ? '<div class="segmentos" role="group" aria-label="Nivel del reto">'+niveles.map(n=>
        '<button data-nivel="'+esc(n)+'" aria-pressed="'+(n===nivel)+'">'+esc(n)+'</button>').join("")+'</div>' : '')+
    '</div>'+
    '<div class="reto-cuerpo"><p class="reto-titulo">'+esc(r.titulo)+'</p><p class="reto-texto">'+esc(r.texto)+'</p>'+
      '<p class="reto-extra" id="retoPista" hidden><b>Pista:</b> '+esc(r.pista||"")+'</p>'+
      '<p class="reto-extra" id="retoSolucion" hidden><b>Solución:</b> '+esc(r.solucion||"")+'</p>'+
      '<div class="reto-botones">'+
        (r.pista ? '<button class="bt suave" id="retoVerPista" aria-expanded="false" aria-controls="retoPista">Ver una pista</button>' : '')+
        (r.solucion ? '<button class="bt suave" id="retoVerSol" aria-expanded="false" aria-controls="retoSolucion">Ver la solución</button>' : '')+
        (r.enlace && /^#\//.test(r.enlace.ruta) ? '<a class="bt azul" href="'+esc(r.enlace.ruta)+'">'+esc(r.enlace.texto)+'</a>' : '')+
        '<button class="bt suave" id="retoCompartir">'+svg("compartir")+'Compartir</button>'+
      '</div></div>';
  cont.querySelectorAll("[data-nivel]").forEach(b=> b.onclick = ()=>{ guardar("aula-reto-nivel", b.dataset.nivel); pintarReto(); cont.querySelector('[aria-pressed="true"]')?.focus(); });
  const alternar = (boton, caja)=>{ const abierto = boton.getAttribute("aria-expanded")!=="true";
    boton.setAttribute("aria-expanded", abierto); $(caja).hidden = !abierto; };
  $("retoVerPista")?.addEventListener("click", e=> alternar(e.currentTarget, "retoPista"));
  $("retoVerSol")?.addEventListener("click", e=> alternar(e.currentTarget, "retoSolucion"));
  $("retoCompartir").onclick = ()=> abrirCompartir("Reto de la semana: "+r.titulo, "#/");
  cont.hidden = false;
}


/* ---------------------------------------------------------------------
   MODO AULA (#/aula/5-anios): una pantalla sencilla con lo de una clase.
   La tableta recuerda su clase (aula-clase) y vuelve a ella; para salir,
   mantener pulsado «Salir» 3 segundos.
   --------------------------------------------------------------------- */
const SLUG_DE = {"3 años":"3-anios", "4 años":"4-anios", "5 años":"5-anios", "1.º":"1-primaria", "2.º":"2-primaria"};
const ETAPA_DE = Object.fromEntries(Object.entries(SLUG_DE).map(([e,s])=>[s,e]));
/* Herramientas de cada curso (según la secuencia) */
const HERR_CURSO = {
  "3 años": ["regletas"],
  "4 años": ["regletas", "calculo", "bombo"],
  "5 años": ["minuto", "regletas", "marco", "muros", "partes", "geoplano", "calculo", "bombo"],
  "1.º":    ["minuto", "regletas", "calculo", "marco", "muros", "partes", "panel", "piramides", "geoplano", "calculadora", "bombo"],
  "2.º":    ["minuto", "regletas", "calculo", "panel", "partes", "piramides", "redondeo", "estimacion", "geoplano", "calculadora", "bombo"]};
let claseSlug = null;

async function obtenerRuta(){
  if(!RUTA){ try{ RUTA = await (await fetch("ruta.json", {cache:"no-cache"})).json(); }catch(e){ return null; } }
  return RUTA;
}
function abrirClase(slug){
  if(!ETAPA_DE[slug]){ location.replace("#/"); return; }
  claseSlug = slug;
  guardar("aula-clase", slug);
  if(vistaAbierta==="clase") iniciarClase(); else abrirHerramienta("clase");
}
async function iniciarClase(){
  const etapa = ETAPA_DE[claseSlug], cont = $("clCuerpo"), color = COLOR_ETAPA[etapa];
  $("clTit").textContent = "Clase de "+(etapa.includes("años") ? etapa : NOMBRE_ETAPA[etapa]);
  $("clRegleta").style.background = color;
  cont.style.setProperty("--c", color);
  cont.classList.toggle("cl-infantil", etapa.includes("años"));
  const ruta = await obtenerRuta(), curso = ruta?.cursos.find(c=>c.etapa===etapa), t = trimestreActual();
  const trim = curso && t>=0 ? curso.trimestres[t] : null;
  const imagen = m => '<img alt="" src="'+srcPortada(m)+'" loading="lazy">';
  const ficha = (href, dentro, texto, extra, grande)=> '<a class="cl-ficha'+(grande ? ' grande' : '')+'" href="'+href+'">'+dentro+'<span>'+esc(texto)+(extra ? '<small>'+esc(extra)+'</small>' : '')+'</span></a>';

  // Este trimestre: las fichas del cuaderno y los recursos de la unidad
  const trimestre = [];
  if(trim && curso.cuaderno){
    const cu = MATERIALES.find(m=>m.archivo===curso.cuaderno);
    if(cu) trimestre.push(ficha("#/leer/"+encodeURIComponent(cu.archivo)+"/"+trim.cuaderno[0], imagen(cu), "Nuestras fichas", "Páginas "+trim.cuaderno[0]+" a "+trim.cuaderno[1], true));
  }
  (trim?.recursos || []).forEach(r=>{
    const m = MATERIALES.filter(x=>x.recurso===r || x.archivo===r).sort((a,b)=>ORDEN_TIPO(a.tipo)-ORDEN_TIPO(b.tipo))[0];
    if(m) trimestre.push(ficha("#/leer/"+encodeURIComponent(m.archivo), imagen(m), m.recurso || m.titulo, m.recurso ? "Presentación y ficha" : m.tipo, true));
  });
  // Seguir donde lo dejó la clase (si el último material abierto es de este curso)
  const reciente = leer("aula-reciente", null), mr = reciente && MATERIALES.find(m=>m.archivo===reciente.archivo && m.etapas.includes(etapa));
  if(mr) trimestre.unshift(ficha("#/leer/"+encodeURIComponent(mr.archivo)+"/"+(reciente.pag||1), imagen(mr), "Seguir", (mr.recurso || mr.titulo)+" · página "+(reciente.pag||1), true));

  // Todos los materiales del curso (sin la programación, que es para el docente)
  const materiales = unidades().filter(u=> u.etapas.includes(etapa) && u.partes.some(p=>p.tipo!=="Programación"))
    .map(u=>{ const m = u.partes[0]; return ficha("#/leer/"+encodeURIComponent(m.archivo), imagen(m), u.recurso || m.titulo, u.recurso ? "Presentación y ficha" : m.tipo); });

  // Herramientas: el mismo dibujo que en la biblioteca, en grande
  const herramientas = (HERR_CURSO[etapa]||[]).map(id=>{
    const f = document.querySelector('#herr .herr-ficha[href="#/'+id+'"]');
    return f ? ficha("#/"+id, f.querySelector(".herr-ilus").outerHTML, f.querySelector(".herr-txt b").textContent) : "";
  });

  // Reto de la semana en el nivel de la clase
  const nivel = etapa.includes("años") ? "Infantil" : "Primaria", reto = RETO?.retos.find(r=>r.nivel===nivel);

  cont.innerHTML =
    (trimestre.length ? '<h2>Este trimestre</h2>'+(trim ? '<p class="cl-trimestre">'+esc(trim.titulo)+'</p>' : '')+'<div class="cl-rejilla">'+trimestre.join("")+'</div>' : '')+
    (herramientas.length ? '<h2>Para jugar</h2><div class="cl-rejilla herr-cl">'+herramientas.join("")+'</div>' : '')+
    (reto ? '<h2>Reto de la semana</h2><div class="cl-reto"><p class="reto-titulo">'+esc(reto.titulo)+'</p><p class="reto-texto">'+esc(reto.texto)+'</p>'+
      (reto.solucion ? '<p class="reto-extra" id="clSol" hidden><b>Solución:</b> '+esc(reto.solucion)+'</p><div class="reto-botones"><button class="bt suave" id="clVerSol" aria-expanded="false" aria-controls="clSol">Ver la solución</button></div>' : '')+'</div>' : '')+
    (materiales.length ? '<h2>Nuestros materiales</h2><div class="cl-rejilla">'+materiales.join("")+'</div>' : '');
  cont.querySelectorAll("img").forEach(i=> i.onerror = ()=> i.remove());
  $("clVerSol")?.addEventListener("click", e=>{ const b = e.currentTarget, a = b.getAttribute("aria-expanded")!=="true"; b.setAttribute("aria-expanded", a); $("clSol").hidden = !a; });
}

/* Candado: mantener pulsado 3 s (con el dedo, el ratón o Intro/espacio) */
(function(){
  const b = $("clSalir"); let t = null;
  const empezar = e=>{ if(e.type==="keydown" && (e.repeat || !(e.key==="Enter" || e.key===" "))) return; e.preventDefault();
    b.classList.add("pulsando"); clearTimeout(t);
    t = setTimeout(()=>{ b.classList.remove("pulsando"); try{ localStorage.removeItem("aula-clase"); }catch(err){} claseSlug = null; location.hash = "#/"; }, 3000); };
  const soltar = ()=>{ clearTimeout(t); b.classList.remove("pulsando"); };
  b.addEventListener("pointerdown", empezar); b.addEventListener("keydown", empezar);
  ["pointerup","pointerleave","pointercancel","keyup","blur"].forEach(ev=> b.addEventListener(ev, soltar));
  b.addEventListener("click", e=> e.preventDefault());
  b.addEventListener("contextmenu", e=> e.preventDefault());
})();
