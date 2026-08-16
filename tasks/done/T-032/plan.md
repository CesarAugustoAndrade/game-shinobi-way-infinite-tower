# T-032 · plan

**Ring:** R0 · **auto-approved**

Reauthor Fireball as ATTACK 17 dmg AP3/CP6/CD3, MEDIUM+LONG. Rasengan `modeInteraction` (`modeId: sharingan_2`, consume 1, +50%, no `requireOn`). Burn 5×2 certain on hit. No resolve fork. Tests `t032Fireball` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts FIREBALL |
| AC2 base without Mode | existing resolve, no requireOn |
| AC3 2T +50% + 1 charge | Rasengan enhance path |

## Steps (single implementer)

1. Reauthor `FIREBALL` (17 dmg, Burn 5×2, 2T enhance).
2. Tests + `FireballBalance` probe.

## Risks

- Do not change Chidori 3T or Rasengan clones.
- Do not `requireOn` (base must play).
- Do not invent Phoenix / Predict / 3T Fireball.

## Research

Skipped — local expand, T-018 path in-tree.
