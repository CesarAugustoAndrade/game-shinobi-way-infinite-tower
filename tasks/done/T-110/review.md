# T-110 review

**Verdict:** APPROVE

## Spec conformance

| AC | Result |
|---|---|
| AC1 authoring SUPPORT AP1/HP10/CD4 CURSE requireOn restoreCharges 2 + self vulnerable 10×2; no STR 0.3 | PASS |
| AC2 restore +2 cap-safe, Vulnerable 10×2, HP −10; curse_mark_2 family bind | PASS |
| AC3 no CURSE ON → mode-required, consume nothing (Sharingan does not satisfy) | PASS |

## Architecture

- R0 authoring only in `skills.ts`. No ResolveSkill fork. Reuses SUPPORT `restoreCharges` (T-039) and self `vulnerable` STAT mark (T-031).
- RING-GUARD: no React/components/scenes/hooks/contexts imports. No port signature change.

## Quality

- BLOCK: none
- SHOULD: none
- NIT: SkillTag.CURSE / RECHARGE / RISK absent; used NINJUTSU + MODE.

## Out of scope

Untouched: bone_drill, fang_over_fang, shadow_possession, temple_nirvana, c4_karura, CURSE Mode definitions, SOUL, live UI.
