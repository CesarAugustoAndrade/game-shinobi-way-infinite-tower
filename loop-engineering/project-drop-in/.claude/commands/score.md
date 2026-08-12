---
description: Record a human score for a task dimension into the skill's SCORES.md
---

Input: $ARGUMENTS = T-XXX <dimension> <0-100> "why"

Append the human score to the owning skill's SCORES.md, computing Δ automatically
against that dimension's last recorded score (skill `loop-engineering` →
references/scoring-and-calibration.md). Format:

```
| T-XXX | <dimension> | <score> | human | <Δ> | <why (≤1 line)> |
```

If the task was in `pending-score` (step 6b of /task-dev launched unattended),
recording the Phase 1-2 scores here unblocks its CLOSE.

Companion read-only view: `/skill-score <skill>` shows SCORES.md trends and the
human-vs-reviewer discrepancy rate (calibration health).
