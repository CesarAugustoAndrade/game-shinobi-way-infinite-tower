/**
 * Battle Simulation CLI - Main Entry Point
 * Run with: npx ts-node src/simulation/index.ts
 */

import { ApproachType } from '../game/types';
import {
  SimulationConfig,
  SimulationOutput,
  SimulationRunResult,
  PlayerBuildConfig,
  DEFAULT_CONFIG,
  ProgressionConfig,
  DEFAULT_PROGRESSION_CONFIG
} from './types';
import { EnemyArchetype, getAllArchetypes } from './EnemyArchetypes';
import { generateAllBuilds, generateClanPresets, generateExtremeBuilds } from './BuildGenerator';
import { runBattles } from './BattleSimulator';
import { aggregateResults, generateSummary } from './StatisticsCollector';
import { printFullReport, printProgress, clearProgress, printHeader } from './ConsoleReporter';
import { exportToJson, exportSummaryToJson, exportToCsv } from './JsonExporter';
import { runFullProgressionSimulation, printProgressionSummary } from './ProgressionSimulator';
import { installSeededRandom, DEFAULT_SEED } from './seededRandom';
import {
  simulateLocationRuns,
  printLocationReport,
  LocationAggregate,
  LocationRunConfig,
  DEFAULT_LOCATION_CONFIG,
} from './LocationSimulator';
import {
  CampaignConfig,
  DEFAULT_CAMPAIGN_CONFIG,
  runCampaignSimulation,
} from './CampaignSimulator';
import { printResolveSkillProbe, runResolveSkillBalanceProbe } from './ResolveSkillBalance';
import { printCatalogV1Probe, runCatalogV1Probe } from './CatalogV1Balance';
import { printAiSimParityProbe, runAiSimParityProbe } from './AiSimParityBalance';
import { printCombatUiHonestyProbe } from './CombatUiHonestyBalance';
import { printModeSkillsReauthorProbe, runModeSkillsReauthorProbe } from './ModeSkillsReauthorBalance';
import { printLiveTurnStartProbe, runLiveTurnStartProbe } from './LiveTurnStartBalance';
import { printSkillConfigLiveProbe, runSkillConfigLiveProbe } from './SkillConfigLiveBalance';
import { printDiscoverResolveProbe, runDiscoverResolveProbe } from './DiscoverResolveBalance';
import { printModeWeightBonusesProbe, runModeWeightBonusesProbe } from './ModeWeightBonusesBalance';
import { printSupportNextDrawProbe, runSupportNextDrawProbe } from './SupportNextDrawBalance';
import { printGatePrepDiscountProbe, runGatePrepDiscountProbe } from './GatePrepDiscountBalance';
import { printRasenganModePayoffProbe, runRasenganModePayoffProbe } from './RasenganModePayoffBalance';
import { printSealingTagDrainProbe, runSealingTagDrainProbe } from './SealingTagDrainBalance';
import { printUzumakiBarrageHitsProbe, runUzumakiBarrageHitsProbe } from './UzumakiBarrageHitsBalance';
import { printMorningPeacockProbe, runMorningPeacockProbe } from './MorningPeacockBalance';
import { printTwinLionFistsProbe, runTwinLionFistsProbe } from './TwinLionFistsBalance';
import { printSideToolMarksMoveProbe, runSideToolMarksMoveProbe } from './SideToolMarksMoveBalance';
import { printTripwireReactionProbe, runTripwireReactionProbe } from './TripwireReactionBalance';
import { printChidoriSharingan3Probe, runChidoriSharingan3Probe } from './ChidoriSharingan3Balance';
import { printAirPalmProbe, runAirPalmProbe } from './AirPalmBalance';
import { printModeFamilyReplaceProbe, runModeFamilyReplaceProbe } from './ModeFamilyReplaceBalance';
import { printRotationKaitenProbe, runRotationKaitenProbe } from './RotationKaitenBalance';
import { printDynamicEntryProbe, runDynamicEntryProbe } from './DynamicEntryBalance';
import { printPrimaryLotusProbe, runPrimaryLotusProbe } from './PrimaryLotusBalance';
import { printHiddenLotusProbe, runHiddenLotusProbe } from './HiddenLotusBalance';
import { printFireballProbe, runFireballProbe } from './FireballBalance';
import { printPhoenixFlowerProbe, runPhoenixFlowerProbe } from './PhoenixFlowerBalance';
import { printChidoriStreamProbe, runChidoriStreamProbe } from './ChidoriStreamBalance';
import { printSixtyFourPalmsProbe, runSixtyFourPalmsProbe } from './SixtyFourPalmsBalance';
import { printMindTransferProbe, runMindTransferProbe } from './MindTransferBalance';
import { printHellViewingProbe, runHellViewingProbe } from './HellViewingBalance';
import { printSmokeBombProbe, runSmokeBombProbe } from './SmokeBombBalance';
import { printSharinganPredictProbe, runSharinganPredictProbe } from './SharinganPredictBalance';
import { printGatePrepSupportProbe, runGatePrepSupportProbe } from './GatePrepSupportBalance';
import { printFalseSurroundingsProbe, runFalseSurroundingsProbe } from './FalseSurroundingsBalance';
import { printMindDestructionProbe, runMindDestructionProbe } from './MindDestructionBalance';
import { printShunshinProbe, runShunshinProbe } from './ShunshinBalance';
import { printDancingLeafProbe, runDancingLeafProbe } from './DancingLeafBalance';
import { printGentleFistProbe, runGentleFistProbe } from './GentleFistBalance';
import { printKaiProbe, runKaiProbe } from './KaiBalance';

// ============================================================================
// SIMULATION RUNNER
// ============================================================================

/**
 * Run full simulation across all builds and archetypes
 */
export async function runFullSimulation(
  config: SimulationConfig = DEFAULT_CONFIG,
  seed: number = DEFAULT_SEED
): Promise<SimulationOutput> {
  const startTime = Date.now();

  // Generate builds to test
  const builds = generateAllBuilds(config.playerLevel);
  const archetypes = getAllArchetypes();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         SHINOBI WAY - BATTLE SIMULATION                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Configuration:`);
  console.log(`  Seed: ${seed}`);
  console.log(`  Battles per matchup: ${config.battlesPerConfig}`);
  console.log(`  Player Level: ${config.playerLevel}`);
  console.log(`  Floor: ${config.floorNumber}`);
  console.log(`  Difficulty: ${config.difficulty}`);
  console.log(`  Builds to test: ${builds.length}`);
  console.log(`  Enemy archetypes: ${archetypes.length}`);
  console.log(`  Total matchups: ${builds.length * archetypes.length}`);
  console.log(`  Total battles: ${builds.length * archetypes.length * config.battlesPerConfig}`);

  const results: SimulationRunResult[] = [];
  let completedMatchups = 0;
  const totalMatchups = builds.length * archetypes.length;

  // Run all matchups
  for (const build of builds) {
    for (const archetype of archetypes) {
      const matchupStart = Date.now();

      printProgress(completedMatchups, totalMatchups, 'Simulating');

      // Run battles for this matchup
      const battleResults = runBattles(build, archetype, config, null);

      // Aggregate results
      const aggregated = aggregateResults(battleResults, build.name, archetype);

      results.push({
        config,
        playerBuild: build,
        enemyArchetype: archetype,
        battles: battleResults,
        aggregated,
        duration: Date.now() - matchupStart
      });

      completedMatchups++;
    }
  }

  clearProgress();
  console.log(`\nSimulation complete! ${totalMatchups} matchups tested.`);

  // Generate summary
  const summary = generateSummary(
    results.map(r => r.aggregated),
    builds,
    archetypes
  );

  const totalDuration = Date.now() - startTime;

  const output: SimulationOutput = {
    metadata: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      totalDuration,
      totalBattles: results.reduce((acc, r) => acc + r.battles.length, 0),
      seed
    },
    configurations: {
      simulationConfig: config,
      playerBuilds: builds,
      enemyArchetypes: archetypes
    },
    results,
    summary
  };

  return output;
}

/**
 * Run simulation for specific builds/archetypes
 */
export async function runCustomSimulation(
  builds: PlayerBuildConfig[],
  archetypes: EnemyArchetype[],
  config: SimulationConfig = DEFAULT_CONFIG,
  seed: number = DEFAULT_SEED
): Promise<SimulationOutput> {
  const startTime = Date.now();

  console.log('\nRunning custom simulation...');
  console.log(`  Builds: ${builds.map(b => b.name).join(', ')}`);
  console.log(`  Enemies: ${archetypes.join(', ')}`);

  const results: SimulationRunResult[] = [];

  for (const build of builds) {
    for (const archetype of archetypes) {
      const matchupStart = Date.now();

      const battleResults = runBattles(build, archetype, config, null);
      const aggregated = aggregateResults(battleResults, build.name, archetype);

      results.push({
        config,
        playerBuild: build,
        enemyArchetype: archetype,
        battles: battleResults,
        aggregated,
        duration: Date.now() - matchupStart
      });
    }
  }

  const summary = generateSummary(
    results.map(r => r.aggregated),
    builds,
    archetypes
  );

  return {
    metadata: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - startTime,
      totalBattles: results.reduce((acc, r) => acc + r.battles.length, 0),
      seed
    },
    configurations: {
      simulationConfig: config,
      playerBuilds: builds,
      enemyArchetypes: archetypes
    },
    results,
    summary
  };
}

// ============================================================================
// LOCATION SIMULATION RUNNER (attrition / clear-rate)
// ============================================================================

/**
 * Run the location-clear simulation across all builds × dangerLevel 1-7.
 * Each cell is N full-location attempts with HP/chakra carry-over.
 */
export function runLocationSimulation(
  runsPerCell: number,
  config: LocationRunConfig,
  seed: number
): void {
  const builds = generateAllBuilds(config.playerLevel);
  const dangerLevels = [1, 2, 3, 4, 5, 6, 7];

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      SHINOBI WAY - LOCATION CLEAR SIMULATION (attrition)    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`  Seed: ${seed}`);
  console.log(`  Builds: ${builds.length}   Danger levels: 1-7   Runs/cell: ${runsPerCell}`);
  console.log(`  Total location runs: ${builds.length * dangerLevels.length * runsPerCell}`);

  const aggregates: LocationAggregate[] = [];
  const totalCells = builds.length * dangerLevels.length;
  let completed = 0;

  for (const build of builds) {
    for (const danger of dangerLevels) {
      printProgress(completed, totalCells, 'Locations');
      aggregates.push(simulateLocationRuns(build, danger, runsPerCell, config));
      completed++;
    }
  }
  clearProgress();

  printLocationReport(aggregates, { seed, runsPerCell, config });
}

// ============================================================================
// CAMPAIGN SIMULATION RUNNER (multi-location + itemization)
// ============================================================================

/**
 * Run the campaign simulation for all preset builds.
 * Executes with items ON and OFF on the same seed to produce a gear-delta
 * comparativa, then prints the unified report.
 */
export function runCampaignSimulationCLI(
  runsPerBatch: number,
  config: CampaignConfig,
  seed: number
): void {
  const builds = generateAllBuilds(config.playerLevel);
  runCampaignSimulation(runsPerBatch, config, seed, builds);
}

// ============================================================================
// CLI MAIN
// ============================================================================

/**
 * Parse the `--seed <n>` / `-s <n>` flag. Falls back to DEFAULT_SEED so runs
 * are reproducible by default.
 */
function parseSeed(args: string[]): number {
  const idx = args.findIndex(a => a === '--seed' || a === '-s');
  if (idx !== -1 && idx + 1 < args.length) {
    const parsed = parseInt(args[idx + 1], 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return DEFAULT_SEED;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Make the entire simulation process deterministic: install a seeded PRNG
  // over the global Math.random BEFORE any battle runs. This covers every
  // Math.random consumer (combat hit/crit rolls, DeckSystem.drawHand, the
  // enemy AI, initiative, etc.) without touching the frozen game math. The
  // real game is unaffected because this override only lives in the CLI process.
  const seed = parseSeed(args);
  installSeededRandom(seed);

  // Check for campaign mode (multi-location with itemization)
  const isCampaign = args.includes('--campaign');
  if (isCampaign) {
    const config: CampaignConfig = { ...DEFAULT_CAMPAIGN_CONFIG };
    let runsPerBatch = 50;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--runs' || arg === '-r') {
        runsPerBatch = parseInt(args[++i]) || runsPerBatch;
      } else if (arg === '--level' || arg === '-l') {
        config.playerLevel = parseInt(args[++i]) || config.playerLevel;
      } else if (arg === '--difficulty' || arg === '-d') {
        config.baseDifficulty = parseInt(args[++i]) || config.baseDifficulty;
      } else if (arg === '--locations') {
        config.numLocations = parseInt(args[++i]) || config.numLocations;
      } else if (arg === '--start-danger') {
        config.startDangerLevel = parseInt(args[++i]) || config.startDangerLevel;
      } else if (arg === '--no-elite') {
        config.fightEliteChallenges = false;
      } else if (arg === '--quick' || arg === '-q') {
        runsPerBatch = 10;
      } else if (arg === '--help' || arg === '-h') {
        printHelp();
        return;
      }
    }

    try {
      runCampaignSimulationCLI(runsPerBatch, config, seed);
      console.log('\nCampaign simulation complete!');
    } catch (error) {
      console.error('Campaign simulation failed:', error);
      process.exit(1);
    }
    return;
  }

  // Check for location-clear (attrition) mode
  const isLocation = args.includes('--location');
  if (isLocation) {
    const config: LocationRunConfig = { ...DEFAULT_LOCATION_CONFIG };
    let runsPerCell = 100;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--runs' || arg === '-r') {
        runsPerCell = parseInt(args[++i]) || runsPerCell;
      } else if (arg === '--level' || arg === '-l') {
        config.playerLevel = parseInt(args[++i]) || config.playerLevel;
      } else if (arg === '--difficulty' || arg === '-d') {
        config.baseDifficulty = parseInt(args[++i]) || config.baseDifficulty;
      } else if (arg === '--no-elite') {
        config.fightEliteChallenges = false;
      } else if (arg === '--quick' || arg === '-q') {
        runsPerCell = 25;
      } else if (arg === '--help' || arg === '-h') {
        printHelp();
        return;
      }
    }

    try {
      runLocationSimulation(runsPerCell, config, seed);
      console.log('\nLocation simulation complete!');
    } catch (error) {
      console.error('Location simulation failed:', error);
      process.exit(1);
    }
    return;
  }

  // Check for progression mode
  const isProgression = args.includes('--progression') || args.includes('-p');

  if (isProgression) {
    // Run progression simulation
    let progressionConfig: ProgressionConfig = { ...DEFAULT_PROGRESSION_CONFIG };

    // Parse progression-specific arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--runs' || arg === '-r') {
        progressionConfig.runsToSimulate = parseInt(args[++i]) || 100;
      } else if (arg === '--max-level') {
        progressionConfig.maxLevel = parseInt(args[++i]) || 50;
      } else if (arg === '--battles-per-level') {
        progressionConfig.battlesPerLevelUp = parseInt(args[++i]) || 2;
      } else if (arg === '--battles-per-skill') {
        progressionConfig.battlesPerSkillGain = parseInt(args[++i]) || 3;
      } else if (arg === '--quick' || arg === '-q') {
        progressionConfig.runsToSimulate = 10;
        progressionConfig.maxBattles = 100;
      } else if (arg === '--help' || arg === '-h') {
        printHelp();
        return;
      }
    }

    try {
      console.log(`\nSeed: ${seed} (use --seed <n> to change)`);
      const summaries = await runFullProgressionSimulation(progressionConfig);
      printProgressionSummary(summaries);
      console.log('\nProgression simulation complete!');
    } catch (error) {
      console.error('Progression simulation failed:', error);
      process.exit(1);
    }
    return;
  }

  // Standard battle simulation
  let config: SimulationConfig = { ...DEFAULT_CONFIG };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--battles' || arg === '-b') {
      config.battlesPerConfig = parseInt(args[++i]) || 1000;
    } else if (arg === '--level' || arg === '-l') {
      config.playerLevel = parseInt(args[++i]) || 10;
    } else if (arg === '--floor' || arg === '-f') {
      config.floorNumber = parseInt(args[++i]) || 10;
    } else if (arg === '--difficulty' || arg === '-d') {
      config.difficulty = parseInt(args[++i]) || 50;
    } else if (arg === '--quick' || arg === '-q') {
      config.battlesPerConfig = 100;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      return;
    }
  }

  try {
    const probeTrials = args.includes('--quick') || args.includes('-q') ? 200 : 400;
    printResolveSkillProbe(runResolveSkillBalanceProbe(probeTrials));
    printCatalogV1Probe(runCatalogV1Probe());
    printAiSimParityProbe(runAiSimParityProbe());
    printCombatUiHonestyProbe();
    printModeSkillsReauthorProbe(runModeSkillsReauthorProbe());
    printLiveTurnStartProbe(runLiveTurnStartProbe());
    printSkillConfigLiveProbe(runSkillConfigLiveProbe());
    printDiscoverResolveProbe(runDiscoverResolveProbe());
    printModeWeightBonusesProbe(runModeWeightBonusesProbe());
    printSupportNextDrawProbe(runSupportNextDrawProbe());
    printGatePrepDiscountProbe(runGatePrepDiscountProbe());
    printRasenganModePayoffProbe(runRasenganModePayoffProbe());
    printSealingTagDrainProbe(runSealingTagDrainProbe());
    printUzumakiBarrageHitsProbe(runUzumakiBarrageHitsProbe());
    printMorningPeacockProbe(runMorningPeacockProbe());
    printTwinLionFistsProbe(runTwinLionFistsProbe());
    printSideToolMarksMoveProbe(runSideToolMarksMoveProbe());
    printTripwireReactionProbe(runTripwireReactionProbe());
    printChidoriSharingan3Probe(runChidoriSharingan3Probe());
    printAirPalmProbe(runAirPalmProbe());
    printModeFamilyReplaceProbe(runModeFamilyReplaceProbe());
    printRotationKaitenProbe(runRotationKaitenProbe());
    printDynamicEntryProbe(runDynamicEntryProbe());
    printPrimaryLotusProbe(runPrimaryLotusProbe());
    printHiddenLotusProbe(runHiddenLotusProbe());
    printFireballProbe(runFireballProbe());
    printPhoenixFlowerProbe(runPhoenixFlowerProbe());
    printChidoriStreamProbe(runChidoriStreamProbe());
    printSixtyFourPalmsProbe(runSixtyFourPalmsProbe());
    printMindTransferProbe(runMindTransferProbe());
    printHellViewingProbe(runHellViewingProbe());
    printSmokeBombProbe(runSmokeBombProbe());
    printSharinganPredictProbe(runSharinganPredictProbe());
    printGatePrepSupportProbe(runGatePrepSupportProbe());
    printFalseSurroundingsProbe(runFalseSurroundingsProbe());
    printMindDestructionProbe(runMindDestructionProbe());
    printShunshinProbe(runShunshinProbe());
    printDancingLeafProbe(runDancingLeafProbe());
    printGentleFistProbe(runGentleFistProbe());
    printKaiProbe(runKaiProbe());

    // Run simulation
    const output = await runFullSimulation(config, seed);

    // Print results
    printFullReport(output);

    // Export results
    exportToJson(output);
    exportSummaryToJson(output);
    exportToCsv(output);

    console.log('\nSimulation complete!');

  } catch (error) {
    console.error('Simulation failed:', error);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
SHINOBI WAY - Battle Simulation

Usage: npx tsx src/simulation/index.ts [options]

=== BATTLE MODE (default) ===
Options:
  -b, --battles <n>     Number of battles per matchup (default: 1000)
  -l, --level <n>       Player level (default: 10)
  -f, --floor <n>       Floor number for enemy scaling (default: 10)
  -d, --difficulty <n>  Enemy difficulty 0-100 (default: 50)
  -q, --quick           Quick mode (100 battles per matchup)
  -s, --seed <n>        PRNG seed for deterministic runs (default: 12345)
  -h, --help            Show this help message

Examples:
  npx tsx src/simulation/index.ts
  npx tsx src/simulation/index.ts --battles 500 --level 15
  npx tsx src/simulation/index.ts --quick
  npx tsx src/simulation/index.ts --quick --seed 777   (reproducible run)

=== CAMPAIGN MODE (multi-location run with itemization) ===
Chains N locations with carry-over of HP/chakra/ryo/equipment/XP and runs
the same seed TWICE (items ON vs items OFF) to isolate the gear contribution.
Reports: clear rate by location depth, power curve (HP/ATK), ryo economy,
and a gear-delta comparativa table.

Options:
  --campaign            Enable campaign simulation
  -r, --runs <n>        Runs per build per batch (default: 50; ×2 for comparison)
  --locations <n>       Number of consecutive locations to chain (default: 5)
  --start-danger <n>    Starting danger level 1-7 (default: 1)
  -l, --level <n>       Starting player level (default: 5)
  -d, --difficulty <n>  Region base difficulty 0-100 (default: 40)
  --no-elite            Skip optional eliteChallenge rooms
  -q, --quick           Quick mode (10 runs per batch)
  -s, --seed <n>        PRNG seed for deterministic runs (default: 12345)

npm scripts:
  npm run simulate:campaign         # Full campaign simulation
  npm run simulate:campaign:quick   # Quick campaign (10 runs/batch)

Examples:
  npx tsx src/simulation/index.ts --campaign
  npx tsx src/simulation/index.ts --campaign --quick
  npx tsx src/simulation/index.ts --campaign --locations 7 --start-danger 1 -r 30
  npx tsx src/simulation/index.ts --campaign --quick --seed 999

=== LOCATION MODE (attrition / clear-rate) ===
Simulates clearing whole LOCATIONS (a sequence of rooms with HP/chakra
carry-over) for every build × dangerLevel 1-7. Reports a clear-rate matrix.

Options:
  --location            Enable location-clear simulation
  -r, --runs <n>        Location attempts per build×danger cell (default: 100)
  -l, --level <n>       Player level (default: 10)
  -d, --difficulty <n>  Region base difficulty 0-100 (default: 40)
  --no-elite            Skip optional eliteChallenge rooms (still fight Guardian)
  -q, --quick           Quick mode (25 runs per cell)
  -s, --seed <n>        PRNG seed for deterministic runs (default: 12345)

Examples:
  npx tsx src/simulation/index.ts --location
  npx tsx src/simulation/index.ts --location --quick
  npx tsx src/simulation/index.ts --location -r 200 -d 50

=== PROGRESSION MODE ===
Simulates full game runs from level 1 with leveling and skill acquisition.

Options:
  -p, --progression         Enable progression mode
  -r, --runs <n>            Number of runs per clan (default: 100)
  --max-level <n>           Max level to simulate (default: 50)
  --battles-per-level <n>   Battles before level up (default: 2)
  --battles-per-skill <n>   Battles before skill gain (default: 3)
  -q, --quick               Quick mode (10 runs, 100 battles max)
  -s, --seed <n>            PRNG seed for deterministic runs (default: 12345)

Examples:
  npx tsx src/simulation/index.ts --progression
  npx tsx src/simulation/index.ts -p --runs 50 --max-level 30
  npx tsx src/simulation/index.ts -p -q

Output:
  Results are exported to simulation-output/ as:
  - simulation-results-<timestamp>.json (full data)
  - simulation-summary-<timestamp>.json (summary only)
  - simulation-results-<timestamp>.csv (spreadsheet format)
`);
}

// Run if executed directly
main().catch(console.error);

// Export for programmatic use
export type { SimulationConfig, SimulationOutput, PlayerBuildConfig } from './types';
export { EnemyArchetype } from './types';
export { generateAllBuilds, generateClanPresets, generateExtremeBuilds } from './BuildGenerator';
export { getAllArchetypes } from './EnemyArchetypes';
