# T-081 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor `1000_years` SIDE AP2/CP1/CD5 CLOSE 9. `impactStun: { chance: 0.45, duration: 1 }` + `controlConfusion: { chance: 0.45, enemyDuration: 1 }`. Drop STUN 100% / CONFUSION 60%×2. No ResolveSkillSystem change. Tests `t081ThousandYears` + probe.

## Files

1. `src/game/constants/skills.ts` — `THOUSAND_YEARS`.
2. `src/game/systems/__tests__/t081ThousandYears.test.ts`.
3. `src/simulation/ThousandYearsBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

## Authoring

- SIDE; AP2/CP1/CD5; base 9; MELEE; CLOSE only.
- Tags: TAIJUTSU + PHYSICAL.
- Dual 45% duration 1. No legacy effects[].
- Description: 9 CLOSE; 45% Stun 1 and 45% Confusion 1, separate rolls on hit.

## Resolve

- Existing SIDE hit: confusion rng then stun rng.
- Miss: 0 / no control. MEDIUM illegal.

## Tests

- AC1 authoring.
- AC2 damage 9 / miss 0.
- AC3 seq rng: confusion-only [0, 0.45]; stun-only [0.45, 0]; both [0, 0]; neither [0.45, 0.45].

## Sim

Chip 9; P(stun)=0.45 P(conf)=0.45 P(both)=0.2025 vs unused 100%+60%×2. Hook after Water Prison.
