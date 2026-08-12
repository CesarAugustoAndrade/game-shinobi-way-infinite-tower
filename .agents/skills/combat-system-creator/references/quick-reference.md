# Combat Quick Reference

### Damage Pipeline (5 Steps)

```
1. Hit Check    → MELEE: Speed vs Speed | RANGED: Accuracy vs Speed | AUTO: Always hits
2. Base Damage  → ScalingStat × damageMult
3. Element      → Super: 1.5× (+10% crit) | Resist: 0.5× | Neutral: 1.0×
4. Critical     → 8% + (DEX × 0.5) + bonuses, max 75%, multiplier 1.75×
5. Defense      → Flat (max 60% reduction) then % (soft cap 75%)
```

### Mitigation Pipeline (Priority Order)

```
1. INVULNERABILITY → Blocks ALL damage (return 0)
2. REFLECTION      → Calculate reflected damage (before curse)
3. CURSE           → Amplify: damage × (1 + curseValue)
4. SHIELD          → Absorb damage before HP
5. GUTS            → Survive at 1 HP if roll succeeds
```

### Defense Formulas

| Type | Flat | Percent (Soft Cap) |
|------|------|-------------------|
| Physical | `STR × 0.3` | `STR / (STR + 200)` |
| Elemental | `SPI × 0.3` | `SPI / (SPI + 200)` |
| Mental | `CAL × 0.25` | `CAL / (CAL + 150)` |

### Damage Properties

| Property | Flat Def | % Def |
|----------|----------|-------|
| NORMAL | ✅ (max 60%) | ✅ |
| PIERCING | ❌ | ✅ |
| ARMOR_BREAK | ✅ | ❌ |
| TRUE | ❌ | ❌ |
