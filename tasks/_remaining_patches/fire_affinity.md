# Patch: `fire_affinity` (FIRE_AFFINITY)

Catalog (`docs/combat-tactical-setup-spec.html`): `Conserva +15% daño FIRE, aplicado solo por tag/element FIRE.` Tags: `PASSIVE`, `FIRE`, `UCHIHA`.

Current (`src/game/constants/skills.ts` ~L1518–1540): `passiveEffect.damageBonus: 0.15` + `damageBonusElement: ElementType.FIRE` already correct; description `'+15% Fire damage.'`; **no `tags`**. `actionType: ActionType.PASSIVE` + `requirements.clan: Clan.UCHIHA` already set. Runtime scoping via `StatSystem.aggregatePassiveSkillBonuses` / `resolvePassiveDamageBonus` already FIRE-only (see `StatSystem.test.ts`).

## Plan

- Keep `actionType: ActionType.PASSIVE` (no `cardRole`); do **not** invent `CardRole.PASSIVE`.
- Add `tags: [SkillTag.PASSIVE, SkillTag.FIRE, SkillTag.UCHIHA]` on the skill object.
- Keep `passiveEffect.damageBonus: 0.15` and `damageBonusElement: ElementType.FIRE` unchanged — **no** StatSystem / types work.
- Polish `description` for catalog honesty (scoped to FIRE element/tag, not global).

## Exact fields to set on the skill object

| Field | Value |
|---|---|
| `tags` | `[SkillTag.PASSIVE, SkillTag.FIRE, SkillTag.UCHIHA]` |
| `description` | `'+15% Fire damage (FIRE element/tag only).'` |
| `passiveEffect.damageBonus` | `0.15` (unchanged) |
| `passiveEffect.damageBonusElement` | `ElementType.FIRE` (unchanged) |

Leave unchanged: `id`, `name`, `tier`, `actionType: ActionType.PASSIVE`, costs/cooldowns, combat scalars, `element: ElementType.FIRE`, `requirements: { clan: Clan.UCHIHA }`, no `cardRole`.

## StatSystem / types note

**No runtime change required.** Element-scoped `damageBonusElement` already implements catalog intent. Tags are catalog / filter metadata only for this skill.

Do **not** edit `skills.ts` in this patch file’s authoring step (merge-race avoidance); apply the snippet below in a dedicated skills edit.

## TypeScript snippet — fields to add/change on `FIRE_AFFINITY`

```typescript
    description: '+15% Fire damage (FIRE element/tag only).',
    tags: [SkillTag.PASSIVE, SkillTag.FIRE, SkillTag.UCHIHA],
    // passiveEffect unchanged:
    //   damageBonus: 0.15,
    //   damageBonusElement: ElementType.FIRE,
```

### Diff-only (minimal)

1. `description: '+15% Fire damage.'` → `description: '+15% Fire damage (FIRE element/tag only).'`
2. After `actionType: ActionType.PASSIVE,` insert:
   `tags: [SkillTag.PASSIVE, SkillTag.FIRE, SkillTag.UCHIHA],`

## Out of scope

- Do not change `passiveEffect`, costs, requirements, art, or StatSystem.
- Do not assign any `CardRole`.
