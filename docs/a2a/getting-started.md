---
sidebar_position: 2
---

# 基础开发指南

本指南将帮助你快速上手A2A协议，从环境配置到创建和部署你的第一个A2A代理。无论你是希望集成现有代理还是开发全新代理，这里都提供了必要的步骤和示例代码。

## 准备工作

在开始使用A2A协议之前，你需要准备以下环境：

### 安装A2A SDK

A2A SDK提供了各种编程语言的实现，选择你最熟悉的语言：

#### Python

```bash
pip install a2a-protocol
```

#### JavaScript/Node.js

```bash
npm install @a2a/protocol
```

#### Java

```xml
<dependency>
  <groupId>org.a2a</groupId>
  <artifactId>a2a-protocol</artifactId>
  <version>1.0.0</version>
</dependency>
```

### 注册A2A开发者账号

1. 访问[A2A开发者门户](https://dev.a2a-protocol.org)
2. 创建一个新的开发者账号
3. 生成API密钥和开发令牌

## 创建你的第一个A2A代理

### 基础代理模板

以下是创建一个简单A2A代理的基本代码模板（Python版本）：

```python
from a2a.protocol import Agent, Capability, Session, Registry

# 创建一个新的代理
agent = Agent(
    id="my-first-agent",
    name="My First Agent",
    description="A simple example agent with basic capabilities"
)

# 定义一个能力
@agent.capability
def greet(name: str) -> str:
    """向用户问好"""
    return f"Hello, {name}! I am {agent.name}."

# 定义另一个能力
@agent.capability
def calculate_sum(numbers: list[float]) -> float:
    """计算一组数字的总和"""
    return sum(numbers)

# 连接到A2A注册表
registry = Registry("https://registry.a2a-protocol.org")
agent.register(registry, api_key="your-api-key-here")

# 启动代理服务
agent.serve(host="0.0.0.0", port=8000)
```

### JavaScript/Node.js版本

```javascript
const { Agent, Registry } = require('@a2a/protocol');

// 创建一个新的代理
const agent = new Agent({
  id: "my-first-agent",
  name: "My First Agent",
  description: "A simple example agent with basic capabilities"
});

// 定义能力
agent.addCapability({
  id: "greet",
  name: "Greet",
  description: "向用户问好",
  handler: (name) => {
    return `Hello, ${name}! I am ${agent.name}.`;
  }
});

agent.addCapability({
  id: "calculate-sum",
  name: "Calculate Sum",
  description: "计算一组数字的总和",
  handler: (numbers) => {
    return numbers.reduce((a, b) => a + b, 0);
  }
});

// 连接到A2A注册表
const registry = new Registry("https://registry.a2a-protocol.org");
agent.register(registry, { apiKey: "your-api-key-here" });

// 启动代理服务
agent.serve({ host: "0.0.0.0", port: 8000 });
```

## 注册和发现代理

### 注册代理到注册表

当你的代理注册到A2A注册表时，它会提供以下信息：

- 代理ID和元数据（名称、描述、版本等）
- 代理提供的能力列表
- 每个能力的详细描述和参数
- 服务端点信息

```python
# 注册代理的详细示例
agent.register(
    registry,
    api_key="your-api-key",
    tags=["example", "tutorial"],
    version="1.0.0",
    contact_info="developer@example.com"
)
```

### 发现其他代理

你可以通过注册表查找和发现其他代理：

```python
# 查找所有具有特定标签的代理
nlp_agents = registry.find_agents(tags=["nlp"])

# 查找具有特定能力的代理
translation_agents = registry.find_agents(capabilities=["translate_text"])

# 查找特定代理ID
specific_agent = registry.get_agent("expert-translation-agent")
```

## 代理间通信

### 创建会话

代理间的通信发生在会话中，这是一个持久的上下文环境：

```python
# 创建一个新会话
session = Session(
    initiator=my_agent.id,
    participants=[specific_agent.id],
    metadata={"purpose": "Translation example"}
)
```

### 调用其他代理的能力

```python
# 调用其他代理的能力
response = session.call_capability(
    agent_id="expert-translation-agent",
    capability_id="translate_text",
    parameters={
        "text": "Hello, world!",
        "source_language": "en",
        "target_language": "zh"
    }
)

translated_text = response.result
print(f"翻译结果: {translated_text}")
```

### 异步调用

对于长时间运行的任务，可以使用异步调用：

```python
# 异步调用
task = session.call_capability_async(
    agent_id="data-analysis-agent",
    capability_id="analyze_large_dataset",
    parameters={
        "dataset_url": "https://example.com/large-dataset.csv",
        "analysis_type": "comprehensive"
    }
)

# 检查任务状态
status = task.get_status()

# 获取最终结果
if task.is_completed():
    result = task.get_result()
    print(f"分析结果: {result}")
```

## 高级功能

### 状态管理

会话可以存储和共享状态信息：

```python
# 设置会话状态
session.set_state("current_language", "zh")
session.set_state("user_preference", {"format": "detailed", "examples": True})

# 获取会话状态
current_language = session.get_state("current_language")
```

### 权限和访问控制

控制谁可以访问你的代理能力：

```python
# 定义访问控制规则
@agent.capability(
    access_control={
        "public": False,
        "allowed_agents": ["trusted-agent-1", "trusted-agent-2"],
        "requires_authentication": True
    }
)
def sensitive_operation(data: dict) -> dict:
    # 实现敏感操作
    return processed_data
```

### 事件订阅

订阅其他代理的事件：

```python
# 定义事件处理函数
def handle_data_update(event_data):
    print(f"收到数据更新: {event_data}")

# 订阅事件
session.subscribe(
    agent_id="data-provider-agent",
    event_type="data_updated",
    handler=handle_data_update
)
```

## 实际应用示例

### 多代理翻译系统

下面是一个多代理翻译系统的示例，它结合了语言检测、翻译和文化适应三个专业代理：

```python
from a2a.protocol import Agent, Session, Registry

# 初始化代理和注册表
registry = Registry("https://registry.a2a-protocol.org")
coordinator = Agent(id="translation-coordinator", api_key="your-api-key")

# 创建会话
session = Session(initiator=coordinator.id)

# 查找所需代理
language_detector = registry.get_agent("language-detection-expert")
translator = registry.get_agent("neural-translator-pro")
cultural_adapter = registry.get_agent("cultural-context-adapter")

# 添加参与者到会话
session.add_participants([
    language_detector.id,
    translator.id,
    cultural_adapter.id
])

# 翻译工作流
def translate_with_cultural_context(text, target_language):
    # 1. 检测源语言
    detect_result = session.call_capability(
        language_detector.id,
        "detect_language",
        {"text": text}
    )
    source_language = detect_result.result
    
    # 2. 进行基础翻译
    translation_result = session.call_capability(
        translator.id,
        "translate_text",
        {
            "text": text,
            "source_language": source_language,
            "target_language": target_language
        }
    )
    basic_translation = translation_result.result
    
    # 3. 应用文化适应
    final_result = session.call_capability(
        cultural_adapter.id,
        "adapt_cultural_context",
        {
            "text": basic_translation,
            "language": target_language,
            "preserve_meaning": True
        }
    )
    
    return {
        "original_text": text,
        "source_language": source_language,
        "target_language": target_language,
        "basic_translation": basic_translation,
        "culturally_adapted_translation": final_result.result
    }

# 使用此工作流
result = translate_with_cultural_context(
    "The early bird catches the worm", 
    "zh"
)
print(result)
```

## 部署你的A2A代理

### Docker容器部署

创建一个`Dockerfile`：

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "agent.py"]
```

构建和运行容器：

```bash
docker build -t my-a2a-agent .
docker run -p 8000:8000 -e A2A_API_KEY=your-api-key my-a2a-agent
```

### 云服务部署

大多数云平台都支持部署A2A代理，例如：

- AWS Lambda + API Gateway
- Google Cloud Functions
- Azure Functions
- Heroku

### 监控和管理

部署后，使用A2A管理控制台监控你的代理：

1. 访问[A2A管理控制台](https://console.a2a-protocol.org)
2. 登录你的开发者账号
3. 在"我的代理"部分查看代理状态
4. 监控性能指标、调用次数和错误率
5. 设置警报和通知

## 调试技巧

### 本地测试

使用A2A模拟器进行本地测试：

```python
from a2a.protocol import Simulator

# 创建模拟环境
sim = Simulator()

# 添加你的代理
sim.add_agent(my_agent)

# 添加模拟代理(模拟其他可能的代理)
sim.add_mock_agent(
    id="mock-translation-agent",
    capabilities={
        "translate_text": lambda params: f"[翻译] {params['text']}"
    }
)

# 运行模拟测试
result = sim.test_workflow(
    initiator=my_agent.id,
    workflow=[
        {"agent": my_agent.id, "capability": "greet", "params": {"name": "Alice"}},
        {"agent": "mock-translation-agent", "capability": "translate_text", "params": {"text": "Hello"}}
    ]
)

# 查看结果
print(result)
```

### 日志和追踪

启用详细日志以便调试：

```python
import logging
from a2a.protocol import set_log_level

# 设置日志级别
set_log_level(logging.DEBUG)

# 启用追踪
agent.enable_tracing(output_dir="./traces")
```

## 最佳实践

1. **明确定义能力**：为每个能力提供清晰的描述、参数说明和返回值类型。
2. **提供健壮的错误处理**：处理各种可能的输入错误和边缘情况。
3. **实现优雅降级**：当依赖的代理不可用时，提供备选方案。
4. **关注性能**：对于频繁调用的能力，优化响应时间。
5. **遵循安全最佳实践**：验证所有输入，限制访问敏感能力。
6. **版本控制**：明确标记你的代理和能力版本，支持向后兼容。
7. **提供良好文档**：为你的代理和每个能力提供详细文档。


## 常见问题解答

**Q: A2A协议是否支持自托管注册表?**  
A: 是的，你可以部署自己的私有A2A注册表，适用于企业内部或敏感环境。

**Q: 我可以同时使用多个框架的代理吗?**  
A: 是的，A2A协议的设计确保不同语言和框架实现的代理可以无缝协作。

**Q: A2A协议如何处理大型数据传输?**  
A: 对于大型数据，建议使用引用传递（如URL或标识符）而不是直接在消息中包含数据。

**Q: 如何确保我的代理安全?**  
A: 实施适当的访问控制、验证所有输入、使用加密通信，并定期更新依赖项。

**Q: 代理间通信的延迟如何?**  
A: 延迟取决于部署架构，但A2A协议本身经过优化，引入的额外延迟最小。 