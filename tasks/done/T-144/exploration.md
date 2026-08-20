# T-144 · exploration

**Ring:** R0 (EnemyTurn lethal + PlayerTurn `buildUpkeepWeightContext`). No port signature break.

## Spec premises vs code

- T-130 helpers exist: `applyReanimationLethal` (lethal → HP 1, strip, plant `reanimation_shield` 40) and `reanimationRoleBonuses` (ATTACK +1 while armed). Live comments still “optional.”
- Enemy hit path (`executeEnemyAction` ~569): shield → `checkLethalDamage` (guts rng). No Reanimation prelude.
- Other EnemyTurn lethal sites (hazard/DoT) pass `incomingDamage: 0` after HP already reduced — helper’s `incomingDamage > 0` gate would not fire without adapting. AC is enemy hit.
- `buildUpkeepWeightContext` sets `supportRoleBonuses: consumed.roleBonuses` only. Grep `reanimationRoleBonuses` outside MarkSystem/t130 = empty.
- CombatSimulationService / BattleSimulator have their own `checkLethalDamage` calls — not the EnemyTurn path.

## Relevant files

| Path | Why |
|---|---|
| `MarkSystem.ts` ~216–278 | helpers to reuse |
| `EnemyTurnSystem.ts` ~566–623 | player-incoming lethal |
| `PlayerTurnSystem.ts` ~150 | upkeep weight merge |
| `t130EdoTensei.test.ts` | plant + pure helper |
| `t085LiveWeights.test.ts` | `buildUpkeepWeightContext` pattern |
| `t143SubstitutionLive.test.ts` | live `executeEnemyAction` fixture |

## Surprises

- Catalog “first lethal” could include DoT/hazard; those sites already subtracted HP. Out of scope unless AC expands. Note as follow-up.
- Guts rng on the same `Math.random` as AUTO hit — Reanimation must **skip** `checkLethalDamage`, not hope guts fails.
