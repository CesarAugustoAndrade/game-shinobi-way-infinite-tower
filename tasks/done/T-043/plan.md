# T-043 · plan

**Ring:** R0 · **auto-approved** (standing automatic /task-dev loop)

Reauthor Shunshin as SUPPORT AP1/CP4/CD3. Default `bandMove` SELF_APPROACH; honor `intent.movement` (PULL approach / PUSH retreat). Plant self `shunshin_dex` duration 1 ATTEMPT. Next Offensive: consume at attempt; DEX-scaling adds `scalingPerPoint`. No voluntary-move spend. Tests `t043Shunshin` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts SUPPORT + bandMove + mark; no SPEED +0.4×2 |
| AC2 move mark | MEDIUM + default/PULL → CLOSE; flag unchanged; 0 dmg; self mark |
| AC3 dex payoff | DEX ATTACK base+scalingPerPoint; mark gone after attempt |

## Steps (single implementer)

1. Reauthor `SHUNSHIN`.
2. Gate attempt consume to Offensive; apply `shunshin_dex` DEX add in ATTACK/SIDE path.
3. Tests + `ShunshinBalance` probe + CHANGELOG.

## Risks

- Do not invent a second range engine.
- Do not consume on SUPPORT/MODE.
- Edge LONG+retreat / CLOSE+approach still ok + plant.
