# T-082 exploration

**Ring:** R0–1 · **Route:** autonomous · **Type:** fix L (narrow)

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| Live useSkill still reimplements hit | **false** | PlayerTurnSystem.useSkill already calls resolveSkill |
| useCombat MODE invents buffs | **false** | useCombat.ts 279: MODE shares useSkill |
| bandMove not projected live | **false** | LiveCombatResult.currentRange from resolved.state.range |
| AC test WIRE_KUNAI_REEL exists | **true** | skillsCombatV1New |
| tsc fail: combatants missing on ports | **true** | ResolveSkillPorts has no combatants |

## Complexity premise

Adapter is already written. Gap is the port type so live can pass combatants (T-088 consumes). No useCombat rewrite.

## Layers

R0: ResolveSkillSystem port types. Adapter already in PlayerTurnSystem. Tests + R3 probe.
