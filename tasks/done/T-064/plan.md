# T-064 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Mud Wall SUPPORT AP1/CP4/CD4. Plant self `mud_wall_shield` stacks 35 family SHIELD duration 99. Keep `stanceShift: DEFENSIVE`. Remove SHIELD 40×3 `effects[]`. No ResolveSkillSystem change. Tests `t064MudWall` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `MUD_WALL` authoring.
2. `src/game/systems/__tests__/t064MudWall.test.ts` — AC1–3.
3. `src/simulation/MudWallBalance.ts` + `src/simulation/index.ts` — probe.
4. `CHANGELOG.md` — Unreleased line.

Do **not** edit `ResolveSkillSystem.ts`.

## Authoring

- `cardRole: CardRole.SUPPORT`; AP1/CP4/CD4/HP0; `baseDamage: 0`; AUTO; `element: EARTH`.
- Tags: `NINJUTSU` + `EARTH` (no `SkillTag.DEFENSE`).
- Keep `stanceShift: Posture.DEFENSIVE`. Leave `stanceBonus` (not in AC).
- `markEffects: [{ id: 'mud_wall_shield', duration: 99, stacks: 35, family: SHIELD, targetActor: 'self' }]`.
- No `effects` SHIELD 40×3.
- Honest description: Shield 35 until absorbed; shift Defensive.

## Resolve

- Existing SUPPORT `applySkillMarkEffects` plants the mark. `damageDealt === 0`.
- Costs: AP−1 CP−4; `readyOnTurn = turnIndex + 4 + 1`.
- No Mode; no enemy marks.

## Out of scope

Brace; Kawarimi; Flash Bomb; Rotation retune; live absorb / `playerBuffs`; resolve posture mutate; UI.

## Tests (`t064MudWall.test.ts`)

- **AC1 authoring:** SUPPORT, AP1/CP4/CD4, dmg 0, `stanceShift: DEFENSIVE`, `mud_wall_shield` 35 SHIELD self; no SHIELD 40×3.
- **AC2 plant:** resolve → dmg 0, player `mud_wall_shield` stacks 35 family SHIELD.
- **AC3 costs:** pools AP 6→5, CP 20→16; loadout entry `readyOnTurn === 7` at turn 2.

Keep T-028 as regression (do not change).

## Sim

Probe: authoring; plant 35; AP/CP drain; vs legacy SHIELD 40×3. Hook `printMudWallProbe` next to Iaido in `simulate:quick`.
