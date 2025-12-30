---
sidebar_position: 6
title: LangChain实战案例
description: LangChain框架的实际应用案例，从零到一构建完整的LangChain应用
---

# LangChain实战案例

本文档提供了多个完整的LangChain实战案例，帮助您从零开始构建LangChain应用。

## 案例1：智能问答系统

### 项目概述

构建一个基于LangChain和RAG的智能问答系统，能够回答基于知识库的问题。

### 技术栈

- **框架**：LangChain
- **向量数据库**：ChromaDB
- **LLM**：OpenAI GPT-3.5
- **嵌入模型**：OpenAI Embeddings

### 实施步骤

#### 步骤1：环境准备

```bash
pip install langchain openai chromadb tiktoken
```

#### 步骤2：创建知识库

```python
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

# 加载文档
loader = TextLoader("knowledge_base.txt")
documents = loader.load()

# 分割文档
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
texts = text_splitter.split_documents(documents)

# 创建向量数据库
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(
    documents=texts,
    embedding=embeddings,
    persist_directory="./chroma_db"
)
```

#### 步骤3：创建问答链

```python
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

# 创建LLM
llm = OpenAI(temperature=0)

# 创建检索QA链
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3})
)

# 使用示例
query = "什么是LangChain？"
answer = qa_chain.run(query)
print(f"问题: {query}")
print(f"答案: {answer}")
```

## 案例2：文档摘要生成

### 项目概述

使用LangChain生成文档摘要。

### 实施步骤

```python
from langchain.chains.summarize import load_summarize_chain
from langchain.llms import OpenAI
from langchain.document_loaders import TextLoader

# 加载文档
loader = TextLoader("long_document.txt")
documents = loader.load()

# 分割文档
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=200
)
docs = text_splitter.split_documents(documents)

# 创建摘要链
llm = OpenAI(temperature=0)
chain = load_summarize_chain(llm, chain_type="map_reduce")

# 生成摘要
summary = chain.run(docs)
print(summary)
```

## 案例3：多步骤推理链

### 项目概述

构建一个多步骤的推理链，完成复杂任务。

### 实施步骤

```python
from langchain.chains import LLMChain, SimpleSequentialChain
from langchain.prompts import PromptTemplate
from langchain.llms import OpenAI

llm = OpenAI(temperature=0)

# 第一步：分析问题
analysis_template = """分析以下问题，提取关键信息：
问题: {question}
分析:"""
analysis_prompt = PromptTemplate(
    input_variables=["question"],
    template=analysis_template
)
analysis_chain = LLMChain(llm=llm, prompt=analysis_prompt)

# 第二步：生成答案
answer_template = """基于以下分析，回答问题：
分析: {analysis}
问题: {question}
答案:"""
answer_prompt = PromptTemplate(
    input_variables=["analysis", "question"],
    template=answer_template
)
answer_chain = LLMChain(llm=llm, prompt=answer_prompt)

# 组合链
overall_chain = SimpleSequentialChain(
    chains=[analysis_chain, answer_chain],
    verbose=True
)

# 使用
result = overall_chain.run("如何优化LangChain应用的性能？")
print(result)
```

## 案例4：Agent系统

### 项目概述

构建一个使用工具的Agent系统。

### 实施步骤

```python
from langchain.agents import initialize_agent, Tool
from langchain.agents import AgentType
from langchain.llms import OpenAI
from langchain.utilities import GoogleSearchAPIWrapper

# 初始化LLM
llm = OpenAI(temperature=0)

# 定义工具
search = GoogleSearchAPIWrapper()
tools = [
    Tool(
        name="搜索",
        func=search.run,
        description="用于搜索最新信息"
    ),
    Tool(
        name="计算器",
        func=lambda x: str(eval(x)),
        description="用于数学计算"
    )
]

# 创建Agent
agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

# 使用Agent
result = agent.run("搜索LangChain的最新版本，然后计算它的主要版本号乘以2")
print(result)
```

## 案例5：对话记忆系统

### 项目概述

构建一个带记忆的对话系统。

### 实施步骤

```python
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain.llms import OpenAI

# 创建记忆
memory = ConversationBufferMemory()

# 创建对话链
llm = OpenAI(temperature=0)
conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=True
)

# 对话
conversation.predict(input="你好，我是张三")
conversation.predict(input="我的名字是什么？")
conversation.predict(input="我喜欢编程，特别是Python")
conversation.predict(input="我喜欢什么编程语言？")
```

## 最佳实践

1. **选择合适的链类型**：根据任务复杂度选择chain_type
2. **优化检索参数**：调整k值平衡准确性和速度
3. **使用记忆**：为对话应用添加记忆功能
4. **错误处理**：实现完善的错误处理机制
5. **性能优化**：使用缓存和批处理提高性能

## 相关资源

- [LangChain深度解析](/docs/langchain/comprehensive-intro)
- [RAG技术](/docs/rag/intro)
- [开发指南](/docs/langchain/development)

