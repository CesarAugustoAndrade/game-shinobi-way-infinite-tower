# T-035 · exploration

**Ring:** R0 64 Palms: Byakugan + ≥2 CP → +10%/stack cap 40%, 1 charge, impact consume. Extend `ModeInteraction`; no skill-id fork.

## Relevant files

- `skills.ts` — `SIXTY_FOUR_PALMS` (`64_palms`) HIDDEN, no `cardRole`/`hitCount`. AP 2 / TRUE 25 / drain+debuffs.
- `types.ts` `ModeInteraction` — has `requireMarkId`, `damageMultBonus`, `consumeCharges`. **No** min-stack or per-stack bonus yet.
- `ResolveSkillSystem.ts` — spends charges then checks `hasEnemyMark` (boolean). Twin Lion: no consumeCharges. Fireball: consume without mark gate.
- `t022TwinLionFists` — Byakugan+CP +50%, miss keeps IMPACT CP, impact decrements 1 stack.
- `MarkSystem.consumeOnImpact` — decrements **1** stack. AC3 (S=3, marks gone) needs an all-stacks consume when enhance paid.

## Premises

- Complexity: new fields required; existing `damageMultBonus` cannot express +10%/stack cap 40% or ≥2 gate. Confirmed `ResolveSkillSystem.ts` 558–576.
- Data: CP is STAT merge (`t026`); count `stacks` on enemy `chakra_point`, not instance count.
- Spend must **not** fire when S<2 (unlike current spend-before-mark). Twin Lion spendN=0 stays unchanged.
- IMPACT consume-one-stack is insufficient for AC3 S=3 “CP gone” → `consumeAllMatchingMarks`.

## Surprises

- Incomplete authoring (`resolveSkill` rejects without `cardRole`).
- Twin Lion unchanged (flat 0.5, no charge, 1-stack consume).

## Port / ring

R0: `types.ts` + `ResolveSkillSystem.ts` + `skills.ts`. No React.
