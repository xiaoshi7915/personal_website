# JS 实现入门

本教程将指导您如何使用JavaScript开发MCP客户端，实现与MCP服务器的无缝交互。

## 环境准备

### 依赖安装

```bash
# 使用npm
npm install axios eventsource

# 使用yarn
yarn add axios eventsource
```

### 项目结构

```
mcp-js-client/
├── src/
│   ├── mcpClient.js       # MCP客户端核心代码
│   └── index.js           # 入口文件
├── examples/              # 示例代码
│   ├── weatherQuery.js
│   └── documentAnalysis.js
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 基础客户端实现

### 创建基本客户端类

```javascript
// mcpClient.js
const axios = require('axios');

/**
 * MCP协议客户端实现
 */
class MCPClient {
  /**
   * 初始化MCP客户端
   * @param {string} serverUrl - MCP服务器URL
   * @param {string} [apiKey] - 可选的API密钥
   */
  constructor(serverUrl, apiKey = null) {
    this.serverUrl = serverUrl;
    this.headers = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      this.headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    // 创建axios实例
    this.client = axios.create({
      baseURL: serverUrl,
      headers: this.headers,
      timeout: 10000 // 默认超时时间10秒
    });
  }
  
  /**
   * 获取服务器信息
   * @returns {Promise<Object>} 服务器信息
   */
  async getServerInfo() {
    try {
      const response = await this.client.get('/');
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  /**
   * 获取资源列表
   * @returns {Promise<Array>} 资源列表
   */
  async listResources() {
    try {
      const response = await this.client.get('/resources');
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  /**
   * 获取特定资源详情
   * @param {string} resourceName - 资源名称
   * @returns {Promise<Object>} 资源详情
   */
  async getResource(resourceName) {
    try {
      const response = await this.client.get(`/resources/${resourceName}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  /**
   * 调用工具
   * @param {string} toolName - 工具名称
   * @param {Object} params - 工具参数
   * @returns {Promise<Object>} 工具调用结果
   */
  async callTool(toolName, params) {
    try {
      const response = await this.client.post(`/tools/${toolName}`, params);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  /**
   * 发送提示词
   * @param {string} resourceName - 资源名称
   * @param {string} prompt - 提示词内容
   * @param {Array} [history] - 对话历史
   * @returns {Promise<Object>} 模型响应
   */
  async sendPrompt(resourceName, prompt, history = null) {
    const payload = {
      prompt: prompt
    };
    
    if (history) {
      payload.history = history;
    }
    
    try {
      const response = await this.client.post(
        `/resources/${resourceName}/prompt`,
        payload
      );
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }
  
  /**
   * 处理错误
   * @private
   * @param {Error} error - 错误对象
   */
  _handleError(error) {
    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response;
      console.error(`服务器错误 (${status}):`, data);
      throw new Error(`MCP服务器错误: ${status} - ${data.message || JSON.stringify(data)}`);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('无法连接到MCP服务器:', error.request);
      throw new Error('无法连接到MCP服务器，请检查URL和网络连接');
    } else {
      // 请求设置过程中发生错误
      console.error('请求错误:', error.message);
      throw error;
    }
  }
}

module.exports = MCPClient;
```

## 高级功能实现

### 添加流式响应支持

```javascript
// 添加EventSource依赖
const EventSource = require('eventsource');

/**
 * 支持流式响应的MCP客户端
 */
class StreamingMCPClient extends MCPClient {
  /**
   * 流式发送提示词
   * @param {string} resourceName - 资源名称
   * @param {string} prompt - 提示词内容
   * @param {Object} [options] - 选项
   * @param {Array} [options.history] - 对话历史
   * @param {function} [options.onMessage] - 消息回调
   * @param {function} [options.onError] - 错误回调
   * @param {function} [options.onComplete] - 完成回调
   */
  streamPrompt(resourceName, prompt, options = {}) {
    const { history = null, onMessage, onError, onComplete } = options;
    
    // 构建查询参数
    const params = new URLSearchParams({
      prompt: prompt,
      stream: true
    });
    
    if (history) {
      params.append('history', JSON.stringify(history));
    }
    
    // 构建URL
    const url = `${this.serverUrl}/resources/${resourceName}/prompt?${params}`;
    
    // 创建EventSource
    const eventSource = new EventSource(url, {
      headers: this.headers
    });
    
    let fullText = '';
    
    // 处理消息事件
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        fullText += data.text || '';
        
        if (onMessage && typeof onMessage === 'function') {
          onMessage(data.text, fullText);
        }
      } catch (error) {
        console.error('处理消息时出错:', error);
      }
    };
    
    // 处理错误事件
    eventSource.onerror = (error) => {
      eventSource.close();
      
      if (onError && typeof onError === 'function') {
        onError(error);
      }
    };
    
    // 处理完成事件
    eventSource.addEventListener('done', () => {
      eventSource.close();
      
      if (onComplete && typeof onComplete === 'function') {
        onComplete(fullText);
      }
    });
    
    // 返回关闭函数
    return {
      close: () => eventSource.close()
    };
  }
}

module.exports = {
  MCPClient,
  StreamingMCPClient
};
```

### WebSocket支持

```javascript
// websocketClient.js
const WebSocket = require('ws');

/**
 * 基于WebSocket的MCP客户端
 */
class WebSocketMCPClient {
  /**
   * 初始化WebSocket MCP客户端
   * @param {string} serverUrl - MCP服务器WebSocket URL
   * @param {string} [apiKey] - 可选的API密钥
   */
  constructor(serverUrl, apiKey = null) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.connected = false;
    this.requestId = 0;
    this.callbacks = new Map();
    
    // 事件监听器
    this.eventListeners = {
      connect: [],
      disconnect: [],
      message: []
    };
  }
  
  /**
   * 连接到服务器
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // 构建URL
        let url = this.serverUrl;
        if (this.apiKey) {
          url += (url.includes('?') ? '&' : '?') + `api_key=${this.apiKey}`;
        }
        
        this.ws = new WebSocket(url);
        
        // 连接成功
        this.ws.on('open', () => {
          this.connected = true;
          this._triggerEvent('connect');
          resolve();
        });
        
        // 接收消息
        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            this._handleMessage(message);
          } catch (error) {
            console.error('解析消息时出错:', error);
          }
        });
        
        // 连接关闭
        this.ws.on('close', () => {
          this.connected = false;
          this._triggerEvent('disconnect');
        });
        
        // 连接错误
        this.ws.on('error', (error) => {
          console.error('WebSocket错误:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * 调用工具
   * @param {string} toolName - 工具名称
   * @param {Object} params - 工具参数
   * @returns {Promise<Object>} 工具调用结果
   */
  callTool(toolName, params) {
    return this._sendRequest('tool', {
      name: toolName,
      params: params
    });
  }
  
  /**
   * 发送提示词
   * @param {string} resourceName - 资源名称
   * @param {string} prompt - 提示词内容
   * @param {Array} [history] - 对话历史
   * @returns {Promise<Object>} 模型响应
   */
  sendPrompt(resourceName, prompt, history = null) {
    const payload = {
      resource: resourceName,
      prompt: prompt
    };
    
    if (history) {
      payload.history = history;
    }
    
    return this._sendRequest('prompt', payload);
  }
  
  /**
   * 发送请求
   * @private
   * @param {string} type - 请求类型
   * @param {Object} payload - 请求负载
   * @returns {Promise<Object>} 响应
   */
  _sendRequest(type, payload) {
    if (!this.connected) {
      return Promise.reject(new Error('未连接到MCP服务器'));
    }
    
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      
      // 注册回调
      this.callbacks.set(id, { resolve, reject });
      
      // 发送消息
      this.ws.send(JSON.stringify({
        id: id,
        type: type,
        ...payload
      }));
      
      // 设置超时
      setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error('请求超时'));
        }
      }, 30000); // 默认30秒超时
    });
  }
  
  /**
   * 处理接收的消息
   * @private
   * @param {Object} message - 接收的消息
   */
  _handleMessage(message) {
    // 触发消息事件
    this._triggerEvent('message', message);
    
    // 处理响应
    if (message.id && this.callbacks.has(message.id)) {
      const { resolve, reject } = this.callbacks.get(message.id);
      this.callbacks.delete(message.id);
      
      if (message.error) {
        reject(new Error(message.error));
      } else {
        resolve(message.result || message);
      }
    }
  }
  
  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {function} listener - 监听器函数
   */
  on(event, listener) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(listener);
    }
  }
  
  /**
   * 触发事件
   * @private
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  _triggerEvent(event, data) {
    if (this.eventListeners[event]) {
      for (const listener of this.eventListeners[event]) {
        try {
          listener(data);
        } catch (error) {
          console.error(`事件监听器错误 (${event}):`, error);
        }
      }
    }
  }
  
  /**
   * 关闭连接
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
    }
  }
}

module.exports = WebSocketMCPClient;
```

## 使用示例

### 基础使用示例

```javascript
// examples/basic.js
const { MCPClient } = require('../src/mcpClient');

// 创建MCP客户端
const client = new MCPClient('http://localhost:8000', 'your_api_key');

// 使用IIFE包装异步代码
(async () => {
  try {
    // 获取服务器信息
    const serverInfo = await client.getServerInfo();
    console.log('服务器信息:', serverInfo);
    
    // 获取资源列表
    const resources = await client.listResources();
    console.log('可用资源:', resources);
    
    // 调用天气查询工具
    const weatherResult = await client.callTool('get_weather', {
      city: '上海',
      days: 3
    });
    console.log('天气预报:', weatherResult);
    
    // 发送提示词到对话资源
    const response = await client.sendPrompt('chat', '介绍一下MCP协议的作用');
    console.log('AI回复:', response.text);
    
  } catch (error) {
    console.error('错误:', error.message);
  }
})();
```

### 流式响应示例

```javascript
// examples/streaming.js
const { StreamingMCPClient } = require('../src/mcpClient');

// 创建流式MCP客户端
const client = new StreamingMCPClient('http://localhost:8000', 'your_api_key');

// 流式获取响应
const streamHandler = client.streamPrompt('chat', '请详细解释MCP协议的工作原理', {
  onMessage: (chunk, fullText) => {
    // 处理每一个响应块
    process.stdout.write(chunk);
  },
  onError: (error) => {
    console.error('流式响应错误:', error);
  },
  onComplete: (fullText) => {
    console.log('\n--- 响应完成 ---');
    console.log('完整响应长度:', fullText.length);
  }
});

// 可以在需要时关闭流
setTimeout(() => {
  streamHandler.close();
  console.log('手动关闭了流');
}, 30000); // 30秒后关闭
```

### WebSocket示例

```javascript
// examples/websocket.js
const WebSocketMCPClient = require('../src/websocketClient');

// 创建WebSocket客户端
const client = new WebSocketMCPClient('ws://localhost:8000/ws', 'your_api_key');

// 连接事件处理
client.on('connect', () => {
  console.log('已连接到MCP服务器');
  
  // 发送提示词
  client.sendPrompt('chat', '什么是MCP协议？')
    .then(response => {
      console.log('AI回复:', response.text);
      
      // 调用工具
      return client.callTool('translate', {
        text: response.text,
        target_language: 'en'
      });
    })
    .then(result => {
      console.log('翻译结果:', result.translated_text);
      
      // 关闭连接
      client.disconnect();
    })
    .catch(error => {
      console.error('操作失败:', error.message);
      client.disconnect();
    });
});

client.on('disconnect', () => {
  console.log('已断开连接');
});

// 连接到服务器
client.connect()
  .catch(error => {
    console.error('连接失败:', error.message);
  });
```

## 浏览器兼容性

对于浏览器环境，需要进行一些调整：

```javascript
// 浏览器环境下的MCP客户端
class BrowserMCPClient {
  constructor(serverUrl, apiKey = null) {
    this.serverUrl = serverUrl;
    this.headers = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      this.headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }
  
  // 使用fetch API替代axios
  async getServerInfo() {
    try {
      const response = await fetch(`${this.serverUrl}/`, {
        method: 'GET',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取服务器信息失败:', error);
      throw error;
    }
  }
  
  // 实现其他方法...
  
  // 流式响应使用浏览器原生EventSource
  streamPrompt(resourceName, prompt, options = {}) {
    const { history = null, onMessage, onError, onComplete } = options;
    
    // 构建查询参数
    const params = new URLSearchParams({
      prompt: prompt,
      stream: true
    });
    
    if (history) {
      params.append('history', JSON.stringify(history));
    }
    
    // 构建URL
    const url = `${this.serverUrl}/resources/${resourceName}/prompt?${params}`;
    
    // 创建EventSource
    const eventSource = new EventSource(url);
    
    let fullText = '';
    
    // 处理消息事件
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        fullText += data.text || '';
        
        if (onMessage && typeof onMessage === 'function') {
          onMessage(data.text, fullText);
        }
      } catch (error) {
        console.error('处理消息时出错:', error);
      }
    };
    
    // 处理错误事件
    eventSource.onerror = (error) => {
      eventSource.close();
      
      if (onError && typeof onError === 'function') {
        onError(error);
      }
    };
    
    // 处理完成事件
    eventSource.addEventListener('done', () => {
      eventSource.close();
      
      if (onComplete && typeof onComplete === 'function') {
        onComplete(fullText);
      }
    });
    
    // 返回关闭函数
    return {
      close: () => eventSource.close()
    };
  }
}
```

## 安全最佳实践

在开发MCP客户端时，请遵循以下安全最佳实践：

1. **API密钥保护**：
   - 不要在客户端代码中硬编码API密钥
   - 使用环境变量或安全的密钥管理服务
   - 在浏览器环境中，考虑使用代理服务器

2. **HTTPS连接**：
   - 始终使用HTTPS连接到MCP服务器
   - 验证服务器证书以防止中间人攻击

3. **输入验证**：
   - 验证所有用户输入，防止注入攻击
   - 对敏感数据进行过滤和清理

4. **错误处理**：
   - 实现适当的错误处理
   - 不向用户暴露敏感的错误详情

5. **请求限流**：
   - 实现重试策略，但避免过度请求
   - 添加指数退避算法

## 故障排查

### 常见问题与解决方案

1. **连接问题**：
   - 检查URL是否正确（http vs https, 端口号等）
   - 验证网络连接和防火墙设置

2. **认证错误**：
   - 确认API密钥是否有效
   - 检查授权头格式是否正确

3. **请求超时**：
   - 增加超时时间
   - 检查服务器负载

4. **跨域问题**（浏览器环境）：
   - 确保服务器配置了正确的CORS头
   - 考虑使用代理服务器

### 调试技巧

```javascript
// 启用请求/响应日志
const debugClient = new MCPClient('http://localhost:8000', 'your_api_key');

// 拦截请求
const originalRequest = debugClient.client.request;
debugClient.client.request = function(...args) {
  console.log('请求参数:', ...args);
  return originalRequest.apply(this, args).then(response => {
    console.log('响应数据:', response.data);
    return response;
  });
};
```

## 总结

通过本教程，您已经学习了如何使用JavaScript开发MCP客户端，包括基础功能、流式响应、WebSocket通信等高级特性。您可以根据自己的需求，进一步扩展和优化客户端功能。

如有任何问题，请参考MCP协议规范或联系我们的技术支持团队。 