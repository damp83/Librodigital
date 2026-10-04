/* =====================================================================
   PIRÁMIDES NUMÉRICAS (#/piramides)
   Cada bloque es la suma de los dos que tiene debajo (el todo y sus dos partes).
   - Niveles: Fácil (está la base: solo sumar), Medio (faltan bloques abajo: sumar y restar),
     Difícil (casi todo está arriba: hay que bajar restando).
   - 3, 4 o 5 pisos; números hasta 10, 20 o 100.
   - Ayudas: pista paso a paso, regletas dentro de los bloques, «partes y todo» (al elegir un bloque
     se marcan sus dos partes) y corrección al momento. También se puede ver la solución.
   Toda pirámide que se propone se puede resolver paso a paso, sumando o restando.
   Usa las utilidades de index.html y herramientas.js ($, leer, guardar, svg, pintarIconos, azar, REGLETA…).
   ===================================================================== */

const PI = Object.assign({pisos:4, hasta:20, nivel:"facil", regletas:false, partes:true, alMomento:true}, leer("aula-piramides", {}),
  {v:null, dada:null, resp:null, sel:null, pista:null, solucion:false, comprobada:false, hechas:0});
let piramidesListo = false;
const guardarPI = () => guardar("aula-piramides", {pisos:PI.pisos, hasta:PI.hasta, nivel:PI.nivel, regletas:PI.regletas, partes:PI.partes, alMomento:PI.alMomento});

function iniciarPiramides(){
  if(!piramidesListo){
    piramidesListo = true;
    pintarIconos($("vPiramides"));
    document.querySelectorAll("#vPiramides .segmentos button").forEach(b=> b.onclick = ()=>{ PI.nivel = b.dataset.nivel; guardarPI(); nuevaPiramide(); });
    $("piPisos").onchange = e=>{ PI.pisos = +e.target.value; guardarPI(); nuevaPiramide(); };
    $("piHasta").onchange = e=>{ PI.hasta = +e.target.value; guardarPI(); nuevaPiramide(); };
    $("piRegletas").onclick = ()=>{ PI.regletas = !PI.regletas; guardarPI(); pintarPiramide(); };
    $("piPartes").onclick = ()=>{ PI.partes = !PI.partes; guardarPI(); pintarPiramide(); };
    $("piMomento").onclick = ()=>{ PI.alMomento = !PI.alMomento; guardarPI(); pintarPiramide(); };
    $("piTeclado").innerHTML = ["1","2","3","4","5","6","7","8","9","⌫","0","→"].map(t=>
      '<button class="pi-tecla'+(/\d/.test(t) ? "" : " otra")+'" data-t="'+t+'" aria-label="'+({"⌫":"Borrar", "→":"Siguiente bloque"}[t] || t)+'">'+t+'</button>').join("");
    $("piTeclado").querySelectorAll("button").forEach(b=> b.onclick = ()=> teclaPiramide(b.dataset.t));
    $("piPista").onclick = pedirPista;
    $("piComprobar").onclick = ()=>{ PI.comprobada = true; PI.pista = null; pintarPiramide(); };
    $("piSolucion").onclick = ()=>{ PI.solucion = !PI.solucion; PI.pista = null; $("piSolucion").textContent = PI.solucion ? "Ocultar la solución" : "Ver la solución"; pintarPiramide(); };
    $("piNueva").onclick = ()=>{ $("piSolucion").textContent = "Ver la solución"; nuevaPiramide(); };
    if(document.fullscreenEnabled) $("piPantalla").onclick = ()=> pantallaCompleta("vPiramides"); else $("piPantalla").hidden = true;
  }
  if(!PI.v) nuevaPiramide(); else pintarPiramide();
}

/* ---------- Generar una pirámide que se pueda resolver ---------- */
const hijos = (r, i) => [[r+1, i], [r+1, i+1]];
function construir(base){   // de la base hacia arriba; v[0] es la cúspide
  const v = [base.slice()];
  while(v[0].length > 1){ const f = v[0]; v.unshift(f.slice(1).map((x,i)=> f[i] + x)); }
  return v;
}
/* Resuelve con lo que se sabe, paso a paso: un bloque = suma de sus dos partes; una parte = el todo − la otra parte.
   Devuelve cuántos pasos de cada tipo hacen falta, o null si se queda atascada. */
function resolverPasos(n, sabe){
  const k = sabe.map(f=> f.slice()); let sumas = 0, restas = 0, cambio = true;
  while(cambio){
    cambio = false;
    for(let r=0; r<n-1; r++) for(let i=0; i<=r; i++){
      const [a, b] = hijos(r, i);
      if(!k[r][i] && k[a[0]][a[1]] && k[b[0]][b[1]]){ k[r][i] = true; sumas++; cambio = true; }
      if(k[r][i] && k[a[0]][a[1]] && !k[b[0]][b[1]]){ k[b[0]][b[1]] = true; restas++; cambio = true; }
      if(k[r][i] && !k[a[0]][a[1]] && k[b[0]][b[1]]){ k[a[0]][a[1]] = true; restas++; cambio = true; }
    }
  }
  return k.every(f=> f.every(Boolean)) ? {sumas, restas} : null;
}
function nuevaPiramide(){
  const n = PI.pisos;
  let v = null;
  for(let t=0; t<400 && !v; t++){
    const minimo = t < 300 ? 1 : 0;   // si con unos no cabe (5 pisos hasta 10), se admiten ceros
    const base = Array.from({length:n}, ()=> azar(minimo, Math.max(minimo, Math.round(PI.hasta / (2 ** (n-1)) * 1.6))));
    const p = construir(base);
    if(p[0][0] <= PI.hasta && p[0][0] >= Math.min(PI.hasta, n * 2)) v = p;
  }
  if(!v) v = construir(Array(n).fill(0));
  // qué bloques se ven según el nivel
  let dada = null;
  const todas = []; v.forEach((f,r)=> f.forEach((_,i)=> todas.push([r,i])));
  for(let t=0; t<600 && !dada; t++){
    const d = v.map(f=> f.map(()=> false));
    if(PI.nivel==="facil"){ d[n-1].fill(true); dada = d; break; }
    const elegidas = todas.slice().sort(()=> Math.random() - .5).slice(0, n);
    elegidas.forEach(([r,i])=> d[r][i] = true);
    const enBase = d[n-1].filter(Boolean).length, pasos = resolverPasos(n, d);
    if(!pasos) continue;
    if(PI.nivel==="medio" && enBase >= 1 && enBase < n && pasos.restas >= 1 && pasos.sumas >= 1) dada = d;
    if(PI.nivel==="dificil" && enBase <= 1 && d[0][0] && pasos.restas >= n) dada = d;
  }
  if(!dada){ dada = v.map(f=> f.map(()=> false)); dada[n-1].fill(true); }
  Object.assign(PI, {v, dada, resp:v.map(f=> f.map(()=> "")), sel:null, pista:null, solucion:false, comprobada:false});
  PI.sel = siguienteHueco(-1);
  pintarPiramide();
}

/* ---------- Estado de cada bloque ---------- */
const huecos = () => { const h = []; PI.v.forEach((f,r)=> f.forEach((_,i)=>{ if(!PI.dada[r][i]) h.push([r,i]); })); return h; };
function siguienteHueco(desde){   // el siguiente bloque vacío (en orden de abajo arriba, que es como se resuelve)
  const h = huecos().sort((a,b)=> b[0]-a[0] || a[1]-b[1]);
  const vacios = h.filter(([r,i])=> PI.resp[r][i]==="");
  const lista = vacios.length ? vacios : h;
  if(!lista.length) return null;
  const pos = desde<0 ? -1 : lista.findIndex(([r,i])=> PI.sel && r===PI.sel[0] && i===PI.sel[1]);
  return lista[(pos + 1) % lista.length];
}
const conocido = (r, i) => PI.dada[r][i] || (PI.resp[r][i]!=="" && +PI.resp[r][i]===PI.v[r][i]);
function buscarPista(){   // un bloque que ya se puede calcular con lo que hay
  const n = PI.pisos;
  for(let r=n-2; r>=0; r--) for(let i=0; i<=r; i++){
    const [a, b] = hijos(r, i);
    const ka = conocido(...a), kb = conocido(...b), kt = conocido(r, i);
    if(!kt && ka && kb) return {bloque:[r,i], usa:[a,b], txt:PI.v[a[0]][a[1]]+" + "+PI.v[b[0]][b[1]]+" = ?", tipo:"Este bloque es el todo: suma sus dos partes."};
    if(kt && ka && !kb) return {bloque:b, usa:[[r,i],a], txt:PI.v[r][i]+" − "+PI.v[a[0]][a[1]]+" = ?", tipo:"Este bloque es una parte: al todo le quitas la otra parte."};
    if(kt && !ka && kb) return {bloque:a, usa:[[r,i],b], txt:PI.v[r][i]+" − "+PI.v[b[0]][b[1]]+" = ?", tipo:"Este bloque es una parte: al todo le quitas la otra parte."};
  }
  return null;
}

/* Tres bloques escritos que no cuadran (el de arriba no es la suma de los dos de abajo), para explicar el fallo */
function choque(){
  const n = PI.pisos, val = (r, i) => PI.dada[r][i] ? PI.v[r][i] : PI.resp[r][i]!=="" ? +PI.resp[r][i] : null;
  let primero = null;
  for(let r=0; r<n-1; r++) for(let i=0; i<=r; i++){
    const [a, b] = hijos(r, i), t = val(r, i), x = val(...a), y = val(...b);
    if(t===null || x===null || y===null || t===x+y) continue;
    const c = {bloques:[[r,i], a, b], txt:"Mira los bloques marcados: "+x+" + "+y+" = "+(x+y)+", pero arriba pone "+t+". Alguno de los tres no es el bueno."};
    if(![[r,i], a, b].every(([f,j])=> PI.dada[f][j])) return c;   // mejor uno en el que haya algo escrito por el alumno
    primero = primero || c;
  }
  return primero;
}

/* ---------- Pintar ---------- */
function mini(v){   // regletas dentro del bloque: naranjas por cada diez y la regleta de las unidades
  if(!(v >= 0) || v > 100) return "";
  const d = Math.floor(v / 10), u = v % 10;
  let h = '<span class="pi-regletas" aria-hidden="true">';
  for(let k=0; k<d; k++) h += '<i style="width:calc(var(--r)*10);background:'+REGLETA[10].c+'"></i>';
  if(u) h += '<i style="width:calc(var(--r)*'+u+');background:'+REGLETA[u].c+(u===1 ? ";box-shadow:inset 0 0 0 1px #c8ced6" : "")+'"></i>';
  return h + '</span>';
}
function pintarPiramide(){
  const n = PI.pisos;
  document.querySelectorAll("#vPiramides .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.nivel===PI.nivel));
  $("piPisos").value = PI.pisos; $("piHasta").value = PI.hasta;
  $("piRegletas").setAttribute("aria-pressed", PI.regletas);
  $("piPartes").setAttribute("aria-pressed", PI.partes);
  $("piMomento").setAttribute("aria-pressed", PI.alMomento);
  const sel = PI.sel, marca = new Set();
  if(sel && PI.partes && sel[0] < n-1) hijos(...sel).forEach(([r,i])=> marca.add(r+","+i));
  const pista = PI.pista, usa = new Set((pista ? pista.usa : []).map(x=> x.join(",")));
  const hayMal = PI.v.some((f,r)=> f.some((x,i)=> !PI.dada[r][i] && PI.resp[r][i]!=="" && +PI.resp[r][i]!==x));
  const ch = !pista && !PI.solucion && hayMal && (PI.comprobada || PI.alMomento) ? choque() : null;
  const choca = new Set((ch ? ch.bloques : []).map(x=> x.join(",")));
  const cont = $("piPiramide"); cont.style.setProperty("--n", n);
  let html = "", completa = true, errores = 0;
  for(let r=0; r<n; r++){
    html += '<div class="pi-fila">';
    for(let i=0; i<=r; i++){
      const v = PI.v[r][i], dada = PI.dada[r][i], resp = PI.resp[r][i];
      const correcto = resp!=="" && +resp===v, mal = resp!=="" && !correcto;
      if(!dada && !correcto) completa = false;
      if(mal) errores++;
      const verEstado = PI.alMomento || PI.comprobada;
      let clase = "pi-bloque" + (dada ? " dada" : " hueco");
      if(!dada && resp!=="" && verEstado) clase += correcto ? " bien" : " mal";
      if(!dada && resp==="" && PI.solucion) clase += " solucion";
      if(sel && sel[0]===r && sel[1]===i) clase += " elegido";
      if(marca.has(r+","+i)) clase += " parte";
      if(pista && pista.bloque[0]===r && pista.bloque[1]===i) clase += " pista";
      if(usa.has(r+","+i)) clase += " usa";
      if(choca.has(r+","+i)) clase += " choque";
      const texto = dada ? v : resp!=="" ? resp : PI.solucion ? v : "";
      const conRegletas = PI.regletas && (dada || correcto || (PI.solucion && resp==="")) ? mini(v) : "";
      const etiqueta = dada ? "Bloque "+v : "Bloque vacío"+(resp!=="" ? ", has escrito "+resp+(verEstado ? (correcto ? ", correcto" : ", revísalo") : "") : "");
      html += dada
        ? '<div class="'+clase+'" role="img" aria-label="'+etiqueta+'"><b>'+texto+'</b>'+conRegletas+'</div>'
        : '<button class="'+clase+'" data-r="'+r+'" data-i="'+i+'" aria-label="'+etiqueta+'"'+(sel && sel[0]===r && sel[1]===i ? ' aria-current="true"' : '')+'><b>'+texto+'</b>'+conRegletas+'</button>';
    }
    html += '</div>';
  }
  cont.innerHTML = html;
  cont.querySelectorAll("button.pi-bloque").forEach(b=> b.onclick = ()=>{ PI.sel = [+b.dataset.r, +b.dataset.i]; PI.pista = null; pintarPiramide(); });
  // Mensaje
  let msg;
  if(completa && !PI.solucion){
    msg = "¡Pirámide completa! Cada bloque es la suma de los dos de abajo.";
    if(!PI.contada){ PI.contada = true; PI.hechas++; }
  }else if(pista) msg = pista.tipo+"  "+pista.txt;
  else if(ch) msg = ch.txt;
  else if(PI.comprobada) msg = errores ? (errores===1 ? "Hay un bloque que no encaja con los números que te dan: está marcado en rojo." : "Hay "+errores+" bloques que no encajan con los números que te dan: están marcados en rojo.") : "Todo lo que has escrito está bien. ¡Sigue!";
  else if(PI.solucion) msg = "Esta es la solución. Comprueba que cada bloque es la suma de los dos de abajo.";
  else msg = PI.nivel==="facil" ? "Suma los dos bloques de abajo para saber el de arriba." :
             PI.nivel==="medio" ? "Unos bloques se suman y otros se restan: busca uno que ya puedas calcular." :
             "Empieza por arriba: cada parte es el todo menos la otra parte.";
  if(!completa) PI.contada = false;
  $("piAyuda").textContent = msg;
  $("piAyuda").classList.toggle("ok", completa && !PI.solucion);
  $("piHechas").textContent = PI.hechas ? "★ "+PI.hechas+(PI.hechas===1 ? " pirámide" : " pirámides") : "";
  $("piTeclado").hidden = completa && !PI.solucion;
}

/* ---------- Escribir números ---------- */
function teclaPiramide(t){
  if(!PI.v) return;
  if(t==="→"){ PI.sel = siguienteHueco(0); PI.pista = null; pintarPiramide(); return; }
  if(!PI.sel){ PI.sel = siguienteHueco(-1); if(!PI.sel) return; }
  const [r, i] = PI.sel; let x = PI.resp[r][i];
  if(t==="⌫") x = x.slice(0, -1);
  else if(/\d/.test(t) && x.length < 3) x = (x==="0" ? "" : x) + t;
  PI.resp[r][i] = x; PI.pista = null; PI.comprobada = false;
  // con la corrección al momento, al acertar se pasa solo al siguiente bloque vacío
  if(PI.alMomento && x!=="" && +x===PI.v[r][i]){ const sig = siguienteHueco(0); if(sig && PI.resp[sig[0]][sig[1]]==="") PI.sel = sig; }
  pintarPiramide();
}
function pedirPista(){
  const p = buscarPista();
  if(!p){ PI.pista = null; $("piAyuda").textContent = "Revisa los bloques en rojo: con ellos no se puede seguir."; PI.comprobada = true; pintarPiramide(); return; }
  PI.pista = p; PI.sel = p.bloque; pintarPiramide();
}
function tecladoPiramides(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if(/^[0-9]$/.test(k)){ e.preventDefault(); teclaPiramide(k); }
  else if(k==="Backspace"){ e.preventDefault(); teclaPiramide("⌫"); }
  else if((k==="Enter" || k==="Tab") && !(e.target.tagName==="BUTTON" && !e.target.classList.contains("pi-bloque") && k==="Enter")){
    if(k==="Tab") return;
    e.preventDefault(); teclaPiramide("→");
  }
  else if(k==="?" || k==="p"){ e.preventDefault(); pedirPista(); }
}
