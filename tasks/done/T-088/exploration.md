# T-088 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** fix M

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| resolveSkill uses rng&lt;0.85 + baseDamage | **true** | `ResolveSkillSystem.ts:994–1002` default `rollHit` |
| Live uses calculateDamage → resolveSuccessfulHit | **true** | PlayerTurnSystem / SkillResolution |
| combatants port exists | **true** | T-082 `ResolveSkillPorts.combatants` unused by hit |
| AC test exists | **true** | `t088HitCore.test.ts` (currently 12 vs core integer) |

## Complexity premise

Do **not** delete the injected `rollHit` stub. T-018–T-060 pass `{ hit: true, damage: baseDamage }` then apply Mode/mark floors themselves. Combatants + no rollHit is the new core path: `calculateDamage` + `resolveSuccessfulHit` with mode/mark as pre-mitigation.

## Port signatures

No new port. Consume existing `combatants` / `damageOptions`. Stay R0.
