# T-041 · plan

**Ring:** R0 · **auto-approved**

Reauthor False Surroundings as SUPPORT AP2/CP8/CD5. `controlConfusion` 0.75 / duration 2. Plant `read_mind` duration 2 always. `nextDrawMentalAttackBonus: 1` → bag `kind: 'mental-attack'`. `effectiveWeight` +1 for ATTACK + MENTAL damageType only. Tests `t041FalseSurroundings` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts |
| AC2 resolve | rng success/fail + always Read Mind |
| AC3 weight | mental ATTACK +1; physical ATTACK unchanged |

## Steps (single implementer)

1. Fields + bag/weight filter.
2. Confusion helper on SUPPORT.
3. Reauthor skill + tests + probe.

## Risks

- Do not reuse SIDE role bonus (would hit all ATTACK).
- Do not invent Terrain / Mode / Mind Destruction +50%.
- Do not break T-016/T-038 consume shape.

## Research

Skipped — T-036/T-038 in-tree.
