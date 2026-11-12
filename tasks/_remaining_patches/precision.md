# Remaining patch — `precision`

## Gap

| Source | Claim |
|--------|--------|
| Catalog `#catalogo` | PASSIVE · tags `PASSIVE` + `PRECISION` · **Conserva +1 ACC entero; fuera del pool.** |
| Code `SKILLS.PRECISION` | `passiveEffect.statBonus: { accuracy: 1 }` ✅ |
| Code description | `'+5% Critical Chance.'` ❌ lies vs effect |
| Code tags | missing |
| `SkillTag` (`types.ts`) | `PASSIVE` exists; **`PRECISION` does not** |

## Plan

1. Keep `statBonus: { accuracy: 1 }` (catalog: integer +1 ACC).
2. Rewrite `description` to honest +1 ACC (not crit %).
3. Add `tags: [SkillTag.PASSIVE]` only — do **not** invent `SkillTag.PRECISION`.
4. No pool / draw changes: `actionType: PASSIVE` already keeps it out of the playable hand pool.
5. No `types.ts` enum expansion in this patch (OOS).

## Exact TS changes (`src/game/constants/skills.ts` · `PRECISION`)

```ts
// BEFORE
description: '+5% Critical Chance.',
actionType: ActionType.PASSIVE,
// … no tags …

// AFTER
description: '+1 ACC. Passive; out of playable pool.',
actionType: ActionType.PASSIVE,
tags: [SkillTag.PASSIVE],
```

Full keyed block after patch (unchanged fields omitted with `…`):

```ts
PRECISION: {
  id: 'precision',
  name: 'Precision',
  tier: SkillTier.BASIC,
  description: '+1 ACC. Passive; out of playable pool.',
  actionType: ActionType.PASSIVE,
  tags: [SkillTag.PASSIVE],
  // … costs/cooldowns/damage scaffolding unchanged …
  passiveEffect: {
    statBonus: { accuracy: 1 }
  }
},
```

## Out of scope

- Adding `SkillTag.PRECISION` to `types.ts`
- Crit-chance redesign
- Editing art / catalog HTML
