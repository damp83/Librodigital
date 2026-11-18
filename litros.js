/* =====================================================================
   EL LITRO (#/litros)
   El litro, el medio litro y el cuarto de litro con jarras medidoras y envases que se vacían en ellas:
   botella de 1 l, botella de ½ l y vaso de ¼ l. Todo se cuenta en cuartos de litro (4 cuartos = 1 litro).
   - «Explora»: echar envases en las jarras y ver cuánto hay (= cuartos, = medios litros).
   - «¿Cuánto hay?»: se ven varios envases llenos y se elige la cantidad (1 litro y medio, ¾ de litro…).
   - «Llena la jarra»: echar justo lo que se pide (con todos los envases o con uno solo).
   - Ficha en papel: «¿Cuánto hay?» y jarras para colorear, con soluciones.
   Usa las utilidades de index.html, herramientas.js, banco.js y secciones.js ($, leer, guardar, barajar,
   delMazo, pintarIconos, pantallaCompleta, hojaPapel, lanzarImpresion…).
   ===================================================================== */

const LT = Object.assign({modo:"cuanto", nivel:{cuanto:"n1", llenar:"n1"}}, leer("aula-litros", {}),
  {reto:null, echado:[], libre:[], aviso:"", tono:"", hecho:false, malas:[], bien:0});
let litrosListo = false;
const guardarLT = () => guardar("aula-litros", {modo:LT.modo, nivel:LT.nivel});
const ENVASES_LT = {
  l1: {q:4, txt:"botella de 1 litro", corto:"1 l"},
  l2: {q:2, txt:"botella de medio litro", corto:"½ l"},
  l4: {q:1, txt:"vaso de un cuarto de litro", corto:"¼ l"}};
const NIVELES_LT = {
  cuanto: {n1:{txt:"Litros y medios litros"}, n2:{txt:"Con cuartos de litro (hasta 2 l)"}, n3:{txt:"Todo mezclado (hasta 3 l)"}},
  llenar: {n1:{txt:"Con botellas de 1 l y de ½ l", envases:["l1", "l2"]}, n2:{txt:"También con vasos de ¼ l", envases:["l1", "l2", "l4"]},
           n3:{txt:"Con un solo tipo de envase"}}};
const nivelLT = (modo = LT.modo) => NIVELES_LT[modo]?.[LT.nivel[modo]] ? LT.nivel[modo] : "n1";
const totalLT = l => l.reduce((s, k)=> s + ENVASES_LT[k].q, 0);

/* Cantidades en palabras y con símbolo (q en cuartos de litro) */
function textoLT(q){
  const L = Math.floor(q / 4), r = q % 4;
  if(!r) return L === 1 ? "1 litro" : L+" litros";
  if(!L) return ["", "un cuarto de litro", "medio litro", "tres cuartos de litro"][r];
  return (L === 1 ? "1 litro" : L+" litros")+["", " y cuarto", " y medio", " y tres cuartos"][r];
}
const simboloLT = q => (Math.floor(q / 4) || "")+["", "¼", "½", "¾"][q % 4]+(q ? " l" : "0 l");
const mayusculaLT = t => t[0].toUpperCase()+t.slice(1);

/* ---------- Dibujos: envases y jarra medidora ---------- */
function envaseSVG(k, vacio){
  const agua = vacio ? "lt-vacio" : "lt-agua";
  const forma = {
    l1: '<rect x="20" y="6" width="20" height="7" rx="2" class="lt-tapon"/><path d="M23 13h14v12c0 4 13 7 13 16v94H10V41c0-9 13-12 13-16z" class="lt-borde '+agua+'"/>',
    l2: '<rect x="22" y="44" width="16" height="6" rx="2" class="lt-tapon"/><path d="M25 50h10v9c0 3 9 6 9 12v64H16V71c0-6 9-9 9-12z" class="lt-borde '+agua+'"/>',
    l4: '<path d="M12 94h36l-4 41H16z" class="lt-borde '+agua+'"/>'}[k];
  const y = {l1:96, l2:110, l4:122}[k];
  return '<svg class="lt-envase" viewBox="0 0 60 140" aria-hidden="true">'+forma+'<text x="30" y="'+y+'" class="lt-eti">'+ENVASES_LT[k].corto+'</text></svg>';
}
/* Jarra de 1 litro con marcas; q: cuartos de agua (0 a 4) */
let jarraId = 0;
function jarraSVG(q, marcas = true){
  const id = "ltj"+(++jarraId), alto = 130, fondo = 160, nivel = fondo - alto * q / 4;
  const cuerpo = "M24 22h70l-4 132q0 6-6 6H34q-6 0-6-6z";
  let m = "";
  if(marcas) [1, 2, 3, 4].forEach(i=>{
    const y = fondo - alto * i / 4;
    m += '<path d="M28 '+y+'h'+(i === 4 ? 26 : i === 2 ? 20 : 12)+'" class="lt-marca"/><text x="'+(i === 4 ? 58 : i === 2 ? 52 : 44)+'" y="'+(y + 4)+'" class="lt-num">'+["", "¼", "½", "¾", "1 l"][i]+'</text>';
  });
  return '<svg class="lt-jarra" viewBox="0 0 120 170" aria-hidden="true"><defs><clipPath id="'+id+'"><path d="'+cuerpo+'"/></clipPath></defs>'+
    '<path d="'+cuerpo+'" class="lt-cristal"/><rect x="0" y="'+nivel.toFixed(1)+'" width="120" height="'+(fondo - nivel + 2).toFixed(1)+'" clip-path="url(#'+id+')" class="lt-agua"/>'+
    m+'<path d="'+cuerpo+'" class="lt-borde" fill="none"/><path d="M94 40c18 0 18 10 18 30s-4 36-20 40" class="lt-asa"/><path d="M24 22l-8-6" class="lt-asa"/></svg>';
}
/* Varias jarras de 1 l, llenándose en orden */
function jarrasLT(q, n){
  return '<div class="lt-jarras">'+Array.from({length:n}, (_, i)=> jarraSVG(Math.max(0, Math.min(4, q - 4 * i)))).join("")+'</div>';
}

/* ---------- Retos (el banco los saca sin repetir) ---------- */
function listaLT(modo, nivel){
  const l = [];
  if(modo === "cuanto"){
    const [ma, mb, mc] = {n1:[2, 3, 0], n2:[1, 2, 3], n3:[2, 3, 4]}[nivel], tope = {n1:12, n2:8, n3:12}[nivel];
    for(let a=0; a<=ma; a++) for(let b=0; b<=mb; b++) for(let c=0; c<=mc; c++){
      const q = 4 * a + 2 * b + c, tipos = [a, b, c].filter(Boolean).length;
      if(q < 1 || q > tope || a + b + c < 2) continue;
      if(nivel === "n2" && !c) continue;
      if(nivel === "n3" && tipos < 2) continue;
      l.push({k:a+"-"+b+"-"+c, envases:[...Array(a).fill("l1"), ...Array(b).fill("l2"), ...Array(c).fill("l4")]});
    }
  }else if(nivel === "n3"){
    for(const q of [2, 4, 6, 8]) l.push({k:"l2-"+q, q, solo:"l2"});
    for(const q of [1, 2, 3, 4, 5, 6, 7, 8]) l.push({k:"l4-"+q, q, solo:"l4"});
  }else for(const q of nivel === "n1" ? [2, 4, 6, 8, 10, 12] : [1, 3, 5, 6, 7, 9, 10, 11]) l.push({k:"q"+q, q});
  return l;
}
/* Las opciones de «¿Cuánto hay?»: la buena y errores típicos (contar cada envase como un litro, uno de más o de menos) */
function opcionesLT(r){
  const q = totalLT(r.envases), paso = r.envases.includes("l4") ? 1 : 2;
  const otras = barajar([q + paso, q - paso, q + 2 * paso, q - 2 * paso, 4 * r.envases.length, r.envases.length].filter(x=> x > 0 && x !== q && x <= 16));
  return barajar([q, ...[...new Set(otras)].slice(0, 3)]);
}
function nuevoRetoLT(){
  if(LT.modo === "explora"){ LT.reto = null; pintarLitros(); return; }
  const n = nivelLT(), r = Object.assign({}, delMazo("lt-"+LT.modo+"-"+n, listaLT(LT.modo, n)));
  if(r.envases){ r.envases = barajar(r.envases.slice()); r.opciones = opcionesLT(r); }
  Object.assign(LT, {reto:r, echado:[], aviso:"", tono:"", hecho:false, malas:[], fallo:false});
  pintarLitros();
}
/* Lo que se aprende al juntar envases: 2 medios = 1 litro, 2 cuartos = medio, 4 cuartos = 1 litro */
function claveLT(envases){
  const b = envases.filter(k=> k === "l2").length, c = envases.filter(k=> k === "l4").length, l = [];
  if(b >= 2) l.push("dos medios litros hacen 1 litro");
  if(c >= 4) l.push("cuatro cuartos hacen 1 litro");
  else if(c >= 2) l.push("dos cuartos hacen medio litro");
  return l.length ? " Recuerda: "+l.join(" y ")+"." : "";
}

/* ---------- Jugar ---------- */
function responderLT(q){
  if(LT.hecho || LT.modo !== "cuanto") return;
  const r = LT.reto, bueno = totalLT(r.envases);
  if(q === bueno){
    LT.hecho = true; LT.tono = "bien"; if(!LT.malas.length) LT.bien++;
    LT.aviso = "¡Sí! "+r.envases.map(k=> ENVASES_LT[k].corto).join(" + ")+" = "+simboloLT(bueno)+": "+textoLT(bueno)+"."+claveLT(r.envases);
  }else{
    LT.malas.push(q); LT.tono = "mal";
    LT.aviso = mayusculaLT(textoLT(q))+" no es. Junta primero los envases iguales: "+
      Object.keys(ENVASES_LT).map(k=> [k, r.envases.filter(x=> x === k).length]).filter(([, n])=> n).map(([k, n])=> n+" × "+ENVASES_LT[k].corto).join(", ")+"."+claveLT(r.envases);
  }
  pintarLitros();
  (LT.hecho ? $("ltOtro") : document.querySelector("#ltCuerpo .ap-opcion:not([disabled])"))?.focus();
}
function capacidadLT(){ return 4 * Math.max(2, Math.ceil((LT.reto.q + 2) / 4)); }
function echarLT(k){
  if(LT.modo === "explora"){
    if(totalLT(LT.libre) + ENVASES_LT[k].q > 12){ LT.aviso = "¡No cabe! Las tres jarras se desbordarían. Vacíalas para seguir."; LT.tono = "mal"; }
    else{ LT.libre.push(k); LT.aviso = ""; LT.tono = ""; }
    pintarLitros(); return;
  }
  if(LT.hecho) return;
  if(totalLT(LT.echado) + ENVASES_LT[k].q > capacidadLT()){ LT.aviso = "¡No cabe! Se desbordaría. Quita el último envase."; LT.tono = "mal"; pintarLitros(); return; }
  LT.echado.push(k); LT.aviso = ""; LT.tono = "";
  pintarLitros();
}
function quitarLT(){
  if(LT.modo === "explora") LT.libre.pop(); else if(!LT.hecho) LT.echado.pop();
  LT.aviso = ""; LT.tono = ""; pintarLitros();
}
function vaciarLT(){
  if(LT.modo === "explora") LT.libre = []; else if(!LT.hecho) LT.echado = [];
  LT.aviso = ""; LT.tono = ""; pintarLitros();
}
function comprobarLT(){
  if(LT.hecho || LT.modo !== "llenar") return;
  const r = LT.reto, q = totalLT(LT.echado);
  if(q === r.q){
    LT.hecho = true; LT.tono = "bien"; if(!LT.fallo) LT.bien++;
    const n = LT.echado.length;
    LT.aviso = "¡Justo "+textoLT(q)+"! "+(r.solo ? "Has usado "+n+" "+(r.solo === "l2" ? "botellas de medio litro: "+n+" medios" : "vasos de un cuarto: "+n+" cuartos")+" = "+textoLT(q)+"." :
      LT.echado.map(k=> ENVASES_LT[k].corto).join(" + ")+" = "+simboloLT(q)+".");
  }else{
    LT.fallo = true; LT.tono = "mal";
    LT.aviso = q < r.q ? "Todavía falta: has echado "+textoLT(q)+" y hay que llegar a "+textoLT(r.q)+". Falta "+textoLT(r.q - q)+"." :
      "¡Te has pasado! Has echado "+textoLT(q)+" y había que echar "+textoLT(r.q)+". Sobra "+textoLT(q - r.q)+": quita algún envase.";
  }
  pintarLitros();
  if(LT.hecho) $("ltOtro")?.focus();
}

/* ---------- Vista ---------- */
function iniciarLitros(){
  if(!litrosListo){
    litrosListo = true;
    pintarIconos($("vLitros"));
    document.querySelectorAll("#vLitros .segmentos button").forEach(b=> b.onclick = ()=>{ LT.modo = b.dataset.modo; guardarLT(); nuevoRetoLT(); });
    $("ltNivel").onchange = e=>{ LT.nivel[LT.modo] = e.target.value; guardarLT(); nuevoRetoLT(); };
    $("ltImprimir").onclick = imprimirLitros;
    if(document.fullscreenEnabled) $("ltPantalla").onclick = ()=> pantallaCompleta("vLitros"); else $("ltPantalla").hidden = true;
  }
  if(!LT.reto && LT.modo !== "explora") nuevoRetoLT(); else pintarLitros();
}
const botonEnvaseLT = k => '<button class="lt-boton" data-k="'+k+'" aria-label="Echar una '+ENVASES_LT[k].txt+'">'+envaseSVG(k)+'<span>'+ENVASES_LT[k].corto+'</span></button>';
function pintarLitros(){
  const c = $("ltCuerpo"), modo = LT.modo, r = LT.reto;
  document.querySelectorAll("#vLitros .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === modo));
  $("ltNivelEti").hidden = modo === "explora";
  if(modo !== "explora"){
    $("ltNivel").innerHTML = Object.entries(NIVELES_LT[modo]).map(([k, v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("ltNivel").value = nivelLT();
  }
  let h = "";
  const equivale = '<p class="lt-regla" aria-label="1 litro es igual a 2 medios litros y a 4 cuartos de litro"><b>1 l</b> = <b>½ l</b> + <b>½ l</b> = <b>¼ l</b> + <b>¼ l</b> + <b>¼ l</b> + <b>¼ l</b></p>';
  if(modo === "explora"){
    const q = totalLT(LT.libre);
    h += '<p class="ap-pregunta">Echa agua en las jarras de 1 litro y mira cuánto hay.</p>'+equivale;
    h += '<div class="lt-mesa"><div class="lt-botones" role="group" aria-label="Envases">'+Object.keys(ENVASES_LT).map(botonEnvaseLT).join("")+'</div>'+
      '<div role="img" aria-label="Tres jarras de 1 litro con '+textoLT(q || 0).replace(/^$/, "nada")+' de agua">'+jarrasLT(q, 3)+'</div></div>';
    h += '<p class="lt-total" role="status">'+(q ? 'Hay <b>'+textoLT(q)+'</b> ('+simboloLT(q)+')'+(q > 1 ? ' = '+q+' cuartos de litro' : '')+(q % 2 === 0 && q > 2 ? ' = '+q / 2+' medios litros' : '') : 'Las jarras están vacías.')+'</p>';
    if(LT.aviso) h += '<p class="ap-explica '+LT.tono+'">'+LT.aviso+'</p>';
    h += '<div class="pt-acciones"><button class="bt" id="ltQuitar"'+(LT.libre.length ? "" : " disabled")+'>Quitar el último</button><button class="bt" id="ltVaciar"'+(LT.libre.length ? "" : " disabled")+'>Vaciar</button></div>';
  }else{
    h += '<p class="ap-marcador"><span>'+(modo === "cuanto" ? "¿Cuánta agua hay?" : "Llena la jarra")+'</span><span class="ap-puntos" aria-label="'+LT.bien+' sin fallos">★ '+LT.bien+'</span></p>';
    if(modo === "cuanto"){
      const q = totalLT(r.envases);
      h += '<div class="lt-fila" role="img" aria-label="Envases llenos de agua: '+r.envases.map(k=> "una "+ENVASES_LT[k].txt).join(", ")+'">'+r.envases.map(k=> envaseSVG(k)).join("")+'</div>';
      h += '<div class="ap-opciones">'+r.opciones.map(x=>{
        const clase = LT.hecho && x === q ? " bien" : LT.malas.includes(x) ? " mal" : "";
        return '<button class="ap-opcion texto'+clase+'" data-q="'+x+'"'+(LT.hecho || LT.malas.includes(x) ? " disabled" : "")+'>'+mayusculaLT(textoLT(x))+'</button>'; }).join("")+'</div>';
      if(LT.hecho) h += '<div role="img" aria-label="En jarras de 1 litro">'+jarrasLT(q, Math.ceil(q / 4))+'</div>';
    }else{
      const q = totalLT(LT.echado), envases = r.solo ? [r.solo] : NIVELES_LT.llenar[nivelLT()].envases;
      h += '<p class="ap-pregunta">Echa <b>justo '+textoLT(r.q)+'</b> ('+simboloLT(r.q)+')'+(r.solo ? ' usando solo '+(r.solo === "l2" ? "botellas de ½ l" : "vasos de ¼ l") : '')+'.</p>';
      h += '<div class="lt-mesa"><div class="lt-botones" role="group" aria-label="Envases">'+envases.map(botonEnvaseLT).join("")+'</div>'+
        '<div role="img" aria-label="Jarras de 1 litro con '+(q ? textoLT(q) : "nada")+' de agua">'+jarrasLT(q, capacidadLT() / 4)+'</div></div>';
      h += '<p class="lt-total">'+(q ? 'Has echado: '+LT.echado.map(k=> ENVASES_LT[k].corto).join(" + ")+' = <b>'+simboloLT(q)+'</b>' : 'Todavía no has echado nada.')+'</p>';
      if(!LT.hecho) h += '<div class="pt-acciones"><button class="bt" id="ltQuitar"'+(LT.echado.length ? "" : " disabled")+'>Quitar el último</button><button class="bt" id="ltVaciar"'+(LT.echado.length ? "" : " disabled")+'>Vaciar</button><button class="bt azul" id="ltComprobar">Comprobar</button></div>';
    }
    h += '<p class="ap-explica '+(LT.aviso ? LT.tono : "lt-vacio-msg")+'" role="status">'+LT.aviso+'</p>';
    if(LT.hecho) h += '<div class="pt-acciones"><button class="bt azul" id="ltOtro">'+(modo === "cuanto" ? "Otro" : "Otra jarra")+'</button></div>';
  }
  c.innerHTML = h;
  c.querySelectorAll(".lt-boton").forEach(b=> b.onclick = ()=>{ echarLT(b.dataset.k); c.querySelector('.lt-boton[data-k="'+b.dataset.k+'"]')?.focus(); });
  c.querySelectorAll(".ap-opcion").forEach(b=> b.onclick = ()=> responderLT(+b.dataset.q));
  $("ltQuitar")?.addEventListener("click", ()=>{ quitarLT(); ($("ltQuitar")?.disabled ? c.querySelector(".lt-boton") : $("ltQuitar"))?.focus(); });
  $("ltVaciar")?.addEventListener("click", ()=>{ vaciarLT(); c.querySelector(".lt-boton")?.focus(); });
  $("ltComprobar")?.addEventListener("click", comprobarLT);
  $("ltOtro")?.addEventListener("click", nuevoRetoLT);
}
function tecladoLitros(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if(LT.modo === "cuanto" && !LT.hecho && /^[1-4]$/.test(e.key)){
    const q = LT.reto.opciones[+e.key - 1];
    if(q !== undefined && !LT.malas.includes(q)){ e.preventDefault(); responderLT(q); }
  }else if(LT.modo !== "cuanto" && !LT.hecho && /^[124]$/.test(e.key)){   // 1: botella de 1 l, 2: de ½ l, 4: vaso de ¼ l
    const k = "l"+e.key, vale = LT.modo === "explora" || (LT.reto.solo ? LT.reto.solo === k : NIVELES_LT.llenar[nivelLT()].envases.includes(k));
    if(vale){ e.preventDefault(); echarLT(k); }
  }else if(e.key === "Enter" && e.target.tagName !== "BUTTON"){
    if(LT.hecho){ e.preventDefault(); nuevoRetoLT(); }
    else if(LT.modo === "llenar"){ e.preventDefault(); comprobarLT(); }
  }else if(e.key === "Backspace" && LT.modo !== "cuanto"){ e.preventDefault(); quitarLT(); }
}

/* ---------- Ficha en papel: 6 «¿cuánto hay?» y 6 jarras para colorear (y las soluciones) ---------- */
function imprimirLitros(){
  const n = LT.nivel.cuanto && NIVELES_LT.cuanto[LT.nivel.cuanto] ? LT.nivel.cuanto : "n1";
  const lista = listaLT("cuanto", n), retos = [];
  for(let i=0; i<6; i++){ const r = delMazo("lt-cuanto-"+n, lista); retos.push(barajar(r.envases.slice())); }
  const cantidades = barajar((n === "n1" ? [2, 4, 6, 2, 4, 6] : [1, 2, 3, 4, 1, 3]).slice());
  const hoja = docente => '<div class="hj-lt">'+
    '<p class="hj-sec">1. ¿Cuánta agua hay? <small>Escríbelo con palabras.</small></p><div class="hj-lt-cuanto">'+retos.map((e, i)=>
      '<div class="hj-lt-caja"><span class="hj-n">'+(i + 1)+'</span><div class="hj-lt-envases">'+e.map(k=> envaseSVG(k)).join("")+'</div>'+
      '<p class="hj-lt-linea">'+(docente ? '<b>'+textoLT(totalLT(e))+'</b>' : '')+'</p></div>').join("")+'</div>'+
    '<p class="hj-sec">2. Colorea el agua que se pide en cada jarra.</p><div class="hj-lt-jarras">'+cantidades.map(q=>
      '<div class="hj-lt-jarra">'+jarraSVG(docente ? q : 0)+'<p><b>'+simboloLT(q)+'</b><br>'+textoLT(q)+'</p></div>').join("")+'</div></div>';
  const instr = '<p>💧 <b>1 litro</b> = 2 medios litros (½ l + ½ l) = 4 cuartos de litro (¼ l + ¼ l + ¼ l + ¼ l). Los envases de la ficha están llenos de agua.</p>';
  $("impresion").innerHTML =
    hojaPapel({titulo:"El litro, el medio y el cuarto", sub:"Capacidad · "+NIVELES_LT.cuanto[n].txt, eti:"Medida", pagina:1, paginas:2,
      datos:[["Nombre", "", 3], ["Fecha", "", 1]], instrucciones:instr, cuerpo:hoja(false)})+
    hojaPapel({titulo:"El litro · Soluciones", sub:"Capacidad · "+NIVELES_LT.cuanto[n].txt, eti:"Para el docente", pagina:2, paginas:2, docente:true,
      instrucciones:'<p>En azul, las respuestas.</p>', cuerpo:hoja(true)});
  lanzarImpresion();
}
