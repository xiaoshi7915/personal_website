---
sidebar_position: 8
title: 从零到一：构建MaxKB知识库应用
description: 一个完整的教程，从环境搭建到部署上线的MaxKB知识库应用开发全流程
---

# 从零到一：构建MaxKB知识库应用

本教程将带您从零开始，使用MaxKB平台构建一个完整的知识库问答系统。我们将创建一个**企业知识库助手**，能够基于企业内部文档回答员工问题。

## 项目概述

### 功能特性

- ✅ 知识库管理
- ✅ 文档上传和解析
- ✅ 智能问答
- ✅ 多轮对话
- ✅ 权限管理
- ✅ API接口

### 技术栈

- **平台**：MaxKB
- **向量数据库**：内置向量数据库
- **LLM**：OpenAI / 本地模型
- **部署**：Docker

## 第一步：环境准备

### 1.1 安装MaxKB

#### 使用Docker Compose

```bash
# 克隆MaxKB仓库
git clone https://github.com/1Panel-dev/MaxKB.git
cd MaxKB

# 启动服务
docker-compose up -d
```

### 1.2 访问MaxKB

打开浏览器访问：`http://localhost:8080`

默认账号：`admin`
默认密码：`MaxKB@2024`

## 第二步：创建知识库

### 2.1 创建知识库

1. 登录MaxKB平台
2. 点击"知识库" → "新建知识库"
3. 填写信息：
   - 名称：企业知识库
   - 描述：包含企业制度、流程、产品文档等

### 2.2 上传文档

1. 点击知识库 → "文档管理" → "上传文档"
2. 支持格式：PDF、Word、TXT、Markdown等
3. 可以批量上传多个文档

### 2.3 配置解析设置

- **分块大小**：1000字符
- **分块重叠**：200字符
- **解析模式**：自动识别

## 第三步：创建应用

### 3.1 创建对话应用

1. 点击"应用" → "新建应用"
2. 选择"对话应用"
3. 配置应用：
   - 名称：企业知识库助手
   - 关联知识库：选择刚创建的知识库
   - 模型：选择GPT-4或Claude

### 3.2 配置提示词

在提示词编辑器中输入：

```
你是一个专业的企业知识库助手，负责回答员工关于企业制度、流程、产品等问题。

用户问题：{{question}}

请基于以下知识库内容回答问题：
{{knowledge_base}}

回答要求：
1. 准确、清晰、专业
2. 如果知识库中没有相关信息，请明确说明
3. 引用具体的文档来源
```

### 3.3 配置对话参数

- **温度**：0.7
- **最大Token**：2000
- **Top K**：5（检索最相关的5个文档片段）

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

[来源：公司制度文档-人事管理篇]
```

### 4.2 优化检索效果

1. **调整分块策略**：根据文档特点调整分块大小
2. **优化提示词**：根据测试结果调整提示词
3. **添加文档标签**：为文档添加标签，便于分类检索

## 第五步：权限管理

### 5.1 创建用户组

1. 点击"用户管理" → "用户组"
2. 创建用户组：
   - 管理员组：全部权限
   - 普通用户组：查看和提问权限
   - 访客组：仅查看权限

### 5.2 分配权限

为不同用户组分配不同的知识库访问权限：

- **公开知识库**：所有用户可访问
- **部门知识库**：仅部门成员可访问
- **机密知识库**：仅授权人员可访问

## 第六步：API集成

### 6.1 获取API密钥

1. 点击"API管理" → "新建API密钥"
2. 复制API密钥

### 6.2 调用API

```python
import requests

api_key = "your-api-key"
api_url = "https://your-maxkb-domain/api/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

data = {
    "messages": [
        {"role": "user", "content": "用户问题"}
    ],
    "stream": False
}

response = requests.post(api_url, headers=headers, json=data)
print(response.json())
```

## 第七步：部署

### 7.1 生产环境配置

修改 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  maxkb:
    image: 1panel/maxkb:latest
    ports:
      - "8080:8080"
    environment:
      - MAXKB_DB_HOST=postgres
      - MAXKB_DB_PORT=5432
      - MAXKB_DB_NAME=maxkb
      - MAXKB_DB_USER=maxkb
      - MAXKB_DB_PASSWORD=your-password
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### 7.2 备份和恢复

```bash
# 备份数据
docker exec maxkb_db pg_dump -U maxkb maxkb > backup.sql

# 恢复数据
docker exec -i maxkb_db psql -U maxkb maxkb < backup.sql
```

## 总结

本教程展示了如何使用MaxKB平台构建知识库问答系统：

1. 环境搭建和安装
2. 创建知识库和上传文档
3. 创建对话应用
4. 测试和优化
5. 权限管理
6. API集成
7. 部署和维护

MaxKB提供了完整的知识库管理功能，让您能够快速构建企业级知识库应用。

