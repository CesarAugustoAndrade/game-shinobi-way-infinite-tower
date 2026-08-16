# T-033 · plan

**Ring:** R0 · **auto-approved**

Reauthor Phoenix Flower as ATTACK 3×5 AP2/CP5/CD2, MEDIUM+LONG. Rasengan/Fireball `modeInteraction` (`modeId: sharingan_2`, consume 1, +40%, no `requireOn`). Burn 4×2 certain on impact. No resolve fork. Tests `t033PhoenixFlower` + sim probe with numeric vs-legacy metrics.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts PHOENIX_FLOWER |
| AC2 base 3-hit without Mode | existing resolve `hitCount`, no requireOn |
| AC3 2T +40% + 1 charge | floor(15 * 1.4) = 21; Rasengan enhance path |

## Steps (single implementer)

1. Reauthor `PHOENIX_FLOWER` (3×5, Burn 4×2, 2T +40%).
2. Tests + `PhoenixFlowerBalance` probe (base/enhanced dmg, dmg/AP vs legacy 14/AP1).

## Risks

- Do not change Fireball 2T +50% or Chidori 3T.
- Do not `requireOn` (base must play).
- Do not invent Predict / Stream / per-hit Burn stacks.
- Do not auto-set Uchiha `mainAttackId`.

## Research

Skipped — local expand, T-018/T-032 path in-tree.
