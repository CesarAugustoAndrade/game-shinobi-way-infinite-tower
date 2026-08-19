# T-125 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `FOCUSED_STANCE` to SUPPORT ACTIVE AP1/CP3/CD5, `stanceShift: BALANCED`, `baseDamage: 0`. Plant self `focused` duration 2 stacks 20 consume ATTEMPT. Drop TOGGLE / isToggle / upkeep / ACC-DEX %.

Consume `focused` only on ATTACK (Cloak sibling). Hit-core: add spent `focused.stacks` to `skill.critBonus`. Yamanaka kit: move card from `toggle` to `active`.

## Files

1. `src/game/constants/skills.ts`
2. `src/game/constants/index.ts`
3. `src/game/systems/ResolveSkillSystem.ts`
4. `src/game/systems/__tests__/t125FocusedStance.test.ts`
5. `src/simulation/FocusedStanceBalance.ts` + `index.ts`
6. `CHANGELOG.md`

## Tests

`npm test -- src/game/systems/__tests__/t125FocusedStance.test.ts`

## Split

Single implementer.

## Out of scope

defensive_posture; aggressive_stance; kawarimi; c4; edo; live UI; SOUL.
