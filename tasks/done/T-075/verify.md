# T-075 verify

**Verdict:** PASS

| Gate | Result |
|---|---|
| RING-GUARD | PASS |
| `npm run typecheck` | PASS |
| `npm test -- t075Henge` | PASS 3/3 |
| T-023 / T-072 / T-074 regression | PASS |
| AC1 authoring | PASS SUPPORT AP1/CP1/CD4 + SIDE +2 + misdirect |
| AC2 weight | PASS SIDE +2 once; ATTACK isolated |
| AC3 exposed | PASS hit plants exposed_10; 10→11; miss consumes no plant |
| Henge probe | PASS authoring/weight/exposed true |
