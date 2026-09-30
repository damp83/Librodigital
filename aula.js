/* =====================================================================
   HERRAMIENTAS DE LA SECUENCIA OAOA
   - Cálculo mental diario (#/calculo): rondas proyectables de 5-10 minutos
   - Panel del 100 (#/panel): cruces numéricas, casillas tapadas y colores
   - Partes y todo (#/partes): el diagrama partes-todo con regletas
   Usa las utilidades de index.html y herramientas.js ($, svg, esc, REGLETA, enLetras…).
   ===================================================================== */

const azar = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function pantallaCompleta(id){
  if(!document.fullscreenEnabled) return false;
  document.fullscreenElement ? document.exitFullscreen() : $(id).requestFullscreen();
  return true;
}
/* Tren de regletas: filas de números (hasta 10); null = hueco con «?» del tamaño de la respuesta */
function htmlTren(filas){
  return '<div class="tren" aria-hidden="true">'+filas.map(fila=>'<div class="tren-fila">'+fila.map(p=>{
    const n = p.n, r = REGLETA[n] || REGLETA[10];
    if(p.falta) return '<span class="b-reg falta" style="width:calc(var(--u)*'+n+')">?</span>';
    return '<span class="b-reg" style="width:calc(var(--u)*'+n+');background:'+r.c+';color:'+r.t+
           (n===1 ? ';box-shadow:inset 0 0 0 1px #c8ced6,inset 0 -4px 0 rgba(0,0,0,.12)' : '')+'">'+n+'</span>';
  }).join("")+'</div>').join("")+'</div>';
}

/* ---------------------------------------------------------------------
   CÁLCULO MENTAL
   --------------------------------------------------------------------- */
/* Cada tipo genera una pregunta: texto con «?» donde va la respuesta, la respuesta y, si caben, las regletas */
const TIPOS_CM = [
  {id:"mas1", nombre:"Uno más, uno menos", desc:"7 + 1, 5 − 1… hasta el 10", curso:"4 y 5 años", gen(){
    const n = azar(1,9), mas = n===1 || Math.random()<.5;
    return mas ? {q:n+" + 1", r:n+1, tren:[[{n},{n:1}],[{n:n+1, resp:true}]]}
               : {q:n+" − 1", r:n-1, tren:[[{n}],[{n:n-1, resp:true},{n:1}]]}; }},
  {id:"sumas10", nombre:"Sumas hasta 10", desc:"3 + 4, 6 + 2…", curso:"5 años y 1.º", gen(){
    const a = azar(1,8), b = azar(1,10-a);
    return {q:a+" + "+b, r:a+b, tren:[[{n:a},{n:b}],[{n:a+b, resp:true}]]}; }},
  {id:"parejas10", nombre:"Parejas del 10", desc:"7 + ? = 10", curso:"5 años y 1.º", gen(){
    const a = azar(1,9);
    return {q:a+" + ? = 10", r:10-a, tren:[[{n:a},{n:10-a, resp:true}],[{n:10}]]}; }},
  {id:"restas10", nombre:"Restas hasta 10", desc:"9 − 4, 7 − 2…", curso:"1.º", gen(){
    const t = azar(2,10), a = azar(1,t-1);
    return {q:t+" − "+a, r:t-a, tren:[[{n:t}],[{n:a},{n:t-a, resp:true}]]}; }},
  {id:"dobles", nombre:"Dobles y mitades", desc:"6 + 6, la mitad de 14…", curso:"1.º y 2.º", gen(){
    const n = azar(1,10);
    return Math.random()<.6 ? {q:n+" + "+n, r:2*n} : {q:"Mitad de "+(2*n), r:n}; }},
  {id:"decena", nombre:"Paso por la decena", desc:"8 + 5, 7 + 6…", curso:"1.º y 2.º", gen(){
    const a = azar(6,9), b = azar(11-a, 9);
    return {q:a+" + "+b, r:a+b, tren:[[{n:a},{n:10-a},{n:a+b-10}],[{n:10},{n:a+b-10, resp:true}]]}; }},
  {id:"cero", nombre:"El truco del cero", desc:"30 + 40, 90 − 20…", curso:"2.º", gen(){
    if(Math.random()<.5){ const a = azar(1,8), b = azar(1,9-a); return {q:a*10+" + "+b*10, r:(a+b)*10}; }
    const a = azar(2,9), b = azar(1,a-1); return {q:a*10+" − "+b*10, r:(a-b)*10}; }},
  {id:"amigos100", nombre:"Amigos del 100", desc:"40 + ? = 100", curso:"2.º", gen(){
    const d = azar(1,9); return {q:d*10+" + ? = 100", r:100-d*10}; }},
  {id:"dieces", nombre:"Dieces y unos", desc:"34 + 10, 57 − 20…", curso:"2.º", gen(){
    const n = azar(21,79), d = azar(1,2)*10, mas = Math.random()<.5;
    return mas ? {q:n+" + "+d, r:n+d} : {q:n+" − "+d, r:n-d}; }},
];
const CM = Object.assign({tipos:["parejas10"], cuantas:10, tiempo:0, regletas:true}, leer("aula-calculo", {}));
let ronda = null, cmTemporizador = null;
const guardarCM = () => guardar("aula-calculo", {tipos:CM.tipos, cuantas:CM.cuantas, tiempo:CM.tiempo, regletas:CM.regletas});

function iniciarCalculo(){ if(!ronda) pintarEleccion(); }

function pintarEleccion(){
  clearTimeout(cmTemporizador); ronda = null; $("cmProgreso").hidden = true;
  const c = $("cmCuerpo");
  c.innerHTML =
    '<div class="cm-elegir"><h2>¿Qué practicamos hoy?</h2><p>Elige uno o varios tipos. Cada pregunta sale en grande y la respuesta, cuando la pidas: para hacer en voz alta con toda la clase.</p>'+
    '<div class="cm-tipos" role="group" aria-label="Tipos de cálculo">'+TIPOS_CM.map(t=>
      '<button class="cm-tipo" data-id="'+t.id+'" aria-pressed="'+CM.tipos.includes(t.id)+'"><b>'+t.nombre+'</b><span>'+t.desc+'</span><small>'+t.curso+'</small></button>').join("")+'</div>'+
    '<div class="cm-ajustes">'+
      '<label class="b-select"><span>Preguntas</span><select id="cmCuantas">'+[5,10,15,20].map(n=>'<option'+(n===CM.cuantas?' selected':'')+'>'+n+'</option>').join("")+'</select></label>'+
      '<label class="b-select"><span>Tiempo</span><select id="cmTiempoSel">'+[[0,"sin límite"],[5,"5 s"],[10,"10 s"],[20,"20 s"],[30,"30 s"]].map(([v,t])=>'<option value="'+v+'"'+(v===CM.tiempo?' selected':'')+'>'+t+'</option>').join("")+'</select></label>'+
      '<button class="chip" id="cmRegletas" aria-pressed="'+CM.regletas+'">Con regletas</button>'+
      '<button class="bt azul" id="cmEmpezar"><svg class="ic" data-icon="bola"></svg>Empezar</button>'+
    '</div></div>';
  pintarIconos(c);
  c.querySelectorAll(".cm-tipo").forEach(b=> b.onclick = ()=>{
    const id = b.dataset.id, i = CM.tipos.indexOf(id);
    if(i>=0){ if(CM.tipos.length>1) CM.tipos.splice(i,1); } else CM.tipos.push(id);
    c.querySelectorAll(".cm-tipo").forEach(x=> x.setAttribute("aria-pressed", CM.tipos.includes(x.dataset.id)));
    guardarCM();
  });
  $("cmCuantas").onchange = e=>{ CM.cuantas = +e.target.value; guardarCM(); };
  $("cmTiempoSel").onchange = e=>{ CM.tiempo = +e.target.value; guardarCM(); };
  $("cmRegletas").onclick = e=>{ CM.regletas = !CM.regletas; e.currentTarget.setAttribute("aria-pressed", CM.regletas); guardarCM(); };
  $("cmEmpezar").onclick = empezarRonda;
}

function empezarRonda(){
  const tipos = TIPOS_CM.filter(t=>CM.tipos.includes(t.id)), vistas = new Set(), preguntas = [];
  for(let intentos=0; preguntas.length<CM.cuantas && intentos<500; intentos++){
    const p = tipos[preguntas.length % tipos.length].gen();
    if(vistas.has(p.q) && intentos<400) continue;   // sin repetir mientras se pueda
    vistas.add(p.q); preguntas.push(p);
  }
  for(let i=preguntas.length-1; i>0; i--){ const j = azar(0,i); [preguntas[i], preguntas[j]] = [preguntas[j], preguntas[i]]; }
  ronda = {preguntas, i:0, vista:false};
  pintarPregunta();
}
function pintarPregunta(){
  clearTimeout(cmTemporizador);
  const p = ronda.preguntas[ronda.i], c = $("cmCuerpo"), total = ronda.preguntas.length, visto = ronda.vista;
  const hueco = '<span class="hueco'+(visto?' visto':'')+'">'+(visto ? p.r : "?")+'</span>';
  const pregunta = p.q.includes("?") ? esc(p.q).replace("?", hueco) : esc(p.q)+" = "+hueco;
  const tren = CM.regletas && p.tren ? htmlTren(p.tren.map(f=>f.map(x=> x.resp && !visto ? {n:x.n, falta:true} : x))) : "";
  c.innerHTML =
    '<div class="cm-ronda"><p class="cm-cuenta">Pregunta '+(ronda.i+1)+' de '+total+'</p>'+
    '<p class="cm-pregunta" aria-live="polite">'+pregunta+'</p>'+tren+
    '<p class="p-nota" style="margin:0">'+(visto ? esc(enLetras(p.r)) : "&nbsp;")+'</p>'+
    '<div class="cm-acciones">'+
      (ronda.i>0 ? '<button class="bt suave" id="cmAnterior"><svg class="ic" data-icon="izq"></svg>Anterior</button>' : '')+
      (visto ? '<button class="bt azul" id="cmSiguiente">'+(ronda.i+1<total ? 'Siguiente' : 'Ver todas')+'<svg class="ic" data-icon="der"></svg></button>'
             : '<button class="bt azul" id="cmVer">Ver la respuesta</button>')+
      '<button class="bt suave" id="cmSalir">Terminar</button>'+
    '</div><p class="p-nota" style="margin:0">Barra espaciadora: respuesta y siguiente · ← anterior</p></div>';
  pintarIconos(c);
  $("cmVer")?.addEventListener("click", verRespuesta);
  $("cmSiguiente")?.addEventListener("click", siguientePregunta);
  $("cmAnterior")?.addEventListener("click", ()=>{ ronda.i--; ronda.vista = true; pintarPregunta(); });
  $("cmSalir").onclick = pintarEleccion;
  // barra de progreso: avance de la ronda o cuenta atrás de la pregunta
  const barra = $("cmProgreso"), t = $("cmTiempo");
  barra.hidden = false; t.style.transition = "none";
  if(CM.tiempo && !visto){
    t.style.width = "100%"; void t.offsetWidth;
    t.style.transition = "width "+CM.tiempo+"s linear"; t.style.width = "0%";
    cmTemporizador = setTimeout(verRespuesta, CM.tiempo*1000);
  } else t.style.width = Math.round(100*(ronda.i + (visto?1:0))/total)+"%";
  ($("cmVer") || $("cmSiguiente")).focus({preventScroll:true});
}
function verRespuesta(){ if(!ronda || ronda.vista) return; ronda.vista = true; pintarPregunta(); }
function siguientePregunta(){
  if(ronda.i+1 < ronda.preguntas.length){ ronda.i++; ronda.vista = false; pintarPregunta(); }
  else pintarResumen();
}
function pintarResumen(){
  clearTimeout(cmTemporizador); $("cmProgreso").hidden = true;
  const c = $("cmCuerpo"), preguntas = ronda.preguntas; ronda = null;
  c.innerHTML = '<div class="cm-resumen"><h2 id="cmFin" tabindex="-1" style="margin:0;font-size:24px">¡Ronda terminada!</h2>'+
    '<p class="p-nota">Todas las operaciones con su respuesta, para repasar juntos.</p>'+
    '<ol class="cm-lista">'+preguntas.map(p=>'<li>'+(p.q.includes("?") ? esc(p.q).replace("?", "<b>"+p.r+"</b>") : esc(p.q)+" = <b>"+p.r+"</b>")+'</li>').join("")+'</ol>'+
    '<div class="cm-acciones" style="justify-content:flex-start"><button class="bt azul" id="cmOtra">Otra ronda igual</button><button class="bt suave" id="cmCambiar">Cambiar de tipo</button></div></div>';
  $("cmOtra").onclick = empezarRonda; $("cmCambiar").onclick = pintarEleccion;
  $("cmFin").focus();   // no en «Otra ronda»: una pulsación de más no debe empezar otra
}
function tecladoCalculo(e){
  if(!ronda || /^(input|select|textarea)$/i.test(e.target.tagName)) return;
  if(e.key===" " || e.key==="Enter" || e.key==="ArrowRight"){
    if(/^(button|a)$/i.test(e.target.tagName) && e.key!=="ArrowRight") return;   // el botón con foco ya actúa
    e.preventDefault(); ronda.vista ? siguientePregunta() : verRespuesta();
  } else if(e.key==="ArrowLeft" && ronda.i>0){ e.preventDefault(); ronda.i--; ronda.vista = true; pintarPregunta(); }
}

/* ---------------------------------------------------------------------
   PANEL DEL 100
   --------------------------------------------------------------------- */
const PAN_COLORES = ["#f2c200","#7cc84a","#2f7fd1","#e3261f","#c2185b"];
const PAN = {modo:"cruz", hasta:100, sel:null, adivinar:false, vistas:new Set(), tapadas:new Set(), colores:{}, color:PAN_COLORES[0]};
let panelListo = false;

function iniciarPanel(){
  if(!panelListo){
    panelListo = true;
    pintarIconos($("vPanel"));
    document.querySelectorAll("#vPanel .segmentos button").forEach(b=> b.onclick = ()=>{ PAN.modo = b.dataset.modo; pintarPanel(); });
    $("panHasta").onchange = e=>{ PAN.hasta = +e.target.value; PAN.sel = null; pintarPanel(); };
    $("panLimpiar").onclick = ()=>{ PAN.sel = null; PAN.tapadas.clear(); PAN.colores = {}; PAN.vistas.clear(); pintarPanel(); };
    if(document.fullscreenEnabled) $("panPantalla").onclick = ()=> pantallaCompleta("vPanel"); else $("panPantalla").hidden = true;
  }
  pintarPanel();
}
function vecinos(n){   // la cruz numérica: arriba −10, abajo +10, izquierda −1, derecha +1 (sin salirse de la fila)
  const v = {};
  if(n-10 >= 1) v[n-10] = "−10";
  if(n+10 <= PAN.hasta) v[n+10] = "+10";
  if((n-1) % 10 !== 0) v[n-1] = "−1";
  if(n % 10 !== 0 && n+1 <= PAN.hasta) v[n+1] = "+1";
  return v;
}
function pintarPanel(){
  document.querySelectorAll("#vPanel .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo===PAN.modo));
  const op = $("panOpciones");
  if(PAN.modo==="cruz") op.innerHTML = '<button class="chip" id="panAdivinar" aria-pressed="'+PAN.adivinar+'">Adivinar la cruz</button>';
  else if(PAN.modo==="tapar") op.innerHTML = '<button class="chip" id="panAzar">Tapar 10 al azar</button><button class="chip" id="panDestapar">Destapar todo</button>';
  else op.innerHTML = PAN_COLORES.map(c=>'<button class="rotu-color pan-color" data-color="'+c+'" style="--col:'+c+'" aria-pressed="'+(PAN.color===c)+'" aria-label="Pintar de este color"></button>').join("")+
    '<button class="rotu-color pan-color" data-color="" style="--col:var(--surface)" aria-pressed="'+(PAN.color==="")+'" aria-label="Goma: quitar el color"></button>'+
    '<button class="chip" id="panDieces">Colorear los dieces</button>';
  $("panAdivinar")?.addEventListener("click", ()=>{ PAN.adivinar = !PAN.adivinar; PAN.vistas.clear(); pintarPanel(); });
  $("panAzar")?.addEventListener("click", ()=>{
    const libres = []; for(let n=1; n<=PAN.hasta; n++) if(!PAN.tapadas.has(n)) libres.push(n);
    for(let k=0; k<10 && libres.length; k++) PAN.tapadas.add(libres.splice(azar(0, libres.length-1), 1)[0]);
    pintarPanel();
  });
  $("panDestapar")?.addEventListener("click", ()=>{ PAN.tapadas.clear(); pintarPanel(); });
  op.querySelectorAll(".pan-color").forEach(b=> b.onclick = ()=>{ PAN.color = b.dataset.color; pintarPanel(); });
  $("panDieces")?.addEventListener("click", ()=>{ for(let n=10; n<=PAN.hasta; n+=10) PAN.colores[n] = PAN.color || PAN_COLORES[0]; pintarPanel(); });

  const cruz = PAN.sel ? vecinos(PAN.sel) : {}, rej = $("panRejilla");
  let html = "";
  for(let n=1; n<=PAN.hasta; n++){
    const clases = ["celda"], dir = cruz[n];
    if(PAN.tapadas.has(n)) clases.push("oculta");
    if(n===PAN.sel) clases.push("sel");
    if(dir){ clases.push("cruz"); if(PAN.adivinar && !PAN.vistas.has(n)) clases.push("adivina"); }
    const fondo = PAN.colores[n] && n!==PAN.sel && !dir ? ' style="background:'+PAN.colores[n]+';border-color:'+PAN.colores[n]+'"' : "";
    const etiqueta = PAN.tapadas.has(n) || (dir && PAN.adivinar && !PAN.vistas.has(n)) ? "casilla tapada" : String(n);
    html += '<button class="'+clases.join(" ")+'" data-n="'+n+'"'+fondo+' aria-label="'+etiqueta+(dir ? ", "+dir : "")+'">'+n+(dir ? '<span class="dir" aria-hidden="true">'+dir+'</span>' : '')+'</button>';
  }
  rej.innerHTML = html;
  rej.querySelectorAll(".celda").forEach(b=> b.onclick = ()=> tocarCelda(+b.dataset.n));
  $("panAyuda").textContent = PAN.modo==="cruz"
    ? (PAN.sel ? "Cruz del "+PAN.sel+": arriba "+(PAN.sel-10>=1?PAN.sel-10:"—")+", abajo "+(PAN.sel+10<=PAN.hasta?PAN.sel+10:"—")+". Muévete con las flechas."
               : "Toca un número para ver su cruz numérica (−10, +10, −1, +1).")
    : PAN.modo==="tapar" ? "Toca una casilla para taparla o destaparla. ¿Qué número se esconde?"
    : "Toca las casillas para pintarlas y descubrir patrones.";
}
function tocarCelda(n){
  if(PAN.modo==="cruz"){
    const cruz = PAN.sel ? vecinos(PAN.sel) : {};
    if(cruz[n] && PAN.adivinar && !PAN.vistas.has(n)) PAN.vistas.add(n);   // descubrir un vecino
    else { PAN.sel = PAN.sel===n ? null : n; PAN.vistas.clear(); }
  } else if(PAN.modo==="tapar"){
    PAN.tapadas.has(n) ? PAN.tapadas.delete(n) : PAN.tapadas.add(n);
  } else {
    if(PAN.color && PAN.colores[n]!==PAN.color) PAN.colores[n] = PAN.color; else delete PAN.colores[n];
  }
  pintarPanel();
  $("panRejilla").querySelector('[data-n="'+n+'"]')?.focus({preventScroll:true});
}
function tecladoPanel(e){
  if(PAN.modo!=="cruz" || !PAN.sel || /^(select|input)$/i.test(e.target.tagName)) return;
  const d = {ArrowLeft:-1, ArrowRight:1, ArrowUp:-10, ArrowDown:10}[e.key];
  if(!d) return;
  e.preventDefault();
  const n = PAN.sel + d;
  if(n>=1 && n<=PAN.hasta && !(d===1 && PAN.sel%10===0) && !(d===-1 && PAN.sel%10===1)){ PAN.sel = n; PAN.vistas.clear(); pintarPanel(); }
}

/* ---------------------------------------------------------------------
   PARTES Y TODO
   --------------------------------------------------------------------- */
const PT = Object.assign({nivel:10, ocultar:"parte", vista:"barras"}, leer("aula-partes", {}), {todo:7, a:3, b:4, oculto:null, familia:false});
let partesListo = false;
const guardarPT = () => guardar("aula-partes", {nivel:PT.nivel, ocultar:PT.ocultar, vista:PT.vista});

function iniciarPartes(){
  if(!partesListo){
    partesListo = true;
    pintarIconos($("vPartes"));
    $("ptNivel").value = PT.nivel; $("ptOcultar").value = PT.ocultar;
    $("ptNivel").onchange = e=>{ PT.nivel = +e.target.value; guardarPT(); nuevoReto(); };
    $("ptOcultar").onchange = e=>{ PT.ocultar = e.target.value; guardarPT(); nuevoReto(); };
    document.querySelectorAll("#vPartes .segmentos button").forEach(b=> b.onclick = ()=>{ PT.vista = b.dataset.vista; guardarPT(); pintarPartes(); });
    $("ptNuevo").onclick = nuevoReto;
    $("ptMostrar").onclick = ()=>{ PT.oculto = null; pintarPartes(); };
    $("ptFamilia").onclick = ()=>{ PT.familia = !PT.familia; pintarPartes(); };
    if(document.fullscreenEnabled) $("ptPantalla").onclick = ()=> pantallaCompleta("vPartes"); else $("ptPantalla").hidden = true;
    const num = id => Math.max(0, Math.min(100, parseInt($(id).value, 10) || 0));
    $("ptTodo").onchange = ()=>{ PT.todo = Math.max(1, num("ptTodo")); PT.a = Math.min(PT.a, PT.todo); PT.b = PT.todo - PT.a; PT.oculto = null; pintarPartes(); };
    $("ptA").onchange = ()=>{ PT.a = num("ptA"); PT.todo = Math.min(100, PT.a + PT.b); PT.b = PT.todo - PT.a; PT.oculto = null; pintarPartes(); };
    $("ptB").onchange = ()=>{ PT.b = num("ptB"); PT.todo = Math.min(100, PT.a + PT.b); PT.a = PT.todo - PT.b; PT.oculto = null; pintarPartes(); };
    nuevoReto();
    return;
  }
  pintarPartes();
}
function nuevoReto(){
  const n = PT.nivel;
  if(n===100){ PT.todo = azar(3,10)*10; PT.a = azar(1, PT.todo/10 - 1)*10; }
  else { PT.todo = azar(n===20 ? 11 : 2, n); PT.a = azar(1, PT.todo-1); }
  PT.b = PT.todo - PT.a;
  const o = PT.ocultar==="azar" ? ["todo","a","b"][azar(0,2)] : PT.ocultar==="todo" ? "todo" : PT.ocultar==="parte" ? (Math.random()<.5 ? "a" : "b") : null;
  PT.oculto = o; PT.familia = false;
  pintarPartes();
}
function pintarPartes(){
  document.querySelectorAll("#vPartes .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.vista===PT.vista));
  const {todo, a, b, oculto} = PT, ver = k => oculto!==k;
  const conRegletas = todo <= 10;
  const bloque = (valor, clave, etiqueta, ancho)=>{
    const r = REGLETA[valor], estilo = 'flex:'+ancho+' 1 0';
    if(!ver(clave)) return '<div class="pt-bloque oculto" style="'+estilo+'"><small>'+etiqueta+'</small>?</div>';
    if(conRegletas && valor>0) return '<div class="pt-bloque" style="'+estilo+';background:'+r.c+';color:'+r.t+(valor===1?';box-shadow:inset 0 0 0 2px #c8ced6':'')+'"><small>'+etiqueta+'</small>'+valor+'</div>';
    return '<div class="pt-bloque neutro" style="'+estilo+'"><small>'+etiqueta+'</small>'+valor+'</div>';
  };
  const lienzo = $("ptLienzo"), texto = v => v;   // (punto único para dar formato a los números del diagrama)
  if(PT.vista==="barras"){
    lienzo.innerHTML = '<div class="pt-barras"><div class="pt-barra">'+bloque(todo,"todo","El todo",todo)+'</div>'+
      '<div class="pt-barra">'+bloque(a,"a","Parte",Math.max(a,.001))+bloque(b,"b","Parte",Math.max(b,.001))+'</div></div>';
  } else {
    const circulo = (x, y, r, valor, clave, etiqueta, color, arriba)=>{
      const visto = ver(clave), borde = visto ? (color || "var(--ink-2)") : "var(--brand)";
      const relleno = visto ? (color ? "color-mix(in srgb,"+color+" 28%,var(--surface))" : "var(--surface)") : "var(--surface)";
      return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" style="fill:'+relleno+';stroke:'+borde+'"'+(visto ? '' : ' stroke-dasharray="10 8"')+'/>'+
        '<text x="'+x+'" y="'+y+'" font-size="'+Math.round(r*0.8)+'" style="fill:'+(visto ? "var(--ink)" : "var(--brand)")+'">'+(visto ? texto(valor) : "?")+'</text>'+
        '<text x="'+x+'" y="'+(arriba ? y-r-20 : y+r+26)+'" font-size="17" style="fill:var(--muted)">'+etiqueta+'</text>';
    };
    const color = v => conRegletas && v>0 ? REGLETA[v].c : null;
    // líneas de borde a borde (del todo a cada parte), dibujadas antes que los círculos
    const linea = (x1,y1,r1,x2,y2,r2)=>{ const dx = x2-x1, dy = y2-y1, d = Math.hypot(dx,dy);
      return '<line x1="'+(x1+dx*r1/d)+'" y1="'+(y1+dy*r1/d)+'" x2="'+(x2-dx*r2/d)+'" y2="'+(y2-dy*r2/d)+'" style="stroke:var(--ink-2)" stroke-width="4" stroke-linecap="round"/>'; };
    lienzo.innerHTML = '<svg class="pt-diagrama" viewBox="0 0 520 390" role="img" aria-label="Diagrama partes-todo: el todo '+(ver("todo")?todo:"oculto")+
      ', partes '+(ver("a")?a:"oculta")+' y '+(ver("b")?b:"oculta")+'">'+
      linea(260,110,66,130,285,56)+linea(260,110,66,390,285,56)+
      circulo(260, 110, 66, todo, "todo", "EL TODO", color(todo), true)+circulo(130, 285, 56, a, "a", "PARTE", color(a))+circulo(390, 285, 56, b, "b", "PARTE", color(b))+'</svg>';
  }
  [["ptTodo", todo, "todo"], ["ptA", a, "a"], ["ptB", b, "b"]].forEach(([id, v, k])=>{ const i = $(id); i.value = ver(k) ? v : ""; i.placeholder = ver(k) ? "" : "?"; });
  $("ptMostrar").disabled = !oculto;
  $("ptFamilia").setAttribute("aria-pressed", PT.familia);
  const fam = $("ptFamiliaCaja");
  fam.hidden = !PT.familia;
  if(PT.familia){
    const v = k => ver(k) ? {todo, a, b}[k] : "?";
    fam.innerHTML = '<span>'+v("a")+' + '+v("b")+' = '+v("todo")+'</span><span>'+v("b")+' + '+v("a")+' = '+v("todo")+'</span>'+
                    '<span>'+v("todo")+' − '+v("a")+' = '+v("b")+'</span><span>'+v("todo")+' − '+v("b")+' = '+v("a")+'</span>';
  }
}
function tecladoPartes(e){
  if(/^(input|select|textarea|button)$/i.test(e.target.tagName)) return;
  if(e.key===" " || e.key==="Enter"){ e.preventDefault(); if(PT.oculto){ PT.oculto = null; pintarPartes(); } else nuevoReto(); }
  else if(e.key==="n" || e.key==="N") nuevoReto();
}
