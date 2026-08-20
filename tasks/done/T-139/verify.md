# T-139 · verify

**Gate:** PASS

- [x] RING-GUARD: MarkSystem.ts / EnemyTurnSystem.ts import neither React nor `components|scenes|hooks|contexts`.
- [x] `npm run typecheck` PASS
- [x] AC1 T-139 pure — two stun-1 → 1 skip; empty → 0
- [x] AC2 T-139 bound — Bound-only → 0
- [x] AC3 T-139 live — stun Mark, no buff → STUNNED / HP unchanged; bare attacks
- [x] `npm test -- src/game/systems/__tests__/t139HardControlSkipLive` PASS (3)
- [x] `npm test -- …t004MarksSetup t024TripwireReaction` PASS
- [x] `npm run simulate:quick` PASS; T-139 probe all true; WR 100%

**Cycles:** 0 fix. **Route:** autonomous.
