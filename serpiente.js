/* =====================================================================
   LA SERPIENTE DE NÚMEROS (#/serpiente)
   Juego de la serpiente para trabajar las series numéricas: la serpiente lleva escrita la serie (2, 4, 6…) y
   tiene que comerse el número que va después (8), sin equivocarse con los otros (7, 9, 10…). Con cada número
   bueno crece un trozo; cuando la serie llega a 10 números, la serpiente está completa.
   - Niveles: de 1 en 1, de 2 en 2, de 5 en 5, de 10 en 10, de 3 en 3, de 100 en 100 y hacia atrás.
   - Velocidad: «Paso a paso» (se mueve una casilla con cada flecha: para la pizarra digital), despacio o normal.
     Si choca con una pared o con su cuerpo no pasa nada: se para y se elige otra dirección.
   - Se maneja con las flechas del teclado, con los botones de flecha, deslizando el dedo o tocando el tablero.
   - «Decir el salto»: muestra la regla (de 2 en 2) y explica el fallo (6 + 2 = 8).
   - Ficha en papel: 6 serpientes para completar y descubrir la regla, con hoja de soluciones.
   Usa las utilidades de index.html, herramientas.js y secciones.js ($, leer, guardar, azar, pintarIconos,
   pantallaCompleta, hojaPapel, lanzarImpresion…).
   ===================================================================== */

const SP = Object.assign({nivel:"n2", velocidad:"paso", salto:true}, leer("aula-serpiente", {}),
  {cuerpo:null, dir:{x:1, y:0}, comida:[], serie:[], fallos:0, fase:"jugar", mensaje:"", tono:"", andando:false, reloj:null, partida:0});
let serpienteLista = false;
const guardarSP = () => guardar("aula-serpiente", {nivel:SP.nivel, velocidad:SP.velocidad, salto:SP.salto});
const COLS_SP = 12, FILAS_SP = 8, LARGO_SP = 10;
const NIVELES_SP = {
  n1: {txt:"De 1 en 1 (hasta 20)", paso:1, ini:()=> azar(0, 10)},
  n2: {txt:"De 2 en 2", paso:2, ini:()=> azar(0, 10)},
  n3: {txt:"De 5 en 5", paso:5, ini:()=> 5 * azar(0, 6)},
  n4: {txt:"De 10 en 10", paso:10, ini:()=> azar(0, 30)},
  n5: {txt:"De 3 en 3", paso:3, ini:()=> azar(0, 9)},
  n6: {txt:"Hacia atrás de 1 en 1", paso:-1, ini:()=> azar(12, 30)},
  n7: {txt:"Hacia atrás de 2 en 2", paso:-2, ini:()=> azar(20, 40)},
  n8: {txt:"Hacia atrás de 10 en 10", paso:-10, ini:()=> azar(90, 99)},
  n9: {txt:"De 100 en 100", paso:100, ini:()=> 100 * azar(0, 2) + (azar(0, 1) ? 0 : 10 * azar(1, 9))}};
const VELOCIDADES_SP = {paso:{txt:"Paso a paso", ms:0}, despacio:{txt:"Despacio", ms:850}, normal:{txt:"Normal", ms:520}};
const DIRS_SP = {arriba:{x:0, y:-1}, abajo:{x:0, y:1}, izquierda:{x:-1, y:0}, derecha:{x:1, y:0}};
const nivelSP = () => NIVELES_SP[SP.nivel] || NIVELES_SP.n2;
const reglaSP = (p = nivelSP().paso) => (p < 0 ? "hacia atrás " : "")+"de "+Math.abs(p)+" en "+Math.abs(p);
const cuentaSP = (a, p) => p > 0 ? a+" + "+p+" = "+(a + p) : a+" − "+(-p)+" = "+(a + p);
const siguienteSP = () => SP.serie[SP.cuerpo.length - 1] + nivelSP().paso;   // el número que tiene que comerse
const cabezaSP = () => SP.cuerpo[0];

/* La serie entera de una partida: LARGO_SP números con el salto del nivel (sin bajar de 0) */
function serieSP(n = nivelSP()){
  const a = n.ini();
  return Array.from({length:LARGO_SP}, (_, i)=> a + i * n.paso);
}
/* Los números trampa: el de al lado (7 o 9 en lugar de 8), saltarse uno (10), darse la vuelta… */
function trampasSP(t, p, cuantas){
  const s = Math.abs(p), ya = SP.serie.slice(0, SP.cuerpo?.length || 0);
  const vale = (x, l) => x >= 0 && x !== t && !ya.includes(x) && !l.includes(x);
  const c = [t + 1, t - 1, t + p, t + 2 * p, t + 2, t - 2];
  if(s >= 10) c.push(t + s / 10, t - s / 10);
  const elegidas = [];
  c.forEach(x=>{ if(vale(x, elegidas)) elegidas.push(x); });
  for(let i = elegidas.length - 1; i > 0; i--){ const j = azar(0, i); [elegidas[i], elegidas[j]] = [elegidas[j], elegidas[i]]; }
  for(const x of [t + 3, t - 3, t + 4, t - 4, t + 5]) if(elegidas.length < cuantas && vale(x, elegidas)) elegidas.push(x);   // por si faltan
  return elegidas.slice(0, cuantas);
}

function nuevaSerpienteSP(){
  pararSP(); SP.partida++;
  SP.serie = serieSP();
  const y = Math.floor(FILAS_SP / 2);
  SP.cuerpo = [{x:3, y, n:SP.serie[2]}, {x:2, y, n:SP.serie[1]}, {x:1, y, n:SP.serie[0]}];   // la cabeza lleva el último número
  Object.assign(SP, {dir:{x:1, y:0}, fallos:0, fase:"jugar", tono:"", andando:false,
    mensaje: SP.velocidad === "paso" ? "Mueve la serpiente con las flechas hasta el número que va después." : "Pulsa una flecha para que la serpiente empiece a moverse."});
  ponerComidaSP();
  pintarSerpiente();
}
/* Pone el número bueno y las trampas en casillas libres, lejos de la cabeza */
function ponerComidaSP(){
  const t = siguienteSP(), cab = cabezaSP();
  const libres = [];
  for(let y=0; y<FILAS_SP; y++) for(let x=0; x<COLS_SP; x++)
    if(!SP.cuerpo.some(s=> s.x === x && s.y === y) && Math.abs(x - cab.x) + Math.abs(y - cab.y) >= 3) libres.push({x, y});
  const cuantas = SP.nivel === "n1" ? 2 : 3, numeros = [t, ...trampasSP(t, nivelSP().paso, cuantas)];
  SP.comida = [];
  for(const n of numeros){
    if(!libres.length) break;
    // que no queden pegados unos a otros
    const lejos = libres.filter(l=> SP.comida.every(c=> Math.abs(c.x - l.x) + Math.abs(c.y - l.y) >= 2));
    const lista = lejos.length ? lejos : libres, k = azar(0, lista.length - 1), sitio = lista[k];
    libres.splice(libres.indexOf(sitio), 1);
    SP.comida.push({x:sitio.x, y:sitio.y, n, ok:n === t});
  }
}

/* Un paso de la serpiente en la dirección d (o en la que lleva) */
function pasoSP(d){
  if(SP.fase !== "jugar") return false;
  if(d) SP.dir = d;
  const cab = cabezaSP(), x = cab.x + SP.dir.x, y = cab.y + SP.dir.y;
  const comida = SP.comida.find(c=> c.x === x && c.y === y);
  const choca = x < 0 || y < 0 || x >= COLS_SP || y >= FILAS_SP ? "una pared"
    : SP.cuerpo.slice(0, comida?.ok ? SP.cuerpo.length : -1).some(s=> s.x === x && s.y === y) ? "su propio cuerpo" : "";
  if(choca){
    pararSP();
    SP.mensaje = "¡Uy! Ahí está "+choca+". Elige otro camino."; SP.tono = "aviso";
    actualizarSP(); return false;
  }
  if(comida && comida.ok){
    const antes = SP.cuerpo[0].n;
    SP.cuerpo.unshift({x, y, n:comida.n});   // crece: la cabeza nueva lleva el número que se ha comido
    SP.tono = "bien";
    if(SP.cuerpo.length >= LARGO_SP){
      SP.fase = "fin"; pararSP();
      SP.mensaje = "¡Serpiente completa! "+SP.serie.join(", ")+".";
      SP.comida = [];
      pintarSerpiente(); $("spOtra")?.focus(); return true;
    }
    SP.mensaje = "¡Muy bien! "+(SP.salto ? cuentaSP(antes, nivelSP().paso)+"." : "Después del "+antes+" va el "+comida.n+".");
    ponerComidaSP();
  }else{
    for(let i = SP.cuerpo.length - 1; i > 0; i--){ SP.cuerpo[i].x = SP.cuerpo[i - 1].x; SP.cuerpo[i].y = SP.cuerpo[i - 1].y; }
    SP.cuerpo[0].x = x; SP.cuerpo[0].y = y;
    if(comida){
      SP.comida.splice(SP.comida.indexOf(comida), 1); SP.fallos++; SP.tono = "mal";
      const a = SP.cuerpo[0].n;
      SP.mensaje = "¡Puaj! El "+comida.n+" no va después del "+a+". "+(SP.salto ? "Vamos "+reglaSP()+": "+cuentaSP(a, nivelSP().paso)+"." : "Busca otro número.");
    }else SP.tono = "";
  }
  actualizarSP();
  return true;
}
/* Mover: paso a paso, un paso por flecha; con velocidad, la flecha cambia el rumbo y la serpiente anda sola */
function moverSP(nombre){
  const d = DIRS_SP[nombre];
  if(!d || SP.fase !== "jugar") return;
  if(SP.cuerpo.length > 1 && d.x === -SP.dir.x && d.y === -SP.dir.y && SP.andando) return;   // no se da la vuelta sobre sí misma
  if(SP.tono === "aviso") SP.tono = "";
  if(SP.velocidad === "paso") pasoSP(d);
  else{ SP.dir = d; if(!SP.andando) andarSP(); else actualizarSP(); }
}
function andarSP(){
  const ms = VELOCIDADES_SP[SP.velocidad]?.ms;
  if(!ms || SP.fase !== "jugar") return;
  SP.andando = true; clearTimeout(SP.reloj);
  const partida = SP.partida;
  const tic = ()=>{
    if(partida !== SP.partida || !SP.andando) return;
    if(vistaAbierta !== "serpiente" || document.hidden){ pararSP(); return; }
    if(pasoSP()) SP.reloj = setTimeout(tic, ms);
  };
  SP.reloj = setTimeout(tic, ms);
  actualizarSP();
}
function pararSP(){ clearTimeout(SP.reloj); SP.reloj = null; SP.andando = false; }
function pausaSP(){
  if(SP.fase !== "jugar" || SP.velocidad === "paso") return;
  if(SP.andando){ pararSP(); SP.mensaje = "En pausa. Pulsa una flecha o «Seguir»."; actualizarSP(); }
  else andarSP();
}

/* ---------- Vista ---------- */
function iniciarSerpiente(){
  if(!serpienteLista){
    serpienteLista = true;
    pintarIconos($("vSerpiente"));
    $("spNivel").innerHTML = Object.entries(NIVELES_SP).map(([k, v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("spVelocidad").innerHTML = Object.entries(VELOCIDADES_SP).map(([k, v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("spNivel").onchange = e=>{ SP.nivel = e.target.value; guardarSP(); nuevaSerpienteSP(); };
    $("spVelocidad").onchange = e=>{ SP.velocidad = e.target.value; guardarSP(); pararSP(); nuevaSerpienteSP(); };
    $("spSalto").onclick = ()=>{ SP.salto = !SP.salto; guardarSP(); actualizarSP(); };
    tactilSP($("spCuerpo"));
    $("spImprimir").onclick = imprimirSerpiente;
    if(document.fullscreenEnabled) $("spPantalla").onclick = ()=> pantallaCompleta("vSerpiente"); else $("spPantalla").hidden = true;
    document.addEventListener("visibilitychange", ()=>{ if(document.hidden && SP.andando){ pararSP(); SP.mensaje = "En pausa."; } });
  }
  if(!SP.cuerpo) nuevaSerpienteSP(); else pintarSerpiente();
}
/* Dónde está un número respecto a la cabeza, para quien no ve el tablero */
function dondeSP(c){
  const cab = cabezaSP(), dx = c.x - cab.x, dy = c.y - cab.y, p = [];
  if(dx) p.push(Math.abs(dx)+" a la "+(dx > 0 ? "derecha" : "izquierda"));
  if(dy) p.push(Math.abs(dy)+(dy > 0 ? " abajo" : " arriba"));
  return "el "+c.n+": "+p.join(" y ");
}
/* El esqueleto de la vista (se pinta al empezar y al terminar); lo que cambia en cada paso va en actualizarSP */
function pintarSerpiente(){
  const c = $("spCuerpo"); if(!c) return;
  $("spNivel").value = SP.nivel; $("spVelocidad").value = SP.velocidad;
  const fin = SP.fase === "fin";
  const flecha = (nombre, d)=> '<button class="ibtn sp-'+nombre+'" data-dir="'+nombre+'" aria-label="'+nombre[0].toUpperCase()+nombre.slice(1)+'"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg></button>';
  let h = '<div class="sp-tablero'+(fin ? " fin" : "")+'" id="spTablero" role="img" style="--cols:'+COLS_SP+';--filas:'+FILAS_SP+'"></div>';
  h += '<aside class="sp-mandos"><p class="sp-regla" id="spRegla"></p><p class="sp-tira" id="spTira"></p><p class="sp-msg" id="spMsg" role="status"></p>';
  if(fin){
    h += '<p class="sp-fin">🐍 ¡Serpiente completa!</p><p class="sp-ayuda">'+(SP.fallos ? SP.fallos+(SP.fallos === 1 ? " número equivocado" : " números equivocados")+" por el camino." : "¡Sin comerse ningún número equivocado!")+'</p>'+
      '<div class="pt-acciones"><button class="bt azul" id="spOtra">Otra serpiente</button></div>';
  }else{
    h += '<p class="sp-cuenta" id="spCuenta"></p>';
    h += '<div class="sp-cruz" role="group" aria-label="Mover la serpiente">'+flecha("arriba", "M12 4l-7 8h4.5v7h5v-7H19z")+flecha("izquierda", "M4 12l8-7v4.5h7v5h-7V19z")+
      flecha("derecha", "M20 12l-8-7v4.5H5v5h7V19z")+flecha("abajo", "M12 20l-7-8h4.5V5h5v7H19z")+'</div>';
    h += '<div class="sp-botones">'+(SP.velocidad !== "paso" ? '<button class="bt" id="spPausa"></button>' : '')+'<button class="bt" id="spNueva">Empezar otra</button></div>';
  }
  h += '</aside>';
  c.innerHTML = h;
  c.querySelectorAll(".sp-cruz button").forEach(b=> b.onclick = ()=> moverSP(b.dataset.dir));
  $("spPausa")?.addEventListener("click", pausaSP);
  $("spNueva")?.addEventListener("click", nuevaSerpienteSP);
  $("spOtra")?.addEventListener("click", nuevaSerpienteSP);
  actualizarSP();
}
function actualizarSP(){
  const t = $("spTablero"); if(!t) return;
  $("spSalto").setAttribute("aria-pressed", SP.salto);
  const cab = cabezaSP(), fin = SP.fase === "fin", p = nivelSP().paso, dir = SP.dir.x > 0 ? "d" : SP.dir.x < 0 ? "i" : SP.dir.y < 0 ? "ar" : "ab";
  let celdas = "";
  for(let y=0; y<FILAS_SP; y++) for(let x=0; x<COLS_SP; x++){
    const k = SP.cuerpo.findIndex(s=> s.x === x && s.y === y), f = SP.comida.find(s=> s.x === x && s.y === y);
    if(k === 0) celdas += '<i class="sp-c sp-cabeza sp-'+dir+(SP.tono === "bien" ? " come" : SP.tono === "mal" ? " puaj" : "")+'"><b>'+cab.n+'</b><span class="sp-ojos"></span></i>';
    else if(k > 0) celdas += '<i class="sp-c sp-trozo'+(k % 2 ? " par" : "")+(k === SP.cuerpo.length - 1 ? " cola" : "")+'"><b>'+SP.cuerpo[k].n+'</b></i>';
    else if(f) celdas += '<i class="sp-c sp-comida"><b>'+f.n+'</b></i>';
    else celdas += '<i class="sp-c"></i>';
  }
  t.innerHTML = celdas;
  t.setAttribute("aria-label", "Tablero de "+COLS_SP+" por "+FILAS_SP+". La serpiente mide "+SP.cuerpo.length+" y su cabeza lleva el "+cab.n+
    (SP.comida.length ? ". Números para comer: "+SP.comida.map(dondeSP).join("; ")+"." : "."));
  const salto = '<span class="sp-flecha" aria-hidden="true">'+(SP.salto ? (p > 0 ? "+" : "−")+Math.abs(p) : "→")+'</span>';
  const lista = SP.cuerpo.slice().reverse().map(s=> s.n);
  $("spRegla").innerHTML = SP.salto ? 'La serie va <b>'+reglaSP()+'</b>' : '¿Cómo va la serie?';
  $("spTira").innerHTML = lista.map((n, i)=> (i ? salto : "")+'<b>'+n+'</b>').join("")+(fin ? "" : salto+'<b class="sp-falta">?</b>');
  $("spTira").setAttribute("aria-label", "La serie: "+lista.join(", ")+(fin ? "" : " y falta uno"));
  $("spMsg").className = "sp-msg "+SP.tono; $("spMsg").textContent = SP.mensaje;
  if($("spCuenta")) $("spCuenta").innerHTML = 'Lleva <b>'+SP.cuerpo.length+'</b> de '+LARGO_SP+' números';
  if($("spPausa")) $("spPausa").textContent = SP.andando ? "⏸ Pausa" : "▶ Seguir";
}
/* Deslizar el dedo para girar; tocar una casilla lleva la cabeza hacia ella (los oyentes van en el contenedor, que no se repinta) */
function tactilSP(c){
  let ini = null;
  c.addEventListener("pointerdown", e=>{ ini = e.target.closest(".sp-tablero") ? {x:e.clientX, y:e.clientY} : null; });
  c.addEventListener("pointerup", e=>{
    const t = $("spTablero");
    if(!ini || !t || SP.fase !== "jugar") return;
    const dx = e.clientX - ini.x, dy = e.clientY - ini.y; ini = null;
    if(Math.max(Math.abs(dx), Math.abs(dy)) > 30){ moverSP(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "derecha" : "izquierda") : (dy > 0 ? "abajo" : "arriba")); return; }
    const r = t.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * COLS_SP), y = Math.floor((e.clientY - r.top) / r.height * FILAS_SP);
    const cab = cabezaSP(), ex = x - cab.x, ey = y - cab.y;
    if(!ex && !ey) return;
    moverSP(Math.abs(ex) >= Math.abs(ey) ? (ex > 0 ? "derecha" : "izquierda") : (ey > 0 ? "abajo" : "arriba"));
  });
}
function tecladoSerpiente(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const d = {ArrowUp:"arriba", ArrowDown:"abajo", ArrowLeft:"izquierda", ArrowRight:"derecha"}[e.key];
  if(d){
    e.preventDefault(); moverSP(d);
  }else if((e.key === " " || e.key.toLowerCase() === "p") && e.target.tagName !== "BUTTON" && SP.velocidad !== "paso"){ e.preventDefault(); pausaSP(); }
}

/* ---------- Ficha en papel: 6 serpientes para completar (y la hoja de soluciones) ---------- */
const CABEZA_SP = '<svg viewBox="0 0 40 30" aria-hidden="true"><path d="M2 15C2 6 10 2 20 2c9 0 16 5 16 13s-7 13-16 13C10 28 2 24 2 15z" fill="#fff" stroke="#1c2330" stroke-width="1.6"/>'+
  '<circle cx="24" cy="9.5" r="3" fill="#1c2330"/><circle cx="25" cy="8.7" r="1" fill="#fff"/><path d="M36 15h3.5m-1.5 0l2-2.5m-2 2.5l2 2.5" stroke="#c62828" stroke-width="1.4" fill="none" stroke-linecap="round"/>'+
  '<path d="M18 19c3 2.5 8 2.5 11 0" stroke="#1c2330" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>';
function imprimirSerpiente(){
  const n = nivelSP();
  const serpientes = Array.from({length:6}, ()=>{
    const serie = serieSP(n), dadas = new Set([0, 1]);
    // números que se dan: los dos primeros y algunos más (a veces solo al final, para contar hacia atrás desde ahí)
    const extra = n.paso === 1 || n.paso === 2 ? 3 : 2;
    while(dadas.size < 2 + extra) dadas.add(azar(3, LARGO_SP - 1));
    return {serie, dadas};
  });
  const hoja = docente => '<div class="hj-sps">'+serpientes.map((s, i)=>
    '<div class="hj-sp"><span class="hj-n">'+(i + 1)+'</span><div class="hj-sp-cuerpo">'+s.serie.map((v, k)=>
      '<span class="hj-sp-t'+(s.dadas.has(k) ? " dada" : docente ? " llena" : "")+'">'+(s.dadas.has(k) || docente ? v : "")+'</span>').join("")+
      '<span class="hj-sp-cab">'+CABEZA_SP+'</span></div>'+
    '<p class="hj-sp-regla">La serie va '+(docente ? '<b>'+reglaSP(n.paso)+'</b>' : '<span class="hj-caja ancha"></span> de <span class="hj-caja"></span> en <span class="hj-caja"></span> <small>(hacia delante o hacia atrás)</small>')+'</p></div>').join("")+'</div>';
  const instr = '<p>🐍 Cada serpiente lleva una <b>serie</b>: los números van saltando siempre lo mismo. Mira los que hay, descubre el salto y '+
    '<b>escribe los que faltan</b> en los trozos vacíos. Después escribe la regla de la serie.</p>';
  $("impresion").innerHTML =
    hojaPapel({titulo:"La serpiente de números", sub:"Descubre el salto y completa cada serie", eti:"Series numéricas", pagina:1, paginas:2,
      datos:[["Nombre", "", 3], ["Fecha", "", 1]], instrucciones:instr, cuerpo:hoja(false)})+
    hojaPapel({titulo:"La serpiente de números · Soluciones", sub:"Series · "+n.txt, eti:"Para el docente", pagina:2, paginas:2, docente:true,
      instrucciones:'<p>En azul, los números que tenían que escribir.</p>', cuerpo:hoja(true)});
  lanzarImpresion();
}
