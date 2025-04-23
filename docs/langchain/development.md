---
sidebar_position: 3
---

# 高级开发指南

本文档提供LangChain的高级开发策略、架构设计模式和性能优化技巧，帮助开发者构建更高效、更可靠的LLM应用。

## 架构设计模式

### 多层链架构

对于复杂应用，推荐采用多层链架构：

```python
from langchain.chains import SequentialChain, LLMChain
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

# 第一层：分析用户问题
analysis_prompt = PromptTemplate(
    input_variables=["question"],
    template="分析以下问题，确定需要什么类型的信息：{question}"
)
analysis_chain = LLMChain(
    llm=ChatOpenAI(temperature=0),
    prompt=analysis_prompt,
    output_key="analysis"
)

# 第二层：检索相关信息
retrieval_prompt = PromptTemplate(
    input_variables=["analysis", "question"],
    template="基于这个分析：{analysis}\n为问题'{question}'检索最相关的信息"
)
retrieval_chain = LLMChain(
    llm=ChatOpenAI(temperature=0),
    prompt=retrieval_prompt,
    output_key="context"
)

# 第三层：生成最终回答
answer_prompt = PromptTemplate(
    input_variables=["question", "context"],
    template="使用以下信息：{context}\n回答问题：{question}"
)
answer_chain = LLMChain(
    llm=ChatOpenAI(temperature=0.7),
    prompt=answer_prompt,
    output_key="answer"
)

# 组合所有链
master_chain = SequentialChain(
    chains=[analysis_chain, retrieval_chain, answer_chain],
    input_variables=["question"],
    output_variables=["analysis", "context", "answer"],
    verbose=True
)

result = master_chain.invoke({"question": "量子计算如何影响密码学？"})
print(result["answer"])
```

### 路由模式

当应用需要处理不同类型的查询时，使用路由模式将请求分发给专门的处理链：

```python
from langchain.chains.router import MultiPromptChain
from langchain.chains.router.llm_router import LLMRouterChain, RouterOutputParser
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

# 定义路由提示
router_template = """给定用户的输入，选择最适合回答问题的类别。

类别:
1. 编程 - 关于编程语言、代码和软件开发的问题
2. 历史 - 关于历史事件、时期和人物的问题
3. 科学 - 关于物理、化学、生物等科学学科的问题

用户输入: {input}

类别:"""

router_prompt = PromptTemplate(
    template=router_template,
    input_variables=["input"]
)

# 创建各领域的模板
programming_template = """你是一位编程专家。回答以下编程相关问题：
{input}"""

history_template = """你是一位历史学者。回答以下历史相关问题：
{input}"""

science_template = """你是一位科学家。回答以下科学相关问题：
{input}"""

# 创建LLM
llm = ChatOpenAI(temperature=0)

# 创建路由链
destinations = {
    "编程": programming_template,
    "历史": history_template,
    "科学": science_template
}

router_chain = LLMRouterChain.from_llm(llm, router_prompt)

# 创建多提示链
chain = MultiPromptChain(
    router_chain=router_chain,
    destination_chains={k: LLMChain(llm=llm, prompt=PromptTemplate(template=v, input_variables=["input"])) for k, v in destinations.items()},
    default_chain=LLMChain(llm=llm, prompt=PromptTemplate(template="回答以下问题：{input}", input_variables=["input"])),
    verbose=True
)

# 使用路由链
result = chain.invoke({"input": "Python中如何实现多线程？"})
print(result)
```

## 高级RAG技术

### 自查询检索

自查询检索使用LLM来解释查询并生成更有效的搜索参数：

```python
from langchain.chains.query_constructor.base import AttributeInfo
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI

# 定义文档元数据结构
metadata_field_info = [
    AttributeInfo(
        name="source",
        description="文档的来源",
        type="string"
    ),
    AttributeInfo(
        name="date",
        description="文档创建日期",
        type="date"
    ),
    AttributeInfo(
        name="category",
        description="文档类别",
        type="string"
    )
]

# 假设我们已经有了向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(embedding_function=embeddings)

# 创建自查询检索器
retriever = SelfQueryRetriever.from_llm(
    llm=ChatOpenAI(temperature=0),
    vectorstore=vectorstore,
    document_contents="科技文章集合",
    metadata_field_info=metadata_field_info,
    verbose=True
)

# 使用复杂查询
documents = retriever.get_relevant_documents("找出2023年发布的关于人工智能的文章")
```

### 多向量检索

为每个文档创建多种不同的向量表示，提高检索精度：

```python
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain.storage import InMemoryStore
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 准备文档
documents = [
    Document(page_content="LangChain是一个强大的框架", metadata={"source": "tech_blog"}),
    Document(page_content="大型语言模型可以用于多种任务", metadata={"source": "research_paper"})
]

# 创建文档ID和子文档ID存储
docstore = InMemoryStore()
id_key = "doc_id"

# 为每个文档创建摘要
text_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=0)
docs = []
for i, doc in enumerate(documents):
    # 原始文档
    _id = str(i)
    doc.metadata[id_key] = _id
    
    # 创建摘要作为另一种向量表示
    summary_doc = Document(
        page_content=f"摘要: {doc.page_content[:50]}...",
        metadata={id_key: _id, "type": "summary"}
    )
    
    # 存储原始文档
    docstore.mset([(_id, doc)])
    docs.extend([doc, summary_doc])

# 创建向量存储
vectorstore = Chroma.from_documents(
    documents=docs,
    embedding=OpenAIEmbeddings(),
    collection_name="multi_vector_demo"
)

# 创建多向量检索器
retriever = MultiVectorRetriever(
    vectorstore=vectorstore,
    docstore=docstore,
    id_key=id_key,
)

# 执行检索
docs = retriever.get_relevant_documents("LangChain框架有哪些功能？")
```

## 性能优化

### 自定义LLM缓存

实现自定义缓存可以减少API调用并降低成本：

```python
import hashlib
import json
from typing import Dict, Any
from langchain.cache import BaseCache
from langchain.globals import set_llm_cache
import redis

class RedisCache(BaseCache):
    """基于Redis的LLM缓存实现"""
    
    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.ttl = 3600 * 24  # 设置缓存有效期为24小时
    
    def _key(self, prompt: str, llm_string: str) -> str:
        """创建缓存键"""
        return hashlib.sha256(f"{llm_string}:{prompt}".encode()).hexdigest()
    
    def lookup(self, prompt: str, llm_string: str) -> Any:
        """从缓存查找结果"""
        key = self._key(prompt, llm_string)
        result = self.redis_client.get(key)
        if result:
            return json.loads(result)
        return None
    
    def update(self, prompt: str, llm_string: str, return_val: Any) -> None:
        """更新缓存"""
        key = self._key(prompt, llm_string)
        self.redis_client.setex(key, self.ttl, json.dumps(return_val))

# 使用示例
redis_client = redis.Redis(host='localhost', port=6379, db=0)
set_llm_cache(RedisCache(redis_client))

# 现在所有LLM调用都会使用Redis缓存
```

### 异步调用

对于高并发应用，使用异步调用提高性能：

```python
import asyncio
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

# 初始化异步模型
model = ChatOpenAI()

# 创建提示模板
prompt = ChatPromptTemplate.from_template("告诉我关于{topic}的简要信息")

# 异步调用函数
async def generate_response(topic):
    chain = prompt | model
    response = await chain.ainvoke({"topic": topic})
    return response.content

# 并发处理多个请求
async def process_multiple_topics(topics):
    tasks = [generate_response(topic) for topic in topics]
    return await asyncio.gather(*tasks)

# 使用示例
topics = ["人工智能", "量子计算", "区块链", "神经网络"]
results = asyncio.run(process_multiple_topics(topics))
for topic, result in zip(topics, results):
    print(f"Topic: {topic}\nResult: {result}\n")
```

### 分批处理文档

处理大量文档时，使用分批策略：

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
import time

def process_documents_in_batches(documents, batch_size=100):
    """分批处理文档"""
    embeddings = OpenAIEmbeddings()
    
    # 分割文档
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    all_splits = text_splitter.split_documents(documents)
    
    # 创建向量存储
    vectorstore = Chroma(embedding_function=embeddings)
    
    # 分批处理
    for i in range(0, len(all_splits), batch_size):
        batch = all_splits[i:i+batch_size]
        vectorstore.add_documents(batch)
        print(f"处理了批次 {i//batch_size + 1}, 文档 {i} 到 {min(i+batch_size, len(all_splits))}")
        time.sleep(1)  # 防止API限制
    
    return vectorstore
```

## 链和代理的最佳实践

### 健壮的链设计

使用错误处理和备选策略，提高链的健壮性：

```python
from langchain.chains import LLMChain, TransformChain
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

# 错误处理函数
def error_handler(inputs):
    try:
        # 尝试处理输入
        text = inputs["text"]
        return {"processed_text": text.strip().lower()}
    except Exception as e:
        # 出现错误时返回安全值
        return {"processed_text": "输入处理失败，请提供有效文本。"}

# 创建转换链
transform_chain = TransformChain(
    input_variables=["text"],
    output_variables=["processed_text"],
    transform=error_handler
)

# 创建LLM链
llm_chain = LLMChain(
    llm=ChatOpenAI(temperature=0.7),
    prompt=PromptTemplate(
        input_variables=["processed_text"],
        template="对以下内容提供分析：{processed_text}"
    )
)

# 组合链
from langchain.chains import SequentialChain
robust_chain = SequentialChain(
    chains=[transform_chain, llm_chain],
    input_variables=["text"],
    output_variables=["text"],
    verbose=True
)

# 测试健壮链
result = robust_chain.invoke({"text": None})  # 故意使用无效输入
```

### 高效代理配置

优化代理以减少不必要的工具调用：

```python
from langchain.agents import Tool, initialize_agent, AgentType
from langchain_openai import ChatOpenAI
from langchain.tools import BaseTool
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

# 定义工具
class CalculatorTool(BaseTool):
    name = "Calculator"
    description = "计算数学表达式"
    
    def _run(self, query: str) -> str:
        try:
            return str(eval(query))
        except Exception as e:
            return f"计算错误: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        return self._run(query)

class WeatherTool(BaseTool):
    name = "Weather"
    description = "获取城市的天气信息"
    
    def _run(self, city: str) -> str:
        # 模拟天气API
        return f"{city}的天气：晴天，25°C"
    
    async def _arun(self, city: str) -> str:
        return self._run(city)

# 创建优化的代理
llm = ChatOpenAI(
    temperature=0,
    streaming=True,
    callback_manager=CallbackManager([StreamingStdOutCallbackHandler()])
)

tools = [CalculatorTool(), WeatherTool()]

# 使用ZERO_SHOT_REACT_DESCRIPTION代理类型，它在决策上更高效
agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    max_iterations=5,  # 限制最大迭代次数
    early_stopping_method="generate",  # 提前停止生成
    handle_parsing_errors=True  # 处理解析错误
)

# 使用代理
agent.invoke({"input": "北京的天气怎么样？然后计算23乘以45"})
```

## 高级提示工程

### 思维链提示

使用思维链（Chain-of-Thought）技术提高推理能力：

```python
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

cot_template = """请一步一步思考以下问题：

问题: {question}

思考过程:
1. 让我们先了解问题要求...
2. 我需要确定解决步骤...
3. 针对每个步骤进行分析...
4. 基于分析得出结论...

最终答案:"""

cot_prompt = PromptTemplate(
    template=cot_template,
    input_variables=["question"]
)

llm = ChatOpenAI(temperature=0)
chain = cot_prompt | llm

result = chain.invoke({"question": "如果一个项目有5个任务，每个任务需要3天完成，两个人同时工作，总共需要多少天？"})
print(result.content)
```

### 少样本提示

使用示例增强模型性能：

```python
from langchain.prompts import FewShotPromptTemplate, PromptTemplate
from langchain_openai import ChatOpenAI

# 定义示例
examples = [
    {"input": "这个产品质量很差", "output": "负面"},
    {"input": "服务非常好，员工很友善", "output": "正面"},
    {"input": "价格有点贵，但质量不错", "output": "中性"},
    {"input": "完全不值这个价格，太失望了", "output": "负面"},
    {"input": "超出预期，非常满意", "output": "正面"}
]

# 定义示例格式化模板
example_formatter_template = """
输入: {input}
输出: {output}
"""

example_prompt = PromptTemplate(
    input_variables=["input", "output"],
    template=example_formatter_template
)

# 创建少样本提示模板
few_shot_prompt = FewShotPromptTemplate(
    examples=examples,
    example_prompt=example_prompt,
    prefix="以下是情感分析的例子，0表示负面，1表示中性，2表示正面：",
    suffix="输入: {input}\n输出:",
    input_variables=["input"]
)

# 使用少样本提示
llm = ChatOpenAI(temperature=0)
chain = few_shot_prompt | llm

result = chain.invoke({"input": "这家餐厅的服务态度一般，但是食物很美味"})
print(result.content)
```

## 部署与监控

### 使用LangServe部署

LangServe可以将LangChain应用部署为REST API：

```python
# app.py
from fastapi import FastAPI
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
from langserve import add_routes

# 创建应用
app = FastAPI(title="LangChain API服务")

# 定义链
prompt = ChatPromptTemplate.from_template("告诉我关于{topic}的信息")
model = ChatOpenAI()
chain = prompt | model

# 添加路由
add_routes(
    app,
    {"generate": chain},
    path="/api"
)

# 运行命令: uvicorn app:app --reload
```

### 使用LangSmith监控

LangSmith提供了跟踪、评估和监控LangChain应用的工具：

```python
import os
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

# 设置LangSmith环境变量
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-api-key"
os.environ["LANGCHAIN_PROJECT"] = "My Project"

# 创建被监控的链
model = ChatOpenAI()
prompt = ChatPromptTemplate.from_template("用一段话解释{concept}")
chain = prompt | model

# 使用链
response = chain.invoke({"concept": "量子力学"})

# 现在可以在LangSmith界面查看执行详情
```

## 集成与扩展

### 自定义模型集成

如果需要使用自定义或本地模型，可以创建自己的LLM包装器：

```python
from langchain.llms.base import LLM
from typing import Any, List, Optional
import requests

class CustomLLM(LLM):
    """自定义LLM实现，连接到自托管API"""
    
    api_url: str
    """API URL"""
    
    @property
    def _llm_type(self) -> str:
        return "custom_llm"
    
    def _call(self, prompt: str, stop: Optional[List[str]] = None) -> str:
        """调用LLM"""
        response = requests.post(
            self.api_url,
            json={"prompt": prompt, "stop": stop}
        )
        if response.status_code != 200:
            raise ValueError(f"API调用失败: {response.text}")
        return response.json()["text"]
    
    @property
    def _identifying_params(self) -> dict:
        """获取参数用于缓存"""
        return {"api_url": self.api_url}

# 使用自定义LLM
custom_llm = CustomLLM(api_url="http://localhost:8000/generate")
response = custom_llm.invoke("解释量子计算")
print(response)
```

### 集成外部API

将外部API作为工具集成到LangChain工作流中：

```python
from langchain.agents import Tool, initialize_agent, AgentType
from langchain_openai import ChatOpenAI
import requests

# 创建连接外部天气API的工具
def get_weather(location: str) -> str:
    """获取指定位置的天气"""
    url = f"https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q={location}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return f"{location}的天气：{data['current']['condition']['text']}，温度：{data['current']['temp_c']}°C"
    return f"无法获取{location}的天气信息"

# 创建连接股票数据API的工具
def get_stock_price(symbol: str) -> str:
    """获取指定股票的价格"""
    url = f"https://api.marketdata.com/v1/stocks/{symbol}"
    # 模拟API调用
    # response = requests.get(url)
    return f"{symbol}的当前价格：￥156.78"

# 创建工具列表
tools = [
    Tool(
        name="Weather",
        func=get_weather,
        description="获取指定位置的天气信息"
    ),
    Tool(
        name="StockPrice",
        func=get_stock_price,
        description="获取指定股票代码的当前价格"
    )
]

# 初始化代理
llm = ChatOpenAI(temperature=0)
agent = initialize_agent(
    tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=True
)

# 使用代理
response = agent.invoke({"input": "北京今天的天气怎么样？然后告诉我阿里巴巴的股票价格"})
print(response["output"])
```

## 结论

本高级开发指南介绍了LangChain的多种高级用法，从架构设计模式到性能优化，从高级RAG技术到部署与监控。通过应用这些技术，你可以构建更加强大、可靠和高效的LLM应用程序。

随着LangChain生态系统的不断发展，开发者应该持续关注最新动态，学习新功能和最佳实践，以便充分发挥LangChain的潜力。通过实践和探索，你将能够构建出真正智能且有用的AI应用。 