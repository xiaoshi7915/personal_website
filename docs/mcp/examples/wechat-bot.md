---
sidebar_position: 1
---

# 基于MCP的微信机器人应用案例

本文档介绍如何使用MCP协议构建一个功能丰富的微信机器人应用。

## 项目概述

这是一个基于Node.js和Wechaty框架构建的微信机器人，通过MCP协议实现以下功能：

- 自动回复消息
- 天气信息查询
- 新闻摘要获取
- 设置提醒和闹钟
- 图片生成

## 环境准备

### 技术栈

- Node.js (>= 14.0.0)
- Wechaty (微信机器人框架)
- MCP-Node (Node.js版MCP客户端和服务器)
- Express (Web服务器)
- Axios (HTTP请求)
- MongoDB (可选，用于数据持久化)

### 安装依赖

```bash
mkdir wechat-mcp-bot
cd wechat-mcp-bot
npm init -y
npm install wechaty @wechaty/puppet-wechat mcp-node express axios dotenv
```

## 项目结构

```
wechat-mcp-bot/
├── .env                    # 环境变量配置
├── index.js                # 主入口文件
├── bot.js                  # 微信机器人核心逻辑
├── mcp/
│   ├── server.js           # MCP服务器定义
│   └── tools/              # MCP工具集
│       ├── weather.js      # 天气查询工具
│       ├── news.js         # 新闻获取工具
│       ├── reminder.js     # 提醒工具
│       └── imageGen.js     # 图片生成工具
└── package.json
```

## 实现步骤

### 步骤1：配置环境变量

创建`.env`文件：

```
WEATHER_API_KEY=your_weather_api_key
NEWS_API_KEY=your_news_api_key
OPENAI_API_KEY=your_openai_api_key
```

### 步骤2：创建MCP服务器

创建`mcp/server.js`文件：

```javascript
const { MCPServer } = require('mcp-node');
const { getWeather } = require('./tools/weather');
const { getNews } = require('./tools/news');
const { setReminder, listReminders } = require('./tools/reminder');
const { generateImage } = require('./tools/imageGen');

// 创建MCP服务器实例
const server = new MCPServer({
  id: "wechat-assistant",
  description: "微信助手机器人",
  version: "1.0.0"
});

// 注册工具
server.registerTool({
  name: "getWeather",
  description: "获取指定城市的天气信息",
  parameters: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "城市名称"
      }
    },
    required: ["city"]
  },
  handler: getWeather
});

server.registerTool({
  name: "getNews",
  description: "获取最新新闻摘要",
  parameters: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "新闻类别",
        enum: ["general", "business", "technology", "sports", "entertainment"]
      },
      count: {
        type: "number",
        description: "新闻条数",
        default: 5
      }
    },
    required: ["category"]
  },
  handler: getNews
});

server.registerTool({
  name: "setReminder",
  description: "设置提醒事项",
  parameters: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "用户ID"
      },
      content: {
        type: "string",
        description: "提醒内容"
      },
      time: {
        type: "string",
        description: "提醒时间，ISO格式"
      }
    },
    required: ["userId", "content", "time"]
  },
  handler: setReminder
});

server.registerTool({
  name: "listReminders",
  description: "列出用户的所有提醒",
  parameters: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "用户ID"
      }
    },
    required: ["userId"]
  },
  handler: listReminders
});

server.registerTool({
  name: "generateImage",
  description: "生成图片",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "图片生成提示词"
      }
    },
    required: ["prompt"]
  },
  handler: generateImage
});

// 注册用户提示词
server.registerUserPrompt({
  id: "wechat-chat",
  description: "与微信用户聊天",
  prompt: `你是一个有用的微信助手，能够提供天气信息、新闻摘要、设置提醒和生成图片。
请根据用户的需求，使用适当的工具来回答问题。
如果用户询问天气，使用getWeather工具；
如果用户询问新闻，使用getNews工具；
如果用户要设置提醒，使用setReminder工具；
如果用户查询提醒列表，使用listReminders工具；
如果用户要生成图片，使用generateImage工具。
回复应简洁友好。`
});

module.exports = server;
```

### 步骤3：实现MCP工具

创建`mcp/tools/weather.js`：

```javascript
const axios = require('axios');
require('dotenv').config();

async function getWeather({ city }) {
  try {
    const response = await axios.get(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}`
    );
    
    const data = response.data;
    return {
      location: data.location.name,
      country: data.location.country,
      temperature: data.current.temp_c,
      condition: data.current.condition.text,
      humidity: data.current.humidity,
      wind: data.current.wind_kph
    };
  } catch (error) {
    throw new Error(`获取天气信息失败: ${error.message}`);
  }
}

module.exports = { getWeather };
```

创建`mcp/tools/news.js`：

```javascript
const axios = require('axios');
require('dotenv').config();

async function getNews({ category, count = 5 }) {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=${category}&pageSize=${count}&apiKey=${process.env.NEWS_API_KEY}`
    );
    
    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source.name
    }));
  } catch (error) {
    throw new Error(`获取新闻失败: ${error.message}`);
  }
}

module.exports = { getNews };
```

创建`mcp/tools/reminder.js`：

```javascript
// 简单的内存存储
const reminders = {};

async function setReminder({ userId, content, time }) {
  if (!reminders[userId]) {
    reminders[userId] = [];
  }
  
  const reminder = {
    id: Date.now().toString(),
    content,
    time: new Date(time),
    created: new Date()
  };
  
  reminders[userId].push(reminder);
  
  return {
    success: true,
    message: "提醒设置成功",
    reminder
  };
}

async function listReminders({ userId }) {
  if (!reminders[userId] || reminders[userId].length === 0) {
    return {
      count: 0,
      reminders: []
    };
  }
  
  return {
    count: reminders[userId].length,
    reminders: reminders[userId].map(r => ({
      id: r.id,
      content: r.content,
      time: r.time.toISOString()
    }))
  };
}

module.exports = { setReminder, listReminders };
```

创建`mcp/tools/imageGen.js`：

```javascript
const axios = require('axios');
require('dotenv').config();

async function generateImage({ prompt }) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        prompt,
        n: 1,
        size: "512x512"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    
    return {
      success: true,
      imageUrl: response.data.data[0].url
    };
  } catch (error) {
    throw new Error(`图片生成失败: ${error.message}`);
  }
}

module.exports = { generateImage };
```

### 步骤4：实现微信机器人逻辑

创建`bot.js`文件：

```javascript
const { Wechaty } = require('wechaty');
const { MCPClient } = require('mcp-node');
const mcpServer = require('./mcp/server');

class WeChatBot {
  constructor() {
    this.bot = new Wechaty({
      name: 'wechat-mcp-bot'
    });
    
    // 创建MCP客户端实例
    this.mcpClient = new MCPClient({
      serverUrl: 'http://localhost:3000/mcp'
    });
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.bot.on('scan', (qrcode, status) => {
      console.log(`扫描二维码登录: ${status}`);
      console.log(`https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`);
    });
    
    this.bot.on('login', user => {
      console.log(`用户 ${user} 已登录`);
    });
    
    this.bot.on('message', async msg => {
      if (msg.self()) return;
      
      const contact = msg.talker();
      const text = msg.text();
      const room = msg.room();
      
      try {
        // 与MCP服务器交互
        const response = await this.mcpClient.chat({
          userPromptId: "wechat-chat",
          messages: [
            { role: "system", content: "你是一个微信助手，用户通过微信发送消息给你。" },
            { role: "user", content: text }
          ],
          userId: contact.id,
          context: {
            platform: "wechat",
            isGroupChat: !!room
          }
        });
        
        // 处理图片类型的回复
        if (response.includes("imageUrl:")) {
          const imageUrl = response.match(/imageUrl: (https:\/\/[^\s]+)/)[1];
          await this.sendImage(contact, imageUrl, room);
        } else {
          // 发送文本回复
          if (room) {
            await room.say(response);
          } else {
            await contact.say(response);
          }
        }
      } catch (error) {
        console.error('处理消息错误:', error);
        const errorMsg = '抱歉，我遇到了一些问题，请稍后再试。';
        if (room) {
          await room.say(errorMsg);
        } else {
          await contact.say(errorMsg);
        }
      }
    });
  }
  
  async sendImage(contact, url, room) {
    try {
      // 下载图片并发送
      // 实际实现可能需要使用FileBox
      if (room) {
        await room.say(`生成的图片: ${url}`);
      } else {
        await contact.say(`生成的图片: ${url}`);
      }
    } catch (error) {
      console.error('发送图片错误:', error);
    }
  }
  
  async start() {
    // 启动MCP服务器
    await mcpServer.start(3000);
    console.log('MCP服务器已启动在端口3000');
    
    // 启动机器人
    await this.bot.start();
    console.log('微信机器人已启动');
  }
}

module.exports = new WeChatBot();
```

### 步骤5：创建主入口文件

创建`index.js`文件：

```javascript
const express = require('express');
const bot = require('./bot');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 启动微信机器人
bot.start().catch(console.error);

// 启动Web服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
```

## 使用说明

1. 配置`.env`文件中的API密钥
2. 执行`node index.js`启动服务
3. 扫描终端显示的二维码登录微信
4. 开始与机器人交互

## 扩展功能

可以实现以下高级功能来增强机器人能力：

1. **自然语言理解 (NLU)**：集成NLP服务来更好地理解用户意图
2. **数据持久化**：使用MongoDB存储用户数据和提醒
3. **Docker部署**：创建Dockerfile实现容器化部署

## 示例对话

```
用户: 北京今天天气怎么样？
机器人: 北京今天天气晴朗，温度23°C，湿度45%，微风。

用户: 帮我设置一个明天上午9点的会议提醒
机器人: 已为您设置明天上午9点的会议提醒。

用户: 给我看看今天的科技新闻
机器人: 以下是今日科技新闻:
1. 苹果发布新款MacBook Pro
2. 谷歌推出AI助手新功能
3. 特斯拉宣布新能源电池突破
...
``` 