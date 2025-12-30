---
sidebar_position: 8
title: 从零到一：构建LangChain应用
description: 一个完整的教程，从环境搭建到部署上线的LangChain应用开发全流程
---

# 从零到一：构建LangChain应用

本教程将带您从零开始，使用LangChain框架构建一个完整的AI应用。我们将创建一个**智能文档问答系统**，能够基于企业内部文档回答用户问题。

## 项目概述

### 功能特性

- ✅ 文档上传和解析
- ✅ 文档向量化和存储
- ✅ 智能检索
- ✅ 基于检索的问答
- ✅ Web界面
- ✅ API接口

### 技术栈

- **框架**：LangChain
- **后端**：Python 3.11+ + FastAPI
- **向量数据库**：ChromaDB
- **嵌入模型**：OpenAI Embeddings
- **LLM**：OpenAI GPT-4
- **前端**：React + TypeScript

## 第一步：环境准备

### 1.1 创建项目目录

```bash
mkdir langchain-doc-qa
cd langchain-doc-qa
```

### 1.2 创建虚拟环境

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 1.3 安装依赖

创建 `requirements.txt`：

```txt
langchain>=0.1.0
langchain-openai>=0.0.5
langchain-community>=0.0.20
chromadb>=0.4.0
fastapi>=0.104.0
uvicorn>=0.24.0
pypdf2>=3.0.0
python-dotenv>=1.0.0
pydantic>=2.5.0
```

安装依赖：

```bash
pip install -r requirements.txt
```

## 第二步：实现核心功能

### 2.1 文档加载器 (`src/loaders.py`)

```python
"""文档加载器"""
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.document_loaders import DirectoryLoader
from pathlib import Path

class DocumentLoader:
    """文档加载器"""
    
    def load_pdf(self, file_path: str):
        """加载PDF文件"""
        loader = PyPDFLoader(file_path)
        return loader.load()
    
    def load_directory(self, directory: str, glob_pattern: str = "**/*.pdf"):
        """加载目录中的所有PDF文件"""
        loader = DirectoryLoader(
            directory,
            glob=glob_pattern,
            loader_cls=PyPDFLoader
        )
        return loader.load()
```

### 2.2 文档分割 (`src/splitters.py`)

```python
"""文档分割器"""
from langchain.text_splitter import RecursiveCharacterTextSplitter

class DocumentSplitter:
    """文档分割器"""
    
    def __init__(self, chunk_size=1000, chunk_overlap=200):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )
    
    def split_documents(self, documents):
        """分割文档"""
        return self.text_splitter.split_documents(documents)
```

### 2.3 向量存储 (`src/vectorstore.py`)

```python
"""向量存储"""
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
import os

class VectorStoreManager:
    """向量存储管理器"""
    
    def __init__(self, persist_directory="./chroma_db"):
        self.persist_directory = persist_directory
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = None
    
    def create_vectorstore(self, documents):
        """创建向量存储"""
        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )
        return self.vectorstore
    
    def load_vectorstore(self):
        """加载向量存储"""
        self.vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings
        )
        return self.vectorstore
    
    def get_retriever(self, k=5):
        """获取检索器"""
        if not self.vectorstore:
            self.load_vectorstore()
        return self.vectorstore.as_retriever(search_kwargs={"k": k})
```

### 2.4 RAG链 (`src/rag_chain.py`)

```python
"""RAG链"""
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

class RAGChain:
    """RAG链"""
    
    def __init__(self, vectorstore, model_name="gpt-4", temperature=0.7):
        self.llm = ChatOpenAI(model_name=model_name, temperature=temperature)
        self.vectorstore = vectorstore
        
        # 自定义提示词模板
        self.prompt_template = """基于以下上下文信息回答问题。
如果上下文中没有相关信息，请明确说明你不知道答案。

上下文信息：
{context}

问题：{question}

请基于上下文信息回答问题："""
        
        self.prompt = PromptTemplate(
            template=self.prompt_template,
            input_variables=["context", "question"]
        )
        
        # 创建检索QA链
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": 5}),
            chain_type_kwargs={"prompt": self.prompt},
            return_source_documents=True
        )
    
    def query(self, question: str):
        """查询问题"""
        result = self.qa_chain.invoke({"query": question})
        return {
            "answer": result["result"],
            "sources": result["source_documents"]
        }
```

### 2.5 API接口 (`src/api.py`)

```python
"""FastAPI应用"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import shutil
from pathlib import Path

from src.loaders import DocumentLoader
from src.splitters import DocumentSplitter
from src.vectorstore import VectorStoreManager
from src.rag_chain import RAGChain

app = FastAPI(title="LangChain文档问答API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化组件
loader = DocumentLoader()
splitter = DocumentSplitter()
vectorstore_manager = VectorStoreManager()
rag_chain = None

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """上传文档"""
    try:
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 加载文档
        documents = loader.load_pdf(str(file_path))
        
        # 分割文档
        splits = splitter.split_documents(documents)
        
        # 创建或更新向量存储
        if vectorstore_manager.vectorstore:
            vectorstore_manager.vectorstore.add_documents(splits)
        else:
            vectorstore_manager.create_vectorstore(splits)
        
        # 重新初始化RAG链
        global rag_chain
        rag_chain = RAGChain(vectorstore_manager.vectorstore)
        
        return {
            "message": "文档上传成功",
            "filename": file.filename,
            "chunks": len(splits)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """查询问题"""
    if not rag_chain:
        raise HTTPException(status_code=400, detail="请先上传文档")
    
    try:
        result = rag_chain.query(request.question)
        
        sources = [
            {
                "content": doc.page_content[:200] + "...",
                "metadata": doc.metadata
            }
            for doc in result["sources"]
        ]
        
        return QueryResponse(
            answer=result["answer"],
            sources=sources
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 第三步：运行和测试

### 3.1 启动服务

```bash
python -m src.api
```

### 3.2 测试API

```bash
# 上传文档
curl -X POST "http://localhost:8000/upload" \
  -F "file=@document.pdf"

# 查询问题
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "文档的主要内容是什么？"}'
```

## 第四步：部署

### 4.1 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "src.api"]
```

### 4.2 docker-compose.yml

```yaml
version: '3.8'

services:
  langchain-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./chroma_db:/app/chroma_db
      - ./uploads:/app/uploads
    restart: unless-stopped
```

## 总结

本教程展示了如何使用LangChain框架构建文档问答系统：

1. 文档加载和分割
2. 向量化和存储
3. 检索和生成
4. API接口开发
5. 部署

LangChain提供了丰富的组件和工具，让您能够快速构建复杂的AI应用。

