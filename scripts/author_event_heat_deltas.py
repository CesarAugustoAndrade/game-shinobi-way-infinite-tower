"""F3-C2: inject heatDelta on valuable event outcomes (presets 5/10/20/30)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path("src/game/constants/events")


def score_effects_block(block: str) -> int:
    if "heatDelta" in block:
        return -1
    heat = 0
    if re.search(r"grantSkillById\s*:", block):
        heat = max(heat, 10)
    if re.search(r"upgradeTreasureQuality\s*:", block):
        heat = max(heat, 10)
    if re.search(r"addMerchantSlot\s*:", block):
        heat = max(heat, 10)
    m = re.search(r"\bryo\s*:\s*(-?\d+)", block)
    if m:
        ryo = int(m.group(1))
        if ryo >= 200:
            heat = max(heat, 30)
        elif ryo >= 100:
            heat = max(heat, 20)
        elif ryo >= 40:
            heat = max(heat, 10)
        elif ryo >= 10:
            heat = max(heat, 5)
    if re.search(r"statChanges\s*:\s*\{[^}]*:\s*[1-9]", block):
        heat = max(heat, 5)
    m = re.search(r"intelGain\s*:\s*(\d+)", block)
    if m and int(m.group(1)) >= 15:
        heat = max(heat, 5)
    m = re.search(r"\bexp\s*:\s*(\d+)", block)
    if m and int(m.group(1)) >= 50:
        heat = max(heat, 5)
    return heat


def process_file(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    out: list[str] = []
    i = 0
    added = 0
    while True:
        m = re.search(r"effects\s*:\s*\{", text[i:])
        if not m:
            out.append(text[i:])
            break
        start = i + m.start()
        brace_start = i + m.end() - 1
        out.append(text[i:start])
        depth = 0
        j = brace_start
        while j < len(text):
            c = text[j]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    j += 1
                    break
            j += 1
        block = text[start:j]
        heat = score_effects_block(block)
        if heat > 0:
            if re.search(r"logMessage\s*:", block):
                block2 = re.sub(
                    r"(\n)(\s*)(logMessage\s*:)",
                    rf"\1\2heatDelta: {heat},\n\2\3",
                    block,
                    count=1,
                )
            else:
                block2 = re.sub(
                    r"(\n?)(\s*)\}$",
                    rf"\1\2  heatDelta: {heat},\n\2}}",
                    block,
                    count=1,
                )
            if block2 != block:
                block = block2
                added += 1
        out.append(block)
        i = j
    new_text = "".join(out)
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
    return added


def main() -> None:
    total = 0
    for f in sorted(ROOT.glob("*.ts")):
        if "__tests__" in str(f):
            continue
        n = process_file(f)
        print(f"{f.name}: +{n}")
        total += n
    print(f"TOTAL added={total}")


if __name__ == "__main__":
    main()
