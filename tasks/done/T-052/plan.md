# T-052 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Leaf Rising Wind SIDE AP1/CD2 CLOSE 8 MELEE. Plant `launched` 2 on ≥1 hit (`perHit: true`). Next MELEE ATTACK ×1.20 via `markDamageMultiplier` (`LAUNCHED_SETUP_MULT = 1.2`) and consume only on MELEE ATTACK. Remove STR +0.25. Tests `t052RisingWind` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `RISING_WIND` authoring.
2. `src/game/systems/ResolveSkillSystem.ts` — consume gate + launched mult.
3. `src/game/systems/__tests__/t052RisingWind.test.ts` — AC1–3.
4. `src/simulation/RisingWindBalance.ts` + `src/simulation/index.ts` — probe.
5. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: SIDE_ATTACK`; AP1/CP0/CD2/HP0; `baseDamage: 8`; CLOSE; MELEE.
- Tags: `TAIJUTSU` + `PHYSICAL` (no `SETUP` enum).
- `markEffects`: `launched`, duration 2, stacks 1, `ATTEMPT`, `STAT`, `self`, `perHit: true`.
- Delete `effects` STR +0.25×1.
- Honest description.

## Resolve

- `if (mark.id === 'launched') return role === ATTACK && attackMethod === MELEE`.
- `if (ids.has('launched') && MELEE) mult *= 1.2` (composes with Off-Balance by multiply).
- SIDE / RANGED ATTACK do not spend `launched`.
- Full miss MELEE ATTACK: spend at attempt; no bonus (`hitsLanded > 0` already gates mult).

## Out of scope

Feint / Off-Balance / Leaf Whirlwind / Kawarimi; UI; new SkillTag.SETUP.

## Tests

- AC1 authoring + no STR identity.
- AC2 hit 8 + own launched 2; miss 0 + no plant.
- AC3 MELEE 10 → 12 consume; without mark 10; ranged 10 no consume; SIDE does not spend.
