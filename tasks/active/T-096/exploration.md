# T-096 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| EXPANSION is legacy ACTIVE AP2 + STR +50%×2 + Aggressive | **true** | `skills.ts:2350–2377` |
| Catalog wants ATTACK AP3/CP6/CD4 16 CLOSE + +2 STR until next enemy response | **true** | `#catalogo` expansion |
| ATTACK applies `markEffects` via `applySkillMarkEffects` | **true** | `ResolveSkillSystem.ts:1276–1278` |
| Omit `requireHit` → plant on miss (hitsLanded=0 still applies) | **true** | `applySkillMarkEffects` only skips IMPACT/`requireHit` |
| STAT marks exist (T-051 / T-094) | **true** | `spd_down`, `suijinheki_elem_def` |
| StatSystem reads STAT marks into STRENGTH | **false** | buffs only via `applyBuffsToPrimaryStats` |
| SkillTag.NINJUTSU / PHYSICAL / TAIJUTSU available | **true** | `types.ts` SkillTag |

## Complexity premise

Self +2 STR is authoring-only: STAT mark `expansion_str` stacks 2 duration 1, no `requireHit` (reliable Akimichi identity on commit). Wiring StatSystem to consume marks would invent a primary-stat pipeline — spec allows documenting the integer contract on the mark (T-094 sibling). Stay R0; no port change.

## Relevant files

- `src/game/constants/skills.ts` — `EXPANSION`
- `src/game/systems/__tests__/t051LeafWhirlwind.test.ts` / `t094Suijinheki.test.ts`

## Port signatures

None. Stay R0.
