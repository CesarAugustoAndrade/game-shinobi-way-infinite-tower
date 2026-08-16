# T-028 · plan

**Ring:** R0 · **auto-approved**

Author `kaiten` SUPPORT + `modeInteraction` Byakugan `requireOn` + `consumeCharges: 1`. `markEffects` plant `rotation_shield` (SHIELD, stacks 50) and `rotation_reflect` (stacks 60) with `targetActor: 'self'`. Extend `applySkillMarkEffects` target default enemy. Auto-spend includes SUPPORT when `modeId` + `consumeCharges`. Tests `t028RotationKaiten` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 require On | existing `requireOn` + authoring |
| AC2 spend + self marks | SUPPORT auto-spend + self target |
| AC3 authoring | skills.ts ROTATION |

## Steps (single implementer)

1. `MarkSpec.targetActor`; reauthor kaiten; SUPPORT spend; self plant.
2. Tests + `RotationKaitenBalance` probe.

## Risks

- Do not spend on Sealing Tag (no `modeId`).
- Do not plant Rotation marks on ENEMY.
- Do not invent live reflect math.

## Research

Skipped — local expand, T-021/T-007 patterns in-tree.
