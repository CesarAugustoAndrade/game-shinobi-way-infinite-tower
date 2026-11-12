# Patch: `chakra_reserves` (CHAKRA_RESERVES)

Catalog (`docs/combat-tactical-setup-spec.html`): `Conserva +3 CP de regeneración por turno; fuera del pool.` Tags: `PASSIVE` (no `CHAKRA` in `SkillTag`).

Current (`src/game/constants/skills.ts`): `passiveEffect.regenBonus: { chakra: 3 }` — **correct**. Description `'+3 CP regen/turn.'` — close. **No `tags`**. `actionType: ActionType.PASSIVE` already keeps it out of the hand via `DeckSystem` / `CardContractSystem` (PASSIVE is **not** a `CardRole`).

## Gap

| Source | Value |
|---|---|
| Catalog | +3 CP regen/turn; fuera del pool. Tags: `PASSIVE`. |
| Code effect | `passiveEffect.regenBonus: { chakra: 3 }` — matches. |
| Code description | `'+3 CP regen/turn.'` — polish only. |
| Code tags | **missing** |
| `SkillTag.CHAKRA` | **does not exist** in `types.ts` (`SkillTag` has PASSIVE, NINJUTSU, elements, clans — no CHAKRA). Omit; do **not** add NINJUTSU (this is a flat reserve passive, not a jutsu technique). |

## Plan

1. Keep `regenBonus: { chakra: 3 }` unchanged (already matches catalog).
2. Add `tags: [SkillTag.PASSIVE]`.
3. Polish `description` to `'+3 CP regen per turn.'` (same meaning; clearer English).
4. Keep `actionType: ActionType.PASSIVE` (no `cardRole`); do **not** invent `CardRole.PASSIVE` or a `SkillTag.CHAKRA`.

## Exact fields to set on the skill object

| Field | Value |
|---|---|
| `tags` | `[SkillTag.PASSIVE]` |
| `description` | `'+3 CP regen per turn.'` |
| `passiveEffect.regenBonus` | `{ chakra: 3 }` (unchanged) |

Leave unchanged: `id`, `name`, `tier`, `actionType: ActionType.PASSIVE`, costs/cooldowns, combat scalars, `scalingStat: PrimaryStat.CHAKRA`, `requirements`, `passiveEffect` body, no `cardRole`.

## Exact TS change

**File:** `src/game/constants/skills.ts`  
**Block:** `SKILLS.CHAKRA_RESERVES`

```diff
   CHAKRA_RESERVES: {
     id: 'chakra_reserves',
     name: 'Chakra Reserves',
     tier: SkillTier.BASIC,
-    description: '+3 CP regen/turn.',
+    description: '+3 CP regen per turn.',
     actionType: ActionType.PASSIVE,
+    tags: [SkillTag.PASSIVE],
     chakraCost: 0,
     hpCost: 0,
     cooldown: 0,
     currentCooldown: 0,
     baseDamage: 0,
     scalingPerPoint: 0,
     scalingStat: PrimaryStat.CHAKRA,
     damageType: DamageType.PHYSICAL,
     damageProperty: DamageProperty.NORMAL,
     attackMethod: AttackMethod.AUTO,
     element: ElementType.PHYSICAL,
     requirements: {
       stats: {
         [PrimaryStat.CHAKRA]: 1,
       },
     },
     passiveEffect: {
       regenBonus: { chakra: 3 }
     }
   },
```

## TypeScript snippet — fields to add/change on `CHAKRA_RESERVES`

```typescript
    description: '+3 CP regen per turn.',
    tags: [SkillTag.PASSIVE],
```

Do **not** edit `skills.ts` in this patch file’s authoring step (merge-race avoidance); apply the snippet above in a dedicated skills edit.

## Out of scope

- No `passiveEffect` / regen formula changes.
- Do not add `SkillTag.CHAKRA` to the enum in this patch.
- `helpText.ts` / art manifests / docs prompts (optional follow-up copy sync).
