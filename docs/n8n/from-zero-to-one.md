---
sidebar_position: 8
title: 从零到一：构建n8n工作流应用
description: 一个完整的教程，从环境搭建到部署上线的n8n工作流应用开发全流程
---

# 从零到一：构建n8n工作流应用

本教程将带您从零开始，使用n8n构建一个完整的自动化工作流。我们将创建一个**智能数据处理工作流**，能够自动收集数据、处理、分析和通知。

## 项目概述

### 功能特性

- ✅ 数据自动收集
- ✅ 数据处理和转换
- ✅ AI分析和生成
- ✅ 自动通知和报告
- ✅ 定时执行
- ✅ 错误处理

### 技术栈

- **平台**：n8n
- **部署**：Docker / 云服务
- **集成**：多种API和服务

## 第一步：环境准备

### 1.1 安装n8n

#### 方式1：Docker（推荐）

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### 方式2：npm

```bash
npm install n8n -g
n8n start
```

### 1.2 访问n8n

打开浏览器访问：`http://localhost:5678`

首次访问会要求创建账号。

## 第二步：创建工作流

### 2.1 创建新工作流

1. 点击"Workflows" → "New Workflow"
2. 命名工作流：智能数据处理工作流

### 2.2 添加触发器节点

#### Schedule Trigger（定时触发）

1. 添加"Schedule Trigger"节点
2. 配置：
   - **Trigger Times**：每天上午9点
   - **Timezone**：Asia/Shanghai

### 2.3 添加数据收集节点

#### HTTP Request节点

1. 添加"HTTP Request"节点
2. 配置：
   - **Method**：GET
   - **URL**：`https://api.example.com/data`
   - **Authentication**：API Key（如果需要）

### 2.4 添加数据处理节点

#### Code节点

1. 添加"Code"节点
2. 编写处理逻辑：

```javascript
// 处理数据
const items = $input.all();

const processed = items.map(item => {
  const data = item.json;
  
  // 数据清洗和转换
  return {
    json: {
      id: data.id,
      name: data.name,
      value: parseFloat(data.value) || 0,
      timestamp: new Date().toISOString()
    }
  };
});

return processed;
```

### 2.5 添加AI分析节点

#### OpenAI节点

1. 添加"OpenAI"节点
2. 配置：
   - **Resource**：Chat
   - **Operation**：Create Message
   - **Model**：gpt-4
   - **Messages**：
     ```
     系统：你是一个数据分析专家。
     用户：分析以下数据并生成报告：[数据内容]
     ```
     
     注意：在实际配置中，使用 `{{ $json }}` 来引用数据。

### 2.6 添加通知节点

#### Email节点

1. 添加"Email"节点
2. 配置：
   - **From Email**：noreply@example.com
   - **To Email**：admin@example.com
   - **Subject**：每日数据报告
   - **Text**：`{{ $json.analysis }}`（使用n8n表达式语法）

### 2.7 添加错误处理

#### Error Trigger节点

1. 添加"Error Trigger"节点
2. 连接到通知节点，发送错误通知

## 第三步：高级工作流示例

### 3.1 多步骤数据处理

```
Schedule Trigger
  ↓
HTTP Request (获取数据)
  ↓
Code (数据清洗)
  ↓
IF (数据验证)
  ├─ Yes → Code (数据转换)
  └─ No → Error Trigger
  ↓
OpenAI (数据分析)
  ↓
Code (格式化报告)
  ↓
Email (发送报告)
```

### 3.2 条件分支

使用"IF"节点实现条件分支：

```javascript
// IF节点条件
{{ $json.value > 100 }}

// 如果值大于100，执行A分支
// 否则执行B分支
```

### 3.3 循环处理

使用"Loop Over Items"节点处理数组：

```javascript
// 对每个项目执行操作
const items = $input.all();
// ... 处理逻辑
```

## 第四步：集成外部服务

### 4.1 集成数据库

#### PostgreSQL节点

1. 添加"PostgreSQL"节点
2. 配置连接信息
3. 执行SQL查询或插入数据

### 4.2 集成API

#### REST API节点

1. 添加"HTTP Request"节点
2. 配置API端点和认证
3. 处理API响应

### 4.3 集成文件系统

#### Read Binary File节点

1. 添加"Read Binary File"节点
2. 读取文件内容
3. 传递给下一个节点处理

## 第五步：部署和监控

### 5.1 生产环境部署

#### Docker Compose

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-password
    volumes:
      - ~/.n8n:/home/node/.n8n
    restart: unless-stopped
```

### 5.2 监控工作流

1. 在n8n界面查看工作流执行历史
2. 查看执行日志和错误信息
3. 设置告警通知

### 5.3 性能优化

- 使用队列处理大量数据
- 批量处理减少API调用
- 缓存常用数据
- 优化工作流结构

## 总结

本教程展示了如何使用n8n构建自动化工作流：

1. 环境搭建和安装
2. 创建工作流
3. 添加节点和处理逻辑
4. 集成外部服务
5. 部署和监控

n8n提供了强大的可视化工作流编排能力，让您能够快速构建复杂的自动化系统。

