# T-088 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

When `ports.combatants` is set and `rollHit` is not injected, ATTACK/SIDE uses `calculateDamage` + `resolveSuccessfulHit`. Mode/mark multipliers go in `preMitigationMultipliers`. Injected `rollHit` (T-018–T-060) stays the stub.

## Files

1. `src/game/systems/ResolveSkillSystem.ts` — combatants hit branch.
2. Keep `t088HitCore.test.ts`.
3. `src/simulation/HitCoreBalance.ts` + `index.ts` — core integer vs stub 12.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/game/systems/__tests__/t088HitCore.test.ts`
`npm test -- src/game/systems/__tests__/t018RasenganModePayoff.test.ts` (stub path)

## Out of scope

Live cutover. Mitigation rewrite. UI preview.
