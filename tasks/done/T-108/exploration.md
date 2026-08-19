# T-108 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| SUMMON_MANDA is legacy AP2 / base 25 / HP20 / CD7 / effects POISON 15×4 TRUE / no cardRole / no ranges | **true** | `skills.ts:2691–2716` |
| Catalog wants ATTACK AP4/CP8/HP20/CD7 25 C/M + Poison 6×3, HP paid at attempt | **true** | `#catalogo` summon_manda |
| Poison 6×3 `markEffects` requireHit already exists | **true** | T-106 `poison_fog` `poison` stacks 6 duration 3 DOT |
| HP cost commits on legal resolve attempt (miss still pays) | **true** | `ResolveSkillSystem.ts:841–848` `hpCost` before hit rolls; `getSkillBlockReason` `'hp'` |
| SkillTag.SUMMON / SkillTag.POISON | **absent** | use NINJUTSU + PHYSICAL (T-107 used NINJUTSU + WATER) |

## Complexity premise

Authoring-only. Reuse T-106 poison `markEffects` `requireHit` + existing `hpCost` attempt commit. No ResolveSkill fork. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `SUMMON_MANDA`
- `src/game/systems/__tests__/t106PoisonFog.test.ts` / `t107SummonGamabunta.test.ts` / `t102PuppetCrow.test.ts`
- `src/game/systems/ResolveSkillSystem.ts` — hpCost attempt (read-only reuse)

## Port signatures

None. Stay R0.
