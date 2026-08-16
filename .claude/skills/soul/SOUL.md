# SOUL — Combat Tactical Setup (SW–CTS–01)

**Expediente:** SW–CTS–01 · Spec v1 · Initial Tuning · 2026-08-10  
**Fuente canónica (detalle + catálogo 128 filas):** [`docs/combat-tactical-setup-spec.html`](../../../docs/combat-tactical-setup-spec.html)  
**Auditoría previa (foto del runtime legacy, no norma):** [`docs/support-card-system-analysis.html`](../../../docs/support-card-system-analysis.html)  
**Uso en el loop:** este documento **es** la visión de combate para `/task-new` (gap SOUL↔código) y se cura con `/soul-loop`.  
**Estado del runtime:** la norma **aún no** afirma que el juego ya la ejecute. Separa *normative rule* / *initial tuning* / *risk* / *current fact*.

---

## 0. Una frase (identidad)

**Preparar. Leer. Disparar.**  
El combate conserva AP, postura y distancia, pero deja de tratar el soporte como porcentajes decorativos: el jugador monta un **Tactical Setup**, mantiene **Combat Modes**, arma con **Side Attacks** y cobra con **Attacks**.

**Frase de equipo (Mode):** el Sharingan no es un buff de dos turnos; es un modo de combate que se mantiene mientras se prepara mano, rango y estado enemigo, y solo termina cuando el payoff, el peaje o el jugador lo cierran.

**Setup serio:** emerge en **2–4 turnos** por AP, mano, cooldown, recursos y presión enemiga — **no** por un timer artificial.

---

## 1. Leyenda de señales (contrato editorial)

| Señal | Significado |
|-------|-------------|
| **Normative rule** | Invariante. Una implementación que lo contradiga **no cumple** la SOUL/spec. |
| **Initial tuning** | Número v1 concreto; se puede balancear **sin** cambiar el contrato. |
| **Risk** | Consecuencia intencional o punto de fallo a **medir**, no esconder. |
| **Current fact** | Comportamiento actual verificado: se conserva o se sustituye en el corte. |

---

## 2. Conservado vs sustituido (un solo corte)

### Conservado (current fact → sigue mandando)

- AP derivado de SPEED, entre **3 y 9**.
- Posturas **Aggressive / Balanced / Defensive**.
- Bandas **CLOSE / MEDIUM / LONG**.
- Mano de **cuatro** y técnicas con cooldown.
- **PASSIVE** fuera del mazo; artifacts automáticos.

### Sustituido en un solo corte (anti-visión de migración)

- Deck / discard / reshuffle **persistentes**.
- Clasificación heurística por **daño esperado**.
- Toggles como **buffs temporales de stats**.
- **Tool como rol** excluyente.
- Tooltips **porcentuales** que el runtime convierte en puntos en secreto.

**Migración:** *big bang*. Roles, draw, cooldown semántico, Modes, Marks, catálogo, AI/sim y UI cambian juntos. **No** publicar mezcla legacy+v1; el código sustituido se **elimina**.

---

## 3. Pilares ordenados (promesas de producto)

1. **Cuatro verbos, un `cardRole`** — Support prepara · Mode mantiene · Side arma · Attack cobra. Nunca se infiere el rol por daño.
2. **Weighted draw transparente** — Consistencia comprada (loadout, postura, peso, Discover), nunca tutor secreto.
3. **Reloj de turno sin ambigüedad** — Upkeep → regen → snapshot/draw → duración propia → acciones → descarte virtual.
4. **Combat Modes hasta cláusula de fin** — Persistentes, con peaje y cargas; no buffs de duración.
5. **Tactical Setup = Marks legibles** — Estado de mesa con dueño, reloj, lectura y consumo; **no** Terrain del Room.
6. **AP + postura + rango mandan** — El setup no reescribe el tablero.
7. **Cinco túneles de clan** — Ritmos jugables, no rotaciones forzadas (Yamanaka prueba túnel sin Mode).
8. **Contenido honesto** — 116 reauthored + 12 nuevas; legacy flavor se **implementa**, no se borra.
9. **UI del coste del plan** — Badge, preview base/enhanced, Modes panel, Setup panel.
10. **AI / sim / artifacts con la misma física** — Paridad de pipeline o no cuentan.

---

## 4. Anti-visión (qué NO es este combate)

- Support = “+15% que el runtime traduce a puntos a escondidas”.
- Mode = buff de 2 turnos / toggle de stats.
- Mano amañada al inicio o garantía de robar el Mode.
- Deck/discard/reshuffle/Retain clásico.
- Redraw de seguridad / ataque externo por mano muerta.
- Tool como quinto rol o rol principal.
- Inferir SUPPORT/MODE/SIDE/ATTACK por DPS esperado.
- Main Attack vacía o múltiples Main.
- PASSIVE en la mano o contando en el pool 6–20.
- Financiar upkeep con la regen **del mismo turno**.
- Stun/Silence apagan Modes (v1: solo drain explícito de cargas).
- Marks que “preparan terreno” cambiando Terrain del Room.
- Cartas que interactúan con Terrain/Heat en **v1** (cerrado: sin interacción).
- Persistencia de CD/Modes/cargas/Marks entre combates vía Heat o Encounter Chain.
- Dual-compat legacy+v1 en producción.
- Simulator que solo maximiza daño y ignora estado/setup.
- `FREE_FIRST_SKILL` que borra AP, HP, upkeep, cargas o cooldown.
- UI que esconde consumo de cargas/Mode o promesas de preview falsas.

---

## 5. Taxonomía obligatoria (4 roles + Main + tags)

### Roles jugables (`cardRole` — exactamente uno por técnica)

| Rol | Verbo | Función normativa |
|-----|--------|-------------------|
| **SUPPORT** | Preparar | Defensa, sustain, control, posición, búsqueda, Marks, stats **honestos** al servicio de una jugada. |
| **MODE** | Mantener | Estado persistente: cargas, upkeep, rutas explícitas, cláusulas de fin. |
| **SIDE** | Armar | Daño directo **> 0**, normalmente barato; chip; no consume el motor salvo excepción **visible** (texto rojo). |
| **ATTACK** | Cobrar | Daño principal normal / híbrido / payoff; puede leer y consumir Modes, Marks y estados declarados. |

**Flujo conceptual:** Support → Mode → Side → Attack.

### Main Attack

- Designación **única del loadout**, **no** quinto rol.
- Solo **una** ATTACK puede ser Main.
- **No** recibe peso gratis (`+0`).
- **Nunca** puede quedar vacía.
- Si se olvida la Main con otras ATTACK disponibles: elegir una **uniformemente** con `gameRng` y **notificar**. Aprender una skill **no** cambia la Main.

### Tags (combinables; no secuestran el rol)

Enums ejemplo: `TOOL`, `WEAPON`, `TAIJUTSU`, `NINJUTSU`, `GENJUTSU`, elementos, familias de clan, `MODE`, `MARK`, `DISCOVER`, `MULTI_HIT`, `PASSIVE`, etc.  
Un ataque puede ser `LIGHTNING · NINJUTSU · UCHIHA · SIGNATURE` a la vez.  
**TOOL es tag, nunca rol.**

### Compatibilidad interna

- MODE ↔ `ActionType.TOGGLE`
- SUPPORT / SIDE / ATTACK ↔ `ActionType.ACTIVE`
- PASSIVE fuera de la mano
- Categoría visible = **`cardRole`**, nunca heurística
- Offensive Skill = ATTACK + SIDE
- PASSIVE no cuenta en las **6–20** jugables

### Loadout

- Mínimo **6**, máximo **20** técnicas jugables únicas.
- No olvidar la última ATTACK; no bajar de seis jugables.

---

## 6. Weighted draw (transparencia)

### Algoritmo normativo

1. Pool = técnicas jugables del loadout (roles de mano), **6–20**, sin PASSIVE.
2. Cada turno: **4** extracciones ponderadas **sin reemplazo** sobre el **pool completo**.
3. La mano completa **desaparece** al finalizar el turno (descarte virtual).
4. **No** existe deck, discard, reshuffle ni Retain.
5. La **primera mano** no tiene reglas especiales (sin amañar).
6. CD / AP / recursos / rango / hard requirements **no** excluyen del sorteo: la carta puede ocupar un hueco **deshabilitada**.
7. **Mano muerta deliberada:** sin redraw de seguridad ni ataque externo. Siguen: mover, cambiar postura, Pass.

### Fórmula de peso (v1)

```
effectiveWeight = max(1, 2 + posture + mode + support − activeSelf − cooldown)
```

| Término | Valor v1 |
|---------|----------|
| `baseWeight` | **2** |
| Main Attack | **+0** (sin peso gratis) |
| Mode propio ON (`activeSelf`) | **−1** |
| En cooldown | **−1** |
| Mínimo | **1** |
| Cap de peso | **ninguno** (initial tuning: sin cap) |

### Postura → peso por rol (initial tuning)

| Postura | Bonus de peso |
|---------|----------------|
| Aggressive | ATTACK **+1** |
| Balanced | MODE **+1**, SIDE **+1** |
| Defensive | SUPPORT **+1** |

### Discover 3

- La Support se resuelve y **libera su hueco**.
- Hasta **3** candidatos distintos del filtro declarado, con pesos **actuales**.
- Excluye la fuente y la mano presente.
- Candidatos en cooldown **permitidos**; entran **deshabilitados** si se eligen.
- El elegido ocupa el hueco; el resto vuelve al pool virtual.

---

## 7. Reloj del turno (orden fijo)

| # | Fase | Norma |
|---|------|--------|
| 01 | **Upkeep de Modes** | Por `modeUpkeepPriority[]`. Paga CP/HP **antes** de regenerar. Si no puede pagarse → Mode termina y arranca cooldown. |
| 02 | **Ticks y regeneración** | Ticks propios, **luego** regen. Upkeep **no** se financia con regen del mismo turno. |
| 03 | **Snapshot y draw** | Fija pesos, CD y playability; roba 4. Modificadores aún activos influyen **antes** de decrementar duración. |
| 04 | **Duración propia** | Supports y Marks del **jugador** decrementan **después del draw**. A 0 ya no afectan la fase de acciones. (Support duración 1 protege respuesta enemiga y afecta el **siguiente** draw.) |
| 05 | **Acciones y respuesta** | Jugador gasta AP; **después** enemigo. DoT y hard control decrementan **tras la oportunidad del actor afectado**. |
| 06 | **Descarte virtual** | Mano se elimina; siguiente turno = pool completo + estado actualizado. |

### Cooldown estricto

- Usada en turno **T** con cooldown **N** → bloqueada en manos **T+1 … T+N**; ready en **T+N+1**.
- `readyOnTurn = T + cooldown + 1`  
  Ejemplo CD 2: bloqueada T+1 y T+2; usable en T+3.
- Sigue **sorteable** con peso −1 mientras está en CD.

### Frontera de encuentro

Cooldowns, Modes, cargas y Tactical Setup se **reinician al comenzar cada combate**. **No** persisten por Heat ni Encounter Chain.

---

## 8. Combat Modes (motor persistente)

### Qué es un Mode

**No** es un buff con duración. Permanece en mesa, paga peaje, altera rutas concretas y se cierra por cláusula de fin.

**Máquina de estados:**  
`OFF` (ready o CD) → `ACTIVATION` (AP + coste; **cargas al máximo**) → `ON` (upkeep · rutas · cargas) → `FIN` (payoff / off / 0 cargas / upkeep fallido / reemplazo familiar / finisher) → `COOLDOWN` → `READY`.

### Reglas de familia

| Regla | Norma |
|-------|--------|
| Coexistencia | Varios Modes **compatibles** ON a la vez. Solo se excluye el mismo `modeFamily`. |
| Ascenso (Gate/Curse superior) | AP **completo** + **diferencia** de activación; cargas restantes **+1** (cap del stage nuevo); **sin downgrade**. |
| Lateral (Sharingan 2T↔3T) | Activación **completa**; transfiere cargas **sin refill ni +1**; el anterior entra en CD. |
| Off manual | Solo al **robar y jugar** de nuevo la carta; AP completo; **sin** coste de activación; empieza CD. |
| Apagado forzado v1 | Solo **drain explícito de cargas** rompe Mode enemigo. **Stun/Silence no apagan**. |
| Upkeep múltiple | Se paga lo pagable **por prioridad**; caer uno **no** detiene el intento de los siguientes. |
| Cargas | **No** decaen con el tiempo; gasto al **intento** (salvo reglas declaradas); nunca sobrecarga del cap. |
| Rango del Mode | Se comprueba **solo al activar**; luego permanece ON al cambiar de banda. |

### Tabla Modes v1 (initial tuning)

| Mode | AP | Activación | Upkeep | Cargas | CD | Identidad |
|------|----|------------|--------|--------|-----|-----------|
| Sharingan 2-Tomoe | 2 | 4 CP | 4 CP | 3 | 4 | Katon + lectura predictiva |
| Sharingan 3-Tomoe | 3 | 6 CP | 6 CP | 3 | 5 | Lightning/Chidori; habilita MEDIUM |
| Byakugan | 2 | 4 CP | 4 CP | 4 | 4 | Chakra Point Marks + pen. Hyuga |
| Shadow Clones | 2 | 12 CP | 2 CP | 3 | 5 | Recurso; Rasengan weight **+4** |
| Gate of Life | 3 | 15 HP | 8 HP | 3 | 6 | Stage 3; STR/SPD + Lotus |
| Gate of Limit | 4 | 35 HP | 12 HP | 4 | 8 | Stage 5; payoff extremo |
| Curse Mark I | 2 | 12 HP | 5 HP | 3 | 5 | Wildcard ofensivo |
| Curse Mark II | 3 | 25 HP | 10 HP | 4 | 6 | Stage superior + self-damage |

### Techos de daño (tuning)

- Contribución **enhanced** de un Mode: normalmente **40–60%** de valor efectivo.
- Bonus % de **Tactical Setup** se suman en un **bucket** aparte.
- Postura, crítico, elemento y mitigación = **capas separadas**.

### HP upkeep

Si el upkeep de HP sería letal: el Mode se **apaga**; el jugador **nunca baja de 1 HP** por ese upkeep.

---

## 9. Marks y Tactical Setup (estado de mesa)

“Preparar terreno” = estado táctico **legible**, **no** modificar Terrain del Room.  
Cada pieza declara: **quién posee**, **duración**, **qué lee**, **cuándo se consume**.

### Consumo

| Tipo | Cuándo se gasta |
|------|-----------------|
| Mark **propia** (Cloak, Aim, boost próximo Attack…) | Al **intento** de la acción válida — aunque luego falle. |
| Mark **enemiga** consumible (Vulnerability, Wire, Chakra Point…) | Al **impacto** — solo si **≥1 golpe** aterriza. |
| Lectura (Burn, Poison, Stun, Mark no consumible) | Puede habilitar bonus **sin** desaparecer, salvo declaración explícita. |

### Familias

| Familia | Stacking | Reloj | Resolución |
|---------|----------|-------|------------|
| DoT | Cada instancia suma daño | Tick + decr. tras oportunidad del afectado | BLEED físico; BURN elemental; POISON/TRUE según autoría |
| Shield | Absorción aditiva por instancia | Duración propia o “primer impacto” | Antes de HP; pipeline actual |
| Stat buff/debuff | Enteros aditivos | 1–2 turnos típicos; 3 solo piezas fuertes | `+2 DEX`, **nunca** “+15%” secreto |
| Hard control | Instancias coexisten | Tras oportunidad afectada | Dos Stun 1 → **un solo skip**, no dos |
| Range reaction | Por Mark/registry | Tras **cambio real de banda** | Manual, carta, AI, PUSH/PULL; borde sin movimiento **no** |
| Mode charge | Cap por Mode | No decae | Support recarga solo Mode **ya ON** |

### Multi-hit

- **N** tiradas independientes de impacto, crítico y mitigación.
- `effects[]`, artifacts on-hit, cargas y “next attack”: **una vez por carta** si ≥1 hit, salvo `perHit: true`.
- **DRAIN:** cura **una vez** sobre daño total **post-mitigación**.

---

## 10. Tablero: AP, postura, rango

| Eje | Norma / tuning |
|-----|----------------|
| **AP** | `3 + floor((SPD−1)/2)`, cap **9**. Típicos: Support/Side 1–2; Mode 2–4; Attack 2–3; payoff 4–6. |
| **Postura daño** | Aggressive da/recibe **×1.20**; Balanced **×1**; Defensive da/recibe **×0.80**. Cambio manual **1 AP**. |
| **Bandas** | CLOSE · MEDIUM · LONG. Mover manual **1 AP**, **una vez/turno**. Cartas y forced movement **no** gastan esa acción. |
| **Mode vs Attack rango** | Mode: rango solo al **activar**. Attack: siempre sus `allowedRanges`. |
| **Movimiento → reacción** | Mover → confirmar banda real → reacciones en orden → continúa la carta. **No** reacción si CLOSE+PULL o LONG+PUSH. |
| **Cartas caras** | 6 AP en mano con max 4 AP = **disabled** y ocupa hueco. Coste alto = promesa SPEED, no filtro RNG. |

**v1 cerrado:** cartas **sin** interacción con Terrain/Heat.

---

## 11. Cinco túneles (arquetipos, no rotaciones fijas)

Explican qué se enciende, qué piezas caben sin romper el motor y qué **cobra** cuando mano, AP, rango y riesgo coinciden.

### Uchiha — lectura + elemental

| Beat | Pieza | Función |
|------|--------|---------|
| T1 motor | Sharingan | 2T → Katon/predicción; 3T → Lightning/Chidori; lateral transfiere cargas |
| T1–2 | Smoke / Predict | Baja presión; recarga lectura **sin** consumir Mode |
| T2–3 | Kunai / Burn | Side afina; Phoenix Flower = Attack normal |
| T2–4 | Fireball / Chidori | Enhanced + consumo; Chidori 3T usa **2 cargas**, gana MEDIUM |

### Uzumaki — clones + CLOSE

| Beat | Pieza | Función |
|------|--------|---------|
| T1 | Shadow Clones | 3 cargas; no mueren por atacar/tiempo; Rasengan weight **+4** |
| T1–2 | Reel / Shunshin | CLOSE sin gastar movimiento manual |
| T2–3 | Uzumaki Barrage | Multi-hit; 1 carga → +2 golpes (excepción en rojo) |
| T2–4 | Rasengan | Base viable; con clones **+50%**, consume 1 carga al intento |

### Hyuga — Marks + Mode defensivo

| Beat | Pieza | Función |
|------|--------|---------|
| T1 | Byakugan | +2 ACC; 4 cargas; Side aplica Chakra Point |
| T1–2 | Air Palm | Chip, PUSH, CP por hit **sin** gastar cargas |
| T2–3 | Rotation | Require Byakugan; 1 carga → shield + reflect |
| T3–4 | 64 Palms / Lions | Lee Marks, penetra, consume al impacto; **fallo conserva** Marks enemigas |

### Lee — Gates + upkeep HP

| Beat | Pieza | Función |
|------|--------|---------|
| T1 | Gate Prep | −50% próximo coste activación HP; Gate weight **+3** próximo draw |
| T1–2 | Gate of Life | Stage 3; upkeep 8 HP; puede ascender a Limit |
| T2–3 | Dynamic Entry | MEDIUM→CLOSE; cargas intactas |
| T3–4 | Lotus / Peacock | Escala con todas las cargas; consume y **cierra** Gate |

### Yamanaka — mental **sin Mode**

| Beat | Pieza | Función |
|------|--------|---------|
| T1 | Mind Reading | Intención completa + Discover 3 MENTAL |
| T1–2 | Mind Transfer | Stun 2 al **70%**; fallar = self-Stun 1 |
| T2–3 | False Surroundings | Confusion + Read Mind; **sin** Terrain ni dōjutsu inventado |
| T2–4 | Hell Viewing | Main inicial; daño mental + penaliza próxima acción enemiga |

---

## 12. Paquete de contenido v1

### Volumen

- **116** técnicas actuales reauthored + **12** nuevas = **128** filas de decisión.
- Ninguna de las 12 entra en **starter kits**.
- 7 universales → pools scroll/vendor actuales.
- 5 de clan → `requirements.clan` + canales de aprendizaje.

### Doce técnicas nuevas (contrato funcional)

| Técnica | Rol | Coste v1 | Contrato |
|---------|-----|----------|----------|
| Tactical Scroll: Rehearsal | SUPPORT | 1 AP · CD 5 | Tag del loadout → Discover 3 de ese tag |
| Chakra Control Drill | SUPPORT | 1 AP · CD 3 | Main weight +2 próximo draw; +4 CP |
| Wire Kunai: Reel In | SIDE | 1 AP · CD 2 | 6 dmg; M/L; PULL 1; Off-Balance +20% próximo Attack |
| Explosive Kunai: Blastback | SIDE | 1 AP · 1 CP · CD 3 | 7 dmg; C/M; PUSH 1; Exposed +15% próximo ranged Attack |
| Backstep Shuriken | SIDE | 1 AP · CD 2 | 5 dmg; usuario −1 banda tras intento |
| Sealing Tag: Chakra Lock | SUPPORT | 2 AP · 4 CP · CD 6 | Mode enemigo prioritario −1 carga; si no hay Mode → Silence 1 |
| Tripwire Perimeter | SUPPORT | 1 AP · CD 4 | Reaction Mark 2: 1.er move enemigo → 8 dmg + 60% Stun 1 |
| Sharingan 3-Tomoe | MODE | 3 AP · 6/6 CP · CD 5 | 3 cargas; Lightning/Chidori; lateral de Sharingan |
| Uzumaki Barrage | SIDE | 2 AP · CD 3 | 3×4; con clones −1 carga +2 hits |
| Gentle Step: Twin Lion Fists | ATTACK | 4 AP · 9 CP · CD 5 | 2×9; Byakugan+CP → +50%, 30% pen, consumo |
| Morning Peacock | ATTACK | 5 AP · 10 HP · CD 7 | 6×4; require Gate of Limit; +15%/carga; consume todas y cierra |
| Mind Reading Technique | SUPPORT | 1 AP · 4 CP · CD 4 | Intención completa + Discover 3 MENTAL |

### Catálogo 128

Cada fila en la fuente canónica es una decisión v1: **Ahora** (packaging actual) → **Propuesta** (rol, coste, rango, hits, interacción, texto funcional).  
Reauthor = **implementar la promesa del flavor**, no borrar ni dejar % decorativo.  
**No hay cuotas** numéricas de roles; el objetivo es taxonomía + cobertura de huecos.

→ Detalle fila a fila: HTML §09 `#catalogo`.

---

## 13. Contratos técnicos (interfaces mínimas)

Lógica pura en `src/game/systems/`. React solo proyecta estado y envía intenciones. Nombres = contrato conceptual.

### Enums

- `CardRole`: `SUPPORT | MODE | SIDE_ATTACK | ATTACK` (UI: SIDE)
- `TargetScope`: `MAIN_ATTACK | ATTACK | SIDE_ATTACK | OFFENSIVE_SKILL`

### Skill (authoring)

```
cardRole, tags[], baseWeight (=2 v1), allowedRanges[]
hitCount? (default 1), perHitEffects?
discover?, markEffects?, modeInteraction?
```

### ModeDefinition

```
id, family, stage?, maxCharges
activationCost, upkeep, cooldown
weightModifiers[], enhancements[], endClauses[]
```

### Mark

```
id, sourceSkillId, owner, target
duration, stacks, trigger?, consume?
```

### drawHand(pool, combatState, size = 4)

```
candidates = unique(playable-role skills)
repeat min(size, len):
  weight = max(1, sumWeight(candidate, state))
  chosen = weightedRandom(..., gameRng)
  hand.push(snapshotPlayability(chosen, state))
  remove chosen from candidates
```

### resolveSkill(intent)

```
validate snapshot, AP, resource, range, hard gates
if invalid: consume nothing
commit AP + CP/HP + readyOnTurn
consume own attempt-marks + declared Mode charges
roll each hit independently
if any hit: consume enemy marks; once-per-card effects + artifact procs
apply perHitEffects
resolve movement, then range reactions
```

### Skill Config (fuera de combate)

- Guarda `mainAttackId`, `modeUpkeepPriority[]`.
- Bloqueado **en combate**.
- Invariantes: Main no vacía; no olvidar última ATTACK; ≥6 jugables; reasignación Main con RNG + notify; aprender no cambia Main.

---

## 14. Presentación (lado UI — honestidad)

### En la carta

- Badge SUPPORT / MODE / SIDE / ATTACK.
- Ribbon de Main Attack.
- AP, CP/HP, CD restante, rango, hit count.
- **Texto rojo** para consumo de Mode/cargas.
- Disabled: **una** razón priorizada.

### Preview contextual

- Base vs enhanced con **fuente** de cada bonus.
- Daño estimado total y por golpe.
- Modes compatibles y cargas comprometidas.
- Marks/status leídos y consumidos.
- Movimiento esperado y Range Reactions armadas.

### Paneles

| Panel | Contenido |
|-------|-----------|
| Combat Modes | Mode, stage/variante, cargas/max, upkeep, prioridad, rutas — **no** un buff perdido entre status |
| Tactical Setup | Marks propias/enemigas: icono, stacks, reloj, trigger, consumo |
| Skill Config | Exploración: catálogo, Main, prioridades, **desglose de peso** |

### Ruido controlado

Peso exacto y desglose fino → inspector/config (**un clic**), no saturar la cara de cada carta. La mano prioriza decisión inmediata; el detalle sigue **auditable**.

---

## 15. Integración: AI, sim, artifacts

| Capa | Norma |
|------|--------|
| **Enemy AI** | Misma física (Modes, Marks, charges, range, resolución). Selección **directa** de técnicas — **sin** mano ponderada ni Main Config. |
| **Elite/Boss** | Scoring state-aware + túneles/telegraphs autorados. Sharingan lee la **intención ya existente**. |
| **Simulator** | **Paridad o nada:** mismo pipeline; valora estado futuro, no solo DPS. |
| **FREE_FIRST_SKILL** | Solo anula el **primer coste de chakra**. Nunca AP, HP, upkeep, cargas ni CD. Textos deben decirlo. |
| **Cooldown reset** | Reinicia cartas y Modes **apagados**; no activa Mode ni restaura cargas. On-hit: 1× por carta con ≥1 hit. |

### Métricas a alimentar (balance / sim)

Setup completion · Death during setup · Enhanced/base · Mode lifetime · Dead-card rate · Weight influence · Range reactions · Payoff share · Upkeep failure.

---

## 16. Aceptación observable (gates de implementación)

| Escenario | Debe demostrarse |
|-----------|------------------|
| Cooldown 2 | Bloqueada en 2 manos siguientes; usable en la tercera |
| Mano 100% bloqueada | No se sustituyen cartas; mover / postura / Pass OK |
| Discover + CD | Candidato permitido; si se elige, entra disabled |
| Upkeep insuficiente | Mode cae antes de regen; CD; Modes posteriores aún intentan |
| HP upkeep letal | Mode off; HP ≥ 1 |
| Ascenso Gate/Curse | AP completo + diff recurso; cargas +1; sin downgrade |
| Sharingan lateral | Transfer sin refill; anterior en CD |
| Dos Modes compatibles | Mejoran Attack solo si la Attack lo declara; cada uno su coste |
| Multi-hit parcial | Effects/artifacts 1× si ≥1 hit; setup/cargas 1× por carta |
| PUSH vs LONG | Sin movimiento ni reaction; resultado de borde |
| Main olvidada | Otra ATTACK uniforme + notify; nunca vacía |
| Fin de encuentro | CD, Modes, cargas, Marks reinician |

**Sin pacing fijo global:** no forzar duración de combate. Trash puede caer con Side/base Attack; Elite/Boss hace el Setup necesario. Métricas **antes** de retocar números.

---

## 17. Registro de decisiones cerradas (canónico)

1. Entrega original de la spec: HTML normativo (runtime pendiente de implementación).  
2. Terminología: SUPPORT, MODE, SIDE, ATTACK.  
3. Tool = tag, nunca rol.  
4. Main = una ATTACK; sin peso inherente.  
5. Loadout 6–20 jugables.  
6. Draw: 4 distintas del pool completo cada turno.  
7. Peso base 2; aditivo; mín 1; sin cap.  
8. Inicio: sin mano amañada ni garantía de Mode.  
9. CD: sorteable con −1; bloquea N manos.  
10. Mano muerta: riesgo real, sin fallback oculto.  
11. Discover: 3 candidatos; CD permitido.  
12. Posture: pesos por rol + × daño ±20%.  
13. Movement: carta/forced no gasta movimiento manual.  
14. Terrain/Heat: sin interacción de cartas en v1.  
15. Mode: persistente, cargas, cláusula de fin.  
16. Upkeep: antes de regen; orden Skill Config.  
17. Coexistencia: solo excluye mismo `modeFamily`.  
18. Charges: no decaen; gasto al intento.  
19. Marks: primera clase, apilables, consumo explícito.  
20. Multi-hit: rolls por hit; procs por carta por defecto.  
21. Legacy flavor: se implementa la promesa.  
22. Enemies: mismas reglas, sin mano.  
23. Migración: big bang, sin dual-compat.  
24. Contenido: 116 + 12 (mayoría universal).

---

## 18. Orden de entrega sugerido (para `/task-new` gap)

Prioridad al combinar con lo ya implementado (AP/postura/rango existen):

1. **R0 tipos** — `CardRole`, tags, Main, contracts Skill/Mode/Mark  
2. **R0 reloj** — fases de turno, CD semántico, frontera de encuentro  
3. **R0 draw** — weighted hand 4, fin de mano, Discover  
4. **R0 Marks/Setup** — stacking, consumo intento/impacto, multi-hit rules  
5. **R0 Modes** — máquina de estados, upkeep, familias, 8 modes v1  
6. **R0–1 wire board** — gates con AP/postura/rango existentes  
7. **R1 live path** — resolveSkill / play roles legales  
8. **R0 content** — 12 nuevas + lotes del catálogo 128  
9. **R1–3 AI/sim/artifacts** — paridad de pipeline + métricas  
10. **R2 UI** — badges, preview, Modes panel, Setup panel, Skill Config  

Cada T-XXX: 1–3 AC objetivos con gate; citar ancla del HTML (`#modes`, `#sorteo`, …) en Génesis.

---

## 19. Ring map (combate)

| Ring | Paths de combate |
|------|------------------|
| **R0** | `src/game/systems/**` (draw, modes, marks, reloj, resolve), `types`, `constants` skills |
| **R1** | hooks/context que despachan intenciones; orquestación de turno |
| **R2** | `components/combat/**`, `scenes/combat/**`, tooltips, panels |
| **R3** | `simulation/**`, scripts de métricas, config |

R0 **sin** React/DOM.

---

## Loop decisions

<!-- Solo /soul-loop (con OK humano) o el humano añaden entradas aquí. -->

- **2026-08-12** — Seed inicial: SOUL combat = norma completa SW–CTS–01 extraída del HTML canónico por swarm de 8 agentes (secciones 00–14). Catálogo 128 fila-a-fila permanece en el HTML §09; esta SOUL fija taxonomía, reloj, modes, marks, draw, túneles, 12 nuevas, contratos, UI, AI/sim, aceptación y decisiones cerradas.
