# T-058 research

Internal pattern reuse only. Three Silence-on-hit options:

1. **`impactSilence: { chance: 0.35, duration: 1 }` (recommended).** Clone T-055 `impactStun`. On ≥1 hit, one `rng()`; `< 0.35` → enemy SILENCE 1 via Sealing Tag buff shape. Miss skips. Keep `effects` SILENCE 0.35×1 as display. Sealing Tag / Sweeping Kick untouched.

2. **Honor generic `effects[]` SILENCE on SIDE hit.** New engine. Could wake leftover Silence packages on other rows. Spec said lock one contract — T-055 already rejected this for STUN.

3. **Reuse `controlStun` / Sealing Tag xor.** Wrong contract (fail-self stun; Mode-drain xor). Out of scope retune.

**Recommendation:** option 1. AC2: hit + rng 0 → 7 + Silence 1; hit + rng 0.35 → 7, no Silence. AC3: miss → 0, no Silence even if rng 0. CLOSE reject via `allowedRanges`. Modes board unchanged.
