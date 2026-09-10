#!/usr/bin/env python3
"""Repoint every local image reference in the site's HTML/CSS/JS to its Cloudinary URL.

Reads image_map.json (produced by cloudinary_upload.py) and rewrites source files in
place so they use the Cloudinary url_stable for each image instead of a local path.

Two kinds of references exist in this codebase:

1. Direct literal paths - e.g. src="assets/foo.png", url("../gifts-assets/x.png"),
   'Photography_assets/assets/hero/wedding.png' (sometimes with %20-encoded spaces).
   These are handled generically: for every mapped relative path, replace any occurrence
   of that path (optionally preceded by ./ or ../ segments) with its Cloudinary URL.

2. Dynamic "base + bare filename" references - a few JS files build the final path at
   runtime from a folder-prefix constant/template plus an array of bare filenames
   (js/gallery-2.js, js/photography.js, js/booking.js, js/gifts.js). For these the
   prefix itself is repointed to the Cloudinary folder, and every bare filename is
   corrected to match Cloudinary's actual served extension (Cloudinary normalizes
   .jpeg/.jfif -> .jpg on upload, so a raw prefix swap alone would 404).

Usage:
    python scripts/apply_cloudinary_urls.py [--dry-run]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = ROOT / "image_map.json"

TARGET_GLOBS = ["*.html", "css/*.css", "js/*.js", "js/shared/*.js"]

# Dynamic "folder-prefix + bare filename" spots that can't be fixed by literal-path
# substitution alone. Each entry: (files to patch, prefix template text, folder key
# used to resolve bare filenames against image_map).
DYNAMIC_PREFIXES = [
    {
        "files": ["js/gallery-2.js", "js/photography.js", "js/booking.js"],
        "old_prefix": "Photography_assets/assets/portfolio/",
        "folder": "Photography_assets/assets/portfolio",
    },
    {
        "files": ["js/photography.js", "js/booking.js"],
        "old_prefix": "Photography_assets/assets/packages/",
        "folder": "Photography_assets/assets/packages",
    },
]

BARE_FILENAME_RE = re.compile(r"(['\"])([^'\"/\\]+\.(?:png|jpe?g|webp|gif|jfif|avif))\1", re.IGNORECASE)


def load_map():
    with open(MAP_PATH, encoding="utf-8") as f:
        return json.load(f)


def build_basename_indices(image_map):
    """folder relative path -> {basename: url_stable}, for the dynamic-prefix folders
    plus gifts-assets (used by js/gifts.js's GALLERY_ROOT pattern)."""
    folders = {
        "Photography_assets/assets/portfolio",
        "Photography_assets/assets/packages",
        "gifts-assets",
    }
    index = {folder: {} for folder in folders}
    for rel, data in image_map.items():
        for folder in folders:
            prefix = folder + "/"
            if rel.startswith(prefix):
                basename = rel[len(prefix):]
                index[folder][basename] = data["url_stable"]
    return index


def build_literal_pattern(image_map):
    """One combined regex covering every mapped path (plus its %20-encoded variant),
    longest first so a nested path wins over a shorter suffix of it. A single re.sub
    pass guarantees each character of the input is matched at most once, so a
    replacement (a Cloudinary URL, which itself contains the encoded path as a
    substring) can never be re-matched by a later alternative."""
    variants = {}
    for rel_path, data in image_map.items():
        variants[rel_path] = data["url_stable"]
        encoded = rel_path.replace(" ", "%20")
        if encoded != rel_path:
            variants.setdefault(encoded, data["url_stable"])
    ordered_keys = sorted(variants, key=len, reverse=True)
    alternation = "|".join(re.escape(k) for k in ordered_keys)
    # Optional leading ./ or ../ segments so "assets/x.png", "../assets/x.png" and
    # "./assets/x.png" all match fully (and get consumed, not left dangling). The
    # boundary lookbehind stops this from matching the tail of an *already migrated*
    # Cloudinary URL (e.g. ".../upload/sai_kumar_studio/assets/x.png") on a re-run -
    # a real local-path reference is always preceded by a quote/paren/whitespace or
    # the start of the file, never by "/" as part of a larger URL.
    boundary = r"(?:(?<=[\"'`(\s])|^)"
    pattern = re.compile(boundary + r"(?:\.{1,2}/)*(" + alternation + r")")
    return pattern, variants


def apply_literal_substitution(text, pattern, variants):
    changed = 0

    def repl(m):
        nonlocal changed
        changed += 1
        return variants[m.group(1)]

    text = pattern.sub(repl, text)
    return text, changed


def apply_dynamic_prefixes(text, filename, indices):
    changed = 0
    for spec in DYNAMIC_PREFIXES:
        if filename not in spec["files"]:
            continue
        folder = spec["folder"]
        basename_map = indices[folder]
        # Any leftover full-path occurrence already got literal-substituted by pass A
        # (whole match found -> no ${...} left), so only unresolved template prefixes
        # (followed by ${) remain here.
        old_prefix = spec["old_prefix"]
        stable_prefix = None
        if basename_map:
            sample_url = next(iter(basename_map.values()))
            stable_prefix = sample_url.rsplit("/", 1)[0] + "/"
        if stable_prefix:
            # Only replace a prefix that directly follows a backtick (a fresh
            # template literal) - not one already preceded by "res.cloudinary.com"
            # as the tail of an already-migrated URL, which would double-prepend
            # stable_prefix on a re-run.
            target = re.compile(r"(?<=`)" + re.escape(old_prefix) + r"(?=\$\{)")
            text, n = target.subn(stable_prefix, text)
            changed += n
    return text, changed


def apply_bare_filename_fix(text, filename, indices):
    if filename not in {"js/gallery-2.js", "js/photography.js", "js/booking.js", "js/gifts.js"}:
        return text, 0
    search_order = ["Photography_assets/assets/portfolio", "Photography_assets/assets/packages", "gifts-assets"]
    changed = 0

    def repl(m):
        nonlocal changed
        quote, name = m.group(1), m.group(2)
        for folder in search_order:
            url = indices[folder].get(name)
            if url:
                corrected = url.rsplit("/", 1)[-1]
                if corrected != name:
                    changed += 1
                    return f"{quote}{corrected}{quote}"
                return m.group(0)
        return m.group(0)

    text = BARE_FILENAME_RE.sub(repl, text)
    return text, changed


def apply_gifts_gallery_root(text, filename, indices):
    if filename != "js/gifts.js":
        return text, 0
    basename_map = indices["gifts-assets"]
    if not basename_map:
        return text, 0
    sample_url = next(iter(basename_map.values()))
    stable_prefix = sample_url.rsplit("/", 1)[0] + "/"
    old = "const GALLERY_ROOT = 'gifts-assets/';"
    new = f"const GALLERY_ROOT = '{stable_prefix}';"
    if old in text:
        return text.replace(old, new), 1
    return text, 0


def main():
    dry_run = "--dry-run" in sys.argv
    image_map = load_map()
    indices = build_basename_indices(image_map)
    literal_pattern, literal_variants = build_literal_pattern(image_map)

    files = []
    for glob_pattern in TARGET_GLOBS:
        files.extend(sorted(ROOT.glob(glob_pattern)))
    files = [f for f in files if f.is_file()]

    total_literal = 0
    total_prefix = 0
    total_bare = 0
    total_gallery_root = 0
    touched_files = []

    for path in files:
        rel_name = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8")
        original = text

        text, n_literal = apply_literal_substitution(text, literal_pattern, literal_variants)
        text, n_prefix = apply_dynamic_prefixes(text, rel_name, indices)
        text, n_bare = apply_bare_filename_fix(text, rel_name, indices)
        text, n_root = apply_gifts_gallery_root(text, rel_name, indices)

        total_literal += n_literal
        total_prefix += n_prefix
        total_bare += n_bare
        total_gallery_root += n_root

        if text != original:
            touched_files.append((rel_name, n_literal, n_prefix, n_bare, n_root))
            if not dry_run:
                path.write_text(text, encoding="utf-8")

    print(f"{'[DRY RUN] ' if dry_run else ''}Scanned {len(files)} files")
    for rel_name, n_literal, n_prefix, n_bare, n_root in touched_files:
        parts = []
        if n_literal:
            parts.append(f"{n_literal} literal path(s)")
        if n_prefix:
            parts.append(f"{n_prefix} dynamic prefix(es)")
        if n_bare:
            parts.append(f"{n_bare} bare filename(s) extension-corrected")
        if n_root:
            parts.append("GALLERY_ROOT repointed")
        print(f"  {rel_name}: {', '.join(parts)}")

    print(
        f"\nTotals: {total_literal} literal path replacements, "
        f"{total_prefix} dynamic prefixes repointed, "
        f"{total_bare} bare filenames extension-corrected, "
        f"{total_gallery_root} GALLERY_ROOT rewrites"
    )


if __name__ == "__main__":
    main()
