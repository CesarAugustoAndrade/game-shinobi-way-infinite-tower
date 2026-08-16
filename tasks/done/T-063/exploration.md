# T-063 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** none touched → stays R0. T-062 already merged (`cloaked` ATTEMPT + force-crit ×1.5 + DEX).

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `IAIDO` is unmarked ACTIVE AP2/CP1/CD3 base 12, `critBonus: 40` | **true** | `skills.ts` 838–857: no `cardRole`, no CLOSE, no Cloak |
| T-062 `cloaked` ATTACK consume + ×1.5 + DEX | **true** | ResolveSkillSystem 764, 956–959 |
| `setupRead` is **enemy** marks only | **true** | `hasEnemyMark` at ~946 |
| `lotus_opening` spent mult exists | **true** | ×1.25 when spent |
| `SkillTag.PRECISION` exists | **false** | SkillTag has WEAPON/PHYSICAL |
| No test locks `critBonus: 40` | **true** | no `iaido` in `__tests__` |

## Ports / reuse

- Consume: share T-062 `cloaked` ATTACK-only filter. Do not add a second consume.
- Force-crit / +1 DEX: T-062 already applies to any ATTACK (Iaido `scalingStat` is SPEED → +1).
- Setup +50%: new Iaido-only spent-`cloaked` `floor(dmg * 1.5)` after T-062 crit, before/with DEX last. `setupRead` stays enemy-only.

## Complexity premise

Spec said “if T-062 not merged, Iaido may forceCrit.” T-062 **is** merged. Do not duplicate the crit path. Only add Setup ×1.5 when `skill.id === 'iaido'` and `cloaked` spent.

## Layers

R0: `skills.ts` `IAIDO`; `ResolveSkillSystem.ts` Iaido Setup after cloaked crit. Tests + R3 probe.

## Relevant files

- `src/game/constants/skills.ts` — `IAIDO`.
- `src/game/systems/ResolveSkillSystem.ts` — cloaked block ~956.
- `src/game/systems/__tests__/t062CloakInvis.test.ts` — regression.
- `src/game/systems/__tests__/t059SwordSlash.test.ts` — ATTACK CLOSE template.

## Surprises / debt

- No `SkillTag.PRECISION` — use WEAPON + PHYSICAL.
- Combined cloak Iaido under `rollHit` 12: `floor(12*1.5)=18` crit, `floor(18*1.5)=27` Setup, +1 DEX = **28**. AC3 lower bound is `≥ floor(12*1.5)`.
- `stanceBonus` AGGRESSIVE +20% is leftover; leave it (not in AC).
