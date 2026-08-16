# T-021 · exploration

**Ring:** R0 Peacock requireOn + per-charge scale + consume-all. Extends T-018 auto-spend. No new port.

## Relevant files

- `types.ts` — `ModeInteraction` has `requireOn`, `consumeCharges`, `damageMultBonus`, `bonusHits`. No per-charge mult / consume-all.
- `skillsCombatV1New.ts` — Peacock `hitCount: 6`, `requireOn: true`, `modeId: gate_of_limit`, `consumeCharges: 4`. Description already +15%/charge + close.
- `ResolveSkillSystem.ts` — `validateIntent` has no `requireOn`; T-018 auto-spend uses **fixed** `consumeCharges` (fails when C < 4). Damage floor is `Math.floor(total * (1 + modeDamageBonus))`.
- `CombatModeSystem.ts` — `trySpendCharges` → 0 charges = `COOLDOWN` (T-005). `n > charges` fails.
- `modes.ts` — `gate_of_limit` maxCharges 4, family GATES.

## Premises

- Snapshot C **before** spend; scale `1 + 0.15*C`; spend all C so Mode closes.
- `trySpendCharges(..., 4)` is wrong when C=3 — must spend remaining.
- Twin Lion also authors `requireOn: true` (T-022 will make that soft). Generic hard-gate will reject Lions without Byakugan until then.

## Surprises

- `consumeCharges: 4` + T-018 path cannot close a 3-charge Gate (insufficient-charges).
- Live `useSkill` still not on this path (out of scope).
