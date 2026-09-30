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

const catalogo = leerJSON("catalogo.json"), ruta = leerJSON("ruta.json");
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
await prueba("Herramientas (bombo, regletas, cálculo, panel, partes) y secciones funcionan", ()=> conPagina({}, async p=>{
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
  await p.goto(WEB+"#/ruta"); await p.waitForSelector(".trim", {timeout:8000});
  exigir(await p.locator(".trim").count() === 3, "la ruta no muestra tres trimestres");
  await accesibilidad(p);
  await p.goto(WEB+"#/familias"); await p.waitForSelector("#vFamilias:not([hidden]) .tr-fila");
  await accesibilidad(p);
}));

/* ---------- Móvil ---------- */
await prueba("En el móvil nada se sale de la pantalla", ()=> conPagina({viewport:{width:390, height:844}, isMobile:true, hasTouch:true}, async p=>{
  await p.goto(WEB); await p.waitForSelector(".libro");
  exigir(await p.evaluate(()=> document.documentElement.scrollWidth <= innerWidth), "la biblioteca tiene desplazamiento horizontal");
  await p.goto(WEB+"#/leer/"+encodeURIComponent(catalogo[0].archivo)); await p.waitForSelector(".hoja canvas");
}));

await navegador.close();

/* ---------- Resumen ---------- */
const fallos = resultados.filter(r=>!r.ok);
const resumen = ["## Pruebas de la web", "", fallos.length ? "**Hay "+fallos.length+" prueba(s) con fallos: la web NO se ha publicado.**" : "Todas las pruebas han pasado.", "",
  ...resultados.map(r=> (r.ok ? "- ✅ " : "- ❌ ")+r.nombre+(r.detalle ? " — "+r.detalle : "")), ""].join("\n");
if(process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumen+"\n");
fallos.forEach(f=> console.log("::error title=Prueba fallida::"+f.nombre+": "+f.detalle));
process.exit(fallos.length ? 1 : 0);
