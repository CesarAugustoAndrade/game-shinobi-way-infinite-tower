# T-127 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `AGGRESSIVE_STANCE` to SUPPORT ACTIVE AP1/CP3/CD5, `stanceShift: AGGRESSIVE`. Plant self `aggressive_focus` duration 2 stacks 1 consume ATTEMPT; self `aggressive_open` duration 1 stacks 20 (incoming +20% documented; no new mit engine). Drop TOGGLE / upkeep / STR-WIL %. Lee kit: move to active.

`markDamageMultiplier`: `aggressive_focus` ×1.2. Consume ATTACK-only.

## Files

1. `src/game/constants/skills.ts`
2. `src/game/constants/index.ts`
3. `src/game/systems/ResolveSkillSystem.ts`
4. `src/game/systems/__tests__/t127AggressiveStance.test.ts`
5. `src/simulation/AggressiveStanceBalance.ts` + `index.ts`
6. `CHANGELOG.md`

## Tests

`npm test -- src/game/systems/__tests__/t127AggressiveStance.test.ts`

## Split

Single implementer.

## Out of scope

kawarimi; c4; edo; focused/defensive retune; full incoming mit; live UI; SOUL.
