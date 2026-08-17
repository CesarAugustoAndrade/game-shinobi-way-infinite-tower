# T-091 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| BUG_SWARM is legacy ACTIVE 8 + mute CHAKRA_DRAIN 25 / POISON 8×3 | **true** | `skills.ts:2272–2299` |
| Catalog wants SIDE AP2/CP6/CD4 M/L + drain 6 + Poison 3×3 on impact | **true** | `#catalogo` bug_swarm |
| Poison plant on ≥1 hit exists | **true** | T-070 `markEffects` `id: 'poison'` + `applySkillMarkEffects` |
| Fixed “drain 6 on hit” authoring does **not** exist | **true** | T-045 drain is `impactMarkConsume.drainChakraPerStack` (CP marks) |
| `enemyChakra` on resolve state | **true** | `ResolveSkillState.enemyChakra` |
| SkillTag.POISON available | **false** | `SkillTag` has NINJUTSU / PHYSICAL only |
| Need skill-id special-case | **false** | New optional `impactChakraDrain` + existing markEffects |

## Complexity premise

Poison is authoring-only (T-070 path). Drain needs one optional Skill field + one ≥1-hit hook. Not a new Mode/DoT motor. Port signatures unchanged (optional domain field on `Skill`). Stay R0.

## Relevant files

- `src/game/constants/skills.ts` — `BUG_SWARM`
- `src/game/types.ts` — `Skill.impactChakraDrain`
- `src/game/systems/ResolveSkillSystem.ts` — impact drain hook
- `src/game/systems/__tests__/t070SenbonRain.test.ts` — poison template
- `src/game/systems/__tests__/t045GentleFist.test.ts` — enemyChakra fixture

## Port signatures

None. Optional Skill field only. Stay R0.
