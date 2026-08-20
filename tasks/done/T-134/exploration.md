# T-134 exploration

**Ring:** R0. Route: autonomous.

## Relevant files

- `skills.ts` `counter_reflect` stacks 30 self; `rotation_reflect` stacks 60 self.
- `applyMitigation` / `resolveSuccessfulHit`: REFLECTION **buffs** only.
- `EnemyTurnSystem` ~508–549: `resolveSuccessfulHit` then `applyOutgoingMarkCuts`; `hit.reflectedDamage` already applied to enemy.
- No live readers of `counter_reflect` / `rotation_reflect`.
- T-084 `executeEnemyAction` fixture pattern for AC3.

## Reuse

Temp REFLECTION buff (percent = stacks/100) for one hit; strip Mark if `reflectedDamage > 0`. Max stacks if both present. Counter MELEE-only; Rotation any offensive.

**RE-CLASSIFY:** no.
