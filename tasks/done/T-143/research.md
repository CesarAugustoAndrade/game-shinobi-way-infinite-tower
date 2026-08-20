# T-143 · research

SOUL §9 + §10: Substitution ignores first enemy hit and retreats 1 band (forced/card, not manual move). T-129 helper is the contract.

**Options**

1. **Call helper after `applyOutgoingMarkCuts`, before shield** (recommended). Use returned damage 0, marks, and `range`. One engine.
2. Fold into `applyOutgoingMarkCuts` — drops range writeback unless that helper grows a range param. Spec rejected this.
3. After shield — miss consume when shield eats the hit. Wrong identity (ignore vs absorb).

**Recommendation:** option 1. No skill reauthor.

OOS: Reanimation lethal, C4 (done T-142), Discover, copy_jutsu.
