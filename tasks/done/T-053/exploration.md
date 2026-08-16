# T-053 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `SHURIKEN` is AP1 unmarked ACTIVE, base 11, ACC scaling, `critBonus: 25` | **true** | `skills.ts` 74–95: no `cardRole`, no `allowedRanges`, no `markEffects` / tags; description is crit-identity |
| No `aim` ACC payoff exists | **true** | `ResolveSkillSystem.ts` 893–901: `shunshin_dex` / `feint` / `lotus_opening` only |
| `aim` id already used as generic fixture | **true** | T-007 SUPPORT fixture + T-009/T-010/T-012/sim probes. Default `targetActor` → **ENEMY**; `consumeOnAttempt` reads **PLAYER** marks → collision does not spend those fixtures |
| T-043 plants `shunshin_dex` and adds `scalingPerPoint` on DEX | **true** | `skills.ts` 260–269; resolve 893–896: DEX → `scalingPerPoint`, else +1 |
| T-049 Kunai Throw is SIDE M/L TOOL chip (no Aim) | **true** | `skills.ts` 611–634: SIDE, 7 dmg, M/L, `nextDrawTagBonus` TOOL +1 |
| T-050 Feint consume is ATTACK-only | **true** | resolve 709: `if (mark.id === 'feint') return role === CardRole.ATTACK` |
| ATTEMPT `markEffects` plant on miss | **true unless `perHit`** | `applySkillMarkEffects` 354–358: ATTEMPT non-perHit applies 1 even at `hitsLanded` 0 |
| SIDE/ATTACK plant after hits | **true** | resolve 971–973: `applySkillMarkEffects(next, skill, hitsLanded)` |
| No test locks Shuriken crit/authoring | **true** | no `SKILLS.SHURIKEN` assertions; campaign only lists id `'shuriken'` |
| `SkillTag.TOOL` / `WEAPON` exist | **true** | `types.ts` 340–342 |

## Ports / reuse

- Plant: existing `markEffects` + `applySkillMarkEffects` (SIDE/ATTACK, after hits). Author `perHit: true` so miss plants 0. Do **not** retune global ATTEMPT plant.
- Consume: `consumeOnAttempt` predicate sibling of `feint` / `launched`: `aim` only when `role === ATTACK`.
- Payoff: sibling of `shunshin_dex` (893–896) with ACC instead of DEX. Same integer-stat rule.
- Range reject: existing `allowedRanges` gate (T-049 CLOSE reject).

## Complexity premise

Spec said “mirror `shunshin_dex` consume wiring with ACC instead of DEX.” Confirmed: one consume predicate + one damage add. No second damage pipeline. No new mark type.

## Layers

R0 only: `skills.ts` `SHURIKEN`; `ResolveSkillSystem.ts` consume + ACC add. Tests + `src/simulation/` probe (R3) as T-050/T-052.

## Relevant files

- `src/game/constants/skills.ts` — `SHURIKEN` authoring (legacy crit).
- `src/game/systems/ResolveSkillSystem.ts` — plant / consume / integer-stat payoff.
- `src/game/types.ts` — `CardRole`, `SkillTag`, `MarkFamily`, `MarkConsumeTiming`.
- `src/game/systems/__tests__/t043Shunshin.test.ts` — DEX payoff template.
- `src/game/systems/__tests__/t049KunaiThrow.test.ts` — SIDE M/L chip template.
- `src/game/systems/__tests__/t050FeintStrike.test.ts` — ATTACK-only consume + plant-on-hit.
- `src/game/systems/__tests__/t052RisingWind.test.ts` — `perHit` miss-no-plant.
- `src/simulation/RisingWindBalance.ts` + `index.ts` — probe hook pattern.
- `src/game/systems/__tests__/t007ResolveSkill.test.ts` — generic `aim` fixture (ENEMY target).

## Local deps

`skills.ts` → `types` only. `ResolveSkillSystem` → Marks / CardRole / PrimaryStat. Tests import SKILLS + resolveSkill. No React.

## Surprises / debt

- `aim` is a fixture id, not a live skill mark. Spec requires id `aim`; ENEMY-targeted fixtures stay inert under PLAYER consume.
- `critBonus: 25` is packaging only under test ports (`rollHit` supplies flat damage). Drop it so crit is not the identity.
- `scalingPerPoint: 3` + `ACCURACY` already on SHURIKEN; chip tests use `rollHit` → `damageDealt === 11` (scaling does not apply under test ports).
