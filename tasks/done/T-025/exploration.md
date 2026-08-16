# T-025 · exploration

**Ring:** R0 Chidori + Sharingan 3: 2 charges + MEDIUM grant. Reuse T-018 auto-spend. No new port.

## Relevant files

- `skills.ts` — Chidori is MELEE ACTIVE, no `cardRole`, no `modeInteraction`. CLOSE-only via method default.
- `modes.ts` — `sharingan_3` maxCharges 3; enhancement note only.
- `ResolveSkillSystem.ts` — T-018 auto-spend `consumeCharges` on ATTACK when Mode ON. Range via `getSkillBlockReason` / static `skillAllowedAt`.
- `skillPlayability.ts` — range check has no Mode board / granted bands.
- `RangeSystem.ts` — `skillAllowedRanges` is static.

## Premises

- Do not permanently author MEDIUM on the row. Grant MEDIUM only when Mode ON and charges ≥ 2.
- CLOSE + Mode OFF (or charges 1) stays legal without spend.
- MEDIUM + Mode OFF or charges 1 → range reject, consume nothing.
- No invented damage %.

## Surprises

- Catalog Chidori is incomplete authoring today (`resolveSkill` would reject without `cardRole`).
- Live `useSkill` still not on this path (out of scope).
