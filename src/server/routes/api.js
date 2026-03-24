/**
 * API Routes
 * 
 * 提供项目数据、路径配置、设置等 API
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const FileScanner = require('../services/FileScanner');
const DataParser = require('../services/DataParser');
const ConfigManager = require('../services/ConfigManager');
const GitHubService = require('../services/GitHubService');
const logger = require('../services/Logger');

const configManager = ConfigManager; // ConfigManager is already a singleton instance
const fileScanner = new FileScanner();
const dataParser = new DataParser();
const gitHubService = new GitHubService();

// 获取所有项目
router.get('/projects', async (req, res) => {
  try {
    const { search, status, pathId } = req.query;
    logger.debug('Fetching projects', { search, status, pathId });
    const paths = await configManager.getPaths();
    let projects = await fileScanner.scanProjects(paths);
    
    // 搜索过滤
    if (search) {
      const query = search.toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(query)
      );
    }
    
    // 状态过滤
    if (status && status !== 'all') {
      if (status === 'done') {
        projects = projects.filter(p => p.progress === 100);
      } else if (status === 'in_progress') {
        projects = projects.filter(p => p.progress !== 100 && p.status !== 'blocked');
      } else if (status === 'blocked') {
        projects = projects.filter(p => p.status === 'blocked');
      }
    }
    
    // 路径过滤
    if (pathId) {
      projects = projects.filter(p => p.pathId === pathId);
    }
    
    logger.info('Projects fetched', { count: projects.length });
    res.json({ success: true, data: projects });
  } catch (error) {
    logger.error('Failed to fetch projects', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个项目详情
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取路径配置
router.get('/paths', async (req, res) => {
  try {
    const paths = await configManager.getPaths();
    logger.debug('Paths fetched', { count: paths.length });
    res.json({ success: true, data: paths });
  } catch (error) {
    logger.error('Failed to fetch paths', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加路径
router.post('/paths', async (req, res) => {
  try {
    const { path: newPath, alias, color } = req.body;
    logger.info('Adding path', { path: newPath, alias });
    const paths = await configManager.addPath({ path: newPath, alias, color });
    res.json({ success: true, data: paths });
  } catch (error) {
    logger.error('Failed to add path', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// 更新路径
router.put('/paths/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    logger.info('Updating path', { id, updates });
    const paths = await configManager.updatePath(id, updates);
    res.json({ success: true, data: paths });
  } catch (error) {
    logger.error('Failed to update path', { id, error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

// 删除路径
router.delete('/paths/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Deleting path', { id });
    const paths = await configManager.deletePath(id);
    res.json({ success: true, data: paths });
  } catch (error) {
    logger.error('Failed to delete path', { id, error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

// 获取设置
router.get('/settings', async (req, res) => {
  try {
    const settings = await configManager.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新设置
router.put('/settings', async (req, res) => {
  try {
    const updates = req.body;
    const settings = await configManager.updateSettings(updates);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 手动刷新数据
router.post('/refresh', async (req, res) => {
  try {
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    res.json({ success: true, data: { projects, timestamp: new Date().toISOString() } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ GitHub API ============

// 获取 GitHub 认证状态
router.get('/github/status', async (req, res) => {
  try {
    const status = await gitHubService.getAuthStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取项目 Git 状态
router.get('/github/status/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const status = await gitHubService.getStatus(project.path);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 提交项目变更
router.post('/github/commit/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message, files } = req.body;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const result = await gitHubService.commitProjectChanges(project.path, {
      message,
      files: files || ['.project/status.json', '.project/tasks/', '.project/reviews/']
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 推送项目到远程
router.post('/github/push/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { remote, branch } = req.body;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const result = await gitHubService.push(
      project.path,
      remote || 'origin',
      branch || 'main'
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取项目提交历史
router.get('/github/log/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit } = req.query;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const log = await gitHubService.getLog(project.path, parseInt(limit) || 10);
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Stats API (Dashboard) ============

// 获取全局统计
router.get('/stats', async (req, res) => {
  try {
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    const stats = {
      total: projects.length,
      inProgress: projects.filter(p => p.progress < 100 && p.status !== 'blocked').length,
      completed: projects.filter(p => p.progress === 100).length,
      blocked: projects.filter(p => p.status === 'blocked').length
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取 Phase 分布统计
router.get('/stats/by-phase', async (req, res) => {
  try {
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    const phaseCount = {};
    projects.forEach(p => {
      const phase = p.phase || 0;
      phaseCount[phase] = (phaseCount[phase] || 0) + 1;
    });
    
    const phases = Object.keys(phaseCount).sort((a, b) => a - b);
    const data = phases.map(phase => ({
      phase: parseInt(phase),
      count: phaseCount[phase]
    }));
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取 Bug 统计
router.get('/stats/bugs', async (req, res) => {
  try {
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    let totalBugs = 0, fixedBugs = 0;
    
    for (const project of projects) {
      const bugs = await dataParser.parseBugs(path.join(project.path, '.project'));
      totalBugs += bugs.length;
      fixedBugs += bugs.filter(b => b.status === 'fixed').length;
    }
    
    const openBugs = totalBugs - fixedBugs;
    const progress = totalBugs > 0 ? Math.round((fixedBugs / totalBugs) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        total: totalBugs,
        fixed: fixedBugs,
        open: openBugs,
        progress
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ F10/F11/F12 API ============

// 获取项目的 Agent 分组任务 (F10)
router.get('/projects/:id/agent-tasks', async (req, res) => {
  try {
    const { id } = req.params;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // 按 Agent 分组任务
    const agentGroups = {};
    const agentIcons = {
      'PM': '👤',
      'Designer': '🤖',
      'Engineer': '💻',
      'Art': '🎨',
      'QA': '🧪'
    };
    
    (project.tasks || []).forEach(task => {
      const agent = task.assignee || 'Unassigned';
      if (!agentGroups[agent]) {
        agentGroups[agent] = {
          name: agent,
          icon: agentIcons[agent] || '👤',
          waiting: [],
          inProgress: [],
          done: []
        };
      }
      
      if (task.status === 'waiting') {
        agentGroups[agent].waiting.push(task);
      } else if (task.status === 'in_progress') {
        agentGroups[agent].inProgress.push(task);
      } else if (task.status === 'done') {
        agentGroups[agent].done.push(task);
      }
    });
    
    res.json({
      success: true,
      data: {
        agents: Object.values(agentGroups)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取项目的评审意见 (F12)
router.get('/projects/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const reviews = await dataParser.parseReviews(path.join(project.path, '.project'));
    
    res.json({
      success: true,
      data: { reviews }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取项目的 Bug 统计 (F12)
router.get('/projects/:id/bugs', async (req, res) => {
  try {
    const { id } = req.params;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const bugs = await dataParser.parseBugs(path.join(project.path, '.project'));
    
    // 计算 Bug 统计
    const total = bugs.length;
    const fixed = bugs.filter(b => b.status === 'fixed').length;
    const open = total - fixed;
    const progress = total > 0 ? Math.round((fixed / total) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        bugs,
        stats: { total, fixed, open, progress }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Bugs API (全局) ============

// 获取所有 Bug
router.get('/bugs', async (req, res) => {
  try {
    const { status, severity } = req.query;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    let allBugs = [];
    
    for (const project of projects) {
      const bugs = await dataParser.parseBugs(path.join(project.path, '.project'));
      bugs.forEach(bug => {
        allBugs.push({
          ...bug,
          projectName: project.name,
          projectId: project.id
        });
      });
    }
    
    // 状态过滤
    if (status && status !== 'all') {
      allBugs = allBugs.filter(b => b.status === status);
    }
    
    // 严重程度过滤
    if (severity && severity !== 'all') {
      allBugs = allBugs.filter(b => b.severity === severity);
    }
    
    res.json({ success: true, data: allBugs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取 Bug 统计
router.get('/bugs/stats', async (req, res) => {
  try {
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    let totalBugs = 0, fixedBugs = 0, openBugs = 0;
    const severityCount = { high: 0, medium: 0, minor: 0, critical: 0 };
    
    for (const project of projects) {
      const bugs = await dataParser.parseBugs(path.join(project.path, '.project'));
      bugs.forEach(bug => {
        totalBugs++;
        if (bug.status === 'fixed') {
          fixedBugs++;
        } else {
          openBugs++;
        }
        const sev = bug.severity || 'medium';
        if (severityCount.hasOwnProperty(sev)) {
          severityCount[sev]++;
        }
      });
    }
    
    const progress = totalBugs > 0 ? Math.round((fixedBugs / totalBugs) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        total: totalBugs,
        fixed: fixedBugs,
        open: openBugs,
        progress,
        bySeverity: severityCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取 Bug 趋势
router.get('/bugs/trend', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    // 生成最近 N 天的趋势数据
    const trend = [];
    const now = new Date();
    
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let dayTotal = 0, dayFixed = 0;
      
      for (const project of projects) {
        const bugs = await dataParser.parseBugs(path.join(project.path, '.project'));
        bugs.forEach(bug => {
          const createdDate = bug.created_at?.split('T')[0];
          if (createdDate && createdDate <= dateStr) {
            dayTotal++;
            if (bug.fixed_at && bug.fixed_at.split('T')[0] <= dateStr) {
              dayFixed++;
            }
          }
        });
      }
      
      trend.push({
        date: dateStr,
        total: dayTotal,
        fixed: dayFixed,
        open: dayTotal - dayFixed
      });
    }
    
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Tasks API ============

// 获取所有任务
router.get('/tasks', async (req, res) => {
  try {
    const { status, type, assignee } = req.query;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    let allTasks = [];
    
    for (const project of projects) {
      project.tasks.forEach(task => {
        allTasks.push({
          ...task,
          projectName: project.name,
          projectId: project.id
        });
      });
    }
    
    // 过滤
    if (status && status !== 'all') {
      allTasks = allTasks.filter(t => t.status === status);
    }
    if (type && type !== 'all') {
      // 大小写不敏感匹配，支持 art/Art/ART 等各种大小写形式
      allTasks = allTasks.filter(t => t.type && t.type.toLowerCase() === type.toLowerCase());
    }
    if (assignee && assignee !== 'all') {
      allTasks = allTasks.filter(t => t.assignee === assignee);
    }
    
    res.json({ success: true, data: allTasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取任务统计
router.get('/tasks/stats', async (req, res) => {
  try {
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    const stats = {
      total: 0,
      waiting: 0,
      inProgress: 0,
      done: 0,
      cancelled: 0
    };
    
    projects.forEach(project => {
      project.tasks.forEach(task => {
        stats.total++;
        if (task.status === 'waiting') stats.waiting++;
        else if (task.status === 'in_progress') stats.inProgress++;
        else if (task.status === 'done') stats.done++;
        else if (task.status === 'cancelled') stats.cancelled++;
      });
    });
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Agents API ============

// 获取所有 Agent
router.get('/agents', async (req, res) => {
  try {
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    const agentMap = {};
    const agentIcons = {
      'PM': '👤',
      'Designer': '🤖',
      'Engineer': '💻',
      'Art': '🎨',
      'QA': '🧪'
    };
    
    projects.forEach(project => {
      project.tasks.forEach(task => {
        const agent = task.assignee || 'Unassigned';
        if (!agentMap[agent]) {
          agentMap[agent] = {
            name: agent,
            icon: agentIcons[agent] || '👤',
            tasks: { waiting: 0, inProgress: 0, done: 0, total: 0 }
          };
        }
        agentMap[agent].tasks.total++;
        if (task.status === 'waiting') agentMap[agent].tasks.waiting++;
        else if (task.status === 'in_progress') agentMap[agent].tasks.inProgress++;
        else if (task.status === 'done') agentMap[agent].tasks.done++;
      });
    });
    
    res.json({ success: true, data: Object.values(agentMap) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取 Agent 工作负载统计
router.get('/agents/stats', async (req, res) => {
  try {
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    const workload = [];
    const agentIcons = {
      'PM': '👤',
      'Designer': '🤖',
      'Engineer': '💻',
      'Art': '🎨',
      'QA': '🧪'
    };
    
    const agentMap = {};
    
    projects.forEach(project => {
      project.tasks.forEach(task => {
        const agent = task.assignee || 'Unassigned';
        if (!agentMap[agent]) {
          agentMap[agent] = { waiting: 0, inProgress: 0, done: 0 };
        }
        if (task.status === 'waiting') agentMap[agent].waiting++;
        else if (task.status === 'in_progress') agentMap[agent].inProgress++;
        else if (task.status === 'done') agentMap[agent].done++;
      });
    });
    
    Object.entries(agentMap).forEach(([name, data]) => {
      workload.push({
        name,
        icon: agentIcons[name] || '👤',
        ...data,
        total: data.waiting + data.inProgress + data.done
      });
    });
    
    res.json({ success: true, data: workload });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Versions API ============

// 获取版本列表
router.get('/versions', async (req, res) => {
  try {
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    let allVersions = [];
    
    for (const project of projects) {
      const versionsDir = path.join(project.path, '.project', 'versions');
      try {
        const files = await fs.readdir(versionsDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        for (const file of jsonFiles) {
          const content = await fs.readFile(path.join(versionsDir, file), 'utf-8');
          const version = JSON.parse(content);
          allVersions.push({
            ...version,
            projectName: project.name,
            projectId: project.id
          });
        }
      } catch (e) {
        // 版本目录不存在，跳过
      }
    }
    
    // 按日期倒序
    allVersions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ success: true, data: allVersions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Documents API ============

// 获取文档列表
router.get('/documents', async (req, res) => {
  try {
    const { projectId, type } = req.query;
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    const docs = [];
    const docExtensions = ['.md', '.txt', '.json', '.yaml', '.yml'];
    
    for (const project of projects) {
      if (projectId && project.id !== projectId) continue;
      
      // 扫描项目目录下的文档
      const scanDir = async (dir, relativePath = '') => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.join(relativePath, entry.name);
            
            if (entry.isDirectory()) {
              // 跳过 .project 和 node_modules
              if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await scanDir(fullPath, relPath);
              }
            } else {
              const ext = path.extname(entry.name).toLowerCase();
              if (docExtensions.includes(ext)) {
                docs.push({
                  name: entry.name,
                  path: fullPath,
                  relativePath: relPath,
                  type: ext.slice(1),
                  projectName: project.name,
                  projectId: project.id
                });
              }
            }
          }
        } catch (e) {
          // 跳过无法访问的目录
        }
      };
      
      await scanDir(project.path);
    }
    
    // 类型过滤
    if (type && type !== 'all') {
      const filtered = docs.filter(d => d.type === type);
      return res.json({ success: true, data: filtered });
    }
    
    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 搜索文档
router.get('/documents/search', async (req, res) => {
  try {
    const { q, projectId } = req.query;
    if (!q) {
      return res.json({ success: true, data: [] });
    }
    
    const paths = await configManager.getPaths();
    const projects = await fileScanner.scanProjects(paths);
    
    const results = [];
    const query = q.toLowerCase();
    
    for (const project of projects) {
      if (projectId && project.id !== projectId) continue;
      
      const docsDir = path.join(project.path);
      const scanDir = async (dir) => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
              if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await scanDir(fullPath);
              }
            } else if (entry.name.toLowerCase().includes(query)) {
              results.push({
                name: entry.name,
                path: fullPath,
                projectName: project.name,
                projectId: project.id
              });
            }
          }
        } catch (e) {
          // 跳过
        }
      };
      
      await scanDir(docsDir);
    }
    
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取应用日志
router.get('/logs', async (req, res) => {
  try {
    const { type, lines } = req.query;
    const count = parseInt(lines) || 50;
    
    if (type === 'error') {
      const logs = await logger.getErrorLogs(count);
      res.json({ success: true, data: { type: 'error', logs } });
    } else {
      const logs = await logger.getRecentLogs(count);
      res.json({ success: true, data: { type: 'all', logs } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
