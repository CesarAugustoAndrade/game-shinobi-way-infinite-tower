# T-024 · plan

**Ring:** R0 · **auto-approved**

Add `fireTripwireOnEnemyMove` in `MarkSystem` (marks-as-source). 8 dmg + 60% HARD_CONTROL Stun 1 on first `tripwire` when `moved && mover==='enemy'`. Else identity. Thin `applyEnemyBandChange` composes `shiftRange` + fire for tests. Tests `t024TripwireReaction` + sim probe.

## AC map

| AC | Where |
|---|---|
| AC1 fire + consume | fireTripwireOnEnemyMove |
| AC2 no-move no fire | same |
| AC3 stun 60% + player ignore | rng + mover |

## Steps (single implementer)

1. Helper + constants (`MarkSystem.ts`).
2. Tests + `TripwireReactionBalance` probe.

## Risks

- Do not wire live EnemyTurn (out of scope).
- Stun is a HARD_CONTROL mark, not a React buff.
