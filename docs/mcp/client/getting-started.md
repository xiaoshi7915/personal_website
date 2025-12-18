---
sidebar_position: 1
---

# 入门指南

本指南将帮助您从零开始构建和集成MCP客户端，使您的应用能够与AI模型和MCP服务器无缝交互。

## 环境准备

在开始之前，请确保您的系统满足以下要求：

- Node.js（v14.0或更高版本）
- npm或yarn包管理器
- 基本的JavaScript/TypeScript知识
- 一个可访问的MCP服务器（可以是[上一章](/docs/mcp/server/getting-started)中创建的服务器）

## 安装MCP客户端

首先，创建一个新的项目目录并初始化npm：

```bash
mkdir mcp-client-demo
cd mcp-client-demo
npm init -y
```

安装MCP客户端依赖：

```bash
npm install @anthropic/mcp-client axios
npm install typescript @types/node --save-dev
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
mcp-client-demo/
├── src/
│   ├── index.ts        # 主入口文件
│   └── config.ts       # 配置文件
├── tsconfig.json
└── package.json
```

## 创建配置文件

创建`src/config.ts`文件用于存储配置信息：

```typescript
// src/config.ts
export const config = {
  // Anthropic API密钥（用于访问Claude模型）
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'YOUR_ANTHROPIC_API_KEY',
  
  // MCP服务器URL
  mcpServerUrl: process.env.MCP_SERVER_URL || 'http://localhost:3000/mcp',
  
  // 模型名称
  modelName: process.env.MODEL_NAME || 'claude-3-opus-20250229'
};
```

## 创建客户端入口文件

创建`src/index.ts`文件：

```typescript
// src/index.ts
import { MCPClient } from '@anthropic/mcp-client';
import axios from 'axios';
import { config } from './config';

// 创建MCP客户端
const mcpClient = new MCPClient({
  // MCP服务器的请求处理函数
  functionHandler: async (functionCall) => {
    try {
      // 发送函数调用请求到MCP服务器
      const response = await axios.post(config.mcpServerUrl, {
        function_call: functionCall
      });
      
      // 返回服务器响应
      return response.data;
    } catch (error) {
      console.error('Error calling MCP function:', error);
      throw error;
    }
  }
});

// 创建与Claude模型交互的函数
async function chatWithClaude(userMessage: string) {
  try {
    // 创建请求头
    const headers = {
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    };
    
    // 准备请求体
    const requestBody = {
      model: config.modelName,
      max_tokens: 1000,
      messages: [
        { role: 'user', content: userMessage }
      ],
      tools: mcpClient.getToolsConfig() // 获取MCP工具配置
    };
    
    // 发送请求到Anthropic API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      requestBody,
      { headers }
    );
    
    // 处理响应
    const message = response.data.content[0];
    
    // 如果响应包含工具调用
    if (message.type === 'tool_use') {
      // 使用MCP客户端处理工具调用
      const toolResponse = await mcpClient.handleToolUse(message);
      
      // 将工具响应发送回模型
      return await completeToolUse(response.data.id, toolResponse);
    }
    
    // 如果是普通文本响应
    return message.text;
  } catch (error) {
    console.error('Error chatting with Claude:', error);
    throw error;
  }
}

// 处理工具调用结果并完成交互
async function completeToolUse(messageId: string, toolResponse: any) {
  try {
    const headers = {
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    };
    
    // 发送工具响应回模型
    const response = await axios.post(
      `https://api.anthropic.com/v1/messages/${messageId}/tool_responses`,
      {
        tool_responses: [toolResponse]
      },
      { headers }
    );
    
    // 返回更新后的响应
    return response.data.content[0].text;
  } catch (error) {
    console.error('Error completing tool use:', error);
    throw error;
  }
}

// 示例使用
async function main() {
  try {
    // 向Claude发送一条包含MCP函数调用的消息
    const response = await chatWithClaude('请使用echo函数回显消息"Hello, MCP!"');
    console.log('Claude响应:', response);
  } catch (error) {
    console.error('主程序错误:', error);
  }
}

// 运行示例
main();
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

设置必要的环境变量并运行：

```bash
export ANTHROPIC_API_KEY=your_api_key_here
npm run dev
```

## 集成到现有应用

要将MCP客户端集成到现有的Web应用或服务中，您需要：

1. 设置MCP客户端，如上所示
2. 创建API端点来处理用户请求
3. 使用客户端与Claude模型和MCP服务器交互
4. 将结果返回给用户

## 下一步

现在您已经成功创建了一个基本的MCP客户端，您可以：

1. [了解更高级的客户端集成技巧](/docs/mcp/client/integration)
2. [探索MCP API的更多用法](/docs/mcp/client/api-usage)
3. [学习客户端开发的最佳实践](/docs/mcp/client/best-practices)

在接下来的章节中，我们将深入探讨MCP客户端开发的更多方面，包括错误处理、流式处理和高级集成模式。 