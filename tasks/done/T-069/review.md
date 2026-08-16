# T-069 review

**SPEC CONFORMANCE: 97/100.** SIDE 3×3 M/L, on-hit `barrage_setup` 2 ATTEMPT, next ATTACK ×1.1 consume. Miss plants nothing. SIDE does not consume.

**ARCHITECTURE: PASS.** R0-only. Additive `MarkSpec.requireHit`. RING-GUARD clean.

**QUALITY:**
- SHOULD: none.
- NIT: leftoverSingle6 probe field is now a constant false after the typecheck fix.

**VERDICT: APPROVE**
