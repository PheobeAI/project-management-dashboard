/**
 * 服务器启动测试
 * 
 * 运行: node tests/basic/test-startup.js
 * 
 * 启动服务器，发送 HTTP 请求验证，然后关闭
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');

async function waitForServer(stdout, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Server failed to start within ${timeout}ms`));
    }, timeout);
    
    const check = (data) => {
      const output = data.toString();
      if (output.includes('Server running at') || output.includes('🚀')) {
        clearTimeout(timer);
        stdout.removeListener('data', check);
        
        // 提取端口
        const match = output.match(/http:\/\/localhost:(\d+)/);
        resolve(match ? match[1] : '3000');
      }
    };
    
    stdout.on('data', check);
  });
}

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== 服务器启动测试 ===\n');
  
  const server = spawn('node', ['src/server/index.js'], {
    cwd: PROJECT_ROOT,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let port;
  let hasError = false;
  
  // 收集输出
  const stdout = [];
  const stderr = [];
  
  server.stdout.on('data', (data) => {
    const str = data.toString();
    stdout.push(str);
    process.stdout.write(str);
  });
  
  server.stderr.on('data', (data) => {
    const str = data.toString();
    stderr.push(str);
    process.stderr.write(str);
  });
  
  try {
    // 1. 等待服务器启动
    console.log('\n--- 测试 1: 启动服务器 ---');
    port = await waitForServer(server.stdout);
    console.log(`✓ 服务器启动成功，端口: ${port}\n`);
    
    const baseUrl = `http://localhost:${port}`;
    
    // 2. 测试 HTTP 响应
    console.log('--- 测试 2: HTTP 响应 ---');
    try {
      const res = await makeRequest(baseUrl);
      if (res.status === 200) {
        console.log('✓ 首页返回 200\n');
      } else {
        console.log(`✗ 首页返回 ${res.status}\n`);
        hasError = true;
      }
    } catch (e) {
      console.log(`✗ 请求失败: ${e.message}\n`);
      hasError = true;
    }
    
    // 3. 测试静态文件
    console.log('--- 测试 3: 静态文件 ---');
    try {
      const res = await makeRequest(`${baseUrl}/static/css/main.css`);
      if (res.status === 200) {
        console.log('✓ CSS 文件可访问\n');
      } else {
        console.log(`✗ CSS 返回 ${res.status}\n`);
        hasError = true;
      }
    } catch (e) {
      console.log(`✗ CSS 请求失败: ${e.message}\n`);
      hasError = true;
    }
    
    // 4. 测试 API
    console.log('--- 测试 4: API 端点 ---');
    try {
      const res = await makeRequest(`${baseUrl}/api/settings`);
      if (res.status === 200) {
        const json = JSON.parse(res.body);
        if (json.success) {
          console.log('✓ API /settings 正常\n');
        } else {
          console.log('✗ API /settings 返回 success: false\n');
          hasError = true;
        }
      } else {
        console.log(`✗ API 返回 ${res.status}\n`);
        hasError = true;
      }
    } catch (e) {
      console.log(`✗ API 请求失败: ${e.message}\n`);
      hasError = true;
    }
    
    // 5. 测试 projects API
    console.log('--- 测试 5: Projects API ---');
    try {
      const res = await makeRequest(`${baseUrl}/api/projects`);
      if (res.status === 200) {
        const json = JSON.parse(res.body);
        if (json.success) {
          console.log(`✓ API /projects 正常，返回 ${json.data.length} 个项目\n`);
        } else {
          console.log('✗ API /projects 返回 success: false\n');
          hasError = true;
        }
      } else {
        console.log(`✗ API 返回 ${res.status}\n`);
        hasError = true;
      }
    } catch (e) {
      console.log(`✗ API 请求失败: ${e.message}\n`);
      hasError = true;
    }
    
  } catch (err) {
    console.error('\n✗ 服务器启动失败:', err.message);
    console.error('Stdout:', stdout.join(''));
    console.error('Stderr:', stderr.join(''));
    hasError = true;
  } finally {
    // 关闭服务器
    console.log('--- 关闭服务器 ---');
    server.kill();
    console.log('✓ 服务器已关闭\n');
  }
  
  // 输出结果
  console.log('=== 测试结果 ===');
  if (hasError) {
    console.log('❌ 部分测试失败\n');
    process.exit(1);
  } else {
    console.log('✅ 所有测试通过\n');
    process.exit(0);
  }
}

runTests();
