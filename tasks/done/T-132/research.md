# T-132 research

In-repo only (T-080 gate shape + T-128 mark id).

## Options

1. **New `enemyVoluntaryMoveBlocked` beside Water Prison helper** — different actor, all directions. **Recommend.**
2. Generalized allowlist `{ id, target, directions }` — more than S; not required.
3. Skip turn like Stun — contradicts Bound ≠ Stun. Reject.
4. Block player voluntary when enemy Bound — wrong actor. Reject.

## Recommendation

RangeSystem helper + one `if` in `executeEnemyAction` before `shiftRange`. Tests plant T-128 `bound` or construct the mark. Sim probe: free RETREAT CLOSE→MEDIUM vs locked stay CLOSE.
