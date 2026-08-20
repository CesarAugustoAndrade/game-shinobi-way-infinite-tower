# T-145 · review

**Verdict:** APPROVE (auto-approved)

- Playability CD SoT is `readyOnTurn` vs `turnIndex` when provided; `currentCooldown` leftover fallback.
- Kill reset clears both fields. Live useCombat + Combat.tsx pass turnIndex.
- Resolve still uses `'not-ready'` (t123 intact). AC3: both reject.
- RING-GUARD: R0 files have no React/UI imports.
- AC tests PASS (3). Probe: T+1 cooldown / T+2 null; kill 0/0; resolve ok false.

OOS: deleting currentCooldown; Mode board kill reset; Discover picker.
