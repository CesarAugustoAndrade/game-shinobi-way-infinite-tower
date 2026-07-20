import { Clan, GameEvent, PrimaryStat, Rarity, RiskLevel } from '../../types';

export const EXAMS_ARC_EVENTS: GameEvent[] = [
  {
    id: 'forest_death_trap',
    title: 'Forest of Death Trap',
    description:
      'Kunai attached to wires glint in the shadows. A scroll lies in the center of the clearing—bait for the unwary.',
    allowedArcs: ['EXAMS_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Disarm Trap Carefully',
        description: 'MEDIUM RISK - Requires focus',
        riskLevel: RiskLevel.MEDIUM,
        outcomes: [
          {
            weight: 70,
            effects: {
              ryo: 150,
              logMessage: 'You disarmed the trap and claimed the scroll!',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              hpChange: { percent: -25 },
              logMessage: 'Wire snapped! Kunai grazed your arm.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Rush and Grab',
        description: 'HIGH RISK - Trust your speed',
        riskLevel: RiskLevel.HIGH,
        requirements: { minStat: { stat: PrimaryStat.SPEED, value: 40 } },
        outcomes: [
          {
            weight: 45,
            effects: {
              exp: 80,
              logMessage: 'Lightning-fast reflexes! You snatched it!',
              logType: 'gain',
            },
          },
          {
            weight: 55,
            effects: {
              hpChange: { percent: -40 },
              logMessage: 'The trap activated! Kunai pierced your shoulder!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Burn the Trap',
        description: 'LOW RISK - Destroy from range',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'Fire consumed the trap. The scroll burned too.',
              logType: 'info',
            },
          },
        ],
      },
      // T-041: Hyuga exclusive — Byakugan sees every wire
      {
        label: 'Byakugan Trace the Wires',
        description: 'CLAN - Hyuga near-vision maps every thread',
        riskLevel: RiskLevel.SAFE,
        requirements: { requiredClan: Clan.HYUGA },
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 180,
              exp: 70,
              logMessage:
                'Your Byakugan maps every tension line. You claim the scroll without a scratch.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Avoid It',
        description: 'SAFE',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'Better safe than sorry.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'rival_team_encounter',
    title: 'Rival Team Encounter',
    description:
      'Another team blocks your path in the forest. They want your scroll, and they look prepared for a fight.',
    allowedArcs: ['EXAMS_ARC'],
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Challenge Them to Combat',
        description: 'HIGH RISK - Victory or loss',
        riskLevel: RiskLevel.HIGH,
        outcomes: [
          {
            weight: 50,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 10,
                archetype: 'BALANCED',
                name: 'Rival Team',
              },
              logMessage: 'Combat is inevitable!',
              logType: 'danger',
            },
          },
          {
            weight: 50,
            effects: {
              exp: 100,
              logMessage: 'Your confident aura intimidates them. They back down.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Negotiate a Truce',
        description: 'MEDIUM RISK - Diplomacy or deception',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 15 } },
        outcomes: [
          {
            weight: 65,
            effects: {
              exp: 40,
              logMessage: 'You negotiate a temporary alliance.',
              logType: 'gain',
            },
          },
          {
            weight: 35,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 11,
                archetype: 'BALANCED',
                name: 'Suspicious Rivals',
              },
              logMessage: 'They see through your deception!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Flee into the Forest',
        description: 'LOW RISK - Escape without fighting',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 80,
            effects: {
              logMessage: 'You slip away into the dense forest.',
              logType: 'info',
            },
          },
          {
            weight: 20,
            effects: {
              hpChange: { percent: -15 },
              logMessage: 'They throw weapons as you flee. One grazes your back.',
              logType: 'danger',
            },
          },
        ],
      },
      // T-041: Lee disciple exclusive — pure taijutsu intimidation
      {
        label: 'Open Gates Posture (Lee)',
        description: 'CLAN - Leaf Disciple pressure without drawing a kunai',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { requiredClan: Clan.LEE },
        outcomes: [
          {
            weight: 85,
            effects: {
              exp: 90,
              statChanges: { strength: 1, speed: 1 },
              logMessage:
                'Your blazing taijutsu stance freezes the rivals. They yield the path without a fight.',
              logType: 'gain',
            },
          },
          {
            weight: 15,
            effects: {
              hpChange: { percent: -10 },
              logMessage: 'They call your bluff and strike. You shrug it off and push through.',
              logType: 'danger',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'giant_serpent_nest',
    title: 'Giant Serpent Nest',
    description:
      'A massive nest of giant snakes blocks the path. The air smells of venom. Legends say they guard treasure here.',
    allowedArcs: ['EXAMS_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Challenge the Serpents',
        // T-012 A2: swapped from 30/70 (combat/prize) to 65/35 so EXTREME carries
        // a majority-downside.  EV prize path: 35% × (200exp+500ryo).  Players who
        // survive the combat still earn the reward, so the upside stays legendary —
        // it just isn't handed for free 70% of the time.
        description: 'EXTREME RISK - The serpents will fight back; survivors claim legendary loot',
        riskLevel: RiskLevel.EXTREME,
        hintText: 'Only the truly brave (or foolish) dare this.',
        outcomes: [
          {
            weight: 65,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 25,
                archetype: 'TANK',
                name: 'Giant Serpents',
              },
              logMessage: 'The serpents coil and strike — this will be a fight!',
              logType: 'danger',
            },
          },
          {
            weight: 35,
            effects: {
              exp: 200,
              ryo: 500,
              logMessage: 'You hold your ground and the serpents hesitate, then yield. Their hoard gleams untouched in the hollow.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Move Carefully Around',
        description: 'MEDIUM RISK - Stealth approach',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.DEXTERITY, value: 20 } },
        outcomes: [
          {
            weight: 75,
            effects: {
              exp: 60,
              logMessage: 'You slip past the serpents without disturbing them.',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              hpChange: { percent: -30 },
              logMessage: 'A serpent nearly catches you! Venom burns your leg.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Leave This Place',
        description: 'SAFE - Avoid danger',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You avoid the serpents but wonder what treasures were left behind.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'scroll_merchant',
    title: 'Forbidden Scroll Merchant',
    description:
      'A mysterious hooded figure emerges from the trees. "Rare scrolls, forbidden jutsu, hidden knowledge... for the right price."',
    allowedArcs: ['EXAMS_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Buy a Forbidden Technique',
        description: 'HIGH RISK - Power at a cost',
        riskLevel: RiskLevel.HIGH,
        costs: { ryo: 300 },
        requirements: { minStat: { stat: PrimaryStat.SPIRIT, value: 18 } },
        outcomes: [
          {
            weight: 100,
            effects: {
              statChanges: { spirit: 3, intelligence: 2 },
              exp: 80,
              logMessage: 'The forbidden jutsu awakens new power within you!',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Buy Information',
        description: 'MEDIUM RISK - Knowledge is power',
        riskLevel: RiskLevel.MEDIUM,
        costs: { ryo: 100 },
        outcomes: [
          {
            weight: 70,
            effects: {
              exp: 100,
              logMessage: 'The merchant reveals the location of a hidden shortcut.',
              logType: 'loot',
            },
          },
          {
            weight: 30,
            effects: {
              logMessage: 'The information is worthless. You feel cheated.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Refuse and Move On',
        description: 'SAFE - Trust no one',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'You avoid the merchant\'s temptations.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },
];
