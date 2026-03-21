/**
 * Project Management Dashboard - Server Entry Point
 * 
 * 入口文件：启动 Express 服务器，配置路由和中间件
 */

const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
const staticRoutes = require('./routes/static');
const logger = require('./services/Logger');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      logger.logRequest(req, res, duration);
    }
  });
  next();
});

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// API 路由
app.use('/api', apiRoutes);

// 页面路由
app.use('/', staticRoutes);

// 错误处理
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 启动服务器
function startServer(port) {
  const server = app.listen(port, () => {
    logger.info(`Project Management Dashboard started on http://localhost:${port}`);
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`Port ${port} busy, trying ${port + 1}...`);
      console.warn(`⚠️ Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      logger.error('Server error:', err);
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);

module.exports = app;
