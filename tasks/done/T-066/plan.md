# T-066 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Flash Bomb SUPPORT AP1/CP0/CD4. Plant enemy `blinded` duration 1 stacks 2 (contract −2 ACC). Remove ACC −40%@50%. No ResolveSkillSystem change. Tests `t066FlashBomb` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `FLASH_BOMB` authoring.
2. `src/game/systems/__tests__/t066FlashBomb.test.ts` — AC1–3.
3. `src/simulation/FlashBombBalance.ts` + `src/simulation/index.ts` — probe.
4. `CHANGELOG.md` — Unreleased line.

Do **not** edit `ResolveSkillSystem.ts`, Smoke, Aim, or Brace.

## Authoring

- `cardRole: CardRole.SUPPORT`; AP1/CP0/CD4/HP0; `baseDamage: 0`; AUTO.
- Tags: `TOOL` + `MARK` (no `SkillTag.CONTROL`).
- `markEffects: [{ id: 'blinded', duration: 1, stacks: 2, family: STAT, targetActor: 'enemy' }]`.
- No `effects` ACC −0.4@0.5.
- Honest description: Blinded 1; enemy −2 ACC.

## Resolve

- Existing SUPPORT plant. `damageDealt === 0`. Guaranteed (no roll).
- Costs: AP−1, CP unchanged; `readyOnTurn = turnIndex + 4 + 1`.
- No telegraph interrupt.

## Out of scope

Intent interrupt; Smoke/Aim/Brace retune; hit-math ACC read; UI.

## Tests (`t066FlashBomb.test.ts`)

- **AC1 authoring:** SUPPORT, AP1/CP0/CD4, dmg 0, enemy `blinded` 1/2; no ACC −0.4@0.5.
- **AC2 plant:** dmg 0, enemy blinded duration 1 stacks 2.
- **AC3 costs:** AP 6→5, CP 20→20, `readyOnTurn === 7` at turn 2.

Keep T-038 / T-065 as regression (do not change).

## Sim

Probe: authoring; plant 2/1; AP−1; vs legacy ACC −40%@50%. Hook `printFlashBombProbe` next to Brace in `simulate:quick`.
