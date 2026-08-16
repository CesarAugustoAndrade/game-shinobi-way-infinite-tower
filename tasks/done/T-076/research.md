# T-076 research

Sibling pattern: T-064 Mud Wall (Shield 35 + Defensive), T-065 Brace (Shield 20 + Defensive), T-028 Rotation (Shield 50 + reflect, Mode-gated).

Sand Shield is the **higher-absorb earth wall without posture**. Same plant path, distinct mark id `sand_shield`, stacks **45**, duration **99**, costs AP1/CP5/CD3.

Catalog honesty: drop `effects[]` SHIELD 80×2. Do not retune Mud Wall / Brace / Rotation.

No new consume/family logic. ReadyOnTurn = turnIndex + CD + 1 (T-007).
