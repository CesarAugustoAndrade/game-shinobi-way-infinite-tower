# T-080 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M
**Port signatures:** `ImpactStunSpec.lockVoluntaryRangeUp?` additive. Stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `WATER_PRISON` unmarked ACTIVE AP2/CP6/CD5 base 9 STUN 2 @0.7 | **true** | `skills.ts` 1807–1833 |
| `impactStun` SIDE on-hit roll exists | **true** | T-055 Sweeping Kick |
| CombatState has `marks` not `enemyBuffs` | **true** | combat-types.ts |
| Voluntary RETREAT increases range | **true** | RangeSystem.shiftRange |
| SkillTag.CONTROL | **false** | NINJUTSU + WATER |
| Deriving lock from enemy stun on CombatState | **false** | no enemyBuffs on CombatState |

## Complexity premise

Stun roll already exists. Lock needs a self mark (CombatState.marks) + RangeSystem helper + voluntaryPlayerMove gate. Not a new movement engine.

## Layers

R0: skills, types (optional flag), ResolveSkillSystem plant lock, RangeSystem helper, PlayerTurnSystem gate.
