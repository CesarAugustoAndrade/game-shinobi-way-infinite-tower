# T-028 · exploration

**Ring:** R0 Rotation (kaiten): require Byakugan + 1 charge → self shield + reflect. Reuse T-005 spend + T-007 SUPPORT. No new port.

## Relevant files

- `skills.ts` — `ROTATION` / `kaiten` is ACTIVE, no `cardRole`, mute `effects[]` SHIELD 50 + REFLECTION 0.6. Incomplete authoring.
- `ResolveSkillSystem.ts` — `requireOn` already rejects OFF/0 charges. Auto-spend is ATTACK/SIDE only. `applySkillMarkEffects` always targets ENEMY.
- `types.ts` — `MarkSpec` has family/perHit; no self target. `MarkFamily.SHIELD` exists.
- T-021 Peacock — `requireOn` pattern. T-019 Sealing — SUPPORT without player Mode spend (`consumeCharges` + no `modeId`).

## Premises

- Hard reject if Byakugan OFF (Peacock-style). 1 charge only.
- Self marks: owner/target PLAYER. Default MarkSpec target stays enemy.
- Keep magnitudes 50 / 0.6 (stacks 50 and 60). Do not wire live incoming reflect.
- Air Palm / Twin Lion stay no-spend.

## Surprises

- SUPPORT never spends Mode charges today.
- `effects[]` are mute on the pure SUPPORT path (no double-apply if we also plant marks).
- Live `useSkill` / incoming-damage SHIELD consume is out of scope.

## Port / ring

Optional `MarkSpec.targetActor` is domain authoring, not a port. Stays R0.
