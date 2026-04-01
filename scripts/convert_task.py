#!/usr/bin/env python3
"""Task MD → JSON 转换脚本"""

import os
import re
import json
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\Pheobe\Projects\project-management-dashboard\.project\task\M0")
TARGET_DIR = SOURCE_DIR

ART_STATUS_MAP = {
    "art_todo": "todo",
    "art_in_progress": "in_progress",
    "art_done": "done",
    "done": "done",
    "cancelled": "cancelled",
    "paused": "paused",
}

DEV_STATUS_MAP = {
    "todo": "todo",
    "in_progress": "in_progress",
    "dev_done": "dev_done",
    "tested": "tested",
    "done": "done",
    "cancelled": "cancelled",
    "paused": "paused",
}


def parse_header_fields(content: str) -> dict:
    """从顶部 **Key**: Value 格式提取字段"""
    fields = {}
    header_match = re.search(r"(?s)^([\s\S]+?)\n---", content)
    if not header_match:
        return fields
    header_block = header_match.group(1)
    lines = header_block.split("\n")
    # 第一行是 Markdown 标题
    if lines and lines[0].startswith("#"):
        fields["_title_line"] = lines[0].lstrip("# ").strip()
    for line in lines[1:]:
        m = re.match(r"\*\*([^\*]+)\*\*:\s*(.+)", line)
        if m:
            fields[m.group(1).strip()] = m.group(2).strip()
    return fields


def parse_sections(content: str) -> dict:
    """解析 ## 章节标题 格式的各部分"""
    sections = {}
    parts = re.split(r"(?m)^## ", content)
    for part in parts:
        if not part.strip():
            continue
        lines = part.split("\n", 1)
        title = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ""
        sections[title] = body
    return sections


def parse_table_rows(text: str) -> list:
    """解析 Markdown 表格，返回每行的 dict（第一行为 header）"""
    rows = re.findall(r"^\|.+\|$", text, re.MULTILINE)
    if len(rows) < 2:
        return []
    header = [h.strip() for h in rows[0].split("|")[1:-1]]
    result = []
    for row in rows[2:]:  # skip header and separator
        cells = [c.strip() for c in row.split("|")[1:-1]]
        if len(cells) == len(header):
            result.append(dict(zip(header, cells)))
    return result


def parse_checklist(text: str) -> list:
    """解析验收标准 checklist"""
    items = re.findall(r"^\s*[-*]\s*\[([ x])\]\s*(.+)$", text, re.MULTILINE)
    return [{"done": c == "x", "text": t.strip()} for c, t in items]


def parse_dependencies(text: str) -> dict:
    """解析依赖关系章节"""
    deps = {}
    for line in text.split("\n"):
        if ":" in line and not line.startswith("-"):
            key_val = line.split(":", 1)
            key = key_val[0].strip().strip("**")
            val = key_val[1].strip()
            deps[key] = val
    return deps


def parse_task_file(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    filename = path.stem
    header = parse_header_fields(content)
    sections = parse_sections(content)

    # ID
    task_id = header.get("ID", filename)

    # Type
    raw_type = header.get("Type", "art").lower()
    task_type = "art" if raw_type == "art" else raw_type

    # Status
    raw_status = header.get("Status", "todo").lower()
    if task_type == "art":
        status = ART_STATUS_MAP.get(raw_status, raw_status)
    else:
        status = DEV_STATUS_MAP.get(raw_status, raw_status)

    # Priority
    priority = header.get("Priority", "P2")

    # Title
    title = header.get("_title_line", "") or header.get("title", "")
    if not title:
        title = filename

    # Description
    description = sections.get("任务概述", "").split("\n")[0].strip()

    # Milestone
    milestone = "M0"

    # Dependencies
    deps_raw = sections.get("依赖关系", "")
    deps_parsed = parse_dependencies(deps_raw)
    hard_dep = None
    soft_dep = None
    dep_list = []

    if "Hard 依赖" in deps_parsed:
        hard_raw = deps_parsed["Hard 依赖"]
        hard_dep = "hard"
        dep_list = re.findall(r"(?:ART|DEV|BUG|TASK)-\d+", hard_raw)

    if "Soft 依赖" in deps_parsed:
        soft_raw = deps_parsed["Soft 依赖"]
        hard_dep = "soft"
        deps_from_text = re.findall(r"(?:ART|DEV|BUG|TASK)-\d+", soft_raw)
        dep_list.extend(deps_from_text)

    art_dependency = hard_dep or "none"

    # Deliverables（资产清单）
    deliverables = []
    assets_section = sections.get("资产清单", "")
    # 找到所有表格
    tables = re.split(r"(?m)^### ", assets_section)
    for table_block in tables:
        if not table_block.strip():
            continue
        rows = parse_table_rows(table_block)
        for row in rows:
            asset = row.get("资产", "") or row.get("资产名称", "")
            output = row.get("输出路径", "")
            if asset and output:
                deliverables.append(f"{asset}: {output}")
            elif asset:
                deliverables.append(asset)

    # Acceptance criteria
    acceptance_section = sections.get("验收标准", "")
    checklist = parse_checklist(acceptance_section)

    # Technical constraints
    tech_constraints = sections.get("技术约束", "")

    # Created at
    created_at = None
    if header.get("Created"):
        created_at = header["Created"] + "T00:00:00+08:00"

    obj = {
        "id": task_id,
        "owner": "Art" if task_type == "art" else "Engineer",
        "title": title[:200],
        "type": task_type,
        "description": description[:1000],
        "status": status,
        "milestone": milestone,
        "assignee": None,
        "priority": priority,
        "dependencies": list(set(dep_list)),
        "art_dependency": art_dependency,
        "estimated_hours": None,
        "actual_hours": None,
        "estimated_started": None,
        "started_at": None,
        "completed_at": None,
        "deliverables": deliverables,
        "test_strategy": None,
        "review_comments": [],
        "updated_at": None,
    }

    return obj


def main():
    md_files = sorted([f for f in SOURCE_DIR.glob("*.md") if f.stem not in ("README", "index")])
    converted = 0
    errors = []

    for path in md_files:
        try:
            obj = parse_task_file(path)
            target_path = TARGET_DIR / f"{path.stem}.json"
            with open(target_path, "w", encoding="utf-8") as f:
                json.dump(obj, f, ensure_ascii=False, indent=2)
            print(f"[OK] {path.name} → {path.stem}.json")
            converted += 1
        except Exception as e:
            print(f"[ERR] {path.name}: {e}")
            errors.append(f"{path.name}: {e}")

    print(f"\n完成: {converted}/{len(md_files)} 成功")
    if errors:
        print("失败:")
        for e in errors:
            print(f"  {e}")


if __name__ == "__main__":
    main()
