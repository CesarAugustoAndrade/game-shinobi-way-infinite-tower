# T-002 · exploration

**Ring:** R0 (confirmed). **Route:** autonomous. **Type:** create.  
**Re-classify to R1?** No. Pure clock helpers + optional `Skill.readyOnTurn` / empty Mode·Mark collections on combat start are not a port-signature change.

## 1. Relevant files

| Path | Why |
|---|---|
| `src/game/systems/PlayerTurnSystem.ts` | `processUpkeep` (~168–282) mixes toggle upkeep, passive/artifact regen, then `drawNewTurnHand`. `useSkill` blocks `currentCooldown > 0` (~477); sets `currentCooldown = cooldown + 1` (~786). |
| `src/game/systems/skillPlayability.ts` | Live gate `currentCooldown > 0` → `'cooldown'` (~80). |
| `src/game/systems/CombatWorkflowSystem.ts` | `createCombatState` (~125–167) seeds AP/hand/deck; no turn index, Modes, Marks, CD reset. |
| `src/game/systems/combat-types.ts` | `CombatState` has deck/discard/hand; no `readyOnTurn` / modes / marks. |
| `src/game/systems/CombatSimulationService.ts` | Combat start zeros `currentCooldown` inline (~648–654); decrements CD on enemy-turn path (~893). |
| `src/game/systems/DeckSystem.ts` | `drawNewTurnHand` — phase-3 hook target until T-003. |
| `src/game/types.ts` | T-001: `ModeDefinition`, `Mark`, `SkillConfig.modeUpkeepPriority`, `TypedCost`. `Skill` has `currentCooldown`, no `readyOnTurn`. |
| `src/game/systems/CardContractSystem.ts` | T-001 contracts; reuse `Mark` / `modeUpkeepPriority` shapes. |
| `src/game/systems/__tests__/t002TurnClock*` | **Absent**. |
| `src/game/systems/__tests__/PlayerTurnSystem.test.ts` | Locks current `processUpkeep` AP/hand/toggle behavior — do not invert. |

## 2. Existing ports to reuse

- `Skill.cooldown` / `currentCooldown` — keep field; normative readiness becomes `readyOnTurn` helper.
- `SkillConfig.modeUpkeepPriority` — order for Mode upkeep hook.
- `Mark`, `ModeDefinition`, `TypedCost` from T-001 — reset + upkeep fixtures.
- `drawNewTurnHand` — optional phase-3 delegate; clock only guarantees **order**.
- `createCombatState` — document encounter frontier; do not invent Heat persistence.

## 3. Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| No ordered Upkeep → regen → snapshot/draw pipeline | **Confirmed** | `processUpkeep` pays toggle then regen then draw in one blob; no phase enum |
| No `readyOnTurn` | **Confirmed** | grep `src/game` empty |
| CD is `currentCooldown = cooldown+1` + decrement | **Confirmed** | `PlayerTurnSystem.ts:786`, `CombatSimulationService.ts:893` |
| createCombatState does not reset CD/Modes/Marks | **Confirmed** | `CombatWorkflowSystem.ts:125–167` |
| Sim zeros CD separately | **Confirmed** | `CombatSimulationService.ts:648` |
| No turn index | **Confirmed** | grep `turnNumber`/`turnIndex` empty |

## 4. Complexity premise

Spec flags “wiring live `processUpkeep`” as the M-sized part. Existing toggle upkeep is **not** the Mode machine. A pure `TurnClockSystem` + AC tests satisfies all three ACs without rewriting the toggle blob. Live wiring of Mode upkeep is a no-op today (`activeModes` empty). **Do not** replace toggle upkeep this slice.

## 5. Skills

- `combat-system-creator` (workflow / status order only).
- loop `RULES.md`: new load-bearing combat module ships with its unit test (spec already requires AC tests).
