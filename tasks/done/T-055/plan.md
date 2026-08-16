# T-055 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Sweeping Kick SIDE AP1/CD2 CLOSE 7 MELEE. Lock `impactStun: { chance: 0.4, duration: 1 }`. On ≥1 hit, one `rng()`: `< 0.4` → enemy Stun 1 via `stunControlBuff`; else no stun. Miss: 0 dmg, no stun. Keep `effects` STUN 0.4×1 as display. Tests `t055SweepingKick` + probe.

## Files (disjoint; one implementer)

1. `src/game/types.ts` — optional `impactStun?: { chance: number; duration: number }` on `Skill`.
2. `src/game/constants/skills.ts` — `SWEEPING_KICK` authoring.
3. `src/game/systems/ResolveSkillSystem.ts` — `resolveImpactStun` after hits (sibling of `controlConfusion`).
4. `src/game/systems/__tests__/t055SweepingKick.test.ts` — AC1–3.
5. `src/simulation/SweepingKickBalance.ts` + `src/simulation/index.ts` — probe.
6. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: CardRole.SIDE_ATTACK`; AP1/CP0/CD2/HP0; `baseDamage: 7`; MELEE; `allowedRanges: [CLOSE]`.
- Tags: `TAIJUTSU` + `PHYSICAL` (no `SkillTag.CONTROL`).
- `impactStun: { chance: 0.4, duration: 1 }`.
- Keep `effects: [{ type: STUN, duration: 1, chance: 0.4 }]`.
- Honest description: 7 dmg CLOSE; 40% Stun 1 on hit.
- Keep `scalingPerPoint: 2` / SPEED (chip tests use `rollHit` → AC2 stays 7).
- No Mode; no band move; no setup mark; no `controlStun`.

## Resolve

- After damage, if `(ATTACK || SIDE) && hitsLanded ≥ 1 && skill.impactStun`:
  - one `rng()`; if `< chance`, `enemyBuffs += stunControlBuff(skill.id, duration, 'enemy')`.
- Do **not** call `resolveControlSupport`.
- Miss: no rng stun apply (gate on `hitsLanded`).
- Do not retune Mind Transfer / Tripwire / `controlConfusion`.

## Out of scope

Explosive Tag / Strong Fist / Wire Trap / Senbon; global `effects[]` STUN; SOUL double-stun policy; UI.

## Tests (`t055SweepingKick.test.ts`)

- **AC1 authoring:** SIDE, AP1/CD2, 7, CLOSE, MELEE, `impactStun` 0.4/1, `effects` STUN 0.4×1.
- **AC2 stun:** hit + `rng => 0` → dmg 7 + enemy Stun 1; hit + `rng => 0.4` → dmg 7, no stun; no player stun.
- **AC3 miss:** miss + `rng => 0` → dmg 0, no stun; MEDIUM reject.

## Sim

Probe: authoring; chip 7; stun rate under rng 0 vs 0.4; miss no stun. Hook `printSweepingKickProbe` next to Elbow in `simulate:quick`.
