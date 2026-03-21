/**
 * GitHub Service
 * 
 * 负责 GitHub 版本管理功能
 * 使用 simple-git 库实现 Git 操作
 */

const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');

class GitHubService {
  constructor() {
    this.initialized = false;
    this.repoPath = null;
  }

  /**
   * 初始化 GitHub 服务
   * @param {string} repoPath - 仓库路径
   */
  async init(repoPath) {
    this.repoPath = repoPath;
    
    try {
      // 检查是否是 Git 仓库
      const git = simpleGit(repoPath);
      const isRepo = await git.checkIsRepo();
      
      if (!isRepo) {
        // 初始化新仓库
        await git.init();
        this.initialized = true;
      } else {
        this.initialized = true;
      }
      
      return { success: true, initialized: this.initialized };
    } catch (error) {
      console.error('GitHub init error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查 GitHub CLI 是否可用
   */
  isGhAvailable() {
    try {
      execSync('gh --version', { encoding: 'utf-8', stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查 GitHub 认证状态
   */
  async isAuthenticated() {
    if (!this.isGhAvailable()) {
      return { authenticated: false, reason: 'gh CLI not available' };
    }
    
    try {
      execSync('gh auth status', { encoding: 'utf-8', stdio: 'pipe' });
      return { authenticated: true };
    } catch {
      return { authenticated: false, reason: 'not authenticated' };
    }
  }

  /**
   * 获取 GitHub 认证状态
   */
  async getAuthStatus() {
    const ghAvailable = this.isGhAvailable();
    if (!ghAvailable) {
      return {
        available: false,
        authenticated: false,
        message: 'GitHub CLI (gh) 未安装'
      };
    }
    
    try {
      execSync('gh auth status', { encoding: 'utf-8', stdio: 'pipe' });
      return { available: true, authenticated: true };
    } catch {
      return {
        available: true,
        authenticated: false,
        message: '未登录 GitHub，请运行 gh auth login'
      };
    }
  }

  /**
   * 提交项目状态变更
   * @param {string} projectPath - 项目路径
   * @param {Object} options - 提交选项
   */
  async commitProjectChanges(projectPath, options = {}) {
    const {
      message,
      files = ['.project/status.json', '.project/tasks/', '.project/reviews/']
    } = options;
    
    try {
      const git = simpleGit(projectPath);
      
      // 检查是否是 Git 仓库
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return { success: false, error: 'Not a Git repository' };
      }
      
      // 添加文件
      const addPatterns = files.map(f => path.join(projectPath, f));
      await git.add(addPatterns);
      
      // 检查是否有变更
      const status = await git.status();
      if (status.staged.length === 0) {
        return { success: true, message: 'No changes to commit', changed: false };
      }
      
      // 生成提交信息
      const commitMessage = message || this.generateCommitMessage(status);
      
      // 提交
      await git.commit(commitMessage);
      
      return {
        success: true,
        message: 'Changes committed',
        commitMessage,
        changed: true,
        stagedCount: status.staged.length
      };
    } catch (error) {
      console.error('Commit error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 生成提交信息
   * @param {Object} status - Git 状态
   */
  generateCommitMessage(status) {
    const timestamp = new Date().toISOString().split('T')[0];
    const changes = [];
    
    if (status.created.length > 0) {
      changes.push(`${status.created.length} new file(s)`);
    }
    if (status.modified.length > 0) {
      changes.push(`${status.modified.length} modified file(s)`);
    }
    if (status.deleted.length > 0) {
      changes.push(`${status.deleted.length} deleted file(s)`);
    }
    
    if (changes.length === 0) {
      return `[${timestamp}] Update project status`;
    }
    
    return `[${timestamp}] ${changes.join(', ')}`;
  }

  /**
   * 获取变更状态
   * @param {string} projectPath - 项目路径
   */
  async getStatus(projectPath) {
    try {
      const git = simpleGit(projectPath);
      const isRepo = await git.checkIsRepo();
      
      if (!isRepo) {
        return { isRepo: false };
      }
      
      const status = await git.status();
      
      return {
        isRepo: true,
        clean: status.clean,
        created: status.created,
        modified: status.modified,
        deleted: status.deleted,
        current: status.current,
        tracking: status.tracking,
        ahead: status.ahead,
        behind: status.behind
      };
    } catch (error) {
      return { isRepo: false, error: error.message };
    }
  }

  /**
   * 推送到远程仓库
   * @param {string} projectPath - 项目路径
   * @param {string} remote - 远程仓库名（默认 origin）
   * @param {string} branch - 分支名（默认 main）
   */
  async push(projectPath, remote = 'origin', branch = 'main') {
    try {
      const git = simpleGit(projectPath);
      
      await git.push(remote, branch);
      
      return { success: true, message: `Pushed to ${remote}/${branch}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 从远程拉取
   * @param {string} projectPath - 项目路径
   */
  async pull(projectPath) {
    try {
      const git = simpleGit(projectPath);
      
      await git.pull();
      
      return { success: true, message: 'Pulled from remote' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取提交历史
   * @param {string} projectPath - 项目路径
   * @param {number} limit - 返回数量
   */
  async getLog(projectPath, limit = 10) {
    try {
      const git = simpleGit(projectPath);
      const isRepo = await git.checkIsRepo();
      
      if (!isRepo) {
        return { isRepo: false };
      }
      
      const log = await git.log({ maxCount: limit });
      
      return {
        isRepo: true,
        all: log.all,
        total: log.total,
        latest: log.latest
      };
    } catch (error) {
      return { isRepo: false, error: error.message };
    }
  }
}

module.exports = GitHubService;
