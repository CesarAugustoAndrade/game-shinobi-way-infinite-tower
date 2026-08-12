"""List component + artifact art IDs and verify plate paths."""
from __future__ import annotations
import re
import unicodedata
from pathlib import Path


def art_slug(name: str) -> str:
    s = unicodedata.normalize("NFD", name)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower()
    s = re.sub(r"[''`]", "", s)
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_")


COMPONENTS = [
    "ninja_steel",
    "spirit_tag",
    "chakra_pill",
    "iron_sand",
    "anbu_mask",
    "training_weights",
    "swift_sandals",
    "tactical_scroll",
    "hashirama_cell",
]

ARTIFACT_META = [
    "Kubikiribōchō",
    "Chakra Flow Blade",
    "Samehada",
    "Gunbai War Fan",
    "Nuibari",
    "Kusanagi",
    "Hiramekarei",
    "Kabutowari",
    "Sage's Scripture",
    "Gourd of Sand",
    "Totsuka Blade",
    "Konan's Paper Wings",
    "Explosive Tag Array",
    "Flying Thunder God Seal",
    "Forbidden Scroll",
    "Eight Gates Core",
    "Yata Mirror",
    "Akimichi Food Pills",
    "Curse Mark Essence",
    "Sage Mode Chakra",
    "Byakugō Seal",
    "Susanoo Ribcage",
    "Hokage's Necklace",
    "Puppet Armor Core",
    "Jiraiya's Headband",
    "Will of Fire Charm",
    "Tsukuyomi Lens",
    "Shikamaru's Earrings",
    "Kakashi's Bell",
    "Nara Shadow Bind",
    "Weights Released",
    "Gentle Fist Wraps",
    "Eight Trigrams Map",
    "Yellow Flash Boots",
    "Body Flicker Sash",
    "Scroll of Seals",
    "Ten-Tails Husk",
    "Curse Mark (Heaven)",
    "Rinnegan Fragment",
    "Infinite Chakra Core",
    "Adamantine Chains",
    "Sharingan Implant",
    "Byakugan Awakening",
    "Shadow Mastery",
    "Uzumaki Vitality",
]


def main() -> None:
    base = Path("public/assets/icons")
    missing = []
    rows = []
    for c in COMPONENTS:
        p = base / "components" / f"{c}.jpg"
        rows.append(("component", c, str(p).replace("\\", "/"), p.exists()))
        if not p.exists():
            missing.append(str(p))
    for name in ARTIFACT_META:
        id_ = art_slug(name)
        p = base / "artifacts" / f"{id_}.jpg"
        rows.append(("artifact", id_, str(p).replace("\\", "/"), p.exists()))
        if not p.exists():
            missing.append(str(p))
    for kind, id_, path, ok in rows:
        print(f"{kind}\t{id_}\t{path}\t{'ok' if ok else 'MISSING'}")
    print(f"TOTAL {len(rows)} MISSING {len(missing)}")


if __name__ == "__main__":
    main()
