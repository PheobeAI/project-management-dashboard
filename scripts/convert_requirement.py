#!/usr/bin/env python3
"""Requirement MD → JSON 转换脚本"""

import re
import json
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\Pheobe\Projects\project-management-dashboard\.project\requirement\M0")
TARGET_DIR = SOURCE_DIR


def parse_req_file(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    filename = path.stem  # e.g. "01-product-overview"

    # 解析文件类型
    is_overview = "product-overview" in filename
    is_func = "functional-req" in filename
    is_nonfunc = "non-functional" in filename
    is_stories = "user-stories" in filename
    is_acceptance = "acceptance-criteria" in filename
    is_visual = "visual-ui-req" in filename
    is_page = "page-design" in filename

    # 提取 title
    title_m = re.match(r"(?m)^#\s+(.+)", content)
    title = title_m.group(1).strip() if title_m else filename

    # 提取 overview（1.1节）
    overview = ""
    if is_overview:
        m = re.search(r"(?s)## 1\.1 产品定位\s*\n+(.+?)(?=\n##|\n---)", content)
        if m:
            overview = m.group(1).strip()[:500]

    # 提取功能需求（从 02-functional-req.md）
    func_reqs = []
    if is_func:
        # 匹配 ### F1 或 ## F1 格式的章节
        sections = re.split(r"(?m)^#{2,3}\s+(F\d+)\s+(.+?)(?=\n#{2,3}\s+F\d+|$)", content, re.DOTALL)
        # sections[0] = before first match, then (fid, rest) pairs
        for i in range(1, len(sections), 3):
            fid = sections[i]
            rest = sections[i+1] if i+1 < len(sections) else ""
            rest = rest.strip()

            # 找优先级（从表格或概述）
            pri = "P1"
            pri_m = re.search(r"\b(P0|P1|P2)\b", rest[:300])
            if pri_m:
                pri = pri_m.group(1)

            # 标题取章节名的第一行
            first_line = rest.split("\n")[0].strip()
            req_title = re.sub(r"^\*\*(.+?)\*\*.*", r"\1", first_line)
            if len(req_title) > 80:
                req_title = first_line[:80]

            func_reqs.append({
                "id": fid.strip(),
                "title": req_title[:100],
                "description": rest[:500],
                "priority": pri,
                "status": "approved",
                "dependencies": [],
                "acceptance": ""
            })

    # 提取非功能需求
    nonfunc_reqs = []
    if is_nonfunc:
        rows = re.findall(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$",
                          content, re.MULTILINE)
        for cat, desc, metric in rows[1:]:  # skip header
            cat = cat.strip()
            desc = desc.strip()
            metric = metric.strip()
            if cat and desc and cat != "类别":
                nonfunc_reqs.append({
                    "category": cat,
                    "description": desc[:200],
                    "metric": metric[:200]
                })

    # 提取用户故事
    user_stories = []
    if is_stories:
        sections = re.split(r"(?m)^## ", content)
        for section in sections[1:]:
            lines = section.split("\n", 1)
            title_s = lines[0].strip()
            body = lines[1] if len(lines) > 1 else ""
            if ":" in title_s:
                role, goal_benefit = title_s.split(":", 1)
                user_stories.append({
                    "role": role.strip(),
                    "goal": goal_benefit.strip()[:100],
                    "benefit": ""
                })

    # 提取验收标准
    acceptance_criteria = []
    if is_acceptance:
        items = re.findall(r"(?m)^[-*]\s+\[([ x])\]\s+(.+)$", content)
        acceptance_criteria = [t.strip() for _, t in items]

    # 提取页面规格（从 07-page-design.md）
    pages = []
    if is_page:
        sections = re.split(r"(?m)^## ", content)
        for section in sections[1:]:
            lines = section.split("\n", 1)
            page_name = lines[0].strip()
            body = lines[1] if len(lines) > 1 else ""
            if page_name:
                pages.append({
                    "name": page_name,
                    "entry": "",
                    "position": "",
                    "description": body[:300] if body else "",
                    "features": []
                })

    # 通用 changelog
    changelog = []
    if "changelog" in filename:
        rows = re.findall(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|$",
                          content, re.MULTILINE)
        for version, date, changes in rows[1:]:
            version = version.strip()
            date = date.strip()
            changes_list = [c.strip() for c in changes.split("-") if c.strip()]
            changelog.append({
                "version": version,
                "date": date,
                "changes": changes_list
            })

    obj = {
        "id": filename.upper().replace("-", "_").replace("0", "REQ-"),
        "owner": "PM",
        "title": title[:200],
        "version": "v1",
        "status": "approved",
        "priority": "P0",
        "milestone": "M0",
        "overview": overview,
        "functional_requirements": func_reqs,
        "non_functional_requirements": nonfunc_reqs,
        "user_stories": user_stories,
        "acceptance_criteria": acceptance_criteria,
        "pages": pages,
        "changelog": changelog,
        "updated_at": None
    }

    return obj


def main():
    md_files = sorted([f for f in SOURCE_DIR.glob("*.md") if f.stem not in ("README", "changelog")])
    converted = 0
    errors = []

    for path in md_files:
        try:
            obj = parse_req_file(path)
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
