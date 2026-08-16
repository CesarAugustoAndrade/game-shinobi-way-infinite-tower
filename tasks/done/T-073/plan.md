# T-073 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Hidden Mist SUPPORT AP2/CP5/CD5. Plant enemy `mist` duration 2 stacks 20. SIDE +1 next draw. Remove SPEED/ACC %. Add `applyMistOutgoing` (−20, consume). No Terrain.

## Files

1. `src/game/constants/skills.ts` — `HIDDEN_MIST`.
2. `src/game/systems/MarkSystem.ts` — `applyMistOutgoing`.
3. `src/game/systems/__tests__/t073HiddenMist.test.ts`.
4. `src/simulation/HiddenMistBalance.ts` + `index.ts`.
5. `CHANGELOG.md`.

Do **not** retune smoke_bomb / flash_bomb.

## Authoring

- SUPPORT; AP2/CP5/CD5; base 0; WATER AUTO.
- Tags NINJUTSU + WATER + MARK.
- `nextDrawRoleBonus: { role: SIDE_ATTACK, delta: 1 }`.
- `markEffects`: id `mist`, duration 2, stacks 20, STAT, enemy.
- Keep ADVANCED + existing stat requirements.
- Honest description: Mist 2 −20 first enemy offensive; SIDE +1 next draw; not Terrain.

## Tests

- AC1 authoring; no SPEED 0.5 / ACC −0.3.
- AC2: mist 2/20; SIDE +1 once; ATTACK weight unchanged; applyMistOutgoing 40→20 consume.
- AC3: dmg 0; no `terrain` on state.

## Sim

Probe: authoring; plant; SIDE +1; 40→20 vs unused SPEED/ACC %. Hook after Explosive Barrage.
