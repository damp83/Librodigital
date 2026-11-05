/* =====================================================================
   LAS PAREJAS DEL 10 (#/parejas)
   Formar el 10 juntando cantidades y sumar después las unidades sueltas (composición y descomposición),
   con las regletas como ayuda visual (la naranja es el 10).
   - «Las huchas» (como la ficha «Buscar parejas del 10 y algo más»): en la hucha hay 3 números (o 5); se tocan
     los dos que forman 10, las regletas se juntan y miden lo mismo que la naranja, y se suma lo que queda:
     7, 2 y 3 → 7 + 3 = 10 → 10 + 2 = 12 €.
   - «Completa el 10» (descomponer para saltar el 10): 8 + 5 → al 8 le faltan 2 para 10 → el 5 se rompe en
     2 y 3 → 10 + 3 = 13. Con decenas: 28 + 5 → 30 + 3.
   - «Regletas» (ayuda): enseña u oculta las regletas. Ficha en papel de cada juego, con soluciones.
   Usa las utilidades de index.html, herramientas.js, banco.js, aproximar.js y secciones.js ($, leer, guardar,
   REGLETA, delMazo, barajar, apTeclado, pintarIconos, pantallaCompleta, hojaPapel, lanzarImpresion…).
   ===================================================================== */

const PJ = Object.assign({modo:"huchas", nivel:{huchas:"n1", salto:"n1"}, regletas:true}, leer("aula-parejas", {}),
  {reto:null, elegidos:[], parejas:[], fase:"", paso:0, escrito:"", aviso:"", tono:"", fallos:0, bien:0});
let parejasLista = false;
const guardarPJ = () => guardar("aula-parejas", {modo:PJ.modo, nivel:PJ.nivel, regletas:PJ.regletas});
/* base: el número redondo que se forma (10, 100, 1000); exacta: la pareja suma justo la base (7 + 3 = 10) o un
   múltiplo de ella (27 + 3 = 30); bloques: con números grandes, las regletas se agrupan (barra naranja = 10, placa = 100) */
const NIVELES_PJ = {
  huchas: {n1:{txt:"Tres números hasta 9", base:10, exacta:true}, n2:{txt:"Con un número mayor que 10", base:10, exacta:true},
           n3:{txt:"Cinco números: dos parejas del 10", base:10, exacta:true},
           n4:{txt:"Completa la decena (27 + 3)", base:10, exacta:false, bloques:true},
           n5:{txt:"Parejas del 100 (60 + 40)", base:100, exacta:true, bloques:true},
           n6:{txt:"Completa la centena (270 + 30)", base:100, exacta:false, bloques:true},
           n7:{txt:"Parejas del 1000 (300 + 700)", base:1000, exacta:true, bloques:true}},
  salto:  {n1:{txt:"8 o 9 + un número", base:10}, n2:{txt:"6, 7, 8 o 9 + un número", base:10}, n3:{txt:"Con decenas (28 + 5)", base:10},
           n4:{txt:"Hasta 100 (67 + 8)", base:10, bloques:true},
           n5:{txt:"Completa la centena (270 + 50)", base:100, bloques:true},
           n6:{txt:"Hasta 1000 (395 + 8)", base:10, bloques:true},
           n7:{txt:"Completa la centena (365 + 47)", base:100, bloques:true}}};
const nivelPJ = () => NIVELES_PJ[PJ.modo][PJ.nivel[PJ.modo]] ? PJ.nivel[PJ.modo] : "n1";
const datosPJ = (modo = PJ.modo, n = nivelPJ()) => NIVELES_PJ[modo][n];
const sumaPJ = l => l.reduce((a, b)=> a + b, 0);
/* ¿Forman pareja? Suman justo la base (exacta) o un número redondo de esa base */
const parejaPJ = (x, y, d) => d.exacta === false ? (x + y) % (d.base || 10) === 0 : x + y === (d.base || 10);
const redondoPJ = b => ({10:"una decena justa", 100:"una centena justa", 1000:"un millar"})[b];

/* Todos los retos posibles de cada nivel (el banco los saca sin repetir) */
function listaPJ(modo, nivel){
  const l = [], d = NIVELES_PJ[modo][nivel];
  const solaPJ = (a, b, x) => !parejaPJ(a, x, d) && !parejaPJ(b, x, d);   // el suelto no forma pareja con nadie
  if(modo === "huchas"){
    if(nivel === "n3"){
      for(let a=1; a<=5; a++) for(let c=a+1; c<=5; c++) for(let x=1; x<=9; x++)
        if(![a, 10 - a, c, 10 - c].includes(x)) l.push({k:a+"-"+c+"-"+x, nums:[a, 10 - a, c, 10 - c, x]});
    }else if(nivel === "n1" || nivel === "n2") for(let a=1; a<=5; a++){
      const sueltos = nivel === "n2" ? [11, 12, 13, 14, 15, 16, 17, 18, 19] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for(const x of sueltos) if(x !== a && x !== 10 - a) l.push({k:a+"-"+x, nums:[a, 10 - a, x]});
    }else{
      const pares = [], sueltos = {
        n4: [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29],
        n5: [10, 20, 30, 40, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 25, 48, 63, 120, 250, 305, 415],
        n6: [25, 45, 55, 60, 80, 115, 120, 130, 150, 205, 240, 315, 350, 410],
        n7: [5, 8, 20, 45, 60, 75, 100, 120, 200, 250, 300, 400]}[nivel];
      if(nivel === "n4") for(let t=1; t<=5; t++) for(let u=1; u<=9; u++) pares.push([10 * t + u, 10 - u]);
      if(nivel === "n5") for(const a of [10, 20, 30, 40, 50, 15, 25, 35, 45]) pares.push([a, 100 - a]);
      if(nivel === "n6") for(let c=1; c<=5; c++) for(let t=1; t<=9; t++) pares.push([100 * c + 10 * t, 10 * (10 - t)]);
      if(nivel === "n7") for(const a of [100, 200, 300, 400, 500, 150, 250, 350, 450]) pares.push([a, 1000 - a]);
      for(const [a, b] of pares) for(const x of sueltos)
        if(x !== a && x !== b && solaPJ(a, b, x) && (nivel === "n7" || a + b + x <= 1000)) l.push({k:a+"-"+b+"-"+x, nums:[a, b, x]});
    }
  }else{
    const add = (a, b) => l.push({k:a+"+"+b, a, b});
    if(nivel === "n5"){
      for(let c=1; c<=8; c++) for(let t=6; t<=9; t++) for(let b=20; b<=90; b+=10) if(10 * t + b > 100) add(100 * c + 10 * t, b);
    }else if(nivel === "n6"){
      for(let c=1; c<=8; c++) for(let u=4; u<=9; u++) for(let b=2; b<=9; b++) if(u + b > 10) add(100 * c + 90 + u, b);
    }else if(nivel === "n7"){
      for(let c=1; c<=8; c++) for(let t=5; t<=9; t++) for(const u of [5, 6, 7, 8]) for(let bt=1; bt<=4; bt++) for(const bu of [2, 4, 7]){
        const a = 10 * t + u, b = 10 * bt + bu;
        if(a + b > 100) add(100 * c + a, b);
      }
    }else{
      const decenas = nivel === "n4" ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : nivel === "n3" ? [1, 2, 3, 4] : [0];
      const primeros = nivel === "n1" ? [8, 9] : [6, 7, 8, 9];
      for(const d of decenas) for(const u of primeros) for(let b=2; b<=9; b++) if(u + b > 10) add(10 * d + u, b);
    }
  }
  return l;
}
/* Los pasos de «Completa el 10»: cuánto falta, cómo se rompe el segundo número y la suma final */
function pasosPJ(r){
  const base = r.base || 10, D = Math.ceil((r.a + 1) / base) * base, falta = D - r.a, resto = r.b - falta;
  return [{q:"¿Cuánto le falta al <b>"+r.a+"</b> para llegar a <b>"+D+"</b>?", pre:r.a+" + ", post:" = "+D, r:falta},
          {q:"Rompe el <b>"+r.b+"</b>: un trozo de <b>"+falta+"</b> y ¿cuánto queda?", pre:r.b+" = "+falta+" + ", post:"", r:resto},
          {q:"Ahora es fácil: <b>"+D+" + "+resto+"</b>", pre:D+" + "+resto+" = ", post:"", r:D + resto}];
}
function nuevoRetoPJ(){
  const n = nivelPJ(), r = Object.assign({}, delMazo("pj-"+PJ.modo+"-"+n, listaPJ(PJ.modo, n)));
  if(PJ.modo === "huchas") r.nums = barajar(r.nums.slice());
  const d = datosPJ(); Object.assign(r, {base:d.base, exacta:d.exacta, bloques:!!d.bloques});
  Object.assign(PJ, {reto:r, elegidos:[], parejas:[], paso:0, escrito:"", aviso:"", tono:"", fallos:0,
    fase: PJ.modo === "huchas" ? "parejas" : "escribir"});
  pintarParejas();
}

/* ---------- Regletas ---------- */
function regletaPJ(n, clase){
  const r = REGLETA[n];
  return '<span class="pj-reg'+(n === 1 ? " blanca" : "")+(clase ? " "+clase : "")+'" style="--n:'+n+';background:'+r.c+';color:'+r.t+'">'+n+'</span>';
}
/* Un número con sus regletas: naranjas para las decenas y una regleta para las unidades */
function regletasPJ(n, clase){
  let h = "";
  for(let d=0; d<Math.floor(n / 10); d++) h += regletaPJ(10, clase);
  return h + (n % 10 ? regletaPJ(n % 10, clase) : "");
}
/* Con números grandes, las regletas agrupadas: placas de 100 (10 naranjas juntas), barras naranjas de 10 y una regleta para las unidades */
function piezasPJ(n, clase){
  if(!PJ.reto?.bloques) return regletasPJ(n, clase);
  const c = Math.floor(n / 100), d = Math.floor(n % 100 / 10), u = n % 10, k = clase ? " "+clase : "";
  return '<span class="pj-bloques'+k+'">'+'<span class="pj-placa"></span>'.repeat(c)+'<span class="pj-barra"></span>'.repeat(d)+
    (u ? '<span class="pj-uni" style="--n:'+u+';background:'+REGLETA[u].c+'"></span>' : '')+'</span>';
}
/* Lo que ocupa un número en piezas (en cuadritos), para que la fila más larga quepa */
const anchoPJ = n => Math.floor(n / 100) * 10.8 + Math.floor(n % 100 / 10) * 1.5 + (n % 10 ? 1.5 : 0) + 1;
const filaPJ = (contenido, eti, clase) => '<div class="pj-fila'+(clase ? " "+clase : "")+'">'+(eti ? '<span class="pj-eti">'+eti+'</span>' : '')+'<span class="pj-tren">'+contenido+'</span></div>';

/* ---------- Las huchas ---------- */
function tocarPJ(i){
  if(PJ.fase !== "parejas" || PJ.parejas.flat().includes(i)) return;
  if(PJ.elegidos.includes(i)){ PJ.elegidos = PJ.elegidos.filter(x=> x !== i); pintarParejas(); return; }
  PJ.elegidos.push(i); PJ.aviso = ""; PJ.tono = "";
  if(PJ.elegidos.length === 2){
    const r = PJ.reto, [x, y] = PJ.elegidos.map(k=> r.nums[k]), s = x + y, B = r.base || 10;
    if(parejaPJ(x, y, r)){
      PJ.parejas.push(PJ.elegidos.slice());
      PJ.aviso = "¡Sí! "+x+" + "+y+" = "+s+". "+(!r.bloques ? "Juntas miden lo mismo que la regleta naranja." :
        B === 100 && r.exacta !== false ? "¡Una centena! 10 barras de 10 forman una placa de 100." : B === 1000 ? "¡Un millar! 10 placas de 100." :
        "Es "+redondoPJ(B)+": termina en "+(B === 10 ? "0" : "00")+"."); PJ.tono = "bien";
      const quedan = PJ.reto.nums.length - 2 * PJ.parejas.length;
      if(PJ.reto.nums.length === 5 && PJ.parejas.length === 1){ PJ.aviso += " Busca otra pareja del 10."; }
      else if(quedan <= 1) PJ.fase = "escribir";
    }else{
      PJ.fallos++; PJ.tono = "mal";
      PJ.aviso = x+" + "+y+" = "+s+": "+(r.exacta === false ? "no es "+redondoPJ(B)+" (no termina en "+(B === 10 ? "0" : "00")+")." :
        s < B ? "no llega a "+B+", le falta "+(B - s)+"." : "se pasa de "+B+".")+" Prueba con otra pareja.";
      PJ.malos = PJ.elegidos.slice();
    }
    PJ.elegidos = [];
  }
  pintarParejas();
}
const sueltosPJ = () => PJ.reto.nums.filter((_, i)=> !PJ.parejas.flat().includes(i));
function preguntaHuchaPJ(){
  return PJ.parejas.map(([i, j])=> PJ.reto.nums[i] + PJ.reto.nums[j]).concat(sueltosPJ()).join(" + ")+" = ";
}
/* Pista para sumar lo que queda: el 10 y las unidades sueltas */
function pistaHuchaPJ(){
  if(PJ.reto.bloques){
    const S = sumaPJ(PJ.parejas.map(([i, j])=> PJ.reto.nums[i] + PJ.reto.nums[j])), x = sueltosPJ()[0];
    const partes = [Math.floor(x / 100) * 100, Math.floor(x % 100 / 10) * 10, x % 10].filter(Boolean);
    return partes.length < 2 ? "Mira las piezas: "+S+" y "+x+" más." : "Suma por partes: "+S+" + "+partes[0]+", y luego "+partes.slice(1).join(" y ")+" más.";
  }
  const dieces = 10 * PJ.parejas.length, x = sueltosPJ()[0];
  if(x < 10) return "Mira las regletas: "+(dieces === 10 ? "una naranja (10)" : "dos naranjas (20)")+" y "+x+" suelt"+(x === 1 ? "a" : "as")+". "+dieces+" y "+x+" son…";
  return "El "+x+" es 10 y "+(x - 10)+". Primero 10 + 10 = 20, y luego "+(x - 10)+" más.";
}

/* ---------- Escribir con el teclado ---------- */
function teclaPJ(t){
  if(PJ.fase !== "escribir") return;
  if(t === "⌫"){ PJ.escrito = PJ.escrito.slice(0, -1); }
  else if(t !== "✓"){ if(PJ.escrito.length < 4) PJ.escrito += t; }
  else if(PJ.escrito){
    const v = +PJ.escrito; PJ.escrito = "";
    if(PJ.modo === "huchas"){
      const total = sumaPJ(PJ.reto.nums);
      if(v === total){ terminarPJ(); return; }
      PJ.fallos++; PJ.tono = "mal"; PJ.aviso = v+" no es. "+pistaHuchaPJ();
    }else{
      const pasos = pasosPJ(PJ.reto), p = pasos[PJ.paso];
      if(v === p.r){
        PJ.paso++; PJ.tono = "bien";
        PJ.aviso = ["¡Eso es! "+PJ.reto.a+" + "+p.r+" = "+pasos[0].post.slice(3)+".", "¡Bien! "+PJ.reto.b+" = "+pasos[0].r+" + "+p.r+".", ""][PJ.paso - 1];
        if(PJ.paso >= pasos.length){ terminarPJ(); return; }
      }else{
        PJ.fallos++; PJ.tono = "mal";
        PJ.aviso = v+" no es. "+[
          (PJ.reto.bloques ? "¿Cuánto hay del "+PJ.reto.a+" al "+pasos[0].post.slice(3)+"? Cuenta hacia delante." : "Mira el hueco que queda hasta completar "+pasos[0].post.slice(3)+": cuenta los cuadritos que faltan."),
          "Quita "+pasos[0].r+" al "+PJ.reto.b+": "+PJ.reto.b+" − "+pasos[0].r+" = ?",
          pasos[0].post.slice(3)+" y "+pasos[1].r+" más."][PJ.paso];
      }
    }
  }
  pintarParejas();
}
function terminarPJ(){
  PJ.fase = "hecho"; PJ.tono = "bien";
  if(!PJ.fallos) PJ.bien++;
  const r = PJ.reto;
  if(PJ.modo === "huchas"){
    const pares = PJ.parejas.map(([i, j])=> r.nums[i]+" + "+r.nums[j]);
    PJ.aviso = "¡Hay "+sumaPJ(r.nums)+" € en la hucha! "+pares.concat(sueltosPJ()).join(" + ")+" = "+preguntaHuchaPJ()+sumaPJ(r.nums)+".";
  }else{
    const p = pasosPJ(r);
    PJ.aviso = "¡Muy bien! "+r.a+" + "+r.b+" = "+r.a+" + "+p[0].r+" + "+p[1].r+" = "+p[0].post.slice(3)+" + "+p[1].r+" = "+p[2].r+".";
  }
  pintarParejas();
  $("pjOtro")?.focus();
}

/* ---------- Vista ---------- */
function iniciarParejas(){
  if(!parejasLista){
    parejasLista = true;
    pintarIconos($("vParejas"));
    document.querySelectorAll("#vParejas .segmentos button").forEach(b=> b.onclick = ()=>{ PJ.modo = b.dataset.modo; guardarPJ(); nuevoRetoPJ(); });
    $("pjNivel").onchange = e=>{ PJ.nivel[PJ.modo] = e.target.value; guardarPJ(); nuevoRetoPJ(); };
    $("pjRegletas").onclick = ()=>{ PJ.regletas = !PJ.regletas; guardarPJ(); pintarParejas(); };
    $("pjImprimir").onclick = imprimirParejas;
    apTeclado("pjTeclado", teclaPJ);
    if(document.fullscreenEnabled) $("pjPantalla").onclick = ()=> pantallaCompleta("vParejas"); else $("pjPantalla").hidden = true;
  }
  if(!PJ.reto) nuevoRetoPJ(); else pintarParejas();
}
const HUECOS_PJ = {3:[[30, 30], [72, 46], [34, 70]], 5:[[28, 28], [56, 24], [76, 50], [52, 72], [26, 64]]};
const HUCHA_SVG = '<svg class="pj-cerdo" viewBox="0 0 200 170" aria-hidden="true"><circle cx="102" cy="26" r="20" class="pj-moneda"/>'+
  '<path d="M44 52c-6-8-14-10-20-8 4 6 6 12 6 18C18 72 12 86 12 92H4v26h12c6 12 16 20 28 26v18h22v-12c10 2 26 3 40 2v10h22v-16c22-10 40-30 40-56 0-38-36-66-80-66-14 0-26 2-38 8z" class="pj-cuerpo"/>'+
  '<path d="M70 44c18-8 44-10 64-2" class="pj-raja"/><circle cx="36" cy="88" r="4" class="pj-ojo"/></svg>';
function pintarParejas(){
  const c = $("pjCuerpo"), modo = PJ.modo, n = nivelPJ(), r = PJ.reto;
  document.querySelectorAll("#vParejas .segmentos button").forEach(b=> b.setAttribute("aria-pressed", b.dataset.modo === modo));
  $("pjNivel").innerHTML = Object.entries(NIVELES_PJ[modo]).map(([k, v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
  $("pjNivel").value = n;
  $("pjRegletas").setAttribute("aria-pressed", PJ.regletas);
  let h = '<p class="ap-marcador"><span>'+(modo === "huchas" ? "¿Cuántos euros hay en la hucha?" : r.base === 100 ? "Completa la centena" : "Completa el 10")+'</span><span class="ap-puntos" aria-label="'+PJ.bien+' sin fallos">★ '+PJ.bien+'</span></p>';
  if(modo === "huchas") h += huchaPJ(); else h += saltoPJ();
  if(PJ.aviso) h += '<p class="ap-explica '+PJ.tono+'" role="status">'+PJ.aviso+'</p>';
  else h += '<p class="ap-explica pj-vacio" role="status"></p>';
  if(PJ.fase === "hecho") h += '<div class="pt-acciones"><button class="bt azul" id="pjOtro">'+(modo === "huchas" ? "Otra hucha" : "Otra suma")+'</button></div>';
  c.innerHTML = h;
  PJ.malos = null;
  $("pjTeclado").hidden = PJ.fase !== "escribir";
  c.querySelectorAll(".pj-num").forEach(b=> b.onclick = ()=>{ tocarPJ(+b.dataset.i); c.querySelector('.pj-num[data-i="'+b.dataset.i+'"]:not([disabled])')?.focus(); });
  $("pjOtro")?.addEventListener("click", nuevoRetoPJ);
}
function huchaPJ(){
  const r = PJ.reto, usados = PJ.parejas.flat(), huecos = HUECOS_PJ[r.nums.length], B = r.base || 10;
  const forma = r.exacta !== false ? String(B) : redondoPJ(B);
  let h = '<div class="pj-huchas"><div class="pj-hucha'+(Math.max(...r.nums) >= 100 ? " grande" : "")+'" role="group" aria-label="La hucha: '+r.nums.join(", ")+'">'+HUCHA_SVG+
    r.nums.map((v, i)=> '<button class="pj-num'+(PJ.elegidos.includes(i) ? " elegido" : "")+(usados.includes(i) ? " junto p"+Math.floor(usados.indexOf(i) / 2) : "")+(PJ.malos?.includes(i) ? " mal" : "")+
      '" data-i="'+i+'" style="left:'+huecos[i][0]+'%;top:'+huecos[i][1]+'%"'+(PJ.fase !== "parejas" || usados.includes(i) ? " disabled" : ' aria-pressed="'+PJ.elegidos.includes(i)+'"')+
      ' aria-label="'+v+(usados.includes(i) ? ", ya forma pareja" : "")+'">'+v+'</button>').join("")+'</div>';
  // Las regletas: las parejas encontradas junto al número redondo que forman, las elegidas y las sueltas
  const ancho = Math.max(anchoPJ(sumaPJ(r.nums)), sumaPJ(r.nums.map(anchoPJ)));
  h += '<div class="pj-mesa'+(PJ.regletas ? "" : " sin")+(r.bloques ? " bloques" : "")+'" style="--total:'+Math.max(10, sumaPJ(r.nums))+';--w:'+ancho.toFixed(1)+'">';
  if(PJ.regletas){
    PJ.parejas.forEach(([i, j])=>{
      const x = r.nums[i], y = r.nums[j];
      h += filaPJ(piezasPJ(x) + piezasPJ(y), x+" + "+y, "pareja");
      h += filaPJ(piezasPJ(x + y), "= "+(x + y), "diez");
    });
    if(PJ.fase === "parejas"){
      const sel = PJ.elegidos.map(i=> r.nums[i]), molde = r.exacta !== false ? B : sel.length ? Math.ceil((sel[0] + 1) / B) * B : 0;
      h += filaPJ(sel.length ? sel.map(v=> piezasPJ(v)).join("") : '<span class="pj-nada">Toca dos números de la hucha que formen '+forma+'</span>', sel.length ? sel.join(" + ")+" + …" : "", "eleccion");
      if(molde) h += filaPJ(piezasPJ(molde, "molde"), r.exacta !== false ? String(B) : "¿"+molde+"?", "diez");
    }else{
      h += filaPJ(sueltosPJ().map(v=> piezasPJ(v)).join(""), "Suelto: "+sueltosPJ().join(" + "), "suelto");
      if(PJ.fase === "hecho") h += filaPJ(PJ.parejas.map(([i, j])=> piezasPJ(r.nums[i] + r.nums[j])).join("")+sueltosPJ().map(v=> piezasPJ(v)).join(""), "Total: "+sumaPJ(r.nums), "total");
    }
  }
  h += '</div></div>';
  if(PJ.fase === "parejas") h += '<p class="ap-pregunta">Toca los <b>dos números</b> que juntos forman <b>'+forma+'</b>'+(r.nums.length === 5 ? " (hay dos parejas)" : "")+'.</p>';
  else h += '<p class="ap-pregunta">'+preguntaHuchaPJ()+'<span class="ap-campo'+(PJ.fase === "escribir" ? " activo"+(PJ.tono === "mal" ? " mal" : "") : " bien")+'">'+(PJ.fase === "hecho" ? sumaPJ(r.nums) : PJ.escrito || "?")+'</span> €</p>';
  return h;
}
function saltoPJ(){
  const r = PJ.reto, p = pasosPJ(r), D = p[0].post.slice(3) * 1, falta = p[0].r, resto = p[1].r, k = PJ.paso;
  const campo = i => '<span class="ap-campo'+(k === i && PJ.fase === "escribir" ? " activo"+(PJ.tono === "mal" ? " mal" : "") : k > i ? " bien" : "")+'">'+(k > i ? p[i].r : k === i ? PJ.escrito || "?" : "?")+'</span>';
  let h = '<p class="pj-suma">'+r.a+' + '+r.b+'</p>';
  const ancho = Math.max(anchoPJ(r.a) + anchoPJ(falta), anchoPJ(D) + anchoPJ(resto), anchoPJ(falta) + anchoPJ(resto) + 2);
  h += '<div class="pj-mesa'+(PJ.regletas ? "" : " sin")+(r.bloques ? " bloques" : "")+'" style="--total:'+(r.a + r.b)+';--w:'+ancho.toFixed(1)+'">';
  if(PJ.regletas){
    const hueco = r.bloques ? piezasPJ(falta, "hueco") : '<span class="pj-reg hueco" style="--n:'+falta+'">'+(k >= 1 ? "" : "?")+'</span>';
    h += filaPJ(piezasPJ(r.a) + (k >= 1 ? piezasPJ(falta, "entra") : hueco), r.a+(k >= 1 ? " + "+falta : ""), "eleccion");
    h += filaPJ(piezasPJ(D, "molde"), String(D), "diez");
    h += filaPJ(k >= 1 ? '<span class="pj-roto">'+piezasPJ(falta, "fuera")+piezasPJ(resto)+'</span>' : piezasPJ(r.b), k >= 2 ? r.b+" = "+falta+" + "+resto : String(r.b), "suelto");
    if(k >= 2) h += filaPJ(piezasPJ(D)+piezasPJ(resto), D+" + "+resto, "total");
  }
  h += '</div><ol class="pj-pasos">'+p.map((s, i)=> '<li class="'+(k > i ? "hecho" : k === i ? "ahora" : "luego")+'"><span>'+s.q+'</span>'+(k >= i ? '<b>'+s.pre+campo(i)+s.post+'</b>' : '')+'</li>').join("")+'</ol>';
  return h;
}
function tecladoParejas(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if(PJ.fase === "escribir"){
    if(/^[0-9]$/.test(e.key)){ e.preventDefault(); teclaPJ(e.key); }
    else if(e.key === "Backspace"){ e.preventDefault(); teclaPJ("⌫"); }
    else if(e.key === "Enter"){ e.preventDefault(); teclaPJ("✓"); }
  }else if(PJ.fase === "hecho" && e.key === "Enter" && e.target.tagName !== "BUTTON"){ e.preventDefault(); nuevoRetoPJ(); }
}

/* ---------- Ficha en papel: 12 huchas o 12 sumas para completar el 10 (y las soluciones) ---------- */
function imprimirParejas(){
  const modo = PJ.modo, n = nivelPJ(), lista = listaPJ(modo, n), retos = [];
  const d = datosPJ(modo, n);
  for(let i=0; i<12; i++){ const r = Object.assign({}, delMazo("pj-"+modo+"-"+n, lista), {base:d.base, exacta:d.exacta}); if(r.nums) r.nums = barajar(r.nums.slice()); retos.push(r); }
  const caja = (v, docente) => '<span class="hj-caja'+(docente ? " llena" : "")+'">'+(docente ? v : "")+'</span>';
  let cuerpo, instr;
  if(modo === "huchas"){
    instr = '<p>🐷 En cada hucha, rodea los <b>dos números que forman '+(d.exacta ? d.base : redondoPJ(d.base))+'</b>'+(n === "n3" ? " (hay dos parejas)" : "")+' y suma lo que queda. ¿Cuántos euros hay en cada hucha?</p>';
    cuerpo = docente => '<div class="hj-pjs">'+retos.map((r, i)=>{
      const pares = [], usados = [];
      r.nums.forEach((v, a)=>{ if(usados.includes(a)) return; const b = r.nums.findIndex((w, k)=> k !== a && !usados.includes(k) && parejaPJ(v, w, d)); if(b >= 0){ usados.push(a, b); pares.push([v, r.nums[b]]); } });
      const sueltos = r.nums.filter((_, k)=> !usados.includes(k));
      return '<div class="hj-pj"><span class="hj-n">'+(i + 1)+'</span><div class="hj-pj-hucha'+(Math.max(...r.nums) >= 100 ? " grande" : "")+'">'+HUCHA_SVG+r.nums.map((v, k)=>
        '<b style="left:'+(HUECOS_PJ[r.nums.length][k][0] + (HUECOS_PJ[r.nums.length][k][0] < 40 ? 6 : 0))+'%;top:'+HUECOS_PJ[r.nums.length][k][1]+'%">'+v+'</b>').join("")+'</div>'+
        '<p>'+(docente ? '<small>'+pares.map(q=> q.join(" + ")).join(" · ")+' → '+pares.map(q=> q[0] + q[1]).concat(sueltos).join(" + ")+'</small><br>' : '')+caja(sumaPJ(r.nums), docente)+' €</p></div>';
    }).join("")+'</div>';
  }else{
    instr = '<p>🔟 Primero <b>completa '+(d.base === 100 ? 'la centena' : 'el 10')+'</b>: ¿cuánto le falta al primer número? Rompe el segundo número en dos trozos y suma lo que queda. '+
      'Ejemplo: '+(d.base === 100 ? '270 + 50 = 270 + <b>30</b> + <b>20</b> = 300 + 20 = 320' : '8 + 5 = 8 + <b>2</b> + <b>3</b> = 10 + 3 = 13')+'.</p>';
    cuerpo = docente => '<ol class="hj-pjsalto">'+retos.map(r=>{
      const p = pasosPJ(r), D = p[0].post.slice(3);
      return '<li><span class="hj-n"></span><b>'+r.a+' + '+r.b+'</b> = '+r.a+' + '+caja(p[0].r, docente)+' + '+caja(p[1].r, docente)+' = '+D+' + '+caja(p[1].r, docente)+' = '+caja(p[2].r, docente)+'</li>';
    }).join("")+'</ol>';
  }
  const titulo = modo === "huchas" ? "Las huchas: "+(d.exacta === false ? "completa la "+(d.base === 10 ? "decena" : "centena") : "parejas del "+d.base) : d.base === 100 ? "Completa la centena" : "Completa el 10";
  $("impresion").innerHTML =
    hojaPapel({titulo, sub:"Parejas del 10 · "+NIVELES_PJ[modo][n].txt, eti:"Formar el 10", pagina:1, paginas:2,
      datos:[["Nombre", "", 3], ["Fecha", "", 1]], instrucciones:instr, cuerpo:cuerpo(false)})+
    hojaPapel({titulo:titulo+" · Soluciones", sub:"Parejas del 10 · "+NIVELES_PJ[modo][n].txt, eti:"Para el docente", pagina:2, paginas:2, docente:true,
      instrucciones:'<p>En azul, las respuestas.</p>', cuerpo:cuerpo(true)});
  lanzarImpresion();
}
