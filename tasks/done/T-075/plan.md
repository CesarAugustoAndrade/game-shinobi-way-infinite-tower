# T-075 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Henge SUPPORT AP1/CP1/CD4. Plant self `misdirect` 2 ATTEMPT. SIDE +2 next draw. Next SIDE hit plants `exposed_10` (×1.10 RANGED ATTACK). Miss SIDE still consumes misdirect. Remove DEX +0.25.

## Files

1. `src/game/constants/skills.ts` — `HENGE`.
2. `src/game/systems/ResolveSkillSystem.ts` — consume `misdirect` on SIDE only; plant `exposed_10` on SIDE hit; ×1.10; consume `exposed_10` on ATTACK.
3. `src/game/systems/__tests__/t075Henge.test.ts`.
4. `src/simulation/HengeBalance.ts` + `index.ts`.
5. `CHANGELOG.md`.

Do **not** retune bunshin / smoke / blastback ×1.15.

## Authoring

- SUPPORT; AP1/CP1/CD4; base 0; MENTAL AUTO.
- Tags NINJUTSU + MENTAL + MARK.
- `nextDrawRoleBonus: { role: SIDE_ATTACK, delta: 2 }`.
- `markEffects`: id `misdirect`, duration 2, ATTEMPT, STAT, self.
- Honest description: Misdirect 2; SIDE +2 next draw; next SIDE applies Exposed 10%.

## Tests

- AC1 authoring; no DEX 0.25.
- AC2: SIDE +2 once; ATTACK unchanged.
- AC3: SIDE hit → misdirect gone, `exposed_10` present; RANGED ATTACK 10→11 consume; SIDE miss consumes misdirect, no plant.

## Sim

Probe: authoring; SIDE +2; 10→11. Hook after Bunshin.
