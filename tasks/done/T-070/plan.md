# T-070 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Senbon Rain SIDE 4×2 M/L. On ≥1 hit plant enemy `poison` stacks 3 duration 2. Remove POISON 5×3 @20%. No ResolveSkillSystem change.

## Files

1. `src/game/constants/skills.ts` — `SENBON_RAIN`.
2. `src/game/systems/__tests__/t070SenbonRain.test.ts`.
3. `src/simulation/SenbonRainBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

Do **not** edit resolve, Senbon, Barrage, Poison Coat.

## Authoring

- SIDE_ATTACK; AP2/CP3/CD3; base 2; hitCount 4; RANGED; M/L.
- Tags TOOL + WEAPON + PHYSICAL + MULTI_HIT (no SkillTag.POISON).
- `markEffects`: id `poison`, duration 2, stacks 3, DOT, enemy, `requireHit: true`.
- Honest description: 4×2 M/L; on hit Poison 3×2.

## Tests

- AC1 authoring; no POISON@0.2.
- AC2: ≥1 hit → enemy poison 3/2; miss → no poison; CLOSE reject.
- AC3: 4 hits → one poison mark, stacks 3 (not 12).

## Sim

Probe: 4-hit 8 + poison 3×2; miss none; vs 6 + 20%×5. Hook after Barrage.
