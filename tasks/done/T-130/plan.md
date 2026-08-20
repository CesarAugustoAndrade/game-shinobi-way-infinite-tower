# T-130 · plan

**Ring:** R0 · **auto-approved** (standing loop order)

Reauthor `EDO_TENSEI` to SUPPORT AP4/CP18/HP30/CD10. Plant self `reanimation` duration 3. `applyReanimationLethal` on first lethal source: HP 1, consume mark, plant Shield 40 (`MarkFamily.SHIELD` stacks 40 duration 99). `reanimationRoleBonuses` → ATTACK +1 while armed. Drop STR/SPD 0.5×5. No live EnemyTurn guts rewrite (T-074 bar). No `nextDrawRoleBonus` (that is one-shot).

## Files

1. `src/game/constants/skills.ts` — `EDO_TENSEI` authoring (R0)
2. `src/game/systems/MarkSystem.ts` — `applyReanimationLethal` + `reanimationRoleBonuses` + ids (R0)
3. `src/game/systems/__tests__/t130EdoTensei.test.ts` — AC1–3 (R0 tests)
4. `src/simulation/EdoTenseiBalance.ts` + `index.ts` — probe (R3)
5. `CHANGELOG.md`

`ResolveSkillSystem` needs no new branch: `markEffects` + `targetActor: 'self'` already plant; HP cost already subtracts.

## Authoring

- `cardRole: SUPPORT`; AP4/CP18/HP30/CD10; `baseDamage: 0`.
- Tags: `NINJUTSU` + `MENTAL` + `MARK` (no DEFENSE/SUMMON/KINJUTSU SkillTag).
- `markEffects`: id `reanimation`, duration 3, stacks 1, `MarkFamily.STAT`, `targetActor: 'self'`.
- Remove `effects` STR 0.5 / SPD 0.5 duration 5.
- Honest description: Reanimation 3; first lethal → 1 HP + Shield 40 + consume; ATTACK weight +1 while armed.

## Helpers

```
applyReanimationLethal(currentHp, incomingDamage, marks)
```

- Armed + `incomingDamage > 0` + `currentHp - incomingDamage <= 0`: `{ newHp: 1, marks: stripped + Shield 40, consumed: true, grantShield: 40, survived: true }`.
- Else passthrough (`newHp = currentHp - incomingDamage`); do not consume; `grantShield: 0`.
- Mark match: `id === 'reanimation' && target === PLAYER`.
- Guaranteed (no guts rng). Does not call `checkLethalDamage`.
- Shield: `id: 'reanimation_shield'`, `MarkFamily.SHIELD`, stacks 40, duration 99, self.

```
reanimationRoleBonuses(marks) → { ATTACK: 1 } if armed else {}
```

- AC: `effectiveWeight(ATTACK)` +1 vs unarmed; bonus gone after consume; SIDE unchanged.

## Tests

`npm test -- src/game/systems/__tests__/t130EdoTensei.test.ts`

- AC1 authoring — step 1
- AC2 plant (`resolveSkill` SUPPORT, duration 3, HP −30, `damageDealt === 0`) — existing plant path
- AC3 helper lethal package + weight peek — step 2

## Sim

Probe: authoring; plant; HP −30; lethal 10−40 → 1 + Shield 40 + consume; unarmed lethal passthrough; ATTACK weight +1 armed / 0 after consume; leftover STR/SPD 0 vs unused 0.5/0.5. Hook after Kawarimi.

## Split

Single implementer (R0 files overlap).

## Risks / plan B

1. If `applySkillMarkEffects` skipped SUPPORT: add one plant call — bunshin/kawarimi already plant this way.
2. HP 30 must actually reduce pool; insufficient HP (`< 30`) rejects with `'hp'` and consumes nothing (T-108).
3. Live EnemyTurn/guts: document follow-up. Do not change `checkLethalDamage` signature.
4. Live draw: `buildUpkeepWeightContext` does not peek marks today — document; AC is the pure peek.

## Out of scope

Live EnemyTurn mit/guts rewrite; c4/copy/kawarimi; companion summon AI; live UI; SOUL; inventing SkillTags; replacing global guts.
