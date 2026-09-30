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
      '</div></section>';
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
