# T-079 exploration

**Ring:** R0 · **Route:** autonomous · **Type:** expand S
**Port signatures:** `ControlStunSpec.failSelfDuration` becomes optional (no new port). Stays R0.

## Premises vs code

| Premise | Verdict | Evidence |
|---|---|---|
| `KILLING_INTENT` unmarked ACTIVE AP1 30% Stun, no Fear | **true** | `skills.ts` 3155–3180 |
| `controlStun` exists (Mind Transfer 70% / fail self) | **true** | types.ts 785–789; ResolveSkillSystem 590–606 |
| Fail currently always self-stuns | **true** | resolveControlSupport always writes playerBuffs |
| SUPPORT `applySkillMarkEffects` plants without requireHit | **true** | ResolveSkillSystem 934–935 |
| Hell Viewing `fear` stacks 20 + `applyFearOutgoing` ×0.8 | **true** | T-037 |
| SkillTag.CONTROL | **false** | use GENJUTSU + MENTAL |

## Complexity premise

Stun roll already exists. Need optional no-self-fail so catalog 80% Stun does not inherit Mind Transfer backlash. Fear is authoring-only.

## Layers

R0: `skills.ts`; `types.ts` optional field; `ResolveSkillSystem` skip self-stun when fail duration omitted. Tests + R3 probe.
