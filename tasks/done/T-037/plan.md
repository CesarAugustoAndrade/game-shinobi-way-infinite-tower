# T-037 · plan

**Ring:** R0 · **auto-approved**

Reauthor Hell Viewing as ATTACK 18 AP2/CP6/CD4 AUTO. `markEffects` `fear` duration 1 stacks 20 STAT enemy `perHit: true`. Drop STR −30%×3. Add `applyFearOutgoing` in MarkSystem: `floor(dmg * (1 - stacks/100))` and strip Fear. Tests `t037HellViewing` + sim probe. Do not retune Mind Transfer. Do not wire EnemyTurnSystem.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts |
| AC2 damage + plant | resolveSkill + markEffects |
| AC3 fear mult | applyFearOutgoing (pure helper) |

## Steps (single implementer)

1. Reauthor `HELL_VIEWING`.
2. `applyFearOutgoing` in MarkSystem.
3. Tests + `HellViewingBalance` probe (vs legacy 18 + STR −30%×3).

## Risks

- Do not IMPACT-consume Fear (player hit would eat it).
- Do not change global AUTO miss policy.
- Do not retune Mind Transfer.

## Research

Skipped — T-007/T-026/T-031 mark path in-tree.
