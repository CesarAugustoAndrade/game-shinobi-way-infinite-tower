---
description: Skill genesis — build a new project skill via seed or joint research
---

Input: $ARGUMENTS = <skill-name> [--seed <file>]

Genesis of a skill, always with the user in the loop. Two paths (skill
`loop-engineering` → references/skills-self-learning.md):

- **Seed path** (`--seed <file>`): the user provides the base knowledge. Structure
  it to the skill format (SKILL.md + optional RUBRIC.md/examples/) and propose the
  gaps to fill.
- **Research path**: brainstorm + joint investigation (the creational loop applied
  to knowledge). Investigate, debate, and write the agreed result as SKILL.md v1.0.

Create the folder `.claude/skills/<skill-name>/` with SKILL.md; add RUBRIC.md +
empty SCORES.md if the skill has a subjective dimension, and examples/good|bad/.
Seed LEARNINGS.md. Show everything to the user before writing.
