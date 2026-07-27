import { Clan, GameEvent, PrimaryStat, Rarity, RiskLevel } from '../../types';

/**
 * Land of Waves — moral combat of the tower (Region 1).
 *
 * Spine: meet_tazuna → tazuna_road_mist → protect_bridge → final_showdown_setup
 *         → final_confrontation → gato_defeat
 * Flags:  tazuna_met → bridge_held → compound_breached
 * Side:   waves_mercy / waves_cold, village_defended, inspired_inari, bridge_labor
 * Residual R1: docks_ledger_read / ledger_sabotaged / mist_omen_read /
 *              shipwreck_listened / manor_favor /
 *              false_scales / traveler_route / outpost_cowed /
 *              cove_manifest / black_tide_read (deferred payoffs)
 *
 * Voice: cyber-terror seinen — ledgers, collectors, rationed hunger, bought silence.
 * Posture on choices: hunt / pay / sabotage / leave. Risk legible before the roll.
 */
export const WAVES_ARC_EVENTS: GameEvent[] = [
  {
    id: 'bridge_worker_plea',
    title: "Bridge Worker's Plea",
    mysteryFlavor: 'Ryo buys names back. Silence buys nothing.',
    description:
      "A bridge laborer finds you in the fog. Salt-cracked hands. Eyes that have stopped begging for miracles. \"Mist men took my girl. Gato's cut. They say ryo buys her back.\" The mist does not move. Neither does he.",
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Hunt the Kidnappers',
        description: 'HIGH RISK — Combat likely; save her or bleed for nothing',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Tracks in wet sand. Steel in the dark.',
        outcomes: [
          {
            weight: 50,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 10,
                archetype: 'BALANCED',
                name: 'Mist Kidnappers',
              },
              logMessage: 'You follow the boot-prints into the mist. Steel answers first.',
              logType: 'danger',
            },
          },
          {
            weight: 50,
            effects: {
              exp: 80,
              ryo: 300,
              setFlags: { waves_mercy: 1 },
              logMessage:
                'You cut the ropes before the mist thickens. The father does not thank you with words — only a nod that costs him everything he has left.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Buy Her Freedom',
        description: 'MEDIUM RISK — Pay 200 ryo (needs 14 Intelligence); deal may sour',
        riskLevel: RiskLevel.MEDIUM,
        costs: { ryo: 200 },
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 14 } },
        hintText: 'Coin speaks louder than honor here.',
        outcomes: [
          {
            weight: 70,
            effects: {
              setFlags: { waves_mercy: 1 },
              logMessage:
                'You set terms cold enough to hold. The girl returns at dusk — thinner, silent. The mist keeps the rest.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              logMessage:
                'The bag is taken. The fog swallows the trail. No one can say if she was ever real.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Leave a Purse',
        description: 'SAFE — Give 50 ryo; no rescue promised',
        riskLevel: RiskLevel.SAFE,
        costs: { ryo: 50 },
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage:
                'He pockets the coins without counting on more. In Wave Country, kindness is rationed like rice.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Walk Away',
        description: 'SAFE — Leave without helping',
        riskLevel: RiskLevel.SAFE,
        hintText: 'The road does not judge. The ledger will.',
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { waves_cold: 1 },
              logMessage:
                'His footsteps fade into the fog. Later, something thin and distant breaks the night — then nothing. You walk on unchanged.',
              logType: 'danger',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'mist_ambush_cache',
    title: 'Mist Ninja Cache',
    mysteryFlavor: 'Boot-prints dry slower than the fog admits.',
    description:
      'Behind salt-rotted nets, a Kirigakure cache waits: oilcloth, kunai, rice sealed against damp. Boot-prints still dark in the mud. The fog holds its breath — or someone else is holding theirs.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.RARE,
    choices: [
      {
        label: 'Raid the Cache',
        description: 'HIGH RISK — Loot (~250 ryo) or walk into returning guards',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Greed is loud. Mist men hear loud things.',
        outcomes: [
          {
            weight: 45,
            effects: {
              ryo: 250,
              // T-030: maps unlockCondition for Sunken Ship secret location
              setFlags: { sunken_ship_discovered: 1 },
              logMessage:
                'You take what you can carry. A tide chart, ink still wet, marks a wreck offshore.',
              logType: 'loot',
            },
          },
          {
            weight: 55,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 15,
                archetype: 'BALANCED',
                name: 'Mist Guards',
              },
              logMessage: 'The fog parts. Steel answers. The owners never truly left.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Sabotage Quietly',
        description: 'MEDIUM RISK — Needs 18 Dexterity; ruin supplies, risk a scout',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.DEXTERITY, value: 18 } },
        hintText: 'Cut straps. Spoil grain. Leave no signature.',
        outcomes: [
          {
            weight: 75,
            effects: {
              ryo: 150,
              exp: 60,
              // T-030: smuggler intel unlocks Hidden Cove
              setFlags: { hidden_cove_discovered: 1 },
              logMessage:
                'You ruin their stores without a sound — and overhear a name: a cove the maps do not show.',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 12,
                archetype: 'ASSASSIN',
                name: 'Mist Ninja',
              },
              logMessage: 'A silhouette detaches from the fog. You were never alone.',
              logType: 'danger',
            },
          },
        ],
      },
      // T-041: Uchiha exclusive — Sharingan reads patrol patterns
      {
        label: 'Predict Patrols with Sharingan',
        description: 'CLAN — Uchiha only; safe loot + wreck and cove intel',
        riskLevel: RiskLevel.SAFE,
        requirements: { requiredClan: Clan.UCHIHA },
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 200,
              exp: 50,
              setFlags: { sunken_ship_discovered: 1, hidden_cove_discovered: 1 },
              logMessage:
                'The Sharingan maps their loops. You take what you need and mark a sunken wreck and a hidden cove — then vanish before the fog shifts.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Leave It Untouched',
        description: 'SAFE — No loot, no fight, no trail',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage:
                'You step back into the grey. Some caches are bait. Wave Country thrives on bait.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'tazuna_request',
    title: "Tazuna's Ledger",
    mysteryFlavor: 'Every plank has a price the collectors already know.',
    description:
      'Wet timber. Unpaid wages chalked on a board no one dares erase. Tazuna offers coin for labor on the span — honest work under a dishonest sky. Collectors count boards like teeth; every missing plank is a name they can price.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    requiresFlags: { tazuna_met: 1 },
    excludesFlags: { bridge_labor: 1 },
    choices: [
      {
        label: 'Work the Full Shift',
        description: 'SAFE — Honest labor; guaranteed pay, aching hands',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 200,
              setFlags: { bridge_labor: 1 },
              logMessage:
                'You haul timber until the fog tastes of iron. Pay lands cold in your palm — less than the work, more than the silence.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Negotiate Better Terms',
        description: 'LOW RISK — Needs 16 Intelligence; squeeze the rate or sour the deal',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 16 } },
        hintText: 'Fear talks if you price it carefully.',
        outcomes: [
          {
            weight: 80,
            effects: {
              ryo: 300,
              setFlags: { bridge_labor: 1 },
              logMessage:
                'You name a number that holds. Tazuna flinches, then nods — better a hard bargain than empty planks.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              ryo: 150,
              setFlags: { bridge_labor: 1 },
              logMessage:
                'He pays less out of spite. In Wave, spite is still currency — and the bridge still needs hands.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Decline the Shift',
        description: 'SAFE — Keep your strength; the span waits either way',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage:
                'Tazuna marks nothing on his board. Another name that will not appear among the living wages.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  // Story Events — mini-arc spine
  // meet_tazuna → (chain) tazuna_road_mist → protect_bridge → final_showdown_setup
  // → final_confrontation → gato_defeat
  {
    id: 'meet_tazuna',
    title: 'The Builder on the Pier',
    mysteryFlavor: 'Contracts here are written in fog and unpaid wages.',
    description:
      "Tazuna smells of wet timber and cheap sake. Wave's last working builder does not stand tall — he stands careful. \"Gato wants the bridge unfinished. His killers walk these docks like they own the fog.\" His voice drops. \"Help me reach the span, and I'll tell you what the sea has been swallowing.\"",
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    choices: [
      {
        label: 'Accept the Escort',
        description: 'SAFE — Protect Tazuna; begins the Wave duty chain (+150 ryo, +50 exp)',
        riskLevel: RiskLevel.SAFE,
        hintText: 'A contract written in fear, paid in salt air.',
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 150,
              exp: 50,
              // TASK-R05: unlocks DROWNED_SHRINE; mini-arc: tazuna_met opens bridge / Gato options
              setFlags: { drowned_shrine_discovered: 1, tazuna_met: 1 },
              chainTo: 'tazuna_road_mist',
              logMessage:
                'You take the job. Tazuna grips his saw-bag like a weapon and leads you into the grey.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Press Him for Threats',
        description: 'LOW RISK — Needs 12 Intelligence; intel on Gato / shrine (no escort chain)',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 12 } },
        hintText: 'Fear talks if you give it structure.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 80,
              setFlags: { drowned_shrine_discovered: 1, tazuna_met: 1 },
              logMessage:
                'He maps Gato\'s cutthroats, then the drowned shrine under black water — places no chart admits.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              exp: 20,
              logMessage:
                'His jaw locks. In Wave Country, too many questions buy you a grave with a view of the tide.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Decline Involvement',
        description: 'SAFE — Walk on; the bridge remains someone else\'s problem',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage:
                'Tazuna nods once — the nod of a man who expected nothing. The fog closes over his shoulders.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'tazuna_road_mist',
    title: 'Road Through the Mist',
    description:
      'The path inland is a grey throat. Tazuna walks half a step behind you — not from trust, from habit. Somewhere beyond the trees, hammer-blows mark the unfinished bridge. Closer: wet wood, old blood on a milestone, and the soft absence of birds.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    // Chain target + gated free pool after meeting Tazuna
    requiresFlags: { tazuna_met: 1 },
    excludesFlags: { tazuna_road_done: 1 },
    choices: [
      {
        label: 'Keep Silent Watch',
        description: 'SAFE — Escort without drama; modest exp and intel',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 60,
              intelGain: 15,
              setFlags: { tazuna_road_done: 1 },
              logMessage:
                'You hold the road until the fog thins at the village edge. Tazuna does not praise you. He still breathes. That is the payment.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Scout the Tree Line',
        description: 'MEDIUM RISK — Needs 14 Speed; ambush chance vs. better pay',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.SPEED, value: 14 } },
        hintText: 'Something uses the mist the way fish use water.',
        outcomes: [
          {
            weight: 65,
            effects: {
              exp: 90,
              ryo: 100,
              intelGain: 20,
              setFlags: { tazuna_road_done: 1 },
              logMessage:
                'You flush a lookout from the pines — Gato\'s mark on his pouch. He flees. The road stays yours.',
              logType: 'loot',
            },
          },
          {
            weight: 35,
            effects: {
              setFlags: { tazuna_road_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 11,
                archetype: 'ASSASSIN',
                name: 'Fog Cutthroat',
              },
              logMessage: 'A blade kisses the fog where your neck was. The road wants blood.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Ask What Gato Truly Owns',
        description: 'SAFE — Listen; no fight, quieter lore',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 40,
              intelGain: 25,
              setFlags: { tazuna_road_done: 1 },
              logMessage:
                '"The docks. The food. The fear." Tazuna stares at the grey. "Finish the bridge and we starve him of our silence."',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'protect_village',
    title: 'Collectors on the Boards',
    mysteryFlavor: 'Tax is just hunger wearing a receipt.',
    description:
      "Gato's collectors walk the fishing village like landlords. A door splinters. A mother counts coins she does not have. No one shouts — shouting is a luxury. The mist above the roofs is the same grey as resignation.",
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { village_defended: 1 },
    choices: [
      {
        label: 'Confront the Collectors',
        description: 'HIGH RISK — Fight Gato muscle or scatter them for loot',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Steel on the porch. Eyes on the windows.',
        outcomes: [
          {
            weight: 50,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 12,
                archetype: 'BALANCED',
                name: 'Gato Thugs',
              },
              logMessage: 'You step onto the boards between coin and blade. The village holds its breath.',
              logType: 'danger',
            },
          },
          {
            weight: 50,
            effects: {
              ryo: 200,
              exp: 100,
              setFlags: { village_defended: 1 },
              logMessage:
                'They leave without the tax — and without their cut. A widow presses dried fish into your hands like contraband rations.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Rally the Villagers',
        description: 'MEDIUM RISK — Needs 14 Intelligence; organize a trap',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 14 } },
        hintText: 'Nets, pots, quiet signals — Wave hands can close.',
        outcomes: [
          {
            weight: 75,
            effects: {
              exp: 120,
              ryo: 100,
              setFlags: { village_defended: 1 },
              logMessage:
                'Nets, pots, and quiet signals. The collectors learn Wave hands can close as well as open.',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 10,
                archetype: 'ASSASSIN',
                name: 'Angry Thugs',
              },
              logMessage: 'Someone flinches early. The plan dies. Steel does not.',
              logType: 'danger',
            },
          },
        ],
      },
      // Deferred payoff: mercy elsewhere is remembered on these streets
      {
        label: 'Spend Mercy Like Coin',
        description: 'SAFE — Requires waves_mercy; families open doors without a fight',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { waves_mercy: 1 },
        hintText: 'Word travels faster than collectors when someone was saved.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 90,
              ryo: 80,
              intelGain: 15,
              setFlags: { village_defended: 1 },
              logMessage:
                'A door opens before you knock. "You pulled a girl from the mist." The collectors find the street empty — and suddenly expensive.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred: cooked dock ledgers make the tax run late and loud
      {
        label: 'Exploit the Cooked Ledger',
        description: 'SAFE — Requires ledger_sabotaged; collectors argue over names that no longer match',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { ledger_sabotaged: 1 },
        hintText: 'A wrong sum is a shield if you know where it lies.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 100,
              ryo: 90,
              intelGain: 20,
              setFlags: { village_defended: 1 },
              logMessage:
                'They argue over a name that no longer exists. By the time steel comes out, the street is empty nets and closed shutters.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred: false merchant scales turn the tax into a public arithmetic fight
      {
        label: 'Weigh the False Scales',
        description: 'SAFE — Requires false_scales; prove the cut is theft, not tax',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { false_scales: 1 },
        hintText: 'A crooked weight is a weapon if the street can see it.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 105,
              ryo: 95,
              intelGain: 18,
              setFlags: { village_defended: 1 },
              logMessage:
                'You drop the weighted stone on the porch boards. Villagers count aloud. Collectors leave rather than fight a market that just learned the real numbers.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred punishment: cold hands leave a scent collectors buy
      {
        label: 'Face Your Cold Reputation',
        description: 'HIGH RISK — Requires waves_cold; they already sold your silence',
        riskLevel: RiskLevel.HIGH,
        requiresFlags: { waves_cold: 1 },
        hintText: 'Walking away is a signature. Collectors collect signatures.',
        outcomes: [
          {
            weight: 60,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 14,
                archetype: 'ASSASSIN',
                name: 'Ledger Hunters',
              },
              logMessage:
                'A thug taps a page with your silhouette sketched in charcoal. "Walked past a girl once." Steel is the invoice.',
              logType: 'danger',
            },
          },
          {
            weight: 40,
            effects: {
              exp: 110,
              ryo: 60,
              setFlags: { village_defended: 1 },
              logMessage:
                'You break the page and the men who carried it. The village does not forgive you. It uses you.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Watch from the Shadows',
        description: 'SAFE — Do not intervene; the tax is taken',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              logMessage:
                'Coin changes hands. Doors close. Tomorrow the mist will look the same — and that is the point of tyranny.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'meet_inari',
    title: "Inari's Silence",
    mysteryFlavor: 'Heroes are a tax paid when food runs out.',
    description:
      'A boy sits where the tide leaves its trash. Inari. Too young for a ledger, old enough to know heroes are a tax people pay when they run out of food. He does not look at you. "Gato owns the hunger. The rest is theater."',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { inari_met: 1 },
    choices: [
      {
        label: 'Speak Without Theater',
        description: 'SAFE — No creed; only what the mist already knows',
        riskLevel: RiskLevel.SAFE,
        hintText: 'Silence is rationed here. Do not waste the portion.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 75,
              setFlags: { inari_met: 1, inspired_inari: 1 },
              logMessage:
                'You do not promise victory. You name the price of silence. Something in his shoulders unclenches — not a vow. Attention.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Show What a Body Can Do',
        description: 'LOW RISK — Needs 15 Willpower; skill without spectacle',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.WILLPOWER, value: 15 } },
        hintText: 'A kunai in a post. Breath held. No applause.',
        outcomes: [
          {
            weight: 85,
            effects: {
              exp: 100,
              ryo: 50,
              setFlags: { inari_met: 1, inspired_inari: 1 },
              logMessage:
                'Steel finds wood at a distance that matters. Inari watches the way hungry people watch a locked granary.',
              logType: 'gain',
            },
          },
          {
            weight: 15,
            effects: {
              setFlags: { inari_met: 1 },
              logMessage:
                'He turns away. Grandstanding is another kind of tax, and he has nothing left to pay.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Leave Him the Shore',
        description: 'SAFE — Respect the grief; take nothing',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { inari_met: 1 },
              logMessage:
                'You leave the boy with the tide. Some silences are not invitations.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'protect_bridge',
    title: 'Fog Over the Bridge',
    mysteryFlavor: 'Gato starves the hands that build, not the timber.',
    description:
      'Sea mist swallows the unfinished span. Hammers fall silent mid-strike. Workers freeze on wet planks — not from cold, from the soft pressure of foreign chakra in the grey. Gato does not need to burn a bridge if no one lives to finish it.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.RARE,
    excludesFlags: { bridge_held: 1 },
    choices: [
      {
        label: 'Stand Guard on the Span',
        description: 'HIGH RISK — Ambush combat or scare off assassins (+exp/ryo)',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Hold the boards. Count the silhouettes.',
        outcomes: [
          {
            weight: 45,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 16,
                archetype: 'ASSASSIN',
                name: 'Mist Mercenary',
              },
              logMessage: 'A shadow peels off the fog and aims for a worker\'s spine. You are already moving.',
              logType: 'danger',
            },
          },
          {
            weight: 55,
            effects: {
              exp: 130,
              ryo: 250,
              setFlags: { bridge_held: 1 },
              chainTo: 'final_showdown_setup',
              logMessage:
                'Your stance alone is a message. The mist thins — then gathers again, colder. Something paid better than Gato\'s usual cut is coming.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Clear the Mist with Chakra',
        description: 'MEDIUM RISK — Needs 16 Chakra; expose stalkers or draw them',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.CHAKRA, value: 16 } },
        hintText: 'Push the grey. Count what blinks first.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 110,
              ryo: 150,
              setFlags: { bridge_held: 1 },
              chainTo: 'final_showdown_setup',
              logMessage:
                'You force the grey apart. Figures break and run — then the air drops a degree. The hired fog was only the first invoice.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 14,
                archetype: 'BALANCED',
                name: 'Mist Scout',
              },
              logMessage: 'Your chakra flare is a beacon. A scout answers it with steel.',
              logType: 'danger',
            },
          },
        ],
      },
      // Mini-arc: only after meeting Tazuna — duty-bound hold with stronger terminal reward
      {
        label: 'Hold the Span for Tazuna',
        description: 'LOW RISK — Requires meeting Tazuna; sure defense + stronger pay',
        riskLevel: RiskLevel.LOW,
        requiresFlags: { tazuna_met: 1 },
        hintText: 'A contract kept is rarer than gold in Wave.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 150,
              ryo: 280,
              intelGain: 20,
              setFlags: { bridge_held: 1 },
              chainTo: 'final_showdown_setup',
              logMessage:
                'You plant yourself where the fog is thickest. Workers resume — not bravely, but because the span still needs hands. Then the temperature dies.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred: tide omen maps where the mist will thicken first
      {
        label: 'Trust the Tide Omen',
        description: 'SAFE — Requires mist_omen_read; hold where the grey will pool',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { mist_omen_read: 1 },
        hintText: 'The gulls already died for this map.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 140,
              ryo: 180,
              intelGain: 25,
              setFlags: { bridge_held: 1 },
              chainTo: 'final_showdown_setup',
              logMessage:
                'You stand where the dead birds pointed. Assassins step into a kill-zone of their own fog. The span holds — then the temperature dies.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred: riverside travelers sold a cut of the mist approach
      {
        label: 'Take the Traveler\'s Cut',
        description: 'SAFE — Requires traveler_route; hold the approach they mapped',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { traveler_route: 1 },
        hintText: 'Roads sell silence too — if you paid the right fire.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 135,
              ryo: 170,
              intelGain: 22,
              setFlags: { bridge_held: 1 },
              chainTo: 'final_showdown_setup',
              logMessage:
                'You take the river path the camp marked in ash. Assassins crest into a trap of wet timber and waiting eyes. The span holds — then the temperature dies.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Fall Back to the Perimeter',
        description: 'SAFE — Hold the edge only; small exp, no claim on the span',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 40,
              logMessage:
                'You keep the approaches until the mist thins. The center of the span remains someone else\'s nightmare.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'final_showdown_setup',
    title: 'Ice on the Span',
    mysteryFlavor: 'An invoice paid in silence arrives as ice.',
    description:
      'At the bridgehead the temperature dies. Zabuza rests the executioner blade against wet timber; Haku\'s mirrors bloom like cold wounds in the air. Not theater — an invoice Gato paid in silence, and Wave may still pay in blood.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.RARE,
    // Prefer chain from protect_bridge; free pool only after the span was held
    requiresFlags: { bridge_held: 1 },
    excludesFlags: { mist_showdown: 1 },
    choices: [
      {
        label: 'Challenge Zabuza and Haku',
        description: 'HIGH RISK — Elite combat or break their tempo for heavy reward',
        riskLevel: RiskLevel.HIGH,
        hintText: 'The mirrors do not reflect mercy.',
        outcomes: [
          {
            weight: 50,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 18,
                archetype: 'CASTER',
                name: 'Demonic Ice Mirror Guardian',
              },
              setFlags: { mist_showdown: 1 },
              logMessage: 'Ice closes the world. The mirrors do not reflect mercy.',
              logType: 'danger',
            },
          },
          {
            weight: 50,
            effects: {
              exp: 160,
              ryo: 300,
              setFlags: { mist_showdown: 1 },
              logMessage:
                'You spoil their rhythm before the killing blow lands. For a heartbeat, the mist itself seems unsure.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Read the Senbon Paths',
        description: 'MEDIUM RISK — Needs 18 Speed; slip the needles or get pinned',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.SPEED, value: 18 } },
        hintText: 'Needles prefer the space you just left.',
        outcomes: [
          {
            weight: 75,
            effects: {
              exp: 140,
              ryo: 200,
              setFlags: { mist_showdown: 1 },
              logMessage: 'You move where the needles are not. Haku\'s eyes note it without praise.',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 15,
                archetype: 'ASSASSIN',
                name: 'Haku Phantom',
              },
              setFlags: { mist_showdown: 1 },
              logMessage: 'Silver threads find skin. The phantom is already on you.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Shield Tazuna',
        description: 'SAFE — Body between builder and stray death; modest reward',
        riskLevel: RiskLevel.SAFE,
        hintText: 'Architects finish bridges. Corpses do not.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 60,
              ryo: 100,
              setFlags: { mist_showdown: 1 },
              logMessage:
                'You take the line Tazuna cannot. The bridge still needs its architect more than another corpse.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'final_confrontation',
    title: "Gato's Compound",
    mysteryFlavor: 'Cruelty here is climate-controlled.',
    description:
      "Gato's compound stinks of wet coin and lamp oil. Mercenaries pack the balconies like vultures that learned payroll. Below, the shipping magnate sits small and sharp — a man who bought a country with other people's hunger. The fog outside does not enter. Here, cruelty is climate-controlled.",
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.RARE,
    excludesFlags: { compound_breached: 1 },
    choices: [
      {
        label: 'Storm the Main Gate',
        description: 'HIGH RISK — Fight elite guard or breach for heavy loot',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Hired steel floods the gate.',
        outcomes: [
          {
            weight: 50,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 20,
                archetype: 'BALANCED',
                name: 'Compound Elite Guard',
              },
              logMessage: "Hired steel floods the gate. Gato's fortune has a face — many faces.",
              logType: 'danger',
            },
          },
          {
            weight: 50,
            effects: {
              exp: 200,
              ryo: 400,
              setFlags: { compound_breached: 1 },
              chainTo: 'gato_defeat',
              logMessage:
                'The gate yields. Bodyguards scatter. Gato\'s laugh thins into something almost human: fear.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Infiltrate via the Roof',
        description: 'MEDIUM RISK — Needs 20 Dexterity; silent path or sniper contact',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.DEXTERITY, value: 20 } },
        hintText: 'Rafter dust. One breath. No second chance.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 180,
              ryo: 350,
              setFlags: { compound_breached: 1 },
              chainTo: 'gato_defeat',
              logMessage:
                'Rafter dust and breath held. You hang above the man who priced Wave\'s breath.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              triggerCombat: {
                floor: 0,
                difficulty: 17,
                archetype: 'ASSASSIN',
                name: 'Balcony Sniper',
              },
              logMessage: 'A silhouette on the balcony finds your shadow first.',
              logType: 'danger',
            },
          },
        ],
      },
      // Mini-arc: bridge duty remembered at the compound
      {
        label: 'Strike for the Bridge',
        description: 'SAFE — Requires bridge_held; leverage Wave\'s defiance for sure breach',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { bridge_held: 1 },
        hintText: 'You already denied him the span. Finish the arithmetic.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 220,
              ryo: 320,
              intelGain: 25,
              setFlags: { compound_breached: 1 },
              chainTo: 'gato_defeat',
              logMessage:
                'Word of the held bridge has already chewed the mercenaries\' nerve. They step aside from a fight that smells like unpaid debts.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred: dock ledger sabotage / manor debt open soft doors
      {
        label: 'Walk the Cooked Books',
        description: 'SAFE — Requires ledger_sabotaged; payroll chaos is a key',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { ledger_sabotaged: 1 },
        hintText: 'Mercenaries who cannot find their names cannot find their posts.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 200,
              ryo: 280,
              intelGain: 30,
              setFlags: { compound_breached: 1 },
              chainTo: 'gato_defeat',
              logMessage:
                'Half the balcony is empty — arguing over wages that no longer exist. You walk through a hole in the arithmetic.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Call the Manor\'s Debt',
        description: 'SAFE — Requires manor_favor; the sold house still has keys',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { manor_favor: 1 },
        hintText: 'Portraits remember who signed the bill of sale.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 210,
              ryo: 250,
              intelGain: 25,
              setFlags: { compound_breached: 1 },
              chainTo: 'gato_defeat',
              logMessage:
                'A side gate opens on hinges that should have rusted shut. The manor\'s debt is paid in Gato\'s unlocked spine.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred: cowed outpost opens a quieter approach road
      {
        label: 'Walk the Cowed Road',
        description: 'SAFE — Requires outpost_cowed; bandits look elsewhere tonight',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { outpost_cowed: 1 },
        hintText: 'Fear you planted earlier is still on payroll.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 205,
              ryo: 270,
              intelGain: 28,
              setFlags: { compound_breached: 1 },
              chainTo: 'gato_defeat',
              logMessage:
                'The shortcut from the outpost is empty — dogs silent, posts unmanned. Word of your visit still sits in their throats. You walk into Gato\'s spine unannounced.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred: cove smuggler manifest names a silent service gate
      {
        label: 'Follow the Silent Manifest',
        description: 'SAFE — Requires cove_manifest; service gate opens without a knock',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { cove_manifest: 1 },
        hintText: 'Crates never docked. Gates never logged. Same ink.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 215,
              ryo: 260,
              intelGain: 32,
              setFlags: { compound_breached: 1 },
              chainTo: 'gato_defeat',
              logMessage:
                'A lantern code from the cove still works on the kitchen gate. No payroll. No names. You walk in under freight that was never counted.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Let the Hirelings Recalculate',
        description: 'SAFE — Stare down hirelings; modest exp, no breach flag',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 80,
              logMessage:
                'Hired men measure risk for a living. Your stillness makes a few of them recalculate.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'gato_defeat',
    title: 'After Gato',
    mysteryFlavor: 'Freedom in Wave is quieter than stories promised.',
    description:
      "Gato's ledger is closed. Mercenaries flee like rats that just learned the ship was always sinking. Outside, Wave Country does not cheer at once — it listens for the next boot. The mist remains. Freedom here is quieter than stories promised.",
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.RARE,
    // Only after breach (chain or free pool with flag) — prevents pre-climax treasury
    requiresFlags: { compound_breached: 1 },
    excludesFlags: { gato_settled: 1 },
    choices: [
      {
        label: "Take Gato's Treasury",
        description: 'SAFE — +500 ryo, +150 exp; fund the road ahead',
        riskLevel: RiskLevel.SAFE,
        hintText: 'Coins filled with other people\'s winters. They still spend.',
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 500,
              exp: 150,
              setFlags: { gato_settled: 1 },
              logMessage:
                'You open the coffers he filled with other people\'s winters. The coins are cold. They still spend.',
              logType: 'loot',
            },
          },
        ],
      },
      {
        label: 'Return the Coin to Wave',
        description: 'SAFE — +300 exp, +150 ryo; split the hoard with the starving',
        riskLevel: RiskLevel.SAFE,
        hintText: 'Rice tomorrow beats a speech tonight.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 300,
              ryo: 150,
              setFlags: { gato_settled: 1 },
              logMessage:
                'Hands that never held clean coin close around it carefully. No parade. Just rice tomorrow.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred: Inari watched you without theater
      {
        label: 'Put Inari on the Books',
        description: 'SAFE — Requires inspired_inari; give the boy a future that is not theater',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { inspired_inari: 1 },
        hintText: 'Attention becomes inheritance if someone writes it down.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 260,
              ryo: 100,
              intelGain: 20,
              setFlags: { gato_settled: 1 },
              logMessage:
                'You leave a share where Inari will find it — not as charity, as proof the ledger can be rewritten. He does not smile. He starts counting.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred: village stood
      {
        label: 'Fund the Village First',
        description: 'SAFE — Requires village_defended; repair doors before coffers',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { village_defended: 1 },
        hintText: 'Planks before parades. Hunger before ledgers.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 240,
              ryo: 120,
              setFlags: { gato_settled: 1 },
              logMessage:
                'Planks for doors. Rice for winter. The fishing village does not cheer — it works. That is louder.',
              logType: 'gain',
            },
          },
        ],
      },
      // Deferred: wreck whispers map the true treasury
      {
        label: 'Open the Hold Gato Hid',
        description: 'SAFE — Requires shipwreck_listened; second coffer under false floor',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { shipwreck_listened: 1 },
        hintText: 'The drowned counted crates that never reached the pier.',
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 450,
              exp: 180,
              intelGain: 25,
              setFlags: { gato_settled: 1 },
              logMessage:
                'Under false boards: another winter of other people\'s fish. You take what the wreck already named.',
              logType: 'loot',
            },
          },
        ],
      },
      // Deferred: drowned shrine black tide marks a vault the living ledgers omit
      {
        label: 'Claim the Black Tide Vault',
        description: 'SAFE — Requires black_tide_read; shrine-named coffer under the compound',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { black_tide_read: 1 },
        hintText: 'Gods keep accounts in salt. Gato only rented the margin.',
        outcomes: [
          {
            weight: 100,
            effects: {
              ryo: 420,
              exp: 200,
              intelGain: 30,
              setFlags: { gato_settled: 1 },
              logMessage:
                'A vault seal etched with tide marks only the shrine taught. Inside: winters never taxed, never logged. The mist outside does not cheer.',
              logType: 'loot',
            },
          },
        ],
      },
      // Deferred: cold walk-away costs coin to rewrite
      {
        label: 'Buy Back the Names You Left',
        description: 'SAFE — Requires waves_cold; pay 150 ryo to strike your worst page',
        riskLevel: RiskLevel.SAFE,
        costs: { ryo: 150 },
        requiresFlags: { waves_cold: 1 },
        hintText: 'Some silences can be purchased back. Not cleanly.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 220,
              setFlags: { gato_settled: 1 },
              logMessage:
                'You burn a page that had a girl\'s absence written on it. The ash does not warm anyone. It only stops compounding.',
              logType: 'gain',
            },
          },
        ],
      },
      // Mini-arc terminal: only if you breached after holding the bridge (or compound path)
      {
        label: 'Name the Bridge for the Living',
        description: 'SAFE — Honor the span with heavy exp (bridge was held)',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { bridge_held: 1 },
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 280,
              intelGain: 30,
              setFlags: { gato_settled: 1 },
              logMessage:
                'Planks still wet with salt and work. You leave no speech — only a mark that the span will finish, and that fear is no longer the only currency here.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Walk Into the Mist',
        description: 'SAFE — Leave without ceremony; +250 exp',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 250,
              setFlags: { gato_settled: 1 },
              logMessage:
                'The fog takes you the way it takes every road out of Wave. Behind you, hammers start again — tentative, then steady.',
              logType: 'gain',
            },
          },
        ],
      },
    ],
  },

  // =========================================================================
  // Residual R1 side events — mysterious pressure, deferred flag payoffs
  // docks ledger · mist omen · shipwreck whisper · manor haunt
  // W3: corrupt merchant · riverside travelers · bandit outpost toll
  // W4: hidden cove silent drop · drowned shrine black tide
  // =========================================================================

  {
    id: 'docks_collector_ledger',
    title: "Collector's Ledger",
    mysteryFlavor: 'Someone is already pricing your silence.',
    description:
      'Under a crate of fish that reeks of unpaid debt: a sealed ledger. Names. Amounts. A collector\'s mark still drying. Silence is a line item — and so are you, if the fog prices you before you leave.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { docks_ledger_done: 1 },
    choices: [
      {
        label: 'Investigate the Names',
        description: 'LOW RISK — Needs 12 Intelligence; map who is owned',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 12 } },
        hintText: 'Ink smudges like fingerprints. Fear is neat handwriting.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 70,
              intelGain: 25,
              setFlags: { docks_ledger_done: 1, docks_ledger_read: 1 },
              logMessage:
                'Half the pier is a debt schedule. Bridge wages chalked as "pending silence." You close the book before the fog grows ears.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              setFlags: { docks_ledger_done: 1 },
              logMessage:
                'A boot scrapes behind the crates. The ledger snaps shut. You leave with less than you brought — including anonymity.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Buy the Silence',
        description: 'SAFE — Pay 120 ryo; purchase a blank page for a night',
        riskLevel: RiskLevel.SAFE,
        costs: { ryo: 120 },
        hintText: 'Coin is the only prayer collectors answer.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 40,
              intelGain: 10,
              setFlags: { docks_ledger_done: 1, docks_ledger_read: 1 },
              logMessage:
                'A clerk does not look up as he strikes a column. Your name does not appear — tonight. Tomorrow is another tariff.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Sabotage the Pages',
        description: 'MEDIUM RISK — Needs 14 Dexterity; cook sums, risk a guard',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.DEXTERITY, value: 14 } },
        hintText: 'Wrong totals. Wet ink. No signature.',
        outcomes: [
          {
            weight: 70,
            effects: {
              exp: 90,
              ryo: 80,
              setFlags: { docks_ledger_done: 1, ledger_sabotaged: 1 },
              logMessage:
                'You swap digits the way surgeons swap blades. Somewhere up the chain, a collector will bleed on arithmetic.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              setFlags: { docks_ledger_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 11,
                archetype: 'BALANCED',
                name: 'Dock Collector',
              },
              logMessage: 'Ink stains your sleeve. Steel answers the stain.',
              logType: 'danger',
            },
          },
        ],
      },
      // Natural chain: cross-check bridge wages after meeting Tazuna
      {
        label: 'Cross-Check Tazuna\'s Board',
        description: 'SAFE — Requires tazuna_met; chain into bridge labor ledger',
        riskLevel: RiskLevel.SAFE,
        requiresFlags: { tazuna_met: 1 },
        excludesFlags: { bridge_labor: 1 },
        hintText: 'The builder\'s chalk and Gato\'s ink are the same war.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 50,
              intelGain: 15,
              setFlags: { docks_ledger_done: 1, docks_ledger_read: 1 },
              chainTo: 'tazuna_request',
              logMessage:
                'Bridge wages listed as "pending silence." You take the numbers to the man who still chalks them on wet timber.',
              logType: 'info',
            },
          },
        ],
      },
      {
        label: 'Leave It Closed',
        description: 'SAFE — Walk away; some books bite',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { docks_ledger_done: 1 },
              logMessage:
                'You kick salt over the crate. The ledger keeps counting without you.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'mist_omen_tide',
    title: 'Omen in the Mist',
    mysteryFlavor: 'The fog keeps better maps than the living.',
    description:
      'Something writes in the fog — not words, pressure. A ring of dead gulls. Tide marks higher than any chart. The grey tastes of iron and unfinished contracts.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { mist_omen_done: 1 },
    choices: [
      {
        label: 'Read the Tide Marks',
        description: 'LOW RISK — Needs 13 Intelligence; map where the mist will kill',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 13 } },
        hintText: 'Patterns in salt. Corpses as compass needles.',
        outcomes: [
          {
            weight: 85,
            effects: {
              exp: 80,
              intelGain: 30,
              setFlags: { mist_omen_done: 1, mist_omen_read: 1 },
              logMessage:
                'You memorize the line the tide refuses to cross. Later, on a bridge of wet timber, that line will matter.',
              logType: 'gain',
            },
          },
          {
            weight: 15,
            effects: {
              setFlags: { mist_omen_done: 1 },
              hpChange: { percent: -10 },
              logMessage:
                'The grey presses into your lungs. You leave with a cough and no map — only the knowledge that the mist noticed you.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Offer Blood to the Grey',
        description: 'MEDIUM RISK — Spend HP; buy a thin pact with the fog',
        riskLevel: RiskLevel.MEDIUM,
        hintText: 'Collectors take coin. The mist prefers red.',
        outcomes: [
          {
            weight: 75,
            effects: {
              hpChange: { percent: -15 },
              exp: 100,
              intelGain: 20,
              setFlags: { mist_omen_done: 1, mist_omen_read: 1 },
              logMessage:
                'A palm opens. The fog thickens around the cut like a signature. Something in the grey files your name under "useful."',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              hpChange: { percent: -25 },
              setFlags: { mist_omen_done: 1 },
              logMessage:
                'The mist takes more than you offered. Hunger is not a contract you can renegotiate.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Break the Gull Ring',
        description: 'HIGH RISK — Sabotage the omen; draw whatever set it',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Cut the circle. Make noise. See what answers.',
        outcomes: [
          {
            weight: 45,
            effects: {
              exp: 110,
              ryo: 100,
              setFlags: { mist_omen_done: 1, mist_omen_read: 1 },
              logMessage:
                'Wings scatter under your boot. A scout flees — Gato\'s mark on his pouch. The omen was bait with a payroll.',
              logType: 'loot',
            },
          },
          {
            weight: 55,
            effects: {
              setFlags: { mist_omen_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 13,
                archetype: 'ASSASSIN',
                name: 'Mist Omen Keeper',
              },
              logMessage: 'The circle was a tripwire. Steel answers from the grey.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Walk Past the Ring',
        description: 'SAFE — Leave the dead birds to their geometry',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { mist_omen_done: 1 },
              logMessage:
                'You give the ring a wide berth. Some omens are advertising. You refuse the product.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'shipwreck_whisper',
    title: 'Whispers in the Hold',
    mysteryFlavor: 'The drowned still count crates that never docked.',
    description:
      'Below the waterline, voices count inventory that never left the ship — crates, bribes, names of men who signed for cargo that sank on purpose. Gato\'s seal on a chest that seems to breathe. Salt has turned the wood into a throat; every drip keeps time with the unpaid tally.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { shipwreck_whisper_done: 1 },
    choices: [
      {
        label: 'Follow the Whisper',
        description: 'LOW RISK — Needs 14 Spirit; listen without opening',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.SPIRIT, value: 14 } },
        hintText: 'The drowned keep better books than the living.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 90,
              intelGain: 30,
              setFlags: { shipwreck_whisper_done: 1, shipwreck_listened: 1 },
              logMessage:
                'They count crates that never reached the pier — a second treasury under false floors. You surface with numbers, not gold.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              setFlags: { shipwreck_whisper_done: 1 },
              hpChange: { percent: -12 },
              logMessage:
                'A name that is not yours is spoken twice. Cold water finds your lungs. You kick free before the third.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Pry the Sealed Chest',
        description: 'HIGH RISK — Loot Gato\'s seal or wake the hold',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Grease and greed. Both float.',
        outcomes: [
          {
            weight: 40,
            effects: {
              ryo: 280,
              exp: 70,
              setFlags: { shipwreck_whisper_done: 1, shipwreck_listened: 1 },
              logMessage:
                'The seal cracks. Coin and a tide chart with a second coffer marked in Gato\'s own hand.',
              logType: 'loot',
            },
          },
          {
            weight: 60,
            effects: {
              setFlags: { shipwreck_whisper_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 15,
                archetype: 'TANK',
                name: 'Drowned Hold Guard',
              },
              logMessage: 'The chest was a bell. Something answers from the dark water.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Quiet the Hold',
        description: 'MEDIUM RISK — Needs 15 Calmness; still the voices, risk a rebound',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.CALMNESS, value: 15 } },
        hintText: 'Some debts prefer silence to coin.',
        outcomes: [
          {
            weight: 70,
            effects: {
              exp: 100,
              ryo: 120,
              setFlags: { shipwreck_whisper_done: 1, shipwreck_listened: 1 },
              logMessage:
                'You lay a hand on the wet beam and refuse the count. The hold goes still — and leaves you a name of a false floor.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              setFlags: { shipwreck_whisper_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 12,
                archetype: 'CASTER',
                name: 'Spectral Quartermaster',
              },
              logMessage: 'Silence is an insult to the unpaid. The quartermaster manifests mid-inventory.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Surface Alone',
        description: 'SAFE — Leave the hold to its arithmetic',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { shipwreck_whisper_done: 1 },
              logMessage:
                'Air burns on the way up. Behind you, the counting resumes — patient as tide, accurate as a collector.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'manor_haunt_debt',
    title: "The Manor's Debt",
    mysteryFlavor: 'Not a ghost of revenge — a ghost of accounting.',
    description:
      'A portrait with Gato\'s eyes painted over noble ones; under the varnish, a sale price still bleeds through. The house remembers the deed that stripped it. Footsteps match yours a half-step late — ledger-quiet, not vengeful. Dust settles only where a clerk would stand.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { manor_haunt_done: 1 },
    choices: [
      {
        label: 'Name the Debt',
        description: 'LOW RISK — Needs 14 Spirit; speak the sale into the open air',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.SPIRIT, value: 14 } },
        hintText: 'Houses keep better ledgers than banks.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 95,
              intelGain: 25,
              setFlags: { manor_haunt_done: 1, manor_favor: 1 },
              logMessage:
                'You say the amount the family never received. A door somewhere unlatches. The portrait\'s stolen eyes look away.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              setFlags: { manor_haunt_done: 1 },
              hpChange: { percent: -10 },
              logMessage:
                'The house rejects your tongue. Cold pressure behind the eyes. You leave the name half-said.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Pay the Threshold',
        description: 'SAFE — Leave 80 ryo on the lintel; buy passage, not friendship',
        riskLevel: RiskLevel.SAFE,
        costs: { ryo: 80 },
        hintText: 'Even dead nobility understands a down payment.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 60,
              setFlags: { manor_haunt_done: 1, manor_favor: 1 },
              logMessage:
                'Coin vanishes from the stone as if the house inhaled. A side corridor warms by a degree — enough.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Burn the Portrait',
        description: 'HIGH RISK — Sabotage the painted theft; wake the house',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Fire is a loud editor.',
        outcomes: [
          {
            weight: 40,
            effects: {
              exp: 120,
              ryo: 150,
              setFlags: { manor_haunt_done: 1, manor_favor: 1 },
              logMessage:
                'Gato\'s painted eyes blister first. Under them: a noble face and a floor-plan inked on the canvas reverse — a gate the compound still uses.',
              logType: 'loot',
            },
          },
          {
            weight: 60,
            effects: {
              setFlags: { manor_haunt_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 14,
                archetype: 'CASTER',
                name: 'Manor Debt Shade',
              },
              logMessage: 'Smoke becomes a shape with too many hands. The sale is enforced.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Leave Uninvited',
        description: 'SAFE — Exit before the half-step catches up',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { manor_haunt_done: 1 },
              logMessage:
                'You do not close the door. The house closes it for you — soft, final, a line item filed under unfinished business.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  // ── WAVE3 residual: location-tied mystery (village / camp / outpost) ──────

  {
    id: 'corrupt_merchant_scales',
    title: 'False Scales',
    mysteryFlavor: 'The cut is heavier than the tax admits.',
    description:
      'In the fishing village market, a merchant with Gato\'s seal on his apron weighs rice that always comes up light. Villagers do not argue. Arguing is an item on next week\'s bill. The counterweight is too dark for iron.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { merchant_scales_done: 1 },
    choices: [
      {
        label: 'Investigate the Weight',
        description: 'LOW RISK — Needs 12 Intelligence; prove the cut without steel',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 12 } },
        hintText: 'Lead painted to look like iron. Fear is a denser metal.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 75,
              intelGain: 25,
              setFlags: { merchant_scales_done: 1, false_scales: 1 },
              logMessage:
                'The weight is lead under pewter paint — Gato\'s cut hidden as gravity. You pocket the proof. The merchant\'s smile dies without a sound.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              setFlags: { merchant_scales_done: 1 },
              logMessage:
                'He sweeps the counter clean before you finish. Proof becomes a story. Stories do not hold up in court here — only coin does.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Buy the Honest Cut',
        description: 'SAFE — Pay 90 ryo; purchase a day of real measure',
        riskLevel: RiskLevel.SAFE,
        costs: { ryo: 90 },
        hintText: 'Coin can rent fairness. Not own it.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 45,
              intelGain: 10,
              setFlags: { merchant_scales_done: 1, false_scales: 1 },
              logMessage:
                'He swaps the stone for iron when no one looks. You leave with full rice and a memory of how the false weight felt — denser than any sermon.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Sabotage the Counterweight',
        description: 'MEDIUM RISK — Needs 13 Dexterity; ruin the lie, risk hired muscle',
        riskLevel: RiskLevel.MEDIUM,
        requirements: { minStat: { stat: PrimaryStat.DEXTERITY, value: 13 } },
        hintText: 'Swap the stone. Leave the seal. Let arithmetic do violence.',
        outcomes: [
          {
            weight: 70,
            effects: {
              exp: 90,
              ryo: 70,
              setFlags: { merchant_scales_done: 1, false_scales: 1 },
              logMessage:
                'You trade lead for river stone. Tomorrow every sale will expose him. Villagers will learn the cut had a name.',
              logType: 'gain',
            },
          },
          {
            weight: 30,
            effects: {
              setFlags: { merchant_scales_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 10,
                archetype: 'BALANCED',
                name: 'Merchant\'s Muscle',
              },
              logMessage: 'A hand closes on your wrist. The seal on the apron has teeth.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Walk Past the Stall',
        description: 'SAFE — Leave the market its private gravity',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { merchant_scales_done: 1 },
              logMessage:
                'You do not buy. You do not accuse. The scale keeps lying for people who cannot afford truth.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'riverside_traveler_pact',
    title: 'Ashfire Pact',
    mysteryFlavor: 'Travelers sell roads the way collectors sell silence.',
    description:
      'At the riverside camp, three travelers share a fire that smokes wrong — salt-wood, not river pine. Their maps are drawn on fish-skin. One watches the bridge road the way a creditor watches a door.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { camp_pact_done: 1 },
    choices: [
      {
        label: 'Investigate Their Maps',
        description: 'LOW RISK — Needs 13 Intelligence; read what the ash hides',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 13 } },
        hintText: 'Fish-skin holds ink that water cannot erase.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 80,
              intelGain: 28,
              setFlags: { camp_pact_done: 1, traveler_route: 1 },
              logMessage:
                'Mist approach routes. Patrol gaps. A cut of the bridge road sold three ways. You memorize the line that does not appear on any public chart.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              setFlags: { camp_pact_done: 1 },
              hpChange: { percent: -8 },
              logMessage:
                'A knife rests on the map before your eyes finish. "Curiosity is a tariff." You leave with a shallow cut and no route.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Buy the Road',
        description: 'SAFE — Pay 100 ryo; purchase a mapped approach',
        riskLevel: RiskLevel.SAFE,
        costs: { ryo: 100 },
        hintText: 'Coin opens more doors than blood out here.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 50,
              intelGain: 15,
              setFlags: { camp_pact_done: 1, traveler_route: 1 },
              logMessage:
                'A charcoal line appears on your palm: river cut → span underbelly. They do not wish you luck. Luck is not on the invoice.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Sabotage Their Cache',
        description: 'HIGH RISK — Spoil their stores; risk a camp fight',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Cut straps. Wet the powder. Leave the fire burning.',
        outcomes: [
          {
            weight: 45,
            effects: {
              exp: 100,
              ryo: 110,
              setFlags: { camp_pact_done: 1, traveler_route: 1, hidden_cove_discovered: 1 },
              logMessage:
                'You ruin their night rations — and find a tide scrap naming a cove the maps omit. They will not chase you into the grey.',
              logType: 'loot',
            },
          },
          {
            weight: 55,
            effects: {
              setFlags: { camp_pact_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 12,
                archetype: 'ASSASSIN',
                name: 'Camp Road-Sellers',
              },
              logMessage: 'A boot finds your shadow first. The fire was always a watchtower.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Share the Fire and Leave',
        description: 'SAFE — Warm hands; buy nothing; owe nothing',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { camp_pact_done: 1 },
              logMessage:
                'You take heat without a bargain. They watch you go the way ledgers watch open accounts — patient, unfinished.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'bandit_outpost_toll',
    title: 'Toll of Stakes',
    mysteryFlavor: 'Fear is the only currency that never devalues here.',
    description:
      'Stake walls. War hounds. A captain with Gato\'s coin sewn into his collar counts heads, not names. The toll is not listed — it is whatever makes you smaller before you pass.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { outpost_toll_done: 1 },
    choices: [
      {
        label: 'Investigate the Roster',
        description: 'LOW RISK — Needs 14 Intelligence; learn who is bought, who is hungry',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 14 } },
        hintText: 'Payroll boards crack when the numbers do not match the faces.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 85,
              intelGain: 30,
              setFlags: { outpost_toll_done: 1, outpost_cowed: 1 },
              logMessage:
                'Half the roster is dead men still drawing coin. The living are underpaid and loud about it. You leave knowing which posts will empty first.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              setFlags: { outpost_toll_done: 1 },
              logMessage:
                'A dog growls at your sleeve. The captain smiles without teeth. "Looking is free. Leaving with eyes is not." You leave with less knowledge than you wanted.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Pay the Unwritten Toll',
        description: 'SAFE — Pay 140 ryo; buy a night of empty eyes',
        riskLevel: RiskLevel.SAFE,
        costs: { ryo: 140 },
        hintText: 'Hired men understand receipts better than threats.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 55,
              intelGain: 12,
              setFlags: { outpost_toll_done: 1, outpost_cowed: 1 },
              logMessage:
                'Coin changes hands. Dogs go quiet. A gate that was never open becomes a road. Fear is still the currency — you just paid in metal this once.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Intimidate the Captain',
        description: 'HIGH RISK — Hunt/sabotage posture; cow the post or draw steel',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Make the hounds choose a quieter master.',
        outcomes: [
          {
            weight: 45,
            effects: {
              exp: 120,
              ryo: 90,
              setFlags: { outpost_toll_done: 1, outpost_cowed: 1 },
              logMessage:
                'You do not raise your voice. The captain\'s collar coin catches light as he steps aside. The dogs lie down like paid witnesses.',
              logType: 'loot',
            },
          },
          {
            weight: 55,
            effects: {
              setFlags: { outpost_toll_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 15,
                archetype: 'TANK',
                name: 'Outpost Captain',
              },
              logMessage: 'Pride costs more than coin. Steel answers the shortfall.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Circle the Stakes',
        description: 'SAFE — Leave without paying; take the long wet path',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { outpost_toll_done: 1 },
              logMessage:
                'You give the walls a wide berth. Mud eats your boots. The dogs do not bark — they catalog.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  // ── WAVE4 residual: secret location mystery (cove / drowned shrine) ──────

  {
    id: 'hidden_cove_silent_drop',
    title: 'Silent Drop',
    mysteryFlavor: 'Cargo that never docks still has a schedule.',
    description:
      'At the hidden cove, a skiff idles with no lantern. Crates sealed in oilcloth wait above the high-water line — no crew, only a wet manifest weighted with a stone. Names of boats that never filed harbor. Times written in tide, not clock.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { cove_drop_done: 1 },
    choices: [
      {
        label: 'Read the Manifest',
        description: 'LOW RISK — Needs 14 Intelligence; map the silent schedule',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.INTELLIGENCE, value: 14 } },
        hintText: 'Ink that dries under salt still names a gate.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 95,
              intelGain: 30,
              setFlags: { cove_drop_done: 1, cove_manifest: 1 },
              logMessage:
                'Service gate codes. A kitchen entrance Gato\'s books never list. You pocket the schedule before the skiff\'s wake returns.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              setFlags: { cove_drop_done: 1 },
              hpChange: { percent: -8 },
              logMessage:
                'A boot scrapes rock. The manifest goes under a wave. You leave with wet sleeves and a schedule you half-memorized.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Buy the Drop',
        description: 'SAFE — Pay 110 ryo; purchase a crate and its silence',
        riskLevel: RiskLevel.SAFE,
        costs: { ryo: 110 },
        hintText: 'Smugglers sell absence more than cargo.',
        outcomes: [
          {
            weight: 100,
            effects: {
              exp: 55,
              intelGain: 15,
              setFlags: { cove_drop_done: 1, cove_manifest: 1 },
              logMessage:
                'Coin under a stone. A crate opens on dry rice and a gate sketch. No face appears. The skiff never needed one.',
              logType: 'gain',
            },
          },
        ],
      },
      {
        label: 'Sabotage the Skiff',
        description: 'HIGH RISK — Cut the drop line; risk whoever owns the tide',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Sever the rope. Spoil the ink. Listen for oars.',
        outcomes: [
          {
            weight: 45,
            effects: {
              exp: 115,
              ryo: 130,
              setFlags: { cove_drop_done: 1, cove_manifest: 1 },
              logMessage:
                'The skiff drifts with a holed bilge. Under the last crate: a lantern code for a compound service door. The drop dies quiet.',
              logType: 'loot',
            },
          },
          {
            weight: 55,
            effects: {
              setFlags: { cove_drop_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 14,
                archetype: 'ASSASSIN',
                name: 'Cove Drop Runner',
              },
              logMessage: 'Oars answer the cut rope. Steel prefers quiet buyers.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Leave the Tide Its Cargo',
        description: 'SAFE — Walk the rocks; some schedules are traps',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { cove_drop_done: 1 },
              logMessage:
                'You climb away. Behind you, the stone holds the paper down like a patient clerk.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },

  {
    id: 'drowned_shrine_black_tide',
    title: 'Black Tide Vow',
    mysteryFlavor: 'The altar still accepts payments the living forgot how to name.',
    description:
      'Under the drowned shrine, an altar holds air in a bubble of old chakra. Tide marks climb the pillars in a script no harbor clerk uses — debt lines, not prayers. Something in the dark water expects a signature.',
    allowedArcs: ['WAVES_ARC'],
    rarity: Rarity.COMMON,
    excludesFlags: { shrine_vow_done: 1 },
    choices: [
      {
        label: 'Read the Tide Script',
        description: 'LOW RISK — Needs 15 Spirit; translate salt debt without kneeling',
        riskLevel: RiskLevel.LOW,
        requirements: { minStat: { stat: PrimaryStat.SPIRIT, value: 15 } },
        hintText: 'Pillars keep better vault maps than walls do.',
        outcomes: [
          {
            weight: 80,
            effects: {
              exp: 110,
              intelGain: 32,
              setFlags: { shrine_vow_done: 1, black_tide_read: 1 },
              logMessage:
                'The marks name a compound vault sealed in tide geometry — Gato rents the margin; the shrine owns the key pattern.',
              logType: 'gain',
            },
          },
          {
            weight: 20,
            effects: {
              setFlags: { shrine_vow_done: 1 },
              hpChange: { percent: -12 },
              logMessage:
                'The script presses behind your eyes. You surface with a nosebleed and no map — only the taste of unpaid salt.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Offer Breath to the Altar',
        description: 'MEDIUM RISK — Spend HP; buy a thin vow with the black tide',
        riskLevel: RiskLevel.MEDIUM,
        hintText: 'Coin sinks. Breath is the older currency.',
        outcomes: [
          {
            weight: 75,
            effects: {
              hpChange: { percent: -15 },
              exp: 120,
              intelGain: 22,
              setFlags: { shrine_vow_done: 1, black_tide_read: 1 },
              logMessage:
                'You exhale into the bubble. The water stills — then shows a vault seal etched like a high-tide line. Something files you under "paid."',
              logType: 'gain',
            },
          },
          {
            weight: 25,
            effects: {
              hpChange: { percent: -22 },
              setFlags: { shrine_vow_done: 1 },
              logMessage:
                'The altar takes more breath than you offered. Hunger is not a contract you can renegotiate underwater.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Break the Vow Line',
        description: 'HIGH RISK — Sabotage the altar marks; wake what enforces them',
        riskLevel: RiskLevel.HIGH,
        hintText: 'Scratch the debt. Make noise in a temple that prefers silence.',
        outcomes: [
          {
            weight: 40,
            effects: {
              exp: 130,
              ryo: 160,
              setFlags: { shrine_vow_done: 1, black_tide_read: 1 },
              logMessage:
                'You score the pillar. Under the scraped prayer: a compound vault glyph and a purse of old coin. The water does not forgive — it catalogs.',
              logType: 'loot',
            },
          },
          {
            weight: 60,
            effects: {
              setFlags: { shrine_vow_done: 1 },
              triggerCombat: {
                floor: 0,
                difficulty: 16,
                archetype: 'CASTER',
                name: 'Black Tide Warden',
              },
              logMessage: 'The bubble collapses. Something old answers the broken line.',
              logType: 'danger',
            },
          },
        ],
      },
      {
        label: 'Surface Without Signing',
        description: 'SAFE — Leave the altar its unpaid century',
        riskLevel: RiskLevel.SAFE,
        outcomes: [
          {
            weight: 100,
            effects: {
              setFlags: { shrine_vow_done: 1 },
              logMessage:
                'You kick for air. Behind you, the marks wait — patient as interest.',
              logType: 'info',
            },
          },
        ],
      },
    ],
  },
];
