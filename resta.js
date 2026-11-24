/* =====================================================================
   LA RESTA DESCOMPUESTA (#/resta)
   La resta con el formato del aula: se descomponen los dos números (52 = 50 + 2, 27 = 20 + 7), se transforma el
   minuendo cuando no llega (‖ 40 + 12: se rompe una decena y pasa a las unidades), se resta por órdenes (20 + 5)
   y se junta el resultado (25). Debajo, el material base 10 enseña el traspaso: la barra de 10 se convierte en
   10 cubitos (o la placa de 100 en 10 barras) en el momento de romperla, y al restar se tachan las piezas.
   - Niveles: sin llevada, con llevada (2 cifras), tres cifras con una llevada, con dos y con ceros (300 − 127).
   - Se escribe en cada casilla con el teclado; antes de romper se pregunta «¿se puede quitar?».
   - Ficha en papel con el mismo formato y soluciones. Los retos salen del banco sin repetirse.
   Usa las utilidades de index.html, herramientas.js, banco.js, aproximar.js y secciones.js ($, leer, guardar,
   delMazo, apTeclado, pintarIconos, pantallaCompleta, hojaPapel, lanzarImpresion…).
   ===================================================================== */

const RS = Object.assign({nivel:"n2", material:true}, leer("aula-resta", {}),
  {reto:null, plan:null, paso:0, escrito:"", aviso:"", tono:"", fallos:0, bien:0, hechas:{}});
let restaLista = false;
const guardarRS = () => guardar("aula-resta", {nivel:RS.nivel, material:RS.material});
const NIVELES_RS = {
  n1:{txt:"Sin llevada (58 − 23)"}, n2:{txt:"Con llevada (52 − 27)"}, n3:{txt:"Tres cifras, una llevada"},
  n4:{txt:"Tres cifras, dos llevadas (432 − 158)"}, n5:{txt:"Con ceros (300 − 127)"}};
const NOMBRES_RS = {100:["centena", "centenas"], 10:["decena", "decenas"], 1:["unidad", "unidades"]};
const nivelRS = () => NIVELES_RS[RS.nivel] ? RS.nivel : "n2";

/* El plan de una resta: la descomposición, las roturas (de dónde a dónde) y todas las casillas en orden */
function planRS(a, b){
  const nd = a >= 100 ? 3 : 2, pesos = nd === 3 ? [100, 10, 1] : [10, 1];
  const desc = n => pesos.map((p, i)=> Math.floor(n % (i ? pesos[i - 1] : 10000) / p) * p);
  const da = desc(a), db = desc(b), cur = da.slice(), pasos = [], eventos = [];
  da.forEach((v, i)=> pasos.push({t:"caja", zona:"a", i, r:v}));
  db.forEach((v, i)=> pasos.push({t:"caja", zona:"b", i, r:v}));
  const romper = (de, a2)=>{
    const antes = [cur[de], cur[a2]];
    cur[de] -= pesos[de]; cur[a2] += pesos[de];
    eventos.push({de, a:a2, tras:pasos.length - 1});   // se rompe en cuanto se termina el paso anterior
    pasos.push({t:"caja", zona:"t", i:de, r:cur[de], antes:antes[0], de, a:a2});
    pasos.push({t:"caja", zona:"t", i:a2, r:cur[a2], antes:antes[1], de, a:a2});
  };
  for(let i = nd - 1; i >= 1; i--){
    const puede = cur[i] >= db[i];
    pasos.push({t:"decide", i, puede, hay:cur[i], quita:db[i]});
    if(!puede){
      if(cur[i - 1] === 0) romper(i - 2, i - 1);   // con ceros: primero se rompe una centena en decenas
      romper(i - 1, i);
    }
  }
  const res = cur.map((v, k)=> v - db[k]);
  for(let i = nd - 1; i >= 0; i--) pasos.push({t:"caja", zona:"r", i, r:res[i]});
  pasos.push({t:"final", r:a - b});
  return {a, b, nd, pesos, da, db, fin:cur, res, pasos, eventos, roturas:eventos.length};
}
/* Todos los retos de un nivel (como mucho 300, repartidos) */
function listaRS(nivel){
  let l = [];
  const vale = (a, b)=>{
    const p = planRS(a, b), sinCeros = !String(a).includes("0");
    const llevadas = p.pasos.filter(s=> s.t === "decide" && !s.puede).length;
    return {n1: llevadas === 0, n2: llevadas === 1, n3: llevadas === 1 && sinCeros, n4: llevadas === 2 && sinCeros, n5: Math.floor(a / 10) % 10 === 0 && a % 10 < b % 10}[nivel];
  };
  if(nivel === "n1" || nivel === "n2"){
    for(let a=21; a<=99; a++) for(let b=11; b<a - 4; b++) if(b % 10 && vale(a, b)) l.push({k:a+"-"+b, a, b});
  }else if(nivel === "n5"){
    for(let c=2; c<=9; c++) for(let u=0; u<=8; u++) for(let b=101; b<100 * c; b += 3)
      if(b % 10 && Math.floor(b / 10) % 10 && vale(100 * c + u, b)) l.push({k:(100 * c + u)+"-"+b, a:100 * c + u, b});
  }else{
    for(let a=211; a<=989; a += 7) for(let b=112; b<a - 30; b += 11) if(b % 10 && Math.floor(b / 10) % 10 && vale(a, b)) l.push({k:a+"-"+b, a, b});
  }
  if(l.length > 300){ const paso = l.length / 300; l = Array.from({length:300}, (_, i)=> l[Math.floor(i * paso)]); }
  return l;
}
function nuevoRetoRS(){
  const r = delMazo("rd-"+nivelRS(), listaRS(nivelRS()));
  Object.assign(RS, {reto:r, plan:planRS(r.a, r.b), paso:0, escrito:"", aviso:"", tono:"", fallos:0, hechas:{}});
  pintarResta();
}
const pasoRS = () => RS.plan.pasos[RS.paso];
const nombreRS = (p, n) => NOMBRES_RS[p][n === 1 ? 0 : 1];

/* El estado del material: piezas de cada orden (y cuántas han llegado al romper) tras los pasos ya hechos */
function materialRS(){
  const p = RS.plan, cuenta = p.da.map((v, i)=> v / p.pesos[i]), nuevas = p.da.map(()=> 0);
  for(const e of p.eventos) if(e.tras < RS.paso){
    const viejas = cuenta[e.de] - nuevas[e.de];
    if(viejas > 0) cuenta[e.de]--; else{ cuenta[e.de]--; nuevas[e.de]--; }
    cuenta[e.a] += 10; nuevas[e.a] += 10;
  }
  return {cuenta, nuevas};
}

/* ---------- Responder ---------- */
function teclaRS(t){
  const s = pasoRS();
  if(!s || s.t === "decide") return;
  if(t === "⌫"){ RS.escrito = RS.escrito.slice(0, -1); }
  else if(t !== "✓"){ if(RS.escrito.length < 4) RS.escrito += t; }
  else if(RS.escrito){
    const v = +RS.escrito; RS.escrito = "";
    if(v === s.r){
      RS.hechas[RS.paso] = v; RS.paso++; RS.tono = ""; RS.aviso = "";
      if(s.t === "final"){ terminarRS(); return; }
      if(s.zona === "t" && s.i === s.a) RS.aviso = "Ahora el "+RS.plan.a+" es "+transformadoRS().join(" + ")+". ¡Sigue siendo "+RS.plan.a+"!";
      if(pasoRS()?.t === "decide") RS.aviso = (RS.aviso ? RS.aviso+" " : "")+"Mira las "+NOMBRES_RS[RS.plan.pesos[pasoRS().i]][1]+".";
    }else{
      RS.fallos++; RS.tono = "mal"; RS.aviso = v+" no es. "+pistaRS(s);
    }
  }
  pintarResta();
}
function pistaRS(s){
  const p = RS.plan, peso = p.pesos[s.i];
  if(s.t === "final") return "Junta lo que ha quedado: "+p.res.join(" + ")+".";
  if(s.zona === "a" || s.zona === "b"){
    const n = s.zona === "a" ? p.a : p.b, cifra = s.r / peso;
    return "En el "+n+" hay "+cifra+" "+nombreRS(peso, cifra)+": "+(peso === 1 ? "valen "+cifra : cifra+" × "+peso+" = "+s.r)+".";
  }
  if(s.zona === "t") return s.i === s.de ? "Se rompe una "+NOMBRES_RS[p.pesos[s.de]][0]+": "+s.antes+" − "+p.pesos[s.de]+" = ?" :
    "Llegan "+p.pesos[s.de]+" a las "+NOMBRES_RS[peso][1]+": "+s.antes+" + "+p.pesos[s.de]+" = ?";
  return "Resta las "+NOMBRES_RS[peso][1]+": "+p.fin[s.i]+" − "+p.db[s.i]+" = ?";
}
function decidirRS(dice){
  const s = pasoRS();
  if(!s || s.t !== "decide") return;
  const nom = NOMBRES_RS[RS.plan.pesos[s.i]][1];
  if(dice === s.puede){
    RS.paso++; RS.tono = s.puede ? "bien" : "aviso";
    RS.aviso = s.puede ? "¡Sí se puede! "+s.hay+" − "+s.quita+": no hace falta romper nada." :
      "No llega: "+s.hay+" es menos que "+s.quita+". Hay que romper una "+NOMBRES_RS[RS.plan.pesos[s.i - 1]][0]+
      (RS.plan.fin[s.i - 1] !== undefined && RS.plan.da[s.i - 1] === 0 ? " (y como no hay, antes una "+NOMBRES_RS[RS.plan.pesos[s.i - 2]][0]+")" : "")+
      ": mira el material. Escribe cómo queda el "+RS.plan.a+".";
  }else{
    RS.fallos++; RS.tono = "mal";
    RS.aviso = s.puede ? "Mira bien: hay "+s.hay+" y quitas "+s.quita+". ¡Sí llega!" : "Hay "+s.hay+" y hay que quitar "+s.quita+": ¿llega? Cuenta las "+nom+" del material.";
  }
  pintarResta();
}
function terminarRS(){
  const p = RS.plan;
  RS.tono = "bien"; if(!RS.fallos) RS.bien++;
  RS.aviso = "¡"+p.a+" − "+p.b+" = "+(p.a - p.b)+"! Comprueba: "+(p.a - p.b)+" + "+p.b+" = "+p.a+".";
  pintarResta();
  $("rsOtra")?.focus();
}
/* El minuendo transformado (columna de la derecha) tal como va quedando */
function transformadoRS(){
  const p = RS.plan, v = p.da.slice();
  p.pasos.forEach((s, k)=>{ if(k < RS.paso && s.zona === "t") v[s.i] = s.r; });
  return v;
}

/* ---------- Vista ---------- */
function iniciarResta(){
  if(!restaLista){
    restaLista = true;
    pintarIconos($("vResta"));
    $("rsNivel").innerHTML = Object.entries(NIVELES_RS).map(([k, v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("rsNivel").onchange = e=>{ RS.nivel = e.target.value; guardarRS(); nuevoRetoRS(); };
    $("rsMaterial").onclick = ()=>{ RS.material = !RS.material; guardarRS(); pintarResta(); };
    $("rsImprimir").onclick = imprimirResta;
    apTeclado("rsTeclado", teclaRS);
    if(document.fullscreenEnabled) $("rsPantalla").onclick = ()=> pantallaCompleta("vResta"); else $("rsPantalla").hidden = true;
  }
  if(!RS.reto) nuevoRetoRS(); else pintarResta();
}
/* Una casilla de la cuenta: hecha, activa (con lo que se escribe) o vacía */
function cajaRS(zona, i){
  const p = RS.plan, k = p.pasos.findIndex(s=> s.t === "caja" && s.zona === zona && s.i === i);
  if(zona === "t"){
    // la columna transformada: empieza como el minuendo y cambia con cada rotura (lo anterior queda tachado)
    const cambios = p.pasos.map((s, j)=> [s, j]).filter(([s])=> s.zona === "t" && s.i === i);
    const hechos = cambios.filter(([, j])=> j < RS.paso), activo = cambios.find(([, j])=> j === RS.paso);
    const base = p.da[i], previos = [base, ...hechos.map(([s])=> s.r)];
    if(activo) return '<span class="rd-caja activa'+(RS.tono === "mal" ? " mal" : "")+'"><s>'+previos[previos.length - 1]+'</s>'+(RS.escrito || "?")+'</span>';
    const listo = RS.paso > p.pasos.findIndex(s=> s.t === "decide") || hechos.length;
    return '<span class="rd-caja'+(hechos.length ? " cambiada" : listo ? " copia" : " vacia")+'">'+(hechos.length > 0 ? '<s>'+previos[previos.length - 2]+'</s>' : '')+(listo ? previos[previos.length - 1] : "")+'</span>';
  }
  if(zona === "b2") return '<span class="rd-caja'+(RS.paso > p.pasos.findIndex(s=> s.t === "decide") ? " copia" : " vacia")+'">'+(RS.paso > p.pasos.findIndex(s=> s.t === "decide") ? p.db[i] : "")+'</span>';
  if(k === RS.paso) return '<span class="rd-caja activa'+(RS.tono === "mal" ? " mal" : "")+'">'+(RS.escrito || "?")+'</span>';
  return '<span class="rd-caja'+(k < RS.paso ? " hecha" : " vacia")+'">'+(k < RS.paso ? p.pasos[k].r : "")+'</span>';
}
function filaRS(zona){ return '<span class="rd-fila">'+RS.plan.pesos.map((_, i)=> cajaRS(zona, i)).join('<span class="rd-mas">+</span>')+'</span>'; }
function pintarResta(){
  const c = $("rsCuerpo"), p = RS.plan, s = pasoRS(), fin = !s;
  $("rsNivel").value = nivelRS();
  $("rsMaterial").setAttribute("aria-pressed", RS.material);
  let h = '<p class="ap-marcador"><span>'+p.a+' − '+p.b+'</span><span class="ap-puntos" aria-label="'+RS.bien+' sin fallos">★ '+RS.bien+'</span></p>';
  const decide = p.pasos.findIndex(x=> x.t === "decide");
  h += '<div class="rd-cuenta" role="group" aria-label="La resta descompuesta">'+
    '<div class="rd-izq"><span class="rd-num">'+p.a+'</span><span class="rd-ig">=</span>'+filaRS("a")+
      '<span class="rd-num rd-menos">− '+p.b+'</span><span class="rd-ig">=</span>'+filaRS("b")+'</div>'+
    '<div class="rd-doble" aria-hidden="true"></div>'+
    '<div class="rd-der'+(RS.paso > decide ? "" : " apagada")+'">'+filaRS("t")+filaRS("b2")+'<span class="rd-raya"></span>'+filaRS("r")+
      '<span class="rd-junta">'+(s?.t === "final" ? '<span class="rd-caja activa grande'+(RS.tono === "mal" ? " mal" : "")+'">'+(RS.escrito || "?")+'</span>' :
        fin ? '<span class="rd-caja hecha grande">'+(p.a - p.b)+'</span>' : '<span class="rd-caja vacia grande"></span>')+'</span></div></div>';
  if(s?.t === "decide"){
    const nom = NOMBRES_RS[p.pesos[s.i]][1];
    h += '<p class="ap-pregunta">'+mayusRS(nom)+': ¿puedes quitar <b>'+s.quita+'</b> a <b>'+s.hay+'</b>?</p>'+
      '<div class="ap-opciones"><button class="ap-opcion texto" data-d="si">Sí, se puede</button><button class="ap-opcion texto" data-d="no">No, hay que romper</button></div>';
  }else if(s) h += '<p class="rd-que">'+queRS(s)+'</p>';
  h += '<p class="ap-explica '+(RS.aviso ? RS.tono : "rd-sin")+'" role="status">'+RS.aviso+'</p>';
  if(fin) h += '<div class="pt-acciones"><button class="bt azul" id="rsOtra">Otra resta</button></div>';
  if(RS.material) h += materialHTML();
  c.innerHTML = h;
  $("rsTeclado").hidden = !s || s.t === "decide";
  c.querySelectorAll("[data-d]").forEach(b=> b.onclick = ()=> decidirRS(b.dataset.d === "si"));
  $("rsOtra")?.addEventListener("click", nuevoRetoRS);
}
const mayusRS = t => t[0].toUpperCase()+t.slice(1);
function queRS(s){
  const p = RS.plan;
  if(s.t === "final") return "Junta lo que ha quedado: <b>"+p.res.join(" + ")+"</b>";
  if(s.zona === "a") return "Descompón el <b>"+p.a+"</b>: ¿cuánto valen sus "+NOMBRES_RS[p.pesos[s.i]][1]+"?";
  if(s.zona === "b") return "Descompón el <b>"+p.b+"</b>: ¿cuánto valen sus "+NOMBRES_RS[p.pesos[s.i]][1]+"?";
  if(s.zona === "t") return s.i === s.de ? "Se rompe una "+NOMBRES_RS[p.pesos[s.de]][0]+": ¿cuánto queda en las "+NOMBRES_RS[p.pesos[s.de]][1]+"?" :
    "¿Cuánto hay ahora en las "+NOMBRES_RS[p.pesos[s.i]][1]+"?";
  return "Resta las "+NOMBRES_RS[p.pesos[s.i]][1]+": <b>"+p.fin[s.i]+" − "+p.db[s.i]+"</b>";
}
/* El material: centenas (placas), decenas (barras) y unidades (cubitos); lo que llega al romper, en otro color */
function materialHTML(){
  const p = RS.plan, m = materialRS(), s = pasoRS();
  const pieza = {100:"rd-placa", 10:"rd-barra", 1:"rd-cubo"};
  const quitando = i => p.pasos.findIndex(x=> x.zona === "r" && x.i === i) <= RS.paso;
  return '<div class="rd-mat" role="img" aria-label="Material: '+p.pesos.map((w, i)=> m.cuenta[i]+" "+nombreRS(w, m.cuenta[i])).join(", ")+'">'+p.pesos.map((w, i)=>{
    const n = m.cuenta[i], nuevas = Math.max(0, m.nuevas[i]), fuera = quitando(i) ? p.db[i] / w : 0;
    const piezas = Array.from({length:n}, (_, k)=> '<i class="'+pieza[w]+(k >= n - nuevas ? " nueva" : "")+(k >= n - fuera ? " fuera" : "")+'"></i>').join("");
    const recien = p.eventos.some(e=> e.a === i && e.tras === RS.paso - 1) || (s?.zona === "t" && s.i === i);
    return '<div class="rd-col'+(s?.i === i && s.t !== "final" ? " activa" : "")+'"><p>'+mayusRS(NOMBRES_RS[w][1])+' <b>'+n+'</b></p><div class="rd-piezas'+(w === 1 ? " cubos" : "")+(recien ? " llegan" : "")+'">'+piezas+'</div></div>';
  }).join("")+'</div>';
}
function tecladoResta(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const s = pasoRS();
  if(!s){ if(e.key === "Enter" && e.target.tagName !== "BUTTON"){ e.preventDefault(); nuevoRetoRS(); } return; }
  if(s.t === "decide"){
    if(/^[sS]$/.test(e.key)){ e.preventDefault(); decidirRS(true); }
    else if(/^[nN]$/.test(e.key)){ e.preventDefault(); decidirRS(false); }
    return;
  }
  if(/^[0-9]$/.test(e.key)){ e.preventDefault(); teclaRS(e.key); }
  else if(e.key === "Backspace"){ e.preventDefault(); teclaRS("⌫"); }
  else if(e.key === "Enter"){ e.preventDefault(); teclaRS("✓"); }
}

/* ---------- Ficha en papel: restas con el mismo formato (y las soluciones) ---------- */
function imprimirResta(){
  const n = nivelRS(), lista = listaRS(n), tres = n !== "n1" && n !== "n2", cuantas = tres ? 5 : 8;
  const retos = Array.from({length:cuantas}, ()=> delMazo("rd-"+n, lista)).map(r=> planRS(r.a, r.b));
  const caja = (v, docente) => '<span class="hj-caja'+(docente ? " llena" : "")+'">'+(docente ? v : "")+'</span>';
  const fila = (vals, docente) => vals.map(v=> caja(v, docente)).join(" + ");
  const hoja = docente => '<div class="hj-rds'+(tres ? " tres" : "")+'">'+retos.map((p, k)=>
    '<div class="hj-rd"><span class="hj-n">'+(k + 1)+'</span><div class="hj-rd-cuenta">'+
      '<div class="hj-rd-izq"><b>'+p.a+'</b><span>=</span><span>'+fila(p.da, docente)+'</span><b>− '+p.b+'</b><span>=</span><span>'+fila(p.db, docente)+'</span></div>'+
      '<div class="hj-rd-doble"></div>'+
      '<div class="hj-rd-der"><span>'+fila(p.fin, docente)+'</span><span>'+fila(p.db, docente)+'</span><span class="hj-rd-raya"></span>'+(tres ? '<span>'+fila(p.res, docente)+' <span class="hj-rd-flecha">→</span> '+caja(p.a - p.b, docente)+'</span>' :
        '<span>'+fila(p.res, docente)+'</span><span class="hj-rd-res">'+caja(p.a - p.b, docente)+'</span>')+'</div></div></div>').join("")+'</div>';
  const instr = '<p>➖ Descompón los dos números. Si arriba no hay bastantes para quitar, <b>rompe una decena</b> (o una centena) y escribe cómo queda después de la doble raya. '+
    'Resta cada orden y junta el resultado. Ejemplo: 52 = 50 + 2 ‖ 40 + 12; 40 − 20 = 20 y 12 − 7 = 5 → 25.</p>';
  $("impresion").innerHTML =
    hojaPapel({titulo:"La resta descompuesta", sub:"Restas · "+NIVELES_RS[n].txt, eti:"Resta", pagina:1, paginas:2,
      datos:[["Nombre", "", 3], ["Fecha", "", 1]], instrucciones:instr, cuerpo:hoja(false)})+
    hojaPapel({titulo:"La resta descompuesta · Soluciones", sub:"Restas · "+NIVELES_RS[n].txt, eti:"Para el docente", pagina:2, paginas:2, docente:true,
      instrucciones:'<p>En azul, las respuestas.</p>', cuerpo:hoja(true)});
  lanzarImpresion();
}
