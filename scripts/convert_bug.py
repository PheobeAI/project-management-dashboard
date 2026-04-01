#!/usr/bin/env python3
"""Bug MD → JSON 转换脚本 v2，支持表格和章节两种格式"""

import os
import re
import json
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\Pheobe\Projects\project-management-dashboard\.project\bug\M0")
TARGET_DIR = SOURCE_DIR

STATUS_MAP = {
    "FIXED": "fixed",
    "FIXED & VERIFIED": "verified",
    "✅ FIXED": "fixed",
    "✅ FIXED & VERIFIED": "verified",
    "OPEN": "open",
    "CLOSED": "closed",
}

SEVERITY_MAP = {
    "BLOCKER": "blocker",
    "CRITICAL": "critical",
    "MAJOR": "major",
    "MINOR": "minor",
    "TRIVIAL": "trivial",
}


def parse_table_basic_info(content: str) -> dict:
    """解析表格格式的基本信息（## 基本信息  ... | key | val |）"""
    info = {}
    m = re.search(r"(?s)## 基本信息.*?\n\|(.+?)\n---", content)
    if not m:
        return info
    rows = re.findall(r"\*\*([^:]+)\*\*\s*\|\s*(.+?)(?:\n|$)", m.group(1))
    for k, v in rows:
        info[k.strip()] = v.strip().strip("*").strip()
    return info


def parse_section_fields(content: str) -> dict:
    """解析章节格式的字段（## FieldName ...）"""
    fields = {}
    # 匹配所有 ## 标题 格式的章节
    sections = re.findall(r"(?m)^## (.+?)\n(.*?)(?=(?:^## )|\Z)", content, re.DOTALL)
    for title, body in sections:
        title = title.strip()
        body = body.strip()
        fields[title] = body
    return fields


def parse_field_list(content: str) -> list:
    """解析列表格式的步骤（如 1. xxx 或 - xxx）"""
    items = re.findall(r"(?m)^(\d+)\.\s*(.+)$", content)
    if items:
        return [v.strip() for _, v in items]
    items = re.findall(r"(?m)^[-*]\s*(.+)$", content)
    return [i.strip() for i in items if i.strip()]


def map_severity(raw: str) -> str:
    for k, v in SEVERITY_MAP.items():
        if k.lower() in raw.lower():
            return v
    return "major"


def map_status(raw: str) -> str:
    raw = re.sub(r"^\s*\*+\s*|\s*\*+\s*$", "", raw).strip()
    for k, v in STATUS_MAP.items():
        if k in raw:
            return v
    if "in_progress" in raw.lower():
        return "in_progress"
    if "open" in raw.lower():
        return "open"
    if "closed" in raw.lower() or "wontfix" in raw.lower():
        return "closed"
    return "open"


def parse_fix_section(body: str) -> dict:
    """解析 Fix / 修复方案 章节"""
    files = re.findall(r"[-*] `([^`]+)`", body)
    if not files:
        files = re.findall(r"[-*] ([^\n]+?)(?:\n|$)", body)

    commit = None
    cm = re.search(r"commit[s]?\s*[:\-]?\s*([a-f0-9]{6,})", body, re.I)
    if cm:
        commit = cm.group(1)

    # 取第一段作为 description
    paragraphs = body.split("\n\n")
    desc = paragraphs[0].strip() if paragraphs else body[:300]

    return {
        "description": desc[:500] if len(desc) > 500 else desc,
        "files_modified": files[:10],
        "commit": commit,
        "fixed_at": None,
    }


def parse_env_from_sections(sections: dict) -> dict:
    """从 Environment 章节解析环境信息"""
    env = {}
    env_text = sections.get("Environment", "")
    if not env_text:
        return env
    for line in env_text.split("\n"):
        line = line.strip().lstrip("-* ")
        if ":" in line:
            key, val = line.split(":", 1)
            key = key.strip().lower()
            val = val.strip()
            if "os" in key:
                env["os"] = val
            elif "browser" in key:
                env["browser"] = val
            elif "app" in key or "version" in key:
                env["app_version"] = val
            elif "time" in key:
                env["test_time"] = val.replace("GMT+8", "+08:00")
    return env


def parse_bug_file(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    filename = path.stem

    # --- 尝试表格格式 ---
    table_info = parse_table_basic_info(content)

    # --- 章节格式 ---
    sections = parse_section_fields(content)

    # 标题：从文件名提取
    title = sections.get("Bug 描述", "") or sections.get("Title", "")
    title_line = title.split("\n")[0].strip() if title else ""
    title_line = re.sub(r"^[#\-*]\s*", "", title_line)
    if not title_line:
        # 尝试从第一行 markdown 标题提取
        m = re.match(r"#\s+\S+:?\s*(.+)", content)
        if m:
            title_line = m.group(1).strip()
    if not title_line:
        title_line = filename

    # Severity
    sev_raw = table_info.get("严重级别", "") or sections.get("Severity", "")
    severity = map_severity(sev_raw)

    # Status
    stat_raw = table_info.get("状态", "") or sections.get("Status", "")
    status = map_status(stat_raw)

    # 环境
    env_obj = parse_env_from_sections(sections)
    if table_info.get("复现环境"):
        parts = table_info["复现环境"].split(",")
        for p in parts:
            p = p.strip()
            if re.search(r"Chrome|Edge|Firefox|Safari", p) and "browser" not in env_obj:
                env_obj["browser"] = p
            if re.search(r"Windows|Mac|Linux", p) and "os" not in env_obj:
                env_obj["os"] = p
    if table_info.get("测试人") and "tested_by" not in env_obj:
        env_obj["tested_by"] = table_info["测试人"]
    if table_info.get("测试时间"):
        env_obj["test_time"] = table_info["测试时间"].replace("GMT+8", "+08:00")

    # 复现步骤
    steps_raw = sections.get("Steps to Reproduce", "")
    steps = parse_field_list(steps_raw)

    # Expected / Actual
    expected = sections.get("Expected", "").strip()
    actual = sections.get("Actual", "").strip()

    # Root Cause
    root_cause = sections.get("Root Cause", "") or sections.get("根因", "") or sections.get("根因分析", "")
    if isinstance(root_cause, str) and root_cause.startswith("**"):
        root_cause = root_cause.strip()

    # Fix
    fix_obj = None
    fix_raw = sections.get("Fix", "") or sections.get("修复方案", "") or sections.get("修复详情", "")
    if fix_raw:
        fix_obj = parse_fix_section(fix_raw)
        # 从 content 中找 commit 和 fixed_at
        cm = re.search(r"commit[s]?\s*[:\-]?\s*([a-f0-9]{6,})", content, re.I)
        if cm:
            fix_obj["commit"] = cm.group(1)
        ft = re.search(
            r"(?:修复时间|fixed_at|Fixed at|Engineer 修复|fixed_at)[:\s]*(\d{4}-\d{2}-\d{2}[T ]?\d{2}:\d{2}(?::\d{2})?\s*(?:GMT\+8)?)",
            content,
        )
        if ft:
            fix_obj["fixed_at"] = ft.group(1).replace("GMT+8", "+08:00").strip()

    # Related Bugs
    related = []
    related_text = sections.get("Related Bugs", "") or sections.get("关联 Bug", "")
    if related_text:
        related = re.findall(r"(BUG-\d+|BLOCKER-\d+)", related_text)

    # Test Script
    test_script = None
    ts = sections.get("Test Script", "")
    if ts:
        test_script = ts.strip()

    # 时间提取
    created_at = None
    for key in ["发现时间", "Created at"]:
        m = re.search(
            rf"{key}[:\s]*(\d{{4}}-\d{{2}}-\d{{2}}[T ]?\d{{2}}:\d{{2}}(:?\d{{2}})?\s*(?:GMT\+8)?)",
            content,
        )
        if m:
            created_at = m.group(1).replace("GMT+8", "+08:00").strip()
            break

    verified_at = None
    for key in ["验证时间", "Verified at"]:
        m = re.search(
            rf"{key}[:\s]*(\d{{4}}-\d{{2}}-\d{{2}}[T ]?\d{{2}}:\d{{2}}(:?\d{{2}})?\s*(?:GMT\+8)?)",
            content,
        )
        if m:
            verified_at = m.group(1).replace("GMT+8", "+08:00").strip()
            break

    obj = {
        "id": filename,
        "owner": "QA",
        "title": title_line[:200],
        "severity": severity,
        "status": status,
        "milestone": "M0",
        "assignee": None,
        "environment": env_obj if env_obj else None,
        "steps_to_reproduce": steps,
        "expected": expected[:1000],
        "actual": actual[:1000],
        "root_cause": root_cause[:2000] if root_cause else None,
        "fix": fix_obj,
        "related_bugs": related,
        "test_script": test_script,
        "verified_at": verified_at,
        "created_at": created_at,
        "updated_at": None,
    }

    return obj


def main():
    md_files = sorted(SOURCE_DIR.glob("*.md"))
    converted = 0
    errors = []

    for path in md_files:
        try:
            obj = parse_bug_file(path)
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
        print(f"失败:")
        for e in errors:
            print(f"  {e}")


if __name__ == "__main__":
    main()
