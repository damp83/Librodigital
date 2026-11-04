/* =====================================================================
   CARRERA DE AVIONES (#/aviones)
   Juego de dados para dos pilotos (o contra la máquina), como la ficha «Carrera de aviones»: cada piloto
   tiene 3 aviones en carriles de 10, 20 o 30 cuadros. Se tiran los dados y se elige: sumarlos y mover un
   avión, o repartirlos y mover varios (un dado cada uno). Gana quien lleva primero sus 3 aviones a la meta.
   - Nivel 1: un dado, carriles de 10. Nivel 2: dos dados, carriles de 20. Nivel 3: tres dados, de 30.
   - «Pedir la suma»: antes de mover, hay que escribir la suma de los dados (con el truco de buscar el 10).
   - Registro de tiradas de cada piloto y tablero en papel (A4 apaisado) con el registro para rellenar.
   Usa las utilidades de index.html, herramientas.js, aula.js, aproximar.js y secciones.js ($, leer, guardar,
   apTeclado, pantallaCompleta, hojaPapel, lanzarImpresion…).
   ===================================================================== */

const AV = Object.assign({nivel:"n2", rival:"dos", suma:true}, leer("aula-aviones", {}),
  {pos:null, ultimo:null, turno:0, dados:[], usados:[], elegidos:[], fase:"tirar", escrito:"", aviso:"", registro:[[], []], partes:[], ganador:null, partida:0});
let avionesListo = false;
const guardarAV = () => guardar("aula-aviones", {nivel:AV.nivel, rival:AV.rival, suma:AV.suma});
const NIVELES_AV = {
  n1: {txt:"Nivel 1 · un dado · carriles de 10", dados:1, meta:10},
  n2: {txt:"Nivel 2 · dos dados · carriles de 20", dados:2, meta:20},
  n3: {txt:"Nivel 3 · tres dados · carriles de 30", dados:3, meta:30}};
const AVION_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12c0-.8-.7-1.3-1.5-1.3H15.2L10.6 3.5H8.4l2.3 7.2H5.9L4.1 8.3H2.6l1.1 3.7-1.1 3.7h1.5l1.8-2.4h4.8l-2.3 7.2h2.2l4.6-7.2h5.3c.8 0 1.5-.5 1.5-1.3z"/></svg>';
const nivelAV = () => NIVELES_AV[AV.nivel] || NIVELES_AV.n2;
const nombreAV = j => j === 1 && AV.rival === "maquina" ? "La máquina" : "Piloto "+(j + 1);
const maquinaJuega = () => AV.rival === "maquina" && AV.turno === 1 && AV.fase !== "fin";

/* Un dado con sus puntos */
function dadoAV(v){
  const p = {1:[[50,50]], 2:[[28,28],[72,72]], 3:[[26,26],[50,50],[74,74]], 4:[[28,28],[72,28],[28,72],[72,72]],
    5:[[26,26],[74,26],[50,50],[26,74],[74,74]], 6:[[28,24],[72,24],[28,50],[72,50],[28,76],[72,76]]}[v] || [];
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="4" y="4" width="92" height="92" rx="18" class="av-cara"/>'+
    p.map(([x, y])=> '<circle cx="'+x+'" cy="'+y+'" r="9.5"/>').join("")+'</svg>';
}

function nuevaCarreraAV(){
  AV.partida++;
  Object.assign(AV, {pos:[[0, 0, 0], [0, 0, 0]], turno:0, dados:[], usados:[], elegidos:[], fase:"tirar", escrito:"", aviso:"", registro:[[], []], partes:[], ganador:null});
  pintarAviones();
}
const sumaAV = l => l.reduce((a, b)=> a + b, 0);
const quedanAV = () => AV.dados.map((v, i)=> AV.usados[i] ? 0 : v);
const elegidoAV = () => sumaAV(AV.dados.map((v, i)=> !AV.usados[i] && AV.elegidos[i] ? v : 0));

function tirarAV(){
  if(AV.fase !== "tirar") return;
  const n = nivelAV().dados;
  AV.dados = Array.from({length:n}, ()=> azar(1, 6));
  AV.usados = AV.dados.map(()=> false); AV.elegidos = AV.dados.map(()=> true); AV.partes = [];
  AV.fase = AV.suma && n > 1 && !maquinaJuega() ? "sumar" : "mover";
  AV.escrito = ""; AV.aviso = "";
  pintarAviones(true);
  if(maquinaJuega()) jugarMaquinaAV();
  else if(AV.fase === "sumar") $("avTeclado")?.querySelector("button")?.focus();
}
/* La pista para sumar: con tres dados, buscar primero dos que sumen 10 (o el dado mayor y contar) */
function pistaSumaAV(){
  const d = AV.dados, mayor = Math.max(...d);
  if(d.length === 3) for(let a=0; a<3; a++) for(let b=a+1; b<3; b++) if(d[a] + d[b] === 10)
    return "Truco: "+d[a]+" + "+d[b]+" = 10, y 10 + "+d[3 - a - b]+" = "+(10 + d[3 - a - b])+".";
  if(d.length === 3){ const [x, y, z] = d.slice().sort((a, b)=> b - a); return "Suma primero dos: "+x+" + "+y+" = "+(x + y)+", y luego añade el "+z+"."; }
  return "Empieza por el mayor, el "+mayor+", y cuenta "+(sumaAV(d) - mayor)+" más.";
}
function teclaAV(t){
  if(AV.fase !== "sumar") return;
  if(t === "⌫"){ AV.escrito = AV.escrito.slice(0, -1); AV.aviso = ""; }
  else if(t !== "✓"){ if(AV.escrito.length < 2){ AV.escrito += t; AV.aviso = ""; } }
  else if(AV.escrito){
    if(+AV.escrito === sumaAV(AV.dados)){ AV.fase = "mover"; AV.aviso = ""; }
    else AV.aviso = AV.escrito+" no es. "+pistaSumaAV();
    AV.escrito = "";
  }
  pintarAviones();
}
function tocarDadoAV(i){
  if(AV.fase !== "mover" || AV.usados[i] || maquinaJuega()) return;
  const libres = AV.dados.filter((_, k)=> !AV.usados[k]).length;
  if(libres < 2) return;
  // tocar un dado: mover solo con ese; tocarlo otra vez: volver a juntarlos todos
  const solo = AV.elegidos.every((e, k)=> AV.usados[k] || e === (k === i));
  AV.elegidos = AV.dados.map((_, k)=> !AV.usados[k] && (solo || k === i));
  pintarAviones();
}
function moverAV(a){
  if(AV.fase !== "mover") return;
  const meta = nivelAV().meta, pos = AV.pos[AV.turno], v = elegidoAV();
  if(!v || pos[a] >= meta) return;
  pos[a] = Math.min(meta, pos[a] + v);
  AV.partes.push({avion:a, v});
  AV.dados.forEach((_, i)=>{ if(AV.elegidos[i]) AV.usados[i] = true; });
  AV.elegidos = AV.usados.map(u=> !u);
  AV.ultimo = {j:AV.turno, a};
  if(pos.every(x=> x >= meta)){ terminarTurnoAV(); AV.fase = "fin"; AV.ganador = AV.turno; pintarAviones(); $("avOtra")?.focus(); return; }
  if(AV.usados.every(Boolean)) terminarTurnoAV(true);
  pintarAviones();
}
function terminarTurnoAV(pasar){
  AV.registro[AV.turno].push({dados:AV.dados.slice(), partes:AV.partes.slice()});
  if(!pasar) return;
  AV.turno = 1 - AV.turno; AV.fase = "tirar"; AV.dados = []; AV.partes = [];
  if(maquinaJuega()){ const p = AV.partida; setTimeout(()=>{ if(p === AV.partida && maquinaJuega() && AV.fase === "tirar") tirarAV(); }, 1100); }
}
/* La máquina reparte los dados probando todas las formas: el mayor avance útil (sin pasarse de la meta);
   si empatan, la que lleva más aviones a la meta y, después, la que adelanta al avión que va más atrasado */
function jugadaMaquinaAV(dados, pos, meta){
  let mejor = null;
  const total = Math.pow(3, dados.length);
  for(let c=0; c<total; c++){
    const reparto = dados.map((_, i)=> Math.floor(c / Math.pow(3, i)) % 3), mueve = [0, 0, 0];
    if(reparto.some(a=> pos[a] >= meta)) continue;
    dados.forEach((v, i)=> mueve[reparto[i]] += v);
    const fin = pos.map((p, a)=> Math.min(meta, p + mueve[a]));
    const util = sumaAV(fin) - sumaAV(pos), llegan = fin.filter(x=> x >= meta).length, minimo = Math.min(...fin.filter(x=> x < meta), meta);
    const nota = util * 1000 + llegan * 100 + minimo;
    if(!mejor || nota > mejor.nota) mejor = {nota, reparto};
  }
  return mejor ? mejor.reparto : dados.map(()=> pos.findIndex(p=> p < meta));
}
function jugarMaquinaAV(){
  const p = AV.partida, reparto = jugadaMaquinaAV(AV.dados, AV.pos[1], nivelAV().meta);
  const aviones = [...new Set(reparto)];
  const paso = k => {
    if(p !== AV.partida || AV.turno !== 1 || AV.fase !== "mover" || k >= aviones.length) return;
    AV.elegidos = AV.dados.map((_, i)=> !AV.usados[i] && reparto[i] === aviones[k]);
    moverAV(aviones[k]);
    setTimeout(()=> paso(k + 1), 900);
  };
  setTimeout(()=> paso(0), 1200);
}

/* ---------- Vista ---------- */
function iniciarAviones(){
  if(!avionesListo){
    avionesListo = true;
    pintarIconos($("vAviones"));
    $("avNivel").innerHTML = Object.entries(NIVELES_AV).map(([k, v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("avNivel").onchange = e=>{ AV.nivel = e.target.value; guardarAV(); nuevaCarreraAV(); };
    $("avRival").onchange = e=>{ AV.rival = e.target.value; guardarAV(); nuevaCarreraAV(); };
    $("avSuma").onclick = ()=>{ AV.suma = !AV.suma; guardarAV(); if(!AV.suma && AV.fase === "sumar") AV.fase = "mover"; pintarAviones(); };
    $("avImprimir").onclick = imprimirAviones;
    apTeclado("avTeclado", teclaAV);
    if(document.fullscreenEnabled) $("avPantalla").onclick = ()=> pantallaCompleta("vAviones"); else $("avPantalla").hidden = true;
  }
  if(!AV.pos) nuevaCarreraAV(); else pintarAviones();
}
function carrilAV(j, a){
  const meta = nivelAV().meta, p = AV.pos[j][a], activo = AV.fase === "mover" && AV.turno === j && !maquinaJuega() && p < meta;
  const v = elegidoAV(), recien = AV.ultimo && AV.ultimo.j === j && AV.ultimo.a === a;
  let celdas = "";
  for(let c=1; c<=meta; c++) celdas += '<i class="'+(c <= p ? "hecha" : "")+(c % 10 === 0 ? " diez" : c % 5 === 0 ? " cinco" : "")+'"></i>';
  const avion = '<span class="av-avion'+(recien ? " salta" : "")+'" style="left:calc('+(Math.max(1, p) - 1)+' * 100% / '+meta+');width:calc(100% / '+meta+')">'+AVION_SVG+'</span>';
  const texto = "Avión "+(a + 1)+" de "+nombreAV(j)+": "+(p >= meta ? "en la meta" : "va por el "+p+" de "+meta);
  const dentro = '<span class="av-hangar">'+(p === 0 ? AVION_SVG : '<b>'+(a + 1)+'</b>')+'</span><span class="av-pista" style="--n:'+meta+'">'+celdas+(p > 0 ? avion : "")+'</span>'+
    '<span class="av-meta" aria-hidden="true"></span>';
  return activo
    ? '<button class="av-carril activo" data-a="'+a+'" aria-label="'+texto+'. Mover '+v+(v === 1 ? " cuadro" : " cuadros")+(p + v > meta ? " (llega a la meta)" : "")+'">'+dentro+'</button>'
    : '<div class="av-carril" role="img" aria-label="'+texto+'">'+dentro+'</div>';
}
function textoTiradaAV(t){
  const s = sumaAV(t.dados);
  const tirada = t.dados.length > 1 ? t.dados.join(" + ")+" = "+s : String(s);
  return tirada+" → "+t.partes.map(p=> (t.partes.length > 1 ? p.v+" al " : "")+"avión "+(p.avion + 1)).join(", ");
}
function pintarAviones(tirando){
  const c = $("avCuerpo"), n = nivelAV(), meta = n.meta, j = AV.turno;
  $("avNivel").value = AV.nivel; $("avRival").value = AV.rival;
  $("avSuma").setAttribute("aria-pressed", AV.suma); $("avSuma").hidden = n.dados < 2;
  const marcas = Array.from({length:meta / 5}, (_, i)=> '<span style="grid-column:'+(5 * (i + 1))+'">'+5 * (i + 1)+'</span>').join("");
  let h = '<div class="av-tablero">';
  for(const k of [0, 1]){
    const llegados = AV.pos[k].filter(x=> x >= meta).length;
    h += '<section class="av-piloto p'+k+(k === j && AV.fase !== "fin" ? " turno" : "")+(AV.ganador === k ? " gana" : "")+'" aria-label="'+nombreAV(k)+'">'+
      '<h2>'+(k === 1 && AV.rival === "maquina" ? "🤖 " : "")+nombreAV(k)+(k === j && AV.fase !== "fin" ? ' <small>· le toca</small>' : '')+'<span>'+llegados+' de 3 en la meta</span></h2>'+
      '<div class="av-marcas" style="--n:'+meta+'" aria-hidden="true">'+marcas+'</div>'+[0, 1, 2].map(a=> carrilAV(k, a)).join("")+'</section>';
  }
  h += '</div><aside class="av-mandos p'+j+'">';
  if(AV.fase === "fin"){
    h += '<p class="av-fin" role="status">🏆 ¡Gana '+nombreAV(AV.ganador)+'!</p><p>Sus 3 aviones llegaron a la meta.</p><div class="pt-acciones"><button class="bt azul" id="avOtra">Otra carrera</button></div>';
  }else{
    h += '<p class="av-turno">Turno de <b>'+nombreAV(j)+'</b></p>';
    if(AV.dados.length) h += '<div class="av-dados'+(tirando ? " rueda" : "")+'" role="group" aria-label="Dados">'+AV.dados.map((v, i)=>
      '<button class="av-dado'+(AV.usados[i] ? " usado" : AV.elegidos[i] && AV.fase === "mover" ? " elegido" : "")+'" data-i="'+i+'" aria-label="Dado: '+v+(AV.usados[i] ? ", ya usado" : "")+'"'+
      (AV.usados[i] || AV.fase !== "mover" || maquinaJuega() ? " disabled" : ' aria-pressed="'+!!AV.elegidos[i]+'"')+'>'+dadoAV(v)+'</button>').join("")+'</div>';
    if(AV.fase === "tirar"){
      h += maquinaJuega() ? '<p class="av-ayuda">La máquina va a tirar…</p>'
        : '<button class="bt azul av-tirar" id="avTirar">🎲 Tirar '+(n.dados === 1 ? "el dado" : n.dados === 2 ? "los dos dados" : "los tres dados")+'</button>';
    }else if(AV.fase === "sumar"){
      h += '<p class="ap-pregunta">'+AV.dados.join(" + ")+' = <span class="ap-campo activo'+(AV.aviso ? " mal" : "")+'">'+(AV.escrito || "?")+'</span></p>';
      if(AV.aviso) h += '<p class="ap-explica mal" role="status">'+AV.aviso+'</p>';
      else if(n.dados === 3) h += '<p class="av-ayuda">Truco: busca primero dos dados que sumen 10.</p>';
    }else if(maquinaJuega()){
      h += '<p class="av-ayuda" role="status">La máquina piensa cómo repartir los dados…</p>';
    }else{
      const v = elegidoAV(), libres = AV.dados.filter((_, i)=> !AV.usados[i]).length;
      h += '<p class="av-mueve" role="status">Mueves <b>'+v+'</b>: toca un avión</p>';
      if(libres > 1) h += '<p class="av-ayuda">Para <b>repartir</b>, toca un dado y luego un avión; el otro'+(libres > 2 ? "s dados quedan" : " dado queda")+' para otro avión.</p>';
    }
  }
  h += '<div class="av-registro"><h3>Registro de tiradas</h3>'+[0, 1].map(k=>
    '<div class="p'+k+'"><b>'+nombreAV(k)+'</b><ol>'+AV.registro[k].slice(-5).map(t=> '<li>'+textoTiradaAV(t)+'</li>').join("")+(AV.registro[k].length ? "" : '<li class="av-nada">Todavía nada</li>')+'</ol></div>').join("")+'</div>';
  h += '</aside>';
  c.innerHTML = h;
  $("avTeclado").hidden = AV.fase !== "sumar";
  c.querySelectorAll(".av-carril.activo").forEach(b=> b.onclick = ()=>{ moverAV(+b.dataset.a); (c.querySelector(".av-carril.activo") || $("avTirar"))?.focus(); });
  c.querySelectorAll(".av-dado:not([disabled])").forEach(b=> b.onclick = ()=>{ tocarDadoAV(+b.dataset.i); c.querySelector('.av-dado[data-i="'+b.dataset.i+'"]')?.focus(); });
  $("avTirar")?.addEventListener("click", tirarAV);
  $("avOtra")?.addEventListener("click", nuevaCarreraAV);
}
function tecladoAviones(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if(AV.fase === "sumar"){
    if(/^[0-9]$/.test(e.key)){ e.preventDefault(); teclaAV(e.key); }
    else if(e.key === "Backspace"){ e.preventDefault(); teclaAV("⌫"); }
    else if(e.key === "Enter"){ e.preventDefault(); teclaAV("✓"); }
  }else if(AV.fase === "mover" && /^[1-3]$/.test(e.key)){ e.preventDefault(); moverAV(+e.key - 1); }
  else if(AV.fase === "tirar" && (e.key === "Enter" || e.key === " ") && e.target.tagName !== "BUTTON" && !maquinaJuega()){ e.preventDefault(); tirarAV(); }
}

/* ---------- Tablero en papel (A4 apaisado), como la ficha del aula ---------- */
function imprimirAviones(){
  const n = nivelAV(), meta = n.meta;
  const reglas = {
    n1: 'Tira <b>un dado</b> y mueve uno de tus aviones tantos cuadros como puntos. Gana quien lleva primero sus 3 aviones a la meta.',
    n2: 'Tira <b>dos dados</b> y elige: <b>sumarlos</b> y mover un avión, o <b>repartirlos</b> y mover dos aviones (un dado cada uno). Gana quien lleva primero sus 3 aviones a la meta.',
    n3: 'Tira <b>tres dados</b>, súmalos y mueve un avión. ¿Te conviene <b>repartirlos</b>? Puedes mover hasta tres aviones, un dado cada uno. Gana quien lleva primero sus 3 aviones a la meta.'}[AV.nivel];
  const registro = {n1:"escribe los puntos del dado y el avión que mueves.", n2:"escribe los puntos de cada dado y la suma.",
    n3:"escribe la suma de los tres dados. Truco: busca primero dos dados que sumen 10."}[AV.nivel];
  const caja = '<span class="hj-caja"></span>';
  const linea = n.dados === 1 ? caja+' <span class="hj-av-avion">avión ① ② ③</span>' : Array(n.dados).fill(caja).join(" + ")+" = "+caja;
  const piloto = k => '<div class="hj-av-piloto"><p><b>Piloto '+(k + 1)+':</b> <span class="hj-linea"></span></p>'+
    '<div class="hj-av-pistas" style="--n:'+meta+'"><span class="hj-av-marcas">'+Array.from({length:meta}, (_, i)=> '<i>'+((i + 1) % 5 ? "" : i + 1)+'</i>').join("")+'</span>'+
    [0, 1, 2].map(()=> '<span class="hj-av-carril"><span class="hj-av-ico">'+AVION_SVG+'</span>'+Array.from({length:meta}, (_, i)=>
      '<i class="'+((i + 1) % 10 === 0 ? "diez" : (i + 1) % 5 === 0 ? "cinco" : "")+'"></i>').join("")+'</span>').join("")+
    '<span class="hj-av-meta"><b>META</b></span></div></div>';
  const tiradas = k => '<div class="hj-av-reg"><b>Piloto '+(k + 1)+'</b><ol>'+Array.from({length:6}, ()=> '<li>'+linea+'</li>').join("")+'</ol></div>';
  $("impresion").innerHTML = hojaPapel({titulo:"Carrera de aviones", sub:n.txt+" cuadros", eti:"Juego de dados", pagina:1, paginas:1, apaisada:true,
    instrucciones:'<p>✈️ <b>Reglas:</b> '+reglas+' Si un avión se pasa de la meta, se queda en la meta.</p>',
    cuerpo:'<div class="hj-av">'+piloto(0)+piloto(1)+'<p class="hj-sec">Registro de tiradas <small>· En el registro, '+registro+'</small></p>'+
      '<div class="hj-av-regs">'+tiradas(0)+tiradas(1)+'</div></div>'});
  lanzarImpresion();
}
