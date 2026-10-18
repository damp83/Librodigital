/* =====================================================================
   SUMAS QUE PASAN DE 100 (#/cien)
   Dos estrategias de las presentaciones de 2.º para sumas cuyo resultado pasa de 100:
   - «Busco el 100» (Detectives del 100): al 70 le faltan 30 para el 100; rompo el 50 en 30 y 20;
     70 + 50 = 100 + 20 = 120. Se ve en la placa del 100: lo que falta queda marcado y se rellena con la
     parte que se rompe. Niveles: con dieces (70 + 50) y casi 100 (97 + 8, 96 + 25).
   - «Superárbol» (la suma en árbol de tres cifras): separo en dieces y unos, sumo los dieces (si son 10 o
     más, 10 naranjas forman la placa del 100), sumo los unos (si llegan a 10, nace un diez nuevo) y junto.
     Niveles: sin placa (37 + 12), con placa (62 + 56) y doble reagrupación (75 + 76).
   Se responde paso a paso con el teclado; pista en cada paso. Los casos salen del banco (banco.js).
   Usa las utilidades de index.html, herramientas.js, aula.js y aproximar.js ($, leer, guardar, esc, REGLETA, apTeclado…).
   ===================================================================== */

const CI = Object.assign({modo:"cien", nivel:{cien:"dieces", arbol:"placa"}}, leer("aula-cien", {}),
  {caso:null, paso:0, escrito:"", aviso:"", pista:false, hechos:0, fallos:0});
let cienListo = false;
const guardarCI = () => guardar("aula-cien", {modo:CI.modo, nivel:CI.nivel});
const NIVELES_CI = {
  cien:  {dieces:"Con dieces (70 + 50)", casi:"Casi 100 (97 + 8)", mezcla:"Mezcla"},
  arbol: {sin:"Sin placa (37 + 12)", placa:"Se forma la placa (62 + 56)", doble:"Doble reagrupación (75 + 76)", mezcla:"Mezcla"}};

/* ---------- Los casos ---------- */
const listasCI = {};
function listaCI(modo, nivel){
  const clave = modo+"-"+nivel;
  if(listasCI[clave]) return listasCI[clave];
  const l = [];
  if(modo === "cien"){
    if(nivel !== "casi") for(let a=60; a<=90; a+=10) for(let b=20; b<=a; b+=10) if(a + b > 100) l.push({k:"d"+a+"+"+b, a, b});
    if(nivel !== "dieces") for(let a=91; a<=99; a++) for(let b=2; b<=29; b++) if(a + b > 100 && b % 10) l.push({k:"c"+a+"+"+b, a, b});
  }else{
    for(let a=11; a<=99; a++) for(let b=11; b<=a; b++){
      if(a % 10 === 0 || b % 10 === 0) continue;
      const dieces = (Math.floor(a/10) + Math.floor(b/10)) * 10, unos = a % 10 + b % 10;
      const tipo = dieces < 100 ? (unos < 10 ? "sin" : null) : unos < 10 ? "placa" : "doble";
      if(tipo && (nivel === "mezcla" || nivel === tipo)) l.push({k:"a"+a+"+"+b, a, b});
    }
  }
  return listasCI[clave] = l;
}
/* Los pasos de cada caso: texto antes del hueco, respuesta, texto después y una pista */
function pasosCI(c){
  const {a, b} = c;
  if(CI.modo === "cien"){
    const falta = 100 - a, sobra = b - falta;
    return [
      {antes:"Al "+a+" le faltan", r:falta, despues:"para llegar a 100", pista:"Cuenta las casillas vacías de la placa. "+(a % 10 ? "Primero hasta el "+(Math.ceil(a/10)*10)+" y luego de 10 en 10." : "Piensa en los amigos del 10: "+a/10+" + "+falta/10+" = 10, así que "+a+" + "+falta+" = 100.")},
      {antes:"Rompo el "+b+" en "+falta+" y", r:sobra, despues:"", pista:b+" = "+falta+" + ?  ¿Cuánto le falta al "+falta+" para llegar al "+b+"?"},
      {antes:a+" + "+b+" = 100 + "+sobra+" =", r:a + b, despues:"", pista:"Ya tienes el 100: súmale lo que ha sobrado, el "+sobra+"."}];
  }
  const da = Math.floor(a/10)*10, db = Math.floor(b/10)*10, ua = a % 10, ub = b % 10, dieces = da + db, unos = ua + ub;
  const pasos = [
    {antes:"Dieces: "+da+" + "+db+" =", r:dieces, despues:"", pista:"Usa el truco del cero: "+da/10+" + "+db/10+" = "+(dieces/10)+", así que "+da+" + "+db+" = "+dieces+"."+(dieces >= 100 ? " ¡10 naranjas forman la placa del 100!" : "")},
    {antes:"Unos: "+ua+" + "+ub+" =", r:unos, despues:"", pista:"Suma las dos regletas de los unos: "+ua+" + "+ub+"."}];
  if(unos >= 10){
    pasos.push({antes:"El "+unos+" esconde un diez nuevo: "+unos+" = 10 +", r:unos - 10, despues:"", pista:unos+" son 10 y "+(unos-10)+" más."});
    pasos.push({antes:"El diez nuevo se va con los dieces: "+dieces+" + 10 =", r:dieces + 10, despues:"", pista:"Diez más: "+dieces+" + 10."});
    pasos.push({antes:"Total: "+(dieces + 10)+" + "+(unos - 10)+" =", r:a + b, despues:"", pista:"Junta los dieces y los unos que quedan."});
  }else pasos.push({antes:"Total: "+dieces+" + "+unos+" =", r:a + b, despues:"", pista:"Junta los dieces y los unos: "+dieces+" y "+unos+"."});
  return pasos;
}
function nuevoCasoCI(){
  const nivel = CI.nivel[CI.modo];
  CI.caso = Object.assign({}, delMazo("ci-"+CI.modo+"-"+nivel, listaCI(CI.modo, nivel)));
  Object.assign(CI, {paso:0, escrito:"", aviso:"", pista:false, fallos:0});
  pintarCien();
}

/* ---------- Vista ---------- */
function iniciarCien(){
  if(!cienListo){
    cienListo = true;
    pintarIconos($("vCien"));
    document.querySelectorAll("#vCien .segmentos button").forEach(b=> b.onclick = ()=>{ CI.modo = b.dataset.modo; guardarCI(); nuevoCasoCI(); });
    $("ciNivel").onchange = e=>{ CI.nivel[CI.modo] = e.target.value; guardarCI(); nuevoCasoCI(); };
    apTeclado("ciTeclado", teclaCI);
    $("ciImprimir").onclick = imprimirCien;
    if(document.fullscreenEnabled) $("ciPantalla").onclick = ()=> pantallaCompleta("vCien"); else $("ciPantalla").hidden = true;
  }
  if(!CI.caso) nuevoCasoCI(); else pintarCien();
}

/* La placa del 100 con el primer número (y lo que falta marcado), y el segundo número en regletas */
function placaCI(c){
  const falta = 100 - c.a, hecho = CI.paso >= 2, sobra = c.b - falta;
  let celdas = "";
  for(let i=0; i<100; i++){
    const fila = Math.floor(i/10), col = i % 10;   // las filas son las naranjas; la última fila incompleta es la regleta de los unos
    let clase = "ci-celda", color = "";
    if(i < c.a){ const resto = c.a - fila*10; color = REGLETA[resto >= 10 ? 10 : resto].c; }
    else if(hecho){ clase += " rellena"; color = REGLETA[falta >= 10 ? 10 : falta].c; }   // la parte del segundo número que completa el 100
    else clase += " falta";
    celdas += '<i class="'+clase+'"'+(color ? ' style="background:'+color+'"' : '')+'></i>';
  }
  const piezas = v => {   // un número en regletas verticales: dieces naranjas y la de los unos
    const l = [...Array(Math.floor(v/10)).fill(10), ...(v % 10 ? [v % 10] : [])];
    return l.map(n=> '<i class="ci-barra" style="--n:'+n+';background:'+REGLETA[n].c+';color:'+REGLETA[n].t+'">'+n+'</i>').join("");
  };
  const derecha = CI.paso < 2
    ? '<div class="ci-pila"><b>'+c.b+'</b><div class="ci-barras">'+piezas(c.b)+'</div></div>'
    : '<div class="ci-pila"><b>sobran '+sobra+'</b><div class="ci-barras">'+piezas(sobra)+'</div></div>';
  return '<div class="ci-material" role="img" aria-label="Placa del 100 con el '+c.a+(hecho ? " completada con "+falta+" del "+c.b+"; sobran "+sobra : "; le faltan casillas hasta el 100")+'">'+
    '<div class="ci-pila"><b>'+(hecho ? "100" : c.a)+'</b><div class="ci-placa">'+celdas+'</div></div><span class="ci-mas">+</span>'+derecha+'</div>';
}
/* El superárbol: los dos números, sus ramas (dieces y unos) y los resultados que ya se han encontrado */
function arbolCI(c){
  const da = Math.floor(c.a/10)*10, db = Math.floor(c.b/10)*10, ua = c.a % 10, ub = c.b % 10, pasos = pasosCI(c);
  const val = i => i < CI.paso ? pasos[i].r : "?";
  const caja = (x, y, w, txt, clase) => '<rect x="'+(x - w/2)+'" y="'+(y - 26)+'" width="'+w+'" height="52" rx="12" class="ci-caja '+(clase || "")+'"/><text x="'+x+'" y="'+(y + 11)+'" class="ci-num">'+txt+'</text>';
  const linea = (x1, y1, x2, y2) => '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="ci-rama"/>';
  const doble = pasos.length === 5, totalIdx = pasos.length - 1;
  let s = '<svg class="ci-arbol" viewBox="0 0 800 '+(doble ? 470 : 400)+'" role="img" aria-label="Suma en árbol de '+c.a+' más '+c.b+'">';
  s += linea(250, 70, 180, 140) + linea(250, 70, 320, 140) + linea(550, 70, 480, 140) + linea(550, 70, 620, 140);
  s += linea(180, 180, 300, 250) + linea(480, 180, 300, 250) + linea(320, 180, 560, 250) + linea(620, 180, 560, 250);
  s += caja(250, 44, 120, c.a, "tronco") + '<text x="400" y="56" class="ci-num">+</text>' + caja(550, 44, 120, c.b, "tronco");
  s += caja(180, 160, 96, da, "diez") + caja(320, 160, 80, ua, "uno") + caja(480, 160, 96, db, "diez") + caja(620, 160, 80, ub, "uno");
  s += caja(300, 276, 150, val(0), "diez" + (CI.paso === 0 ? " activa" : "")) + caja(560, 276, 130, val(1), "uno" + (CI.paso === 1 ? " activa" : ""));
  if(doble){
    s += linea(560, 302, 300, 360) + linea(300, 302, 300, 360);
    s += caja(560, 386, 150, CI.paso > 2 ? "10 + "+pasos[2].r : "?", "uno" + (CI.paso === 2 ? " activa" : ""));
    s += caja(300, 386, 150, val(3), "diez" + (CI.paso === 3 ? " activa" : ""));
    s += linea(300, 412, 430, 440) + linea(560, 412, 430, 440);
  }else s += linea(300, 302, 430, 340) + linea(560, 302, 430, 340);
  const yT = doble ? 444 : 366;
  s += caja(430, yT - 4, 170, val(totalIdx), "total" + (CI.paso === totalIdx ? " activa" : ""));
  return s + '</svg>';
}
/* El material que va saliendo en el superárbol: placas, naranjas y unidades */
function materialArbol(c){
  if(CI.paso < 1) return "";
  const pasos = pasosCI(c), dieces = pasos[0].r, unos = CI.paso >= 2 ? pasos[1].r : null;
  const totalD = CI.paso > 2 && pasos.length === 5 ? dieces + 10 : dieces, uFinal = unos === null ? null : (unos >= 10 && CI.paso > 2 ? unos - 10 : unos);
  const placas = Math.floor(totalD / 100), naranjas = (totalD % 100) / 10;
  let h = '<div class="ci-mat">';
  h += Array(placas).fill('<i class="ci-mplaca" aria-hidden="true"></i>').join("");
  h += Array(naranjas).fill('<i class="ci-mbarra" style="background:'+REGLETA[10].c+'" aria-hidden="true"></i>').join("");
  if(uFinal) h += '<i class="ci-muno" style="--n:'+Math.min(uFinal, 10)+';background:'+REGLETA[Math.min(uFinal, 10)].c+'" aria-hidden="true"></i>'+(uFinal > 10 ? '<i class="ci-muno" style="--n:'+(uFinal-10)+';background:'+REGLETA[uFinal-10].c+'" aria-hidden="true"></i>' : '');
  const partes = [placas ? placas+(placas > 1 ? " placas" : " placa") : "", naranjas ? naranjas+(naranjas > 1 ? " naranjas" : " naranja") : "", uFinal ? uFinal+(uFinal > 1 ? " unidades" : " unidad") : ""].filter(Boolean);
  return h + '<span>'+partes.join(" · ")+'</span></div>';
}

function pintarCien(){
  const c = CI.caso, pasos = pasosCI(c), nivel = CI.nivel[CI.modo], cuerpo = $("ciCuerpo");
  document.querySelectorAll("#vCien .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === CI.modo));
  $("ciNivel").innerHTML = Object.entries(NIVELES_CI[CI.modo]).map(([k,v])=> '<option value="'+k+'"'+(k === nivel ? " selected" : "")+'>'+v+'</option>').join("");
  $("ciHechos").textContent = CI.hechos ? "★ "+CI.hechos+(CI.hechos === 1 ? " suma resuelta" : " sumas resueltas") : "";
  const terminado = CI.paso >= pasos.length;
  let h = '<p class="ap-pregunta">'+(terminado ? c.a+" + "+c.b+" = <b>"+(c.a + c.b)+"</b>" : c.a+" + "+c.b+" = <b>?</b>")+'</p>';
  h += CI.modo === "cien" ? placaCI(c) : arbolCI(c) + materialArbol(c);
  h += '<div class="ap-pasos ci-pasos">';
  pasos.forEach((p, i)=>{
    if(i > CI.paso) return;
    const actual = i === CI.paso;
    h += '<p>'+esc(p.antes)+' <span class="ap-campo'+(actual ? " activo"+(CI.aviso ? " mal" : "") : " bien")+'">'+(actual ? (CI.escrito || "?") : p.r)+'</span>'+(p.despues ? " "+esc(p.despues) : "")+'</p>';
  });
  h += '</div>';
  if(terminado){
    h += '<p class="ap-explica bien" role="status">¡Muy bien! '+(CI.modo === "cien" ? c.a+" + "+c.b+" = 100 + "+(c.b - 100 + c.a)+" = "+(c.a + c.b) : c.a+" + "+c.b+" = "+(c.a + c.b))+(CI.fallos ? "" : " · sin ningún fallo")+'</p>'+
         '<div class="pt-acciones"><button class="bt azul" id="ciNueva">Otra suma</button></div>';
  }else{
    if(CI.aviso) h += '<p class="ap-explica mal" role="status">'+esc(CI.aviso)+'</p>';
    else if(CI.pista) h += '<p class="ap-pista" role="status">'+esc(pasos[CI.paso].pista)+'</p>';
    h += '<div class="pt-acciones"><button class="bt suave" id="ciPista" aria-pressed="'+CI.pista+'">Pista</button><button class="bt suave" id="ciNueva">Otra suma</button></div>';
  }
  cuerpo.innerHTML = h;
  $("ciTeclado").hidden = terminado;
  $("ciNueva").onclick = nuevoCasoCI;
  $("ciPista")?.addEventListener("click", ()=>{ CI.pista = !CI.pista; CI.aviso = ""; pintarCien(); });
}
/* ---------- Ficha en papel: 6 sumas de la estrategia y el nivel elegidos, con sus soluciones ---------- */
function imprimirCien(){
  const nivel = CI.nivel[CI.modo], lista = listaCI(CI.modo, nivel), casos = [], vistos = new Set();
  for(let t=0; casos.length < 6 && t < 200; t++){ const c = delMazo("ci-ficha-"+CI.modo+"-"+nivel, lista); if(!vistos.has(c.k)){ vistos.add(c.k); casos.push(c); } }
  const caja = (v, sol) => '<span class="hj-caja'+(sol ? " llena" : "")+'">'+(sol ? v : "")+'</span>';
  const placa = c => {   // la placa del 100 con el primer número y lo que falta, y el segundo número en regletas
    let celdas = "";
    for(let i=0; i<100; i++){ const fila = Math.floor(i/10), resto = c.a - fila*10;
      celdas += i < c.a ? '<i style="background:'+REGLETA[resto >= 10 ? 10 : resto].c+'"></i>' : '<i class="falta"></i>'; }
    const barras = [...Array(Math.floor(c.b/10)).fill(10), ...(c.b % 10 ? [c.b % 10] : [])].map(n=> '<i style="height:'+(n*2.2)+'mm;background:'+REGLETA[n].c+'"></i>').join("");
    return '<div class="hj-placa-fila"><div class="hj-placa">'+celdas+'</div><b>+</b><div class="hj-pbarras">'+barras+'</div></div>';
  };
  const arbol = (c, sol) => {   // el superárbol con los huecos
    const p = pasosCI(c), doble = p.length === 5, da = Math.floor(c.a/10)*10, db = Math.floor(c.b/10)*10;
    const t = (x, y, w, v, fijo) => '<rect x="'+(x - w/2)+'" y="'+(y - 22)+'" width="'+w+'" height="44" rx="9" class="hj-acaja'+(fijo ? " fija" : "")+'"/>'+
      (fijo || sol ? '<text x="'+x+'" y="'+(y + 10)+'" class="hj-anum'+(fijo ? "" : " sol")+'">'+v+'</text>' : "");
    const l = (x1, y1, x2, y2) => '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>';
    let s = '<svg class="hj-arbol" viewBox="120 12 560 '+(doble ? 456 : 384)+'"><g class="hj-aramas">'+
      l(250, 64, 180, 138) + l(250, 64, 320, 138) + l(550, 64, 480, 138) + l(550, 64, 620, 138) + l(180, 182, 300, 254) + l(480, 182, 300, 254) + l(320, 182, 560, 254) + l(620, 182, 560, 254);
    s += doble ? l(560, 298, 300, 364) + l(300, 298, 300, 364) + l(300, 408, 430, 440) + l(560, 408, 430, 440) : l(300, 298, 430, 344) + l(560, 298, 430, 344);
    s += '</g>' + t(250, 42, 120, c.a, true) + '<text x="400" y="54" class="hj-anum">+</text>' + t(550, 42, 120, c.b, true);
    s += t(180, 160, 96, da) + t(320, 160, 80, c.a % 10) + t(480, 160, 96, db) + t(620, 160, 80, c.b % 10) + t(300, 276, 150, p[0].r) + t(560, 276, 130, p[1].r);
    if(doble) s += t(560, 386, 150, "10 + "+p[2].r) + t(300, 386, 150, p[3].r);
    return s + t(430, doble ? 440 : 366, 170, c.a + c.b) + '</svg>';
  };
  const ficha = (c, i, sol) => {
    const p = pasosCI(c);
    let h = '<div class="hj-caso"><p class="hj-caso-tit"><span class="hj-n">'+(i+1)+'</span><b>'+c.a+' + '+c.b+'</b></p>';
    if(CI.modo === "cien") h += placa(c) + '<p>Al '+c.a+' le faltan '+caja(p[0].r, sol)+' para 100.</p><p>Rompo el '+c.b+' en '+caja(p[0].r, sol)+' y '+caja(p[1].r, sol)+'.</p>'+
      '<p>'+c.a+' + '+c.b+' = 100 + '+caja(p[1].r, sol)+' = '+caja(c.a + c.b, sol)+'</p>';
    else h += arbol(c, sol);
    return h + '</div>';
  };
  const titulo = CI.modo === "cien" ? "Busco el 100" : "El superárbol", sub = NIVELES_CI[CI.modo][nivel];
  const instr = CI.modo === "cien" ? '<p>1 · ¿Cuánto le falta al primer número para llegar a 100? (cuenta las casillas vacías) 2 · Rompe el otro número para sacar justo esa parte. 3 · Forma el 100 y suma lo que ha sobrado.</p>'
    : '<p>1 · Separa cada número en dieces y unos. 2 · Suma los dieces: 10 naranjas forman la placa del 100. 3 · Suma los unos: si llegan a 10, nace un diez nuevo. 4 · Junta todo.</p>';
  $("impresion").innerHTML =
    hojaPapel({titulo, sub:"Sumas que pasan de 100 · "+sub, eti:"2.º", pagina:1, paginas:2, datos:[["Nombre", "", 3.2], ["Fecha", "", 1.4], ["Aciertos", "&nbsp;&nbsp;&nbsp;&nbsp; / 6", 1.2]],
      instrucciones:instr, cuerpo:'<div class="hj-casos">'+casos.map((c, i)=> ficha(c, i, false)).join("")+'</div>'})+
    hojaPapel({titulo:"Soluciones", sub:titulo+" · "+sub+" · las mismas sumas de la ficha", eti:"Para el docente", docente:true, pagina:2, paginas:2,
      cuerpo:'<div class="hj-casos">'+casos.map((c, i)=> ficha(c, i, true)).join("")+'</div>'});
  lanzarImpresion();
}
function teclaCI(t){
  const pasos = pasosCI(CI.caso), p = pasos[CI.paso];
  if(!p) return;
  if(t === "⌫"){ CI.escrito = CI.escrito.slice(0, -1); CI.aviso = ""; }
  else if(t !== "✓"){ if(CI.escrito.length < 3){ CI.escrito += t; CI.aviso = ""; } }
  else if(CI.escrito){
    if(+CI.escrito === p.r){ CI.paso++; CI.pista = false; CI.aviso = ""; if(CI.paso >= pasos.length) CI.hechos++; }
    else{ CI.fallos++; CI.aviso = CI.escrito+" no es. "+p.pista; }
    CI.escrito = "";
  }
  pintarCien();
  if(CI.paso >= pasos.length) $("ciNueva")?.focus();
}
function tecladoCien(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if(/^[0-9]$/.test(e.key)){ e.preventDefault(); teclaCI(e.key); }
  else if(e.key === "Backspace"){ e.preventDefault(); teclaCI("⌫"); }
  else if(e.key === "Enter" && e.target.tagName !== "BUTTON"){ e.preventDefault(); CI.paso >= pasosCI(CI.caso).length ? nuevoCasoCI() : teclaCI("✓"); }
}
