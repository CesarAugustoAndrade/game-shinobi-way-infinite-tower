# T-029 · plan

**Ring:** R0 · **auto-approved**

Author Dynamic Entry SIDE_ATTACK with `allowedRanges: [MEDIUM, CLOSE]` and `bandMove: { kind: 'SELF_APPROACH', steps: 1 }`. Map SELF_APPROACH → PULL in `skillForcedMove`. No `modeInteraction`. Tests `t029DynamicEntry` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts DYNAMIC_ENTRY |
| AC2 MEDIUM→CLOSE no spend | bandMove PULL + no modeId |
| AC3 CLOSE stay | resolveForcedMove boundary |

## Steps (single implementer)

1. `BandMoveKind` + map; reauthor row.
2. Tests + `DynamicEntryBalance` probe.

## Risks

- Do not spend Gate charges (no modeId).
- Do not add LONG.
- Do not set `playerMoveUsedThisTurn`.

## Research

Skipped — local expand, T-023 helper in-tree.
