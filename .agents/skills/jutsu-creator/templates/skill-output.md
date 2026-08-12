# Skill Output Templates

Copy-paste TypeScript for adding to `src/game/constants/index.ts`.

## Output Format

Generate TypeScript code ready to add to `src/game/constants/index.ts`:

```typescript
SKILL_NAME: {
  id: 'skill_id',
  name: 'Skill Display Name',
  tier: SkillTier.TIER,
  description: 'Flavor text description.',
  actionType: ActionType.MAIN,  // MAIN/TOGGLE/SIDE/PASSIVE
  chakraCost: 0,
  hpCost: 0,
  cooldown: 0,
  currentCooldown: 0,
  damageMult: 0.0,
  scalingStat: PrimaryStat.STAT,
  damageType: DamageType.TYPE,
  damageProperty: DamageProperty.PROPERTY,
  attackMethod: AttackMethod.METHOD,
  element: ElementType.ELEMENT,
  requirements: { intelligence: 0 },
  effects: [{ type: EffectType.TYPE, value: 0, duration: 0, chance: 0.0 }],
  image: '/assets/skill_skill_id.png'
},
```

### TOGGLE Skill Output

```typescript
TOGGLE_SKILL: {
  id: 'toggle_id',
  name: 'Toggle Skill Name',
  tier: SkillTier.HIDDEN,
  description: 'Toggle description.',
  actionType: ActionType.TOGGLE,
  chakraCost: 10,        // Activation cost
  hpCost: 0,
  cooldown: 5,
  currentCooldown: 0,
  damageMult: 0,
  scalingStat: PrimaryStat.INTELLIGENCE,
  damageType: DamageType.PHYSICAL,
  damageProperty: DamageProperty.NORMAL,
  attackMethod: AttackMethod.AUTO,
  element: ElementType.PHYSICAL,
  isToggle: true,
  upkeepCost: 5,         // Cost per turn while active
  effects: [
    { type: EffectType.BUFF, targetStat: PrimaryStat.SPEED, value: 0.3, duration: -1, chance: 1.0 }
  ]
},
```

### SIDE Skill Output

```typescript
SIDE_SKILL: {
  id: 'side_id',
  name: 'Side Skill Name',
  tier: SkillTier.BASIC,
  description: 'Setup/utility description.',
  actionType: ActionType.SIDE,
  chakraCost: 5,
  hpCost: 0,
  cooldown: 3,
  currentCooldown: 0,
  damageMult: 0,         // Usually 0 for SIDE skills
  scalingStat: PrimaryStat.DEXTERITY,
  damageType: DamageType.PHYSICAL,
  damageProperty: DamageProperty.NORMAL,
  attackMethod: AttackMethod.AUTO,
  element: ElementType.PHYSICAL,
  effects: [{ type: EffectType.SHIELD, value: 30, duration: 1, chance: 1.0 }]
},
```

### PASSIVE Skill Output

```typescript
PASSIVE_SKILL: {
  id: 'passive_id',
  name: 'Passive Skill Name',
  tier: SkillTier.BASIC,
  description: 'Permanent bonus description.',
  actionType: ActionType.PASSIVE,
  chakraCost: 0,
  hpCost: 0,
  cooldown: 0,
  currentCooldown: 0,
  damageMult: 0,
  scalingStat: PrimaryStat.STRENGTH,
  damageType: DamageType.PHYSICAL,
  damageProperty: DamageProperty.NORMAL,
  attackMethod: AttackMethod.AUTO,
  element: ElementType.PHYSICAL,
  passiveEffect: {
    damageBonus: 0.1,    // +10% damage
    regenBonus: { chakra: 3 }  // +3 CP/turn
  }
},
```
