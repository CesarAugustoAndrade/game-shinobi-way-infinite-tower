# T-016 · exploration

**Ring:** R0 pending next-draw support bag. No port-signature change (optional ResolveSkillState field only).

## Relevant files

- `src/game/systems/DeckSystem.ts` — `WeightContext.supportBonuses` + `effectiveWeight` already apply the support term; never built.
- `src/game/systems/ModeWeightSystem.ts` — T-015 sibling pattern (pure map builder).
- `src/game/systems/ResolveSkillSystem.ts` — SUPPORT success = marks + Discover; no weight bag. `validateIntent` rejects missing `cardRole`.
- `src/game/systems/PlayerTurnSystem.ts` — `buildUpkeepWeightContext` passes `modeBonuses` only.
- `src/game/constants/skillsCombatV1New.ts` — `chakra_control_drill` SUPPORT; +2 is description-only.
- `src/game/constants/skills.ts` — `gate_prep` legacy (no `cardRole`); Gate ids `gate_of_life` / `gate_of_limit` in `modes.ts`.
- `src/game/systems/combat-types.ts` — no `pendingSupportWeights` field.

## Ports to reuse

- `WeightContext.supportBonuses` / `effectiveWeight` (T-003).
- `intent.weightContext.mainAttackId` (T-013).
- Optional `applySupportWeightOnPlay` rather than CombatState (spec allows; live consume needs R1 persist).

## Tests

- T-003 `effectiveWeight` support slot; T-007/T-014 resolve SUPPORT; T-015 mode bonuses as probe template.
- No existing support-bag tests.

## Premises

- Catalog Rasengan / Main id is a string fixture (`rasengan` fine).
- Gate Mode skill ids are `gate_of_life` and `gate_of_limit`.
- `gate_prep` cannot pass `resolveSkill` without `cardRole` (incomplete-authoring) — enqueue rules live on `applySupportWeightOnPlay` by skill id.

## Surprises

- `supportBonuses` is unused outside DeckSystem.
- Wiring consume into live `processUpkeep` without `useCombat` persist would re-apply the bag next turn (not one-shot). Out of scope: R1 persist.
