# T-057 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. `hitCount` already on `Skill`.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `STRONG_FIST` is unmarked ACTIVE, AP2/CD1, single `baseDamage: 10`, combo flavor text, no CLOSE | **true** | `skills.ts` 411–430: no `cardRole`, no `hitCount`, no `allowedRanges` |
| Phoenix Flower already uses `hitCount: 3` + `baseDamage: 5` | **true** | `skills.ts` 151–152; T-033 `hitsLanded === 3`, `damageDealt === 15` |
| `resolveSkill` rolls `hitCount` independently via `resolveMultiHit` | **true** | `ResolveSkillSystem.ts` 885–888; `MarkSystem.ts` 319–329 (N `rollHit` calls; sum damage of hits) |
| Default `hitCount` is 1 | **true** | `(skill.hitCount ?? 1)` |
| `SkillTag.MULTI_HIT` exists | **true** | `types.ts` `SkillTag.MULTI_HIT` |
| No test locks Strong Fist authoring at 10 | **true** | no `strong_fist` in `__tests__` except TANK kit comment |
| Enemy TANK kit includes STRONG_FIST | **true** | `EnemySystem.ts` 140; test only requires `baseDamage > 0` (5 still passes) |
| Legacy live/sim hit path honors `hitCount` | **false** | `SkillResolutionSystem` / `CombatWorkflowSystem` / `BattleSimulator` have **no** `hitCount` |

## Ports / reuse

- Multi-hit: existing ATTACK `resolveMultiHit` (T-004 / T-033). No new engine.
- Damage under test ports: `rollHit` returns `{ hit, damage: skill.baseDamage }` → 2×5 = 10.
- Partial connect: sequence `rollHit` is available (varying mock). Spec AC focuses full + miss; optional extra documents 1/2 = 5.
- Range: `allowedRanges: [CLOSE]` (MEDIUM/LONG reject).
- No Mode, no bandMove.

## Complexity premise

Spec said “mirror Phoenix Flower hitCount packaging without Mode.” Confirmed: authoring `hitCount: 2` + `baseDamage: 5` is enough. **Do not** change `ResolveSkillSystem`. **Do not** invent 75%-of-10 math.

## Layers

R0: `skills.ts` `STRONG_FIST` only. Tests + R3 probe. No `types.ts` / resolve edits.

## Relevant files

- `src/game/constants/skills.ts` — `STRONG_FIST` (legacy single 10).
- `src/game/systems/ResolveSkillSystem.ts` — existing multi-hit block (read-only).
- `src/game/systems/MarkSystem.ts` — `resolveMultiHit` (read-only).
- `src/game/systems/__tests__/t033PhoenixFlower.test.ts` — sibling 3×5.
- `src/game/systems/__tests__/EnemySystem.test.ts` — TANK opening still picks STRONG_FIST if `baseDamage > 0`.

## Surprises / debt

- TANK kit + academy bully / Sound Four Initiate use `STRONG_FIST`. Legacy `resolveSuccessfulHit` will see **5** (single roll) until that path learns `hitCount`. Out of scope (no live useSkill AC). Note only.
- Name is “Strong Fist Combo”; catalog id `strong_fist`. Keep name.
