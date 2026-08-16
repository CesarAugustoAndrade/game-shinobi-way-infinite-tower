# T-035 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** PASS — `64_palms` ATTACK 8×3 AP4/CP7/CD5 CLOSE pen 0.3. `modeInteraction` byakugan + `minMarkStacks: 2` + `damagePerMarkStackBonus: 0.1` + cap 0.4 + consumeCharges 1. No flat 0.5. No requireOn. Legacy TRUE/drain/debuffs removed.
- **AC2 base / 1 CP:** PASS — empty board and Byakugan+1 CP both deal 24; charges unchanged at 4.
- **AC3 enhance:** PASS — S=3 → `floor(24*1.3)=31`, charges 3, CP gone (`consumeAllMatchingMarks`).
- **AC4 miss keep:** PASS — miss deals 0, CP remains, charge spent at attempt (3).
- **Twin Lion / Air Palm:** PASS — t022/t026 still green. No skill-id fork.

## Architecture

- RING-GUARD PASS: R0 `types.ts`, `ResolveSkillSystem.ts`, `skills.ts`. No React/UI.
- Data-driven ModeInteraction extensions. Spend gated on min stacks so S<2 does not tax Byakugan.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live `useSkill` still OOS. Cap 4+ stacks not separately tested (field + formula covered by S=3).

## Out of scope

- Twin Lion retune, Air Palm, Rotation, Yamanaka — not touched.

## Verdict rationale

Authoring, base, enhance+consume, and miss-keep match catalog via shared resolve. Twin Lion unchanged. APPROVE → verify.
