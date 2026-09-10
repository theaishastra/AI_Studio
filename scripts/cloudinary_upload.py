#!/usr/bin/env python3
"""Upload every local image asset to Cloudinary and record the mapping in image_map.json.

Reads CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET / CLOUDINARY_FOLDER
from .env at the repo root. Safe to re-run: files already present in image_map.json are
skipped unless --force is passed. Progress is flushed to image_map.json periodically so an
interrupted run can be resumed.

Usage:
    python scripts/cloudinary_upload.py [--force]
"""
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

CLOUD_NAME = os.environ["CLOUDINARY_CLOUD_NAME"]
API_KEY = os.environ["CLOUDINARY_API_KEY"]
API_SECRET = os.environ["CLOUDINARY_API_SECRET"]
FOLDER = os.environ["CLOUDINARY_FOLDER"]

cloudinary.config(cloud_name=CLOUD_NAME, api_key=API_KEY, api_secret=API_SECRET, secure=True)

# Every top-level directory in the repo that holds image assets referenced by the site.
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
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".jfif"}
MAP_PATH = ROOT / "image_map.json"
MAX_WORKERS = 8

_lock = Lock()


def collect_files():
    files = []
    for d in ASSET_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for p in sorted(base.rglob("*")):
            if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
                rel = p.relative_to(ROOT).as_posix()
                files.append((rel, p))
    return files


def load_map():
    if MAP_PATH.exists():
        with open(MAP_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_map(image_map):
    with _lock:
        tmp = MAP_PATH.with_suffix(".json.tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(image_map, f, indent=2, ensure_ascii=False, sort_keys=True)
        tmp.replace(MAP_PATH)


def sanitize_public_id(rel_no_ext):
    # Cloudinary rejects a public_id whose final segment starts/ends with whitespace.
    return "/".join(seg.strip() for seg in rel_no_ext.split("/"))


def upload_one(rel, path):
    rel_no_ext = Path(rel).with_suffix("").as_posix()
    public_id = f"{FOLDER}/{sanitize_public_id(rel_no_ext)}"
    asset_folder = public_id.rsplit("/", 1)[0]
    last_err = None
    for attempt in range(3):
        try:
            result = cloudinary.uploader.upload(
                str(path),
                public_id=public_id,
                asset_folder=asset_folder,
                overwrite=True,
                unique_filename=False,
                resource_type="image",
                use_filename=False,
            )
            secure_url = result["secure_url"]
            stable_url = re.sub(r"/v\d+/", "/", secure_url, count=1)
            return rel, {
                "url": secure_url,
                "url_stable": stable_url,
                "public_id": result["public_id"],
                "format": result["format"],
                "bytes": result["bytes"],
            }, None
        except Exception as e:  # noqa: BLE001 - want to retry on any transient upload error
            last_err = str(e)
            time.sleep(1.5 * (attempt + 1))
    return rel, None, last_err


def main():
    force = "--force" in sys.argv
    files = collect_files()
    print(f"Found {len(files)} local image files under: {', '.join(ASSET_DIRS)}")

    image_map = {} if force else load_map()
    todo = [(rel, path) for rel, path in files if force or rel not in image_map]
    print(f"{len(files) - len(todo)} already mapped, {len(todo)} to upload")

    if not todo:
        print("Nothing to do.")
        return

    failures = []
    done = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {ex.submit(upload_one, rel, path): rel for rel, path in todo}
        for fut in as_completed(futures):
            rel, data, err = fut.result()
            done += 1
            if data:
                with _lock:
                    image_map[rel] = data
            else:
                failures.append((rel, err))
                print(f"[FAIL] {rel}: {err}")
            if done % 25 == 0 or done == len(todo):
                save_map(image_map)
                print(f"  {done}/{len(todo)} uploaded...")

    save_map(image_map)

    print(f"\nDone. {len(image_map)} total mapped, {len(failures)} failed.")
    if failures:
        print("Failures:")
        for rel, err in failures:
            print(f"  {rel}: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
