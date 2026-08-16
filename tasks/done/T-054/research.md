# T-054 research

Internal pattern reuse only (no library). Three pen-payoff options:

1. **Fold into existing Studied/def block (recommended).** Spent `guard_break` on ATTACK hit: `pen = Math.max(studied?0.2:0, spentGuard?0.15:0, skill.penetration??0)` then `applySkillPenetration`. Same helper; Studied numbers unchanged; composes by max (0.20 beats 0.15).

2. **Separate second `applySkillPenetration` call after Studied.** Risk of double-applying defense (`(1-def*(1-p1))*(1-def*(1-p2))` ≠ `1-def*(1-max)`). Spec forbids a new formula island.

3. **Skill-native `penetration: 0.15` on Elbow itself.** Catalog payoff is **next ATTACK**, not the SIDE chip. Contradicts “do not rely on SIDE PIERCING/pen as identity.”

**Recommendation:** option 1. Lock AC3: ATTACK base 20, `enemyDefensePercent: 0.4` → without 12, with Guard Break 13; mark consumed. Constant `GUARD_BREAK_PEN = 0.15` (no MarkSpec metadata field).
