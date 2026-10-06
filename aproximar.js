/* =====================================================================
   APROXIMACIONES (#/redondeo) y ESTIMACIÓN (#/estimacion)
   - Aproximaciones: aproximar a la decena o a la centena. Niveles: decenas hasta 100, decenas hasta 1000,
     centenas hasta 1000 y mezclado. Se elige entre las dos decenas (o centenas) vecinas o se escribe.
     Ayudas: recta numérica con la mitad marcada, distancias a cada vecina y pista paso a paso.
   - Estimación: estimar el resultado de sumas y restas redondeando antes de calcular. Modos: «¿Cuál se acerca
     más?» (tres opciones), «¿Más o menos que…?» y «Redondea y calcula» (paso a paso). Con tiempo opcional
     para que se estime y no se calcule, y al final se compara la estimación con el resultado exacto.
   Las dos van por rondas de 10 retos que salen del banco (banco.js): no se repiten hasta agotarse.
   Usa las utilidades de index.html y herramientas.js ($, leer, guardar, esc, svg, pintarIconos, azar…).
   ===================================================================== */

/* ---------- Piezas comunes ---------- */
const apVecinas = (n, base) => [Math.floor(n / base) * base, Math.floor(n / base) * base + base];
const apAproximar = (n, base) => Math.floor((n + base / 2) / base) * base;   // el 5 sube: 45 → 50, 450 → 500
const apNombre = base => base === 10 ? "decena" : "centena";
function apTeclado(id, alPulsar){   // teclado numérico grande (pizarra y tabletas)
  const t = $(id);
  t.innerHTML = ["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map(k=>
    '<button class="pi-tecla'+(/\d/.test(k) ? "" : " otra")+'" data-t="'+k+'" aria-label="'+({"⌫":"Borrar", "✓":"Comprobar"}[k] || k)+'">'+k+'</button>').join("");
  t.querySelectorAll("button").forEach(b=> b.onclick = ()=> alPulsar(b.dataset.t));
}
function apMarcador(ronda){   // «Reto 3 de 10 · ★ 2»
  return '<p class="ap-marcador"><span>Reto '+Math.min(ronda.i+1, ronda.retos.length)+' de '+ronda.retos.length+'</span>'+
         '<span class="ap-puntos">★ '+ronda.bien+'</span></p>';
}
function apResumen(ronda, titulo, linea){
  return '<div class="ap-fin"><h2 tabindex="-1" id="apFin">'+titulo+': '+ronda.bien+' de '+ronda.retos.length+'</h2>'+
    '<ol class="ap-lista">'+ronda.retos.map(r=> '<li class="'+(r.bien ? "bien" : "mal")+'">'+linea(r)+'</li>').join("")+'</ol></div>';
}
/* Recta numérica entre dos vecinas, con la mitad marcada y el número señalado */
function apRecta(n, base, opciones){
  const [a, b] = apVecinas(n, base), paso = base / 10, W = 1000, X = v => 60 + (v - a) / base * (W - 120);
  let s = '<svg class="ap-recta" viewBox="0 0 '+W+' 200" role="img" aria-label="Recta numérica del '+a+' al '+b+'; el '+n+' está a '+(n-a)+' del '+a+' y a '+(b-n)+' del '+b+'">';
  s += '<line x1="40" y1="120" x2="'+(W-40)+'" y2="120" class="ap-eje"/>';
  for(let k=0; k<=10; k++){
    const v = a + k * paso, mitad = k === 5, extremo = k === 0 || k === 10;
    s += '<line x1="'+X(v)+'" y1="'+(extremo ? 92 : mitad ? 98 : 108)+'" x2="'+X(v)+'" y2="'+(extremo ? 148 : mitad ? 142 : 132)+'" class="'+(mitad ? "ap-mitad" : "ap-marca")+'"/>';
    if(extremo) s += '<text x="'+X(v)+'" y="184" class="ap-num fuerte">'+v+'</text>';
    else if(mitad) s += '<text x="'+X(v)+'" y="176" class="ap-num mitad">'+v+'</text>';
    else if(base === 10) s += '<text x="'+X(v)+'" y="168" class="ap-num">'+v+'</text>';
  }
  // el número va arriba del todo; los arcos de las distancias, entre el número y la recta
  if(opciones.distancias){
    s += '<path d="M'+X(a)+' 104 Q'+(X(a)+X(n))/2+' 62 '+X(n)+' 104" class="ap-arco izq"/><text x="'+(X(a)+X(n))/2+'" y="76" class="ap-dist izq">'+(n-a)+'</text>';
    s += '<path d="M'+X(n)+' 104 Q'+(X(n)+X(b))/2+' 62 '+X(b)+' 104" class="ap-arco der"/><text x="'+(X(n)+X(b))/2+'" y="76" class="ap-dist der">'+(b-n)+'</text>';
  }
  s += '<line x1="'+X(n)+'" y1="40" x2="'+X(n)+'" y2="104" class="ap-guia"/>';
  s += '<circle cx="'+X(n)+'" cy="120" r="15" class="ap-punto"/><text x="'+X(n)+'" y="30" class="ap-num punto">'+n+'</text>';
  return s + '</svg>';
}
function apExplica(n, base){
  const [a, b] = apVecinas(n, base), r = apAproximar(n, base);
  if(n - a === b - n) return n+" está justo en la mitad entre "+a+" y "+b+": se aproxima a la "+apNombre(base)+" de arriba, "+r+".";
  return n+" está a "+(n-a)+" del "+a+" y a "+(b-n)+" del "+b+": está más cerca del "+r+".";
}

/* =====================================================================
   APROXIMACIONES
   ===================================================================== */
const RD = Object.assign({nivel:"d100", modo:"elegir", recta:true, distancias:false}, leer("aula-redondeo", {}),
  {ronda:null, escrito:"", pista:false});
let redondeoListo = false;
const guardarRD = () => guardar("aula-redondeo", {nivel:RD.nivel, modo:RD.modo, recta:RD.recta, distancias:RD.distancias});
const NIVELES_RD = {
  d100:  {txt:"Decenas hasta 100",   lista: ()=> rango(11, 99).filter(n=> n % 10).map(n=> ({k:"d"+n, n, base:10}))},
  d1000: {txt:"Decenas hasta 1000",  lista: ()=> rango(101, 999).filter(n=> n % 10).map(n=> ({k:"d"+n, n, base:10}))},
  c1000: {txt:"Centenas hasta 1000", lista: ()=> rango(101, 999).filter(n=> n % 100 && n % 10).map(n=> ({k:"c"+n, n, base:100}))},
  mixto: {txt:"Decenas y centenas",  lista: ()=> rango(101, 999).filter(n=> n % 10).flatMap(n=> n % 100 ? [{k:"d"+n, n, base:10}, {k:"c"+n, n, base:100}] : [{k:"d"+n, n, base:10}])}};
function rango(a, b){ const l = []; for(let x=a; x<=b; x++) l.push(x); return l; }
const listasRD = {};
const listaRD = nivel => listasRD[nivel] || (listasRD[nivel] = NIVELES_RD[nivel].lista());

function iniciarRedondeo(){
  if(!redondeoListo){
    redondeoListo = true;
    pintarIconos($("vRedondeo"));
    $("rdNivel").innerHTML = Object.entries(NIVELES_RD).map(([k,v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("rdNivel").onchange = e=>{ RD.nivel = e.target.value; guardarRD(); nuevaRondaRD(); };
    document.querySelectorAll("#vRedondeo .segmentos button").forEach(b=> b.onclick = ()=>{ RD.modo = b.dataset.modo; guardarRD(); pintarRedondeo(); });
    $("rdRecta").onclick = ()=>{ RD.recta = !RD.recta; guardarRD(); pintarRedondeo(); };
    $("rdDist").onclick = ()=>{ RD.distancias = !RD.distancias; guardarRD(); pintarRedondeo(); };
    apTeclado("rdTeclado", teclaRD);
    if(document.fullscreenEnabled) $("rdPantalla").onclick = ()=> pantallaCompleta("vRedondeo"); else $("rdPantalla").hidden = true;
  }
  if(!RD.ronda) nuevaRondaRD(); else pintarRedondeo();
}
function nuevaRondaRD(){
  const retos = [], vistos = new Set();
  for(let t=0; retos.length < 10 && t < 40; t++){ const r = delMazo("rd-"+RD.nivel, listaRD(RD.nivel)); if(!vistos.has(r.k)){ vistos.add(r.k); retos.push({...r}); } }
  RD.ronda = {retos, i:0, bien:0}; RD.escrito = ""; RD.pista = false;
  pintarRedondeo();
}
function responderRD(valor){
  const ronda = RD.ronda, r = ronda.retos[ronda.i];
  if(!r || r.respuesta != null) return;
  r.respuesta = valor; r.bien = valor === apAproximar(r.n, r.base);
  if(r.bien) ronda.bien++;
  pintarRedondeo();
  $("rdSiguiente")?.focus();
}
function teclaRD(t){
  const r = RD.ronda && RD.ronda.retos[RD.ronda.i];
  if(!r || RD.modo !== "escribir") return;
  if(r.respuesta != null){ if(t === "✓") siguienteRD(); return; }
  if(t === "⌫") RD.escrito = RD.escrito.slice(0, -1);
  else if(t === "✓"){ if(RD.escrito) responderRD(+RD.escrito); return; }
  else if(RD.escrito.length < 4) RD.escrito += t;
  pintarRedondeo();
}
function siguienteRD(){ RD.ronda.i++; RD.escrito = ""; RD.pista = false; pintarRedondeo(); if(RD.ronda.i >= RD.ronda.retos.length) $("apFin")?.focus(); }

function pintarRedondeo(){
  $("rdNivel").value = RD.nivel;
  document.querySelectorAll("#vRedondeo .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === RD.modo));
  $("rdRecta").setAttribute("aria-pressed", RD.recta); $("rdDist").setAttribute("aria-pressed", RD.distancias);
  const ronda = RD.ronda, c = $("rdCuerpo"), r = ronda.retos[ronda.i];
  $("rdTeclado").hidden = !r || RD.modo !== "escribir" || r.respuesta != null;
  if(!r){
    c.innerHTML = apResumen(ronda, "Aproximaciones", x=> x.n+" → "+apAproximar(x.n, x.base)+(x.bien ? "" : " (dijiste "+x.respuesta+")"))+
      '<div class="pt-acciones"><button class="bt azul" id="rdOtra">Otra ronda</button></div>';
    $("rdOtra").onclick = nuevaRondaRD;
    return;
  }
  const respondido = r.respuesta != null, [a, b] = apVecinas(r.n, r.base), correcta = apAproximar(r.n, r.base);
  let h = apMarcador(ronda) + '<p class="ap-pregunta">Aproxima el <b>'+r.n+'</b> a la '+apNombre(r.base)+'</p>';
  if(RD.recta || respondido) h += apRecta(r.n, r.base, {distancias: RD.distancias || respondido});
  if(RD.pista && !respondido){
    h += '<p class="ap-pista">'+r.n+' está entre el <b>'+a+'</b> y el <b>'+b+'</b>. La mitad es el <b>'+(a + r.base/2)+'</b>: '+
         (r.n >= a + r.base/2 ? "¿el "+r.n+" llega a la mitad o la pasa?" : "¿el "+r.n+" llega a la mitad?")+'</p>';
  }
  if(RD.modo === "elegir"){
    h += '<div class="ap-opciones">'+[a, b].map(v=>{
      const clase = !respondido ? "" : v === correcta ? " bien" : v === r.respuesta ? " mal" : "";
      return '<button class="ap-opcion'+clase+'" data-v="'+v+'"'+(respondido ? " disabled" : "")+'>'+v+'</button>'; }).join("")+'</div>';
  }else{
    h += '<p class="ap-escrito'+(respondido ? (r.bien ? " bien" : " mal") : "")+'" aria-live="polite">'+r.n+' ≈ <b>'+(respondido ? r.respuesta : (RD.escrito || "?"))+'</b></p>';
  }
  if(respondido){
    h += '<p class="ap-explica '+(r.bien ? "bien" : "mal")+'" role="status">'+(r.bien ? "¡Muy bien! " : "Casi. ")+apExplica(r.n, r.base)+'</p>'+
         '<div class="pt-acciones"><button class="bt azul" id="rdSiguiente">'+(ronda.i+1 < ronda.retos.length ? "Siguiente" : "Ver el resultado")+'</button></div>';
  }else{
    h += '<div class="pt-acciones"><button class="bt suave" id="rdPista" aria-pressed="'+RD.pista+'">Pista</button><button class="bt suave" id="rdNueva">Nueva ronda</button></div>';
  }
  c.innerHTML = h;
  c.querySelectorAll(".ap-opcion").forEach(x=> x.onclick = ()=> responderRD(+x.dataset.v));
  $("rdSiguiente")?.addEventListener("click", siguienteRD);
  $("rdPista")?.addEventListener("click", ()=>{ RD.pista = !RD.pista; pintarRedondeo(); });
  $("rdNueva")?.addEventListener("click", nuevaRondaRD);
}
function tecladoRedondeo(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const r = RD.ronda && RD.ronda.retos[RD.ronda.i];
  if(!r) return;
  if(/^[0-9]$/.test(e.key) && RD.modo === "escribir"){ e.preventDefault(); teclaRD(e.key); }
  else if(e.key === "Backspace"){ e.preventDefault(); teclaRD("⌫"); }
  else if(e.key === "Enter" && e.target.tagName !== "BUTTON"){ e.preventDefault(); r.respuesta != null ? siguienteRD() : teclaRD("✓"); }
  else if(RD.modo === "elegir" && r.respuesta == null && (e.key === "ArrowLeft" || e.key === "ArrowRight")){
    e.preventDefault(); responderRD(apVecinas(r.n, r.base)[e.key === "ArrowLeft" ? 0 : 1]);
  }
}

/* =====================================================================
   ESTIMACIÓN DE RESULTADOS
   ===================================================================== */
const ES = Object.assign({nivel:"s100", modo:"elegir", tiempo:0}, leer("aula-estimacion", {}),
  {ronda:null, paso:0, campos:["","",""], tapada:false});
let estimacionListo = false, esTemporizador = null;
const guardarES = () => guardar("aula-estimacion", {nivel:ES.nivel, modo:ES.modo, tiempo:ES.tiempo});
const NIVELES_ES = {
  s100:  {txt:"Sumas hasta 100",               base:10},
  sr100: {txt:"Sumas y restas hasta 100",      base:10},
  s1000: {txt:"Sumas y restas hasta 1000",     base:100}};
function generarES(){   // una operación cuyos números no son ya redondos (si no, no hay nada que estimar)
  const nivel = ES.nivel, base = NIVELES_ES[nivel].base;
  for(;;){
    const resta = nivel !== "s100" && Math.random() < .5;
    let a, b;
    if(base === 10){ a = azar(11, 89); b = azar(11, 89); }
    else { a = azar(101, 899); b = azar(101, 899); }
    if(resta && a < b) [a, b] = [b, a];
    if(a % base === 0 || b % base === 0 || a === b) continue;
    const exacto = resta ? a - b : a + b;
    if(!resta && exacto > (base === 10 ? 100 : 1000)) continue;
    if(resta && exacto < base) continue;
    const ea = apAproximar(a, base), eb = apAproximar(b, base), estimado = resta ? ea - eb : ea + eb;
    return {k:a+(resta ? "-" : "+")+b, a, b, op: resta ? "−" : "+", exacto, ea, eb, estimado, base};
  }
}
function iniciarEstimacion(){
  if(!estimacionListo){
    estimacionListo = true;
    pintarIconos($("vEstimacion"));
    $("esNivel").innerHTML = Object.entries(NIVELES_ES).map(([k,v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("esNivel").onchange = e=>{ ES.nivel = e.target.value; guardarES(); nuevaRondaES(); };
    $("esTiempo").onchange = e=>{ ES.tiempo = +e.target.value; guardarES(); pintarEstimacion(); };
    document.querySelectorAll("#vEstimacion .segmentos button").forEach(b=> b.onclick = ()=>{ ES.modo = b.dataset.modo; guardarES(); nuevaRondaES(); });
    apTeclado("esTeclado", teclaES);
    if(document.fullscreenEnabled) $("esPantalla").onclick = ()=> pantallaCompleta("vEstimacion"); else $("esPantalla").hidden = true;
  }
  if(!ES.ronda) nuevaRondaES(); else pintarEstimacion();
}
function nuevaRondaES(){
  clearTimeout(esTemporizador);
  const retos = [];
  for(let i=0; i<10; i++){
    const r = sinRepetir("es-"+ES.nivel, generarES, 300);
    // opciones (elegir) y número de referencia (más o menos), preparados una vez para que no cambien al repintar
    const d = r.base * 2, opciones = [r.estimado, r.estimado - d, r.estimado + d].filter(x=> x >= 0);
    while(opciones.length < 3) opciones.push(r.estimado + d * opciones.length);
    r.opciones = barajar(opciones);
    let ref; do { ref = r.estimado + r.base * [-1, 1][azar(0,1)] * azar(1, 2); } while(ref === r.exacto || ref <= 0);
    r.ref = ref;
    retos.push(r);
  }
  ES.ronda = {retos, i:0, bien:0}; ES.paso = 0; ES.campos = ["","",""];
  empezarRetoES();
}
function empezarRetoES(){
  clearTimeout(esTemporizador);
  ES.tapada = false; ES.paso = 0; ES.campos = ["","",""];
  pintarEstimacion();
  const r = ES.ronda.retos[ES.ronda.i];
  if(r && ES.tiempo && ES.modo !== "pasos") esTemporizador = setTimeout(()=>{ ES.tapada = true; pintarEstimacion(); }, ES.tiempo * 1000);
}
function responderES(bien, valor){
  const ronda = ES.ronda, r = ronda.retos[ronda.i];
  if(!r || r.respuesta != null) return;
  clearTimeout(esTemporizador); ES.tapada = false;
  r.respuesta = valor; r.bien = bien; if(bien) ronda.bien++;
  pintarEstimacion(); $("esSiguiente")?.focus();
}
function teclaES(t){   // «Redondea y calcula»: tres pasos (primer número, segundo número, cálculo)
  const r = ES.ronda && ES.ronda.retos[ES.ronda.i];
  if(!r || ES.modo !== "pasos") return;
  if(r.respuesta != null){ if(t === "✓") siguienteES(); return; }
  if(t === "⌫") ES.campos[ES.paso] = ES.campos[ES.paso].slice(0, -1);
  else if(t === "✓"){
    if(!ES.campos[ES.paso]) return;
    if(+ES.campos[ES.paso] !== [r.ea, r.eb, r.estimado][ES.paso]){ ES.error = true; r.fallos = (r.fallos || 0) + 1; pintarEstimacion(); return; }
    ES.error = false;
    if(ES.paso < 2) ES.paso++;
    else { responderES(!r.fallos, r.estimado); return; }
  }
  else if(ES.campos[ES.paso].length < 4) ES.campos[ES.paso] += t;
  pintarEstimacion();
}
function siguienteES(){ ES.ronda.i++; ES.error = false; empezarRetoES(); if(ES.ronda.i >= ES.ronda.retos.length) $("apFin")?.focus(); }

function pintarEstimacion(){
  $("esNivel").value = ES.nivel; $("esTiempo").value = ES.tiempo;
  $("esTiempoCaja").hidden = ES.modo === "pasos";
  document.querySelectorAll("#vEstimacion .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === ES.modo));
  const ronda = ES.ronda, c = $("esCuerpo"), r = ronda.retos[ronda.i];
  $("esTeclado").hidden = !r || ES.modo !== "pasos" || r.respuesta != null;
  if(!r){
    c.innerHTML = apResumen(ronda, "Estimación", x=> x.a+" "+x.op+" "+x.b+" ≈ "+x.estimado+" (exacto: "+x.exacto+")")+
      '<div class="pt-acciones"><button class="bt azul" id="esOtra">Otra ronda</button></div>';
    $("esOtra").onclick = nuevaRondaES;
    return;
  }
  const respondido = r.respuesta != null, nombre = apNombre(r.base);
  const operacion = ES.tapada ? '<span class="ap-tapada">Ya no se ve: ¡estima!</span>' : r.a+' '+r.op+' '+r.b;
  let h = apMarcador(ronda);
  if(ES.modo === "elegir"){
    h += '<p class="ap-pregunta">¿Qué resultado se acerca más?</p><p class="ap-operacion">'+operacion+'</p>'+
      '<div class="ap-opciones tres">'+r.opciones.map(v=>{
        const clase = !respondido ? "" : v === r.estimado ? " bien" : v === r.respuesta ? " mal" : "";
        return '<button class="ap-opcion'+clase+'" data-v="'+v+'"'+(respondido ? " disabled" : "")+'>≈ '+v+'</button>'; }).join("")+'</div>';
  }else if(ES.modo === "masmenos"){
    h += '<p class="ap-pregunta">¿El resultado es más o menos que <b>'+r.ref+'</b>?</p><p class="ap-operacion">'+operacion+'</p>'+
      '<div class="ap-opciones">'+[["menos","Menos de "+r.ref],["mas","Más de "+r.ref]].map(([k,t])=>{
        const ok = (r.exacto > r.ref) === (k === "mas");
        const clase = !respondido ? "" : ok ? " bien" : k === r.respuesta ? " mal" : "";
        return '<button class="ap-opcion texto'+clase+'" data-k="'+k+'"'+(respondido ? " disabled" : "")+'>'+t+'</button>'; }).join("")+'</div>';
  }else{
    const campo = (i, txt)=> '<span class="ap-campo'+(i===ES.paso && !respondido ? " activo"+(ES.error ? " mal" : "") : i < ES.paso || respondido ? " bien" : "")+'">'+
      (i < ES.paso || respondido ? [r.ea, r.eb, r.estimado][i] : (ES.campos[i] || txt))+'</span>';
    h += '<p class="ap-pregunta">Redondea cada número a la '+nombre+' y calcula</p><p class="ap-operacion">'+r.a+' '+r.op+' '+r.b+'</p>'+
      '<div class="ap-pasos">'+
        '<p>'+r.a+' ≈ '+campo(0, "?")+'</p><p>'+r.b+' ≈ '+campo(1, "?")+'</p>'+
        '<p class="ap-total">'+(ES.paso >= 1 || respondido ? r.ea : "…")+' '+r.op+' '+(ES.paso >= 2 || respondido ? r.eb : "…")+' = '+campo(2, "?")+'</p></div>'+
      (ES.error ? '<p class="ap-pista">Revísalo: '+(ES.paso < 2 ? apExplica([r.a, r.b][ES.paso], r.base) : "suma o resta los números redondos.")+'</p>' : '');
  }
  if(respondido){
    const dif = Math.abs(r.exacto - r.estimado);
    h += '<div class="ap-compara" role="status"><p>Estimación: <b>'+r.ea+' '+r.op+' '+r.eb+' = '+r.estimado+'</b></p>'+
         '<p>Resultado exacto: <b>'+r.a+' '+r.op+' '+r.b+' = '+r.exacto+'</b></p>'+
         '<p class="ap-cerca">'+(dif === 0 ? "¡La estimación es exacta!" : "La estimación se aleja "+dif+" del resultado exacto: "+(dif <= r.base ? "¡muy cerca!" : "bastante cerca."))+'</p></div>'+
         '<p class="ap-explica '+(r.bien ? "bien" : "mal")+'">'+(r.bien ? "¡Muy bien!" : "Casi: redondea primero cada número a la "+nombre+".")+'</p>'+
         '<div class="pt-acciones"><button class="bt azul" id="esSiguiente">'+(ronda.i+1 < ronda.retos.length ? "Siguiente" : "Ver el resultado")+'</button></div>';
  }else{
    h += '<div class="pt-acciones"><button class="bt suave" id="esPista">Pista</button><button class="bt suave" id="esNueva">Nueva ronda</button></div>'+
         (ES.pistaVista ? '<p class="ap-pista">'+r.a+' ≈ '+r.ea+' y '+r.b+' ≈ '+r.eb+'</p>' : '');
  }
  c.innerHTML = h;
  c.querySelectorAll(".ap-opcion").forEach(x=> x.onclick = ()=>{
    if(ES.modo === "elegir") responderES(+x.dataset.v === r.estimado, +x.dataset.v);
    else responderES((r.exacto > r.ref) === (x.dataset.k === "mas"), x.dataset.k);
  });
  $("esSiguiente")?.addEventListener("click", ()=>{ ES.pistaVista = false; siguienteES(); });
  $("esPista")?.addEventListener("click", ()=>{ ES.pistaVista = !ES.pistaVista; pintarEstimacion(); });
  $("esNueva")?.addEventListener("click", ()=>{ ES.pistaVista = false; nuevaRondaES(); });
}
function tecladoEstimacion(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const r = ES.ronda && ES.ronda.retos[ES.ronda.i];
  if(!r) return;
  if(/^[0-9]$/.test(e.key) && ES.modo === "pasos"){ e.preventDefault(); teclaES(e.key); }
  else if(e.key === "Backspace"){ e.preventDefault(); teclaES("⌫"); }
  else if(e.key === "Enter" && e.target.tagName !== "BUTTON"){ e.preventDefault(); r.respuesta != null ? (ES.pistaVista = false, siguienteES()) : teclaES("✓"); }
}
