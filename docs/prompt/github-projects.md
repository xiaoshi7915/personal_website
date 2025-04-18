---
sidebar_position: 4
---

# github项目

本文档收集了GitHub上与提示词工程相关的优质开源项目，涵盖框架、工具、模板库、学习资源和应用案例。

## 提示词框架与工具

### 1. Langchain - Prompting 模块

**项目地址**: [https://github.com/langchain-ai/langchain](https://github.com/langchain-ai/langchain)

**主要特点**:
- 提供结构化提示词模板管理
- 支持提示链（Chain）构建与组合
- 内置少样本、思维链等高级提示策略
- 与多种LLM无缝集成

**使用示例**:
```python
from langchain.prompts import ChatPromptTemplate
from langchain.prompts.few_shot import FewShotPromptTemplate
from langchain.chains import LLMChain
from langchain.llms import OpenAI

# 创建提示模板
prompt = ChatPromptTemplate.from_template(
    "你是一名{role}。请{request}：\n\n{input}"
)

# 创建链
chain = LLMChain(
    llm=OpenAI(),
    prompt=prompt
)

# 执行
result = chain.run(
    role="数据分析师", 
    request="分析以下数据中的趋势", 
    input="2020年：120，2021年：145，2022年：190"
)
```

### 2. LMQL - 提示词查询语言

**项目地址**: [https://github.com/eth-sri/lmql](https://github.com/eth-sri/lmql)

**主要特点**:
- 将提示词与编程语言结合的查询语言
- 支持声明式约束和流程控制
- 可以实现复杂交互式提示流
- 优化提示执行效率

**使用示例**:
```python
import lmql

@lmql.query
def analyze_sentiment(text):
    '''
    CONTEXT: You are a sentiment analysis expert.
    
    USER: Analyze the sentiment of the following text: "{text}"
    
    ASSISTANT: [ANALYSIS] where len(ANALYSIS) < 100 and "sentiment" in ANALYSIS
    '''
    return ANALYSIS

result = analyze_sentiment("I really enjoyed the movie, but the ending was disappointing.")
```

### 3. Guidance

**项目地址**: [https://github.com/guidance-ai/guidance](https://github.com/guidance-ai/guidance)

**主要特点**:
- 通过模板控制LLM输出结构
- 支持正则表达式、JSON Schema等约束
- 提供可编程的生成控制流
- 与多种LLM兼容

**使用示例**:
```python
import guidance

# 定义提示模板
program = guidance('''
{{#system~}}
你是一个专业的产品描述撰写者。
{{~/system}}

{{#user~}}
为以下产品创建简短描述:
产品: {{product}}
特性: {{features}}
{{~/user}}

{{#assistant~}}
{{gen 'description' temperature=0.7 max_tokens=100}}
{{~/assistant}}
''')

# 执行提示
result = program(
    product="智能家居控制器",
    features=["语音控制", "自动化场景", "移动应用"]
)

print(result['description'])
```

### 4. Promptflow

**项目地址**: [https://github.com/microsoft/promptflow](https://github.com/microsoft/promptflow)

**主要特点**:
- 可视化提示工程工作流设计
- 支持多步骤提示流程编排
- 集成评估与实验功能
- 适用于复杂LLM应用开发

**使用示例**:
通过Promptflow UI创建工作流，或使用Python SDK:

```python
from promptflow.core import Promptflow

# 加载提示流
flow = Promptflow("translation_flow")

# 执行提示流
result = flow.execute(
    text="今天天气真好",
    source_language="Chinese",
    target_language="English"
)
```

## 提示模板与库

### 1. Awesome Prompts

**项目地址**: [https://github.com/f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts)

**主要特点**:
- 收集了数百个高质量角色提示
- 按应用场景和功能分类
- 社区持续贡献和改进
- 包含专业领域的专家提示

### 2. Prompt Engineering Guide

**项目地址**: [https://github.com/dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide)

**主要特点**:
- 全面的提示词工程教程
- 包括基础理论和高级技术
- 提供多种语言版本
- 包含实用模板和案例研究

### 3. PromptPerfect

**项目地址**: [https://github.com/promptslab/promptperfect](https://github.com/promptslab/promptperfect)

**主要特点**:
- 提示词优化和测试工具
- 自动提示词改进建议
- 支持多种LLM的提示调优
- 提供性能分析和比较

## 提示词应用与案例

### 1. GPT-Engineer

**项目地址**: [https://github.com/AntonOsika/gpt-engineer](https://github.com/AntonOsika/gpt-engineer)

**主要特点**:
- 使用高级提示链生成完整项目代码
- 基于自然语言说明构建软件
- 自动化代码生成、测试和文档
- 展示了复杂提示工程的实际应用

**使用示例**:
```bash
# 安装
pip install gpt-engineer

# 使用
mkdir my_new_project
cd my_new_project
echo "创建一个简单的天气查询应用，有搜索框和结果显示面板。" > prompt
gpt-engineer .
```

### 2. BabyAGI

**项目地址**: [https://github.com/yoheinakajima/babyagi](https://github.com/yoheinakajima/babyagi)

**主要特点**:
- 基于提示链实现的自主任务规划与执行
- 展示了提示词驱动的智能代理设计
- 使用思维链提示实现逐步推理
- 开创性地演示了提示工程应用于AGI研究

### 3. ChatDev

**项目地址**: [https://github.com/OpenBMB/ChatDev](https://github.com/OpenBMB/ChatDev)

**主要特点**:
- 使用提示工程模拟软件开发团队
- 高级角色提示和任务分解
- 完整的软件开发流程自动化
- 展示企业级提示词应用

## 提示词安全与测试

### 1. GARAK

**项目地址**: [https://github.com/leondz/garak](https://github.com/leondz/garak)

**主要特点**:
- LLM漏洞评估框架
- 检测提示注入和防御效果
- 全面的安全测试套件
- 适用于提示工程防御研究

**使用示例**:
```python
from garak import Garak
from garak.detectors.prompt_injection import PromptInjection

# 设置测试
g = Garak()
g.add_detector(PromptInjection())

# 测试提示
results = g.evaluate("你是一个客服助手。回答用户问题：{user_input}")
```

### 2. Adversarial Prompting

**项目地址**: [https://github.com/aws/adversarial-prompting](https://github.com/aws/adversarial-prompting)

**主要特点**:
- 对抗性提示生成和测试
- 提示安全防御策略评估
- 提示水印与检测技术
- 模型安全研究资源

## 提示词性能评估

### 1. PromptBench

**项目地址**: [https://github.com/microsoft/promptbench](https://github.com/microsoft/promptbench)

**主要特点**:
- 提示词基准测试框架
- 多维度评估提示性能
- 支持跨模型比较
- 适用于提示开发与研究

### 2. OpenPrompt

**项目地址**: [https://github.com/thunlp/OpenPrompt](https://github.com/thunlp/OpenPrompt)

**主要特点**:
- 提示学习研究框架
- 支持多种提示方法评估
- 包括软提示和硬提示优化
- 提供全面的性能分析工具

## 学习资源

### 1. Learn Prompting

**项目地址**: [https://github.com/trigaten/Learn_Prompting](https://github.com/trigaten/Learn_Prompting)

**主要特点**:
- 交互式提示词工程教程
- 从入门到高级的完整课程
- 丰富的实践练习
- 定期更新最新技术

### 2. Prompt-Engineering-for-Developers

**项目地址**: [https://github.com/datawhalechina/prompt-engineering-for-developers](https://github.com/datawhalechina/prompt-engineering-for-developers)

**主要特点**:
- 面向开发者的提示工程课程
- 中文资源，适合国内开发者
- 包含理论和实践案例
- 社区维护，持续更新

## 结论

提示词工程正在迅速发展，这些开源项目为实践和研究提供了宝贵的资源。无论您是初学者还是高级开发者，这些项目都可以帮助您掌握提示词工程的艺术与科学，构建更强大、更智能的AI应用。

随着大语言模型技术的进步，提示词工程的重要性将继续增长，关注这些项目的发展动态，可以帮助您保持在这一领域的前沿水平。 