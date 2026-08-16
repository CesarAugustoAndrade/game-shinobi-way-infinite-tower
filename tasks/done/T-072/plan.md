# T-072 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Explosive Barrage SIDE 3×5 M/L FIRE. On ≥1 hit plant `exposed` duration 2 ATTEMPT. Remove SPEED −0.2 / base 13. Consume Exposed only on ATTACK. Reuse T-023 ×1.15 for RANGED.

## Files

1. `src/game/constants/skills.ts` — `EXPLOSIVE_BARRAGE`.
2. `src/game/systems/ResolveSkillSystem.ts` — consume filter `exposed` → ATTACK only.
3. `src/game/systems/__tests__/t072ExplosiveBarrage.test.ts`.
4. `src/simulation/ExplosiveBarrageBalance.ts` + `index.ts`.
5. `CHANGELOG.md`.

Do **not** retune Explosive Tag, Shuriken Barrage, Senbon Rain, or ×1.15 formula.

## Authoring

- SIDE_ATTACK; AP2/CP3/CD4; base 5; hitCount 3; RANGED FIRE; M/L.
- Tags TOOL + FIRE + MULTI_HIT.
- `markEffects`: id `exposed`, duration 2, stacks 1, ATTEMPT, STAT, self, `requireHit: true`.
- Honest description: 3×5 M/L; on hit Exposed 2 → next ranged ATTACK +15% Setup.

## Tests

- AC1 authoring; no SPEED −0.2 / single 13.
- AC2: 3 hits → dmg 15, exposed 2; miss → no mark; CLOSE reject.
- AC3: RANGED ATTACK 10→11 consume; MELEE 10 consume; SIDE does not consume.

## Sim

Probe: 3-hit 15 + exposed; miss none; 10→11 ranged. Hook after Windmill.
