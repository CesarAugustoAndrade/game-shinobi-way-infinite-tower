# T-140 · review

**Verdict:** APPROVE

- Allowlist only; aim/decoy cannot become primaries.
- Integer deltas, floor 1, after buffs. No % conversion. No skill reauthor.
- Getters optional `marks` keep existing callers valid.
- RING-GUARD: StatSystem/MarkSystem have no React/UI imports. useCombat is R1 overlay with marks already in hand.
- AC tests PASS. Probe: speed 3→2, ACC −2, aim Δ 0.

OOS noted: GameContext playerStats / BattleSimulator still no marks arg.
