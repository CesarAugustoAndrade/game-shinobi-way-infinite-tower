# T-026 · plan

**Ring:** R0 · **auto-approved**

Author Air Palm as SIDE_ATTACK with `markEffects: chakra_point` (duration 2, IMPACT, perHit, STAT) and `bandMove: PUSH 1`. Plant IMPACT/per-hit marks **after** `consumeOnImpact` so Twin Lion can still consume a prior CP and Air Palm does not self-consume. Apply `stacks * hitsLanded` when `perHit`. No `modeInteraction`. Tests `t026AirPalm` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts AIR_PALM |
| AC2 hit + PUSH + no spend | markEffects after impact consume + existing bandMove |
| AC3 miss / multi stack | perHit apply 0 vs 2; STAT merge stacks |

## Steps (single implementer)

1. `MarkSpec.perHit` + `family`; reauthor Air Palm; move SIDE/ATTACK plant after consumeOnImpact; per-hit stacks.
2. Tests `t026AirPalm` + `AirPalmBalance` probe.

## Risks

- Do not plant CP on miss (perHit + hitsLanded 0).
- Do not spend Byakugan (no modeId).
- Do not change T-023 ATTEMPT plant-on-miss.

## Research

Skipped — local expand, T-023 pattern already in-tree.
