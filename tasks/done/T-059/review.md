# T-059 review

**SPEC CONFORMANCE: 96/100.** SWORD_SLASH is ATTACK AP2/CD1 CLOSE 10, WEAPON+PHYSICAL, `markEffects` bleed 4×2 DOT. BLEED 7@0.3 gone. Hit 10+bleed 4/2; miss 0/no plant. T-048 Kunai 3×2 unchanged.

**ARCHITECTURE: PASS.** R0 authoring only. Existing `applySkillMarkEffects`. No React/DOM/components/scenes/hooks/contexts. Tests `t059SwordSlash`.

**QUALITY:**
- NIT: probe authoring skips CLOSE/`PHYSICAL` (AC1 covers).

**VERDICT: APPROVE**
