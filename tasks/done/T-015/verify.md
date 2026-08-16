# T-015 · verify

| Command | Result |
|---|---|
| RING-GUARD | PASS (R0 aggregator + modes data; no React/UI) |
| typecheck | PASS |
| lint | PASS |
| test | PASS 548/548 (t015ModeWeightBonuses 3/3) |
| build | PASS |
| budget:dist | PASS |
| `npm run verify` | PASS (worktree `.worktrees/T-015`) |
| `npm run simulate:quick` | PASS |

**Mode weight probe:** shadow_clone +4 data, ON bonuses, OFF empty, effectiveWeight +4 — all true.
