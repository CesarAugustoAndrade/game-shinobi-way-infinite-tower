# T-019 · plan

**Ring:** R0 · **auto-approved**

Add `pickEnemyModeToDrain`. Optional `enemyModes` / `enemyBuffs` on resolve state. SUPPORT xor: drain 1 enemy charge if ON, else Silence 1. Remove always-on Silence from Sealing Tag `effects[]`. Tests `t019SealingTagDrain` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 drain | resolveSkill + drainCharges |
| AC2 silence | enemyBuffs Silence 1 |
| AC3 no double | drain path has no Silence |
