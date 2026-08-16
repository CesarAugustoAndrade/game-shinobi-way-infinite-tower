# T-074 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Bunshin SUPPORT AP1/CP1/CD3. Plant enemy `decoy` duration 1 stacks 20. No SIDE weight. No Shadow Clone Mode. Remove SPEED +0.2. Add `applyDecoyOutgoing`.

## Files

1. `src/game/constants/skills.ts` — `BUNSHIN`.
2. `src/game/systems/MarkSystem.ts` — `applyDecoyOutgoing`.
3. `src/game/systems/__tests__/t074Bunshin.test.ts`.
4. `src/simulation/BunshinBalance.ts` + `index.ts`.
5. `CHANGELOG.md`.

Do **not** retune smoke / mist / Shadow Clones Mode.

## Authoring

- SUPPORT; AP1/CP1/CD3; base 0; MENTAL AUTO.
- Tags NINJUTSU + MENTAL + MARK.
- `markEffects`: id `decoy`, duration 1, stacks 20, STAT, enemy.
- No `nextDrawRoleBonus`. No modeInteraction.
- Honest description: Decoy 1 −20 first enemy offensive; no Shadow Clone charges.

## Tests

- AC1 authoring; no SPEED 0.2; no nextDrawRoleBonus.
- AC2 plant: dmg 0, decoy 1/20, modes empty, no pending SIDE weight.
- AC3 costs: AP 6→5, CP 20→19, readyOnTurn 6 at turn 2.

## Sim

Probe: authoring; plant; 40→20; vs unused SPEED +20%. Hook after Hidden Mist.
