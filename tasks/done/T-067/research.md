# T-067 research

Internal pattern reuse only. Three options:

1. **T-017 sibling (recommended).** New `FocusedBreathingDiscountSystem`: grant +8, arm pending 2, `applyCpUpkeepDiscount(cost, pending)` → `chakra: max(0, N-2)`, consume only when a CP cost is reduced. Resolve arms `pendingCpUpkeepDiscount`. `applyModeUpkeep` optional `cpUpkeepDiscount` echoes remaining. No PlayerTurnSystem.

2. **Self mark `breathing_discount` stacks 2.** Observable but contradicts spec preference for explicit pending field like Gate Prep.

3. **Keep CHAKRA_REGEN 10 and add a tick hook.** Discarded identity; would finance later turns as regen, not instant +8 / next upkeep −2.

**Recommendation:** option 1. AC2: chakra 5→13, pending 2, dmg 0. AC3: Byakugan upkeep 4 with pending 2 pays 2; second pay without re-arm is 4.
