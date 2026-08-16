# T-056 pipeline status

- SETUP: moved `tasks/backlog/T-056.md` → `tasks/active/T-056/`; worktree `.worktrees/T-056` branch `task/T-056`
- Ring: R0 · Route: autonomous · Type: expand S
- Skills: jutsu-creator / combat-system-creator / exploration-creator (band only)
- EXPLORE: done (`exploration.md`)
- RESEARCH: done (`research.md`) — `requireHit` on `bandMove` (Air Palm miss-PUSH stays)
- PLAN: written + **auto-approved** (standing automatic loop)
- IMPLEMENT: done this fire
  - `BandMoveSpec.requireHit?`; `EXPLOSIVE_TAG` SIDE AP1/CD2 C/M 11 FIRE + PUSH requireHit
  - resolve skips authored move when `requireHit && hitsLanded < 1`
  - tests `t056ExplosiveTag` 3/3 + T-026/T-023 6/6
  - probe `ExplosiveTagBalance` hooked in `simulate:quick`
  - typecheck PASS (worktree)
- REVIEW: APPROVE (96 / RING-GUARD PASS / NITs only)
- VERIFY: PASS (typecheck, t056 3/3, T-026/T-023 regressions, RING-GUARD)
- MERGE: this fire (standing auto-approve)
