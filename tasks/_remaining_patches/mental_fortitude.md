# Patch: `mental_fortitude` (Mental Fortitude)

## Gap

| Source | Value |
|---|---|
| Catalog | Conserva **+2 CAL** enteros; fuera del pool. Tags: `PASSIVE`, `MENTAL`. |
| Code effect | `passiveEffect.statBonus: { calmness: 2 }` — correct. |
| Code description | `'+10% Genjutsu Resistance.'` — **lie**; no genjutsu-resist % in effect. |

## Plan

1. Keep `statBonus: { calmness: 2 }` unchanged (already matches catalog flat +2 CAL outside pool).
2. Fix `description` only so UI/copy matches the real bonus.
3. Do not invent genjutsu resistance; do not change tags/actionType/element (already PASSIVE + MENTAL).

## Exact TS change

**File:** `src/game/constants/skills.ts`  
**Block:** `SKILLS.MENTAL_FORTITUDE`

```diff
   MENTAL_FORTITUDE: {
     id: 'mental_fortitude',
     name: 'Mental Fortitude',
     tier: SkillTier.BASIC,
-    description: '+10% Genjutsu Resistance.',
+    description: '+2 CAL.',
     actionType: ActionType.PASSIVE,
     chakraCost: 0,
     hpCost: 0,
     cooldown: 0,
     currentCooldown: 0,
     baseDamage: 0,
     scalingPerPoint: 0,
     scalingStat: PrimaryStat.CALMNESS,
     damageType: DamageType.MENTAL,
     damageProperty: DamageProperty.NORMAL,
     attackMethod: AttackMethod.AUTO,
     element: ElementType.MENTAL,
     requirements: {
       stats: {
         [PrimaryStat.INTELLIGENCE]: 1,
         [PrimaryStat.CALMNESS]: 1,
       },
     },
     passiveEffect: {
       statBonus: { calmness: 2 }
     }
   },
```

## Out of scope

- `helpText.ts` / art manifests / docs prompts (optional follow-up copy sync).
- No formula or `passiveEffect` changes.
