from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
skills_dir = ROOT / "public" / "assets" / "skills"
manifest_path = ROOT / "src" / "game" / "constants" / "skillArtManifest.ts"

generated_ids = {f.stem.replace("skill_", ""): f.name for f in skills_dir.glob("skill_*.png")}
print("Generated skill IDs:", len(generated_ids))

content = manifest_path.read_text(encoding="utf-8")

for skill_id in generated_ids:
    pattern = rf'({{\s*"id":\s*"{skill_id}".*?"quality":\s*")([^"]+)(")'
    def repl(m):
        prefix = m.group(1)
        suffix = m.group(3)
        return f'{prefix}painted-png{suffix}'
    content = re.sub(pattern, repl, content, flags=re.DOTALL)

manifest_path.write_text(content, encoding="utf-8")
print("Updated skillArtManifest.ts with painted-png quality for generated skills!")
