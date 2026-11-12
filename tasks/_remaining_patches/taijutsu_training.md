# Patch: `taijutsu_training` (TAIJUTSU_TRAINING)

Catalog (`docs/combat-tactical-setup-spec.html`): `+10% daño únicamente a técnicas con tag TAIJUTSU; fuera del pool.` Tags: `TAIJUTSU`, `PASSIVE`.

Current (`src/game/constants/skills.ts`): global `passiveEffect.damageBonus: 0.1`, description `'+10% taijutsu damage.'`, **no `tags`**. `actionType: ActionType.PASSIVE` already keeps it out of the hand via `DeckSystem` / `CardContractSystem` (PASSIVE is **not** a `CardRole`).

## Plan

- Keep `actionType: ActionType.PASSIVE` (no `cardRole`); do **not** invent `CardRole.PASSIVE`.
- Add `tags: [SkillTag.TAIJUTSU, SkillTag.PASSIVE]` on the skill object.
- Scope the +10% via `passiveEffect.damageBonusTag: SkillTag.TAIJUTSU` (new field); keep `damageBonus: 0.1`.
- Update `description` to catalog intent (TAIJUTSU-tagged techniques only).
- Extend `PassiveSkillEffect` + `StatSystem` (`aggregatePassiveSkillBonuses` / `resolvePassiveDamageBonus` and call sites) so tag-scoped bonuses apply only when the attacking skill’s `tags` include that tag (shared infra with `weapon_proficiency`).

## Exact fields to set on the skill object

| Field | Value |
|---|---|
| `tags` | `[SkillTag.TAIJUTSU, SkillTag.PASSIVE]` |
| `description` | `'+10% damage to techniques with the TAIJUTSU tag.'` |
| `passiveEffect.damageBonus` | `0.1` (unchanged) |
| `passiveEffect.damageBonusTag` | `SkillTag.TAIJUTSU` (**new** on `PassiveSkillEffect`) |

Leave unchanged: `id`, `name`, `tier`, `actionType: ActionType.PASSIVE`, costs/cooldowns, combat scalars, `requirements`, no `cardRole`.

## StatSystem / types note

**Yes — `damageBonusTag` support is required.** Today `PassiveSkillEffect` only has `damageBonusElement?: ElementType`, and `aggregatePassiveSkillBonuses` / `resolvePassiveDamageBonus(passiveBonuses, skillElement)` only do element (or global) scoping. Without a tag path, setting `damageBonusTag` on the skill would be dead data and the bonus would stay incorrectly global (or be ignored).

Suggested shape (implementer — same as `weapon_proficiency`):

- `PassiveSkillEffect.damageBonusTag?: SkillTag`
- `PassiveBonuses.taggedDamageBonus?: Partial<Record<SkillTag, number>>` (or equivalent)
- `resolvePassiveDamageBonus(..., skill)` (or add `skillTags`) must add matching tagged bonus when `skill.tags` includes the key
- Call sites (`PlayerTurnSystem`, `CombatSimulationService`, `combatSkillViewModel`, `BattleSimulator`) must pass enough skill identity to resolve tags

Do **not** edit `skills.ts` in this patch file’s authoring step (merge-race avoidance); apply the snippet below in a dedicated skills edit.

## TypeScript snippet — fields to add/change on `TAIJUTSU_TRAINING`

```typescript
    description: '+10% damage to techniques with the TAIJUTSU tag.',
    tags: [SkillTag.TAIJUTSU, SkillTag.PASSIVE],
    passiveEffect: {
      damageBonus: 0.1,
      damageBonusTag: SkillTag.TAIJUTSU,
    },
```
