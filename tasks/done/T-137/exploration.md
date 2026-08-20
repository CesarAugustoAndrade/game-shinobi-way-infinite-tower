# T-137 exploration

**Ring:** R0. Route: autonomous.

- Live DoT is `processBuffTicks` on buffs only. `MarkFamily.DOT` plants (bleed 3×2) never deal damage.
- `tickMarkDurations` in TurnClock phase 04 owns duration — helper must not decrement.
- EnemyTurn Phase 1 = enemy opportunity; Phase 2 = player DoT (buffs already).
- T-135 `absorbWithShieldMarks` available for player-targeted DoT.

**RE-CLASSIFY:** no.
