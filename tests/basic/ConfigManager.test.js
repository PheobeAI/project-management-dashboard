/**
 * ConfigManager 单元测试
 */

const { describe, it, expect, beforeEach, vi } = require('vitest');
const fs = require('fs').promises;

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn()
  }
}));

// Mock logger
vi.mock('../../src/server/services/Logger', () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}));

describe('ConfigManager', () => {
  let ConfigManager;
  let configManager;
  
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    
    // Import the singleton instance directly
    ConfigManager = require('../../src/server/services/ConfigManager');
    configManager = ConfigManager;
  });
  
  describe('export type', () => {
    it('should be exported as a singleton instance, not a constructor', () => {
      // ConfigManager should be an instance, not a class/function
      expect(typeof ConfigManager).toBe('object');
      expect(typeof ConfigManager).not.toBe('function');
    });
    
    it('should have all required methods', () => {
      expect(typeof configManager.getPaths).toBe('function');
      expect(typeof configManager.savePaths).toBe('function');
      expect(typeof configManager.addPath).toBe('function');
      expect(typeof configManager.updatePath).toBe('function');
      expect(typeof configManager.deletePath).toBe('function');
      expect(typeof configManager.getSettings).toBe('function');
      expect(typeof configManager.updateSettings).toBe('function');
    });
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
    
    it('should handle JSON parse errors gracefully', async () => {
      fs.promises.readFile.mockResolvedValue('invalid json');
      fs.promises.writeFile.mockResolvedValue();
      fs.promises.mkdir.mockResolvedValue();
      
      const paths = await configManager.getPaths();
      
      // Should return default paths on parse error
      expect(Array.isArray(paths)).toBe(true);
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
    
    it('should generate id for new path', async () => {
      const existingPaths = [];
      const newPath = { path: '/new/path' };
      
      fs.promises.readFile.mockResolvedValue(JSON.stringify({ paths: existingPaths }));
      fs.promises.writeFile.mockResolvedValue();
      fs.promises.mkdir.mockResolvedValue();
      
      const result = await configManager.addPath(newPath);
      
      expect(result[0].id).toBeDefined();
      expect(result[0].id).toMatch(/^path-\d+$/);
    });
  });
  
  describe('updatePath', () => {
    it('should update an existing path', async () => {
      const existingPaths = [
        { id: 'path-1', path: '/old/path', alias: 'Old', color: '#000000' }
      ];
      
      fs.promises.readFile.mockResolvedValue(JSON.stringify({ paths: existingPaths }));
      fs.promises.writeFile.mockResolvedValue();
      fs.promises.mkdir.mockResolvedValue();
      
      const result = await configManager.updatePath('path-1', { alias: 'Updated', color: '#FFFFFF' });
      
      expect(result[0].alias).toBe('Updated');
      expect(result[0].color).toBe('#FFFFFF');
      expect(result[0].path).toBe('/old/path'); // Unchanged
    });
    
    it('should throw error when path not found', async () => {
      const existingPaths = [];
      fs.promises.readFile.mockResolvedValue(JSON.stringify({ paths: existingPaths }));
      fs.promises.writeFile.mockResolvedValue();
      fs.promises.mkdir.mockResolvedValue();
      
      await expect(configManager.updatePath('non-existent', {})).rejects.toThrow('Path not found');
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
  
  describe('updateSettings', () => {
    it('should update and return merged settings', async () => {
      const existingSettings = {
        theme: 'dark',
        autoRefresh: false,
        refreshInterval: 30000
      };
      
      fs.promises.readFile.mockResolvedValue(JSON.stringify(existingSettings));
      fs.promises.writeFile.mockResolvedValue();
      fs.promises.mkdir.mockResolvedValue();
      
      const result = await configManager.updateSettings({ refreshInterval: 120000 });
      
      expect(result.theme).toBe('dark'); // Unchanged
      expect(result.refreshInterval).toBe(120000); // Updated
    });
  });
});
