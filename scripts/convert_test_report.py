#!/usr/bin/env python3
"""Test Report MD → JSON 转换脚本"""

import re
import json
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\Pheobe\Projects\project-management-dashboard\.project\test-result\M0")
TARGET_DIR = SOURCE_DIR


def parse_header(content: str) -> dict:
    """从顶部提取元信息"""
    meta = {}
    header_match = re.search(r"(?s)^([\s\S]+?)\n---", content)
    if not header_match:
        return meta
    block = header_match.group(1)
    for line in block.split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            meta[key.strip().strip("*")] = val.strip().strip("*")
    return meta


def parse_summary_table(content: str) -> dict:
    """从汇总表格提取数字"""
    summary = {"total": 0, "passed": 0, "failed": 0, "blocked": 0, "skipped": 0}
    m = re.search(r"(?s)测试结果汇总.*?\n\|(.+?)\n---", content)
    if not m:
        return summary
    table_content = m.group(1)
    rows = re.findall(r"^\|.+\|$", table_content, re.MULTILINE)
    for row in rows[1:]:  # skip header
        cells = [c.strip() for c in row.split("|")[1:-1]]
        if len(cells) >= 3:
            # 格式：任务 | 功能 | 状态
            status_cell = cells[-1]
            summary["total"] += 1
            if "PASS" in status_cell or "✅" in status_cell:
                summary["passed"] += 1
            elif "FAIL" in status_cell or "❌" in status_cell:
                summary["failed"] += 1
            elif "BLOCK" in status_cell:
                summary["blocked"] += 1
            elif "SKIP" in status_cell:
                summary["skipped"] += 1
    return summary


def parse_bug_summary_table(content: str) -> dict:
    """从 Bug 回归报告汇总表格提取"""
    summary = {"total": 0, "passed": 0, "failed": 0, "blocked": 0, "skipped": 0}
    m = re.search(r"(?s)\| Bug ID.*?\n\|[-| :]+\n(.+?)(?=\n###|\n##|\n---)", content, re.DOTALL)
    if not m:
        return summary
    rows = re.findall(r"^\|.+\|$", m.group(1), re.MULTILINE)
    for row in rows:
        cells = [c.strip() for c in row.split("|")[1:-1]]
        if len(cells) >= 2:
            summary["total"] += 1
            status_cell = " ".join(cells[1:])
            if re.search(r"FIXED|✅|PASS", status_cell):
                summary["passed"] += 1
            elif re.search(r"CANNOT_REPRODUCE|Open|⚠️", status_cell):
                summary["failed"] += 1
    return summary


def parse_test_cases(content: str) -> list:
    """从详细测试记录提取测试用例"""
    test_cases = []
    # 匹配 ### DEV-XXX 或类似标题
    sections = re.split(r"(?m)^### ", content)
    for section in sections[1:]:
        lines = section.split("\n", 1)
        tc_id = lines[0].strip()
        body = lines[1] if len(lines) > 1 else ""

        # 提取状态
        result = "fail"
        if "✅" in body or "PASS" in body:
            result = "pass"
        elif "FAIL" in body or "❌" in body:
            result = "fail"
        elif "BLOCK" in body:
            result = "blocked"
        elif "SKIP" in body:
            result = "skipped"

        # 提取功能验证表格中的检查项
        features = re.findall(r"^\|.+\|\s*$", body, re.MULTILINE)
        feature_results = []
        for feat_row in features:
            cells = [c.strip() for c in feat_row.split("|")[1:-1]]
            if len(cells) >= 2 and ("功能" not in cells[0]):
                feature_results.append({"feature": cells[0], "result": "pass" if "✅" in cells[-1] else "fail"})

        tc = {
            "id": tc_id,
            "title": tc_id,
            "page": "",
            "feature": "",
            "priority": "P0",
            "status": "tested",
            "result": result,
            "notes": "",
            "steps": []
        }
        if feature_results:
            tc["notes"] = "; ".join([f"{r['feature']}: {r['result']}" for r in feature_results[:5]])
        test_cases.append(tc)
    return test_cases


def parse_defects_from_bug_report(content: str) -> list:
    """从 Bug 回归报告提取缺陷"""
    defects = []
    sections = re.split(r"(?m)^## ", content)
    for section in sections[1:]:
        lines = section.split("\n", 2)
        bug_id_line = lines[0].strip()
        if not re.match(r"(BUG|BLOCKER)-\d+", bug_id_line):
            continue
        bug_id = re.match(r"(BUG|BLOCKER)-\d+", bug_id_line).group(0)
        body = lines[1] if len(lines) > 1 else ""
        body += lines[2] if len(lines) > 2 else ""

        # 提取状态
        status = "open"
        if "FIXED" in body and "✅" in body:
            status = "fixed"
        elif "CANNOT_REPRODUCE" in body:
            status = "open"
        elif "DATA ISSUE" in body:
            status = "open"

        # 提取 severity
        severity = "major"
        if "Critical" in body or "BLOCKER" in bug_id:
            severity = "critical"
        elif "Minor" in body:
            severity = "minor"

        # 提取标题（Bug ID 后第一行粗体或普通文字）
        title_m = re.search(r"[—\-]\s*(.+?)(?:\n|$)", bug_id_line)
        title = title_m.group(1).strip() if title_m else bug_id_line

        defects.append({
            "bug_id": bug_id,
            "title": title,
            "severity": severity,
            "status": status,
            "notes": ""
        })
    return defects


def parse_test_report(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    filename = path.stem
    header = parse_header(content)

    # 判断类型
    is_bug_report = "Open Bug" in content or "回归验证" in content

    # 基本信息
    project = header.get("项目", "project-management-dashboard")
    test_time_raw = header.get("测试时间", header.get("日期", ""))
    tester = header.get("测试人", "QA")
    version = header.get("测试版本", "")
    phase = header.get("phase", "")

    # 处理 test_time
    test_time = test_time_raw.replace("GMT+8", "+08:00").strip()
    if test_time and not test_time.endswith(("+08:00", "Z")):
        test_time = test_time.strip()

    # 汇总
    if is_bug_report:
        summary = parse_bug_summary_table(content)
    else:
        summary = parse_summary_table(content)

    if summary["total"] > 0:
        summary["pass_rate"] = round(summary["passed"] / summary["total"] * 100, 1)
    else:
        summary["pass_rate"] = 0

    # 测试用例
    test_cases = parse_test_cases(content) if not is_bug_report else []

    # 缺陷
    defects = parse_defects_from_bug_report(content) if is_bug_report else []

    # 结论
    conclusion = "pass"
    if summary["failed"] > 0 or summary["blocked"] > 0:
        conclusion = "fail"
    elif is_bug_report and summary["failed"] > 0:
        conclusion = "conditional_pass"

    # 截图
    screenshots = re.findall(r"!\[.?\]\(([^)]+\.png)\)", content)

    # 环境
    env_text = header.get("测试环境", "")
    env = {}
    if env_text:
        env["url"] = env_text
    if "OS" in content:
        os_m = re.search(r"OS[:\s]+([^\s\n]+)", content)
        if os_m:
            env["os"] = os_m.group(1)

    obj = {
        "id": filename,
        "owner": "QA",
        "project": project,
        "version": version,
        "phase": phase,
        "test_time": test_time,
        "tester": tester,
        "environment": env if env else None,
        "summary": summary,
        "test_cases": test_cases,
        "defects": defects,
        "conclusion": conclusion,
        "screenshots": screenshots,
        "updated_at": None
    }

    return obj


def main():
    md_files = sorted([f for f in SOURCE_DIR.glob("*.md") if f.stem not in ("INDEX", "TEST-PLAN")])
    converted = 0
    errors = []

    for path in md_files:
        try:
            obj = parse_test_report(path)
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
