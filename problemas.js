/* =====================================================================
   RESUELVO PROBLEMAS (#/problemas)
   La estación «Resuelvo problemas con diagramas de barras» (2.º): los 8 pasos de la checklist, uno tras otro,
   con su nivel de Bloom: 1 leo, 2 subrayo datos y rodeo la pregunta, 3 dibujo el diagrama, 4 coloco los datos
   (y la ? en lo que no sé), 5 elijo la operación (¿falta el total? sumo; ¿falta una parte? resto), 6 calculo,
   7 escribo la solución con una frase y 8 compruebo con la operación contraria; y el reto CREAR.
   - Niveles (en todos hay problemas de sumar y de restar; lo que sube es la dificultad del problema):
     ● Semilla: problemas directos sin llevar; el diagrama viene dibujado y con los nombres.
     ●● Brote: problemas directos con llevadas; el alumno decide dónde va cada dato.
     ●●● Árbol: problemas que despistan (el verbo dice «perdió» y hay que sumar; «le regaló» y hay que restar)
     y de comparar («¿cuántos más?»); barras en blanco: el alumno traza la división.
   - Banco de problemas: 76 contextos con números distintos; no se repiten hasta agotarlos.
   - Imprimir la estación: checklist, una ficha de cada nivel (como las de la estación) y el solucionario.
   Usa las utilidades de index.html, herramientas.js, banco.js, aproximar.js y secciones.js ($, leer, guardar,
   delMazo, barajar, apTeclado, pintarIconos, pantallaCompleta, hojaPapel, lanzarImpresion…).
   ===================================================================== */

const PB = Object.assign({nivel:"semilla", forma:"tradicional", papel:"estacion", calcPapel:"tradicional"}, leer("aula-problemas", {}),
  {reto:null, calc:{}, paso:1, herr:"datos", marcados:[], rodeada:false, corte:null, cajas:{}, chip:null, op:null, escrito:"", frases:null,
   aviso:"", tono:"", fallos:0, bien:0, ejemplo:false});
let problemasLista = false;
const guardarPB = () => guardar("aula-problemas", {nivel:PB.nivel, forma:PB.forma, papel:PB.papel, calcPapel:PB.calcPapel});
const NIVELES_PB = {
  semilla:{txt:"● Semilla · problemas directos, sin llevar", marca:"● Semilla"},
  brote:{txt:"●● Brote · problemas directos, con llevadas", marca:"●● Brote"},
  arbol:{txt:"●●● Árbol · problemas que despistan", marca:"●●● Árbol"}};
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
   sol:"En el comedor comen # alumnos.", mal:"En el comedor comen # alumnos de 1.º.", reto:["Si llegan 2 alumnos más, ¿cuántos comerán?", 2]},
  {txt:"El sábado vinieron al museo [a niños] y el domingo, [b niños]. {¿Cuántos niños visitaron el museo el fin de semana?}", total:"Visitantes", p1:"Sábado", p2:"Domingo",
   sol:"El fin de semana vinieron # niños.", mal:"El domingo vinieron # niños.", reto:["Si el lunes vienen 3 niños más, ¿cuántos habrán venido?", 3]},
  {txt:"En el acuario de clase hay [a peces rojos] y [b peces amarillos]. {¿Cuántos peces hay en el acuario?}", total:"Peces", p1:"Rojos", p2:"Amarillos",
   sol:"En el acuario hay # peces.", mal:"En el acuario hay # peces rojos.", reto:["Si compramos 2 peces más, ¿cuántos habrá?", 2]},
  {txt:"Para la fiesta de fin de curso inflamos [a globos verdes] y [b globos naranjas]. {¿Cuántos globos inflamos?}", total:"Globos", p1:"Verdes", p2:"Naranjas",
   sol:"Inflamos # globos.", mal:"Inflamos # globos verdes.", reto:["Si inflamos 4 globos más, ¿cuántos tendremos?", 4]},
  {txt:"En el mercado, Rosa vendió [a kilos de tomates] por la mañana y [b kilos] por la tarde. {¿Cuántos kilos de tomates vendió en todo el día?}", total:"Kilos vendidos", p1:"Mañana", p2:"Tarde",
   sol:"Rosa vendió # kilos de tomates.", mal:"Por la tarde vendió # kilos.", reto:["Si al día siguiente vende 5 kilos más, ¿cuántos habrá vendido?", 5]},
  {txt:"En la carrera solidaria corrieron [a alumnos de Primaria] y [b alumnos de Infantil]. {¿Cuántos alumnos corrieron?}", total:"Corredores", p1:"Primaria", p2:"Infantil",
   sol:"Corrieron # alumnos.", mal:"Corrieron # alumnos de Infantil.", reto:["Si también corren 3 maestros, ¿cuántas personas correrán?", 3]},
  {txt:"En la estantería de clase hay [a cuentos] y [b cómics]. {¿Cuántos libros hay en la estantería?}", total:"Libros", p1:"Cuentos", p2:"Cómics",
   sol:"En la estantería hay # libros.", mal:"En la estantería hay # cómics.", reto:["Si traemos 2 cuentos más, ¿cuántos libros habrá?", 2]},
  {txt:"En el jardín del cole plantamos [a girasoles] y [b margaritas]. {¿Cuántas flores plantamos?}", total:"Flores", p1:"Girasoles", p2:"Margaritas",
   sol:"Plantamos # flores.", mal:"Plantamos # girasoles.", reto:["Si plantamos 3 flores más, ¿cuántas tendremos?", 3]},
  {txt:"En el concierto de Navidad cantaron [a niños] y tocaron la flauta [b niños]. {¿Cuántos niños participaron en el concierto?}", total:"Participantes", p1:"Cantaron", p2:"Flauta",
   sol:"En el concierto participaron # niños.", mal:"En el concierto cantaron # niños.", reto:["Si se apuntan 2 niños más, ¿cuántos participarán?", 2]},
  {txt:"Javier hizo [a fotos] en la playa y [b fotos] en la montaña. {¿Cuántas fotos hizo en las vacaciones?}", total:"Fotos", p1:"Playa", p2:"Montaña",
   sol:"En las vacaciones Javier hizo # fotos.", mal:"Javier hizo # fotos en la playa.", reto:["Si hace 4 fotos más, ¿cuántas tendrá?", 4]},
  {txt:"En el recreo, los de 1.º recogieron [a papeles] del patio y los de 2.º, [b papeles]. {¿Cuántos papeles recogieron entre todos?}", total:"Papeles", p1:"Los de 1.º", p2:"Los de 2.º",
   sol:"Entre todos recogieron # papeles.", mal:"Los de 2.º recogieron # papeles.", reto:["Si los de 3.º recogen 5 papeles, ¿cuántos habrá?", 5]}];
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
   sol:"En el jardín hay # rosas.", mal:"En el jardín hay # margaritas."},
  {txt:"En el acuario había [t peces]. Regalamos [a peces] a otra clase. {¿Cuántos peces quedan en el acuario?}", total:"Había", p1:"Regalamos", p2:"Quedan",
   sol:"En el acuario quedan # peces.", mal:"Regalamos # peces."},
  {txt:"Hay que pintar [t baldosas] del patio. Ya hemos pintado [a baldosas]. {¿Cuántas baldosas faltan por pintar?}", total:"Baldosas", p1:"Pintadas", p2:"Faltan",
   sol:"Faltan # baldosas por pintar.", mal:"Hemos pintado # baldosas."},
  {txt:"En la sala del cine hay [t butacas]. Están ocupadas [a butacas]. {¿Cuántas butacas están vacías?}", total:"Butacas", p1:"Ocupadas", p2:"Vacías",
   sol:"Hay # butacas vacías.", mal:"Hay # butacas ocupadas."},
  {txt:"En la frutería había [t melones]. Por la mañana se vendieron [a melones]. {¿Cuántos melones quedan?}", total:"Había", p1:"Vendidos", p2:"Quedan",
   sol:"En la frutería quedan # melones.", mal:"Se vendieron # melones."},
  {txt:"En el colegio hay [t alumnos]. [a se quedan al comedor] y el resto come en casa. {¿Cuántos alumnos comen en casa?}", total:"Alumnos", p1:"Comedor", p2:"En casa",
   sol:"En casa comen # alumnos.", mal:"Al comedor se quedan # alumnos."},
  {txt:"El tren lleva [t viajeros]. En Murcia se bajan [a viajeros]. {¿Cuántos viajeros siguen en el tren?}", total:"Viajeros", p1:"Se bajan", p2:"Siguen",
   sol:"En el tren siguen # viajeros.", mal:"En Murcia se bajan # viajeros."},
  {txt:"Hicimos [t galletas] para la fiesta. Ya nos hemos comido [a galletas]. {¿Cuántas galletas quedan?}", total:"Galletas", p1:"Comidas", p2:"Quedan",
   sol:"Quedan # galletas.", mal:"Nos hemos comido # galletas."},
  {txt:"En la caja de material hay [t gomas]. [a son blancas] y el resto, de colores. {¿Cuántas gomas son de colores?}", total:"Gomas", p1:"Blancas", p2:"De colores",
   sol:"Hay # gomas de colores.", mal:"Hay # gomas blancas."},
  {txt:"La excursión cuesta [t euros]. Marta ya ha pagado [a euros]. {¿Cuántos euros le faltan por pagar?}", total:"Precio", p1:"Pagado", p2:"Le falta",
   sol:"A Marta le faltan # euros por pagar.", mal:"Marta ha pagado # euros."},
  {txt:"En el huerto teníamos [t zanahorias]. Ya hemos recogido [a zanahorias]. {¿Cuántas zanahorias quedan en la tierra?}", total:"Zanahorias", p1:"Recogidas", p2:"En la tierra",
   sol:"Quedan # zanahorias en la tierra.", mal:"Hemos recogido # zanahorias."}];

/* Problemas que despistan (Árbol): el verbo invita a la operación contraria, o hay que comparar */
const DIFICIL_TOTAL_PB = [   // falta el total: se suma
  {txt:"Pablo tenía unas canicas. En el recreo perdió [a canicas] y ahora le quedan [b canicas]. {¿Cuántas canicas tenía al principio?}", total:"Tenía al principio", p1:"Perdió", p2:"Le quedan",
   sol:"Al principio Pablo tenía # canicas.", mal:"Pablo perdió # canicas.", reto:["¿Y si al principio hubiera tenido 2 canicas más? ¿Cuántas serían?", 2]},
  {txt:"Ana tiene [a euros]. Luis tiene [b euros más que Ana]. {¿Cuántos euros tiene Luis?}", total:"Euros de Luis", p1:"Como Ana", p2:"Más que Ana",
   sol:"Luis tiene # euros.", mal:"Ana tiene # euros.", reto:["Si Luis gana 2 euros más, ¿cuántos tendrá?", 2]},
  {txt:"En el autobús quedan [b personas] después de que se bajaran [a personas] en la parada. {¿Cuántas personas iban antes de la parada?}", total:"Iban antes", p1:"Se bajaron", p2:"Quedan",
   sol:"Antes de la parada iban # personas.", mal:"Se bajaron # personas.", reto:["Si antes hubieran subido 2 personas más, ¿cuántas irían?", 2]},
  {txt:"Marta ha leído [a páginas] de su libro y todavía le faltan [b páginas] para terminarlo. {¿Cuántas páginas tiene el libro?}", total:"Páginas del libro", p1:"Leídas", p2:"Le faltan",
   sol:"El libro tiene # páginas.", mal:"A Marta le faltan # páginas.", reto:["Si el libro tuviera 3 páginas más, ¿cuántas tendría?", 3]},
  {txt:"La torre azul tiene [a cubos]. La torre roja tiene [b cubos más que la azul]. {¿Cuántos cubos tiene la torre roja?}", total:"Torre roja", p1:"Como la azul", p2:"Más que la azul",
   sol:"La torre roja tiene # cubos.", mal:"La torre azul tiene # cubos.", reto:["Si ponemos 2 cubos más en la torre roja, ¿cuántos tendrá?", 2]},
  {txt:"Carmen se gastó [a euros] en un libro y le sobraron [b euros]. {¿Cuántos euros llevaba?}", total:"Llevaba", p1:"Gastó", p2:"Le sobraron",
   sol:"Carmen llevaba # euros.", mal:"A Carmen le sobraron # euros.", reto:["Si hubiera llevado 5 euros más, ¿cuántos habría llevado?", 5]},
  {txt:"Hoy han faltado [a alumnos] al comedor y han comido [b alumnos]. {¿Cuántos alumnos se quedan normalmente en el comedor?}", total:"Alumnos del comedor", p1:"Han faltado", p2:"Han comido",
   sol:"Normalmente se quedan # alumnos en el comedor.", mal:"Hoy han comido # alumnos.", reto:["Si se apuntan 2 alumnos nuevos, ¿cuántos serán?", 2]},
  {txt:"Sofía regaló [a pegatinas] a sus amigas y todavía le quedan [b pegatinas]. {¿Cuántas pegatinas tenía al principio?}", total:"Tenía", p1:"Regaló", p2:"Le quedan",
   sol:"Al principio Sofía tenía # pegatinas.", mal:"A Sofía le quedan # pegatinas.", reto:["¿Y si hubiera tenido 2 pegatinas más? ¿Cuántas serían?", 2]},
  {txt:"En la biblioteca se prestaron [a libros] y se quedaron en las estanterías [b libros]. {¿Cuántos libros había antes de prestarlos?}", total:"Había", p1:"Prestados", p2:"Se quedaron",
   sol:"Antes había # libros.", mal:"Se prestaron # libros.", reto:["Si compramos 3 libros nuevos, ¿cuántos habría?", 3]},
  {txt:"Mi tío tiene [a años]. Mi abuelo tiene [b años más que mi tío]. {¿Cuántos años tiene mi abuelo?}", total:"Años del abuelo", p1:"Como el tío", p2:"Más que el tío",
   sol:"Mi abuelo tiene # años.", mal:"Mi tío tiene # años.", reto:["¿Cuántos años tendrá mi abuelo dentro de 2 años?", 2]},
  {txt:"Después de comernos [a cerezas], en el plato quedan [b cerezas]. {¿Cuántas cerezas había en el plato?}", total:"Había", p1:"Comidas", p2:"Quedan",
   sol:"En el plato había # cerezas.", mal:"En el plato quedan # cerezas.", reto:["Si hubiera habido 5 cerezas más, ¿cuántas serían?", 5]},
  {txt:"El equipo azul tiene [a puntos]. El equipo verde tiene [b puntos más que el azul]. {¿Cuántos puntos tiene el equipo verde?}", total:"Equipo verde", p1:"Como el azul", p2:"Más que el azul",
   sol:"El equipo verde tiene # puntos.", mal:"El equipo azul tiene # puntos.", reto:["Si el verde marca 2 puntos más, ¿cuántos tendrá?", 2]},
  {txt:"Para completar el álbum a Juan le faltan [b cromos]. Ya tiene pegados [a cromos]. {¿Cuántos cromos tiene el álbum completo?}", total:"Cromos del álbum", p1:"Pegados", p2:"Le faltan",
   sol:"El álbum tiene # cromos.", mal:"A Juan le faltan # cromos.", reto:["Si el álbum tuviera 4 cromos más, ¿cuántos tendría?", 4]},
  {txt:"Lola gastó [a euros] en el cine y ahora le quedan [b euros]. {¿Cuántos euros tenía Lola antes de ir al cine?}", total:"Tenía", p1:"Gastó", p2:"Le quedan",
   sol:"Antes de ir al cine Lola tenía # euros.", mal:"Lola gastó # euros.", reto:["¿Y si hubiera tenido 5 euros más? ¿Cuántos serían?", 5]}];
const DIFICIL_PARTE_PB = [   // falta una parte: se resta
  {txt:"Lucía tenía [a cromos]. Su hermano le regaló algunos y ahora tiene [t cromos]. {¿Cuántos cromos le regaló su hermano?}", total:"Ahora tiene", p1:"Tenía", p2:"Le regaló",
   sol:"Su hermano le regaló # cromos.", mal:"Lucía tiene # cromos."},
  {txt:"Luis tiene [t euros] y Ana tiene [a euros]. {¿Cuántos euros más que Ana tiene Luis?}", total:"Euros de Luis", p1:"Como Ana", p2:"Más que Ana",
   sol:"Luis tiene # euros más que Ana.", mal:"Ana tiene # euros."},
  {txt:"En el autobús iban [a personas]. En la parada subieron algunas y ahora van [t personas]. {¿Cuántas personas subieron?}", total:"Ahora van", p1:"Iban", p2:"Subieron",
   sol:"En la parada subieron # personas.", mal:"Ahora van # personas."},
  {txt:"La torre roja tiene [t cubos] y la azul, [a cubos]. {¿Cuántos cubos le faltan a la torre azul para ser tan alta como la roja?}", total:"Torre roja", p1:"Torre azul", p2:"Le faltan",
   sol:"A la torre azul le faltan # cubos.", mal:"La torre azul tiene # cubos."},
  {txt:"Pedro tenía [a canicas] y ganó algunas en el recreo. Ahora tiene [t canicas]. {¿Cuántas canicas ganó?}", total:"Ahora tiene", p1:"Tenía", p2:"Ganó",
   sol:"Pedro ganó # canicas.", mal:"Pedro tenía # canicas."},
  {txt:"En la granja había [a gallinas]. Han comprado más y ahora hay [t gallinas]. {¿Cuántas gallinas han comprado?}", total:"Ahora hay", p1:"Había", p2:"Han comprado",
   sol:"Han comprado # gallinas.", mal:"Ahora hay # gallinas."},
  {txt:"Laura ha hecho [t puntos] en el juego y Sergio, [a puntos]. {¿Cuántos puntos le faltan a Sergio para empatar con Laura?}", total:"Puntos de Laura", p1:"Puntos de Sergio", p2:"Le faltan",
   sol:"A Sergio le faltan # puntos.", mal:"Sergio tiene # puntos."},
  {txt:"Antonio tenía [a sellos]. Su abuelo le dio algunos más y ahora tiene [t sellos]. {¿Cuántos sellos le dio su abuelo?}", total:"Ahora tiene", p1:"Tenía", p2:"Le dio",
   sol:"Su abuelo le dio # sellos.", mal:"Antonio tiene # sellos."},
  {txt:"Mi abuelo tiene [t años] y mi tío, [a años]. {¿Cuántos años más que mi tío tiene mi abuelo?}", total:"Años del abuelo", p1:"Como el tío", p2:"Más que el tío",
   sol:"Mi abuelo tiene # años más que mi tío.", mal:"Mi tío tiene # años."},
  {txt:"En la granja había [a ovejas]. Han nacido corderitos y ahora hay [t ovejas]. {¿Cuántos corderitos han nacido?}", total:"Ahora hay", p1:"Había", p2:"Han nacido",
   sol:"Han nacido # corderitos.", mal:"Ahora hay # ovejas."},
  {txt:"El edificio rojo tiene [t ventanas] y el azul, [a ventanas]. {¿Cuántas ventanas menos que el rojo tiene el edificio azul?}", total:"Edificio rojo", p1:"Edificio azul", p2:"Menos que el rojo",
   sol:"El edificio azul tiene # ventanas menos.", mal:"El edificio azul tiene # ventanas."},
  {txt:"Nerea tenía [a euros] en la hucha. Su tía le dio dinero y ahora tiene [t euros]. {¿Cuántos euros le dio su tía?}", total:"Ahora tiene", p1:"Tenía", p2:"Le dio la tía",
   sol:"Su tía le dio # euros.", mal:"Nerea tiene # euros."},
  {txt:"En la primera parte del partido marcamos [a puntos] y al terminar teníamos [t puntos]. {¿Cuántos puntos marcamos en la segunda parte?}", total:"Al terminar", p1:"1.ª parte", p2:"2.ª parte",
   sol:"En la segunda parte marcamos # puntos.", mal:"Al terminar teníamos # puntos."},
  {txt:"Elena ha leído [t páginas] y Hugo, [a páginas]. {¿Cuántas páginas tiene que leer Hugo para alcanzar a Elena?}", total:"Páginas de Elena", p1:"Páginas de Hugo", p2:"Le faltan",
   sol:"Hugo tiene que leer # páginas.", mal:"Hugo ha leído # páginas."}];
const GRUPOS_PB = {j:JUNTAR_PB, s:SEPARAR_PB, dt:DIFICIL_TOTAL_PB, dp:DIFICIL_PARTE_PB};

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
  // falta el total (g = j o dt): se conocen las partes a y b; falta una parte (g = s o dp): se conocen t y a
  const juntar = (g, tipo, semilla, cuantos) => GRUPOS_PB[g].forEach((tp, k)=> numerosPB(tipo, k, semilla).slice(0, cuantos).forEach(([a, b])=> l.push({k:g+k+"-"+a+"-"+b, g, tpl:k, juntar:true, a, b, t:a + b})));
  const separar = (g, tipo, semilla, cuantos) => GRUPOS_PB[g].forEach((tp, k)=> numerosPB(tipo, k, semilla).slice(0, cuantos).forEach(([t, a])=> l.push({k:g+k+"-"+t+"-"+a, g, tpl:k, juntar:false, a, b:t - a, t})));
  if(nivel === "semilla"){ juntar("j", "sumaSin", 1, 4); separar("s", "restaSin", 2, 4); }
  else if(nivel === "brote"){ juntar("j", "sumaCon", 1, 4); separar("s", "restaCon", 2, 4); }
  else{ juntar("dt", "sumaSin", 3, 4); juntar("dt", "sumaCon", 3, 4); separar("dp", "restaSin", 4, 4); separar("dp", "restaCon", 4, 4); }
  return l;
}
const plantillaPB = r => GRUPOS_PB[r.g || (r.juntar ? "j" : "s")][r.tpl];
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
  Object.assign(PB, {reto:r, paso:1, herr:"datos", marcados:[], rodeada:false, corte:null, cajas:{}, chip:null, op:null, escrito:"", frases:null, calc:{},
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
/* El cálculo, casilla a casilla. Tradicional: primero las unidades (con la llevada) y luego las decenas.
   Por partes (descomposición): decenas con decenas (20 + 10 = 30), unidades con unidades (7 + 8 = 15) y se juntan.
   En la resta, si no llegan las unidades, primero se rompe una decena: 52 = 50 + 2 ‖ 40 + 12 → 20 + 5 → 25. */
const rompePB = r => !r.juntar && r.t % 10 < r.a % 10;
function casillasPB(r){
  const [m, s] = cuentaPB(r), mu = m % 10, su = s % 10, md = m - mu, sd = s - su, x = incognitaPB(r);
  if(!r.juntar && PB.forma === "partes"){
    const rompe = rompePB(r), d1 = rompe ? md - 10 : md, u1 = rompe ? mu + 10 : mu;
    return (rompe ? [
      {id:"rd", r:d1, pista:mu+" − "+su+" no se puede: rompe una decena. "+md+" − 10 = ?"},
      {id:"ru", r:u1, pista:"La decena rota pasa a las unidades: "+mu+" + 10 = ?", bien:"¡Bien! "+m+" = "+d1+" + "+u1+": sigue siendo "+m+"."}] : []).concat([
      {id:"pd", r:d1 - sd, pista:"Resta las decenas: "+d1+" − "+sd+" = ?"},
      {id:"pu", r:u1 - su, pista:"Resta las unidades: "+u1+" − "+su+" = ?"},
      {id:"pt", r:x, pista:"Junta lo que queda: "+(d1 - sd)+" + "+(u1 - su)+" = ?"}]);
  }
  if(r.juntar && PB.forma === "partes") return [
    {id:"pd", r:md + sd, pista:"Suma las decenas: "+md+" + "+sd+" = ?"},
    {id:"pu", r:mu + su, pista:"Suma las unidades: "+mu+" + "+su+" = ?"},
    {id:"pt", r:x, pista:"Junta las dos sumas: "+(md + sd)+" + "+(mu + su)+" = ?"}];
  const lleva = r.juntar ? mu + su >= 10 : mu < su;
  return [
    {id:"u", r:x % 10, pista:r.juntar ? "Suma las unidades: "+mu+" + "+su+" = "+(mu + su)+(lleva ? ". Escribe el "+(mu + su) % 10+" y te llevas 1 a las decenas." : ".") :
      lleva ? mu+" − "+su+" no se puede: rompe una decena. "+(mu + 10)+" − "+su+" = ?" : "Resta las unidades: "+mu+" − "+su+" = ?",
     bien:lleva ? (r.juntar ? "¡Bien! "+mu+" + "+su+" = "+(mu + su)+": escribes el "+(mu + su) % 10+" y te llevas 1 a las decenas." : "¡Bien! Has roto una decena: "+(mu + 10)+" − "+su+" = "+(mu + 10 - su)+". Arriba quedan "+(md / 10 - 1)+" decenas.") : ""},
    {id:"d", r:Math.floor(x / 10), pista:r.juntar ? "Suma las decenas: "+md / 10+" + "+sd / 10+(lleva ? " + 1 que te llevas" : "")+" = ?" :
      "Resta las decenas: "+(lleva ? (md / 10 - 1)+" (has roto una)" : md / 10)+" − "+sd / 10+" = ?"}];
}
const casillaPB = () => casillasPB(PB.reto).find(c=> PB.calc[c.id] === undefined);
function teclaPB(t){
  if(![6, 8, 9].includes(PB.paso) || (PB.paso === 9 && !PB.reto.juntar)) return;
  if(t === "⌫") PB.escrito = PB.escrito.slice(0, -1);
  else if(t !== "✓"){ if(PB.escrito.length < 3) PB.escrito += t; }
  else if(PB.escrito){
    const v = +PB.escrito, r = PB.reto, x = incognitaPB(r); PB.escrito = "";
    if(PB.paso === 6){
      const c = casillaPB();
      if(v === c.r){
        PB.calc[c.id] = v;
        if(!casillaPB()) return avanzarPB("¡Bien calculado! "+(r.juntar ? r.a+" + "+r.b : r.t+" − "+r.a)+" = "+x+".");
        PB.aviso = c.bien || ""; PB.tono = c.bien ? "bien" : "";
        return pintarProblemas();
      }
      return fallarPB(v+" no es. "+c.pista);
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
    $("pbPapel").value = PB.papel === "dos" ? "dos" : "estacion";
    $("pbPapel").onchange = e=>{ PB.papel = e.target.value; guardarPB(); };
    $("pbCalcPapel").value = PB.calcPapel === "descomposicion" ? "descomposicion" : "tradicional";
    $("pbCalcPapel").onchange = e=>{ PB.calcPapel = e.target.value; guardarPB(); };
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
    const [m, s2, signo] = cuentaPB(r), act = casillaPB(), campo = id=> PB.calc[id] !== undefined ? '<span class="pb-hecho">'+PB.calc[id]+'</span>' :
      act && act.id === id ? '<span class="ap-campo activo'+(PB.tono === "mal" ? " mal" : "")+'">'+(PB.escrito || "?")+'</span>' : '';
    h += '<div class="segmentos pb-formas" role="group" aria-label="Forma de calcular"><button data-forma="tradicional" aria-pressed="'+(PB.forma !== "partes")+'">Tradicional (D U)</button><button data-forma="partes" aria-pressed="'+(PB.forma === "partes")+'">'+(r.juntar ? "Por partes (d + u)" : "Descomposición (d − d, u − u)")+'</button></div>';
    h += '<div class="pb-calculo">';
    if(!r.juntar && PB.forma === "partes"){
      // 52 = 50 + 2 ‖ 40 + 12 / − 27 = 20 + 7 / d 40 − 20 / u 12 − 7 / 20 + 5 = 25
      const mu = m % 10, su = s2 % 10, md = m - mu, sd = s2 - su, rompe = rompePB(r), hechoR = !rompe || PB.calc.ru !== undefined;
      const d1 = rompe ? (PB.calc.rd !== undefined ? PB.calc.rd : "?") : md, u1 = rompe ? (PB.calc.ru !== undefined ? PB.calc.ru : "?") : mu;
      h += '<table class="pb-du partes resta" aria-label="'+m+" menos "+s2+' por descomposición"><tbody>'+
        '<tr><td></td><td class="pb-num">'+m+'</td><td class="pb-desc">= '+(rompe && PB.calc.rd !== undefined ? '<s>'+md+'</s>' : md)+' + '+(rompe && PB.calc.ru !== undefined ? '<s>'+mu+'</s>' : mu)+
          (rompe ? ' <span class="pb-rompe">‖ '+(campo("rd") || '<span class="pb-hueco"></span>')+' + '+(campo("ru") || '<span class="pb-hueco"></span>')+'</span>' : '')+'</td></tr>'+
        '<tr><td class="pb-signo">−</td><td class="pb-num">'+s2+'</td><td class="pb-desc">= '+sd+' + '+su+'</td></tr>'+
        '<tr class="pb-linea"><td class="pb-letra">d</td><td>'+campo("pd")+'</td><td class="pb-ayuda">'+(hechoR ? d1+' − '+sd : '')+'</td></tr>'+
        '<tr><td class="pb-letra">u <span class="pb-signo">+</span></td><td>'+campo("pu")+'</td><td class="pb-ayuda">'+(hechoR ? u1+' − '+su : '')+'</td></tr>'+
        '<tr class="pb-linea pb-total"><td></td><td>'+campo("pt")+'</td><td></td></tr></tbody></table>';
    }else if(r.juntar && PB.forma === "partes"){
      const mu = m % 10, su = s2 % 10;
      h += '<table class="pb-du partes" aria-label="'+m+" más "+s2+' por partes"><tbody>'+
        '<tr><td></td><td class="pb-num">'+m+'</td><td></td></tr><tr><td class="pb-signo">+</td><td class="pb-num">'+s2+'</td><td></td></tr>'+
        '<tr class="pb-linea"><td class="pb-letra">d</td><td>'+campo("pd")+'</td><td class="pb-ayuda">'+(m - mu)+' + '+(s2 - su)+'</td></tr>'+
        '<tr><td class="pb-letra">u <span class="pb-signo">+</span></td><td>'+campo("pu")+'</td><td class="pb-ayuda">'+mu+' + '+su+'</td></tr>'+
        '<tr class="pb-linea pb-total"><td></td><td>'+campo("pt")+'</td><td></td></tr></tbody></table>';
    }else{
      const lleva = r.juntar ? m % 10 + s2 % 10 >= 10 : m % 10 < s2 % 10, hechaU = PB.calc.u !== undefined;
      const marca = lleva && hechaU ? (r.juntar ? '<span class="pb-llevo">1</span>' : '<span class="pb-llevo">'+(Math.floor(m / 10) - 1)+'</span>') : '';
      const decArriba = lleva && hechaU && !r.juntar ? '<s>'+Math.floor(m / 10)+'</s>' : Math.floor(m / 10);
      const uniArriba = lleva && hechaU && !r.juntar ? '<span class="pb-llevo">1'+m % 10+'</span><s>'+m % 10+'</s>' : m % 10;
      h += '<table class="pb-du" aria-label="'+m+" "+(signo === "+" ? "más" : "menos")+" "+s2+'"><thead><tr><th></th><th>D</th><th>U</th></tr></thead><tbody>'+
        '<tr><td></td><td class="pb-marca">'+marca+decArriba+'</td><td class="pb-marca">'+uniArriba+'</td></tr><tr><td class="pb-signo">'+signo+'</td><td>'+Math.floor(s2 / 10)+'</td><td>'+s2 % 10+'</td></tr>'+
        '<tr class="pb-res"><td></td><td>'+campo("d")+'</td><td>'+campo("u")+'</td></tr></tbody></table>';
    }
    h += (!r.juntar && r.a % 10 > r.t % 10 ? '<button class="bt" id="pbResta">➖ Hacerla con La resta descompuesta</button>' : '')+'</div>';
    if(act) h += '<p class="pb-cuenta">'+({u:"Empieza por las <b>unidades</b>.", d:"Ahora las <b>decenas</b>.", pd:(r.juntar ? "Suma" : "Resta")+" las <b>decenas</b> (d).", pu:(r.juntar ? "Suma" : "Resta")+" las <b>unidades</b> (u).", pt:"<b>Junta</b> "+(r.juntar ? "las dos sumas." : "lo que queda."),
      rd:"<b>"+r.t % 10+" − "+r.a % 10+"</b> no se puede: <b>rompe una decena</b>. ¿Cuántas quedan en las decenas?", ru:"La decena rota pasa a las <b>unidades</b>: ¿cuántas hay ahora?"})[act.id]+'</p>';
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
  c.querySelectorAll("[data-forma]").forEach(b=> b.onclick = ()=>{ PB.forma = b.dataset.forma; guardarPB(); PB.calc = {}; PB.escrito = ""; PB.aviso = ""; pintarProblemas(); c.querySelector('[data-forma="'+PB.forma+'"]')?.focus(); });
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
/* El diagrama en papel: con nombres (Semilla), con huecos para los nombres (Brote) o en blanco (Árbol) */
function diagPapelPB(r, nivel){
  const tp = plantillaPB(r), caja = '<span class="hj-pb-hueco"></span>';
  if(nivel === "semilla") return '<div class="hj-pb-barra"><span>'+tp.total+'</span>'+caja+'</div><div class="hj-pb-partes"><div class="hj-pb-barra"><span>'+tp.p1+'</span>'+caja+'</div><div class="hj-pb-barra"><span>'+tp.p2+'</span>'+caja+'</div></div>';
  if(nivel === "arbol") return '<div class="hj-pb-barra blanco"><span class="gris">total</span></div><div class="hj-pb-barra blanco"><span class="gris">parte + parte (traza tú la línea que las separa)</span></div>';
  return '<div class="hj-pb-barra"><span class="raya"></span>'+caja+'</div><div class="hj-pb-partes"><div class="hj-pb-barra"><span class="raya"></span>'+caja+'</div><div class="hj-pb-barra"><span class="raya"></span>'+caja+'</div></div>';
}
const retoPapelPB = (r, nivel) => r.juntar ? plantillaPB(r).reto[0] : nivel === "arbol" ? "Inventa un problema de sumar que se resuelva con este mismo diagrama." : "Inventa otra pregunta con los mismos datos y respóndela.";
const bloomPapelPB = l => l.map(b=> '<span class="hj-pb-bloom">'+b+'</span>').join("");
/* El hueco para calcular en papel: tradicional (D U, con una fila para lo que te llevas o lo que rompes) o por
   descomposición, como en el aula (27 = 20 + 7… y, si hay que romper una decena, 52 = 50 + 2 ‖ 40 + 12).
   La suma por descomposición solo lleva sus huecos: 27 = 20 + 7, 18 = 10 + 8, d 20 + 10 = 30, u 7 + 8 = 15, 30 + 15 = 45. */
function calcPapelPB(r){
  if(PB.calcPapel === "descomposicion"){
    const c = '<span class="hj-pb-hueco"></span>', fila = c+' = '+c+' + '+c;
    if(r && r.juntar) return '<div class="hj-pb-desc"><div class="hj-pb-desc-izq"><span>'+fila+'</span><span>'+fila+'</span></div><div class="hj-pb-desc-sep"></div>'+
      '<div class="hj-pb-desc-der"><span><b class="hj-pb-desc-l">d</b>'+c+' + '+c+' = '+c+'</span><span><b class="hj-pb-desc-l">u</b>'+c+' + '+c+' = '+c+'</span><span class="hj-pb-desc-raya"></span><span><b class="hj-pb-desc-l"></b>'+c+' + '+c+' = '+c+'</span></div></div>';
    return '<div class="hj-pb-desc"><div class="hj-pb-desc-izq"><span>'+fila+'</span><span>'+fila+'</span></div><div class="hj-pb-desc-doble"></div>'+
      '<div class="hj-pb-desc-der"><span>'+c+' + '+c+'</span><span>'+c+' + '+c+'</span><span class="hj-pb-desc-raya"></span><span>'+c+' + '+c+' → '+c+'</span></div></div>'+
      '<p class="hj-pb-desc-nota">Después de ‖, cómo queda si hay que romper una decena.</p>';
  }
  return '<table class="hj-pb-du"><tr><th></th><th>D</th><th>U</th></tr><tr class="lleva"><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr class="res"><td></td><td></td><td></td></tr></table>';
}
/* El cálculo, escrito, para el solucionario */
function calcSolucionPB(r){
  const [m, s] = cuentaPB(r), x = incognitaPB(r), d = n => (n - n % 10)+" + "+n % 10;
  if(PB.calcPapel !== "descomposicion") return r.juntar ? m+" + "+s+" = "+x+(m % 10 + s % 10 >= 10 ? " (me llevo 1)" : "") : m+" − "+s+" = "+x+(m % 10 < s % 10 ? " (rompo una decena)" : "");
  if(r.juntar) return m+" = "+d(m)+"; "+s+" = "+d(s)+" → "+(m - m % 10 + s - s % 10)+" + "+(m % 10 + s % 10)+" = "+x;
  const rompe = m % 10 < s % 10;
  return m+" = "+d(m)+"; "+s+" = "+d(s)+(rompe ? " ‖ "+(m - m % 10 - 10)+" + "+(m % 10 + 10) : "")+" → "+(x - x % 10)+" + "+x % 10+" = "+x;
}
/* Media ficha (para imprimir dos por cara): lo mismo que la ficha entera, más apretado */
function mediaFichaPB(r, nivel){
  const texto = textoPB(r, t=> t.tipo === "dato" ? '<b>'+t.txt+'</b>' : t.txt), bl = bloomPapelPB;
  return '<div class="hj-pbm">'+
    '<div class="hj-pbm-cab"><b>Resuelvo problemas</b><span class="hj-pbm-nivel">'+NIVELES_PB[nivel].marca+'</span><span class="hj-pbm-dato">Nombre: <i></i></span><span class="hj-pbm-dato corto">Fecha: <i></i></span></div>'+
    '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["RECORDAR", "COMPRENDER"])+' 1 y 2. Lee. Subraya los datos y rodea la pregunta.</p><p class="hj-pbm-texto">'+texto+'</p></div>'+
    '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["ANALIZAR"])+' 3 y 4. Escribe cada número en su sitio y pon <b>?</b> en lo que no sabes.</p><div class="hj-pb-diag hj-pbm-diag">'+diagPapelPB(r, nivel)+'</div></div>'+
    '<div class="hj-pbm-calc"><div class="hj-pbm-col"><div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["APLICAR"])+' 5. ¿Qué hago?</p><p class="hj-pb-ops"><span>+ sumo</span><span>− resto</span></p></div>'+
        '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["EVALUAR"])+' 8. Compruebo.</p><p class="hj-pb-si">SÍ &nbsp; NO &nbsp; Así: <span class="hj-pb-linea corta"></span></p></div></div>'+
      '<div class="hj-pb-caja hj-pb-calc"><p class="hj-pb-tit">'+bl(["APLICAR"])+' 6. Calculo.</p>'+calcPapelPB(r)+'</div></div>'+
    '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["APLICAR"])+' 7. Escribo la solución con una frase.</p><span class="hj-pb-linea"></span></div>'+
    '<div class="hj-pb-caja pb-reto"><p class="hj-pb-tit">'+bl(["CREAR"])+' ★ Reto: '+retoPapelPB(r, nivel)+'</p><span class="hj-pb-linea"></span></div></div>';
}
function fichaPapelPB(r, nivel, pagina, paginas){
  const tp = plantillaPB(r), texto = textoPB(r, t=> t.tipo === "dato" ? '<b>'+t.txt+'</b>' : t.txt);
  const bl = bloomPapelPB, diag = diagPapelPB(r, nivel), reto = retoPapelPB(r, nivel);
  const lineas = n => Array(n).fill('<span class="hj-pb-linea"></span>').join("");
  const mini = '<div class="hj-pb-mini">'+PASOS_PB.slice(1).map((s, i)=> '<span><i></i>'+(i + 1)+'. '+s.txt+'</span>').join("")+'</div>';
  return hojaPapel({titulo:"Resuelvo problemas", sub:"Sigue los 8 pasos de la checklist.", eti:NIVELES_PB[nivel].marca, pagina, paginas, datos:[["Nombre", "", 3], ["Fecha", "", 1]],
    cuerpo:'<div class="hj-pb">'+
      '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["RECORDAR", "COMPRENDER"])+' 1 y 2. Lee el problema. Subraya los datos y rodea la pregunta.</p><p class="hj-pb-texto">'+texto+'</p></div>'+
      '<div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["ANALIZAR"])+' 3 y 4. Representa el problema en el diagrama. Escribe cada número en su sitio y pon <b>?</b> en lo que no sabes.</p><div class="hj-pb-diag">'+diag+'</div>'+
        (nivel === "semilla" ? '<p class="hj-pb-pista">Pista: puedes construir el '+r.a+' con regletas: '+Math.floor(r.a / 10)+' naranjas y '+r.a % 10+' blancas.</p>' : '')+'</div>'+
      '<div class="hj-pb-dos"><div class="hj-pb-caja"><p class="hj-pb-tit">'+bl(["APLICAR"])+' 5. ¿Qué operación hago?</p><p class="hj-pb-ops vertical"><span>+ sumo</span><span>− resto</span></p></div>'+
        '<div class="hj-pb-caja hj-pb-calc"><p class="hj-pb-tit">'+bl(["APLICAR"])+' 6. Calculo.</p>'+calcPapelPB(r)+'</div></div>'+
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
    '<li>Cálculo: '+calcSolucionPB(r)+'</li>'+
    '<li>Solución: '+tp.sol.replace("#", x)+'</li>'+
    '<li>Comprobación: '+(r.juntar ? x+" − "+r.b+" = "+r.a : r.a+" + "+x+" = "+r.t)+' ✓ · Reto: '+(r.juntar ? r.t+" + "+tp.reto[1]+" = "+(r.t + tp.reto[1]) : nivel === "arbol" ? "ej. «"+tp.p1+": "+r.a+"; "+tp.p2+": "+x+". ¿Cuántos son en total?»" : "respuesta libre")+'.</li></ul></div>';
}
/* Dos fichas por cara: 4 fichas del nivel elegido en dos caras (para imprimir a doble cara) y el solucionario */
function imprimirDosPorCaraPB(){
  const n = nivelPB(), lista = listaPB(n), retos = Array.from({length:4}, ()=> Object.assign({}, delMazo("pb-"+n, lista)));
  const cara = (i, pagina) => hojaPapel({titulo:"Resuelvo problemas", sub:"Sigue los 8 pasos de la checklist. Dos fichas por cara: recorta por la línea.", eti:NIVELES_PB[n].marca, pagina, paginas:3,
    cuerpo:'<div class="hj-pbm-hoja">'+mediaFichaPB(retos[i], n)+'<div class="hj-pbm-corte" aria-hidden="true">✂</div>'+mediaFichaPB(retos[i + 1], n)+'</div>'});
  $("impresion").innerHTML = (cara(0, 1)+cara(2, 2)).replace(/<section class="hoja/g, '<section class="hoja hj-compacta')+
    hojaPapel({titulo:"Solucionario", sub:"Las cuatro fichas, en orden.", eti:"Para el docente", pagina:3, paginas:3, docente:true,
      cuerpo:'<div class="hj-compacta-sol">'+retos.map((r, i)=> solucionPB(r, n).replace('<p class="hj-pb-sol-tit">', '<p class="hj-pb-sol-tit">Ficha '+(i + 1)+' · ')).join("")+'</div>'});
  lanzarImpresion();
}
function imprimirProblemas(){
  if(PB.papel === "dos") return imprimirDosPorCaraPB();
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
