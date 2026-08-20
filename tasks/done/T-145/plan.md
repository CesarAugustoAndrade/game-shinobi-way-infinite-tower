# T-145 · plan

**Ring:** R0 · **auto-approved**

`SkillPlayContext.turnIndex?`. Cooldown block: if `turnIndex` set → `!isSkillReadyOnTurn`; else `currentCooldown > 0`. Live callers pass `combatState.turnIndex`. Kill reset clears `currentCooldown` and `readyOnTurn`. No skill reauthor. Reason order unchanged.

## Files

1. `src/game/systems/skillPlayability.ts`
2. `src/game/systems/EquipmentPassiveSystem.ts`
3. `src/hooks/useCombat.ts`
4. `src/scenes/combat/Combat.tsx` + `src/App.tsx` (optional prop pass)
5. `t145ReadyOnTurnPlayability.test.ts`
6. `ReadyOnTurnPlayabilityBalance.ts` + `index.ts`
7. `CHANGELOG.md`

Do **not** pass turnIndex into ResolveSkill’s `getSkillBlockReason` (t123 `'not-ready'`).

## Steps

### 1. Playability (AC1, AC3)

```
if (ctx.turnIndex !== undefined) {
  if (!isSkillReadyOnTurn(skill.readyOnTurn, ctx.turnIndex)) return 'cooldown';
} else if (skill.currentCooldown > 0) {
  return 'cooldown';
}
```

Tests: readyOnTurn T+2, turnIndex T+1 → cooldown; T+2 → not cooldown. currentCooldown 0 + future readyOnTurn + turnIndex → cooldown; resolveSkill same fixture `ok === false`.

### 2. Kill reset (AC2)

`processPassivesOnKill`: map `{ ...skill, currentCooldown: 0, readyOnTurn: 0 }`.

### 3. Live pass

useCombat + Combat.tsx `turnIndex` from combatState.

### 4. Sim: playability block/ready, kill reset, resolve parity.

## Risks

1. t123 `'not-ready'` — do not reroute resolve CD through playability.
2. Callers omitting turnIndex still use currentCooldown (legacy).
