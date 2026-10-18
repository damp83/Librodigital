/* =====================================================================
   MULTIPLICAR CON REGLETAS (#/multiplicar)
   La multiplicación como «veces»: 3 veces el 4 son tres regletas rosas (4 + 4 + 4 = 12, 3 × 4 = 12).
   - Construye: se elige la regleta y cuántas veces; se ven las regletas una encima de otra, la suma repetida
     y la multiplicación. «Darle la vuelta» pone al lado 4 veces el 3: la misma superficie
     (propiedad conmutativa).
   - ¿Cuántas veces?: aparecen unas regletas iguales; ¿qué regleta es?, ¿cuántas veces?, ¿cuánto es?
   - Doble y mitad: el doble es 2 veces la regleta; la mitad, la regleta que cabe justo 2 veces.
   Niveles: tablas del 2, 5 y 10; del 2 al 5; todas. Los retos salen del banco (banco.js).
   Usa las utilidades de index.html, herramientas.js, aula.js y aproximar.js ($, leer, guardar, REGLETA, apTeclado…).
   ===================================================================== */

const MX = Object.assign({modo:"construir", nivel:"faciles", n:4, veces:3}, leer("aula-multiplicar", {}),
  {girada:false, reto:null, paso:0, escrito:"", aviso:"", hechos:0});
let multiplicarListo = false;
const guardarMX = () => guardar("aula-multiplicar", {modo:MX.modo, nivel:MX.nivel, n:MX.n, veces:MX.veces});
const NIVELES_MX = {faciles:{txt:"Tablas del 2, 5 y 10", tablas:[2, 5, 10]}, medias:{txt:"Del 2 al 5", tablas:[2, 3, 4, 5]}, todas:{txt:"Todas (del 2 al 10)", tablas:[2, 3, 4, 5, 6, 7, 8, 9, 10]}};

/* Varias regletas iguales, una debajo de otra */
function trenMX(n, veces, opciones){
  const o = Object.assign({etiqueta:true}, opciones), r = REGLETA[n];
  let h = '<div class="mu-tren" style="--n:'+n+'" role="img" aria-label="'+veces+' veces la regleta '+r.n+' del '+n+'">';
  for(let i=0; i<veces; i++) h += '<i class="mu-regleta" style="background:'+r.c+';color:'+r.t+'">'+(o.etiqueta ? n : "")+'</i>';
  return h + '</div>';
}
/* La suma repetida: 4 + 4 + 4 = 12 */
const sumaRepetida = (n, veces) => Array(veces).fill(n).join(" + ") + " = " + n * veces;

function listaMX(nivel){
  const l = [];
  for(const n of NIVELES_MX[nivel].tablas) for(let v=2; v<=10; v++) l.push({k:v+"x"+n, n, veces:v});
  return l;
}
function listaDoble(nivel){
  const max = nivel === "faciles" ? 10 : nivel === "medias" ? 15 : 25, l = [];
  for(let n=1; n<=max; n++){ l.push({k:"d"+n, tipo:"doble", n}); l.push({k:"m"+(2*n), tipo:"mitad", n:2*n}); }
  return l;
}
function nuevoRetoMX(){
  Object.assign(MX, {paso:0, escrito:"", aviso:""});
  if(MX.modo === "cuantas") MX.reto = Object.assign({}, delMazo("mu-"+MX.nivel, listaMX(MX.nivel)));
  else if(MX.modo === "doble") MX.reto = Object.assign({}, delMazo("mu-dm-"+MX.nivel, listaDoble(MX.nivel)));
  pintarMultiplicar();
}
function pasosMX(r){
  if(MX.modo === "cuantas") return [
    {antes:"La regleta que se repite vale", r:r.n, pista:"Fíjate en el color: blanca 1, roja 2, verde clara 3, rosa 4, amarilla 5, verde oscura 6, negra 7, marrón 8, azul 9 y naranja 10."},
    {antes:"¿Cuántas veces está?", r:r.veces, pista:"Cuenta las regletas una a una."},
    {antes:r.veces+" veces el "+r.n+": "+r.veces+" × "+r.n+" =", r:r.veces * r.n, pista:"Puedes sumar: "+Array(r.veces).fill(r.n).join(" + ")+"."}];
  if(r.tipo === "doble") return [{antes:"El doble de "+r.n+" es", r:2 * r.n, pista:"El doble son 2 veces: "+r.n+" + "+r.n+"."}];
  return [{antes:"La mitad de "+r.n+" es", r:r.n / 2, pista:"Busca un número que, sumado dos veces, dé "+r.n+": ? + ? = "+r.n+"."}];
}

/* ---------- Vista ---------- */
function iniciarMultiplicar(){
  if(!multiplicarListo){
    multiplicarListo = true;
    pintarIconos($("vMultiplicar"));
    $("muNivel").innerHTML = Object.entries(NIVELES_MX).map(([k,v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("muNivel").onchange = e=>{ MX.nivel = e.target.value; guardarMX(); nuevoRetoMX(); };
    document.querySelectorAll("#vMultiplicar .segmentos button").forEach(b=> b.onclick = ()=>{ MX.modo = b.dataset.modo; guardarMX(); nuevoRetoMX(); });
    apTeclado("muTeclado", teclaMX);
    if(document.fullscreenEnabled) $("muPantalla").onclick = ()=> pantallaCompleta("vMultiplicar"); else $("muPantalla").hidden = true;
  }
  if(MX.modo !== "construir" && !MX.reto) nuevoRetoMX(); else pintarMultiplicar();
}
function pintarMultiplicar(){
  const c = $("muCuerpo"), r = MX.reto;
  $("muNivel").value = MX.nivel;
  document.querySelectorAll("#vMultiplicar .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === MX.modo));
  $("muHechos").textContent = MX.hechos ? "★ "+MX.hechos : "";
  $("muNivelCaja").hidden = MX.modo === "construir";
  let h = "";
  if(MX.modo === "construir"){
    const {n, veces} = MX;
    h = '<div class="mu-mandos"><div class="mu-elige" role="group" aria-label="Elige la regleta">'+
        Array.from({length:10}, (_, i)=> i + 1).map(x=> '<button class="mu-r'+(x === n ? " elegida" : "")+'" data-n="'+x+'" aria-pressed="'+(x === n)+'" aria-label="Regleta del '+x+'" style="--n:'+x+';background:'+REGLETA[x].c+';color:'+REGLETA[x].t+'">'+x+'</button>').join("")+'</div>'+
        '<div class="mu-veces" role="group" aria-label="Cuántas veces"><button class="icbtn" id="muMenos" data-icon="menos" aria-label="Una vez menos"'+(veces <= 1 ? " disabled" : "")+'></button>'+
          '<b aria-live="polite">'+veces+(veces === 1 ? " vez" : " veces")+'</b><button class="icbtn" id="muMas" data-icon="mas" aria-label="Una vez más"'+(veces >= 10 ? " disabled" : "")+'></button></div></div>';
    h += '<p class="ap-pregunta"><b>'+veces+'</b> '+(veces === 1 ? "vez" : "veces")+' el <b>'+n+'</b></p>';
    h += '<div class="mu-dos'+(MX.girada ? " girada" : "")+'"><figure>'+trenMX(n, veces)+'<figcaption>'+veces+' × '+n+' = <b>'+veces * n+'</b></figcaption></figure>'+
         (MX.girada ? '<span class="mu-igual" aria-hidden="true">=</span><figure>'+trenMX(veces, n)+'<figcaption>'+n+' × '+veces+' = <b>'+veces * n+'</b></figcaption></figure>' : '')+'</div>';
    h += '<p class="mu-suma">'+sumaRepetida(n, veces)+'</p>';
    if(MX.girada) h += '<p class="ap-explica bien">'+veces+' veces el '+n+' y '+n+' veces el '+veces+' ocupan lo mismo: '+veces+' × '+n+' = '+n+' × '+veces+' = '+veces * n+'. Da igual el orden.</p>';
    h += '<div class="pt-acciones"><button class="bt suave" id="muGirar" aria-pressed="'+MX.girada+'">'+(MX.girada ? "Quitar la vuelta" : "Darle la vuelta ("+n+" veces el "+veces+")")+'</button></div>';
  }else{
    const pasos = pasosMX(r), terminado = MX.paso >= pasos.length;
    if(MX.modo === "cuantas"){
      h = '<p class="ap-pregunta">¿Cuántas veces? ¿Cuánto es?</p><div class="mu-dos"><figure>'+trenMX(r.n, r.veces, {etiqueta: MX.paso > 0})+'</figure></div>';
    }else if(r.tipo === "doble"){
      h = '<p class="ap-pregunta">El doble de <b>'+r.n+'</b></p><div class="mu-dos"><figure>'+barraMX(r.n)+(terminado ? barraMX(r.n) : '')+'</figure></div>'+(terminado ? '<p class="mu-suma">'+r.n+' + '+r.n+' = '+2*r.n+' · 2 × '+r.n+' = '+2*r.n+'</p>' : '');
    }else{
      h = '<p class="ap-pregunta">La mitad de <b>'+r.n+'</b></p><div class="mu-dos"><figure>'+barraMX(r.n)+(terminado ? '<div class="mu-mitades">'+barraMX(r.n / 2)+barraMX(r.n / 2)+'</div>' : '<div class="mu-mitades vacia"><i style="--n:'+r.n / 2+'"></i><i style="--n:'+r.n / 2+'"></i></div>')+'</figure></div>'+
          (terminado ? '<p class="mu-suma">'+r.n / 2+' + '+r.n / 2+' = '+r.n+'</p>' : '');
    }
    h += '<div class="ap-pasos ci-pasos">';
    pasos.forEach((p, i)=>{
      if(i > MX.paso) return;
      const actual = i === MX.paso;
      h += '<p>'+p.antes+' <span class="ap-campo'+(actual ? " activo"+(MX.aviso ? " mal" : "") : " bien")+'">'+(actual ? (MX.escrito || "?") : p.r)+'</span></p>';
    });
    h += '</div>';
    if(terminado) h += '<p class="ap-explica bien" role="status">¡Muy bien!'+(MX.modo === "cuantas" ? " "+r.veces+" veces el "+r.n+" = "+sumaRepetida(r.n, r.veces) : "")+'</p><div class="pt-acciones"><button class="bt azul" id="muOtro">Otra</button></div>';
    else{
      if(MX.aviso) h += '<p class="ap-explica mal" role="status">'+MX.aviso+'</p>';
      h += '<div class="pt-acciones"><button class="bt suave" id="muPista">Pista</button><button class="bt suave" id="muOtro">Otra</button></div>';
    }
  }
  c.innerHTML = h;
  pintarIconos(c);
  $("muTeclado").hidden = MX.modo === "construir" || MX.paso >= pasosMX(r || {}).length;
  c.querySelectorAll(".mu-r").forEach(b=> b.onclick = ()=>{ MX.n = +b.dataset.n; guardarMX(); pintarMultiplicar(); c.querySelector(".mu-r.elegida")?.focus(); });
  $("muMenos")?.addEventListener("click", ()=>{ MX.veces = Math.max(1, MX.veces - 1); guardarMX(); pintarMultiplicar(); $("muMenos")?.focus(); });
  $("muMas")?.addEventListener("click", ()=>{ MX.veces = Math.min(10, MX.veces + 1); guardarMX(); pintarMultiplicar(); $("muMas")?.focus(); });
  $("muGirar")?.addEventListener("click", ()=>{ MX.girada = !MX.girada; pintarMultiplicar(); });
  $("muOtro")?.addEventListener("click", nuevoRetoMX);
  $("muPista")?.addEventListener("click", ()=>{ MX.aviso = pasosMX(r)[MX.paso].pista; pintarMultiplicar(); });
}
/* Un número como barra de regletas: dieces naranjas y la de los unos, una detrás de otra */
function barraMX(v){
  const l = [...Array(Math.floor(v / 10)).fill(10), ...(v % 10 ? [v % 10] : [])];
  return '<div class="mu-barra" role="img" aria-label="'+v+'">'+l.map(x=> '<i style="--n:'+x+';background:'+REGLETA[x].c+';color:'+REGLETA[x].t+'">'+x+'</i>').join("")+'</div>';
}
function teclaMX(t){
  if(MX.modo === "construir" || !MX.reto) return;
  const pasos = pasosMX(MX.reto), p = pasos[MX.paso];
  if(!p) return;
  if(t === "⌫"){ MX.escrito = MX.escrito.slice(0, -1); MX.aviso = ""; }
  else if(t !== "✓"){ if(MX.escrito.length < 3){ MX.escrito += t; MX.aviso = ""; } }
  else if(MX.escrito){
    if(+MX.escrito === p.r){ MX.paso++; MX.aviso = ""; if(MX.paso >= pasos.length) MX.hechos++; }
    else MX.aviso = MX.escrito+" no es. "+p.pista;
    MX.escrito = "";
  }
  pintarMultiplicar();
  if(MX.paso >= pasos.length) $("muOtro")?.focus();
}
function tecladoMultiplicar(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if(MX.modo === "construir"){
    if(e.key === "+" || e.key === "ArrowUp"){ e.preventDefault(); MX.veces = Math.min(10, MX.veces + 1); pintarMultiplicar(); }
    else if(e.key === "-" || e.key === "ArrowDown"){ e.preventDefault(); MX.veces = Math.max(1, MX.veces - 1); pintarMultiplicar(); }
    else if(/^[0-9]$/.test(e.key)){ e.preventDefault(); MX.n = e.key === "0" ? 10 : +e.key; pintarMultiplicar(); }
    else if(e.key === "g" || e.key === "G"){ MX.girada = !MX.girada; pintarMultiplicar(); }
    return;
  }
  if(/^[0-9]$/.test(e.key)){ e.preventDefault(); teclaMX(e.key); }
  else if(e.key === "Backspace"){ e.preventDefault(); teclaMX("⌫"); }
  else if(e.key === "Enter" && e.target.tagName !== "BUTTON"){ e.preventDefault(); MX.paso >= pasosMX(MX.reto).length ? nuevoRetoMX() : teclaMX("✓"); }
}
