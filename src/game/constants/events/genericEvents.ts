import { GameEvent, PrimaryStat, Rarity, RiskLevel } from '../../types';

/**
 * Generic events that can appear in any story arc.
 * These events provide special progression opportunities.
 */
export const GENERIC_EVENTS: GameEvent[] = [
  // ─── COMMON anchor ───────────────────────────────────────────────────────────
  // Without a COMMON event the 3 RARE + 1 EPIC pool lets the EPIC surface at
  // ~12 % instead of the intended ~7 %.  A single COMMON (weight 100) lowers the
  // EPIC share to ~7 % and gives newer players a low-stakes event each run.
  {
    id: 'abandoned_supply_cache',
    title: 'Abandoned Supply Cache',
    description:
      'A sealed crate lies half-buried at a crossroads. Leaf seal under mud. Whoever left it did not return — and the rot smells of rationed urgency, not adventure.',
    // T-012 A2 (optional): removed explicit allowedArcs:[]; omitting the field
    // is consistent with the rest of GENERIC_EVENTS and is treated identically
    // by isEventValidForArc (both [] and undefined mean "all arcs").
    // Kept in WAVES: low-stakes COMMON; does not dilute the spine.
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Take the Supplies',
        description: 'SAFE — Claim whatever was left behind',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 60,
            effects: {
              ryo: 80,
              hpChange: { percent: 20 },
              intelGain: 10,
              logMessage:
                'Field rations, gauze, and cold coin. Someone provisioned for a mission that never finished.',
              logType: 'gain',
            },
          },
          {
            weight: 40,
            effects: {
              ryo: 40,
              intelGain: 5,
              logMessage: 'Half the crate is ruined by damp. You salvage what the rot left.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Inspect the Contents',
        description: 'LOW RISK — Study the mission notes for intelligence',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 70,
            effects: {
              exp: 35,
              intelGain: 20,
              logMessage:
                'The briefing is still readable: patrol routes, weapon caches, terrain notes — someone else\'s unfinished ledger.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              exp: 15,
              intelGain: 5,
              logMessage: 'The notes are water-damaged beyond use. You glean little from the fragments.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Leave It for Another Team',
        description: 'SAFE — Walk on; let the crate keep its secrets',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              intelGain: 5,
              logMessage: 'You leave the crate untouched. Somewhere, a team might find it in time — or not.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'ancient_treasure_map',
    title: 'Ancient Treasure Map',
    description:
      'An old scroll falls from a hidden compartment, revealing a map marked with strange symbols. It details the location of treasures far superior to what you usually find.',
    // Soft-gate: keep permanent treasure upgrades out of Waves free pool (spine first)
    allowedArcs: ['ACADEMY_ARC', 'EXAMS_ARC', 'ROGUE_ARC', 'WAR_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Follow the Map',
        description: 'HIGH RISK - The path is dangerous but the reward is permanent',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Fortune favors the bold...',
        outcomes: [
          {
            weight: 60,
            effects: {
              upgradeTreasureQuality: true,
              exp: 50,
              intelGain: 25,
              logMessage: 'The map leads to an ancient cache! Your treasure-finding abilities have permanently improved!',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              hpChange: { percent: -25 },
              ryo: 100,
              intelGain: 10,
              logMessage: 'The path was treacherous. You found some gold but sustained injuries.',
              logType: 'danger',
            },
          },
          {
            weight: 15,
            effects: {
              hpChange: { percent: -15 },
              intelGain: 5,
              logMessage: 'The treasure was already looted. Only traps remained.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Sell the Map',
        description: 'SAFE - Guaranteed Ryo',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 200,
              intelGain: 5,
              logMessage: 'A collector pays well for the mysterious map.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Study the Map',
        description: 'LOW RISK - Gain knowledge',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 70,
            effects: {
              exp: 75,
              statChanges: { intelligence: 1 },
              intelGain: 20,
              logMessage: 'The ancient symbols reveal secrets of the old world.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              exp: 30,
              intelGain: 10,
              logMessage: 'The map is too faded to decipher fully.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'traveling_merchant_caravan',
    title: 'Traveling Merchant Caravan',
    description:
      'A caravan waits where the road still has a price. Their leader eyes your gear the way collectors eye open doors — opportunity, not friendship.',
    // Soft-gate Waves: R1 uses location-tied false scales / dock economy instead
    // (permanent merchant-slot power diluted spine pressure)
    allowedArcs: ['ACADEMY_ARC', 'EXAMS_ARC', 'ROGUE_ARC', 'WAR_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Join Their Network',
        description: 'MEDIUM RISK - Become a trade partner',
        riskLevel: RiskLevel.MEDIUM,
        hintText: 'Connections have value...',
        costs: { ryo: 150 },
        outcomes: [
          {
            weight: 70,
            effects: {
              addMerchantSlot: true,
              intelGain: 20,
              logMessage: 'You become part of their trade network! Merchants will now show you more items.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              ryo: 75,
              intelGain: 10,
              logMessage: 'The deal falls through, but they return part of your investment.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Trade Goods',
        description: 'SAFE - Simple trade',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 100,
              exp: 25,
              intelGain: 10,
              logMessage: 'A profitable trade! You gained some gold and experience.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Help Guard the Caravan',
        description: 'MEDIUM RISK - Protect from bandits',
        riskLevel: RiskLevel.MEDIUM,
        outcomes: [
          {
            weight: 50,
            effects: {
              ryo: 175,
              exp: 50,
              intelGain: 15,
              logMessage: 'Bandits attacked! You drove them off and earned a reward.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 10,
                archetype: 'ASSASSIN',
                name: 'Bandit Leader',
              },
              intelGain: 5,
              logMessage: 'A dangerous bandit challenges you directly!',
              logType: 'danger',
            },
          },
          {
            weight: 20,
            effects: {
              exp: 40,
              intelGain: 10,
              logMessage: 'No bandits came. The merchants thank you anyway.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'hidden_shrine_blessing',
    title: 'Hidden Shrine of Fortune',
    description:
      'Deep within a forgotten alcove, you discover an ancient shrine dedicated to a long-forgotten deity of fortune. Faded inscriptions promise blessings to those who make offerings.',
    // Soft-gate: EPIC permanent power stays out of Waves free pool
    allowedArcs: ['ACADEMY_ARC', 'EXAMS_ARC', 'ROGUE_ARC', 'WAR_ARC'],
    rarity: Rarity.EPIC,
    choices: [
      {
        label: 'Make a Generous Offering',
        description: 'HIGH RISK - Large offering for great blessing',
        riskLevel: RiskLevel.HIGH,
        costs: { ryo: 300 },
        hintText: 'The gods reward generosity...',
        outcomes: [
          {
            weight: 55,
            effects: {
              upgradeTreasureQuality: true,
              hpChange: { percent: 50 },
              chakraChange: { percent: 50 },
              intelGain: 25,
              logMessage: 'The shrine glows! Divine blessing enhances your fortune permanently!',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              statChanges: { spirit: 2, calmness: 2 },
              exp: 100,
              intelGain: 15,
              logMessage: 'The blessing empowers your spirit instead.',
              logType: 'gain',
            },
          },
          {
            weight: 15,
            effects: {
              intelGain: 5,
              logMessage: 'The shrine remains silent. The old gods no longer listen.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Small Offering',
        description: 'LOW RISK - Modest offering, modest blessing',
        riskLevel: RiskLevel.LOW,
        costs: { ryo: 50 },
        outcomes: [
          {
            weight: 80,
            effects: {
              hpChange: { percent: 30 },
              chakraChange: { percent: 30 },
              exp: 40,
              intelGain: 15,
              logMessage: 'A warm glow restores your vitality.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              exp: 20,
              intelGain: 10,
              logMessage: 'A faint acknowledgment. Better than nothing.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Meditate at the Shrine',
        description: 'SAFE - No offering, seek wisdom',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              chakraChange: { percent: 25 },
              exp: 30,
              intelGain: 10,
              logMessage: 'The peaceful atmosphere calms your mind.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'intelligence_network',
    title: 'Intelligence Network',
    description:
      'A figure in the grey claims to have maps of the area. Knowledge is another tax — paid in ryo, force, or patience.',
    // Kept in Waves: intel-for-coin matches Gato\'s information economy
    allowedArcs: [],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Pay for Information',
        description: 'SAFE - Spend Ryo for guaranteed intel',
        riskLevel: RiskLevel.SAFE,
        costs: { ryo: 100 },
        outcomes: [
          {
            weight: 100,
            effects: {
              intelGain: 25,
              logMessage: 'The informant provides detailed maps and patrol routes.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Intimidate Them',
        description: 'HIGH RISK - Use force to extract information. Risky but free.',
        riskLevel: RiskLevel.HIGH,
        requirements: { minStat: { stat: PrimaryStat.STRENGTH, value: 15 } },
        hintText: 'Strength can be persuasive...',
        outcomes: [
          {
            weight: 40,
            effects: {
              intelGain: 35,
              logMessage: 'They reveal everything they know in fear!',
              logType: 'gain',
            },
          },
          {
            weight: 35,
            effects: {
              intelGain: 10,
              hpChange: -15,
              logMessage: 'They fight back before fleeing. You learn a little.',
              logType: 'danger',
            },
          },
          {
            weight: 25,
            effects: {
              intelGain: 0,
              hpChange: -25,
              logMessage: 'It was a trap! Enemies ambush you.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Trade Information',
        description: 'LOW RISK - Share what you know in exchange',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 60,
            effects: {
              intelGain: 20,
              logMessage: 'A fair exchange of intelligence.',
              logType: 'info',
            },
          },
          {
            weight: 40,
            effects: {
              intelGain: 15,
              logMessage: 'They hold back some details, but you learn useful things.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Observe Silently',
        description: 'MEDIUM RISK - Follow them and gather intel without interaction',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.DEXTERITY, value: 12 } },
        hintText: 'Patience reveals secrets...',
        outcomes: [
          {
            weight: 50,
            effects: {
              intelGain: 30,
              logMessage: 'You shadow them undetected and learn their secrets.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              intelGain: 15,
              logMessage: 'You gather some intel before losing sight of them.',
              logType: 'info',
            },
          },
          {
            weight: 20,
            effects: {
              intelGain: 5,
              logMessage: 'They spot you and flee before you learn much.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },
];
