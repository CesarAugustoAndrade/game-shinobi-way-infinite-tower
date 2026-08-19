# T-118 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S–M

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `FANG_OVER_FANG` is ADVANCED ACTIVE AP2/CP5/CD3, single `baseDamage: 13`, MELEE, no `cardRole` / `hitCount` / CLOSE Setup | **true** | `skills.ts:2239–2264` |
| Catalog wants ATTACK 2×7 CLOSE, AP2/CP5/CD3, +15% Setup if entered CLOSE this turn | **true** | `#catalogo` fang_over_fang; spec |
| Multi-hit already generalizes via `skill.hitCount` + independent `resolveMultiHit` | **true** | `ResolveSkillSystem.ts:1026–1107`; T-004 / T-114 |
| Setup bucket exists (`setupRead`, `setupMultIfBandMoved`) | **true** | `types.ts:875`; T-095 band-move is **this skill's** authored move, not player entered CLOSE |
| Combat state already exposes “entered CLOSE this turn” | **false** | no `enteredClose` / range-history field. `playerMoveUsedThisTurn` only means a voluntary move was spent, not that band became CLOSE via SELF_APPROACH |

## Complexity premise

Primary gap is authoring (single 13 → 2×7 ATTACK CLOSE). `hitCount` already works.

CLOSE-entry +15% is **not** `setupMultIfBandMoved` (that fires on this card’s bandMove). No movement-history motor exists. Spec forbids inventing one. A **one-line optional flag** on `ResolveSkillState` (`enteredCloseThisTurn`) plus data-driven `setupMultIfEnteredCloseThisTurn: 0.15` is not a history system: tests/callers inject the signal; live writers (voluntary approach / SELF_APPROACH) stay OOS R1.

## Relevant files

- `src/game/constants/skills.ts` — `FANG_OVER_FANG`
- `src/game/types.ts` — Skill Setup field
- `src/game/systems/ResolveSkillSystem.ts` — Setup apply next to `bandMovedSetup`
- `src/game/systems/__tests__/t114Rasenshuriken.test.ts` — multi-hit pattern
- `src/game/systems/__tests__/t095GreatBreakthrough.test.ts` — Setup-bucket pattern
- `src/game/systems/__tests__/t117BasicAtk.test.ts` — floor ATTACK sibling

## Port signatures

No port signature change. Optional field on `ResolveSkillState` (same shape as `playerMoveUsedThisTurn`). Stay R0.
