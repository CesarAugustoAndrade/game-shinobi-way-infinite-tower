# T-121 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `TENGAI_SHINSEI` to ATTACK AP6/CP27/CD8, `baseDamage: 35`, LONG-only, ELEMENTAL EARTH not TRUE, `impactStun: { chance: 1, duration: 1 }`, `bandMove: { kind: 'PUSH', steps: 2, requireHit: true }`, no Mode. Tags NINJUTSU+EARTH.

Honest miss rule: Stun and PUSH are hit-gated (Shinra sibling). Force-LONG from CLOSE/MEDIUM tested via allowedRanges fixture.

## Files

1. `src/game/constants/skills.ts` — `TENGAI_SHINSEI`.
2. `src/game/systems/__tests__/t121TengaiShinsei.test.ts` — AC1–3.
3. `src/simulation/TengaiShinseiBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t121TengaiShinsei.test.ts`

## Split

Single implementer.

## Out of scope

kirin; c4; kawarimi; edo; Shinra retune; delayed meteor; live UI; SOUL.
