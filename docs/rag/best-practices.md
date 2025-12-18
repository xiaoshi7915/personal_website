---
sidebar_position: 4
---

# RAG最佳实践

本文档总结了构建高效RAG（检索增强生成）系统的最佳实践。

## 文档处理最佳实践

### 1. 文档分块策略

#### 智能分块

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 根据文档类型选择分块策略
def get_text_splitter(doc_type: str):
    if doc_type == "code":
        return RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
    elif doc_type == "markdown":
        return RecursiveCharacterTextSplitter(
            chunk_size=2000,
            chunk_overlap=300,
            separators=["\n## ", "\n### ", "\n", " "]
        )
    else:
        return RecursiveCharacterTextSplitter(
            chunk_size=1500,
            chunk_overlap=200
        )
```

### 2. 元数据管理

#### 丰富的元数据

```python
def create_chunk_with_metadata(text: str, source: str, page: int):
    return {
        "text": text,
        "metadata": {
            "source": source,
            "page": page,
            "chunk_index": 0,
            "timestamp": datetime.now().isoformat(),
            "doc_type": "pdf"
        }
    }
```

## 检索最佳实践

### 1. 混合检索策略

#### 结合多种检索方法

```python
from langchain.retrievers import BM25Retriever, EnsembleRetriever
from langchain.vectorstores import FAISS

def create_hybrid_retriever(vectorstore, documents):
    # 向量检索
    vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    
    # 关键词检索
    bm25_retriever = BM25Retriever.from_documents(documents)
    bm25_retriever.k = 5
    
    # 混合检索
    ensemble_retriever = EnsembleRetriever(
        retrievers=[vector_retriever, bm25_retriever],
        weights=[0.7, 0.3]
    )
    
    return ensemble_retriever
```

### 2. 查询重写

#### 优化查询

```python
def rewrite_query(original_query: str, context: dict) -> str:
    """根据上下文重写查询"""
    # 扩展查询
    expanded_query = expand_query_with_synonyms(original_query)
    
    # 添加上下文信息
    if context.get("domain"):
        expanded_query += f" in {context['domain']}"
    
    return expanded_query
```

## 生成最佳实践

### 1. Prompt工程

#### 优化的Prompt模板

```python
RAG_PROMPT_TEMPLATE = """基于以下上下文信息回答问题。如果上下文中没有相关信息，请说明无法回答。

上下文：
{context}

问题：{question}

回答："""
```

### 2. 答案验证

#### 验证生成答案

```python
def validate_answer(answer: str, context: list, question: str) -> bool:
    """验证答案质量"""
    # 检查答案是否基于上下文
    if not any(term in answer.lower() for term in extract_key_terms(context)):
        return False
    
    # 检查答案长度
    if len(answer) < 20 or len(answer) > 2000:
        return False
    
    # 检查是否包含"我不知道"等拒绝回答
    if any(phrase in answer.lower() for phrase in ["不知道", "无法回答", "没有信息"]):
        return True  # 这是合理的拒绝
    
    return True
```

## 性能优化

### 1. 缓存策略

#### 多级缓存

```python
from functools import lru_cache
import redis

class RAGCache:
    def __init__(self):
        self.memory_cache = {}
        self.redis_client = redis.Redis()
    
    async def get(self, key: str):
        # L1: 内存缓存
        if key in self.memory_cache:
            return self.memory_cache[key]
        
        # L2: Redis缓存
        cached = self.redis_client.get(key)
        if cached:
            result = json.loads(cached)
            self.memory_cache[key] = result
            return result
        
        return None
    
    async def set(self, key: str, value, ttl=3600):
        self.memory_cache[key] = value
        self.redis_client.setex(key, ttl, json.dumps(value))
```

### 2. 异步处理

#### 并行检索

```python
import asyncio

async def parallel_retrieval(query: str, retrievers: list):
    """并行执行多个检索器"""
    tasks = [retriever.aretrieve(query) for retriever in retrievers]
    results = await asyncio.gather(*tasks)
    return merge_results(results)
```

## 评估和监控

### 1. 评估指标

#### 全面的评估

```python
def evaluate_rag_system(query: str, answer: str, ground_truth: str):
    """评估RAG系统性能"""
    metrics = {
        "relevance": calculate_relevance(answer, query),
        "accuracy": calculate_accuracy(answer, ground_truth),
        "coherence": calculate_coherence(answer),
        "completeness": calculate_completeness(answer, ground_truth)
    }
    return metrics
```

### 2. 监控和日志

#### 详细日志记录

```python
import logging

logger = logging.getLogger("rag_system")

def log_rag_request(query: str, retrieved_docs: list, answer: str, latency: float):
    logger.info({
        "event": "rag_request",
        "query": query,
        "retrieved_count": len(retrieved_docs),
        "answer_length": len(answer),
        "latency_ms": latency * 1000
    })
```

## 安全最佳实践

### 1. 数据隐私

#### 敏感信息过滤

```python
import re

def filter_sensitive_info(text: str) -> str:
    """过滤敏感信息"""
    # 邮箱
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    
    # 手机号
    text = re.sub(r'\b1[3-9]\d{9}\b', '[PHONE]', text)
    
    # 身份证号
    text = re.sub(r'\b\d{17}[\dXx]\b', '[ID]', text)
    
    return text
```

### 2. 访问控制

#### 权限管理

```python
def check_access_permission(user_id: str, document_id: str) -> bool:
    """检查用户是否有权限访问文档"""
    user_permissions = get_user_permissions(user_id)
    document_permissions = get_document_permissions(document_id)
    
    return bool(set(user_permissions) & set(document_permissions))
```

## 总结

遵循这些最佳实践可以：

1. **提高检索准确性**：通过混合检索和查询优化
2. **改善生成质量**：通过Prompt工程和答案验证
3. **优化性能**：通过缓存和异步处理
4. **确保安全**：通过数据隐私保护和访问控制
5. **持续改进**：通过评估和监控

