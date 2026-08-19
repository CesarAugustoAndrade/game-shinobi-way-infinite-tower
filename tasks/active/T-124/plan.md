# T-124 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `COUNTER_STANCE` to SUPPORT AP1/CP1/CD4, `baseDamage: 0`, AUTO, no stanceShift, no Mode. Plant self `counter_reflect` duration 1 stacks 30. `nextDrawRoleBonus` SIDE +1. Drop `effects[]` REFLECTION 0.5 and instant 8.

## Files

1. `src/game/constants/skills.ts` — `COUNTER_STANCE`
2. `src/game/systems/__tests__/t124CounterStance.test.ts`
3. `src/simulation/CounterStanceBalance.ts` + `index.ts`
4. `CHANGELOG.md`

## Tests

`npm test -- src/game/systems/__tests__/t124CounterStance.test.ts`

## Split

Single implementer.

## Out of scope

kawarimi; c4; edo; posture reauthors; live MELEE mit rewrite; live UI; SOUL.
