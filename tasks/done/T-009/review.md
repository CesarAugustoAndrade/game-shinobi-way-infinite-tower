# T-009 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: `planEnemyAction` uses `enemy.skills` only; `setupPressure` fixture picks SUPPORT+mark over high-damage ATTACK.
- AC2: `commitSimPlayerSkill === resolveSkill`; invalid AP consume-nothing.
- AC3: metric bag + two keys increment; FREE_FIRST still requires AP; `resetCooldownsKeepModesOff` does not ON/refill.
- Telegraph path unchanged (`intendedSkillId`).

## Architecture

- RING-GUARD PASS: systems + `src/simulation` probe. No R2.
- BattleSimulator still uses `calculateDamage` (plan: no full damage cutover this slice). Dual path noted.

## Quality

- BLOCK: none.
- SHOULD: wire BattleSimulator/CombatSimulationService player commits through `commitSimPlayerSkill`.
