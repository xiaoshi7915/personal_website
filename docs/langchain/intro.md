---
sidebar_position: 1
---

# 入门介绍

LangChain是一个用于开发由大型语言模型（LLM）驱动的应用程序的框架。它通过提供标准接口、集成工具和链式组合功能，简化了LLM应用的构建过程。本文将介绍LangChain的基本概念、核心组件和主要应用场景。

## 什么是LangChain？

LangChain是一个开源框架，旨在简化使用大型语言模型构建应用程序的过程。它提供了一套工具、组件和接口，帮助开发者快速构建强大的LLM应用，例如聊天机器人、问答系统、文档摘要和内容生成等。

LangChain的核心理念是将语言模型（如GPT-4、Claude、Llama等）与外部数据源和计算环境连接起来，扩展LLM的能力范围，同时提供一个统一的接口来管理复杂的交互流程。

![LangChain架构概览](/img/langchain-overview.jpeg)

## 为什么选择LangChain？

LangChain解决了构建LLM应用时的几个关键挑战：

1. **上下文限制**：通过检索增强生成（RAG）技术，克服了LLM的上下文窗口限制
2. **知识时效性**：允许LLM访问最新数据，而不仅限于训练数据
3. **交互复杂性**：通过链和代理简化多步骤交互流程
4. **工具使用**：使LLM能够使用外部工具和API进行操作
5. **开发效率**：标准化接口和组件复用，加速开发速度

## LangChain的核心概念

LangChain建立在几个核心概念之上：

### 1. 组件 (Components)

LangChain提供了多种可组合的组件，每个组件都针对特定的任务进行了优化：

- **模型 (Models)**：与各种LLM和嵌入模型的接口
- **提示 (Prompts)**：提示模板和管理系统
- **内存 (Memory)**：保持对话和交互状态
- **索引 (Indexes)**：结构化文档以便有效检索
- **链 (Chains)**：组合多个组件完成复杂任务
- **代理 (Agents)**：赋予LLM使用工具和决策能力

### 2. 链 (Chains)

链是LangChain中的核心概念，它允许将多个组件（如LLM、提示模板和其他链）组合起来执行复杂任务。链通常遵循以下模式：

1. 接收输入
2. 使用输入构建提示
3. 将提示传递给LLM
4. 处理LLM输出
5. 返回最终结果

![LangChain链示例](/img/langchain-chains.jpeg)

### 3. 代理 (Agents)

代理是LangChain中最强大的概念之一，它允许LLM决定要采取哪些行动，使用哪些工具，以及如何解释工具输出。代理通常包括：

- **代理类型**：定义决策逻辑的策略（如ReAct、工具选择等）
- **工具**：代理可以调用的函数或API
- **工具选择器**：帮助代理决定使用哪些工具
- **内存**：保持代理的对话和状态历史


## LangChain的核心组件

### 1. 模型 (Models)

LangChain支持多种类型的模型：

- **语言模型 (LLMs)**：接收文本输入并返回文本输出的模型
- **聊天模型 (Chat Models)**：接收消息列表并返回AI消息的模型
- **文本嵌入模型 (Text Embedding Models)**：将文本转换为数字向量的模型

LangChain提供了统一的接口，支持OpenAI、Anthropic、Google、Cohere、Hugging Face、本地模型等多种提供商。

### 2. 提示 (Prompts)

提示是与语言模型交互的关键，LangChain提供了多种工具来管理提示：

- **提示模板 (Prompt Templates)**：动态构建提示的模板
- **示例选择器 (Example Selectors)**：为少样本学习选择最相关的例子
- **输出解析器 (Output Parsers)**：将模型输出转换为结构化格式

### 3. 内存 (Memory)

内存组件使LangChain应用能够记住之前的交互：

- **对话缓冲记忆 (Conversation Buffer Memory)**：存储完整对话历史
- **摘要记忆 (Summary Memory)**：保存对话的摘要版本
- **实体记忆 (Entity Memory)**：跟踪对话中提到的特定实体

### 4. 检索 (Retrieval)

检索组件帮助LangChain从外部数据源获取相关信息：

- **文档加载器 (Document Loaders)**：从不同来源加载文档
- **文本分割器 (Text Splitters)**：将文档分割成可管理的块
- **向量存储 (Vector Stores)**：存储和检索文本嵌入
- **检索器 (Retrievers)**：通过语义相似性找到相关文档

### 5. 链 (Chains)

LangChain提供多种预定义链类型：

- **LLM链 (LLM Chain)**：最基本的链，将提示发送给LLM并返回结果
- **顺序链 (Sequential Chain)**：按顺序执行多个链
- **路由链 (Router Chain)**：根据输入选择不同的链
- **检索QA链 (Retrieval QA Chain)**：结合检索和问答功能
- **总结链 (Summarization Chain)**：生成长文档的摘要

### 6. 代理 (Agents)

LangChain的代理系统包括：

- **代理类型**：如ReAct（推理+行动）、思维链（CoT）等
- **工具**：代理可以调用的功能，从Web搜索到计算器
- **工具包**：预定义的工具集合，用于特定任务

## LangChain的主要应用场景

LangChain特别适合以下应用场景：

### 1. 检索增强生成（RAG）应用

RAG是LangChain最常见的用例，它使LLM能够访问特定知识：

- **文档问答**：回答关于特定文档的问题
- **知识库查询**：从公司知识库检索信息
- **搜索增强**：结合网络搜索和LLM的生成能力

![RAG应用架构](/img/langchain-rag.jpeg)

### 2. 对话式应用

LangChain简化了复杂对话应用的构建：

- **客户支持聊天机器人**：处理客户查询
- **虚拟助手**：执行任务并回答问题
- **模拟角色**：创建具有特定个性的聊天机器人

### 3. 代理系统

代理应用让LLM能够采取行动：

- **自动化助手**：执行复杂任务的自动化代理
- **研究助手**：收集信息并生成报告
- **数据分析助手**：处理数据并生成见解

### 4. 内容生成与处理

LangChain优化了内容生成工作流：

- **文本摘要**：长文档的自动摘要
- **内容创建**：生成结构化内容
- **文本分类和信息提取**：从文本中提取特定信息

## LangChain与其他框架的比较

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| **LangChain** | 全面的组件库，专注于组合性 | 复杂LLM应用，RAG系统，代理 |
| **LlamaIndex** | 专注于数据索引和检索 | 简化的RAG应用，数据连接 |
| **Haystack** | 模块化NLP管道，搜索功能强大 | 生产级搜索应用，问答系统 |
| **Semantic Kernel** | 微软开发，强调AI插件和内存 | .NET和Java环境，插件架构 |

## LangChain生态系统

LangChain生态系统包括多个相关项目：

- **LangChain**：核心框架（Python和JavaScript）
- **LangServe**：将链和代理部署为API
- **LangSmith**：调试、测试和监控LLM应用
- **LangGraph**：构建复杂工作流的新框架


## 结论

LangChain为构建强大的LLM应用提供了一套全面的工具和抽象层。它通过提供标准化接口、可重用组件和强大的组合能力，使开发者能够专注于应用逻辑而不是基础设施。

随着LLM技术的快速发展，LangChain持续演进，不断加入新功能和优化现有组件，保持其作为领先LLM应用开发框架的地位。

## 深度研究报告

如果您想深入了解LangChain框架的技术细节、架构演进、应用案例和发展趋势，请查看我们的[LangChain框架深度研究报告](/langchain/comprehensive-intro)。

该报告涵盖了：
- 核心概念与技术实现（架构演进、六大核心模块、LCEL编排）
- 前世今生（起源与发展、设计理念演进）
- 现状分析（生态系统成熟度、应用落地案例）
- 应用场景与行业案例（RAG系统、智能代理、企业应用）
- 框架对比分析（LangChain vs LlamaIndex vs Haystack）
- 发展趋势与未来展望

## 参考资源

- [官方文档](https://python.langchain.com/docs/get_started/introduction)
- [GitHub仓库](https://github.com/langchain-ai/langchain)
- [LangSmith平台](https://smith.langchain.com/)
- [LangChain社区](https://github.com/langchain-ai/langchain/discussions) 