#!/usr/bin/env python3
"""Zip every local image asset folder plus image_map.json into one backup archive.

Purpose: preserve the original folder/file structure and the path->Cloudinary-URL
mapping so that if the local image folders are ever deleted, or the image host is
ever switched away from Cloudinary, nothing is lost - the zip alone is enough to
reconstruct both "what file was where" and "what URL it currently maps to".

Stored uncompressed (ZIP_STORED): the source images are already-compressed formats
(jpg/png/webp/...), so DEFLATE would barely shrink them while taking much longer.

Usage:
    python scripts/make_image_backup_zip.py [output_path]
"""
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

ASSET_DIRS = [
    "aboutus_assets",
    "assets",
    "corporate_assets",
    "gifts-assets",
    "navbar-icons-desktop",
    "navbar-icons-mobile",
    "Photography_assets",
    "studio_assets",
]


def main():
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "image_assets_backup.zip"

    files = []
    for d in ASSET_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        files.extend(p for p in base.rglob("*") if p.is_file())
    map_path = ROOT / "image_map.json"
    if map_path.exists():
        files.append(map_path)

    total_bytes = sum(f.stat().st_size for f in files)
    print(f"Zipping {len(files)} files ({total_bytes / 1_048_576:.1f} MB) -> {out_path}")

    tmp_path = out_path.with_suffix(".zip.tmp")
    with zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_STORED, allowZip64=True) as zf:
        for i, f in enumerate(files, 1):
            arcname = f.relative_to(ROOT).as_posix()
            zf.write(f, arcname)
            if i % 100 == 0 or i == len(files):
                print(f"  {i}/{len(files)}...")
    tmp_path.replace(out_path)

    print(f"\nDone. Archive size: {out_path.stat().st_size / 1_048_576:.1f} MB")


if __name__ == "__main__":
    main()
