# T-055 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. Adding optional `Skill.impactStun` is an R0 field, not a port.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `SWEEPING_KICK` is AP2 unmarked ACTIVE, base 7, MELEE, `effects` STUN 0.4×1 | **true** | `skills.ts` 432–451: no `cardRole`, no `allowedRanges` |
| `resolveSkill` does not apply generic `effects[]` STUN | **true** | grep `skill.effects` in `ResolveSkillSystem.ts`: **zero** matches |
| `stunControlBuff` + `controlStun` exist | **true** | resolve 415–423, 493–510: SUPPORT roll; **fail → self stun** (Mind Transfer) |
| `controlConfusion` already applies on SIDE/ATTACK ≥1 hit | **true** | resolve 975–981 |
| Tripwire stun is ON_MOVE, not impact | **true** | T-024 path, not `effects[]` |
| `SkillTag.CONTROL` exists | **false** | `types.ts` SkillTag has TAIJUTSU/PHYSICAL; no CONTROL (same as missing SETUP) |
| No test locks Sweeping Kick authoring | **true** | no `SWEEPING_KICK` / `sweeping_kick` in `__tests__` |

## Ports / reuse

- Damage: existing SIDE resolve + `rollHit` (T-050/T-054).
- Stun buff shape: `stunControlBuff(skill.id, duration, 'enemy')` → `enemyBuffs`.
- Roll: injectible `ports.rng` (`rng() < chance`). Threshold same as T-036 (`0` succeeds, `0.4` fails if chance is 0.4).
- Do **not** call `resolveControlSupport` (self-stun on fail).
- Plant after hits, sibling of `controlConfusion` block (975).

## Complexity premise

Spec said “reuse `stunControlBuff` shape; lock `effects[]` **or** explicit field.” Confirmed: `effects[]` is dead packaging. New `impactStun` field + one ≥1-hit helper is smaller than teaching `effects[]` globally (would fire Chidori Stream / other ATTACK STUN packages — out of scope).

## Layers

R0: `types.ts` optional `impactStun`; `skills.ts` `SWEEPING_KICK`; `ResolveSkillSystem.ts` impact stun. Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `SWEEPING_KICK` (legacy AP2 + unused effects).
- `src/game/types.ts` — `ControlStunSpec` / `controlConfusion`; add `impactStun`.
- `src/game/systems/ResolveSkillSystem.ts` — `stunControlBuff`; SIDE/ATTACK post-hit block.
- `src/game/systems/__tests__/t036MindTransfer.test.ts` — rng + `hasStun` template.
- `src/game/systems/__tests__/t054ElbowStrike.test.ts` — latest SIDE chip template.

## Surprises / debt

- Honoring all `effects[]` STUN on hit would retune T-034 and others — forbidden.
- `controlStun.failSelfDuration` is the wrong contract for a SIDE chip.
- `SkillTag.CONTROL` does not exist; use TAIJUTSU + PHYSICAL.
