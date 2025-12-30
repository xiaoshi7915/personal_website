---
sidebar_position: 8
title: 从零到一：构建完整的RAG应用
description: 一个完整的教程，从环境搭建到部署上线的RAG应用开发全流程
---

# 从零到一：构建完整的RAG应用

本教程将带您从零开始，构建一个完整的RAG（检索增强生成）应用。我们将创建一个**智能知识库问答系统**，能够基于企业内部文档回答用户问题。

## 项目概述

### 功能特性

- ✅ 文档上传和解析
- ✅ 文档向量化和存储
- ✅ 智能检索和重排序
- ✅ 基于检索内容的回答生成
- ✅ Web界面交互
- ✅ API接口

### 技术栈

- **后端**：Python 3.11+ + FastAPI
- **向量数据库**：ChromaDB / Pinecone
- **嵌入模型**：text-embedding-ada-002 / BGE-large-zh
- **LLM**：OpenAI GPT-4 / Claude / 本地模型
- **前端**：React + TypeScript
- **部署**：Docker + Docker Compose

## 第一步：环境准备

### 1.1 创建项目目录

```bash
mkdir rag-knowledge-base
cd rag-knowledge-base
```

### 1.2 创建虚拟环境

```bash
# 使用venv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 1.3 安装依赖

创建 `requirements.txt`：

```txt
fastapi>=0.104.0
uvicorn>=0.24.0
langchain>=0.1.0
langchain-openai>=0.0.5
chromadb>=0.4.0
pypdf2>=3.0.0
python-docx>=1.1.0
python-multipart>=0.0.6
pydantic>=2.5.0
openai>=1.0.0
```

安装依赖：

```bash
pip install -r requirements.txt
```

### 1.4 创建项目结构

```bash
mkdir -p src/{api,core,models,utils} tests static uploads
touch src/__init__.py
touch src/api/__init__.py
touch src/core/__init__.py
touch src/models/__init__.py
touch src/utils/__init__.py
touch .env.example
touch README.md
```

## 第二步：实现核心功能

### 2.1 文档处理模块 (`src/core/document_processor.py`)

```python
"""文档处理模块"""
import os
from pathlib import Path
from typing import List, Dict
import PyPDF2
from docx import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

class DocumentProcessor:
    """文档处理器"""
    
    def __init__(self, chunk_size=1000, chunk_overlap=200):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )
    
    def process_pdf(self, file_path: str) -> List[Dict]:
        """处理PDF文件"""
        chunks = []
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            
            # 分块
            splits = self.text_splitter.split_text(text)
            
            for i, split in enumerate(splits):
                chunks.append({
                    "content": split,
                    "metadata": {
                        "source": file_path,
                        "chunk_index": i,
                        "total_chunks": len(splits)
                    }
                })
        
        return chunks
    
    def process_docx(self, file_path: str) -> List[Dict]:
        """处理Word文档"""
        chunks = []
        doc = Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
        # 分块
        splits = self.text_splitter.split_text(text)
        
        for i, split in enumerate(splits):
            chunks.append({
                "content": split,
                "metadata": {
                    "source": file_path,
                    "chunk_index": i,
                    "total_chunks": len(splits)
                }
            })
        
        return chunks
    
    def process_file(self, file_path: str) -> List[Dict]:
        """根据文件类型处理文件"""
        ext = Path(file_path).suffix.lower()
        
        if ext == '.pdf':
            return self.process_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            return self.process_docx(file_path)
        else:
            raise ValueError(f"不支持的文件类型: {ext}")
```

### 2.2 向量存储模块 (`src/core/vector_store.py`)

```python
"""向量存储模块"""
import os
from typing import List, Dict, Optional
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document

class VectorStore:
    """向量存储管理器"""
    
    def __init__(self, persist_directory="./chroma_db", embedding_model="text-embedding-ada-002"):
        self.persist_directory = persist_directory
        self.embeddings = OpenAIEmbeddings(model=embedding_model)
        self.vectorstore = None
        self._load_or_create_store()
    
    def _load_or_create_store(self):
        """加载或创建向量存储"""
        if os.path.exists(self.persist_directory):
            self.vectorstore = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings
            )
        else:
            self.vectorstore = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings
            )
    
    def add_documents(self, chunks: List[Dict]):
        """添加文档到向量存储"""
        documents = [
            Document(
                page_content=chunk["content"],
                metadata=chunk["metadata"]
            )
            for chunk in chunks
        ]
        
        self.vectorstore.add_documents(documents)
        self.vectorstore.persist()
    
    def search(self, query: str, k: int = 5) -> List[Document]:
        """搜索相关文档"""
        return self.vectorstore.similarity_search(query, k=k)
    
    def search_with_score(self, query: str, k: int = 5) -> List[tuple]:
        """搜索相关文档并返回相似度分数"""
        return self.vectorstore.similarity_search_with_score(query, k=k)
```

### 2.3 RAG链模块 (`src/core/rag_chain.py`)

```python
"""RAG链模块"""
from typing import List
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import Document

class RAGChain:
    """RAG链"""
    
    def __init__(self, model_name="gpt-4", temperature=0.7):
        self.llm = ChatOpenAI(model_name=model_name, temperature=temperature)
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """你是一个专业的AI助手，基于以下上下文信息回答问题。
如果上下文中没有相关信息，请明确说明你不知道答案。

上下文信息：
{context}

请基于以上上下文信息回答问题。如果上下文中没有相关信息，请说"根据提供的上下文，我无法回答这个问题"。
"""),
            ("human", "{question}")
        ])
    
    def generate_answer(self, question: str, context_docs: List[Document]) -> str:
        """生成答案"""
        # 组合上下文
        context = "\n\n".join([doc.page_content for doc in context_docs])
        
        # 生成回答
        chain = self.prompt_template | self.llm
        response = chain.invoke({
            "context": context,
            "question": question
        })
        
        return response.content
```

### 2.4 API接口 (`src/api/main.py`)

```python
"""FastAPI主应用"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import shutil
from pathlib import Path

from src.core.document_processor import DocumentProcessor
from src.core.vector_store import VectorStore
from src.core.rag_chain import RAGChain

app = FastAPI(title="RAG知识库API")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化组件
processor = DocumentProcessor()
vector_store = VectorStore()
rag_chain = RAGChain()

# 上传目录
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# 请求模型
class QueryRequest(BaseModel):
    question: str
    top_k: int = 5

class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]

@app.post("/upload", summary="上传文档")
async def upload_document(file: UploadFile = File(...)):
    """上传并处理文档"""
    try:
        # 保存文件
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 处理文档
        chunks = processor.process_file(str(file_path))
        
        # 添加到向量存储
        vector_store.add_documents(chunks)
        
        return {
            "message": "文档上传成功",
            "filename": file.filename,
            "chunks": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse, summary="查询问题")
async def query(request: QueryRequest):
    """查询问题并生成答案"""
    try:
        # 检索相关文档
        docs = vector_store.search(request.question, k=request.top_k)
        
        # 生成答案
        answer = rag_chain.generate_answer(request.question, docs)
        
        # 准备来源信息
        sources = [
            {
                "content": doc.page_content[:200] + "...",
                "source": doc.metadata.get("source", "unknown"),
                "chunk_index": doc.metadata.get("chunk_index", 0)
            }
            for doc in docs
        ]
        
        return QueryResponse(
            answer=answer,
            sources=sources
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 第三步：配置环境变量

创建 `.env` 文件：

```bash
OPENAI_API_KEY=your-openai-api-key
EMBEDDING_MODEL=text-embedding-ada-002
LLM_MODEL=gpt-4
CHROMA_DB_PATH=./chroma_db
```

## 第四步：运行应用

### 4.1 启动API服务

```bash
python -m src.api.main
```

### 4.2 测试API

```bash
# 上传文档
curl -X POST "http://localhost:8000/upload" \
  -F "file=@document.pdf"

# 查询问题
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "文档的主要内容是什么？", "top_k": 5}'
```

## 第五步：部署

### 5.1 创建Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "src.api.main"]
```

### 5.2 创建docker-compose.yml

```yaml
version: '3.8'

services:
  rag-api:
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

### 5.3 部署

```bash
docker-compose up -d
```

## 总结

本教程展示了如何从零开始构建一个完整的RAG应用，包括：

1. 文档处理和分块
2. 向量化和存储
3. 检索和生成
4. API接口
5. 部署

您可以根据实际需求扩展功能，如添加用户认证、多知识库管理、更高级的检索策略等。

