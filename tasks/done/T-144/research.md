# T-144 · research

SOUL §9: first lethal under Reanimation is a **guaranteed** save (HP 1 + Shield 40 + consume), not guts chance. §6: ATTACK +1 while armed.

**Options**

1. **Call helper after shield, skip guts if consumed** (recommended). Merge `reanimationRoleBonuses(combatState.marks)` additively into `supportRoleBonuses` in `buildUpkeepWeightContext`.
2. Let guts run then overlay Reanimation — guts could also fire and consume guts-for-turn; catalog is not guts.
3. New draw algorithm — spec forbids; thread marks into existing builder only.

**Recommendation:** option 1. Reuse T-130 helpers. No skill reauthor.

OOS: DoT/hazard lethal adapt; CombatSimulationService parity; Substitution/C4.
