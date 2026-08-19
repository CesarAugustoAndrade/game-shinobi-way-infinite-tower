# T-124 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `COUNTER_STANCE` is BASIC AP2/CP1/CD4, `baseDamage: 8`, REFLECTION 0.5, DEFENSIVE stanceShift, no `cardRole` / marks / SIDE weight | **true** | `skills.ts:567–587` |
| Catalog wants SUPPORT AP1/CP1/CD4, Counter 30% first MELEE, SIDE +1, no instant dmg | **true** | spec + `#catalogo` |
| Self reflect mark plant exists (`rotation_reflect` stacks=percent) | **true** | T-028; stacks 60 = 60% |
| `nextDrawRoleBonus` SIDE +1 + `applySupportWeightOnPlay` | **true** | T-073 Hidden Mist |
| SUPPORT does not apply `effects[]` as primary Setup | **true** | Rotation comment; T-073 |
| DEFENSE / REACTION tags | **false** | `SkillTag.TAIJUTSU` + `PHYSICAL` available |

## Complexity premise

Authoring-only. Reuse Rotation self-mark + SupportWeight bag. No new reflect engine. Live MELEE-only filter OOS.

## Relevant files

- `src/game/constants/skills.ts` — `COUNTER_STANCE`
- `src/game/systems/__tests__/t028RotationKaiten.test.ts`
- `src/game/systems/__tests__/t073HiddenMist.test.ts`

## Port signatures

None. Stay R0.
