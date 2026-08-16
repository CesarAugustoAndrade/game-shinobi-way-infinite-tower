# T-042 research

Skipped external research — expand on in-tree T-007/T-022/T-037/T-041 motors.

## Options for Setup +50%

1. **`setupRead` field + ATTACK bucket** (chosen). Independent of Mode. `consume` default false. Test name locks “mark-only Setup read”. Matches spec option (a).
2. Extend `modeInteraction.requireMarkId` when no `modeId`. Rejected: overloads Twin Lion; easy to accidentally spend charges / require Mode.
3. Fold into `markDamageMultiplier` via spent attempt marks. Rejected: `read_mind` is not an attempt-consume mark; catalog says **no consume**.

## Confusion lock

- T-041: `controlConfusion` → `enemyBuffs` `EffectType.CONFUSION`.
- Wire the same helper on ATTACK **only if `hitsLanded >= 1`**. Miss: no plant.
- Threshold `rng() < 0.65` (same policy as T-036/T-041).
- Do not keep `effects: CONFUSION 3@1.0` (legacy primary identity). Do not dual-author `effects` 2@0.65 (BattleSimulator would double-apply vs live R1).

## Rounding

Project ATTACK enhance is `Math.floor(total * (1 + bonus))` (T-018/T-022). AC3: `floor(15 * 1.5) === 22`.
