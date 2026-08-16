# T-060 research

Internal pattern reuse only. Three trap-payoff options:

1. **Dedicated ATTACK impact package (recommended).** SUPPORT plants enemy `wire_trap` duration 2 via existing `markEffects`. On ATTACK `hitsLanded ≥ 1` + enemy has `wire_trap`: `Math.floor(dmg * 1.2)`, plant bleed 5×2, remove `wire_trap`. Exclude `wire_trap` from generic `consumeOnImpact`. Miss / SIDE: trap stays, no bleed, no mult. Off-Balance still ATTEMPT; if both present, floor `* 1.2 * 1.2` (attempt mult then trap).

2. **Reuse Off-Balance / `markDamageMultiplier` + IMPACT consume.** Wrong timing (ATTEMPT eats on miss) and SIDE would trigger. Breaks T-023 and spec.

3. **Per-skill `setupRead` / `impactMarkConsume` on every ATTACK.** Cannot author all ATTACKs. Heavier than a mark-id payoff.

**Recommendation:** option 1. AC2: plant only, dmg 0, no bleed. AC3: ATTACK 10 → 12, bleed 5×2, trap gone; miss keeps trap; SIDE hit leaves trap.
