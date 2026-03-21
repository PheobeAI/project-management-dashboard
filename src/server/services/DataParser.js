/**
 * DataParser Service
 * 
 * 负责解析项目数据文件：status.json、tasks、test-results
 */

const fs = require('fs').promises;
const path = require('path');

class DataParser {
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
   * @param {string} tasksDir - tasks 目录路径
   * @returns {Promise<Array>}
   */
  async parseTasks(tasksDir) {
    try {
      const files = await fs.readdir(tasksDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const tasks = [];
      for (const file of jsonFiles) {
        try {
          const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
          const parsed = JSON.parse(content);
          
          // 处理两种格式：单个任务对象 或 任务数组
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
        return []; // 目录不存在
      }
      console.warn(`Failed to read tasks directory: ${error.message}`);
      return [];
    }
  }

  /**
   * 解析测试结果
   * 支持多种格式：
   * - test-results/summary.json
   * - test-results/index.json
   * - test-results/ 目录下的多个 JSON 文件
   * @param {string} projectPath - 项目根路径
   * @returns {Promise<Object|null>}
   */
  async parseTestResults(projectPath) {
    const possibleDirs = [
      path.join(projectPath, 'test-results'),
      path.join(projectPath, 'test')
    ];
    
    for (const testDir of possibleDirs) {
      try {
        const stats = await fs.stat(testDir);
        if (!stats.isDirectory()) continue;
        
        // 尝试读取 summary.json
        const summaryPath = path.join(testDir, 'summary.json');
        try {
          const content = await fs.readFile(summaryPath, 'utf-8');
          return JSON.parse(content);
        } catch (e) {
          // 尝试读取 index.json
        }
        
        // 尝试读取 index.json
        const indexPath = path.join(testDir, 'index.json');
        try {
          const content = await fs.readFile(indexPath, 'utf-8');
          return JSON.parse(content);
        } catch (e) {
          // 继续尝试其他方式
        }
        
        // 尝试读取所有 JSON 文件并合并
        const files = await fs.readdir(testDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
          let total = 0, passed = 0, failed = 0, skipped = 0;
          
          for (const file of jsonFiles) {
            try {
              const content = await fs.readFile(path.join(testDir, file), 'utf-8');
              const result = JSON.parse(content);
              
              total += result.total || 0;
              passed += result.passed || result.passedCount || 0;
              failed += result.failed || result.failedCount || 0;
              skipped += result.skipped || 0;
            } catch (error) {
              // 跳过无效文件
            }
          }
          
          if (total > 0) {
            return { total, passed, failed, skipped, coverage: result?.coverage };
          }
        }
      } catch (error) {
        // 继续尝试下一个目录
      }
    }
    
    return null;
  }

  /**
   * 解析评审意见
   * @param {string} projectDir - .project 目录路径
   * @returns {Promise<Array>}
   */
  async parseReviews(projectDir) {
    const reviewsPath = path.join(projectDir, 'reviews', 'index.json');
    
    try {
      const content = await fs.readFile(reviewsPath, 'utf-8');
      const data = JSON.parse(content);
      return data.reviews || [];
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // 文件不存在
      }
      console.warn(`Failed to parse reviews: ${error.message}`);
      return [];
    }
  }

  /**
   * 解析 Bug 列表
   * @param {string} projectDir - .project 目录路径
   * @returns {Promise<Array>}
   */
  async parseBugs(projectDir) {
    const bugsPath = path.join(projectDir, 'bugs', 'index.json');
    
    try {
      const content = await fs.readFile(bugsPath, 'utf-8');
      const data = JSON.parse(content);
      return data.bugs || [];
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // 文件不存在
      }
      console.warn(`Failed to parse bugs: ${error.message}`);
      return [];
    }
  }
}

module.exports = DataParser;
