# T-079 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Killing Intent SUPPORT AP2/CP0/CD6. `controlStun: { chance: 0.8, enemyDuration: 1 }` (omit fail-self). Plant enemy `fear` 20/1 always on play. Drop AP1 / STUN 0.3. Make `failSelfDuration` optional so fail does not self-stun. Tests `t079KillingIntent` + probe.

## Files (disjoint; one implementer)

1. `src/game/types.ts` — `failSelfDuration?`.
2. `src/game/systems/ResolveSkillSystem.ts` — fail: apply self stun only if `failSelfDuration >= 1`.
3. `src/game/constants/skills.ts` — `KILLING_INTENT`.
4. `src/game/systems/__tests__/t079KillingIntent.test.ts` — AC1–3.
5. `src/simulation/KillingIntentBalance.ts` + `src/simulation/index.ts`.
6. `CHANGELOG.md`.

## Authoring

- SUPPORT; AP2/CP0/CD6; `baseDamage: 0`; AUTO; MENTAL.
- Tags: GENJUTSU + MENTAL.
- `controlStun: { chance: 0.8, enemyDuration: 1 }` — no `failSelfDuration`.
- `markEffects: [{ id: 'fear', duration: 1, stacks: 20, family: STAT, targetActor: 'enemy' }]`.
- No `effects` STUN 0.3.
- Description: 80% Stun 1; Fear 1 next enemy action −20%.

## Resolve

- Existing SUPPORT mark plant (Fear always).
- `rng() < 0.8` → enemy Stun 1; else no Stun, no self-Stun.
- `damageDealt === 0`. Do not retune Mind Transfer / Hell Viewing.

## Tests

- **AC1:** SUPPORT AP2/CD6 0 dmg; controlStun 0.8/1 no fail-self; fear 20×1; not AP1 / STUN 0.3.
- **AC2:** rng 0 → enemy Stun 1; rng 0.99 → no Stun either side; dmg 0 both.
- **AC3:** both rolls plant enemy fear duration 1 stacks 20.

Keep T-036 fail self-Stun as regression.

## Sim

Probe: 80% vs unused 30%; Fear 20 vs Hell Viewing same contract; AP 1→2; no self-stun vs Mind Transfer. Hook after Demon Slash.
