# T-116 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| HEAVY_KICK is AP2/CP0/CD1 base 14 MELEE + AGGRESSIVE stance, no cardRole / no allowedRanges | **true** | `skills.ts:52–72` |
| Catalog wants ATTACK 14 CLOSE AP2 CD1, no Mode, Main-eligible | **true** | `#catalogo` heavy_kick |
| Missing `cardRole` fails `resolveCardRole` | **true** | T-001: no field → `incomplete-authoring`; explicit field → ATTACK without map |
| MELEE default is CLOSE-only | **true** | `defaultsForAttackMethod(MELEE)` = CLOSE; spec prefers explicit `allowedRanges` |
| Pure ATTACK resolve already works | **true** | T-007 / T-059 Sword Slash |

## Complexity premise

Authoring-only. No ResolveSkill fork. Keep existing Aggressive stance (catalog silent; not Mode).

## Relevant files

- `src/game/constants/skills.ts` — `HEAVY_KICK`
- `src/game/systems/CardContractSystem.ts` — `resolveCardRole`
- `src/game/systems/__tests__/t059SwordSlash.test.ts` / `t001CardContracts.test.ts`

## Port signatures

None. Stay R0.
