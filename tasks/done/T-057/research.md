# T-057 research

Internal pattern reuse only. Three 2-hit options:

1. **`hitCount: 2` + `baseDamage: 5` (recommended).** Mirror Phoenix Flower. `resolveMultiHit` already does N independent rolls and sums landed `damage`. Full connect 10; miss 0; optional sequence mock for 1/2 = 5. Zero resolve edits.

2. **Keep `baseDamage: 10` and apply 75% per swing in resolve.** Reinvents the discarded flavor math. Breaks catalog 2×5 honesty. New engine. Out of scope.

3. **Wire `hitCount` into `SkillResolutionSystem` / BattleSimulator.** Would keep TANK-kit legacy damage at 10. Spec forbids a new multi-hit engine and live useSkill AC. Same latent gap Phoenix / Lotus already have.

**Recommendation:** option 1. AC2: two `rollHit` hits → `hitsLanded === 2`, `damageDealt === 10`. AC3: two misses → 0/0. Do not retune Phoenix / Barrage / Leaf Whirlwind.
