# T-038 · verify

| Command | Result |
|---|---|
| RING-GUARD | PASS (R0 types + SupportWeight + Deck + skills + MarkSystem) |
| typecheck | PASS |
| lint | PASS |
| test | PASS 625/625 (t038 3/3; t016 5/5) |
| build | PASS |
| budget:dist | PASS |
| `npm run verify` | PASS |
| `npm run simulate:quick` | PASS |

**Smoke Bomb probe:** authoring, mark + SIDE +1, ATTACK isolated — all true. T-016 probe still true.
**Balance vs legacy SPEED +35% / ACC −20%:** AP 1 / CP 0 unchanged; smoke 25 replaces % buffs; SIDE Δ +1; first offensive 40 → 15 (helper). Live EnemyTurn not wired.
**Live WR:** presets still 100% except Hyuga leftover from T-035. Smoke not live-wired on enemy damage.
