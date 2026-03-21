/**
 * ConfigManager Service
 * 
 * 负责管理应用配置：路径配置、设置等
 * 配置文件存放在用户数据目录
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('./Logger');

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'project-management-dashboard');
    this.pathsFile = path.join(this.configDir, 'paths.json');
    this.settingsFile = path.join(this.configDir, 'settings.json');
    this.ensureConfigDir();
    logger.info('ConfigManager initialized', { configDir: this.configDir });
  }

  async ensureConfigDir() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      // 目录已存在
    }
  }

  async getPaths() {
    try {
      const content = await fs.readFile(this.pathsFile, 'utf-8');
      const data = JSON.parse(content);
      logger.debug('Loaded paths', { count: data.paths?.length || 0 });
      return data.paths || [];
    } catch (error) {
      logger.warn('Failed to load paths, using defaults', error);
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
      await this.savePaths(defaultPaths);
      return defaultPaths;
    }
  }

  async savePaths(paths) {
    await this.ensureConfigDir();
    const data = { paths, version: '1.0', updatedAt: new Date().toISOString() };
    await fs.writeFile(this.pathsFile, JSON.stringify(data, null, 2));
    logger.info('Paths saved', { count: paths.length });
  }

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
    logger.info('Path added', { id: newPath.id, alias: newPath.alias });
    return paths;
  }

  async updatePath(id, updates) {
    const paths = await this.getPaths();
    const index = paths.findIndex(p => p.id === id);
    if (index === -1) {
      logger.error('Path not found for update', { id });
      throw new Error('Path not found');
    }
    paths[index] = { ...paths[index], ...updates };
    await this.savePaths(paths);
    logger.info('Path updated', { id, updates });
    return paths;
  }

  async deletePath(id) {
    const paths = await this.getPaths();
    const filtered = paths.filter(p => p.id !== id);
    await this.savePaths(filtered);
    logger.info('Path deleted', { id });
    return filtered;
  }

  async getSettings() {
    try {
      const content = await fs.readFile(this.settingsFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.warn('Failed to load settings, using defaults', error);
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

  async saveSettings(settings) {
    await this.ensureConfigDir();
    const data = { ...settings, lastUpdated: new Date().toISOString() };
    await fs.writeFile(this.settingsFile, JSON.stringify(data, null, 2));
    logger.info('Settings saved');
  }

  async updateSettings(updates) {
    const settings = await this.getSettings();
    const updated = { ...settings, ...updates };
    await this.saveSettings(updated);
    logger.info('Settings updated', { keys: Object.keys(updates) });
    return updated;
  }
}

module.exports = new ConfigManager();
