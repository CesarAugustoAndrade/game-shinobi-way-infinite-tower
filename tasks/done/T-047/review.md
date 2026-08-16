# T-047 · review

**Verdict:** APPROVE

## Spec conformance

- AC1: SUPPORT AP1/CD5/CP0, discover matchMainAttackTags, no STR +0.15×3.
- AC2: FIRE Main → only fire_atk / fire_atk_2; WATER ATTACK / SIDE / SUPPORT excluded.
- AC3: Studied 2 bound to fire_atk; 10 vs 50% def → 5 without / 6 with; water_atk stays 5; mark not consumed.

## Architecture

- Reused discoverThree + predicate. No filter widen when Main untagged. RING-GUARD clean.

## Quality

- BLOCK: none
- NIT: live Discover UI / defense wiring OOS.

Cycles: 1 (apply defense when fixture set so AC3 baseline is 5 not 10).
