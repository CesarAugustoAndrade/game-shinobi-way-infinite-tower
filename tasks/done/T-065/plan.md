# T-065 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Brace SUPPORT AP1/CP0/CD3. Plant self `brace_shield` stacks 20 duration 1 family SHIELD. Keep `stanceShift: DEFENSIVE`. Remove WIL +0.3. No ResolveSkillSystem change. Tests `t065Brace` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `BRACE` authoring.
2. `src/game/systems/__tests__/t065Brace.test.ts` — AC1–3.
3. `src/simulation/BraceBalance.ts` + `src/simulation/index.ts` — probe.
4. `CHANGELOG.md` — Unreleased line.

Do **not** edit `ResolveSkillSystem.ts` or `MUD_WALL`.

## Authoring

- `cardRole: CardRole.SUPPORT`; AP1/CP0/CD3/HP0; `baseDamage: 0`; AUTO.
- No tags (no `SkillTag.DEFENSE` / `POSTURE`).
- Keep `stanceShift: Posture.DEFENSIVE`. Leave `stanceBonus`.
- `markEffects: [{ id: 'brace_shield', duration: 1, stacks: 20, family: SHIELD, targetActor: 'self' }]`.
- No `effects` WIL 0.3.
- Honest description: Defensive; Shield 20 until next enemy response.

## Resolve

- Existing SUPPORT plant. `damageDealt === 0`.
- Costs: AP−1, CP unchanged; `readyOnTurn = turnIndex + 3 + 1`.

## Out of scope

Flash Bomb; Kawarimi; Mud Wall retune; live absorb; resolve posture; UI.

## Tests (`t065Brace.test.ts`)

- **AC1 authoring:** SUPPORT, AP1/CP0/CD3, dmg 0, DEFENSIVE, `brace_shield` 20/1; no WIL 0.3.
- **AC2 plant:** dmg 0, player shield 20 duration 1.
- **AC3 costs:** AP 6→5, CP 20→20, `readyOnTurn === 6` at turn 2.

Keep T-064 as regression (do not change).

## Sim

Probe: authoring; plant 20/1; AP−1 CP 0; vs legacy WIL +30%. Hook `printBraceProbe` next to Mud Wall in `simulate:quick`.
