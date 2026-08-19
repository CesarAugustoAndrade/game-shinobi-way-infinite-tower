# T-127 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `AGGRESSIVE_STANCE` is TOGGLE AP2/CP3/CD5, `isToggle` + `upkeepCost: 5`, STR +30% / WIL −20%, no `cardRole` / stanceShift / marks | **true** | `skills.ts:1277–1301` |
| Catalog wants SUPPORT AP1/CP3/CD5, Aggressive shift, next ATTACK +20% Setup, +20% taken until next own start | **true** | spec + `#catalogo` |
| Attempt Setup ×1.2 exists (`off_balance`, `spatial_tear`) | **true** | `markDamageMultiplier` |
| Incoming +20% self-mark hook | **partial** | `vulnerable` planted (Lotus) but no one-line incoming mit in resolve — plant-only for open mark |
| POSTURE / OFFENSE tags | **false** | `SkillTag.TAIJUTSU` available |
| Lee starter lists it as toggle | **true** | `constants/index.ts:198` — move to active |

## Complexity premise

Authoring + one table row (`aggressive_focus` ×1.2) + ATTACK consume filter. Open mark plant-only (duration 1). No new incoming engine.

## Relevant files

- `src/game/constants/skills.ts`
- `src/game/constants/index.ts`
- `src/game/systems/ResolveSkillSystem.ts`
- T-125 / T-023 / T-065 tests

## Port signatures

None. Stay R0.
