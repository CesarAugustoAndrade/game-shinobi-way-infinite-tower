# T-136 review

**Verdict:** APPROVE

## Spec conformance

- AC1: visible “Sharingan (2-Tomoe)”; `data-mode-id="sharingan_2"`
- AC2: upkeep `4 CP`
- AC3: charges 2/3, pri 1, T-010 testids
- Combat.tsx maps live modes from SKILLS + MODE_DEFINITIONS. No R0 math.

## Architecture

- R2 panel + Combat adapter. Tiny pure helpers in combatSkillViewModel (no React). RING-GUARD PASS.

## Quality

- BLOCK: none
- NIT: `Object.values(SKILLS).find` each render — S-acceptable.
