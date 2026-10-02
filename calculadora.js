/* =====================================================================
   CALCULADORA DE AULA (#/calculadora)
   - Calculadora sencilla con teclas grandes para la pizarra digital.
   - Factor constante: al repetir «=» se vuelve a hacer la última operación (0 + 2 = = = → 2, 4, 6, 8…);
     la serie que sale se ve en fichas (pares e impares de colores) y en un panel del 100.
   - Cinta: todas las operaciones hechas, para comentarlas después.
   - «¿Qué saldrá?»: el resultado se tapa hasta que se pulsa la pantalla (para estimar antes).
   - «Tecla rota»: una cifra no funciona y hay que conseguir un número sin usarla.
   Usa las utilidades de index.html y herramientas.js ($, leer, guardar, svg, pintarIconos, azar…).
   ===================================================================== */

const CA = Object.assign({parImpar:true, panel:true}, leer("aula-calculadora", {}),
  {pantalla:"0", acum:null, op:null, k:null, nuevo:true, error:"", cinta:[], serie:[], tapado:false, ocultar:false,
   modo:"libre", rota:null, objetivo:null, logrado:false});
let calcListo = false;
const guardarCA = () => guardar("aula-calculadora", {parImpar:CA.parImpar, panel:CA.panel});
const SIMBOLO = {"+":"+", "-":"−", "*":"×", "/":"÷"};
const TECLAS = [["C","⌫","/","*"], ["7","8","9","-"], ["4","5","6","+"], ["1","2","3","="], ["0",","]];
const NOMBRE_TECLA = {"C":"Borrar todo", "⌫":"Borrar la última cifra", "/":"Entre", "*":"Por", "-":"Menos", "+":"Más", "=":"Igual", ",":"Coma"};

function iniciarCalculadora(){
  if(!calcListo){
    calcListo = true;
    pintarIconos($("vCalculadora"));
    const teclado = $("caTeclado");
    teclado.innerHTML = TECLAS.flat().map(t=>{
      const clase = /\d/.test(t) ? "num" : t==="=" ? "igual" : t==="C" || t==="⌫" ? "borrar" : t==="," ? "num" : "op";
      return '<button class="ca-tecla '+clase+(t==="0" ? " cero" : "")+'" data-t="'+t+'" aria-label="'+(NOMBRE_TECLA[t] || t)+'">'+(SIMBOLO[t] || t)+'</button>';
    }).join("");
    teclado.querySelectorAll("button").forEach(b=> b.onclick = ()=> pulsar(b.dataset.t));
    $("caPantalla").onclick = ()=>{ if(CA.tapado){ CA.tapado = false; pintarCalculadora(); } };
    document.querySelectorAll("#vCalculadora .segmentos button").forEach(b=> b.onclick = ()=>{
      CA.modo = b.dataset.modo; borrarTodo(); CA.cinta = [];
      if(CA.modo==="rota") nuevoRetoRota(); else { CA.rota = null; CA.objetivo = null; }
      pintarCalculadora(); });
    $("caOcultar").onclick = ()=>{ CA.ocultar = !CA.ocultar; CA.tapado = false; pintarCalculadora(); };
    $("caParImpar").onclick = ()=>{ CA.parImpar = !CA.parImpar; guardarCA(); pintarCalculadora(); };
    $("caPanel").onclick = ()=>{ CA.panel = !CA.panel; guardarCA(); pintarCalculadora(); };
    $("caLimpiar").onclick = ()=>{ CA.cinta = []; CA.serie = []; pintarCalculadora(); };
    if(document.fullscreenEnabled) $("caPantallaCompleta").onclick = ()=> pantallaCompleta("vCalculadora"); else $("caPantallaCompleta").hidden = true;
  }
  pintarCalculadora();
}

/* ---------- Cálculo ---------- */
const valor = txt => parseFloat(String(txt).replace(",", "."));
function formato(x){
  if(!isFinite(x)) return "Error";
  const r = Math.round(x * 1e8) / 1e8;
  if(Math.abs(r) >= 1e12) return "Demasiado grande";
  return String(r).replace(".", ",");
}
function operar(a, op, b){
  if(op==="+") return a + b;
  if(op==="-") return a - b;
  if(op==="*") return a * b;
  if(op==="/") return b===0 ? NaN : a / b;
  return b;
}
function borrarTodo(){ Object.assign(CA, {pantalla:"0", acum:null, op:null, k:null, nuevo:true, error:"", serie:[], tapado:false}); }
function pulsar(t){
  if(CA.modo==="rota" && t===CA.rota) return;
  if(CA.error && t!=="C"){ borrarTodo(); if(!/[\d,]/.test(t)) { pintarCalculadora(); return; } }
  CA.logrado = false;
  if(/\d/.test(t)){
    if(CA.nuevo || CA.pantalla==="0"){ CA.pantalla = t; CA.nuevo = false; }
    else if(CA.pantalla.replace(/[-,]/g, "").length < 12) CA.pantalla += t;
    if(CA.k && !CA.op) CA.serie = [];   // un número nuevo empieza otra serie
  }else if(t===","){
    if(CA.nuevo){ CA.pantalla = "0,"; CA.nuevo = false; }
    else if(!CA.pantalla.includes(",")) CA.pantalla += ",";
  }else if(t==="⌫"){
    if(!CA.nuevo){ CA.pantalla = CA.pantalla.length > 1 ? CA.pantalla.slice(0, -1) : "0"; if(CA.pantalla==="-") CA.pantalla = "0"; }
  }else if(t==="C"){
    borrarTodo();
  }else if(SIMBOLO[t]){
    if(CA.op && !CA.nuevo){   // 3 + 4 + … : se hace la suma pendiente
      const r = operar(CA.acum, CA.op, valor(CA.pantalla));
      apuntar(CA.acum, CA.op, valor(CA.pantalla), r);
      if(!mostrar(r)) return pintarCalculadora();
    }
    CA.acum = valor(CA.pantalla); CA.op = t; CA.nuevo = true; CA.k = null; CA.serie = [];
  }else if(t==="="){
    let a, op, b;
    if(CA.op){ a = CA.acum; op = CA.op; b = valor(CA.pantalla); CA.k = {op, b}; CA.serie = [a]; }
    else if(CA.k){ a = valor(CA.pantalla); op = CA.k.op; b = CA.k.b; if(!CA.serie.length) CA.serie = [a]; }   // factor constante
    else { pintarCalculadora(); return; }
    const r = operar(a, op, b);
    apuntar(a, op, b, r);
    CA.acum = null; CA.op = null; CA.nuevo = true;
    if(mostrar(r)){
      CA.serie.push(r); if(CA.serie.length > 40) CA.serie.shift();
      CA.tapado = CA.ocultar;
      if(CA.objetivo!=null && r===CA.objetivo) CA.logrado = true;
    }
  }
  pintarCalculadora();
}
function mostrar(r){
  const txt = formato(r);
  if(txt==="Error" || txt==="Demasiado grande"){
    CA.error = txt==="Error" ? "No se puede dividir entre 0." : "El número es demasiado grande para la calculadora.";
    CA.pantalla = txt; CA.nuevo = true; CA.op = null; CA.k = null; CA.serie = [];
    return false;
  }
  CA.pantalla = txt;
  return true;
}
function apuntar(a, op, b, r){
  CA.cinta.push(formato(a)+" "+SIMBOLO[op]+" "+formato(b)+" = "+formato(r));
  if(CA.cinta.length > 60) CA.cinta.shift();
}
function nuevoRetoRota(){
  CA.rota = String(azar(1, 9));
  let n; do { n = azar(10, 99); } while(!String(n).includes(CA.rota));   // el número que hay que conseguir lleva la cifra rota
  CA.objetivo = n; CA.logrado = false;
}

/* ---------- Pintar ---------- */
const esEntero = x => Number.isInteger(x);
function pintarCalculadora(){
  document.querySelectorAll("#vCalculadora .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo===CA.modo));
  $("caOcultar").setAttribute("aria-pressed", CA.ocultar);
  $("caParImpar").setAttribute("aria-pressed", CA.parImpar);
  $("caPanel").setAttribute("aria-pressed", CA.panel);
  // Pantalla
  const pant = $("caPantalla"), num = $("caNumero");
  num.textContent = CA.tapado ? "?" : CA.pantalla;
  num.style.fontSize = CA.pantalla.length > 9 ? "0.62em" : CA.pantalla.length > 6 ? "0.8em" : "";
  pant.classList.toggle("tapada", CA.tapado);
  pant.setAttribute("aria-label", CA.tapado ? "Resultado tapado: ¿qué saldrá? Pulsa para verlo." : "Pantalla: "+CA.pantalla);
  const v = valor(CA.pantalla), mostrarPar = CA.parImpar && !CA.tapado && !CA.error && esEntero(v);
  $("caOperacion").textContent = CA.error || (CA.op ? formato(CA.acum)+" "+SIMBOLO[CA.op] : CA.k ? "Constante: "+SIMBOLO[CA.k.op]+" "+formato(CA.k.b)+"  (pulsa = otra vez)" : "");
  $("caPar").textContent = mostrarPar ? (Math.abs(v) % 2 === 0 ? "par" : "impar") : "";
  $("caPar").className = "ca-par" + (mostrarPar ? (Math.abs(v) % 2 === 0 ? " par" : " impar") : "");
  // Teclas: la operación elegida se marca; la tecla rota no funciona
  $("caTeclado").querySelectorAll("button").forEach(b=>{
    const t = b.dataset.t;
    b.classList.toggle("activa", CA.op===t && CA.nuevo);
    const rota = CA.modo==="rota" && t===CA.rota;
    b.classList.toggle("rota", rota); b.disabled = rota;
    b.setAttribute("aria-label", rota ? "Tecla "+t+" rota" : (NOMBRE_TECLA[t] || t));
  });
  // Reto de la tecla rota
  const reto = $("caReto");
  reto.hidden = CA.modo!=="rota";
  if(CA.modo==="rota"){
    reto.innerHTML = CA.logrado
      ? '<p class="ca-reto-txt ok">¡Conseguido! Has llegado al <b>'+CA.objetivo+'</b> sin usar el '+CA.rota+'.</p><button class="bt azul" id="caOtroReto">Otro reto</button>'
      : '<p class="ca-reto-txt">La tecla <b class="ca-rota">'+CA.rota+'</b> está rota. ¿Cómo consigues que la pantalla muestre <b>'+CA.objetivo+'</b>?</p><button class="bt suave" id="caOtroReto">Otro reto</button>';
    $("caOtroReto").onclick = ()=>{ nuevoRetoRota(); borrarTodo(); CA.cinta = []; pintarCalculadora(); };
  }
  // Cinta
  const cinta = $("caCinta");
  cinta.innerHTML = CA.cinta.length
    ? CA.cinta.map((c,i)=> '<li>'+(CA.tapado && i===CA.cinta.length-1 ? c.replace(/= .*$/, "= ?") : esc(c))+'</li>').join("")
    : '<li class="vacia">Aquí se apuntan las operaciones.</li>';
  cinta.scrollTop = cinta.scrollHeight;
  // Serie (factor constante)
  const serie = CA.serie.length > 1 ? CA.serie : [];
  const vis = CA.tapado ? serie.slice(0, -1) : serie;
  $("caSerieCaja").hidden = !serie.length;
  $("caSerie").innerHTML = vis.map(x=>{
    const cl = CA.parImpar && esEntero(x) ? (Math.abs(x) % 2 === 0 ? " par" : " impar") : "";
    return '<li class="ca-ficha'+cl+'">'+formato(x)+'</li>';
  }).join("") + (CA.tapado ? '<li class="ca-ficha">?</li>' : '');
  $("caSerieTit").textContent = CA.k ? "Serie: "+SIMBOLO[CA.k.op]+" "+formato(CA.k.b)+" cada vez" : "Serie";
  // Panel del 100 con la serie marcada
  const enPanel = new Set(vis.filter(x=> esEntero(x) && x>=1 && x<=100));
  $("caPanelCaja").hidden = !CA.panel || !enPanel.size;
  if(CA.panel && enPanel.size){
    let h = "";
    for(let n=1; n<=100; n++){
      const cl = enPanel.has(n) ? " marca"+(CA.parImpar ? (n % 2 === 0 ? " par" : " impar") : "") : "";
      h += '<span class="ca-celda'+cl+'">'+n+'</span>';
    }
    $("caPanel100").innerHTML = h;
  }
}

/* ---------- Teclado físico ---------- */
function tecladoCalculadora(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key, mapa = {"x":"*", "X":"*", "Enter":"=", "Backspace":"⌫", "Delete":"C", "c":"C", "C":"C", ".":",", ",":","};
  const t = /^[0-9]$/.test(k) || SIMBOLO[k] || k==="=" ? k : mapa[k];
  if(!t) return;
  if(e.target.tagName==="BUTTON" && !e.target.classList.contains("ca-tecla") && (k==="Enter" || k===" ")) return;   // Intro sobre otro botón lo pulsa
  e.preventDefault(); pulsar(t);
}
