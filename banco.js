/* =====================================================================
   BANCO DE RETOS
   Las herramientas no sacan las operaciones al azar sin más. Cada tipo de reto tiene un «mazo» con todos los
   retos posibles, barajado, y se van sacando sin repetir hasta agotarlo; entonces se vuelve a barajar (sin que
   el primero nuevo sea el último que salió). Los mazos se guardan en este dispositivo, así que tampoco se
   repiten de un día para otro.
   Para retos con muchísimas posibilidades (las pirámides) se recuerdan los últimos que han salido y se evitan.
   Usa leer/guardar y azar de index.html y aula.js.
   ===================================================================== */
const BANCO = leer("aula-banco", {});
const guardarBanco = () => guardar("aula-banco", BANCO);
const claveReto = x => typeof x === "string" ? x : x.k;

function barajar(lista){
  for(let i=lista.length-1; i>0; i--){ const j = Math.floor(Math.random() * (i+1)); [lista[i], lista[j]] = [lista[j], lista[i]]; }
  return lista;
}
/* Saca el siguiente reto del mazo «clave». «lista» son todos los retos posibles (textos, o objetos con .k único). */
function delMazo(clave, lista){
  if(!lista.length) return null;
  const firma = lista.length + ":" + claveReto(lista[0]) + ":" + claveReto(lista[lista.length-1]);
  let m = BANCO[clave];
  if(!m || m.firma !== firma || !Array.isArray(m.orden) || m.i >= m.orden.length){
    const ultimo = m && m.firma === firma && Array.isArray(m.orden) ? m.orden[m.orden.length-1] : null;
    const orden = barajar(lista.map((_, i)=> i));
    if(orden.length > 1 && orden[0] === ultimo) [orden[0], orden[1]] = [orden[1], orden[0]];
    m = BANCO[clave] = {firma, orden, i:0};
  }
  const reto = lista[m.orden[m.i++]];
  guardarBanco();
  return reto;
}
/* Cuántos retos del mazo quedan por salir antes de que se vuelva a barajar */
function quedanEnMazo(clave, lista){
  const m = BANCO[clave], firma = lista.length ? lista.length + ":" + claveReto(lista[0]) + ":" + claveReto(lista[lista.length-1]) : "";
  return m && m.firma === firma && Array.isArray(m.orden) ? m.orden.length - m.i : lista.length;
}
function reiniciarMazo(clave){ delete BANCO[clave]; guardarBanco(); }
/* Para espacios enormes: genera retos hasta dar con uno que no haya salido entre los últimos «memoria» */
function sinRepetir(clave, generar, memoria){
  const h = BANCO[clave] = BANCO[clave] && Array.isArray(BANCO[clave].vistos) ? BANCO[clave] : {vistos:[]};
  let reto = null;
  for(let intento=0; intento<80; intento++){
    reto = generar();
    if(!h.vistos.includes(claveReto(reto))) break;
  }
  h.vistos.push(claveReto(reto));
  if(h.vistos.length > (memoria || 200)) h.vistos.splice(0, h.vistos.length - (memoria || 200));
  guardarBanco();
  return reto;
}
