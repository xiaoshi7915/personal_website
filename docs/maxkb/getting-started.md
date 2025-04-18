---
sidebar_position: 2
---

# 基础开发指南

本指南将帮助您快速开始使用MaxKB知识库系统，包括环境准备、安装配置和基本操作。

## 环境要求

使用MaxKB之前，请确保您的系统满足以下要求：

### 系统要求

- **操作系统**：Linux (推荐Ubuntu 20.04+)、macOS 10.15+、Windows 10/11
- **内存**：最低8GB，推荐16GB或更高
- **存储空间**：至少10GB可用空间
- **处理器**：多核处理器，2GHz以上

### 软件依赖

- **Python**: 3.8或更高版本
- **数据库**：PostgreSQL 12+
- **向量数据库**：支持Milvus, Qdrant, Weaviate或Pinecone
- **搜索引擎**：Elasticsearch (可选，用于混合检索)

## 安装MaxKB

### 使用pip安装

```bash
# 创建虚拟环境
python -m venv maxkb-env
source maxkb-env/bin/activate  # Linux/Mac
# 或 maxkb-env\Scripts\activate  # Windows

# 安装MaxKB
pip install maxkb
```

### 使用Docker安装

```bash
# 拉取最新镜像
docker pull maxkb/maxkb:latest

# 运行容器
docker run -d \
  -p 8000:8000 \
  -v /path/to/data:/app/data \
  --name maxkb-instance \
  maxkb/maxkb:latest
```

## 基础配置

### 创建配置文件

创建`config.yaml`文件，包含以下基本配置：

```yaml
# MaxKB配置文件
storage:
  type: postgres
  connection_string: "postgresql://username:password@localhost:5432/maxkb"

vector_db:
  type: milvus  # 或 qdrant, weaviate, pinecone
  connection:
    host: localhost
    port: 19530
    
embedding:
  model: text-embedding-ada-002  # 或使用其他嵌入模型
  dimension: 1536
  
chunking:
  chunk_size: 500
  chunk_overlap: 50
  
api:
  host: 0.0.0.0
  port: 8000
  workers: 4
```

### 初始化数据库

```bash
maxkb init --config config.yaml
```

## 快速开始

### 创建知识库

```python
from maxkb import MaxKB

# 初始化MaxKB客户端
client = MaxKB(config_path="config.yaml")

# 创建知识库
kb = client.create_knowledge_base(
    name="产品知识库",
    description="包含公司产品的所有技术文档"
)
```

### 导入文档

```python
# 导入单个文档
doc_id = kb.add_document(
    file_path="/path/to/document.pdf",
    metadata={
        "title": "产品技术规格",
        "department": "研发部",
        "version": "1.0"
    }
)

# 批量导入文件夹
imported_docs = kb.add_documents_from_directory(
    directory_path="/path/to/docs",
    recursive=True,
    file_types=["pdf", "docx", "md"]
)

print(f"成功导入{len(imported_docs)}个文档")
```

### 查询知识

```python
# 简单查询
results = kb.query(
    query="如何重置产品密码?",
    top_k=3
)

for i, result in enumerate(results):
    print(f"结果 {i+1}:")
    print(f"内容: {result.content}")
    print(f"相关度得分: {result.score}")
    print(f"文档来源: {result.metadata['source']}")
    print("---")

# 高级查询（带过滤条件）
filtered_results = kb.query(
    query="产品的技术参数是什么?",
    filters={
        "department": "研发部",
        "version": {"$gte": "2.0"}
    },
    top_k=5
)
```

## 基本API操作

启动API服务：

```bash
maxkb serve --config config.yaml
```

然后可以通过HTTP API访问MaxKB：

```bash
# 创建知识库
curl -X POST "http://localhost:8000/api/knowledge_bases" \
  -H "Content-Type: application/json" \
  -d '{"name": "技术文档库", "description": "技术文档集合"}'

# 上传文档
curl -X POST "http://localhost:8000/api/knowledge_bases/{kb_id}/documents" \
  -F "file=@/path/to/document.pdf" \
  -F "metadata={\"title\":\"产品手册\",\"category\":\"用户指南\"}"

# 查询知识
curl -X POST "http://localhost:8000/api/knowledge_bases/{kb_id}/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "如何连接到数据库?", "top_k": 3}'
```

## 与大型语言模型集成

### 使用OpenAI

```python
from maxkb import MaxKB
import openai

# 初始化MaxKB
kb = MaxKB(config_path="config.yaml").get_knowledge_base("产品知识库")

# 设置OpenAI API密钥
openai.api_key = "your-api-key"

# 用户查询
user_query = "我们产品的最新版本支持哪些操作系统?"

# 获取相关上下文
context_results = kb.query(user_query, top_k=3)
context = "\n\n".join([result.content for result in context_results])

# 构建提示
prompt = f"""
请基于以下产品信息回答用户的问题。只使用提供的信息回答，如果信息中没有答案，请直接说明不知道。

信息:
{context}

用户问题: {user_query}
"""

# 调用OpenAI
response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "你是一个产品支持专家，提供准确的产品信息。"},
        {"role": "user", "content": prompt}
    ]
)

# 显示回答
print(response.choices[0].message.content)
```

## 下一步

恭喜！您已经完成了MaxKB的基本设置和使用。接下来，您可以：

1. 学习[高级功能和最佳实践](/docs/maxkb/development)
2. 了解如何优化[向量检索性能](/docs/maxkb/optimization)
3. 探索[与RAG集成的高级模式](/docs/maxkb/rag-integration)
4. 查看[完整API参考](/docs/maxkb/api-reference)

MaxKB为您提供强大而灵活的知识管理能力，让AI应用更智能、更可靠！ 