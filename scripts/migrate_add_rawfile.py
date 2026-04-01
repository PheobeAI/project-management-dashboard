#!/usr/bin/env python3
"""
Migration: Add rawFile reference + move MD to Legacy/
For each .md file that has a corresponding .json already created:
  1. Update the existing JSON to add rawFile field pointing to Legacy/{filename}.md
  2. Move the .md file to Legacy/{filename}.md
For .md files without a corresponding .json (edge cases):
  1. Create a minimal stub JSON with rawFile
  2. Move the .md to Legacy/
README.md and INDEX.md are left untouched.
"""

import os
import json
import shutil
from pathlib import Path

PROJ_ROOT = Path(r"C:\Users\Pheobe\Projects\project-management-dashboard\.project")

# Directories to process (name -> whether to recurse)
DIRS = {
    "bug": True,          # bug/M0/*.md + bug/M0/*.json
    "requirement": True,  # requirement/M0/*.md
    "task": True,         # task/M0/ART-*.md (DEV-*.json only, no MD to move)
    "test-result": True,  # test-result/M0/TEST-REPORT-*.md
    "tech-design": True,   # tech-design/M0/ARCHITECTURE.md, tech-design/M1/ARCHITECTURE.md
}

# Files to skip (never migrate)
SKIP_FILES = {"README.md", "INDEX.md", "TEST-PLAN.md", "changelog.md"}


def get_milestone_dirs(base_dir):
    """Get all milestone subdirs (M0, M1, ...) under base_dir."""
    results = []
    try:
        for entry in os.scandir(base_dir):
            if entry.is_dir() and entry.name.startswith("M"):
                results.append(Path(entry.path))
    except OSError:
        pass
    return sorted(results)


def add_rawfile_to_json(json_path, relative_legacy_path):
    """Read existing JSON, add rawFile field, write back."""
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # rawFile is the path to the legacy MD relative to .project root
    data["rawFile"] = str(relative_legacy_path)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def create_stub_json(json_path, md_path, relative_legacy_path):
    """Create minimal stub JSON for an MD file without existing JSON."""
    filename = md_path.stem
    stub = {
        "id": filename,
        "owner": "TODO",
        "title": filename,
        "rawFile": str(relative_legacy_path),
        "status": "open",
        "milestone": "M0",
        "version": "v1",
        "project": "TODO",
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(stub, f, ensure_ascii=False, indent=2)


def migrate_dir(base_name, base_path):
    """
    Process one base directory (e.g. bug/, requirement/, etc.)
    For each milestone subdir, find MD files and migrate them.
    """
    print(f"\n=== Processing {base_name}/ ===")
    migrated = 0
    skipped = 0
    errors = []

    # Find all milestone subdirs
    milestone_dirs = get_milestone_dirs(base_path)

    for milestone_dir in milestone_dirs:
        md_files = sorted(milestone_dir.glob("*.md"))

        for md_path in md_files:
            filename = md_path.name

            if filename in SKIP_FILES:
                skipped += 1
                print(f"  [SKIP] {md_path.relative_to(PROJ_ROOT)}")
                continue

            json_path = milestone_dir / (md_path.stem + ".json")
            legacy_dir = milestone_dir / "Legacy"
            legacy_md_path = legacy_dir / filename

            try:
                # Create Legacy/ subdir if needed
                legacy_dir.mkdir(exist_ok=True)

                # Move MD to Legacy/
                shutil.move(str(md_path), str(legacy_md_path))

                # Update or create JSON
                if json_path.exists():
                    add_rawfile_to_json(json_path, f"{base_name}/{milestone_dir.name}/Legacy/{filename}")
                    print(f"  [OK]   {md_path.relative_to(PROJ_ROOT)} -> rawFile added, MD moved to Legacy/")
                else:
                    create_stub_json(json_path, md_path, f"{base_name}/{milestone_dir.name}/Legacy/{filename}")
                    print(f"  [STUB] {md_path.relative_to(PROJ_ROOT)} -> stub JSON created, MD moved to Legacy/")

                migrated += 1

            except Exception as e:
                errors.append(f"{md_path.relative_to(PROJ_ROOT)}: {e}")
                print(f"  [ERR]  {md_path.relative_to(PROJ_ROOT)}: {e}")

    print(f"  -> Migrated: {migrated}, Skipped: {skipped}, Errors: {len(errors)}")
    return migrated, skipped, errors


def main():
    total_migrated = 0
    total_skipped = 0
    all_errors = []

    for dir_name, should_recurse in DIRS.items():
        base_path = PROJ_ROOT / dir_name
        if not base_path.exists():
            print(f"[WARN] {dir_name}/ does not exist, skipping")
            continue

        migrated, skipped, errors = migrate_dir(dir_name, base_path)
        total_migrated += migrated
        total_skipped += skipped
        all_errors.extend(errors)

    print(f"\n{'='*50}")
    print(f"Total migrated: {total_migrated}")
    print(f"Total skipped:   {total_skipped}")
    if all_errors:
        print(f"Errors ({len(all_errors)}):")
        for e in all_errors:
            print(f"  {e}")
    else:
        print("No errors!")


if __name__ == "__main__":
    main()
