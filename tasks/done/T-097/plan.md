# T-097 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `ADAMANTINE_CHAINS` to ATTACK AP3/CP6/CD4 20 M/L + PULL steps 2 requireHit + `impactStun` 0.7/1 + enemy STAT `adamantine_spd` stacks 1 duration 2 (`requireHit`). Drop mute STUN 35%, CHAKRA % debuff, stanceBonus.

## Files

1. `src/game/constants/skills.ts` — `ADAMANTINE_CHAINS`.
2. `src/game/systems/__tests__/t097AdamantineChains.test.ts` — AC1–3.
3. `src/simulation/AdamantineChainsBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t097AdamantineChains.test.ts`

## Split

Single implementer.

## Out of scope

shadow_possession, fang_over_fang, sand_burial, byakugan_scan, kawarimi.
