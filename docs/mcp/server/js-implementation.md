---
sidebar_position: 1
---

# JS实现入门

本指南将帮助您从零开始搭建基于JavaScript的MCP服务器，并实现基本的自定义函数。

## 环境准备

在开始之前，请确保您的系统满足以下要求：

- Node.js（v14.0或更高版本）
- npm或yarn包管理器
- 基本的JavaScript/TypeScript知识

## 创建项目

首先，创建一个新的项目目录并初始化npm：

```bash
mkdir mcp-js-server
cd mcp-js-server
npm init -y
```

安装MCP服务器依赖：

```bash
npm install @modelcontextprotocol/server express cors
npm install typescript @types/node @types/express --save-dev
```

## 创建TypeScript配置

创建`tsconfig.json`文件：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 目录结构

为项目创建以下目录结构：

```
mcp-js-server/
├── src/
│   ├── index.ts         # 主入口文件
│   ├── tools/           # 自定义工具定义
│   │   └── echo.ts      # 示例工具
│   ├── resources/       # 资源定义
│   │   └── sample.ts    # 示例资源
│   └── prompts/         # 提示模板定义
│       └── help.ts      # 示例提示模板
├── tsconfig.json
└── package.json
```

## 实现一个基本的MCP服务器

### 1. 创建工具函数

创建`src/tools/echo.ts`文件：

```typescript
// src/tools/echo.ts
import { ToolFunction } from '@modelcontextprotocol/server';

export const echoTool: ToolFunction = {
  name: 'echo',
  description: '回显传入的消息',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: '要回显的消息'
      }
    },
    required: ['message']
  },
  handler: async ({ message }) => {
    return {
      content: message
    };
  }
};
```

### 2. 创建资源

创建`src/resources/sample.ts`文件：

```typescript
// src/resources/sample.ts
import { Resource } from '@modelcontextprotocol/server';

export const sampleResource: Resource = {
  path: '/sample',
  description: '示例资源',
  handler: async () => {
    return {
      name: 'MCP示例资源',
      description: '这是一个简单的MCP资源示例',
      items: [
        { id: 1, name: '示例项目1' },
        { id: 2, name: '示例项目2' },
        { id: 3, name: '示例项目3' }
      ],
      timestamp: new Date().toISOString()
    };
  }
};
```

### 3. 创建提示模板

创建`src/prompts/help.ts`文件：

```typescript
// src/prompts/help.ts
import { Prompt } from '@modelcontextprotocol/server';

export const helpPrompt: Prompt = {
  name: 'help',
  description: '提供使用本服务的帮助信息',
  template: `
    您好！我是一个基于MCP的辅助服务。您可以通过以下方式与我交互：

    1. 发送消息：请输入 "echo: [您的消息]" 来测试回显功能。
    2. 查看资源：请输入 "查看示例资源" 来获取样本数据。

    请问有什么我可以帮助您的？
  `,
};
```

### 4. 创建服务器入口文件

创建`src/index.ts`文件：

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/server';
import { echoTool } from './tools/echo';
import { sampleResource } from './resources/sample';
import { helpPrompt } from './prompts/help';

// 创建一个Express应用
const app = express();
app.use(cors());
app.use(express.json());

// 创建MCP服务器实例
const mcpServer = new Server({
  name: 'demo-server',
  description: 'MCP服务器演示',
  version: '1.0.0',
});

// 注册工具
mcpServer.registerTool(echoTool);

// 注册资源
mcpServer.registerResource(sampleResource);

// 注册提示模板
mcpServer.registerPrompt(helpPrompt);

// 设置MCP请求处理路由
app.post('/mcp', async (req, res) => {
  try {
    const response = await mcpServer.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    console.error('处理MCP请求时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP服务器运行在端口 ${PORT}`);
});
```

## 构建和运行

添加构建和运行脚本到`package.json`：

```json
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js",
  "dev": "ts-node src/index.ts"
}
```

安装ts-node用于开发：

```bash
npm install ts-node --save-dev
```

构建并启动服务器：

```bash
npm run build
npm start
```

或者在开发模式下运行：

```bash
npm run dev
```

## 测试您的MCP服务器

使用curl或Postman测试服务器：

```bash
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{
  "type": "tool_call",
  "tool_name": "echo",
  "parameters": {
    "message": "Hello, MCP!"
  }
}'
```

对于资源请求：

```bash
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{
  "type": "resource_request",
  "path": "/sample"
}'
```

## 使用Claude Desktop集成

要在Claude Desktop中使用您的服务器，请在`claude_desktop_config.json`中添加以下配置：

```json
{
  "mcpServers": {
    "demoServer": {
      "command": "node",
      "args": ["path/to/your/dist/index.js"],
      "env": {}
    }
  }
}
```

## 扩展您的服务器

现在您已经创建了一个基本的MCP服务器，您可以通过以下方式扩展它：

1. 添加更多工具函数，例如：
   - 数据处理工具
   - API集成工具
   - 文件操作工具

2. 添加更多资源，例如：
   - 用户数据
   - 配置信息
   - 静态内容

3. 添加更多提示模板，帮助用户更有效地使用您的服务器功能

## 错误处理和日志

为了提高服务器的可靠性，您可以添加更完善的错误处理和日志记录：

```typescript
// 添加结构化错误处理
app.post('/mcp', async (req, res) => {
  try {
    if (!req.body || !req.body.type) {
      return res.status(400).json({ error: '无效的请求格式' });
    }
    
    const response = await mcpServer.handleRequest(req.body);
    console.log(`处理了${req.body.type}请求`);
    res.json(response);
  } catch (error) {
    console.error('处理MCP请求时出错:', error);
    
    // 返回友好的错误信息
    res.status(500).json({ 
      error: '服务器处理请求时出错',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

## 下一步

恭喜您！您已经成功创建了一个基于JavaScript的MCP服务器。现在您可以：

1. [了解MCP服务器架构](/docs/mcp/server/architecture)
2. [查看更复杂的JavaScript应用案例](/docs/mcp/applications/javascript)
3. [学习如何部署MCP服务器](/docs/mcp/server/deployment)

通过完成这些步骤，您已经开始了MCP服务器开发之旅。在后续的章节中，我们将深入探讨更多高级主题和最佳实践。 