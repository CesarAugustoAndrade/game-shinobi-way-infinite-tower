# T-085 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** fix M (narrow)

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| CombatState lacks pendingSupportWeights / pendingDiscover | **false** | `combat-types.ts:108–110`; `createCombatState` seeds `[]` / undefined |
| buildUpkeepWeightContext only passes modeBonuses | **false** | `PlayerTurnSystem.ts:156–168` already consumeSupportWeightBonuses into WeightContext |
| processUpkeep persists emptied bag | **false** | `UpkeepResult` has no bag; return at `:335` omits it. Next upkeep would re-apply. |
| useSkill already projects bag onto CombatState | **true** | `PlayerTurnSystem.ts:743–744`; `useCombat.ts:321–323` |
| AC test exists | **true** | `t085LiveWeights.test.ts` — does not assert emptied bag after processUpkeep |

## Complexity premise

Fields + consume-into-context already exist. Gap is **write-back**: processUpkeep must return emptied `pendingSupportWeights` so CombatState consume is once.

## Port signatures

Add optional `pendingSupportWeights` / `pendingDiscover` on `UpkeepResult`. Stay Ring 0. Live hook persist of those fields is the R2 adapter of the same consume (no useSkill cutover).

## Residual

Discover UI is T-087. Stun-mark dual-write is T-084 leftover.
