# T-034 · plan

**Ring:** R0 · **auto-approved**

Reauthor Chidori Stream as ATTACK 18 dmg AP4/CP7/CD4, CLOSE only, MELEE. `modeInteraction` `sharingan_3` consume 1, +40%, no `requireOn`, no `grantRanges`. Stun 1 @60%. No resolve fork. Tests `t034ChidoriStream` + sim probe with vs-legacy metrics.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts CHIDORI_STREAM |
| AC2 base without Mode | existing resolve, no requireOn |
| AC3 3T +40% + 1 charge | floor(18 * 1.4) = 25; Rasengan enhance path |

## Steps (single implementer)

1. Reauthor `CHIDORI_STREAM` (18, Stun 0.6, 3T enhance).
2. Tests + `ChidoriStreamBalance` probe.

## Risks

- Do not change Chidori thrust consume 2 / MEDIUM grant.
- Do not `requireOn` or grant MEDIUM.
- Do not invent AoE / Predict / 64 Palms.

## Research

Skipped — local expand, T-018/T-025/T-032 path in-tree.
