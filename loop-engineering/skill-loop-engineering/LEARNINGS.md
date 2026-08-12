# loop-engineering — LEARNINGS

Lecciones cosechadas de tasks reales. Cada entrada: fecha · origen · desviación · regla.

## 2026-07-17 · T-013 · SETUP crea el worktree antes de persistir las fases

Desviación real: el orquestador ejecutó `git worktree add` ANTES de commitear
exploration.md/plan.md en `tasks/active/T-XXX/`. El worktree nace del último
commit, así que el implementer no vio esos .md y tuvo que fiarse del prompt inline.
Regla: en SETUP, crear el worktree DESPUÉS de commitear las fases previas, o pasar
SIEMPRE las rutas absolutas del worktree PRINCIPAL para `tasks/active/T-XXX/` (los
.md de fase viven en el principal, no en el branch).
Validado 2026-07-17 · T-014: se commitearon las fases ANTES de crear el worktree;
el implementer vio spec+exploration+plan dentro del branch, cero desviaciones por
contexto. Regla confirmada.

## 2026-07-17 · T-014 · Presupuestar puerto de búsqueda caro dentro de la política R0

Patrón real: un módulo R0 consumía un puerto A* (`findPath` sobre grid grande) sin
techo de llamadas. Regla: presupuestar la búsqueda DENTRO de la política del dominio
(K candidatos preordenados por heurística barata + round-robin de 1 unidad/tick) y
verificar el presupuesto con un TEST que cuenta llamadas en el mock del puerto
(`it('no llama a findPath más de K veces por tick')`). Evita el cuello sin perfilar.

## 2026-07-17 · T-015 · EXPLORE debe verificar las premisas de DATOS, no solo firmas

Desviación real (único REDESIGN del proyecto): spec y plan asumieron que "la facción
del jugador posee regiones al arranque" verificando solo APIs/firmas en EXPLORE. El
artifact real (`provinces.generated.json`) repartía los owners entre otras facciones:
premisa falsa detectada recién en el gate de smoke → un ciclo perdido. Regla: EXPLORE
verifica también las premisas de DATOS que el diseño asume (contenido real de
artifacts/fixtures/seeds: rangos de ids, cardinalidades, distribución de owners), no
solo la existencia y firma de los puertos; un grep/lectura del artifact habría hecho
la decisión temprana. Patrón confirmado (positivo): el implementer PARÓ con gate rojo
y reportó "spec inviable" sin enmascarar ni improvisar → gate rojo por premisa falsa
= REDESIGN al planner, nunca fix silencioso del implementer.

## 2026-07-17 · T-020 · Un gate "viable" en EXPLORE debe estar EJECUTADO, no solo existir

Desviación real: EXPLORE reportó "`npm run typecheck` termina sin errores" (gate
viable), pero en implementación tsc 7.0.2 colgó >20 min consumiendo ~11 GB; el explorer
no lo corrió hasta exit code o lo hizo en condiciones distintas. Regla 1: cuando EXPLORE
valida un gate como "viable", debe haberlo EJECUTADO hasta exit code con timeout
explícito y reportar la duración; "existe el script" no es "el gate corre".
Regla 2 (patrón positivo a consagrar): gate que falla/cuelga en implementación → ANTES
de tocar nada, medir la LÍNEA BASE sin el diff (`git stash`) y aislar el patrón nuevo
por separado (tsconfig mínimo). En T-020 la baseline también colgaba y el patrón nuevo
typechequeaba en segundos → bloqueo ambiental. Si baseline también falla, es ambiental:
documentar con números, excluir el gate con anotación explícita y generar task de
seguimiento — nunca "arreglar" el gate relajándolo ni atribuir el fallo al diff propio.

## 2026-07-18 · T-023 · Introducir "daño proporcional a X decayente" rompe tests multi-tick

Desviación real: al escalar el daño por la fuerza ACTUAL del atacante (magnitud que
decae con el tiempo), el plan previó 1 test que rompía por reevaluar el ratio sobre un
valor ya decaído (`siege.test.js:201-229`, `tick(4)+tick(1)` fusionado en `tick(5)`),
pero el implementer encontró un 2º no previsto por la misma causa raíz (regen fuera de
combate, `tick(2)+tick(1)`→`tick(3)`). Ambos "parecían" el mismo escenario pero el
ratio se reevalúa en cada llamada. Regla (EXPLORE/PLAN): al introducir "comportamiento
proporcional a X" donde X decae en el tiempo, grep TODAS las llamadas a `tick(` (o el
paso temporal del módulo) en los tests afectados y clasificar cuáles son multi-tick
sobre el mismo engagement continuo — no solo el test que el spec menciona; cada
llamada extra sobre un valor ya decaído altera el número esperado aunque el setup luzca
idéntico.

## 2026-07-18 · T-023 · "Lazy value en closure" para no extender un puerto y evitar subir de Ring

Patrón real (positivo): `siege.ts` necesitaba una fuerza de referencia (máximo
observado por atacante) que no existía en el puerto exportado `SiegeDeps`. Extender el
puerto habría reclasificado la task a R1 (checkpoint humano). En vez de eso se reusó el
patrón "lazy value en closure" ya presente para `garrisons`/`getGarrisonInternal`: un
`Map<number,number>` interno (`maxStrengthSeen`) + helper `referenceStrength`, limpiado
en `purgeInvalid()`. Resultado: cero cambios de firma, task siguió R0 puro, sin
reclasificación. Regla: cuando necesites un valor de referencia que no existe en el
puerto y el módulo YA tiene ese patrón para otro campo, reúsalo antes que ampliar la
firma exportada — mantiene la task en el Ring más interno y evita el checkpoint de R1.
Nota de deuda anotada: `Math.max` en `referenceStrength` asume que la fuerza solo baja;
si se añade curación/regeneración, esa task debe revisar este punto.

## 2026-07-18 · T-024 · Estado de "ocupación" invisible entre sistemas hermanos R0

Bug real: `siege.ts` y `units.ts`/`faction-ai.ts` son módulos R0 puros e
independientes que colaboran sobre las MISMAS unidades pero no comparten estado.
`faction-ai.ts` decidía `isIdle()` mirando solo `isEngaged`/`isMoving`/`getOrder`
(todos de `units.ts`) e ignoraba que `siege.ts` tenía la unidad "ocupada"
sitiando (`isSieging`/Map `sieges`). Consecuencia: la IA trataba a la unidad
sitiando como libre y le daba una orden nueva (ataque/marcha) que abandonaba el
asedio en curso SIN cancelarlo — entrada fantasma permanente en `sieges`. El
jugador ya lo tenía resuelto (`main.ts:1304,1315` llaman `cancelSiege` antes de
atacar/mover); la IA no. Fix: exponer el estado del sistema B al puerto del
consumidor de más alto nivel (`isSieging` en `FactionAIOptions`), aceptando la
reclasificación a R1 en vez de un atajo que evitara tocar la firma.
Regla (EXPLORE/PLAN): cuando dos o más sistemas R0 comparten unidades/entidades
pero mantienen estados de "ocupación" independientes (engaged/moving/sieging/…),
auditar que el consumidor de más alto nivel (aquí la IA, que reasigna órdenes)
conozca TODOS los estados de ocupación relevantes, no solo los del sistema que
originó la feature; enumerar los estados de ocupación como premisa del diseño.
Frontera vs T-023 ("lazy value en closure para no subir de Ring"): NO contradice.
T-023 aplica cuando el valor pertenece al PROPIO sistema y ya existe el patrón
interno para reusarlo → quédate R0. T-024 es estado que pertenece a OTRO sistema y
que un consumidor externo debe conocer → expón el puerto y acepta R1; no fabriques
un cache-hack interno para esquivar el checkpoint cuando el dato es cross-system.

## 2026-07-18 · T-025 · Efecto sobre relación bidireccional: procesar por PAR único, no por declaración

Bug real: `applyAttrition(dt)` (`units.ts`) iteraba sobre cada unidad con
`attackOrders` activo y aplicaba daño a ambos lados. Cuando A→B y B→A declaraban
la orden mutuamente (caso plausible: dos ejércitos IA adyacentes que se eligen
como blanco), el MISMO enganche físico se procesaba dos veces —una por cada
declaración— y cada unidad recibía el doble de daño por tick (20 en vez de 10)
sin razón de diseño. Fix: deduplicar por clave canónica de par
(`` `${Math.min(a,b)}-${Math.max(a,b)}` `` en un `Set<string>`) antes de aplicar
el efecto, cambiando la unidad de trabajo de "por atacante/declaración" a "por
par único" (plan.md:23-24, spec AC-1: mutuo debe dar el MISMO resultado que orden
única). 0 ciclos, 322/322 tests.
Regla (EXPLORE/PLAN): cuando un efecto se calcula "por cada entidad que declaró X
hacia otra" sobre una relación potencialmente SIMÉTRICA/bidireccional donde CADA
lado puede declarar su orden independientemente, preguntar explícitamente si ambos
lados pueden declarar a la vez; si sí, el efecto debe procesarse por PAR único
(clave canónica ordenada), no por declaración, o se aplica dos veces al mismo
enganche físico. Test obligatorio: el caso "ambos lados declaran" debe dar el
mismo resultado que "un solo lado declara".
Frontera vs T-024: T-024 es estado de ocupación entre sistemas DISTINTOS (expón
puerto, sube a R1). T-025 es la granularidad de iteración de una relación dentro
de UN sistema (por par, no por declaración) → fix R0 puro, sin tocar firmas.
Frontera vs T-023: T-023 es sobre el eje temporal (proporcional a X que decae en
multi-tick); T-025 es sobre la doble contabilización de una arista simétrica en un
único tick — ejes ortogonales.

## 2026-07-18 · T-026 · Rol por EXCLUSIÓN (`!== A`) se rompe cuando el dominio pasa de 2 a N actores

Bug real: `createSiegeSystem().tick()` (`siege.ts`) atribuía "defensor" por
exclusión del atacante en dos puntos —desbordamiento de daño
(`.filter(u => u.factionId !== attackerFaction)`, spec línea ~176-179) y bloqueo
de captura (`.filter(u => u.factionId !== capturer.factionId)`, ~218-221)— en vez
de por pertenencia positiva al dueño real de la región (`u.factionId ===
deps.getOwner(regionId)`). Con solo 2 facciones (atacante/defensor) ambas
formulaciones coinciden; con el sandbox de 10 facciones (T-021) divergen: una
unidad bystander de una TERCERA facción parada en la capital recibía el
desbordamiento como defensora legítima y bloqueaba la captura aunque el dueño
real ya no tuviera defensores. Fix de 2 líneas, R0 puro, sin tocar firmas
(`getOwner` ya estaba en `SiegeDeps`). 0 ciclos, 324/324 tests. Los tests
discriminantes se confirmaron trazando el resultado bajo el código viejo (ambos
fallarían sin el fix).
Regla (EXPLORE/PLAN): cuando un predicado de dominio infiere "es el rol X"
mediante la NEGACIÓN de otro rol conocido (`!== conocido_A` para deducir "es el
otro"), preguntar si en runtime real pueden existir MÁS de 2 categorías (no solo
las 2 de los tests actuales). Si sí, exigir el predicado POSITIVO (`=== la
condición real que define el rol` — aquí "pertenece al dueño actual"), porque
toda tercera entidad bystander cae en el bucket equivocado. Test obligatorio:
introducir una entidad de una categoría neutral/tercera y verificar que NO recibe
el efecto reservado al rol ni lo bloquea.
Frontera vs T-024/T-025: ortogonal. T-024 es estado de ocupación invisible entre
sistemas DISTINTOS (cross-system → sube a R1). T-025 es la granularidad de
iteración de una relación simétrica dentro de UN sistema (por par, no por
declaración). T-026 es la ARIDAD de categorías (2 vs N) de un predicado de rol
dentro del MISMO sistema (negación-como-inferencia → pertenencia positiva). No
contradice ninguna regla previa.

## 2026-07-18 · T-027 · "Sin hallazgos" es un resultado legítimo del loop externo, no un fallo a esquivar

Desviación real: el loop externo (orquestador que escanea en busca de trabajo —
tasks a generar, mejoras a proponer) trató "no encuentro nada que hacer" como un
fracaso a evitar, con dos escapes tentadores: fabricar relleno para justificar la
corrida y BAJAR su propio umbral de confianza para colar un candidato marginal por
debajo de la barra. Regla (loop-engineering, freno): "sin hallazgos" es un pase
válido y exitoso — el orquestador PARA y pregunta al humano; nunca inventa relleno
ni relaja su umbral de confianza para forzar trabajo. Ampliar el scope de lo que
cuenta como "trabajo" es decisión del HUMANO, no del orquestador: un agente que
ensancha su propio mandato para no devolver vacío se sale de sus límites igual que
uno que reintenta infinitamente. Plegada al cuerpo de SKILL.md junto al freno de
MAX_ATTEMPTS ("Every loop needs a brake") + antídoto rápido. Aprobada por el humano
2026-07-18.
Validado 2026-07-18 · T-028: segunda racha "sin hallazgos" en la MISMA sesión; el
orquestador volvió a PARAR y preguntar (AskUserQuestion) en vez de fabricar relleno.
Esta vez el humano NO amplió a un bug pendiente conocido (como en T-027) sino que
pidió una FEATURE nueva (economía = regiones×tiempo → spawn de ejércitos). Confirma
que la regla generaliza más allá de su caso original: "ampliar el scope de trabajo es
decisión del humano" aplica igual cuando el humano abre un sistema nuevo adyacente, no
solo cuando retoma un bug conocido. Regla confirmada, sin cambios.

## 2026-07-18 · T-024 · CLOSE debe mover las carpetas de task con `git mv`, no `mv` de shell

Deuda de proceso del propio orquestador, detectada al cerrar T-024: el cierre de
T-023 movió `tasks/active/T-023/` → `tasks/done/T-023/` con `mv` de shell y solo
hizo `git add` de la carpeta DESTINO. La eliminación de `tasks/active/T-023/T-023.md`
quedó como "deleted" sin commitear en el working tree durante toda la sesión
siguiente, hasta que un `git stash push -u`/`pop` (aislando WIP de Codex antes de
mergear T-024) lo sacó a la luz. Regla (loop-engineering, paso CLOSE): al mover
`tasks/active/T-XXX/` → `tasks/done/T-XXX/`, usar SIEMPRE `git mv` (o `git add -A`
sobre AMBAS rutas, origen y destino) para que la eliminación quede registrada en el
mismo commit; nunca `mv` + `git add` solo del destino, que deja la ruta origen como
"deleted" fantasma en el índice.

## 2026-07-18 · T-028 · Función extraída arrastra un supuesto implícito válido en su call site original pero no en el nuevo — APROBADA 2026-07-18

Patrón de riesgo (documentado en T-028 como tradeoff aceptado, no bug):
`capitalCellForFaction` se extrajo de `seedInitialUnits` —que asume owner ESTÁTICO del
artifact (`provinceById`), correcto para el sembrado ÚNICO al arranque— y se reusó tal
cual para los spawns de economía EN RUNTIME, donde el owner puede haber cambiado por
conquistas. Consecuencia potencial: una facción que perdió su capital original pero
conquistó otras podría intentar spawnear en territorio que ya no le pertenece. Evidencia
concreta: T-028 lo anotó explícitamente en spec (T-028.md:135-141) y plan (plan.md:69-77
nota de alcance + Riesgo 1, línea 126) como mejora futura (parametrizar con un `getOwner`
inyectable), aceptado dentro del alcance porque el spec no exige "capital post-conquista".
No manifestó fallo (0 ciclos, 327/327), pero el riesgo es estructural.
Regla (EXPLORE/PLAN): al extraer una función para REUSARLA en un call site
nuevo, que la firma encaje NO basta — re-examinar si los SUPUESTOS implícitos que la
función heredó de su contexto original (aquí: "el owner que importa es el estático del
artifact, no el runtime") siguen siendo válidos en el nuevo contexto de uso. Si divergen:
hacer el supuesto explícito y parametrizar la dependencia que cambia (inyectarla), o
documentar la desviación como tradeoff consciente con task de seguimiento. Nunca reusar
en silencio bajo el "compila igual → se comporta igual".
Frontera vs entradas previas: ortogonal. T-023 (lazy value en closure) y T-024 (estado
de ocupación cross-system) tratan DÓNDE vive un estado; T-028 trata un SUPUESTO de
contexto temporal (estático-de-arranque vs runtime) que viaja PEGADO a una función al
moverla/reusarla en otro call site. No contradice ninguna regla previa.
Aprobada por el humano 2026-07-18. Plegada al cuerpo de SKILL.md como sección propia
("Reuse re-opens a component's assumptions", tras "The Quality Gate") + antídoto rápido;
colocada junto al gate porque su evidencia clave es que un gate en verde (0 ciclos,
327/327) NO revela el desajuste latente.

## 2026-07-18 · T-030 · Mock de valor constante no discrimina el conteo de invocaciones de un efecto estocástico/con side-effect — APROBADA 2026-07-18

Patrón de test real: al verificar un efecto ESTOCÁSTICO o con side-effect aplicado a
una relación COMPARTIDA, un mock que devuelve siempre el MISMO valor constante no
discrimina cuántas veces se invocó el efecto: 1 roll vs 2 rolls de un valor fijo dan el
MISMO resultado matemático (p. ej. daño = valor_fijo aplicado una o dos veces sobre el
mismo enganche cae en el mismo número esperado), así que un bug de doble invocación
pasa en verde. El test "compila y pasa" pero no gatea nada: es un soft gate disfrazado
de determinista. Conecta con T-025 (doble contabilización de una arista simétrica por
tick): justo el tipo de bug que un mock no discriminante deja colar, y con T-014
(verificar el presupuesto contando llamadas en el mock del puerto).
Regla (EXPLORE/PLAN + gate): cuando el efecto bajo prueba es estocástico o un
side-effect sobre una relación compartida, exigir que la aserción pueda distinguir el
comportamiento correcto del incorrecto: usar un mock con SECUENCIA VARIABLE (cada
llamada devuelve un valor distinto, de modo que una invocación extra mueve el
resultado) o una aserción EXPLÍCITA de call-count
(`expect(roll).toHaveBeenCalledTimes(1)`). Un mock de valor constante sobre este tipo
de efecto no es evidencia de que el conteo de invocaciones sea correcto.
Aprobada por el humano 2026-07-18. Plegada al cuerpo de SKILL.md dentro de "The Quality
Gate" (párrafo "A test only gates what it can discriminate", tras "The underlying
rule") + antídoto rápido; colocada en el gate porque el punto es que un test no
discriminante es un gate blando, no un caso de reuse.
Nota: en LEARNINGS.md no existía una entrada "pendiente" previa de T-030; se creó
directamente en estado aprobado al plegar la propuesta.

## 2026-07-18 · T-029 · EXPLORE debe verificar las premisas de COMPLEJIDAD del spec, no solo las de datos/firmas — APROBADA 2026-07-18

Patrón real (positivo, 0 ciclos): el spec de T-029 —escrito por el orquestador ANTES
de mirar el código— declaró explícitamente que truncar el path de persecución para
"detenerse a rango" era "la parte no trivial" y ordenó al PLAN diseñar cómo truncar
`findPath` hasta una celda a distancia `attackRange` (decisión abierta 2, T-029.md:35-42).
EXPLORE verificó esa premisa de COMPLEJIDAD en el código real y encontró que `tick()`
(`units.ts`) ya tenía un chequeo genérico post-`advanceMarches` que borra la marcha en
cuanto se cumple `isInEngageRange`: parametrizar esa función con un radio configurable
resolvió el rango a distancia SIN tocar `processPursuit`/`findPath` (T-029.md:79-86,
plan.md:8-10). El plan se invirtió por completo (mucho más simple) y se evitó construir
infraestructura de truncado de path que no hacía falta (over-engineering). Gates dobles:
339/339 tests, ring-guard OK, build OK, smoke 7/7.
Regla (EXPLORE): cuando un spec escrito ANTES de leer el código anticipa que "X es la
parte difícil/no trivial", EXPLORE debe verificar esa premisa de DIFICULTAD
explícitamente —buscar si un mecanismo existente ya generaliza el caso "difícil"— ANTES
de que el PLAN diseñe una solución nueva para él. Una premisa de complejidad no
verificada arrastra al PLAN a construir infraestructura que el sistema quizá ya resuelve
de otra forma. Salida esperada del EXPLORE: confirmar o refutar la dificultad anticipada
con `archivo:línea` del mecanismo que ya la cubre (o la ausencia de tal mecanismo).
Frontera vs T-015: ortogonal, NO contradice. T-015 es sobre premisas de DATOS reales
(cardinalidades, ids, distribución de owners en artifacts) que el diseño asume ciertas.
T-029 es sobre una premisa de COMPLEJIDAD/DIFICULTAD de una parte del diseño ("esto será
lo difícil de construir"). Ambas comparten la raíz "EXPLORE verifica los supuestos del
spec, no solo la existencia de puertos", pero sobre ejes distintos: qué datos hay (T-015)
vs cuánto trabajo nuevo hace falta de verdad (T-029).

## 2026-07-18 · T-031 · Revertir a propósito una decisión de diseño INVIERTE su test, no lo borra — APROBADA 2026-07-18

Patrón real: la task revertía deliberadamente una decisión de diseño anterior que
un test ya codificaba como aserción EXPLÍCITA. La tentación era borrar ese test
("ya no aplica"), pero borrarlo (a) tira el gate que ahora debe proteger la NUEVA
decisión y (b) borra el registro de que el cambio ocurrió. Regla: cuando el
propósito de una task es INVERTIR una decisión de diseño previa, no se borra el
test que la codificaba —se INVIERTE en el sitio (mismo escenario, aserción
opuesta) para que la suite ahora fije el comportamiento nuevo—; y si la garantía
vieja SIGUE siendo válida bajo alguna condición (p. ej. sobrevive como el DEFAULT
mientras lo nuevo es opt-in, o viceversa), añadir un TEST DE CONTRASTE que cubra
esa condición, dejando ambas ramas verificadas.
Frontera vs el anti-patrón del gate "no comentar/skipear el check que estorba":
COMPLEMENTARIOS, no contradictorios. Ambos se niegan a SILENCIAR un test para que
un diff pase. El anti-patrón esconde una aserción que el código TODAVÍA debe
cumplir; esta regla REESCRIBE una aserción porque el spec cambió a propósito lo
que debe cumplirse —la aserción sigue viva, solo se mueve su valor esperado. El
tell que los separa: una inversión legítima está AUTORIZADA por el spec y deja el
escenario aún aserido (con la expectativa opuesta); esquivar el gate saca el
escenario de la verificación por completo. Si un test estorba y el spec NO ordenó
cambiar el comportamiento que protege, no se toca.
Aprobada por el humano 2026-07-18. Plegada al cuerpo de SKILL.md dentro de "The
Quality Gate" (párrafo "Deliberately reverting a design decision inverts its test",
tras "A test only gates what it can discriminate") + antídoto rápido; colocada en
el gate y con la frontera explícita frente al shortcut de "comentar/skipear el
check" (misma lista de shortcuts prohibidos) porque el punto es distinguir
silenciar un test (prohibido) de reescribir su aserción por orden del spec
(legítimo).
Aprobada por el humano 2026-07-18. Plegada al cuerpo de SKILL.md como sección propia
("EXPLORE verifies the spec's premises, not just the ports", tras "Reuse re-opens a
component's assumptions") + antídoto rápido. La sección da hogar en el cuerpo también
a la premisa de DATOS de T-015 (que hasta ahora solo vivía en LEARNINGS), presentando
ambas como dos caras del mismo principio de EXPLORE con la frontera explícita: datos =
qué ya existe; complejidad = cuánto trabajo nuevo hace falta.

## 2026-07-18 · T-032 · Un presupuesto acotado se expresa como cota (`O(K)`), no como un "nunca" absoluto — APROBADA 2026-07-18

Patrón de redacción de spec: al acotar un recurso caro (llamadas a un puerto costoso,
allocations, pasadas sobre un pool grande), la spec expresaba el límite como una
prohibición absoluta ("nunca ambos X en la misma pasada") en vez de como una cota
("acotado O(K) por pool/pasada"). El "nunca" absoluto es frágil por dos motivos: (a)
sobre-restringe el diseño —la intención real era el presupuesto, no una prohibición
categórica— y (b) puede CONTRADECIR EN SILENCIO un fallback obligatorio que la MISMA
spec ya declara: si en una pasada degenerada el fallback exigido sí emite ambos X, el
"nunca" y el fallback quedan en conflicto directo y el implementer recibe un contrato
insatisfacible. Conecta con T-014 (presupuestar el puerto caro con K candidatos +
round-robin y verificar con un test que cuenta llamadas): la forma "K + cota contable"
es preferible al "nunca" categórico.
Regla (PLAN/redacción de spec): (1) expresar la cota de presupuesto como `O(K)` por
pool/pasada —una cota que el implementer puede dimensionar y un test puede contar—, no
como "nunca X"; (2) cruzar todo "nunca X" absoluto contra los fallbacks obligatorios
declarados en OTRA parte de la MISMA spec: si un fallback requerido puede producir X, el
"nunca" está mal y debe convertirse en cota. Es CONSISTENCIA INTERNA de la spec (las dos
cláusulas de UNA misma spec no deben contradecirse), distinta del trabajo de EXPLORE de
verificar premisas contra el código/datos reales (T-015/T-029): aquí no se valida contra
el sistema, se valida la spec contra sí misma.
Frontera vs T-015/T-029: ortogonal, no contradice. T-015 (datos reales) y T-029
(complejidad real) verifican supuestos del spec CONTRA el sistema externo; T-032 verifica
que el spec no se contradiga a SÍ MISMO (cota vs fallback en el mismo documento). Comparte
con T-014 la preferencia por una cota contable sobre una prohibición categórica.
Aprobada por el humano 2026-07-18. Plegada al cuerpo de SKILL.md como sección propia
("A bounded budget is a bound, not an absolute 'never'", tras "EXPLORE verifies the
spec's premises") + antídoto rápido; colocada en el clúster de calidad de spec, junto a
las reglas de premisas de T-015/T-029 y referenciando el patrón K=5+round-robin de T-014.
Nota: no existía entrada "pendiente" previa de T-032 en LEARNINGS; se creó directamente en
estado aprobado al plegar la propuesta.

## 2026-07-18 · T-033 · Un camino nuevo que converge en la misma primitiva NO hereda el invariante de un camino HERMANO — APROBADA 2026-07-18

Patrón real: un CAMINO de decisión nuevo desembocaba en la misma primitiva de bajo
nivel que un camino existente (aquí: `orderMove`), pero un invariante ("frenar en
rango") vivía SOLO en un camino HERMANO con distinta intención (el de ataque, que
tiene `orderAttack`/`attackOrders`). El camino nuevo reusó `orderMove` con otra
intención y NO obtuvo ese frenado gratis: el invariante nunca fue propiedad de
`orderMove`, sino de la intención del hermano de ataque. Una primitiva compartida es
un MECANISMO compartido, no un CONTRATO compartido.
Regla (EXPLORE/PLAN/review): cuando un camino de decisión nuevo converge en la misma
primitiva de bajo nivel que uno existente, verificar EXPLÍCITAMENTE por cada camino
qué invariantes le aplican; no asumir "termina en la misma función → se comporta
igual". El invariante pertenece a la intención del hermano, no a la primitiva que
ambos invocan.
Frontera vs T-028: NO contradice. T-028 es sobre el contexto heredado de UN
componente reusado (una función que arrastra un supuesto implícito de su call site
original al nuevo). T-033 es sobre invariantes DISTRIBUIDOS entre caminos HERMANOS
que comparten una primitiva: no se extrajo ni movió nada; dos caminos independientes
convergen en la misma llamada y uno asume erróneamente que hereda la garantía del otro.
Aprobada por el humano 2026-07-18. Plegada al cuerpo de SKILL.md como sección propia
("A shared primitive doesn't carry a sibling path's invariant", tras "Reuse re-opens
a component's assumptions") + antídoto rápido; colocada junto a la regla de reuse
(T-028) con la frontera explícita porque ambas tratan herencia indebida de
comportamiento pero por vías distintas (componente movido vs caminos hermanos).
Validado 2026-07-19 · T-034 (fix, R0+R2, 0 ciclos): MISMA causa raíz manifestada
de forma MÚLTIPLE dentro de la misma feature (T-031, asedio a distancia). El mismo
patrón "camino que converge en `orderMove` sin heredar el frenado-en-rango del
hermano de ataque" apareció en DOS sitios más además del de T-033: (a) marcha de la
IA hacia una capital (`faction-ai.ts`, rama de capitales de `tryMarch`) y (b) flujo
de clic del jugador para ordenar asedio (`main.ts:1192-1197`, `onRightClick`) — ambos
con `attackRange:3` caminaban hasta la celda EXACTA de la capital (dist final 0)
pese a estar en rango de asedio real a distancia 3. Fix: reusar la técnica de truncado
de T-033 contra la posición de la capital en cada camino. Gates dobles: 350/350 tests
(incluye integración que replica el flujo real del jugador, diffeado carácter a
carácter contra `main.ts`), ring-guard OK, build OK, smoke 7/7. Regla confirmada sin
cambios — no se acuña regla nueva (ver nota abajo).
Nota de curación (skill-bloat): T-034 sugería una posible regla nueva ("al introducir
un rango configurable que toca MÚLTIPLES entry points, mapear TODOS los call sites de
la primitiva de movimiento de esa mecánica de una vez, no descubrirlos uno a uno vía
bug reports sucesivos"). Decisión: NO acuñar entrada nueva. Ese matiz de completitud ya
está cubierto por la INTERSECCIÓN de dos reglas vigentes: T-033 ("verificar el
invariante explícitamente POR cada camino") + T-023 ("grep TODAS las llamadas a la
primitiva afectada, no solo la que el spec menciona"). La multiplicidad de T-034 es
evidencia de que ese par de reglas debe aplicarse de forma PROACTIVA (auditar todos los
call sites al introducir el rango) en vez de reactiva; se anexa como evidencia aquí, no
como regla independiente. Señal sobre volumen.

## 2026-07-18 · T-033 · Diagnosticar un bug reportado jugando con una simulación descartable ANTES de crear la task — APROBADA 2026-07-18

Patrón de proceso (positivo): un bug reportado JUGANDO (reporte de runtime/gameplay,
no un test en rojo) es un síntoma, no un diagnóstico. En vez de adivinar la causa o
crear una task especulativa, se diagnosticó reproduciéndolo con una SIMULACIÓN
DESCARTABLE del módulo puro —corrida FUERA del pipeline, SIN worktree, NUNCA
commiteada— para descartar hipótesis antes de especular. Abrir una task sobre una
causa adivinada gasta un ciclo entero del pipeline (spec → EXPLORE → PLAN → …) en un
diseño que puede apuntar al mecanismo equivocado; la sim descartable fija qué módulo y
qué invariante fallan de verdad, de modo que la spec siguiente se apoya en un HECHO
reproducido, no en una corazonada. La sim se descarta tras cumplir su función: es una
sonda de diagnóstico, no un artefacto de la task.
Regla (orquestador/creational loop): antes de crear una task de fix desde un bug
reportado jugando, diagnosticar con una simulación descartable del módulo puro (fuera
del pipeline, sin worktree, nunca commiteada) para descartar hipótesis — en vez de
adivinar la causa o crear una task especulativa.
Frontera vs T-020: distinta FASE. T-020 aísla la causa DURANTE la implementación
(medir la línea base con `git stash` cuando ya existen worktree y diff). T-033 es
diagnóstico PRE-task: ANTES de que exista spec o worktree, para decidir si y cómo
crear la task.
Aprobada por el humano 2026-07-18. Plegada al cuerpo de SKILL.md como sección propia
("Diagnose a reported bug with a throwaway sim before you spec it", antes de "The merge
stays with the human", en el clúster del proceso del orquestador/creational loop) +
antídoto rápido; colocada ahí con la frontera explícita frente a T-020 (stash durante
implementación) porque el punto es la fase PRE-task.
Nota: no existía entrada "pendiente" previa de T-033 en LEARNINGS; ambas se crearon
directamente en estado aprobado al plegar las propuestas.

## 2026-07-19 · T-035 · Tras reproducir el hallazgo, clasificar BUG confirmado vs decisión de diseño abierta ANTES de especificar — APROBADA 2026-07-19

Refinamiento de la regla de diagnóstico de T-033 ("Diagnose a reported bug with a
throwaway sim before you spec it"). Reproducir el hallazgo con la sim descartable fija
QUÉ hace el código, no QUÉ debería hacer; por eso, una vez reproducido, hay que
clasificar el hallazgo antes de escribir la spec:
- (a) BUG confirmado: viola una garantía que el sistema YA prometía (invariante
  especificado, contrato documentado, aserción viva). El "debería" ya existe → se
  especifica el fix DIRECTO, sin nueva autorización: la promesa se hizo antes.
- (b) Decisión de diseño ABIERTA: el comportamiento es SORPRENDENTE pero NO rompe
  ninguna garantía prometida; declararlo "incorrecto" implica AUTORAR una promesa
  nueva que el sistema nunca hizo. Esa autoría es del HUMANO → PREGUNTAR antes de
  especificar (qué comportamiento se pretende) y solo entonces convertir la respuesta
  en task. Escribir la spec primero convierte en silencio una preferencia propia en
  garantía del sistema.
El tell: señalar la promesa concreta que el hallazgo rompe. Si se puede citar una
(invariante/contrato/aserción viva) → (a), se arregla. Si llamarlo bug exige INVENTAR
la garantía que supuestamente viola → (b): el scope de lo "correcto" se acaba de
ensanchar, y ensanchar el mandato es decisión del humano, no del diagnosticador.
Frontera vs T-027: relacionada pero distinta. T-027 es el loop que NO encuentra
trabajo y no debe fabricar relleno ni bajar su barra para inventarlo; T-035 (b) es el
loop que SÍ reprodujo un hallazgo real pero no debe AUTORAR una garantía nueva para
justificar llamarlo bug — misma disciplina de fondo (no ensanchar el propio mandato),
aplicada a la autoría de una promesa en vez de a la existencia de trabajo.
Frontera vs T-020: sin cambios — T-020 aísla la causa DURANTE implementación; T-033/
T-035 son diagnóstico PRE-task.
Aprobada por el humano 2026-07-19. Plegada dentro de la sección existente "Diagnose a
reported bug with a throwaway sim before you spec it" (NO sección nueva: es un
refinamiento) tras el párrafo de evidencia de T-033, con su frontera explícita frente
a T-027 + antídoto rápido actualizado. No existía entrada "pendiente" previa de T-035;
se creó directamente en estado aprobado al plegar la propuesta.

## 2026-07-22 · T-122 · El worktree nace sin `node_modules`: un gate que depende de una dependencia ausente falla por ENTORNO, no por código — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-122, Ring 0, 0 ciclos FIX, APPROVE a la primera): `git worktree
add .worktrees/T-XXX` NO copia ni enlaza `node_modules` (el worktree comparte `.git`,
no el árbol de trabajo instalado). Los tests de Vitest SÍ corrían (resolución de
`vitest` desde el repo padre), pero el gate de cobertura falló con `MISSING DEPENDENCY
@vitest/coverage-v8` — un paquete presente en el repo principal y ausente en el
worktree. El orquestador diagnosticó correctamente el fallo como AMBIENTAL: lo anotó
como cobertura legado/entorno (cierre T-122.md:86-87,100-101), sin ocultarlo ni
atribuirlo al diff propio. Esto CONFIRMA la Regla 2 de T-020 ("gate que falla en
implementación → aislar; si el fallo no viene del diff, es ambiental: documentar, no
atribuir al código propio"). El incremento nuevo sobre T-020 es la CAUSA RAÍZ concreta
y su remedio de SETUP, no un diagnóstico caso a caso.
Delta propuesto (SETUP, dev-loop-system.md §4 paso 0 / subagents-and-worktrees.md
"Worktree isolation"): tras `git worktree add`, PROVISIONAR las dependencias en el
worktree antes de correr gates que dependan de binarios/plugins locales (`npm install`
en el worktree, o enlazar/compartir `node_modules` del principal). Un gate que exige
una dependencia ausente por no haberla instalado en el worktree es un FAIL de ENTORNO,
no de código, y no debe contar como ciclo FIX ni bloquear el cierre por sí mismo.
CONFLICTO A ELEVAR (hard rule 2): el candidato adicional "que el verifier DISTINGA FAIL
de entorno vs FAIL de código" choca con el contrato vigente del verifier
(dev-loop-system.md §3: "Binary, no judgment… A missing command is a FAIL";
anti-patrón 6). Darle criterio para reclasificar un FAIL erosiona su binariedad. Ambas
evidencias al humano: (a) T-122 muestra un FAIL de entorno real que un verifier binario
marcaría como rojo legítimo; (b) el diseño quiere el verifier SIN juicio. Resolución
recomendada: arreglar la CAUSA en SETUP (provisionar deps) para que el verifier siga
binario y no tenga que juzgar — no darle criterio. Pendiente de decisión humana.
Validado 2026-07-22 · T-123 (Ring 0/1, merged): el SETUP provisionó `node_modules` en el
worktree y el gate de cobertura corrió limpio (branches medidas de verdad — de hecho
atrapó un FAIL real de código, ver entrada T-123 desempate, no un FAIL de entorno). Aplicar
el remedio de SETUP hizo que el verifier siguiera binario. Confirma la resolución recomendada
(arreglar la CAUSA en SETUP, no dar criterio al verifier); sin cambios al delta pendiente.
Validado 2026-07-22 · T-124 (R0, merged) — 3ª ocurrencia: el SETUP volvió a provisionar
`node_modules` en el worktree y el gate de cobertura corrió limpio (units.ts líneas
95.42 %/funcs 100 %; el único FAIL fue de código —comparadores de sort—, no de entorno).
Tres tasks consecutivas (T-122 causa, T-123/T-124 validación) con el remedio de SETUP
aplicado y el verifier binario intacto. Sin cambios al delta pendiente.
Validado 2026-07-22 · T-125 (R1, 0 ciclos FIX, merged) — 4ª ocurrencia limpia: el SETUP
provisionó `node_modules` en el worktree y el gate de cobertura corrió limpio
(faction-ai.ts líneas 99.58 %/branches 90.57 %, ambos sobre umbral; sin FAIL de entorno).
Sin cambios al delta pendiente.
Nota EXPLORE (no es regla nueva): T-122 EXPLORE refutó la premisa P2 del spec
(`baseDamage` en el catálogo de abilities; en realidad el patrón es una constante
`*_BASE_DAMAGE` por módulo — exploration.md:10) ANTES de PLAN. CONFIRMA la regla vigente
"EXPLORE verifies the spec's premises, not just the ports" (T-015/T-029): premisa de
DATOS/firma verificada temprano → cero ciclos. Se anexa como evidencia, no como entrada
independiente.

## 2026-07-19 · T-036 · Dar memoria persistente a un componente que antes recalculaba desde cero reabre el ciclo de vida de su estado — APROBADA 2026-07-19

Patrón real: al dar MEMORIA PERSISTENTE a un sistema que hasta ahora RECALCULABA todo
desde cero en cada pasada, aparece una clase de estado que antes no existía: entradas
que SOBREVIVEN a la cosa que describían (huérfanas/stale). Un cálculo desde cero no
puede acumular fugas —reconstruía limpio cada pasada—; uno persistido ACUMULA. La
tentación es asumir que las huérfanas "se limpian solas". Regla: ANTES de asumir la
auto-limpieza, AUDITAR si una entrada huérfana puede hacer daño (ser leída como viva,
colisionar con una entidad nueva, bloquear una acción, doble-contar) y anclar esa
seguridad a una GARANTÍA CONCRETA —no a una esperanza—: p. ej. "los ids nunca se
reciclan" (así un id stale nunca se confunde con uno fresco) o un purge explícito
atado a la muerte de la entidad. Si no existe tal garantía, la huérfana es un bug
latente: exponerlo y o bien añadir el purge o bien documentar la garantía de la que
depende el diseño. Nunca razonar "el código viejo recalculaba, así que esto va bien":
el código viejo no tenía memoria que corromper.
Conecta con T-024 (la "entrada fantasma permanente en `sieges`" fue exactamente una
huérfana de estado persistido que nadie purgaba): el mismo tipo de riesgo que esta
regla obliga a auditar al introducir persistencia.
Frontera vs T-028: misma disciplina, disparador distinto. T-028 es una FUNCIÓN REUSADA
que arrastra un supuesto implícito de su call site original al nuevo. T-036 es
introducir una CAPACIDAD NUEVA (persistencia) en un componente existente, lo que reabre
un supuesto que el diseño desde-cero nunca tuvo que hacer: el CICLO DE VIDA de su propio
estado (limpieza de huérfanas). Ambas: añadir/mover algo a un componente existente
reabre sus supuestos implícitos; aquí el supuesto es la limpieza de huérfanas, no el
contexto heredado. No contradice ninguna regla previa.
Aprobada por el humano 2026-07-19. Plegada al cuerpo de SKILL.md como sección propia
("Giving memory to a from-scratch component re-opens the state lifecycle", en el clúster
de reuse, tras "A shared primitive doesn't carry a sibling path's invariant" y antes de
"EXPLORE verifies the spec's premises") + antídoto rápido, con la frontera explícita
frente a T-028. Corrección de ruta: la propuesta pendiente se había escrito por error en
`.agents/skills/evolving-empire-map/references/learnings.md` (skill equivocada: esa es de
generación de mapas/terreno/provincias, no de lógica de juego); esta entrada y el pliegue
van a la skill correcta (`loop-engineering`). No existía entrada "pendiente" previa de
T-036 en este LEARNINGS; se creó directamente en estado aprobado al plegar la propuesta.

## 2026-07-22 · T-123 · Al persistir los .md de fase, las partes que son CONTRATO para un agente posterior se copian LITERALES, nunca se resumen — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-123): el orquestador persistió `plan.md` CONDENSANDO la salida del
planner y omitió los títulos EXACTOS de los tests del Paso A. El implementer (impl1-T123)
se bloqueó y preguntó ("los títulos exactos NO están en plan.md"); hubo que EDITAR plan.md
después para reponerlos (por eso `plan.md:15-27` hoy sí lista los 12 títulos literales).
Coste: un round-trip evitable. Evidencia: mensajes de impl1-T123 + el edit posterior de
plan.md que repuso lo omitido.
Delta propuesto (paso PERSIST de las fases): al persistir los .md de fase en
`tasks/active/T-XXX/`, las partes que funcionan como CONTRATO EJECUTABLE para un agente
posterior —títulos exactos de tests, firmas de funciones, valores esperados, nombres de
archivo— se COPIAN LITERALES del artefacto del planner/explorer; nunca se resumen ni
parafrasean. Resumir es legítimo para el RAZONAMIENTO/justificación; prohibido para el
contrato que otro agente debe reproducir carácter a carácter. Tell: si un agente posterior
tendría que ADIVINAR o preguntar el valor exacto, es contrato y va literal.
Frontera vs T-013: complementaria, no duplica. T-013 asegura que el implementer VEA los .md
de fase (commitearlos antes del worktree / pasar rutas del principal); este delta asegura
que lo que VE sea el contrato literal y no un resumen que le falta el dato ejecutable.
Pendiente de decisión humana.
Validado 2026-07-23 · T-128 (R0, 0 ciclos FIX, APPROVE a la primera): plan.md §B persistió
los 11 `it()` LITERALES (títulos exactos, escenarios con ids/celdas concretas, call-counts
exactos como `spy.mock.calls[12][0]` y valores esperados). El implementer los reprodujo
carácter a carácter y salió verde a la primera (implementation.md:19-20, "los 11 `it()`
literales de plan.md §B"). Confirma que copiar el contrato ejecutable literal (no resumirlo)
elimina el round-trip de aclaración. Refuerza también el clúster de calidad de test T-030/
T-014: los espías `vi.fn(realFindPath)` DISCRIMINAN (cuentan llamadas exactas Y delegan al
real), justo el tipo de aserción de call-count que un mock constante no daría. Sin cambios
al delta pendiente; segunda evidencia positiva de que contratos literales + espías
discriminantes producen ciclos de 0 FIX.

## 2026-07-22 · T-123 · Un criterio determinista REPLICADO exige su test discriminante en cada réplica — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-123): el desempate "empate → menor id" estaba testeado en
`findAttackTarget` (selección por moral) pero se REPLICÓ en el sort de candidatos de
`tryCharge` SIN test propio → único FAIL de verify (branches 89.7 %, bajo umbral). El gate
de cobertura atrapó la rama del desempate no ejercida en la réplica.
Delta propuesto (EXPLORE/PLAN + gate): cuando un criterio DETERMINISTA (desempate, orden
total, prioridad) se REPLICA en un segundo call site, su test discriminante debe replicarse
CON él; copiar el criterio sin copiar el test deja una rama sin cubrir. Conecta con T-030
(un test solo gatea lo que puede DISCRIMINAR: el desempate necesita dos candidatos
empatados que fuercen la rama) y con la cota contable de T-014.
DECISIÓN PEDIDA AL HUMANO (hard rule 2, new-vs-evidence): ¿entrada nueva o evidencia
adicional bajo T-033? Frontera: T-033 es dos caminos que CONVERGEN en la misma primitiva y
uno asume HEREDAR el invariante del hermano (nada se copió). T-123 es un criterio
DELIBERADAMENTE COPIADO en dos sitios donde el TEST no viajó con la copia. Recomendación:
entrada NUEVA en el clúster de calidad de test (T-030/T-014), no bajo T-033 (herencia de
comportamiento), porque el eje es "réplica de lógica ⇒ réplica de su gate", no "herencia
indebida por primitiva compartida".
Pendiente de decisión humana.
2ª ocurrencia — refuerza el plegado · 2026-07-22 · T-124 (R0, 1 ciclo FIX, luego merged):
mismo clúster. El único FAIL de verify fue que los comparadores de sort de `getState`
(`units.ts:1428` sort de moral, `units.ts:1430` sort de `routingIds`) NUNCA se ejecutaron
porque ningún test tenía ≥2 unidades routing ni ≥2 morales degradadas → rama de comparación
sin cubrir (branches bajo umbral); el FIX añadió un test con cardinalidad ≥2. El cierre lo
etiqueta "misma clase que el FIX de T-123" (T-124.md:82-83). Segunda ocurrencia en dos
tasks CONSECUTIVAS del mismo clúster de calidad de test. Generalización fina que emerge de
juntar las dos: los comparadores/desempates SOLO se ejecutan con ≥2 elementos, así que todo
test de EMISIÓN ORDENADA (sort/desempate/orden total) necesita un fixture de cardinalidad
≥2 o su rama de comparación queda muerta. Matiz honesto: T-123 es réplica de lógica sin
réplica del test; T-124 es un comparador único nunca alcanzado por cardinalidad <2 — ambos
caen en "el gate solo cubre la rama de orden si el fixture tiene ≥2 elementos que la
fuercen" (raíz T-030: un test solo gatea lo que puede discriminar). Refuerza plegar como
entrada nueva del clúster de calidad de test con la generalización de cardinalidad ≥2
incluida. Pendiente de decisión humana.
3ª ocurrencia — signo INVERTIDO (prevención, no diagnóstico) · 2026-07-22 · T-125 (R1, 0
ciclos FIX, merged): la regla se aplicó PROACTIVAMENTE desde el diseño. El plan exigió
fixtures de cardinalidad ≥2 en cada desempate (plan.md:25,28 tests "≥2 candidatos y empate
→ menor id" para blast y "empate a distancia entre ≥2 hostiles → menor id" para volley;
Riesgo 4 del reviewer, plan.md:58: "fixtures cardinalidad ≥2 (T-123/T-124)") y el
orquestador lo marcó obligatorio en el prompt del planner. Resultado: 0 ciclos FIX con
branches 90.57 % a la primera — PRIMERA task del loop sin FIX de cobertura (cierre
T-125.md:93-95: "primera task del loop con cobertura limpia a la primera… el aprendizaje de
cardinalidad ≥2 en desempates, T-123/T-124, se aplicó desde el diseño"). Las dos primeras
ocurrencias fueron el gate DIAGNOSTICANDO la rama muerta a posteriori (FAIL → FIX); esta es
la regla PREVINIÉNDOLA en el diseño (fixtures ≥2 escritos antes de implementar → nunca hubo
rama sin cubrir). Evidencia de que la regla previene, no solo diagnostica — refuerza el
plegado como entrada nueva del clúster de calidad de test. Pendiente de decisión humana.

## 2026-07-22 · T-126 · El verifier debe correr el gate DE CONFIGURACIÓN del repo, no una reconstrucción ad-hoc scoped a la task — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-126, Ring 0, 0 ciclos FIX, APPROVE a la primera): el proyecto tiene un
gate per-file de cobertura CONFIGURADO en `vite.config.ts` (umbrales por archivo,
introducido en T-054), pero los verifiers de T-122..T-125 midieron cobertura con un
`--coverage.include` AD-HOC scoped al archivo de la task (ver evidencia en la entrada
T-122: "units.ts líneas 95.42 %", "faction-ai.ts branches 90.57 %" — todas mediciones
estrechadas al módulo tocado). En T-126, al añadir `facing.ts` al `include` y correr por
primera vez el gate GLOBAL configurado (`npx vitest run --coverage`), afloraron DOS
roturas pre-existentes que ningún verifier previo reclamó: (1) `units.ts` branches
87.36 % < 90 (deuda acumulada desde T-122, que cada task anotó como "legado" sin que el
gate real la gateara) y (2) `cities.test.js` "determinismo" falla SOLO bajo instrumentación
de coverage (flake pre-existente, pasa sin coverage). Verificado idéntico en main limpio
(no es regresión de T-126). Evidencia: T-126.md:100-107 ("Hallazgo de verify"); review.md
línea 14 (SHOULD del reviewer: `facing.ts` añadido a `coverage.include`, "morale.ts/
charge.ts tampoco están en la lista").
Delta propuesto (contrato del verifier, paso VERIFY): el verifier ejecuta el gate DE
CONFIGURACIÓN del repo —el comando completo que el proyecto define (aquí
`npx vitest run --coverage` con los umbrales de `vite.config.ts`)—, NO una reconstrucción
ad-hoc scoped al archivo de la task. Estrechar la medición al módulo tocado convierte un
gate DURO configurado en uno BLANDO por omisión: mide solo lo que la task añadió y nunca
reclama la deuda global que el gate configurado sí protege. Modo de fallo nuevo (gate duro
existente + medición paralela más estrecha = gate efectivamente blando). Un scope ad-hoc
solo es admisible como COMPLEMENTO (foco extra en el diff), nunca como SUSTITUTO del gate
configurado.
Frontera vs T-020 ("un gate viable debe estar EJECUTADO, no solo existir"): complementaria,
no duplica. T-020 es un gate que EXISTE como script pero no se corrió hasta exit code;
T-126 es un gate configurado que SÍ se corre pero SUSTITUIDO por una medición paralela más
estrecha que lo vacía de contenido. Ambas comparten la raíz "un gate solo gatea si se
ejecuta DE VERDAD"; el eje nuevo es que ejecutar una VERSIÓN RECORTADA del gate no cuenta
como ejecutarlo. Conecta con la regla "soft gates" de SKILL.md (un gate blando por omisión)
y con T-122 (cuyas mediciones ad-hoc son justamente el patrón que aquí se identifica como
causa de la pudrición silenciosa). Semilla operativa registrada en el cierre: task
siguiente para restaurar el gate global (cerrar branches legado de units.ts + diagnosticar
el flake de cities.test.js + añadir morale/charge/volley/artillery al `include`).
Pendiente de decisión humana.
Validado por CONSECUENCIA · 2026-07-22 · T-127 (fix, R3, 1 ciclo FIX, merged): la task
que restaura el gate global (la "semilla operativa" de T-126) confirma la regla por sus
efectos — correr el gate DE CONFIGURACIÓN completo (`npx vitest run --coverage`, no un
`--coverage.include` ad-hoc) destapó y RESOLVIÓ las dos deudas pre-existentes que la
medición estrechada había ocultado task tras task: units.ts branches 87.36 → 98.07 % y el
"flake" de cities (que resultó ser un TIMEOUT, no no-determinismo — ver entrada T-127 abajo).
Evidencia: cierre T-127.md:82-102 (gate global exit 0 ×3, deudas cerradas). El arco
T-126 (identifica la pudrición) → T-127 (restaura el gate y las deudas afloran/se cierran)
es la demostración empírica del daño que causa sustituir el gate configurado por una
medición paralela más estrecha. Sin cambios al delta pendiente; refuerza su aprobación.

## 2026-07-22 · T-127 · "No reproduce" ≠ "no existe": cuantifica el negativo y lee el MENSAJE de fallo original antes de hipotetizar — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-127, fix, R3, 1 ciclo FIX, merged): un "flake" de `cities.test.js`
(determinismo falla solo bajo instrumentación de coverage) se diagnosticó en EXPLORE como
"transitorio del entorno" con evidencia negativa fuerte — 8 reintentos verdes con
`--coverage`, 3 corridas de suite completa, un script vite-node con 1800+ llamadas a
`computeCapitalSites` sobre el grid real, 0 divergencias, y un análisis estático que
descartó las 5 hipótesis de no-determinismo (keys ordenadas, arrays nuevos por llamada,
grid solo-lectura, sin timing, sin random) — ver `exploration.md:4-6`. El fallo REPRODUJO
igual en la corrida ~nº 12 del orquestador. El root cause era una 6ª hipótesis NO listada:
`Test timed out in 5000ms` — la doble BFS de `computeCapitalSites` sobre el grid 1024
excede el timeout por defecto de vitest bajo instrumentación v8 según carga de máquina; la
ASERCIÓN de determinismo nunca falló (cierre T-127.md:95-102). Dos fallos de método
concretos: (a) el mensaje de fallo ORIGINAL de T-126 ("Test timed out in 5000ms") ya
estaba en la salida y nadie lo citó — todos asumieron "aserción de determinismo rota" y
hipotetizaron sobre no-determinismo, un modo de fallo que el mensaje literal ya
descartaba; (b) un negativo de N reintentos solo ACOTA la probabilidad del fallo, no cierra
el caso. Lo que salvó la task fue el AC de re-verificación como red (AC1: comando literal
×3), que mantuvo la exigencia de reproducir aun con el diagnóstico "transitorio" en mano.
Delta propuesto (diagnóstico de flakes, EXPLORE + orquestador): (1) al diagnosticar un
flake, LEER Y CITAR el mensaje de fallo ORIGINAL antes de enumerar hipótesis — el modo de
fallo real (timeout vs aserción vs excepción) suele estar escrito literal en la salida que
lo reportó, y filtra hipótesis enteras (un "timed out" NO es una aserción de determinismo
rota); (2) tratar un negativo de N reintentos como COTA de probabilidad, no como cierre:
dejar SIEMPRE el AC de re-verificación (comando literal ×N) como red aunque el diagnóstico
concluya "transitorio". "No reproduce en N corridas" ≠ "no existe".
Frontera vs T-033/T-035 ("Diagnose a reported bug with a throwaway sim before you spec
it"): complementaria, no duplica. T-033 dice diagnosticar reproduciendo con una sim
descartable ANTES de especificar; T-127 refina QUÉ debe reproducir esa sim — el MISMO MODO
DE FALLO reportado (aquí: el timeout bajo instrumentación), no solo ejercitar la función
bajo sospecha. La sim de EXPLORE ejecutó `computeCapitalSites` 1800+ veces buscando
divergencia de OUTPUT (no-determinismo) y nunca midió el TIEMPO bajo coverage, así que no
podía reproducir el modo real. Una sim que no reproduce el modo de fallo citado en el
mensaje original es un negativo débil. Conecta con T-020 (aislar la causa con línea base):
igual que T-020 exige medir sin el diff, T-127 exige reproducir el modo de fallo correcto.
Pendiente de decisión humana.

Delta 2 (matiz de frontera a la regla del Quality Gate "prohibido subir timeout sin root
cause") — PENDIENTE DE APROBACIÓN HUMANA: T-127 documenta el CASO POSITIVO que delimita esa
prohibición. Subir el timeout de un test SÍ es legítimo cuando el root cause está
DEMOSTRADO y la aserción queda intacta: aquí la doble BFS es determinista (probado ×2 sobre
el grid real), solo lenta bajo coverage v8; el fix fue un timeout explícito de 30 s en ese
único `it` con la causa comentada, sin tocar ni debilitar la aserción (T-127.md:99-100). El
tell que separa el atajo prohibido del ajuste legítimo: el atajo sube el timeout para
ENMASCARAR una aserción que falla de verdad (root cause no entendido → silencia el
síntoma); el ajuste legítimo sube el timeout DESPUÉS de demostrar que la aserción es
correcta y el único problema es el presupuesto de tiempo bajo instrumentación (la aserción
sigue viva y discriminando). Anexar como evidencia/frontera de la regla existente, no como
regla nueva. Pendiente de decisión humana.

## 2026-07-23 · T-128 · La severidad "bug-confirmado" de un explorador es una HIPÓTESIS, no evidencia: cada consumidor aguas abajo re-verifica la afirmación contra el código citado — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-128, R0, 0 ciclos FIX, APPROVE a la primera): un explorer de
diagnóstico entregó CUATRO hallazgos etiquetados con severidad alta ("bug-confirmado" /
"dead code" / "O(n²)"). La verificación del lead LEYENDO el `file:line` citado los desmontó
los cuatro (exploration.md:5-19):

- "Dead code en processPursuit 718-719" → falso: las condiciones no eran idénticas
  (`!noMarch` vs `noMarch`); era diseño anti-spam documentado con `lastPursuitTarget`.
- "Routing castea abilities" → falso: guards `isRouting` ya presentes en
  campaign-session.ts:1210/1235/1264 y 855/909/941/995.
- "applyAttrition O(n²)" → falso: era O(combates) con dedup de pares (units.ts:786-841) y
  lookups O(1).
- "findNearestEnemyAt O(n×r²)" → sobreestimado: ya usa índice espacial `byCell`
  (units.ts:597), anillos Chebyshev sobre buckets.

Solo el 5º hallazgo (ráfagas de `findPath` sincronizadas), REPRODUCIDO con benchmark
medido, sobrevivió y se convirtió en la spec. Corroboración un nivel más abajo: la
exploration del propio lead afirmó que `findPath` "entra como puerto" a units.ts; el planner
lo re-verificó contra el código y descubrió que era import estático de `./pathfinding.ts`
(units.ts:3-8) → tuvo que añadir la inyección opcional `findPath?` (plan.md:8). El planner
NO dio por buena la afirmación mecánica de exploration.md; la comprobó y corrigió antes de
diseñar sobre ella (0 ciclos por atraparlo a tiempo).

Delta propuesto (diagnóstico / separación maker-checker): una etiqueta de severidad o una
afirmación mecánica de una fase AGUAS ARRIBA (explorer, exploration.md) es una HIPÓTESIS del
"maker", no un hecho verificado. Solo cuenta como confirmado lo que un SEGUNDO par de ojos
("checker") verificó contra el código citado (`file:line`) o reprodujo. Regla: antes de que
un hallazgo entre a una spec como premisa, el consumidor aguas abajo LEE el código citado y
confirma o refuta —nunca hereda la severidad del que lo reportó—. Aplica a lo largo de toda
la cadena: el lead re-verifica al explorer, el planner re-verifica las afirmaciones
mecánicas de la exploración del lead. Una severidad "confirmado" sin `file:line` verificado
es una corazonada con etiqueta cara.
Frontera vs T-127 ("No reproduce ≠ no existe"): COMPLEMENTARIAS, mismo eje invertido. T-127
dice no DESCARTAR un hallazgo sin leer el mensaje/evidencia original (un negativo de N
reintentos no cierra el caso). T-128 dice no ACEPTAR un hallazgo sin verificar la evidencia
citada (un positivo etiquetado "confirmado" no abre la spec). Ambas: la evidencia se lee, no
se hereda de la confianza del que reporta.
Frontera vs T-033/T-035 ("Diagnose a reported bug with a throwaway sim… then classify"):
ortogonal, un paso antes. T-035 clasifica un hallazgo que TÚ ya reprodujiste (bug prometido
vs decisión de diseño abierta). T-128 es anterior: no des por reproducido/confirmado lo que
otro AGENTE afirmó; re-verifícalo primero. Encaja bajo el principio "separate maker and
checker" de SKILL.md: el explorer propone hipótesis, otro las gatea contra el código.
Pendiente de decisión humana.

## 2026-07-23 · T-128 · La sim/benchmark descartable antes de la spec también aplica a mandatos vagos de PERF/escalabilidad sin bug reportado — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-128, R0): el origen no fue un bug reportado sino un mandato VAGO del
humano ("púlelo y hazlo escalable"). En vez de especular sobre qué optimizar, se corrió un
BENCHMARK DESCARTABLE (sonda no committeada, borrada tras medir: tick(0.1), 200 muestras,
ms/tick media/p95 a N=50/150/300) que SEPARÓ lo sano de lo patológico: el loop base de
combate/moral escala bien (<1 ms a N=300), y el coste real está en ráfagas de `findPath`
sincronizadas en un mismo tick (p95 70 ms en pursuit masivo, 77-91 ms en cascada de rout a
N=300). Esa medición convirtió un mandato difuso en una task legítima y ACOTADA (presupuesto
O(K) de findPath/tick), y los números medidos entraron a la spec como contexto
(T-128.md:11-26, sección "Context (medido, no teórico)"). Sin el benchmark, la task habría
podido optimizar el loop de melee/moral —que ya era sano— (over-engineering sobre una
corazonada).
Delta propuesto (extensión de la regla T-033 "throwaway sim before you spec"): la disciplina
de diagnosticar con una sonda descartable ANTES de la spec no se limita a bugs reportados
jugando; también aplica a mandatos de PERF/ESCALABILIDAD sin bug concreto ("hazlo
escalable", "está lento"). Medir con un benchmark descartable (fuera del pipeline, no
committeado) ANTES de especular qué optimizar; los números medidos van a la spec como
contexto y el bound se calibra contra ellos. Un mandato de perf sin medición es una
corazonada sobre dónde está el coste. Separa lo sano (no se toca) de lo patológico (única
task legítima) igual que la sim de T-033 separa la causa real de las hipótesis.
Frontera vs T-033/T-035: misma disciplina (sonda descartable pre-task), disparador distinto.
T-033 parte de un SÍNTOMA reportado jugando (un bug); T-128 parte de un MANDATO VAGO sin
síntoma concreto —la medición es la que DESCUBRE si existe patología y dónde—. El paso de
clasificación de T-035 tiene análogo aquí: "sano <1 ms" (no es task, como la decisión de
diseño que no rompe promesa) vs "patológico 70-90 ms" (task acotada). Conecta con la
preferencia por cota contable de T-014/T-032: el benchmark dimensiona el K del bound
(K=12 ≈ 3 ms/tick a N=300, plan.md:14), no un "nunca" categórico.
Recomendación de plegado: como EXTENSIÓN de la sección existente "Diagnose a reported bug
with a throwaway sim before you spec it" (no sección nueva), ampliando su alcance de
"bug reportado jugando" a "síntoma reportado O mandato de perf/escalabilidad", con la
frontera de que en el 2º caso la sonda además DESCUBRE si hay patología. Pendiente de
decisión humana.

## 2026-07-24 · T-129 · Una task que AUTORA contenido en un catálogo real acopla los tests que usan esos ids vivos: grep de ids ANTES de implementar + tests de wiring que fijan su propio dato — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-129, R1, 2 ciclos FIX): la task autoró `wealth` por id en el catálogo
real (`region-catalog.data.ts`, 98 regiones). El plan declaró "NINGÚN test existente se
toca", pero DOS oleadas de descubrimiento probaron lo contrario: (1) durante implementación,
`economy-fiscal.test.ts` (contrato T-047) usaba la región REAL 1 (Inglaterra), ahora wealth
2.0, y sus asserts de income plano (10/9, tax 0.5) pasaban a 20/10 → fixture migrado a región
10 (Castilla, wealth 1.0) (implementation.md:29-41); (2) en review, `npm test` completo ROJO
con 9 regresiones en OTROS 5 archivos preexistentes (buildings ×2, build-queue ×3,
recruit-queue ×2, recruitment ×1, unit-types-operational ×1), todos con
`initialOwners: [[1,7]]` — la misma región 1 duplicando income y rompiendo asserts de
coste/tesorería (review.md:6-12). El criterio aplicado al primero (fixture→región neutral)
NO se había extendido a los 5. Resolución del lead: puerto opcional `getRegionWealth?` en
`CampaignSessionDeps` (ausente ⇒ catálogo real) + `getRegionWealth: () => 1` en los fixtures
de los 5 archivos, sin tocar asserts → desacopla los tests de sesión del contenido autorado
de forma PERMANENTE (futuras recalibraciones de wealth no romperán fixtures) (review.md:14-22).
Delta propuesto (EXPLORE/PLAN + diseño de fixtures): cuando una task AUTORA o RECALIBRA
contenido en un catálogo real (valores nuevos por id: wealth, coste, población…), (1) el plan
debe GREP-ear los tests existentes por usos de esos ids reales ANTES de implementar —el
mismo id que se autora es el que un fixture ajeno puede estar asumiendo con su valor viejo—;
"ningún test se toca" es una premisa a VERIFICAR con grep, no a declarar; (2) los tests de
sesión/wiring deben FIJAR el dato que asumen (inyectar un valor neutro vía puerto opcional o
usar data sintética), no depender del contenido vivo del catálogo, para que la próxima
recalibración de ese contenido no los rompa.
Frontera vs T-015 ("EXPLORE verifica las premisas de DATOS reales, no solo firmas"): mismo
eje INVERTIDO, complementaria. T-015 es una task que ASUME datos del artifact (owners al
arranque) y debe verificar que existan como cree; T-129 es una task que CAMBIA datos del
catálogo que OTROS tests ya asumen con su valor anterior → el grep no es "¿existe el dato que
necesito?" sino "¿quién más depende del dato que estoy a punto de mover?". Ambas: los datos
reales del catálogo/artifact son un contrato implícito que el diseño debe auditar, no dar por
estable. Conecta con T-030 (un fixture acoplado al contenido vivo es un gate frágil: pasa hoy
por el valor que hoy tiene el catálogo, no por el comportamiento que pretende fijar).
Frontera vs T-123 (contrato literal en los .md de fase): distinta — T-123 es sobre copiar
literal el contrato entre AGENTES; esto es sobre no acoplar un fixture al DATO vivo de un
catálogo compartido. Pendiente de decisión humana.
Validado PREVENTIVAMENTE + refinamiento · 2026-07-24 · T-130 (R1, 0 ciclos FIX, APPROVE a la
primera): el delta se aplicó DESDE EL PLAN, no como diagnóstico a posteriori. T-130 añadió el
campo aditivo `population` al `CampaignSnapshot`; el plan ordenó de antemano los pasos B3/B4:
B3 = ÚNICA inversión de assert prevista y AUTORIZADA (añadir 'population' a la lista literal de
keys de campaign-session-wealth.test.ts, entre 'pin' y 'productionQueue'), B4 = grep
OBLIGATORIO de tests/ por `Object.keys`+`exportState` y fixtures literales de snapshot para
CONFIRMAR que B3 era el único assert afectado (roturas extra ⇒ reportar al lead ANTES de tocar)
(plan.md:26-27). Además los fixtures de sesión inyectaron `getRegionWealth: () => 1` (lección
T-129 citada en cabecera, plan.md:25). Resultado: 0 regresiones imprevistas, suite 1118/1118
verde a la primera (review.md: "lección T-129 aplicada; única inversión de assert autorizada:
key 'population'"). Las dos oleadas de regresión sorpresa de T-129 (fixture→región neutral + 9
roturas en 5 archivos, descubiertas en implementación y review) se convirtieron en T-130 en un
paso PREVISTO: el grep se ordenó en el plan, no se descubrió en review.
Refinamiento (matiz nuevo, SUBSUMIDO — no delta aparte): añadir un CAMPO al snapshot es un
disparador del mismo principio que autorar/recalibrar un id del catálogo. En ambos, un cambio a
una ESTRUCTURA COMPARTIDA que otros tests aseran (contenido por id; forma/lista de keys del
snapshot) exige (1) grep previo de los fixtures que dependen de esa estructura y (2) la
inversión del assert como paso AUTORIZADO Y PREVISTO en el plan, no una sorpresa de review. El
caso "campo nuevo al snapshot" combina esta regla con T-031 (cambiar una decisión de diseño
INVIERTE su test, no lo borra: aquí la lista de keys se AMPLÍA por orden del spec, con el
escenario aún aserido). Juicio del curador: se pliega como refinamiento de este delta —mismo
eje "¿quién más depende de la estructura que estoy cambiando?"—, no como delta nuevo, para
evitar skill-bloat (misma disciplina que la nota de curación de T-034). Pendiente de decisión
humana junto con el delta base.

## 2026-07-24 · T-129 · Tocar un archivo R0 no registrado en el gate de cobertura ⇒ registrarlo es parte de la task, no un extra — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-129, R1, 2º ciclo FIX): el 2º FIX cubrió ramas de `region-catalog.ts` Y
cerró un HUECO del gate permanente que el verifier detectó — el archivo R0 tocado no estaba
del todo vigilado por el gate de cobertura configurado. El cierre confirma la resolución:
cobertura final `economy.ts` 100/92.3 y `region-catalog.ts` 100/97.43, "ambos registrados en
`coverage.include`" (T-129.md:88-93). Es decir, la task no solo subió la cobertura del código
nuevo sino que INCORPORÓ el/los archivo(s) R0 tocado(s) al `include` del gate para que la
medición los gatee de verdad.
Delta propuesto (contrato de la task, paso PLAN/VERIFY): cuando una task toca un archivo R0
que NO está registrado en el gate de cobertura configurado (`coverage.include` de
`vite.config.ts`), registrarlo ahí es PARTE de la task, no un extra opcional. Un archivo R0
tocado pero ausente del `include` es cobertura no gateada: el gate mide en verde sin vigilar
el módulo que la task acaba de modificar (mismo modo de fallo "gate blando por omisión" que
T-126). El paso PLAN enumera los archivos R0 tocados y cruza cada uno contra el `include`
vigente; los ausentes se añaden en la misma task.
Frontera vs T-126 ("el verifier corre el gate DE CONFIGURACIÓN, no una reconstrucción ad-hoc
scoped a la task"): COMPLEMENTARIAS, dos mitades del mismo gate. T-126 es sobre el VERIFIER
—no sustituir el gate configurado por una medición estrecha—; T-129 es sobre la TASK —poblar
el `include` del gate configurado con el archivo R0 que se acaba de tocar—. Sin (T-129) el
gate global de (T-126) mide en verde un módulo que no está en su lista; con ambas, todo R0
tocado entra al gate configurado y el verifier lo corre completo. Conecta con la cobertura R0
≥90 % del proyecto (CLAUDE.md): esa exigencia solo se cumple si el archivo está en el
`include`. Pendiente de decisión humana.

## 2026-07-24 · T-129 · Validaciones de reglas vigentes (sim descartable pre-fijado de constantes · contratos literales) — evidencia, no regla nueva

Dos reglas ya vigentes recibieron evidencia positiva en T-129 (R1, APPROVE tras 2 FIX); se
anexan como validación, sin acuñar entrada nueva:
- **Sim descartable ANTES de fijar los valores (T-033/T-128):** el plan exigió una sim
  descartable en scratchpad (no committeada) que leyera el catálogo con los wealth propuestos
  e imprimiera media global + media por facción main, a validar contra plan §3 ANTES de fijar
  A1 (plan.md:64, Paso previo obligatorio). Se ejecutó DOS veces —el lead antes de autorizar
  A1 y el Implementer A antes de fijar valores— con resultado IDÉNTICO al plan: 98/98, media
  global 1.0143, main [3,8,2,7,13,9,10,1,6,11], las 10 medias por facción en [0.75,1.25]; las
  sondas se borraron (implementation.md:3-7). La aritmética del planner se confirmó al 100 %
  antes de tocar el catálogo → cero fricción de calibración en el código. Extiende el alcance
  ya validado de la sim descartable (bug reportado T-033, mandato de perf T-128) a un TERCER
  disparador: CALIBRAR valores de contenido autorado antes de fijarlos —la sonda verifica que
  los números que van a un catálogo vivo satisfacen los AC de balance ANTES de que un wealth
  inválido pueda romper toda la suite al importar (riesgo plan.md:70).
- **Contratos literales en los .md de fase (T-123):** `plan.md` persistió LITERAL los 9 `it()`
  de economy-wealth y los 2 de campaign-session-wealth con escenarios concretos (owners, base,
  valores esperados exactos: `points===25`, keys ordenadas del snapshot) (plan.md:45-61); los
  implementers los reprodujeron y salieron 20/20 verdes tras implementación (implementation.md:
  11-27). 3ª evidencia consecutiva (T-128, T-129) de que contratos ejecutables literales →
  reproducción sin round-trip. Sin cambios a los deltas pendientes de T-123/T-128.

## 2026-07-24 · T-130 · Validaciones de reglas vigentes (sim descartable pre-constantes · contratos literales) — evidencia, no regla nueva

Dos reglas ya vigentes recibieron evidencia positiva en T-130 (R1, población por región,
APPROVE a la primera, 0 ciclos FIX — PRIMERA task del loop económico sin ningún FIX); se anexan
como validación, sin acuñar entrada nueva:
- **Sim descartable ANTES de fijar los valores (T-033/T-128/T-129):** las constantes de
  crecimiento (POP_START=100, POP_GROWTH_PER_SECOND=0.5, POP_MAX_FACTOR=4, mult fiscal 1.5−tax)
  se calibraron con sim descartable ANTES de fijarlas (spec §2; plan §1: "tax 1 ⇒ 0.25/s ⇒
  duplicar en 400 s ∈ [300,480]"). El AC4 —test EN-SUITE que integra el tick real sin mocks de
  la fórmula y exige duplicar POP_START en t ∈ [300,480] s— confirmó la calibración a la
  PRIMERA (0 FIX). 3ª validación consecutiva de la sonda descartable pre-spec (T-128 perf,
  T-129 wealth autorado, T-130 constantes de crecimiento) y 2ª del tercer disparador "calibrar
  valores de contenido/tuning antes de fijarlos" abierto en T-129. Matiz nuevo: en T-130 la
  calibración quedó ANCLADA por un AC vivo en la suite (no solo la sonda borrada), así que una
  recalibración futura que rompiera el balance la atraparía el gate — la sonda dimensiona, el AC
  vigila.
- **Contratos literales en los .md de fase (T-123):** `plan.md` persistió LITERAL los 12 `it()`
  (§4: títulos exactos, fixtures con ids/wealth/owners concretos, valores esperados verbatim
  como `100 + 0.5×1×1.5×2 = 101.5`, seeds 200/100, rangos de AC4) y los implementers A/B los
  reprodujeron carácter a carácter → 12 tests nuevos verdes, suite 1118/1118 a la primera. 4ª
  evidencia consecutiva (T-128, T-129, T-130) de que contratos ejecutables literales →
  reproducción sin round-trip. Sin cambios a los deltas pendientes de T-123/T-128.

## 2026-07-24 · T-131 · Una premisa que el spec CONDICIONA a "verificar en EXPLORE/plan" se encarga EXPLÍCITA como paso 0 del prompt del planner cuando no hay explorador dedicado — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-131, R1, 0 ciclos FIX, APPROVE a la primera): el spec §4 CONDICIONÓ un
diff a una verificación ("verificar en EXPLORE/plan que la fase de la IA construye varios
edificios en la misma región cuando la población lo permite…", T-131.md:41-46). No hubo rol
explorador dedicado; el lead encargó al PLANNER esa verificación como paso 0. El EXPLORE §0
del plan (plan.md:4-8) encontró que `buildPass` exige región vacía
(`getBuilding === 'none'`, faction-ai.ts:554) ⇒ AC4 (la IA construye el 2º edificio en la
misma región) era INCUMPLIBLE sin tocar faction-ai.ts, archivo que el diff-set inicial del
spec no listaba. El planner lo declaró "CAMBIO EN faction-ai.ts JUSTIFICADO Y OBLIGATORIO" y
añadió el diff B3 (puertos opcionales `getBuildings?`/`getSlots?` + buildPass unificado)
ANTES de fijar el contrato. Sin ese EXPLORE integrado, el bloqueo habría aflorado tarde como
FIX/REDESIGN en review (AC4 rojo). Evidencia: plan.md §0 + §B (B3); review.md:3 (0 ciclos,
APPROVE, conformance 93); cierre T-131.md:101-102 ("El EXPLORE integrado del planner evitó el
bloqueo de AC4 —la IA exigía región vacía para construir").
Delta propuesto (orquestación / construcción del prompt del planner): (1) cuando un spec
CONDICIONA un diff a una verificación ("verificar en EXPLORE/plan que X"), esa cláusula es una
premisa condicional que NO puede quedar implícita: el prompt del planner debe encargar esa
verificación EXPLÍCITAMENTE como PASO 0, con el `archivo:línea` esperado como entregable
(confirmar/refutar el mecanismo concreto, no un difuso "revisar si…"). (2) cuando NO hay rol
explorador dedicado, la responsabilidad de EXPLORE no desaparece: se ABSORBE en el planner
como §0 del plan; el prompt debe asignarla de forma nominal, no confiar en que el planner
explore por iniciativa. Tell: si el spec dice "verificar que…" y el prompt del planner no
repite esa verificación como paso con salida `file:line`, la premisa condicional viaja sin
dueño y el bloqueo aflora en review en vez de en el plan.
Frontera vs T-015/T-029 ("EXPLORE verifica las premisas del spec, no solo los puertos"): mismo
clúster, eje distinto —refinamiento, no duplicado—. T-015/T-029 fijan QUÉ verificar (datos
reales / complejidad real). T-131 fija QUIÉN y CÓMO cuando no hay explorador dedicado (el
planner absorbe EXPLORE como §0) y CÓMO se encarga una premisa que el PROPIO spec marca como
condicional (paso 0 explícito en el prompt, con `file:line` esperado). Complementa T-123
(contrato literal entre agentes: aquí lo que se copia literal al prompt es la ORDEN de
verificar con su salida esperada) y T-128 (el planner como checker que re-verifica una
afirmación mecánica contra el código citado, no la hereda). No contradice ninguna regla previa.
Recomendación del curador: entrada NUEVA (mecanismo distinto: reubicación de la responsabilidad
de EXPLORE + premisa spec-condicionada), NO evidencia bajo T-015/T-029. Pendiente de decisión
humana.

## 2026-07-24 · T-131 · Validaciones de reglas vigentes (contratos literales · fixture con dato propio · R0 en coverage.include) — evidencia, no regla nueva

Tres deltas ya pendientes recibieron evidencia positiva en T-131 (R1, slots de edificio por
población, APPROVE a la primera, 0 ciclos FIX — 2ª task consecutiva sin FIX del loop económico
tras T-130); se anexan como validación, sin acuñar entrada nueva:
- **Contratos literales en los .md de fase (T-123):** plan.md §C persistió LITERAL los 10
  `it()` con títulos y valores exactos (slotsForPopulation 0/199→1, 200/349→2, 350→3,
  NaN/−50/Infinity→1; `getBuildings` `toEqual [[1,'market'],[1,'barracks']]` en orden; keys de
  buildings `toEqual ['slots']`) y los implementers A/B los reprodujeron carácter a carácter →
  10/10 tests T-131 verdes, suite 1128/1128 a la primera (review.md:5). 4ª evidencia
  consecutiva (T-128, T-129, T-130, T-131) de que contratos ejecutables literales →
  reproducción sin round-trip. Sin cambios al delta pendiente de T-123.
- **Fixture que fija su propio dato + grep previo (T-129):** 2ª aplicación PREVENTIVA (tras
  T-130), desde el plan y no como diagnóstico a posteriori. El EXPLORE §0 verificó por
  adelantado que los tests 1-slot son intocables (buildings.test.ts:96-104/:190-202,
  build-queue.test.ts) y que los tests de sesión (wealth 1, ≤30 ticks ⇒ pop <200) siguen en 1
  slot ⇒ semántica v1 (plan.md:8); el Riesgo 1 (plan.md:35) dejó el plan B explícito: "fijar SU
  dato con getRegionWealth neutro (T-129), nunca relajar assert". Resultado: cero tests
  existentes modificados, confirmado por el reviewer (review.md:11, "Lección T-129 aplicada:
  cero tests existentes modificados"). Refuerza que "ningún test se toca" es premisa a
  verificar con grep desde el plan, no a declarar.
- **Registrar el archivo R0 tocado en `coverage.include` (T-129, 2º delta):** el diff B5 añadió
  `buildings.ts` a `coverage.include` de vite.config.ts como parte de la task (plan.md:18,
  "regla T-129"); el gate midió buildings.ts 100 % líneas / 95.45 % branches (review.md:6),
  gateado de verdad, no medición ad-hoc. Aplicación limpia del delta "tocar un R0 no registrado
  ⇒ registrarlo es parte de la task". Sin cambios a los deltas pendientes de T-129.

## 2026-07-24 · T-132 · El estado DERIVADO que eliges NO serializar debe reconstruirse en hydrate, y EXPLÍCITAMENTE en la sesión cuando el evento que lo reconstruye NO se dispara en el hydrate del sub-sistema — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-132, R1, 0 ciclos FIX, APPROVE a la primera): las rutas de comercio y su
estado de corte son estado DERIVADO reconstruible (se recomputan al cambiar ownership),
NO campos de snapshot — spec §4 exige "cero campos nuevos en `CampaignSnapshot`", verificado
por AC4 (exportState keys idénticas) y por el reviewer (review.md:14, "snapshot intocado").
La trampa: la recomputación normal de rutas cuelga del evento `onOwnerChange`, pero
`ownership.hydrate` es SILENCIOSO (no dispara ese evento — ownership.ts:57-61). Si la sesión
solo confiara en el evento, tras hidratar en mitad de un corte las rutas quedarían VACÍAS y
dos futuros divergirían. EXPLORE §0 del planner lo detectó por adelantado (plan.md:8, punto 4:
"`ownership.hydrate` silencioso ⇒ session.hydrate recomputa trade explícito (AC4)") y el diseño
añadió una recomputación EXPLÍCITA al final de `session.hydrate` (plan.md:23 B3, "hydrate al
final :1635 recompute"). AC4 lo gatea: "hydrate en mitad de un corte ⇒ rutas+active
reconstruidos y dos futuros idénticos" (T-132.md:80-82, plan.md:27 test 11). Riesgo F1
(plan.md:34) documenta la causa raíz de la divergencia (la cadencia del check tampoco se
serializa) y su remedio (recompute resetea la cadencia + check inmediato; test con pasos
enteros alineados a la cadencia). El reviewer confirmó el recompute en hydrate leyendo la
fuente (review.md:11).
Delta propuesto (EXPLORE/PLAN, diseño de estado derivado): cuando decides NO serializar un
estado DERIVADO (para no ampliar el snapshot) y reconstruirlo en `hydrate`, no basta con
"recomputar al hidratar": hay que verificar QUIÉN dispara esa recomputación. Si el estado se
reconstruye normalmente por un EVENTO (aquí `onOwnerChange`) y el `hydrate` del sub-sistema
que emite ese evento es SILENCIOSO (no lo re-dispara), entonces la reconstrucción NO ocurre
sola: el consumidor de más alto nivel (la sesión) debe reconstruirlo EXPLÍCITAMENTE en su
propio `hydrate`. Tell: enumera, por cada estado derivado no serializado, el disparador de su
reconstrucción y comprueba que ese disparador se active durante el hydrate; si el hydrate del
emisor es silencioso, la sesión reconstruye a mano. Además, todo sub-estado de cadencia/timing
no serializado (intervalos de check, acumuladores de tiempo) debe RESETEARSE en la
reconstrucción y un test con pasos temporales alineados debe fijar "dos futuros idénticos tras
hidratar" (no basta con reconstruir la estructura; el temporizado también debe converger).
Frontera vs T-036 ("dar memoria persistente reabre el ciclo de vida del estado"): eje OPUESTO,
complementaria. T-036 es cuando SÍ persistes y aparecen huérfanas que purgar; T-132 es cuando
deliberadamente NO persistes y debes reconstruir — el riesgo simétrico no es la huérfana stale
sino el estado VACÍO/divergente si el disparador de reconstrucción no corre en hydrate. Ambas:
introducir (o rechazar) persistencia reabre el ciclo de vida del estado derivado.
Frontera vs T-128: el spec de T-132 llama a esto "patrón T-128" (recompute al hidratar desde
ownership+unidades), pero T-128 NO tiene entrada en LEARNINGS que lo codifique (sus dos entradas
son maker-checker y sonda de perf). El matiz NUEVO que T-132 aporta sobre el patrón heredado de
T-128 es la reconstrucción EXPLÍCITA en la sesión por el hydrate silencioso del emisor.
Juicio del curador: entrada NUEVA (no hay entrada T-128 a la que anexar; el matiz del hydrate
silencioso es reusable y no cubierto). Alternativa considerada y descartada: "evidencia bajo
T-128" — imposible por ausencia de esa entrada. Pendiente de decisión humana.

## 2026-07-24 · T-132 · Validaciones de reglas vigentes (EXPLORE §0 del planner · contratos literales · fixture con dato propio + R0 en coverage.include · maker-checker lee la fuente) — evidencia, no regla nueva

Cuatro deltas ya pendientes recibieron evidencia positiva en T-132 (R1, rutas de comercio
cortables, APPROVE a la primera, 0 ciclos FIX — 3ª task consecutiva sin FIX del loop económico
tras T-130/T-131); se anexan como validación, sin acuñar entrada nueva:
- **EXPLORE integrado como §0 del prompt del planner (T-131):** 2ª aplicación. Sin explorador
  dedicado, el planner absorbió EXPLORE como §0 y las 6 premisas verificadas (plan.md:4-10,
  con `archivo:línea` por premisa) pre-resolvieron CUATRO trampas reales antes de fijar el
  contrato: (1) `onOwnerChange` es listener ÚNICO del constructor ⇒ hay que ENCADENAR el
  recompute en el closure existente, no instalar un segundo listener (ownership.ts:32,45); (2)
  `capitalCellOfRegion` devuelve `Cell | null` sin garantía 98/98 ⇒ trade tolera null = sin
  ruta (campaign-session.ts:136); (3) el bruto se grava en DOS sitios (tick economy.ts:102-103
  y snapshot :125-127) ⇒ el sumando de trade entra en AMBOS antes de ×taxRate para conservar
  income==rate×tax; (4) el presupuesto findPath de T-128 es interno a units, `deps.findPath` no
  pasa por él ⇒ trade recibe puerto propio, cómputo por evento. Resultado: 0 FIX. Confirma que
  encargar EXPLORE nominal como §0 (con salida `file:line`) previene los bloqueos en review.
  Sin cambios al delta pendiente de T-131.
- **Contratos literales en los .md de fase (T-123):** plan.md §D persistió LITERAL los 12 `it()`
  con títulos y valores exactos (pares nearest `{1,2},{2,3}`, income `0.24`⇒cortada`0.12`,
  tributa `rate 2.12 tax 0.5 ⇒ 1.06`, hydrate en mitad de corte) y los implementers A/B los
  reprodujeron carácter a carácter → 13 tests T-132 verdes, suite 1141/1141 a la primera
  (review.md:5). 5ª evidencia consecutiva (T-128, T-129, T-130, T-131, T-132) de que contratos
  ejecutables literales → reproducción sin round-trip. Sin cambios al delta pendiente de T-123.
- **Fixture que fija su propio dato + grep previo, y R0 tocado en `coverage.include` (T-129):**
  3ª aplicación PREVENTIVA. La restricción arquitectónica del spec citó "regla T-129 para
  cualquier fixture afectado: fijar su dato, no relajar" (T-132.md:58) y el diseño hizo el puerto
  `getTradeIncomePerSecond?` opcional (ausente ⇒ income idéntico v1) para no acoplar los tests
  existentes; AC3 exige "sin puerto ⇒ income idéntico v1, mismo número". Resultado: NINGÚN test
  existente tocado (review.md:15, "Lección T-129: cero tests existentes tocados"). Y `trade.ts`
  se registró en `coverage.include` como parte de la task (gate 97.77/95.65, cierre
  T-132.md:104). Sin cambios a los deltas pendientes de T-129.
- **Maker-checker: el checker verifica contra la FUENTE, no solo el test verde (T-128):** el
  reviewer confirmó los invariantes críticos LEYENDO el código citado además de correr los tests
  — "tick jamás llama findPath (trade.ts:151-158 vs :139)", empate determinista por id, guard de
  owner divergente, propia no corta, copia defensiva, sumando en el bruto en tick y snapshot
  (review.md:6-14). El spy de call-count (AC1: "tick sin conquista ⇒ 0 findPath") ya gateaba el
  invariante, pero el reviewer lo re-confirmó en la fuente. Juicio del curador: buena práctica ya
  cubierta por el principio maker-checker de T-128 (el checker gatea contra el `file:line`, no
  hereda la afirmación) reforzada por T-030 (un test discrimina, pero leer la fuente confirma que
  el invariante vive donde se cree); se anexa como evidencia del delta T-128 maker-checker, NO
  como matiz de regla nuevo del reviewer. Sin cambios al delta pendiente de T-128.

## 2026-07-24 · T-133 · La sim descartable no solo CALIBRA: puede REFUTAR el mecanismo del propio spec — si refuta, la spec se enmienda PRE-PLAN con el hallazgo documentado — PENDIENTE DE APROBACIÓN HUMANA

Refinamiento de la sección "Diagnose a reported bug with a throwaway sim before you spec it"
(T-033/T-035/T-128), NO regla nueva independiente. Hasta ahora la sonda descartable tenía tres
disparadores en los que CONFIRMABA/medía/calibraba NÚMEROS: bug reportado jugando (T-033),
mandato de perf/escalabilidad (T-128), calibrar valores de contenido autorado antes de fijarlos
(T-129/T-130). En los tres la sim valida que los números salgan; el MECANISMO se daba por bueno.
Hecho concreto (T-133, R1, 0 ciclos FIX, APPROVE, 4ª consecutiva sin FIX): el diseño inicial del
PROPIO spec era un suelo de ahorro FRACCIONAL (ahorra una fracción `f<1` del coste `C` antes de
reclutar). La sim descartable REFUTÓ el mecanismo, no solo sus constantes: cualquier `f<1` OSCILA
y nunca alcanza `C` porque cada recluta resetea el tesoro por debajo de `f·C` y nunca acumula
hasta `C` (spec §2: "que REFUTÓ el suelo fraccional: cualquier `f<1` oscila y nunca alcanza C
porque cada recluta resetea el tesoro"; plan §A: "la sim refutó suelos fraccionales"; cierre
T-133.md:107-109: "La sim descartable refutó el diseño inicial (suelo fraccional oscila) ANTES de
codificar — la spec se enmendó pre-plan"; enmienda en main commit 601de19 reportada por el lead).
La spec se ENMENDÓ ANTES del plan: reserva TOTAL del objetivo (`treasury − unitCost ≥ C`) con
válvula anti-congelación por ratio ejército/edificios y GATE-SIEMPRE cuando hay objetivo (no solo
"aún no pagable"), para evitar la oscilación en el umbral. Sin la sim, ese mecanismo roto habría
llegado al PLAN y a los tests: aserciones calibradas sobre un esquema que nunca converge (bien
insatisfacibles, bien codificando la propia oscilación) → un ciclo entero perdido.
Delta propuesto (extensión de la regla de la sonda descartable): la sim descartable pre-spec no
solo dimensiona/calibra los NÚMEROS de un mecanismo dado por bueno; también puede GATEAR el
MECANISMO mismo (¿este esquema converge / satisface el objetivo del todo?). Cuando la sonda
REFUTA el mecanismo propuesto por el spec, el hallazgo NO se pospone al plan ni a implementación:
la spec se ENMIENDA PRE-PLAN documentando la refutación (qué esquema falla y por qué) y el
mecanismo corregido. Tell: si el resultado de la sonda es "el diseño que el spec propone no puede
cumplir su propio AC" (no "los números están mal"), estás ante una refutación de mecanismo → parar
y enmendar el spec antes de que el planner diseñe sobre un esquema inviable.
Frontera vs T-035 ("clasificar tras reproducir: bug prometido vs decisión de diseño abierta"):
mismo eje, objeto distinto. T-035 clasifica un HALLAZGO reproducido del código EXISTENTE (¿rompe
una promesa viva o autora una nueva?). T-133 clasifica el resultado de la sonda sobre un MECANISMO
que el spec PROPONE pero que aún no existe: la sim dice "el mecanismo propuesto no converge" → la
autoría del spec se corrige antes del plan. Ambas: reproducir/medir fija un HECHO, y ese hecho
decide el siguiente paso (arreglar / preguntar / enmendar) en vez de una corazonada.
Frontera vs T-128 (sonda de perf que DESCUBRE si hay patología): complementaria. T-128 descubre si
existe un problema donde el mandato era vago; T-133 REFUTA una solución que el spec ya proponía en
concreto. En T-128 la sonda abre la task; en T-133 la sonda REESCRIBE el mecanismo de la task.
Recomendación del curador: refinamiento de la sección de la sonda descartable (bloque propio con
fecha, como T-035), NO sección nueva ni delta independiente — el disparador (mandato de ahorro) ya
cae bajo "calibrar valores de contenido antes de fijarlos" (T-129); lo NUEVO es que la sonda puede
devolver "mecanismo inviable", no solo "números afinados". Pendiente de decisión humana.

## 2026-07-24 · T-133 · Commit de docs/spec en main durante un pipeline ACTIVO obliga a rebase del worktree (o commitear los .md de fase al cierre) — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-133, R1): la enmienda de spec que la sonda descartable motivó (ver entrada
anterior) se commiteó en `main` DESPUÉS de que el worktree de la task ya existía ⇒ el worktree y
main DIVERGIERON ⇒ el merge exigió rebase del worktree + RE-VERIFICACIÓN completa antes del
fast-forward. Evidencia: cierre T-133.md:104 ("Mergeada en main `9045bf5` (rebase por divergencia
docs + FF)"). No causó fallo (verify PASS tras rebase), pero fue trabajo evitable.
Delta propuesto (proceso del orquestador, SETUP/CLOSE): commitear docs/spec (o cualquier archivo
que el worktree también tenga) en `main` MIENTRAS un pipeline está activo hace divergir ese
worktree y obliga a rebase + re-verify en el merge. Dos remedios: (a) commitear las enmiendas de
spec / los `.md` de fase al CIERRE de la task, dentro de su propia rama (como T-129–T-132, que
persisten sus fases al cerrar), no en main a mitad de pipeline; o (b) si la enmienda debe entrar a
main de inmediato, ASUMIR el rebase del worktree afectado y re-correr la verificación completa
(RING-GUARD + test + build + smoke) antes del merge — nunca fast-forward sin re-verify tras rebase.
Frontera vs T-013 ("crear el worktree DESPUÉS de commitear las fases"): mismo eje temporal
(commit vs creación del worktree), caso simétrico. T-013 es el commit que llega TARDE (las fases se
commitearon después de nacer el worktree ⇒ el implementer no las vio). T-133 es el commit que llega
en MEDIO (la enmienda se commiteó en main con el worktree ya vivo ⇒ divergencia ⇒ rebase). Ambas
raíces: el worktree fotografía el HEAD del momento de su creación; todo commit posterior a ese HEAD
sobre rutas compartidas queda fuera del worktree hasta un rebase. Nota de peso: aprendizaje MENOR,
operativo; el lead pidió juzgar si merece nota — se registra como delta pequeño anclado a T-013, no
como sección de cuerpo de SKILL.md. Pendiente de decisión humana.

## 2026-07-24 · T-133 · Validaciones de reglas vigentes (contratos literales ×6 · EXPLORE §0 del planner ×3 · fixture con dato propio + R0 en coverage.include ×4 · bound no-prohibición T-032 · derivado no serializado T-132) — evidencia, no regla nueva

Cinco reglas/deltas ya vigentes recibieron evidencia positiva en T-133 (R1, IA de tesoro con
ahorro dirigido, APPROVE a la primera, 0 ciclos FIX — 4ª task consecutiva sin FIX tras
T-130/T-131/T-132); se anexan como validación, sin acuñar entrada nueva:
- **Contratos literales en los .md de fase (T-123):** plan §C persistió LITERAL los 9 `it()` con
  fixture concreto (aiFactionIds [2], getBuildings(1)=['market','barracks'], econ
  {income:5,upkeep:0,net:0.5}, ejército 4, umbral 2×2=4) y valores esperados verbatim
  (savingsGoals `[{2,'fortress',400,350}]`, keys de FactionAIState
  `['accumulator','lastDecisions','lastMarchUnitId','marchingTowardEnemy']`, "520−100 ≥ 400");
  9/9 tests T-133 verdes, suite 1150/1150 a la primera (review.md:5). 6ª evidencia consecutiva
  (T-128, T-129, T-130, T-131, T-132, T-133) de que contratos ejecutables literales → reproducción
  sin round-trip. Sin cambios al delta pendiente de T-123.
- **EXPLORE integrado como §0 del prompt del planner (T-131):** 3ª aplicación. Sin explorador
  dedicado, el planner absorbió EXPLORE como §0 con 5 premisas verificadas con `archivo:línea`
  (plan §0), incluida la CRÍTICA para el diseño gate-siempre: `recruitPass` corre ANTES que
  `buildPass` en `decide()` (:675 vs :678) ⇒ hay que derivar el coste `C` al inicio del recruit con
  helper compartido, no confiar en que buildPass ya lo calculó. Otras premisas pre-resolvieron:
  coste no vive en faction-ai ⇒ extraer `analyzeBuildTarget` + import de valor `BUILDING_CATALOG`;
  CERO puertos nuevos ⇒ AC3 v1 exacto por el guard `getBuilding` :554; `faction-ai.ts` ausente de
  `coverage.include` ⇒ añadirlo. Resultado: 0 FIX. Confirma que encargar EXPLORE nominal como §0
  con salida `file:line` previene los bloqueos en review. Sin cambios al delta pendiente de T-131.
- **Fixture que fija su propio dato + grep previo, y R0 tocado en `coverage.include` (T-129):**
  4ª aplicación PREVENTIVA (tras T-130/T-131/T-132), desde el diseño. El constraint del spec citó
  la regla T-129 ("si un fixture se ve afectado: fijar su dato, no relajar", spec §Architectural)
  y CERO puertos nuevos ⇒ sin puertos build, faction-ai se comporta EXACTO v1 (tests puros
  intactos); el reviewer confirmó "cero tests existentes tocados" (review.md:10). El diff añadió
  `faction-ai.ts` a `coverage.include` como parte de la task (plan §B), gate 96.06/92.07 (review.md:6),
  gateado de verdad. Sin cambios a los deltas pendientes de T-129.
- **Un bound acotado, no una prohibición absoluta (T-032):** el diseño final del ahorro se expresa
  EXPLÍCITAMENTE como bound citando T-032 (spec §2/§Architectural: "Es un bound, no una prohibición
  — siempre hay una vía de reclutar: válvula abierta o excedente"). Es más: la refutación de la
  sonda (suelo fraccional que oscila, ver 1ª entrada de T-133) llevó a un mecanismo que satisface
  T-032 mejor que el original — gate-siempre con válvula anti-congelación garantiza que la IA nunca
  quede en inanición militar (review.md:8-9, "sin vía de inanición no cubierta; la válvula se reabre
  al crecer buildingCount"). Evidencia de que la preferencia por cota/válvula sobre "nunca" produce
  un diseño robusto. Sin regla nueva.
- **Estado derivado no serializado se reconstruye, no se persiste (T-132):** `savingsGoal` es
  derivado POR PASADA — cero campos de snapshot, NO viaja a `FactionAIState` ("[] tras hydrate hasta
  la pasada siguiente", plan §A). AC3 test 6 gatea que `FactionAIState` no gana campos y que tras
  hydrate los goals son []. Aplicación limpia del patrón T-132 (derivado se reconstruye/recalcula,
  no se serializa). Sin cambios al delta pendiente de T-132.
- NIT anotado (auto-aplicable, no requiere aprobación): `analyzeBuildTarget` se evalúa 2×/facción/
  pasada (una en recruitPass, otra en buildPass) — cachear si el coste creciera (review.md:13,
  seed de cierre). Registrado como seed, no como deuda que bloquee.

## 2026-07-24 · T-135 · La sim descartable debe reproducir la CADENA completa del síntoma (seleccionar→ordenar→mover), no solo el VERBO reportado — PENDIENTE DE APROBACIÓN HUMANA

Refinamiento de la sección "Diagnose a reported bug with a throwaway sim before you spec
it" (T-033/T-035/T-127/T-128/T-133), NO regla nueva independiente.
Hecho concreto (T-135, R1, fix P0, 0 ciclos FIX, APPROVE sin BLOCKs): el bug reportado
jugando fue "armies get stuck and can be selected nor moved (new recruited above all)".
El VERBO saliente del reporte era "no se mueven". La sim descartable ejercitó la CADENA
completa de la interacción —seleccionar→ordenar→mover— y descubrió que el movimiento de
dominio estaba SANO (`issueMove` de una unidad apilada → true y llega a destino; una
unidad Engaging acepta `issueMove` y se desengancha, exploration.md:11-12), y que la
rotura real estaba UN PASO ANTES: `selectAt(gx,gz)` devuelve SIEMPRE la primera unidad
de la celda (units.ts:1132), así que toda unidad apilada 2ª..N era INSELECCIONABLE por
clic para siempre; el "no se mueven" era la consecuencia downstream de "no se seleccionan"
(exploration.md:6-9, cierre T-135.md:16-18). Si la sonda hubiera ejercitado solo el VERBO
reportado (`issueMove`), habría encontrado el movimiento sano y devuelto un FALSO NEGATIVO
("no reproduzco el bug"); la localización correcta (selección) exigió recorrer la cadena
entera desde el input.
Delta propuesto (extensión de la regla de la sonda descartable): un reporte de gameplay
nombra el ÚLTIMO efecto visible ("no se mueven"), no necesariamente el paso roto. La sim
descartable debe reproducir la CADENA de interacción completa que produce el síntoma
—desde el input del jugador hasta el efecto observado (aquí seleccionar→ordenar→mover)—,
no solo el verbo literal del reporte; un paso upstream sano-en-apariencia (o roto) puede
ser la causa real de un síntoma que se manifiesta downstream. Tell: antes de concluir "no
reproduce", pregunta si ejercitaste TODOS los pasos entre el input y el efecto reportado;
probar solo el verbo del reporte deja los pasos anteriores sin auditar y arriesga un falso
negativo.
Frontera vs T-127 ("reproduce el MISMO MODO DE FALLO reportado, no solo ejercita la
función bajo sospecha"): complementaria, eje distinto. T-127 es sobre el TIPO de fallo
(timeout vs aserción vs excepción — el mensaje literal filtra hipótesis). T-135 es sobre
el LOCUS/paso dentro de una interacción multi-paso: el verbo reportado quizá no nombra el
paso roto, así que la sonda debe cubrir la cadena entera, no un solo eslabón. Ambas
refinan QUÉ debe reproducir la sim; T-127 = el modo correcto, T-135 = todos los pasos de
la cadena.
Frontera vs T-035 ("clasificar tras reproducir: bug prometido vs decisión abierta"): la
cadena completa fue justo lo que HABILITÓ la clasificación (a) limpia — ver el movimiento
SANO permitió señalar que la promesa violada era la OPERABILIDAD DE LA SELECCIÓN
(T-101/T-114: toda unidad viva alcanzable por input), no el movimiento; sin recorrer la
cadena, el diagnóstico habría apuntado al mecanismo equivocado y la spec habría "arreglado"
un movimiento que no estaba roto. La colisión/occupancy de unidades al mover se clasificó
(b) decisión de diseño abierta y quedó anotada para el humano, no implementada
(T-135.md:84-86,101-102) — aplicación limpia de T-035.
Recomendación del curador: refinamiento de la sección de la sonda descartable (bloque
propio con fecha, como T-035/T-133), NO sección nueva ni delta independiente. Pendiente de
decisión humana.

## 2026-07-24 · T-135 · Validaciones de reglas vigentes (sim descartable pre-spec · clasificación (a)/(b) · contratos literales · disciplina cero-tests-existentes) — evidencia, no regla nueva

Cuatro reglas ya vigentes recibieron evidencia positiva en T-135 (R1, fix P0 de unidades
apiladas inseleccionables, APPROVE sin BLOCKs, 0 ciclos FIX); se anexan como validación,
sin acuñar entrada nueva:
- **Sim descartable ANTES de la spec (T-033):** el diagnóstico de un bug reportado jugando
  se hizo con una sim descartable (borrada, sobre la sesión real: 9 bloqueadores en
  capital+vecinos + 2 reclutas) que REPRODUJO el apilamiento + `selectAt`-primera y
  DESCARTÓ la hipótesis aparente (movimiento roto). La spec siguiente se apoyó en el HECHO
  reproducido, no en una corazonada; el fix atacó las dos causas exactas (fallback de spawn
  agotado + selección no cíclica) → 0 FIX (cierre T-135.md:95-97). N-ésima confirmación de
  la disciplina sonda-pre-spec en su disparador original (bug reportado jugando).
- **Clasificación (a)/(b) tras reproducir (T-035):** aplicada limpiamente. (a) fix de
  operabilidad de la selección = promesa T-101/T-114 violada ⇒ spec directa sin nueva
  autorización; (b) colisión/occupancy de unidades al mover = decisión de diseño nueva ⇒
  anotada y preguntada al humano sin implementar (out-of-scope, T-135.md:84-86). El tell de
  T-035 se cumplió: se pudo CITAR la promesa concreta que el hallazgo rompe (operabilidad),
  luego (a); la colisión exigiría INVENTAR una garantía nunca prometida, luego (b).
- **Contratos literales en los .md de fase (T-123):** los AC del spec fijaron escenarios
  ejecutables literales (celda con 3 unidades ⇒ 3 selectAt consecutivos en orden id asc +
  4º vuelve a la primera; repro exacto 9 bloqueadores + 2 reclutas; offset de pila radio
  ≤0.35 world, N=1 ⇒ cero) → 12 tests T-135 verdes, suite 1172/1172 (review.md:2). 7ª
  evidencia consecutiva (T-128..T-133, T-135) de que contratos ejecutables literales →
  reproducción sin round-trip. Sin cambios al delta pendiente de T-123.
- **Disciplina cero-tests-existentes-rotos (frontera T-031):** el spec AUTORIZABA invertir
  cualquier test que pinneara el comportamiento apilado antiguo (T-135.md:50-53), pero la
  verificación confirmó que el ÚNICO consumidor de `selectAt` es el clic 'select'
  (band/shift/control-groups usan `selectMany`), así que no hubo tests que invertir ni
  romper (review.md:6-9); `getUnitAt`/`getUnitsAt` intactos (consultas de lógica siguen
  deterministas). Aplicación limpia de T-031 en su caso degenerado: la inversión estaba
  AUTORIZADA por el spec pero resultó innecesaria porque ningún test pinneaba la conducta
  vieja — se cambió la semántica de `selectAt` en celdas multi-unidad sin tocar un solo
  test existente. Sin regla nueva.

## 2026-07-26 · T-140 · La sim de calibración del lead PREDICE; el diseño real MIDE — un valor determinista fuera de banda se ESCALA, no se recalibra en silencio — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-140, R0, expand fase 5 soul, 1 ciclo de ajuste E2, APPROVE): el lead
calibró el multiplicador de estrellas con una sim descartable SIMÉTRICA que predijo
strength restante 52/29/82 (4★ / 1★ / canónico). El diseño real aplica el multiplicador
de forma DIRECCIONAL (units.ts:1022-1030: `dmgToTarget ×= mult(unit.id)`, `dmgToUnit ×=
mult(target.id)` en la composición direccional, JAMÁS en `scaledDmg` que es la base
simétrica del par), y midió determinísticamente 28.47/9.05/60.27 — dentro de las bandas
de sanidad del plan (4★ 45-60, 1★ 22-36, canónico 75-90 se re-bandaron a los valores
medidos con pin ±7). El implementer NO recalibró las constantes por su cuenta: el plan
ya había PREVISTO el riesgo (Riesgo E.2: "los números 52/29/82 eran simétricos; el mult
direccional puede desviar ⇒ bandas absorben; fuera de banda ⇒ re-simular y ESCALAR al
lead antes de recalibrar") y el lead decidió que los márgenes medidos SON el mejor diseño
(1★ = ventaja fina) y ordenó re-bandar el pin, no cambiar la constante. Evidencia:
plan.md:32 (Riesgo E.2 literal), review.md:16-19 (E2 resuelto: sim 52/29/82 vs medido
28.47/9.05/60.27, "el lead aceptó los márgenes medidos como mejor diseño… ordenó re-bandar
pin ±7 con documentación en el test"), cierre T-140.md:102-103.

Delta propuesto (calibración / división de responsabilidad lead↔implementer): la sim de
calibración es una APROXIMACIÓN que fija la INTENCIÓN de diseño (orden de magnitud, quién
gana y por cuánto), no un valor de aceptación exacto. Cuando la implementación produce un
valor DETERMINISTA (sin RNG) que cae fuera de la banda de sanidad calibrada, el
implementer NO recalibra constantes para "cuadrar" con la sim: ESCALA al lead con los
valores medidos, y el lead decide si (a) la intención de diseño se cumple con la realidad
medida ⇒ re-bandar documentando la desviación en el test, o (b) la intención NO se cumple
⇒ recalibrar las constantes. La autoría de "qué número es correcto" es del dueño de la
intención (lead/humano), no del implementer que solo mide. Forma de assert recomendada
para estos valores: PIN determinista (igualdad de N decimales) + banda de sanidad
documentada, no un umbral suelto.

Frontera vs T-033/T-133 ("la sim descartable refuta un MECANISMO"): NO contradice, eje
distinto. En T-033/T-133 la sim estaba en lo CIERTO y refutaba una hipótesis de mecanismo
del diseño (el diseño estaba mal). En T-140 la sim NO estaba mal: era una aproximación
simétrica cuya DESVIACIÓN respecto al diseño direccional (correcto) el propio diseño
absorbió con bandas+pins. T-033/T-133 = la sim corrige el diseño; T-140 = el diseño mide
una realidad distinta-pero-válida que la sim solo aproximaba, y el lead re-banda. El tell
que los separa: ¿la divergencia revela un mecanismo ERRÓNEO (⇒ T-033, recalibrar/rediseñar)
o solo la brecha esperada entre una aproximación y la mecánica real (⇒ T-140, re-bandar)?
Frontera vs T-035 ("autorar una promesa nueva es del humano"): misma disciplina de fondo
—no autoauto­rizarse a decidir qué es "correcto"—, aplicada aquí a QUÉ VALOR satisface la
intención de calibración, no a si un hallazgo es bug. Pendiente de decisión humana.

## 2026-07-26 · T-140 · Los prompts de fase deben ser AUTO-CONTENIDOS para que un relevo desde cero no pierda nada — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto de proceso (T-140): el primer planner murió sin entregar tras 2 ciclos +
ultimátum. En vez de rescatar su trabajo parcial, se hizo un RELEVO LIMPIO desde cero
(plan2-t140) con el MISMO prompt enriquecido — las constantes ya calibradas por el lead,
EXPLORE encargado como §0. El relevo entregó un plan MEJOR que el original: cazó el punto
DIRECCIONAL del multiplicador (que debía ir en la composición direccional units.ts:951-955,
no en `scaledDmg` simétrico) que es justo la sutileza que hizo pasar la task. Evidencia:
plan.md:1-2 ("persistido LITERAL del planner de relevo plan2-t140"), cierre T-140.md:104
("el primer planner murió sin entregar — relevo limpio"), review.md:16-19 (el diseño
direccional correcto que atrapó el relevo).

Delta propuesto (orquestación, gestión de agentes muertos): cuando un agente de fase muere
o cuelga sin entregar tras el ultimátum, la respuesta correcta es RELEVAR desde cero con el
MISMO prompt, no intentar rescatar output parcial. Precondición para que esto no pierda
nada: los prompts de fase deben ser AUTO-CONTENIDOS —incluir todo el contexto acumulado
(constantes ya calibradas, EXPLORE encargado, contratos literales de fases previas)— de
modo que un relevo arranque con exactamente la misma información que el agente original y
pueda igualar o superar su resultado. Un prompt que dependa de estado que solo vivía en la
cabeza del agente muerto convierte su muerte en pérdida de contexto. Tell: si al relevar
tuvieras que reconstruir algo que el agente muerto "ya sabía", ese algo faltaba en el
prompt y es deuda de auto-contención. Conecta con T-013 (las fases se commitean/persisten
antes del worktree para que el siguiente agente las vea) y con T-123 (contratos literales
en los .md de fase): ambas son la misma disciplina de que el contexto viva en el ARTEFACTO/
PROMPT, no en el agente. Aprendizaje MENOR, operativo. Pendiente de decisión humana.

## 2026-07-26 · T-136–T-140 · Validaciones de reglas vigentes del bloque militar (mandato soul, fases 1-5) — evidencia, no regla nueva

Seis reglas/patrones ya vigentes recibieron evidencia positiva en el bloque T-136..T-140
(todas cerradas y mergeadas; T-137/T-138/T-139/T-140 con 0-1 ciclos FIX); se anexan como
validación, sin acuñar entrada nueva:
- **Identidad v1 por ESPEJO como patrón de migración incremental (frontera T-031/T-137):**
  4 aplicaciones consecutivas. T-137 (fichas cantidad/calidad/veteranía), T-138 (reclutamiento
  por lotes), T-139 (comandantes+logística) y T-140 (estrellas+poderes) introdujeron mecánica
  nueva GRANDE conservando el juego numéricamente IDÉNTICO a v1 mediante dos técnicas juntas:
  (a) identidad algebraica exacta (multiplicadores nuevos entran por `maxStrength` derivado o
  por puertos opcionales que ausentes ⇒ ×1 bit-idéntico) y (b) TEST ESPEJO que ejecuta el
  camino real contra el fixture v1. En T-140 el reviewer verificó "identidad ×1 bit-idéntica"
  y "espejo v1 verbatim" (review.md:8-13, test 9). Patrón robusto para expandir un sistema
  vivo sin regresión: cero de los 1172→1255 tests existentes tocados por conducta. Sin regla
  nueva; refuerza que "expandir ≠ romper" cuando lo nuevo es opt-in con identidad demostrada.
- **EXPLORE integrado como §0 del prompt del planner (T-131):** aplicado en todo el bloque;
  en T-140 el §0 pre-resolvió la decisión CRÍTICA (multiplicador direccional en :951-955 vs
  base simétrica :920-927) con `archivo:línea`, que fue justo lo que evitó el bug. 0 FIX de
  diseño. Sin cambios al delta de T-131.
- **R0 tocado/nuevo en `coverage.include` desde el diseño (T-129):** T-140 añadió `abilities.ts`
  al gate de cobertura como parte de la task (units 94.78 / commanders 90.9 / abilities 92.5,
  todas ≥90, review.md:8). T-139 registró ambos módulos nuevos ≥90. Aplicación preventiva.
- **Purga sin huérfanos al dar persistencia (T-036):** T-139 ató la muerte del comandante a
  la muerte de su unidad con purga explícita en el mismo tick + ids nunca reciclados, con TEST
  ESTRELLA que verifica que el huérfano no puede existir (AC1, T-139.md:70-72). Aplicación
  canónica de T-036 en un módulo nuevo con estado persistido. T-140 mantuvo el patrón
  (`removeUnit` borra la entrada de `damageDealt`). Sin cambios.
- **Contratos literales en los .md de fase (T-123):** racha ~10 tasks consecutivas. En T-140
  el plan §C persistió los 14 `it()` con escenarios, ids/celdas, umbrales exactos (119.9⇒0,
  120⇒1, 300⇒2, 600⇒3, 1000⇒4, 1500⇒4) y pins de 9 decimales — reproducidos sin round-trip.
  Sin cambios al delta pendiente de T-123.
- **Sim descartable pre-spec para diagnosticar un bug reportado jugando (T-033/T-127/T-135):**
  T-136 (fix P0, IA paralizada) se diagnosticó con la sonda descartable `sim-ia-parada` que
  discriminó 4 hipótesis por corridas de control (ímpetu, cadencia y niebla descartados; la
  BARRERA de alcanzabilidad reprodujo la parálisis total 0/0 decisiones/desplazamiento,
  T-136.md:10-19,81-83). La spec siguiente se apoyó en el hecho reproducido ⇒ 0 FIX. N-ésima
  confirmación; el fix además expresó el escalón de candidatos como BOUND `MARCH_CANDIDATES_MAX
  =15` (no scan ilimitado) citando T-032. Sin regla nueva.

Nota de curación (posible promoción, decisión del humano): "PIN determinista + banda de
sanidad documentada como forma de assert para un valor MEDIDO determinista" (T-140) es una
técnica de test que hoy vive implícita en el clúster de calidad de test (T-030 "un test solo
gatea lo que puede discriminar"). Recomendación: NO acuñar entrada independiente todavía —
una sola ocurrencia; se registra aquí como evidencia. Si reaparece en otra task de
calibración, promoverla a refinamiento del clúster T-030. Pendiente de decisión humana.

## 2026-07-26 · T-141 · Una feature de dominio invocable por el jugador puede quedar INALCANZABLE desde el input/UI con toda su pila de tests en verde: la fase de integración verifica la alcanzabilidad end-to-end — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-141, R2, capa visual provisional del ejército, 0 ciclos FIX, APPROVE a la
primera, cierra el MANDATO SOUL fase 6): los poderes de mando `cmd_arenga`/`cmd_assault`
introducidos y mergeados en T-140 estaban COMPLETAMENTE testeados (identidad ×1 bit-idéntica,
espejo v1, 14 `it()` con pins de 9 decimales) pero eran INJUGABLES. El adapter resuelve la
tecla QWER con `abilityForType(tipo exacto)` (main.ts:1758, flujo :1689-1766) y las defs
`cmd_*` declaran `unitType:'any'` ⇒ `abilityForType` devuelve `null` ⇒ `report(false)`: el
poder nunca se lanzaba pese a que la sesión SÍ lo soporta (campaign-session :1542-1563). Los
tests de T-140 llamaban `issueAbility` DIRECTO, saltándose la vía de input real, así que
ninguno podía atrapar la brecha. Lo detectó el EXPLORE §0.2 de la fase de integración visual
(plan.md:6, "HALLAZGO CLAVE: poderes de mando BLOQUEADOS hoy"), no un test; T-141 lo desbloqueó
en R2 con un fallback `commandAbilityIdForSlot(slot)` (W→cmd_arenga, R→cmd_assault) probado
cuando `abilityForType` da null, con la sesión como único gate. Evidencia: plan.md:6/16 (B3.3),
T-141.md:88-91 (cierre: "los poderes de T-140 eran inalcanzables desde el adapter… lección: la
fase de integración visual verifica alcanzabilidad end-to-end").

Delta propuesto (EXPLORE/PLAN + AC de spec + fase de integración): cuando una T de dominio
añade una CAPACIDAD INVOCABLE POR EL JUGADOR (un poder, una orden, una acción de input), que
toda su pila de tests esté verde NO garantiza que sea alcanzable — los tests suelen invocar la
capacidad por la API directa (`issueAbility`) y saltarse la resolución de input real
(tecla→`abilityForType`→id), que es justo donde puede romperse el cableado. Dos exigencias:
(1) la spec de esa T de dominio debe incluir un AC de ALCANZABILIDAD por la vía de input real
(no solo por la API directa), o (2) si esa T no lo cubre, la fase de integración/visual
posterior HEREDA como obligación explícita verificar la alcanzabilidad end-to-end desde el
input hasta el efecto, y su EXPLORE §0 enumera cada capacidad nueva de dominio y traza su
camino de input completo. Tell: si el único test que ejercita la capacidad la invoca por su API
y ningún test recorre el resolvedor de input, la alcanzabilidad está SIN GATEAR — verde no es
jugable.

Frontera vs T-135 ("la sim reproduce la CADENA completa seleccionar→ordenar→mover, no el verbo
reportado"): MISMA FAMILIA (capacidad de dominio inalcanzable por la vía de input real), dos
disparadores distintos. En T-135 la rotura de alcanzabilidad (unidad apilada inseleccionable
por `selectAt`-primera) se manifestó como un BUG REPORTADO jugando y se diagnosticó con una sim
descartable de la cadena de input; en T-141 la capacidad nunca se conectó (defs 'any' que el
adapter nunca resolvía) y NO hubo bug reportado ni sim — lo cazó el EXPLORE de la fase de
integración leyendo el resolvedor de input. Comparten la promesa de OPERABILIDAD/alcanzabilidad
por input (T-101/T-114: toda capacidad viva alcanzable desde el input real). T-135 es reactivo
(síntoma jugado → sonda de la cadena); T-141 es preventivo (fase de integración → auditoría de
alcanzabilidad de cada capacidad nueva). El eje nuevo que T-141 aporta: una feature puede nacer
inalcanzable y quedarse así indefinidamente porque su suite verde nunca tocó el input — no hace
falta que se "rompa" nada (a diferencia de una regresión), basta con que jamás se conectara.
Frontera vs identidad-v1/espejo (T-137–T-140): ortogonal. El patrón espejo demuestra "expandir
≠ romper" (cero regresión numérica); aquí NADA se rompió ni divergió — la mecánica era
correcta y bit-idéntica, simplemente NUNCA se cableó al input. Ningún test de identidad/espejo
puede atrapar esto porque no hay desviación de comportamiento que medir, solo un camino de
input ausente. Frontera vs T-127 ("reproduce el MISMO MODO DE FALLO"): distinta — T-127 es un
modo de fallo (timeout vs aserción) mal leído sobre código que SÍ se ejecutaba; T-141 es código
correcto que el input NUNCA ejecuta. Raíz común con T-030 ("un test solo gatea lo que puede
discriminar"): un test que invoca la capacidad por su API directa no puede discriminar si el
input la alcanza — es un gate blando de alcanzabilidad.
Recomendación del curador: entrada NUEVA (mecanismo no cubierto: alcanzabilidad end-to-end de
una capacidad de dominio como obligación de la fase de integración + AC de spec), con la
frontera explícita frente a T-135 (misma familia, disparador reactivo vs preventivo). NO
evidencia bajo T-135. Pendiente de decisión humana.

## 2026-07-26 · T-141 · Validaciones de reglas vigentes (EXPLORE §0 del planner · contratos literales · capa provisional T-134 · prompt auto-contenido · inversión autorizada por el plan) — evidencia, no regla nueva

Cinco reglas/patrones ya vigentes recibieron evidencia positiva en T-141 (R2, 0 ciclos FIX,
APPROVE a la primera); se anexan como validación, sin acuñar entrada nueva:
- **EXPLORE integrado como §0 del prompt del planner (T-131):** el §0 del plan (plan.md:5-8, 4
  premisas con `archivo:línea`) fue justo lo que CAZÓ la brecha de alcanzabilidad (§0.2, el
  delta nuevo de arriba) ANTES del contrato, además de pre-resolver: ningún test pinnea details
  de army ⇒ campos nuevos OPCIONALES sin inversión (§0.1); WIP sin commit de Codex en
  index.html ⇒ sección económica por JS, no editar HTML (§0.3); army-visuals soporta scale/tinte
  a coste cero (§0.4). Sin explorador dedicado, el planner absorbió EXPLORE. Confirma que el §0
  nominal con salida `file:line` previene bloqueos en review; aquí destapó un bloqueo de
  ALCANZABILIDAD, no solo de datos/firmas. Sin cambios al delta de T-131.
- **Contratos literales en los .md de fase (T-123):** plan.md se persistió LITERAL ("persistido
  LITERAL del planner plan-t141", :1-2) con los detalles PROVISIONALES verbatim del inspector
  (`Ficha · Infantería 800/1000 · Oro`, `Veteranía · 4★ (máx)`, `Mando · Aldric 4★`), los
  valores del mapeo puro (`(4,4,true) ⇒ {1.32, 4, 0xffd35a}`) y los 11 `it()` con escenarios
  concretos (§C); reproducidos → 11/11 T-141 verdes, suite 1266/1266 a la primera (review.md:3).
  ~11ª evidencia consecutiva de que contratos ejecutables literales → reproducción sin
  round-trip. Sin cambios al delta pendiente de T-123.
- **Capa provisional testeada por el backend (patrón T-134, trade-visuals):** 2ª reutilización
  limpia. El backend hizo el MÍNIMO FUNCIONAL PROVISIONAL (parte PURA testeable
  `rankVisualParams(stars,vet,buff)` + three simple, todo marcado PROVISIONAL(T-141) para que
  Codex pula la estética) sin rediseñar UI por iniciativa propia — respeta el reparto de roles
  de CLAUDE.md y el precedente T-134. La separación pura/impura permitió AC2 como test puro
  determinista (valores literales). Sin regla nueva; refuerza el patrón "capa provisional pura
  testeable + acabado estético diferido a Codex" como forma robusta de que backend entregue UI
  funcional sin acoplarse a la presentación.
- **Prompt de fase AUTO-CONTENIDO que sobrevive al relevo (T-140):** el plan se persistió
  auto-contenido (constantes, contratos literales, EXPLORE §0 encargado) de modo que sobrevivía
  a un relevo desde cero — misma disciplina validada en T-140 (relevo limpio del planner
  muerto). Aplicación limpia; sin cambios al delta de T-140.
- **Inversión/ajuste AUTORIZADO derivado del propio plan (frontera T-031):** el pin de capas de
  render 15→16 (por la nueva capa `vetPips`) y los pips escalados con el asta fueron
  DESVIACIONES legítimas porque el propio plan las derivó y el reviewer las validó como tales
  (review.md:8-9). Es un ajuste estructural autorizado por el diseño, no un atajo para pasar el
  gate — mismo tell de T-031 (el cambio está autorizado por el spec/plan, no silencia una
  verificación). Sin regla nueva.

Nota (sin delta): no hubo subjective criteria (estética diferida a Codex), un solo SHOULD
cosmético para Codex (el tinte de buff persiste hasta el siguiente sync, event-driven,
review.md:10-11), anotado como seed, no como deuda que bloquee. Sin conflicto con ninguna regla
vigente (hard rule 2): el delta de alcanzabilidad no contradice ninguna entrada previa.

## 2026-07-26 · T-150 · Una métrica LOCAL centrada en un objetivo puede EXCLUIR geométricamente a una entidad de referencia que SIEMPRE debe contar (la propia evaluadora): enumerar quién cae fuera de la ventana — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-150, R0, 0 ciclos FIX, APPROVE a la primera): `localRatio(unit, cx, cz)`
mide la fuerza propia dentro de una ventana Chebyshev ≤ `AI_STRENGTH_RADIUS`=8 CENTRADA EN LA
CELDA DEL OBJETIVO. La unidad que EVALÚA la decisión puede estar más lejos que 8 de su propio
objetivo (marcha larga) ⇒ quedaría FUERA de la ventana y su fuerza NO se contaría ⇒ el ratio
propio caería artificialmente ⇒ IA PACIFISTA que nunca ataca objetivos lejanos ("bug nº 1"). El
planner lo cazó EN DISEÑO (no en review): plan §A fija "la fuerza propia SIEMPRE incluye a la
evaluadora aunque quede fuera del radio del objetivo (evita IA pacifista con objetivos lejanos
— bug nº 1)"; Riesgo 1 (plan.md:33) lo vigila con AC1a-contraste + wiring-test; el reviewer
verificó "localRatio incluye siempre a la evaluadora (bug nº1 fijado, cubierto AC1a-contraste/
AC1c)" (review.md:7). La ventana centrada en el objetivo es correcta para la fuerza HOSTIL
(fuerza local del enemigo en su celda), pero para la fuerza PROPIA de referencia la evaluadora
es un participante obligatorio que la geometría de la ventana no garantiza incluir.
Delta propuesto (EXPLORE/PLAN, diseño de métricas con ventana): cuando una métrica se agrega
sobre una VENTANA (radio espacial, rango temporal, top-K) CENTRADA EN UN OBJETIVO, enumerar qué
entidades de REFERENCIA deben contar SIEMPRE con independencia de la ventana —típicamente la
propia entidad que evalúa/actúa— y verificar que la geometría de la ventana no las excluya. Una
entidad de referencia puede caer fuera de una ventana centrada en OTRO punto (la evaluadora
lejos de su objetivo) y ser omitida en silencio, sesgando la métrica hacia un extremo (aquí:
ratio propio infravalorado ⇒ conducta pacifista). Tell: por cada métrica con ventana, preguntar
"¿la entidad desde cuya perspectiva se decide está garantizada dentro de la ventana?"; si no,
incluirla explícitamente al margen del filtro geométrico. Test discriminante obligatorio: un
escenario donde la evaluadora esté FUERA del radio de su objetivo debe seguir produciendo la
conducta correcta (contraste AC1a).
Frontera vs T-026 ("rol por negación `!== A` se rompe con N>2 actores"): ortogonal, no duplica.
T-026 es un predicado de PERTENENCIA mal formulado (inferir un rol por exclusión) que mete a una
tercera entidad en el bucket equivocado. T-150 es una entidad de referencia CORRECTAMENTE
clasificada pero geométricamente FUERA de la ventana de agregación —no es un error de categoría
sino de COBERTURA de la ventana—. Ambas: una entidad que "debería contar de otra forma" cae en
el lado equivocado, pero por ejes distintos (categoría vs alcance de la ventana).
Frontera vs identidad-v1/puerto-opcional-identidad: ortogonal — aquel gobierna que la conducta
nueva sea opt-in bit-idéntica; este gobierna que, una vez encendida, la métrica que la alimenta
no se auto-sabotee excluyendo a su propio actor. No contradice ninguna regla previa (hard rule 2).
Recomendación del curador: entrada NUEVA (mecanismo no cubierto: cobertura de la ventana de una
métrica local respecto a su entidad de referencia). Peso MENOR-MEDIO — una sola ocurrencia, pero
cazada en diseño con test discriminante y generaliza a cualquier métrica con ventana (perf local,
moral local, densidad, top-K). Pendiente de decisión humana.

## 2026-07-26 · T-150 · Validaciones de reglas vigentes (identidad-v1 por clon de ruta pineada · sim predice/diseño mide con calibración fina diferida · contratos literales · bound no-prohibición T-032) — evidencia, no regla nueva

Cuatro reglas/patrones ya vigentes recibieron evidencia positiva en T-150 (R0, fase 1 del plan
IA, APPROVE a la primera, 0 ciclos FIX); se anexan como validación, sin acuñar entrada nueva:
- **Identidad v1 / clon deliberado de ruta pineada (puerto-opcional-identidad + T-137–T-140):**
  `tryRetreat` = CLON LITERAL del loop de capitales de `tryMarch` (owner===factionId, sin
  truncate, mismo presupuesto 15) en vez de refactor compartido, para no tocar las rutas con
  pins de faction-ai; toda la conducta nueva gated por `getStrengthOf?` ausente ⇒ v1
  byte-idéntico (6 archivos de pins verdes SIN tocar + espejo deep-equal, review.md:5-7).
  Aplicación limpia del patrón "expandir sin romper por opt-in + clon de la ruta pineada". Sin
  regla nueva.
- **Sim de calibración PREDICE, diseño real MIDE (T-140):** las constantes 8/0.7/0.45/30 se
  fijaron DIRECCIONALMENTE con sim descartable pre-plan y la calibración FINA se DELEGÓ explícita
  a una sim end-to-end posterior (plan §E Riesgo 1: "constantes calibrables en T-157"). Mismo eje
  que T-140 (el juguete aproxima la intención; el motor real la mide/afina después); el matiz de
  T-150 es que la afinación se DIFIERE a una task E2E dedicada en vez de re-bandar in situ. Sin
  regla nueva; refuerza el delta pendiente de T-140.
- **Contratos literales en los .md de fase (T-123):** plan §C persistió LITERAL los contratos de
  test (ids/celdas/strength/ratios exactos, `0.7 EXACTO ⇒ ataca` por veto `<` estricto, goals y
  pathLength verbatim) → 22/22 T-150 verdes a la primera. N-ésima evidencia consecutiva. Sin
  cambios al delta pendiente de T-123.
- **Un bound acotado, no una prohibición absoluta (T-032):** los umbrales se expresan como bounds
  calibrables citando T-032 (spec §Architectural: "los umbrales son bounds calibrables, no
  prohibiciones; la retirada exige AMBAS condiciones — moral baja Y ratio malo"). Aplicación
  limpia; sin cambios al delta pendiente de T-032.

## 2026-07-26 · T-151 · Validaciones de reglas vigentes (inversión autorizada de key aditiva ×2 · puerto-opcional-identidad · bound inclusivo ambos lados · EXPLORE premisa de datos + spec-condicionada · stale plan · sim direccional · contratos literales · R0 en coverage.include) — evidencia, no regla nueva

Cerebro estratégico v1 (R0, fase 2 del bloque IA T-150–T-157, APPROVE a la primera, 0 ciclos
FIX). Ninguno de los tres candidatos evaluados por el lead acuña regla nueva; los tres son
evidencia de reglas vigentes. Se anexan como validación, sin acuñar entrada nueva:

- **Candidato 1 — Inversión AUTORIZADA de una key aditiva de snapshot (refinamiento T-130 bajo
  T-129 + T-031):** los tests de lista EXACTA de keys de `exportState` (campaign-session-wealth
  T-129 AC4, -trade T-132 AC4) rompen POR CONSTRUCCIÓN con cualquier campo aditivo; la corrección
  legítima fue +1 línea `'aiStrategy'` en cada lista (implementation.md:17-18, review.md:5), el
  MISMO patrón que T-140 aplicó con `'unitBuffs'` (commit 179a25b, verificado). 2ª ocurrencia
  limpia del disparador "campo nuevo al snapshot ⇒ inversión de assert AUTORIZADA Y PREVISTA en el
  plan" que el refinamiento T-130 ya codifica (cambio a estructura compartida que otros tests
  aseran ⇒ inversión de la lista de keys por orden del spec, escenario aún aserido, T-031). Juicio
  del curador: NO merece delta propio. La sugerencia "diseñar el pin como SUBCONJUNTO (toContain)
  para que los campos aditivos no lo rompan" es una OPINIÓN de diseño, no un HECHO de T-151 —
  ambas ocurrencias (T-140, T-151) corrigieron por inversión +1, ninguna rediseñó el pin como
  subconjunto (hard rule 1: sin evidencia, no delta). Evidencia del refinamiento T-130, no regla
  nueva.
- **Candidato 2 — El bound declara su lado inclusivo y se testea a AMBOS lados (T-032 + T-030):**
  el plan declaró el lado del límite (≥ INCLUSIVE) para CADA umbral y exigió tests discriminantes
  a ambos lados: attack `ownTotal ≥ 1.3×defensa` con 130≥130 ⇒ attack vs 129<130 ⇒ consolidate
  (plan §C AC1-bound); defend `hostile ≥ 0.9×defensa` con 180≥180 ⇒ defend vs 179 ⇒ attack (§C
  AC1-defend contraste). Es la aplicación limpia de T-032 (umbrales como bounds calibrables, no
  prohibiciones — spec §Architectural cita T-032) reforzada por T-030 (el test solo discrimina el
  lado del bound si el fixture ejerce ambos lados). Ya cubierto por T-032 + T-030 + contratos
  literales; sin regla nueva.
- **Candidato 3 — EXPLORE refuta una premisa de DATOS y la reducción de alcance ya estaba
  PRE-AUTORIZADA por el spec (T-015 + T-131):** EXPLORE §0.2 refutó "existen regiones neutrales"
  contra el catálogo real (`region-catalog.ts:26` valida que TODA región tenga `factionId`
  conocido, throw en :38 si no) ⇒ la postura `'expand'` quedó SOLO reservada en el tipo,
  documentada, sin implementar. Clave: NO fue una reducción de alcance sin re-spec, sino una rama
  que el PROPIO spec condicionó de antemano ("`expand` queda reservado en el tipo SI EXPLORE
  confirma que no existen regiones neutrales — documentar", T-151.md:32-33). Es T-015 (EXPLORE
  verifica la premisa de DATOS que el diseño asume) + T-131 (premisa que el spec CONDICIONA a
  "verificar en EXPLORE" se encarga como §0 con `archivo:línea` — aquí region-catalog.ts:26). El
  spec pre-autorizó el fallback ⇒ la refutación reduce alcance sin re-spec porque la autoría de
  esa rama ya estaba en el spec (contrasta con T-035(b): autorar/quitar alcance sin autorización
  previa es del humano; aquí el spec ya lo autorizó). Juicio del curador: NO es variante nueva de
  EXPLORE-premisas; evidencia de T-015 + T-131.

Validaciones adicionales (mismas reglas del bloque IA T-150, aplicación limpia):
- **puerto-opcional-identidad + espejo (T-137–T-140/T-150):** `getPlan?` ausente ⇒ faction-ai
  byte-idéntico v1 (diff = 3 aditivos: import type, puerto, reorden gated tras el sort); espejo
  deep-equal 4 keys v1 + 7 suites de pins verdes SIN tocar (review.md:5-6). Sin regla nueva.
- **Stale plan ⇒ v1 sin throw (T-036):** target muerto/conquistado ⇒ no pasa el filtro de owner
  ⇒ `findIndex` -1 ⇒ orden v1, la re-deliberación limpia (plan §Punto quirúrgico, review.md:6).
  Aplicación canónica del ciclo de vida de estado stale de T-036.
- **Sim direccional PREDICE, calibración fina DIFERIDA (T-140/T-150):** constantes 1.3/0.9/6
  fijadas DIRECCIONALMENTE con sim descartable pre-plan (calibration.md, Lanchester), afinado
  final delegado al duelo E2E T-157 — el juguete no calibra fino (cita T-150). Sin regla nueva.
- **Contratos literales (T-123) + R0 en coverage.include (T-129):** plan §C persistió LITERAL
  los contratos de 26 tests (ids/celdas/strength/rally=path[floor(len/2)]/goals verbatim) →
  26/26 T-151 verdes a la primera, 0 round-trip; `ai-strategy.ts` registrado en coverage.include
  como parte de la task (98.59/100/95.23/98.24). N-ésima evidencia consecutiva. Sin cambios a los
  deltas pendientes de T-123/T-129.

Sin conflictos con reglas vigentes (hard rule 2): ningún hallazgo de T-151 contradice una entrada
previa. Resultado neto: SIN deltas nuevos que requieran aprobación humana.

## 2026-07-26 · T-152 · Un invariante GLOBAL (por-pasada) implementado como LOCAL (por-invocación) coincide solo por cardinalidad 1: la task que sube la cardinalidad debe REIFICARLO explícitamente — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-152, R0, 0 ciclos FIX, 1 escalada legítima, APPROVE): el spec fijaba el
presupuesto como GLOBAL "`AI_FINDPATH_BUDGET = 15` TOTAL por pasada" (T-152.md:26-27). EXPLORE
§0.2 (plan.md:7) refutó la premisa de IMPLEMENTACIÓN: hoy el presupuesto NO es por pasada sino
POR INVOCACIÓN —`let budget = MARCH_CANDIDATES_MAX` local en tryMarch (:521) y tryRetreat
(:678)—; solo EQUIVALE a "por pasada" porque hoy hay 1 invocación de marcha por pasada. La
propia task subía esa cardinalidad a K=3 marchas/pasada; con el diseño naïf (cada tryMarch con
su budget local) el coste habría sido 3×15 = 45, rompiendo en silencio el invariante que el
spec creía ya garantizado ("coste no sube respecto a v1"). El diseño lo REIFICÓ: `budget` pasó
a una referencia compartida `{ remaining }` creada UNA vez en decide() y pasada a tryRetreat +
todas las tryMarch, de modo que el techo de 15 es del CONJUNTO de la pasada. Byte-idéntico en
v1 (único consumidor por pasada). El AC lo gatea contablemente: plan attack + 5 unidades ⇒
findPath total ≤15 con spy, y el caso "presupuesto agotado: 16 sites ⇒ findPath === 15 EXACTO
(no 45)" (T-152.md:66-67, plan §C1). Evidencia: plan.md:7,12,29; cierre T-152.md:97.

Delta propuesto (EXPLORE/PLAN, invariantes con ventana de agregación temporal): cuando una task
MULTIPLICA la cardinalidad de una unidad de trabajo (1 invocación/pasada → K; 1 tick → varios;
1 entidad → N), EXPLORE debe enumerar qué invariantes que el spec enuncia como GLOBALES
(por-pasada, por-turno, por-frame, por-par) están HOY implementados como invariantes LOCALES
(por-invocación, por-entidad) que solo coinciden con el global porque la cardinalidad actual es
1. Al subir la cardinalidad, esa coincidencia se rompe en silencio y el presupuesto/límite
global debe REIFICARSE en un acumulador compartido con el alcance correcto (referencia única
por pasada), no replicarse por invocación. Tell: si el spec dice "≤N por PASADA" pero el código
lo impone con un contador RE-INICIALIZADO en cada llamada, el "por pasada" es una ilusión de la
cardinalidad 1; en cuanto haya K llamadas serán K×N. Test obligatorio: spy que cuenta el
recurso a nivel de PASADA (no de invocación) con la cardinalidad NUEVA y afirma el total exacto
(aquí `=== 15`, no `=== 45`).

Frontera vs T-015/T-029 ("EXPLORE verifica las premisas del spec, no solo los puertos"): mismo
clúster, objeto distinto —refinamiento con mecanismo propio—. T-015 verifica premisas de DATOS
(cardinalidades/owners reales del artifact); T-029 premisas de COMPLEJIDAD (qué es lo difícil).
T-152 verifica el ALCANCE de un invariante (global vs local) y su fragilidad ante un cambio de
cardinalidad que la MISMA task introduce: no es "¿el dato existe?" ni "¿qué cuesta?" sino "¿este
límite es realmente por-pasada o solo lo parece porque hoy se invoca una vez?". Frontera vs
T-014 ("presupuestar el puerto caro + test que cuenta llamadas"): T-152 es el caso donde ese
presupuesto YA existía pero con el ALCANCE equivocado (por-invocación) que una task de mayor
cardinalidad destapa; comparte la preferencia por la cota contable de T-014/T-032. Frontera vs
T-023 ("proporcional a X que decae ⇒ grep todas las llamadas a tick"): ortogonal —T-023 es un
valor que DECAE reevaluado por llamada; T-152 es un presupuesto que ACUMULA cuyo contador se
RE-INICIALIZA por llamada—; ambas raíces "múltiples invocaciones exponen un supuesto oculto de
invocación única", ejes distintos (decaimiento temporal vs alcance del acumulador).
Recomendación del curador: entrada NUEVA (mecanismo reutilizable no cubierto: reificación de un
invariante global al subir la cardinalidad). Peso MEDIO —una ocurrencia, pero cazada en EXPLORE
con test contable y generaliza a cualquier presupuesto/límite agregado sobre una ventana cuya
cardinalidad de emisores puede crecer. Pendiente de decisión humana.

## 2026-07-26 · T-152 · Refinamiento de T-130: en cadenas multi-fase de SUPERSESIÓN, el pin e2e CONDUCTUAL de la fase N-1 pinea la conducta transitoria que N elimina — se grep-ea en el PLAN de N, no aflora en verify — PENDIENTE DE APROBACIÓN HUMANA

Refinamiento del delta T-130 (bajo T-129: "'ningún test se toca' es premisa a VERIFICAR con
grep, no a declarar; la inversión del assert es paso AUTORIZADO Y PREVISTO en el plan"), con un
disparador NUEVO —pin e2e conductual de una fase hermana en una cadena de supersesión—, NO
entrada independiente (decisión del lead 2026-07-26: mismo eje "quién depende de lo que cambio +
inversión prevista", evita bloat).
Hecho concreto (T-152, R0, 1 escalada legítima): el plan declaró la premisa "espejo + los 8
archivos de pins verdes SIN tocar" (T-152.md:48-49, AC3). Era FALSA para UN assert: el e2e
T-151 `campaign-session-ai-strategy.test.ts:117` ("tras la frontera la IA sondea primero la
capital del plan", `goals[0]==='12,4'`) pineaba la conducta PRE-coordinación —el goteo directo a
la capital— que ESTA task supersede DELIBERADAMENTE: la unidad assault a Chebyshev 6 > 4 del
rally ahora converge PRIMERO al rally (`goals[0]==='6,4'`), que es exactamente el goteo que
T-152 corrige. El implementer, cuyo mandato PROHIBÍA editar tests existentes, se BLOQUEÓ y
escaló con 3 opciones analizadas + recomendación en vez de improvisar; el lead autorizó la
opción 1: inversión EN SITIO de ese único e2e (T-031), mismo escenario con expectativa nueva +
comentario que documenta la supersesión, resto del archivo intacto (la propiedad de reorden
T-151 sigue pineada a nivel unitario en faction-ai-plan.test.ts, que NO se toca). Evidencia:
plan.md:153-169 (enmienda del lead), review.md:10 ("inversión = EXACTAMENTE lo autorizado, 2
ediciones, ningún otro test tocado, diff --stat verificado"), cierre T-152.md:95.

Delta propuesto (PLAN de una fase en cadena de supersesión): en un bloque multi-fase donde cada
fase SUPERSEDE conducta de la anterior (aquí IA T-150→T-157), el PLAN de la fase N debe GREP-ear
los tests e2e/integración que las fases N-1..1 introdujeron para localizar pins sobre la
conducta que N cambia —los pins e2e de la fase inmediatamente anterior son especialmente
propensos a codificar conducta TRANSITORIA que existía solo porque N aún no había aterrizado—.
"Los pins de las fases previas siguen verdes sin editar" es una premisa a VERIFICAR con grep en
el plan de N, no a DECLARAR; toda inversión necesaria se lista como paso AUTORIZADO Y PREVISTO
(T-031: invertir en sitio, no borrar), no como sorpresa que aflora en verify y bloquea al
implementer. Tell: si la fase N cambia una conducta de gameplay end-to-end y un e2e de la fase
N-1 la ejercita, ese e2e casi seguro pinea el valor viejo; identifícalo en el plan.

Frontera vs T-130 (refinamiento bajo T-129: "grep previo de fixtures que dependen de la
estructura compartida + inversión del assert como paso previsto"): MISMO eje "¿quién más depende
de lo que cambio?", disparador distinto. T-129/T-130 es DATO/ESTRUCTURA compartida (valor de
catálogo por id; lista de keys del snapshot) que otros tests aseran con su valor viejo. T-152 es
CONDUCTA end-to-end que un e2e de una fase HERMANA pinea, y que esta fase supersede por diseño
—no un dato ni una forma de estructura, sino un comportamiento de gameplay—; el matiz nuevo es
que en una CADENA DE FASES la supersesión es la norma, así que "pins previos verdes" es
predeciblemente falso siempre que N toque una conducta que un e2e de N-1 recorría. Frontera vs
T-031 ("revertir a propósito INVIERTE el test, no lo borra"): T-031 gobierna la RESOLUCIÓN
(cómo) y se aplicó limpio; este delta gobierna la DETECCIÓN TEMPRANA (cuándo/dónde) —anticiparlo
en el plan de N en vez de que lo descubra el implementer bloqueado en verify—.
Decisión de plegado (lead 2026-07-26): se PLIEGA como refinamiento de T-130, NO como entrada
nueva —mismo eje "quién depende de lo que cambio + inversión prevista", disparador nuevo "pin
e2e conductual de fase N-1 en cadena de supersesión multi-fase"—, para evitar skill-bloat. La
parte de RESOLUCIÓN es evidencia limpia de T-031, no regla nueva. Pendiente de aprobación humana
como refinamiento de la entrada T-130 (junto al resto de la pila PENDIENTE).

## 2026-07-26 · T-152 · Validaciones de reglas vigentes (implementer para+escala ante mandato prohibido · inversión autorizada T-031 · puerto-opcional-identidad+espejo · contratos literales · bound inclusivo T-032 · stale plan T-036 · derivado no serializado T-132 · R0 en coverage.include) — evidencia, no regla nueva

Fase 3 del bloque IA (R0, ofensivas coordinadas, APPROVE, 0 ciclos FIX de código, 1 escalada
legítima). Además de los dos deltas de arriba, varias reglas vigentes recibieron evidencia
positiva; se anexan como validación, sin acuñar entrada nueva:
- **Implementer PARA ante un mandato prohibido y escala con opciones + recomendación (T-015):**
  ante el conflicto spec-contra-pin, el implementer (impl-t152) NO editó el test que su mandato
  le prohibía tocar ni improvisó: se bloqueó, analizó 3 opciones y recomendó, dejando la autoría
  de la decisión al lead. Aplicación canónica de la disciplina "parar con el gate/mandato en
  conflicto sin enmascarar, escalar el hecho" (T-015: "el implementer PARÓ y reportó sin
  improvisar"). El tell de una escalada sana se cumplió: expuso el conflicto con evidencia
  (`file:line` del pin y de la spec que lo supersede), no lo resolvió por su cuenta. Sin regla
  nueva; refuerza que el freno del implementer ante un mandato prohibido ya está codificado.
- **Inversión AUTORIZADA en sitio, no borrado (T-031):** el lead invirtió el único e2e afectado
  (mismo escenario, expectativa `'12,4'→'6,4'` + comentario de supersesión), resto intacto y la
  propiedad de reorden aún pineada a nivel unitario. Aplicación limpia de T-031 (ver delta de
  detección temprana arriba para el eje NUEVO). Sin regla nueva.
- **puerto-opcional-identidad + espejo (T-137–T-140/T-150/T-151):** sin `getPlan` ⇒ faction-ai
  byte-idéntico v1; el refactor A2 (budget local → `{remaining}` compartido) es byte-idéntico por
  ser único consumidor por pasada; 8 archivos de pins verdes (salvo la inversión autorizada) +
  espejo triple deep-equal (review.md:5-8). Sin regla nueva.
- **Contratos literales en los .md de fase (T-123):** plan §C persistió LITERAL los 14 contratos
  (ids/celdas/pathLengths/goals/spend verbatim, borde 4/5 ambos lados, `findPath === 15 EXACTO`)
  → 14/14 T-152 verdes a la primera. N-ésima evidencia consecutiva. Sin cambios al delta de T-123.
- **Bound inclusivo declarado y testeado a AMBOS lados (T-032/T-030):** `AI_RALLY_RADIUS = 4`
  Chebyshev ≤ INCLUSIVE (4 dentro, 5 fuera) con test discriminante a ambos lados (plan §C2 borde
  4/5). Aplicación limpia; sin cambios al delta de T-032.
- **Stale plan ⇒ v1 sin throw (T-036):** unidad muerta ⇒ ni candidata ni quórum; target
  conquistado ⇒ no pasa filtro owner ⇒ findIndex -1 ⇒ v1 sin throw; cero estado nuevo ⇒ cero
  huérfanos (plan §0.6). Aplicación canónica del ciclo de vida stale de T-036.
- **Derivado no serializado se reconstruye, no se persiste (T-132):** plan/roles/muster son memos
  EFÍMEROS por pasada (anulados al final de decide() como passStrengths); 0 campos nuevos en
  getState, todo derivado de plan + posiciones (plan §A/§A3). Aplicación limpia de T-132.
- **R0 tocado en coverage.include (T-129):** faction-ai.ts gateado 95.18/91.95/98.5/99.54,
  ai-strategy.ts intacta. Sin cambios al delta de T-129.

NITs anotados como seeds (auto-aplicables, no bloquean): starvation multi-facción del `break`
:1118 (plan B `continue` de 1 línea si se observa inanición real — riesgo #2 del plan);
marchingTowardEnemy no mutado en tryMarchToCell, correcto por diseño (purga :986-987). Out-of-
scope → candidatas: kind 'rally' aditivo para telemetría; plan B continue multi-facción.

Sin conflictos con reglas vigentes (hard rule 2): ninguno de los hallazgos de T-152 contradice
una entrada previa. Resultado neto: 1 delta NUEVO (reificación de invariante global al subir la
cardinalidad, extiende el clúster EXPLORE-premisas T-015/T-029) + 1 refinamiento de T-130 (pin
e2e conductual de fase N-1 en cadena de supersesión), ambos PENDIENTE DE APROBACIÓN HUMANA.

## 2026-07-26 · T-153 · Un mismo término del dominio puede denotar DOS magnitudes distintas según el subsistema: EXPLORE lo desambigua y el código nombra cada acepción — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-153, R0+wiring, 0 ciclos FIX, APPROVE, conformidad 92/100): la palabra
"armyCount" denota DOS magnitudes distintas en el mismo sistema. La válvula de ahorro T-133
cuenta UNIDADES (`getUnits().filter`, faction-ai.ts:857-859), pero la logística (paso 4) y la
regla de calidad ORO cuentan COMANDANTES/EJÉRCITOS (`getCommanders(f).length`) porque `armyCap`
limita comandantes, no unidades. Si el diseño hubiera conflado ambas bajo un solo "armyCount",
la válvula de ahorro y el disparador de logística habrían operado sobre la magnitud equivocada
(p. ej. logística disparándose por nº de unidades cuando el cap es de comandantes). EXPLORE §0
lo cazó ANTES del contrato y lo marcó CRÍTICO (plan.md:30-34: "dos 'armyCount'… Nombrar
`unitCount` vs `commanderCount`"); el código las nombró distinto y el reviewer verificó que
"no se confunden" (review.md:6: "goalCost… con unitCount; commanderCount/armyCap solo en
logística/ORO"). Evidencia: plan.md:30-34, review.md:6, implementation.md:15, cierre
T-153.md:113.
Delta propuesto (EXPLORE/PLAN + nombrado): cuando un término del dominio ("army", "size",
"count", "value", "level") aparece en MÁS de un subsistema, EXPLORE debe verificar que denota
la MISMA magnitud en todos; si denota dos (unidades vs comandantes; efectivos vivos vs tamaño
nominal; nivel de edificio vs nivel de logística), es una HOMONIMIA del dominio y cada acepción
se NOMBRA distinto en el código (`unitCount`/`commanderCount`), nunca bajo un identificador
compartido que las confunda. Tell: si dos subsistemas leen "el mismo" contador pero desde
puertos distintos (`getUnits` vs `getCommanders`) o contra topes distintos (`AI_ARMY_PER_BUILDING`
vs `armyCap`), casi seguro son dos magnitudes homónimas; desambiguarlas en EXPLORE evita que un
umbral se compare contra la magnitud equivocada.
Frontera vs clúster EXPLORE-premisas (T-015 datos / T-029 complejidad / T-152 alcance de
invariante): mismo clúster, objeto NUEVO. T-015 verifica que el dato exista como se cree; T-029
qué es lo difícil; T-152 si un límite es global o local. T-153 verifica la IDENTIDAD SEMÁNTICA de
un NOMBRE compartido: no "¿existe?" ni "¿cuesta?" ni "¿qué alcance?", sino "¿este término significa
lo mismo en los dos sitios que lo usan?". Conecta parcialmente con el delta de T-153 sobre
disparador-vs-magnitud (abajo): ambos nacen de que dos magnitudes distintas se tratan como una,
pero este es sobre el NOMBRE en el código (homonimia a desambiguar en diseño) y aquel sobre un
LAZO de control (el disparador y su remedio operan sobre magnitudes distintas en runtime).
Recomendación del curador: entrada NUEVA en el clúster EXPLORE-premisas. Peso MENOR — una
ocurrencia, cazada en EXPLORE sin manifestar bug, pero generaliza a cualquier término homónimo
del dominio y su remedio (nombrar cada acepción) es barato y reusable. Pendiente de decisión humana.

## 2026-07-26 · T-153 · Paridad de reglas entre agentes = COMPARTIR el punto de entrada del jugador, no re-implementar la validación — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-153, R0+wiring, 0 ciclos FIX, APPROVE): el spec exigía que la IA gastara "con
las MISMAS reglas que el jugador, sin trampas" (T-153.md:18). El diseño lo cumplió
ESTRUCTURALMENTE cableando los puertos de la IA a los MISMOS métodos que usa el jugador
—`session.reinforce` valida por sí mismo unidad viva → calidad coincide → REGIÓN PROPIA
(owner===factionId) → cuartel → cap y cobra solo lotes efectivos (campaign-session.ts:979-1008)—
en vez de re-implementar esas comprobaciones dentro de faction-ai. La IA HEREDA todas las
restricciones del jugador porque comparte su punto de entrada; `commanders.recruit` valida el
cap ANTES que los fondos, así que la IA recibe `'army-cap'` por el mismo fallthrough que el
jugador (AC1c). Evidencia: plan.md:21-28 ("todas expuestas por sesión al JUGADOR — la IA usa las
MISMAS"), plan.md:23 ("IA hereda TODAS ⇒ sin atajo"), review.md:8 ("8 puertos a units/session/
commanders/logistics reales; commanders.recruit valida cap antes que fondos… Sin atajos"),
cierre T-153.md:113.
Delta propuesto (EXPLORE/PLAN, diseño de paridad entre agentes): cuando un spec exige que un
agente (IA, script, sistema automático) juegue "con las mismas reglas que el jugador / sin
trampas", la forma ROBUSTA de cumplirlo es cablear el agente al MISMO método/puerto que el
jugador invoca —que ya lleva dentro sus validaciones (territorio, coste, cap, atomicidad)—, NO
re-implementar las reglas en el lado del agente. Re-implementar duplica la validación y crea
deriva: la regla del jugador puede cambiar y la copia del agente queda obsoleta (una "trampa"
por omisión). Compartir el punto de entrada hace que la paridad sea estructural e imposible de
divergir: toda restricción nueva del método la hereda el agente gratis. Tell: si el código del
agente RE-CHEQUEA una precondición que el método del jugador ya valida (owner, cap, fondos), es
una copia que puede desincronizarse; inyecta el método real y deja que valide una sola vez.
Frontera vs identidad-v1/puerto-opcional (T-137–T-140/T-150/T-151): ortogonal. Aquel patrón
gobierna que la CONDUCTA NUEVA sea opt-in bit-idéntica a v1 cuando el puerto falta; este gobierna
que, cuando la conducta está encendida, la PARIDAD DE REGLAS entre agente y jugador se logre por
un punto de entrada compartido, no por lógica duplicada. Frontera vs T-024 ("expón el estado de
otro sistema al consumidor de alto nivel"): relacionada —ambas prefieren cablear al sistema real
sobre replicar su estado/lógica—, pero T-024 es sobre VISIBILIDAD de un estado de ocupación
cross-system; T-153 es sobre reusar la VALIDACIÓN de una acción para garantizar paridad de reglas.
Recomendación del curador: entrada NUEVA. Peso MENOR-MEDIO — una ocurrencia, patrón positivo
(no bug), pero generaliza a cualquier requisito futuro de "agente juega con reglas del jugador"
(asedios, poderes, comercio) y el tell (agente re-chequea una precondición del método del jugador)
es accionable. Pendiente de decisión humana.

## 2026-07-26 · T-153 · Un disparador sobre la métrica A remediado por una acción sobre la métrica B: verificar que la acción MUEVE A bajo el umbral, o el paso es no-op/no converge — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-153, NIT deferido a T-157, cazado por reviewer Y implementer): el paso de
refuerzo DISPARA cuando `profile.quantity < 0.5 × profile.maxQuantity` —quantity = efectivos
VIVOS, que caen en batalla— pero la ACCIÓN `reinforce` mide `batchesWanted = unitMaxQuantity(type)
− profile.maxQuantity`, es decir crece el tamaño NOMINAL de la ficha hacia el cap del TIPO; NO
repone las bajas. Disparador y acción operan sobre magnitudes DISTINTAS: una ficha ya al cap
nominal pero dañada en batalla cumple el disparador (quantity baja) pero da `batchesWanted=0` ⇒
`reinforce` no-op ⇒ fallthrough. El paso "rara vez disparará en fichas full dañadas" — el remedio
no reduce la métrica que lo gatilla. Fiel al puerto real (reponer bajas es otra T; el jugador
tiene la MISMA limitación, sin trampa) y NO invalida los AC (AC1a usa maxQuantity=100<1000, hay
hueco nominal), por eso se aceptó como tradeoff y se defirió a T-157. Evidencia: review.md:14,
implementation.md:21-22, cierre T-153.md:115.
Delta propuesto (EXPLORE/PLAN/review, lazos de control disparador→acción): cuando una acción se
DISPARA por una condición sobre una métrica A (aquí efectivos vivos vs umbral) y se REMEDIA con
una acción que opera sobre una métrica B (aquí tamaño nominal hacia el cap del tipo), verificar
EXPLÍCITAMENTE que ejecutar la acción MUEVE la métrica A de vuelta por debajo del umbral. Si A y B
son magnitudes distintas, el paso puede (a) ser no-op cuando B ya está saturada aunque A siga
disparando, o (b) no converger (dispara indefinidamente sin resolver la condición). Tell: nombra
la magnitud del DISPARADOR y la magnitud que la ACCIÓN modifica; si no son la misma, pregunta
"¿tras la acción, la condición del disparador deja de cumplirse?" — si la respuesta depende de un
estado ORTOGONAL (aquí: cuánto hueco nominal queda), el disparo es frágil. Remedio: alinear el
disparador a la métrica que la acción SÍ mueve (ratio de strength cuando exista un puerto que
reponga bajas), o documentar el desajuste como tradeoff con task de seguimiento (T-157).
Frontera vs T-133 ("la sim refuta un MECANISMO que no converge"): misma familia (un esquema que no
alcanza su objetivo), disparador distinto. T-133 es un suelo de ahorro fraccional que OSCILA y
nunca acumula hasta C —refutado por la sonda ANTES de codificar—; T-153 es un lazo disparador→
acción donde ambos existen y funcionan pero sobre magnitudes distintas, así que la acción a veces
no resuelve la condición —cazado en review/implementación como no-op latente, no por sonda—. Ambos:
el mecanismo no logra su fin; T-133 por dinámica temporal (oscila), T-153 por desalineación de
magnitudes (disparador ≠ lo que la acción mueve). Frontera vs T-028 ("función reusada arrastra un
supuesto de su call site"): NO es reuse —nada se movió ni se extrajo—; es un lazo de control mal
alineado desde su concepción. Frontera vs T-023 ("proporcional a X que decae"): T-023 es un VALOR
que decae reevaluado por tick; T-153 es un DISPARADOR sobre A remediado por acción sobre B —ejes
distintos—. Frontera vs la homonimia de T-153 (arriba): aquel es el NOMBRE en el código; este es el
LAZO de control en runtime (dos magnitudes reales que el diseño trata como intercambiables).
Recomendación del curador: entrada NUEVA. Peso MEDIO — una ocurrencia, cazada por doble revisión
(reviewer + implementer) y aceptada como tradeoff consciente con seguimiento (T-157), y generaliza
a cualquier control loop "detecta con A, corrige con B" (regen, reabastecimiento, reparación,
crecimiento hacia un cap). Pendiente de decisión humana.

## 2026-07-26 · T-153 · Validaciones de reglas vigentes (prompt de fase auto-contenido sobrevive al relevo por cuota · identidad v1 por espejo · contratos literales · EXPLORE §0 del planner · R0 en coverage.include · bound inclusivo/estricto declarado y testeado · derivado no serializado) — evidencia, no regla nueva

Además de los tres deltas nuevos de arriba, varias reglas vigentes recibieron evidencia positiva
en T-153 (R0+wiring, fase 4 del bloque IA T-150–T-157, APPROVE a la primera, 0 ciclos FIX); se
anexan como validación, sin acuñar entrada nueva:
- **Prompt de fase AUTO-CONTENIDO que sobrevive al relevo (T-140):** 2ª ocurrencia del MISMO
  disparador que T-140 (planner muerto → relevo limpio desde cero). En T-153 el planner original
  murió por CUOTA sin entregar; el relevo `plan2-t153` (Opus 4.8) arrancó desde cero con el mismo
  prompt enriquecido (calibration.md fijando la jerarquía, EXPLORE encargado como §0) y entregó un
  plan que salió APPROVE directo, 0 FIX (cierre T-153.md:111). Confirma el delta de T-140 en su
  disparador exacto (muerte por cuota, no solo por cuelgue): un prompt auto-contenido convierte la
  muerte del agente en un relevo sin pérdida de contexto. Sin cambios al delta pendiente de T-140;
  2ª evidencia refuerza su aprobación.
- **EXPLORE integrado como §0 del prompt del planner (T-131):** el §0 del plan (plan.md:8-40, con
  `archivo:línea` por premisa) pre-resolvió el diseño y cazó la homonimia de "armyCount" (delta 1
  arriba) ANTES del contrato. Sin explorador dedicado, el planner absorbió EXPLORE. 0 FIX de diseño.
  Sin cambios al delta pendiente de T-131.
- **Identidad v1 por ESPEJO + puerto-opcional-identidad (T-137–T-140/T-150):** toda la jerarquía
  gated por el linchpin `getUnitProfile`; ausente ⇒ `recruitPass()/buildPass()` v1 VERBATIM
  (decide() else :1424-1427), extensión de `recruit` con 3er arg aditivo byte-idéntica con 2 args,
  AC3 espejo deep-equal + 9 pins verdes SIN tocar (review.md:5,10). Aplicación limpia del patrón
  "expandir sin romper por opt-in + espejo". Sin regla nueva.
- **Contratos literales en los .md de fase (T-123):** plan §C persistió LITERAL los contratos de
  los 19 tests (fixtures con ids/quantity/maxQuantity/commanderCount/armyCap/treasury exactos,
  costes silver/gold/bronze verbatim 100/160/70, `reinforce(1,5)` = floor(50/10)) → 19/19 T-153
  verdes a la primera, suite 1341→1360 (implementation.md:6-7). N-ésima evidencia consecutiva. Sin
  cambios al delta pendiente de T-123.
- **R0 tocado en coverage.include (T-129):** faction-ai.ts gateado 94.79/90.78/98.7/99.63, todas
  ≥90 (implementation.md:10); ai-strategy.ts intacta. Sin cambios al delta pendiente de T-129.
- **Bound con lado declarado y testeado a AMBOS lados (T-032/T-030):** refuerzo `< 0.5` ESTRICTO,
  logística `≥ 0.75` INCLUSIVE, oro `===`, bronce `<` — los cuatro con test discriminante a ambos
  lados (review.md:9, plan §C AC1c/AC4 bounds). Aplicación limpia. Sin cambios al delta de T-032.
- **Derivado no serializado se reconstruye/no se persiste (T-132):** `getLastEconomicActions` es
  telemetría DERIVADA por pasada (reset por pasada, `[]` tras hydrate, NO va a `FactionAIState` —
  getState mantiene 4 claves; review.md:11). Aplicación canónica de T-132. Sin cambios.
- **Atomicidad de gasto como bound testeado con property (T-061/T-032):** cada `try*` verifica
  coste ANTES de gastar; property AC4 barre points 0..1000 × 4 fixtures ⇒ `treasury ≥ 0` SIEMPRE
  (review.md:7). Sin regla nueva.

Sin conflictos con reglas vigentes (hard rule 2): ningún hallazgo de T-153 contradice una entrada
previa (la paridad-por-punto-de-entrada compatibiliza con "mismas reglas que el jugador"; la
homonimia y el disparador-vs-magnitud son ejes NUEVOS del clúster EXPLORE-premisas, no revierten
nada). Resultado neto: 3 deltas NUEVOS (homonimia del dominio a desambiguar en EXPLORE; paridad de
reglas por punto de entrada compartido; disparador-A remediado por acción-B) + 7 validaciones de
reglas vigentes (incl. 2ª evidencia del prompt auto-contenido T-140), todos PENDIENTE DE
APROBACIÓN HUMANA.

## 2026-07-26 · T-160 · El NOMBRE de un símbolo es contrato observable cuando un test LEE la fuente (readFileSync+toContain): renombrarlo rompe pins que ningún espejo de conducta ni identidad-byte protege — PENDIENTE DE APROBACIÓN HUMANA

Refinamiento del clúster supersesión-grep (T-129/T-130/T-152: "'ningún test se toca' es premisa a
VERIFICAR con grep desde el plan, no a declarar; toda preservación/inversión necesaria se lista
como paso AUTORIZADO Y PREVISTO"), con un OBJETO NUEVO —el pin de LITERAL de código— que ninguna
entrada previa cubre. Decisión de plegado recomendada: refinamiento, no entrada independiente
(mismo eje "¿quién depende de lo que cambio?"), para evitar skill-bloat.

Hecho concreto (T-160, R1 application, 0 ciclos FIX, APPROVE a la primera, 1ª task del mandato
"next level"): el plan §A renombraba `const aiFactionIds = deps.mainFactions.filter(...)` a
`aiBaseFactionIds`. DOS pins FUERA de la lista de pins del plan grep-ean el LITERAL exacto del
código fuente: `adapter-hygiene.test.js:90` (T-021 "AI excludes player") y
`contract-liveness.test.ts:24` (T-068), ambos `expect(source).toContain('const aiFactionIds =
deps.mainFactions.filter')`. Verifican PRESENCIA TEXTUAL de una declaración, no conducta. El
implementer los cazó y PRESERVÓ el literal invirtiendo qué variable recibe el filter (`aiFactionIds`
= el array vivo que hace el filter; `aiBaseFactionIds = [...aiFactionIds]` la copia) — misma
semántica, mismo mutar-en-sitio, pins verdes SIN editar. Evidencia: implementation.md:18 (desviación
#1 "crítica"), review.md:7 (los pins existen y grep-ean el literal; inversión preserva literal Y
semántica), cierre T-160.md:99.

Punto clave (por qué es un OBJETO nuevo del clúster): un pin de literal de fuente NO lo atrapa
ningún espejo de conducta (deep-equal de decisiones) ni ningún test de identidad-byte del OUTPUT
del juego, porque un renombrado behavior-idéntico deja la conducta intacta —esas verificaciones
siguen verdes—. El pin solo se protege NO renombrando el símbolo (o preservando su literal). Aflora
únicamente al correr ESE test del suite, no en los espejos ni en la identidad byte de conducta.

Delta propuesto (EXPLORE/PLAN): por cada símbolo que el plan RENOMBRE o MUEVA, grepear los pins que
verifican LITERALES de código (`toContain`/`toMatch` sobre `readFileSync` del source) de ese
símbolo, y listar su preservación (o edición autorizada) como paso PREVISTO —no dejar que la rotura
aflore en verify y bloquee al implementer—. El nombre/texto de un símbolo es parte del contrato
OBSERVABLE cuando un test lee la fuente; "ningún test se toca" incluye estos pins textuales, que son
invisibles a los espejos de conducta. Tell: si un test hace `readFileSync(src)` + `toContain('…')`
sobre una declaración que el plan renombra, ese pin rompe en silencio para las verificaciones de
conducta y solo lo caza su propia ejecución.

Frontera vs T-129 (dato de catálogo por id) / T-130-T-151 (lista de keys del snapshot, Object.keys)
/ T-152 (conducta e2e en cadena de supersesión): mismo eje "grep quién depende antes de cambiar +
preservación/inversión prevista", pero todos aquellos objetos son SEMÁNTICOS/COMPORTAMENTALES o de
DATO; T-160 es un pin TEXTUAL/SINTÁCTICO sobre la FUENTE (una declaración verbatim como estructura),
que ninguna clase de test de conducta puede discriminar. Conexión con T-151: allí se RECHAZÓ como
OPINIÓN sin evidencia (hard rule 1) la idea de "rediseñar el pin como subconjunto toContain"; T-160
NO propone rediseñar los pins —propone GREPEARLOS antes de renombrar— y aporta el HECHO que a T-151
le faltaba (dos pins de literal reales, `file:line`, rotos por un renombrado). Ejes distintos (cómo
escribir un pin de keys vs grepear pins de literal antes de renombrar); sin conflicto (hard rule 2).

Segunda instancia del MISMO objeto (cruzando frontera multi-agente) — evidencia, no delta aparte:
FE-018 (UI, Codex-CLI orquestado por Claude, task hermana en curso) rompió un pin DOM de T-142
(task ACTIVA del Codex-par) al rediseñar la presentación; se resolvió PRESERVANDO los ids DOM en
FE-018 sin tocar el pin ajeno. Es el mismo objeto de este delta —un pin ESTRUCTURAL/TEXTUAL (ids
DOM, no literal de source pero misma naturaleza: presencia de un identificador, no conducta) roto
por un cambio y resuelto preservando el literal— generalizado de literales de fuente a ids del DOM.
La supersesión entre agentes (T-031/T-130) NO acuña regla nueva: la disciplina "no tocar contratos
de frontera ajenos / solo el dueño cierra su task" ya está en CLAUDE.md (§Multi-agente). Se anexa
como corroboración de que "el nombre/id como contrato textual" generaliza más allá del source.

Recomendación del curador: refinamiento del clúster T-130/T-152 con objeto nuevo "pin de literal de
fuente / nombre de símbolo como contrato textual (readFileSync+toContain)", NO entrada
independiente. Peso MENOR-MEDIO: una ocurrencia primaria (T-160) + una corroboración multi-agente
(FE-018/DOM), cazada por el implementer sin manifestar FIX, y generaliza a cualquier task que
renombre/mueva un símbolo grep-eado textualmente. Pendiente de decisión humana.

## 2026-07-27 · T-161 · El fundamento de una migración R0 grande se MERGEA como fase INERTE (modelo creado + serializado, CERO consumidor): identidad-v1 trivial por registro vacío, no por espejo de conducta — PENDIENTE DE APROBACIÓN HUMANA

Refinamiento del clúster "identidad v1 por ESPEJO como patrón de migración incremental"
(T-136–T-140/T-150/T-151/T-153: expandir un sistema vivo sin regresión por opt-in bit-idéntico +
test espejo), con un DISPARADOR NUEVO —la fase FUNDAMENTO de una migración multi-fase, sin
consumidor alguno—, NO entrada independiente (mismo eje "expandir ≠ romper"; evita skill-bloat,
misma disciplina de plegado que T-130/T-152/T-160).

Hecho concreto (T-161, R0 + R3 snapshot, 0 ciclos FIX, APPROVE a la primera, FASE 1 de la
migración Army de 8 fases): el nuevo módulo puro `src/domain/armies.ts` se introdujo, serializó en
snapshot y mergeó SIN NINGÚN consumidor de conducta. A diferencia de las fases T-137–T-140 —que
añaden mecánica GATED por un puerto opcional (presente pero apagado ⇒ identidad por espejo)—, aquí
NO hay siquiera conducta apagada: el registro nace vacío y NADIE lo lee. El reviewer enumeró el
wiring INERTE exacto (import :41, campo opcional de snapshot :292, const privado :718, exportState
:2087, hydrate :2104) y verificó por grep que `createArmySystem/armyOf/registerArmy` NO aparecen en
el objeto de retorno de la sesión ni en ningún otro sitio (review.md:5). La identidad-v1 es TRIVIAL
por AUSENCIA de lector: registro vacío (default) ⇒ conducta v1 exacta, snapshot viejo sin `armies`
⇒ hydrate tolerante, 1382 tests verdes SIN tocar (T-161.md:16-20,45-46; cierre :97-100: "Un army de
1 card = la unidad de hoy ⇒ identidad v1 trivial", suite 1382→1399). Estrategia deliberada declarada
en el spec: `Army.id === cardIds[0]` ⇒ un ejército de 1 card es indistinguible de la unidad de hoy,
así las fases siguientes (T-162 reclutar comandante, T-163 addCard/removeCard, T-164→T-168 combate/
IA/visuals) ACTIVAN el fundamento ya mergeado.

Delta propuesto (orquestación / secuenciación de migraciones R0 grandes): una migración de dominio
GRANDE (varias fases, R0 profundo) puede/debe ARRANCAR por una fase FUNDAMENTO INERTE —el modelo
nuevo se introduce, se serializa (snapshot aditivo tolerante) y se mergea SIN wiring a ninguna
conducta (combate/IA/reclutamiento/visuals)—, verificada por IDENTIDAD-V1 TRIVIAL (registro/estado
vacío por default ⇒ NADIE lo lee ⇒ conducta byte-idéntica) en vez de por espejo de conducta. Landea
el CIMIENTO (tipos, invariantes, round-trip de snapshot, cobertura R0) antes que cualquier conducta,
de modo que las fases siguientes activan un fundamento ya revisado y mergeado en `main` — desriesga
la migración partiéndola en "estructura sin conducta" (esta fase, gate barato: v1 por ausencia de
consumidor) + "conducta sobre estructura estable" (fases N≥2, gate por espejo/opt-in). Tell de una
fase-fundamento sana: un grep confirma que el símbolo nuevo NO aparece en ningún punto de consumo
(solo en su creación + serialización), y quitar el default deja la suite entera intacta.

Frontera vs identidad-v1/espejo + puerto-opcional-identidad (T-137–T-140/T-150/T-151/T-153): MISMO
clúster, disparador NUEVO —la BISAGRA inicial—. Aquellas fases apagan CONDUCTA presente con un
puerto opcional y prueban la identidad con un espejo que ejecuta el camino real contra el fixture
v1; T-161 no tiene conducta que apagar ni camino que espejar —el módulo no está cableado— y su
identidad es trivial por AUSENCIA de lector. Es el caso DEGENERADO/fundacional del mismo principio
"expandir sin romper": el bookend donde aún no hay nada que romper porque aún no hay consumidor.
Frontera vs T-130 (campo aditivo al snapshot ⇒ inversión de la lista de keys AUTORIZADA y prevista):
COMPLEMENTARIA y aplicada limpia aquí —la key `armies` se emite SIEMPRE, +1 línea en 2 tests de
forma (§E.1), hydrate tolerante—; T-130 gobierna CÓMO se absorbe el campo aditivo, este delta
gobierna POR QUÉ conviene que la primera fase de la migración solo aporte ESE campo aditivo y cero
conducta. No contradice ninguna regla previa (hard rule 2).

Recomendación del curador: refinamiento del clúster identidad-v1-migración (T-137–T-140), NO entrada
independiente. Peso MENOR — una ocurrencia, patrón positivo (0 FIX, sin bug), pero la secuenciación
"fundamento inerte primero, conducta después" generaliza a cualquier migración R0 grande y su gate
barato (v1 por registro vacío) es reusable y distinto del espejo. Las 2 desviaciones de la task son
evidencia de reglas vigentes, no deltas: +1 key aditiva de snapshot §E.1 (T-130) y `armyOf → Army`
(no `|null`) es refinación de firma justificada por el diseño (Army sintético singleton, spec §2).
Pendiente de decisión humana.

## 2026-07-27 · T-162 · DÓNDE vive un estado nuevo se decide por BLAST-RADIUS: un estado que debe ser INVISIBLE a N consumidores va FUERA del contenedor que esos N iteran, no dentro con un flag de exclusión — PENDIENTE DE APROBACIÓN HUMANA

Hecho concreto (T-162, R1 application + commanders R0 aditivo, 0 ciclos FIX, APPROVE a la primera,
FASE 2 de la migración Army): la task introduce un ESTADO NUEVO —la "reserva" de ejércitos reclutados
pero sin desplegar— que por diseño debe ser INVISIBLE al combate/IA/economía/fog/trade/rosters hasta
que un comandante lo despliegue. El planner eligió DÓNDE vive ese estado midiendo el BLAST-RADIUS de
las dos alternativas, no por elegancia (plan.md §0 E1, rotulado "push-outward"):
- **Flag `deployed:false` en el modelo de dominio `Unit` (RECHAZADO):** `units.ts` itera su array
  interno en 8 sitios de COMBATE (applyAttrition :976, processPursuit :892, processAttackMoves :692,
  processHoldingAcquire :733, processMoralePhase :1236, advanceMarches :830, processDeaths :1081,
  finalize :778) Y `getUnits()` (:227) es consumido por upkeep económico (campaign-session.ts:838),
  faction-ai (:723), fog, concealment, trade y rosters volley/blast/charge (:1291,:1414,:1448). El
  flag habría forzado filtrar la reserva en ~30 iteradores + la reserva tendría POSICIÓN targetable
  por AoE (`findAttackTarget` usa `getUnits()`+posición, no `byCell` — faction-ai.ts:505-511). ALTO
  blast-radius y un modo de fuga extra (el índice espacial).
- **Lista aparte en la capa APPLICATION (ELEGIDO):** `reserveArmies` = `Map` en el closure de la
  sesión con ids negativos (plan §A.2). `units.ts`/`armies.ts`/`faction-ai.ts` (R0) quedan INTACTOS;
  las cards de reserva NUNCA entran a `units[]` ⇒ invisibles a `getUnitsAt`/combate/IA/upkeep/AoE POR
  CONSTRUCCIÓN, no por N filtros. El despliegue reusa `placeRecruitedUnit` para inyectarlas al mapa.
El reviewer verificó el dominio intacto (diff no toca armies/units/faction-ai; única R0 = commanders
aditivo) y que AC1 prueba `getUnitsAt(capital)===0` Y `getUnits()===0` (review.md:5,7). El cierre lo
resume: "reserva en la CAPA APPLICATION (Map con ids negativos), no flag en units ⇒ dominio intacto,
evita blast-radius de ~30 sitios" (T-162.md:116).

Delta propuesto (EXPLORE/PLAN, ubicación de un estado nuevo): la decisión de DÓNDE vive un estado
nuevo se toma CONTANDO los consumidores/iteradores del contenedor candidato existente que tendrías
que enseñar a IGNORAR el estado nuevo (su blast-radius), no por afinidad conceptual. Regla operativa:
un estado que debe ser INVISIBLE a N consumidores de una estructura existente va MEJOR FUERA de esa
estructura (contenedor/capa aparte) que DENTRO con un flag de exclusión que hay que aplicar en cada
uno de los N iteradores — la invisibilidad "por construcción" (no está en el contenedor que iteran) es
robusta; la invisibilidad "por N filtros" es frágil (cada iterador nuevo que olvide el filtro es una
fuga). Tell: enumera los iteradores del contenedor candidato (bucles de combate, `getX()` público y
sus consumidores, índices espaciales); si añadir el estado dentro obligaría a un `if (!nuevo)` en
varios de ellos —o el estado adquiriría una propiedad que un iterador lee sin filtrar (posición
targetable por AoE)—, sácalo del contenedor. Un `getUnits()`/getter público multiplica el blast-radius
porque arrastra a TODOS sus consumidores aguas abajo, no solo a los bucles internos.

Frontera vs T-023/T-024 (el clúster "dónde vive un estado"): MISMO clúster, criterio de decisión NUEVO
y explícito. T-023 (lazy value en closure) elige quedarse DENTRO del propio sistema reusando un patrón
interno existente para no SUBIR DE RING (eje: coste de Ring, el valor es del propio sistema). T-024
(estado de ocupación cross-system) elige EXPONER un puerto y aceptar R1 porque un consumidor externo
DEBE conocer el estado (eje: visibilidad obligada + Ring). T-162 es el eje OPUESTO a T-024: el estado
debe ser INVISIBLE a muchos consumidores, y el criterio es el CONTEO de iteradores que tendrías que
enseñar a ignorarlo — "invisible a N" ⇒ fuera del contenedor que esos N iteran, no flag-dentro. Ninguna
de las dos codifica el blast-radius contable como criterio de UBICACIÓN de un estado invisible. No
contradice ninguna regla previa (hard rule 2).

Frontera vs el clúster identidad-v1/espejo (T-137–T-161): COMPLEMENTARIA, distinto mecanismo para el
mismo fin ("expandir ≠ romper"). El clúster identidad-v1 no rompe a los consumidores existentes
haciendo la conducta nueva OPT-IN bit-idéntica (puerto ausente ⇒ ×1) y probándolo con un espejo; T-162
no rompe a los N consumidores manteniendo el estado nuevo FUERA de la estructura que iteran (invisible
por construcción). Uno neutraliza por identidad algebraica; el otro por separación espacial del estado.

Recomendación del curador: entrada NUEVA (criterio de decisión reusable no cubierto: blast-radius
contable como regla de ubicación de un estado invisible; el eje inverso de T-024 dentro del clúster
"dónde vive un estado"). Peso MENOR-MEDIO — una ocurrencia, patrón positivo (0 FIX, sin bug), cazado
en EXPLORE/PLAN con el conteo explícito de ~30 iteradores, y generaliza a cualquier estado nuevo que
deba ser invisible a los consumidores de un contenedor existente (buffers de "pendiente", entidades
"en cola", registros ocultos). El matiz del índice espacial (un estado dentro adquiere posición
targetable aunque los bucles lo filtren) es un segundo modo de fuga que refuerza "fuera, no flag".
Pendiente de decisión humana.

Evidencia de reglas vigentes, NO delta nuevo (checkpoint R1 pre-resuelto + plan-B condicional que no se
disparó): el checkpoint R1 de T-162 se resolvió PRE-implementación con 2 decisiones del humano (firma
`Commander` ADITIVA: `assignedArmyId` nuevo + `assignedUnitId` conservado como alias espejo; y reserva
invisible) y el plan definió un plan-B R1 EXPLÍCITO —"si un pin asume `assignedUnitId` como campo
PRIMARIO con semántica distinta (no solo shape), PARAR y escalar" (plan.md §E.1)— que NO se disparó
porque la forma aditiva evitó toda inversión de semántica (ningún pin invirtió; solo +1 key/campo
aditivo en tests de shape). Esto es aplicación LIMPIA de: (a) el clúster identidad-aditiva/espejo
(T-137–T-161: expandir una firma viva por adición bit-idéntica) y su refinamiento de key aditiva de
snapshot AUTORIZADA Y PREVISTA (T-130 bajo T-129) —las desviaciones fueron exactamente eso: +key
'reserveArmies' en 2 tests de shape, +`assignedArmyId` en literales de `Commander`—; y (b) el plan-B
condicional como VÁLVULA de escalada dimensionada en el plan, misma disciplina que T-152 (el implementer
PARA y escala ante un mandato/pin en conflicto en vez de improvisar) — aquí la válvula se dimensionó
pero la forma aditiva la hizo innecesaria. Sin regla nueva; refuerza que "una firma R1 resuelta por
adición + un plan-B condicional acota el riesgo a cero inversión" ya está cubierto por el clúster
aditivo/espejo + la disciplina de escalada. Sin conflicto con reglas vigentes (hard rule 2).
