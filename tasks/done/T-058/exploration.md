# T-058 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. Optional `impactSilence` is an R0 field, not a port.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `SENBON` is unmarked ACTIVE AP2, base 7, SILENCE 0.5, no M/L | **true** | `skills.ts` 712–730: no `cardRole`, no `allowedRanges`, `effects` SILENCE 0.5 |
| `resolveSkill` does not roll SIDE Silence from `effects[]` | **true** | Silence apply is Sealing Tag xor only (`sealingSilenceBuff` 530–538) |
| T-055 already has impact control-roll | **true** | `impactStun` + `resolveImpactStun` after `hitsLanded ≥ 1` (1000–1006) |
| Sealing Tag silence buff shape exists | **true** | `{ id: silence-${sourceId}, name: Silence, duration: 1, effect: SILENCE }` |
| `SkillTag.CONTROL` exists | **false** | Tags have TOOL/WEAPON/PHYSICAL; `HARD_CONTROL` is a MarkFamily |
| No test locks Senbon 50% / AP2 | **true** | `__tests__` only mention `SENBON_RAIN` |
| Silence does not end Modes | **true** | Sealing Tag silence path leaves Mode board untouched; drain is a different branch |
| ASSASSIN kit includes SENBON | **true** | `EnemySystem.ts` kit; `baseDamage` 7 stays > 0 |

## Ports / reuse

- Damage: existing SIDE `rollHit` (T-049/T-055).
- Control roll: clone T-055 `impactStun` → `impactSilence` + `resolveImpactSilence`.
- Buff: same shape as `sealingSilenceBuff`; new helper with duration (do not retune T-019).
- Range: `allowedRanges: [MEDIUM, LONG]` (CLOSE reject).
- Tags: TOOL + WEAPON + PHYSICAL (no CONTROL tag).

## Complexity premise

Spec said “mirror T-055 impact control roll + T-019 silence buff.” Confirmed both exist. Do **not** honor generic `effects[]` SILENCE (would be a new engine and could wake leftover packages). Lock `impactSilence`. Keep `effects` 0.35×1 as display honesty only.

## Layers

R0: `types.ts` `ImpactSilenceSpec` + `Skill.impactSilence`; `skills.ts` `SENBON`; `ResolveSkillSystem.ts` impact-silence sibling. Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `SENBON` (legacy AP2 / 50% Silence).
- `src/game/types.ts` — `ImpactStunSpec` sibling.
- `src/game/systems/ResolveSkillSystem.ts` — `resolveImpactStun` / `sealingSilenceBuff`.
- `src/game/systems/__tests__/t055SweepingKick.test.ts` — impact-roll template.
- `src/game/systems/__tests__/t019SealingTagDrain.test.ts` — Silence buff + no Mode off.

## Surprises / debt

- Generic `effects[]` SILENCE is dead on SIDE (same as pre-T-055 STUN).
- ASSASSIN kit uses `SENBON`; authoring keeps base 7 so kit-pick tests stay green.
