#!/usr/bin/env python3
"""Review MD → JSON 转换脚本"""

import re
import json
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\Pheobe\Projects\project-management-dashboard\.project\review")
TARGET_DIR = SOURCE_DIR


def parse_header(content: str) -> dict:
    meta = {}
    header_match = re.search(r"(?s)^([\s\S]+?)\n---", content)
    if not header_match:
        return meta
    block = header_match.group(1)
    for line in block.split("\n"):
        if "：" in line:
            key, val = line.split("：", 1)
        elif ":" in line:
            key, val = line.split(":", 1)
        else:
            continue
        meta[key.strip().strip("*")] = val.strip().strip("*")
    return meta


def parse_verdict(content: str) -> str:
    """从评审结论提取 verdict"""
    m = re.search(r"评审结论.*?\n+(.+?)(?:\n|$)", content, re.DOTALL)
    if not m:
        return "needs_discussion"
    verdict_text = m.group(1)
    if re.search(r"APPROVE|通过|✅", verdict_text) and not re.search(r"CONDITIONAL", verdict_text):
        return "approve"
    elif re.search(r"CONDITIONAL", verdict_text) or re.search(r"有条件通过", verdict_text):
        return "conditional_approve"
    elif re.search(r"REJECT|驳回|❌", verdict_text):
        return "reject"
    else:
        return "needs_discussion"


def parse_review_items_by_section(content: str) -> list:
    """从各评审章节提取结构化项"""
    items = []
    # 匹配各页面的评审表（表格格式）
    table_sections = re.findall(
        r"\| (.+?) \| (.+?) \| (.+?) \|\n\|[-| :]+\|\n((?:\|.+\|\n)+)",
        content
    )
    for page, feasibility, deps, rows in table_sections:
        verdict_map = {"✅": "pass", "⚠️": "fail", "❌": "fail", "—": "na"}
        v = "na"
        for emoji, val in verdict_map.items():
            if emoji in feasibility:
                v = val
                break
        items.append({
            "id": f"item-{len(items)+1}",
            "description": f"{page.strip()} ({deps.strip()})",
            "verdict": v,
            "severity": "info",
            "comment": feasibility.strip(),
            "file_ref": ""
        })
    return items


def parse_risks(content: str) -> list:
    """从技术风险章节提取风险项"""
    risks = []
    # 匹配 ### 4.1 标题 ... 内容（下一个 ### 或 ##）
    risk_sections = re.findall(
        r"(?m)^#{1,3}\s+[\d.]+(?:\s+(.+)期|\s+(.+)险|(.+)题)[^\n]*\n(.+?)(?=\n#{1,3}\s+\d|$)",
        content,
        re.DOTALL
    )
    for m in risk_sections:
        title = m[0] or m[1] or m[2]
        body = m[3]
        if not title or not body.strip():
            continue
        if any(kw in title for kw in ["风险", "⚠️", "问题", "注意"]):
            sev = "high" if "⚠️" in title or "Critical" in body else "medium"
            mitigation_m = re.search(r"建议[:\s]*\n(.+?)(?:\n|$)", body, re.DOTALL)
            mitigation = mitigation_m.group(1).strip()[:300] if mitigation_m else ""
            risks.append({
                "description": title.strip()[:200],
                "severity": sev,
                "mitigation": mitigation
            })
    return risks


def parse_recommendations(content: str) -> list:
    """从建议章节提取建议项"""
    recs = []
    # 匹配 "建议：" 后的列表
    rec_section = re.search(r"(?:建议|Recommendations?)[:：]\s*\n((?:[-*].+?\n)+)", content)
    if rec_section:
        for line in rec_section.group(1).split("\n"):
            line = line.strip().lstrip("-* ")
            if line:
                recs.append(line[:200])
    return recs


def parse_review_file(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    filename = path.stem
    header = parse_header(content)

    # 路径解析 phase/version
    # review/M0/requirements/v_1/ENGINEER.md → requirements, v_1
    parts = path.parts
    phase = ""
    version = ""
    reviewer_role = ""
    for i, p in enumerate(parts):
        if p in ("requirements", "design", "layout"):
            phase = p
        if p.startswith("v_"):
            version = p.replace("v_", "v")
        if p in ("ENGINEER", "ART", "QA", "DESIGNER", "BOSS", "PM"):
            reviewer_role = p

    # 从 header 提取
    project = header.get("项目", "project-management-dashboard")
    reviewer = header.get("评审人", reviewer_role or "Engineer")
    date_raw = header.get("日期", header.get("评审时间", ""))
    verdict = parse_verdict(content)

    # 评审时间
    date_str = date_raw.replace("GMT+8", "+08:00").strip()
    if date_str and not any(date_str.endswith(x) for x in ("+08:00", "Z")):
        date_str = date_str.strip()

    # summary = 第一段评审结论
    summary_m = re.search(r"(?s)评审结论.*?\n+(.+?)(?=\n##)", content)
    summary = summary_m.group(1).strip()[:500] if summary_m else ""

    # review_items
    items = parse_review_items_by_section(content)

    # risks
    risks = parse_risks(content)

    # recommendations
    recommendations = parse_recommendations(content)

    # next_action
    next_action_m = re.search(r"(?:下一步|后续)[：:\s]*\n?(.+?)(?:\n\n|\n##|$)", content)
    next_action = next_action_m.group(1).strip()[:200] if next_action_m else ""

    # participants
    participants = []
    if reviewer:
        participants.append(reviewer)

    obj = {
        "id": f"REVIEW-{phase.upper()}-{version.replace('.','')}-{reviewer.upper()}" if phase and version else filename,
        "owner": reviewer,
        "project": project,
        "reviewer": reviewer,
        "date": date_str,
        "version": version,
        "phase": phase,
        "verdict": verdict,
        "summary": summary,
        "items": items,
        "risk_items": risks,
        "recommendations": recommendations,
        "participants": participants,
        "next_action": next_action,
        "updated_at": None
    }

    return obj


def main():
    # 递归查找所有 review 下的 md 文件
    md_files = sorted([
        f for f in SOURCE_DIR.rglob("*.md")
        if not any(x in f.parts for x in ("mvp-rejected",))  # 跳过 mvp-rejected
    ])
    converted = 0
    errors = []

    for path in md_files:
        try:
            obj = parse_review_file(path)
            # 确定输出路径：保持同级目录结构，替换扩展名为 .json
            rel_path = path.relative_to(SOURCE_DIR)
            target_path = TARGET_DIR / str(rel_path.with_suffix(".json"))
            target_path.parent.mkdir(parents=True, exist_ok=True)
            with open(target_path, "w", encoding="utf-8") as f:
                json.dump(obj, f, ensure_ascii=False, indent=2)
            print(f"[OK] {str(path.relative_to(SOURCE_DIR))} → {str(rel_path.with_suffix('.json'))}")
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
