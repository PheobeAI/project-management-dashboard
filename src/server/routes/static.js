/**
 * Static Routes - 页面模板路由
 * 
 * 处理页面渲染：首页、详情页、设置页及各个功能页面
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// 渲染引擎配置
const handlebars = require('handlebars');
const viewsDir = path.join(__dirname, '../../views');

// 模板缓存
const templates = {};

async function loadTemplates() {
  const templateFiles = [
    'layout.hbs',
    'home.hbs',
    'detail.hbs',
    'settings.hbs',
    'agents.hbs',
    'tasks.hbs',
    'versions.hbs',
    'documents.hbs',
    'bugs.hbs'
  ];
  
  for (const file of templateFiles) {
    try {
      const filePath = path.join(viewsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const name = file.replace('.hbs', '');
      templates[name] = handlebars.compile(content);
    } catch (error) {
      console.warn(`Failed to load template ${file}:`, error.message);
    }
  }
  
  // 加载 layout 模板
  try {
    templates.layout = handlebars.compile(await fs.readFile(path.join(viewsDir, 'layout.hbs'), 'utf-8'));
  } catch (error) {
    console.error('Failed to load layout:', error.message);
  }
}

// 首页 - Dashboard
router.get('/', async (req, res) => {
  if (!templates.layout) await loadTemplates();
  
  try {
    const content = templates.home({ title: 'Project Dashboard' });
    res.send(templates.layout({
      title: 'Project Dashboard',
      content,
      page: 'home'
    }));
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

// 项目详情页
router.get('/project/:id', async (req, res) => {
  if (!templates.layout) await loadTemplates();
  
  try {
    const { id } = req.params;
    const content = templates.detail({ title: `Project: ${id}`, projectId: id });
    res.send(templates.layout({
      title: `Project: ${id}`,
      content,
      page: 'detail',
      extraScripts: ['/static/js/detail.js']
    }));
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

// Agents 页面
router.get('/agents', async (req, res) => {
  if (!templates.layout) await loadTemplates();
  
  try {
    const content = templates.agents ? templates.agents({ title: 'Agents' }) : '<p>Template not found</p>';
    res.send(templates.layout({
      title: 'Agents - 工作负载',
      content,
      page: 'agents'
    }));
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

// Tasks 页面
router.get('/tasks', async (req, res) => {
  if (!templates.layout) await loadTemplates();
  
  try {
    const content = templates.tasks ? templates.tasks({ title: 'Tasks' }) : '<p>Template not found</p>';
    res.send(templates.layout({
      title: 'Tasks - 任务流转',
      content,
      page: 'tasks'
    }));
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

// Versions 页面
router.get('/versions', async (req, res) => {
  if (!templates.layout) await loadTemplates();
  
  try {
    const content = templates.versions ? templates.versions({ title: 'Versions' }) : '<p>Template not found</p>';
    res.send(templates.layout({
      title: 'Versions - 版本历史',
      content,
      page: 'versions'
    }));
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

// Documents 页面
router.get('/documents', async (req, res) => {
  if (!templates.layout) await loadTemplates();
  
  try {
    const content = templates.documents ? templates.documents({ title: 'Documents' }) : '<p>Template not found</p>';
    res.send(templates.layout({
      title: 'Documents - 文档中心',
      content,
      page: 'documents'
    }));
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

// Bugs 页面
router.get('/bugs', async (req, res) => {
  if (!templates.layout) await loadTemplates();
  
  try {
    const content = templates.bugs ? templates.bugs({ title: 'Bugs' }) : '<p>Template not found</p>';
    res.send(templates.layout({
      title: 'Bugs - Bug 追踪',
      content,
      page: 'bugs'
    }));
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

// Log 页面
router.get('/log', async (req, res) => {
  if (!templates.layout) await loadTemplates();
  
  try {
    const content = templates.log ? templates.log({ title: 'Log' }) : '<p>Template not found</p>';
    res.send(templates.layout({
      title: 'Log - 系统日志',
      content,
      page: 'log'
    }));
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

// Settings 页面
router.get('/settings', async (req, res) => {
  if (!templates.layout) await loadTemplates();
  
  try {
    const content = templates.settings({ title: 'Settings' });
    res.send(templates.layout({
      title: 'Settings - 系统设置',
      content,
      page: 'settings',
      extraScripts: ['/static/js/settings.js']
    }));
  } catch (error) {
    res.status(500).send('Error loading page');
  }
});

module.exports = router;
