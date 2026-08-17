# T-100 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| SAND_COFFIN is legacy AP2/CP7/CD5 / base 15 / ARMOR_BREAK / effects STUN 0.7 / no cardRole | **true** | `skills.ts:2872–2898` |
| Catalog wants SIDE 15 M/L + 70% Stun 1 + Coffined 2 | **true** | `#catalogo` sand_coffin |
| `impactStun` already applies on ≥1 hit (T-093) | **true** | `EARTH_DECAPITATION` + ResolveSkill |
| `markEffects` `requireHit` plants once on ≥1 hit (T-091) | **true** | `BUG_SWARM` poison |
| Mark id `coffined` is free; `SkillTag.MARK` / `MarkFamily.HARD_CONTROL` exist | **true** | `types.ts` |

## Complexity premise

Authoring-only. `impactStun` + `markEffects` requireHit reuse T-093/T-091 motors. Do not fork ResolveSkill. No port change. Sand Burial consume is OOS.

## Relevant files

- `src/game/constants/skills.ts` — `SAND_COFFIN`
- `src/game/systems/__tests__/t093EarthDecapitation.test.ts` / `t091BugSwarm.test.ts`

## Port signatures

None. Stay R0.
