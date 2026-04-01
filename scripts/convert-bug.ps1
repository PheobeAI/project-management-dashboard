# Bug MD → JSON 转换脚本
# 用法: .\convert-bug.ps1

$ErrorActionPreference = "Stop"
$sourceDir = "C:\Users\Pheobe\Projects\project-management-dashboard\.project\bug\M0"
$targetDir = $sourceDir
$schemaFile = "C:\Users\Pheobe\Teams\Software\templates\schemas\bug-schema.json"

# 状态映射
$statusMap = @{
    "FIXED"                      = "fixed"
    "FIXED & VERIFIED"           = "verified"
    "✅ FIXED"                   = "fixed"
    "✅ FIXED & VERIFIED"        = "verified"
    "OPEN"                       = "open"
    "open"                       = "open"
    "in_progress"                 = "in_progress"
    "closed"                     = "closed"
    "wontfix"                    = "wontfix"
}

# severity 映射
$severityMap = @{
    "blocker"  = "blocker"
    "critical" = "critical"
    "major"    = "major"
    "minor"    = "minor"
    "trivial"  = "trivial"
    "BLOCKER"  = "blocker"
    "CRITICAL" = "critical"
    "MAJOR"    = "major"
    "MINOR"    = "minor"
}

function Parse-BugFile {
    param([string]$path)

    $content = Get-Content $path -Raw

    # 提取 ID（从文件名）
    $filename = [System.IO.Path]::GetFileNameWithoutExtension($path)

    # 提取基本信息表格
    $basicInfo = @{}
    if ($content -match '(?s)基本信息.*?\|(.+?)\|.*?---') {
        # 解析表格
        $lines = [regex]::Matches($content, '(?m)^\|.+\|$') | ForEach-Object { $_.Value }
        foreach ($line in $lines) {
            if ($line -match '\*\*([^:]+)\*\*\s*\|\s*(.+)') {
                $key = $Matches[1].Trim()
                $val = $Matches[2].Trim() -replace '^\s*\*+\s*|\s*\*+\s*$', ''
                $basicInfo[$key] = $val
            }
        }
    }

    # 提取 Bug 描述（## Bug 描述 之后到下一个 ## 之前的内容）
    $bugDesc = ""
    if ($content -match '(?s)## Bug 描述\s*\n+(.+?)(?=\n## )') {
        $bugDesc = $Matches[1].Trim()
    }

    # 提取复现步骤
    $steps = @()
    if ($content -match '(?s)(?:复现步骤|Steps to Reproduce)\s*\n+(.+?)(?=\n##|\n---)') {
        $stepContent = $Matches[1].Trim()
        # 按编号或换行拆分
        $stepLines = [regex]::Matches($stepContent, '(?m)^\d+\.\s*(.+)$') | ForEach-Object { $Matches[1].Trim() }
        if ($stepLines.Count -eq 0) {
            $stepLines = $stepContent -split '\n' | Where-Object { $_.Trim() -ne '' }
        }
        $steps = @($stepLines)
    }

    # 提取 Expected / Actual
    $expected = ""
    $actual = ""
    if ($content -match '(?im)^##?\s*Expected\s*\n+(.+?)(?=\n##|\n---)') {
        $expected = $Matches[1].Trim()
    }
    if ($content -match '(?im)^##?\s*Actual\s*\n+(.+?)(?=\n##|\n---)') {
        $actual = $Matches[1].Trim()
    }

    # 提取根因
    $rootCause = $null
    if ($content -match '(?s)(?:根因分析|## Root Cause|### 根因)\s*\n+(.+?)(?=\n##|\n---)') {
        $rootCause = $Matches[1].Trim()
    }

    # 提取修复信息
    $fixObj = $null
    if ($content -match '(?s)(?:修复详情|修复方案|Fix|## 修复)\s*\n+(.+?)(?=\n##|\n---)') {
        $fixContent = $Matches[1].Trim()
        $fixDesc = $fixContent -replace '(?s).*?###.*?修复方案.*?\n', ''
        $fixDesc = $fixDesc.Trim()

        $filesModified = @()
        if ($fixContent -match '(?:修复文件|Files modified)[:\s]*\n+(.+?)(?=\n###|\n##)') {
            $fileSection = $Matches[1]
            $filesModified = [regex]::Matches($fileSection, '`([^`]+)`') | ForEach-Object { $Matches[1] }
        }

        $commit = $null
        if ($content -match '(?:commit|Commit)[:\s]+([a-f0-9]+)') {
            $commit = $Matches[1]
        }

        $fixedAt = $null
        if ($content -match '(?:修复时间|fixed_at|Fixed at|Engineer 修复)[:\s]*(\d{4}-\d{2}-\d{2}[T ]?\d{2}:\d{2}(?::\d{2})?\s*(?:GMT\+8)?)') {
            $fixedAt = $Matches[1] -replace 'GMT\+8', '+08:00'
        }

        $fixObj = @{
            description     = if ($fixDesc) { $fixDesc.Substring(0, [Math]::Min(500, $fixDesc.Length)) } else { $null }
            files_modified  = $filesModified
            commit          = $commit
            fixed_at        = $fixedAt
        }
    }

    # 提取环境信息
    $envObj = @{}
    if ($basicInfo["复现环境"]) {
        $parts = $basicInfo["复现环境"] -split ',\s*'
        foreach ($p in $parts) {
            if ($p -match 'Chrome|Edge|Firefox|Safari') { $envObj["browser"] = $p.Trim() }
            if ($p -match 'Windows|Mac|Linux|Android|iOS') { $envObj["os"] = $p.Trim() }
            if ($p -match 'localhost:\d+') { $envObj["url"] = $p.Trim() }
        }
    }
    if ($basicInfo["测试人"]) { $envObj["tested_by"] = $basicInfo["测试人"] }
    if ($basicInfo["测试时间"]) { $envObj["test_time"] = $basicInfo["测试时间"] -replace 'GMT\+8', '+08:00' }

    # 提取相关 Bug
    $relatedBugs = @()
    if ($content -match '(?i)(?:Related Bugs|关联 Bug)[:\s]*(.+?)(?:\n##|\n---)') {
        $relatedBugs = [regex]::Matches($Matches[1], 'BUG-\d+|BLOCKER-\d+') | ForEach-Object { $Matches[0] }
    }

    # 提取验证时间
    $verifiedAt = $null
    if ($content -match '(?:验证时间|Verified at)[:\s]*(\d{4}-\d{2}-\d{2}[T ]?\d{2}:\d{2}(?::\d{2})?\s*(?:GMT\+8)?)') {
        $verifiedAt = $Matches[1] -replace 'GMT\+8', '+08:00'
    }

    # 提取创建时间
    $createdAt = $null
    if ($content -match '(?:发现时间|Created at)[:\s]*(\d{4}-\d{2}-\d{2}[T ]?\d{2}:\d{2}(?::\d{2})?\s*(?:GMT\+8)?)') {
        $createdAt = $Matches[1] -replace 'GMT\+8', '+08:00'
    }

    # 解析状态
    $rawStatus = $basicInfo["状态"] -replace '^\s*\*+\s*|\s*\*+\s*$', ''
    $mappedStatus = "open"
    foreach ($k in $statusMap.Keys) {
        if ($rawStatus -match [regex]::Escape($k)) {
            $mappedStatus = $statusMap[$k]
            break
        }
    }

    # 解析 severity
    $rawSeverity = $basicInfo["严重级别"]
    $mappedSeverity = "major"
    foreach ($k in $severityMap.Keys) {
        if ($rawSeverity -match [regex]::Escape($k)) {
            $mappedSeverity = $severityMap[$k]
            break
        }
    }

    # 构建 JSON 对象
    $obj = [ordered]@{
        id                   = $filename
        owner                = "QA"
        title                = ($bugDesc -split '\n')[0].Trim() -replace '^[#\-*]\s*', ''
        severity             = $mappedSeverity
        status               = $mappedStatus
        milestone            = "M0"
        assignee             = $null
        environment          = if ($envObj.Count -gt 0) { $envObj } else { $null }
        steps_to_reproduce   = $steps
        expected             = $expected
        actual               = $actual
        root_cause           = $rootCause
        fix                  = $fixObj
        related_bugs         = $relatedBugs
        test_script          = $null
        verified_at          = $verifiedAt
        created_at           = $createdAt
        updated_at           = $null
    }

    return $obj
}

# 遍历所有 MD 文件
$mdFiles = Get-ChildItem -Path $sourceDir -Filter "*.md" | Sort-Object Name
$converted = 0
$errors = @()

foreach ($file in $mdFiles) {
    try {
        $jsonObj = Parse-BugFile -path $file.FullName
        $targetPath = Join-Path $targetDir "$($file.BaseName).json"
        $jsonStr = $jsonObj | ConvertTo-Json -Depth 10
        # 格式化
        $jsonStr | Set-Content -Path $targetPath -Encoding UTF8
        Write-Host "[OK] $($file.Name) → $($file.BaseName).json" -ForegroundColor Green
        $converted++
    } catch {
        Write-Host "[ERR] $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
        $errors += $file.Name
    }
}

Write-Host ""
Write-Host "完成: $converted/$($mdFiles.Count) 成功" -ForegroundColor Cyan
if ($errors.Count -gt 0) {
    Write-Host "失败: $($errors -join ', ')" -ForegroundColor Red
}
