# T-008 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- Exactly 12 new ids; SOUL names present; catalog 116→128.
- Roles/costs match §12 table (MODE = TOGGLE + `sharingan_3`).
- None in `getClanStartingSkills`. 5 `requirements.clan`, 7 vendor-eligible (no clan, BASIC/ADVANCED).
- Contracts in `discover` / `markEffects` / `modeInteraction` + honest descriptions. No invented techniques.

## Architecture

- RING-GUARD PASS: `skillsCombatV1New.ts` imports types + `CardContractSystem` (R0). No React/UI.
- Merge via `SKILLS_CLASSIC` + spread — 116 untouched.

## Quality

- BLOCK: none.
- SHOULD (out of scope): PULL/PUSH/backstep have no Skill.movement field (none exists); Main +2 weight is description-only.
- NIT: constants → `defaultBaseWeight()` vs literal `2` (same value).

## Out of scope respected

No 116 reauthor, no art, no SOUL edit, no full resolve wiring of every contract.
