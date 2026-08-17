# T-091 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `BUG_SWARM` to SIDE 8 M/L. On ≥1 hit: `impactChakraDrain: 6` + `markEffects` Poison 3×3 (`id: 'poison'`, T-070). Drop mute CHAKRA_DRAIN 25 / POISON 8×3. Generic resolve hook — no skill-id branch.

## Files

1. `src/game/types.ts` — optional `impactChakraDrain?: number`.
2. `src/game/systems/ResolveSkillSystem.ts` — apply drain on ATTACK/SIDE when hitsLanded ≥ 1.
3. `src/game/constants/skills.ts` — `BUG_SWARM` authoring.
4. `src/game/systems/__tests__/t091BugSwarm.test.ts` — AC1–3.
5. `src/simulation/BugSwarmBalance.ts` + `index.ts`.
6. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t091BugSwarm.test.ts`

## Split

Single implementer (overlapping types + resolve + skills).

## Out of scope

fang_over_fang, kawarimi, adamantine, expansion, shadow_possession, live UI.
