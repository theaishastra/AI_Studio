#!/usr/bin/env python3
"""One-time fix: assign every already-uploaded asset to its real Cloudinary folder.

The initial bulk upload set nested paths only inside `public_id` (e.g.
"sai_kumar_studio/corporate_assets/x"). On this account that alone doesn't register
an actual, browsable folder - Cloudinary only creates folder objects when the
`asset_folder` parameter is set explicitly (cloudinary_upload.py now does this for
new uploads). This script backfills asset_folder for everything already in
image_map.json via the lightweight Admin `update` API - no re-upload, no bandwidth.

Usage:
    python scripts/cloudinary_fix_folders.py
"""
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from dotenv import load_dotenv
import cloudinary
import cloudinary.api

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

cloudinary.config(
    cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
    api_key=os.environ["CLOUDINARY_API_KEY"],
    api_secret=os.environ["CLOUDINARY_API_SECRET"],
    secure=True,
)

MAP_PATH = ROOT / "image_map.json"
MAX_WORKERS = 8


def fix_one(public_id):
    asset_folder = public_id.rsplit("/", 1)[0]
    last_err = None
    for attempt in range(3):
        try:
            cloudinary.api.update(public_id, asset_folder=asset_folder)
            return public_id, None
        except Exception as e:  # noqa: BLE001
            last_err = str(e)
            time.sleep(1.5 * (attempt + 1))
    return public_id, last_err


def main():
    image_map = json.load(open(MAP_PATH, encoding="utf-8"))
    public_ids = sorted({data["public_id"] for data in image_map.values()})
    print(f"Fixing asset_folder for {len(public_ids)} assets...")

    failures = []
    done = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {ex.submit(fix_one, pid): pid for pid in public_ids}
        for fut in as_completed(futures):
            pid, err = fut.result()
            done += 1
            if err:
                failures.append((pid, err))
                print(f"[FAIL] {pid}: {err}")
            if done % 50 == 0 or done == len(public_ids):
                print(f"  {done}/{len(public_ids)}...")

    print(f"\nDone. {len(public_ids) - len(failures)} fixed, {len(failures)} failed.")
    if failures:
        for pid, err in failures:
            print(f"  {pid}: {err}")


if __name__ == "__main__":
    main()
