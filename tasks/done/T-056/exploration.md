# T-056 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. Optional `BandMoveSpec.requireHit` is an R0 field, not a port.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `EXPLOSIVE_TAG` is AP2 unmarked ACTIVE, base 11, FIRE RANGED, no PUSH | **true** | `skills.ts` 751–769: no `cardRole`, no `allowedRanges`, no `bandMove` |
| Air Palm / Blastback already use `bandMove: { kind: 'PUSH', steps: 1 }` | **true** | Air Palm `skills.ts` 1363; Blastback `skillsCombatV1New.ts` 175 |
| `skillForcedMove` + post-resolve loop applies PUSH | **true** | `ResolveSkillSystem.ts` 395–400, 1030–1050 |
| Existing PUSH is gated on hit | **false** | Movement runs after resolve with **no** `hitsLanded` check. T-026 miss: MEDIUM → LONG still |
| `playerMoveUsedThisTurn` stays false on forced PUSH | **true** | T-026 hit: `playerMoveUsedThisTurn` false |
| `SkillTag.MOVEMENT` exists | **false** | SkillTag has TOOL / FIRE; no MOVEMENT |
| No test locks Explosive Tag authoring | **true** | no `explosive_tag` in `__tests__` |

## Ports / reuse

- Damage: existing SIDE `rollHit` (T-049/T-055).
- PUSH: existing `bandMove` + `skillForcedMove` + `resolveForcedMove`.
- Miss-no-push: **new** opt-in `requireHit` on `BandMoveSpec`. Default unset → Air Palm / Blastback unchanged.
- Range: `allowedRanges: [CLOSE, MEDIUM]` (LONG reject). LONG edge PUSH is N/A (illegal play).

## Complexity premise

Spec said “mirror Air Palm `bandMove` PUSH.” Confirmed the path exists, but Air Palm PUSHes **on miss**. Explosive Tag catalog/spec requires **no band change on miss**. Do not retune Air Palm. Add `requireHit: true` only on Explosive Tag.

## Layers

R0: `types.ts` `BandMoveSpec.requireHit?`; `skills.ts` `EXPLOSIVE_TAG`; `ResolveSkillSystem.ts` skip move when `requireHit && hitsLanded < 1`. Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `EXPLOSIVE_TAG` (legacy AP2 fire).
- `src/game/types.ts` — `BandMoveSpec`.
- `src/game/systems/ResolveSkillSystem.ts` — movement block ~1030.
- `src/game/systems/__tests__/t026AirPalm.test.ts` — PUSH + miss still moves (must stay).
- `src/game/systems/__tests__/t023SideToolMarksMove.test.ts` — Blastback PUSH sibling.

## Surprises / debt

- Blind reuse of `bandMove` would fail AC3 (miss would PUSH like Air Palm).
- `SkillTag.MOVEMENT` missing; use TOOL + FIRE.
- Blastback is a different skill id (`explosive_kunai_blastback`); do not retune.
