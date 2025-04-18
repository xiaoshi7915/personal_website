---
sidebar_position: 2
---

# 基础开发指南

本指南将帮助您快速上手Dify平台，从环境准备、安装配置到创建您的第一个AI应用。

## 环境要求

### 使用托管版本

如果您选择使用Dify.AI提供的托管版本，只需要：

- 现代网络浏览器（Chrome, Firefox, Edge等）
- 稳定的网络连接
- Dify.AI账户

### 自行部署要求

如果您选择自行部署Dify，需要准备：

#### 最低配置
- CPU: 4核
- 内存: 8GB RAM
- 存储: 20GB可用空间
- 操作系统: Ubuntu 20.04+, Debian 11+, CentOS 8+, macOS, Windows 10/11

#### 推荐配置
- CPU: 8核或更高
- 内存: 16GB RAM或更高
- 存储: 50GB+ SSD
- 操作系统: Ubuntu 22.04 LTS

#### 软件依赖
- Docker & Docker Compose
- Node.js 18+
- Python 3.10+
- PostgreSQL 13+
- Redis 6+

## 安装与部署

### 方式一：使用Docker Compose（推荐）

1. 克隆Dify仓库
```bash
git clone https://github.com/langgenius/dify.git
cd dify
```

2. 创建环境变量文件
```bash
cp .env.example .env
```

3. 编辑.env文件，配置必要的环境变量
```
# 基础配置
CONSOLE_API_URL=http://localhost:5001
APP_API_URL=http://localhost:5001
CONSOLE_WEB_URL=http://localhost:3000
APP_WEB_URL=http://localhost:8080

# 数据库配置
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=dify

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_DB=0

# 存储配置
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=/app/api/storage
```

4. 启动服务
```bash
docker-compose up -d
```

5. 访问控制台
浏览器访问`http://localhost:3000`，完成初始账户设置。

### 方式二：源码安装

#### 后端API服务

1. 准备Python环境
```bash
cd api
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件设置必要配置
```

3. 启动API服务
```bash
flask run --host 0.0.0.0 --port 5001
```

#### 前端Web控制台

1. 准备Node.js环境
```bash
cd web
npm install
```

2. 创建环境变量文件
```bash
cp .env.example .env
```

3. 启动Web控制台
```bash
npm run dev
```

## 快速开始

### 第一步：配置AI提供商

1. 登录Dify控制台
2. 进入"设置" > "AI提供商"
3. 添加您的AI服务提供商API密钥，如OpenAI、Anthropic等
4. 测试连接确保配置正确

### 第二步：创建应用

1. 在Dify控制台主页点击"创建应用"
2. 选择应用类型：
   - **对话型应用**：类似聊天机器人的交互式应用
   - **助手型应用**：融合对话与完成能力的全能助手
   - **文本生成型应用**：专注于内容创作的应用
   
3. 选择一个模板或从零开始
4. 设置应用名称和描述
5. 选择基础模型（如GPT-4、Claude等）
6. 点击"创建"完成初始设置

### 第三步：配置提示词

1. 进入您创建的应用
2. 点击"提示词工程"标签
3. 设置系统提示词，定义AI的行为和能力边界
4. 添加用户提示词示例，帮助AI理解交互模式
5. 使用变量功能增强提示词灵活性：
   ```
   请作为一名${industry}领域的专家，回答关于${topic}的问题。
   ```
6. 保存并测试提示词效果

### 第四步：添加知识库（可选）

1. 进入"知识库"部分
2. 点击"创建知识库"
3. 设置知识库名称和描述
4. 上传文档（支持PDF、Word、Markdown等）
5. 系统会自动处理文档，分块并创建向量索引
6. 将知识库关联到您的应用
7. 配置知识检索设置：
   - 相关度阈值
   - 检索数量
   - 排序方式

### 第五步：发布和集成

1. 完成应用配置后，点击"发布"
2. 系统会生成API密钥和集成代码
3. 选择集成方式：
   - **WebApp**：使用Dify提供的网页界面
   - **API**：通过REST API集成到您的应用
   - **SDK**：使用官方SDK在代码中集成

## API集成示例

### JavaScript集成

```javascript
// 安装SDK
// npm install dify-client

import { DifyClient } from 'dify-client';

// 初始化客户端
const client = new DifyClient({
  apiKey: 'your_api_key',
  endpoint: 'https://api.dify.ai/v1',  // 或您自己部署的API地址
});

// 对话型应用示例
async function chatWithDify() {
  const response = await client.chat({
    query: '如何使用Dify创建一个知识库应用？',
    user: 'user_123',
    stream: true,  // 启用流式响应
    onMessage: (chunk) => {
      console.log('收到消息片段:', chunk.answer);
    },
    onFinish: (response) => {
      console.log('完整回答:', response.answer);
    },
  });
}

// 文本生成型应用示例
async function generateWithDify() {
  const response = await client.completion({
    prompt: '写一篇关于人工智能的短文',
    user: 'user_123',
    variables: {
      topic: '生成式AI',
      tone: '专业'
    }
  });
  
  console.log('生成结果:', response.result);
}
```

### Python集成

```python
# 安装SDK
# pip install dify-client

from dify_client import DifyClient

# 初始化客户端
client = DifyClient(
    api_key="your_api_key",
    endpoint="https://api.dify.ai/v1"  # 或您自己部署的API地址
)

# 对话型应用示例
def chat_with_dify():
    # 创建新对话
    conversation = client.create_conversation()
    
    # 发送消息
    response = conversation.chat(
        query="什么是检索增强生成技术?",
        stream=True
    )
    
    # 处理流式响应
    for chunk in response:
        print(chunk.answer, end="")
    
    # 继续对话
    follow_up = conversation.chat(
        query="它与传统LLM有什么区别?"
    )
    
    print("\n回答:", follow_up.answer)

# 文本生成型应用示例
def generate_with_dify():
    response = client.completion(
        prompt="总结以下内容的要点",
        variables={
            "content": "长文本内容...",
            "format": "要点列表"
        }
    )
    
    print("生成结果:", response.result)
```

## 高级功能简介

### 工具调用

Dify支持集成外部工具，扩展AI能力：

1. 在应用设置中，找到"工具"部分
2. 添加预定义工具（如天气查询、搜索引擎等）
3. 或创建自定义工具：
   ```json
   {
     "name": "search_database",
     "description": "搜索产品数据库",
     "parameters": {
       "type": "object",
       "properties": {
         "keyword": {
           "type": "string",
           "description": "搜索关键词"
         },
         "category": {
           "type": "string",
           "enum": ["电子产品", "服装", "食品"],
           "description": "产品类别"
         }
       },
       "required": ["keyword"]
     }
   }
   ```

### 对话记忆管理

优化AI的对话记忆：

1. 在应用设置中找到"上下文记忆"
2. 配置记忆长度（消息数或token数）
3. 设置记忆策略：
   - 全量记忆
   - 摘要记忆
   - 选择性记忆

## 下一步

现在您已经了解了Dify的基本使用方法，可以继续探索：

1. 学习[Dify高级开发指南](/docs/dify/development)了解更多高级特性
2. 查看[完整API参考](/docs/dify/api-reference)获取详细的API文档
3. 探索[应用模板库](https://dify.ai/templates)获取灵感
4. 加入[Dify社区](https://discord.gg/dify)与其他开发者交流

祝您使用Dify创建出色的AI应用！ 