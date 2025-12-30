---
sidebar_position: 8
title: 从零到一：构建A2A多代理系统
description: 一个完整的教程，从环境搭建到部署上线的A2A多代理系统开发全流程
---

# 从零到一：构建A2A多代理系统

本教程将带您从零开始，使用A2A协议构建一个完整的多代理协作系统。我们将创建一个**智能任务处理系统**，多个专业代理协作完成复杂任务。

## 项目概述

### 功能特性

- ✅ 多代理注册和管理
- ✅ 代理间消息通信
- ✅ 任务路由和分发
- ✅ 代理协作
- ✅ 状态管理
- ✅ Web界面

### 技术栈

- **协议**：A2A
- **后端**：Node.js + Express / Python + FastAPI
- **消息队列**：Redis / RabbitMQ
- **数据库**：PostgreSQL

## 第一步：环境准备

### 1.1 创建项目目录

```bash
mkdir a2a-multi-agent-system
cd a2a-multi-agent-system
```

### 1.2 安装依赖

创建 `package.json`：

```json
{
  "name": "a2a-multi-agent-system",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "redis": "^4.6.0",
    "pg": "^8.11.0",
    "ws": "^8.14.0"
  }
}
```

## 第二步：实现核心功能

### 2.1 代理管理器 (`src/agent-manager.js`)

```javascript
/** 代理管理器 */
class AgentManager {
  constructor() {
    this.agents = new Map();
    this.messageBus = null;
  }
  
  registerAgent(agent) {
    /** 注册代理 */
    this.agents.set(agent.id, agent);
    console.log(`代理 ${agent.id} 已注册`);
  }
  
  getAgent(agentId) {
    /** 获取代理 */
    return this.agents.get(agentId);
  }
  
  findAgentsByCapability(capability) {
    /** 根据能力查找代理 */
    return Array.from(this.agents.values()).filter(
      agent => agent.capabilities.includes(capability)
    );
  }
}
```

### 2.2 消息总线 (`src/message-bus.js`)

```javascript
/** 消息总线 */
class MessageBus {
  constructor() {
    this.subscribers = new Map();
  }
  
  subscribe(agentId, handler) {
    /** 订阅消息 */
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, []);
    }
    this.subscribers.get(agentId).push(handler);
  }
  
  publish(message) {
    /** 发布消息 */
    const targetId = message.target;
    if (this.subscribers.has(targetId)) {
      const handlers = this.subscribers.get(targetId);
      handlers.forEach(handler => handler(message));
    }
  }
}
```

### 2.3 代理实现 (`src/agents/math-agent.js`)

```javascript
/** 数学代理 */
class MathAgent {
  constructor(id) {
    this.id = id;
    this.capabilities = ['math', 'calculation'];
  }
  
  async handleMessage(message) {
    /** 处理消息 */
    const { type, content } = message;
    
    if (type === 'calculate') {
      const result = this.calculate(content.expression);
      return {
        type: 'result',
        content: { result },
        from: this.id
      };
    }
  }
  
  calculate(expression) {
    /** 计算表达式 */
    try {
      return eval(expression);
    } catch (e) {
      return `错误: ${e.message}`;
    }
  }
}
```

### 2.4 API服务 (`src/api.js`)

```javascript
/** Express API服务 */
const express = require('express');
const { AgentManager } = require('./agent-manager');
const { MessageBus } = require('./message-bus');

const app = express();
app.use(express.json());

const agentManager = new AgentManager();
const messageBus = new MessageBus();

// 注册代理
app.post('/agents/register', (req, res) => {
  const agent = req.body;
  agentManager.registerAgent(agent);
  messageBus.subscribe(agent.id, agent.handleMessage.bind(agent));
  res.json({ message: '代理注册成功' });
});

// 发送消息
app.post('/messages/send', async (req, res) => {
  const { target, type, content } = req.body;
  
  const message = {
    target,
    type,
    content,
    timestamp: Date.now()
  };
  
  messageBus.publish(message);
  res.json({ message: '消息已发送' });
});

app.listen(3000, () => {
  console.log('A2A服务运行在端口3000');
});
```

## 第三步：运行和测试

### 3.1 启动服务

```bash
node src/api.js
```

### 3.2 测试代理通信

```bash
# 注册数学代理
curl -X POST "http://localhost:3000/agents/register" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "math-agent-1",
    "capabilities": ["math", "calculation"]
  }'

# 发送计算请求
curl -X POST "http://localhost:3000/messages/send" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "math-agent-1",
    "type": "calculate",
    "content": {"expression": "2 + 2"}
  }'
```

## 总结

本教程展示了如何构建A2A多代理系统：

1. 代理注册和管理
2. 消息总线实现
3. 代理间通信
4. API服务

A2A协议让多个专业代理能够协作完成复杂任务，提升系统的整体能力。

