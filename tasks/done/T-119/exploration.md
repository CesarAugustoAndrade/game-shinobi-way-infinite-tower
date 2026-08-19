# T-119 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `BONE_DRILL` is FORBIDDEN ACTIVE AP2/HP10/CD3, `baseDamage: 15`, `DamageType.TRUE`, no `cardRole` / ranges / `penetration` | **true** | `skills.ts:3502–3528` |
| Catalog wants ATTACK 18 C/M, AP3/HP10/CD3, ignore 25% physical defense | **true** | spec + `#catalogo` bone_drill |
| `Skill.penetration` (0–1) already exists | **true** | `types.ts:983`; Twin Lion 0.3; 64 Palms 0.3 |
| Resolve applies `applySkillPenetration` when `enemyDefensePercent > 0` using `skill.penetration` | **true** | `ResolveSkillSystem.ts:1192–1200`; formula `floor(dmg * (1 - def * (1-pen)))` |
| TRUE in hit-core (`StatSystem`) strips all defense | **true** | `StatSystem.ts:768,804` |
| rollHit stub still runs `applySkillPenetration` when fixture def > 0 | **true** | no TRUE skip in ResolveSkillSystem |

## Complexity premise

Authoring-only. Shared pen path covers PHYSICAL ATTACK. No new mit engine.

AC3 via `enemyDefensePercent` fixture: pen 0.25 vs 0.4 def → 12; pen 0 → 10; TRUE full strip would keep 18. 12 > 10 and 12 ≠ 18.

## Relevant files

- `src/game/constants/skills.ts` — `BONE_DRILL`
- `src/game/systems/ResolveSkillSystem.ts` — existing pen apply (read-only)
- `src/game/systems/__tests__/t054ElbowStrike.test.ts` — `enemyDefensePercent` fixture
- `src/game/systems/__tests__/t022TwinLionFists.test.ts` — `penetration` authoring

## Port signatures

None. Stay R0.
