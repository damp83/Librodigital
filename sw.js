/* Service worker del aula: permite volver a abrir sin conexión lo que ya se ha visto.
   - Página, código (.js), catálogo y ruta: primero la red (así nunca se mezclan versiones) y,
     sin conexión, la copia guardada.
   - PDF, portadas, fuentes, iconos y visor (lib/): la copia guardada al momento y, por detrás,
     se actualiza desde la red.
   Si cambias la lógica de este archivo, sube la versión de las cachés (y en index.html). */
const CACHE_APP = "aula-app-v3", CACHE_PDF = "aula-pdf-v1";   // v3: la copia inicial se pide siempre a la red, nunca a la caché del navegador
const BASICO = ["./", "catalogo.json", "ruta.json", "reto.json", "herramientas.js", "secciones.js", "banco.js", "aula.js", "geoplano.js", "calculadora.js", "piramides.js", "aproximar.js", "lib/pdf.min.js", "lib/pdf.worker.min.js",
                "lib/qrcode.js", "manifest.webmanifest", "icono-192.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE_APP).then(c=>c.addAll(BASICO.map(u=> new Request(u, {cache:"reload"})))).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k.startsWith("aula-") && k!==CACHE_APP && k!==CACHE_PDF).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

const OPC = {ignoreSearch: true, ignoreVary: true};

async function redPrimero(req){
  const cache = await caches.open(CACHE_APP);
  try{
    const r = await fetch(req);
    if(r.ok) await cache.put(req.mode==="navigate" ? "./" : req, r.clone());
    return r;
  }catch(err){
    return (await cache.match(req.mode==="navigate" ? "./" : req, OPC)) || Response.error();
  }
}

async function guardadoPrimero(e, nombre){
  const cache = await caches.open(nombre), req = e.request;
  const guardado = await cache.match(req, OPC);
  const red = fetch(req).then(r=>{
    if(r.status===200) return cache.put(req, r.clone()).then(()=>r);
    return r;
  }).catch(()=>null);
  if(guardado){ e.waitUntil(red); return guardado; }
  return (await red) || Response.error();
}

self.addEventListener("fetch", e=>{
  const req = e.request, url = new URL(req.url);
  if(req.method!=="GET" || url.origin!==location.origin || req.headers.has("range")) return;
  const ruta = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  // código y datos de la web (en la raíz: index.html, *.js, *.json, *.webmanifest): siempre la versión publicada
  if(req.mode==="navigate" || ruta==="" || /^[^/]+\.(html|js|json|webmanifest)$/.test(ruta))
    e.respondWith(redPrimero(req));
  else if(ruta.startsWith("materiales/"))
    e.respondWith(guardadoPrimero(e, CACHE_PDF));
  else
    e.respondWith(guardadoPrimero(e, CACHE_APP));
});
