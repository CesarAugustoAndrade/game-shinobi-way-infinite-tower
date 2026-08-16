# T-020 · exploration

**Ring:** R0 Barrage +2 hits. Extends T-018 auto-spend; no new port.

## Relevant files

- `types.ts` — `ModeInteraction` has `damageMultBonus` (T-018); no `bonusHits`.
- `skillsCombatV1New.ts` — Barrage `hitCount: 3`, `modeId: shadow_clone`, `consumeCharges: 1`; description already +2 hits.
- `ResolveSkillSystem.ts` — T-018 auto-spend for ATTACK/SIDE when Mode ON; `resolveMultiHit` uses `skill.hitCount` only.

## Premises

- Reuse T-018 spend (no double-spend). Bonus hits only if spend succeeds.
- `resolveMultiHit` rolls `hitCount` times — AC counts `rollHit` invocations.

## Surprises

- Barrage is SIDE_ATTACK so it already enters the T-018 auto-spend branch.
