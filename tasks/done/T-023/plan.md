# T-023 · plan

**Ring:** R0 · **auto-approved**

Add `Skill.bandMove`. Author Wire PULL / Blastback PUSH / Backstep SELF_RETREAT. Rename `applySupportMarks` → `applySkillMarkEffects` and call it from SIDE/ATTACK (IMPACT only if hits). Capture attempt-spent ids → Off-Balance ×1.20, Exposed ×1.15 if RANGED. Floor on total. Skill `bandMove` drives `resolveForcedMove` when `intent.movement` omitted. Tests `t023SideToolMarksMove` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 Wire mark + PULL | apply marks + bandMove |
| AC2 Off-Balance +20% consume | spent-id mult |
| AC3 Exposed ranged / PUSH / backstep | mult + bandMove |

## Steps (single implementer)

1. Types + authoring (`types.ts`, three tool rows).
2. Resolve: plant + mult + move (`ResolveSkillSystem.ts`).
3. Tests + `SideToolMarksMoveBalance` probe.

## Risks

- Planting before consume would self-eat Off-Balance — plant after.
- Mode `damageMultBonus` stays separate from mark-id mults.
