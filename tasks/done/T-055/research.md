# T-055 research

Internal pattern reuse only. Three stun-wiring options:

1. **`impactStun: { chance, duration }` + post-hit helper (recommended).** New optional Skill field. On SIDE/ATTACK `hitsLanded ≥ 1`, one `rng()`; if `< chance`, append `stunControlBuff(..., 'enemy')`. No self-stun. Isolated from Mind Transfer / Tripwire / Chidori Stream.

2. **Honor generic `effects[]` STUN on any offensive hit.** One loop over `skill.effects`. Would silently apply STUN for every packaged ATTACK (T-034 Stream 60%, etc.) — out of scope retune.

3. **Reuse `controlStun` with `failSelfDuration: 0`.** Still SUPPORT-shaped; `resolveControlSupport` would need a “no self” branch. Risk of changing Mind Transfer if the branch is wrong.

**Recommendation:** option 1. Keep `effects` STUN 0.4×1 as display/authoring honesty (already present). Tests lock `impactStun`. AC2: rng `() => 0` → stun; `() => 0.4` → no stun. AC3 miss: no stun even with `() => 0`.
