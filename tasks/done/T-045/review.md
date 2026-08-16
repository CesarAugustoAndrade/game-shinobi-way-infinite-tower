# T-045 · review

**Verdict:** APPROVE

## Spec conformance

- AC1: ATTACK AP2/CP4/CD2, 12, CLOSE, Byakugan 1 charge +0.4, `impactMarkConsume` ≤2 / +10% / drain 4. No CHAKRA_DRAIN 20.
- AC2: Byakugan 3→2 at attempt; `floor(12*1.4)=16`; base 12 without Mode; miss still spends charge.
- AC3: 3 CP Mode OFF → 1 remain, 14 dmg, chakra 20→12; miss keeps 3/20. Combo `floor(12*1.4*1.2)=20`.

## Architecture

- Reused Mode attempt-spend. New capped consume, not consume-all. RING-GUARD clean.

## Quality

- BLOCK: none
- NIT: live BattleSimulator still uses `effects` only (OOS).

Cycles: 1 rounding fix (single floor product vs sequential floors) before review.
