# T-053 research

Internal pattern reuse only (no library). Three ACC-payoff options:

1. **Mirror T-043 DEX rule (recommended).** Spent `aim` on ATTACK hit: if `scalingStat === ACCURACY` add `scalingPerPoint`, else +1 flat. Same integer-stat honesty; AC3 uses an ACC-scaling ATTACK so the delta is `scalingPerPoint`. Miss consumes, no bonus (`hitsLanded > 0` already gates add).

2. **Always +1 flat.** Simpler, ignores scalingStat. Spec allows it but is less honest when the ATTACK already scales on ACC (`+1` ≠ “+1 ACC”).

3. **ACC-only (0 if other stat).** Cleaner gate, but a STR ATTACK would spend Aim with no visible payoff — worse than the T-043 else-+1 fallback.

**Recommendation:** option 1. Lock in AC3: ACC ATTACK `baseDamage + scalingPerPoint` vs baseline `baseDamage`. Consume ATTACK-only (feint sibling). Plant `perHit: true` (launched sibling). Drop `critBonus`.
