# T-018 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: `rasengan` is `cardRole: ATTACK` with `modeInteraction` `{ modeId: 'shadow_clone', consumeCharges: 1, damageMultBonus: 0.5 }`. Honest description.
- AC2: Clones ON charges 3 + deterministic hit → `floor(base * 1.5)`, charges 2. No `intent.enhanced`.
- AC3: Empty board → base damage, no crash.
- Auto spend at attempt when `intent.modeCharges` omitted; failed spend skips enhance. Explicit intent path not double-spent.

## Architecture

- RING-GUARD PASS: `ResolveSkillSystem` + `skills.ts` + `types.ts` stay R0. No React/UI.
- Reuses `trySpendCharges`. Mult applied once on total `damageDealt`. No Curse/Gate tables.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: insufficient-charge → base path is implemented but not AC-gated (spec allowed document-in-test).
