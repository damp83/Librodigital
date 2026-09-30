/* Service worker del aula: permite volver a abrir sin conexión lo que ya se ha visto.
   - Página y catálogo: primero la red (para ver siempre lo último) y, sin conexión, la copia guardada.
   - PDF, portadas y visor: la copia guardada al momento y, por detrás, se actualiza desde la red.
   Si cambias la lógica de este archivo, sube la versión de las cachés (y en index.html). */
const CACHE_APP = "aula-app-v1", CACHE_PDF = "aula-pdf-v1";
const BASICO = ["./", "catalogo.json", "lib/pdf.min.js", "lib/pdf.worker.min.js",
                "manifest.webmanifest", "icono-192.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE_APP).then(c=>c.addAll(BASICO)).then(()=>self.skipWaiting()));
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
  if(req.mode==="navigate" || ruta==="" || ruta==="index.html" || ruta==="catalogo.json" || ruta==="ruta.json" || ruta==="sw.js")
    e.respondWith(redPrimero(req));
  else if(ruta.startsWith("materiales/"))
    e.respondWith(guardadoPrimero(e, CACHE_PDF));
  else
    e.respondWith(guardadoPrimero(e, CACHE_APP));
});
