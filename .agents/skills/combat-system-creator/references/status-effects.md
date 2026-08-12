# Creating New Status Effects

### Effect Types Available

```typescript
// Damage Over Time
DOT, BLEED, BURN, POISON

// Crowd Control
STUN, CONFUSION, SILENCE

// Defensive
SHIELD, INVULNERABILITY, REFLECTION

// Stat Modifiers
BUFF, DEBUFF, CURSE

// Recovery
HEAL, REGEN, CHAKRA_DRAIN
```

### Effect Interface

```typescript
interface SkillEffect {
  type: EffectType;
  value: number;           // Damage/heal amount or multiplier
  duration: number;        // Turns (-1 = permanent)
  chance: number;          // 0.0-1.0 application chance
  targetStat?: PrimaryStat; // For BUFF/DEBUFF
  damageType?: DamageType;  // For DoTs
  damageProperty?: DamageProperty;
}
```

### DoT Damage Formula

```typescript
// DoTs get 50% defense mitigation
dotDamage = max(1, baseDamage - (flatDef × 0.5) - (damage × percentDef × 0.5))
```
