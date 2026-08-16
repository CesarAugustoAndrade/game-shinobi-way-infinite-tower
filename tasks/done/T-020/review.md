# T-020 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: Clones ON charges 3 → 5 `rollHit` invocations; charges 3→2 via T-018 auto-spend.
- AC2: Empty/OFF Mode board → 3 rolls; `modes.instances` stays empty.
- AC3: Barrage `hitCount === 3`, `modeInteraction.bonusHits === 2`, `modeId: shadow_clone`, `consumeCharges: 1`.
- Spend-fail leaves `spentOk` false so `modeBonusHits` stays 0 (no free +2).
- No Rasengan-style `damageMultBonus` on Barrage.

## Architecture

- RING-GUARD PASS: `types.ts` + `ResolveSkillSystem` + Barrage authoring stay R0. No React/UI imports.
- Reuses T-018 auto-spend (`trySpendCharges`) and `resolveMultiHit`. No new port. No double-spend.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: explicit `intent.modeCharges` path spends without applying `bonusHits` (same shape as T-018 `damageMultBonus`). Live `useSkill` cutover is out of scope.
