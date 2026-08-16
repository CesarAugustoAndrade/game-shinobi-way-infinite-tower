# T-017 · verify

| Command | Result |
|---|---|
| RING-GUARD | PASS (R0 discount + activateMode opts; no React/UI) |
| typecheck | PASS |
| lint | PASS |
| test | PASS 557/557 (t017GatePrepDiscount 4/4) |
| build | PASS |
| budget:dist | PASS |
| `npm run verify` | PASS (worktree `.worktrees/T-017`) |
| `npm run simulate:quick` | PASS |

**Gate Prep HP probe:** half 15→7, fail preserves, non-Gate preserves, second pays full — all true.
