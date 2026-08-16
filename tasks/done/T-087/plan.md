# T-087 · plan

**Ring:** R2 · **auto-approved** (standing loop order)

Panels + Main ribbon already mount. Add `grantedRanges` to Combat playability context. Do not redesign Pattern A. Do not invent Discover chrome.

## Files

1. `src/scenes/combat/Combat.tsx` — `grantedRanges` from Mode charges (mirror useCombat helper).
2. `src/scenes/combat/__tests__/t087CombatMount.test.ts` — assert grantedRanges in context.
3. `src/simulation/CombatMountBalance.ts` + `index.ts` — Mode-grant range playable vs blocked without grant.
4. `CHANGELOG.md`.

## Tests

`npm test -- src/scenes/combat/__tests__/t087CombatMount.test.ts`
`npm run build` (AC1 gate)

## Out of scope

Pattern A redesign. Discover UI. New damage formulas.
