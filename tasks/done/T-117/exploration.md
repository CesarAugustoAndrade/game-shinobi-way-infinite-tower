# T-117 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| BASIC_ATTACK is AP2/CP0/CD0 base 12 MELEE + AGGRESSIVE stanceBonus, no cardRole / no allowedRanges | **true** | `skills.ts:30–50` |
| Catalog wants ATTACK 12 CLOSE AP2 CD0, no Mode | **true** | `#catalogo` basic_atk |
| T-116 sibling pattern exists | **true** | Heavy Kick explicit ATTACK + CLOSE + resolveCardRole |
| Missing `cardRole` fails `resolveCardRole` | **true** | T-001 incomplete-authoring |

## Complexity premise

Authoring-only. Mirror T-116. Keep existing Aggressive stanceBonus (no stanceShift). No ResolveSkill fork.

## Relevant files

- `src/game/constants/skills.ts` — `BASIC_ATTACK`
- `src/game/systems/__tests__/t116HeavyKick.test.ts`

## Port signatures

None. Stay R0.
