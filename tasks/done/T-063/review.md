# T-063 review

**SPEC CONFORMANCE: 96/100.** ATTACK AP2/CP1/CD3 CLOSE 12. No critBonus 40. Baseline 12. Cloak hit 28 (crit 1.5 × Setup 1.5 +1 DEX), consume; miss consumes.

**ARCHITECTURE: PASS.** R0-only. Reuses T-062 consume/crit; Iaido-only Setup after crit, before DEX. Cloak SUPPORT / Sword Slash untouched.

**QUALITY:**
- SHOULD: none.
- NIT: Setup gated on `skill.id === 'iaido'` (catalog-specific; fine).

**VERDICT: APPROVE**
