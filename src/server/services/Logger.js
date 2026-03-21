/**
 * Logger Service - 文件日志记录
 * 
 * 将日志写入本地文件，支持错误日志分离
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class Logger {
  constructor() {
    this.logDir = path.join(os.homedir(), '.config', 'project-management-dashboard', 'logs');
    this.logFile = path.join(this.logDir, 'app.log');
    this.errorFile = path.join(this.logDir, 'error.log');
    this.maxLogSize = 5 * 1024 * 1024; // 5MB
    this.ensureLogDir();
  }

  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      // 目录已存在
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, data = null) {
    let log = `[${this.getTimestamp()}] [${level.toUpperCase()}] ${message}`;
    if (data) {
      if (data instanceof Error) {
        log += `\n  Error: ${data.message}`;
        log += `\n  Stack: ${data.stack}`;
      } else if (typeof data === 'object') {
        log += `\n  Data: ${JSON.stringify(data)}`;
      } else {
        log += `\n  Data: ${data}`;
      }
    }
    return log + os.EOL;
  }

  async writeToFile(filePath, content) {
    try {
      // 检查文件大小
      try {
        const stats = await fs.stat(filePath);
        if (stats.size >= this.maxLogSize) {
          // 备份旧文件
          const backupPath = filePath + '.old';
          await fs.rename(filePath, backupPath);
        }
      } catch (e) {
        // 文件不存在，继续
      }
      
      await fs.appendFile(filePath, content);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  async info(message, data = null) {
    const formatted = this.formatMessage('INFO', message, data);
    console.log(formatted.trim());
    await this.writeToFile(this.logFile, formatted);
  }

  async warn(message, data = null) {
    const formatted = this.formatMessage('WARN', message, data);
    console.warn(formatted.trim());
    await this.writeToFile(this.logFile, formatted);
  }

  async error(message, data = null) {
    const formatted = this.formatMessage('ERROR', message, data);
    console.error(formatted.trim());
    await this.writeToFile(this.errorFile, formatted);
    await this.writeToFile(this.logFile, formatted);
  }

  async debug(message, data = null) {
    if (process.env.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, data);
      console.log(formatted.trim());
      await this.writeToFile(this.logFile, formatted);
    }
  }

  // 记录 API 请求
  async logRequest(req, res, duration) {
    const log = `[${this.getTimestamp()}] [API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;
    console.log(log);
    await this.writeToFile(this.logFile, log + os.EOL);
  }

  // 获取最近日志
  async getRecentLogs(lines = 100) {
    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const allLines = content.split(os.EOL).filter(l => l.trim());
      return allLines.slice(-lines);
    } catch (error) {
      return [];
    }
  }

  // 获取错误日志
  async getErrorLogs(lines = 50) {
    try {
      const content = await fs.readFile(this.errorFile, 'utf-8');
      const allLines = content.split(os.EOL).filter(l => l.trim());
      return allLines.slice(-lines);
    } catch (error) {
      return [];
    }
  }
}

module.exports = new Logger();
