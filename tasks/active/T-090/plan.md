# T-090 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Retune `LIGHTNING_BALL` to catalog ATTACK 15 M/L + 45% Stun 1 + Sharingan 3T +40%/1 charge. Copy T-089 tests; swap skill, mode id `sharingan_3`, mult `0.4`, stun via `impactStun` (same live path as T-081). No new Mode machine.

## Files

1. `src/game/constants/skills.ts` — authoring (`LIGHTNING_BALL`).
2. `src/game/systems/__tests__/t090LightningBall.test.ts` — AC1–3 (+ 2T does not enhance).
3. `src/simulation/LightningBallBalance.ts` + `index.ts` — probe metrics.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t090LightningBall.test.ts`

## AC mapping

- AC1 authoring → step 1+2
- AC2 base without Mode → step 2
- AC3 3T enhance + charge → step 2
- RING-GUARD / typecheck → no React; constants + tests + sim only

## Split

Single implementer (S; overlapping `skills.ts` / sim index).

## Out of scope

Chidori retune, Fireball/Dragon Flame, fang_over_fang, kawarimi, live UI.
