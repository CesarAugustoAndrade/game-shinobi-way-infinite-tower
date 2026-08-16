# T-087 exploration

**Ring:** R2 · **Route:** autonomous · **Type:** fix S

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| Modes/Setup panels exist but unmounted | **false** | `Combat.tsx:32–33` import; `:710–714` render |
| Hand lacks mainAttackId | **false** | `Combat.tsx:796` passes `player.skillConfig?.mainAttackId` |
| Toggles re-check range by hand | **partial** | `canPlaySkill` + `modeAlreadyOn` live; **`grantedRanges` missing** from Combat context (`:348–359`) |
| AC test exists | **true** | `src/scenes/combat/__tests__/t087CombatMount.test.ts` |

## Complexity premise

Mount is done. Remaining: pass `grantedRanges` from live Modes into `buildSkillPlayContext` (same helper as `useCombat.ts:135`). No new damage formulas.

## Port signatures

No R0 change. Stay R2.
