# T-018 · exploration

**Ring:** R0 Rasengan Mode payoff. Optional field on existing `ModeInteraction` (not a new port).

## Relevant files

- `src/game/types.ts` — `ModeInteraction` has `modeId` / `consumeCharges`; no `damageMultBonus`.
- `src/game/constants/skills.ts` — `rasengan` is legacy ACTIVE (no `cardRole`, no `modeInteraction`).
- `src/game/systems/ResolveSkillSystem.ts` — charges only via `intent.modeCharges`; `intent.enhanced` is a manual +50% of base.
- `src/game/systems/CombatModeSystem.ts` — `trySpendCharges` (fail leaves board; `insufficient-charges`).
- T-008 Barrage already authors `consumeCharges: 1` on clones (auto path optional; AC is Rasengan only).

## Premises

- Catalog id is `rasengan`. Shadow Clone Mode id is `shadow_clone`.
- Apply `Math.floor(damageDealt * (1 + 0.5))` once on total after hits.
- Spend at attempt (before rolls); miss still spends if Mode ON.

## Surprises

- `intent.enhanced` is independent; Rasengan AC must pass without it.
- Rasengan `allowedRanges` omitted; MELEE defaults to CLOSE.
