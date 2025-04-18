---
sidebar_position: 1
---

# MCP服务器入门指南

本指南将帮助您从零开始搭建MCP服务器，并实现基本的自定义函数。

## 环境准备

在开始之前，请确保您的系统满足以下要求：

- Node.js（v14.0或更高版本）
- npm或yarn包管理器
- 基本的JavaScript/TypeScript知识

## 安装MCP服务器

首先，创建一个新的项目目录并初始化npm：

```bash
mkdir mcp-server-demo
cd mcp-server-demo
npm init -y
```

安装MCP服务器依赖：

```bash
npm install @anthropic/mcp-server express cors
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
mcp-server-demo/
├── src/
│   ├── index.ts         # 主入口文件
│   ├── functions/       # 自定义函数定义
│   │   └── echo.ts      # 示例函数
│   └── schemas/         # 函数参数模式定义
│       └── echo.ts      # 示例函数参数模式
├── tsconfig.json
└── package.json
```

## 定义函数参数模式

创建`src/schemas/echo.ts`文件：

```typescript
// src/schemas/echo.ts
export const EchoSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "Message to echo"
    }
  },
  required: ["message"],
  additionalProperties: false
};
```

## 实现自定义函数

创建`src/functions/echo.ts`文件：

```typescript
// src/functions/echo.ts
export async function echo(params: { message: string }) {
  // 简单的回显函数
  return {
    content: params.message
  };
}
```

## 创建服务器入口文件

创建`src/index.ts`文件：

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import { MCPServer } from '@anthropic/mcp-server';
import { echo } from './functions/echo';
import { EchoSchema } from './schemas/echo';

const app = express();
app.use(cors());
app.use(express.json());

// 创建MCP服务器实例
const mcpServer = new MCPServer({
  // 定义服务器命名空间
  namespace: 'mcp_demo',
  // 注册函数
  functions: [
    {
      name: 'echo',
      description: 'Echoes back the input',
      parameters: EchoSchema,
      handler: echo
    }
  ]
});

// 创建MCP请求处理路由
app.post('/mcp', async (req, res) => {
  try {
    const response = await mcpServer.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
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

## 测试您的MCP服务器

使用curl或Postman测试服务器：

```bash
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{
  "function_call": {
    "name": "mcp_demo_echo",
    "parameters": {
      "message": "Hello, MCP!"
    }
  }
}'
```

如果一切正常，您应该收到包含原始消息的响应。

## 下一步

现在您已经成功创建了一个基本的MCP服务器，下一步您可以：

1. [了解MCP服务器架构](/docs/mcp/server/architecture)
2. [学习如何实现更复杂的函数](/docs/mcp/server/function-implementation)
3. [了解如何部署MCP服务器](/docs/mcp/server/deployment)

通过完成这些步骤，您已经开始了MCP服务器开发之旅。在后续的章节中，我们将深入探讨更多高级主题和最佳实践。 