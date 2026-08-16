# T-044 · plan

**Ring:** R0 · **auto-approved**

Reauthor Dancing Leaf as SUPPORT AP1/CP1/CD3. `bandMove` SELF_APPROACH steps 2 → CLOSE. Plant self `lotus_opening` duration 2 ATTEMPT. Enqueue LOTUS +2 via `nextDrawSkillBonuses`. GATES finishers consume Opening and `floor(dmg * 1.25)`. Tests `t044DancingLeaf` + probe.

## AC map

| AC | Where |
|---|---|
| AC1 authoring | skills.ts + types nextDrawSkillBonuses |
| AC2 setup | resolve LONG/MEDIUM → CLOSE; mark; bag +2/+2 |
| AC3 finisher | Primary Lotus ×1.25; non-GATES does not consume |

## Steps

1. Types + SupportWeightSystem field.
2. consumeOnAttempt allow-filter + Setup 1.25 on spent opening.
3. Reauthor + tests + probe + CHANGELOG.

## Risks

- Do not give Peacock LOTUS weight.
- Do not retune Lotus dice.
- Do not spend voluntary move.
