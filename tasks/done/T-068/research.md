# T-068 research

Internal pattern reuse only. Three options:

1. **Dedicated `supportHeal` (recommended).** `{ amount: 25, cleanseOneOf: ['poison','bleed'] }`. New `resolveSupportHeal`. Does not touch Kai `supportCleanse`.

2. **Extend `supportCleanse` with heal + DoT ids.** One SUPPORT hook, but mixes mental refund semantics with medical heal. Risk of Kai accidental retune.

3. **Honor mute `effects[]` HEAL on SUPPORT.** Live-path smell; no one-instance DoT contract; discarded.

**Recommendation:** option 1. AC2: hp 50/100 + poison then bleed → hp 75, first matching mark removed (poison if first). AC3: no DoT → hp 75, marks unchanged.
