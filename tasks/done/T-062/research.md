# T-062 research

Internal pattern reuse only. Three force-crit options:

1. **Dedicated ATTACK attempt package (recommended).** SUPPORT plants self `cloaked` duration 2 ATTEMPT. `consumeOnAttempt` allow: `cloaked` only when `role === ATTACK` (feint sibling). If spent + `hitsLanded ≥ 1`: `floor(dmg * 1.5)` then +1 DEX (`shunshin_dex` formula). Miss still consumes. SIDE/SUPPORT/MODE leave the mark. Do not retune Shunshin / Poison Coat / Iaido.

2. **Call `StatSystem` with `forceCrit: true`.** Needs attacker derived stats that `ResolveSkillState` does not carry. Pulls the full hit/def pipeline into T-007 resolve. Over-engineering.

3. **Change `rollHit` to accept `forceCrit`.** Port signature change → RE-CLASSIFY R1. Spec forbids.

**Recommendation:** option 1. AC2: plant only, dmg 0. AC3: same deterministic `rollHit` → cloak ATTACK deals 1.5× + DEX vs uncloaked baseline; miss consumes; SIDE keeps cloak.
