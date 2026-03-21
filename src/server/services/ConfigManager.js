/**
 * ConfigManager Service
 * 
 * 负责管理应用配置：路径配置、设置等
 * 配置文件存放在用户数据目录
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    // 配置目录：%APPDATA%/project-management-dashboard/
    this.configDir = path.join(os.homedir(), '.config', 'project-management-dashboard');
    this.pathsFile = path.join(this.configDir, 'paths.json');
    this.settingsFile = path.join(this.configDir, 'settings.json');
    
    // 确保配置目录存在
    this.ensureConfigDir();
  }

  async ensureConfigDir() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      // 目录已存在
    }
  }

  /**
   * 获取路径配置
   * @returns {Promise<Array>}
   */
  async getPaths() {
    try {
      const content = await fs.readFile(this.pathsFile, 'utf-8');
      const data = JSON.parse(content);
      return data.paths || [];
    } catch (error) {
      // 返回默认路径
      const defaultPaths = [
        {
          id: 'default',
          path: path.join(os.homedir(), 'Projects'),
          alias: '我的项目',
          color: '#3B82F6',
          enabled: true,
          order: 0
        }
      ];
      
      // 创建默认配置
      await this.savePaths(defaultPaths);
      return defaultPaths;
    }
  }

  /**
   * 保存路径配置
   * @param {Array} paths - 路径配置数组
   */
  async savePaths(paths) {
    await this.ensureConfigDir();
    const data = { paths, version: '1.0', updatedAt: new Date().toISOString() };
    await fs.writeFile(this.pathsFile, JSON.stringify(data, null, 2));
  }

  /**
   * 添加新路径
   * @param {Object} config - 路径配置
   * @returns {Promise<Array>}
   */
  async addPath(config) {
    const paths = await this.getPaths();
    
    const newPath = {
      id: `path-${Date.now()}`,
      path: config.path,
      alias: config.alias || path.basename(config.path),
      color: config.color || '#3B82F6',
      enabled: true,
      order: paths.length
    };
    
    paths.push(newPath);
    await this.savePaths(paths);
    
    return paths;
  }

  /**
   * 更新路径配置
   * @param {string} id - 路径 ID
   * @param {Object} updates - 更新内容
   * @returns {Promise<Array>}
   */
  async updatePath(id, updates) {
    const paths = await this.getPaths();
    const index = paths.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Path not found');
    }
    
    paths[index] = { ...paths[index], ...updates };
    await this.savePaths(paths);
    
    return paths;
  }

  /**
   * 删除路径
   * @param {string} id - 路径 ID
   * @returns {Promise<Array>}
   */
  async deletePath(id) {
    const paths = await this.getPaths();
    const filtered = paths.filter(p => p.id !== id);
    await this.savePaths(filtered);
    
    return filtered;
  }

  /**
   * 获取应用设置
   * @returns {Promise<Object>}
   */
  async getSettings() {
    try {
      const content = await fs.readFile(this.settingsFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // 返回默认设置
      const defaultSettings = {
        theme: 'light',
        autoRefresh: true,
        refreshInterval: 60000,
        lastUpdated: new Date().toISOString()
      };
      
      await this.saveSettings(defaultSettings);
      return defaultSettings;
    }
  }

  /**
   * 保存应用设置
   * @param {Object} settings - 设置对象
   */
  async saveSettings(settings) {
    await this.ensureConfigDir();
    const data = { ...settings, lastUpdated: new Date().toISOString() };
    await fs.writeFile(this.settingsFile, JSON.stringify(data, null, 2));
  }

  /**
   * 更新应用设置
   * @param {Object} updates - 更新内容
   * @returns {Promise<Object>}
   */
  async updateSettings(updates) {
    const settings = await this.getSettings();
    const updated = { ...settings, ...updates };
    await this.saveSettings(updated);
    
    return updated;
  }
}

module.exports = ConfigManager;
