#!/usr/bin/env python3
"""Remove generated hash-suffix duplicate media files while preserving canonical gallery files.

This script keeps the real shop product images such as:
- tuneinhoodie1.webp, tuneinhoodie2.webp, ...
- naturevsmachine1.webp, ...
- solastalgia.webp and solastalgia-uv.webp

and removes only generated duplicates like:
- tuneinhoodie1_ABCDEF12.webp
- naturevsmachine2_xxx_yyy.webp
- placeholder-product_abc123.svg

The rule is intentionally conservative: it only removes files whose stem contains a
random hash-like suffix after an underscore. Real numbered/UV assets remain intact.
"""

from __future__ import annotations

import re
from pathlib import Path


GENERATED_SUFFIX_RE = re.compile(r"_(?:[A-Za-z0-9]{5,})(?:_[A-Za-z0-9]{5,})*$")

def is_generated_duplicate(path: Path) -> bool:
    """Return True when the filename is a hash-suffix variant, not a real canonical asset."""
    stem = path.stem
    stem_lower = stem.lower()

    if stem_lower == "placeholder-product":
        return False

    if "placeholder-product" in stem_lower and stem_lower != "placeholder-product":
        return True

    # Keep canonical real files such as tuneinhoodie2.webp or solastalgia-uv.webp.
    # Remove auto-generated duplicate files like tuneinhoodie2_xxx123.webp.
    return bool(GENERATED_SUFFIX_RE.search(stem))


def prune_media_dir(media_dir: Path) -> tuple[int, list[str]]:
    deleted: list[str] = []

    if not media_dir.exists():
        return 0, deleted

    for path in sorted(media_dir.iterdir()):
        if not path.is_file():
            continue
        if is_generated_duplicate(path):
            path.unlink()
            deleted.append(path.name)

    return len(deleted), deleted


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    media_dir = repo_root / "media" / "products"

    removed_count, removed_files = prune_media_dir(media_dir)
    remaining = sorted(p.name for p in media_dir.iterdir() if p.is_file()) if media_dir.exists() else []

    print(f"Removed {removed_count} generated duplicate files.")
    if removed_files:
        print("Examples:")
        for name in removed_files[:10]:
            print(f"- {name}")
    print(f"Remaining canonical files: {len(remaining)}")
    for name in remaining:
        print(f"- {name}")


if __name__ == "__main__":
    main()
