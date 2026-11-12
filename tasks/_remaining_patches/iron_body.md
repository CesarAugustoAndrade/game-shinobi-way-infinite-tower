# Patch: `iron_body` (IRON_BODY)

Catalog (`docs/combat-tactical-setup-spec.html`): `Conserva +5% defensa física; el tooltip nombra la capa exacta.` Tags: `PASSIVE`, `DEFENSE`.

Current (`src/game/constants/skills.ts` ~L1408–1434): `passiveEffect.defenseBonus: 0.05`, description `'+5% Defense (all types).'`, **no `tags`**. `actionType: ActionType.PASSIVE` already set. Runtime (`StatSystem.getPlayerFullStats`) adds `defenseBonus` to **all** percent layers (`physicalDefensePercent`, `elementalDefensePercent`, `mentalDefensePercent`) — dishonest vs catalog physical-only.

## Tag note

`SkillTag.DEFENSE` **does not exist** in `types.ts` (`SkillTag` has TOOL/WEAPON/TAIJUTSU/…/PASSIVE/PHYSICAL/MENTAL/…). Closest catalog mapping: **`SkillTag.PASSIVE` + `SkillTag.PHYSICAL`**. Do **not** add `SkillTag.DEFENSE` in this patch.

## Plan

1. Keep `actionType: ActionType.PASSIVE` (no `cardRole`); do **not** invent `CardRole.PASSIVE`.
2. Add `tags: [SkillTag.PASSIVE, SkillTag.PHYSICAL]`.
3. Keep `passiveEffect.defenseBonus: 0.05`; add scoping so only **`physicalDefensePercent`** receives it (catalog physical honesty).
4. Rewrite `description` to name that exact layer (not “all types”).
5. Extend `PassiveSkillEffect` + `PassiveBonuses` + `StatSystem` apply path; update `StatSystem.test.ts` iron-body expectations (elemental/mental must **not** rise).

## Exact fields to set on the skill object

| Field | Value |
|---|---|
| `tags` | `[SkillTag.PASSIVE, SkillTag.PHYSICAL]` |
| `description` | `'+5% physical defense (physicalDefensePercent).'` |
| `passiveEffect.defenseBonus` | `0.05` (unchanged) |
| `passiveEffect.defenseBonusDamageType` | `DamageType.PHYSICAL` (**new** on `PassiveSkillEffect`) |

Leave unchanged: `id`, `name`, `tier`, `actionType: ActionType.PASSIVE`, costs/cooldowns, combat scalars, `element: ElementType.PHYSICAL`, `requirements`, no `cardRole`.

## StatSystem / types note

**Yes — defense-layer scoping is required.** Today `defenseBonus` is documented and applied as global % to all three defenses. Without a scope field, changing the tooltip to “physical” would lie while elemental/mental still rise.

Suggested shape (implementer):

- `PassiveSkillEffect.defenseBonusDamageType?: DamageType` — when `PHYSICAL` / `ELEMENTAL` / `MENTAL`, aggregate into a layer-scoped bucket; when omitted, keep legacy “all layers” behavior.
- `PassiveBonuses`: keep `defenseBonus` for unscoped; add e.g. `physicalDefenseBonus` / `elementalDefenseBonus` / `mentalDefenseBonus` (or `Partial<Record<DamageType, number>>` excluding TRUE).
- `aggregatePassiveSkillBonuses`: if `effect.defenseBonusDamageType === DamageType.PHYSICAL`, add to physical bucket only (IRON_BODY path).
- `getPlayerFullStats` step 6: apply unscoped `defenseBonus` to all three (cap 65%); apply scoped buckets only to matching `*DefensePercent`.
- Tests: `defenseBonus raises percent defenses on getPlayerFullStats` — with IRON_BODY, assert **only** `physicalDefensePercent` +0.05; elemental/mental unchanged.

Do **not** edit `skills.ts` in this patch file’s authoring step (merge-race avoidance); apply the snippet below in a dedicated skills edit.

## TypeScript snippet — fields to add/change on `IRON_BODY`

```typescript
    description: '+5% physical defense (physicalDefensePercent).',
    tags: [SkillTag.PASSIVE, SkillTag.PHYSICAL],
    passiveEffect: {
      defenseBonus: 0.05,
      defenseBonusDamageType: DamageType.PHYSICAL,
    },
```

### Diff-only (minimal) on `SKILLS.IRON_BODY`

1. `description: '+5% Defense (all types).'` → `description: '+5% physical defense (physicalDefensePercent).'`
2. After `actionType: ActionType.PASSIVE,` insert:
   `tags: [SkillTag.PASSIVE, SkillTag.PHYSICAL],`
3. `passiveEffect`: keep `defenseBonus: 0.05`; add `defenseBonusDamageType: DamageType.PHYSICAL`.

### Companion types/runtime (not skills.ts)

```typescript
// PassiveSkillEffect
defenseBonusDamageType?: DamageType; // scopes defenseBonus to one % defense layer

// PassiveBonuses (example)
physicalDefenseBonus: number; // 0 default
// …or tagged record; elemental/mental mirrors as needed

// StatSystem apply (IRON_BODY):
derived.physicalDefensePercent = Math.min(defCap, derived.physicalDefensePercent + 0.05);
// do NOT add to elementalDefensePercent / mentalDefensePercent
```

## Out of scope

- Do not add `SkillTag.DEFENSE` to the enum.
- Do not assign any `CardRole`.
- Do not change art / `skillArtManifest` / helpText (optional follow-up copy sync).
- Do not change `defenseBonus` magnitude (stays `0.05`).
