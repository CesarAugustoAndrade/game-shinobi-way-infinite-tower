# T-009 · plan

**Ring:** R0 · **auto-approved**

## Design

1. `AIContext.tactical` snapshot: setup pressure / marks / deterministic (skip RNG). `scoreEnemySkill` adds a **setup/mark** term so a fixture SUPPORT+mark beats a high-damage skill. `planEnemyAction` stays direct-from-`enemy.skills`.
2. `commitSimPlayerSkill` = `resolveSkill` (same export). Tests prove invalid consume-nothing.
3. `CombatMetrics.ts` bag with SOUL §15 keys; increment helpers. `resetCooldownsKeepModesOff` does not ON/refill. `artifactsOncePerCard(hitsLanded)`.
4. R3 probe prints AI pick + metrics + FREE_FIRST/AP.

Do **not** replace BattleSimulator `calculateDamage` this increment (out of conservative scope; dual-path noted).

## AC map

AC1 score + planEnemyAction · AC2 commitSimPlayerSkill · AC3 metrics + FREE_FIRST + CD reset.
