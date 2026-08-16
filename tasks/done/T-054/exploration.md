# T-054 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `ELBOW_STRIKE` is AP2 unmarked ACTIVE, base 8, MELEE, `PIERCING` | **true** | `skills.ts` 453–471: no `cardRole`, no `allowedRanges`, no `markEffects`; desc “ignores flat defense” |
| No `guard_break` id / 0.15 pen mark | **true** | grep: only T-054 spec; resolve pen block is `studied` 0.2 + `skill.penetration` |
| T-047 Studied uses `applySkillPenetration` + `enemyDefensePercent` | **true** | `ResolveSkillSystem.ts` 339–345, 908–917; t047: def 0.5 / base 10 → 5 vs 6; Studied is **not** ATTEMPT-consumed |
| `applySkillPenetration` = `floor(dmg * (1 - def * (1 - pen)))` | **true** | line 344 |
| ATTEMPT plant on miss unless `perHit` | **true** | `applySkillMarkEffects` 354–358 |
| SIDE/ATTACK plant after hits | **true** | resolve 971–973 |
| Consume ATTACK-only already exists | **true** | `feint` / `aim` predicates 709–710 |
| No test locks Elbow authoring | **true** | no `ELBOW_STRIKE` / `elbow_strike` in `__tests__` |
| `MarkSpec` has no 0.15 metadata field | **true** | `types.ts` 439–450: id/duration/stacks/consume/perHit/family/targetActor |

## Ports / reuse

- Plant: `markEffects` + `applySkillMarkEffects` (SIDE/ATTACK). Author `perHit: true` so miss plants 0.
- Consume: `consumeOnAttempt` predicate sibling of `feint`/`aim`: `guard_break` only when `role === ATTACK`.
- Payoff: fold into existing Studied/def block via `applySkillPenetration`. Do **not** invent a second pen formula.
- Defense fixture: `ResolveSkillState.enemyDefensePercent` (T-047).
- AC3 visibility: def 0.5 + base 10 → both 5 (`floor(10*0.575)=5`). **Lock def 0.4 + base 20** → 12 vs 13.

## Complexity premise

Spec said “reuse `applySkillPenetration` / Studied defense fixture with 0.15.” Confirmed: one consume predicate + extend the existing `pen` `Math.max` (studied 0.2, skill pen, guard_break 0.15). No new formula island. Studied stay-on-board behavior unchanged.

## Layers

R0 only: `skills.ts` `ELBOW_STRIKE`; `ResolveSkillSystem.ts` consume + pen. Tests + `src/simulation/` probe (R3) as T-053.

## Relevant files

- `src/game/constants/skills.ts` — `ELBOW_STRIKE` (legacy PIERCING AP2).
- `src/game/systems/ResolveSkillSystem.ts` — plant / consume / `applySkillPenetration`.
- `src/game/systems/__tests__/t047Analyze.test.ts` — defense fixture + pen numbers.
- `src/game/systems/__tests__/t050FeintStrike.test.ts` — ATTACK-only consume + plant-on-hit.
- `src/game/systems/__tests__/t053Shuriken.test.ts` — latest SIDE chip + probe pattern.
- `src/simulation/ShurikenBalance.ts` + `index.ts` — probe hook.

## Local deps

`skills.ts` → `types` only. `ResolveSkillSystem` → Marks / CardRole / pen helper. No React.

## Surprises / debt

- PIERCING on the chip is dead under test ports (`rollHit` supplies flat damage). Drop to NORMAL so identity is next-ATTACK 15% pen.
- Studied is duration-style (not spent). Guard Break is ATTEMPT spend — different consume, same pen helper.
- `floor` hides 0.15 at small bases; AC3 must use spec’s visible pair (def 0.4 / base 20).
