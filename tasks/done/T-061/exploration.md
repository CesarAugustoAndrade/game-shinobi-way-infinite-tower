# T-061 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. New resolve path is an R0 helper, not a port.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `POISON_COAT` is unmarked ACTIVE AP1/CP1/CD4, immediate POISON 8×3 | **true** | `skills.ts` 892–911: no `cardRole`, no `coated` |
| SUPPORT already plants `markEffects` | **true** | `applySkillMarkEffects` on SUPPORT (T-060) |
| T-060 ATTACK-only enemy-trap IMPACT package exists | **true** | `WIRE_TRAP_ID` skip + ATTACK bleed/consume |
| Generic `consumeOnImpact` only spends **enemy** IMPACT marks | **true** | `MarkSystem.ts` 188–190 `mark.target === target` with `CombatActor.ENEMY` |
| Self `coated` IMPACT would **not** be auto-eaten | **true** | consume target is ENEMY |
| Catalog next Offensive = ATTACK **or** SIDE | **true** | spec AC3 |
| `SkillTag.POISON` exists | **false** | SkillTag has TOOL/MARK; POISON is EffectType only |
| No test locks POISON_COAT 8×3 identity | **true** | no `poison_coat` in `__tests__` |

## Ports / reuse

- SUPPORT plant: existing `applySkillMarkEffects` + `targetActor: 'self'`.
- Payoff: sibling of T-060 after wire-trap block — **ATTACK or SIDE**, self `coated`, plant enemy `poison` 5×3 DOT, remove coat.
- Miss: `hitsLanded < 1` → coat stays.
- No damage mult.

## Complexity premise

Spec said “mirror T-060 on **self** coat + **Offensive** not ATTACK-only.” Confirmed. Do not retune Wire Trap. Do not honor generic `effects[]` POISON on SUPPORT (would re-apply immediate 8).

## Layers

R0: `skills.ts` `POISON_COAT`; `ResolveSkillSystem.ts` Offensive coat payoff. Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `POISON_COAT`.
- `src/game/systems/ResolveSkillSystem.ts` — T-060 wire-trap block (sibling after).
- `src/game/systems/__tests__/t060WireSetup.test.ts` — plant/payoff/miss template (ATTACK-only; this task is ATTACK+SIDE).

## Surprises / debt

- No `SkillTag.POISON` — use TOOL + MARK.
- Self IMPACT does not need the T-060 skip-pool (enemy-only consume). Still consume `coated` only in the dedicated Offensive path so MODE/SUPPORT never spend it.
