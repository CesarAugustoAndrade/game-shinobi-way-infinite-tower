# T-008 · exploration

**Ring:** R0 constants. Route: autonomous.

## Terrain

| Path | Fact |
|---|---|
| `src/game/constants/skills.ts` | `SKILLS` object, **116** entries (`kamui`/`tengai` last). No `cardRole`. None of the 12 names/ids. |
| `src/game/constants/index.ts` | `ACADEMY_CORE` + `CLAN_START_LOADOUT` / `getClanStartingSkills`; `CLAN_FAVORITE_SKILLS`; `CLAN_LEVEL_SKILL_POOL`; `resolveSkillById`. |
| `ItemGenerationSystem.generateSkillForFloor` | Vendor = `Object.values(SKILLS)` filtered by **tier** + `requirements.clan`. No clan → universal eligible. |
| T-005 `modes.ts` | Mode id **`sharingan_3`** (family SHARINGAN, AP 3, 6/6 CP, CD 5, 3 charges). `gate_of_limit`, `shadow_clone`, `byakugan` exist. |
| Skill fields (T-001) | `cardRole`, `tags`, `baseWeight`, `hitCount`, `discover`, `markEffects`, `modeInteraction`, `allowedRanges`. No movement field. |
| `tactical_scroll` | ComponentId only — not a skill. |

## Premises

| Premise | Verdict |
|---|---|
| Catalog is 116, not 128 | **Confirmed** (file ends `TENGAI_SHINSEI`). |
| 12 names absent | **Confirmed** (grep). |
| Vendor hook exists without new UI | **Confirmed** `generateSkillForFloor` — omit `requirements.clan` + BASIC/ADVANCED tier. |
| Starters are `getClanStartingSkills` / `CLAN_START_LOADOUT` | **Confirmed**. |

## Complexity

New hit/resolve infra **not** needed. Data + merge + tests. Clan five go on `CLAN_LEVEL_SKILL_POOL` / favorites (learn channels). Do **not** put any of the 12 in starters.

## RING-GUARD

constants + tests only. No React.
