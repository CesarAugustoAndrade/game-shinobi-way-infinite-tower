# T-022 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: Byakugan ON + enemy `chakra_point` → `floor(18 * 1.5) = 27`; CP consumed; Byakugan charges stay 3.
- AC2: Full miss → damage 0; CP remains.
- AC3: No Byakugan or no CP → `ok` at base 18. `requireOn` inverted (soft base).
- Authoring: `requireMarkId: 'chakra_point'`, `damageMultBonus: 0.5`, `penetration: 0.3`, no self-`markEffects`.
- T-021 Peacock `requireOn` gate untouched.

## Architecture

- RING-GUARD PASS: `types.ts` + `ResolveSkillSystem` + Twin Lion authoring stay R0. No React/UI.
- Reuses `consumeOnImpact` and T-018 `damageMultBonus` (gated by `requireMarkId`). No new port.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: 30% pen is wired vs 0% def (identity) so AC1 stays 1.5×. Live `useSkill` still out of scope.
