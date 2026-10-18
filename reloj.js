/* =====================================================================
   EL RELOJ (#/reloj)
   Un reloj de agujas grande para la pizarra: las agujas se arrastran con el dedo o el ratón (la de las horas
   avanza sola al mover la de los minutos, como en un reloj de verdad).
   - Libre: mover las agujas y ver la hora en palabras («las tres y cuarto») y en digital.
   - ¿Qué hora es?: el reloj marca una hora y se elige entre tres en palabras.
   - Pon la hora: se pide una hora en palabras y se colocan las agujas.
   - ¿Cuánto tiempo pasa?: dos relojes (empieza y acaba) y se elige cuánto ha durado.
   Niveles: en punto y media; y cuarto y menos cuarto; de 5 en 5 minutos. Ayudas: los minutos alrededor de la
   esfera (5, 10, 15…) y la hora en digital. Las horas salen del banco (banco.js): no se repiten.
   Usa las utilidades de index.html, herramientas.js y aula.js ($, leer, guardar, esc, pintarIconos, azar…).
   ===================================================================== */

const RJ = Object.assign({modo:"leer", nivel:"media", minutos:true, digital:false}, leer("aula-reloj", {}),
  {t:3*60 + 15, reto:null, respuesta:null, aviso:"", hechos:0, arrastrando:null});
let relojListo = false;
const guardarRJ = () => guardar("aula-reloj", {modo:RJ.modo, nivel:RJ.nivel, minutos:RJ.minutos, digital:RJ.digital});
const NIVELES_RJ = {media:{txt:"En punto y media", paso:30}, cuarto:{txt:"Y cuarto, menos cuarto", paso:15}, cinco:{txt:"De 5 en 5 minutos", paso:5}};
const HORAS_RJ = ["doce", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once"];
const MIN_RJ = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "cuarto",
  "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco",
  "veintiséis", "veintisiete", "veintiocho", "veintinueve", "media"];

/* ---------- La hora en palabras y en digital ---------- */
function horaEnPalabras(t){
  const h = Math.floor(t / 60) % 12, m = t % 60, la = x => (x === 1 ? "la " : "las ") + HORAS_RJ[x];
  if(m === 0) return la(h) + " en punto";
  if(m <= 30) return la(h) + " y " + MIN_RJ[m];
  return la((h + 1) % 12) + " menos " + MIN_RJ[60 - m];
}
const horaDigital = t => { const h = Math.floor(t / 60) % 12 || 12, m = t % 60; return h + ":" + String(m).padStart(2, "0"); };
const mayuscula = s => s[0].toUpperCase() + s.slice(1);
function duracionEnPalabras(min){
  const h = Math.floor(min / 60), m = min % 60, horas = h ? (h === 1 ? "1 hora" : h + " horas") : "";
  if(!m) return horas;
  const resto = m === 30 ? "media" : m === 15 ? "un cuarto" : m === 45 ? "tres cuartos" : m + " minutos";
  if(!h) return m === 30 ? "media hora" : m === 15 ? "un cuarto de hora" : m === 45 ? "tres cuartos de hora" : m + " minutos";
  return horas + " y " + resto;
}

/* ---------- Los retos ---------- */
function listaRJ(nivel){
  const paso = NIVELES_RJ[nivel].paso, l = [];
  for(let t=0; t<720; t+=paso) if(nivel === "media" || t % (nivel === "cuarto" ? 30 : 15)) l.push({k:"h"+t, t});   // en cada nivel, sobre todo lo nuevo
  return l;
}
function nuevoRetoRJ(){
  const paso = NIVELES_RJ[RJ.nivel].paso;
  RJ.respuesta = null; RJ.aviso = "";
  if(RJ.modo === "leer" || RJ.modo === "poner"){
    const {t} = delMazo("rj-"+RJ.nivel, listaRJ(RJ.nivel));
    const opciones = new Set([t]);
    const parecidas = [t + 60, t - 60, (t + 30) % 720, 720 - t, Math.floor(t/60)*60 + (60 - t % 60) % 60, t + paso, t - paso].map(x=> ((x % 720) + 720) % 720);
    for(const x of barajar(parecidas)) if(opciones.size < 3 && x % paso === 0) opciones.add(x);
    RJ.reto = {t, opciones: barajar([...opciones])};
    if(RJ.modo === "poner") RJ.t = (t + 4 * 60 + paso * 2) % 720;   // las agujas empiezan en otra hora
  }else if(RJ.modo === "intervalo"){
    const durs = RJ.nivel === "media" ? [30, 60, 90, 120, 150, 180] : RJ.nivel === "cuarto" ? [15, 30, 45, 60, 75, 90, 105, 120] : [5, 10, 20, 25, 35, 40, 50, 65, 80];
    const d = durs[azar(0, durs.length - 1)], inicio = azar(0, Math.floor(719 / paso)) * paso;
    const opciones = new Set([d]);
    for(const x of barajar(durs.filter(x=> x !== d))) if(opciones.size < 3) opciones.add(x);
    RJ.reto = {inicio, fin:(inicio + d) % 720, d, opciones: barajar([...opciones])};
  }
  pintarReloj();
}

/* ---------- El reloj en SVG ---------- */
function esferaRJ(t, opciones){
  const o = Object.assign({grande:true, minutos:RJ.minutos, mover:false}, opciones), m = t % 60, h = (t / 60) % 12;
  let s = '<svg class="rj-esfera'+(o.mover ? " movible" : "")+'" viewBox="-180 -180 360 360" role="img" aria-label="Reloj que marca '+horaEnPalabras(t)+'">';
  s += '<circle r="150" class="rj-borde"/><circle r="140" class="rj-fondo"/>';
  for(let i=0; i<60; i++){
    const a = i * 6 * Math.PI / 180, largo = i % 5 ? 6 : 13;
    s += '<line x1="'+(Math.sin(a)*136).toFixed(1)+'" y1="'+(-Math.cos(a)*136).toFixed(1)+'" x2="'+(Math.sin(a)*(136-largo)).toFixed(1)+'" y2="'+(-Math.cos(a)*(136-largo)).toFixed(1)+'" class="'+(i % 5 ? "rj-raya" : "rj-raya5")+'"/>';
  }
  for(let n=1; n<=12; n++){
    const a = n * 30 * Math.PI / 180;
    s += '<text x="'+(Math.sin(a)*104).toFixed(1)+'" y="'+(-Math.cos(a)*104 + 10).toFixed(1)+'" class="rj-num">'+n+'</text>';
    if(o.minutos) s += '<text x="'+(Math.sin(a)*164).toFixed(1)+'" y="'+(-Math.cos(a)*164 + 6).toFixed(1)+'" class="rj-min">'+(n === 12 ? "00" : String(n*5).padStart(2, "0"))+'</text>';
  }
  const aguja = (ang, largo, ancho, clase) => '<g class="rj-aguja '+clase+'" transform="rotate('+ang.toFixed(1)+')"><line y1="16" y2="'+(-largo)+'" stroke-width="'+ancho+'"/><circle cy="'+(-largo)+'" r="'+(ancho/2)+'"/></g>';
  s += aguja(h * 30, 70, 12, "horas") + aguja(m * 6, 118, 7, "minutos") + '<circle r="9" class="rj-eje"/></svg>';
  return s;
}

function iniciarReloj(){
  if(!relojListo){
    relojListo = true;
    pintarIconos($("vReloj"));
    $("rjNivel").innerHTML = Object.entries(NIVELES_RJ).map(([k,v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("rjNivel").onchange = e=>{ RJ.nivel = e.target.value; guardarRJ(); nuevoRetoRJ(); };
    document.querySelectorAll("#vReloj .segmentos button").forEach(b=> b.onclick = ()=>{ RJ.modo = b.dataset.modo; guardarRJ(); nuevoRetoRJ(); });
    $("rjMinutos").onclick = ()=>{ RJ.minutos = !RJ.minutos; guardarRJ(); pintarReloj(); };
    $("rjDigital").onclick = ()=>{ RJ.digital = !RJ.digital; guardarRJ(); pintarReloj(); };
    if(document.fullscreenEnabled) $("rjPantalla").onclick = ()=> pantallaCompleta("vReloj"); else $("rjPantalla").hidden = true;
  }
  if(!RJ.reto && RJ.modo !== "libre") nuevoRetoRJ(); else pintarReloj();
}

function pintarReloj(){
  $("rjNivel").value = RJ.nivel;
  document.querySelectorAll("#vReloj .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === RJ.modo));
  $("rjMinutos").setAttribute("aria-pressed", RJ.minutos); $("rjDigital").setAttribute("aria-pressed", RJ.digital);
  $("rjHechos").textContent = RJ.hechos ? "★ "+RJ.hechos : "";
  const c = $("rjCuerpo"), r = RJ.reto, respondido = RJ.respuesta !== null;
  let h = "";
  if(RJ.modo === "libre"){
    h = '<p class="ap-pregunta">Mueve las agujas</p>'+esferaRJ(RJ.t, {mover:true})+
        '<p class="rj-hora" aria-live="polite">'+mayuscula(horaEnPalabras(RJ.t))+(RJ.digital ? ' <span class="rj-dig">'+horaDigital(RJ.t)+'</span>' : '')+'</p>'+
        '<p class="rj-ayuda">La aguja <b class="rj-c-h">corta</b> marca la hora y la <b class="rj-c-m">larga</b>, los minutos.</p>';
  }else if(RJ.modo === "leer"){
    h = '<p class="ap-pregunta">¿Qué hora es?</p>'+esferaRJ(r.t)+(RJ.digital ? '<p class="rj-hora"><span class="rj-dig">'+horaDigital(r.t)+'</span></p>' : '')+
        '<div class="ap-opciones">'+r.opciones.map(x=>{
          const clase = !respondido ? "" : x === r.t ? " bien" : x === RJ.respuesta ? " mal" : "";
          return '<button class="ap-opcion texto'+clase+'" data-t="'+x+'"'+(respondido ? " disabled" : "")+'>'+mayuscula(horaEnPalabras(x))+'</button>'; }).join("")+'</div>';
    if(respondido) h += explicacionRJ(r.t, RJ.respuesta === r.t);
  }else if(RJ.modo === "poner"){
    h = '<p class="ap-pregunta">Pon <b>'+horaEnPalabras(r.t)+'</b></p>'+esferaRJ(respondido ? r.t : RJ.t, {mover:!respondido})+
        (RJ.digital && !respondido ? '<p class="rj-hora"><span class="rj-dig">'+horaDigital(RJ.t)+'</span></p>' : '');
    if(respondido) h += explicacionRJ(r.t, RJ.respuesta === r.t, RJ.respuesta);
    else h += (RJ.aviso ? '<p class="ap-explica mal" role="status">'+esc(RJ.aviso)+'</p>' : '')+'<div class="pt-acciones"><button class="bt azul" id="rjComprobar">Comprobar</button></div>';
  }else{
    h = '<p class="ap-pregunta">¿Cuánto tiempo pasa?</p><div class="rj-dos">'+
          '<figure><figcaption>Empieza</figcaption>'+esferaRJ(r.inicio, {minutos:false})+'<p>'+(RJ.digital || respondido ? horaDigital(r.inicio) : "&nbsp;")+'</p></figure>'+
          '<span class="rj-flecha" aria-hidden="true">→</span>'+
          '<figure><figcaption>Acaba</figcaption>'+esferaRJ(r.fin, {minutos:false})+'<p>'+(RJ.digital || respondido ? horaDigital(r.fin) : "&nbsp;")+'</p></figure></div>'+
        '<div class="ap-opciones">'+r.opciones.map(x=>{
          const clase = !respondido ? "" : x === r.d ? " bien" : x === RJ.respuesta ? " mal" : "";
          return '<button class="ap-opcion texto'+clase+'" data-t="'+x+'"'+(respondido ? " disabled" : "")+'>'+mayuscula(duracionEnPalabras(x))+'</button>'; }).join("")+'</div>';
    if(respondido) h += '<p class="ap-explica '+(RJ.respuesta === r.d ? "bien" : "mal")+'" role="status">'+(RJ.respuesta === r.d ? "¡Muy bien! " : "Casi. ")+
      "De "+horaEnPalabras(r.inicio)+" a "+horaEnPalabras(r.fin)+" pasa"+(r.d >= 120 ? "n " : " ")+duracionEnPalabras(r.d)+".</p>";
  }
  if(RJ.modo !== "libre" && respondido) h += '<div class="pt-acciones"><button class="bt azul" id="rjOtra">Otra hora</button></div>';
  c.innerHTML = h;
  c.querySelectorAll(".ap-opcion").forEach(b=> b.onclick = ()=> responderRJ(+b.dataset.t));
  $("rjOtra")?.addEventListener("click", nuevoRetoRJ);
  $("rjComprobar")?.addEventListener("click", ()=> responderRJ(RJ.t));
  const esf = c.querySelector(".rj-esfera.movible");
  if(esf) esf.addEventListener("pointerdown", e=> empezarAgujaRJ(e, esf));
}
function explicacionRJ(t, bien, puesta){
  const m = t % 60, h = Math.floor(t / 60) % 12 || 12;
  const pista = m === 0 ? "la aguja larga en el 12 y la corta en el "+h
    : "la aguja larga en el "+(m / 5 || 12)+(m % 5 ? "" : " ("+m+" minutos)")+" y la corta "+(m === 30 ? "entre el "+h+" y el "+(h % 12 + 1) : m < 30 ? "pasado el "+h : "llegando al "+(h % 12 + 1));
  return '<p class="ap-explica '+(bien ? "bien" : "mal")+'" role="status">'+(bien ? "¡Muy bien! " : (puesta !== undefined ? "Has puesto "+horaEnPalabras(puesta)+". " : "Casi. "))+
    mayuscula(horaEnPalabras(t))+": "+pista+".</p>";
}
function responderRJ(x){
  if(RJ.respuesta !== null) return;
  RJ.respuesta = x;
  const bien = RJ.modo === "intervalo" ? x === RJ.reto.d : x === RJ.reto.t;
  if(bien) RJ.hechos++;
  pintarReloj();
  $("rjOtra")?.focus();
}

/* ---------- Mover las agujas ---------- */
function empezarAgujaRJ(e, esf){
  e.preventDefault();
  const caja = esf.getBoundingClientRect(), cx = caja.left + caja.width/2, cy = caja.top + caja.height/2, escala = 360 / caja.width;
  const punto = ev => { const x = (ev.clientX - cx) * escala, y = (ev.clientY - cy) * escala; return {d: Math.hypot(x, y), ang: (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360}; };
  const p0 = punto(e), cual = p0.d < 85 ? "horas" : "minutos", paso = RJ.modo === "libre" ? 1 : NIVELES_RJ[RJ.nivel].paso;
  try{ esf.setPointerCapture(e.pointerId); }catch(err){}
  const mover = ev=>{
    const {ang} = punto(ev), h = Math.floor(RJ.t / 60), m = RJ.t % 60;
    if(cual === "minutos"){
      const nm = Math.round(ang / 6 / paso) * paso % 60;
      let nh = h;
      if(m >= 45 && nm < 15) nh++;          // pasa por el 12 hacia delante: una hora más
      else if(m < 15 && nm >= 45) nh--;     // hacia atrás
      RJ.t = ((nh * 60 + nm) % 720 + 720) % 720;
    }else{
      const nh = Math.floor(((ang - m / 2) + 360) % 360 / 30 + .5) % 12;
      RJ.t = nh * 60 + m;
    }
    const nuevo = esferaRJ(RJ.t, {mover:true});
    esf.innerHTML = new DOMParser().parseFromString(nuevo, "image/svg+xml").documentElement.innerHTML;
    esf.setAttribute("aria-label", "Reloj que marca "+horaEnPalabras(RJ.t));
    const texto = document.querySelector("#rjCuerpo .rj-hora");
    if(texto && RJ.modo === "libre") texto.innerHTML = mayuscula(horaEnPalabras(RJ.t))+(RJ.digital ? ' <span class="rj-dig">'+horaDigital(RJ.t)+'</span>' : '');
    else if(texto) texto.innerHTML = '<span class="rj-dig">'+horaDigital(RJ.t)+'</span>';
  };
  const soltar = ()=>{ esf.removeEventListener("pointermove", mover); esf.removeEventListener("pointerup", soltar); esf.removeEventListener("pointercancel", soltar); };
  esf.addEventListener("pointermove", mover); esf.addEventListener("pointerup", soltar); esf.addEventListener("pointercancel", soltar);
  mover(e);
}
function tecladoReloj(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const paso = RJ.modo === "libre" ? 5 : NIVELES_RJ[RJ.nivel].paso;
  if((RJ.modo === "libre" || (RJ.modo === "poner" && RJ.respuesta === null)) && /^Arrow(Left|Right|Up|Down)$/.test(e.key)){
    e.preventDefault();
    const d = {ArrowRight:paso, ArrowLeft:-paso, ArrowUp:60, ArrowDown:-60}[e.key];
    RJ.t = ((RJ.t + d) % 720 + 720) % 720; pintarReloj();
  }else if(e.key === "Enter" && e.target.tagName !== "BUTTON"){
    e.preventDefault();
    if(RJ.respuesta !== null) nuevoRetoRJ(); else if(RJ.modo === "poner") responderRJ(RJ.t);
  }else if(/^[1-3]$/.test(e.key) && RJ.respuesta === null && (RJ.modo === "leer" || RJ.modo === "intervalo")){
    const x = RJ.reto.opciones[+e.key - 1]; if(x !== undefined) responderRJ(x);
  }
}
