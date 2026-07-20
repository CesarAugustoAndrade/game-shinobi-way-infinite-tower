# Battle Simulation System

Automated combat simulation system for balance testing and analysis.

## Quick Start

```bash
# Standard battle simulation (1000 battles per matchup)
npm run simulate

# Quick test (100 battles per matchup)
npm run simulate:quick

# Progression simulation (level 1 to 50 runs)
npm run simulate:progression

# Quick progression test (10 runs, 100 battles max)
npm run simulate:progression:quick

# Location clear-rate (attrition across a full location, danger 1–7)
npm run simulate:location
npm run simulate:location:quick

# Campaign (multi-location chain + itemization ON/OFF comparison)
npm run simulate:campaign
npm run simulate:campaign:quick
```

---

## Modes Overview

| Mode | Flag | What it measures | Live parity |
|------|------|------------------|-------------|
| **Battle (1v1)** | *(default)* | Win rate per build × archetype at fixed level | Enemy gen via `EnemySystem`; combat still uses sim loop |
| **Location** | `--location` | Clear rate of a full location with HP/chakra carry-over | Rooms + enemies from live generators; battles via `resolveBattle` |
| **Campaign** | `--campaign` | Multi-location run, gear delta ON vs OFF | Same as location + XP/ryo/loot progression |
| **Progression** | `--progression` / `-p` | Level 1→N skill acquisition curve | 1v1 battles with leveling abstraction |

**Prefer `--location` or `--campaign` for balance work.** The default 1v1 mode is useful for matchup isolation but does not model attrition, rests, or room sequences.

---

## Battle Mode (Default)

Tests all player builds against all enemy archetypes at a fixed level.

### Usage

```bash
npx tsx src/simulation/index.ts [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-b, --battles <n>` | Battles per matchup | 1000 |
| `-l, --level <n>` | Player level | 10 |
| `-f, --floor <n>` | Floor number (reverse-mapped to danger for live scaling) | 10 |
| `-d, --difficulty <n>` | Enemy difficulty (0-100) | 50 |
| `-q, --quick` | Quick mode (100 battles) | - |
| `-s, --seed <n>` | PRNG seed | 12345 |
| `-h, --help` | Show help | - |

### Examples

```bash
# Full simulation at level 20
npx tsx src/simulation/index.ts --level 20

# Quick test with 500 battles
npx tsx src/simulation/index.ts --battles 500

# High difficulty test
npx tsx src/simulation/index.ts --difficulty 80 --floor 25
```

### Output

Results are exported to `simulation-output/`:
- `simulation-results-<timestamp>.json` - Full battle data
- `simulation-summary-<timestamp>.json` - Summary statistics
- `simulation-results-<timestamp>.csv` - Spreadsheet format

---

## Location Mode (Attrition / Clear-Rate)

Simulates clearing whole **locations** (room sequence with HP/chakra carry-over) for every build × dangerLevel 1–7.

### Why it exists

1v1 full-HP fights often report ~100% win rates. Real difficulty is surviving an entire location’s combat + rest loop. This mode measures **clear rate** and remaining HP at exit.

### Usage

```bash
npx tsx src/simulation/index.ts --location [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--location` | Enable location-clear simulation | - |
| `-r, --runs <n>` | Attempts per build×danger cell | 100 |
| `-l, --level <n>` | Player level | 10 |
| `-d, --difficulty <n>` | Region base difficulty 0–100 | 40 |
| `--no-elite` | Skip optional eliteChallenge rooms | - |
| `-q, --quick` | 25 runs per cell | - |
| `-s, --seed <n>` | PRNG seed | 12345 |

### Examples

```bash
npm run simulate:location
npx tsx src/simulation/index.ts --location --quick
npx tsx src/simulation/index.ts --location -r 200 -d 50
```

### Live reuse

- Rooms/activities from `LocationSystem.generateBranchingFloorFromConfig`
- Enemies scaled with live danger formula (`dangerToFloor` + `EnemySystem`)
- Combat via `resolveBattle` (shared engine with 1v1)
- REST heals match live percentages; merchant/event/treasure treated as neutral

---

## Campaign Mode (Multi-Location + Itemization)

Chains N locations with carry-over of HP/chakra/ryo/equipment/XP. Runs the same seed twice (items ON vs OFF) to isolate gear contribution.

### Usage

```bash
npx tsx src/simulation/index.ts --campaign [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--campaign` | Enable campaign simulation | - |
| `-r, --runs <n>` | Runs per build per batch | 50 |
| `--locations <n>` | Consecutive locations to chain | 5 |
| `--start-danger <n>` | Starting danger 1–7 | 1 |
| `-l, --level <n>` | Starting player level | 5 |
| `-d, --difficulty <n>` | Region base difficulty | 40 |
| `--no-elite` | Skip eliteChallenge rooms | - |
| `-q, --quick` | 10 runs per batch | - |
| `-s, --seed <n>` | PRNG seed | 12345 |

### Examples

```bash
npm run simulate:campaign
npx tsx src/simulation/index.ts --campaign --quick
npx tsx src/simulation/index.ts --campaign --locations 7 --start-danger 1 -r 30
```

---

## Progression Mode

Simulates complete game runs from level 1, including leveling and skill acquisition.

### Usage

```bash
npx tsx src/simulation/index.ts --progression [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-p, --progression` | Enable progression mode | - |
| `-r, --runs <n>` | Runs per clan | 100 |
| `--max-level <n>` | Maximum level to reach | 50 |
| `--battles-per-level <n>` | Battles before level up | 2 |
| `--battles-per-skill <n>` | Battles before skill gain | 3 |
| `-q, --quick` | Quick mode (10 runs, 100 battles) | - |

### What It Tracks

- **Win rate by level** - Identifies difficulty spikes
- **Difficulty breakpoints** - Levels where win rate drops >10%
- **Skill acquisition** - Which skills are learned and when
- **Survival rate** - % of runs reaching max level

---

## Enemy Archetypes

The simulation tests against 5 enemy archetypes (forced through `EnemySystem.generateEnemy`):

| Archetype | Description |
|-----------|-------------|
| TANK | High HP / strength, optional sim-only thorns aura |
| ASSASSIN | High speed/crit, low HP |
| CASTER | High spirit, elemental damage |
| GENJUTSU | Mental damage / confusion kits |
| BALANCED | Average stats across the board |

**Scaling source of truth:** live `DIFFICULTY` danger formula  
`dangerMult × progressionMult × diffMult × ENEMY_EASE_FACTOR`  
plus HP/DMG danger multipliers — not the legacy `floor × 0.08` curve.

In 1v1 mode, `--floor` is reverse-mapped to danger via  
`danger ≈ (floor − 10 − ⌊baseDifficulty/20⌋) / 2` (clamped 1–7).

---

## Player Builds

Generated builds include:

- **Clan Presets** - Default builds for each clan (Uzumaki, Uchiha, Hyuga, Lee, Yamanaka)
- **Extreme Builds** - Min/max stat distributions
- **Hybrid Builds** - Mixed offensive/defensive stats

---

## Understanding Results

### Win Rate Confidence Intervals

Results include 95% confidence intervals using Wilson score:

```
Win Rate: 65.2% ± 3.1% [62.1% - 68.3%]
```

At 1000 battles, expect ±3% margin of error at 50% win rate.

### Key Metrics

| Metric | Description |
|--------|-------------|
| Win Rate | % of battles won (1v1 mode) |
| Clear Rate | % of full location/campaign runs completed |
| Damage Efficiency | Damage dealt / damage received |
| Chakra Efficiency | Damage dealt / chakra used |
| Crit Rate | % of attacks that crit |
| Guts Triggers | Times survived lethal damage |

### Approach Statistics

When approaches are enabled, tracks:
- Success rate per approach type
- Win rate when approach succeeds vs fails

Approach math uses live `APPROACH_DEFINITIONS` (e.g. STEALTH first-hit **2.0×**, not 2.5×; no guaranteed first turn).

---

## Parity Caveats (A-007)

The sim is intentionally **not** a full rewrite of the live turn systems. Known remaining gaps:

| Area | Live | Sim 1v1 | Notes |
|------|------|---------|-------|
| Enemy generation | `EnemySystem.generateEnemy` | **Same** (via `generateSimEnemy` wrapper + forced archetype) | Floor→danger is approximate |
| Enemy skill AI | `EnemyAISystem.selectEnemySkill` | **Same** | |
| Approach first-hit | 2.0× from defs | **Same** | Was 2.5× hard-coded |
| Approach initiative | `initiativeBonus` from defs | **Same** via `determineTurnOrder` | Was +100 / force-first |
| Damage / mitigation | `StatSystem` + `CombatCalculationSystem` | Shared pure math | |
| Turn orchestration | `PlayerTurnSystem` / `EnemyTurnSystem` | Parallel loop in `BattleSimulator` | AP/hand/posture mirrored; not identical code path |
| Attrition / rooms | Region → Location → Room | Only in `--location` / `--campaign` | Default 1v1 ignores this |
| `locationsCleared` stack | Increases over a run | 0 in 1v1 default | Campaign models progression |
| TANK thorns aura | Not on live NORMAL | Optional sim starting buff | Archetype identity for matchup tests |

**Bottom line:** use `--location` / `--campaign` for “is the game too easy?” questions. Use default 1v1 for “does build X beat archetype Y at this scale?”

---

## Programmatic Usage

```typescript
import { runFullSimulation, runCustomSimulation } from './simulation';
import { generateClanPresets } from './simulation/BuildGenerator';
import { EnemyArchetype } from './simulation/types';
import { generateSimEnemy } from './simulation/EnemyArchetypes';

// Run full simulation
const results = await runFullSimulation({
  battlesPerConfig: 500,
  playerLevel: 15,
  difficulty: 60
});

// Run custom matchup
const builds = generateClanPresets(10);
const output = await runCustomSimulation(
  builds,
  [EnemyArchetype.TANK, EnemyArchetype.ASSASSIN],
  { battlesPerConfig: 1000 }
);

// Live-scaled enemy for a fixed archetype (danger reverse-mapped from floor)
const enemy = generateSimEnemy(EnemyArchetype.CASTER, 20, 50);
```

## File Structure

```
src/simulation/
├── index.ts                # CLI entry point
├── types.ts                # Type definitions
├── BattleSimulator.ts      # Core battle loop (resolveBattle)
├── BuildGenerator.ts       # Player build generation
├── EnemyArchetypes.ts      # Archetype metadata + generateSimEnemy wrapper
├── SkillSelectionAI.ts     # Player card/skill selection AI
├── StatisticsCollector.ts  # Result aggregation
├── ConsoleReporter.ts      # Console output
├── JsonExporter.ts         # File export
├── ProgressionSimulator.ts # Progression mode
├── LocationSimulator.ts    # Attrition / clear-rate mode
├── CampaignSimulator.ts    # Multi-location + itemization
├── seededRandom.ts         # Deterministic Math.random for CLI
└── SIMULATION.md           # This file
```

## Tips for Balance Testing

1. **Start with location mode** - Clear-rate matrices beat 1v1 win rates for endgame health
2. **Compare clans** - Campaign mode shows who dies at which danger depth
3. **Seed everything** - Use `--seed` for reproducible A/B of balance patches
4. **Iterate quickly** - Use `--quick` during development
5. **Statistical significance** - Use 1000+ 1v1 battles or 100+ location runs for reliable results
6. **Don't trust 1v1 alone** - Full-HP duels hide attrition and rest economy
