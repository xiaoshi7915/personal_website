---
sidebar_position: 8
title: 从零到一：构建向量数据库应用
description: 一个完整的教程，从环境搭建到部署上线的向量数据库应用开发全流程
---

# 从零到一：构建向量数据库应用

本教程将带您从零开始，使用向量数据库构建一个完整的相似度搜索系统。我们将创建一个**智能文档检索系统**，能够快速找到相似的文档。

## 项目概述

### 功能特性

- ✅ 文档向量化
- ✅ 相似度搜索
- ✅ 批量导入
- ✅ 元数据过滤
- ✅ Web界面
- ✅ API接口

### 技术栈

- **向量数据库**：ChromaDB / Pinecone / Milvus
- **嵌入模型**：OpenAI Embeddings / BGE
- **后端**：Python 3.11+ + FastAPI
- **前端**：React + TypeScript

## 第一步：环境准备

### 1.1 选择向量数据库

#### 选项1：ChromaDB（本地部署，简单易用）

```bash
pip install chromadb
```

#### 选项2：Pinecone（云端服务，高性能）

```bash
pip install pinecone-client
```

#### 选项3：Milvus（分布式，大规模）

```bash
# 使用Docker部署
docker run -d --name milvus -p 19530:19530 milvusdb/milvus:latest
```

### 1.2 安装依赖

创建 `requirements.txt`：

```txt
chromadb>=0.4.0
openai>=1.0.0
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.5.0
python-dotenv>=1.0.0
```

## 第二步：实现核心功能

### 2.1 使用ChromaDB (`src/vector_db_chroma.py`)

```python
"""ChromaDB向量数据库实现"""
import chromadb
from chromadb.config import Settings
from langchain_openai import OpenAIEmbeddings
from typing import List, Dict

class ChromaVectorDB:
    """ChromaDB向量数据库"""
    
    def __init__(self, persist_directory="./chroma_db"):
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=persist_directory
        ))
        self.embeddings = OpenAIEmbeddings()
        self.collection = None
    
    def create_collection(self, collection_name: str):
        """创建集合"""
        self.collection = self.client.create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        return self.collection
    
    def add_documents(self, texts: List[str], metadatas: List[Dict], ids: List[str]):
        """添加文档"""
        # 生成嵌入向量
        embeddings = self.embeddings.embed_documents(texts)
        
        # 添加到集合
        self.collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
    
    def search(self, query: str, n_results: int = 5):
        """搜索相似文档"""
        # 生成查询向量
        query_embedding = self.embeddings.embed_query(query)
        
        # 搜索
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        return results
```

### 2.2 使用Pinecone (`src/vector_db_pinecone.py`)

```python
"""Pinecone向量数据库实现"""
import pinecone
from langchain_openai import OpenAIEmbeddings
from typing import List, Dict

class PineconeVectorDB:
    """Pinecone向量数据库"""
    
    def __init__(self, api_key: str, environment: str, index_name: str):
        pinecone.init(api_key=api_key, environment=environment)
        self.index = pinecone.Index(index_name)
        self.embeddings = OpenAIEmbeddings()
    
    def add_documents(self, texts: List[str], metadatas: List[Dict], ids: List[str]):
        """添加文档"""
        # 生成嵌入向量
        embeddings = self.embeddings.embed_documents(texts)
        
        # 准备数据
        vectors = []
        for i, (text, metadata, doc_id) in enumerate(zip(texts, metadatas, ids)):
            vectors.append({
                "id": doc_id,
                "values": embeddings[i],
                "metadata": {**metadata, "text": text}
            })
        
        # 批量插入
        self.index.upsert(vectors=vectors)
    
    def search(self, query: str, top_k: int = 5, filter_dict: Dict = None):
        """搜索相似文档"""
        # 生成查询向量
        query_embedding = self.embeddings.embed_query(query)
        
        # 搜索
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            filter=filter_dict
        )
        
        return results
```

### 2.3 API接口 (`src/api.py`)

```python
"""FastAPI应用"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

from src.vector_db_chroma import ChromaVectorDB

app = FastAPI(title="向量数据库API")

# 初始化向量数据库
vector_db = ChromaVectorDB()
vector_db.create_collection("documents")

class DocumentAdd(BaseModel):
    texts: List[str]
    metadatas: List[Dict]
    ids: List[str]

class SearchRequest(BaseModel):
    query: str
    n_results: int = 5
    filter: Optional[Dict] = None

@app.post("/add")
async def add_documents(doc: DocumentAdd):
    """添加文档"""
    try:
        vector_db.add_documents(
            texts=doc.texts,
            metadatas=doc.metadatas,
            ids=doc.ids
        )
        return {"message": "文档添加成功", "count": len(doc.texts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search(request: SearchRequest):
    """搜索相似文档"""
    try:
        results = vector_db.search(
            query=request.query,
            n_results=request.n_results
        )
        return {
            "query": request.query,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 第三步：性能优化

### 3.1 批量处理

```python
def batch_add_documents(vector_db, texts, metadatas, ids, batch_size=100):
    """批量添加文档"""
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i+batch_size]
        batch_metadatas = metadatas[i:i+batch_size]
        batch_ids = ids[i:i+batch_size]
        
        vector_db.add_documents(
            texts=batch_texts,
            metadatas=batch_metadatas,
            ids=batch_ids
        )
```

### 3.2 索引优化

```python
# ChromaDB索引优化
collection = client.create_collection(
    name="documents",
    metadata={
        "hnsw:space": "cosine",  # 使用余弦相似度
        "hnsw:M": 16,  # 调整索引参数
        "hnsw:ef_construction": 200
    }
)
```

## 第四步：部署

### 4.1 Docker部署

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 总结

本教程展示了如何构建向量数据库应用：

1. 选择向量数据库
2. 实现核心功能
3. API接口开发
4. 性能优化
5. 部署

向量数据库是构建RAG应用的基础，选择合适的向量数据库和优化策略对应用性能至关重要。

