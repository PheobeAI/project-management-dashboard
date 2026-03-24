/**
 * DataParser Service
 * 
 * 负责解析项目数据文件：status.json、tasks、test-results
 * 支持 milestone 目录结构（M0/M1/M2...）
 * 
 * 目录映射（旧 → 新）：
 *   design/ + visual-design/ → design/M{ milestone }/
 *   requirements/            → requirement/M{ milestone }/
 *   reviews/                 → review/M{ milestone }/
 *   tasks/                   → task/M{ milestone }/
 *   tech-design/             → tech-design/M{ milestone }/
 *   test-plan/ + test-results/ → test-result/M{ milestone }/
 *   test-results/bugs/       → bug/M{ milestone }/
 *   logs/                    → logs/M{ milestone }/
 */

const fs = require('fs').promises;
const path = require('path');

class DataParser {
  /**
   * 获取项目的 milestone 目录名（默认 M0）
   * @param {string} projectDir - .project 目录路径
   * @returns {Promise<string>} milestone 目录名，如 'M0'
   */
  async getMilestone(projectDir) {
    try {
      const statusPath = path.join(projectDir, 'status.json');
      const content = await fs.readFile(statusPath, 'utf-8');
      const status = JSON.parse(content);
      const milestone = status.milestone || 'M0';
      return milestone.startsWith('M') ? milestone : `M${milestone}`;
    } catch {
      return 'M0';
    }
  }

  /**
   * 读取 JSON 文件，兼容旧目录结构（无 milestone）
   * @param {string} projectDir - .project 目录路径
   * @param {string} oldSubDir - 旧子目录名（如 'tasks'）
   * @param {string} newSubDir - 新子目录名（如 'task'）
   * @returns {Promise<Object|null>}
   */
  async readJsonFile(projectDir, subDir, filename) {
    // 优先尝试新路径
    const entries = await fs.readdir(projectDir).catch(() => []);
    for (const entry of entries) {
      if (!entry.startsWith('.')) {
        try {
          const fullPath = path.join(projectDir, entry, filename);
          const content = await fs.readFile(fullPath, 'utf-8');
          return JSON.parse(content);
        } catch {}
      }
    }
    // 降级：尝试旧路径（兼容迁移前的数据）
    try {
      const oldPath = path.join(projectDir, subDir, filename);
      return JSON.parse(await fs.readFile(oldPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  /**
   * 解析 status.json
   * @param {string} projectDir - .project 目录路径
   * @returns {Promise<Object|null>}
   */
  async parseStatus(projectDir) {
    const statusPath = path.join(projectDir, 'status.json');
    
    try {
      const content = await fs.readFile(statusPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // 文件不存在
      }
      console.warn(`Failed to parse status.json: ${error.message}`);
      return null;
    }
  }

  /**
   * 解析任务列表
   * @param {string} projectDir - .project 目录路径
   * @returns {Promise<Array>}
   */
  async parseTasks(projectDir) {
    const milestone = await this.getMilestone(projectDir);
    
    // 优先新路径 task/M{ milestone }/
    const newDir = path.join(projectDir, 'task', milestone);
    // 降级旧路径 tasks/（兼容迁移前）
    const oldDir = path.join(projectDir, 'tasks');
    
    const tasksDir = await this._dirExists(newDir) ? newDir : oldDir;
    
    try {
      const files = await fs.readdir(tasksDir);
      
      // JSON 文件：DEV-xxx.json
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      // Markdown 文件：ART-xxx.md（Art Task）
      const mdFiles = files.filter(f => /^ART-\d+\.md$/i.test(f));
      
      const tasks = [];
      
      // 解析 JSON 文件
      for (const file of jsonFiles) {
        try {
          const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
          const parsed = JSON.parse(content);
          
          if (Array.isArray(parsed)) {
            tasks.push(...parsed);
          } else if (parsed && typeof parsed === 'object') {
            tasks.push(parsed);
          }
        } catch (error) {
          console.warn(`Failed to parse task file ${file}: ${error.message}`);
        }
      }
      
      // 解析 ART Markdown 文件
      for (const file of mdFiles) {
        try {
          const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
          const task = this._parseArtTaskMd(content, file);
          if (task) tasks.push(task);
        } catch (error) {
          console.warn(`Failed to parse art task file ${file}: ${error.message}`);
        }
      }
      
      return tasks;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      console.warn(`Failed to read tasks directory: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 解析 ART-*.md 文件，提取 Art Task 数据
   * @param {string} content - Markdown 内容
   * @param {string} filename - 文件名
   * @returns {object|null}
   */
  _parseArtTaskMd(content, filename) {
    try {
      const idMatch = filename.match(/^(ART-\d+)\.md$/i);
      if (!idMatch) return null;
      const id = idMatch[1].toUpperCase();
      
      // 从 # 标题提取 title
      const titleMatch = content.match(/^#\s*Art\s*Task:\s*(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : id;
      
      // 从 **ID** / **Type** / **Status** / **Priority** 提取字段
      const getField = (label) => {
        const re = new RegExp(`\\*\\*${label}\\*\\*\\s*[:：]\\s*(.+)`, 'i');
        const m = content.match(re);
        return m ? m[1].trim() : null;
      };
      
      const artStatus = getField('Status') || 'waiting';
      const status = this._mapArtStatus(artStatus);
      
      return {
        id,
        title,
        type: 'art',
        status,
        artStatus, // 保留原始 art status
        priority: getField('Priority') || 'P1',
        created: getField('Created') || null,
        assignee: 'Art',
        description: content.substring(0, 200),
        projectName: '',
        projectId: ''
      };
    } catch (e) {
      console.warn(`[DataParser] Failed to parse art task ${filename}: ${e.message}`);
      return null;
    }
  }
  
  /**
   * 将 Art 任务状态映射为标准状态
   */
  _mapArtStatus(artStatus) {
    const s = artStatus.toLowerCase();
    if (s.includes('done') || s.includes('complete')) return 'done';
    if (s.includes('progress')) return 'in_progress';
    if (s.includes('cancelled') || s.includes('cancel')) return 'cancelled';
    return 'waiting';
  }

  /**
   * 解析测试结果
   * @param {string} projectDir - .project 目录路径
   * @returns {Promise<Object|null>}
   */
  async parseTestResults(projectDir) {
    const milestone = await this.getMilestone(projectDir);
    
    // 新路径：test-result/M{ milestone }/
    const newDir = path.join(projectDir, 'test-result', milestone);
    // 降级旧路径
    const oldDirs = [
      path.join(projectDir, 'test-results'),
      path.join(projectDir, 'test-plan'),
      path.join(projectDir, 'test')
    ];
    
    const dirs = [newDir, ...oldDirs].filter(d => d !== newDir);
    
    for (const testDir of dirs) {
      try {
        const stats = await fs.stat(testDir);
        if (!stats.isDirectory()) continue;
        
        // 尝试 summary.json
        const summaryPath = path.join(testDir, 'summary.json');
        try {
          const content = await fs.readFile(summaryPath, 'utf-8');
          return JSON.parse(content);
        } catch {}
        
        // 尝试 index.json
        const indexPath = path.join(testDir, 'index.json');
        try {
          const content = await fs.readFile(indexPath, 'utf-8');
          return JSON.parse(content);
        } catch {}
        
        // 尝试所有 JSON 文件并合并
        const files = await fs.readdir(testDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
          let total = 0, passed = 0, failed = 0, skipped = 0, result = {};
          
          for (const file of jsonFiles) {
            try {
              const content = await fs.readFile(path.join(testDir, file), 'utf-8');
              result = JSON.parse(content);
              total += result.total || 0;
              passed += result.passed || result.passedCount || 0;
              failed += result.failed || result.failedCount || 0;
              skipped += result.skipped || 0;
            } catch {}
          }
          
          if (total > 0) {
            return { total, passed, failed, skipped, coverage: result?.coverage };
          }
        }
      } catch {}
    }
    
    return null;
  }

  /**
   * 解析评审意见
   * @param {string} projectDir - .project 目录路径
   * @returns {Promise<Array>}
   */
  async parseReviews(projectDir) {
    const milestone = await this.getMilestone(projectDir);
    
    // 新路径：review/M{ milestone }/index.json
    const newPath = path.join(projectDir, 'review', milestone, 'index.json');
    // 降级旧路径：reviews/index.json
    const oldPath = path.join(projectDir, 'reviews', 'index.json');
    
    // 优先新路径
    try {
      const content = await fs.readFile(newPath, 'utf-8');
      const data = JSON.parse(content);
      return data.reviews || [];
    } catch {}
    
    // 降级旧路径
    try {
      const content = await fs.readFile(oldPath, 'utf-8');
      const data = JSON.parse(content);
      return data.reviews || [];
    } catch {
      return [];
    }
  }

  /**
   * 解析 Bug 列表
   * @param {string} projectDir - .project 目录路径
   * @returns {Promise<Array>}
   */
  async parseBugs(projectDir) {
    const milestone = await this.getMilestone(projectDir);
    
    // 新路径：bug/M{ milestone }/index.json
    const newPath = path.join(projectDir, 'bug', milestone, 'index.json');
    // 降级旧路径：bugs/index.json
    const oldPath = path.join(projectDir, 'bugs', 'index.json');
    
    // 优先新路径（JSON 格式）
    try {
      const content = await fs.readFile(newPath, 'utf-8');
      const data = JSON.parse(content);
      return data.bugs || [];
    } catch {}
    
    // 降级旧路径（JSON 格式）
    try {
      const content = await fs.readFile(oldPath, 'utf-8');
      const data = JSON.parse(content);
      return data.bugs || [];
    } catch {}
    
    // 降级：扫描 bug/M{ milestone }/BUG-*.md 文件
    const bugsDir = path.join(projectDir, 'bug', milestone);
    try {
      const files = await fs.readdir(bugsDir);
      const mdFiles = files.filter(f => /^BUG-\d+\.md$/i.test(f));
      
      if (mdFiles.length > 0) {
        const bugs = await Promise.all(
          mdFiles.map(async (file) => {
            const content = await fs.readFile(path.join(bugsDir, file), 'utf-8');
            return this._parseBugMd(content, file);
          })
        );
        return bugs.filter(b => b !== null).sort((a, b) => a.id.localeCompare(b.id));
      }
    } catch {}
    
    return [];
  }
  
  /**
   * 解析单个 BUG-*.md 文件，提取 bug 数据对象
   * @param {string} content - Markdown 内容
   * @param {string} filename - 文件名（如 BUG-010.md）
   * @returns {object|null}
   */
  _parseBugMd(content, filename) {
    try {
      // 提取 Bug ID（从文件名）
      const idMatch = filename.match(/^BUG-(\d+)\.md$/i);
      if (!idMatch) return null;
      const id = `BUG-${idMatch[1].padStart(3, '0')}`;
      
      let status = 'open';
      let severity = 'minor';
      let title = id;
      let description = '';
      let foundAt = null;
      let verifiedBy = null;
      let verifiedAt = null;
      let fixedAt = null;
      
      // 解析基本表格（| **Label** | Value | ...）
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('|') || trimmed.startsWith('|--')) continue;
        
        const cols = trimmed.split('|').map(c => c.trim()).filter(c => c.length > 0);
        if (cols.length < 2) continue;
        
        const label = cols[0].replace(/\*\*/g, '').trim(); // 去掉 ** 
        const rawValue = cols[1].trim();
        
        if (label === 'Bug ID') {
          // 从表格获取 ID（确保格式一致）
        } else if (label === '严重级别') {
          const sev = rawValue.toLowerCase();
          if (sev.includes('critical')) severity = 'critical';
          else if (sev.includes('major')) severity = 'major';
          else severity = 'minor';
        } else if (label === '状态') {
          const s = rawValue.toLowerCase();
          if (s.includes('fixed') || s.includes('verified')) status = 'fixed';
          else if (s.includes('in_progress') || s.includes('进行中')) status = 'in_progress';
          else if (s.includes('open') || s.includes('未修复')) status = 'open';
        } else if (label === '发现时间') {
          const m = rawValue.match(/(\d{4}-\d{2}-\d{2})/);
          if (m) foundAt = m[1];
        } else if (label === '验证人') {
          verifiedBy = rawValue || null;
        }
      }
      
      // 从标题提取 Bug ID 描述
      const titleMatch = content.match(/^#\s*Bug\s*报告\s*-\s*(.+)$/m);
      if (titleMatch) title = titleMatch[1].trim();
      
      // 提取 Bug 描述（## Bug 描述 章节）
      const descMatch = content.match(/^##?\s*Bug\s*描述\s*\n+([\s\S]*?)(?=^##|\-\-\-)/m);
      if (descMatch) description = descMatch[1].trim();
      
      // 全局搜索状态关键词（兜底）
      if (/✅.*(?:FIXED|VERIFIED)/i.test(content)) status = 'fixed';
      else if (/🔄.*(?:IN_PROGRESS|进行中)/i.test(content)) status = 'in_progress';
      
      // 提取最新验证时间
      const verifyTimeMatches = [...content.matchAll(/\*\*第[\d一二三四五六七八九十]+[次回归]*验证\*\*[^\n]*\|\s*([^\|]+)/g)];
      if (verifyTimeMatches.length > 0) {
        const last = verifyTimeMatches[verifyTimeMatches.length - 1];
        const timeStr = last[1].trim();
        const timeMatch = timeStr.match(/(\d{4}-\d{2}-\d{2})/);
        if (timeMatch) verifiedAt = timeMatch[1];
      }
      
      return {
        id,
        title: title || id,
        description,
        severity,
        status,
        foundAt,
        verifiedBy,
        verifiedAt,
        fixedAt
      };
    } catch (e) {
      console.warn(`[DataParser] Failed to parse bug file ${filename}:`, e.message);
      return null;
    }
  }

  /**
   * 检查目录是否存在
   * @param {string} dirPath 
   * @returns {Promise<boolean>}
   */
  async _dirExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

module.exports = DataParser;
