# T-136 exploration

**Ring:** R2. Route: autonomous.

- `CombatModesPanel` shows `mode.id` raw; `upkeepLabel` exists but Combat.tsx does not pass it.
- Skill names: `SKILLS` id `sharingan_2` → `Sharingan (2-Tomoe)`.
- `MODE_DEFINITIONS.sharingan_2.upkeep = { chakra: 4 }`.
- T-010 asserts `byakugan` in HTML — keep `data-mode-id`.
- `combatSkillViewModel` is the existing pure UI helper (R0, no React).

**RE-CLASSIFY:** no (presentation only).
