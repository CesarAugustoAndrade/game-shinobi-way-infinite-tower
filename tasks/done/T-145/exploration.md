# T-145 · exploration

**Ring:** R0 (skillPlayability + EquipmentPassiveSystem). Thin R1 `useCombat` + Combat.tsx `turnIndex` pass. No port signature break beyond optional `SkillPlayContext.turnIndex`.

## Spec premises vs code

- `isSkillReadyOnTurn` is normative. `resolveSkill` already gates with it → `'not-ready'`.
- `getSkillBlockReason` uses `skill.currentCooldown > 0` only. `SkillPlayContext` has no `turnIndex`.
- `useCombat.buildSkillPlayContext` and `Combat.tsx` assemble playability without `turnIndex`.
- `processPassivesOnKill` COOLDOWN_RESET sets `currentCooldown: 0` only; `readyOnTurn` left armed.
- `resetCooldownsKeepModesOff` already clears both skill fields (T-009). Kill path does not call it.
- t123 Reaper expects resolve `'not-ready'` on second cast — do **not** fold that into playability `'cooldown'` inside resolve (would invert t123). Playability + resolve both reject is AC3; reasons may differ (`cooldown` vs `not-ready`).

## Relevant files

| Path | Why |
|---|---|
| `skillPlayability.ts` ~19, ~89 | context + CD gate |
| `TurnClockSystem.ts` ~44, ~82 | `isSkillReadyOnTurn` / reset helper |
| `EquipmentPassiveSystem.ts` ~425 | kill reset |
| `useCombat.ts` ~146 | live playability context |
| `Combat.tsx` ~352 / `App.tsx` ~1990 | hand greying context |
| `ResolveSkillSystem.ts` ~812 / ~841 | playability then `not-ready` |

## Fallback pick

When `turnIndex` omitted: keep `currentCooldown > 0` (legacy tests / pre-deck). When provided: `!isSkillReadyOnTurn` is SoT (even if `currentCooldown === 0`).
