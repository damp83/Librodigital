/* =====================================================================
   GEOPLANO (#/geoplano)
   - Libre: gomas de colores entre los clavos (5×5, 7×7 o 10×10). Se toca un clavo para empezar,
     se van tocando los siguientes y se toca el primero para cerrar. Un vértice se arrastra a otro clavo.
   - Copia la figura: un modelo a la izquierda y el geoplano del alumno a la derecha.
   - Simetría: media figura junto al eje; hay que dibujar su reflejo al otro lado.
   De cada goma cerrada dice su nombre, lados, vértices, área (en cuadraditos) y perímetro.
   Usa las utilidades de index.html y herramientas.js ($, leer, guardar, pintarIconos, pantallaCompleta…).
   ===================================================================== */

const GP_COLORES = [
  {c:"#e3261f", n:"roja"}, {c:"#2c77c4", n:"azul"}, {c:"#2c8537", n:"verde"},
  {c:"#f2c200", n:"amarilla"}, {c:"#f57c22", n:"naranja"}, {c:"#c2185b", n:"rosa"}];
const GP_FIGURAS = [   // modelos para copiar (geoplano 5×5, coordenadas de 0 a 4)
  {n:"Cuadrado", p:[[1,1],[3,1],[3,3],[1,3]]},
  {n:"Rectángulo", p:[[0,1],[4,1],[4,3],[0,3]]},
  {n:"Triángulo", p:[[2,0],[4,4],[0,4]]},
  {n:"Triángulo rectángulo", p:[[0,1],[3,4],[0,4]]},
  {n:"Cuadrado girado", p:[[2,0],[4,2],[2,4],[0,2]]},
  {n:"Trapecio", p:[[1,1],[3,1],[4,3],[0,3]]},
  {n:"Casa", p:[[2,0],[4,2],[4,4],[0,4],[0,2]]},
  {n:"Hexágono", p:[[1,0],[3,0],[4,2],[3,4],[1,4],[0,2]]},
  {n:"Letra L", p:[[0,0],[1,0],[1,3],[3,3],[3,4],[0,4]]},
  {n:"Flecha", p:[[0,1],[2,1],[2,0],[4,2],[2,4],[2,3],[0,3]]},
  {n:"Rectángulo de pie", p:[[1,0],[3,0],[3,4],[1,4]]},
  {n:"Cuadrado grande", p:[[0,0],[4,0],[4,4],[0,4]]},
  {n:"Cuadrado pequeño", p:[[1,1],[2,1],[2,2],[1,2]]},
  {n:"Triángulo rectángulo grande", p:[[0,0],[4,4],[0,4]]},
  {n:"Triángulo del revés", p:[[0,0],[4,0],[2,4]]},
  {n:"Paralelogramo", p:[[1,1],[4,1],[3,3],[0,3]]},
  {n:"Rombo", p:[[2,0],[3,2],[2,4],[1,2]]},
  {n:"Pentágono", p:[[2,0],[4,1],[3,4],[1,4],[0,1]]},
  {n:"Letra T", p:[[0,0],[4,0],[4,1],[3,1],[3,4],[1,4],[1,1],[0,1]]},
  {n:"Escalera", p:[[0,4],[0,3],[1,3],[1,2],[2,2],[2,1],[3,1],[3,0],[4,0],[4,4]]},
  {n:"Cruz", p:[[1,0],[3,0],[3,1],[4,1],[4,3],[3,3],[3,4],[1,4],[1,3],[0,3],[0,1],[1,1]]},
  {n:"Trapecio rectángulo", p:[[0,1],[2,1],[4,3],[0,3]]},
  {n:"Barco", p:[[0,2],[4,2],[3,4],[1,4]]},
  {n:"Octógono", p:[[1,0],[3,0],[4,1],[4,3],[3,4],[1,4],[0,3],[0,1]]}];
const GP_MITADES = [   // simetría (geoplano 7×7, eje vertical en x = 3): la mitad izquierda
  {n:"Flecha", p:[[3,1],[1,3],[3,5]]},
  {n:"Árbol", p:[[3,0],[0,4],[2,4],[2,6],[3,6]]},
  {n:"Cuadrado", p:[[0,1],[2,1],[2,3],[0,3]]},
  {n:"Casa", p:[[3,0],[0,3],[0,6],[3,6]]},
  {n:"Barco", p:[[0,4],[3,4],[3,6],[1,6]]},
  {n:"Corazón", p:[[3,2],[2,1],[1,1],[0,2],[0,3],[3,6]]},
  {n:"Escalera", p:[[0,6],[0,4],[1,4],[1,2],[2,2],[2,0],[3,0],[3,6]]},
  {n:"Rombo", p:[[3,0],[1,3],[3,6]]},
  {n:"Pez", p:[[3,2],[1,1],[0,3],[1,5],[3,4]]},
  {n:"Copa", p:[[0,0],[3,0],[3,6],[1,6],[1,5],[2,5],[2,3],[0,2]]},
  {n:"Cohete", p:[[3,0],[2,2],[2,5],[0,6],[3,6]]},
  {n:"Mariposa", p:[[3,2],[1,0],[0,2],[1,3],[0,5],[2,6],[3,4]]},
  {n:"Corona", p:[[0,1],[1,3],[2,1],[3,3],[3,6],[0,6]]},
  {n:"Rectángulo separado", p:[[0,0],[1,0],[1,3],[0,3]]},
  {n:"Triángulo separado", p:[[0,6],[2,6],[0,4]]}];
/* Del banco (banco.js): las figuras no se repiten hasta haber salido todas */
const otraFigura = () => delMazo("gp-copiar", GP_FIGURAS.map((f,i)=> ({k:f.n, i}))).i;
const otraMitad = () => delMazo("gp-simetria", GP_MITADES.map((f,i)=> ({k:f.n, i}))).i;

const GP = Object.assign({n:5, color:0, medidas:true, gomas:[]}, leer("aula-geoplano", {}),
  {modo:"libre", alumno:[], modelo:0, mitad:0, ver:false, actual:null, elegida:null, tocada:false, cursor:[0,0], resultado:""});
let geoListo = false, gpArrastre = null;
const guardarGP = () => guardar("aula-geoplano", {n:GP.n, color:GP.color, medidas:GP.medidas, gomas:GP.gomas});
const ladoGP = () => GP.modo==="libre" ? GP.n : GP.modo==="copiar" ? 5 : 7;
const gomasGP = () => GP.modo==="libre" ? GP.gomas : GP.alumno;   // las gomas que se pueden tocar
const igual = (a, b) => a[0]===b[0] && a[1]===b[1];

function iniciarGeoplano(){
  if(!geoListo){
    geoListo = true;
    pintarIconos($("vGeoplano"));
    $("gpColores").innerHTML = GP_COLORES.map((c,i)=>'<button class="color-ficha" style="--col:'+c.c+'" data-i="'+i+'" aria-label="Goma '+c.n+'"></button>').join("");
    $("gpColores").querySelectorAll("button").forEach(b=> b.onclick = ()=>{
      GP.color = +b.dataset.i;
      const g = GP.tocada && GP.elegida!=null && gomasGP()[GP.elegida];
      if(g) g.color = GP.color;   // si se ha tocado una goma para elegirla, el color se le aplica a ella
      guardarGP(); pintarGeoplano(); });
    document.querySelectorAll("#vGeoplano .segmentos button").forEach(b=> b.onclick = ()=>{
      GP.modo = b.dataset.modo; GP.actual = null; GP.elegida = null; GP.alumno = []; GP.ver = false; GP.resultado = ""; GP.cursor = [0,0];
      if(GP.modo==="copiar") GP.modelo = otraFigura();
      if(GP.modo==="simetria") GP.mitad = otraMitad();
      pintarGeoplano(); });
    $("gpN").onchange = e=>{ GP.n = +e.target.value; GP.gomas = []; GP.actual = null; GP.elegida = null; guardarGP(); pintarGeoplano(); };
    $("gpMedidas").onclick = ()=>{ GP.medidas = !GP.medidas; guardarGP(); pintarGeoplano(); };
    $("gpDeshacer").onclick = deshacerGP;
    $("gpBorrar").onclick = borrarGomaGP;
    $("gpVaciar").onclick = ()=>{
      if(!gomasGP().length && !GP.actual) return;
      if(GP.modo==="libre" && !confirm("¿Quitar todas las gomas del geoplano?")) return;
      gomasGP().length = 0; GP.actual = null; GP.elegida = null; GP.resultado = ""; guardarGP(); pintarGeoplano(); };
    if(document.fullscreenEnabled) $("gpPantalla").onclick = ()=> pantallaCompleta("vGeoplano"); else $("gpPantalla").hidden = true;
    const t = $("gpTablero");
    t.addEventListener("pointerdown", pulsarGP);
    t.addEventListener("pointermove", moverGP);
    t.addEventListener("pointerup", soltarGP);
    t.addEventListener("pointercancel", ()=>{ gpArrastre = null; });
    t.addEventListener("keydown", tecladoTableroGP);
  }
  pintarGeoplano();
}

/* ---------- Geometría ---------- */
function sinAlineados(p){   // quita los vértices que están en medio de un lado recto
  let q = p.slice(), cambio = true;
  while(cambio && q.length > 3){
    cambio = false;
    for(let i=0; i<q.length; i++){
      const a = q[(i+q.length-1)%q.length], b = q[i], c = q[(i+1)%q.length];
      if((b[0]-a[0])*(c[1]-b[1]) - (b[1]-a[1])*(c[0]-b[0]) === 0){ q.splice(i,1); cambio = true; break; }
    }
  }
  return q;
}
const area2 = p => Math.abs(p.reduce((s,a,i)=>{ const b = p[(i+1)%p.length]; return s + a[0]*b[1] - b[0]*a[1]; }, 0));
const lado2 = (a, b) => (a[0]-b[0])**2 + (a[1]-b[1])**2;
const paralelos = (a, b, c, d) => (b[0]-a[0])*(d[1]-c[1]) - (b[1]-a[1])*(d[0]-c[0]) === 0;
function nombreFigura(p){
  const k = p.length, l = p.map((a,i)=> lado2(a, p[(i+1)%k]));
  const recto = i=>{ const a = p[(i+k-1)%k], b = p[i], c = p[(i+1)%k]; return (a[0]-b[0])*(c[0]-b[0]) + (a[1]-b[1])*(c[1]-b[1]) === 0; };
  const rectos = p.filter((_,i)=> recto(i)).length;
  if(k===3){
    const iso = l[0]===l[1] || l[1]===l[2] || l[0]===l[2];
    return "Triángulo" + (rectos ? " rectángulo" : "") + (iso ? " isósceles" : (rectos ? "" : " escaleno"));
  }
  if(k===4){
    const iguales = l.every(x=> x===l[0]), par1 = paralelos(p[0],p[1],p[3],p[2]), par2 = paralelos(p[1],p[2],p[0],p[3]);
    if(rectos===4) return iguales ? "Cuadrado" : "Rectángulo";
    if(iguales) return "Rombo";
    if(par1 && par2) return "Paralelogramo";
    if(par1 || par2) return "Trapecio";
    return "Cuadrilátero";
  }
  return ({5:"Pentágono", 6:"Hexágono", 7:"Heptágono", 8:"Octógono", 9:"Eneágono", 10:"Decágono"})[k] || "Polígono de "+k+" lados";
}
const numero = x => (Math.round(x*10)/10).toLocaleString("es-ES");
function describirGoma(g){
  if(!g) return "";
  const color = GP_COLORES[g.color].n;
  if(!g.cerrada){
    if(g.puntos.length===2){
      const d = Math.sqrt(lado2(g.puntos[0], g.puntos[1]));
      return "Goma "+color+": un segmento"+(GP.medidas ? " que mide "+(Number.isInteger(d) ? d : "unos "+numero(d))+" (de clavo a clavo)." : ".");
    }
    return "Goma "+color+": una línea abierta de "+(g.puntos.length-1)+" tramos.";
  }
  const p = sinAlineados(g.puntos), k = p.length, a = area2(p)/2;
  let txt = nombreFigura(p)+" ("+color+"): "+k+" lados y "+k+" vértices.";
  if(GP.medidas){
    const rectos = p.every((x,i)=>{ const y = p[(i+1)%k]; return x[0]===y[0] || x[1]===y[1]; });
    const per = p.reduce((s,x,i)=> s + Math.sqrt(lado2(x, p[(i+1)%k])), 0);
    txt += " Área: "+numero(a)+(a===1 ? " cuadradito" : " cuadraditos")+"."+
           " Perímetro: "+(rectos ? per+" unidades." : "unas "+numero(per)+" unidades (tiene lados en diagonal).");
  }
  return txt;
}
/* Forma canónica de un polígono, para comparar: sin vértices alineados, empezando por el menor y en un sentido fijo */
function canonica(p, trasladar){
  let q = sinAlineados(p);
  if(trasladar){ const mx = Math.min(...q.map(a=>a[0])), my = Math.min(...q.map(a=>a[1])); q = q.map(a=>[a[0]-mx, a[1]-my]); }
  const txt = r=>{ const i = r.reduce((m,a,j)=> (a[0]<r[m][0] || (a[0]===r[m][0] && a[1]<r[m][1])) ? j : m, 0);
                   return r.slice(i).concat(r.slice(0,i)).map(a=>a.join(",")).join(" "); };
  const a = txt(q), b = txt(q.slice().reverse());
  return a < b ? a : b;
}

/* ---------- Tablero ---------- */
const ESP = 100, MARGEN = 50;   // unidades del SVG entre clavos y en el borde
function clavoEn(e){
  const svg = $("gpTablero").querySelector("svg.gp-alumno"); if(!svg) return null;
  const m = svg.getScreenCTM(); if(!m) return null;
  const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  const n = ladoGP(), x = Math.round((pt.x-MARGEN)/ESP), y = Math.round((pt.y-MARGEN)/ESP);
  if(x<0 || y<0 || x>=n || y>=n) return null;
  const d = Math.hypot(pt.x-(MARGEN+x*ESP), pt.y-(MARGEN+y*ESP));
  return d <= ESP*.45 ? [x,y] : null;
}
function pulsarGP(e){
  if(e.button > 0) return;
  const c = clavoEn(e);
  if(!c){   // fuera de los clavos: elegir la goma tocada (o ninguna)
    const el = e.target.closest?.("svg.gp-alumno [data-goma]");
    GP.elegida = el ? +el.dataset.goma : null; GP.tocada = !!el; pintarGeoplano(); return;
  }
  e.preventDefault(); $("gpTablero").setPointerCapture?.(e.pointerId);
  GP.cursor = c;
  if(GP.actual){ gpArrastre = {clavo:c}; return; }
  // ¿es el vértice de una goma? (primero la elegida) → se puede arrastrar
  const gomas = gomasGP(), orden = gomas.map((_,i)=>i).reverse();
  if(GP.elegida!=null) orden.unshift(GP.elegida);
  for(const i of orden){
    const v = gomas[i].puntos.findIndex(p=> igual(p, c));
    if(v>=0){ gpArrastre = {clavo:c, goma:i, vertice:v, movido:false}; return; }
  }
  gpArrastre = {clavo:c};
}
function moverGP(e){
  if(!gpArrastre || gpArrastre.goma==null) return;
  const c = clavoEn(e); if(!c) return;
  const g = gomasGP()[gpArrastre.goma];
  if(!igual(c, g.puntos[gpArrastre.vertice]) && !g.puntos.some(p=> igual(p, c))){
    g.puntos[gpArrastre.vertice] = c; gpArrastre.movido = true; GP.elegida = gpArrastre.goma; GP.cursor = c; pintarGeoplano();
  }
}
function soltarGP(){
  const a = gpArrastre; gpArrastre = null;
  if(!a) return;
  if(a.movido){ GP.resultado = ""; guardarGP(); pintarGeoplano(); return; }
  tocarClavo(a.clavo);
}
function tocarClavo(c){
  GP.resultado = "";
  if(!GP.actual){
    GP.actual = {puntos:[c], cerrada:false, color:GP.color}; GP.tocada = false;
  }else{
    const p = GP.actual.puntos;
    if(igual(c, p[0]) && p.length >= 3){ terminarGoma(true); return; }
    if(p.some(x=> igual(x, c))) return;   // un clavo que ya tiene esta goma
    p.push(c);
  }
  pintarGeoplano();
}
function terminarGoma(cerrar){
  const g = GP.actual; GP.actual = null;
  if(g && g.puntos.length >= 2){
    g.cerrada = cerrar && g.puntos.length >= 3;
    if(g.cerrada && area2(g.puntos)===0) g.cerrada = false;   // todos los clavos en línea: queda como línea
    gomasGP().push(g); GP.elegida = gomasGP().length-1; GP.tocada = false;
    guardarGP();
  }
  pintarGeoplano();
}
function deshacerGP(){
  GP.resultado = "";
  if(GP.actual){ GP.actual.puntos.pop(); if(!GP.actual.puntos.length) GP.actual = null; }
  else if(gomasGP().length){ gomasGP().pop(); GP.elegida = null; guardarGP(); }
  pintarGeoplano();
}
function borrarGomaGP(){
  if(GP.actual){ GP.actual = null; pintarGeoplano(); return; }
  if(GP.elegida==null) return;
  gomasGP().splice(GP.elegida, 1); GP.elegida = null; GP.resultado = ""; guardarGP(); pintarGeoplano();
}

function svgGeoplano(n, gomas, opciones){
  const lado = MARGEN*2 + ESP*(n-1), pos = v => MARGEN + v*ESP;
  const puntos = p => p.map(a=> pos(a[0])+","+pos(a[1])).join(" ");
  let s = '<svg class="gp-svg'+(opciones.alumno ? ' gp-alumno' : '')+'" viewBox="0 0 '+lado+' '+lado+'" aria-hidden="true">'+
          '<rect class="gp-base" x="4" y="4" width="'+(lado-8)+'" height="'+(lado-8)+'" rx="28"/>';
  if(opciones.eje!=null) s += '<line class="gp-eje" x1="'+pos(opciones.eje)+'" y1="14" x2="'+pos(opciones.eje)+'" y2="'+(lado-14)+'"/>';
  (opciones.fantasmas||[]).forEach(p=>{ s += '<polygon class="gp-fantasma" points="'+puntos(p)+'"/>'; });
  (opciones.fijas||[]).forEach(g=>{ s += '<polygon class="gp-goma fija" points="'+puntos(g.puntos)+'" style="--c:'+GP_COLORES[g.color].c+'"/>'; });
  gomas.forEach((g,i)=>{
    const c = GP_COLORES[g.color].c, el = opciones.alumno && i===GP.elegida ? " elegida" : "";
    s += g.cerrada
      ? '<polygon class="gp-goma'+el+'" data-goma="'+i+'" points="'+puntos(g.puntos)+'" style="--c:'+c+'"/>'
      : '<polyline class="gp-goma abierta'+el+'" data-goma="'+i+'" points="'+puntos(g.puntos)+'" style="--c:'+c+'"/>';
  });
  if(opciones.actual){
    const g = opciones.actual;
    s += '<polyline class="gp-goma abierta haciendo" points="'+puntos(g.puntos)+'" style="--c:'+GP_COLORES[g.color].c+'"/>';
  }
  for(let y=0; y<n; y++) for(let x=0; x<n; x++){
    const inicio = opciones.actual && igual(opciones.actual.puntos[0], [x,y]);
    s += '<circle class="gp-clavo'+(inicio ? ' inicio' : '')+'" cx="'+pos(x)+'" cy="'+pos(y)+'" r="'+(n>7 ? 10 : 12)+'"/>';
  }
  if(opciones.cursor) s += '<circle class="gp-cursor" cx="'+pos(opciones.cursor[0])+'" cy="'+pos(opciones.cursor[1])+'" r="30"/>';
  return s + '</svg>';
}

function pintarGeoplano(){
  const n = ladoGP(), modo = GP.modo;
  document.querySelectorAll("#vGeoplano .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo===modo));
  $("gpN").value = GP.n; $("gpTamano").hidden = modo!=="libre";
  $("gpMedidas").setAttribute("aria-pressed", GP.medidas);
  $("gpColores").querySelectorAll("button").forEach(b=> b.setAttribute("aria-pressed", +b.dataset.i===GP.color));
  $("gpBorrar").disabled = GP.elegida==null && !GP.actual;
  $("gpDeshacer").disabled = !GP.actual && !gomasGP().length;
  const t = $("gpTablero");
  t.classList.toggle("doble", modo==="copiar");
  const cursor = document.activeElement===t || t.classList.contains("con-teclado") ? GP.cursor : null;
  let html = "";
  if(modo==="copiar"){
    const f = GP_FIGURAS[GP.modelo];
    html += '<figure class="gp-modelo"><figcaption>Modelo</figcaption>'+svgGeoplano(5, [{puntos:f.p, cerrada:true, color:1}], {})+'</figure>'+
            '<figure class="gp-mio"><figcaption>Tu geoplano</figcaption>'+svgGeoplano(5, GP.alumno, {alumno:true, actual:GP.actual, cursor})+'</figure>';
  }else if(modo==="simetria"){
    const m = GP_MITADES[GP.mitad];
    const fantasma = GP.ver ? [m.p.map(a=>[6-a[0], a[1]])] : [];
    html += '<figure class="gp-mio">'+svgGeoplano(7, GP.alumno, {alumno:true, actual:GP.actual, cursor, eje:3, fantasmas:fantasma,
            fijas:[{puntos:m.p, color:0}]})+'</figure>';
  }else{
    html += '<figure class="gp-mio">'+svgGeoplano(n, GP.gomas, {alumno:true, actual:GP.actual, cursor})+'</figure>';
  }
  t.innerHTML = html;
  // Texto de ayuda y medidas
  const g = GP.actual || (GP.elegida!=null ? gomasGP()[GP.elegida] : null);
  let ayuda;
  if(GP.actual) ayuda = GP.actual.puntos.length < 3 ? "Toca el siguiente clavo. Para cerrar la figura, vuelve al primero (el naranja)."
                                                     : "Sigue tocando clavos o vuelve al primero (el naranja) para cerrar la figura.";
  else if(g) ayuda = describirGoma(g);
  else ayuda = modo==="copiar" ? "Construye en tu geoplano la misma figura que el modelo. Puede estar en otro sitio."
             : modo==="simetria" ? "Dibuja al otro lado del eje la figura reflejada, como en un espejo."
             : "Toca un clavo para empezar una goma, ve tocando los siguientes y vuelve al primero para cerrarla.";
  $("gpAyuda").textContent = GP.resultado || ayuda;
  $("gpAyuda").classList.toggle("ok", GP.resultado.startsWith("¡"));
  // Acciones según el modo
  const acc = $("gpAcciones");
  const n2 = GP.actual ? GP.actual.puntos.length : 0;
  acc.innerHTML = (n2 >= 2 ? '<button class="bt azul" id="gpTerminar">'+svg("check")+(n2 >= 3 ? "Cerrar la figura" : "Dejar como segmento")+'</button>' : '')+
    (modo==="copiar" ? '<button class="bt suave" id="gpComprobar">Comprobar</button><button class="bt suave" id="gpOtra">Otra figura</button>' : '')+
    (modo==="simetria" ? '<button class="bt suave" id="gpComprobar">Comprobar</button><button class="bt suave" id="gpVer" aria-pressed="'+GP.ver+'">'+(GP.ver ? "Ocultar" : "Ver")+' la solución</button><button class="bt suave" id="gpOtra">Otra figura</button>' : '');
  $("gpTerminar")?.addEventListener("click", ()=> terminarGoma(true));
  $("gpComprobar")?.addEventListener("click", comprobarGP);
  $("gpVer")?.addEventListener("click", ()=>{ GP.ver = !GP.ver; pintarGeoplano(); });
  $("gpOtra")?.addEventListener("click", ()=>{
    if(modo==="copiar") GP.modelo = otraFigura();
    else GP.mitad = otraMitad();
    GP.alumno = []; GP.actual = null; GP.elegida = null; GP.ver = false; GP.resultado = ""; pintarGeoplano(); });
}
function comprobarGP(){
  const cerradas = GP.alumno.filter(g=> g.cerrada);
  let bien;
  if(GP.modo==="copiar"){
    const objetivo = canonica(GP_FIGURAS[GP.modelo].p, true);
    bien = cerradas.some(g=> canonica(g.puntos, true)===objetivo);
  }else{
    const objetivo = canonica(GP_MITADES[GP.mitad].p.map(a=>[6-a[0], a[1]]), false);
    bien = cerradas.some(g=> canonica(g.puntos, false)===objetivo);
  }
  GP.resultado = bien ? "¡Muy bien! Es "+(GP.modo==="copiar" ? "la misma figura." : "el reflejo exacto.")
    : !cerradas.length ? "Todavía no hay ninguna goma cerrada. Cierra la figura volviendo al primer clavo."
    : GP.modo==="copiar" ? "Todavía no: cuenta los clavos de cada lado y compáralos con el modelo."
    : "Todavía no: cada vértice tiene que estar a la misma distancia del eje, pero al otro lado.";
  pintarGeoplano();
}

/* ---------- Teclado: flechas para moverse por los clavos, Intro para tocar ---------- */
function tecladoTableroGP(e){
  const n = ladoGP(), c = GP.cursor;
  const mov = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]}[e.key];
  if(mov){
    e.preventDefault(); $("gpTablero").classList.add("con-teclado");
    GP.cursor = [Math.max(0, Math.min(n-1, c[0]+mov[0])), Math.max(0, Math.min(n-1, c[1]+mov[1]))];
    pintarGeoplano(); $("gpAyuda").textContent = "Clavo de la columna "+(GP.cursor[0]+1)+", fila "+(GP.cursor[1]+1)+".";
  }else if(e.key==="Enter" || e.key===" "){
    e.preventDefault(); $("gpTablero").classList.add("con-teclado"); tocarClavo(GP.cursor.slice());
  }
}
function tecladoGeoplano(e){
  if(/^(select|input|button)$/i.test(e.target.tagName)) return;
  if(e.key==="Backspace"){ e.preventDefault(); deshacerGP(); }
  else if(e.key==="Delete"){ e.preventDefault(); borrarGomaGP(); }
}
