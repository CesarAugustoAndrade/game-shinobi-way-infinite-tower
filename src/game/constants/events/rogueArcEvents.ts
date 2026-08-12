import { Clan, GameEvent, PrimaryStat, Rarity, RiskLevel } from '../../types';

export const ROGUE_ARC_EVENTS: GameEvent[] = [
  {
    id: 'sound_four_ritual',
    title: 'Sound Four Ritual Site',
    description:
      'A forbidden ritual chamber pulses with dark chakra. Four Sound ninja are performing a sealing ceremony on a captive.',
    allowedArcs: ['ROGUE_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Interrupt the Ritual',
        description: 'HIGH RISK - Stop the ceremony',
        riskLevel: RiskLevel.HIGH,
        outcomes: [
          {
            weight: 50,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 20,
                archetype: 'BALANCED',
                name: 'Sound Four',
              },
              logMessage: 'The ritual breaks! The Sound Four turn to attack you!',
              logType: 'danger',
            },
          },
          {
            weight: 50,
            effects: {
              exp: 150,
              ryo: 400,
              heatDelta: 30,
              logMessage: 'You disrupt the ritual and the captive escapes. Their gratitude knows no bounds.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Observe Secretly',
        description: 'MEDIUM RISK - Gather intelligence',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.CALMNESS, value: 1 } },
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 100,
              statChanges: { intelligence: 2 },
              heatDelta: 5,
              logMessage: 'You learn the Sound Village\'s secrets from the shadows.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 18,
                archetype: 'ASSASSIN',
                name: 'Sound Ninja Scout',
              },
              logMessage: 'A scout spots you!',
              logType: 'danger',
            },
          },
        ],
      },
      // T-041: Uzumaki exclusive — sealing bloodline disrupts the ritual
      {
        label: 'Uzumaki Sealing Disrupt',
        description: 'CLAN - Adamantine chains interrupt the seal work',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { requiredClan: Clan.UZUMAKI },
        outcomes: [
          {
            weight: 90,
            effects: {
              exp: 120,
              ryo: 250,
              heatDelta: 30,
              logMessage:
                'Your sealing chains shatter the Sound formation. The captive flees; the Sound Four scatter.',
              logType: 'loot',
            },
          },
          {
            weight: 10,
            effects: {
              hpChange: { percent: -20 },
              triggerCombat: {
                floor: 0,
                difficulty: 18,
                archetype: 'CASTER',
                name: 'Sound Sealer',
              },
              logMessage: 'One sealer breaks free and lunges!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Slip Away Unnoticed',
        description: 'SAFE - Avoid confrontation',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You walk away from the suffering. The screams haunt you.',
              logType: 'danger',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'curse_mark_amplifier',
    title: 'Cursed Seal Amplifier',
    description:
      'A dark shrine contains an artifact that radiates cursed power. Veins of shadow pulse from it. Power calls to you.',
    allowedArcs: ['ROGUE_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Embrace the Curse',
        description: 'EXTREME RISK - Power or destruction',
        riskLevel: RiskLevel.EXTREME,
        hintText: 'The darkness has a price...',
        outcomes: [
          {
            weight: 35,
            effects: {
              statChanges: { strength: 2, spirit: 2 },
              exp: 200,
              heatDelta: 5,
              logMessage: 'The curse mark brands itself onto your flesh! Immense power flows, but at what cost?',
              logType: 'loot',
            },
          },
          {
            weight: 35,
            effects: {
              hpChange: { percent: -60 },
              logMessage: 'The curse is too strong! It nearly destroys you from within.',
              logType: 'danger',
            },
          },
          {
            weight: 30,
            effects: {
              exp: 120,
              ryo: 300,
              heatDelta: 30,
              logMessage: 'You resist the curse and seize the artifact. Its power is contained but no longer amplified.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Study the Amplifier',
        description: 'MEDIUM RISK - Learn its secrets',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 1 } },
        outcomes: [
          {
            weight: 75,
            effects: {
              exp: 150,
              statChanges: { intelligence: 3 },
              heatDelta: 5,
              logMessage: 'Your intellect rivals Orochimaru\'s cunning. You understand the curse seal.',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              hpChange: { percent: -25 },
              logMessage: 'The curse\'s backlash burns your mind.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Destroy It',
        description: 'LOW RISK - Remove temptation',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You destroy the shrine. Peace settles over the place.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'valley_vision',
    title: 'Valley of the End Vision',
    description:
      'At the valley\'s edge, memories of a legendary battle surface. The statue of a great shinobi watches silently.',
    allowedArcs: ['ROGUE_ARC'],
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Meditate on the Memory',
        description: 'SAFE - Gain wisdom',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 80,
              statChanges: { calmness: 2, intelligence: 1 },
              hpChange: { percent: 20 },
              chakraChange: { percent: 20 },
              heatDelta: 5,
              logMessage: 'The valley\'s essence teaches you about bonds and sacrifice.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Challenge the Statue',
        description: 'HIGH RISK - Test yourself',
        riskLevel: RiskLevel.HIGH,
        outcomes: [
          {
            weight: 40,
            effects: {
              exp: 180,
              heatDelta: 5,
              logMessage: 'You overcome your inner demons. The statue bows in respect.',
              logType: 'gain',
            },
          },
          {
            weight: 60,
            effects: {
              hpChange: { percent: -35 },
              logMessage: 'The challenge defeats you. You collapse in exhaustion.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Leave Respectfully',
        description: 'SAFE - Honor the fallen',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You leave an offering and depart with honor.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // CHAIN B — "The Abandoned Laboratory" (2 scenes, flag-branched)
  // Scene 1 sets entered_lab + one of {subject_freed, subject_harvested} and
  // chains into the reckoning scene. The branch flag decides its offering:
  // mercy yields a clean reward; harvesting the serum grants a jutsu at the
  // price of a curse (and a chance to lose a bag item).
  // ==========================================================================
  {
    id: 'orochimaru_experiment',
    title: 'The Abandoned Laboratory',
    description:
      'Behind a false wall, one of Orochimaru\'s hideouts festers. A stasis tube glows in the dark, and inside floats a half-formed test subject — still breathing, veined with the Sannin\'s serum.',
    allowedArcs: ['ROGUE_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Free the Subject',
        description: 'MEDIUM RISK - Shatter the tube and free whatever lives inside',
        riskLevel: RiskLevel.MEDIUM,
        hintText: 'Kindness in this place is rarer than the serum.',
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { entered_lab: 1, subject_freed: 1 },
              chainTo: 'orochimaru_experiment_result',
              logMessage: 'You smash the glass. Fluid gushes across the floor as the subject gasps its first free breath.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Harvest the Specimen',
        description: 'HIGH RISK - Extract Orochimaru\'s serum for yourself (needs 22 Intelligence)',
        riskLevel: RiskLevel.HIGH,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 1 } },
        hintText: 'The Sannin\'s gifts always demand flesh in return.',
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { entered_lab: 1, subject_harvested: 1 },
              chainTo: 'orochimaru_experiment_result',
              logMessage: 'You drain the tube into a vial. The subject withers as its serum fills your hand.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Seal the Lab and Leave',
        description: 'SAFE - Collapse the hideout and walk away',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 90,
              intelGain: 15,
              heatDelta: 5,
              logMessage: 'You bring the ceiling down on the whole cursed place and leave it buried.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'orochimaru_experiment_result',
    title: "The Specimen's Reckoning",
    description:
      'The lab\'s hum fades. What you did here in the dark now decides what you carry out of it.',
    allowedArcs: ['ROGUE_ARC'],
    // Reachable only after the lab scene sets entered_lab (chain lookup ignores
    // this gate; it just prevents a standalone appearance without the setup).
    requiresFlags: { entered_lab: 1 },
    choices: [
      {
        // Freed path — the subject repays trust with knowledge. No curse.
        label: 'Earn Its Trust',
        description: 'LOW RISK - The grateful subject shares what it knows',
        riskLevel: RiskLevel.LOW,
        requiresFlags: { subject_freed: 1 },
        outcomes: [
          {
            weight: 75,
            effects: {
              statChanges: { intelligence: 2, spirit: 1 },
              exp: 130,
              hpChange: { percent: 20 },
              intelGain: 20,
              heatDelta: 5,
              logMessage: 'The subject presses a shaking hand to your brow and pours the lab\'s secrets into you before vanishing into the tunnels.',
              logType: 'gain',
            },
          },
          {
            // Advisory T-012: both outcomes were purely positive (no real downside
            // on the "mercy" path).  Reduced the miss EV so the freed route
            // doesn't compound reward risk-free: EV exp 115→107.5, intel 18.75→17.5.
            weight: 25,
            effects: {
              exp: 40,
              intelGain: 10,
              // T-012 A2: "leaving nothing" contradicted the +40 XP / +10 Intel
              // displayed in the What Changed panel.  Rewritten to acknowledge the
              // partial gain while preserving the missed-connection tone.
              logMessage: 'It bolts before it can speak. You catch a sliver of its fear — a direction, a smell, a half-formed image of corridors below.',
              logType: 'info',
            },
          },
        ],
      },
      {
        // Harvested path — inject the stolen serum: power, curse, and a real risk
        // of rejection that costs both HP and a bag item.
        label: 'Inject the Serum',
        description: 'EXTREME RISK - Inject the stolen serum; your body may reject it',
        riskLevel: RiskLevel.EXTREME,
        requiresFlags: { subject_harvested: 1 },
        hintText: 'Orochimaru\'s immortality was never free.',
        outcomes: [
          {
            weight: 55,
            effects: {
              grantSkillById: 'poison_fog',
              curse: { value: 0.5, duration: 3 },
              intelGain: 20,
              heatDelta: 10,
              logMessage: 'The serum rewrites your chakra. Orochimaru\'s poison-fog jutsu is yours now — and so is the cursed hunger that comes with it.',
              logType: 'loot',
            },
          },
          {
            weight: 45,
            effects: {
              curse: { value: 0.5, duration: 3 },
              hpChange: { percent: -35 },
              removeRandomItem: true,
              intelGain: 10,
              logMessage: 'Your body rejects the serum violently. You convulse, blood everywhere, and something in your pack shatters in the seizure.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        // Ungated safe exit for either branch (anti-softlock).
        label: 'Destroy the Serum',
        description: 'SAFE - Grind the vial underfoot and leave',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 70,
              intelGain: 15,
              heatDelta: 5,
              logMessage: 'Whatever you took here, you leave the serum a smear on the floor. Some doors are better shut.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },
];
