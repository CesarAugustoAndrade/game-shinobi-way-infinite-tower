# T-058 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Senbon SIDE AP1/CD1 MEDIUM/LONG 7. Lock `impactSilence: { chance: 0.35, duration: 1 }`. On ≥1 hit, one `rng()`: `< 0.35` → enemy Silence 1 (Sealing Tag buff shape); else no Silence. Miss: 0 dmg, no Silence. Keep `effects` SILENCE 0.35×1 as display. Do not retune Sealing Tag / Sweeping Kick / Shuriken. Tests `t058Senbon` + probe.

## Files (disjoint; one implementer)

1. `src/game/types.ts` — `ImpactSilenceSpec` + optional `impactSilence?` on `Skill`.
2. `src/game/constants/skills.ts` — `SENBON` authoring.
3. `src/game/systems/ResolveSkillSystem.ts` — `resolveImpactSilence` after `resolveImpactStun`.
4. `src/game/systems/__tests__/t058Senbon.test.ts` — AC1–3.
5. `src/simulation/SenbonBalance.ts` + `src/simulation/index.ts` — probe.
6. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: CardRole.SIDE_ATTACK`; AP1/CP0/CD1/HP0; `baseDamage: 7`; RANGED; `allowedRanges: [MEDIUM, LONG]`.
- Tags: `TOOL` + `WEAPON` + `PHYSICAL` (no `SkillTag.CONTROL`).
- `impactSilence: { chance: 0.35, duration: 1 }`.
- `effects: [{ type: SILENCE, duration: 1, chance: 0.35 }]` (display; not 0.5).
- Honest description: 7 dmg MEDIUM/LONG; 35% Silence 1 on hit.
- Keep `scalingPerPoint: 1` / ACCURACY (tests use `rollHit` → AC2 stays 7).
- No Mode; no PUSH; no Bleed; no `controlStun`.

## Resolve

- After `impactStun` block, if `(ATTACK || SIDE) && hitsLanded ≥ 1 && skill.impactSilence`:
  - one `rng()`; if `< chance`, `enemyBuffs += silenceControlBuff(skill.id, duration)`.
- Buff shape: `{ id: silence-${id}, name: Silence, duration, effect: SILENCE duration/chance 1 }`.
- Do **not** mutate Mode boards.
- Do **not** change `applySealingTagXor` / `resolveImpactStun`.
- Miss: no rng silence apply (gate on `hitsLanded`).
- CLOSE rejected by `allowedRanges`.

## Out of scope

Sealing Tag / Sweeping Kick / Shuriken retune; Wire Trap; Sword Slash; Senbon Rain; Mode shutdown via Silence; UI.

## Tests (`t058Senbon.test.ts`)

- **AC1 authoring:** SIDE, AP1/CD1, 7, MEDIUM+LONG (not CLOSE), `impactSilence` 0.35/1, `effects` SILENCE 0.35 (not 0.5).
- **AC2 silence:** hit + `rng => 0` → dmg 7 + enemy Silence 1, Modes unchanged; hit + `rng => 0.35` → dmg 7, no Silence.
- **AC3 miss:** miss + `rng => 0` → dmg 0, no Silence; CLOSE reject.

Keep T-019 / T-055 as regression (do not change).

## Sim

Probe: authoring; chip 7; silence on rng 0 vs 0.35; miss no silence; AP 2→1; chance 0.5→0.35. Hook `printSenbonProbe` next to Strong Fist in `simulate:quick`.
