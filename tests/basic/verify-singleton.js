/**
 * 快速验证脚本 - 检查模块导出是否正确
 * 运行: node tests/basic/verify-singleton.js
 */

const assert = require('assert');

console.log('=== 模块导出验证 ===\n');

try {
  // 1. 验证 ConfigManager
  console.log('1. 检查 ConfigManager...');
  const ConfigManager = require('../../src/server/services/ConfigManager');
  
  // ConfigManager 应该是单例实例 (object)，不是构造函数 (function)
  assert.strictEqual(typeof ConfigManager, 'object', 'ConfigManager 应该是 object 实例');
  
  assert.strictEqual(typeof ConfigManager.getPaths, 'function', '应该有 getPaths 方法');
  assert.strictEqual(typeof ConfigManager.addPath, 'function', '应该有 addPath 方法');
  assert.strictEqual(typeof ConfigManager.updatePath, 'function', '应该有 updatePath 方法');
  assert.strictEqual(typeof ConfigManager.deletePath, 'function', '应该有 deletePath 方法');
  assert.strictEqual(typeof ConfigManager.getSettings, 'function', '应该有 getSettings 方法');
  
  console.log('   ✓ ConfigManager 导出正确 (单例实例)\n');
  
  // 2. 验证 Logger
  console.log('2. 检查 Logger...');
  const logger = require('../../src/server/services/Logger');
  
  assert.strictEqual(typeof logger, 'object', 'Logger 应该是 object');
  assert.strictEqual(typeof logger.info, 'function', '应该有 info 方法');
  assert.strictEqual(typeof logger.error, 'function', '应该有 error 方法');
  
  console.log('   ✓ Logger 导出正确\n');
  
  // 3. 验证 FileScanner (是构造函数)
  console.log('3. 检查 FileScanner...');
  const FileScanner = require('../../src/server/services/FileScanner');
  
  assert.strictEqual(typeof FileScanner, 'function', 'FileScanner 应该是构造函数');
  
  // 创建实例测试
  const scanner = new FileScanner();
  assert.strictEqual(typeof scanner.scanProjects, 'function', '实例应该有 scanProjects 方法');
  
  console.log('   ✓ FileScanner 导出正确 (构造函数)\n');
  
  // 4. 验证 DataParser (是构造函数)
  console.log('4. 检查 DataParser...');
  const DataParser = require('../../src/server/services/DataParser');
  
  assert.strictEqual(typeof DataParser, 'function', 'DataParser 应该是构造函数');
  assert.strictEqual(typeof DataParser.prototype.parseStatus, 'function', '原型应该有 parseStatus 方法');
  
  console.log('   ✓ DataParser 导出正确 (构造函数)\n');
  
  console.log('=== 所有验证通过! ===\n');
  process.exit(0);
} catch (err) {
  console.error('❌ 验证失败:', err.message);
  process.exit(1);
}
