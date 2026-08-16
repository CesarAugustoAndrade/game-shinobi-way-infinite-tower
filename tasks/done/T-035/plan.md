# T-035 · plan

**Ring:** R0 · **auto-approved**

Reauthor 64 Palms as ATTACK 8×3 AP4/CP7/CD5 CLOSE pen 0.3. Extend `ModeInteraction` with `minMarkStacks`, `damagePerMarkStackBonus`, `damageMarkStackCap`, `consumeAllMatchingMarks`. Resolve: gate spend+bonus on Mode ON and stacks ≥ min; `bonus = min(cap, 0.1*S)`; strip all matching CP on ≥1 hit; miss keeps marks, charge already spent. No `if (skill.id)`. Tests `t035SixtyFourPalms` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts + ModeInteraction fields |
| AC2 base / 1 CP | no spend, damage 24 |
| AC3 enhance S=3 | floor(24*1.3)=31, charges 3, CP gone |
| AC4 miss keep | dmg 0, CP stays, charges 3 |

## Steps (single implementer)

1. Add ModeInteraction fields in `types.ts`.
2. Gate resolve spend/bonus; all-stack consume helper.
3. Reauthor `SIXTY_FOUR_PALMS`.
4. Tests + `SixtyFourPalmsBalance` probe (vs legacy 25 TRUE/AP2).

## Risks

- Do not retune Twin Lion / Air Palm / Rotation.
- Do not spend charge when S<2.
- Do not skill-id hardcode.

## Research

Skipped — T-022/T-026/T-007 path in-tree.
