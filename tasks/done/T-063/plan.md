# T-063 · plan

**Ring:** R0 · **auto-approved** (standing automatic loop)

Reauthor Iaido ATTACK AP2/CP1/CD3 CLOSE 12. With spent `cloaked`: Setup ×1.5 after T-062 crit. No `critBonus: 40`. Do not retune Cloak SUPPORT / Sword Slash / mud_wall. Tests `t063Iaido` + probe.

## Files (disjoint; one implementer)

1. `src/game/constants/skills.ts` — `IAIDO` authoring.
2. `src/game/systems/ResolveSkillSystem.ts` — Iaido Setup after cloaked crit.
3. `src/game/systems/__tests__/t063Iaido.test.ts` — AC1–3.
4. `src/simulation/IaidoBalance.ts` + `src/simulation/index.ts` — probe.
5. `CHANGELOG.md` — Unreleased line.

## Authoring

- `cardRole: CardRole.ATTACK`; AP2/CP1/CD3/HP0; `baseDamage: 12`; MELEE; `allowedRanges: [CombatRange.CLOSE]`.
- Tags: `WEAPON` + `PHYSICAL` (no `SkillTag.PRECISION`).
- Remove `critBonus: 40`.
- Honest description: 12 CLOSE; with Cloak +50% Setup besides auto-crit; consume Cloak on attempt.
- Leave `stanceBonus` AGGRESSIVE (not in AC).

## Resolve

- Do **not** change T-062 consume filter or crit/DEX block except: inside the existing `spent cloaked` hit branch, after `floor(dmg * CLOAKED_CRIT_MULT)` and **before** +DEX:
  - if `skill.id === 'iaido'` → `damageDealt = Math.floor(damageDealt * 1.5)`.
- Order: hit sum → other mark/setup/wire → cloaked crit 1.5 → **Iaido Setup 1.5** → +DEX.
- No cloak: Iaido stays 12 (deterministic `rollHit` 12).
- Miss: T-062 already consumes `cloaked`; dmg 0.

## Out of scope

Cloak SUPPORT retune; Sword Slash; mud_wall; basic_atk; UI.

## Tests (`t063Iaido.test.ts`)

- **AC1 authoring:** ATTACK, AP2/CP1/CD3, 12, CLOSE; no `critBonus === 40`.
- **AC2 base:** no cloak, `rollHit` 12 → dmg 12; no cloaked required.
- **AC3 cloak:** plant via `SKILLS.CLOAK_INVIS` or fixture `cloaked`; Iaido hit → mark gone, dmg ≥ 18 (expect **28** = 12×1.5×1.5+1); miss → 0, mark gone.

Keep T-062 as regression (do not change).

## Sim

Probe: authoring; base 12; cloak 12→28 consume; miss consumes; vs legacy critBonus 40. Hook `printIaidoProbe` next to Cloak in `simulate:quick`.
