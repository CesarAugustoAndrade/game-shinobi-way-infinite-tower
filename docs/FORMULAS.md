# Combat & Stat Formulas

Reference for `src/game/systems/StatSystem.ts` and `src/game/systems/CombatCalculationSystem.ts`.
**Those files are the source of truth — update the code first, then mirror it here.**

## Primary Stats (9)
Willpower, Chakra, Strength, Spirit, Intelligence, Calmness, Speed, Accuracy, Dexterity.

## Primary → Derived
- **Max HP:** `Willpower × 10 + Strength × 2`
- **Max Chakra:** `Chakra × 8 + Spirit × 2`
- **Phys ATK:** `Strength × 2 + Dex × 0.5`
- **Elem ATK:** `Spirit × 2 + Intel × 0.5`
- **Flat Def:** `Willpower × 0.5 + Strength × 0.3` — soft-cap: `def × (100 / (100 + def))`
- **Percent Def:** `Calmness × 0.2 + Willpower × 0.1` (max 60%)

## Enemy Scaling
- `effectiveFloor = 10 + (dangerLevel × 2) + floor(baseDifficulty / 20)`
- Danger level range: 1-7.
