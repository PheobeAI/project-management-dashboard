/**
 * FileScanner Service
 * 
 * 负责扫描项目路径，读取项目数据
 */

const fs = require('fs').promises;
const path = require('path');
const DataParser = require('./DataParser');

class FileScanner {
  constructor() {
    this.dataParser = new DataParser();
  }

  /**
   * 扫描多个路径下的所有项目
   * @param {Array} paths - 路径配置数组
   * @returns {Promise<Array>} 项目列表
   */
  async scanProjects(paths) {
    const projects = [];
    
    for (const config of paths) {
      if (!config.enabled) continue;
      
      try {
        const entries = await fs.readdir(config.path, { withFileTypes: true });
        
        for (const entry of entries) {
          // 跳过非目录和隐藏目录
          if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
          
          const projectPath = path.join(config.path, entry.name);
          
          try {
            const project = await this.scanProject(projectPath, config);
            if (project) {
              projects.push(project);
            }
          } catch (error) {
            console.warn(`Failed to scan project ${entry.name}:`, error.message);
          }
        }
      } catch (error) {
        console.warn(`Failed to scan path ${config.path}:`, error.message);
      }
    }
    
    return projects;
  }

  /**
   * 扫描单个项目
   * @param {string} projectPath - 项目路径
   * @param {Object} pathConfig - 路径配置
   * @returns {Promise<Object>} 项目数据
   */
  async scanProject(projectPath, pathConfig) {
    const projectDir = path.join(projectPath, '.project');
    const projectName = path.basename(projectPath);
    
    // 读取 status.json
    const status = await this.dataParser.parseStatus(projectDir);
    
    // 读取任务列表
    const tasksDir = path.join(projectDir, 'tasks');
    const tasks = await this.dataParser.parseTasks(tasksDir);
    
    // 读取测试结果
    const testResults = await this.dataParser.parseTestResults(projectPath);
    
    // 计算进度
    const progress = this.calculateProgress(tasks);
    
    // 确定状态
    const statusIndicator = this.calculateStatus(status, tasks);
    
    return {
      id: projectName,
      name: projectName,
      path: projectPath,
      pathId: pathConfig.id,
      pathAlias: pathConfig.alias || pathConfig.path,
      pathColor: pathConfig.color,
      phase: status?.phase || 0,
      progress,
      status: statusIndicator,
      waitingFor: status?.waiting_for || null,
      since: status?.since || null,
      tasks: tasks || [],
      testResults,
      lastUpdated: status?.lastUpdated || new Date().toISOString()
    };
  }

  /**
   * 计算项目进度
   * @param {Array} tasks - 任务列表
   * @returns {number} 进度百分比
   */
  calculateProgress(tasks) {
    if (!tasks || tasks.length === 0) return 0;
    
    const doneTasks = tasks.filter(t => t.status === 'done');
    return Math.round((doneTasks.length / tasks.length) * 100);
  }

  /**
   * 计算项目状态指示器
   * @param {Object} status - 项目状态
   * @param {Array} tasks - 任务列表
   * @returns {string} 状态: normal/warning/blocked/uninitialized
   */
  calculateStatus(status, tasks) {
    // 无 status.json 显示未初始化
    if (!status) return 'uninitialized';
    
    // 检查阻塞状态：waiting_for.since 超过 48 小时
    if (status.waiting_for?.since) {
      const since = new Date(status.waiting_for.since);
      const now = new Date();
      const hours = (now - since) / (1000 * 60 * 60);
      
      if (hours > 48) return 'blocked';
    }
    
    // 计算进度
    const progress = this.calculateProgress(tasks);
    
    if (progress >= 80) return 'normal';
    if (progress >= 50) return 'warning';
    return 'normal';
  }
}

module.exports = FileScanner;
