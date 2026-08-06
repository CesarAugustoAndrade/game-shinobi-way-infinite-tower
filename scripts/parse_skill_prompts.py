import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
md_path = ROOT / "docs" / "skill-art-prompts.md"
content = md_path.read_text(encoding="utf-8")

blocks = content.split("### ")
skills = []

for b in blocks[1:]:
    lines = b.strip().split("\n")
    header = lines[0]
    
    # Match ID e.g. 1. `basic_atk`
    m_id = re.search(r'`([^`]+)`', header)
    if not m_id:
        continue
    skill_id = m_id.group(1)
    
    # Extract file path
    m_file = re.search(r'-\s*\*\*File:\*\*\s*`([^`]+)`', b)
    file_path = m_file.group(1) if m_file else f"public/assets/skills/skill_{skill_id}.png"
    
    # Extract prompt in ``` ``` block
    m_prompt = re.search(r'```\s*(.*?)\s*```', b, re.DOTALL)
    prompt = m_prompt.group(1).strip() if m_prompt else ""
    
    skills.append({
        "id": skill_id,
        "file": file_path,
        "prompt": prompt
    })

print(f"Total skills parsed: {len(skills)}")

output_path = ROOT / "scratch" / "all_skill_prompts.json"
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(json.dumps(skills, indent=2), encoding="utf-8")
print(f"Saved JSON to {output_path}")
