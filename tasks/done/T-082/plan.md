# T-082 · plan

**Ring:** R0–1 · **auto-approved**

Add `ResolveSkillCombatants` + optional `combatants` / `damageOptions` on `ResolveSkillPorts`. Live adapter already calls `resolveSkill` and projects range. Do **not** implement T-088 hit math this fire.

## Files

1. `src/game/systems/ResolveSkillSystem.ts` — export types; ports accept combatants.
2. `src/simulation/LiveCutoverBalance.ts` + `index.ts` — useSkill vs resolveSkill range/dmg probe.
3. `CHANGELOG.md`.

No PlayerTurnSystem / useCombat edits unless tests fail.

## Tests

`t082LiveCutover` AC1–2.

## Out of scope

T-088 calculateDamage wiring; T-083–T-087; catalog T-067–T-081.
