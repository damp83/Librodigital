/* =====================================================================
   EL DINERO (#/dinero)
   Monedas y billetes de euro para contar, pagar y calcular la vuelta: fotos oficiales del Banco Central Europeo
   (cartel «Billetes de la serie Europa / Las monedas en euros»; los billetes llevan «specimen», como piden sus
   normas de reproducción, y se ven más pequeños que los reales) o dibujos sencillos, a elegir.
   Las monedas y los billetes guardan la proporción de su tamaño real.
   - Libre: tocar monedas y billetes para ponerlos en la mesa; se ve cuánto hay.
   - ¿Cuánto hay?: un monton de monedas y billetes; se escribe el total.
   - Paga justo: algo cuesta un precio; se paga con las monedas y billetes de la caja. Al acertar, se dice
     con cuántas piezas se podía pagar como mínimo.
   - La vuelta: se paga con un billete; ¿cuánto te devuelven? (contando hacia arriba).
   Niveles: hasta 20 €, hasta 100 €, números de tres cifras (hasta 500 €) y con céntimos (hasta 10 €).
   Los precios y los montones salen del banco (banco.js): no se repiten. Todo se cuenta en céntimos por dentro. Usa las utilidades de index.html, herramientas.js, aula.js y
   aproximar.js ($, leer, guardar, esc, azar, barajar, apTeclado…).
   ===================================================================== */

const DN = Object.assign({modo:"contar", nivel:"e100", verTotal:true, fotos:true}, leer("aula-dinero", {}),
  {mesa:[], reto:null, escrito:"", respuesta:null, aviso:"", hechos:0});
let dineroListo = false, dnSig = 1;
const guardarDN = () => guardar("aula-dinero", {modo:DN.modo, nivel:DN.nivel, verTotal:DN.verTotal, fotos:DN.fotos});
/* Tamaño real en milímetros: diámetro de las monedas y ancho de los billetes */
const MM_DN = {1:16.25, 2:18.75, 5:21.25, 10:19.75, 20:22.25, 50:24.25, 100:23.25, 200:25.75, 500:120, 1000:127, 2000:133, 5000:140, 10000:147, 20000:153};
const NIVELES_DN = {
  e20:  {txt:"Hasta 20 €",            piezas:[100, 200, 500, 1000, 2000],            min:300,   max:2000,  paso:100},
  e100: {txt:"Hasta 100 €",           piezas:[100, 200, 500, 1000, 2000, 5000],      min:1100,  max:10000, paso:100},
  e500: {txt:"Tres cifras (hasta 500 €)", piezas:[500, 1000, 2000, 5000, 10000, 20000], min:10500, max:50000, paso:500},
  cent: {txt:"Con céntimos (hasta 10 €)", piezas:[5, 10, 20, 50, 100, 200, 500],    min:35,    max:1000,  paso:5}};
const COSAS_DN = [["🎈","un globo"], ["⚽","un balón"], ["📚","unos libros"], ["🧸","un osito"], ["🍎","unas manzanas"], ["🖍️","unas ceras"], ["🎨","unas pinturas"],
  ["🚲","una bici"], ["🎮","un videojuego"], ["👟","unas zapatillas"], ["🪁","una cometa"], ["🎒","una mochila"], ["🧩","un puzle"], ["🎸","una guitarra"]];

/* ---------- Dinero en texto y dibujado ---------- */
const euros = c => c % 100 ? (Math.floor(c/100) ? Math.floor(c/100)+","+String(c % 100).padStart(2, "0")+"\u00a0€" : c+"\u00a0céntimos") : (c/100)+"\u00a0€";
const eurosCorto = c => c % 100 ? Math.floor(c/100)+","+String(c % 100).padStart(2, "0")+"\u00a0€" : (c/100)+"\u00a0€";   // 0,40 € (cabe en una casilla)
const esBillete = v => v >= 500;
function piezaDN(v, atributos){
  const nombre = esBillete(v) ? "Billete de "+v/100+" euros" : v >= 100 ? "Moneda de "+v/100+(v === 100 ? " euro" : " euros") : "Moneda de "+v+" céntimos";
  const texto = v >= 100 ? v/100+" €" : v+" c";
  if(DN.fotos) return '<span class="dn-pieza foto '+(esBillete(v) ? "billete" : "moneda")+'" style="--mm:'+MM_DN[v]+'" '+(atributos || "")+' role="img" aria-label="'+nombre+'">'+
    '<img src="dinero/'+(esBillete(v) ? "b"+v/100+".jpg" : "m"+v+".png")+'" alt="" draggable="false"></span>';
  return '<span class="dn-pieza '+(esBillete(v) ? "billete b"+v/100 : "moneda m"+v)+'" '+(atributos || "")+' role="img" aria-label="'+nombre+'"><b>'+texto+'</b></span>';
}
/* El menor número de piezas para pagar justo (con euros vale ir cogiendo siempre la más grande que quepa) */
function minimoPiezas(c, piezas){
  const l = []; let resto = c;
  for(const v of piezas.slice().sort((a,b)=> b - a)) while(resto >= v){ l.push(v); resto -= v; }
  return resto ? null : l;
}

/* ---------- Los retos ---------- */
/* Del banco (banco.js): los precios salen de un mazo con todos los del nivel y no se repiten hasta agotarlo;
   los montones para contar no repiten ninguno de los últimos 150 */
const listasDN = {};
function preciosDN(nivel, maximo){
  const n = NIVELES_DN[nivel], clave = nivel+"-"+maximo;
  if(!listasDN[clave]){ listasDN[clave] = []; for(let c=n.min; c<=maximo; c+=n.paso) listasDN[clave].push({k:"p"+c, c}); }
  return listasDN[clave];
}
const precioDN = (modo, maximo) => delMazo("dn-"+modo+"-"+DN.nivel, preciosDN(DN.nivel, maximo || NIVELES_DN[DN.nivel].max)).c;
function generarMontonDN(){   // de 3 a 7 monedas y billetes del nivel, con un total dentro del nivel
  const n = NIVELES_DN[DN.nivel];
  let total = 0, monton = [];
  for(let t=0; t<50; t++){
    monton = Array.from({length: azar(3, DN.nivel === "e500" ? 6 : 7)}, ()=> n.piezas[azar(0, n.piezas.length - 1)]).sort((a,b)=> b - a);
    total = monton.reduce((s,v)=> s + v, 0);
    if(total >= n.min / 2 && total <= n.max) break;
  }
  return {k: monton.join("+"), monton, total};
}
/* El pago en piezas: el billete de 500 € ya no se fabrica (y no hay foto), así que 500 € se pagan con 200 + 200 + 100 */
const piezasPagoDN = pago => pago > 20000 ? minimoPiezas(pago, [20000, 10000, 5000]) : [pago];
function compraVueltaDN(){   // una compra para calcular la vuelta: se paga con el billete más pequeño que llega, o a veces con el siguiente
  const n = NIVELES_DN[DN.nivel], [icono, cosa] = COSAS_DN[azar(0, COSAS_DN.length - 1)];
  const precio = precioDN("vuelta", n.max - n.paso);
  const pagos = (DN.nivel === "cent" ? [100, 200, 500, 1000, 2000] : [500, 1000, 2000, 5000, 10000, 20000, 50000]).filter(v=> v > precio);
  const pago = pagos[Math.random() < .3 && pagos.length > 1 ? 1 : 0];
  return {icono, cosa, precio, pago, vuelta: pago - precio};
}
function nuevoRetoDN(){
  const n = NIVELES_DN[DN.nivel];
  Object.assign(DN, {mesa:[], escrito:"", respuesta:null, aviso:""});
  if(DN.modo === "contar"){
    const {monton, total} = sinRepetir("dn-contar-"+DN.nivel, generarMontonDN, 150);
    DN.reto = {monton, total, opciones: DN.nivel === "cent" ? opcionesCent(total) : null};
  }else if(DN.modo === "pagar"){
    const [icono, cosa] = COSAS_DN[azar(0, COSAS_DN.length - 1)];
    DN.reto = {icono, cosa, precio: precioDN("pagar")};
  }else if(DN.modo === "vuelta"){
    const r = compraVueltaDN();
    DN.reto = Object.assign(r, {opciones: DN.nivel === "cent" ? opcionesCent(r.vuelta) : null});
  }else DN.reto = {};
  pintarDinero();
}
function opcionesCent(c){   // con céntimos se elige entre tres (los errores típicos: 10 céntimos más o menos, un euro más o menos)
  const o = new Set([c]);
  for(const x of barajar([c + 10, c - 10, c + 100, c - 100, c + 5, c - 5])) if(o.size < 3 && x > 0) o.add(x);
  return barajar([...o]);
}

/* ---------- Vista ---------- */
function iniciarDinero(){
  if(!dineroListo){
    dineroListo = true;
    pintarIconos($("vDinero"));
    $("dnNivel").innerHTML = Object.entries(NIVELES_DN).map(([k,v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("dnNivel").onchange = e=>{ DN.nivel = e.target.value; guardarDN(); nuevoRetoDN(); };
    document.querySelectorAll("#vDinero .segmentos button").forEach(b=> b.onclick = ()=>{ DN.modo = b.dataset.modo; guardarDN(); nuevoRetoDN(); });
    $("dnTotal").onclick = ()=>{ DN.verTotal = !DN.verTotal; guardarDN(); pintarDinero(); };
    $("dnImprimir").onclick = imprimirDinero;
    $("dnFotos").onclick = ()=>{ DN.fotos = !DN.fotos; guardarDN(); pintarDinero(); };
    apTeclado("dnTeclado", teclaDN);
    if(document.fullscreenEnabled) $("dnPantalla").onclick = ()=> pantallaCompleta("vDinero"); else $("dnPantalla").hidden = true;
  }
  if(!DN.reto) nuevoRetoDN(); else pintarDinero();
}
const sumaMesa = () => DN.mesa.reduce((s,p)=> s + p.v, 0);
function cajaDN(){   // la caja con una pieza de cada clase: tocar pone una en la mesa
  return '<div class="dn-caja" role="group" aria-label="Caja de monedas y billetes: toca para ponerlos en la mesa">'+
    NIVELES_DN[DN.nivel].piezas.map(v=> '<button class="dn-coger" data-v="'+v+'">'+piezaDN(v)+'</button>').join("")+'</div>';
}
function mesaDN(titulo){
  const total = sumaMesa();
  return '<section class="dn-mesa" aria-label="'+titulo+'"><h2>'+titulo+(DN.verTotal ? ' · <b aria-live="polite">'+euros(total)+'</b>' : '')+'</h2><div class="dn-piezas">'+
    (DN.mesa.length ? DN.mesa.slice().sort((a,b)=> b.v - a.v).map(p=> '<button class="dn-quitar" data-id="'+p.id+'" aria-label="Quitar: '+(esBillete(p.v) ? "billete" : "moneda")+' de '+euros(p.v)+'">'+piezaDN(p.v, 'aria-hidden="true"')+'</button>').join("")
      : '<span class="ne-vacio">Toca las monedas y billetes de la caja</span>')+'</div></section>';
}

function pintarDinero(){
  const r = DN.reto, c = $("dnCuerpo"), respondido = DN.respuesta !== null;
  $("dnNivel").value = DN.nivel;
  document.querySelectorAll("#vDinero .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === DN.modo));
  $("dnTotal").setAttribute("aria-pressed", DN.verTotal); $("dnFotos").setAttribute("aria-pressed", DN.fotos);
  $("dnHechos").textContent = DN.hechos ? "★ "+DN.hechos : "";
  let h = "", teclado = false;
  const entrada = (texto, bien) => '<p class="ap-escrito ne-escrito'+(respondido ? (bien ? " bien" : " mal") : DN.aviso ? " mal" : "")+'" aria-live="polite">'+texto+' <b>'+
    (respondido ? euros(DN.respuesta) : DN.escrito ? DN.escrito+" €" : "?")+'</b></p>';
  if(DN.modo === "libre"){
    h = '<p class="ap-pregunta">Juega con el dinero</p>'+cajaDN()+mesaDN("En la mesa")+
        '<div class="pt-acciones"><button class="bt suave" id="dnVaciar">Vaciar la mesa</button></div>';
  }else if(DN.modo === "contar"){
    h = '<p class="ap-pregunta">¿Cuánto dinero hay?</p><div class="dn-monton">'+r.monton.map(v=> piezaDN(v)).join("")+'</div>';
    if(r.opciones) h += '<div class="ap-opciones">'+r.opciones.map(x=>{
      const clase = !respondido ? "" : x === r.total ? " bien" : x === DN.respuesta ? " mal" : "";
      return '<button class="ap-opcion texto'+clase+'" data-c="'+x+'"'+(respondido ? " disabled" : "")+'>'+euros(x)+'</button>'; }).join("")+'</div>';
    else{ h += entrada("Hay", DN.respuesta === r.total); teclado = !respondido; }
    if(respondido) h += explicaDN(DN.respuesta === r.total, "Hay "+euros(r.total)+": "+agrupar(r.monton)+".");
  }else if(DN.modo === "pagar"){
    const total = sumaMesa();
    h = '<p class="ap-pregunta"><span class="dn-cosa" aria-hidden="true">'+r.icono+'</span> '+mayusculaDN(r.cosa)+(/^un[oa]s /.test(r.cosa) ? " cuestan" : " cuesta")+' <b>'+euros(r.precio)+'</b>. Paga justo.</p>'+cajaDN()+mesaDN("Lo que pagas");
    if(respondido){
      const minimo = minimoPiezas(r.precio, NIVELES_DN[DN.nivel].piezas);
      h += explicaDN(true, "¡Justo "+euros(r.precio)+"! Has usado "+DN.respuesta+(DN.respuesta === 1 ? " pieza" : " piezas")+
        (minimo && minimo.length < DN.respuesta ? ". Se puede pagar con solo "+minimo.length+": "+minimo.map(euros).join(" + ")+"." : ". ¡Con las menos piezas posibles!"));
    }else{
      if(DN.aviso) h += '<p class="ap-explica mal" role="status">'+esc(DN.aviso)+'</p>';
      h += '<div class="pt-acciones"><button class="bt azul" id="dnPagar"'+(total ? "" : " disabled")+'>Pagar</button><button class="bt suave" id="dnVaciar">Vaciar</button><button class="bt suave" id="dnOtro">Otra compra</button></div>';
    }
  }else if(DN.modo === "vuelta"){
    h = '<p class="ap-pregunta"><span class="dn-cosa" aria-hidden="true">'+r.icono+'</span> '+mayusculaDN(r.cosa)+(/^un[oa]s /.test(r.cosa) ? " cuestan" : " cuesta")+' <b>'+euros(r.precio)+'</b>. Pagas con:</p>'+
        '<div class="dn-monton">'+piezasPagoDN(r.pago).map(v=> piezaDN(v)).join("")+'</div><p class="ap-pregunta">¿Cuánto te devuelven?</p>';
    if(r.opciones) h += '<div class="ap-opciones">'+r.opciones.map(x=>{
      const clase = !respondido ? "" : x === r.vuelta ? " bien" : x === DN.respuesta ? " mal" : "";
      return '<button class="ap-opcion texto'+clase+'" data-c="'+x+'"'+(respondido ? " disabled" : "")+'>'+euros(x)+'</button>'; }).join("")+'</div>';
    else{ h += entrada("Me devuelven", DN.respuesta === r.vuelta); teclado = !respondido; }
    if(respondido) h += explicaDN(DN.respuesta === r.vuelta, "Cuenta hacia arriba: de "+euros(r.precio)+" a "+euros(r.pago)+" van "+euros(r.vuelta)+"."+pasosVuelta(r.precio, r.pago));
    else if(DN.aviso) h += '<p class="ap-explica mal" role="status">'+esc(DN.aviso)+'</p>';
  }
  if(respondido && DN.modo !== "libre") h += '<div class="pt-acciones"><button class="bt azul" id="dnOtro">'+(DN.modo === "contar" ? "Otro monton" : "Otra compra")+'</button></div>';
  if(DN.fotos) h += '<p class="dn-credito">Fotos de monedas y billetes: Banco Central Europeo. Los billetes llevan «specimen» (muestra) y se ven más pequeños que los de verdad.</p>';
  c.innerHTML = h;
  $("dnTeclado").hidden = !teclado;
  c.querySelectorAll(".dn-coger").forEach(b=> b.onclick = ()=>{ DN.mesa.push({id: dnSig++, v:+b.dataset.v}); DN.aviso = ""; pintarDinero(); });
  c.querySelectorAll(".dn-quitar").forEach(b=> b.onclick = ()=>{ DN.mesa = DN.mesa.filter(p=> p.id !== +b.dataset.id); DN.aviso = ""; pintarDinero(); });
  c.querySelectorAll(".ap-opcion").forEach(b=> b.onclick = ()=> responderDN(+b.dataset.c));
  $("dnVaciar")?.addEventListener("click", ()=>{ DN.mesa = []; DN.aviso = ""; pintarDinero(); });
  $("dnOtro")?.addEventListener("click", nuevoRetoDN);
  $("dnPagar")?.addEventListener("click", pagarDN);
}
const mayusculaDN = s => s[0].toUpperCase() + s.slice(1);
function agrupar(l){   // «2 billetes de 10 € y 3 monedas de 1 €»
  const cuenta = {}; l.forEach(v=> cuenta[v] = (cuenta[v] || 0) + 1);
  return Object.entries(cuenta).sort((a,b)=> b[0] - a[0]).map(([v, n])=> n+" × "+euros(+v)).join(" + ");
}
function pasosVuelta(precio, pago){   // 37 → 40 → 50: primero hasta la decena (o el euro) y luego de golpe
  const redondo = DN.nivel === "cent" ? Math.ceil(precio / 100) * 100 : Math.ceil(precio / 1000) * 1000;
  if(redondo <= precio || redondo >= pago) return "";
  return " (de "+euros(precio)+" a "+euros(redondo)+" van "+euros(redondo - precio)+", y de "+euros(redondo)+" a "+euros(pago)+", "+euros(pago - redondo)+")";
}
/* ---------- Ficha en papel: 4 montones para contar y 4 compras para calcular la vuelta, con sus soluciones ---------- */
function imprimirDinero(){
  const montones = [], vistos = new Set();
  for(let t=0; montones.length < 4 && t < 100; t++){ const m = sinRepetir("dn-contar-"+DN.nivel, generarMontonDN, 150); if(!vistos.has(m.k)){ vistos.add(m.k); montones.push(m); } }
  const compras = Array.from({length:4}, compraVueltaDN);
  const caja = (c, sol) => '<span class="hj-nowrap"><span class="hj-caja ancha'+(sol ? " llena" : "")+'">'+(sol ? eurosCorto(c) : "")+'</span>'+(sol || DN.nivel === "cent" ? "" : "\u00a0€")+'</span>';
  const cuerpo = sol => '<h2 class="hj-sec">¿Cuánto dinero hay?</h2><div class="hj-dineros">'+montones.map((m, i)=>
      '<div class="hj-dinero"><span class="hj-n">'+(i+1)+'</span><div class="hj-monton">'+m.monton.map(v=> piezaDN(v)).join("")+'</div><p>Hay '+caja(m.total, sol)+'</p></div>').join("")+'</div>'+
    '<h2 class="hj-sec">La vuelta: ¿cuánto te devuelven?</h2><div class="hj-dineros">'+compras.map((c, i)=>
      '<div class="hj-dinero hj-vuelta"><span class="hj-n">'+(i+5)+'</span><div class="hj-monton">'+piezasPagoDN(c.pago).map(v=> piezaDN(v)).join("")+'</div><div><p class="hj-compra"><span class="dn-cosa">'+c.icono+'</span> '+
      mayusculaDN(c.cosa)+(/^un[oa]s /.test(c.cosa) ? " cuestan " : " cuesta ")+'<b>'+euros(c.precio)+'</b>. Pagas con '+(piezasPagoDN(c.pago).length > 1 ? "estos billetes" : esBillete(c.pago) ? "este billete" : "esta moneda")+'.</p><p>Me devuelven '+caja(c.vuelta, sol)+'</p></div></div>').join("")+'</div>'+
    (DN.fotos ? '<p class="hj-credito">Fotos de monedas y billetes: Banco Central Europeo. Los billetes llevan «specimen» (muestra).</p>' : '');
  $("impresion").innerHTML =
    hojaPapel({titulo:"El dinero", sub:"Contar dinero y calcular la vuelta · "+NIVELES_DN[DN.nivel].txt, eti:"Euros", pagina:1, paginas:2,
      datos:[["Nombre", "", 3.2], ["Fecha", "", 1.4], ["Aciertos", "&nbsp;&nbsp;&nbsp;&nbsp; / 8", 1.2]],
      instrucciones:'<p>💶 Para contar, empieza por los billetes y las monedas más grandes. Para la vuelta, <b>cuenta hacia arriba</b> desde el precio hasta lo que pagas: de 37 a 40, y de 40 a 50.</p>', cuerpo:cuerpo(false)})+
    hojaPapel({titulo:"Soluciones", sub:"El dinero · "+NIVELES_DN[DN.nivel].txt+" · los mismos montones y compras de la ficha", eti:"Para el docente", docente:true, pagina:2, paginas:2, cuerpo:cuerpo(true)});
  lanzarImpresion();
}
function explicaDN(bien, texto){ return '<p class="ap-explica '+(bien ? "bien" : "mal")+'" role="status">'+(bien ? "¡Muy bien! " : "Casi. ")+esc(texto)+'</p>'; }
function pagarDN(){
  const total = sumaMesa(), r = DN.reto;
  if(total === r.precio){ DN.respuesta = DN.mesa.length; DN.hechos++; }
  else DN.aviso = total > r.precio ? "Has puesto "+euros(total)+": te pasas "+euros(total - r.precio)+". Quita alguna pieza." : "Has puesto "+euros(total)+": faltan "+euros(r.precio - total)+".";
  pintarDinero();
  $("dnOtro")?.focus();
}
function responderDN(c){
  if(DN.respuesta !== null) return;
  const r = DN.reto, bien = c === (DN.modo === "contar" ? r.total : r.vuelta);
  DN.respuesta = c; if(bien) DN.hechos++;
  pintarDinero();
  $("dnOtro")?.focus();
}
function teclaDN(t){
  if(DN.respuesta !== null || !(DN.modo === "contar" || DN.modo === "vuelta")) return;
  if(t === "⌫"){ DN.escrito = DN.escrito.slice(0, -1); DN.aviso = ""; }
  else if(t !== "✓"){ if(DN.escrito.length < 3){ DN.escrito += t; DN.aviso = ""; } }
  else if(DN.escrito){ responderDN(+DN.escrito * 100); return; }
  pintarDinero();
}
function tecladoDinero(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if($("dnTeclado").hidden){
    if(e.key === "Enter" && e.target.tagName !== "BUTTON" && DN.respuesta !== null){ e.preventDefault(); nuevoRetoDN(); }
    return;
  }
  if(/^[0-9]$/.test(e.key)){ e.preventDefault(); teclaDN(e.key); }
  else if(e.key === "Backspace"){ e.preventDefault(); teclaDN("⌫"); }
  else if(e.key === "Enter" && e.target.tagName !== "BUTTON"){ e.preventDefault(); teclaDN("✓"); }
}
