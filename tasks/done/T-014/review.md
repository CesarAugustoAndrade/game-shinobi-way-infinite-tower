# T-014 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: Discover SUPPORT frees source from hand; `pendingDiscover` has 1–3 candidates excluding source and remaining hand ids.
- AC2: `commitDiscoverChoice` of a CD candidate inserts a disabled/cooldown snapshot; invalid id refuses with no extra insert.
- AC3: SUPPORT without `discover` applies marks and has no pending offer.
- Reuses T-003 `discoverThree` / `snapshotSkill`. Injected `rng`.

## Architecture

- RING-GUARD PASS: R0 `ResolveSkillSystem` + R3 probe. No React/UI.
- Hand/pool/pending are optional on state; T-007 fixtures still compile.

## Quality

- BLOCK: none.
- SHOULD: live `useSkill` still does not surface Discover (explicitly out of scope).
- NIT: `discoverThree` still caps at 3 regardless of `discover.count` (matches T-003; count is currently 3 everywhere).
