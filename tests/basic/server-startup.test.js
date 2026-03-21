/**
 * 服务器启动集成测试
 * 
 * 测试 npm start 能否正常启动服务器并响应请求
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');

describe('Server Startup Integration Test', () => {
  let serverProcess;
  let serverUrl;
  
  afterAll(() => {
    // 确保服务器被关闭
    if (serverProcess) {
      serverProcess.kill();
    }
  });
  
  describe('npm start', () => {
    it('should start server without errors', (done) => {
      // 启动服务器
      serverProcess = spawn('node', ['src/server/index.js'], {
        cwd: PROJECT_ROOT,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      let started = false;
      
      serverProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        // 等待服务器启动成功
        if (!started && stdout.includes('Server running at')) {
          started = true;
          // 从输出中提取端口
          const match = stdout.match(/http:\/\/localhost:(\d+)/);
          if (match) {
            serverUrl = `http://localhost:${match[1]}`;
            setTimeout(() => {
              done();
            }, 500);
          }
        }
      });
      
      serverProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      serverProcess.on('error', (err) => {
        done(err);
      });
      
      // 超时 15 秒
      setTimeout(() => {
        if (!started) {
          serverProcess.kill();
          done(new Error(`Server failed to start within 15s.\nStdout: ${stdout}\nStderr: ${stderr}`));
        }
      }, 15000);
    });
    
    it('should respond to HTTP requests', (done) => {
      if (!serverUrl) {
        done(new Error('Server not started'));
        return;
      }
      
      http.get(serverUrl, (res) => {
        expect(res.statusCode).toBe(200);
        done();
      }).on('error', done);
    });
    
    it('should serve static files', (done) => {
      if (!serverUrl) {
        done(new Error('Server not started'));
        return;
      }
      
      // 测试 CSS 文件
      http.get(`${serverUrl}/static/css/main.css`, (res) => {
        expect(res.statusCode).toBe(200);
        done();
      }).on('error', done);
    });
    
    it('should have working API endpoints', (done) => {
      if (!serverUrl) {
        done(new Error('Server not started'));
        return;
      }
      
      // 测试 settings API
      http.get(`${serverUrl}/api/settings`, (res) => {
        expect(res.statusCode).toBe(200);
        
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          const json = JSON.parse(data);
          expect(json.success).toBe(true);
          done();
        });
      }).on('error', done);
    });
  });
});
