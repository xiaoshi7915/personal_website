---
sidebar_position: 4
---

# LangChain框架最佳实践

本文档总结了使用LangChain框架构建AI应用的最佳实践。

## 链设计最佳实践

### 1. 模块化设计

#### 清晰的链结构

```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

# 模块化链设计
def create_modular_chain():
    """创建模块化的链"""
    # 每个链只负责一个功能
    preprocessing_chain = LLMChain(
        llm=llm,
        prompt=PromptTemplate(
            input_variables=["input"],
            template="预处理：{input}"
        )
    )
    
    processing_chain = LLMChain(
        llm=llm,
        prompt=PromptTemplate(
            input_variables=["preprocessed"],
            template="处理：{preprocessed}"
        )
    )
    
    return preprocessing_chain | processing_chain
```

### 2. 错误处理

#### 完善的错误处理机制

```python
from langchain.schema import OutputParser
from typing import Optional

class SafeOutputParser(OutputParser):
    """安全的输出解析器"""
    
    def parse(self, text: str) -> dict:
        try:
            return self._parse(text)
        except Exception as e:
            logger.error(f"解析失败: {e}")
            return {"error": str(e), "raw_output": text}
    
    def _parse(self, text: str) -> dict:
        # 实际解析逻辑
        pass
```

### 3. 链组合

#### 高效的链组合

```python
from langchain.chains import SequentialChain

def create_sequential_chain():
    """创建顺序链"""
    return SequentialChain(
        chains=[chain1, chain2, chain3],
        input_variables=["input"],
        output_variables=["output"],
        verbose=True
    )
```

## 记忆管理最佳实践

### 1. 对话记忆

#### 高效的记忆管理

```python
from langchain.memory import ConversationBufferWindowMemory

class MemoryManager:
    def __init__(self, window_size: int = 10):
        self.memory = ConversationBufferWindowMemory(
            k=window_size,
            return_messages=True
        )
    
    def add_message(self, role: str, content: str):
        """添加消息到记忆"""
        self.memory.chat_memory.add_message(
            HumanMessage(content=content) if role == "user" 
            else AIMessage(content=content)
        )
    
    def get_context(self) -> str:
        """获取对话上下文"""
        return self.memory.buffer
```

### 2. 记忆优化

#### 减少记忆占用

```python
from langchain.memory import ConversationSummaryMemory

class OptimizedMemory:
    def __init__(self):
        self.memory = ConversationSummaryMemory(
            llm=llm,
            max_token_limit=1000
        )
    
    def summarize_if_needed(self):
        """必要时总结记忆"""
        if self.memory.get_token_count() > 1000:
            self.memory.prune()
```

## 工具使用最佳实践

### 1. 工具选择

#### 智能工具选择

```python
from langchain.tools import Tool
from langchain.agents import AgentExecutor, create_openai_functions_agent

def create_smart_agent(tools: list):
    """创建智能代理"""
    agent = create_openai_functions_agent(
        llm=llm,
        tools=tools,
        prompt=prompt
    )
    
    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        max_iterations=5
    )
```

### 2. 工具验证

#### 输入验证

```python
from pydantic import BaseModel, validator

class ToolInput(BaseModel):
    query: str
    limit: int = 10
    
    @validator('query')
    def validate_query(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('查询不能为空')
        if len(v) > 1000:
            raise ValueError('查询过长')
        return v.strip()
    
    @validator('limit')
    def validate_limit(cls, v):
        if v < 1 or v > 100:
            raise ValueError('限制必须在1-100之间')
        return v
```

## 性能优化最佳实践

### 1. 异步处理

#### 异步链执行

```python
import asyncio
from langchain.chains import LLMChain

async def async_chain_execution(chain, inputs: list):
    """异步执行链"""
    tasks = [chain.ainvoke(input_data) for input_data in inputs]
    results = await asyncio.gather(*tasks)
    return results
```

### 2. 缓存策略

#### 智能缓存

```python
from langchain.cache import InMemoryCache
from langchain.globals import set_llm_cache

# 设置缓存
set_llm_cache(InMemoryCache())

# 或使用Redis缓存
from langchain.cache import RedisCache
redis_cache = RedisCache(redis_client)
set_llm_cache(redis_cache)
```

### 3. 批量处理

#### 批量优化

```python
def batch_process(chain, inputs: list, batch_size: int = 10):
    """批量处理"""
    results = []
    for i in range(0, len(inputs), batch_size):
        batch = inputs[i:i+batch_size]
        batch_results = chain.batch(batch)
        results.extend(batch_results)
    return results
```

## 总结

遵循这些最佳实践可以：

1. **提高代码质量**：通过模块化设计和错误处理
2. **优化性能**：通过异步处理和缓存
3. **改善用户体验**：通过记忆管理和工具优化
4. **增强可维护性**：通过清晰的代码结构


