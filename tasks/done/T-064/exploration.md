# T-064 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. Existing SUPPORT `applySkillMarkEffects` plants self SHIELD; **no new resolve path**.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `MUD_WALL` unmarked ACTIVE AP1/CP4/CD4, SHIELD 40×3, `stanceShift: DEFENSIVE` | **true** | `skills.ts` 109–136: no `cardRole`, no `markEffects` |
| SUPPORT plants `markEffects` | **true** | `applySkillMarkEffects` on SUPPORT |
| T-028 self SHIELD plant exists | **true** | `rotation_shield` stacks 50, `targetActor: 'self'`, family SHIELD |
| `MarkFamily.SHIELD` exists | **true** | `types.ts` 380 |
| `SkillTag.DEFENSE` exists | **false** | SkillTag has NINJUTSU / EARTH |
| Pure resolve applies `stanceShift` | **false** | `stanceShiftFromSkill` is PlayerTurn / PostureSystem; resolve does not mutate posture |
| No test locks SHIELD 40×3 | **true** | no `mud_wall` authoring in `__tests__` |
| SUPPORT `effects[]` SHIELD does not plant marks | **true** | T-028 comment + T-007 SUPPORT skips `effects[]` |

## Ports / reuse

- Plant: existing `applySkillMarkEffects` + `targetActor: 'self'` + `family: SHIELD` (T-028 sibling, no Mode).
- Costs: existing T-007 commit AP/CP + `markSkillUsedOnTurn` (`readyOnTurn = T + CD + 1`).
- Do not wire live absorb or `playerBuffs` (AC plant-only).
- Do not add resolve `stanceShift` (not in AC).

## Complexity premise

Spec listed `ResolveSkillSystem.ts` as a touch. Verified: SUPPORT already plants `markEffects`. **Do not add a dedicated Mud Wall resolve block.** Authoring is the change.

## Layers

R0: `skills.ts` `MUD_WALL`. Tests + R3 probe. Resolve unchanged.

## Relevant files

- `src/game/constants/skills.ts` — `MUD_WALL`.
- `src/game/systems/ResolveSkillSystem.ts` — SUPPORT plant (no edit).
- `src/game/systems/__tests__/t028RotationKaiten.test.ts` — self SHIELD template.
- `src/game/systems/TurnClockSystem.ts` — `computeReadyOnTurn`.

## Surprises / debt

- No `SkillTag.DEFENSE` — use NINJUTSU + EARTH.
- Duration “until absorbed”: use **99** (not 3). Tick still exists; 99 is absorb-first for a fight.
- `stanceBonus` DEFENSIVE AP discount leftover — leave (not in AC).
- Enemy kits reference `SKILLS.MUD_WALL` by id — keep id/costs.
