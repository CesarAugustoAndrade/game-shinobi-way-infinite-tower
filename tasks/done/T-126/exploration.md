# T-126 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `DEFENSIVE_POSTURE` is TOGGLE AP2/CP3/CD5, `isToggle` + `upkeepCost: 3`, WIL +25% / SPD −15%, no `cardRole` / stanceShift / shield | **true** | `skills.ts:1244–1268` |
| Catalog wants SUPPORT AP1/CP3/CD5, Defensive shift, Shield 25 | **true** | spec + `#catalogo` |
| Brace plants self SHIELD 20 duration 1 + DEFENSIVE shift | **true** | T-065 `brace_shield` |
| POSTURE / DEFENSE tags | **false** | `SkillTag.TAIJUTSU` available |
| Uzumaki starter lists it as toggle | **true** | `constants/index.ts:153` — move to active (T-125 pattern) |

## Complexity premise

Authoring-only. Reuse Brace SHIELD plant + `stanceShift`. No new duration system.

## Relevant files

- `src/game/constants/skills.ts`
- `src/game/constants/index.ts`
- `src/game/systems/__tests__/t065Brace.test.ts`

## Port signatures

None. Stay R0.
