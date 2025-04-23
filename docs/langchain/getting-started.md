---
sidebar_position: 2
---

# 基础开发指南

本指南将帮助你快速上手LangChain框架，包括环境配置、安装步骤和基本示例，让你能够尽快开始构建LLM驱动的应用程序。

## 环境准备

在开始使用LangChain之前，需要确保你的环境满足以下要求：

- Python 3.8.1或更高版本
- pip包管理工具
- 可选：虚拟环境管理工具（如venv、conda或pipenv）

### 创建虚拟环境（推荐）

使用虚拟环境可以避免依赖冲突，是Python项目的最佳实践。

使用venv（Python内置）：

```bash
# 创建虚拟环境
python -m venv langchain-env

# 激活虚拟环境（Windows）
langchain-env\Scripts\activate

# 激活虚拟环境（macOS/Linux）
source langchain-env/bin/activate
```

使用conda：

```bash
# 创建虚拟环境
conda create -n langchain-env python=3.10

# 激活虚拟环境
conda activate langchain-env
```

## 安装LangChain

LangChain提供了多种安装选项，根据你的需求选择合适的方式：

### 基本安装

安装LangChain核心包：

```bash
pip install langchain
```

### 全功能安装

如果需要使用所有功能，可以安装带有常用集成的完整版本：

```bash
pip install "langchain[all]"
```

### 特定集成安装

根据项目需求安装特定集成：

```bash
# 安装OpenAI集成
pip install langchain-openai

# 安装本地模型支持
pip install langchain-community

# 安装向量存储支持
pip install langchain-chroma
```

## 设置API密钥

大多数LLM提供商需要API密钥。以OpenAI为例：

```python
import os
# 设置环境变量
os.environ["OPENAI_API_KEY"] = "your-api-key"

# 或者在代码中直接设置
from langchain.llms import OpenAI
llm = OpenAI(openai_api_key="your-api-key")
```

## 核心概念

LangChain的核心组件包括：

### 1. LLMs和Chat Models

LLMs（语言模型）是LangChain的基础，接收文本输入并生成文本输出。

```python
from langchain_openai import OpenAI

# 初始化OpenAI模型
llm = OpenAI(temperature=0.7)

# 简单调用
response = llm.invoke("用Python写一个计算斐波那契数列的函数")
print(response)
```

Chat Models专门处理对话格式的输入输出：

```python
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

# 初始化聊天模型
chat = ChatOpenAI()

# 创建消息列表
messages = [
    SystemMessage(content="你是一位Python专家"),
    HumanMessage(content="如何用Python实现快速排序算法？")
]

# 获取回复
response = chat.invoke(messages)
print(response.content)
```

### 2. 提示模板（Prompts）

提示模板帮助构建结构化的输入：

```python
from langchain.prompts import PromptTemplate

# 创建简单的提示模板
template = PromptTemplate.from_template(
    "我需要一篇关于{topic}的短文，包含以下几点：{points}"
)

# 填充模板
prompt = template.format(
    topic="人工智能",
    points="历史、现状、未来发展"
)

# 使用模型生成回答
response = llm.invoke(prompt)
print(response)
```

### 3. 输出解析器（Output Parsers）

帮助将LLM的文本输出转换为结构化数据：

```python
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List

# 定义输出结构
class Article(BaseModel):
    title: str = Field(description="文章标题")
    sections: List[str] = Field(description="文章的主要部分")
    conclusion: str = Field(description="文章结论")

# 创建解析器
parser = PydanticOutputParser(pydantic_object=Article)

# 创建提示模板
template = """
生成一篇关于{topic}的文章大纲。
{format_instructions}
"""

prompt = PromptTemplate(
    template=template,
    input_variables=["topic"],
    partial_variables={"format_instructions": parser.get_format_instructions()}
)

# 生成提示并获取回答
formatted_prompt = prompt.format(topic="量子计算")
output = llm.invoke(formatted_prompt)

# 解析结果
structured_output = parser.parse(output)
print(structured_output)
```

### 4. 链（Chains）

链将多个组件连接起来，形成一个工作流：

```python
from langchain.chains import LLMChain

# 创建一个简单的链
chain = LLMChain(
    llm=llm,
    prompt=template
)

# 运行链
result = chain.run(topic="区块链技术", points="原理、应用场景、挑战")
print(result)
```

### 5. 向量存储和检索（Vector Stores & Retrieval）

实现基于相似度的文档检索：

```python
from langchain.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma

# 加载文档
loader = TextLoader("data/example.txt")
documents = loader.load()

# 拆分文档
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
docs = text_splitter.split_documents(documents)

# 创建向量存储
embeddings = OpenAIEmbeddings()
db = Chroma.from_documents(docs, embeddings)

# 相似度搜索
query = "人工智能的应用"
docs = db.similarity_search(query)
print(docs[0].page_content)
```

## 构建一个简单的应用

下面是一个结合了多个组件的简单问答应用：

```python
from langchain.chains import RetrievalQA
from langchain_openai import OpenAI
from langchain.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma

# 加载和处理文档
loader = TextLoader("data/faq.txt")
documents = loader.load()
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
texts = text_splitter.split_documents(documents)

# 创建向量存储
embeddings = OpenAIEmbeddings()
docsearch = Chroma.from_documents(texts, embeddings)

# 创建问答链
qa = RetrievalQA.from_chain_type(
    llm=OpenAI(),
    chain_type="stuff",
    retriever=docsearch.as_retriever()
)

# 提问
query = "公司的退款政策是什么？"
answer = qa.run(query)
print(answer)
```

## 调试与优化

### 调试LangChain应用

LangChain提供了方便的调试工具：

```python
import langchain
# 启用详细日志
langchain.verbose = True

# 执行链并查看详细信息
result = chain.run(topic="可再生能源")
```

### 使用LangChain回调

回调可以帮助追踪执行流程：

```python
from langchain.callbacks import StdOutCallbackHandler

# 创建回调处理器
handler = StdOutCallbackHandler()

# 使用回调执行链
result = chain.run(topic="机器学习", callbacks=[handler])
```

## 下一步

- 探索更多[LangChain模块](https://python.langchain.com/docs/modules/)
- 学习如何使用[代理(Agents)](https://python.langchain.com/docs/modules/agents/)处理复杂任务
- 研究[记忆(Memory)](https://python.langchain.com/docs/modules/memory/)组件实现有状态对话
- 尝试集成不同的[文档加载器](https://python.langchain.com/docs/modules/data_connection/document_loaders/)和[向量存储](https://python.langchain.com/docs/modules/data_connection/vectorstores/)

通过本指南，你已经了解了LangChain的基础知识和核心组件，可以开始构建自己的LLM应用程序了。随着深入学习，你将能够创建更复杂、更强大的AI应用。

## 常见问题解决

### API密钥错误

如果遇到API密钥相关错误：
- 确认API密钥正确无误
- 检查API密钥权限和余额
- 确认环境变量名称正确

### 依赖冲突

如果遇到依赖冲突：
- 使用虚拟环境隔离项目
- 执行`pip list`检查已安装包版本
- 尝试卸载冲突包并重新安装

### 模型超时

如果遇到模型请求超时：
- 检查网络连接
- 增加超时设置：`ChatOpenAI(timeout=60)`
- 考虑使用本地模型代替

## 下一步学习

完成入门后，可以继续探索以下内容：

1. [LangChain运行时](../langchain/runtime.md) - 学习如何执行和部署LangChain应用
2. [RAG高级技术](../langchain/rag-advanced.md) - 构建高级检索增强生成系统
3. [代理开发](../langchain/agents.md) - 深入了解LangChain代理系统

## 资源链接

- [LangChain Python文档](https://python.langchain.com/docs/get_started/introduction)
- [LangChain JS/TS文档](https://js.langchain.com/docs/get_started/introduction)
- [LangSmith平台](https://smith.langchain.com/) - 用于调试和监控的工具
- [LangChain Hub](https://smith.langchain.com/hub) - 共享提示和链的中心
- [GitHub仓库](https://github.com/langchain-ai/langchain) - 源代码和示例 