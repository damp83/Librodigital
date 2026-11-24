/* =====================================================================
   RESUELVO PROBLEMAS (#/problemas)
   La estación «Resuelvo problemas con diagramas de barras» (2.º): los 8 pasos de la checklist, uno tras otro,
   con su nivel de Bloom: 1 leo, 2 subrayo datos y rodeo la pregunta, 3 dibujo el diagrama, 4 coloco los datos
   (y la ? en lo que no sé), 5 elijo la operación (¿falta el total? sumo; ¿falta una parte? resto), 6 calculo,
   7 escribo la solución con una frase y 8 compruebo con la operación contraria; y el reto CREAR.
   - Niveles: ● Semilla (suma sin llevar, falta el total; diagrama con nombres), ●● Brote (resta sin llevar,
     falta una parte; el alumno decide dónde va cada dato), ●●● Árbol (resta llevando; barras en blanco: el
     alumno traza la división) y Mezcla (sumar o restar, con o sin llevar: hay que decidir la operación).
   - Banco de problemas: 28 contextos (juntar y separar) con números distintos; no se repiten hasta agotarlos.
   - Imprimir la estación: checklist, una ficha de cada nivel (como las de la estación) y el solucionario.
   Usa las utilidades de index.html, herramientas.js, banco.js, aproximar.js y secciones.js ($, leer, guardar,
   delMazo, barajar, apTeclado, pintarIconos, pantallaCompleta, hojaPapel, lanzarImpresion…).
   ===================================================================== */

const PB = Object.assign({nivel:"semilla"}, leer("aula-problemas", {}),
  {reto:null, paso:1, herr:"datos", marcados:[], rodeada:false, corte:null, cajas:{}, chip:null, op:null, escrito:"", frases:null,
   aviso:"", tono:"", fallos:0, bien:0, ejemplo:false});
let problemasLista = false;
const guardarPB = () => guardar("aula-problemas", {nivel:PB.nivel});
const NIVELES_PB = {
  semilla:{txt:"● Semilla · sumar sin llevar", marca:"● Semilla"},
  brote:{txt:"●● Brote · restar sin llevar", marca:"●● Brote"},
  arbol:{txt:"●●● Árbol · restar llevando", marca:"●●● Árbol"},
  mezcla:{txt:"Mezcla · ¿sumo o resto?", marca:"Mezcla"}};
const nivelPB = () => NIVELES_PB[PB.nivel] ? PB.nivel : "semilla";
const PASOS_PB = [null,
  {txt:"Leo el problema", sub:"Despacio, para saber de qué trata.", bloom:["RECORDAR"]},
  {txt:"Subrayo datos y pregunta", sub:"Los números y lo que me preguntan.", bloom:["COMPRENDER"]},
  {txt:"Dibujo el diagrama", sub:"Una barra para el total y otra para las partes.", bloom:["ANALIZAR"]},
  {txt:"Coloco los datos", sub:"Cada número en su sitio. Lo que no sé: ?", bloom:["ANALIZAR"]},
  {txt:"Elijo la operación", sub:"¿Sumo o resto?", bloom:["APLICAR"]},
  {txt:"Calculo", sub:"Hago la operación con cuidado.", bloom:["APLICAR"]},
  {txt:"Escribo la solución", sub:"Con una frase que responda a la pregunta.", bloom:["APLICAR"]},
  {txt:"Compruebo", sub:"¿Tiene sentido? ¿Me he equivocado?", bloom:["EVALUAR"]}];

/* ---------- Banco de problemas ----------
   Juntar: se conocen las dos partes (a y b) y falta el total. Separar: se conocen el total (t) y una parte (a)
   y falta la otra. En el texto, [a lechugas] es un dato (a, b o t delante) y {¿…?} es la pregunta. */
const JUNTAR_PB = [
  {txt:"En el huerto del cole hay [a lechugas] y [b tomateras]. {¿Cuántas plantas hay en total?}", total:"Total de plantas", p1:"Lechugas", p2:"Tomateras",
   sol:"En total hay # plantas.", mal:"En total hay # lechugas.", reto:["Si plantamos 2 lechugas más, ¿cuántas plantas habrá?", 2]},
  {txt:"Lucía tiene [a cromos de animales] y [b cromos de fútbol]. {¿Cuántos cromos tiene en total?}", total:"Todos los cromos", p1:"De animales", p2:"De fútbol",
   sol:"Lucía tiene # cromos.", mal:"Lucía tiene # cromos de fútbol.", reto:["Si su hermano le regala 3 cromos, ¿cuántos tendrá?", 3]},
  {txt:"En la excursión van [a niñas] y [b niños]. {¿Cuántos alumnos van de excursión?}", total:"Alumnos", p1:"Niñas", p2:"Niños",
   sol:"Van # alumnos de excursión.", mal:"Van # niñas de excursión.", reto:["Si también van 2 maestras, ¿cuántas personas irán?", 2]},
  {txt:"El lunes se prestaron [a libros] en la biblioteca y el martes, [b libros]. {¿Cuántos libros se prestaron entre los dos días?}", total:"Libros prestados", p1:"Lunes", p2:"Martes",
   sol:"Entre los dos días se prestaron # libros.", mal:"El martes se prestaron # libros.", reto:["Si el miércoles se prestan 4 libros, ¿cuántos se habrán prestado?", 4]},
  {txt:"En la frutería hay una caja con [a naranjas] y otra con [b manzanas]. {¿Cuántas frutas hay en las dos cajas?}", total:"Frutas", p1:"Naranjas", p2:"Manzanas",
   sol:"En las dos cajas hay # frutas.", mal:"En las dos cajas hay # naranjas.", reto:["Si llegan 5 manzanas más, ¿cuántas frutas habrá?", 5]},
  {txt:"En el primer partido nuestro equipo hizo [a puntos] y en el segundo, [b puntos]. {¿Cuántos puntos hizo en total?}", total:"Puntos", p1:"1.er partido", p2:"2.º partido",
   sol:"En total hizo # puntos.", mal:"En total hizo # partidos.", reto:["Si en el tercer partido hace 2 puntos, ¿cuántos tendrá?", 2]},
  {txt:"Pablo tiene [a canicas azules] y [b canicas rojas]. {¿Cuántas canicas tiene?}", total:"Canicas", p1:"Azules", p2:"Rojas",
   sol:"Pablo tiene # canicas.", mal:"Pablo tiene # canicas azules.", reto:["Si gana 3 canicas en el recreo, ¿cuántas tendrá?", 3]},
  {txt:"En el bote de clase hay [a lápices] y [b rotuladores]. {¿Cuántas pinturas hay en el bote?}", total:"Pinturas", p1:"Lápices", p2:"Rotuladores",
   sol:"En el bote hay # pinturas.", mal:"En el bote hay # lápices.", reto:["Si añadimos 4 ceras, ¿cuántas pinturas habrá?", 4]},
  {txt:"En la granja hay [a gallinas] y [b patos]. {¿Cuántas aves hay en la granja?}", total:"Aves", p1:"Gallinas", p2:"Patos",
   sol:"En la granja hay # aves.", mal:"En la granja hay # patos.", reto:["Si nacen 3 pollitos, ¿cuántas aves habrá?", 3]},
  {txt:"En el primer vagón del tren viajan [a personas] y en el segundo, [b personas]. {¿Cuántas personas viajan en el tren?}", total:"Viajeros", p1:"1.er vagón", p2:"2.º vagón",
   sol:"En el tren viajan # personas.", mal:"En el segundo vagón viajan # personas.", reto:["Si en la próxima parada suben 2 personas, ¿cuántas viajarán?", 2]},
  {txt:"Para la merienda hicimos [a galletas de chocolate] y [b galletas de vainilla]. {¿Cuántas galletas hicimos?}", total:"Galletas", p1:"Chocolate", p2:"Vainilla",
   sol:"Hicimos # galletas.", mal:"Hicimos # galletas de chocolate.", reto:["Si hacemos 5 galletas más, ¿cuántas tendremos?", 5]},
  {txt:"Ana tenía [a euros] en la hucha y su abuela le dio [b euros]. {¿Cuántos euros tiene ahora?}", total:"Euros de Ana", p1:"Tenía", p2:"Le dio",
   sol:"Ana tiene ahora # euros.", mal:"Ana tiene ahora # céntimos.", reto:["Si gana 2 euros más, ¿cuántos euros tendrá?", 2]},
  {txt:"Marcos leyó [a páginas] el sábado y [b páginas] el domingo. {¿Cuántas páginas leyó el fin de semana?}", total:"Páginas leídas", p1:"Sábado", p2:"Domingo",
   sol:"El fin de semana leyó # páginas.", mal:"El domingo leyó # páginas.", reto:["Si el lunes lee 4 páginas, ¿cuántas habrá leído?", 4]},
  {txt:"Hoy comen en el comedor [a alumnos de 1.º] y [b alumnos de 2.º]. {¿Cuántos alumnos comen en el comedor?}", total:"Alumnos del comedor", p1:"De 1.º", p2:"De 2.º",
   sol:"En el comedor comen # alumnos.", mal:"En el comedor comen # alumnos de 1.º.", reto:["Si llegan 2 alumnos más, ¿cuántos comerán?", 2]}];
const SEPARAR_PB = [
  {txt:"En la biblioteca hay [t libros]. [a son de cuentos] y el resto son de animales. {¿Cuántos libros de animales hay?}", total:"Libros", p1:"De cuentos", p2:"De animales",
   sol:"Hay # libros de animales.", mal:"Hay # libros de cuentos."},
  {txt:"Para la fiesta del aniversario hay [t sillas] en el patio. Ya se han sentado [a familias], una en cada silla. {¿Cuántas sillas quedan libres?}", total:"Sillas", p1:"Ocupadas", p2:"Libres",
   sol:"Quedan # sillas libres.", mal:"Quedan # familias."},
  {txt:"El álbum tiene [t cromos]. Juan ya ha pegado [a cromos]. {¿Cuántos cromos le faltan para completarlo?}", total:"Cromos del álbum", p1:"Pegados", p2:"Le faltan",
   sol:"A Juan le faltan # cromos.", mal:"Juan ha pegado # cromos."},
  {txt:"Para la fiesta compramos [t globos]. [a son rojos] y el resto, azules. {¿Cuántos globos azules hay?}", total:"Globos", p1:"Rojos", p2:"Azules",
   sol:"Hay # globos azules.", mal:"Hay # globos rojos."},
  {txt:"En el autobús iban [t personas]. En la parada se bajaron [a personas]. {¿Cuántas personas quedan en el autobús?}", total:"Iban", p1:"Se bajan", p2:"Quedan",
   sol:"En el autobús quedan # personas.", mal:"Se bajaron # personas."},
  {txt:"En la granja hay [t animales]. [a son ovejas] y el resto son cabras. {¿Cuántas cabras hay?}", total:"Animales", p1:"Ovejas", p2:"Cabras",
   sol:"En la granja hay # cabras.", mal:"En la granja hay # ovejas."},
  {txt:"El puzle tiene [t piezas]. Ya hemos colocado [a piezas]. {¿Cuántas piezas faltan por colocar?}", total:"Piezas", p1:"Colocadas", p2:"Faltan",
   sol:"Faltan # piezas por colocar.", mal:"Hemos colocado # piezas."},
  {txt:"Carmen tenía [t euros]. Se gastó [a euros] en un libro. {¿Cuántos euros le quedan?}", total:"Tenía", p1:"Gastó", p2:"Le quedan",
   sol:"A Carmen le quedan # euros.", mal:"Carmen se gastó # euros."},
  {txt:"En la caja había [t lápices]. Repartimos [a lápices] en clase. {¿Cuántos lápices quedan en la caja?}", total:"Lápices", p1:"Repartidos", p2:"Quedan",
   sol:"En la caja quedan # lápices.", mal:"Repartimos # lápices."},
  {txt:"El cuento tiene [t páginas]. Rocío ya ha leído [a páginas]. {¿Cuántas páginas le quedan por leer?}", total:"Páginas del cuento", p1:"Leídas", p2:"Le quedan",
   sol:"A Rocío le quedan # páginas por leer.", mal:"Rocío ha leído # páginas."},
  {txt:"En el aparcamiento caben [t coches]. Ahora hay [a coches] aparcados. {¿Cuántas plazas quedan libres?}", total:"Plazas", p1:"Ocupadas", p2:"Libres",
   sol:"Quedan # plazas libres.", mal:"Hay # coches aparcados."},
  {txt:"Pablo tenía [t canicas]. En el recreo perdió [a canicas]. {¿Cuántas canicas le quedan?}", total:"Tenía", p1:"Perdió", p2:"Le quedan",
   sol:"A Pablo le quedan # canicas.", mal:"Pablo perdió # canicas."},
  {txt:"La carrera del cole tiene [t metros]. Laura ya ha corrido [a metros]. {¿Cuántos metros le faltan para llegar a la meta?}", total:"Metros de la carrera", p1:"Ha corrido", p2:"Le faltan",
   sol:"A Laura le faltan # metros para llegar.", mal:"Laura ha corrido # metros."},
  {txt:"En el jardín hay [t flores]. [a son margaritas] y el resto son rosas. {¿Cuántas rosas hay?}", total:"Flores", p1:"Margaritas", p2:"Rosas",
   sol:"En el jardín hay # rosas.", mal:"En el jardín hay # margaritas."}];

/* Números de cada problema: 8 parejas fijas por contexto (siempre las mismas, para que el banco sepa cuáles han salido) */
function numerosPB(tipo, k, semilla){
  let x = 1103 * (k + 1) + 7919 * semilla;
  const r = (lo, hi)=>{ x = (x * 1103515245 + 12345) % 2147483648; return lo + x % (hi - lo + 1); };
  const vale = {
    sumaSin:(a, b)=> a % 10 + b % 10 <= 9 && a + b <= 99,
    sumaCon:(a, b)=> a % 10 + b % 10 >= 10 && a + b <= 99,
    restaSin:(t, a)=> a % 10 <= t % 10 && t - a >= 11,
    restaCon:(t, a)=> a % 10 > t % 10 && t - a >= 11}[tipo];
  const l = [];
  for(let n=0; l.length < 8 && n < 5000; n++){
    const p = tipo.startsWith("suma") ? [r(11, 69), r(11, 59)] : [r(31, 99), r(11, 79)];
    if(vale(...p) && p[0] % 10 && p[1] % 10 && !l.some(q=> q[0] === p[0] && q[1] === p[1])) l.push(p);
  }
  return l;
}
/* Todos los problemas de un nivel */
function listaPB(nivel){
  const l = [];
  const juntar = (tipo, cuantos) => JUNTAR_PB.forEach((tp, k)=> numerosPB(tipo, k, 1).slice(0, cuantos).forEach(([a, b])=> l.push({k:"j"+k+"-"+a+"-"+b, tpl:k, juntar:true, a, b, t:a + b})));
  const separar = (tipo, cuantos) => SEPARAR_PB.forEach((tp, k)=> numerosPB(tipo, k, 2).slice(0, cuantos).forEach(([t, a])=> l.push({k:"s"+k+"-"+t+"-"+a, tpl:k, juntar:false, a, b:t - a, t})));
  if(nivel === "semilla") juntar("sumaSin", 8);
  else if(nivel === "brote") separar("restaSin", 8);
  else if(nivel === "arbol") separar("restaCon", 8);
  else{ juntar("sumaSin", 2); juntar("sumaCon", 2); separar("restaSin", 2); separar("restaCon", 2); }
  return l;
}
const plantillaPB = r => (r.juntar ? JUNTAR_PB : SEPARAR_PB)[r.tpl];
const incognitaPB = r => r.juntar ? r.t : r.b;
const valorPB = (r, c) => c === "?" ? "?" : r[c];
/* El texto en trozos: datos, pregunta y el resto (todos se pueden tocar en el paso 2) */
function trozosPB(r){
  const tp = plantillaPB(r), trozos = [];
  tp.txt.replace(/\[([abt]) ([^\]]+)\]|\{([^}]+)\}|([^[{]+)/g, (_, v, resto, preg, texto)=>{
    if(v) trozos.push({tipo:"dato", txt:r[v]+" "+resto, raw:r[v]+" "+resto, v});
    else if(preg) trozos.push({tipo:"pregunta", txt:preg, raw:preg});
    else (texto.match(/\s*[^.,]*[.,]?\s*/g) || []).filter(f=> f.length).forEach(f=>{
      const txt = f.trim();
      if(txt) trozos.push({tipo:/^[.,]$/.test(txt) ? "signo" : "texto", txt, raw:f});
      else if(trozos.length) trozos[trozos.length - 1].raw += f;
    });
  });
  return trozos;
}
/* El texto con sus espacios originales; cada trozo lo pinta «pinta(trozo, i)» */
const textoPB = (r, pinta) => trozosPB(r).map((t, i)=> (/^\s/.test(t.raw) ? " " : "")+pinta(t, i)+(/\s$/.test(t.raw) ? " " : "")).join("").replace(/\s+/g, " ");
function nuevoProblemaPB(){
  const r = Object.assign({}, delMazo("pb-"+nivelPB(), listaPB(nivelPB())));
  Object.assign(PB, {reto:r, paso:1, herr:"datos", marcados:[], rodeada:false, corte:null, cajas:{}, chip:null, op:null, escrito:"", frases:null,
    aviso:"", tono:"", fallos:0, ejemplo:false});
  pintarProblemas();
}
function avanzarPB(aviso, tono){
  PB.paso++; PB.aviso = aviso || ""; PB.tono = tono || (aviso ? "bien" : "");
  if(PB.paso === 7 && !PB.frases){
    const r = PB.reto, tp = plantillaPB(r), x = incognitaPB(r), malo = r.juntar ? Math.abs(r.a - r.b) : r.t + r.a;
    PB.frases = barajar([{ok:true, txt:tp.sol.replace("#", x)}, {txt:tp.mal.replace("#", x)}, {txt:tp.sol.replace("#", malo)}]);
  }
  if(PB.paso === 10 && !PB.fallos) PB.bien++;
  pintarProblemas();
}
function fallarPB(aviso){ PB.fallos++; PB.aviso = aviso; PB.tono = "mal"; pintarProblemas(); }

/* ---------- Paso 2: subrayar los datos y rodear la pregunta ---------- */
function tocarTrozoPB(i){
  if(PB.paso !== 2) return;
  const t = trozosPB(PB.reto)[i];
  if(PB.herr === "datos"){
    if(t.tipo !== "dato") return fallarPB(t.tipo === "pregunta" ? "Eso es la pregunta: para rodearla, elige el lápiz de la pregunta." : "Eso no es un dato: los datos llevan números.");
    if(!PB.marcados.includes(i)) PB.marcados.push(i);
  }else{
    if(t.tipo !== "pregunta") return fallarPB(t.tipo === "dato" ? "Eso es un dato, no la pregunta. La pregunta lleva los signos ¿ ?" : "Esa no es la pregunta: busca la frase con ¿ ?");
    PB.rodeada = true;
  }
  PB.aviso = ""; PB.tono = "";
  const datos = trozosPB(PB.reto).filter(x=> x.tipo === "dato").length;
  if(PB.marcados.length === datos && PB.rodeada) return avanzarPB("¡Bien! Los datos están subrayados y la pregunta, rodeada.");
  pintarProblemas();
}

/* ---------- Pasos 3 y 4: el diagrama ---------- */
function cortarPB(pct){
  if(PB.paso !== 3 || nivelPB() !== "arbol") return;
  PB.corte = Math.max(15, Math.min(85, Math.round(pct / 5) * 5));
  avanzarPB("Ya tienes las dos partes. Ahora coloca los datos.");
}
const BIEN_PB = r => r.juntar ? {total:"?", partes:["a", "b"]} : {total:"t", partes:["a", "?"]};
function ponerPB(caja){
  if(PB.paso !== 4 || !PB.chip || PB.cajas[caja]) return;
  const r = PB.reto, tp = plantillaPB(r), c = PB.chip, bien = BIEN_PB(r);
  const nombre = c === "t" ? "el total" : c === "?" ? "lo que no sabemos" : "una parte ("+(c === "a" ? tp.p1 : tp.p2).toLowerCase()+")";
  const va = caja === "total" ? c === bien.total : bien.partes.includes(c);
  if(!va){
    return fallarPB(c === "?" ? (r.juntar ? "Las dos partes las sabemos. ¿Qué es lo que no sabemos: las partes o el total?" : "El total sí lo sabemos: es "+r.t+". La ? va en la parte que no sabemos.") :
      c === "t" ? "El "+r.t+" es el total: son todos. Va en la barra de arriba." :
      "El "+r[c]+" es "+nombre+": va en la barra de abajo.");
  }
  PB.cajas[caja] = c; PB.chip = null; PB.aviso = ""; PB.tono = "";
  if(PB.cajas.total && PB.cajas.p1 && PB.cajas.p2) return avanzarPB("¡Muy bien! "+(r.juntar ? "Falta el total" : "Falta una parte")+": la ? está en su sitio.");
  pintarProblemas();
}
/* Lo que se ve en cada caja del diagrama y el nombre de cada barra */
function diagramaPB(editable){
  const r = PB.reto, tp = plantillaPB(r), n = nivelPB(), colocados = PB.paso > 4;
  const nombres = n === "semilla" || colocados;
  const nombreParte = c => c === "a" ? tp.p1 : c === "b" || (c === "?" && !r.juntar) ? tp.p2 : "";
  // ancho de las partes: a escala cuando ya están colocadas; si no, la raya del alumno (Árbol) o la mitad
  let corte = PB.corte ?? 50;
  if(colocados){ const izq = r[PB.cajas.p1] ?? incognitaPB(r); corte = Math.max(18, Math.min(82, Math.round(100 * izq / r.t))); }
  const sinCortar = n === "arbol" && PB.corte === null && PB.paso <= 3;
  const caja = (id, eti)=>{
    const c = PB.cajas[id], val = c ? valorPB(r, c) : "";
    const lbl = eti || "";
    if(editable && !c) return '<button class="pb-caja vacia'+(PB.chip ? " lista" : "")+'" data-caja="'+id+'" aria-label="Poner '+(PB.chip ? valorPB(r, PB.chip) : "un dato")+' en '+(id === "total" ? "la barra del total" : "la parte "+(id === "p1" ? "de la izquierda" : "de la derecha"))+'">'+(lbl ? "" : "")+'</button>';
    return '<span class="pb-caja'+(c === "?" ? " incognita" : c ? " puesta" : "")+'">'+(val === "?" && PB.paso > 6 ? incognitaPB(r) : val)+'</span>';
  };
  const etiTotal = nombres ? tp.total : "", eti1 = n === "semilla" ? tp.p1 : colocados ? nombreParte(PB.cajas.p1) : "", eti2 = n === "semilla" ? tp.p2 : colocados ? nombreParte(PB.cajas.p2) : "";
  let h = '<div class="pb-diagrama" role="group" aria-label="Diagrama de barras">';
  h += '<div class="pb-barra total"><span class="pb-eti">'+(etiTotal || (n === "arbol" && !colocados ? "total" : ""))+'</span>'+caja("total")+'</div>';
  if(sinCortar){
    h += '<button class="pb-barra partes sin" id="pbCortar" aria-label="Toca donde quieras separar las dos partes"><span class="pb-eti">parte + parte (toca donde quieres separarlas)</span></button>';
  }else{
    h += '<div class="pb-partes" style="--corte:'+corte+'%"><div class="pb-barra"><span class="pb-eti">'+eti1+'</span>'+caja("p1")+'</div><div class="pb-barra"><span class="pb-eti">'+eti2+'</span>'+caja("p2")+'</div></div>';
  }
  return h+'</div>';
}

/* ---------- Pasos 5 a 8 y el reto ---------- */
function operacionPB(op){
  if(PB.paso !== 5) return;
  const r = PB.reto;
  if((op === "+") !== r.juntar) return fallarPB(r.juntar ? "Mira el diagrama: falta el total (la ? está arriba). ¿Falta el total? → sumo." : "Mira el diagrama: falta una parte (la ? está abajo). ¿Falta una parte? → resto.");
  PB.op = op;
  avanzarPB(r.juntar ? "¡Eso es! Falta el total: se suma." : "¡Eso es! Falta una parte: se resta.");
}
const cuentaPB = r => r.juntar ? [r.a, r.b, "+"] : [r.t, r.a, "−"];
function teclaPB(t){
  if(![6, 8, 9].includes(PB.paso) || (PB.paso === 9 && !PB.reto.juntar)) return;
  if(t === "⌫") PB.escrito = PB.escrito.slice(0, -1);
  else if(t !== "✓"){ if(PB.escrito.length < 3) PB.escrito += t; }
  else if(PB.escrito){
    const v = +PB.escrito, r = PB.reto, x = incognitaPB(r); PB.escrito = "";
    if(PB.paso === 6){
      if(v === x) return avanzarPB("¡Bien calculado! "+(r.juntar ? r.a+" + "+r.b : r.t+" − "+r.a)+" = "+x+".");
      const [m, s] = cuentaPB(r), u = r.juntar ? m % 10 + s % 10 : m % 10 - s % 10;
      return fallarPB(v+" no es. "+(r.juntar ? "Suma primero las unidades: "+(m % 10)+" + "+(s % 10)+" = "+u+(u >= 10 ? " (¡te llevas una decena!)" : "")+"." :
        u < 0 ? "En las unidades, "+(m % 10)+" − "+(s % 10)+" no se puede: rompe una decena. Si lo necesitas, hazla con La resta descompuesta." : "Resta primero las unidades: "+(m % 10)+" − "+(s % 10)+" = "+u+"."));
    }
    if(PB.paso === 8){
      const bueno = r.juntar ? r.a : r.t;
      if(v === bueno) return avanzarPB("✓ ¡Sale "+bueno+", "+(r.juntar ? "lo que sabíamos de "+plantillaPB(r).p1.toLowerCase() : "el total")+"! El resultado tiene sentido.");
      return fallarPB(v+" no es. "+(r.juntar ? x+" − "+r.b : r.a+" + "+x)+": calcula con cuidado.");
    }
    const [, delta] = plantillaPB(r).reto;
    if(v === r.t + delta) return avanzarPB("¡Reto conseguido! "+r.t+" + "+delta+" = "+(r.t + delta)+".");
    return fallarPB(v+" no es. Ya había "+r.t+": súmale "+delta+".");
  }
  pintarProblemas();
}
function frasePB(i){
  if(PB.paso !== 7) return;
  const f = PB.frases[i];
  if(f.ok) return avanzarPB("¡Esa frase responde a la pregunta!");
  fallarPB("Esa frase no responde a la pregunta. Vuelve a leer qué te preguntan.");
}

/* ---------- Vista ---------- */
function iniciarProblemas(){
  if(!problemasLista){
    problemasLista = true;
    pintarIconos($("vProblemas"));
    $("pbNivel").innerHTML = Object.entries(NIVELES_PB).map(([k, v])=> '<option value="'+k+'">'+v.txt+'</option>').join("");
    $("pbNivel").onchange = e=>{ PB.nivel = e.target.value; guardarPB(); nuevoProblemaPB(); };
    $("pbImprimir").onclick = imprimirProblemas;
    $("pbOtro").onclick = nuevoProblemaPB;
    apTeclado("pbTeclado", teclaPB);
    if(document.fullscreenEnabled) $("pbPantalla").onclick = ()=> pantallaCompleta("vProblemas"); else $("pbPantalla").hidden = true;
  }
  if(!PB.reto) nuevoProblemaPB(); else pintarProblemas();
}
const bloomPB = l => l.map(b=> '<span class="pb-bloom">'+b+'</span>').join("");
function leerEnVozPB(){
  if(!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(textoPB(PB.reto, t=> t.txt)); u.lang = "es-ES"; u.rate = .85;
  speechSynthesis.speak(u);
}
function pintarProblemas(){
  const c = $("pbCuerpo"), r = PB.reto, tp = plantillaPB(r), n = nivelPB(), p = PB.paso;
  $("pbNivel").value = n;
  const trozos = trozosPB(r);
  // el problema (en el paso 2 se puede tocar cada trozo)
  const prob = textoPB(r, (t, i)=>{
    const clase = "pb-trozo"+(PB.marcados.includes(i) ? " subrayado" : "")+(t.tipo === "pregunta" && PB.rodeada ? " rodeado" : "");
    return p === 2 && t.tipo !== "signo" ? '<button class="'+clase+'" data-tr="'+i+'">'+t.txt+'</button>' : '<span class="'+clase+'">'+t.txt+'</span>';
  });
  let h = '<div class="pb-main">';
  h += '<section class="pb-problema" aria-label="El problema"><p class="pb-cab"><span class="pb-nivel">'+NIVELES_PB[n].marca+'</span><span class="ap-puntos" aria-label="'+PB.bien+' sin fallos">★ '+PB.bien+'</span></p><p class="pb-texto">'+prob+'</p>';
  if(p === 2) h += '<div class="pb-lapices" role="group" aria-label="Lápices"><button class="pb-lapiz datos" data-h="datos" aria-pressed="'+(PB.herr === "datos")+'">✏️ Subrayar datos</button><button class="pb-lapiz pregunta" data-h="pregunta" aria-pressed="'+(PB.herr === "pregunta")+'">⭕ Rodear la pregunta</button></div>';
  h += '</section>';
  // la tarjeta del paso que toca
  const paso = PASOS_PB[Math.min(p, 8)];
  if(p <= 8) h += '<section class="pb-paso"><h2>'+bloomPB(paso.bloom)+' <span>'+p+'. '+paso.txt+'</span></h2>';
  if(p === 1){
    h += '<p>Lee el problema <b>despacio</b>, para saber de qué trata.</p><div class="pt-acciones">'+(window.speechSynthesis ? '<button class="bt" id="pbVoz">🔊 Escuchar</button>' : '')+'<button class="bt azul" id="pbLeido">Ya lo he leído</button></div>';
  }else if(p === 2){
    const datos = trozos.filter(t=> t.tipo === "dato").length;
    h += '<p>Elige un lápiz y toca en el problema: <b>subraya los datos</b> (los números) y <b>rodea la pregunta</b>.</p><p class="pb-cuenta">Datos subrayados: '+PB.marcados.length+' de '+datos+' · Pregunta: '+(PB.rodeada ? "rodeada ✓" : "sin rodear")+'</p>';
  }else if(p === 3){
    h += n === "arbol" ? '<p>Las barras están en blanco. Arriba va el <b>total</b>; abajo, las <b>partes</b>. <b>Toca la barra de abajo</b> donde quieras trazar la línea que separa las dos partes.</p>'+diagramaPB(false) :
      '<p>Así es el diagrama: una barra larga para el <b>total</b> y, debajo, las <b>partes</b>. Funciona como las regletas.</p>'+diagramaPB(false)+'<div class="pt-acciones"><button class="bt azul" id="pbVisto">Entendido</button></div>';
  }else if(p === 4){
    const usados = Object.values(PB.cajas), fichas = (r.juntar ? ["a", "b", "?"] : ["t", "a", "?"]).filter(f=> !usados.includes(f));
    h += '<p>Toca un número y después la caja donde va. Lo que no sabes es la <b>?</b>'+(n === "semilla" ? "" : "; tú decides dónde va cada dato")+'.</p>'+
      '<div class="pb-fichas" role="group" aria-label="Datos para colocar">'+fichas.map(f=> '<button class="pb-ficha'+(f === "?" ? " incognita" : "")+'" data-f="'+f+'" aria-pressed="'+(PB.chip === f)+'">'+valorPB(r, f)+'</button>').join("")+'</div>'+diagramaPB(true);
    if(n === "semilla") h += '<p class="pb-pista">Pista: puedes construir el '+r.a+' con regletas: '+Math.floor(r.a / 10)+' naranja'+(Math.floor(r.a / 10) === 1 ? "" : "s")+' y '+r.a % 10+' blanca'+(r.a % 10 === 1 ? "" : "s")+'.</p>';
  }else if(p === 5){
    h += diagramaPB(false)+'<p>¿Falta el total? → <b>sumo</b>. ¿Falta una parte? → <b>resto</b>.</p><div class="ap-opciones"><button class="ap-opcion texto" data-op="+">+ sumo</button><button class="ap-opcion texto" data-op="−">− resto</button></div>';
  }else if(p === 6){
    const [m, s, signo] = cuentaPB(r), res = PB.escrito.padStart(2, " ");
    h += '<div class="pb-calculo"><table class="pb-du" aria-label="'+m+" "+(signo === "+" ? "más" : "menos")+" "+s+'"><thead><tr><th></th><th>D</th><th>U</th></tr></thead><tbody>'+
      '<tr><td></td><td>'+Math.floor(m / 10)+'</td><td>'+m % 10+'</td></tr><tr><td class="pb-signo">'+signo+'</td><td>'+Math.floor(s / 10)+'</td><td>'+s % 10+'</td></tr>'+
      '<tr class="pb-res"><td></td><td>'+(PB.escrito.length > 1 ? res[0] : "")+'</td><td>'+(PB.escrito ? res[res.length - 1] : "?")+'</td></tr></tbody></table>'+
      (!r.juntar && r.a % 10 > r.t % 10 ? '<button class="bt" id="pbResta">➖ Hacerla con La resta descompuesta</button>' : '')+'</div>';
  }else if(p === 7){
    h += '<p>¿Qué frase responde a la pregunta <b>«'+trozos.find(t=> t.tipo === "pregunta").txt+'»</b>?</p><div class="pb-frases">'+PB.frases.map((f, i)=> '<button class="ap-opcion texto pb-frase" data-fr="'+i+'">'+f.txt+'</button>').join("")+'</div>';
  }else if(p === 8){
    const x = incognitaPB(r);
    h += '<p>¿Tiene sentido? Compruébalo con la <b>operación contraria</b>:</p><p class="ap-pregunta">'+(r.juntar ? x+" − "+r.b : r.a+" + "+x)+' = <span class="ap-campo activo'+(PB.tono === "mal" ? " mal" : "")+'">'+(PB.escrito || "?")+'</span></p>';
  }
  if(p <= 8) h += '</section>';
  if(p === 9){
    h += '<section class="pb-paso pb-reto"><h2>'+bloomPB(["CREAR"])+' <span>★ Reto</span></h2>';
    if(r.juntar) h += '<p>'+tp.reto[0]+'</p><p class="ap-pregunta">'+r.t+' + '+tp.reto[1]+' = <span class="ap-campo activo'+(PB.tono === "mal" ? " mal" : "")+'">'+(PB.escrito || "?")+'</span></p>';
    else{
      h += '<p>'+(n === "arbol" ? "Inventa un problema de <b>sumar</b> que se resuelva con este mismo diagrama." : "Inventa <b>otra pregunta</b> con los mismos datos y respóndela.")+' Cuéntaselo a tu compañero o escríbelo en el cuaderno.</p>';
      h += PB.ejemplo ? '<p class="pb-ejemplo">Por ejemplo: «'+tp.p1+': '+r.a+'. '+tp.p2+': '+r.b+'. ¿Cuántos son en total?» → '+r.a+' + '+r.b+' = '+r.t+'.</p>' : '';
      h += '<div class="pt-acciones"><button class="bt" id="pbEjemplo">'+(PB.ejemplo ? "Ocultar el ejemplo" : "Ver un ejemplo")+'</button><button class="bt azul" id="pbHecho">¡Hecho!</button></div>';
    }
    h += '</section>';
  }
  if(p === 10){
    const x = incognitaPB(r);
    h += '<section class="pb-paso fin"><h2>🏆 ¡Problema resuelto!</h2><p><b>'+tp.sol.replace("#", x)+'</b></p><p>'+(r.juntar ? r.a+" + "+r.b+" = "+x+" · Comprobación: "+x+" − "+r.b+" = "+r.a : r.t+" − "+r.a+" = "+x+" · Comprobación: "+r.a+" + "+x+" = "+r.t)+' ✓</p>'+
      '<div class="pt-acciones"><button class="bt azul" id="pbOtroFin">Otro problema</button></div></section>';
  }
  if(p >= 5 && p <= 9 && p !== 5) h += '<details class="pb-ver"><summary>Ver el diagrama</summary>'+diagramaPB(false)+'</details>';
  h += '<p class="ap-explica '+(PB.aviso ? PB.tono : "pb-sin")+'" role="status">'+PB.aviso+'</p></div>';
  // la checklist
  h += '<aside class="pb-check" aria-label="Checklist: 8 pasos"><h2>Checklist</h2><ol>'+PASOS_PB.slice(1).map((s, i)=>
    '<li class="'+(i + 1 < p ? "hecho" : i + 1 === p ? "ahora" : "")+'"><span class="pb-tick" aria-hidden="true">'+(i + 1 < p ? "✓" : "")+'</span><span><b>'+(i + 1)+'. '+s.txt+'</b><small>'+s.sub+'</small></span>'+
      '<span class="sr">'+(i + 1 < p ? " (hecho)" : i + 1 === p ? " (ahora)" : "")+'</span></li>').join("")+'</ol>'+
    '<p class="pb-regla">¿Falta el total? → <b>sumo</b>.<br>¿Falta una parte? → <b>resto</b>.</p></aside>';
  c.innerHTML = h;
  $("pbTeclado").hidden = !([6, 8].includes(p) || (p === 9 && r.juntar));
  c.querySelectorAll("[data-tr]").forEach(b=> b.onclick = ()=>{ tocarTrozoPB(+b.dataset.tr); c.querySelector('[data-tr="'+b.dataset.tr+'"]')?.focus(); });
  c.querySelectorAll("[data-h]").forEach(b=> b.onclick = ()=>{ PB.herr = b.dataset.h; pintarProblemas(); c.querySelector('[data-h="'+PB.herr+'"]')?.focus(); });
  c.querySelectorAll("[data-f]").forEach(b=> b.onclick = ()=>{ PB.chip = PB.chip === b.dataset.f ? null : b.dataset.f; PB.aviso = ""; pintarProblemas(); (c.querySelector(".pb-caja.vacia") || c.querySelector('[data-f="'+b.dataset.f+'"]'))?.focus(); });
  c.querySelectorAll("[data-caja]").forEach(b=> b.onclick = ()=>{ ponerPB(b.dataset.caja); (c.querySelector(".pb-ficha") || c.querySelector(".ap-opcion"))?.focus(); });
  c.querySelectorAll("[data-op]").forEach(b=> b.onclick = ()=> operacionPB(b.dataset.op));
  c.querySelectorAll("[data-fr]").forEach(b=> b.onclick = ()=> frasePB(+b.dataset.fr));
  $("pbLeido")?.addEventListener("click", ()=>{ avanzarPB(); c.querySelector("[data-tr]")?.focus(); });
  $("pbVoz")?.addEventListener("click", leerEnVozPB);
  $("pbVisto")?.addEventListener("click", ()=> avanzarPB());
  $("pbCortar")?.addEventListener("click", e=>{ const q = e.currentTarget.getBoundingClientRect(); cortarPB(e.detail ? 100 * (e.clientX - q.left) / q.width : 50); });
  $("pbResta")?.addEventListener("click", ()=>{ window.restaPendiente = [r.t, r.a]; location.hash = "#/resta"; });
  $("pbEjemplo")?.addEventListener("click", ()=>{ PB.ejemplo = !PB.ejemplo; pintarProblemas(); $("pbEjemplo")?.focus(); });
  $("pbHecho")?.addEventListener("click", ()=> avanzarPB("¡Reto hecho! Que tu compañero lo resuelva."));
  $("pbOtroFin")?.addEventListener("click", nuevoProblemaPB);
}
function tecladoProblemas(e){
  if(/^(select|input)$/i.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  if([6, 8].includes(PB.paso) || (PB.paso === 9 && PB.reto.juntar)){
    if(/^[0-9]$/.test(e.key)){ e.preventDefault(); teclaPB(e.key); }
    else if(e.key === "Backspace"){ e.preventDefault(); teclaPB("⌫"); }
    else if(e.key === "Enter"){ e.preventDefault(); teclaPB("✓"); }
  }else if(PB.paso === 10 && e.key === "Enter" && e.target.tagName !== "BUTTON"){ e.preventDefault(); nuevoProblemaPB(); }
}

/* ---------- Imprimir la estación: checklist, una ficha por nivel y el solucionario ---------- */
function fichaPapelPB(r, nivel, pagina, paginas){
  const tp = plantillaPB(r), texto = textoPB(r, t=> t.tipo === "dato" ? '<b>'+t.txt+'</b>' : t.txt);
  const bl = l => l.map(b=> '<span class="hj-pb-bloom">'+b+'</span>').join("");
  const caja = '<span class="hj-pb-hueco"></span>';
  let diag;
  if(nivel === "semilla") diag = '<div class="hj-pb-barra"><span>'+tp.total+'</span>'+caja+'</div><div class="hj-pb-partes"><div class="hj-pb-barra"><span>'+tp.p1+'</span>'+caja+'</div><div class="hj-pb-barra"><span>'+tp.p2+'</span>'+caja+'</div></div>';
  else if(nivel === "arbol") diag = '<div class="hj-pb-barra blanco"><span class="gris">total</span></div><div class="hj-pb-barra blanco"><span class="gris">parte + parte (traza tú la línea que las separa)</span></div>';
  else diag = '<div class="hj-pb-barra"><span class="raya"></span>'+caja+'</div><div class="hj-pb-partes"><div class="hj-pb-barra"><span class="raya"></span>'+caja+'</div><div class="hj-pb-barra"><span class="raya"></span>'+caja+'</div></div>';
  const reto = r.juntar ? tp.reto[0] : nivel === "arbol" ? "Inventa un problema de sumar que se resuelva con este mismo diagrama." : "Inventa otra pregunta con los mismos datos y respóndela.";
  const lineas = n => Array(n).fill('<span class="hj-pb-linea"></span>').join("");
  const mini = '<div class="hj-pb-mini">'+PASOS_PB.slice(1).map((s, i)=> '<span><i></i>'+(i + 1)+'. '+s.txt+'</span>').join("")+'</div>';
  return hojaPapel({titulo:"Resuelvo problemas", sub:"Sigue los 8 pasos de la checklist.", eti:NIVELES_PB[nivel].marca, pagina, paginas, datos:[["Nombre", "", 3], ["Fecha", "", 1]],
    cuerpo:'<div class="hj-pb">'+
      '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["RECORDAR", "COMPRENDER"])+' 1 y 2. Lee el problema. Subraya los datos y rodea la pregunta.</p><p class="hj-pb-texto">'+texto+'</p></div>'+
      '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["ANALIZAR"])+' 3 y 4. Representa el problema en el diagrama. Escribe cada número en su sitio y pon <b>?</b> en lo que no sabes.</p><div class="hj-pb-diag">'+diag+'</div>'+
        (nivel === "semilla" ? '<p class="hj-pb-pista">Pista: puedes construir el '+r.a+' con regletas: '+Math.floor(r.a / 10)+' naranjas y '+r.a % 10+' blancas.</p>' : '')+'</div>'+
      '<div class="hj-pb-dos"><div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["APLICAR"])+' 5. ¿Qué operación hago?</p><p class="hj-pb-ops"><span>+ sumo</span><span>− resto</span></p></div>'+
        '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["APLICAR"])+' 6. Calculo.</p><table class="hj-pb-du"><tr><th>D</th><th>U</th></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr class="res"><td></td><td></td></tr></table></div></div>'+
      '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["APLICAR"])+' 7. Escribo la solución con una frase.</p>'+lineas(2)+'</div>'+
      '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["EVALUAR"])+' 8. Compruebo. ¿Tiene sentido mi resultado?</p><p class="hj-pb-si">SÍ &nbsp; NO &nbsp;&nbsp; Lo compruebo así: <span class="hj-pb-linea corta"></span></p></div>'+
      '<div class="hj-pb-caja pb-reto"><p class="hj-pb-tit">'+bl(["CREAR"])+' ★ Reto: '+reto+'</p>'+lineas(2)+'</div>'+mini+'</div>'});
}
function solucionPB(r, nivel){
  const tp = plantillaPB(r), x = incognitaPB(r), datos = trozosPB(r).filter(t=> t.tipo === "dato").map(t=> t.txt).join(", ");
  return '<div class="hj-pb-sol"><p class="hj-pb-sol-tit">'+NIVELES_PB[nivel].marca+'</p><ul>'+
    '<li>Datos: '+datos+' · Pregunta: '+trozosPB(r).find(t=> t.tipo === "pregunta").txt.toLowerCase()+'</li>'+
    '<li>Diagrama: total '+(r.juntar ? "<b>?</b>" : r.t)+' · '+tp.p1.toLowerCase()+' '+r.a+' · '+tp.p2.toLowerCase()+' '+(r.juntar ? r.b : "<b>?</b>")+'</li>'+
    '<li>Operación: '+(r.juntar ? "suma · "+r.a+" + "+r.b : "resta"+(r.a % 10 > r.t % 10 ? " llevando" : "")+" · "+r.t+" − "+r.a)+' = <b>'+x+'</b></li>'+
    '<li>Solución: '+tp.sol.replace("#", x)+'</li>'+
    '<li>Comprobación: '+(r.juntar ? x+" − "+r.b+" = "+r.a : r.a+" + "+x+" = "+r.t)+' ✓ · Reto: '+(r.juntar ? r.t+" + "+tp.reto[1]+" = "+(r.t + tp.reto[1]) : nivel === "arbol" ? "ej. «"+tp.p1+": "+r.a+"; "+tp.p2+": "+x+". ¿Cuántos son en total?»" : "respuesta libre")+'.</li></ul></div>';
}
function imprimirProblemas(){
  const niveles = ["semilla", "brote", "arbol"], retos = niveles.map(n=> Object.assign({}, delMazo("pb-"+n, listaPB(n))));
  const paginas = 5;
  const check = '<div class="hj-pb-check">'+PASOS_PB.slice(1).map((s, i)=> '<div><i></i><span><b>'+(i + 1)+'. '+s.txt+'</b><br>'+s.sub+'</span></div>').join("")+'</div>'+
    '<div class="hj-pb-caja"><p class="hj-pb-tit">El diagrama de barras</p><div class="hj-pb-diag"><div class="hj-pb-barra"><span>Total</span><span class="hj-pb-hueco">?</span></div>'+
    '<div class="hj-pb-partes"><div class="hj-pb-barra"><span>Parte 1</span><span class="hj-pb-hueco"></span></div><div class="hj-pb-barra"><span>Parte 2</span><span class="hj-pb-hueco"></span></div></div></div>'+
    '<p class="hj-pb-regla">¿Falta el total? → <b>sumo</b>. &nbsp; ¿Falta una parte? → <b>resto</b>.</p></div>';
  $("impresion").innerHTML =
    hojaPapel({titulo:"Checklist: 8 pasos para resolver problemas", sub:"Estación lógico-matemática · Resuelvo problemas", eti:"Estación", pagina:1, paginas, cuerpo:check})+
    niveles.map((n, i)=> fichaPapelPB(retos[i], n, i + 2, paginas)).join("")+
    hojaPapel({titulo:"Solucionario", sub:"Plastifícalo. Lo reparte el corrector en el minuto 8.", eti:"Para el docente", pagina:5, paginas, docente:true,
      cuerpo:niveles.map((n, i)=> solucionPB(retos[i], n)).join("")});
  lanzarImpresion();
}
