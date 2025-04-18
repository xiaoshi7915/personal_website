---
sidebar_position: 5
---

# MCP应用案例

本页面展示了一些MCP实际应用的案例，帮助您理解如何在不同场景中利用MCP扩展AI模型的能力。

## 1. 数据检索与分析助手

### 场景描述

创建一个能够访问和分析公司内部数据库的AI助手，使非技术人员能够通过自然语言查询获取数据洞察。

### MCP实现

```typescript
// 数据库查询函数
async function queryDatabase(params: { query: string }) {
  // 连接到数据库并执行查询
  const results = await db.executeQuery(params.query);
  return {
    data: results,
    rowCount: results.length
  };
}

// 数据分析函数
async function analyzeData(params: { data: any[], analysisType: string }) {
  // 根据分析类型执行不同的分析算法
  let analysis;
  switch(params.analysisType) {
    case 'summary':
      analysis = computeSummaryStats(params.data);
      break;
    case 'trend':
      analysis = identifyTrends(params.data);
      break;
    case 'forecast':
      analysis = generateForecast(params.data);
      break;
    default:
      throw new Error(`不支持的分析类型: ${params.analysisType}`);
  }
  
  return {
    analysis,
    metadata: {
      dataPoints: params.data.length,
      analysisType: params.analysisType
    }
  };
}

// 注册到MCP服务器
const mcpServer = new MCPServer({
  namespace: 'data_assistant',
  functions: [
    {
      name: 'query_database',
      description: '执行SQL查询并返回结果',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'SQL查询语句'
          }
        },
        required: ['query']
      },
      handler: queryDatabase
    },
    {
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
            description: '分析类型: summary, trend, forecast'
          }
        },
        required: ['data', 'analysisType']
      },
      handler: analyzeData
    }
  ]
});
```

### 用户体验

用户可以提问如：
1. "查询过去6个月销售额最高的5个产品"
2. "分析上个季度客户反馈中的主要趋势"
3. "预测下个月的网站流量"

AI会使用MCP函数执行必要的数据库查询和分析，然后以易于理解的方式呈现结果。

## 2. 实时天气和新闻集成

### 场景描述

为AI模型提供访问实时天气数据和新闻的能力，使其能够在回答中融入当前信息。

### MCP实现

```typescript
// 获取天气信息
async function getWeather(params: { location: string }) {
  // 调用天气API
  const weatherData = await weatherApi.getWeatherFor(params.location);
  return {
    current: weatherData.current,
    forecast: weatherData.forecast.slice(0, 3) // 未来3天预报
  };
}

// 获取新闻信息
async function getNews(params: { topic: string, count: number }) {
  // 调用新闻API
  const newsArticles = await newsApi.getArticles({
    topic: params.topic,
    count: params.count || 5
  });
  
  return {
    articles: newsArticles.map(article => ({
      title: article.title,
      source: article.source,
      summary: article.summary,
      url: article.url,
      publishedAt: article.publishedAt
    }))
  };
}

// 注册到MCP服务器
const mcpServer = new MCPServer({
  namespace: 'real_time_info',
  functions: [
    {
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
      handler: getWeather
    },
    {
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
      handler: getNews
    }
  ]
});
```

### 用户体验

用户可以获取最新信息，如：
1. "今天北京天气怎么样？我应该带伞吗？"
2. "告诉我最近的科技新闻头条"
3. "上海未来三天的天气预报"

AI会使用MCP函数获取实时信息，然后融入到回答中，提供准确的最新数据。

## 3. 多模态内容生成助手

### 场景描述

创建一个可以生成文本内容和图像的AI助手，帮助用户创建各种内容。

### MCP实现

```typescript
// 生成图像
async function generateImage(params: { prompt: string, style: string, size: string }) {
  // 调用图像生成API
  const imageResult = await imageGenerationApi.createImage({
    prompt: params.prompt,
    style: params.style || 'realistic',
    size: params.size || '1024x1024'
  });
  
  return {
    imageUrl: imageResult.url,
    metadata: {
      prompt: params.prompt,
      style: params.style,
      size: params.size
    }
  };
}

// 格式化内容
async function formatContent(params: { content: string, format: string }) {
  let formattedContent;
  
  switch(params.format) {
    case 'html':
      formattedContent = convertToHtml(params.content);
      break;
    case 'markdown':
      formattedContent = convertToMarkdown(params.content);
      break;
    case 'json':
      formattedContent = convertToJson(params.content);
      break;
    default:
      formattedContent = params.content;
  }
  
  return {
    formattedContent,
    format: params.format
  };
}

// 注册到MCP服务器
const mcpServer = new MCPServer({
  namespace: 'content_creator',
  functions: [
    {
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
            description: '图像风格: realistic, abstract, cartoon, etc.'
          },
          size: {
            type: 'string',
            description: '图像尺寸: 1024x1024, 512x512, etc.'
          }
        },
        required: ['prompt']
      },
      handler: generateImage
    },
    {
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
            description: '目标格式: html, markdown, json'
          }
        },
        required: ['content', 'format']
      },
      handler: formatContent
    }
  ]
});
```

### 用户体验

用户可以请求：
1. "为我的博客文章生成一张夕阳下的海滩图片"
2. "将这段文字转换为HTML格式"
3. "帮我创建一份营销电子邮件，包含促销信息和产品图片"

AI会调用相应的MCP函数生成所需内容，并将文本和图像组合成最终结果。

## 总结

这些案例展示了MCP如何扩展AI模型的能力，使其能够：

1. **访问专有数据**：查询和分析公司内部数据库中的信息
2. **获取实时信息**：提供最新的天气预报和新闻资讯
3. **生成多模态内容**：创建文本和图像的组合内容

通过实现自定义的MCP函数，您可以根据特定需求扩展AI模型的能力，创建更加强大和实用的应用。

在下一章中，我们将回答关于MCP实现和应用的[常见问题](/docs/mcp/faq)。 