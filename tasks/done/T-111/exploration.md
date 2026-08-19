# T-111 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| TEMPLE_NIRVANA is legacy AP2 / guaranteed STUN 1.0×2 via effects / no cardRole / PIERCING | **true** | `skills.ts:3071–3096` |
| Catalog wants SUPPORT AP3/CP8/CD6 80% Stun 2 | **true** | `#catalogo` temple_nirvana |
| SUPPORT `controlStun` path exists | **true** | Killing Intent 0.8×1; Mind Transfer 0.7×2 + failSelf; `resolveControlSupport` ~649–668 |
| Elite/Boss rank on `ResolveSkillState` / ports | **absent** | no elite/boss/enemyRank in ResolveSkillSystem. Elite/Boss Stun cap → **OOS follow-up** |
| SkillTag.CONTROL | **absent** | use GENJUTSU + MENTAL (Killing Intent) |

## Complexity premise

Authoring-only. Reuse `controlStun` without `failSelfDuration`. No ResolveSkill fork. No port change. Do not invent enemy tier model.

## Relevant files

- `src/game/constants/skills.ts` — `TEMPLE_NIRVANA`
- `src/game/systems/__tests__/t079KillingIntent.test.ts` / `t036MindTransfer.test.ts`

## Port signatures

None. Stay R0.
