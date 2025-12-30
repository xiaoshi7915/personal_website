---
sidebar_position: 8
title: 从零到一：构建BISHENG应用
description: 一个完整的教程，从环境搭建到部署上线的BISHENG应用开发全流程
---

# 从零到一：构建BISHENG应用

本教程将带您从零开始，使用BISHENG平台构建一个完整的AI应用。我们将创建一个**智能文档助手**，能够理解文档内容并回答相关问题。

## 项目概述

### 功能特性

- ✅ 可视化工作流编排
- ✅ 知识库管理
- ✅ 多模型支持
- ✅ 对话应用
- ✅ API接口

### 技术栈

- **平台**：BISHENG毕昇
- **部署**：Docker
- **LLM**：多种开源和商业模型

## 第一步：环境准备

### 1.1 安装BISHENG

#### 使用Docker Compose

```bash
# 克隆BISHENG仓库
git clone https://github.com/dataelement/bisheng.git
cd bisheng

# 启动服务
docker-compose up -d
```

### 1.2 访问BISHENG

打开浏览器访问：`http://localhost:3000`

默认账号：`admin`
默认密码：`bisheng.ai`

## 第二步：创建工作流

### 2.1 创建新应用

1. 登录BISHENG平台
2. 点击"应用" → "新建应用"
3. 选择"对话应用"

### 2.2 设计工作流

在可视化编辑器中拖拽节点：

```
开始节点
  ↓
知识库检索节点
  ↓
LLM节点（生成回答）
  ↓
结束节点
```

### 2.3 配置节点

#### 知识库检索节点

1. 选择知识库
2. 配置检索参数：
   - Top K：5
   - 相似度阈值：0.7

#### LLM节点

1. 选择模型（如GPT-4、Claude等）
2. 配置提示词：
   ```
   基于以下上下文回答问题：
   {context}
   
   问题：{question}
   ```

## 第三步：配置知识库

### 3.1 创建知识库

1. 点击"知识库" → "新建知识库"
2. 填写信息：
   - 名称：企业文档库
   - 描述：包含企业制度、流程等文档

### 3.2 上传文档

1. 点击知识库 → "上传文档"
2. 支持格式：PDF、Word、TXT、Markdown等
3. 批量上传多个文档

### 3.3 配置解析设置

- **分块大小**：1000字符
- **分块重叠**：200字符
- **解析模式**：自动识别

## 第四步：测试和优化

### 4.1 测试对话

在对话界面测试：

```
用户：公司的请假流程是什么？
助手：根据公司制度文档，请假流程如下：
1. 在OA系统提交请假申请
2. 直属上级审批
3. HR部门审核
4. 审批通过后生效
```

### 4.2 优化工作流

1. 调整检索参数
2. 优化提示词
3. 测试不同模型

## 第五步：部署

### 5.1 生产环境配置

修改 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  bisheng:
    image: dataelement/bisheng:latest
    ports:
      - "3000:3000"
    environment:
      - BISHENG_DB_HOST=postgres
      - BISHENG_DB_NAME=bisheng
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

## 总结

本教程展示了如何使用BISHENG平台构建AI应用：

1. 环境搭建和安装
2. 可视化工作流编排
3. 知识库管理
4. 测试和优化
5. 部署

BISHENG平台提供了强大的可视化开发能力，让您能够快速构建企业级AI应用。

