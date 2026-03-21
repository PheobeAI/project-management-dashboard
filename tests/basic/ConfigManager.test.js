/**
 * ConfigManager 单元测试
 */

const { describe, it, expect, beforeEach, vi } = require('vitest');
const fs = require('fs').promises;
const os = require('os');

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn()
  }
}));

describe('ConfigManager', () => {
  let ConfigManager;
  let configManager;
  
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    
    // Mock os.homedir
    vi.stubGlobal('os', {
      homedir: () => '/mock/home'
    });
    
    ConfigManager = require('../../src/server/services/ConfigManager');
    configManager = new ConfigManager();
  });
  
  describe('getPaths', () => {
    it('should return default paths when config file does not exist', async () => {
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      fs.promises.readFile.mockRejectedValue(error);
      fs.promises.writeFile.mockResolvedValue();
      fs.promises.mkdir.mockResolvedValue();
      
      const paths = await configManager.getPaths();
      
      expect(Array.isArray(paths)).toBe(true);
      expect(paths.length).toBeGreaterThan(0);
      expect(paths[0]).toHaveProperty('id');
      expect(paths[0]).toHaveProperty('path');
    });
    
    it('should return parsed paths from config file', async () => {
      const mockPaths = {
        paths: [
          { id: 'path-1', path: '/test/path1', alias: 'Test 1', color: '#3B82F6' }
        ]
      };
      
      fs.promises.readFile.mockResolvedValue(JSON.stringify(mockPaths));
      
      const paths = await configManager.getPaths();
      
      expect(paths).toEqual(mockPaths.paths);
    });
  });
  
  describe('addPath', () => {
    it('should add a new path', async () => {
      const existingPaths = [];
      const newPath = { path: '/new/path', alias: 'New', color: '#10B981' };
      
      fs.promises.readFile.mockResolvedValue(JSON.stringify({ paths: existingPaths }));
      fs.promises.writeFile.mockResolvedValue();
      fs.promises.mkdir.mockResolvedValue();
      
      const result = await configManager.addPath(newPath);
      
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('/new/path');
      expect(result[0].alias).toBe('New');
      expect(result[0].color).toBe('#10B981');
    });
  });
  
  describe('deletePath', () => {
    it('should delete a path by id', async () => {
      const existingPaths = [
        { id: 'path-1', path: '/test1' },
        { id: 'path-2', path: '/test2' }
      ];
      
      fs.promises.readFile.mockResolvedValue(JSON.stringify({ paths: existingPaths }));
      fs.promises.writeFile.mockResolvedValue();
      fs.promises.mkdir.mockResolvedValue();
      
      const result = await configManager.deletePath('path-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('path-2');
    });
  });
  
  describe('getSettings', () => {
    it('should return default settings when config file does not exist', async () => {
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      fs.promises.readFile.mockRejectedValue(error);
      fs.promises.writeFile.mockResolvedValue();
      fs.promises.mkdir.mockResolvedValue();
      
      const settings = await configManager.getSettings();
      
      expect(settings).toHaveProperty('theme', 'light');
      expect(settings).toHaveProperty('autoRefresh', true);
      expect(settings).toHaveProperty('refreshInterval', 60000);
    });
  });
});
