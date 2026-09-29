/* =====================================================================
   HERRAMIENTAS DEL AULA
   - Vistas a pantalla completa: regletas virtuales (#/regletas) y bombo del bingo (#/bombo)
   - Compartir un material o una página (enlace, WhatsApp, correo y código QR)
   - Rotulador para escribir sobre las páginas en el lector y en proyección
   Usa las utilidades de index.html ($, svg, esc, leer, guardar, L, rutaPrevia…).
   ===================================================================== */

/* Las diez regletas Cuisenaire: color de fondo, color del número y nombre */
const REGLETA = [null,
  {c:"#f4f4f4", t:"#1c2330", n:"blanca"},   {c:"#e3261f", t:"#ffffff", n:"roja"},
  {c:"#7cc84a", t:"#10240a", n:"verde clara"}, {c:"#c2185b", t:"#ffffff", n:"rosa"},
  {c:"#f2c200", t:"#2a2000", n:"amarilla"}, {c:"#2e8b3a", t:"#ffffff", n:"verde oscura"},
  {c:"#2b2b2b", t:"#ffffff", n:"negra"},    {c:"#8d5a2b", t:"#ffffff", n:"marrón"},
  {c:"#2f7fd1", t:"#ffffff", n:"azul"},     {c:"#f57c22", t:"#1c1204", n:"naranja"}];

/* ---------------------------------------------------------------------
   Vistas de herramientas
   --------------------------------------------------------------------- */
const VISTAS = {regletas: "vRegletas", bombo: "vBombo"};
let vistaAbierta = null, vistaDesdeBiblioteca = false;

function abrirHerramienta(nombre){
  if(vistaAbierta===nombre) return;
  cerrarHerramienta();
  vistaDesdeBiblioteca = rutaPrevia!=="__inicio__" && !/^#\/(regletas|bombo)/.test(rutaPrevia);
  const v = $(VISTAS[nombre]);
  v.hidden = false; vistaAbierta = nombre;
  $("biblioteca").setAttribute("aria-hidden","true"); $("biblioteca").inert = true;
  document.body.style.overflow = "hidden";
  (nombre==="regletas" ? iniciarRegletas : iniciarBombo)();
  v.querySelector(".v-cerrar").focus();
}
function cerrarHerramienta(){
  if(!vistaAbierta) return;
  const nombre = vistaAbierta;
  $(VISTAS[nombre]).hidden = true; vistaAbierta = null;
  if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  if(window.speechSynthesis) speechSynthesis.cancel();
  $("biblioteca").removeAttribute("aria-hidden"); $("biblioteca").inert = false;
  document.body.style.overflow = "";
  document.querySelector('.herr-ficha[href="#/'+nombre+'"]')?.focus();
}
function salirDeHerramienta(){
  if(vistaDesdeBiblioteca){ vistaDesdeBiblioteca = false; history.back(); }
  else location.hash = "#/";
}
document.querySelectorAll(".v-cerrar").forEach(b=> b.onclick = salirDeHerramienta);
document.addEventListener("keydown", e=>{
  if(!vistaAbierta || document.querySelector("dialog[open]")) return;
  if(e.key==="Escape"){ e.preventDefault(); salirDeHerramienta(); return; }
  if(vistaAbierta==="bombo") tecladoBombo(e); else tecladoRegletas(e);
});

/* ---------------------------------------------------------------------
   Números en letras (para el bombo y la voz)
   --------------------------------------------------------------------- */
const UNIDADES = ["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce",
  "quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte","veintiuno","veintidós","veintitrés","veinticuatro",
  "veinticinco","veintiséis","veintisiete","veintiocho","veintinueve"];
const DECENAS = ["","","","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
function enLetras(n){
  if(n===100) return "cien";
  if(n<30) return UNIDADES[n];
  const d = Math.floor(n/10), u = n%10;
  return DECENAS[d] + (u ? " y "+UNIDADES[u] : "");
}
/* «3 naranjas y un 4», como se explica en el bingo */
function enRegletas(n){
  const d = Math.floor(n/10), u = n%10;
  if(n===100) return "10 naranjas";
  if(!d) return "la regleta del "+u;
  return (d===1 ? "1 naranja" : d+" naranjas") + (u ? " y un "+u : "");
}
/* Dibujo del número con regletas: las naranjas (dieces) arriba y las unidades abajo */
function htmlRegletas(n){
  const d = Math.floor(n/10), u = n%10, filas = [];
  for(let i=0; i<d; i++) filas.push(10);
  if(u) filas.push(u);
  return filas.map(v=>{
    const r = REGLETA[v];
    return '<div class="b-fila"><span class="b-reg" style="width:calc(var(--u)*'+v+');background:'+r.c+';color:'+r.t+
           (v===1 ? ';box-shadow:inset 0 0 0 1px #c8ced6,inset 0 -4px 0 rgba(0,0,0,.12)' : '')+'">'+v+'</span></div>';
  }).join("");
}

/* ---------------------------------------------------------------------
   BOMBO DEL BINGO
   --------------------------------------------------------------------- */
const MODOS = {
  n1:{de:1,a:10,  nombre:"Nivel 1"}, n2:{de:11,a:20, nombre:"Nivel 2"}, n3:{de:21,a:50, nombre:"Nivel 3"},
  n4:{de:51,a:99, nombre:"Nivel 4"}, todo:{de:1,a:99, nombre:"Del 1 al 99"},
  decenas:{decenas:true, nombre:"Bingo de decenas"}, amigos:{de:1,a:99, nombre:"Amigo del 100"}};
const BO = Object.assign({modo:"n1", salidos:[], reves:false, voz:false, visto:true}, leer("aula-bombo", {}));
let bomboListo = false, bomboGirando = false;

function numerosDelModo(){
  const m = MODOS[BO.modo] || MODOS.n1;
  if(m.decenas) return [10,20,30,40,50,60,70,80,90];
  const r = []; for(let i=m.de; i<=m.a; i++) r.push(i); return r;
}
function guardarBombo(){ guardar("aula-bombo", {modo:BO.modo, salidos:BO.salidos, reves:BO.reves, voz:BO.voz, visto:BO.visto}); }

function iniciarBombo(){
  if(!bomboListo){
    bomboListo = true;
    pintarIconos($("vBombo"));
    $("bModo").onchange = e=>{
      if(BO.salidos.length && !confirm("¿Empezar una partida nueva con este juego?")){ e.target.value = BO.modo; return; }
      BO.modo = e.target.value; BO.salidos = []; BO.visto = true; guardarBombo(); pintarBombo();
    };
    $("bReves").onclick = ()=>{ BO.reves = !BO.reves; BO.visto = !BO.reves; guardarBombo(); pintarBombo(); };
    $("bVoz").onclick = ()=>{ BO.voz = !BO.voz; guardarBombo(); pintarBombo(); if(!BO.voz && window.speechSynthesis) speechSynthesis.cancel(); };
    $("bSacar").onclick = sacarNumero;
    $("bMostrar").onclick = ()=>{ BO.visto = true; guardarBombo(); pintarBombo(); decir(textoVoz(true)); };
    $("bNueva").onclick = ()=>{
      if(BO.salidos.length && !confirm("¿Empezar una partida nueva? Se borran los números que han salido.")) return;
      BO.salidos = []; BO.visto = true; guardarBombo(); pintarBombo();
    };
    if(!window.speechSynthesis) $("bVoz").hidden = true;
  }
  pintarBombo();
}
function tecladoBombo(e){
  if((e.key===" " || e.key==="Enter") && !/^(button|select|a|input)$/i.test(e.target.tagName)){ e.preventDefault(); sacarNumero(); }
}
function decir(texto){
  if(!BO.voz || !texto || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto); u.lang = "es-ES"; u.rate = .9;
  speechSynthesis.speak(u);
}
function textoVoz(respuesta){
  const n = BO.salidos[BO.salidos.length-1]; if(!n) return "";
  if(BO.modo==="amigos") return respuesta ? "Su amigo del cien es el "+enLetras(100-n) : "El "+enLetras(n)+". ¿Cuál es su amigo del cien?";
  if(BO.reves) return respuesta ? "Es el "+enLetras(n) : "";   // en el bingo al revés, lo dicen ellos
  return "El "+enLetras(n);
}
function sacarNumero(){
  if(bomboGirando) return;
  const quedan = numerosDelModo().filter(n=>!BO.salidos.includes(n));
  if(!quedan.length){ $("bSub").textContent = "¡Han salido todos los números! Pulsa «Nueva partida»."; return; }
  const elegido = quedan[Math.floor(Math.random()*quedan.length)];
  const num = $("bNum"), final = ()=>{
    bomboGirando = false; num.classList.remove("girando");
    BO.salidos.push(elegido); BO.visto = !(BO.reves || BO.modo==="amigos"); guardarBombo(); pintarBombo(); decir(textoVoz(false));
  };
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){ final(); return; }
  bomboGirando = true; num.classList.add("girando"); num.classList.remove("oculto");
  let vueltas = 0;
  const t = setInterval(()=>{
    num.textContent = quedan[Math.floor(Math.random()*quedan.length)];
    if(++vueltas > 10){ clearInterval(t); final(); }
  }, 55);
}
function pintarBombo(){
  $("bModo").value = BO.modo;
  $("bReves").setAttribute("aria-pressed", BO.reves); $("bVoz").setAttribute("aria-pressed", BO.voz);
  $("bReves").hidden = BO.modo==="amigos";
  const n = BO.salidos[BO.salidos.length-1], todos = numerosDelModo();
  const num = $("bNum"), sub = $("bSub"), eti = $("bEti"), reg = $("bRegletas"), mostrar = $("bMostrar");
  num.classList.remove("oculto"); mostrar.hidden = true; eti.innerHTML = "&nbsp;";
  if(!n){
    num.textContent = "?"; reg.innerHTML = "";
    sub.textContent = "Pulsa «Sacar número» o la barra espaciadora.";
  } else if(BO.modo==="amigos"){
    eti.textContent = "¿Cuál es su amigo del 100?";
    num.textContent = n; reg.innerHTML = htmlRegletas(BO.visto ? 100-n : n);
    sub.textContent = BO.visto ? "Su amigo es el "+(100-n)+": "+enRegletas(100-n)+" · "+n+" + "+(100-n)+" = 100" : enRegletas(n)+" · "+enLetras(n);
    if(!BO.visto){ mostrar.hidden = false; mostrar.textContent = "Mostrar el amigo del 100"; }
  } else if(BO.reves && !BO.visto){
    eti.textContent = "¿Qué número forman estas regletas?";
    num.textContent = "?"; num.setAttribute("aria-label","Número oculto");
    reg.innerHTML = htmlRegletas(n); sub.textContent = "";
    mostrar.hidden = false; mostrar.textContent = "Mostrar el número";
  } else {
    num.textContent = n; num.removeAttribute("aria-label");
    reg.innerHTML = htmlRegletas(n);
    sub.textContent = enRegletas(n).replace(/^./, c=>c.toUpperCase())+" · "+enLetras(n);
  }
  // tablero: en decenas, 9 casillas; si no, del primero al último del modo
  const rej = $("bRejilla");
  rej.style.gridTemplateColumns = todos.length<=10 ? "repeat(5,1fr)" : "repeat(10,1fr)";
  rej.innerHTML = todos.map(v=>'<span class="b-casilla'+(BO.salidos.includes(v) ? (v===n ? " salio ultima" : " salio") : "")+'">'+v+'</span>').join("");
  $("bCuenta").textContent = BO.salidos.length+" de "+todos.length;
  $("bSacar").disabled = BO.salidos.length>=todos.length;
}

/* ---------------------------------------------------------------------
   REGLETAS VIRTUALES
   --------------------------------------------------------------------- */
const RG = Object.assign({u:40, numeros:true, regla:false, piezas:[]}, leer("aula-regletas", {}));
let regListo = false, regElegida = null, regSig = 1 + RG.piezas.reduce((m,p)=>Math.max(m,p.id), 0);
const tablero = () => $("regTablero");

function guardarRegletas(){ guardar("aula-regletas", {u:RG.u, numeros:RG.numeros, regla:RG.regla, piezas:RG.piezas}); }
function medidas(){
  const t = tablero();
  return {cols: Math.max(10, Math.floor(t.clientWidth/RG.u)), filas: Math.max(4, Math.floor(t.clientHeight/RG.u)), arriba: RG.regla ? 1 : 0};
}
const ancho = p => p.v ? 1 : p.n, alto = p => p.v ? p.n : 1;
function encajar(p){
  const m = medidas();
  p.x = Math.max(0, Math.min(m.cols - ancho(p), Math.round(p.x)));
  p.y = Math.max(m.arriba, Math.min(m.filas - alto(p), Math.round(p.y)));
}
function hueco(n){   // primer sitio libre, de arriba abajo y de izquierda a derecha
  const m = medidas(), ocupa = (x,y,w)=> RG.piezas.some(p=> x < p.x+ancho(p) && x+w > p.x && y < p.y+alto(p) && y+1 > p.y);
  for(let y=m.arriba+1; y<m.filas-1; y+=2) for(let x=1; x+n<=m.cols-1; x++) if(!ocupa(x,y,n)) return {x,y};
  return {x:1, y:m.arriba+1};
}

function iniciarRegletas(){
  if(!regListo){
    regListo = true;
    pintarIconos($("vRegletas"));
    const pal = $("regPaleta");
    for(let n=1; n<=10; n++){
      const r = REGLETA[n], b = document.createElement("button");
      b.className = "reg-pieza"; b.style.cssText = "width:"+(n*11+10)+"px;background:"+r.c+";color:"+r.t+(n===1 ? ";box-shadow:inset 0 0 0 1px #c8ced6" : "");
      b.textContent = n; b.setAttribute("aria-label", "Regleta "+r.n+", vale "+n);
      b.addEventListener("pointerdown", e=> nuevaDesdePaleta(e, n));
      b.addEventListener("keydown", e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); ponerRegleta(n); } });
      pal.appendChild(b);
    }
    $("regGirar").onclick = ()=> girar(regElegida);
    $("regDuplicar").onclick = duplicar;
    $("regBorrar").onclick = ()=> quitar(regElegida);
    $("regNumeros").onclick = ()=>{ RG.numeros = !RG.numeros; guardarRegletas(); pintarRegletas(); };
    $("regRegla").onclick = ()=>{ RG.regla = !RG.regla; RG.piezas.forEach(encajar); guardarRegletas(); pintarRegletas(); };
    $("regMas").onclick = ()=> zoomRegletas(8);
    $("regMenos").onclick = ()=> zoomRegletas(-8);
    $("regLimpiar").onclick = ()=>{ if(RG.piezas.length && confirm("¿Quitar todas las regletas del tablero?")){ RG.piezas = []; regElegida = null; guardarRegletas(); pintarRegletas(); } };
    if(document.fullscreenEnabled) $("regPantalla").onclick = ()=> document.fullscreenElement ? document.exitFullscreen() : $("vRegletas").requestFullscreen();
    else $("regPantalla").hidden = true;
    tablero().addEventListener("pointerdown", e=>{ if(e.target===tablero()){ regElegida = null; pintarRegletas(); } });
    new ResizeObserver(()=>{ if(vistaAbierta==="regletas"){ RG.piezas.forEach(encajar); pintarRegletas(); } }).observe(tablero());
  }
  requestAnimationFrame(()=>{ RG.piezas.forEach(encajar); pintarRegletas(); });
}
function zoomRegletas(d){ RG.u = Math.max(24, Math.min(96, RG.u + d)); RG.piezas.forEach(encajar); guardarRegletas(); pintarRegletas(); }

function pintarRegletas(){
  const t = tablero(), u = RG.u;
  t.style.setProperty("--u", u+"px");
  t.classList.toggle("sin-numeros", !RG.numeros);
  $("regNumeros").setAttribute("aria-pressed", RG.numeros);
  $("regRegla").setAttribute("aria-pressed", RG.regla);
  const regla = $("regReglaNum"); regla.hidden = !RG.regla;
  if(RG.regla){ const m = medidas(); regla.innerHTML = Array.from({length:m.cols+1}, (_,i)=>'<span><b>'+i+'</b></span>').join(""); }
  t.querySelectorAll(".regleta-v").forEach(el=>el.remove());
  RG.piezas.forEach(p=>{
    const r = REGLETA[p.n], el = document.createElement("div");
    el.className = "regleta-v" + (p.id===regElegida ? " elegida" : "");
    el.dataset.id = p.id;
    el.style.cssText = "left:"+(p.x*u)+"px;top:"+(p.y*u)+"px;width:"+(ancho(p)*u-2)+"px;height:"+(alto(p)*u-2)+"px;background:"+r.c+";color:"+r.t+
                       (p.n===1 ? ";box-shadow:inset 0 0 0 1px #c8ced6,inset 0 -4px 0 rgba(0,0,0,.12)" : "");
    el.innerHTML = "<span>"+p.n+"</span>";
    el.setAttribute("role","img"); el.setAttribute("aria-label","Regleta "+r.n+" ("+p.n+")");
    el.addEventListener("pointerdown", e=> empezarArrastre(e, p, el, false));
    t.appendChild(el);
  });
  $("regVacio").hidden = RG.piezas.length>0;
  const hay = RG.piezas.some(p=>p.id===regElegida);
  ["regGirar","regDuplicar","regBorrar"].forEach(id=> $(id).disabled = !hay);
}

function ponerRegleta(n){
  const sitio = hueco(n), p = {id: regSig++, n, x: sitio.x, y: sitio.y, v:false};
  encajar(p); RG.piezas.push(p); regElegida = p.id; guardarRegletas(); pintarRegletas();
}
function girar(id){
  const p = RG.piezas.find(x=>x.id===id); if(!p) return;
  p.v = !p.v; encajar(p); guardarRegletas(); pintarRegletas();
}
function duplicar(){
  const p = RG.piezas.find(x=>x.id===regElegida); if(!p) return;
  const c = {id: regSig++, n:p.n, x:p.x + (p.v ? 1 : 0), y:p.y + (p.v ? 0 : 1), v:p.v};
  encajar(c); RG.piezas.push(c); regElegida = c.id; guardarRegletas(); pintarRegletas();
}
function quitar(id){
  RG.piezas = RG.piezas.filter(p=>p.id!==id);
  if(regElegida===id) regElegida = null;
  guardarRegletas(); pintarRegletas();
}

/* Arrastrar con ratón, dedo o lápiz. Un toque elige la regleta; dos toques seguidos la giran. */
let ultimoToque = {id:null, t:0};
function nuevaDesdePaleta(e, n){
  e.preventDefault();
  const t = tablero().getBoundingClientRect(), u = RG.u;
  const p = {id: regSig++, n, x:(e.clientX - t.left)/u - n/2, y:(e.clientY - t.top)/u - .5, v:false, nueva:true};
  RG.piezas.push(p); regElegida = p.id; pintarRegletas();
  const el = tablero().querySelector('.regleta-v[data-id="'+p.id+'"]');
  empezarArrastre(e, p, el, true);
}
function empezarArrastre(e, p, el, desdePaleta){
  e.preventDefault(); e.stopPropagation();
  const u = RG.u, x0 = p.x, y0 = p.y, px = e.clientX, py = e.clientY, papelera = $("regPapelera");
  let movido = false;
  regElegida = p.id;
  tablero().querySelectorAll(".regleta-v.elegida").forEach(x=>x.classList.remove("elegida"));
  el.classList.add("elegida","arrastrando"); tablero().classList.add("moviendo");
  ["regGirar","regDuplicar","regBorrar"].forEach(id=> $(id).disabled = false);
  try{ el.setPointerCapture(e.pointerId); }catch(err){}
  const encima = ev=>{ const b = papelera.getBoundingClientRect(); return ev.clientX>=b.left && ev.clientX<=b.right && ev.clientY>=b.top && ev.clientY<=b.bottom; };
  const mover = ev=>{
    const dx = ev.clientX - px, dy = ev.clientY - py;
    if(Math.abs(dx)+Math.abs(dy) > 4) movido = true;
    el.style.left = ((x0 + dx/u) * u)+"px"; el.style.top = ((y0 + dy/u) * u)+"px";
    papelera.classList.toggle("encima", encima(ev));
  };
  const soltar = ev=>{
    el.removeEventListener("pointermove", mover); el.removeEventListener("pointerup", soltar); el.removeEventListener("pointercancel", soltar);
    tablero().classList.remove("moviendo"); papelera.classList.remove("encima");
    if(encima(ev) && movido){ quitar(p.id); return; }
    if(desdePaleta && !movido){ const s = hueco(p.n); p.x = s.x; p.y = s.y; }   // un simple toque en la paleta la pone en un hueco libre
    else { p.x = x0 + (ev.clientX - px)/u; p.y = y0 + (ev.clientY - py)/u; }
    delete p.nueva; encajar(p);
    if(!movido && !desdePaleta){
      const ahora = Date.now();
      if(ultimoToque.id===p.id && ahora - ultimoToque.t < 350){ p.v = !p.v; encajar(p); ultimoToque = {id:null,t:0}; }
      else ultimoToque = {id:p.id, t:ahora};
    }
    guardarRegletas(); pintarRegletas(); tablero().focus({preventScroll:true});
  };
  el.addEventListener("pointermove", mover); el.addEventListener("pointerup", soltar); el.addEventListener("pointercancel", soltar);
}
function tecladoRegletas(e){
  if(!/^(input|select|textarea)$/i.test(e.target.tagName) && /^[1-9]$|^0$/.test(e.key)){ ponerRegleta(e.key==="0" ? 10 : +e.key); return; }
  const p = RG.piezas.find(x=>x.id===regElegida); if(!p) return;
  const mov = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]}[e.key];
  if(mov){ e.preventDefault(); p.x += mov[0]; p.y += mov[1]; encajar(p); guardarRegletas(); pintarRegletas(); }
  else if(e.key==="g"||e.key==="G"){ girar(p.id); }
  else if(e.key==="d"||e.key==="D"){ duplicar(); }
  else if(e.key==="Delete"||e.key==="Backspace"){ e.preventDefault(); quitar(p.id); }
}

/* ---------------------------------------------------------------------
   COMPARTIR (enlace, WhatsApp, correo y código QR)
   --------------------------------------------------------------------- */
let promesaQR = null, compartido = null;
function cargarQR(){
  if(window.qrcode) return Promise.resolve();
  return promesaQR || (promesaQR = new Promise((ok, ko)=>{
    const sc = document.createElement("script"); sc.src = "lib/qrcode.js"; sc.onload = ok; sc.onerror = ()=>{ promesaQR = null; ko(); };
    document.head.appendChild(sc);
  }));
}
function pintarQR(canvas, url, px){
  const q = qrcode(0, "M"); q.addData(url); q.make();
  const n = q.getModuleCount(), margen = 4, lado = (n + 2*margen) * px, ctx = canvas.getContext("2d");
  canvas.width = canvas.height = lado;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, lado, lado); ctx.fillStyle = "#0f1b2d";
  for(let f=0; f<n; f++) for(let c=0; c<n; c++) if(q.isDark(f, c)) ctx.fillRect((c+margen)*px, (f+margen)*px, px, px);
}
async function abrirCompartir(titulo, ruta){
  const url = location.origin + location.pathname + ruta, texto = titulo + " · Aula de Matemáticas Manipulativas";
  compartido = {titulo, url};
  $("dcQue").innerHTML = "Enlace directo a <b>"+esc(titulo)+"</b>.";
  $("dcUrl").value = url;
  $("dcWhats").href = "https://wa.me/?text=" + encodeURIComponent(texto + "\n" + url);
  $("dcCorreo").href = "mailto:?subject=" + encodeURIComponent(titulo) + "&body=" + encodeURIComponent(texto + "\n\n" + url);
  $("dcNativo").hidden = !navigator.share;
  $("dcCopiar").lastChild.textContent = "Copiar";
  const d = $("dCompartir");
  if(!d.open) d.showModal();
  try{ await cargarQR(); pintarQR($("dcQr"), url, 6); $("dcQr").parentNode.hidden = false; $("dcBajarQr").hidden = false; }
  catch(e){ $("dcQr").parentNode.hidden = true; $("dcBajarQr").hidden = true; }
}
$("dcCerrar").onclick = ()=> $("dCompartir").close();
$("dCompartir").addEventListener("click", e=>{ if(e.target===$("dCompartir")) $("dCompartir").close(); });   // clic fuera del cuadro
$("dcNativo").onclick = ()=>{ if(compartido) navigator.share({title: compartido.titulo, url: compartido.url}).catch(()=>{}); };
$("dcCopiar").onclick = async ()=>{
  const b = $("dcCopiar");
  try{ await navigator.clipboard.writeText($("dcUrl").value); }
  catch(e){ $("dcUrl").select(); document.execCommand?.("copy"); }
  b.lastChild.textContent = "¡Copiado!";
  setTimeout(()=>{ b.lastChild.textContent = "Copiar"; }, 1800);
};
$("dcBajarQr").onclick = ()=>{   // QR con el título debajo, listo para imprimir
  if(!compartido || !window.qrcode) return;
  const qr = document.createElement("canvas"); pintarQR(qr, compartido.url, 16);
  const c = document.createElement("canvas"), ctx = c.getContext("2d"), W = qr.width;
  c.width = W; c.height = W + 150;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(qr, 0, 0);
  ctx.fillStyle = "#0f1b2d"; ctx.textAlign = "center";
  ctx.font = "600 40px Poppins, system-ui, sans-serif";
  let t = compartido.titulo; while(ctx.measureText(t).width > W - 60 && t.length > 4) t = t.slice(0, -2);
  ctx.fillText(t === compartido.titulo ? t : t + "…", W/2, W + 40);
  ctx.fillStyle = "#5b687a"; ctx.font = "500 28px Poppins, system-ui, sans-serif";
  ctx.fillText("Aula de Matemáticas Manipulativas", W/2, W + 95);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = "QR-" + norm(compartido.titulo).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
  document.body.appendChild(a); a.click(); a.remove();
};
$("lCompartir").onclick = ()=>{
  if(!L.m) return;
  const v = visibles(L.pag);
  abrirCompartir(L.m.titulo + (L.n>1 ? " · página "+v[0] : ""), "#/leer/"+encodeURIComponent(L.m.archivo)+"/"+v[0]);
};

/* ---------------------------------------------------------------------
   ROTULADOR (lector y proyección). Lo dibujado se guarda mientras el
   material está abierto, en coordenadas relativas a la página: se
   mantiene al hacer zoom, girar la pantalla o pasar de página y volver.
   --------------------------------------------------------------------- */
const ANOT = {}, HISTORIAL = [];
const ROTU = {on:false, color:"#e3261f", grueso:false};
const rotulando = () => ROTU.on;
const claveAnot = pag => L.m.archivo + "|" + pag;
const esSubrayador = c => c.startsWith("rgba");

function alternarRotulador(si){
  si = si===undefined ? !ROTU.on : !!si;
  if(si && !L.doc) return;
  ROTU.on = si;
  $("lector").classList.toggle("rotulando", si);
  $("rotuBarra").hidden = !si;
  ["lRotu","pRotu"].forEach(id=> $(id).setAttribute("aria-pressed", si));
}
function dibujarTrazos(canvas){
  const ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H); ctx.lineCap = "round"; ctx.lineJoin = "round";
  (ANOT[canvas.dataset.clave] || []).forEach(t=>{
    ctx.strokeStyle = t.color; ctx.lineWidth = t.g * W;
    ctx.beginPath();
    t.pts.forEach(([x,y], i)=> i ? ctx.lineTo(x*W, y*H) : ctx.moveTo(x*W, y*H));
    if(t.pts.length===1) ctx.lineTo(t.pts[0][0]*W + .01, t.pts[0][1]*H);   // un punto
    ctx.stroke();
  });
}
function prepararAnotaciones(nums){
  if(!L.m) return;
  document.querySelectorAll("#paginas .hoja").forEach((hoja, i)=>{
    const base = hoja.querySelector("canvas"), c = document.createElement("canvas"), dpr = window.devicePixelRatio || 1;
    c.className = "anot"; c.dataset.clave = claveAnot(nums[i]);
    c.width = Math.round(parseFloat(base.style.width) * dpr); c.height = Math.round(parseFloat(base.style.height) * dpr);
    c.setAttribute("aria-hidden", "true");
    hoja.appendChild(c); dibujarTrazos(c);
    let actual = null;
    const punto = e=>{ const r = c.getBoundingClientRect(); return [(e.clientX - r.left)/r.width, (e.clientY - r.top)/r.height]; };
    c.addEventListener("pointerdown", e=>{
      if(!ROTU.on || (e.pointerType==="mouse" && e.button!==0)) return;
      e.preventDefault(); c.setPointerCapture(e.pointerId);
      const sub = esSubrayador(ROTU.color);
      actual = {color: ROTU.color, g: sub ? (ROTU.grueso ? .035 : .022) : (ROTU.grueso ? .009 : .0045), pts:[punto(e)]};
      (ANOT[c.dataset.clave] ||= []).push(actual); HISTORIAL.push(c.dataset.clave);
      dibujarTrazos(c);
    });
    c.addEventListener("pointermove", e=>{ if(!actual) return; actual.pts.push(punto(e)); dibujarTrazos(c); });
    const fin = ()=>{ actual = null; };
    c.addEventListener("pointerup", fin); c.addEventListener("pointercancel", fin);
  });
}
function redibujarVisibles(){ document.querySelectorAll("#paginas canvas.anot").forEach(dibujarTrazos); }
function olvidarAnotaciones(){
  Object.keys(ANOT).forEach(k=> delete ANOT[k]); HISTORIAL.length = 0;
  alternarRotulador(false);
}
$("lRotu").onclick = ()=> alternarRotulador();
$("pRotu").onclick = ()=> alternarRotulador();
$("rotuCerrar").onclick = ()=> alternarRotulador(false);
document.querySelectorAll(".rotu-color").forEach(b=> b.onclick = ()=>{
  ROTU.color = b.dataset.color;
  document.querySelectorAll(".rotu-color").forEach(x=> x.setAttribute("aria-pressed", x===b));
});
$("rotuGrosor").onclick = ()=>{
  ROTU.grueso = !ROTU.grueso;
  $("rotuGrosor").classList.toggle("grueso", ROTU.grueso);
  $("rotuGrosor").setAttribute("aria-label", ROTU.grueso ? "Trazo grueso" : "Trazo fino");
};
$("rotuDeshacer").onclick = ()=>{
  const k = HISTORIAL.pop(); if(!k) return;
  ANOT[k]?.pop(); redibujarVisibles();
};
$("rotuBorrar").onclick = ()=>{
  if(!L.m) return;
  visibles(L.pag).forEach(p=>{ const k = claveAnot(p); delete ANOT[k]; for(let i=HISTORIAL.length-1; i>=0; i--) if(HISTORIAL[i]===k) HISTORIAL.splice(i,1); });
  redibujarVisibles();
};
pintarIconos($("rotuBarra"));
