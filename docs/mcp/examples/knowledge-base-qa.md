---
sidebar_position: 4
---

# 基于MCP的知识库问答助手应用案例

![知识库问答助手架构图](/img/mcp/knowledge-base-qa.svg)

## 概述

知识库问答助手是一个基于MCP协议的应用，它能够连接到知识库中，并针对用户的自然语言问题进行回答。该助手通过向量数据库技术，将文档内容转换为向量表示，实现高效的语义搜索和相关内容检索，并利用大语言模型的强大能力，生成准确、连贯的回答。

## 核心功能

- **文档索引与管理**：支持上传、索引和管理各类文档（PDF、TXT、DOCX等）
- **语义向量化**：将文档内容转换为向量表示，支持语义搜索
- **相关性排序**：根据问题与文档内容的相关性进行智能排序
- **上下文理解**：理解问题的上下文，提供有针对性的回答
- **引用溯源**：为回答提供文档来源，使用户可以追溯信息来源

## 技术实现

### 环境准备

首先，安装必要的Python库：

```bash
pip install pymcp langchain langchain-community faiss-cpu pypdf tiktoken
```

### 项目结构

```
knowledge_assistant/
│
├── main.py                 # 主程序
├── requirements.txt        # 依赖文件
├── knowledge_base/         # 知识库文档存储目录
├── vector_store/           # 向量存储目录
└── utils/
    ├── document_processor.py  # 文档处理工具
    └── vector_store.py        # 向量存储管理
```

### 核心代码实现

#### 主程序 (main.py)

```python
import os
import json
from typing import Dict, List, Optional
import pymcp
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.llms import HuggingFaceEndpoint

# 初始化目录
KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(__file__), "knowledge_base")
VECTOR_STORE_DIR = os.path.join(os.path.dirname(__file__), "vector_store")

os.makedirs(KNOWLEDGE_BASE_DIR, exist_ok=True)
os.makedirs(VECTOR_STORE_DIR, exist_ok=True)

# 初始化向量存储
embeddings = HuggingFaceEmbeddings()
vector_store = None

if os.path.exists(VECTOR_STORE_DIR) and os.listdir(VECTOR_STORE_DIR):
    vector_store = FAISS.load_local(VECTOR_STORE_DIR, embeddings)
else:
    vector_store = FAISS.from_texts(["知识库初始化"], embeddings)
    vector_store.save_local(VECTOR_STORE_DIR)

# 初始化LLM
llm = HuggingFaceEndpoint(
    repo_id="THUDM/chatglm3-6b", 
    max_length=2048,
    temperature=0.5
)

# 创建检索QA链
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vector_store.as_retriever(search_kwargs={"k": 3})
)

# 文档上传与处理
def upload_document(file_path: str) -> Dict:
    """上传并处理文档"""
    if not os.path.exists(file_path):
        return {"status": "error", "message": "文件不存在"}
    
    if not file_path.lower().endswith('.pdf'):
        return {"status": "error", "message": "目前仅支持PDF文档"}
    
    # 保存文件到知识库目录
    filename = os.path.basename(file_path)
    target_path = os.path.join(KNOWLEDGE_BASE_DIR, filename)
    
    if file_path != target_path:
        import shutil
        shutil.copy2(file_path, target_path)
    
    # 加载并处理文档
    loader = PyPDFLoader(target_path)
    documents = loader.load()
    
    # 文本分割
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = text_splitter.split_documents(documents)
    
    # 更新向量存储
    global vector_store
    vector_store.add_documents(chunks)
    vector_store.save_local(VECTOR_STORE_DIR)
    
    return {
        "status": "success", 
        "message": f"文档 {filename} 已成功添加到知识库",
        "document_id": filename
    }

# 知识库问答
def ask_knowledge_base(question: str) -> Dict:
    """根据问题在知识库中查询答案"""
    if not vector_store:
        return {"answer": "知识库尚未初始化或为空", "sources": []}
    
    try:
        # 执行查询
        result = qa_chain({"query": question})
        
        # 获取相关文档
        docs = vector_store.similarity_search(question, k=2)
        sources = [{"title": doc.metadata.get("source", "未知来源"), "page": doc.metadata.get("page", 0)} for doc in docs]
        
        return {
            "answer": result["result"],
            "sources": sources
        }
    except Exception as e:
        return {"answer": f"查询过程中发生错误: {str(e)}", "sources": []}

# 列出已索引的文档
def list_documents() -> List[Dict]:
    """列出知识库中的所有文档"""
    documents = []
    for filename in os.listdir(KNOWLEDGE_BASE_DIR):
        if filename.lower().endswith(('.pdf', '.txt', '.docx')):
            file_path = os.path.join(KNOWLEDGE_BASE_DIR, filename)
            documents.append({
                "id": filename,
                "name": filename,
                "size": os.path.getsize(file_path),
                "created_at": os.path.getctime(file_path)
            })
    return documents

# 初始化MCP服务器
server = pymcp.Server(
    id="knowledge-qa-assistant",
    name="知识库问答助手",
    description="基于文档的知识库问答系统，支持PDF文档的上传、索引和查询",
    version="1.0.0"
)

# 注册工具
@server.tool("upload_document")
def tool_upload_document(file_path: str) -> Dict:
    """
    上传文档到知识库
    
    Args:
        file_path: 文档路径，支持PDF格式
        
    Returns:
        包含上传状态和消息的字典
    """
    return upload_document(file_path)

@server.tool("ask_question")
def tool_ask_question(question: str) -> Dict:
    """
    向知识库提问
    
    Args:
        question: 用户的问题
        
    Returns:
        包含答案和来源的字典
    """
    return ask_knowledge_base(question)

@server.tool("list_documents")
def tool_list_documents() -> Dict:
    """
    列出知识库中的所有文档
    
    Returns:
        文档列表
    """
    return {"documents": list_documents()}

# 资源端点
@server.resource("/documents")
def get_documents():
    """获取所有文档"""
    return list_documents()

# 用户提示
@server.user_prompt
def user_prompt():
    return """
    您可以:
    1. 上传PDF文档到知识库
    2. 询问与上传文档相关的问题
    3. 查看知识库中的所有文档
    
    示例:
    - "上传这份产品说明书到知识库"
    - "这个产品的主要功能是什么?"
    - "列出所有已上传的文档"
    """

# 启动服务器
if __name__ == "__main__":
    server.run(host="0.0.0.0", port=8000)
```

## 应用场景

### 1. 企业知识管理

企业可以将内部文档、产品手册、技术规范等资料上传到知识库，使员工能够快速检索和获取所需信息，提高工作效率。

### 2. 客户支持系统

客服人员可以利用知识库问答助手快速检索产品信息、常见问题解答和故障排除指南，为客户提供准确、及时的支持。

### 3. 教育与培训

教育机构可以将教材、讲义和研究资料上传到知识库，学生可以通过问答系统进行学习和复习，获取针对性的解答。

### 4. 技术支持

技术团队可以将API文档、代码库说明和技术博客纳入知识库，开发人员可以通过问答系统快速解决技术问题。

## 集成示例

### Web应用集成

```javascript
// 前端集成示例
async function queryKnowledgeBase() {
  const question = document.getElementById('question').value;
  
  const response = await fetch('http://localhost:8000/api/tools/ask_question', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: question,
    }),
  });
  
  const result = await response.json();
  
  // 显示结果
  document.getElementById('answer').textContent = result.answer;
  
  // 显示来源
  const sourcesElem = document.getElementById('sources');
  sourcesElem.innerHTML = '';
  result.sources.forEach(source => {
    const sourceItem = document.createElement('li');
    sourceItem.textContent = `${source.title} (页码: ${source.page})`;
    sourcesElem.appendChild(sourceItem);
  });
}
```

### 命令行集成

```json
{
  "command": "python main.py",
  "args": [],
  "description": "启动知识库问答助手服务器",
  "port": 8000,
  "protocol": "http"
}
```

## 最佳实践

1. **维护知识库质量**：定期检查和更新知识库内容，确保信息的准确性和时效性。

2. **优化文档处理**：针对不同类型和规模的文档，调整文本分割策略，以获得最佳的检索效果。

3. **提供多模态支持**：考虑扩展系统以支持图像、表格等多模态内容的索引和检索。

4. **用户反馈机制**：实现用户对回答质量的反馈机制，不断优化系统性能。

5. **安全性考虑**：实施访问控制和认证机制，保护敏感信息的安全。

## 总结

知识库问答助手是一个强大的MCP应用案例，通过结合向量数据库和自然语言处理技术，它能够将大量非结构化文档转化为可查询的知识源。这种应用为企业和个人提供了一种高效获取知识的方式，减少了信息搜索的时间成本，同时提高了信息获取的准确性。

通过本文提供的实现方案，开发者可以快速构建自己的知识库问答系统，并根据具体需求进行定制和扩展，为用户提供更加智能化的信息服务。 