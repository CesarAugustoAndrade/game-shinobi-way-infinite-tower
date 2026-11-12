# Patch: `quick_reflexes` (Quick Reflexes)

## Catalog

- **Intent:** Conserva +1 SPD entero; fuera del pool.
- **Tags (catalog):** PASSIVE, SPEED → code: `SkillTag.PASSIVE` + `SkillTag.PHYSICAL` (no `SkillTag.SPEED` member in `types.ts`).
- **PASSIVE rule:** `actionType: ActionType.PASSIVE` only — do **not** set `CardRole.PASSIVE` (enum has no such member).

## Gap

| Field | Current | Target |
|---|---|---|
| `description` | `'+5% Evasion.'` | Honest `'+1 SPD.'` (matches `passiveEffect.statBonus`) |
| `tags` | *(missing)* | `[SkillTag.PASSIVE, SkillTag.PHYSICAL]` |
| `actionType` | `ActionType.PASSIVE` | OK — leave |
| `passiveEffect.statBonus` | `{ speed: 1 }` | OK — leave |

## File

`src/game/constants/skills.ts` — entry `SKILLS.QUICK_REFLEXES` (~L1381–1406).

## Exact TS changes

```ts
  QUICK_REFLEXES: {
    id: 'quick_reflexes',
    name: 'Quick Reflexes',
    tier: SkillTier.BASIC,
    description: '+1 SPD.',
    actionType: ActionType.PASSIVE,
    tags: [SkillTag.PASSIVE, SkillTag.PHYSICAL],
    chakraCost: 0,
    hpCost: 0,
    cooldown: 0,
    currentCooldown: 0,
    baseDamage: 0,
    scalingPerPoint: 0,
    scalingStat: PrimaryStat.SPEED,
    damageType: DamageType.PHYSICAL,
    damageProperty: DamageProperty.NORMAL,
    attackMethod: AttackMethod.AUTO,
    element: ElementType.PHYSICAL,
    requirements: {
      stats: {
        [PrimaryStat.SPEED]: 1,
      },
    },
    passiveEffect: {
      statBonus: { speed: 1 }
    }
  },
```

### Diff-only (minimal)

1. `description: '+5% Evasion.'` → `description: '+1 SPD.'`
2. After `actionType: ActionType.PASSIVE,` insert:
   `tags: [SkillTag.PASSIVE, SkillTag.PHYSICAL],`

## Out of scope

- Do not change `passiveEffect`, costs, requirements, or art.
- Do not add `SkillTag.SPEED` to the enum.
- Do not assign any `CardRole`.
