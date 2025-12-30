---
sidebar_position: 6
title: 向量数据库实战案例
description: 向量数据库的实际应用案例，从零到一构建完整的向量数据库应用
---

# 向量数据库实战案例

本文档提供了多个完整的向量数据库实战案例，帮助您从零开始构建向量数据库应用。

## 案例1：文档检索系统

### 项目概述

构建一个基于向量数据库的文档检索系统，能够快速检索相似文档。

### 技术栈

- **向量数据库**：ChromaDB
- **嵌入模型**：sentence-transformers
- **框架**：Python + FastAPI

### 实施步骤

#### 步骤1：环境准备

```bash
pip install chromadb sentence-transformers fastapi uvicorn
```

#### 步骤2：创建向量数据库

```python
import chromadb
from sentence_transformers import SentenceTransformer
from chromadb.config import Settings

# 初始化ChromaDB
client = chromadb.Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory="./chroma_db"
))

# 创建集合
collection = client.create_collection(
    name="documents",
    metadata={"hnsw:space": "cosine"}
)

# 加载嵌入模型
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
```

#### 步骤3：添加文档

```python
def add_documents(documents, collection, model):
    """添加文档到向量数据库"""
    # 生成嵌入向量
    embeddings = model.encode(documents).tolist()
    
    # 生成ID
    ids = [f"doc_{i}" for i in range(len(documents))]
    
    # 添加到集合
    collection.add(
        embeddings=embeddings,
        documents=documents,
        ids=ids
    )
    
    print(f"已添加 {len(documents)} 个文档")

# 使用示例
documents = [
    "人工智能是计算机科学的一个分支",
    "机器学习是人工智能的一个子领域",
    "深度学习使用神经网络进行学习",
    "自然语言处理是AI的重要应用领域"
]

add_documents(documents, collection, model)
```

#### 步骤4：检索文档

```python
def search_documents(query, collection, model, n_results=3):
    """检索相似文档"""
    # 生成查询向量
    query_embedding = model.encode([query]).tolist()
    
    # 搜索
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
        include=["documents", "distances", "metadatas"]
    )
    
    return results

# 使用示例
query = "什么是机器学习？"
results = search_documents(query, collection, model)

print(f"查询: {query}")
print("\n检索结果:")
for i, (doc, distance) in enumerate(zip(results['documents'][0], results['distances'][0])):
    print(f"{i+1}. {doc} (相似度: {1-distance:.4f})")
```

## 案例2：RAG知识库系统

### 项目概述

构建一个RAG（检索增强生成）知识库系统，结合向量数据库和LLM。

### 实施步骤

```python
from langchain.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.llms import OpenAI
from langchain.chains import RetrievalQA

# 初始化嵌入模型
embeddings = HuggingFaceEmbeddings(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)

# 加载文档
from langchain.document_loaders import TextLoader
loader = TextLoader("knowledge_base.txt")
documents = loader.load()

# 分割文档
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
texts = text_splitter.split_documents(documents)

# 创建向量数据库
vectorstore = Chroma.from_documents(
    documents=texts,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# 创建检索链
llm = OpenAI(temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3})
)

# 使用示例
query = "如何使用向量数据库？"
answer = qa_chain.run(query)
print(f"问题: {query}")
print(f"答案: {answer}")
```

## 案例3：相似图片检索

### 项目概述

使用向量数据库进行相似图片检索。

### 实施步骤

```python
import chromadb
from PIL import Image
import torch
from torchvision import transforms
from torchvision.models import resnet50

# 加载预训练模型
model = resnet50(pretrained=True)
model.eval()

# 图像预处理
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def extract_image_features(image_path):
    """提取图像特征向量"""
    image = Image.open(image_path).convert('RGB')
    image_tensor = transform(image).unsqueeze(0)
    
    with torch.no_grad():
        features = model(image_tensor)
        # 使用全局平均池化
        features = torch.nn.functional.adaptive_avg_pool2d(features, (1, 1))
        features = features.squeeze().numpy()
    
    return features.tolist()

# 初始化向量数据库
client = chromadb.Client()
collection = client.create_collection(name="images")

# 添加图片
image_paths = ["image1.jpg", "image2.jpg", "image3.jpg"]
for i, path in enumerate(image_paths):
    features = extract_image_features(path)
    collection.add(
        embeddings=[features],
        ids=[f"img_{i}"],
        metadatas=[{"path": path}]
    )

# 检索相似图片
query_image_path = "query.jpg"
query_features = extract_image_features(query_image_path)

results = collection.query(
    query_embeddings=[query_features],
    n_results=5
)

print("相似图片:")
for i, (img_id, distance) in enumerate(zip(results['ids'][0], results['distances'][0])):
    print(f"{i+1}. {img_id} (距离: {distance:.4f})")
```

## 案例4：推荐系统

### 项目概述

构建一个基于向量相似度的推荐系统。

### 实施步骤

```python
import chromadb
import numpy as np
from sentence_transformers import SentenceTransformer

# 初始化
client = chromadb.Client()
collection = client.create_collection(name="products")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

# 产品数据
products = [
    {"id": "p1", "name": "智能手机", "description": "高性能智能手机，支持5G"},
    {"id": "p2", "name": "笔记本电脑", "description": "轻薄便携，适合办公"},
    {"id": "p3", "name": "平板电脑", "description": "大屏幕，适合娱乐"},
    # ... 更多产品
]

# 添加产品到向量数据库
for product in products:
    embedding = model.encode(product["description"]).tolist()
    collection.add(
        embeddings=[embedding],
        ids=[product["id"]],
        documents=[product["description"]],
        metadatas=[{"name": product["name"]}]
    )

def recommend_products(user_preference, collection, model, n_results=5):
    """根据用户偏好推荐产品"""
    # 生成用户偏好向量
    preference_embedding = model.encode([user_preference]).tolist()
    
    # 检索相似产品
    results = collection.query(
        query_embeddings=preference_embedding,
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )
    
    recommendations = []
    for i, (doc_id, metadata, distance) in enumerate(zip(
        results['ids'][0],
        results['metadatas'][0],
        results['distances'][0]
    )):
        recommendations.append({
            "id": doc_id,
            "name": metadata["name"],
            "similarity": 1 - distance
        })
    
    return recommendations

# 使用示例
user_preference = "我需要一个便携的设备用于办公"
recommendations = recommend_products(user_preference, collection, model)

print("推荐产品:")
for rec in recommendations:
    print(f"- {rec['name']} (相似度: {rec['similarity']:.4f})")
```

## 案例5：语义搜索系统

### 项目概述

构建一个语义搜索系统，支持自然语言查询。

### 实施步骤

```python
import chromadb
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
client = chromadb.Client()
collection = client.get_or_create_collection(name="search_index")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

class SearchRequest(BaseModel):
    query: str
    n_results: int = 5

@app.post("/search")
async def search(request: SearchRequest):
    """语义搜索接口"""
    # 生成查询向量
    query_embedding = model.encode([request.query]).tolist()
    
    # 搜索
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=request.n_results,
        include=["documents", "distances", "metadatas"]
    )
    
    # 格式化结果
    search_results = []
    for i, (doc, distance, metadata) in enumerate(zip(
        results['documents'][0],
        results['distances'][0],
        results['metadatas'][0]
    )):
        search_results.append({
            "rank": i + 1,
            "content": doc,
            "score": 1 - distance,
            "metadata": metadata
        })
    
    return {
        "query": request.query,
        "results": search_results,
        "total": len(search_results)
    }

# 启动服务
# uvicorn main:app --reload
```

## 最佳实践

1. **选择合适的嵌入模型**：根据语言和任务选择模型
2. **优化索引参数**：根据数据规模调整HNSW参数
3. **批量操作**：使用批量插入提高性能
4. **定期维护**：定期重建索引和清理数据
5. **监控性能**：监控查询延迟和准确率

## 相关资源

- [向量数据库原理](/docs/vector-database/principles)
- [RAG技术](/docs/rag/intro)
- [开发指南](/docs/vector-database/development)

