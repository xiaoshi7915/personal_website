---
sidebar_position: 5
---

#  JS 服务器案例

本页面展示了一些MCP实际应用的案例，帮助您理解如何在不同场景中利用MCP扩展AI模型的能力。

## 1. 数据检索与分析助手

### 场景描述

创建一个能够访问和分析公司内部数据库的AI助手，使非技术人员能够通过自然语言查询获取数据洞察。

### MCP实现

```javascript
// 导入必要的依赖
import { Server, ToolError } from '@modelcontextprotocol/server';
import express from 'express';
import cors from 'cors';
import knex from 'knex';

// 初始化数据库连接
const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'company_data'
  }
});

// 创建MCP服务器
const server = new Server({
  name: 'data-assistant',
  description: '公司内部数据访问与分析助手',
  version: '1.0.0'
});

// 数据库查询工具
server.registerTool({
  name: 'query_database',
  description: '执行SQL查询并返回结果',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'SQL查询语句，仅支持SELECT操作'
      }
    },
    required: ['query']
  },
  handler: async ({ query }) => {
    // 安全检查 - 只允许SELECT查询
    if (!query.trim().toLowerCase().startsWith('select')) {
      throw new ToolError('只允许SELECT查询操作');
    }
    
    try {
      // 执行查询
      const results = await db.raw(query);
      
      return {
        data: results.rows,
        rowCount: results.rowCount,
        columns: results.fields ? results.fields.map(f => f.name) : []
      };
    } catch (error) {
      throw new ToolError(`查询执行失败: ${error.message}`);
    }
  }
});

// 数据分析工具
server.registerTool({
  name: 'analyze_data',
  description: '分析数据集并返回结果',
  parameters: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        description: '要分析的数据集'
      },
      analysisType: {
        type: 'string',
        description: '分析类型: summary, trend, forecast',
        enum: ['summary', 'trend', 'forecast']
      }
    },
    required: ['data', 'analysisType']
  },
  handler: async ({ data, analysisType }) => {
    // 数据验证
    if (!Array.isArray(data) || data.length === 0) {
      throw new ToolError('无效的数据集');
    }
    
    let analysis;
    
    switch (analysisType) {
      case 'summary':
        analysis = computeSummaryStats(data);
        break;
      case 'trend':
        analysis = identifyTrends(data);
        break;
      case 'forecast':
        analysis = generateForecast(data);
        break;
      default:
        throw new ToolError(`不支持的分析类型: ${analysisType}`);
    }
    
    return {
      analysis,
      metadata: {
        dataPoints: data.length,
        analysisType
      }
    };
  }
});

// 数据分析辅助函数
function computeSummaryStats(data) {
  // 这里是一个简化的实现，真实场景中应该使用统计库
  const numericFields = {};
  
  // 确定哪些字段是数值型的
  Object.keys(data[0]).forEach(key => {
    if (typeof data[0][key] === 'number') {
      numericFields[key] = [];
    }
  });
  
  // 收集所有数值型字段的值
  data.forEach(item => {
    Object.keys(numericFields).forEach(key => {
      if (typeof item[key] === 'number') {
        numericFields[key].push(item[key]);
      }
    });
  });
  
  // 计算每个数值型字段的统计数据
  const stats = {};
  Object.keys(numericFields).forEach(key => {
    const values = numericFields[key];
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    
    stats[key] = { min, max, avg, median, sum };
  });
  
  return {
    numericStats: stats,
    totalRecords: data.length
  };
}

function identifyTrends(data) {
  // 简化的趋势分析实现
  // 实际应用中应使用专门的时间序列分析库
  return {
    message: "趋势分析需要更复杂的实现，这里只是示例",
    trendDetected: "上升/下降/持平", // 示例结果
    confidence: 0.85 // 示例置信度
  };
}

function generateForecast(data) {
  // 简化的预测实现
  // 实际应用中应使用专门的预测库
  return {
    message: "预测分析需要更复杂的实现，这里只是示例",
    forecastValues: [101, 105, 110], // 示例预测值
    confidenceInterval: [0.8, 0.9] // 示例置信区间
  };
}

// 创建Express应用
const app = express();
app.use(cors());
app.use(express.json());

// 处理MCP请求
app.post('/mcp', async (req, res) => {
  try {
    const response = await server.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    console.error('处理MCP请求时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`数据分析MCP服务器运行在端口 ${PORT}`);
});
```

### 用户体验

用户可以提问如：
1. "查询过去6个月销售额最高的5个产品"
2. "分析上个季度客户反馈中的主要趋势"
3. "预测下个月的网站流量"

AI会使用MCP工具执行必要的数据库查询和分析，然后以易于理解的方式呈现结果。

## 2. 实时天气和新闻集成

### 场景描述

为AI模型提供访问实时天气数据和新闻的能力，使其能够在回答中融入当前信息。

### MCP实现

```javascript
import { Server } from '@modelcontextprotocol/server';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

// 创建MCP服务器
const server = new Server({
  name: 'real-time-info',
  description: '实时天气和新闻信息服务',
  version: '1.0.0'
});

// 获取天气信息工具
server.registerTool({
  name: 'get_weather',
  description: '获取指定位置的天气信息',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: '位置名称，如"北京"或"上海"'
      }
    },
    required: ['location']
  },
  handler: async ({ location }) => {
    try {
      // 使用天气API
      const weatherApiKey = process.env.WEATHER_API_KEY || 'your_api_key';
      const response = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(location)}&days=3&aqi=no&alerts=yes`
      );
      
      const weatherData = response.data;
      
      return {
        current: {
          temperature: weatherData.current.temp_c,
          condition: weatherData.current.condition.text,
          humidity: weatherData.current.humidity,
          windSpeed: weatherData.current.wind_kph
        },
        forecast: weatherData.forecast.forecastday.map(day => ({
          date: day.date,
          maxTemp: day.day.maxtemp_c,
          minTemp: day.day.mintemp_c,
          condition: day.day.condition.text,
          chanceOfRain: day.day.daily_chance_of_rain
        }))
      };
    } catch (error) {
      console.error('获取天气数据失败:', error);
      throw new Error(`无法获取天气数据: ${error.message}`);
    }
  }
});

// 获取新闻信息工具
server.registerTool({
  name: 'get_news',
  description: '获取指定主题的最新新闻',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: '新闻主题，如"科技"或"体育"'
      },
      count: {
        type: 'number',
        description: '返回的新闻数量'
      }
    },
    required: ['topic']
  },
  handler: async ({ topic, count = 5 }) => {
    try {
      // 使用新闻API
      const newsApiKey = process.env.NEWS_API_KEY || 'your_api_key';
      const response = await axios.get(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&apiKey=${newsApiKey}&pageSize=${count}&language=zh`
      );
      
      const newsData = response.data;
      
      return {
        articles: newsData.articles.map(article => ({
          title: article.title,
          source: article.source.name,
          url: article.url,
          publishedAt: article.publishedAt,
          description: article.description
        }))
      };
    } catch (error) {
      console.error('获取新闻数据失败:', error);
      throw new Error(`无法获取新闻数据: ${error.message}`);
    }
  }
});

// 注册天气和新闻的提示模板
server.registerPrompt({
  name: 'weather_inquiry',
  description: '询问天气信息',
  template: `
    我想了解以下地点的天气情况：
    
    地点：[输入城市名称]
    
    请告诉我当前天气状况以及未来几天的预报。
  `
});

server.registerPrompt({
  name: 'news_inquiry',
  description: '询问最新新闻',
  template: `
    我想了解关于以下主题的最新新闻：
    
    主题：[输入感兴趣的主题]
    数量：[可选，希望获取的新闻数量]
    
    请提供相关新闻的标题、来源和简短描述。
  `
});

// 创建Express应用
const app = express();
app.use(cors());
app.use(express.json());

// 处理MCP请求
app.post('/mcp', async (req, res) => {
  try {
    const response = await server.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    console.error('处理MCP请求时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`实时信息MCP服务器运行在端口 ${PORT}`);
});
```

### 用户体验

用户可以获取最新信息，如：
1. "今天北京天气怎么样？我应该带伞吗？"
2. "告诉我最近的科技新闻头条"
3. "上海未来三天的天气预报"

AI会使用MCP工具获取实时信息，然后融入到回答中，提供准确的最新数据。

## 3. 多模态内容生成助手

### 场景描述

创建一个可以生成文本内容和图像的AI助手，帮助用户创建各种内容。

### MCP实现

```javascript
import { Server } from '@modelcontextprotocol/server';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// 创建MCP服务器
const server = new Server({
  name: 'content-creator',
  description: '多模态内容生成助手',
  version: '1.0.0'
});

// 确保输出目录存在
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成图像工具
server.registerTool({
  name: 'generate_image',
  description: '生成符合提示描述的图像',
  parameters: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: '图像描述提示'
      },
      style: {
        type: 'string',
        description: '图像风格: realistic, abstract, cartoon, oil-painting, digital-art',
        enum: ['realistic', 'abstract', 'cartoon', 'oil-painting', 'digital-art']
      },
      size: {
        type: 'string',
        description: '图像尺寸: 1024x1024, 512x512, etc.',
        enum: ['256x256', '512x512', '1024x1024']
      }
    },
    required: ['prompt']
  },
  handler: async ({ prompt, style = 'realistic', size = '512x512' }) => {
    try {
      // 使用图像生成API（这里以Stability AI为例）
      const apiKey = process.env.STABILITY_API_KEY || 'your_api_key';
      
      // 调用图像生成API
      const response = await axios({
        method: 'post',
        url: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1/text-to-image',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        data: {
          text_prompts: [
            {
              text: `${prompt} style: ${style}`,
              weight: 1.0
            }
          ],
          cfg_scale: 7,
          height: parseInt(size.split('x')[1]),
          width: parseInt(size.split('x')[0]),
          samples: 1,
          steps: 30
        }
      });
      
      // 处理返回的图像数据
      const image = response.data.artifacts[0];
      const base64Image = image.base64;
      
      // 保存图像到本地文件
      const timestamp = Date.now();
      const filename = `image_${timestamp}.png`;
      const filePath = path.join(outputDir, filename);
      
      fs.writeFileSync(filePath, Buffer.from(base64Image, 'base64'));
      
      // 返回结果
      return {
        imageUrl: `file://${filePath}`,
        imageBase64: `data:image/png;base64,${base64Image}`,
        metadata: {
          prompt,
          style,
          size,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('生成图像失败:', error);
      throw new Error(`无法生成图像: ${error.message}`);
    }
  }
});

// 格式化内容工具
server.registerTool({
  name: 'format_content',
  description: '将内容格式化为指定格式',
  parameters: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: '要格式化的内容'
      },
      format: {
        type: 'string',
        description: '目标格式: html, markdown, json',
        enum: ['html', 'markdown', 'json']
      }
    },
    required: ['content', 'format']
  },
  handler: async ({ content, format }) => {
    try {
      let formattedContent;
      
      switch (format) {
        case 'html':
          // 如果输入是Markdown，则转换为HTML
          if (content.includes('#') || content.includes('*') || content.includes('[')) {
            formattedContent = marked(content);
          } else {
            // 基本文本到HTML的转换
            formattedContent = `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
          }
          break;
          
        case 'markdown':
          // 如果输入是HTML，则尝试转换为Markdown
          if (content.includes('<')) {
            // 简单的HTML到Markdown转换
            const dom = new JSDOM(content);
            const document = dom.window.document;
            
            // 这里只是一个非常简化的实现
            // 真实场景应使用html-to-markdown库
            formattedContent = content
              .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
              .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
              .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
              .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
              .replace(/<em>(.*?)<\/em>/g, '*$1*')
              .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');
          } else {
            // 已经是纯文本，保持不变
            formattedContent = content;
          }
          break;
          
        case 'json':
          // 尝试将内容转换为结构化的JSON
          try {
            // 如果输入已经是JSON字符串，则解析它
            JSON.parse(content);
            formattedContent = content;
          } catch (e) {
            // 不是有效的JSON，创建一个简单的JSON对象
            formattedContent = JSON.stringify({
              content: content,
              formatted: true,
              timestamp: new Date().toISOString()
            }, null, 2);
          }
          break;
          
        default:
          formattedContent = content;
      }
      
      // 保存格式化内容到本地文件
      const timestamp = Date.now();
      const extensions = { html: 'html', markdown: 'md', json: 'json' };
      const filename = `formatted_${timestamp}.${extensions[format] || 'txt'}`;
      const filePath = path.join(outputDir, filename);
      
      fs.writeFileSync(filePath, formattedContent);
      
      return {
        formattedContent,
        format,
        filePath,
        size: formattedContent.length
      };
    } catch (error) {
      console.error('内容格式化失败:', error);
      throw new Error(`无法格式化内容: ${error.message}`);
    }
  }
});

// 注册内容生成的提示模板
server.registerPrompt({
  name: 'image_generation',
  description: '生成图像',
  template: `
    我想生成一张符合以下描述的图像：
    
    描述：[详细描述您想要的图像]
    风格：[可选：realistic, abstract, cartoon, oil-painting, digital-art]
    尺寸：[可选：256x256, 512x512, 1024x1024]
    
    请根据我的描述生成图像。
  `
});

server.registerPrompt({
  name: 'format_text',
  description: '格式化文本内容',
  template: `
    我需要将以下内容转换为特定格式：
    
    内容：[输入您要格式化的文本]
    目标格式：[选择：html, markdown, json]
    
    请将内容转换为指定格式。
  `
});

// 创建Express应用
const app = express();
app.use(cors());
app.use(express.json());

// 处理MCP请求
app.post('/mcp', async (req, res) => {
  try {
    const response = await server.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    console.error('处理MCP请求时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`内容创建MCP服务器运行在端口 ${PORT}`);
});
```

### 用户体验

用户可以请求：
1. "为我的博客文章生成一张夕阳下的海滩图片"
2. "将这段文字转换为HTML格式"
3. "帮我创建一份营销电子邮件，包含促销信息和产品图片"

AI会调用相应的MCP工具生成所需内容，并将文本和图像组合成最终结果。

## 总结

这些案例展示了MCP如何扩展AI模型的能力，使其能够：

1. **访问专有数据**：查询和分析公司内部数据库中的信息
2. **获取实时信息**：提供最新的天气预报和新闻资讯
3. **生成多模态内容**：创建文本和图像的组合内容

通过JavaScript实现自定义的MCP工具和资源，您可以根据特定需求扩展AI模型的能力，创建更加强大和实用的应用。

JavaScript作为MCP服务器的实现语言具有以下优势：

1. **广泛的生态系统**：NPM拥有丰富的库和工具，可以快速实现各种功能
2. **前后端一致性**：使用相同语言开发前后端，降低技术栈复杂性
3. **异步处理能力**：JavaScript的异步特性非常适合MCP服务器的请求处理
4. **部署灵活性**：可以轻松部署到各种环境，包括Node.js服务器、Serverless函数等

这些示例只是JavaScript实现MCP的基础，您可以根据自己的需求进一步扩展和优化这些解决方案。

在下一章中，我们将回答关于MCP实现和应用的[常见问题](/docs/mcp/faq)。 