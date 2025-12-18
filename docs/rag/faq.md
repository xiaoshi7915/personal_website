---
sidebar_position: 5
---

# RAG常见问题

本文档收集了RAG（检索增强生成）系统开发和使用中的常见问题。

## 基础问题

### Q1: RAG和传统检索有什么区别？

**A:** 主要区别：

- **RAG**：检索 + 生成，结合检索到的信息生成答案
- **传统检索**：只返回相关文档，不生成答案
- **RAG优势**：可以综合多个文档信息，生成更准确的答案

### Q2: 如何选择向量数据库？

**A:** 选择建议：

- **小规模（少于100万向量）**：FAISS, Chroma
- **中等规模（100万-1亿）**：Pinecone, Weaviate
- **大规模（超过1亿）**：Milvus, Qdrant
- **考虑因素**：性能、成本、易用性、功能

### Q3: 如何选择嵌入模型？

**A:** 模型选择：

- **中文场景**：text2vec-chinese, BGE-large-zh
- **多语言场景**：multilingual-e5-large, BGE-M3
- **代码场景**：codebert, StarCoder
- **考虑因素**：语言、领域、模型大小、性能

## 检索问题

### Q4: 如何提高检索准确性？

**A:** 改进方法：

1. **优化分块策略**
```python
# 使用语义分块而不是固定大小
text_splitter = SemanticChunker(embeddings)
```

2. **混合检索**
```python
# 结合向量检索和关键词检索
retriever = EnsembleRetriever([vector_retriever, bm25_retriever])
```

3. **查询扩展**
```python
# 扩展查询词
expanded_query = expand_query_with_synonyms(query)
```

### Q5: 如何处理检索结果过多或过少？

**A:** 动态调整：

```python
def adaptive_retrieval(query: str, initial_k: int = 5):
    results = retriever.retrieve(query, k=initial_k)
    
    # 如果结果相关性低，增加k
    if max([r.score for r in results]) < 0.7:
        results = retriever.retrieve(query, k=initial_k * 2)
    
    # 如果结果过多，过滤低相关性
    filtered = [r for r in results if r.score > 0.5]
    
    return filtered[:initial_k]
```

### Q6: 如何解决检索到无关文档？

**A:** 解决方案：

1. **提高阈值**
```python
retriever = vectorstore.as_retriever(
    search_kwargs={"k": 5, "score_threshold": 0.7}
)
```

2. **重排序**
```python
from langchain.retrievers import ContextualCompressionRetriever

compressor = LLMChainExtractor.from_llm(llm)
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=retriever
)
```

## 生成问题

### Q7: 如何避免生成幻觉（Hallucination）？

**A:** 预防措施：

1. **严格基于上下文**
```python
prompt = """只使用以下上下文回答问题。如果上下文没有相关信息，请说"我不知道"。

上下文：{context}
问题：{question}
回答："""
```

2. **引用来源**
```python
def generate_with_citations(context: list, question: str):
    answer = llm.generate(prompt)
    citations = [doc.metadata['source'] for doc in context]
    return f"{answer}\n\n来源：{', '.join(citations)}"
```

### Q8: 如何提高生成答案的质量？

**A:** 优化方法：

1. **更好的Prompt**
```python
# 结构化Prompt
prompt = """你是一个专业的助手。请基于以下上下文回答问题。

上下文：
{context}

问题：{question}

要求：
1. 答案要准确、完整
2. 如果上下文信息不足，请说明
3. 使用清晰的语言

回答："""
```

2. **多轮生成**
```python
def multi_round_generation(query: str, context: list):
    # 第一轮：生成初稿
    draft = generate_answer(query, context)
    
    # 第二轮：优化答案
    refined = refine_answer(draft, query, context)
    
    return refined
```

## 性能问题

### Q9: RAG系统响应慢怎么办？

**A:** 优化策略：

1. **缓存常见查询**
```python
@lru_cache(maxsize=1000)
def cached_retrieval(query: str):
    return retriever.retrieve(query)
```

2. **异步处理**
```python
async def async_rag(query: str):
    # 并行检索和生成
    docs, answer = await asyncio.gather(
        retriever.aretrieve(query),
        llm.agenerate(prompt)
    )
    return answer
```

3. **批量处理**
```python
def batch_retrieval(queries: list):
    # 批量检索
    return retriever.retrieve_batch(queries)
```

### Q10: 如何优化向量数据库查询性能？

**A:** 性能优化：

1. **索引优化**
```python
# 使用HNSW索引
vectorstore = FAISS.from_documents(
    documents,
    embeddings,
    index_type="HNSW"
)
```

2. **减少向量维度**
```python
# 使用PCA降维
from sklearn.decomposition import PCA
pca = PCA(n_components=256)
reduced_embeddings = pca.fit_transform(embeddings)
```

## 部署问题

### Q11: 如何部署RAG系统到生产环境？

**A:** 部署方案：

1. **容器化部署**
```dockerfile
FROM python:3.11
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . /app
WORKDIR /app
CMD ["python", "rag_server.py"]
```

2. **使用API服务**
```python
from fastapi import FastAPI
app = FastAPI()

@app.post("/rag/query")
async def rag_query(query: str):
    docs = retriever.retrieve(query)
    answer = generate_answer(query, docs)
    return {"answer": answer, "sources": docs}
```

### Q12: 如何监控RAG系统？

**A:** 监控指标：

```python
def monitor_rag_system(query: str, answer: str, latency: float):
    metrics = {
        "query_length": len(query),
        "answer_length": len(answer),
        "latency_ms": latency * 1000,
        "retrieved_docs": len(retrieved_docs),
        "timestamp": datetime.now()
    }
    # 发送到监控系统
    send_to_monitoring(metrics)
```

## 常见错误

### Q13: "No module named 'langchain'"

**A:** 解决方案：
```bash
pip install langchain
# 或使用特定版本
pip install langchain==0.1.0
```

### Q14: 向量维度不匹配错误

**A:** 解决方法：
```python
# 确保嵌入模型和向量数据库使用相同的维度
embeddings = OpenAIEmbeddings()
# 检查维度
dimension = len(embeddings.embed_query("test"))
# 创建向量数据库时指定维度
vectorstore = FAISS.from_documents(docs, embeddings)
```

### Q15: 内存不足错误

**A:** 优化方案：

1. **分批处理**
```python
def process_in_batches(documents, batch_size=100):
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i+batch_size]
        process_batch(batch)
```

2. **使用外部向量数据库**
```python
# 使用Pinecone等云服务
vectorstore = Pinecone.from_documents(docs, embeddings)
```

## 最佳实践问题

### Q16: 如何评估RAG系统效果？

**A:** 评估方法：

1. **人工评估**
   - 相关性评分
   - 准确性评分
   - 完整性评分

2. **自动评估**
```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

result = evaluate(
    dataset=dataset,
    metrics=[faithfulness, answer_relevancy]
)
```

### Q17: 如何处理多轮对话？

**A:** 对话管理：

```python
class ConversationManager:
    def __init__(self):
        self.history = []
    
    def add_to_history(self, query: str, answer: str):
        self.history.append({"query": query, "answer": answer})
    
    def get_contextual_query(self, current_query: str):
        # 结合历史上下文
        context = " ".join([h["query"] for h in self.history[-3:]])
        return f"{context} {current_query}"
```

---

**最后更新**: 2025年12月

