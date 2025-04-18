---
sidebar_position: 6
---

# API参考

本文档提供MaxKB的完整API参考，包括所有可用的接口、参数说明和使用示例。

## 客户端初始化

### 初始化MaxKB客户端

```python
from maxkb import MaxKB

# 基本初始化
client = MaxKB(api_key="your_api_key")

# 或使用配置文件初始化
client = MaxKB(config_path="config.yaml")

# 高级初始化选项
client = MaxKB(
    api_key="your_api_key",
    base_url="https://api.maxkb.ai/v1",
    timeout=30,
    max_retries=3,
    retry_delay=1.0,
    log_level="INFO",
    cache_enabled=True,
    cache_ttl=3600
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| api_key | str | MaxKB API密钥 | None |
| config_path | str | 配置文件路径 | None |
| base_url | str | API基础URL | "https://api.maxkb.ai/v1" |
| timeout | int | 请求超时秒数 | 60 |
| max_retries | int | 最大重试次数 | 3 |
| retry_delay | float | 重试延迟秒数 | 0.5 |
| log_level | str | 日志级别 | "WARNING" |
| cache_enabled | bool | 是否启用缓存 | False |
| cache_ttl | int | 缓存有效期(秒) | 3600 |

## 知识库管理

### 获取知识库列表

```python
# 获取所有知识库
all_kbs = client.list_knowledge_bases()

# 使用分页和排序
kbs = client.list_knowledge_bases(
    offset=0,
    limit=10,
    sort_by="created_at",
    sort_order="desc"
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| offset | int | 分页偏移量 | 0 |
| limit | int | 最大返回数量 | 100 |
| sort_by | str | 排序字段 | "created_at" |
| sort_order | str | 排序方向("asc"或"desc") | "desc" |

#### 返回值

返回一个包含知识库信息的列表，每个知识库包含以下字段：

```json
[
  {
    "id": "kb-123",
    "name": "产品手册",
    "description": "产品技术文档集合",
    "created_at": "2023-06-15T10:30:00Z",
    "updated_at": "2023-07-20T14:45:22Z",
    "document_count": 25,
    "vector_count": 1543,
    "embedding_model": "text-embedding-3-large"
  },
  // 更多知识库...
]
```

### 创建知识库

```python
# 创建一个新知识库
new_kb = client.create_knowledge_base(
    name="市场研究",
    description="竞争对手分析和市场趋势资料",
    embedding_model="text-embedding-3-large"
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| name | str | 知识库名称 | 必填 |
| description | str | 知识库描述 | "" |
| embedding_model | str | 嵌入模型 | "text-embedding-3-small" |
| metadata | dict | 自定义元数据 | {} |

#### 返回值

返回创建的知识库信息：

```json
{
  "id": "kb-456",
  "name": "市场研究",
  "description": "竞争对手分析和市场趋势资料",
  "created_at": "2023-08-10T09:12:35Z",
  "updated_at": "2023-08-10T09:12:35Z",
  "document_count": 0,
  "vector_count": 0,
  "embedding_model": "text-embedding-3-large"
}
```

### 获取知识库

```python
# 通过ID获取知识库
kb = client.get_knowledge_base("kb-123")

# 通过名称获取知识库
kb = client.get_knowledge_base_by_name("产品手册")
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| kb_id | str | 知识库ID | 必填 |

或

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| name | str | 知识库名称 | 必填 |

#### 返回值

返回知识库对象，包含与上述创建知识库相同的字段。

### 更新知识库

```python
# 更新知识库信息
updated_kb = client.update_knowledge_base(
    kb_id="kb-123",
    name="产品技术文档",
    description="更新后的产品技术文档集合"
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| kb_id | str | 知识库ID | 必填 |
| name | str | 知识库新名称 | None |
| description | str | 知识库新描述 | None |
| metadata | dict | 新的自定义元数据 | None |

#### 返回值

返回更新后的知识库信息。

### 删除知识库

```python
# 删除知识库
client.delete_knowledge_base("kb-123")
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| kb_id | str | 知识库ID | 必填 |

#### 返回值

成功删除返回`True`，否则抛出异常。

## 文档管理

### 添加文档

```python
# 从文件添加文档
doc_id = kb.add_document(
    file_path="/path/to/document.pdf",
    metadata={
        "author": "张三",
        "department": "研发部",
        "tags": ["产品规格", "技术文档"]
    }
)

# 从文本添加文档
doc_id = kb.add_document_from_text(
    text="这是一个测试文档内容...",
    title="测试文档",
    metadata={
        "source": "内部会议记录",
        "date": "2023-08-01"
    }
)

# 从URL添加文档
doc_id = kb.add_document_from_url(
    url="https://example.com/whitepaper.pdf",
    metadata={
        "source": "公司网站",
        "category": "白皮书"
    }
)
```

#### `add_document` 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| file_path | str | 文档文件路径 | 必填 |
| metadata | dict | 文档元数据 | {} |
| chunk_size | int | 文档分块大小 | 1000 |
| chunk_overlap | int | 块重叠字符数 | 100 |
| custom_id | str | 自定义文档ID | None |
| async_processing | bool | 是否异步处理 | False |

#### `add_document_from_text` 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| text | str | 文档文本内容 | 必填 |
| title | str | 文档标题 | "Untitled" |
| metadata | dict | 文档元数据 | {} |
| chunk_size | int | 文档分块大小 | 1000 |
| chunk_overlap | int | 块重叠字符数 | 100 |
| custom_id | str | 自定义文档ID | None |

#### `add_document_from_url` 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| url | str | 文档URL | 必填 |
| metadata | dict | 文档元数据 | {} |
| chunk_size | int | 文档分块大小 | 1000 |
| chunk_overlap | int | 块重叠字符数 | 100 |
| custom_id | str | 自定义文档ID | None |
| async_processing | bool | 是否异步处理 | False |

#### 返回值

返回添加的文档ID：

```
"doc-789"
```

### 获取文档列表

```python
# 获取知识库中的所有文档
docs = kb.list_documents()

# 使用过滤和分页
docs = kb.list_documents(
    metadata_filter={"department": "研发部"},
    offset=0,
    limit=10,
    sort_by="created_at",
    sort_order="desc"
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| metadata_filter | dict | 元数据过滤条件 | None |
| offset | int | 分页偏移量 | 0 |
| limit | int | 最大返回数量 | 100 |
| sort_by | str | 排序字段 | "created_at" |
| sort_order | str | 排序方向 | "desc" |

#### 返回值

返回文档信息列表：

```json
[
  {
    "id": "doc-789",
    "title": "产品规格说明书",
    "metadata": {
      "author": "张三",
      "department": "研发部",
      "tags": ["产品规格", "技术文档"]
    },
    "created_at": "2023-08-05T11:22:33Z",
    "updated_at": "2023-08-05T11:22:33Z",
    "chunk_count": 15,
    "status": "processed"
  },
  // 更多文档...
]
```

### 获取文档

```python
# 获取文档详情
doc = kb.get_document("doc-789")
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| doc_id | str | 文档ID | 必填 |

#### 返回值

返回文档信息，包含与上述列表项相同的字段，以及额外的内容信息：

```json
{
  "id": "doc-789",
  "title": "产品规格说明书",
  "content": "产品规格说明书的完整内容...",
  "metadata": {
    "author": "张三",
    "department": "研发部",
    "tags": ["产品规格", "技术文档"]
  },
  "created_at": "2023-08-05T11:22:33Z",
  "updated_at": "2023-08-05T11:22:33Z",
  "chunk_count": 15,
  "status": "processed",
  "file_type": "pdf",
  "file_size": 1245678
}
```

### 更新文档

```python
# 更新文档元数据
updated_doc = kb.update_document(
    doc_id="doc-789",
    metadata={
        "author": "李四",
        "department": "研发部",
        "tags": ["产品规格", "技术文档", "API参考"],
        "version": "2.0"
    }
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| doc_id | str | 文档ID | 必填 |
| metadata | dict | 新的元数据(将替换原有) | None |
| title | str | 新的文档标题 | None |

#### 返回值

返回更新后的文档信息。

### 删除文档

```python
# 删除文档
kb.delete_document("doc-789")
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| doc_id | str | 文档ID | 必填 |

#### 返回值

成功删除返回`True`，否则抛出异常。

## 检索API

### 基本查询

```python
# 执行基本查询
results = kb.query(
    query="公司的退款政策是什么?",
    top_k=5
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| query | str | 查询内容 | 必填 |
| top_k | int | 返回结果数量 | 5 |
| similarity_threshold | float | 相似度阈值(0-1) | 0.7 |
| metadata_filter | dict | 元数据过滤条件 | None |
| use_cache | bool | 是否使用缓存 | True |

#### 返回值

返回查询结果列表：

```json
[
  {
    "chunk_id": "chunk-12345",
    "document_id": "doc-789",
    "content": "公司的退款政策规定客户在购买后30天内可以申请全额退款，30天后至90天可以申请部分退款...",
    "metadata": {
      "title": "客户服务政策",
      "author": "客服部",
      "tags": ["退款", "客户服务"]
    },
    "score": 0.92,
    "location": {
      "page": 3,
      "paragraph": 2
    }
  },
  // 更多结果...
]
```

### 高级查询

```python
# 执行高级查询
results = kb.advanced_query(
    query="公司的退款政策是什么?",
    retrieval_strategy="hybrid",
    params={
        "vector_weight": 0.7,
        "keyword_weight": 0.3,
        "top_k": 10,
        "rerank": True,
        "rerank_top_k": 5
    },
    metadata_filter={
        "tags": {"$contains": "客户服务"}
    }
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| query | str | 查询内容 | 必填 |
| retrieval_strategy | str | 检索策略("vector", "keyword", "hybrid") | "vector" |
| params | dict | 检索参数 | {} |
| metadata_filter | dict | 元数据过滤条件 | None |
| include_metadata | bool | 是否包含元数据 | True |
| session_id | str | 会话ID(用于上下文感知查询) | None |
| use_context | bool | 是否使用上下文 | False |

`params`字典可包含以下键：

- `vector_weight`: 向量检索权重(0-1)
- `keyword_weight`: 关键词检索权重(0-1)
- `top_k`: 返回结果数量
- `similarity_threshold`: 相似度阈值(0-1)
- `rerank`: 是否重排序结果
- `rerank_top_k`: 重排序后返回的结果数量
- `rerank_model`: 重排序使用的模型

#### 返回值

返回高级查询结果，格式与基本查询类似。

### 会话感知查询

```python
# 创建会话
session_id = kb.create_session(user_id="user-123")

# 第一次查询
results1 = kb.query(
    query="公司的数据隐私政策是什么?",
    session_id=session_id
)

# 后续查询(使用上下文)
results2 = kb.query(
    query="它如何保护客户数据?",
    session_id=session_id,
    use_context=True
)
```

#### 创建会话参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| user_id | str | 用户标识 | 必填 |
| metadata | dict | 会话元数据 | {} |
| ttl | int | 会话存活时间(秒) | 3600 |

#### 返回值

返回会话ID：

```
"session-456"
```

### 向量搜索

```python
# 使用向量进行搜索
vector = embeddings_model.embed_query("客户反馈分析")
results = kb.vector_search(
    vector=vector,
    top_k=5,
    namespace="customer_docs"
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| vector | list | 查询向量 | 必填 |
| top_k | int | 返回结果数量 | 5 |
| namespace | str | 命名空间 | None |
| metadata_filter | dict | 元数据过滤条件 | None |
| similarity_threshold | float | 相似度阈值(0-1) | 0.7 |

#### 返回值

返回向量搜索结果，格式与基本查询类似。

## 索引管理

### 配置索引

```python
# 配置向量索引
kb.configure_index(
    index_type="hnsw",
    params={
        "M": 16,
        "ef_construction": 200,
        "ef_search": 100
    }
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| index_type | str | 索引类型("flat", "ivf", "hnsw", "ivf_pq") | "hnsw" |
| params | dict | 索引参数 | {} |

#### 返回值

成功配置返回`True`，否则抛出异常。

### 重建索引

```python
# 重建向量索引
kb.rebuild_index()
```

#### 参数

无参数。

#### 返回值

成功重建返回`True`，否则抛出异常。

### 获取索引状态

```python
# 获取索引状态
status = kb.get_index_status()
```

#### 参数

无参数。

#### 返回值

返回索引状态信息：

```json
{
  "index_type": "hnsw",
  "index_params": {
    "M": 16,
    "ef_construction": 200,
    "ef_search": 100
  },
  "total_vectors": 12345,
  "last_updated": "2023-08-10T15:30:45Z",
  "status": "ready"
}
```

## 批处理操作

### 批量添加文档

```python
# 使用批处理添加多个文档
with kb.batch_operation(batch_size=100) as batch:
    for file_path in document_paths:
        batch.add_document(
            file_path=file_path,
            metadata=get_metadata_for_file(file_path)
        )
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| batch_size | int | 批处理大小 | 50 |
| enable_auto_flush | bool | 是否自动刷新 | True |

#### 返回值

返回一个批处理上下文管理器，可在其中执行批量操作。

## 高级API

### 多模态查询

```python
# 使用图像和文本进行查询
import base64

# 读取图像文件并转为base64
with open("query_image.jpg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode("utf-8")

# 执行多模态查询
results = kb.multimodal_query(
    text_query="这个图表显示了什么趋势?",
    image_data=image_base64,
    top_k=5
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| text_query | str | 文本查询 | 必填 |
| image_data | str | Base64编码的图像数据 | 必填 |
| top_k | int | 返回结果数量 | 5 |
| metadata_filter | dict | 元数据过滤条件 | None |

#### 返回值

返回多模态查询结果，格式与基本查询类似。

### 获取性能指标

```python
# 获取性能指标
metrics = client.get_performance_metrics(
    time_range="last_7_days",
    metrics=["avg_latency", "p95_latency", "throughput", "cache_hit_rate"]
)
```

#### 参数

| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| time_range | str | 时间范围 | "last_24_hours" |
| metrics | list | 要获取的指标列表 | None |

#### 返回值

返回指定指标的值：

```json
{
  "avg_latency": 120.5,
  "p95_latency": 350.2,
  "throughput": 45.8,
  "cache_hit_rate": 0.75
}
```

## 错误处理

MaxKB API可能返回以下错误类型：

| 错误类 | HTTP状态码 | 说明 |
|-------|----------|------|
| MaxKBAuthError | 401 | 认证错误，API密钥无效 |
| MaxKBNotFoundError | 404 | 资源未找到 |
| MaxKBValidationError | 400 | 请求参数验证失败 |
| MaxKBRateLimitError | 429 | 超出API请求速率 |
| MaxKBServerError | 500 | 服务器内部错误 |
| MaxKBTimeoutError | N/A | 请求超时 |

错误处理示例：

```python
from maxkb.exceptions import MaxKBNotFoundError, MaxKBServerError

try:
    kb = client.get_knowledge_base("non-existent-kb")
except MaxKBNotFoundError as e:
    print(f"知识库不存在: {e}")
except MaxKBServerError as e:
    print(f"服务器错误: {e}")
except Exception as e:
    print(f"其他错误: {e}")
```

## 使用技巧

1. **批量操作** - 对于大量文档，使用批处理API提高效率
2. **缓存配置** - 配置适当的缓存策略减少API调用
3. **异步处理** - 大文件处理使用异步模式
4. **错误重试** - 实现指数退避重试策略处理临时错误
5. **结果过滤** - 使用元数据过滤缩小检索范围
6. **会话管理** - 对话应用使用会话感知查询
7. **监控性能** - 定期检查性能指标优化使用

## API限制

| 限制类型 | 免费账户 | 标准账户 | 企业账户 |
|---------|---------|---------|---------|
| 最大知识库数量 | 3 | 20 | 无限制 |
| 每月API调用次数 | 1,000 | 50,000 | 自定义 |
| 最大文档大小 | 10MB | 50MB | 200MB |
| 最大文档数/知识库 | 100 | 10,000 | 无限制 |
| 并发请求数 | 5 | 20 | 自定义 |

超出限制处理：
- API调用超出配额将返回429错误
- 文档大小超出限制将返回400错误
- 知识库或文档数量超出限制将返回403错误 