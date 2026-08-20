# T-140 · research

SOUL §9: integer primaries, never secret %. Catalog leaf_whirlwind / flash_bomb / air_bullet / water_vortex (`spd_down` stacks 2) / expansion_str.

Duration stays on TurnClock. Buff DEBUFF path remains and stacks additively (Marks after buffs).

OOS: player `getPlayerFullStats` from GameContext still omits marks unless callers pass them; expansion_str on player attacks is follow-up if GameContext never sees `combatState.marks`. Enemy-targeted v1 ids are live via `useCombat` enemyStats.
