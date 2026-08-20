# T-144 · plan

**Ring:** R0 · **auto-approved**

After shield in `executeEnemyAction`, call `applyReanimationLethal`. If consumed: HP 1, persist marks (no reanimation, shield 40), **do not** call `checkLethalDamage`. Else existing guts path. `buildUpkeepWeightContext` adds `reanimationRoleBonuses(marks)` onto `supportRoleBonuses`.

## Files (single implementer)

1. `EnemyTurnSystem.ts` — lethal wire
2. `PlayerTurnSystem.ts` — weight merge
3. `t144ReanimationLive.test.ts`
4. `ReanimationLiveBalance.ts` + `index.ts`
5. `CHANGELOG.md`
6. Helper comments T-130 optional → T-144 live

## Steps

### 1. Lethal (AC1, AC3)

After `incomingDamage = shield.damage`:
- `reanim = applyReanimationLethal(hp, incomingDamage, actionMarks)`
- consumed → `lethalCheck = { survived: true, newHp: 1, log: Reanimation… }` without guts
- else `checkLethalDamage` as today

Tests `executeEnemyAction` AUTO strike:
- `T-144 lethal` — player HP 20 + reanimation → HP 1, mark gone, shield 40, `gutsTriggered` false, `playerDefeated` false
- `T-144 chip` — HP 400 + reanimation → mark still present, HP < 400 but > 1

### 2. Weight (AC2)

`supportRoleBonuses`: merge bag roles + `reanimationRoleBonuses(combatState.marks ?? [])`.

Tests:
- armed marks → ATTACK `effectiveWeight` +1 vs empty
- after lethal consume → bonus gone

### 3. Sim probe: lethal save HP 20→1; chip keeps mark; weight +1 then 0.

## Risks

1. AUTO + guts share RNG — skip guts on consume.
2. DoT/hazard lethal not wired (incoming already 0). Follow-up note.

OOS: skill reauthor, sim service extra paths, T-135 absorb math.
