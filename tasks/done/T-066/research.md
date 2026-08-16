# T-066 research

Internal pattern reuse only. Three options:

1. **Author-only enemy markEffects (recommended).** `blinded` duration 1 stacks 2 STAT enemy. Remove ACC −40%@50%. Tags TOOL+MARK. No resolve edit. No telegraph interrupt (no intent on `ResolveSkillState`).

2. **Add `intendedSkillId` to resolve state and clear it.** Spec says best-effort / not blocking. Would widen R0 surface without AC. Skip.

3. **Honor `effects[]` DEBUFF on SUPPORT.** Immediate 50% ACC % — discarded identity.

**Recommendation:** option 1. AC2: enemy blinded 1 stacks 2, dmg 0. AC3: AP 6→5, CP unchanged, `readyOnTurn === 7` at turn 2 / CD 4.
