# T-044 research

In-tree only (T-016/T-029/T-030/T-043).

## Options

1. **`bandMove` steps: 2** (chosen). Reuses T-023 engine. LONG→CLOSE in one resolve.
2. Direct `range = CLOSE`. Works but second path. Rejected.
3. Hardcode `dancing_leaf` in `applySupportWeightOnPlay`. Works; prefer authored `nextDrawSkillBonuses` like T-038/T-041.

## +25% lock

Setup bucket after Mode/off_balance: `floor(total * 1.25)`. Compare same Gate-ON fixture with/without mark. Consume `lotus_opening` only on GATES finishers, including miss.
