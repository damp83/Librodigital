/* =====================================================================
   MINUTO DE CÁLCULO (#/minuto)
   Test de cálculo mental rápido: tantas operaciones como se puedan en 1 minuto (o 30 s / 2 min).
   - Niveles por edades (5 años, 1.º, 2.º y Reto): cada uno trae sus tipos de operación (dobles, doble más
     uno, doble menos uno, mitades, uno más / uno menos, diez más / diez menos, parejas del 10…), y se pueden
     quitar o poner tipos a mano.
   - Se responde con el teclado grande de la pantalla o el del ordenador; al escribir tantas cifras como tiene
     la respuesta se corrige solo y pasa a la siguiente (también «✓» o Intro, y «Pasar»).
   - Al acabar: aciertos, fallos, récord personal de ese nivel en este dispositivo, los últimos intentos y las
     operaciones falladas con su solución para repasar.
   Las operaciones salen del banco (banco.js): no se repiten hasta agotarse.
   Usa las utilidades de index.html y herramientas.js ($, leer, guardar, esc, svg, pintarIconos, azar…).
   ===================================================================== */

const MIN_TIPOS = {
  mas1:      {txt:"Uno más, uno menos",  ej:"6 + 1 · 8 − 1", lista: ()=> [...rangoM(0,9).map(n=> op(n+" + 1", n+1, "m+"+n)), ...rangoM(1,10).map(n=> op(n+" − 1", n-1, "m-"+n))]},
  mas1_20:   {txt:"Uno más, uno menos hasta 20", ej:"14 + 1 · 17 − 1", lista: ()=> [...rangoM(10,19).map(n=> op(n+" + 1", n+1, "M+"+n)), ...rangoM(11,20).map(n=> op(n+" − 1", n-1, "M-"+n))]},
  sumas5:    {txt:"Sumas hasta 5",       ej:"2 + 3",   lista: ()=> pares(1,4, (a,b)=> a+b<=5).map(([a,b])=> op(a+" + "+b, a+b))},
  dobles5:   {txt:"Dobles hasta 5",      ej:"3 + 3",   lista: ()=> rangoM(1,5).map(n=> op(n+" + "+n, 2*n, "d"+n))},
  dobles:    {txt:"Dobles",              ej:"7 + 7 · doble de 6", lista: ()=> rangoM(1,10).flatMap(n=> [op(n+" + "+n, 2*n, "d"+n, "El doble de "+n), op("Doble de "+n, 2*n, "D"+n)])},
  dobleMas1: {txt:"Doble más uno",       ej:"6 + 7",   lista: ()=> rangoM(1,9).flatMap(n=> [op(n+" + "+(n+1), 2*n+1, "dm"+n, n+" + "+n+" + 1"), op((n+1)+" + "+n, 2*n+1, "md"+n, n+" + "+n+" + 1")])},
  dobleMenos1:{txt:"Doble menos uno",    ej:"8 + 7 → 8 + 8 − 1", lista: ()=> rangoM(2,10).map(n=> op(n+" + "+(n-1), 2*n-1, "dn"+n, n+" + "+n+" − 1"))},
  mitades:   {txt:"Mitades",             ej:"mitad de 12", lista: ()=> rangoM(1,10).map(n=> op("Mitad de "+(2*n), n, "h"+n, n+" + "+n+" = "+(2*n)))},
  parejas10: {txt:"Parejas del 10",      ej:"7 + ? = 10", lista: ()=> rangoM(1,9).flatMap(n=> [op(n+" + ? = 10", 10-n, "p"+n), op("? + "+n+" = 10", 10-n, "q"+n)])},
  sumas10:   {txt:"Sumas hasta 10",      ej:"4 + 5",   lista: ()=> pares(1,9, (a,b)=> a+b<=10).map(([a,b])=> op(a+" + "+b, a+b))},
  restas10:  {txt:"Restas hasta 10",     ej:"9 − 4",   lista: ()=> pares(2,10, (t,a)=> a<t, 1).map(([t,a])=> op(t+" − "+a, t-a))},
  mas10:     {txt:"Diez más, diez menos", ej:"34 + 10 · 52 − 10", lista: ()=> [...rangoM(1,89).map(n=> op(n+" + 10", n+10, "x+"+n)), ...rangoM(11,99).map(n=> op(n+" − 10", n-10, "x-"+n))]},
  sumas20:   {txt:"Pasar por el 10",     ej:"8 + 5",   lista: ()=> pares(2,9, (a,b)=> a+b>10).map(([a,b])=> op(a+" + "+b, a+b, null, a+" + "+(10-a)+" + "+(a+b-10)))},
  restas20:  {txt:"Restas hasta 20",     ej:"13 − 5",  lista: ()=> pares(11,18, (t,a)=> t-a<10 && t-a>0, 2, 9).map(([t,a])=> op(t+" − "+a, t-a, null, t+" − "+(t-10)+" − "+(a-(t-10))))},
  dobles20:  {txt:"Dobles hasta 20 y mitades hasta 40", ej:"doble de 15 · mitad de 32", lista: ()=> rangoM(11,20).flatMap(n=> [op("Doble de "+n, 2*n, "D"+n, "10 + 10 + "+(n-10)+" + "+(n-10)), op("Mitad de "+(2*n), n, "h"+n)])},
  mas9:      {txt:"Sumar y restar 9",    ej:"46 + 9 → 46 + 10 − 1", lista: ()=> [...rangoM(11,80).map(n=> op(n+" + 9", n+9, "n+"+n, n+" + 10 − 1")), ...rangoM(20,99).map(n=> op(n+" − 9", n-9, "n-"+n, n+" − 10 + 1"))]},
  decenas:   {txt:"Sumas y restas de decenas", ej:"30 + 50 · 90 − 40", lista: ()=> [...pares(1,8, (a,b)=> a+b<=10).map(([a,b])=> op(a*10+" + "+b*10, (a+b)*10)), ...pares(2,10, (a,b)=> b<a, 1).map(([a,b])=> op(a*10+" − "+b*10, (a-b)*10))]},
  amigos100: {txt:"Amigos del 100",      ej:"70 + ? = 100", lista: ()=> rangoM(1,9).flatMap(d=> [op(d*10+" + ? = 100", 100-d*10, "a"+d), op("100 − "+d*10, 100-d*10, "r"+d)])},
  dobles50:  {txt:"Dobles de números grandes", ej:"doble de 25 · doble de 34", lista: ()=> rangoM(21,49).map(n=> op("Doble de "+n, 2*n, "G"+n, "doble de "+Math.floor(n/10)*10+" + doble de "+(n%10)))}};
const MIN_NIVELES = {
  i5: {txt:"5 años",   tipos:["mas1", "sumas5", "dobles5"]},
  p1: {txt:"1.º",      tipos:["mas1", "dobles", "dobleMas1", "dobleMenos1", "parejas10", "sumas10", "restas10"]},
  p2: {txt:"2.º",      tipos:["mas1_20", "dobles", "dobleMas1", "dobleMenos1", "mitades", "mas10", "sumas20", "restas20", "amigos100"]},
  reto: {txt:"Reto",   tipos:["dobles20", "dobleMas1", "mas9", "decenas", "amigos100", "dobles50", "sumas20", "restas20"]}};
function rangoM(a, b){ const l = []; for(let x=a; x<=b; x++) l.push(x); return l; }
function pares(desde, hasta, cumple, segundoDesde, segundoHasta){   // [a, b] con a y b en el rango y que cumplan la condición
  const l = [];
  for(let a=desde; a<=hasta; a++) for(let b=(segundoDesde || desde); b<=(segundoHasta || (segundoDesde ? a : hasta)); b++) if(cumple(a, b)) l.push([a, b]);
  return l;
}
function op(q, r, k, estrategia){ return {k: k || q, q, r, estrategia}; }
const listasMin = {};
const listaMin = t => listasMin[t] || (listasMin[t] = MIN_TIPOS[t].lista());

const MN = Object.assign({nivel:"p1", tiempo:60, estrategia:false, tipos:null}, leer("aula-minuto", {}),
  {fase:"inicio", preguntas:[], actual:null, escrito:"", restante:0, fin:0, marcas:leer("aula-minuto-marcas", {})});
let minutoListo = false, mnReloj = null, mnCuenta = null;
const guardarMN = () => guardar("aula-minuto", {nivel:MN.nivel, tiempo:MN.tiempo, estrategia:MN.estrategia, tipos:MN.tipos});
if(!MIN_NIVELES[MN.nivel]) MN.nivel = "p1";
const tiposMN = () => (MN.tipos && MN.tipos.length ? MN.tipos : MIN_NIVELES[MN.nivel].tipos).filter(t=> MIN_TIPOS[t]);

function iniciarMinuto(){
  if(!minutoListo){
    minutoListo = true;
    pintarIconos($("vMinuto"));
    apTeclado("mnTeclado", teclaMN);
  }
  if(MN.fase === "jugando") return;   // si se vuelve a la vista con el minuto en marcha, sigue
  // en el modo aula de una clase, el nivel de esa clase
  const nivelClase = typeof claseSlug !== "undefined" && claseSlug ? {"5 años":"i5", "1.º":"p1", "2.º":"p2"}[ETAPA_DE[claseSlug]] : null;
  if(nivelClase && nivelClase !== MN.nivel){ MN.nivel = nivelClase; MN.tipos = null; }
  pararMN(); MN.fase = "inicio"; pintarMinuto();
}
function pararMN(){ clearInterval(mnReloj); clearTimeout(mnCuenta); mnReloj = mnCuenta = null; }

function empezarMN(){
  pararMN();
  MN.preguntas = []; MN.escrito = ""; MN.fase = "cuenta"; MN.cuenta = 3;
  pintarMinuto();
  const paso = ()=>{
    MN.cuenta--;
    if(MN.cuenta > 0){ pintarMinuto(); mnCuenta = setTimeout(paso, 800); return; }
    MN.fase = "jugando"; MN.fin = Date.now() + MN.tiempo * 1000; MN.restante = MN.tiempo;
    siguienteMN();
    mnReloj = setInterval(()=>{
      MN.restante = Math.max(0, Math.ceil((MN.fin - Date.now()) / 1000));
      const barra = $("mnBarra"); if(barra) barra.style.width = (100 * (MN.fin - Date.now()) / (MN.tiempo * 1000)) + "%";
      const r = $("mnRestante"); if(r) r.textContent = MN.restante;
      if(Date.now() >= MN.fin) terminarMN();
    }, 200);
  };
  mnCuenta = setTimeout(paso, 800);
}
function siguienteMN(){
  const tipos = tiposMN(), t = tipos[azar(0, tipos.length-1)];
  let p = delMazo("mn-"+t, listaMin(t));
  const anterior = MN.preguntas[MN.preguntas.length-1];
  if(anterior && anterior.q === p.q) p = delMazo("mn-"+t, listaMin(t));
  MN.actual = {...p, tipo:t}; MN.escrito = "";
  pintarMinuto();
}
function contestarMN(valor, pasada){
  if(MN.fase !== "jugando" || !MN.actual) return;
  MN.preguntas.push({...MN.actual, respuesta: pasada ? null : valor, bien: !pasada && valor === MN.actual.r});
  MN.ultimo = pasada ? "pasada" : valor === MN.actual.r ? "bien" : "mal";
  siguienteMN();
}
function teclaMN(t){
  if(MN.fase !== "jugando") { if(t === "✓" && MN.fase !== "cuenta") empezarMN(); return; }
  if(t === "⌫"){ MN.escrito = MN.escrito.slice(0, -1); pintarMinuto(); return; }
  if(t === "✓"){ if(MN.escrito) contestarMN(+MN.escrito); return; }
  if(MN.escrito.length >= 3) return;
  MN.escrito += t;
  // al escribir tantas cifras como tiene la respuesta, se corrige solo
  if(MN.escrito.length >= String(MN.actual.r).length) contestarMN(+MN.escrito); else pintarMinuto();
}
function terminarMN(){
  pararMN(); MN.fase = "fin"; MN.actual = null;
  const bien = MN.preguntas.filter(p=> p.bien).length;
  const clave = MN.nivel+"-"+MN.tiempo+(MN.tipos && MN.tipos.length ? "-" + MN.tipos.slice().sort().join(".") : "");
  const m = MN.marcas[clave] || {record:0, ultimos:[]};
  MN.nuevoRecord = bien > m.record && bien > 0;
  m.record = Math.max(m.record, bien); m.ultimos = m.ultimos.concat(bien).slice(-6);
  MN.marcas[clave] = m; MN.claveMarca = clave; guardar("aula-minuto-marcas", MN.marcas);
  pintarMinuto();
  $("mnFin")?.focus();
}

/* ---------- Pintar ---------- */
function pintarMinuto(){
  const c = $("mnCuerpo"), nivel = MIN_NIVELES[MN.nivel], tipos = tiposMN();
  $("mnTeclado").hidden = MN.fase !== "jugando";
  if(MN.fase === "inicio"){
    c.innerHTML =
      '<div class="mn-inicio"><h2>¿Cuántas operaciones haces en '+(MN.tiempo===60 ? "un minuto" : MN.tiempo+" segundos")+'?</h2>'+
      '<div class="mn-fila"><span class="mn-eti">Nivel</span><div class="segmentos" role="group" aria-label="Nivel">'+
        Object.entries(MIN_NIVELES).map(([k,v])=> '<button data-nivel="'+k+'" aria-pressed="'+(k===MN.nivel)+'">'+v.txt+'</button>').join("")+'</div></div>'+
      '<div class="mn-fila"><span class="mn-eti">Tiempo</span><div class="segmentos" role="group" aria-label="Tiempo">'+
        [30,60,120].map(s=> '<button data-tiempo="'+s+'" aria-pressed="'+(s===MN.tiempo)+'">'+(s<60 ? s+" s" : s/60+" min")+'</button>').join("")+'</div></div>'+
      '<p class="mn-eti">Operaciones <small>(toca para quitar o poner)</small></p>'+
      '<div class="mn-tipos" role="group" aria-label="Tipos de operación">'+Object.entries(MIN_TIPOS).filter(([k])=> nivel.tipos.includes(k) || (MN.tipos||[]).includes(k)).map(([k,v])=>
        '<button class="cm-tipo" data-tipo="'+k+'" aria-pressed="'+tipos.includes(k)+'"><b>'+v.txt+'</b><span>'+v.ej+'</span></button>').join("")+'</div>'+
      '<div class="mn-fila"><button class="chip" id="mnEstrategia" aria-pressed="'+MN.estrategia+'">Ver la estrategia al fallar</button>'+
        marcaTexto()+'</div>'+
      '<button class="bt azul mn-empezar" id="mnEmpezar">'+svg("bola")+'¡Empezar!</button></div>';
    c.querySelectorAll("[data-nivel]").forEach(b=> b.onclick = ()=>{ MN.nivel = b.dataset.nivel; MN.tipos = null; guardarMN(); pintarMinuto(); });
    c.querySelectorAll("[data-tiempo]").forEach(b=> b.onclick = ()=>{ MN.tiempo = +b.dataset.tiempo; guardarMN(); pintarMinuto(); });
    c.querySelectorAll("[data-tipo]").forEach(b=> b.onclick = ()=>{
      const actuales = tiposMN().slice(), k = b.dataset.tipo, i = actuales.indexOf(k);
      if(i >= 0){ if(actuales.length > 1) actuales.splice(i, 1); } else actuales.push(k);
      const iguales = actuales.length === nivel.tipos.length && actuales.every(x=> nivel.tipos.includes(x));
      MN.tipos = iguales ? null : actuales; guardarMN(); pintarMinuto(); });
    $("mnEstrategia").onclick = ()=>{ MN.estrategia = !MN.estrategia; guardarMN(); pintarMinuto(); };
    $("mnEmpezar").onclick = empezarMN;
    return;
  }
  if(MN.fase === "cuenta"){
    c.innerHTML = '<p class="mn-cuenta" aria-live="assertive">'+MN.cuenta+'</p>';
    return;
  }
  if(MN.fase === "jugando"){
    const p = MN.actual, bien = MN.preguntas.filter(x=> x.bien).length, anterior = MN.preguntas[MN.preguntas.length-1];
    const hueco = '<span class="mn-hueco">'+(MN.escrito || "?")+'</span>';
    const texto = p.q.includes("?") ? esc(p.q).replace("?", hueco) : esc(p.q)+' = '+hueco;
    const aviso = !anterior ? "" : MN.ultimo === "bien" ? '<span class="mn-ok">✓ '+esc(solucionMN(anterior))+'</span>'
      : MN.ultimo === "mal" ? '<span class="mn-mal">✗ Era '+esc(solucionMN(anterior))+(MN.estrategia && anterior.estrategia ? ' <small>('+esc(anterior.estrategia)+')</small>' : '')+'</span>'
      : '<span class="mn-pasa">→ '+esc(solucionMN(anterior))+'</span>';
    c.innerHTML =
      '<div class="mn-juego"><div class="mn-tiempo"><span class="mn-barra"><i id="mnBarra" style="width:'+(100 * MN.restante / MN.tiempo)+'%"></i></span>'+
        '<span class="mn-num"><b id="mnRestante">'+MN.restante+'</b> s</span><span class="mn-num">★ '+bien+'</span></div>'+
      '<p class="mn-pregunta" aria-live="polite">'+texto+'</p>'+
      '<p class="mn-aviso" aria-live="polite">'+aviso+'</p>'+
      '<div class="pt-acciones"><button class="bt suave" id="mnPasar">Pasar</button><button class="bt suave" id="mnParar">Terminar</button></div></div>';
    $("mnPasar").onclick = ()=> contestarMN(null, true);
    $("mnParar").onclick = terminarMN;
    return;
  }
  // Fin
  const ps = MN.preguntas, bien = ps.filter(x=> x.bien), mal = ps.filter(x=> !x.bien && x.respuesta !== null), pasadas = ps.filter(x=> x.respuesta === null);
  const m = MN.marcas[MN.claveMarca] || {record:0, ultimos:[]}, maxU = Math.max(1, ...m.ultimos);
  c.innerHTML =
    '<div class="mn-final"><h2 id="mnFin" tabindex="-1">'+(MN.nuevoRecord ? "🏆 ¡Nuevo récord! " : "")+bien.length+(bien.length===1 ? " acierto" : " aciertos")+' en '+(MN.tiempo===60 ? "un minuto" : MN.tiempo+" s")+'</h2>'+
    '<p class="mn-datos"><span class="mn-ok">✓ '+bien.length+' bien</span><span class="mn-mal">✗ '+mal.length+' fallos</span><span class="mn-pasa">→ '+pasadas.length+' pasadas</span><span>Récord: <b>'+m.record+'</b></span></p>'+
    (m.ultimos.length > 1 ? '<div class="mn-grafica" role="img" aria-label="Últimos intentos: '+m.ultimos.join(", ")+'"><span class="mn-eti">Últimos intentos</span>'+
      m.ultimos.map((u,i)=> '<span class="mn-col'+(i===m.ultimos.length-1 ? " ultima" : "")+'"><i style="height:'+(8 + 72 * u / maxU)+'px"></i><b>'+u+'</b></span>').join("")+'</div>' : '')+
    (mal.length || pasadas.length ? '<h3>Para repasar</h3><ul class="mn-repaso">'+mal.concat(pasadas).map(x=>
      '<li><b>'+esc(solucionMN(x))+'</b>'+(x.respuesta!==null ? ' <span class="mn-mal">(dijiste '+x.respuesta+')</span>' : ' <span class="mn-pasa">(pasada)</span>')+
      (x.estrategia ? '<small>'+esc(x.estrategia)+'</small>' : '')+'</li>').join("")+'</ul>' : '<p class="mn-ok">¡Ningún fallo!</p>')+
    '<div class="pt-acciones"><button class="bt azul" id="mnOtra">Otra vez</button><button class="bt suave" id="mnCambiar">Cambiar nivel</button></div></div>';
  $("mnOtra").onclick = empezarMN;
  $("mnCambiar").onclick = ()=>{ MN.fase = "inicio"; pintarMinuto(); };
}
const solucionMN = x => x.q.includes("?") ? x.q.replace("?", x.r) : x.q+" = "+x.r;
function marcaTexto(){
  const clave = MN.nivel+"-"+MN.tiempo+(MN.tipos && MN.tipos.length ? "-" + MN.tipos.slice().sort().join(".") : ""), m = MN.marcas[clave];
  return m && m.record ? '<span class="mn-record">🏆 Récord en este dispositivo: <b>'+m.record+'</b></span>' : '';
}
function tecladoMinuto(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if(MN.fase !== "jugando") return;
  if(/^[0-9]$/.test(e.key)){ e.preventDefault(); teclaMN(e.key); }
  else if(e.key === "Backspace"){ e.preventDefault(); teclaMN("⌫"); }
  else if(e.key === "Enter"){ e.preventDefault(); teclaMN("✓"); }
  else if(e.key === " " || e.key === "ArrowRight"){ e.preventDefault(); contestarMN(null, true); }
}
