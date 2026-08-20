# T-141 · exploration

**Ring:** R0 (innermost MarkSystem/StatSystem + EnemyTurn mit prep). No port signature break. Route: autonomous.

## Spec premises vs code

- T-094 plants `suijinheki_elem_def` STAT stacks 1 duration 1 on self (`skills.ts` WATER_WALL / `suijinheki`). Tests assert plant only; comment still says StatSystem hook is deferred.
- T-140 `STAT_MARK_PRIMARY` allowlists primary keys only (`spd_down`, `blinded`, …). `suijinheki_elem_def` is ignored by design (derived flat, not PrimaryAttributes).
- `calculateDerivedStats` sets `elementalDefenseFlat = floor(spirit × FLAT_ELEM_DEF_PER_SPIRIT) + gear` (`StatSystem.ts` ~299). No Mark reader.
- `calculateDamage` STEP 5 uses `defenderDerived.elementalDefenseFlat` for ELEMENTAL (`StatSystem.ts` ~779). Physical path untouched if we only add to that field.
- `getPlayerFullStats` / `getEnemyFullStats` already take optional `marks` (T-140) and fold **primaries** only. Production `App.tsx` playerStats omits marks. `useCombat` enemyStats passes marks (enemy-targeted STAT). Suijinheki is **self/player**.
- Live enemy-hit vs player: `EnemyTurnSystem.executeEnemyAction` already has `combatState.marks` as `actionMarks` and builds `defenderDerived` from `playerStats.derived` (evasion overlay only). This is the shared mit prep that already receives marks.

## Relevant files

| Path | Why |
|---|---|
| `src/game/systems/MarkSystem.ts` | T-140 STAT primary helpers; add elem-def helper beside them |
| `src/game/systems/StatSystem.ts` | derived elem flat + `calculateDamage` mit; getters already have `marks` |
| `src/game/systems/EnemyTurnSystem.ts` | live enemy-hit defenderDerived (player is defender) |
| `src/game/constants/skills.ts` ~1933 | plant `suijinheki_elem_def` (do not reauthor) |
| `src/game/systems/__tests__/t094Suijinheki.test.ts` | plant-only; deferred-hook comment |
| `src/game/systems/__tests__/t140StatMarksLive.test.ts` | pattern for allowlist + live getter tests |
| `src/game/systems/__tests__/t135ShieldMarksLive.test.ts` | `executeEnemyAction` live fixture pattern |
| `src/simulation/StatMarksLiveBalance.ts` | probe pattern to copy |

## Ports / interfaces to reuse

- `TacticalSetup` / `Mark` / `CombatActor` / `MarkFamily.STAT`
- `elementalDefenseFlatFromMarks(marks, target): number` (new, beside `primaryDeltasFromStatMarks`)
- `getPlayerFullStats(player, marks?)` / `getEnemyFullStats(enemy, marks?)` — optional `marks` already exists
- `executeEnemyAction(..., combatState)` already carries marks

No new port. No signature break for 0-arg getter callers (default `[]`).

## Local dependency map

```
EnemyTurnSystem → StatSystem.calculateDamage, MarkSystem (shield/dots/stun)
StatSystem.get*FullStats → MarkSystem.applyStatMarksToPrimaryStats
MarkSystem ↛ StatSystem
```

## Existing tests

- `t094Suijinheki.test.ts` — authoring + plant; no live flat
- `t140StatMarksLive.test.ts` — primaries only; `aim` ignored
- `StatSystem.test.ts` — `calculateDamage` elemental effectiveness; no marks
- `t135ShieldMarksLive.test.ts` — live enemy-hit HP delta via `executeEnemyAction`

## Surprises / debt (no solutions)

- Production `playerStats` (`App.tsx`) never passes `combatState.marks`. Getter fold-in alone would not hit live enemy attacks unless EnemyTurn overlays from `actionMarks`.
- Folding in **both** getters (when callers pass marks) **and** EnemyTurn (from `actionMarks` onto marks-less `playerStats`) must not double-count: live `playerStats` is marks-less today.
- `CESAR_DAMAGE_CONSTANT` ×2 means +1 flat typically −2 **final** damage; AC allows derived +1 **or** lower mit damage — do not assert HP Δ === 1.
- `applyMitigation` in CombatCalculationSystem is buff-shield, not elemental flat. Wrong site.
- Grep `suijinheki_elem_def` outside constants/tests/sim plant probe = empty. Hook is still missing.
