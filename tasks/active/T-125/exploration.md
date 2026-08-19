# T-125 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `FOCUSED_STANCE` is TOGGLE AP2/CP3/CD5, `isToggle` + `upkeepCost: 3`, ACC/DEX % effects, no `cardRole` / stanceShift / Focused mark | **true** | `skills.ts:1210–1234` |
| Catalog wants SUPPORT AP1/CP3/CD5, Balanced shift, Focused 2 +20 crit next ATTACK | **true** | spec + `#catalogo` |
| `stanceShift` is free on play | **true** | Brace DEFENSIVE; `stanceShiftFromSkill` |
| Cloak/Feint attempt-consume next ATTACK | **true** | consume filter ATTACK-only; Cloak 1.5×; Feint +15 dmg |
| Hit-core crit uses `skill.critBonus` as extra chance points | **true** | `StatSystem.ts:735` |
| POSTURE / PRECISION tags | **false** | `SkillTag.TAIJUTSU` available |
| Yamanaka starter lists it as toggle | **true** | `constants/index.ts:213` — move to active |

## Complexity premise

Authoring + Cloak consume filter + one-line `critBonus += focused.stacks` on hit-core. RollHit stub observes consume, not RNG crit. No toggle/Mode machine.

## Relevant files

- `src/game/constants/skills.ts`
- `src/game/constants/index.ts` — Yamanaka kit
- `src/game/systems/ResolveSkillSystem.ts`
- `src/game/systems/__tests__/t062CloakInvis.test.ts`

## Port signatures

None. Stay R0.
