# T-076 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Sand Shield SUPPORT AP1/CP5/CD3. Plant self `sand_shield` stacks 45 family SHIELD duration 99. No stanceShift. Remove SHIELD 80×2 `effects[]`. No ResolveSkillSystem change. Tests `t076SandShield` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `SAND_SHIELD` authoring.
2. `src/game/systems/__tests__/t076SandShield.test.ts` — AC1–3.
3. `src/simulation/SandShieldBalance.ts` + `src/simulation/index.ts` — probe vs Mud Wall 35 / legacy 80.
4. `CHANGELOG.md` — Unreleased line.

Do **not** edit `ResolveSkillSystem.ts`.

## Authoring

- `cardRole: CardRole.SUPPORT`; AP1/CP5/CD3/HP0; `baseDamage: 0`; AUTO; `element: EARTH`.
- Tags: `NINJUTSU` + `EARTH` (`SkillTag.DEFENSE` does not exist).
- No `stanceShift`.
- `markEffects: [{ id: 'sand_shield', duration: 99, stacks: 45, family: SHIELD, targetActor: 'self' }]`.
- No `effects` SHIELD 80×2.
- Honest description: Shield 45 until absorbed.

## Resolve

- Existing SUPPORT `applySkillMarkEffects` plants the mark. `damageDealt === 0`.
- Costs: AP−1 CP−5; `readyOnTurn = turnIndex + 3 + 1`.
- No Mode; no enemy marks; no stanceShift.

## Out of scope

Kawarimi; sand_coffin / sand_burial; Mud Wall / Brace / Rotation retune; live absorb / `playerBuffs`; UI.

## Tests (`t076SandShield.test.ts`)

- **AC1 authoring:** SUPPORT, AP1/CP5/CD3, dmg 0, no stanceShift, `sand_shield` 45 SHIELD self; no SHIELD 80×2.
- **AC2 plant:** resolve → dmg 0, player `sand_shield` stacks 45 family SHIELD.
- **AC3 costs:** pools AP 6→5, CP 20→15; loadout entry `readyOnTurn === 6` at turn 2.

Keep T-064 as regression (do not change).

## Sim

Probe: authoring; plant 45; AP/CP drain; absorb budget vs Mud Wall 35 / Brace 20 / legacy SHIELD 80×2. Hook `printSandShieldProbe` after Henge in `simulate:quick`.
