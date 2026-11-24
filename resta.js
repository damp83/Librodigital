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

const RS = Object.assign({nivel:"n2", material:true, descomponer:true}, leer("aula-resta", {}),
  {reto:null, plan:null, paso:0, escrito:"", aviso:"", tono:"", fallos:0, bien:0, hechas:{}, quitados:{}});
let restaLista = false;
const guardarRS = () => guardar("aula-resta", {nivel:RS.nivel, material:RS.material, descomponer:RS.descomponer});
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
    pasos.push({t:"romper", de, a:a2});   // el alumno toca la pieza que se rompe
    eventos.push({de, a:a2, tras:pasos.length - 1});
    pasos.push({t:"caja", zona:"t", i:de, r:cur[de], antes:antes[0], de, a:a2});
    pasos.push({t:"caja", zona:"t", i:a2, r:cur[a2], antes:antes[1], de, a:a2});
  };
  for(let i = nd - 1; i >= 1; i--){
    if(!db[i]) continue;   // si no se quita nada de ese orden, no hay nada que decidir
    const puede = cur[i] >= db[i];
    pasos.push({t:"decide", i, puede, hay:cur[i], quita:db[i]});
    if(!puede){
      if(cur[i - 1] === 0) romper(i - 2, i - 1);   // con ceros: primero se rompe una centena en decenas
      romper(i - 1, i);
    }
  }
  const res = cur.map((v, k)=> v - db[k]);
  for(let i = nd - 1; i >= 0; i--){
    if(db[i]) pasos.push({t:"quitar", i, n:db[i] / pesos[i]});   // tocar las piezas que se quitan
    pasos.push({t:"caja", zona:"r", i, r:res[i]});
  }
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
/* Modo libre: la resta que escribe la maestra (la del libro, la de la pizarra…) */
function empezarLibreRS(ta, tb){
  const a = +String(ta).trim(), b = +String(tb).trim();
  RS.libreA = String(ta).trim(); RS.libreB = String(tb).trim();
  const mal = !/^\d{1,3}$/.test(RS.libreA) || !/^\d{1,3}$/.test(RS.libreB) ? "Escribe dos números enteros de hasta tres cifras." :
    a < 10 ? "El primer número tiene que tener al menos dos cifras." : b < 1 ? "El segundo número tiene que ser 1 o más." :
    b >= a ? "El primer número tiene que ser mayor que el segundo." : "";
  if(mal){ RS.libreAviso = mal; pintarResta(); $("rsLibreA")?.focus(); return; }
  RS.escribiendo = false; RS.libreAviso = "";
  Object.assign(RS, {reto:{k:"libre", a, b, libre:true}, plan:planRS(a, b), paso:0, escrito:"", aviso:"", tono:"", fallos:0, hechas:{}, quitados:{}});
  pintarResta();
  ($("rsTeclado").hidden ? $("rsCuerpo").querySelector("[data-d], .rd-toca") : $("rsTeclado").querySelector("button"))?.focus();
}
function nuevoRetoRS(){
  const r = delMazo("rd-"+nivelRS(), listaRS(nivelRS()));
  Object.assign(RS, {reto:r, plan:planRS(r.a, r.b), paso:0, escrito:"", aviso:"", tono:"", fallos:0, hechas:{}, quitados:{}});
  pintarResta();
}
const pasoRS = () => RS.plan.pasos[RS.paso];
const piezaRS = (peso, plural) => ({100:["placa", "placas"], 10:["barra", "barras"], 1:["cubito", "cubitos"]})[peso][plural ? 1 : 0];
/* Tocar una pieza del material: romperla (pasa al orden de la derecha) o quitarla al restar */
function tocarPiezaRS(col, k){
  const s = pasoRS(), p = RS.plan;
  if(!s) return;
  if(s.t === "romper" && col === s.de){
    RS.paso++; RS.tono = "aviso";
    RS.aviso = "¡Crac! 1 "+NOMBRES_RS[p.pesos[s.de]][0]+" = 10 "+NOMBRES_RS[p.pesos[s.a]][1]+". Pasan a las "+NOMBRES_RS[p.pesos[s.a]][1]+": escribe cómo queda el "+p.a+".";
  }else if(s.t === "quitar" && col === s.i){
    const l = RS.quitados[col] = RS.quitados[col] || [];
    if(l.includes(k)) return;
    l.push(k); RS.aviso = ""; RS.tono = "";
    if(l.length >= s.n){
      RS.paso++; RS.tono = "bien";
      RS.aviso = "Has quitado "+s.n+" "+nombreRS(p.pesos[col], s.n)+". ¿Cuánto queda?";
    }
  }else return;
  pintarResta();
  const siguiente = pasoRS();
  ($("rsCuerpo").querySelector(".rd-toca:not(.fuera)") || (siguiente && siguiente.t !== "decide" ? $("rsTeclado").querySelector("button") : $("rsCuerpo").querySelector("[data-d]")))?.focus();
}
/* Sin el material a la vista, romper y quitar se hacen solos */
function sinMaterialRS(){
  let s;
  // «Escribir la descomposición» apagado: la descomposición sale hecha y se empieza en «¿se puede quitar?»
  while(!RS.descomponer && (s = pasoRS()) && s.t === "caja" && (s.zona === "a" || s.zona === "b")){ RS.hechas[RS.paso] = s.r; RS.paso++; }
  while(!RS.material && (s = pasoRS()) && (s.t === "romper" || s.t === "quitar")){
    if(s.t === "quitar") RS.quitados[s.i] = Array.from({length:s.n}, (_, k)=> k);
    RS.paso++;
  }
}
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
  if(!s || s.t === "decide" || s.t === "romper" || s.t === "quitar") return;
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
      (RS.plan.da[s.i - 1] === 0 && RS.plan.pesos[s.i - 2] ? ", pero no hay: primero se rompe una "+NOMBRES_RS[RS.plan.pesos[s.i - 2]][0] : "")+".";
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
    $("rsDescomponer").onclick = ()=>{ RS.descomponer = !RS.descomponer; guardarRS(); pintarResta(); };
    $("rsLibre").onclick = ()=>{ RS.escribiendo = !RS.escribiendo; RS.libreAviso = ""; pintarResta(); if(RS.escribiendo) $("rsLibreA")?.focus(); };
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
  sinMaterialRS();
  const c = $("rsCuerpo"), p = RS.plan, s = pasoRS(), fin = !s;
  $("rsNivel").value = nivelRS();
  $("rsMaterial").setAttribute("aria-pressed", RS.material);
  $("rsLibre").setAttribute("aria-pressed", !!RS.escribiendo);
  $("rsDescomponer").setAttribute("aria-pressed", RS.descomponer);
  let h = '';
  if(RS.escribiendo) h += '<form class="rd-libre" id="rsLibreForm"><p>Escribe la resta que quieras (hasta 999):</p>'+
    '<label><span class="sr">Minuendo</span><input id="rsLibreA" inputmode="numeric" autocomplete="off" maxlength="3" placeholder="52" value="'+(RS.libreA || "")+'"></label>'+
    '<span aria-hidden="true">−</span><label><span class="sr">Sustraendo</span><input id="rsLibreB" inputmode="numeric" autocomplete="off" maxlength="3" placeholder="27" value="'+(RS.libreB || "")+'"></label>'+
    '<button class="bt azul" type="submit">Empezar</button><button class="bt" type="button" id="rsLibreCerrar">Cancelar</button>'+
    (RS.libreAviso ? '<p class="rd-libre-aviso" role="alert">'+RS.libreAviso+'</p>' : '')+'</form>';
  h += '<p class="ap-marcador"><span>'+p.a+' − '+p.b+'</span><span class="ap-puntos" aria-label="'+RS.bien+' sin fallos">★ '+RS.bien+'</span></p>';
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
  if(fin) h += verticalRS()+'<div class="pt-acciones"><button class="bt azul" id="rsOtra">Otra resta</button>'+(RS.reto.libre ? '<button class="bt" id="rsOtraLibre">Escribir otra</button>' : '')+'</div>';
  if(RS.material) h += materialHTML();
  c.innerHTML = h;
  $("rsTeclado").hidden = !s || s.t !== "caja" && s.t !== "final";
  c.querySelectorAll(".rd-toca").forEach(b=> b.onclick = ()=> tocarPiezaRS(+b.dataset.col, +b.dataset.k));
  c.querySelectorAll("[data-d]").forEach(b=> b.onclick = ()=> decidirRS(b.dataset.d === "si"));
  $("rsOtra")?.addEventListener("click", nuevoRetoRS);
  $("rsOtraLibre")?.addEventListener("click", ()=>{ RS.escribiendo = true; pintarResta(); $("rsLibreA")?.focus(); });
  const f = $("rsLibreForm");
  if(f){
    f.onsubmit = e=>{ e.preventDefault(); empezarLibreRS($("rsLibreA").value, $("rsLibreB").value); };
    $("rsLibreCerrar").onclick = ()=>{ RS.escribiendo = false; pintarResta(); $("rsLibre").focus(); };
  }
}
const mayusRS = t => t[0].toUpperCase()+t.slice(1);
function queRS(s){
  const p = RS.plan;
  if(s.t === "romper") return "🔨 <b>Toca una "+piezaRS(p.pesos[s.de])+"</b> de las "+NOMBRES_RS[p.pesos[s.de]][1]+" para romperla en 10 "+NOMBRES_RS[p.pesos[s.a]][1]+".";
  if(s.t === "quitar"){
    const ya = (RS.quitados[s.i] || []).length;
    return "Quita <b>"+s.n+" "+nombreRS(p.pesos[s.i], s.n)+"</b>: toca "+s.n+" "+piezaRS(p.pesos[s.i], s.n !== 1)+" <span class=\"rd-llevas\">("+ya+" de "+s.n+")</span>";
  }
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
  return '<div class="rd-mat" role="group" aria-label="Material: '+p.pesos.map((w, i)=> m.cuenta[i]+" "+nombreRS(w, m.cuenta[i])).join(", ")+'">'+p.pesos.map((w, i)=>{
    const n = m.cuenta[i], nuevas = Math.max(0, m.nuevas[i]), quitadas = RS.quitados[i] || [];
    const toca = s && ((s.t === "romper" && s.de === i) || (s.t === "quitar" && s.i === i));
    const piezas = Array.from({length:n}, (_, k)=>{
      const clase = pieza[w]+(k >= n - nuevas ? " nueva" : "")+(quitadas.includes(k) ? " fuera" : "");
      return toca && !quitadas.includes(k) ? '<button class="rd-toca '+clase+'" data-col="'+i+'" data-k="'+k+'" aria-label="'+(s.t === "romper" ? "Romper esta "+piezaRS(w) : "Quitar este "+(w === 1 ? "cubito" : "trozo")+": "+piezaRS(w))+'"></button>' : '<i class="'+clase+'"></i>';
    }).join("");
    const recien = p.eventos.some(e=> e.a === i && e.tras === RS.paso - 1) || (s?.zona === "t" && s.i === i);
    return '<div class="rd-col'+(toca || (s?.i === i && s.t !== "final") ? " activa" : "")+'"><p>'+mayusRS(NOMBRES_RS[w][1])+' <b>'+n+'</b></p><div class="rd-piezas'+(w === 1 ? " cubos" : "")+(toca ? " toca" : "")+(recien ? " llegan" : "")+'">'+piezas+'</div></div>';
  }).join("")+'</div>';
}
/* La misma resta en vertical, como en el cuaderno: las cifras que cambian al romper quedan tachadas */
function verticalRS(){
  const p = RS.plan, cifra = (v, i)=> v / p.pesos[i];
  const res = String(p.a - p.b).padStart(p.nd, " ");
  const cambios = [];
  const arriba = p.pesos.map((_, i)=>{
    const d = cifra(p.da[i], i), f = cifra(p.fin[i], i);
    if(d === f) return '<span class="rd-v-c">'+d+'</span>';
    cambios.push("el "+d+" pasa a "+f);
    return '<span class="rd-v-c"><i>'+f+'</i><s>'+d+'</s></span>';
  }).join("");
  const abajo = p.pesos.map((_, i)=> '<span class="rd-v-c">'+(p.b >= p.pesos[i] || i === p.nd - 1 ? cifra(p.db[i], i) : "")+'</span>').join("");
  return '<div class="rd-vertical"><p>En el cuaderno, en vertical:</p><div class="rd-v" aria-label="'+p.a+' menos '+p.b+' en vertical: '+(cambios.length ? cambios.join(", ")+"; " : "")+'resultado '+(p.a - p.b)+'">'+
    '<div class="rd-v-fila">'+arriba+'</div><div class="rd-v-fila rd-v-menos"><span class="rd-v-signo">−</span>'+abajo+'</div>'+
    '<div class="rd-v-fila rd-v-res">'+[...res].map(c=> '<span class="rd-v-c">'+c.trim()+'</span>').join("")+'</div></div>'+
    (cambios.length ? '<p class="rd-v-nota">Lo tachado es lo que has roto: '+cambios.join(" y ")+'.</p>' : '<p class="rd-v-nota">No ha hecho falta romper nada.</p>')+'</div>';
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
