# T-110 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| CURSE_SURGE is legacy AP1/HP10/CD4 / effects STR +0.3 / no cardRole / no modeInteraction | **true** | `skills.ts:3338–3363` |
| Catalog wants SUPPORT require CURSE ON, restore 2, self Vulnerable 10%×2 | **true** | `#catalogo` curse_surge |
| `restoreCharges` + `requireFamily` SUPPORT path exists | **true** | Predict `requireFamily: SHARINGAN` `restoreCharges: 1`; `ResolveSkillSystem.ts:1016–1021` |
| `tryRestoreCharges` caps at maxCharges | **true** | `CombatModeSystem.ts:353–363` |
| Self `vulnerable` STAT mark exists | **true** | Hidden Lotus stacks 30 duration 2 `targetActor: 'self'` |
| CURSE Modes `curse_mark_1` max 3 / `curse_mark_2` max 4 | **true** | `modes.ts:66–88` |
| SkillTag.CURSE / RECHARGE / RISK | **absent** | use NINJUTSU + MODE |

## Complexity premise

Authoring-only. Reuse Predict `modeInteraction.restoreCharges` + Hidden Lotus `vulnerable`. No ResolveSkill fork. No port change.

## Relevant files

- `src/game/constants/skills.ts` — `CURSE_SURGE`
- `src/game/systems/__tests__/t039SharinganPredict.test.ts` / `t031HiddenLotus.test.ts`

## Port signatures

None. Stay R0.
