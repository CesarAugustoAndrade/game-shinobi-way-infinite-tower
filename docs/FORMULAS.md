# Formulas (F1 stat economy)

Authoritative live constants: `STAT_FORMULAS` in `src/game/types.ts`, applied in `src/game/systems/StatSystem.ts`.

## Starting primaries

- All stats start at **1**, except clan affinities at **3**:
  - Uzumaki: WILLPOWER, CHAKRA
  - Uchiha: SPIRIT, DEXTERITY
  - Hyūga: ACCURACY, DEXTERITY
  - Lee: STRENGTH, SPEED
  - Yamanaka: INTELLIGENCE, CALMNESS
- Each level grants **1** `unspentStatPoint` (no auto growth table).
- Full HP/Chakra refill only after all unspent points are assigned.

## Derived resources

| Result | Formula |
|--------|---------|
| Max HP | `100 + 20 × WILLPOWER` (+ flat gear) |
| Max Chakra | `30 + 15 × CHAKRA` (+ flat gear) |
| HP regen / turn | `max(1, floor(maxHP × (0.01 + 0.04 × WILL/(WILL+10))))` |
| Chakra regen / turn | `1 + 2 × INTELLIGENCE` |

## Defense

| Result | Formula |
|--------|---------|
| Flat def | `1 × STR / SPIRIT / CALMNESS` by damage type |
| % def | `stat / (stat + 18)`, cap **65%** |
| Order | Flat first, then percent (NORMAL property) |

## Impact (single roll — no separate evasion)

```
impact = clamp(60, 98, 90 + 6 × (atkStat − defender SPEED))
```

- MELEE: atkStat = attacker SPEED  
- RANGED: atkStat = attacker ACCURACY  
- AUTO: always hits  

## Other combat

| Result | Formula |
|--------|---------|
| Initiative | `10 + 5 × SPEED` |
| AP / turn | `min(9, 3 + floor((SPEED − 1) / 2))` |
| Crit chance | `5% + 50% × DEX/(DEX+12)`, max **55%** |
| Status resist | `60% × CALM/(CALM+12)` |
| Guts | `30% × WILL/(WILL+18)` |

## Skill damage

```
raw = baseDamage + scalingPerPoint × effectivePrimary[scalingStat]
```

**Constante César (temporal):** tras defensa, `finalDamage × CESAR_DAMAGE_CONSTANT` (`src/game/config.ts`, valor **2**). Afecta skills y DoT. Borrar cuando se retire el retune provisional.

Tier expected damage budgets at stat **3**: Basic 18 / Advanced 26 / Hidden 36 / Forbidden 48 / Kinjutsu 64.

Utility skills: `baseDamage: 0`, `scalingPerPoint: 0`.

Mutual KO techniques (Reaper Death Seal): `mutualKo: true` — both actors defeated without the normal damage pipeline.

## Buffs

Integer primary deltas (±1 / ±2 style). Effective primary never below **1**.

## Enemies

Additive budget (no multiplicative danger stack):

```
budget = (Danger − 1) + floor(locationsCleared / 2) + round((difficulty − 40) / 20) + rankBonus
```

rankBonus: Normal 0, Ambush 1, Elite 3, Guardian 4, Boss 7.

Archetype bases on the 1–3 scale (Tank WILL/STR 3, CAL 2, …).

## Gear / training

- Components: **+1** to primary stat.
- Artifacts: sum of component points + at most **+1** thematic.
- Training: **+1** normally; at most one **+2** offer per room at `5% × Danger`, cost ×2.5.

## Combat distance (F2)

Live helpers: `src/game/systems/RangeSystem.ts`. Distance **only gates** skill playability (no global damage/crit/accuracy mods).

| Band | Notes |
|------|--------|
| CLOSE | MELEE default |
| MEDIUM | Frontal / Iron Guard open |
| LONG | RANGED default; Genjutsu/Terrain Trap open |

**AttackMethod defaults:** MELEE → CLOSE only; RANGED → MEDIUM+LONG; AUTO → all three. Override with `Skill.allowedRanges`.

**Voluntary move:** one band, once per turn, **1 AP**. Boundary clamp does not move and does not fire reactions.

**PUSH/PULL:** one band free of AP; does not consume voluntary move; reactions infra empty this delivery.

**Initial range:** success uses approach table; fail → enemy preferred (Tank/Assassin CLOSE, Caster/Genjutsu LONG, Balanced MEDIUM).

**Enemy AI:** in-range affordable skill → one-band move then skill → move preferred + Guard.

## Visit HEAT (F3)

Live helpers: `src/game/systems/HeatSystem.ts`, chain: `EncounterChainSystem.ts`.

| Field | Notes |
|-------|--------|
| `BranchingFloor.heat` | 0–100, visit only (new floor) |
| `BranchingFloor.hunterArmed` | Latches at heat 100; never clears this visit |
| Tiers | QUIET 0–24 · SUSPICIOUS 25–49 · ALERT 50–74 · HUNTED 75–100 |

**Authored deltas only** (presets 0/±5/±10/±20/+30). No auto heat from room visits, combat turns, or wins.

**Approach fail heat:** Frontal/Iron +5 · Trap/Genjutsu +10 · Silent +15 · Shadow +20. Success +0.

**Approach PP penalties** (after base chance, before clamp) — by heat band 25–49 / 50–74 / 75–100:

| Approach | low | mid | high |
|----------|----:|----:|-----:|
| Iron Guard | 0 | −5 | −15 |
| Frontal | 0 | −10 | −20 |
| Env Trap | −5 | −15 | −30 |
| Genjutsu | −5 | −20 | −35 |
| Silent | −10 | −25 | −45 |
| Shadow | −15 | −30 | −50 |

**Initial band bias (success):** heat 0–49 unchanged; 50–74 one step toward enemy preferred; 75–100 force preferred. Fail → preferred.

**Elite chain** (after Normal win, post heat delta, pre-pay): 0–49 → 0%; 50–74 → 25%; 75–99 → 50%; 100 → 0%. Excludes tutorial, authored Elite Challenge, Guardian, Hunter, bosses. Between fights: no pay/heal/level/activity complete. Dual win → one modal. Approach mult only fight 1. **Death on fight 2 forfeits uncommitted buffer.**

**Hunter EXIT:** On arm, swap existing uncleared EXIT Guardian → Hunter (×1.75 HP, ×1.35 dmg stats, preferred range, 2× XP/Ryo, guaranteed artifact). If EXIT not yet generated: +40pp to exit chance after min rooms (cap 90%).
