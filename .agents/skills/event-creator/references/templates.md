# Plantillas de eventos

TypeScript copiable que tipa contra el modelo real (`GameEvent`/`EventChoice`/`EventOutcome` en
`src/game/types.ts`). Todos los archivos de arco importan igual:

```typescript
import { GameEvent, PrimaryStat, Rarity, RiskLevel } from '../../types';
```

Índice:
1. Evento simple (una escena, salida garantizada).
2. Cadena multi-escena (`chainTo` + `setFlags`, con eslabón terminal).
3. Evento gateado (`requiresFlags` + `excludesFlags`).

---

## 1. Evento simple

Una escena, outcomes ponderados que suman 100, un choice gateado por `minStat` (se muestra
deshabilitado si no se cumple) y un choice `SAFE` de salida.

```typescript
{
  id: 'roadside_shrine',
  title: 'Roadside Shrine',
  description:
    'A weathered stone shrine stands beside the path, an offering bowl worn smooth at its base.',
  allowedArcs: ['WAVES_ARC'],
  rarity: Rarity.COMMON,
  choices: [
    {
      label: 'Leave an Offering',
      description: 'SAFE — Spend a little Ryō for a small blessing',
      riskLevel: RiskLevel.SAFE,
      costs: { ryo: 50 },
      outcomes: [
        {
          weight: 100,
          effects: {
            hpChange: { percent: 25 },
            exp: 30,
            intelGain: 10,
            logMessage: 'A warm calm settles over you. Your wounds knit shut.',
            logType: 'gain',
          },
        },
      ],
    },
    {
      label: 'Pray for Strength',
      description: 'LOW RISK — Focus your spirit (needs 14 Spirit)',
      riskLevel: RiskLevel.LOW,
      requirements: { minStat: { stat: PrimaryStat.SPIRIT, value: 14 } },
      outcomes: [
        {
          weight: 70,
          effects: {
            statChanges: { spirit: 1 },
            exp: 40,
            intelGain: 10,
            logMessage: 'The kami answer. Your spirit swells with quiet power.',
            logType: 'gain',
          },
        },
        {
          weight: 30,
          effects: {
            exp: 20,
            intelGain: 5,
            logMessage: 'The shrine is silent, but the meditation steadies you.',
            logType: 'info',
          },
        },
      ],
    },
    {
      label: 'Walk On',
      description: 'SAFE — No risk',
      riskLevel: RiskLevel.SAFE,
      outcomes: [
        {
          weight: 100,
          effects: {
            logMessage: 'You bow your head and continue down the road.',
            logType: 'info',
          },
        },
      ],
    },
  ],
}
```

---

## 2. Cadena multi-escena (`chainTo` + flags)

Escena A pone un flag (`setFlags`) y encadena (`chainTo`) a la escena B, gateada con `requiresFlags`.
Los choices de la escena B **no** llevan `chainTo` → terminan y cierran la sala. Los flags escritos en
A son visibles al gatear B porque `handleEventChoice` persiste el player antes de encadenar.

```typescript
// --- Escena A (entrada): encadena hacia el pacto ---
{
  id: 'masked_stranger_offer',
  title: 'The Masked Stranger',
  description:
    'A masked figure blocks the trail. "I can teach you a forbidden technique — if you prove your resolve."',
  allowedArcs: ['ROGUE_ARC'],
  rarity: Rarity.RARE,
  choices: [
    {
      label: 'Hear the Terms',
      description: 'MEDIUM RISK — Follow the stranger deeper into the trees',
      riskLevel: RiskLevel.MEDIUM,
      outcomes: [
        {
          weight: 100,
          effects: {
            setFlags: { met_stranger: 1 },
            chainTo: 'masked_stranger_pact', // abre la escena B en vez de cerrar la sala
            logMessage: 'You follow the stranger into the shadow of the pines...',
            logType: 'info',
          },
        },
      ],
    },
    {
      label: 'Refuse and Leave',
      description: 'SAFE — Keep your distance',
      riskLevel: RiskLevel.SAFE,
      outcomes: [
        {
          weight: 100,
          effects: {
            logMessage: 'You turn your back on the offer and walk away.',
            logType: 'info',
          },
        },
      ],
    },
  ],
},

// --- Escena B (destino de la cadena): gateada por met_stranger, cierra la sala ---
{
  id: 'masked_stranger_pact',
  title: 'The Forbidden Pact',
  description:
    'The stranger unrolls a scroll pulsing with dark chakra. "Accept the mark, and the technique is yours."',
  allowedArcs: ['ROGUE_ARC'],
  requiresFlags: { met_stranger: 1 }, // solo alcanzable a través de la escena A
  choices: [
    {
      label: 'Accept the Mark',
      description: 'HIGH RISK — Gain a jutsu, but bear a curse',
      riskLevel: RiskLevel.HIGH,
      outcomes: [
        {
          weight: 100,
          effects: {
            grantSkillById: 'phoenix_flower', // Skill.id real de SKILLS (src/game/constants/skills.ts)
            curse: { value: 0.4, duration: 3 }, // trade-off legible: poder por daño extra
            setFlags: { took_pact: 1 },
            intelGain: 15,
            logMessage: 'Power floods you — and a burning mark sears itself into your skin.',
            logType: 'danger',
          },
        },
      ],
    },
    {
      label: 'Reject the Pact',
      description: 'SAFE — Refuse the mark and its price',
      riskLevel: RiskLevel.SAFE,
      outcomes: [
        {
          weight: 100,
          effects: {
            setFlags: { refused_pact: 1 },
            intelGain: 5,
            logMessage: 'You step back from the scroll. Some power is not worth the price.',
            logType: 'info',
          },
        },
      ],
    },
  ],
},
```

---

## 3. Evento gateado (`requiresFlags` + `excludesFlags`)

Callback que solo aparece si el jugador aceptó el pacto (`took_pact`) y aún no lo purgó
(`mark_purged`). Muestra gating a nivel de evento, un choice con `minStat`, y un outcome terminal que
cierra la sala (sin `chainTo`).

```typescript
{
  id: 'the_marks_price',
  title: "The Mark's Price",
  description:
    'The cursed mark flares as an old enemy of the stranger confronts you. "You carry his curse. Then you share his enemies."',
  allowedArcs: ['ROGUE_ARC'],
  requiresFlags: { took_pact: 1 },   // solo si aceptó el pacto en la cadena anterior
  excludesFlags: { mark_purged: 1 }, // ...y no lo ha purgado ya
  choices: [
    {
      label: 'Purge the Mark',
      description: 'HIGH RISK — Rip the curse out by force (needs 16 Willpower)',
      riskLevel: RiskLevel.HIGH,
      requirements: { minStat: { stat: PrimaryStat.WILLPOWER, value: 16 } },
      outcomes: [
        {
          weight: 60,
          effects: {
            setFlags: { mark_purged: 1 },
            hpChange: { percent: -20 },
            intelGain: 20,
            logMessage: 'Agony — then relief. The mark blackens, cracks, and is gone.',
            logType: 'gain',
          },
        },
        {
          weight: 40,
          effects: {
            hpChange: { percent: -35 },
            intelGain: 10,
            logMessage: 'The mark resists. It clings deeper than before, feeding on your effort.',
            logType: 'danger',
          },
        },
      ],
    },
    {
      label: 'Embrace It',
      description: 'SAFE — Keep the power and the pain',
      riskLevel: RiskLevel.SAFE,
      outcomes: [
        {
          weight: 100,
          effects: {
            intelGain: 5,
            logMessage: 'You let the mark burn. The power is worth the price — for now.',
            logType: 'info',
          },
        },
      ],
    },
  ],
}
```
