# T-063 research

Internal pattern reuse only. Three Setup options:

1. **Dedicated Iaido spent-`cloaked` Setup ×1.5 (recommended).** After T-062 crit (`floor(dmg * 1.5)`), if `skill.id === 'iaido'`: `floor(dmg * 1.5)` again, then T-062 +DEX. Consume stays the T-062 ATTACK filter (no double-remove). Baseline Iaido without cloak is unchanged 12.

2. **`setupRead` on `cloaked`.** `setupRead` only reads **enemy** marks. Would need a self-target extension — out of scope / sibling-path reuse mismatch.

3. **Re-implement forceCrit on Iaido.** T-062 already force-crits every ATTACK. Duplicating would stack two crits or fight the shared package.

**Recommendation:** option 1. AC2: no cloak → 12. AC3: cloak hit → ≥18, mark gone; miss still consumes. Probe reports 12 vs 28 (crit 1.5 × Setup 1.5 +1 DEX).
