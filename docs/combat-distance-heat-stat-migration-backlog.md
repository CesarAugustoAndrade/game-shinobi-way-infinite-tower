# Backlog de commits: stats → distancia → HEAT

Fuente: [`combat-distance-heat-stat-migration-plan.md`](./combat-distance-heat-stat-migration-plan.md)  
Estado: **F1 + F2 + F3 implementados en branch** (B1 balance duración pendiente). Este doc es el desglose operativo en commits.

## Reglas de ejecución

1. **Orden fijo:** Fase 1 completa → Fase 2 → Fase 3 → balance.
2. **Sin escalas mixtas en runtime.** Dentro de Fase 1 se permiten commits intermedios solo si el árbol no se usa como build jugable a medias (ideal: feature branch hasta el cierre de F1).
3. **Cada commit debe compilar** (`npx tsc --noEmit`). Preferible que `npm test` también pase tras cada commit de F1 que toque fixtures.
4. **No crear unit tests nuevos.** Solo ajustar fixtures/assertions existentes.
5. **Higiene git:** no incluir arte/untracked ajeno (`public/assets/…`, `scratch/`, scripts de skills). Path-scoped adds. Formato: `feat:` / `fix:` / `refactor:` / `docs:`.
6. **Actualizar `CHANGELOG.md` `[Unreleased]`** al cerrar cada fase (o al final de F1 si los commits intermedios son muy granulares).
7. **Lógica pura en `src/game/systems/`.** React solo presenta y despacha. Logging en archivos de logging, no en el core.

### DoD de fase (Definition of Done)

| Fase | Gate mínimo |
|------|-------------|
| F1 | `tsc`, `build`, `test`, `simulate:quick`, `simulate:progression`; checklist manual F1 |
| F2 | Igual + manual distancia/AP/IA |
| F3 | Igual + manual HEAT/cadena/Hunter |
| Balance | Duración Normal 4–6 / Elite 7–10 / Boss-Hunter 10–14 |

---

## Vista rápida del backlog

| ID | Fase | Commit (título) | Riesgo | Depende de |
|----|------|-----------------|--------|------------|
| F1-C1 | Stats | Contrato tipos + fórmulas derivadas + impact | H | — |
| F1-C2 | Stats | Daño skill `baseDamage`/`scalingPerPoint` + Reaper KO | H | F1-C1 |
| F1-C3 | Stats | Enemigos presupuesto aditivo | H | F1-C1 |
| F1-C4 | Stats | Level-up `unspentStatPoints` + modal | H | F1-C1 |
| F1-C5 | Stats | Equipo +1, training +1/+2, buffs enteros | H | F1-C1 |
| F1-C6 | Stats | Eventos / approaches / reqs skills reauth | H | F1-C1, F1-C2 |
| F1-C7 | Stats | UI consumidores + upgrade growth + help | M | F1-C2…C6 |
| F1-C8 | Stats | Fixtures, sims, FORMULAS, CHANGELOG F1 | H | F1-C1…C7 |
| F2-C1 | Dist | Tipos + `RangeSystem` puro | M | F1 DoD |
| F2-C2 | Dist | CombatState + seed + player move/gate | M | F2-C1 |
| F2-C3 | Dist | Enemy AP + AI + Guard | H | F2-C2 |
| F2-C4 | Dist | UI banda/move/block reason + previews | M | F2-C2 |
| F2-C5 | Dist | Sims/auto-combat paridad + docs F2 | M | F2-C3, F2-C4 |
| F3-C1 | HEAT | `heat`/`hunterArmed` + helpers puros | L | F2 DoD |
| F3-C2 | HEAT | Content `heatDelta` audit | H | F3-C1 |
| F3-C3 | HEAT | Approach penalties + bias de banda inicial | M | F3-C1, F2 |
| F3-C4 | HEAT | **EncounterChain** (split victory) | H | F3-C1 |
| F3-C5 | HEAT | Elite chain roll + segundo combate | H | F3-C4 |
| F3-C6 | HEAT | Hunter EXIT swap + +40 spawn | M | F3-C1, F1-C3 |
| F3-C7 | HEAT | UI meter + previews + docs F3 | M | F3-C2…C6 |
| B1 | Balance | Constantes y retune duración | H | F3 DoD |

> **Nota:** F1-C2 y F1-C3 pueden paralelizarse tras F1-C1 en worktrees distintos; no mergear a `develop` hasta que F1-C8 cierre la escala.

---

# FASE 1 — Stats (corte atómico de escala)

## F1-C1 — Contrato de tipos y fórmulas derivadas

**Título:** `feat: rewrite derived stats, impact, AP and integer buffs`

### Objetivo

Sustituir el núcleo matemático sin dejar la evasión doble ni las fórmulas viejas. El catálogo de skills puede seguir compilando si se mantiene temporalmente un puente **solo en el mismo commit** o se deja `damageMult` un commit más (preferible: F1-C2 inmediato en la misma PR stack).

### Archivos

| Path | Acción |
|------|--------|
| `src/game/types.ts` | `Player.unspentStatPoints`; revisar `DerivedStats` (quitar o anular `evasion` como dodge); `STAT_FORMULAS` alineados al plan |
| `src/game/systems/StatSystem.ts` | `calculateDerivedStats`, `calculateDamage` (impact único), `applyBuffsToPrimaryStats` (±enteros, floor 1), `applyDefenseSlice` caps plan |
| `src/game/constants/index.ts` | `CLAN_STATS` → bases 1 + afinidades 3; **no borrar aún `CLAN_GROWTH`** si F1-C4 es siguiente (o borrar y dejar compile break consciente) |
| `src/config/featureFlags.ts` / `src/game/config.ts` | `LaunchProperties` AP (`AP_BASE`, divisores); limpia `BALANCE` evasion dead |
| `src/game/entities/Player.ts` | `createPlayer` con nuevas bases + `unspentStatPoints: 0` (level helpers legacy en C4) |

### Checklist

- [ ] HP max = `100 + 25 × WILLPOWER`
- [ ] Chakra max = `30 + 15 × CHAKRA`
- [ ] Def plana = `1 × STR/SPI/CAL` por tipo
- [ ] Def % = `stat/(stat+18)` cap 65%
- [ ] Impact = `clamp(60, 98, 90 + 6×(statAtk − SPEED_def))`; MELEE→SPD, RANGED→ACC, AUTO always
- [ ] Sin segunda tirada de evasión (`isEvaded` eliminado o siempre false)
- [ ] Iniciativa = `10 + 5 × SPEED`
- [ ] AP = `min(9, 3 + floor((SPEED−1)/2))`
- [ ] Crit / resist / guts / regens según plan
- [ ] Buffs: enteros; `Math.max(1, stat)`
- [ ] Flat def antes de % def (NORMAL)

### Gate

- [ ] `npx tsc --noEmit` (puede fallar tests de fórmula hasta F1-C8; si se tocan tests mínimos aquí, solo los de StatSystem que bloquean)

### Riesgos

- Terrain/room `evasionBonus` en `EnemyTurnSystem` / `RoomCombatModifierSystem` / `CombatCalculationSystem`: retarget a impact o desactivar dodge.

---

## F1-C2 — Contrato de daño de skills + Reaper

**Título:** `feat: replace damageMult with baseDamage and scalingPerPoint`

### Objetivo

Hard cutover del campo `damageMult`. Sin alias silencioso.

### Archivos

| Path | Acción |
|------|--------|
| `src/game/types.ts` | `Skill.baseDamage`, `scalingPerPoint`; HP cost tipado (`flat` \| `percentMax` \| `all`); quitar `damageMult`; opcional `hitCount?`, flag control, efecto mutual KO |
| `src/game/constants/skills.ts` | **116 skills** reauth (presupuesto por tier @ stat 3; splits base/scale; chakra bands; utility 0/0) |
| `src/game/systems/StatSystem.ts` | raw = `baseDamage + scalingPerPoint × effectivePrimary` |
| `src/game/systems/EnemyAISystem.ts` | `estimateDamage` + thresholds (`> 1.5` mult → nueva métrica) |
| `src/game/systems/EnemySystem.ts` | pick skill dañina (`baseDamage`/`scaling`) |
| `src/game/systems/PlayerTurnSystem.ts` | HP cost tipado; mutual KO Reaper |
| `src/game/systems/EnemyTurnSystem.ts` | mismo afford/spend HP si aplica |
| `src/game/systems/CombatSimulationService.ts` | pick/spend |
| `src/game/constants/combatCards.ts` | `getCardCategory` sin `damageMult` |
| `src/App.tsx`, `src/hooks/useActivityHandlers.ts` | upgrade growth sobre base/scale (no `* 0.2` mult) |
| `src/components/combat/Hand.tsx`, `SkillCard.tsx` | label daño |
| `src/scenes/combat/Combat.tsx` | affordability copy |
| `src/simulation/BuildGenerator.ts`, `SkillSelectionAI.ts` | scores |
| `src/game/systems/__tests__/testFixtures.ts` | `createMockSkill` |

### Checklist reauth skills (por skill dañina)

- [ ] Tier budget: Basic 18 / Adv 26 / Hidden 36 / Forb 48 / Kin 64 @ stat 3
- [ ] Split % base/scale por tier (plan)
- [ ] Multi-hit: budget dividido (campo o bake)
- [ ] Control fuerte −20%; AP1 −20%; AP2 base; AP3 +25%; CD≥4 +15%; HP sacrifice +20%; cap +40%
- [ ] Utility: `0`/`0`
- [ ] Chakra en banda de tier
- [ ] Reqs: Basic 1 / Adv 2 / Hidden 3 / Forb 5 / Kin 7
- [ ] Reaper: efecto KO mutuo; sin 999/9999

### Gate

- [ ] Grep limpio: `damageMult` solo en `stanceBonus.damageMultBonus` (posture) o renombrado con claridad
- [ ] `tsc` limpio

---

## F1-C3 — Enemigos aditivos

**Título:** `feat: additive enemy stat budget by rank and archetype`

### Objetivo

Reemplazar el pipeline multiplicativo de `generateEnemy` como unidad.

### Archivos

| Path | Acción |
|------|--------|
| `src/game/systems/EnemySystem.ts` | Bases plan; `budget = (D−1)+floor(cleared/2)+round((diff−40)/20)+rankBonus`; ciclo por prioridades; floor 1 |
| `src/game/types.ts` | Opcional `EnemyRank` / `preferredRange` placeholder; campos mult HP/dmg/reward para Hunter futuro |
| `src/game/systems/LocationSystem.ts` | `generateGuardian` → rank Guardian (4); immutable; Elite Challenge = Elite (3) sin double-dip confuso |
| `src/game/config.ts` | Retirar uso de mults enemigo en gen (`ENEMY_BALANCE` elite mults, danger HP/DMG factors en gen) |
| `src/game/entities/Enemy.ts` | Borrar templates legacy o alinear; no reimportar bases 6–22 |
| `src/simulation/EnemyArchetypes.ts` | Paridad con gen live |
| `src/hooks/useCombatVictory.ts` | Revisar XP por tier string (mantener labels o mapear a rank) |
| `src/game/systems/LootSystem.ts` | Drops por tier si dependen de strings |

### rankBonus

| Rank | Bonus |
|------|------:|
| Normal | 0 |
| Ambush | 1 |
| Elite | 3 |
| Guardian | 4 |
| Boss | 7 |

### Checklist

- [ ] Sin rubber-band a stats del jugador
- [ ] Boss identity (`getBossData`) solo nombre/kit/elemento; stats del budget Boss
- [ ] Guardian no es “ELITE + parches” ad hoc
- [ ] Tests `EnemySystem.test.ts` / Roto: expectativas de magnitud actualizadas en F1-C8 si no aquí

### Gate

- [ ] `tsc`; gen de D1 vs D7 monotónico en HP

---

## F1-C4 — Level-up con puntos sin gastar

**Título:** `feat: unspent stat points and mandatory assign modal`

### Objetivo

Quitar `CLAN_GROWTH`; un punto por nivel; modal no cancelable; heal solo tras asignar.

### Archivos

| Path | Acción |
|------|--------|
| `src/game/constants/index.ts` | **Eliminar `CLAN_GROWTH`** |
| `src/game/systems/LevelSystem.ts` | `applyLevelUp`: solo `unspentStatPoints += levels`; **sin** auto-stats ni heal |
| `src/game/systems/StatSystem.ts` o `LevelSystem` | `assignStatPoints(player, alloc)`; `finalizeLevelUpResources` (full HP/CP) |
| `src/game/entities/Player.ts` | **Borrar** `checkLevelUp` / `addExperience` legacy |
| `src/App.tsx` | `checkLevelUp` sin growth map; gate de estado si `unspent > 0` |
| **Nuevo UI** p.ej. `src/components/modals/StatAssignModal.tsx` | Obligatorio; no cierra con puntos |
| `src/components/modals/RewardModal.tsx` | Texto “puntos pendientes” en lugar de growth list |
| `src/hooks/useCombatVictory.ts` | Flujo: reward → assign → heal → loot (orquestación App) |
| `src/hooks/useActivityHandlers.ts` | Event XP → mismo gate |
| `src/simulation/BuildGenerator.ts`, `CampaignSimulator.ts`, `ProgressionSimulator.ts` | Política auto-spend para sims |

### Flujo objetivo

```
XP → applyLevelUp(+unspent, no heal)
  → RewardModal
  → StatAssignModal (must spend all)
  → finalizeLevelUpResources(full HP/CP)
  → loot / explore
```

### Checklist

- [ ] Multi-level acumula puntos
- [ ] No se puede explorar/combatir/merchant con `unspent > 0`
- [ ] Confirm gasta todos y cura
- [ ] Sims no se cuelgan esperando modal

### Gate

- [ ] Manual: 5 clanes start; multi-level bloquea y cura tras assign

---

## F1-C5 — Equipo, training y buffs de contenido

**Título:** `feat: reauth gear +1 training and integer approach buffs`

### Archivos

| Path | Acción |
|------|--------|
| `src/game/constants/components.ts` | Primary contribution **+1** |
| `src/game/systems/LootSystem.ts` | Sin floor/quality mult en **primarias**; synth/upgrade no inflan a escala vieja |
| `src/game/constants/synthesis.ts` | 45 recipes: primarias temáticas máx **+1** |
| `src/game/config.ts` / `StatSystem` | **Quitar o rediseñar `PRIMARY_SLOT_MULTIPLIER` 1.5** |
| `src/game/systems/LocationSystem.ts` | `generateTrainingActivity`: gain 1; jackpot `5% × Danger` → un +2 a ×2.5 cost; pasar danger |
| `src/hooks/useActivityHandlers.ts` | Training apply sin cambios de semántica |
| `src/scenes/activities/Training.tsx` | UI oferta +2 |
| `src/game/constants/approaches.ts` | Buff/debuff ±1/±2 (no 0.08–0.25); initiativeBonus reescalado |
| `src/game/constants/skills.ts` | Passive `statBonus` a escala +1 (si no quedó en C2) |
| `src/game/systems/CampaignSystem.ts` | Boon items +1 scale |

### Checklist

- [ ] Artefacto = suma componentes + ≤1 temático
- [ ] Training: máx un +2 por sala
- [ ] Approaches ya no usan buffs fraccionales

### Gate

- [ ] Loot equip no da +20 en una pieza

---

## F1-C6 — Eventos, approaches gates, skill reqs residuales

**Título:** `feat: reauth event and approach gates to narrative stat scale`

### Archivos

| Path | Acción |
|------|--------|
| `src/game/constants/events/genericEvents.ts` | minStat + statChanges |
| `src/game/constants/events/academyArcEvents.ts` | idem |
| `src/game/constants/events/examsArcEvents.ts` | SPEED 40 → 7–9 |
| `src/game/constants/events/rogueArcEvents.ts` | outliers +5/+5 |
| `src/game/constants/events/warArcEvents.ts` | +8/+10 bijuu → enteros pequeños |
| `src/game/constants/events/wavesArcEvents.ts` | mayor volumen |
| `src/game/constants/approaches.ts` | minStat(s) 1–9 narrative |
| `src/game/constants/skills.ts` | reqs residuales si C2 no los tocó todos |
| `src/game/systems/EventSystem.ts` | Solo si la shape de effects cambia |

### Conteos

- ~37 minStat gates → 1/2/3/5/7/9  
- ~17 statChanges a rebalancear  
- 6 approaches  

### Checklist

- [ ] Escala narrativa documentada: base/entrenado/especialista/experto/maestro/legendario
- [ ] Ningún check ≥ 10 sin justificación de build endgame

### Gate

- [ ] `EventSystem` / content tests existentes verdes o actualizados en C8

---

## F1-C7 — UI y copy de consumidores

**Título:** `feat: update stat UI, ranks, tooltips for new scale`

### Archivos

| Path | Acción |
|------|--------|
| `src/components/character/PrimaryStatsPanel.tsx` | Tooltips fórmulas nuevas |
| `src/components/character/DerivedStatsPanel.tsx` | Quitar/reemplazar Evasion; AP/impact |
| `src/scenes/character/CharacterSelect.tsx` (o path real) | Rank thresholds D–S para bases 1–3 |
| `src/game/utils/tooltipFormatters.ts` | Buffs enteros no % |
| `src/game/constants/helpText.ts` | AP, equipo, approaches, training |
| `src/scenes/activities/Training.tsx` | `STAT_INFO.benefits` |
| `src/components/combat/Hand.tsx` | Ya parcialmente en C2; polish |
| Elite/combat panels | Números de def/stat legibles |

### Checklist

- [ ] Ningún help text con “DEX 16+” / “AP per 10 Speed” viejo
- [ ] Ranks no marcan siempre D

---

## F1-C8 — Fixtures, sims, docs (cierre Fase 1)

**Título:** `fix: reauth fixtures and sims for new stat economy`

### Archivos

| Path | Acción |
|------|--------|
| `src/game/systems/__tests__/testFixtures.ts` | BASE ~1–3 / mid 5–7; mock gear +1; buffs enteros |
| `StatSystem.test.ts`, `LevelSystem.test.ts` | Expectativas nuevas |
| `PlayerTurnSystem`, `EnemyTurnSystem`, `EnemyAI`, `CombatSimulation`, `combatCards`, `Approach`, `Event`, Roto* | Ajustar asserts |
| `src/simulation/BuildGenerator.ts` | Presets 1–9; sin CLAN_GROWTH |
| `src/simulation/*` | IntelligenceTier bands, scoreItem, etc. |
| `docs/FORMULAS.md` | Reescribir al código post-migrate |
| `CHANGELOG.md` | `[Unreleased]` bloque Fase 1 |

### Gate Fase 1 (DoD)

- [ ] `npx tsc --noEmit`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run simulate:quick`
- [ ] `npm run simulate:progression`
- [ ] Manual F1 (plan §5): clanes, multi-level modal, AP→9, training +2, sin dual-scale

### Prohibido al cerrar F1

- [ ] No queda `CLAN_GROWTH`
- [ ] No queda `damageMult` de skill
- [ ] No quedan helpers level-up en `Player.ts`
- [ ] No hay conversión runtime “1 = 10 viejo”

---

# FASE 2 — Distancia

## F2-C1 — Tipos y sistema puro de rango

**Título:** `feat: add CombatRange types and pure RangeSystem`

### Archivos

| Path | Acción |
|------|--------|
| `src/game/types.ts` | `CombatRange` CLOSE/MEDIUM/LONG; move direction/subject/triggers; `Skill.allowedRanges?`; `Enemy.preferredRange?` o map por arquetipo |
| **Nuevo** `src/game/systems/RangeSystem.ts` | `defaultsForAttackMethod`, `skillAllowedAt`, `preferredRangeForEnemy`, `resolveInitialRange`, `shiftRange`, `clampBand`, stub `collectRangeReactions` |
| `src/game/constants/enemyArchetypes.ts` o `EnemySystem` | Map Tank/Assassin CLOSE, Caster/Genjutsu LONG, Balanced MEDIUM |

### Defaults AttackMethod

| Method | Ranges |
|--------|--------|
| MELEE | CLOSE |
| RANGED | MEDIUM, LONG |
| AUTO | CLOSE, MEDIUM, LONG |
| Override | `Skill.allowedRanges` |

### Checklist

- [ ] Distancia **solo gatea** skills (sin mod global dmg/crit/acc)
- [ ] Reacciones: infra vacía, sin adaptar skills/ítems existentes
- [ ] Defaults pueden dejar “todo permitido” un commit si hace falta tsc verde en stack

---

## F2-C2 — CombatState, seed, move jugador

**Título:** `feat: combat range state and voluntary player movement`

### Archivos

| Path | Acción |
|------|--------|
| `src/game/systems/combat-types.ts` | `currentRange`, `playerMoveUsedThisTurn`, (enemy AP fields pueden ir en C3) |
| `src/game/systems/CombatWorkflowSystem.ts` | `createCombatState` seed range |
| `src/hooks/useCombat.ts` | Seed post-approach; acción move 1 AP, 1 banda, 1×/turno |
| `src/game/systems/PlayerTurnSystem.ts` | Reset move flag en upkeep; validación move |
| `src/game/constants/approaches.ts` / `ApproachSystem` | Tabla banda inicial por approach success |
| `src/game/systems/ApproachSystem.ts` | Opcional campo en `ApproachResult` / helper puro |

### Banda inicial (éxito)

| Approach | Band |
|----------|------|
| Frontal Assault | MEDIUM |
| Silent Strike | CLOSE |
| Genjutsu Setup / Mind Trap | LONG |
| Environmental Trap / Terrain Trap | LONG |
| Iron Guard | MEDIUM |
| Shadow fail | preferred enemigo |
| Fallo general | preferred enemigo |

### Checklist

- [ ] Sin tirada enfrentada ni OA
- [ ] PUSH/PULL: 1 banda, 0 AP, no consumen move; reacciones stub; clamp en borde sin reacción
- [ ] Sobre costes AP se suman; si no puede pagar, move bloqueado

---

## F2-C3 — AP enemigo, IA, Guard

**Título:** `feat: enemy AP economy and range-aware AI`

### Archivos

| Path | Acción |
|------|--------|
| `src/game/systems/combat-types.ts` | `enemyCurrentAp`, `enemyMaxAp`, `enemyMoveUsedThisTurn` |
| `src/hooks/useCombat.ts` / `EnemyTurnSystem` | Mismo pipeline AP + terreno que jugador |
| `src/game/systems/EnemyTurnSystem.ts` | Secuencia move → skill; 1 skill/turno |
| `src/game/systems/EnemyAISystem.ts` | (1) skill válida en banda (2) skill con 1 move (3) move preferred + Guard |
| Guard | Acción noop explícita o skill sintética; dejar de spamear `skills[0]` en CD total |

### Checklist

- [ ] Mismo cálculo AP que jugador
- [ ] Telegraph/intent en rango tras plan de movimiento
- [ ] No soft-lock enemigo sin acción

---

## F2-C4 — UI combate

**Título:** `feat: combat UI for range band and move controls`

### Archivos

| Path | Acción |
|------|--------|
| `src/scenes/combat/Combat.tsx` | Chip banda; botones approach/retreat; `canUseSkill` + `getSkillBlockReason` “Out of range” |
| `src/components/combat/Hand.tsx`, `SkillCard.tsx` | Disabled + reason |
| Pattern A dock | Mover controles en econ bar junto a posture |

### Checklist

- [ ] Muestra banda, coste final de move, rangos permitidos de card, motivo de bloqueo
- [ ] Preview y resolución usan mismos helpers puros

---

## F2-C5 — Sims + docs Fase 2

**Título:** `feat: range parity in auto-combat and simulators`

### Archivos

| Path | Acción |
|------|--------|
| `src/game/systems/CombatSimulationService.ts` | Range + enemy AP |
| `src/simulation/BattleSimulator.ts` | idem |
| `src/simulation/SkillSelectionAI.ts` | scoring con rango |
| Tests existentes de AI/turn | Ajustar |
| `CHANGELOG.md`, `docs/FORMULAS.md` o help | Distancia/AP |

### Gate Fase 2 (DoD)

- [ ] Manual: defaults/overrides, move P/E, PUSH/PULL, cards/telegraph/preview/auto coinciden
- [ ] `tsc`, `build`, `test`, sims

---

# FASE 3 — HEAT + Hunter + cadena

## F3-C1 — Estado heat en visita

**Título:** `feat: BranchingFloor heat and hunterArmed state`

### Archivos

| Path | Acción |
|------|--------|
| `src/game/types.ts` | `BranchingFloor.heat`, `hunterArmed`; enums `HeatTier`; presets numéricos |
| **Nuevo** `src/game/systems/HeatSystem.ts` (o similar) | clamp 0–100; applyDelta; latch; tierFromHeat; **no** auto por room/time/win |
| `src/game/systems/LocationSystem.ts` | Init heat 0 / hunterArmed false en `generateBranchingFloorFromConfig` |
| Hooks enter/leave | Confirmar reset al descartar floor; dual `locationFloor`/`branchingFloor` |

### Checklist

- [ ] HEAT no en `Location` persistente
- [ ] HEAT no cambia en turnos de combate
- [ ] HEAT no buffea stats de encuentros ordinarios

---

## F3-C2 — Auditoría heatDelta en contenido

**Título:** `feat: author heatDelta across activities events and approaches`

### Archivos

| Path | Acción |
|------|--------|
| `src/game/types.ts` | `heatDelta?` en activities, `TrainingOffer`, treasure, `ApproachEffects`, `EventOutcome.effects` |
| `src/game/constants/events/*.ts` | ~190 outcomes: delta o `0` intencional |
| `src/game/constants/approaches.ts` | Fail deltas: Frontal/Iron +5; Trap/Genjutsu +10; Silent +15; Shadow +20; success 0 |
| `LocationSystem` generators | Room entry, training, treasure, rest, merchant defaults (presets 0/±5/±10/±20/+30) |
| Apply paths | `EventSystem`, `useActivityHandlers`, `useTreasureHandlers`, approach execute |

### Checklist

- [ ] Camino obligatorio normalmente 0
- [ ] Recompensas opcionales elevan heat (codicia)
- [ ] UI determinista muestra delta exacto; ponderados min–max + warning umbral (puede ir a F3-C7)

---

## F3-C3 — Penalties de approach + bias de banda

**Título:** `feat: heat approach penalties and initial range bias`

### Archivos

| Path | Acción |
|------|--------|
| `src/game/systems/ApproachSystem.ts` | PP penalty tras chance normal, pre-clamp |
| `src/game/systems/RangeSystem.ts` | HEAT 0–49 sin shift; 50–74 nudge preferred; 75–100 force preferred; fail → preferred |
| `ApproachSelector` | Mostrar % ajustado |

### Tabla penalties (plan)

| Approach | 25–49 | 50–74 | 75–100 |
|----------|------:|------:|-------:|
| Iron Guard | 0 | −5 | −15 |
| Frontal | 0 | −10 | −20 |
| Env Trap | −5 | −15 | −30 |
| Genjutsu | −5 | −20 | −35 |
| Silent | −10 | −25 | −45 |
| Shadow | −15 | −30 | −50 |

---

## F3-C4 — EncounterChain (split victory) ⚠️ bloqueante

**Título:** `refactor: deferred encounter rewards transaction`

### Objetivo

Separar **acumular** vs **commit** **antes** de introducir el segundo combate HEAT.

### Archivos

| Path | Acción |
|------|--------|
| **Nuevo** `src/game/systems/EncounterChainSystem.ts` (puro) | Buffer XP/Ryo/intel/loot/level points/activity key; stage |
| `src/hooks/useCombatVictory.ts` | Split: `accumulateVictory` / `commitEncounterRewards` |
| `src/hooks/useCombat.ts` | Victory no asume payout final |
| `src/App.tsx` | RewardModal solo en commit; level assign post-commit |
| Auto paths | `handleAutoCombat`, event combat: mismo API |
| **No** reusar `pendingArtifact` / `eliteChallenge` para HEAT |

### Checklist estricto

- [ ] Entre combates: **no** pay / heal / level / complete activity
- [ ] XP buffer sin `applyLevelUp` hasta commit
- [ ] `startCombat` del 2º pelea conserva HP/CP y resetea mano/CD/postura
- [ ] Locks de victory rearmados tras commit, no tras pelea 1
- [ ] Approach mult solo pelea 1 (guardar en chain; auto no pierde mult)

### Gate

- [ ] Manual/test conceptual: un combate normal sigue igual vía commit inmediato
- [ ] Sin regresión en Elite Challenge autorado

---

## F3-C5 — Cadena élite por HEAT

**Título:** `feat: heat-triggered elite ambush chain`

### Archivos

| Path | Acción |
|------|--------|
| `HeatSystem` / `EncounterChainSystem` | Roll post-Normal: 0–49 → 0%; 50–74 → 25%; 75–99 → 50%; 100 → 0% |
| `useCombatVictory` | Tras accumulate pelea 1, roll → spawn elite → `startCombat` o commit |
| `EnemySystem` | Generar élite de cadena (rank Elite), no `eliteChallenge` activity |
| Exclusiones | Tutorial, Elite Challenge, Guardian, Hunter, bosses |
| Reward | Dual win → un modal; elite reward context propio |

### Checklist

- [ ] Tirada tras delta heat del resultado, antes de pay
- [ ] Muerte en pelea 2: política explícita (documentar: ¿bank pelea 1 o nada?)
- [ ] Event-triggered Normal también puede chain

---

## F3-C6 — Hunter en EXIT

**Título:** `feat: hunter armed EXIT upgrade and spawn bonus`

### Archivos

| Path | Acción |
|------|--------|
| `LocationSystem.ts` | `armHunterOnFloor` / swap immutable; `calculateExitProbability` +40 si `hunterArmed` y post-min rooms; cap 90%; force intacto |
| `EnemySystem` | Hunter from Guardian: ×1.75 HP, ×1.35 dmg, preferred range, 2× XP/Ryo, artifact garantizado |
| `useCombatVictory` / Loot | Reward branches Hunter |
| UI copy | RoomCard / LocationMap “Hunter” vs Guardian |

### Checklist

- [ ] EXIT ya existe → replace inmediato al armar
- [ ] EXIT no existe → no forzar spawn pre-min; solo +40 después
- [ ] Latch `hunterArmed` no se resetea aunque heat baje
- [ ] HEAT 100 desactiva élite chain (reserva amenaza al Hunter)

---

## F3-C7 — UI HEAT + docs Fase 3

**Título:** `feat: heat meter UI and HEAT documentation`

### Archivos

| Path | Acción |
|------|--------|
| `src/components/exploration/LocationMap.tsx` | Meter (mirror intel): tier + cifra + HUNTER ARMED |
| `src/components/layout/ExplorationHUD.tsx` | Chip opcional |
| Event UI | min–max heat + threshold warning |
| ApproachSelector | fail heat delta + % |
| `helpText.ts`, `CHANGELOG.md`, `FORMULAS.md` si aplica | |

### Gate Fase 3 (DoD)

- [ ] Umbrales exactos 24/25, 49/50, 74/75, 99/100
- [ ] Cadena no paga ni cura entre combates
- [ ] EXIT swap / +40
- [ ] `tsc`, `build`, `test`, sims
- [ ] Manual plan §5 HEAT

---

# FASE 4 — Balance

## B1 — Duración de combates

**Título:** `balance: tune combat duration for normal elite and boss`

### Objetivo

4–6 Normal, 7–10 Elite, 10–14 Boss/Hunter; sin builds incapaces por rango/AP.

### Archivos (típicos)

- `src/game/config.ts`, `featureFlags` mults
- Skill budgets residuales, enemy rankBonus/bases
- Terrain AP costs si starve
- Sims: `simulate:progression` como señal primaria

### Checklist

- [ ] No builds soft-lock por rango
- [ ] AP enemigo no deja bosses en free multi-skill
- [ ] CHANGELOG nota de balance

---

# Orden de PR / stack sugerido

```
develop
  └─ feat/stats-migration          (F1-C1 … F1-C8)  ← un merge grande o stack Graphite
       └─ feat/combat-distance     (F2-C1 … F2-C5)
            └─ feat/heat-system    (F3-C1 … F3-C7)
                 └─ balance/combat-duration (B1)
```

Si se usa stack de PRs dentro de F1:

```
F1-C1 → F1-C2 → F1-C3 → F1-C4 → F1-C5 → F1-C6 → F1-C7 → F1-C8
```

Paralelizable solo: **F1-C2 ∥ F1-C3** tras C1, con merge-order fijo antes de C8.

---

# Checklist de aceptación global (copiar del plan)

### Automático

- [ ] `npx tsc --noEmit`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run simulate:quick`
- [ ] `npm run simulate:progression`

### Manual mínimo

- [ ] Cinco clanes con reparto correcto
- [ ] Subida múltiple bloquea, reparte, cura después
- [ ] AP hasta 9 y terreno
- [ ] Training +2 máx una vez/sala ×2.5
- [ ] Rango defaults/overrides, move P/E, PUSH/PULL
- [ ] Cards / telegraph / preview / auto = resolución real
- [ ] HEAT tiers y latches en límites
- [ ] Cadena élite sin pay/heal mid
- [ ] EXIT hunter swap / +40 post-min
- [ ] Duración objetivo turnos

### Arquitectura

- [ ] Cálculos en `src/game/systems/`, sin React/DOM
- [ ] Updates inmutables
- [ ] Logging separado
- [ ] Sin unit tests nuevos (solo fixtures)
- [ ] Sin aliases `damageMult` / `CLAN_GROWTH` / evade doble / level helpers legacy

---

# Índice de paths ancla (referencia rápida)

| Dominio | Paths |
|---------|--------|
| Tipos | `src/game/types.ts`, `combat-types.ts` |
| Stats/daño | `StatSystem.ts`, `config.ts`, `featureFlags.ts` |
| Level | `LevelSystem.ts`, `entities/Player.ts`, `App.tsx` |
| Skills | `constants/skills.ts`, `combatCards.ts` |
| Enemigos | `EnemySystem.ts`, `entities/Enemy.ts`, `LocationSystem.ts` |
| Combate | `PlayerTurnSystem`, `EnemyTurnSystem`, `EnemyAISystem`, `useCombat.ts` |
| Victory | `useCombatVictory.ts` |
| Approaches | `approaches.ts`, `ApproachSystem.ts` |
| Contenido | `constants/events/*`, `components.ts`, `synthesis.ts` |
| UI | `Hand.tsx`, `Combat.tsx`, `LocationMap.tsx`, `RewardModal.tsx` |
| Sims | `src/simulation/*` |
| Spec | `docs/combat-distance-heat-stat-migration-plan.md` |

---

# Estado del backlog

| Fase | Commits | Estado |
|------|---------|--------|
| F1 Stats | C1–C8 | Pendiente |
| F2 Distancia | C1–C5 | Pendiente |
| F3 HEAT | C1–C7 | Pendiente |
| Balance | B1 | Pendiente |

**Siguiente acción recomendada:** abrir branch `feat/stats-migration` e implementar **F1-C1**.
