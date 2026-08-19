# T-128 research

## Options

1. **`controlBound` sibling + Bound board convention (wire_trap-style)**
   - Plant: `rng() < chance` → enemy `bound` HARD_CONTROL duration 1 IMPACT. Fail: nothing (no self-stun).
   - Payoff: any ATTACK vs Bound ×1.2 Setup; consume on ≥1 hit; keep on miss; SIDE ignores.
   - Identity stays Bound, not Stun. Matches spec “sibling to controlStun”.

2. **`MarkSpec.chance` on `markEffects`**
   - Data-driven, reusable. Broader than this task; would change every plant loop. Over-scope.

3. **`setupRead` on every ATTACK**
   - Spec forbids. Setup must fire for *any* ATTACK vs Bound.

## Recommendation

Option 1. Reuse `resolveControlSupport` rng shape and `WIRE_TRAP` ATTACK mult/consume. Movement lock absent → document OOS.
