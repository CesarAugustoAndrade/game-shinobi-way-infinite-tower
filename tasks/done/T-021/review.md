# T-021 · review

**Verdict:** APPROVE (auto-approved standing loop)

## Spec conformance

- AC1: Gate OFF/empty → `ok: false`, `reason: 'mode-required'`, state clone equal (consume nothing). Charges 0 treated as not ON.
- AC2: C=3 → 6 hits, `floor(24 * 1.45) = 34`, Gate `COOLDOWN` / charges 0.
- AC3: C=4 → `floor(24 * 1.60) = 38`, Gate closed. Authoring `hitCount: 6`, `damagePerChargeBonus: 0.15`, `consumeAllCharges: true`.
- Snapshot C before spend; spend remaining (not fixed 4). Reuses T-018 floor-on-total.

## Architecture

- RING-GUARD PASS: `types.ts` + `ResolveSkillSystem` + Peacock authoring stay R0. No React/UI.
- Reuses `trySpendCharges` / T-018 auto-spend. No new port. No double-spend.

## Quality

- BLOCK: none.
- SHOULD: none.
- NIT: generic `requireOn` hard-rejects Twin Lion without Byakugan until T-022 (explicit plan risk; T-022 inverts to SOUL soft-base). Live `useSkill` still out of scope.
