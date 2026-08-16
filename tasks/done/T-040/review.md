# T-040 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- **AC1 authoring:** PASS — SUPPORT AP1 / HP15 / CP0 / CD5 / base 0. No WIL +50% identity.
- **AC2 arm:** PASS — HP 40→25, bag +3 Life/Limit, `pendingGateHpDiscount: true`, 0 dmg.
- **AC3 reject:** PASS — HP 10 → `hp`, bag empty, discount not armed. Not `incomplete-authoring`.
- **T-016 / T-017:** PASS — motors unchanged.

## Architecture

- RING-GUARD PASS: R0 skills + ResolveSkillState field + GATE_PREP_ID arm. Reuses T-016/T-017 APIs. No React.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: live `useSkill` still does not consume `pendingGateHpDiscount` (OOS).

## Out of scope

- Formula changes, Lotus, live UI.

## Verdict rationale

Authoring unlocks the two shipped motors without new math. APPROVE → verify.
