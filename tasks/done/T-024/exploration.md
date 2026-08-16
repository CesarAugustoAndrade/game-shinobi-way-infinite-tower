# T-024 · exploration

**Ring:** R0 Tripwire ON_MOVE fire. No new port. Marks stay source of truth.

## Relevant files

- `skillsCombatV1New.ts` — Tripwire SUPPORT plants `tripwire` duration 2, `NONE`, `ON_MOVE`.
- `MarkSystem.ts` — `addMark` / duration tick / `resolveHardControlSkips`. No ON_MOVE consumer.
- `RangeSystem.ts` — `collectRangeReactions` filters pre-built sources; `shiftRange` returns `moved`.
- `ResolveSkillSystem.ts` — SUPPORT plants markEffects; forced-move reactions are a list only (no chip/Stun).
- T-004 HARD_CONTROL marks → `resolveHardControlSkips` = 1 skip.

## Premises

- Fire helper reads marks directly (no parallel `reactionSources` registry).
- Enemy real band change only; player move / `moved: false` is a no-op.
- First tripwire instance only; consume after fire. Stun = HARD_CONTROL mark duration 1 when `rng() < 0.6`.

## Surprises

- Live EnemyTurn/PlayerTurn still void reaction results (out of scope).
- Tripwire consume is NONE — fire helper must remove the instance itself.
