import { GameEvent, PrimaryStat, Rarity, RiskLevel } from '../../types';

export const WAR_ARC_EVENTS: GameEvent[] = [
  {
    id: 'white_zetsu_paranoia',
    title: 'White Zetsu Paranoia',
    description:
      'Everything looks normal, but something feels wrong. Shadows move independently. Are these clones of the White Zetsu surrounding you?',
    allowedArcs: ['WAR_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Attack Preemptively',
        description: 'HIGH RISK - Strike first or strike nothing',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Paranoia can be a weapon... or a trap.',
        outcomes: [
          {
            weight: 40,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 22,
                archetype: 'BALANCED',
                name: 'White Zetsu Army',
              },
              logMessage: 'Your attacks awaken the clones!',
              logType: 'danger',
            },
          },
          {
            weight: 35,
            effects: {
              exp: 150,
              heatDelta: 5,
              logMessage: 'Your instinct was right! You destroy the clones before they can act.',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              hpChange: { percent: -20 },
              logMessage: 'You attack nothing. Your paranoia exhausts you.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Wait and Observe',
        description: 'MEDIUM RISK - Patience tests your nerves',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.CALMNESS, value: 1 } },
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 100,
              heatDelta: 5,
              logMessage: 'Your patience reveals the truth. The clones materialize and you destroy them calmly.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 20,
                archetype: 'ASSASSIN',
                name: 'White Zetsu',
              },
              logMessage: 'They attack first!',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Flee Through the Chaos',
        description: 'LOW RISK - Don\'t engage',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 90,
            effects: {
              logMessage: 'You run. Cowardice tastes bitter.',
              logType: 'danger',
            },
          },
          {
            weight: 10,
            effects: {
              hpChange: { percent: -15 },
              logMessage: 'A clone catches you as you flee!',
              logType: 'danger',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'bijuu_chakra_fragment',
    title: 'Bijuu Chakra Fragment',
    description:
      'Broken divine tree roots glow with immense chakra. A shard of Bijuu power rests here, pulsing with infinite potential.',
    allowedArcs: ['WAR_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Absorb the Chakra',
        description: 'EXTREME RISK - God-like power or annihilation',
        riskLevel: RiskLevel.EXTREME,
        hintText: 'Only legends speak of surviving this...',
        outcomes: [
          {
            weight: 30,
            effects: {
              statChanges: { chakra: 3, spirit: 3, willpower: 3 },
              exp: 300,
              heatDelta: 5,
              logMessage: 'The Bijuu power floods through you! You are forever changed.',
              logType: 'loot',
            },
          },
          {
            weight: 50,
            effects: {
              hpChange: { percent: -80 },
              logMessage: 'The power is too great! Your body burns from the inside.',
              logType: 'danger',
            },
          },
          {
            weight: 20,
            effects: {
              exp: 180,
              statChanges: { chakra: 2 },
              heatDelta: 5,
              logMessage: 'You carefully extract a small portion of the chakra.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Contain It Safely',
        description: 'MEDIUM RISK - Scientific approach',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 1 } },
        outcomes: [
          {
            weight: 70,
            effects: {
              exp: 200,
              ryo: 500,
              statChanges: { intelligence: 3 },
              heatDelta: 30,
              logMessage: 'Your brilliant technique safely harnesses the chakra!',
              logType: 'loot',
            },
          },
          {
            weight: 30,
            effects: {
              hpChange: { percent: -30 },
              logMessage: 'Your containment fails. Bijuu chakra overwhelms you.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Leave It for the Gods',
        description: 'SAFE - Respect boundaries',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage: 'Some power is not meant for mortal hands.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // CHAIN A — "The Reanimated Envoy" (2 scenes, flag-branched)
  // Scene 1 sets met_envoy + one of {envoy_freed, envoy_bound} and chains into
  // the fate scene. The branch flag decides which choice the fate scene offers.
  // The freed path is later remembered by 'envoy_gratitude_repaid'.
  // ==========================================================================
  {
    id: 'reanimated_envoy',
    title: 'The Reanimated Envoy',
    description:
      'A shinobi with cracked, ash-grey skin lowers his weapon. For a heartbeat the Edo Tensei loosens its grip and his eyes clear. "Kabuto binds me against my will. Free me... or use me. Choose quickly."',
    allowedArcs: ['WAR_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Sever the Tether',
        description: 'MEDIUM RISK - Break Kabuto\'s contract and set his soul free',
        riskLevel: RiskLevel.MEDIUM,
        hintText: 'A freed spirit does not forget mercy.',
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { met_envoy: 1, envoy_freed: 1 },
              chainTo: 'reanimated_envoy_fate',
              logMessage: 'You disrupt the sealing tags. The envoy sags in relief as his own will returns.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Bind Him to Your Will',
        description: 'HIGH RISK - Seize the reanimation for yourself (needs 20 Intelligence)',
        riskLevel: RiskLevel.HIGH,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 1 } },
        hintText: 'Stolen power is never freely given.',
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { met_envoy: 1, envoy_bound: 1 },
              chainTo: 'reanimated_envoy_fate',
              logMessage: 'You overwrite Kabuto\'s seals with your own. The envoy stiffens, now yours to command.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Shatter the Reanimation',
        description: 'SAFE - Put the tormented soul to rest',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 90,
              intelGain: 15,
              heatDelta: 5,
              logMessage: 'You destroy the vessel. The soul dissolves with a whisper of thanks.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'reanimated_envoy_fate',
    title: "The Envoy's Fate",
    description:
      'The dust settles around the reanimated shinobi. What passes between you now will not be undone.',
    allowedArcs: ['WAR_ARC'],
    // Reachable only after the entry scene sets met_envoy (chain lookup ignores
    // this gate, so the chain always opens it; it just cannot appear standalone).
    requiresFlags: { met_envoy: 1 },
    choices: [
      {
        // Only offered on the freed path — a clean, un-cursed gift.
        label: 'Accept His Blessing',
        description: 'SAFE - Receive the grateful spirit\'s protective art',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { envoy_freed: 1 },
        outcomes: [
          {
            weight: 100,
            effects: {
              grantSkillById: 'suijinheki',
              exp: 120,
              intelGain: 20,
              heatDelta: 10,
              logMessage: 'The freed shinobi presses his water-wall technique into your hands before fading. A gift, not a price.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        // Only offered on the bound path — power, but the soul fights back.
        label: 'Tear the Technique From Him',
        description: 'HIGH RISK - Rip his forbidden flame jutsu loose; the bound soul resists',
        riskLevel: RiskLevel.HIGH,
        requiresFlags: { envoy_bound: 1 },
        hintText: 'What you take by force leaves a mark.',
        outcomes: [
          {
            weight: 65,
            effects: {
              grantSkillById: 'dragon_flame',
              curse: { value: 0.4, duration: 3 },
              intelGain: 20,
              heatDelta: 10,
              logMessage: 'You wrench the dragon-flame jutsu from his memory. It burns into you — and so does his hatred, a curse riding your chakra.',
              logType: 'danger',
            },
          },
          {
            weight: 35,
            effects: {
              curse: { value: 0.5, duration: 3 },
              hpChange: { percent: -25 },
              intelGain: 10,
              logMessage: 'The soul lashes out as it dies. You seize nothing but its curse and a torn shoulder.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        // Ungated safe exit — always available on either branch (anti-softlock).
        label: 'Let Him Fade',
        description: 'SAFE - Release him and walk away',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 60,
              intelGain: 10,
              heatDelta: 5,
              logMessage: 'You ask nothing of him. The envoy bows once and crumbles to ash.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // PERSISTENT CONSEQUENCE — remembers the freed envoy from Chain A.
  // Only appears once (excludesFlags) and only if the player freed him.
  // ==========================================================================
  {
    id: 'envoy_gratitude_repaid',
    title: 'A Debt Remembered',
    description:
      'A living kunoichi steps from the ruined trench and salutes you. "You freed my captain\'s soul on the eastern line. His unit does not forget. Take what we can spare."',
    allowedArcs: ['WAR_ARC'],
    requiresFlags: { envoy_freed: 1 },
    excludesFlags: { envoy_debt_settled: 1 },
    choices: [
      {
        // Advisory T-012: was a zero-variance SAFE with 450 ryo + 100 exp — higher
        // than any other SAFE outcome in WAR_ARC.  Added 65/35 split so the debt
        // pays well when the cache is plentiful, and modestly when the unit is
        // depleted.  riskLevel → LOW to match the real variance.
        // EV: 0.65×280 + 0.35×80 = 182+28 = 210 ryo  |  0.65×60 + 0.35×30 = 49.5 exp
        label: 'Accept the War Cache',
        description: 'LOW RISK - The freed captain\'s unit rewards your mercy; the cache may be light',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 65,
            effects: {
              ryo: 280,
              exp: 60,
              intelGain: 20,
              setFlags: { envoy_debt_settled: 1 },
              heatDelta: 30,
              logMessage: 'They hand you a cache of ration seals and Ryō. Mercy, it seems, compounds.',
              logType: 'loot',
            },
          },
          {
            weight: 35,
            effects: {
              ryo: 80,
              exp: 30,
              intelGain: 10,
              setFlags: { envoy_debt_settled: 1 },
              heatDelta: 10,
              logMessage: 'The cache is nearly empty — the unit has little left to give — but they share what remains without hesitation.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Ask for Their Blade',
        description: 'LOW RISK - Request a war-forged weapon (needs 18 Strength)',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.STRENGTH, value: 1 } },
        outcomes: [
          {
            weight: 70,
            effects: {
              statChanges: { strength: 2 },
              exp: 120,
              intelGain: 20,
              setFlags: { envoy_debt_settled: 1 },
              heatDelta: 5,
              logMessage: 'They gift you their captain\'s blade. Its weight settles into your grip like it was forged for you.',
              logType: 'gain',
            },
          },
          {
            // T-012 A2: added hpChange -10% so the 30% fail path has a real
            // downside and justifies LOW risk.  The borrowed blade slips on an
            // unfamiliar grip — a lesson paid in blood.
            weight: 30,
            effects: {
              exp: 60,
              intelGain: 10,
              hpChange: { percent: -15 },
              setFlags: { envoy_debt_settled: 1 },
              heatDelta: 5,
              logMessage: 'The good steel is already spoken for. As you inspect their spare blade it slips — a shallow cut, but a reminder that borrowed steel demands respect.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Decline the Reward',
        description: 'SAFE - Some debts are not meant to be collected',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 40,
              intelGain: 15,
              setFlags: { envoy_debt_settled: 1 },
              heatDelta: 5,
              logMessage: 'You wave off the cache. The kunoichi bows deeper for the refusal than any gift could earn.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // STANDALONE — battlefield salvage with a legible removeRandomItem trade-off.
  // ==========================================================================
  {
    id: 'scavengers_field',
    title: "The Scavenger's Field",
    description:
      'A field of fallen shinobi stretches under the divine tree\'s roots. Gear glints among the bodies — but the enemy is fond of leaving explosive tags on the dead.',
    allowedArcs: ['WAR_ARC'],
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Loot the Fallen',
        description: 'HIGH RISK - Strip the dead for salvage; some corpses are booby-trapped',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Greed and buried tags make poor company.',
        outcomes: [
          {
            weight: 55,
            effects: {
              ryo: 350,
              exp: 60,
              intelGain: 20,
              heatDelta: 30,
              logMessage: 'You work fast and clean, filling your pouch with sealed scrolls and coin.',
              logType: 'loot',
            },
          },
          {
            weight: 45,
            effects: {
              removeRandomItem: true,
              hpChange: { percent: -20 },
              intelGain: 10,
              logMessage: 'An explosive tag detonates as you lift a corpse. The blast scorches you and destroys something in your pack.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Salvage Only What\'s Safe',
        description: 'LOW RISK - Take only the obvious, undisturbed spoils',
        riskLevel: RiskLevel.LOW,
        outcomes: [
          {
            weight: 80,
            effects: {
              ryo: 120,
              intelGain: 15,
              heatDelta: 20,
              logMessage: 'You pocket the loose coin and leave the rest untouched.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              intelGain: 10,
              logMessage: 'Others picked the field clean before you. Little remains.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Honor the Dead and Move On',
        description: 'SAFE - Leave the fallen in peace',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 50,
              intelGain: 10,
              heatDelta: 5,
              logMessage: 'You close their eyes and press on. The living still need you.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },
];
