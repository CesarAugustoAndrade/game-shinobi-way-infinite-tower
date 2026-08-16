# T-062 review

**SPEC CONFORMANCE: 96/100.** SUPPORT AP1/CP3/CD4, dmg 0, self `cloaked` 2 ATTEMPT. Plant coat-only. ATTACK hit → ×1.5 + DEX, consume; miss consumes; SIDE leaves cloak. SPEED/DEX % gone.

**ARCHITECTURE: PASS.** R0-only. No `rollHit` port change. No StatSystem/`game/config` import (local 1.5). ATTACK-only consume sits with `feint` so SIDE cannot eat the mark.

**QUALITY:**
- SHOULD: none.
- NIT: `CLOAKED_CRIT_MULT` is a resolve constant, not `BALANCE.CRIT_DAMAGE_MULT` (importing `game/config` would pull R3 featureFlags).

**VERDICT: APPROVE**
