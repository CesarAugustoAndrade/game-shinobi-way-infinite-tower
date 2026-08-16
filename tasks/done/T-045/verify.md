# T-045 · verify

| Command | Result |
|---|---|
| RING-GUARD | PASS (R0 types + Resolve + skills; no React) |
| typecheck | PASS |
| lint | PASS |
| test | PASS 646/646 (t045 3/3; t022/t035/t026 still green) |
| build | PASS |
| budget:dist | PASS |
| `npm run simulate:quick` | PASS (combo probe re-run true after rounding lock) |

**Gentle Fist probe:** authoring, Byakugan +40%/1, ≤2 CP + drain — all true.

**Balance vs legacy 12 TRUE + CHAKRA_DRAIN 20%:** AP/CP 2/4 unchanged; base 12; Byakugan 16; 2 CP 14; combo 20; charges 3→2; CP 3→1; enemy chakra 20→12. Live WR still 100% ceiling. Live sim does not apply `impactMarkConsume` (OOS).
