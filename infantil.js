/* =====================================================================
   HERRAMIENTAS DE INFANTIL (3, 4 y 5 años)
   Pensadas para quien todavía no lee: botones grandes, dibujos, instrucciones habladas (voz del dispositivo,
   se puede apagar) y una celebración al acertar. Los retos salen del banco (banco.js).
   - La escalera (#/escalera): ordenar las regletas de la más corta a la más larga, buscar una igual (por el
     color y el tamaño, o solo por el tamaño) y decir cuál es más larga o más corta.
   - Series (#/series): continuar series de colores y formas: AB (3 años), AAB y ABB (4 años), ABC y AABB (5 años).
   - ¿Dónde hay más? (#/mas): comparar dos grupos (muchos y pocos, hasta 5, hasta 10 o iguales); después se
     ponen uno frente a otro para ver cuáles sobran (correspondencia uno a uno). Y «¿Cuántos hay?» hasta 10.
   - ¿Dónde está? (#/donde): encima, debajo, al lado, a la izquierda, a la derecha, dentro, fuera y entre.
     Ver dónde está la pelota o ponerla donde se pide.
   Usa las utilidades de index.html, herramientas.js, aula.js y banco.js ($, leer, guardar, REGLETA, azar, barajar, delMazo…).
   ===================================================================== */

/* ---------- Común: voz, celebración y botones ---------- */
const INF = Object.assign({voz:true}, leer("aula-infantil", {}));
const ELOGIOS = ["¡Muy bien!", "¡Genial!", "¡Lo has conseguido!", "¡Estupendo!", "¡Bravo!"];
function hablarInf(texto){
  if(!INF.voz || !texto || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto); u.lang = "es-ES"; u.rate = .85;
  speechSynthesis.speak(u);
}
function celebrarInf(zona, texto){
  const elogio = ELOGIOS[azar(0, ELOGIOS.length - 1)];
  hablarInf(elogio + (texto ? " " + texto : ""));
  const z = $(zona); if(!z) return elogio;
  const e = document.createElement("div"); e.className = "inf-fiesta"; e.setAttribute("aria-hidden", "true");
  e.innerHTML = Array.from({length:7}, (_, i)=> '<i style="--i:'+i+'">★</i>').join("");
  z.appendChild(e); setTimeout(()=> e.remove(), 1400);
  return elogio;
}
/* Los botones de la barra: voz encendida o apagada y «escuchar otra vez» */
function botonesVozInf(pref, repetir){
  const voz = $(pref + "Voz"), oir = $(pref + "Oir");
  const pintar = ()=>{ voz.setAttribute("aria-pressed", INF.voz); voz.title = INF.voz ? "Quitar la voz" : "Poner la voz"; oir.hidden = !INF.voz || !window.speechSynthesis; };
  voz.onclick = ()=>{ INF.voz = !INF.voz; guardar("aula-infantil", INF); if(!INF.voz && window.speechSynthesis) speechSynthesis.cancel(); pintar(); };
  oir.onclick = ()=> hablarInf(repetir());
  if(!window.speechSynthesis) voz.hidden = true;
  pintar();
}
const regletaInf = (n, extra, sinColor) => '<span class="inf-regleta'+(sinColor ? " gris" : "")+'" style="--n:'+n+(sinColor ? "" : ';background:'+REGLETA[n].c+';color:'+REGLETA[n].t)+'"'+(extra || "")+'></span>';

/* =====================================================================
   LA ESCALERA
   ===================================================================== */
const EC = Object.assign({modo:"ordenar", nivel:"c5"}, leer("aula-escalera", {}), {reto:null, puestas:[], fallo:null, hecho:false});
let escaleraLista = false;
const NIVELES_EC = {c5:{txt:"Hasta la amarilla (5)", hasta:5}, c10:{txt:"Las diez regletas", hasta:10}, t10:{txt:"Solo el tamaño (sin colores)", hasta:10, sinColor:true}};
const guardarEC = () => guardar("aula-escalera", {modo:EC.modo, nivel:EC.nivel});
function nuevoRetoEC(){
  const n = NIVELES_EC[EC.nivel];
  Object.assign(EC, {puestas:[], fallo:null, hecho:false});
  if(EC.modo === "ordenar") EC.reto = {piezas: barajar(Array.from({length:n.hasta}, (_, i)=> i + 1))};
  else if(EC.modo === "igual"){
    const lista = Array.from({length:n.hasta}, (_, i)=> ({k:"i"+(i+1), v:i+1}));
    const v = delMazo("ec-igual-"+EC.nivel, lista).v;
    EC.reto = {v, opciones: barajar([v, ...barajar(Array.from({length:n.hasta}, (_, i)=> i + 1).filter(x=> x !== v)).slice(0, 2)])};
  }else{
    const pares = []; for(let a=1; a<=n.hasta; a++) for(let b=1; b<=n.hasta; b++) if(a !== b) pares.push({k:a+"-"+b, a, b});
    const {a, b} = delMazo("ec-larga-"+EC.nivel, pares);
    EC.reto = {a, b, larga: Math.random() < .5};
  }
  pintarEscalera();
  hablarInf(instruccionEC());
}
function instruccionEC(){
  if(EC.modo === "ordenar") return EC.hecho ? "" : "Ordena las regletas. Toca primero la más corta.";
  if(EC.modo === "igual") return "Busca una regleta igual que esta.";
  return EC.reto && EC.reto.larga ? "¿Cuál es la más larga?" : "¿Cuál es la más corta?";
}
function iniciarEscalera(){
  if(!escaleraLista){
    escaleraLista = true;
    pintarIconos($("vEscalera"));
    $("ecNivel").innerHTML = Object.entries(NIVELES_EC).map(([k,v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("ecNivel").onchange = e=>{ EC.nivel = e.target.value; guardarEC(); nuevoRetoEC(); };
    document.querySelectorAll("#vEscalera .segmentos button").forEach(b=> b.onclick = ()=>{ EC.modo = b.dataset.modo; guardarEC(); nuevoRetoEC(); });
    botonesVozInf("ec", instruccionEC);
  }
  if(!EC.reto) nuevoRetoEC(); else pintarEscalera();
}
function pintarEscalera(){
  const n = NIVELES_EC[EC.nivel], r = EC.reto, c = $("ecCuerpo"), gris = !!n.sinColor;
  $("ecNivel").value = EC.nivel;
  document.querySelectorAll("#vEscalera .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === EC.modo));
  let h = '<p class="inf-orden"><span aria-hidden="true">'+(EC.modo === "ordenar" ? "🪜" : EC.modo === "igual" ? "🔍" : r.larga ? "📏" : "🤏")+'</span> '+(instruccionEC() || "¡La escalera está completa!")+'</p>';
  if(EC.modo === "ordenar"){
    const siguiente = EC.puestas.length + 1;
    h += '<div class="inf-escalera" aria-label="La escalera">'+EC.puestas.map(v=> '<div>'+regletaInf(v, ' role="img" aria-label="Regleta del '+v+'"', gris)+'</div>').join("")+
         (!EC.hecho ? '<div class="inf-hueco" style="--n:'+siguiente+'" aria-hidden="true"></div>' : '')+'</div>';
    h += '<div class="inf-bandeja" role="group" aria-label="Regletas para ordenar">'+r.piezas.filter(v=> !EC.puestas.includes(v)).map(v=>
      '<button class="inf-pieza'+(EC.fallo === v ? " no" : "")+'" data-v="'+v+'" aria-label="Regleta '+(gris ? "" : REGLETA[v].n+" ")+'del '+v+'">'+regletaInf(v, ' aria-hidden="true"', gris)+'</button>').join("")+'</div>';
  }else if(EC.modo === "igual"){
    h += '<div class="inf-modelo">'+regletaInf(r.v, ' role="img" aria-label="Regleta modelo"', gris)+'</div><div class="inf-opciones">'+r.opciones.map(v=>
      '<button class="inf-pieza'+(EC.fallo === v ? " no" : EC.hecho && v === r.v ? " si" : "")+'" data-v="'+v+'" aria-label="Regleta del '+v+'"'+(EC.hecho ? " disabled" : "")+'>'+regletaInf(v, ' aria-hidden="true"', gris)+'</button>').join("")+'</div>';
  }else{
    h += '<div class="inf-opciones columna">'+[r.a, r.b].map(v=>
      '<button class="inf-pieza'+(EC.fallo === v ? " no" : EC.hecho && v === (r.larga ? Math.max(r.a, r.b) : Math.min(r.a, r.b)) ? " si" : "")+'" data-v="'+v+'" aria-label="Regleta del '+v+'"'+(EC.hecho ? " disabled" : "")+'>'+regletaInf(v, ' aria-hidden="true"', gris)+'</button>').join("")+'</div>';
  }
  if(EC.hecho) h += '<div class="pt-acciones"><button class="bt azul inf-otra" id="ecOtra">¡Otra!</button></div>';
  c.innerHTML = h;
  c.querySelectorAll(".inf-pieza").forEach(b=> b.onclick = ()=> tocarEC(+b.dataset.v));
  $("ecOtra")?.addEventListener("click", nuevoRetoEC);
}
function tocarEC(v){
  const r = EC.reto;
  if(EC.hecho) return;
  let bien;
  if(EC.modo === "ordenar"){
    bien = v === EC.puestas.length + 1;
    if(bien){ EC.puestas.push(v); EC.fallo = null; if(EC.puestas.length === r.piezas.length){ EC.hecho = true; pintarEscalera(); celebrarInf("ecCuerpo", "¡Has hecho la escalera!"); $("ecOtra")?.focus(); return; } }
  }else if(EC.modo === "igual") bien = v === r.v;
  else bien = v === (r.larga ? Math.max(r.a, r.b) : Math.min(r.a, r.b));
  if(bien && EC.modo !== "ordenar"){ EC.hecho = true; EC.fallo = null; pintarEscalera(); celebrarInf("ecCuerpo"); $("ecOtra")?.focus(); return; }
  if(!bien){ EC.fallo = v; hablarInf(EC.modo === "ordenar" ? "Esa no. Busca la más corta que queda." : "¡Casi! Prueba otra vez."); }
  pintarEscalera();
}

/* =====================================================================
   SERIES DE COLORES
   ===================================================================== */
const SR = Object.assign({nivel:"ab"}, leer("aula-series", {}), {reto:null, fallo:null, hecho:false});
let seriesLista = false;
const NIVELES_SR = {ab:{txt:"AB · 3 años", patrones:["AB"]}, aab:{txt:"AAB y ABB · 4 años", patrones:["AAB", "ABB", "AB"]}, abc:{txt:"ABC y AABB · 5 años", patrones:["ABC", "AABB", "ABB"]}};
/* colores de las regletas con una forma cada uno (así no depende solo del color) */
const FICHAS_SR = [{c:REGLETA[2].c, f:"circulo", n:"rojo"}, {c:REGLETA[5].c, f:"cuadrado", n:"amarillo"}, {c:REGLETA[9].c, f:"triangulo", n:"azul"},
                   {c:REGLETA[6].c, f:"estrella", n:"verde"}, {c:REGLETA[4].c, f:"corazon", n:"rosa"}, {c:REGLETA[10].c, f:"rombo", n:"naranja"}];
function fichaSR(i, extra){
  const f = FICHAS_SR[i], forma = {
    circulo:'<circle cx="50" cy="50" r="40"/>', cuadrado:'<rect x="12" y="12" width="76" height="76" rx="10"/>',
    triangulo:'<path d="M50 8 L92 88 L8 88 Z" stroke-linejoin="round"/>', rombo:'<path d="M50 6 L94 50 L50 94 L6 50 Z"/>',
    estrella:'<path d="M50 6 L62 38 L96 38 L68 58 L79 92 L50 71 L21 92 L32 58 L4 38 L38 38 Z"/>',
    corazon:'<path d="M50 88 C10 60 4 34 22 20 C36 9 48 18 50 28 C52 18 64 9 78 20 C96 34 90 60 50 88 Z"/>'}[f.f];
  return '<svg class="inf-ficha" viewBox="0 0 100 100" role="img" aria-label="'+f.n+'"'+(extra || "")+'><g fill="'+f.c+'" stroke="rgba(0,0,0,.25)" stroke-width="4">'+forma+'</g></svg>';
}
function listaSR(nivel){
  const l = [];
  for(const p of NIVELES_SR[nivel].patrones) for(let a=0; a<6; a++) for(let b=0; b<6; b++){
    if(b === a) continue;
    if(p.includes("C")){ for(let c=0; c<6; c++) if(c !== a && c !== b) l.push({k:p+a+b+c, p, col:[a, b, c]}); }
    else l.push({k:p+a+b, p, col:[a, b]});
  }
  return l;
}
function nuevoRetoSR(){
  const {p, col} = delMazo("sr-"+SR.nivel, listaSR(SR.nivel));
  const unidad = [...p].map(x=> col[x.charCodeAt(0) - 65]), largo = Math.max(7, unidad.length * 2 + 1);
  const serie = Array.from({length:largo + 1}, (_, i)=> unidad[i % unidad.length]);
  const correcta = serie.pop();
  const otras = barajar([...new Set([...col, ...barajar([0, 1, 2, 3, 4, 5])])].filter(x=> x !== correcta)).slice(0, 2);
  SR.reto = {serie, correcta, opciones: barajar([correcta, ...otras]), patron:p};
  SR.fallo = null; SR.hecho = false;
  pintarSeries(); hablarInf(instruccionSR());
}
const instruccionSR = () => "¿Qué ficha va ahora? Mira cómo se repite la serie.";
function iniciarSeries(){
  if(!seriesLista){
    seriesLista = true;
    pintarIconos($("vSeries"));
    $("srNivel").innerHTML = Object.entries(NIVELES_SR).map(([k,v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("srNivel").onchange = e=>{ SR.nivel = e.target.value; guardar("aula-series", {nivel:SR.nivel}); nuevoRetoSR(); };
    botonesVozInf("sr", instruccionSR);
  }
  if(!SR.reto) nuevoRetoSR(); else pintarSeries();
}
function pintarSeries(){
  const r = SR.reto, c = $("srCuerpo");
  $("srNivel").value = SR.nivel;
  let h = '<p class="inf-orden"><span aria-hidden="true">🔁</span> ¿Qué ficha va ahora?</p>';
  h += '<div class="inf-serie" role="group" aria-label="La serie">'+r.serie.map(i=> fichaSR(i)).join("")+
       '<span class="inf-ficha hueco'+(SR.hecho ? " lleno" : "")+'">'+(SR.hecho ? fichaSR(r.correcta) : '<b aria-label="falta una">?</b>')+'</span></div>';
  h += '<div class="inf-opciones">'+r.opciones.map(i=> '<button class="inf-boton'+(SR.fallo === i ? " no" : SR.hecho && i === r.correcta ? " si" : "")+'" data-i="'+i+'" aria-label="'+FICHAS_SR[i].n+'"'+(SR.hecho ? " disabled" : "")+'>'+fichaSR(i, ' aria-hidden="true"')+'</button>').join("")+'</div>';
  if(SR.hecho) h += '<div class="pt-acciones"><button class="bt azul inf-otra" id="srOtra">¡Otra!</button></div>';
  c.innerHTML = h;
  c.querySelectorAll(".inf-boton").forEach(b=> b.onclick = ()=>{
    if(SR.hecho) return;
    const i = +b.dataset.i;
    if(i === r.correcta){ SR.hecho = true; SR.fallo = null; pintarSeries(); celebrarInf("srCuerpo"); $("srOtra")?.focus(); }
    else{ SR.fallo = i; hablarInf("¡Casi! Mira otra vez cómo se repite."); pintarSeries(); }
  });
  $("srOtra")?.addEventListener("click", nuevoRetoSR);
}

/* =====================================================================
   ¿DÓNDE HAY MÁS?  y  ¿CUÁNTOS HAY?
   ===================================================================== */
const MH = Object.assign({modo:"mas", nivel:"muchos"}, leer("aula-mas", {}), {reto:null, respuesta:null});
let masLista = false;
const NIVELES_MH = {muchos:{txt:"Muchos y pocos · 3 años"}, cinco:{txt:"Hasta 5 · 4 años"}, diez:{txt:"Hasta 10 (o iguales) · 5 años"}};
function listaMH(nivel){
  const l = [];
  if(MH.modo === "cuantos"){ const hasta = nivel === "muchos" ? 3 : nivel === "cinco" ? 5 : 10; for(let n=1; n<=hasta; n++) l.push({k:"c"+n, a:n}); return l; }
  for(let a=1; a<=10; a++) for(let b=1; b<=10; b++){
    if(nivel === "muchos" && (Math.abs(a - b) < 4 || Math.min(a, b) > 3)) continue;
    if(nivel === "cinco" && (a > 5 || b > 5 || a === b)) continue;
    if(nivel === "diez" && a === b && a % 2) continue;   // algunas parejas iguales, no demasiadas
    l.push({k:a+"-"+b, a, b});
  }
  return l;
}
/* fichas repartidas sin tocarse dentro de un plato (en una rejilla de 4 × 3 con un poco de desorden) */
function puntosMH(n, semilla){
  const huecos = barajar(Array.from({length:12}, (_, i)=> i)).slice(0, n);
  return huecos.map(h=> ({x: 23 + (h % 4) * 18 + ((semilla * 7 + h * 13) % 5) - 2, y: 26 + Math.floor(h / 4) * 24 + ((semilla * 5 + h * 11) % 5) - 2}));
}
function nuevoRetoMH(){
  const r = Object.assign({}, delMazo("mh-"+MH.modo+"-"+MH.nivel, listaMH(MH.nivel)));
  r.pa = puntosMH(r.a, 1); if(r.b) r.pb = puntosMH(r.b, 2);
  if(MH.modo === "cuantos"){
    const otras = barajar([r.a - 1, r.a + 1, r.a + 2, r.a - 2].filter(x=> x >= 1 && x <= 10)).slice(0, 2);
    r.opciones = barajar([r.a, ...otras]);
  }
  MH.reto = r; MH.respuesta = null;
  pintarMas(); hablarInf(instruccionMH());
}
const instruccionMH = () => MH.modo === "cuantos" ? "¿Cuántas fichas hay? Cuéntalas." : "¿Dónde hay más fichas? Toca el plato que tiene más.";
function iniciarMas(){
  if(!masLista){
    masLista = true;
    pintarIconos($("vMas"));
    $("mhNivel").innerHTML = Object.entries(NIVELES_MH).map(([k,v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("mhNivel").onchange = e=>{ MH.nivel = e.target.value; guardar("aula-mas", {modo:MH.modo, nivel:MH.nivel}); nuevoRetoMH(); };
    document.querySelectorAll("#vMas .segmentos button").forEach(b=> b.onclick = ()=>{ MH.modo = b.dataset.modo; guardar("aula-mas", {modo:MH.modo, nivel:MH.nivel}); nuevoRetoMH(); });
    botonesVozInf("mh", instruccionMH);
  }
  if(!MH.reto) nuevoRetoMH(); else pintarMas();
}
function platoMH(puntos, color, etiqueta){
  return '<svg class="inf-plato-svg" viewBox="0 0 100 100" role="img" aria-label="'+etiqueta+'"><ellipse cx="50" cy="50" rx="48" ry="46" class="inf-plato"/>'+
    puntos.map(p=> '<circle cx="'+p.x+'" cy="'+p.y+'" r="7.5" fill="'+color+'" stroke="rgba(0,0,0,.25)" stroke-width="2.5"/>').join("")+'</svg>';
}
/* después de contestar: las fichas en dos filas, una frente a otra, y las que sobran marcadas */
function filasMH(a, b){
  const fila = (n, otro, color) => '<div class="inf-fila">'+Array.from({length:n}, (_, i)=> '<i class="'+(i >= otro ? "sobra" : "")+'" style="background:'+color+'"></i>').join("")+'</div>';
  return '<div class="inf-uno-uno" aria-hidden="true">'+fila(a, b, REGLETA[2].c)+fila(b, a, REGLETA[9].c)+'</div>';
}
function pintarMas(){
  const r = MH.reto, c = $("mhCuerpo"), respondido = MH.respuesta !== null;
  $("mhNivel").value = MH.nivel;
  document.querySelectorAll("#vMas .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === MH.modo));
  let h = '<p class="inf-orden"><span aria-hidden="true">'+(MH.modo === "cuantos" ? "🔢" : "⚖️")+'</span> '+(MH.modo === "cuantos" ? "¿Cuántas fichas hay?" : "¿Dónde hay más?")+'</p>';
  if(MH.modo === "cuantos"){
    h += '<div class="inf-platos">'+platoMH(r.pa, REGLETA[2].c, "Un plato con fichas")+'</div>';
    h += '<div class="inf-opciones">'+r.opciones.map(n=> '<button class="inf-boton numero'+(respondido && n === r.a ? " si" : respondido && n === MH.respuesta ? " no" : "")+'" data-n="'+n+'"'+(respondido ? " disabled" : "")+'>'+n+'</button>').join("")+'</div>';
    if(respondido) h += '<div class="inf-marco" aria-hidden="true">'+Array.from({length:10}, (_, i)=> '<i class="'+(i < r.a ? "lleno" : "")+'"></i>').join("")+'</div>';
  }else{
    const mas = r.a === r.b ? "iguales" : r.a > r.b ? "a" : "b";
    const clase = x => !respondido ? "" : x === mas ? " si" : x === MH.respuesta ? " no" : "";
    h += '<div class="inf-platos">'+
      '<button class="inf-boton plato'+clase("a")+'" data-p="a" aria-label="Plato de las fichas rojas"'+(respondido ? " disabled" : "")+'>'+platoMH(r.pa, REGLETA[2].c, "fichas rojas")+'</button>'+
      '<button class="inf-boton plato'+clase("b")+'" data-p="b" aria-label="Plato de las fichas azules"'+(respondido ? " disabled" : "")+'>'+platoMH(r.pb, REGLETA[9].c, "fichas azules")+'</button></div>';
    if(MH.nivel === "diez") h += '<div class="pt-acciones"><button class="bt suave inf-iguales'+clase("iguales")+'" data-p="iguales"'+(respondido ? " disabled" : "")+'>⚖️ Hay igual</button></div>';
    if(respondido) h += filasMH(r.a, r.b) + '<p class="inf-explica">'+(mas === "iguales" ? "Hay las mismas: ninguna sobra." : "Sobran "+Math.abs(r.a - r.b)+(Math.abs(r.a - r.b) === 1 ? " ficha " : " fichas ")+(mas === "a" ? "rojas" : "azules")+": allí hay más.")+'</p>';
  }
  if(respondido) h += '<div class="pt-acciones"><button class="bt azul inf-otra" id="mhOtra">¡Otra!</button></div>';
  c.innerHTML = h;
  c.querySelectorAll("[data-p]").forEach(b=> b.onclick = ()=> responderMH(b.dataset.p));
  c.querySelectorAll("[data-n]").forEach(b=> b.onclick = ()=> responderMH(+b.dataset.n));
  $("mhOtra")?.addEventListener("click", nuevoRetoMH);
}
function responderMH(x){
  if(MH.respuesta !== null) return;
  const r = MH.reto, buena = MH.modo === "cuantos" ? r.a : r.a === r.b ? "iguales" : r.a > r.b ? "a" : "b";
  MH.respuesta = x; pintarMas();
  if(x === buena) celebrarInf("mhCuerpo", MH.modo === "cuantos" ? "Hay "+r.a+"." : "");
  else hablarInf(MH.modo === "cuantos" ? "Casi. Hay "+r.a+". Vamos a contarlas juntos." : "Casi. Mira: las ponemos una frente a otra.");
  $("mhOtra")?.focus();
}

/* =====================================================================
   ¿DÓNDE ESTÁ?
   ===================================================================== */
const DS = Object.assign({modo:"ver", nivel:"n3"}, leer("aula-donde", {}), {reto:null, puesta:null, respuesta:null});
let dondeLista = false;
const POSICIONES = {
  encima:   {txt:"encima de la mesa",     escena:"mesa",  x:200, y:96},
  debajo:   {txt:"debajo de la mesa",     escena:"mesa",  x:200, y:206},
  lado:     {txt:"al lado de la mesa",    escena:"mesa",  x:330, y:206, tambien:["izquierda", "derecha"]},
  izquierda:{txt:"a la izquierda de la mesa", escena:"mesa", x:66, y:206},
  derecha:  {txt:"a la derecha de la mesa",   escena:"mesa", x:334, y:206},
  dentro:   {txt:"dentro de la caja",     escena:"caja",  x:200, y:150},
  fuera:    {txt:"fuera de la caja",      escena:"caja",  x:320, y:206},
  entre:    {txt:"entre las dos cajas",   escena:"cajas", x:200, y:206},
  lejos:    {txt:"fuera, no está entre las cajas", escena:"cajas", x:366, y:206}};
const NIVELES_DS = {n3:{txt:"Encima, debajo, dentro y fuera · 3 años", pos:["encima", "debajo", "dentro", "fuera"]},
                    n4:{txt:"Y además al lado y entre · 4 años", pos:["encima", "debajo", "dentro", "fuera", "lado", "entre"]},
                    n5:{txt:"Y además izquierda y derecha · 5 años", pos:["encima", "debajo", "dentro", "fuera", "izquierda", "derecha", "entre"]}};
/* zonas donde se puede tocar en «Ponla» en cada escena */
const ZONAS_DS = {mesa:["encima", "debajo", "izquierda", "derecha"], caja:["dentro", "fuera"], cajas:["entre", "lejos"]};
function escenaDS(escena, pos, opciones){
  const o = opciones || {}, p = pos ? POSICIONES[pos] : null;
  let s = '<svg class="inf-escena'+(o.mini ? " mini" : "")+'" viewBox="0 0 400 250" role="img" aria-label="'+(p ? "La pelota está "+p.txt : "Una "+(escena === "mesa" ? "mesa" : escena === "caja" ? "caja" : "pareja de cajas"))+'">';
  s += '<rect x="0" y="228" width="400" height="22" class="inf-suelo"/>';
  const pelota = p ? '<g transform="translate('+p.x+' '+p.y+')"><circle r="22" fill="#f2c200"/><path d="M-6 -21 Q8 0 -6 21 L6 21 Q20 0 6 -21 Z" fill="#e3261f"/>'+   // pelota de playa
    '<path d="M-21 -7 Q0 6 21 -7 L21 5 Q0 18 -21 5 Z" fill="#2c77c4" opacity=".9"/><circle r="22" fill="none" stroke="#1c2330" stroke-width="2.5"/></g>' : "";
  if(escena === "mesa"){
    s += '<rect x="112" y="118" width="176" height="16" rx="4" class="inf-madera"/><rect x="124" y="134" width="14" height="94" class="inf-madera"/><rect x="262" y="134" width="14" height="94" class="inf-madera"/>' + pelota;
  }else if(escena === "caja"){
    s += '<path d="M150 140 L250 140 L262 126 L162 126 Z" class="inf-carton fondo"/>' + (p && pos === "dentro" ? pelota : "") +
         '<rect x="150" y="140" width="100" height="88" class="inf-carton"/>' + (p && pos !== "dentro" ? pelota : "");
  }else{
    s += '<rect x="60" y="150" width="90" height="78" class="inf-carton"/><rect x="250" y="150" width="90" height="78" class="inf-carton"/>' + pelota;
  }
  if(o.zonas) s += ZONAS_DS[escena].map(z=>{ const q = POSICIONES[z];
    return '<g class="inf-zona" data-z="'+z+'" tabindex="0" role="button" aria-label="Poner la pelota '+q.txt+'"><circle cx="'+q.x+'" cy="'+q.y+'" r="30"/></g>'; }).join("");
  return s + '</svg>';
}
function nuevoRetoDS(){
  const lista = NIVELES_DS[DS.nivel].pos.map(p=> ({k:p, p}));
  const {p} = delMazo("ds-"+DS.modo+"-"+DS.nivel, lista);
  const pos = p === "lado" ? (Math.random() < .5 ? "izquierda" : "derecha") : p;
  const otras = barajar(NIVELES_DS[DS.nivel].pos.filter(x=> x !== p && !(p === "lado" && (x === "izquierda" || x === "derecha")))).slice(0, 2);
  DS.reto = {p, pos, opciones: barajar([p, ...otras])}; DS.puesta = null; DS.respuesta = null;
  pintarDonde(); hablarInf(instruccionDS());
}
const instruccionDS = () => DS.modo === "ver" ? "¿Dónde está la pelota?" : "Pon la pelota " + POSICIONES[DS.reto.p].txt + ".";
function iniciarDonde(){
  if(!dondeLista){
    dondeLista = true;
    pintarIconos($("vDonde"));
    $("dsNivel").innerHTML = Object.entries(NIVELES_DS).map(([k,v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("dsNivel").onchange = e=>{ DS.nivel = e.target.value; guardar("aula-donde", {modo:DS.modo, nivel:DS.nivel}); nuevoRetoDS(); };
    document.querySelectorAll("#vDonde .segmentos button").forEach(b=> b.onclick = ()=>{ DS.modo = b.dataset.modo; guardar("aula-donde", {modo:DS.modo, nivel:DS.nivel}); nuevoRetoDS(); });
    botonesVozInf("ds", instruccionDS);
  }
  if(!DS.reto) nuevoRetoDS(); else pintarDonde();
}
const encajaDS = (p, z) => p === z || (p === "lado" && (z === "izquierda" || z === "derecha")) || (p === "fuera" && z === "fuera");
function pintarDonde(){
  const r = DS.reto, c = $("dsCuerpo"), escena = POSICIONES[r.p].escena;
  $("dsNivel").value = DS.nivel;
  document.querySelectorAll("#vDonde .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === DS.modo));
  let h = "";
  if(DS.modo === "ver"){
    const respondido = DS.respuesta !== null;
    h = '<p class="inf-orden"><span aria-hidden="true">👀</span> ¿Dónde está la pelota?</p>'+escenaDS(escena, r.pos)+
      '<div class="inf-opciones">'+r.opciones.map(x=>{ const q = POSICIONES[x];
        return '<button class="inf-boton dibujo'+(respondido && x === r.p ? " si" : respondido && x === DS.respuesta ? " no" : "")+'" data-x="'+x+'"'+(respondido ? " disabled" : "")+'>'+
          escenaDS(q.escena, x === "lado" ? "derecha" : x, {mini:true})+'<span>'+q.txt.replace(/^./, l=> l.toUpperCase())+'</span></button>'; }).join("")+'</div>';
    if(respondido) h += '<div class="pt-acciones"><button class="bt azul inf-otra" id="dsOtra">¡Otra!</button></div>';
  }else{
    const hecho = DS.puesta && encajaDS(r.p, DS.puesta);
    h = '<p class="inf-orden"><span aria-hidden="true">👉</span> Pon la pelota <b>'+POSICIONES[r.p].txt+'</b></p>'+escenaDS(escena, DS.puesta, {zonas:!hecho});
    if(hecho) h += '<div class="pt-acciones"><button class="bt azul inf-otra" id="dsOtra">¡Otra!</button></div>';
  }
  c.innerHTML = h;
  c.querySelectorAll("[data-x]").forEach(b=> b.onclick = ()=>{
    if(DS.respuesta !== null) return;
    DS.respuesta = b.dataset.x; pintarDonde();
    if(DS.respuesta === r.p) celebrarInf("dsCuerpo", "La pelota está "+POSICIONES[r.p].txt+".");
    else hablarInf("Casi. La pelota está "+POSICIONES[r.p].txt+".");
    $("dsOtra")?.focus();
  });
  c.querySelectorAll(".inf-zona").forEach(z=>{
    const poner = ()=>{
      DS.puesta = z.dataset.z; pintarDonde();
      if(encajaDS(r.p, DS.puesta)){ celebrarInf("dsCuerpo"); $("dsOtra")?.focus(); }
      else hablarInf("Ahí está "+POSICIONES[DS.puesta].txt+". Pon la pelota "+POSICIONES[r.p].txt+".");
    };
    z.addEventListener("click", poner);
    z.addEventListener("keydown", e=>{ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); poner(); } });
  });
  $("dsOtra")?.addEventListener("click", nuevoRetoDS);
}
