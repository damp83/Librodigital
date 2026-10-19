/* =====================================================================
   EL NÚMERO ESCONDIDO (#/escondido)
   «Dentro de un número viven todos los números más pequeños». Se busca un número escondido dentro de otro
   (el 12 dentro del 37) con los tres pasos del detective de la presentación y la ficha:
     1 · miro el número con sus dieces (naranjas) y sus unos;
     2 · si me falta una pieza, rompo un diez o la regleta de los unos en dos más pequeñas;
     3 · junto las piezas del número escondido y cuento lo que queda suelto.
   Comprobación: el número escondido + lo que queda suelto = el número de partida.
   - Niveles: sin romper nada (a la vista), rompo los unos, rompo un diez y mezcla. Números hasta 50 o hasta 99.
   - Modos: «Con regletas» (fase manipulativa: tocar para juntar, romper piezas), «Cuaderno» (fase simbólica,
     paso a paso) y «¿Bien o mal?» (detective del error: ¿está bien lo que dice?).
   - Ayudas: pista según cómo vaya el caso y ver la solución. Los casos salen del banco (banco.js): no se repiten.
   Usa las utilidades de index.html, herramientas.js, aula.js y aproximar.js ($, leer, guardar, esc, azar, REGLETA, apTeclado…).
   ===================================================================== */

const NE = Object.assign({nivel:"mezcla", modo:"regletas", hasta:50}, leer("aula-escondido", {}),
  {caso:null, piezas:[], romper:false, rompiendo:null, fase:"buscar", escrito:"", aviso:"", pista:"", hechos:0, paso:0, fallos:0, veredicto:null});
let escondidoListo = false, neSig = 1;
const guardarNE = () => guardar("aula-escondido", {nivel:NE.nivel, modo:NE.modo, hasta:NE.hasta});
const NIVELES_NE = {vista:"Sin romper nada", unidad:"Rompo los unos", diez:"Rompo un diez", mezcla:"Mezcla"};
const DETECTIVES = ["Nora", "Hugo", "Lucía", "Leo", "Martina", "Álex", "Sara", "Mateo", "Vega", "Iker"];

/* ---------- Los casos ---------- */
function tipoCaso(n, h){   // qué hay que hacer para encontrar h dentro de n
  const u = n % 10, x = h % 10;
  if(x === 0 || x === u) return "vista";
  return x < u ? "unidad" : "diez";
}
const listasNE = {};
function listaNE(nivel, hasta){
  const clave = nivel+"-"+hasta;
  if(listasNE[clave]) return listasNE[clave];
  const l = [];
  for(let n=11; n<=hasta; n++) for(let h=10; h<n; h++){
    const t = tipoCaso(n, h);
    if(nivel === "mezcla" || nivel === t) l.push({k:n+"-"+h, n, h, t});
  }
  return listasNE[clave] = l;
}
function piezasDe(n){ return [...Array(Math.floor(n/10)).fill(10), ...(n % 10 ? [n % 10] : [])].map(v=> ({id: neSig++, v, z:"mesa"})); }
const sumaZona = z => NE.piezas.filter(p=> p.z === z).reduce((s,p)=> s + p.v, 0);
const queda = c => c.n - c.h;
/* La rotura que hace falta: la de los unos si basta, o la de un diez */
function rotura(c){
  const u = c.n % 10, x = c.h % 10;
  if(c.t === "unidad") return {pieza:u, parte:x, otra:u - x};
  if(c.t === "diez") return {pieza:10, parte:x, otra:10 - x};
  return null;
}

function nuevoCaso(){
  const lista = listaNE(NE.nivel, NE.hasta);
  NE.caso = Object.assign({}, delMazo("ne-"+NE.nivel+"-"+NE.hasta, lista));
  NE.piezas = piezasDe(NE.caso.n);
  Object.assign(NE, {romper:false, rompiendo:null, fase:"buscar", escrito:"", aviso:"", pista:"", paso:0, fallos:0, veredicto:null});
  // detective del error: la mitad de las veces se equivoca (en uno, en un diez o confundiendo lo que queda)
  const c = NE.caso, r = queda(c);
  c.quien = DETECTIVES[azar(0, DETECTIVES.length-1)];
  const alReves = (Math.floor(c.n/10) - Math.floor(c.h/10)) * 10 + Math.abs(c.n % 10 - c.h % 10);   // restar los unos al revés
  const errores = [...new Set([alReves, alReves, r + 1, r - 1, r + 10, r - 10])].filter(x=> x > 0 && x !== r && x < c.n);
  c.dice = Math.random() < .5 || !errores.length ? r : errores[azar(0, errores.length-1)];
  pintarEscondido();
}

/* ---------- Vista ---------- */
function iniciarEscondido(){
  if(!escondidoListo){
    escondidoListo = true;
    pintarIconos($("vEscondido"));
    $("neNivel").innerHTML = Object.entries(NIVELES_NE).map(([k,v])=> '<option value="'+k+'">'+v+'</option>').join("");
    $("neNivel").onchange = e=>{ NE.nivel = e.target.value; guardarNE(); nuevoCaso(); };
    $("neHasta").onchange = e=>{ NE.hasta = +e.target.value; guardarNE(); nuevoCaso(); };
    document.querySelectorAll("#vEscondido .segmentos button").forEach(b=> b.onclick = ()=>{ NE.modo = b.dataset.modo; guardarNE(); nuevoCaso(); });
    apTeclado("neTeclado", teclaNE);
    $("neImprimir").onclick = imprimirEscondido;
    if(document.fullscreenEnabled) $("nePantalla").onclick = ()=> pantallaCompleta("vEscondido"); else $("nePantalla").hidden = true;
  }
  if(!NE.caso) nuevoCaso(); else pintarEscondido();
}

const regletaNE = (v, extra) => '<span class="ne-regleta" style="--v:'+v+';background:'+REGLETA[v].c+';color:'+REGLETA[v].t+'"'+(extra || "")+'>'+v+'</span>';
const sumaTexto = l => l.length ? l.join(" + ") : "0";

function pintarEscondido(){
  const c = NE.caso, cuerpo = $("neCuerpo");
  $("neNivel").value = NE.nivel; $("neHasta").value = NE.hasta;
  document.querySelectorAll("#vEscondido .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === NE.modo));
  $("neHechos").textContent = NE.hechos ? "★ "+NE.hechos+(NE.hechos === 1 ? " caso resuelto" : " casos resueltos") : "";
  let h = '<p class="ne-sello">Expediente '+c.n+'</p>';
  if(NE.modo === "regletas") h += casoRegletas(c);
  else if(NE.modo === "cuaderno") h += casoCuaderno(c);
  else h += casoError(c);
  cuerpo.innerHTML = h;
  const escribiendo = (NE.modo === "regletas" && NE.fase === "queda") || (NE.modo === "cuaderno" && NE.fase !== "hecho" && pasosCuaderno(c)[NE.paso]?.tipo === "num") ||
                      (NE.modo === "error" && NE.veredicto === "mal" && NE.fase !== "hecho");
  $("neTeclado").hidden = !escribiendo;
  enlazarEscondido();
}

/* ----- Con regletas ----- */
function casoRegletas(c){
  const esc = NE.piezas.filter(p=> p.z === "esc"), mesa = NE.piezas.filter(p=> p.z === "mesa"), llevo = sumaZona("esc");
  const pieza = p => '<button class="ne-pieza'+(NE.romper && p.v > 1 ? " rompible" : "")+(NE.rompiendo === p.id ? " elegida" : "")+'" data-id="'+p.id+'" style="--v:'+p.v+';background:'+REGLETA[p.v].c+';color:'+REGLETA[p.v].t+'"'+
    ' aria-label="Regleta '+REGLETA[p.v].n+', vale '+p.v+(NE.romper ? (p.v > 1 ? ". Romperla" : ". No se puede romper") : p.z === "mesa" ? ". Llevarla al número escondido" : ". Devolverla a la mesa")+'"'+(NE.fase !== "buscar" ? " disabled" : "")+'>'+p.v+'</button>';
  let h = '<p class="ap-pregunta">Encuentra el <b>'+c.h+'</b> dentro del <b>'+c.n+'</b></p>';
  h += '<div class="ne-zonas">'+
    '<section class="ne-zona mesa" aria-label="La mesa: piezas del '+c.n+'"><h2>'+(NE.fase === "buscar" ? "La mesa · piezas del "+c.n : "Lo que queda suelto")+'</h2><div class="ne-piezas">'+mesa.map(pieza).join("")+'</div></section>'+
    '<section class="ne-zona esc'+(llevo === c.h ? " bien" : llevo > c.h ? " mal" : "")+'" aria-label="El número escondido"><h2>Número escondido</h2><div class="ne-piezas">'+
      (esc.length ? esc.map(pieza).join("") : '<span class="ne-vacio">Toca las piezas que necesitas</span>')+'</div>'+
      '<p class="ne-llevo" aria-live="polite">'+(esc.length ? sumaTexto(esc.map(p=> p.v))+' = <b>'+llevo+'</b>' : "")+'</p></section></div>';
  if(NE.rompiendo){
    const p = NE.piezas.find(x=> x.id === NE.rompiendo);
    h += '<div class="ne-romper" role="group" aria-label="¿En qué dos piezas rompes el '+p.v+'?"><p>Rompo el <b>'+p.v+'</b> en…</p><div class="ne-opciones">'+
      Array.from({length: Math.floor(p.v/2)}, (_, i)=> i + 1).map(a=>
        '<button class="ne-parte" data-a="'+a+'" aria-label="'+a+' y '+(p.v - a)+'">'+regletaNE(a)+regletaNE(p.v - a)+'<span>'+a+' y '+(p.v - a)+'</span></button>').join("")+
      '</div><button class="bt suave" id="neNoRomper">No la rompo</button></div>';
  }
  if(NE.fase === "buscar"){
    if(NE.aviso) h += '<p class="ap-explica mal" role="status">'+NE.aviso+'</p>';
    else if(NE.pista) h += '<p class="ap-pista" role="status">'+NE.pista+'</p>';
    h += '<div class="pt-acciones"><button class="bt suave" id="neRomper" aria-pressed="'+NE.romper+'">'+(NE.romper ? "Elige qué pieza rompes" : "Romper una pieza")+'</button>'+
      '<button class="bt suave" id="nePista">Pista</button><button class="bt suave" id="neSolucion">Ver la solución</button>'+
      '<button class="bt suave" id="neOtraVez">Empezar el caso</button><button class="bt azul" id="neNuevo">Nuevo caso</button></div>';
  }else if(NE.fase === "queda"){
    h += '<p class="ap-explica bien" role="status">¡Misterio resuelto! '+sumaTexto(esc.map(p=> p.v))+' = '+c.h+'</p>'+
      '<p class="ap-escrito ne-escrito'+(NE.aviso ? " mal" : "")+'" aria-live="polite">Me queda suelto: <b>'+(NE.escrito || "?")+'</b></p>'+
      (NE.aviso ? '<p class="ap-explica mal" role="status">'+NE.aviso+'</p>' : '<p class="ap-pista">Cuenta lo que queda en la mesa.</p>');
  }else h += cierreCaso(c, esc.map(p=> p.v), mesa.map(p=> p.v));
  return h;
}
function cierreCaso(c, juntas, sueltas){   // las tres líneas del cuaderno del detective
  return '<div class="ne-cierre" role="status">'+
    (juntas ? '<p>junto '+sumaTexto(juntas)+' = <b>'+c.h+'</b> · misterio resuelto</p>' : '')+
    (sueltas ? '<p>me quedan sueltos '+sumaTexto(sueltas)+' = <b>'+queda(c)+'</b></p>' : '')+
    '<p class="ne-compr">comprobación: '+c.h+' + '+queda(c)+' = <b>'+c.n+'</b> ✓</p></div>'+
    '<div class="pt-acciones"><button class="bt azul" id="neNuevo">Nuevo caso</button></div>';
}
function tocarPieza(id){
  const p = NE.piezas.find(x=> x.id === id); if(!p || NE.fase !== "buscar") return;
  NE.aviso = ""; NE.pista = "";
  if(NE.romper){
    if(p.v > 1){ NE.rompiendo = p.id; NE.romper = false; }
    else NE.aviso = "La blanca vale 1: no se puede romper más.";
    pintarEscondido(); $("vEscondido").querySelector(".ne-parte")?.focus();
    return;
  }
  p.z = p.z === "mesa" ? "esc" : "mesa";
  const llevo = sumaZona("esc"), c = NE.caso;
  if(llevo > c.h) NE.aviso = "Te has pasado: llevas "+llevo+" y buscas el "+c.h+". Devuelve una pieza a la mesa o rómpela.";
  if(llevo === c.h){ NE.fase = "queda"; NE.escrito = ""; }
  pintarEscondido();
}
function romperEn(a){
  const i = NE.piezas.findIndex(x=> x.id === NE.rompiendo); if(i < 0) return;
  const p = NE.piezas[i];
  NE.piezas.splice(i, 1, {id: neSig++, v:a, z:p.z}, {id: neSig++, v:p.v - a, z:p.z});
  NE.rompiendo = null;
  NE.pista = "Has roto el "+p.v+": "+p.v+" = "+a+" + "+(p.v - a)+".";
  pintarEscondido();
}
function pistaRegletas(){
  const c = NE.caso, llevo = sumaZona("esc"), falta = c.h - llevo, mesa = NE.piezas.filter(p=> p.z === "mesa");
  if(falta < 0) return "Te has pasado en "+(-falta)+". Devuelve a la mesa la pieza que sobra o rómpela.";
  if(falta >= 10 && mesa.some(p=> p.v === 10)) return "Te faltan "+falta+". Coge un diez (la naranja) y llévalo al número escondido.";
  if(mesa.some(p=> p.v === falta)) return "Te falta un "+falta+" y ¡está en la mesa! Llévalo al número escondido.";
  const grande = mesa.filter(p=> p.v > falta).sort((a,b)=> a.v - b.v)[0];
  if(grande) return "Te falta un "+falta+" y no está suelto. Rompe "+(grande.v === 10 ? "un diez" : "el "+grande.v)+" en "+falta+" y "+(grande.v - falta)+".";
  return "Te faltan "+falta+". Junta varias piezas de la mesa que sumen "+falta+".";
}
function resolverRegletas(sinPintar){   // la solución de la presentación: los dieces que hacen falta y, si falta algo, una rotura
  const c = NE.caso, r = rotura(c), dieces = Math.floor(c.h / 10);
  NE.piezas = piezasDe(c.n);
  NE.piezas.filter(p=> p.v === 10).slice(0, dieces).forEach(p=> p.z = "esc");
  if(c.t === "vista" && c.h % 10) NE.piezas.find(p=> p.v === c.n % 10).z = "esc";
  if(r){
    const p = NE.piezas.find(x=> x.v === r.pieza && x.z === "mesa"), i = NE.piezas.indexOf(p);
    NE.piezas.splice(i, 1, {id: neSig++, v:r.parte, z:"esc"}, {id: neSig++, v:r.otra, z:"mesa"});
  }
  Object.assign(NE, {fase:"hecho", romper:false, rompiendo:null, aviso:"", pista:""});
  if(!sinPintar) pintarEscondido();
}

/* ----- Cuaderno (fase simbólica) ----- */
function pasosCuaderno(c){
  const r = rotura(c), dieces = Math.floor(c.h / 10), unos = c.n % 10;
  const juntas = [...Array(dieces).fill(10), ...(c.h % 10 ? [c.h % 10] : [])];
  const pasos = [{tipo:"elegir", txt:"¿Qué pieza rompo?", opciones: ["nada", ...(unos ? ["el "+unos] : []), "un diez"],
                  bien: c.t === "vista" ? "nada" : c.t === "unidad" ? "el "+unos : "un diez"}];
  if(r) pasos.push({tipo:"num", txt:"rompo "+(r.pieza === 10 ? "un diez" : "el "+r.pieza)+" en "+r.parte+" y", bien:r.otra});
  pasos.push({tipo:"num", txt:"junto "+sumaTexto(juntas)+" =", bien:c.h});
  pasos.push({tipo:"num", txt:"me queda suelto", bien:queda(c)});
  pasos.push({tipo:"num", txt:"comprobación: "+c.h+" + "+queda(c)+" =", bien:c.n});
  return pasos;
}
function casoCuaderno(c){
  const pasos = pasosCuaderno(c), dieces = Math.floor(c.n / 10), unos = c.n % 10;
  let h = '<p class="ap-pregunta">Busco el <b>'+c.h+'</b> dentro del <b>'+c.n+'</b></p>'+
    '<p class="ne-desc" role="img" aria-label="'+c.n+' = '+sumaTexto([...Array(dieces).fill(10), ...(unos ? [unos] : [])])+'">'+
      Array(dieces).fill(10).concat(unos ? [unos] : []).map(v=> regletaNE(v, ' aria-hidden="true"')).join("")+
      '<span aria-hidden="true">'+c.n+' = '+sumaTexto([...Array(dieces).fill(10), ...(unos ? [unos] : [])])+'</span></p><div class="ap-pasos ne-pasos">';
  pasos.forEach((p, i)=>{
    if(i > NE.paso) return;
    const actual = i === NE.paso && NE.fase !== "hecho";
    if(p.tipo === "elegir"){
      h += '<div class="ne-paso"><p>'+p.txt+'</p>'+(actual
        ? '<div class="ne-elige">'+p.opciones.map(o=> '<button class="ap-opcion texto" data-o="'+o+'">'+o.replace(/^./, x=> x.toUpperCase())+'</button>').join("")+'</div>'
        : '<p class="ne-hecho">'+p.bien+'</p>')+'</div>';
    }else{
      h += '<p class="ne-paso">'+p.txt+' <span class="ap-campo'+(actual ? " activo"+(NE.aviso ? " mal" : "") : " bien")+'">'+(actual ? (NE.escrito || "?") : p.bien)+'</span></p>';
    }
  });
  h += '</div>';
  if(NE.fase === "hecho") h += '<p class="ap-explica bien" role="status">¡Caso cerrado! '+c.h+' + '+queda(c)+' = '+c.n+(NE.fallos ? '' : ' · sin ningún fallo')+'</p>'+
                               '<div class="pt-acciones"><button class="bt azul" id="neNuevo">Nuevo caso</button></div>';
  else{
    if(NE.aviso) h += '<p class="ap-explica mal" role="status">'+NE.aviso+'</p>';
    else if(NE.pista) h += '<p class="ap-pista" role="status">'+NE.pista+'</p>';
    h += '<div class="pt-acciones"><button class="bt suave" id="nePista">Pista</button><button class="bt suave" id="neNuevo">Nuevo caso</button></div>';
  }
  return h;
}
function pistaCuaderno(){
  const c = NE.caso, p = pasosCuaderno(c)[NE.paso], u = c.n % 10, x = c.h % 10, r = rotura(c);
  if(NE.paso === 0) return x === 0 ? "El "+c.h+" son dieces justos: ¿hace falta romper algo?"
    : "El "+c.h+" necesita "+(c.h >= 10 ? Math.floor(c.h/10)+(c.h >= 20 ? " dieces" : " diez")+" y " : "")+"un "+x+". En la mesa hay un "+(u || "0")+(x === u ? ": ¡justo el que hace falta!" : x < u ? ": el "+x+" está escondido dentro del "+u+"." : ": es pequeño, el "+x+" está escondido dentro de un diez.");
  if(r && NE.paso === 1) return r.pieza+" = "+r.parte+" + ?  ¿Cuánto le falta al "+r.parte+" para llegar al "+r.pieza+"?";
  if(p.txt.startsWith("junto")) return "Suma lo que juntas: los dieces y la pieza que has conseguido.";
  if(p.txt.startsWith("me queda")) return "Lo que queda es "+c.n+" − "+c.h+". Piensa: ¿cuánto le falta al "+c.h+" para llegar al "+c.n+"?";
  return "El número escondido más lo que queda tiene que dar el número de partida.";
}
function elegirCuaderno(o){
  const p = pasosCuaderno(NE.caso)[NE.paso];
  if(o === p.bien){ NE.paso++; NE.aviso = ""; NE.pista = ""; }
  else{ NE.fallos++; NE.aviso = o === "nada" ? "Si no rompes nada, ¿tienes todas las piezas del "+NE.caso.h+"? Mira bien los unos." : "Rompiendo "+o+" no consigues la pieza que falta. Prueba otra vez."; }
  pintarEscondido();
}

/* ----- Detective del error ----- */
function casoError(c){
  const bien = c.dice === queda(c);
  let h = '<div class="ne-bocadillo"><b>'+c.quien+'</b><p>Dentro del <b>'+c.n+'</b> encuentro el <b>'+c.h+'</b> y me quedan sueltos <b>'+c.dice+'</b>.</p></div>';
  if(!NE.veredicto){
    h += '<p class="ap-pregunta">¿Está bien o mal?</p><div class="ap-opciones"><button class="ap-opcion texto" data-v="bien">Bien</button><button class="ap-opcion texto" data-v="mal">Mal</button></div>'+
         (NE.pista ? '<p class="ap-pista" role="status">'+NE.pista+'</p>' : '')+
         '<div class="pt-acciones"><button class="bt suave" id="nePista">Pista</button><button class="bt suave" id="neNuevo">Nuevo caso</button></div>';
    return h;
  }
  const acierto = (NE.veredicto === "bien") === bien;
  if(!acierto){
    h += '<p class="ap-explica mal" role="status">Compruébalo: '+c.h+' + '+c.dice+' = '+(c.h + c.dice)+(bien ? ', que es justo el '+c.n+'. ¡'+c.quien+' lo tenía bien!' : ', y no '+c.n+'. Está mal.')+'</p>';
    return h + cierreCaso(c, null, null);
  }
  if(bien) return h + '<p class="ap-explica bien" role="status">¡Bien visto! '+c.quien+' tiene razón.</p>' + cierreCaso(c, null, null);
  if(NE.fase !== "hecho"){
    return h + '<p class="ap-explica bien" role="status">¡Bien visto! '+c.h+' + '+c.dice+' = '+(c.h + c.dice)+', no '+c.n+'.</p>'+
      '<p class="ap-escrito ne-escrito'+(NE.aviso ? " mal" : "")+'" aria-live="polite">Lo correcto es: <b>'+(NE.escrito || "?")+'</b></p>'+
      (NE.aviso ? '<p class="ap-explica mal" role="status">'+NE.aviso+'</p>' : '');
  }
  return h + cierreCaso(c, null, null);
}
function veredicto(v){
  const c = NE.caso, bien = c.dice === queda(c);
  NE.veredicto = v; NE.pista = "";
  if((v === "bien") === bien){ if(bien){ NE.fase = "hecho"; NE.hechos++; } }
  else NE.fase = "hecho";
  pintarEscondido();
}

/* ---------- Ficha en papel: 6 casos del nivel con los pasos del detective, y sus soluciones ---------- */
function imprimirEscondido(){
  const lista = listaNE(NE.nivel, NE.hasta), casos = [], vistos = new Set();
  for(let t=0; casos.length < 6 && t < 200; t++){ const c = delMazo("ne-ficha-"+NE.nivel+"-"+NE.hasta, lista); if(!vistos.has(c.k)){ vistos.add(c.k); casos.push(c); } }
  const caja = (v, sol) => '<span class="hj-caja'+(sol ? " llena" : "")+'">'+(sol ? v : "")+'</span>';
  // las regletas a escala, pero todas en una fila aunque el número sea grande (con el 99 no cabrían en la tarjeta)
  const regletas = n => { const mm = Math.min(2.6, 70/n);
    return [...Array(Math.floor(n/10)).fill(10), ...(n % 10 ? [n % 10] : [])].map(v=>
      '<i style="width:'+Math.max(3.6, v*mm).toFixed(1)+'mm;background:'+REGLETA[v].c+';color:'+REGLETA[v].t+'">'+v+'</i>').join(""); };
  const ficha = (c, i, sol) => '<div class="hj-caso"><p class="hj-caso-tit"><span class="hj-n">'+(i+1)+'</span>Busco el <b>'+c.h+'</b> dentro del <b>'+c.n+'</b></p>'+
    '<div class="hj-nregletas">'+regletas(c.n)+'</div>'+
    pasosCuaderno(c).map(p=> p.tipo === "elegir"
      ? '<p>'+p.txt+' '+p.opciones.map(o=> '<span class="hj-opcion'+(sol && o === p.bien ? " buena" : "")+'">'+o+'</span>').join(" ")+'</p>'
      : '<p>'+p.txt+' '+caja(p.bien, sol)+'</p>').join("")+'</div>';
  const sub = NIVELES_NE[NE.nivel]+" · números hasta "+NE.hasta;
  $("impresion").innerHTML =
    hojaPapel({titulo:"El número escondido", sub, eti:"2.º", pagina:1, paginas:2, datos:[["Nombre", "", 3.2], ["Fecha", "", 1.4], ["Aciertos", "&nbsp;&nbsp;&nbsp;&nbsp; / 6", 1.2]],
      instrucciones:'<p>🔍 Los tres pasos del detective: 1 · Miro el número con sus dieces y sus unos. 2 · Si me falta una pieza, rompo un diez o la regleta de los unos. 3 · Junto las piezas del número escondido y cuento lo que queda suelto. <b>Comprobación: escondido + lo que queda = el número de partida.</b></p>',
      cuerpo:'<div class="hj-casos">'+casos.map((c, i)=> ficha(c, i, false)).join("")+'</div>'})+
    hojaPapel({titulo:"Soluciones", sub:"El número escondido · "+sub+" · los mismos casos de la ficha", eti:"Para el docente", docente:true, pagina:2, paginas:2,
      cuerpo:'<div class="hj-casos">'+casos.map((c, i)=> ficha(c, i, true)).join("")+'</div>'});
  lanzarImpresion();
}

/* ---------- Teclado numérico (lo que queda, pasos del cuaderno, lo correcto) ---------- */
function teclaNE(t){
  const c = NE.caso;
  if(t === "⌫"){ NE.escrito = NE.escrito.slice(0, -1); NE.aviso = ""; pintarEscondido(); return; }
  if(t !== "✓"){ if(NE.escrito.length < 3){ NE.escrito += t; NE.aviso = ""; } pintarEscondido(); return; }
  if(!NE.escrito) return;
  const n = +NE.escrito;
  if(NE.modo === "regletas" && NE.fase === "queda"){
    if(n === queda(c)){ NE.fase = "hecho"; NE.hechos++; }
    else{ NE.aviso = n+" no es lo que queda. Cuenta otra vez los dieces y los unos de la mesa."; NE.escrito = ""; }
  }else if(NE.modo === "cuaderno"){
    const pasos = pasosCuaderno(c), p = pasos[NE.paso];
    if(!p || p.tipo !== "num") return;
    if(n === p.bien){ NE.paso++; NE.aviso = ""; NE.pista = ""; if(NE.paso >= pasos.length){ NE.fase = "hecho"; NE.paso = pasos.length - 1; NE.hechos++; } }
    else{ NE.fallos++; NE.aviso = n+" no es. "+pistaCuaderno(); }
    NE.escrito = "";
  }else if(NE.modo === "error" && NE.veredicto === "mal"){
    if(n === queda(c)){ NE.fase = "hecho"; NE.hechos++; }
    else{ NE.aviso = c.h+" + "+n+" = "+(c.h + n)+", no "+c.n+". Prueba otra vez."; NE.escrito = ""; }
  }
  pintarEscondido();
  $("neNuevo")?.focus();
}

function enlazarEscondido(){
  const v = $("vEscondido");
  v.querySelectorAll(".ne-pieza").forEach(b=> b.onclick = ()=> tocarPieza(+b.dataset.id));
  v.querySelectorAll(".ne-parte").forEach(b=> b.onclick = ()=> romperEn(+b.dataset.a));
  v.querySelectorAll(".ne-elige .ap-opcion").forEach(b=> b.onclick = ()=> elegirCuaderno(b.dataset.o));
  v.querySelectorAll("#neCuerpo .ap-opciones .ap-opcion").forEach(b=> b.onclick = ()=> veredicto(b.dataset.v));
  $("neNoRomper")?.addEventListener("click", ()=>{ NE.rompiendo = null; pintarEscondido(); });
  $("neRomper")?.addEventListener("click", ()=>{ NE.romper = !NE.romper; NE.rompiendo = null; NE.aviso = ""; pintarEscondido(); });
  $("nePista")?.addEventListener("click", ()=>{
    NE.aviso = "";
    NE.pista = NE.modo === "regletas" ? pistaRegletas() : NE.modo === "cuaderno" ? pistaCuaderno()
      : "Suma lo que encuentra y lo que le queda: "+NE.caso.h+" + "+NE.caso.dice+". ¿Da el "+NE.caso.n+"?";
    pintarEscondido();
  });
  $("neSolucion")?.addEventListener("click", ()=> resolverRegletas());
  $("neOtraVez")?.addEventListener("click", ()=>{ NE.piezas = piezasDe(NE.caso.n); Object.assign(NE, {romper:false, rompiendo:null, aviso:"", pista:""}); pintarEscondido(); });
  $("neNuevo")?.addEventListener("click", nuevoCaso);
}
function tecladoEscondido(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if(!$("neTeclado").hidden){
    if(/^[0-9]$/.test(e.key)){ e.preventDefault(); teclaNE(e.key); }
    else if(e.key === "Backspace"){ e.preventDefault(); teclaNE("⌫"); }
    else if(e.key === "Enter" && e.target.tagName !== "BUTTON"){ e.preventDefault(); teclaNE("✓"); }
    return;
  }
  if((e.key === "r" || e.key === "R") && NE.modo === "regletas" && NE.fase === "buscar"){ e.preventDefault(); NE.romper = !NE.romper; NE.rompiendo = null; pintarEscondido(); }
  else if((e.key === "n" || e.key === "N")){ e.preventDefault(); nuevoCaso(); }
}
