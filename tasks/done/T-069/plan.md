# T-069 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Shuriken Barrage SIDE 3×3 M/L. On ≥1 hit plant self `barrage_setup` 2 ATTEMPT. Next ATTACK ×1.1 and consume. Full miss plants nothing.

## Files

1. `src/game/types.ts` — `MarkSpec.requireHit?`.
2. `src/game/constants/skills.ts` — `SHURIKEN_BARRAGE`.
3. `src/game/systems/ResolveSkillSystem.ts` — requireHit plant; ATTACK-only consume; `barrage_setup` ×1.1.
4. `src/game/systems/__tests__/t069ShurikenBarrage.test.ts`.
5. `src/simulation/ShurikenBarrageBalance.ts` + `index.ts`.
6. `CHANGELOG.md`.

Do **not** retune Shuriken Aim, Senbon, Windmill.

## Authoring

- SIDE_ATTACK; AP2/CP1/CD2; base 3; hitCount 3; RANGED; M/L.
- Tags TOOL + WEAPON + PHYSICAL + MULTI_HIT.
- `markEffects`: id `barrage_setup`, duration 2, stacks 1, ATTEMPT, STAT, self, `requireHit: true`.
- Honest description: 3×3 M/L; on hit next ATTACK +10% Setup.

## Tests

- AC1 authoring.
- AC2: 3 forced hits → dmg 9, mark present; miss → dmg 0, no mark; CLOSE reject.
- AC3: plant then ATTACK base 10 hit → 11, mark gone; SIDE does not consume.

## Sim

Probe: authoring; 3-hit 9; miss no mark; 10→11 setup. Hook after Basic Medical.
