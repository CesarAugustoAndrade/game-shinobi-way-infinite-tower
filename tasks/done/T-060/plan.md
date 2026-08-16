# T-060 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Wire Trap SUPPORT AP1/CP1/CD4. Plant enemy `wire_trap` duration 2. Next ATTACK hit: ×1.20, Bleed 5×2, consume trap. Miss/SIDE: trap stays. Remove STR +20% and immediate BLEED 8@40%. Do not retune Wire Reel / Tripwire / Kunai / Sword. Tests `t060WireSetup` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `WIRE_SETUP` authoring.
2. `src/game/systems/ResolveSkillSystem.ts` — skip `wire_trap` in generic IMPACT consume; ATTACK-only mult + bleed + consume.
3. `src/game/systems/__tests__/t060WireSetup.test.ts` — AC1–3 (+ SIDE leave).
4. `src/simulation/WireSetupBalance.ts` + `src/simulation/index.ts` — probe.
5. `CHANGELOG.md` — Unreleased line.

No `types.ts` field unless a tiny `WIRE_TRAP_ID` const in resolve is enough (prefer string `'wire_trap'` next to Off-Balance ids).

## Authoring

- `cardRole: CardRole.SUPPORT`; AP1/CP1/CD4/HP0; `baseDamage: 0`; AUTO (ANY range).
- Tags: `TOOL` + `WEAPON` + `MARK`.
- `markEffects: [{ id: 'wire_trap', duration: 2, stacks: 1, consume: IMPACT, family: STAT, targetActor: 'enemy' }]`.
- No `effects` STR +0.2 / BLEED 8@0.4. Drop `stanceShift`.
- Honest description: Wire Trap 2 on enemy; next ATTACK +20%; on hit Bleed 5×2 and consume.

## Resolve

- SUPPORT: existing `applySkillMarkEffects` plants trap. `damageDealt === 0`.
- Damage (ATTACK/SIDE only, after attempt `markMult`): if `role === ATTACK && hitsLanded ≥ 1 && hasEnemyMark(wire_trap)` → `damageDealt = Math.floor(damageDealt * 1.2)`.
- After generic IMPACT consume: exclude marks with `id === 'wire_trap'` from that pool.
- After consume / same hit block: if ATTACK && hitsLanded ≥ 1 && trap still present → plant bleed 5×2 DOT enemy (`addMark`) and remove `wire_trap`.
- Miss / SIDE: no trap consume, no trap bleed, no ×1.20.
- Off-Balance first (`markMult`), then trap. Both: `floor(floor(base * 1.2) * 1.2)` or `floor(base * 1.2 * 1.2)` — pick **one** and assert it. Prefer `floor(dmg * 1.2)` after existing `markMult` (same as setupRead after markMult).

## Out of scope

Wire Reel / Tripwire / Kunai Slash / Sword Slash retune; Poison Coat; Cloak; Iaido; UI.

## Tests (`t060WireSetup.test.ts`)

- **AC1 authoring:** SUPPORT, AP1/CP1/CD4, dmg 0, `wire_trap` 2 IMPACT enemy; no STR +0.2 / BLEED@0.4.
- **AC2 plant:** resolve → trap duration 2, no bleed, dmg 0.
- **AC3 payoff:** mock ATTACK 10 + trap → dmg 12, bleed 5×2, trap gone; miss ATTACK → 0, trap remains, no bleed.
- Extra: SIDE hit with trap → dmg unboosted, trap remains, no trap bleed.

Keep T-023 Off-Balance miss-consume as regression.

## Sim

Probe: authoring; plant; ATTACK 10→12 + bleed 5×2 + consume; miss keeps trap; SIDE leaves trap; vs legacy self STR / 40% Bleed 8. Hook `printWireSetupProbe` next to Sword Slash in `simulate:quick`.
