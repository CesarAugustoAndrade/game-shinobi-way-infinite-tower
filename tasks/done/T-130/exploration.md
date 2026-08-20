# T-130 exploration

**Ring:** R0 (no port signature change). Route: autonomous.

## Relevant files

- `src/game/constants/skills.ts` — `EDO_TENSEI` (~3693): AP2/CP18/HP30/CD10, STR/SPD 0.5×5 `effects[]`, no `cardRole`, no `markEffects`.
- `src/game/systems/ResolveSkillSystem.ts` — SUPPORT plant via `markEffects` + `targetActor: 'self'`; HP cost subtracted at commit; `getSkillBlockReason` rejects insufficient HP (`'hp'`).
- `src/game/systems/MarkSystem.ts` — one-shot helpers (`applyDecoyOutgoing`, `applySubstitutionIncoming` T-129); `addMark` for SHIELD family (coexist, no merge).
- `src/game/systems/SurvivalSystem.ts` — `checkLethalDamage` rng guts → HP 1. Sibling, not the Reanimation contract.
- `src/game/systems/DeckSystem.ts` — `WeightContext.supportRoleBonuses` + `effectiveWeight`. Role deltas are injected by caller.
- `src/game/systems/PlayerTurnSystem.ts` `buildUpkeepWeightContext` — merges **one-shot** `pendingSupportWeights` only; does **not** peek live marks.
- `src/game/systems/SupportWeightSystem.ts` — next-draw bags (`nextDrawRoleBonus`). One-shot, not “while armed”.
- `src/game/constants/skills.ts` `MUD_WALL` — Shield plant: id `mud_wall_shield`, duration 99, stacks 35, `MarkFamily.SHIELD`, `targetActor: 'self'`.
- `src/game/systems/__tests__/t129Kawarimi.test.ts` — closest AC pattern (authoring + plant + helper).
- `src/game/systems/__tests__/t108SummonManda.test.ts` — HP cost paid at attempt; insufficient HP consumes nothing.
- `src/game/systems/__tests__/t064MudWall.test.ts` — Shield mark plant.
- `src/game/systems/__tests__/t124CounterStance.test.ts` — role weight via bag (one-shot; contrast).
- `src/simulation/KawarimiBalance.ts` + `index.ts` — probe hook after Shadow Possession.
- `src/game/types.ts` `SkillTag` — NINJUTSU / MENTAL / MARK exist. No DEFENSE / SUMMON / KINJUTSU tags.

## Ports / reuse

- Plant: existing `resolveSkill` SUPPORT `markEffects` (no new ResolveSkill branch).
- Lethal: new pure helper (T-129 style). Do not fold into `checkLethalDamage` (rng guts must remain when mark absent).
- Shield grant: `addMark` + `MarkFamily.SHIELD` stacks 40, duration 99 (Mud Wall absorb clock).
- Weight: new `reanimationRoleBonuses(marks)` peek → pass as `supportRoleBonuses` into `effectiveWeight`. Not `nextDrawRoleBonus`.

## Local deps

`skills.ts` → types. `ResolveSkillSystem` → Mark plant. `MarkSystem` → types + RangeSystem (unused for this helper). `DeckSystem.effectiveWeight` ← WeightContext. Tests import SKILLS, resolveSkill, MarkSystem, DeckSystem.

## Existing tests

No `edo_tensei` AC. Sibling: t129, t064, t074, t108, t124. Art manifest only references the id.

## Surprises / debt

- `EDO_TENSEI` is KINJUTSU ACTIVE with secret % summon flavor; last ACTIVE without `cardRole` besides c4/copy (kawarimi done).
- Live EnemyTurn lethal path is `checkLethalDamage` only — Reanimation live wire is optional (T-074/T-129 bar).
- `buildUpkeepWeightContext` does not merge mark peeks; continuous ATTACK +1 is a helper + test contract unless a one-liner is added.
- No RING-1 port change: helper is a new export on MarkSystem, not a CombatState/port signature rewrite.

**RE-CLASSIFY:** no. Stays R0.
