/* Pruebas automáticas de la web del aula.
   Las lanza GitHub Actions antes de publicar (.github/workflows/publicar.yml) y en cada pull request
   (.github/workflows/pruebas.yml). Si alguna falla, la web publicada no se toca.

   En local:  cd pruebas && npm ci
              python3 -m http.server 8000 --directory ..   (en otra terminal)
              node pruebas.mjs                              (o WEB=http://localhost:8000/ node pruebas.mjs) */
import { chromium } from "playwright";
import { readFileSync, appendFileSync } from "node:fs";
import { createRequire } from "node:module";

const WEB = process.env.WEB || "http://localhost:8000/";
const RAIZ = new URL("../", import.meta.url);
const leerJSON = f => JSON.parse(readFileSync(new URL(f, RAIZ), "utf8"));
const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

const catalogo = leerJSON("catalogo.json"), ruta = leerJSON("ruta.json"), reto = leerJSON("reto.json");
const resultados = [];
async function prueba(nombre, fn){
  try{ const detalle = await fn(); resultados.push({nombre, ok:true, detalle: detalle || ""}); console.log("✓ "+nombre+(detalle ? " — "+detalle : "")); }
  catch(e){ resultados.push({nombre, ok:false, detalle: e.message}); console.log("✗ "+nombre+" — "+e.message); }
}
const exigir = (cond, msg) => { if(!cond) throw new Error(msg); };

/* ---------- Datos: la ruta del curso apunta a cosas que existen ---------- */
await prueba("ruta.json enlaza materiales y páginas que existen", ()=>{
  const porArchivo = Object.fromEntries(catalogo.map(m=>[m.archivo, m]));
  const recursos = new Set(catalogo.map(m=>m.recurso).filter(Boolean));
  const fallos = [], sec = porArchivo[ruta.secuencia];
  if(!sec) fallos.push("no existe la secuencia "+ruta.secuencia);
  for(const c of ruta.cursos){
    if(c.cuaderno && !porArchivo[c.cuaderno]) fallos.push(c.etapa+": no existe el cuaderno "+c.cuaderno);
    c.trimestres.forEach((t,i)=>{
      const donde = c.etapa+" T"+(i+1);
      if(sec && t.secuencia && t.secuencia > sec.pags) fallos.push(donde+": la secuencia no tiene la página "+t.secuencia);
      const cu = porArchivo[c.cuaderno];
      if(cu && t.cuaderno && (t.cuaderno[0] < 1 || t.cuaderno[1] > cu.pags || t.cuaderno[0] > t.cuaderno[1])) fallos.push(donde+": páginas del cuaderno fuera de rango "+t.cuaderno);
      (t.recursos||[]).forEach(r=>{ if(!recursos.has(r) && !porArchivo[r]) fallos.push(donde+": no hay ningún recurso o archivo llamado «"+r+"»"); });
    });
  }
  exigir(!fallos.length, fallos.join("; "));
  return ruta.cursos.length+" cursos, "+ruta.cursos.reduce((s,c)=>s+c.trimestres.length,0)+" trimestres";
});

/* ---------- Datos: el reto de la semana está bien escrito ---------- */
await prueba("reto.json tiene fechas, textos y enlaces válidos", ()=>{
  const fallos = [], archivos = new Set(catalogo.map(m=>m.archivo));
  const herramientas = ["regletas","bombo","calculo","panel","partes","marco","muros","geoplano","calculadora","piramides","ruta","familias"];
  exigir(Array.isArray(reto.semanas) && reto.semanas.length, "no hay «semanas»");
  reto.semanas.forEach((s,i)=>{
    const donde = "semana "+(i+1)+" ("+s.desde+")";
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s.desde||"") || isNaN(Date.parse(s.desde))) fallos.push(donde+": «desde» debe ser AAAA-MM-DD");
    if(!Array.isArray(s.retos) || !s.retos.length) fallos.push(donde+": no tiene retos");
    (s.retos||[]).forEach(r=>{
      ["nivel","titulo","texto"].forEach(k=>{ if(typeof r[k]!=="string" || !r[k].trim()) fallos.push(donde+": falta «"+k+"»"); });
      if(r.enlace){
        const m = String(r.enlace.ruta||"").match(/^#\/(leer\/([^/]+)(\/\d+)?|(\w+))$/);
        if(!m || (m[2] && !archivos.has(decodeURIComponent(m[2]))) || (m[4] && !herramientas.includes(m[4]))) fallos.push(donde+": el enlace «"+r.enlace.ruta+"» no lleva a nada que exista");
      }
    });
  });
  exigir(!fallos.length, fallos.join("; "));
  return reto.semanas.length+" semanas";
});

const navegador = await chromium.launch();
async function pagina(opciones = {}){
  const ctx = await navegador.newContext({viewport:{width:1366, height:900}, ...opciones});
  const p = await ctx.newPage(), errores = [];
  p.on("pageerror", e=> errores.push("error de JavaScript: "+e.message));
  p.on("console", m=>{ if(m.type()==="error" && !/Failed to load resource/.test(m.text())) errores.push("consola: "+m.text().slice(0,160)); });
  p.on("response", r=>{ if(r.status() >= 400) errores.push(r.status()+" "+r.url()); });
  p.on("dialog", d=> d.accept());
  return {p, ctx, errores};
}
/* Abre una página, ejecuta la prueba y, si falla, añade los errores que haya visto el navegador */
async function conPagina(opciones, fn){
  const {p, ctx, errores} = await pagina(opciones);
  try{
    const r = await fn(p);
    exigir(!errores.length, errores.join(" | "));
    return r;
  }catch(e){
    const msg = e.message.split("\n")[0];
    throw new Error(errores.length && !msg.includes(errores[0]) ? msg+" | "+errores.join(" | ") : msg);
  }finally{ await ctx.close(); }
}
async function accesibilidad(p){   // solo bloquean las incidencias graves o críticas
  await p.evaluate(()=> Promise.all(document.getAnimations().filter(a=> isFinite(a.effect?.getTiming().iterations)).map(a=> a.finished.catch(()=>{}))));   // espera a que terminen las entradas animadas
  await p.evaluate(AXE);
  const v = await p.evaluate(async()=> (await axe.run(document, {runOnly:["wcag2a","wcag2aa","wcag21aa"]})).violations
    .filter(x=> x.impact==="serious" || x.impact==="critical").map(x=> x.id+" ("+x.nodes[0].target.join(" ")+")"));
  exigir(!v.length, "accesibilidad: "+v.join(", "));
}

/* ---------- Biblioteca ---------- */
await prueba("La biblioteca carga con todos los recursos, sin errores y accesible", ()=> conPagina({}, async p=>{
  await p.goto(WEB); await p.waitForSelector(".libro");
  const unidades = catalogo.filter(m=>!m.recurso).length + new Set(catalogo.map(m=>m.recurso).filter(Boolean)).size;
  const cuenta = await p.textContent("#cuenta");
  exigir(cuenta.startsWith(unidades+" "), "se esperaban "+unidades+" recursos y la web dice «"+cuenta+"»");
  exigir(await p.locator(".libro").count() === unidades, "no se ven todas las tarjetas");
  await accesibilidad(p);
  return cuenta;
}));

/* ---------- Cada material se abre en el lector ---------- */
await prueba("Todos los materiales se abren en el lector", ()=> conPagina({}, async p=>{
  const fallan = [];
  for(const m of catalogo){
    await p.goto(WEB+"#/leer/"+encodeURIComponent(m.archivo)+"/1");
    try{ await p.waitForSelector(".hoja canvas", {timeout:20000}); }
    catch(e){ fallan.push(m.archivo); }
  }
  exigir(!fallan.length, "no se abren: "+fallan.join(", "));
  return catalogo.length+" de "+catalogo.length;
}));

/* ---------- Herramientas y secciones ---------- */
await prueba("Herramientas, modo aula y secciones funcionan", ()=> conPagina({}, async p=>{
  await p.goto(WEB+"#/bombo"); await p.waitForSelector("#vBombo:not([hidden])");
  await p.click("#bSacar"); await p.waitForFunction(()=> /^\d+$/.test(document.getElementById("bNum").textContent), null, {timeout:5000});
  await accesibilidad(p);
  await p.goto(WEB+"#/regletas"); await p.waitForSelector("#vRegletas:not([hidden])");
  await p.click(".reg-pieza >> nth=4"); exigir(await p.locator(".regleta-v").count() >= 1, "no se añade una regleta al pulsarla");
  await accesibilidad(p);
  await p.goto(WEB+"#/calculo"); await p.waitForSelector(".cm-tipo");
  await p.click("#cmEmpezar"); await p.waitForSelector(".cm-pregunta");
  await p.click("#cmVer"); exigir(!(await p.textContent(".cm-pregunta")).includes("?"), "cálculo mental: no se muestra la respuesta");
  await accesibilidad(p);
  await p.goto(WEB+"#/panel"); await p.waitForSelector(".celda");
  await p.click('.celda[data-n="45"]'); exigir(await p.locator(".celda.cruz").count() === 4, "panel del 100: la cruz del 45 no tiene 4 vecinos");
  await accesibilidad(p);
  await p.goto(WEB+"#/partes"); await p.waitForSelector(".pt-bloque");
  exigir(await p.evaluate(()=> PT.a + PT.b === PT.todo), "partes y todo: las partes no suman el todo");
  await accesibilidad(p);
  await p.goto(WEB+"#/marco"); await p.waitForSelector(".hueco10");
  await p.click("#maMas"); await p.click("#maMas");
  exigir(await p.locator(".marco .ficha").count() === 2, "marco del 10: «Poner» no coloca las fichas");
  await accesibilidad(p);
  await p.goto(WEB+"#/muros"); await p.waitForSelector(".muro-fila");
  exigir(await p.locator(".muro-fila").count() === await p.evaluate(()=> MU.n), "muros: el muro no tiene una fila por cada forma");
  await accesibilidad(p);
  await p.goto(WEB+"#/geoplano"); await p.waitForSelector("#vGeoplano:not([hidden]) .gp-alumno");
  await p.evaluate(()=>{ GP.gomas = []; GP.actual = null; GP.elegida = null; });
  const clavo = async (x, y)=>{   // toca el clavo (x, y) del geoplano
    const b = await p.locator("#gpTablero svg.gp-alumno").boundingBox(), n = await p.evaluate(()=> ladoGP());
    const lado = 100*(n-1) + 100;
    await p.mouse.click(b.x + b.width*(50+100*x)/lado, b.y + b.height*(50+100*y)/lado);
  };
  for(const [x, y] of [[1,1],[3,1],[3,3],[1,3],[1,1]]) await clavo(x, y);
  const ayudaGeo = await p.textContent("#gpAyuda");
  exigir(/Cuadrado/.test(ayudaGeo) && /Área: 4 cuadraditos/.test(ayudaGeo) && /Perímetro: 8/.test(ayudaGeo), "geoplano: el cuadrado de lado 2 no se reconoce («"+ayudaGeo+"»)");
  await accesibilidad(p);
  await p.click('#vGeoplano .segmentos [data-modo="copiar"]');
  await p.evaluate(()=>{ GP.modelo = 0; pintarGeoplano(); });   // el cuadrado de lado 2
  for(const [x, y] of [[0,0],[2,0],[2,2],[0,2],[0,0]]) await clavo(x, y);
  await p.click("#gpComprobar");
  exigir((await p.textContent("#gpAyuda")).startsWith("¡Muy bien"), "geoplano: «Copia la figura» no reconoce la copia en otro sitio");
  await p.evaluate(()=>{ GP.gomas = []; guardarGP(); });
  await p.goto(WEB+"#/calculadora"); await p.waitForSelector("#vCalculadora:not([hidden]) .ca-tecla");
  const tecla = t=> p.click('#caTeclado [data-t="'+t+'"]');
  for(const t of ["1","2","*","3","="]) await tecla(t);
  exigir((await p.textContent("#caNumero"))==="36", "calculadora: 12 × 3 no da 36");
  for(const t of ["C","0","+","2","=","=","="]) await tecla(t);
  exigir((await p.textContent("#caNumero"))==="6" && await p.locator("#caSerie .ca-ficha").count()===4, "calculadora: el factor constante (0 + 2 = = =) no cuenta de 2 en 2");
  for(const t of ["C","7","/","0","="]) await tecla(t);
  exigir(/dividir entre 0/.test(await p.textContent("#caOperacion")), "calculadora: dividir entre 0 no avisa");
  await accesibilidad(p);
  await p.goto(WEB+"#/piramides"); await p.waitForSelector("#vPiramides:not([hidden]) .pi-bloque");
  const piramidesOk = await p.evaluate(()=>{   // todas las pirámides que se proponen tienen solución paso a paso
    const antes = {nivel:PI.nivel, pisos:PI.pisos, hasta:PI.hasta}; let mal = 0;
    for(const nivel of ["facil","medio","dificil"]) for(const pisos of [3,4,5]) for(const hasta of [10,20,100]) for(let k=0; k<8; k++){
      Object.assign(PI, {nivel, pisos, hasta}); nuevaPiramide();
      if(!resolverPasos(pisos, PI.dada) || PI.v[0][0] > hasta || PI.v.flat().some(x=> x < 0)) mal++;
    }
    Object.assign(PI, antes); nuevaPiramide(); return mal;
  });
  exigir(piramidesOk===0, "pirámides: "+piramidesOk+" pirámides sin solución o con números fuera de rango");
  await p.click('#vPiramides .segmentos [data-nivel="medio"]');
  for(let k=0; k<30 && !(await p.textContent("#piAyuda")).startsWith("¡Pirámide completa"); k++){   // resolver con las pistas
    await p.click("#piPista");
    const v = await p.evaluate(()=> PI.pista ? PI.v[PI.pista.bloque[0]][PI.pista.bloque[1]] : null);
    exigir(v!==null, "pirámides: la pista no encuentra ningún bloque que se pueda calcular");
    for(const c of String(v)) await p.click('#piTeclado [data-t="'+c+'"]');
  }
  exigir((await p.textContent("#piAyuda")).startsWith("¡Pirámide completa"), "pirámides: siguiendo las pistas no se completa la pirámide");
  // Una pirámide rellena que no cuadra (8 + 20 escrito debajo de un 26): se explica qué tres bloques no cuadran
  await p.evaluate(()=>{
    PI.pisos = 4; PI.v = construir([6,4,2,18]); PI.dada = PI.v.map(f=> f.map(()=> false));
    PI.dada[0][0] = PI.dada[1][0] = PI.dada[2][2] = PI.dada[3][1] = true;   // 42, 16, 20 y el 4 de la base
    PI.resp = [[""], ["", "26"], ["8", "8", ""], ["4", "", "4", "16"]]; PI.sel = null; PI.pista = null; PI.solucion = false; pintarPiramide();
  });
  const choqueTxt = await p.textContent("#piAyuda");
  exigir(/8 \+ 20 = 28, pero arriba pone 26/.test(choqueTxt) && await p.locator(".pi-bloque.choque").count()===3, "pirámides: no explica qué bloques no cuadran («"+choqueTxt+"»)");
  await accesibilidad(p);
  await p.goto(WEB+"#/aula/5-anios"); await p.waitForSelector("#vClase:not([hidden]) .cl-ficha");
  exigir(await p.locator('#vClase .cl-ficha[href="#/marco"]').count() === 1, "modo aula: faltan las herramientas de 5 años");
  await accesibilidad(p);
  await p.goto(WEB); await p.waitForTimeout(800);
  exigir(await p.evaluate(()=> location.hash)==="#/aula/5-anios", "modo aula: la tableta no vuelve a su clase");
  await p.evaluate(()=> localStorage.removeItem("aula-clase"));
  await p.goto(WEB+"#/ruta"); await p.waitForSelector(".trim", {timeout:8000});
  exigir(await p.locator(".trim").count() === 3, "la ruta no muestra tres trimestres");
  await accesibilidad(p);
  await p.goto(WEB+"#/familias"); await p.waitForSelector("#vFamilias:not([hidden]) .tr-fila");
  await accesibilidad(p);
}));

/* ---------- Código compatible con los navegadores de 2020 (iPhone con iOS 13.4 o posterior) ---------- */
await prueba("El código no usa sintaxis que los móviles algo antiguos no entienden", ()=>{
  const NUEVO = [[/\|\|=|&&=|\?\?=/, "asignaciones lógicas (||= &&= ??=)"], [/\(\?<[=!]/, "expresiones regulares con «lookbehind»"],
                 [/\.at\(|structuredClone|Object\.hasOwn|\.findLast\(|\.toSorted\(/, "funciones de 2022 o posteriores"]];
  const fallos = [];
  for(const f of ["index.html", "herramientas.js", "secciones.js", "aula.js", "geoplano.js", "calculadora.js", "piramides.js", "sw.js"]){
    readFileSync(new URL(f, RAIZ), "utf8").split("\n").forEach((l, i)=> NUEVO.forEach(([re, que])=>{ if(re.test(l)) fallos.push(f+":"+(i+1)+" usa "+que); }));
  }
  exigir(!fallos.length, fallos.join("; "));
});

/* ---------- Móvil ---------- */
const MOVIL = {viewport:{width:390, height:844}, isMobile:true, hasTouch:true};
await prueba("En el móvil nada se sale de la pantalla", ()=> conPagina(MOVIL, async p=>{
  await p.goto(WEB); await p.waitForSelector(".libro");
  exigir(await p.evaluate(()=> document.documentElement.scrollWidth <= innerWidth), "la biblioteca tiene desplazamiento horizontal");
  await p.goto(WEB+"#/leer/"+encodeURIComponent(catalogo[0].archivo)); await p.waitForSelector(".hoja canvas");
}));

/* Los botones de cada tarjeta (Abrir, Descargar, Marcar como trabajado, Compartir) caben enteros en móvil, tableta y ordenador */
await prueba("Los botones de las tarjetas caben en móvil, tableta y ordenador", async ()=>{
  const fallos = [];
  for(const [ancho, alto] of [[390, 844], [1000, 750], [1194, 834], [1440, 900]]){
    await conPagina({viewport:{width:ancho, height:alto}}, async p=>{
      await p.goto(WEB); await p.waitForSelector(".libro");
      const fuera = await p.evaluate(()=> [...document.querySelectorAll(".libro")].flatMap(l=>{
        const r = l.getBoundingClientRect();
        return [...l.querySelectorAll(".botones > *")].filter(x=>{ const q = x.getBoundingClientRect(); return q.right > r.right - 4 || q.left < r.left + 4 || x.scrollWidth > x.clientWidth + 1; })
          .map(x=> l.querySelector("h3").textContent+" («"+(x.textContent.trim() || x.getAttribute("aria-label"))+"»)");
      }));
      fuera.forEach(f=> fallos.push(ancho+" px: "+f));
      exigir(await p.locator(".libro .hecho").count() === await p.locator(".libro").count(), ancho+" px: hay tarjetas sin «Marcar como trabajado»");
    });
  }
  exigir(!fallos.length, "botones cortados: "+fallos.slice(0, 6).join("; "));
});

/* Las fichas de herramientas: el dibujo tiene su tamaño y el texto no queda aplastado, en todos los anchos (móvil, iPad, ordenador) */
await prueba("Las fichas de herramientas se ven bien en móvil, tableta y ordenador", async ()=>{
  const fallos = [];
  for(const [ancho, alto] of [[390, 844], [700, 1000], [834, 1194], [1024, 768], [1194, 834], [1440, 900]]){
    await conPagina({viewport:{width:ancho, height:alto}}, async p=>{
      await p.goto(WEB); await p.waitForSelector("#herr .herr-ficha");
      const mal = await p.evaluate(()=> [...document.querySelectorAll("#herr .herr-ficha")].flatMap(f=>{
        const ilus = f.querySelector(".herr-ilus").getBoundingClientRect(), txt = f.querySelector(".herr-txt").getBoundingClientRect();
        const dibujo = f.querySelector(".herr-ilus svg")?.getBoundingClientRect();
        const nombre = f.querySelector(".herr-txt b").textContent;
        if(txt.width < 120) return [nombre+": el texto queda aplastado ("+Math.round(txt.width)+" px)"];
        if(dibujo && (dibujo.width < 30 || dibujo.height < 30)) return [nombre+": el dibujo no se ve"];
        if(ilus.width > f.getBoundingClientRect().width * .9 && txt.left > ilus.left && txt.top < ilus.bottom - 4) return [nombre+": el dibujo ocupa toda la ficha"];
        return [];
      }));
      mal.forEach(m=> fallos.push(ancho+" px: "+m));
    });
  }
  exigir(!fallos.length, fallos.slice(0, 6).join("; "));
});

await prueba("En el móvil, tocar cada ficha de herramienta la abre", ()=> conPagina(MOVIL, async p=>{
  await p.goto(WEB); await p.waitForSelector(".libro");
  const fichas = await p.$$eval("#herr .herr-ficha", a=> a.map(x=> x.getAttribute("href")));
  exigir(fichas.length >= 7, "solo hay "+fichas.length+" fichas de herramientas");
  const fallan = [];
  for(const h of fichas){
    await p.goto(WEB); await p.waitForSelector(".libro");
    const f = p.locator('#herr .herr-ficha[href="'+h+'"]');
    await f.scrollIntoViewIfNeeded(); await f.tap();
    try{ await p.waitForFunction(()=> [...document.querySelectorAll(".vista")].some(v=> !v.hidden), null, {timeout:4000}); }
    catch(e){ fallan.push(h); }
  }
  exigir(!fallan.length, "no se abren al tocarlas: "+fallan.join(", "));
  return fichas.length+" fichas";
}));

/* Un móvil que conserva una copia antigua de aula.js (sin las herramientas nuevas): la web se repara sola
   recargando una vez y, si no puede, avisa en pantalla en lugar de dejar las fichas sin hacer nada */
await prueba("Si el móvil tiene código antiguo guardado, la web se repara o avisa", async ()=>{
  const {p, ctx} = await pagina(MOVIL);
  try{
    let servidas = 0;
    await p.route(/\/aula\.js(\?.*)?$/, r=>{ servidas++; r.fulfill({contentType:"text/javascript", body:"/* copia antigua */"}); });
    await p.goto(WEB); await p.waitForSelector(".libro");
    await p.waitForSelector("#avisoCodigo:not([hidden])", {timeout:8000});
    exigir(servidas >= 2, "no ha intentado recargar el código ("+servidas+" carga)");
    await p.goto(WEB+"#/calculo"); await p.waitForTimeout(300);
    exigir(await p.isVisible("#avisoCodigo"), "al tocar una herramienta que falta no se avisa");
    await p.unroute(/\/aula\.js(\?.*)?$/);
    await p.evaluate(()=> sessionStorage.clear());
    await p.goto(WEB+"#/"); await p.reload(); await p.waitForSelector(".libro");
    exigir(await p.isHidden("#avisoCodigo"), "el aviso sale aunque el código esté completo");
  }finally{ await ctx.close(); }
});

await navegador.close();

/* ---------- Resumen ---------- */
const fallos = resultados.filter(r=>!r.ok);
const resumen = ["## Pruebas de la web", "", fallos.length ? "**Hay "+fallos.length+" prueba(s) con fallos: la web NO se ha publicado.**" : "Todas las pruebas han pasado.", "",
  ...resultados.map(r=> (r.ok ? "- ✅ " : "- ❌ ")+r.nombre+(r.detalle ? " — "+r.detalle : "")), ""].join("\n");
if(process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumen+"\n");
fallos.forEach(f=> console.log("::error title=Prueba fallida::"+f.nombre+": "+f.detalle));
process.exit(fallos.length ? 1 : 0);
