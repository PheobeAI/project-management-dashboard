#!/usr/bin/env python3
"""Design MD → JSON 转换脚本"""

import re
import json
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\Pheobe\Projects\project-management-dashboard\.project\design\M0")
TARGET_DIR = SOURCE_DIR


def parse_header(content: str) -> dict:
    meta = {}
    m = re.search(r"(?s)^([\s\S]+?)\n---", content)
    if not m:
        return meta
    block = m.group(1)
    for line in block.split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            meta[key.strip().strip("*")] = val.strip().strip("*")
    return meta


def parse_animation_file(path: Path, content: str) -> dict:
    """解析动画规范文件"""
    animations = []
    sections = re.split(r"(?m)^## ", content)
    for section in sections[1:]:
        lines = section.split("\n", 1)
        name = lines[0].strip()
        body = lines[1] if len(lines) > 1 else ""
        if not name:
            continue
        duration_m = re.search(r"时长[：:]\s*(\d+(?:\.\d+)?s|ms)", body)
        easing_m = re.search(r"缓动[：:]\s*([\w-]+)", body)
        trigger_m = re.search(r"触发[：:]\s*(.+?)(?:\n|$)", body)
        animations.append({
            "name": name[:100],
            "description": body[:300],
            "duration": duration_m.group(1) if duration_m else "",
            "easing": easing_m.group(1) if easing_m else "",
            "trigger": trigger_m.group(1).strip() if trigger_m else ""
        })
    return {"animations": animations}


def parse_component_file(path: Path, content: str) -> dict:
    """解析组件规范文件"""
    components = []
    sections = re.split(r"(?m)^## |^### ", content)
    for section in sections[1:]:
        lines = section.split("\n", 1)
        name = lines[0].strip()
        body = lines[1] if len(lines) > 1 else ""
        if not name or len(name) > 60:
            continue
        # 提取状态
        states_m = re.findall(r"(?:状态|state)[：:]\s*([^\n]+)", body)
        states = []
        for s in states_m:
            states.extend([x.strip() for x in re.split(r"[,，、]", s) if x.strip()])

        components.append({
            "name": name[:100],
            "description": body[:300],
            "states": list(set(states))[:10],
            "props": {}
        })
    return {"components": components}


def parse_style_guide(content: str) -> dict:
    """从 style-guide.md 提取样式规范"""
    style_guide = {"colors": {}, "typography": {}, "spacing": {}, "icons": {}}
    try:
        # 尝试从表格提取颜色
        table_match = re.search(r"(?s)##?\s*1\.\s*颜色.+?\n((?:\|.+\|\n)+)", content)
        if table_match:
            for row_match in re.finditer(r"^\|(.+?)\|(.+?)\|(.+?)\|", table_match.group(1), re.MULTILINE):
                hex_val = row_match.group(1).strip()
                rgb_val = row_match.group(2).strip()
                usage = row_match.group(3).strip()
                if hex_val and usage and len(hex_val) <= 12 and rgb_val != "RGB":
                    style_guide["colors"][usage] = f"{hex_val} ({rgb_val})"
    except Exception:
        pass
    return style_guide


def parse_design_file(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    filename = path.stem
    header = parse_header(content)

    # 判断文件类型
    is_component = "component" in filename.lower()
    is_animation = "animation" in filename.lower()
    is_style = "style" in filename.lower()
    is_layout = "layout" in filename.lower() and "svg" not in filename.lower()
    is_page = "page" in filename.lower() and "svg" not in filename.lower()

    project = header.get("项目", "project-management-dashboard")
    version = header.get("版本", "v1.0")

    # 提取页面列表
    pages = []
    if is_page:
        sections = re.split(r"(?m)^## ", content)
        for section in sections[1:]:
            lines = section.split("\n", 1)
            page_name = lines[0].strip()
            body = lines[1] if len(lines) > 1 else ""
            if page_name and len(page_name) < 50:
                pages.append({
                    "name": page_name,
                    "entry": "",
                    "description": body[:200] if body else "",
                    "layout": "",
                    "features": [],
                    "svg_ref": ""
                })

    # 布局
    layout = {}
    if is_layout:
        exp_m = re.search(r"侧边栏.*?展开.*?(\d+)", content)
        col_m = re.search(r"侧边栏.*?收缩.*?(\d+)", content)
        if exp_m:
            layout["sidebar_width_expanded"] = int(exp_m.group(1))
        if col_m:
            layout["sidebar_width_collapsed"] = int(col_m.group(1))

    obj = {
        "owner": "Designer",
        "project": project,
        "version": version,
        "status": "approved",
        "milestone": "M0",
        "pages": pages,
        "components": [],
        "animations": [],
        "style_guide": {},
        "layout": layout,
        "created_at": None,
        "updated_at": None
    }

    if is_component:
        obj.update(parse_component_file(path, content))
    elif is_animation:
        obj.update(parse_animation_file(path, content))
    elif is_style:
        obj["style_guide"] = parse_style_guide(content)

    return obj


def main():
    # 只处理 design/M0 下的第一层和第二层的 MD 文件
    md_files = sorted([
        f for f in SOURCE_DIR.rglob("*.md")
        if f.suffix == ".md"
        and "svg" not in f.name.lower()
    ])
    converted = 0
    errors = []

    for path in md_files:
        try:
            obj = parse_design_file(path)
            target_path = path.with_suffix(".json")
            with open(target_path, "w", encoding="utf-8") as f:
                json.dump(obj, f, ensure_ascii=False, indent=2)
            print(f"[OK] {str(path.relative_to(SOURCE_DIR))} → {path.stem}.json")
            converted += 1
        except Exception as e:
            print(f"[ERR] {str(path.relative_to(SOURCE_DIR))}: {e}")
            errors.append(f"{str(path.relative_to(SOURCE_DIR))}: {e}")

    print(f"\n完成: {converted}/{len(md_files)} 成功")
    if errors:
        print("失败:")
        for e in errors:
            print(f"  {e}")


if __name__ == "__main__":
    main()
