# Feature Plan: T-004 · Refactor de Combate — Cartas, Posturas y Action Points

> Plan de diseño profundo (planck). Refactor del sistema de combate de SHINOBI WAY hacia un
> modelo **deckbuilder + Action Points (AP) + posturas**. Decisiones de producto confirmadas
> con el usuario. Ejecución prevista por **fases** a través del loop de desarrollo (`/loop-run`),
> con gate de 4 lentes por fase.

## Decisiones confirmadas (producto)

1. **Mazo con robo RNG ponderado.** Cada turno se roba una **mano de 4 cartas** del mazo del
   jugador (sus skills), con **pesos según la postura** activa. No siempre tienes todas las skills.
2. **AP reemplaza SIDE/MAIN.** Cada turno: `AP = base + f(velocidad)`. Cada carta cuesta AP. Juegas
   cartas hasta agotar AP o pulsar **SPACE** para terminar. Elimina la estructura fija SIDE(2)/MAIN(1).
3. **Posturas (3):** Agresiva / Equilibrada / Defensiva. El jugador puede **cambiar de postura**
   (acción que cuesta **1 AP**) **y** ciertas skills **cambian la postura al golpear** (nuevo efecto).
   La postura **sesga los pesos del robo** (y aplica un bono leve de daño/defensa).
4. **Reemplazo total + actualizar simulador.** Se sustituye el flujo SIDE/MAIN por completo y se
   actualiza `BattleSimulator`/`SkillSelectionAI` para modelar AP/cartas/posturas, de modo que el
   gate de BALANCE del loop siga siendo válido. **La matemática base (`calculateDamage`/mitigación)
   NO se toca** — solo la capa de economía/selección de turno.

## Defaults de diseño (tunables; documentados para que el maker no invente)

- `AP_BASE = 3`, `AP_PER_SPEED_DIV = 10` → AP/turno = `3 + floor(speed/10)` (speed 20 ⇒ 5 AP).
- **Coste AP por carta** (`Skill.apCost`, nuevo campo; default derivado si falta):
  ofensiva/MAIN = 2 · utilidad/SIDE = 1 · activación TOGGLE = 2. Tunable por skill.
- **Cambio de postura manual = 1 AP.** Skills con efecto `stanceShift` cambian la postura **gratis**
  al impactar (parte del golpe).
- **Mano = 4 cartas.** Robo cada turno; las cartas no jugadas se descartan y se vuelve a robar
  (mano fresca por turno). Reshuffle del mazo al agotarse.
- **PASSIVE** no entra al mazo (siempre activas). **MAIN/SIDE/TOGGLE** son cartas del mazo.
- **Pesos de robo:** cada skill tiene un peso base; la postura multiplica el peso de su categoría
  (Agresiva ×skills ofensivas, Defensiva ×utilidad/defensa, Equilibrada plano). Categoría derivada
  de `damageMult`/efectos (shield/heal/buff defensivo) si no hay tag explícito.
- **Enemigo:** conserva su IA actual de 1 acción/turno (fuera de alcance darle cartas), pero el
  **simulador** debe modelar la nueva economía del **jugador** (varias cartas/turno según AP).

## Features Overview

- **F1 — Modelo de datos y constantes:** enum `Posture`, campos AP/mano/postura en estado de
  combate, `apCost`/`stanceShift` en `Skill`, AP en `DerivedStats`, constantes en `constants/`.
- **F2 — Lógica core:** AP en `StatSystem`; nuevo `DeckSystem` (robo ponderado); `PlayerTurnSystem`
  deduce AP y gestiona postura; `processUpkeep` roba mano + restaura AP. Math base intacta.
- **F3 — UI de combate:** mano de 4 (Z/X/C/V), barra de AP, indicador de postura, SPACE termina;
  reutiliza `SkillCard`; estilo pixel-arcade (T-001).
- **F4 — Simulador:** `BattleSimulator` + `SkillSelectionAI` modelan AP/cartas/posturas para que
  el gate de BALANCE mida el sistema nuevo.
- **F5 — Limpieza legacy:** eliminar la economía fija SIDE/MAIN/`TurnPhaseState`, la UI de grids
  por ActionType, y campos obsoletos.

---

## Detailed Plans

### F1 · Modelo de datos y constantes

**Goal:** Tipos y constantes base para AP, mano, postura. Sin cambiar comportamiento aún.
**Files to modify:**
- `src/game/types.ts` — `enum Posture { AGGRESSIVE, BALANCED, DEFENSIVE }`; `Skill.apCost?: number`,
  `Skill.stanceShift?: Posture`; `DerivedStats.actionPointsPerTurn: number`.
- `src/game/systems/combat-types.ts` — extender `CombatState`: `currentAp`, `maxAp`,
  `posture: Posture`, `hand: Skill[]` (4), `deck: Skill[]`, `discard: Skill[]`.
- `src/config/featureFlags.ts` (`LaunchProperties`) — `AP_BASE`, `AP_PER_SPEED_DIV`,
  `HAND_SIZE`, `POSTURE_SWITCH_AP_COST`, pesos de postura.
**Files to create:**
- `src/game/constants/combatCards.ts` — categorización ofensiva/utilidad/defensa por skill +
  tabla de pesos por postura + `apCost` default por `ActionType`.

### F2 · Lógica core (sin tocar la math base)

**Goal:** Robo ponderado, AP, posturas — en funciones puras + workflow.
**Files to create:**
- `src/game/systems/DeckSystem.ts` — `buildDeck(player)`, `drawHand(deck, posture, handSize)`
  (robo ponderado, puro y testeable; usa `Math.random`), `reshuffle(...)`, `getCardApCost(skill)`,
  `weightFor(skill, posture)`.
- `src/game/systems/PostureSystem.ts` — `applyPosture(state, next)`, `postureDamageMod(posture)`,
  `postureDefenseMod(posture)`, `stanceShiftFromSkill(skill)`.
**Files to modify:**
- `src/game/systems/StatSystem.ts` — en `calculateDerivedStats()` añadir
  `actionPointsPerTurn = AP_BASE + floor(speed / AP_PER_SPEED_DIV)`.
- `src/game/systems/PlayerTurnSystem.ts` — `useSkill`: deducir **AP** además de chakra/HP;
  aplicar `stanceShift` de la skill al impactar; quitar la lógica SIDE-count/MAIN-ends-turn.
- `src/game/systems/CombatWorkflowSystem.ts` / `processUpkeep` — al iniciar el turno del jugador:
  restaurar AP (`maxAp`), robar mano de 4 ponderada por postura, mantener PASSIVE/TOGGLE upkeep.
- `src/hooks/useCombat.ts` — orquestar: `currentAp`, `hand`, `posture` en estado; acción
  "cambiar postura" (−1 AP); el turno del jugador termina por **SPACE** o AP agotado, no por MAIN;
  `startCombat` inicializa mazo/mano/AP/postura.

### F3 · UI de combate

**Goal:** Mano de 4 cartas con teclas, barra de AP, indicador de postura, SPACE termina.
**Files to create:**
- `src/components/combat/Hand.tsx` (+ CSS) — 4 `SkillCard` con `shortcutKey` Z/X/C/V; muestra
  coste AP por carta; deshabilita cartas sin AP suficiente.
- `src/components/combat/PostureIndicator.tsx` (+ CSS) — postura activa + control de cambio
  (patrón visual de `ApproachSelector`), estilo pixel-arcade.
**Files to modify:**
- `src/scenes/combat/Combat.tsx` — reemplazar los grids MAIN/SIDE/TOGGLE por `<Hand>`; extender el
  `keydown` (líneas ~128-186) con Z/X/C/V (jugar carta) y un atajo de cambio de postura; SPACE ya
  pasa turno; pasar `hand`, `currentAp`, `maxAp`, `posture` como props.
- `src/components/character/PlayerHUD.tsx` (+ CSS) — barra de **AP** (StatBar `gold`) + postura,
  bajo HP/CP.
- `src/components/combat/SkillCard.tsx` — soportar badge de **coste AP** (además del de chakra) y
  `shortcutKey` Z/X/C/V (ya soporta shortcutKey).

### F4 · Simulador (gate de BALANCE válido)

**Goal:** El simulador modela la nueva economía del jugador para que las métricas sigan siendo reales.
**Files to modify:**
- `src/simulation/BattleSimulator.ts` — bucle de turno del jugador: AP/turno, robar mano ponderada
  por postura, jugar cartas hasta agotar AP (en vez de 1 MAIN + 2 SIDE). Reusar `DeckSystem`.
- `src/simulation/SkillSelectionAI.ts` — elegir cartas de la **mano** respetando AP; heurística de
  postura.
- `src/simulation/types.ts` — métricas nuevas si aplica (AP usado/turno, cartas/turno, uso por postura).
- (verificar) los tests de `__tests__/` que asuman SIDE/MAIN.

### F5 · Limpieza legacy (OBLIGATORIA — sin dead code)

Ver sección "Legacy Code Removal".

---

## Legacy Code Removal

**Code to remove / replace:**
- `src/game/types.ts` — `TurnPhaseState` (UPKEEP/SIDE/MAIN/END, `sideActionsUsed`, `maxSideActions`)
  y `Skill.sideActionLimit`: reemplazados por AP. Evaluar si `ActionType` se conserva solo como
  **categoría de carta** (ofensiva/utilidad) o se sustituye por la categorización de `combatCards.ts`.
- `src/scenes/combat/Combat.tsx` — los 3 grids (mainSkills/sideSkills/toggleSkills, líneas ~111-114
  y ~615-649) y la `phase-bar` "SIDE/MAIN" + contador "0/2": reemplazados por `<Hand>` + barra AP.
- `src/hooks/useCombat.ts` — lógica `sideActionsUsed++` / "MAIN ⇒ ENEMY_TURN": reemplazada por
  "SPACE o AP=0 ⇒ ENEMY_TURN".
- `src/game/systems/PlayerTurnSystem.ts` — ramas que dependen de `ActionType.SIDE`/`MAIN` para
  decidir fin de turno.
- Teclas 1-4 / Q-W-E-R (Combat.tsx) → reemplazadas por Z/X/C/V de la mano.

**Migration notes:**
- `player.skills` se mantiene como **mazo**; PASSIVE siguen siempre activas (no entran al mazo).
- La math base (`calculateDamage`, `applyMitigation`, defensa, crítico) **no cambia** → los tests de
  `CombatCalculation.test.ts` deben seguir verdes sin tocarse.
- El `BattleSimulator` se actualiza en F4 **en el mismo refactor** para no dejar el gate de BALANCE
  midiendo un sistema inexistente.

---

## Ejecución a través del loop (propuesta)

Por tamaño/riesgo, ejecutar T-004 como **fases secuenciales** vía `/loop-run`, cada una con su gate
de 4 lentes (umbral ≥85) y `maxAttempts`:

1. **T-004.1** = F1 (datos/constantes) — fundacional, bajo riesgo.
2. **T-004.2** = F2 (lógica core) — el corazón; gate ARQ/SIS fuerte.
3. **T-004.3** = F3 (UI) — gate PRESENTACION con screenshots de combate.
4. **T-004.4** = F4 (simulador) — restaura validez del gate de BALANCE.
5. **T-004.5** = F5 (limpieza legacy) — sin dead code.

Checkpoint humano entre fases grandes (F2, F4). La math base intacta mantiene `calculateDamage`
verde durante todo el refactor.
