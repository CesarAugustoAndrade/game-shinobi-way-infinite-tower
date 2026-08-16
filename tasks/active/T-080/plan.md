# T-080 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Water Prison SIDE AP2/CP6/CD5 MEDIUM 9. `impactStun: { chance: 0.7, duration: 1, lockVoluntaryRangeUp: true }`. Hit + stun success plants self `water_prison_lock` duration 1. Voluntary RETREAT rejected while lock present. Tests `t080WaterPrison` + probe.

## Files

1. `src/game/types.ts` — optional `lockVoluntaryRangeUp` on `ImpactStunSpec`.
2. `src/game/constants/skills.ts` — `WATER_PRISON`.
3. `src/game/systems/ResolveSkillSystem.ts` — plant lock when stun + flag.
4. `src/game/systems/RangeSystem.ts` — `WATER_PRISON_LOCK_ID` + `voluntaryRangeIncreaseBlocked`.
5. `src/game/systems/PlayerTurnSystem.ts` — gate voluntary RETREAT.
6. `src/game/systems/__tests__/t080WaterPrison.test.ts`.
7. `src/simulation/WaterPrisonBalance.ts` + `index.ts`.
8. `CHANGELOG.md`.

## Authoring

- SIDE; AP2/CP6/CD5; base 9; WATER RANGED; `allowedRanges: [MEDIUM]`.
- Tags: NINJUTSU + WATER.
- `impactStun: { chance: 0.7, duration: 1, lockVoluntaryRangeUp: true }`.
- No STUN duration-2 `effects[]`.
- Description: 9 MEDIUM; 70% Stun 1; cannot voluntarily increase range while Stun persists.

## Resolve / lock

- Miss: 0 dmg, no stun, no lock.
- Hit + rng ≥ 0.7: dmg 9, no stun, no lock.
- Hit + rng < 0.7: dmg 9, Stun 1, plant `water_prison_lock` self duration 1.
- `voluntaryRangeIncreaseBlocked(marks, RETREAT)` true iff lock present.
- APPROACH never blocked by this lock.
- Lock expires with duration 1 (same as Stun).

## Tests

- AC1 authoring.
- AC2 hit stun success / fail / miss / CLOSE illegal.
- AC3 lock: success → RETREAT blocked, APPROACH allowed; stun fail / lock gone → RETREAT allowed.

## Sim

Chip 9; 70% vs unused STUN×2; lock on/off; vs Sweeping Kick 7/40%. Hook after Killing Intent.
