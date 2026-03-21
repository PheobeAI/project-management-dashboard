/**
 * DataParser 单元测试
 */

const { describe, it, expect, beforeEach } = require('vitest');
const DataParser = require('../../src/server/services/DataParser');
const fs = require('fs').promises;
const path = require('path');

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn()
  }
}));

describe('DataParser', () => {
  let parser;
  
  beforeEach(() => {
    parser = new DataParser();
    vi.clearAllMocks();
  });
  
  describe('parseStatus', () => {
    it('should parse valid status.json', async () => {
      const mockStatus = {
        project_name: 'test-project',
        phase: 3,
        waiting_for: { agent: 'Engineer', action: 'develop' }
      };
      
      fs.promises.readFile.mockResolvedValue(JSON.stringify(mockStatus));
      
      const result = await parser.parseStatus('/mock/path/.project');
      
      expect(result).toEqual(mockStatus);
    });
    
    it('should return null for missing status.json', async () => {
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      fs.promises.readFile.mockRejectedValue(error);
      
      const result = await parser.parseStatus('/mock/path/.project');
      
      expect(result).toBeNull();
    });
    
    it('should return null for malformed JSON', async () => {
      fs.promises.readFile.mockResolvedValue('invalid json');
      
      const result = await parser.parseStatus('/mock/path/.project');
      
      expect(result).toBeNull();
    });
  });
  
  describe('parseTasks', () => {
    it('should parse tasks directory', async () => {
      fs.promises.readdir.mockResolvedValue(['task1.json', 'task2.json']);
      
      const task1 = { id: 'TASK-001', title: 'Task 1', status: 'done' };
      const task2 = { id: 'TASK-002', title: 'Task 2', status: 'in_progress' };
      
      fs.promises.readFile
        .mockResolvedValueOnce(JSON.stringify(task1))
        .mockResolvedValueOnce(JSON.stringify(task2));
      
      const result = await parser.parseTasks('/mock/path/.project/tasks');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(task1);
      expect(result[1]).toEqual(task2);
    });
    
    it('should return empty array for missing tasks directory', async () => {
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      fs.promises.readdir.mockRejectedValue(error);
      
      const result = await parser.parseTasks('/mock/path/.project/tasks');
      
      expect(result).toEqual([]);
    });
  });
  
  describe('calculateProgress', () => {
    it('should calculate correct progress percentage', () => {
      const tasks = [
        { status: 'done' },
        { status: 'done' },
        { status: 'done' },
        { status: 'in_progress' },
        { status: 'waiting' }
      ];
      
      const progress = parser.calculateProgress(tasks);
      
      expect(progress).toBe(60); // 3/5 = 60%
    });
    
    it('should return 0 for empty tasks', () => {
      const progress = parser.calculateProgress([]);
      
      expect(progress).toBe(0);
    });
    
    it('should return 0 for null tasks', () => {
      const progress = parser.calculateProgress(null);
      
      expect(progress).toBe(0);
    });
  });
});
