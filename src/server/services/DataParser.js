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
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const tasks = [];
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
    
    // 优先新路径
    try {
      const content = await fs.readFile(newPath, 'utf-8');
      const data = JSON.parse(content);
      return data.bugs || [];
    } catch {}
    
    // 降级旧路径
    try {
      const content = await fs.readFile(oldPath, 'utf-8');
      const data = JSON.parse(content);
      return data.bugs || [];
    } catch {
      return [];
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
