---
name: jutsu-creator
description: Create new jutsu/skills for SHINOBI WAY game. Use when user wants to add abilities, techniques, jutsu, or combat skills. Guides through all parameters and generates TypeScript code.
---

# Skill Creator - SHINOBI WAY Jutsu Generator

This skill helps create new game skills (jutsu) for the SHINOBI WAY: THE INFINITE TOWER roguelike game.

## When to Use

Activate when the user wants to:

- Create a new jutsu or skill
- Add a new ability or technique
- Design a combat skill
- Balance or modify existing skills

## Workflow

### Step 1: Gather Basic Info

Ask the user for:

1. **Skill Name** - The jutsu name (e.g., "Fireball Jutsu", "Chidori")
2. **Skill ID** - Lowercase with underscores (e.g., `fireball`, `chidori_stream`)
3. **Tier** - BASIC, ADVANCED, HIDDEN, FORBIDDEN, or KINJUTSU
4. **Description** - Flavor text explaining what the skill does

**Tier Guidelines:**

| Tier | Rank | INT Req | Description |
|------|------|---------|-------------|
| BASIC | E-D | 0-6 | Academy fundamentals, taijutsu, basic tools |
| ADVANCED | C-B | 8-12 | Chunin-level techniques, elemental jutsu |
| HIDDEN | B-A | 14-18 | Jonin/Clan secret techniques |
| FORBIDDEN | A-S | 16-20 | Dangerous, high-risk techniques |
| KINJUTSU | S+ | 20-24 | Ultimate forbidden arts |

### Step 2: Determine Action Type

Ask the user which action type:

- **MAIN**: Ends your turn - primary attacks and jutsu (default)
- **TOGGLE**: Activate once (ends turn), pays upkeep cost per turn
- **SIDE**: Free action BEFORE Main, max 2 per turn (setup/utility)
- **PASSIVE**: Always active, no action required (permanent bonuses)

**Action Type Rules:**

| Type | Turn Cost | Limit | Use Case |
|------|-----------|-------|----------|
| MAIN | Ends turn | 1/turn | Attacks, damage jutsu |
| TOGGLE | Ends turn to activate | Upkeep/turn | Sharingan, Gates, stances |
| SIDE | Free | 2/turn | Buffs, shields, setup |
| PASSIVE | None | Always on | Permanent stat bonuses |

### Step 3: Determine Element & Damage Type

**Element** (for elemental interactions):

- FIRE, WIND, LIGHTNING, EARTH, WATER (elemental cycle: Fire > Wind > Lightning > Earth > Water > Fire)
- PHYSICAL (taijutsu)
- MENTAL (genjutsu)

**Damage Type** (determines which defense applies):

- PHYSICAL - mitigated by Strength
- ELEMENTAL - mitigated by Spirit
- MENTAL - mitigated by Calmness
- TRUE - bypasses ALL defenses (FORBIDDEN/KINJUTSU only)

**Damage Property**:

- NORMAL - subject to both flat and % defenses
- PIERCING - ignores flat defense, only % applies
- ARMOR_BREAK - ignores % defense, only flat applies

**Attack Method**:

- MELEE - hit chance uses Speed vs Speed
- RANGED - hit chance uses Accuracy vs Speed
- AUTO - always hits (genjutsu, some DoTs)

### Step 4: Set Costs & Cooldown

- **chakraCost**: Chakra consumed (0 for taijutsu, 15-150 for jutsu)
- **hpCost**: HP sacrificed (usually 0, used for forbidden/physical techniques)
- **cooldown**: Turns before reuse (0-10, higher for powerful skills)
- **upkeepCost**: For TOGGLE skills, CP or HP paid each turn while active

### Step 5: Damage Scaling

- **damageMult**: Base multiplier (1.5-10.0 range based on tier)

| Tier | Zero-Cost | Low (5-15) | Medium (20-40) | High (50+) |
|------|-----------|------------|----------------|------------|
| BASIC | 1.5-2.2x | 2.0-2.5x | 2.5-3.0x | N/A |
| ADVANCED | N/A | 2.5-3.0x | 3.0-3.5x | 3.5-4.0x |
| HIDDEN | N/A | 3.0-3.5x | 3.5-4.5x | 4.5-5.0x |
| FORBIDDEN | N/A | N/A | 4.0-5.0x | 5.0-7.0x |
| KINJUTSU | N/A | N/A | 5.0-6.0x | 6.0-10.0x |

- **scalingStat**: Which stat scales damage
  - STRENGTH - taijutsu
  - SPIRIT - ninjutsu/elemental
  - SPEED - fast attacks
  - ACCURACY - ranged/precision
  - CALMNESS - genjutsu
  - INTELLIGENCE - complex jutsu

### Step 6: Effects (Optional)

Add status effects on hit. See [skill-interface.md](skill-interface.md) for all effect types.

Common patterns:

- **DoT**: BURN, BLEED, POISON with value (damage), duration, chance
- **CC**: STUN, CONFUSION, SILENCE with duration, chance
- **Buff**: BUFF with targetStat, value (multiplier), duration
- **Debuff**: DEBUFF with targetStat, value (reduction), duration
- **Shield**: SHIELD with value (HP absorbed), duration
- **Drain**: CHAKRA_DRAIN with value

### Step 7: Requirements (Optional)

- **intelligence**: Minimum INT to learn (see tier guidelines)
- **clan**: Restrict to specific clan (Clan.UCHIHA, etc.)

### Step 8: Special Properties (Optional)

- **critBonus**: Extra crit chance % (5-30)
- **penetration**: % defense ignored (0-0.5)
- **isToggle**: True for stance skills (auto-set if actionType is TOGGLE)
- **upkeepCost**: Chakra/HP per turn while toggle active
- **sideActionLimit**: Max uses per turn for SIDE skills (default 1)
- **passiveEffect**: For PASSIVE skills, define stat bonuses

### Step 9: Skill Image (Optional)

Ask if the user has a background image for the skill.

- **image**: Path to the skill image relative to project root
- Format: `/assets/skill_[skill_id].png`
- Example: `/assets/skill_fireball.png`

## Output Format

Generate TypeScript ready to add to `src/game/constants/index.ts`.

→ See `templates/skill-output.md` for the copy-paste TypeScript templates (MAIN, TOGGLE, SIDE, PASSIVE variants).

## Reference Files

- [skill-interface.md](skill-interface.md) - Full Skill interface and enum definitions
- [examples.md](examples.md) - Example skills from the game

## Balance Guidelines

→ See `references/balance-guidelines.md` for damage-by-tier, cooldown standards, and SIDE/TOGGLE/PASSIVE balance rules — consult before finalizing costs, cooldowns, and multipliers.
