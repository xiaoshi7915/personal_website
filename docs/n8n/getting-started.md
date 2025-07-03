---
sidebar_position: 2
---

# 基础开发指南

本章将带您从零开始学习n8n工作流开发，包括环境搭建、基础概念和第一个工作流的创建。

## 环境搭建

### 方法一：Docker部署（推荐）

Docker是最简单快速的部署方式，适合快速体验和开发测试。

```bash
# 拉取n8n镜像
docker pull n8nio/n8n

# 运行n8n容器
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

访问 `http://localhost:5678` 即可开始使用n8n。

### 方法二：npm安装

如果您熟悉Node.js环境，可以直接通过npm安装：

```bash
# 全局安装n8n
npm install n8n -g

# 启动n8n
n8n start

# 或者直接运行
npx n8n
```

### 方法三：Docker Compose部署

对于需要持久化数据的生产环境，推荐使用Docker Compose：

```yaml
# docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8nuser
      - DB_POSTGRESDB_PASSWORD=n8npassword
    volumes:
      - ~/.n8n:/home/node/.n8n
    depends_on:
      - postgres

  postgres:
    image: postgres:13
    restart: always
    environment:
      - POSTGRES_DB=n8n
      - POSTGRES_USER=n8nuser
      - POSTGRES_PASSWORD=n8npassword
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# 启动服务
docker-compose up -d
```

## 基础概念详解

### 1. 节点(Nodes)

节点是n8n工作流的基本构建块，每个节点执行特定的功能：

#### 触发节点(Trigger Nodes)
- **Manual Trigger**: 手动触发，用于测试和调试
- **Cron**: 定时触发，支持标准的cron表达式
- **Webhook**: HTTP触发，接收外部系统的请求
- **Email Trigger**: 监听邮件触发
- **File Trigger**: 监听文件变化

#### 常用功能节点
- **HTTP Request**: 发送HTTP请求到API端点
- **Code**: 执行自定义JavaScript代码
- **IF**: 条件判断节点
- **Switch**: 多条件分支节点
- **Set**: 设置和修改数据字段
- **Move Binary Data**: 处理文件和二进制数据

#### 应用集成节点
- **Gmail**: Google邮箱操作
- **Slack**: Slack消息和频道管理
- **Google Sheets**: Google表格数据操作
- **MySQL**: 数据库查询和操作
- **AWS**: 各种AWS服务集成

### 2. 连接(Connections)

连接定义了数据在节点之间的流动方向：

- **主连接(Main)**: 传递主要的数据流
- **错误连接(Error)**: 处理错误情况
- **条件连接**: 基于条件的分支连接

### 3. 数据格式

n8n使用JSON格式在节点之间传递数据：

```json
[
  {
    "json": {
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30
    },
    "binary": {}
  }
]
```

- **json**: 存储结构化数据
- **binary**: 存储文件、图片等二进制数据

### 4. 表达式和变量

n8n支持强大的表达式系统来动态处理数据：

```javascript
// 访问前一个节点的数据
{{ $json.name }}

// 访问特定节点的数据
{{ $node["HTTP Request"].json.data }}

// 使用JavaScript表达式
{{ $json.firstName + ' ' + $json.lastName }}

// 格式化日期
{{ $now.format('YYYY-MM-DD') }}

// 条件表达式
{{ $json.status === 'active' ? 'Yes' : 'No' }}
```

## 创建第一个工作流

让我们创建一个简单的工作流来理解基本概念：

### 示例：每日天气推送工作流

这个工作流将每天获取天气信息并发送邮件通知。

#### 步骤1：添加定时触发节点

1. 点击 "+" 添加新节点
2. 选择 "Cron" 节点
3. 设置 "Mode" 为 "Every Day"
4. 设置 "Hour" 为 "8"（每天上午8点触发）

#### 步骤2：添加天气API节点

1. 添加 "HTTP Request" 节点
2. 配置参数：
   - **Method**: GET
   - **URL**: `https://api.openweathermap.org/data/2.5/weather`
   - **Query Parameters**:
     - `q`: 北京
     - `appid`: YOUR_API_KEY
     - `units`: metric
     - `lang`: zh_cn

#### 步骤3：处理天气数据

添加 "Code" 节点来格式化天气信息：

```javascript
// 获取天气数据
const weather = $input.first().json;

// 格式化天气信息
const weatherInfo = {
  city: weather.name,
  temperature: Math.round(weather.main.temp),
  description: weather.weather[0].description,
  humidity: weather.main.humidity,
  windSpeed: weather.wind.speed,
  date: new Date().toLocaleDateString('zh-CN')
};

// 创建邮件内容
const emailContent = `
🌤️ 今日天气预报

📍 城市：${weatherInfo.city}
🌡️ 温度：${weatherInfo.temperature}°C
☁️ 天气：${weatherInfo.description}
💧 湿度：${weatherInfo.humidity}%
💨 风速：${weatherInfo.windSpeed} m/s
📅 日期：${weatherInfo.date}

祝您有美好的一天！
`;

return {
  json: {
    subject: `${weatherInfo.city}今日天气 - ${weatherInfo.temperature}°C ${weatherInfo.description}`,
    content: emailContent,
    ...weatherInfo
  }
};
```

#### 步骤4：发送邮件通知

1. 添加 "Gmail" 节点（或其他邮件服务节点）
2. 配置邮件参数：
   - **To**: 您的邮箱地址
   - **Subject**: `{{ $json.subject }}`
   - **Email Type**: Text
   - **Message**: `{{ $json.content }}`

#### 步骤5：测试工作流

1. 点击 "Execute Workflow" 按钮测试
2. 检查每个节点的输出数据
3. 确认邮件是否正常发送

## 调试技巧

### 1. 使用执行数据查看器

- 点击节点查看输入和输出数据
- 使用JSON和表格视图查看数据结构
- 检查错误信息和执行状态

### 2. 逐步执行

- 使用 "Execute Previous Nodes" 功能
- 逐个节点测试执行结果
- 确保数据正确传递

### 3. 表达式测试

- 在表达式编辑器中实时测试表达式
- 使用 `console.log()` 在Code节点中输出调试信息
- 利用Set节点临时存储中间结果

### 4. 错误处理

```javascript
// 在Code节点中添加错误处理
try {
  // 主要逻辑
  const result = processData($input.first().json);
  return { json: result };
} catch (error) {
  // 错误处理
  console.error('处理数据时出错:', error);
  return { 
    json: { 
      error: true, 
      message: error.message 
    } 
  };
}
```

## 常见问题解决

### 1. 节点连接问题

**问题**: 节点之间无法连接
**解决**: 
- 确保输出端口和输入端口类型匹配
- 检查节点是否支持所需的连接类型
- 删除并重新创建连接

### 2. 数据格式错误

**问题**: 数据在节点间传递时格式不正确
**解决**:
- 使用Set节点标准化数据格式
- 在Code节点中进行数据类型转换
- 检查API返回的数据结构

### 3. 表达式计算错误

**问题**: 表达式无法正确计算
**解决**:
- 检查语法是否正确
- 确认变量路径是否存在
- 使用简单的表达式进行测试

### 4. 认证问题

**问题**: API调用认证失败
**解决**:
- 检查API密钥是否正确
- 确认认证方式配置是否正确
- 查看API服务商的认证文档

## 最佳实践

### 1. 工作流设计原则

- **模块化**: 将复杂逻辑拆分为多个简单节点
- **可读性**: 使用清晰的节点命名和注释
- **容错性**: 添加适当的错误处理机制
- **可维护性**: 避免过度复杂的表达式

### 2. 性能优化

- **批处理**: 使用Split In Batches处理大量数据
- **缓存**: 避免重复的API调用
- **异步处理**: 对于耗时操作使用适当的等待机制

### 3. 安全考虑

- **敏感信息**: 使用环境变量存储API密钥
- **数据验证**: 对输入数据进行验证和清理
- **访问控制**: 限制工作流的访问权限

## 下一步学习

完成基础工作流后，建议继续学习：

1. **高级节点使用**: 掌握更多内置节点的功能
2. **自定义代码**: 深入学习Code节点的JavaScript编程
3. **API集成**: 学习与各种第三方服务的集成
4. **工作流模式**: 了解常见的工作流设计模式
5. **性能优化**: 学习提高工作流执行效率的技巧

在下一章《高级开发指南》中，我们将深入探讨这些高级主题。 