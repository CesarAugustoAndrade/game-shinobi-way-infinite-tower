# T-120 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `KAMUI_IMPACT` to ATTACK AP5/CP11/CD4, 27, AUTO/ANY (omit ranges), PHYSICAL not TRUE, `penetration: 0.5`, no Mode, no SPEED DEBUFF. Plant self `spatial_tear` duration 2, ATTEMPT, STAT, no requireHit (plant on resolve even on miss).

Wire `markDamageMultiplier`: `spatial_tear` ×1.2. Consume only on ATTACK (barrage_setup sibling). Do not reuse `off_balance`.

## Files

1. `src/game/constants/skills.ts` — `KAMUI_IMPACT`.
2. `src/game/systems/ResolveSkillSystem.ts` — Tear mult + consume filter.
3. `src/game/systems/__tests__/t120KamuiImpact.test.ts` — AC1–3.
4. `src/simulation/KamuiImpactBalance.ts` + `index.ts`.
5. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t120KamuiImpact.test.ts`

## Split

Single implementer.

## Out of scope

kirin; c4; kawarimi; edo; tengai; copy_jutsu; live UI; SOUL.
