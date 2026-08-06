"""Structural check: docs/skill-art-prompts.md covers every skill id in catalog order.

Run: python scripts/verify_skill_art_prompts_md.py
Exit 0 on pass.
"""
from __future__ import annotations
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def manifest_ids() -> list[str]:
    text = (ROOT / "src/game/constants/skillArtManifest.ts").read_text(encoding="utf-8")
    return re.findall(r'"id":\s*"([^"]+)"', text)


def skills_ts_ids() -> set[str]:
    text = (ROOT / "src/game/constants/skills.ts").read_text(encoding="utf-8")
    return set(re.findall(r"id:\s*'([^']+)'", text))


def ordered_catalog() -> list[str]:
    man = manifest_ids()
    seen: set[str] = set()
    ordered: list[str] = []
    for i in man:
        if i not in seen:
            ordered.append(i)
            seen.add(i)
    for i in sorted(skills_ts_ids()):
        if i not in seen:
            ordered.append(i)
            seen.add(i)
    return ordered


def md_ids(md: str) -> list[str]:
    return re.findall(r"^### \d+\. `([^`]+)`", md, re.M)


def main() -> int:
    md_path = ROOT / "docs/skill-art-prompts.md"
    if not md_path.is_file():
        print("FAIL: missing docs/skill-art-prompts.md")
        return 1
    md = md_path.read_text(encoding="utf-8")
    catalog = ordered_catalog()
    found = md_ids(md)
    errors: list[str] = []
    if found != catalog:
        errors.append(
            f"order/coverage mismatch catalog={len(catalog)} md={len(found)} "
            f"missing={sorted(set(catalog)-set(found))} extra={sorted(set(found)-set(catalog))}"
        )
    for sid in ("fireball", "shuriken", "kai"):
        block = re.search(rf"### \d+\. `{sid}`\n\n(.*?)(?=\n### |\Z)", md, re.S)
        if not block:
            errors.append(f"missing entry {sid}")
            continue
        b = block.group(0)
        if "16:9" not in b:
            errors.append(f"{sid}: missing 16:9")
        if "cel-shaded" not in b or "seinen" not in b:
            errors.append(f"{sid}: missing style lock")
        if "LIGHTING / BG" in b:
            errors.append(f"{sid}: obsolete LIGHTING/BG block still present")
        if "WORLD / DEPTH" not in b or "HERO SUBJECT" not in b:
            errors.append(f"{sid}: missing cinematic WORLD/HERO structure")
        if "combat skill card background" in b or "flat purple" in b.lower() and "NOT" not in b:
            # old void-style positive instruction should be gone
            if "combat skill card background" in b:
                errors.append(f"{sid}: obsolete void-style 'combat skill card background'")
    if errors:
        print("FAIL verify_skill_art_prompts_md")
        for e in errors:
            print(" -", e)
        return 1
    print(f"PASS verify_skill_art_prompts_md: {len(found)} prompts in catalog order")
    return 0


if __name__ == "__main__":
    sys.exit(main())
