/**
 * FileScanner 单元测试
 */

const { describe, it, expect, beforeEach, vi } = require('vitest');
const fs = require('fs').promises;

// Mock dependencies
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    readFile: vi.fn()
  }
}));

describe('FileScanner', () => {
  let FileScanner;
  let DataParser;
  let fileScanner;
  
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    
    DataParser = require('../../src/server/services/DataParser');
    FileScanner = require('../../src/server/services/FileScanner');
    fileScanner = new FileScanner();
  });
  
  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      const tasks = [
        { status: 'done' },
        { status: 'done' },
        { status: 'in_progress' },
        { status: 'waiting' }
      ];
      
      const progress = fileScanner.calculateProgress(tasks);
      
      expect(progress).toBe(50); // 2/4 = 50%
    });
    
    it('should return 0 for empty tasks', () => {
      const progress = fileScanner.calculateProgress([]);
      
      expect(progress).toBe(0);
    });
    
    it('should return 0 for null tasks', () => {
      const progress = fileScanner.calculateProgress(null);
      
      expect(progress).toBe(0);
    });
  });
  
  describe('calculateStatus', () => {
    it('should return uninitialized for missing status', () => {
      const status = fileScanner.calculateStatus(null, []);
      
      expect(status).toBe('uninitialized');
    });
    
    it('should return normal for high progress', () => {
      const status = {
        phase: 3,
        waiting_for: null
      };
      const tasks = [
        { status: 'done' },
        { status: 'done' },
        { status: 'done' },
        { status: 'done' },
        { status: 'done' } // 5/5 = 100%
      ];
      
      const result = fileScanner.calculateStatus(status, tasks);
      
      expect(result).toBe('normal');
    });
    
    it('should return warning for medium progress', () => {
      const status = { phase: 3 };
      const tasks = [
        { status: 'done' },
        { status: 'done' },
        { status: 'in_progress' },
        { status: 'waiting' },
        { status: 'waiting' } // 2/5 = 40%
      ];
      
      const result = fileScanner.calculateStatus(status, tasks);
      
      expect(result).toBe('warning');
    });
    
    it('should return blocked when waiting_for.since > 48 hours', () => {
      const twoDaysAgo = new Date(Date.now() - 49 * 60 * 60 * 1000);
      const status = {
        phase: 3,
        waiting_for: {
          agent: 'Engineer',
          action: 'develop',
          since: twoDaysAgo.toISOString()
        }
      };
      
      const result = fileScanner.calculateStatus(status, []);
      
      expect(result).toBe('blocked');
    });
    
    it('should return normal when waiting_for.since < 48 hours', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const status = {
        phase: 3,
        waiting_for: {
          agent: 'Engineer',
          action: 'develop',
          since: oneDayAgo.toISOString()
        }
      };
      const tasks = [
        { status: 'done' },
        { status: 'done' },
        { status: 'in_progress' },
        { status: 'waiting' },
        { status: 'waiting' } // 40%
      ];
      
      const result = fileScanner.calculateStatus(status, tasks);
      
      expect(result).toBe('warning');
    });
  });
});
