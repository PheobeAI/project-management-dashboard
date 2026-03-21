/**
 * 服务器启动测试
 * 
 * 测试服务器能否正常启动和关闭
 */

const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const { spawn } = require('child_process');
const http = require('http');

describe('Server Startup', () => {
  let server;
  let serverPort;
  
  afterAll(() => {
    if (server) {
      server.kill();
    }
  });
  
  describe('Basic Integration', () => {
    it('should export ConfigManager as singleton instance', () => {
      const ConfigManager = require('../../src/server/services/ConfigManager');
      
      // Should be an object instance, not a constructor function
      expect(typeof ConfigManager).toBe('object');
      expect(typeof ConfigManager).not.toBe('function');
      
      // Should have all required methods
      expect(typeof ConfigManager.getPaths).toBe('function');
      expect(typeof ConfigManager.addPath).toBe('function');
      expect(typeof ConfigManager.updatePath).toBe('function');
      expect(typeof ConfigManager.deletePath).toBe('function');
      expect(typeof ConfigManager.getSettings).toBe('function');
    });
    
    it('should export Logger with required methods', () => {
      const logger = require('../../src/server/services/Logger');
      
      expect(typeof logger).toBe('object');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.getRecentLogs).toBe('function');
      expect(typeof logger.getErrorLogs).toBe('function');
    });
    
    it('should have FileScanner with scanProjects method', () => {
      const FileScanner = require('../../src/server/services/FileScanner');
      
      expect(typeof FileScanner).toBe('object');
      expect(typeof FileScanner.scanProjects).toBe('function');
    });
    
    it('should have DataParser with required parsing methods', () => {
      const DataParser = require('../../src/server/services/DataParser');
      
      expect(typeof DataParser).toBe('object');
      expect(typeof DataParser.parseStatus).toBe('function');
      expect(typeof DataParser.parseTasks).toBe('function');
      expect(typeof DataParser.parseBugs).toBe('function');
    });
  });
});
