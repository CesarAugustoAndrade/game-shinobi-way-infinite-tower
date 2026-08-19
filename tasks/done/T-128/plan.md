# T-128 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `SHADOW_POSSESSION` to SUPPORT AP2/CP6/CD5. `controlBound: { chance: 0.8, enemyDuration: 1 }` plants enemy `bound` HARD_CONTROL 1 on success. Any ATTACK vs Bound ×1.2 Setup and consumes Bound on impact (≥1 hit). Miss keeps Bound. SIDE ignores. Drop STUN+REFLECT `effects`. Movement lock OOS (no existing one-line Bound gate).

## Files

1. `src/game/types.ts` — `ControlBoundSpec` + `Skill.controlBound`
2. `src/game/constants/skills.ts` — `SHADOW_POSSESSION` authoring
3. `src/game/systems/ResolveSkillSystem.ts` — plant + ATTACK Bound Setup
4. `src/game/systems/__tests__/t128ShadowPossession.test.ts` — AC1–3
5. `src/simulation/ShadowPossessionBalance.ts` + `index.ts`
6. `CHANGELOG.md`

## Tests

`npm test -- src/game/systems/__tests__/t128ShadowPossession.test.ts`

- AC1 authoring — step 1–2
- AC2 plant chance — step 3
- AC3 Setup payoff — step 3

## Split

Single implementer (R0 files overlap).

## Risks / plan B

1. Dual hit-core paths: add Bound mult to both `preMits` and `!useHitCore` (mirror wire).
2. Reserve `bound` from generic IMPACT consume so SIDE cannot steal it (mirror `WIRE_TRAP_ID`).
3. If `controlBound` on Skill is judged a port: it is not — optional domain field, stay R0.

## Out of scope

Movement-lock subsystem; kawarimi; c4; edo; copy; Temple/Killing Intent retune; live UI; SOUL.
