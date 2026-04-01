#!/usr/bin/env python3
"""Tech Design MD → JSON 转换脚本"""

import re
import json
from pathlib import Path

SOURCE_DIR = Path(r"C:\Users\Pheobe\Projects\project-management-dashboard\.project\tech-design")
TARGET_DIR = SOURCE_DIR


def parse_architecture_file(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    filename = path.stem  # "ARCHITECTURE"
    milestone = path.parent.stem  # "M0" or "M1"

    # 提取版本和状态
    title_m = re.search(r">\s*版本[：:]\s*([^\s|]+).*?状态[：:]\s*([^\s|]+)", content)
    version = title_m.group(1).strip() if title_m else "v1.0"
    doc_status = "approved" if "稳定" in content or "approved" in content.lower() else "draft"

    # 提取技术栈
    tech_stack = {}
    tech_m = re.search(
        r"(?s)(?:技术栈|技术选型)[：:]\s*\n((?:\|.+\|\n)+)", content
    )
    if tech_m:
        rows = re.findall(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", tech_m.group(1), re.MULTILINE)
        for layer, tech in rows:
            layer = layer.strip().lower()
            tech = tech.strip()
            if "前端" in layer or "框架" in layer:
                tech_stack["frontend"] = tech
            elif "后端" in layer or "服务器" in layer:
                tech_stack["backend"] = tech
            elif "数据库" in layer or "数据" in layer:
                tech_stack["database"] = tech
            elif "图表" in layer:
                tech_stack["libraries"] = [tech]
            elif "构建" in layer:
                pass

    # 提取 API endpoints
    endpoints = []
    api_table_m = re.search(
        r"(?s)(?:Express\s*路由|API\s*路由|API\s*端点)[：:]\s*\n((?:\|.+\|\n)+)",
        content,
    )
    if api_table_m:
        rows = re.findall(r"^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|", api_table_m.group(1), re.MULTILINE)
        for method_path, desc in rows:
            method_path = method_path.strip()
            desc = desc.strip()
            if " " in method_path:
                method, path = method_path.split(" ", 1)
                endpoints.append({
                    "method": method.upper(),
                    "path": path,
                    "description": desc,
                    "file_ref": "",
                    "request": {},
                    "response": {},
                    "error_codes": []
                })

    # 提取目录结构
    tree = []
    tree_m = re.search(r"```\n((?:.+\n)+?)```", content)
    if tree_m:
        for line in tree_m.group(1).split("\n"):
            if line.strip():
                tree.append(line.rstrip())

    # 提取已知问题/风险
    risks = []
    risk_m = re.search(
        r"(?s)(?:已知问题|风险项|技术风险)[：:]\s*\n((?:\|.+\|\n)+)", content
    )
    if risk_m:
        rows = re.findall(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", risk_m.group(1), re.MULTILINE)
        for desc, notes in rows:
            desc = desc.strip()
            notes = notes.strip()
            if desc and desc not in ("问题", "说明"):
                severity = "low"
                if "bug" in notes.lower() or "critical" in notes.lower():
                    severity = "high"
                elif "限制" in notes:
                    severity = "medium"
                risks.append({
                    "description": f"{desc}: {notes}"[:200],
                    "severity": severity,
                    "mitigation": ""
                })

    # 提取最近修复记录
    changelog = []
    fix_m = re.search(
        r"(?s)(?:最近修复记录|变更记录)[：:]\s*\n((?:\|.+\|\n)+)", content
    )
    if fix_m:
        rows = re.findall(r"^\|\s*(\d{2}-\d{2})\s*\|\s*(.+?)\s*\|", fix_m.group(1), re.MULTILINE)
        for date_str, changes in rows:
            change_list = [c.strip() for c in changes.split(";") if c.strip()]
            changelog.append({
                "date": date_str,
                "changes": change_list
            })

    obj = {
        "id": f"TECH-{milestone.upper()}-{filename.upper()}",
        "owner": "Engineer",
        "project": "project-management-dashboard",
        "version": version,
        "status": doc_status,
        "milestone": milestone,
        "phase": "Phase 3",
        "requirement_id": None,
        "overview": "",
        "tech_stack": {
            "frontend": tech_stack.get("frontend", "原生 JavaScript (ES6+) + Handlebars"),
            "backend": tech_stack.get("backend", "Node.js + Express"),
            "database": tech_stack.get("database", "内存 + JSON 文件持久化"),
            "infrastructure": "",
            "libraries": tech_stack.get("libraries", [])
        },
        "file_structure": {
            "description": "项目目录结构",
            "tree": tree[:50]
        },
        "architecture": {
            "diagram": "",
            "layers": ["Browser", "Express.js", "Data Sources"],
            "data_flow": ""
        },
        "modules": [],
        "api_design": {
            "base_url": "/api",
            "versioning": "",
            "auth": "",
            "rate_limit": "",
            "error_format": "{ success: true, data: {...} }",
            "endpoints": endpoints[:30]
        },
        "database": {
            "type": "FileSystem (JSON)",
            "schema": "",
            "tables": [],
            "migrations": ""
        },
        "config": {
            "env_vars": [],
            "files": ["constants.js"]
        },
        "security": {
            "authentication": "",
            "authorization": "",
            "data_protection": "",
            "cors": "",
            "https": ""
        },
        "error_handling": {
            "strategy": "try-catch in async functions",
            "error_codes": [],
            "logging": "",
            "alerting": ""
        },
        "external_dependencies": [],
        "test_strategy": {
            "unit_test": "",
            "integration_test": "",
            "e2e_test": "",
            "test_data": "",
            "coverage_target": ""
        },
        "acceptance_criteria": [],
        "risks": risks,
        "tasks": [],
        "review_comments": [],
        "participants": [],
        "next_action": "",
        "created_at": None,
        "updated_at": None
    }

    return obj


def main():
    md_files = sorted(SOURCE_DIR.rglob("*.md"))
    converted = 0
    errors = []

    for path in md_files:
        try:
            obj = parse_architecture_file(path)
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
