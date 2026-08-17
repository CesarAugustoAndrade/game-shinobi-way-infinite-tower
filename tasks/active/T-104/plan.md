# T-104 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Add optional `minHitsLanded` to `ImpactStunSpec` (default 1). `resolveImpactStun` skips stun when `hitsLanded < min`. Reauthor `ICE_MIRRORS` to ATTACK AP3/CP7/CD4 4×4 ANY + `impactStun` 0.4×1 `minHitsLanded: 2`. Drop mute 15 / AP2 / PIERCING / STUN 0.5.

## Files

1. `src/game/types.ts` — optional min hits on `ImpactStunSpec`.
2. `src/game/systems/ResolveSkillSystem.ts` — pass `hitsLanded` into `resolveImpactStun`.
3. `src/game/constants/skills.ts` — `ICE_MIRRORS`.
4. `src/game/systems/__tests__/t104IceMirrors.test.ts` — AC1–3.
5. `src/simulation/IceMirrorsBalance.ts` + `index.ts`.
6. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t104IceMirrors.test.ts`

## Split

Single implementer.

## Out of scope

bone_drill, poison_fog, fang_over_fang, vortex retune.
