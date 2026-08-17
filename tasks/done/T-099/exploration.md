# T-099 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| WATER_DRAGON is legacy AP2 / base 15 / no cardRole / no setupRead | **true** | `skills.ts:2900–2925` |
| Catalog wants ATTACK AP3/CP6/CD4 18 M/L +20% under own Hidden Mist | **true** | `#catalogo` water_dragon |
| T-073 plants enemy mark id `mist` | **true** | `HIDDEN_MIST` markEffects |
| `setupRead` already multiplies and can leave mark | **true** | `ResolveSkillSystem` + T-042 `consume: false` |
| SkillTag.NINJUTSU / WATER available | **true** | `types.ts` |

## Complexity premise

Authoring-only. `setupRead: { markId: 'mist', damageMultBonus: 0.2, consume: false }` reuses T-042 motor. Do not fork Setup pipeline. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `WATER_DRAGON`
- `src/game/systems/__tests__/t042MindDestruction.test.ts` / `t073HiddenMist.test.ts`

## Port signatures

None. Stay R0.
