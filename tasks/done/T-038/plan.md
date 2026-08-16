# T-038 · plan

**Ring:** R0 · **auto-approved**

Reauthor Smoke Bomb as SUPPORT AP1/CP0/CD3, 0 dmg. Plant `smoke` duration 2 stacks 25. Add `Skill.nextDrawRoleBonus` `{ role: SIDE_ATTACK, delta: 1 }`. Extend T-016 bag with optional `role`; `consume` returns `roleBonuses`; `WeightContext.supportRoleBonuses`; `effectiveWeight` adds role term. Tests `t038SmokeBomb` + sim probe. Do not break T-016.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts |
| AC2 mark + SIDE +1 one-shot | resolve + consume + effectiveWeight |
| AC3 ATTACK isolation | effectiveWeight ATTACK unchanged |

## Steps (single implementer)

1. Extend bag / WeightContext / effectiveWeight.
2. Reauthor SMOKE_BOMB + `applySmokeOutgoing`.
3. Tests + `SmokeBombBalance` probe (vs legacy SPEED/ACC %).

## Risks

- Do not break T-016 skillId consume shape (`bonuses` still Record<string, number>).
- Do not mutate Terrain or baseWeight.
- Do not IMPACT-consume smoke on player hits.

## Research

Skipped — T-016/T-037 path in-tree.
