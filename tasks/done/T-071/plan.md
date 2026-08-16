# T-071 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Windmill Shuriken SIDE 12 M/L + PULL 1 on hit. Remove PIERCING/pen 0.2. No resolve edit.

## Files

1. `src/game/constants/skills.ts` — `WINDMILL_SHURIKEN`.
2. `src/game/systems/__tests__/t071WindmillShuriken.test.ts`.
3. `src/simulation/WindmillShurikenBalance.ts` + `index.ts`.
4. `CHANGELOG.md`.

Do **not** edit resolve, Wire Reel, Senbon Rain, Explosive Tag.

## Authoring

- SIDE_ATTACK; AP2/CP0/CD3; base 12; RANGED; M/L.
- Tags TOOL + WEAPON + PHYSICAL.
- `bandMove: { kind: 'PULL', steps: 1, requireHit: true }`.
- `damageProperty: NORMAL`; no `penetration`.
- Honest description: 12 M/L; PULL 1 on hit.

## Tests

- AC1 authoring; not PIERCING/pen 0.2.
- AC2: LONG hit → MEDIUM, dmg 12, `playerMoveUsedThisTurn` false.
- AC3: miss stays LONG; CLOSE hit stays CLOSE.

## Sim

Probe: LONG→MEDIUM; miss stay; CLOSE stay; vs unused pen 0.2. Hook after Senbon Rain.
