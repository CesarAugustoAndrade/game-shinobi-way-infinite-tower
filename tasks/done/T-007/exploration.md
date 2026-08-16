# T-007 · exploration

**Ring:** R0 (`src/game/systems/**`). Route: autonomous. No port-signature change in R1 (live `useSkill` not required this slice).

## Relevant files

| Path | Role |
|---|---|
| `src/game/systems/PlayerTurnSystem.ts` ~386–817 | Live `useSkill`: AP/range/chakra/HP/CD/stun/silence gates, then **single** `calculateDamage` hit. Invalid AP/range → zero-dmg `CombatResult` (resources untouched); CD → `null`. No `cardRole` branch. |
| `src/game/systems/SkillResolutionSystem.ts` | Post-hit mult/mitigation only. Keep as hit math; do not become orchestrator. |
| `src/game/systems/skillPlayability.ts` | Shared gates + FREE_FIRST chakra-only + Mode range flags. Reuse in validate. Does **not** check `readyOnTurn` (only `currentCooldown`). |
| `src/game/systems/CardContractSystem.ts` | `resolveCardRole` / `isHandPlayableRole`. Role never inferred from damage. |
| `src/game/systems/MarkSystem.ts` | `consumeOnAttempt`, `consumeOnImpact`, `addMark`, `resolveMultiHit`, `applyCardResolveConsumes`. |
| `src/game/systems/CombatModeSystem.ts` | `activateMode`, `manualOff`, `lateralSwap`/`ascendMode`, `trySpendCharges`. Pay activation from Mode pools. |
| `src/game/systems/TurnClockSystem.ts` | `markSkillUsedOnTurn`, `isSkillReadyOnTurn`, `computeReadyOnTurn`. |
| `src/game/systems/RangeSystem.ts` | `resolveForcedMove`, `collectRangeReactions`. |
| `src/game/systems/combat-types.ts` | `CombatState` already has `turnIndex?`, `activeModes?`, `marks?`. `CombatResult` has no reject/marks/hitsLanded. |
| `src/hooks/useCombat.ts` | R1 caller of `useSkillCombat`. Out of scope unless thin one-line retarget. |
| `src/simulation/BattleSimulator.ts` | Own hit path via `resolveSuccessfulHit`; **does not** call `useSkill` / `resolveSkill`. |

## Ports to reuse (do not reinvent)

- Role: `resolveCardRole` — reject `incomplete-authoring`.
- Playability: `getSkillBlockReason` + `effectiveChakraCost`.
- CD: `markSkillUsedOnTurn` / `isSkillReadyOnTurn`.
- Marks: `consumeOnAttempt` then `consumeOnImpact(hitsLanded)`.
- Multi-hit: `resolveMultiHit` + injected `rollHit`.
- Modes: injected `activateMode` / `manualOff` / `trySpendCharges` (real impl default; tests spy).
- Move: `resolveForcedMove` after role body.

## Premises (spec vs code)

| Premise | Verdict |
|---|---|
| No `resolveSkill(intent)` exists | **Confirmed.** Grep: only sim `resolveSkillById` (catalog lookup). |
| Live path is monolithic single-hit `useSkill` | **Confirmed** `PlayerTurnSystem.ts:386`. |
| Invalid sometimes 0-dmg result, sometimes `null` | **Confirmed** range/AP → result; `currentCooldown > 0` → `null` (`:478`). |
| T-004 attempt/impact APIs exist | **Confirmed** `MarkSystem.ts:94–117`. |
| T-005 Mode activate/off/charges exist | **Confirmed**. |
| `cardRole` optional on catalog | **Confirmed** `types.ts:752`. Missing = incomplete authoring. |
| PASSIVE is ActionType, not CardRole | **Confirmed** T-001 / `isHandPlayableRole`. |
| Complexity: need new hit-math infra | **Refuted.** Orchestrate existing Mark/Mode/playability/clock. `SkillResolutionSystem` stays hit-only. |

## Existing tests

`t001`–`t006` AC files + `PlayerTurnSystem.test.ts` (live `useSkill`). New gate file: `src/game/systems/__tests__/t007ResolveSkill.test.ts`.

## Surprises / debt (do not fix)

- Dual CD: `currentCooldown` (live) vs `readyOnTurn` (SOUL). Resolve must honor `readyOnTurn`; playability still keys off `currentCooldown`.
- Wiring `useSkill` → `resolveSkill` would re-enter terrain/artifact/execute/heal paths; spec allows parallel pure API as SoT.
- Battle sim will not change unless explicitly probed — add a small R3 probe.

## RING-GUARD

New module must stay under `src/game/systems/**`. No React/DOM/`components`/`scenes`/`hooks`/`contexts`.
