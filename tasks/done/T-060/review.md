# T-060 review

**SPEC CONFORMANCE: 94/100.** SUPPORT AP1/CP1/CD4, dmg 0, enemy `wire_trap` 2 IMPACT. Plant trap-only. ATTACK 10→12 + Bleed 5×2 consume; miss keeps trap; SIDE leaves trap.

**ARCHITECTURE: PASS.** R0-only. Generic IMPACT skip keeps SIDE honest. ATTACK-only `floor(dmg * 1.2)` after `markMult`. Wire Reel / Tripwire / Kunai / Sword untouched.

**QUALITY:**
- SHOULD: no Off-Balance compose assertion (plan asked to lock floor order).
- NIT: +20%/Bleed 5×2 live as resolve constants.

**VERDICT: APPROVE**
