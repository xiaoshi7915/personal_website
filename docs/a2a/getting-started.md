---
sidebar_position: 2
---

# 基础开发指南

本指南将帮助您快速了解并开始使用A2A协议，构建多代理协作系统。

## 环境准备

在开始使用A2A协议前，您需要准备以下环境：

### 技术要求

- **Node.js 16+** 或 **Python 3.8+**
- **Docker** (可选，用于容器化部署)
- **消息队列系统** (如RabbitMQ或Kafka，用于大型系统)
- **数据库** (用于状态持久化，推荐MongoDB或PostgreSQL)

### 开发工具

```bash
# JavaScript/TypeScript环境
npm install a2a-protocol a2a-core a2a-agents

# Python环境
pip install a2a-protocol a2a-core a2a-agents
```

## 快速入门示例

### 1. 创建一个简单的A2A代理（JavaScript）

```javascript
// 导入A2A核心库
const { Agent, MessageTypes } = require('a2a-core');

// 创建一个简单的数学运算代理
const mathAgent = new Agent({
  id: 'math-agent',
  name: '数学助手',
  description: '专门处理数学计算的代理',
  capabilities: ['addition', 'subtraction', 'multiplication', 'division']
});

// 注册处理请求的处理器
mathAgent.registerHandler(MessageTypes.REQUEST, (message) => {
  const { operation, numbers } = message.content;
  let result;
  
  switch(operation) {
    case 'addition':
      result = numbers.reduce((a, b) => a + b, 0);
      break;
    case 'subtraction':
      result = numbers.reduce((a, b, index) => index === 0 ? a : a - b, numbers[0] * 2);
      break;
    case 'multiplication':
      result = numbers.reduce((a, b) => a * b, 1);
      break;
    case 'division':
      result = numbers.reduce((a, b, index) => index === 0 ? a : a / b, numbers[0] * numbers[0]);
      break;
    default:
      throw new Error(`不支持的操作: ${operation}`);
  }
  
  return {
    type: MessageTypes.RESPONSE,
    content: {
      result: result,
      operation: operation
    }
  };
});

// 启动代理
mathAgent.start();
console.log('数学代理已启动并等待请求...');
```

### 2. 创建一个简单的A2A代理（Python）

```python
from a2a_core import Agent, MessageTypes

# 创建一个简单的文本处理代理
class TextAgent(Agent):
    def __init__(self):
        super().__init__(
            id="text-agent",
            name="文本助手",
            description="专门处理文本相关任务的代理",
            capabilities=["summarize", "translate", "sentiment_analysis"]
        )
        
    async def handle_request(self, message):
        task = message.content.get("task")
        text = message.content.get("text")
        
        if task == "summarize":
            result = self._summarize(text)
        elif task == "translate":
            target_lang = message.content.get("target_language", "en")
            result = self._translate(text, target_lang)
        elif task == "sentiment_analysis":
            result = self._analyze_sentiment(text)
        else:
            raise ValueError(f"不支持的任务: {task}")
        
        return {
            "type": MessageTypes.RESPONSE,
            "content": {
                "result": result,
                "task": task
            }
        }
    
    def _summarize(self, text):
        # 实际应用中可以使用NLP库进行摘要
        return "这是文本的摘要"
    
    def _translate(self, text, target_lang):
        # 实际应用中可以使用翻译API
        return f"这是翻译成{target_lang}的文本"
    
    def _analyze_sentiment(self, text):
        # 实际应用中可以使用情感分析库
        return {"sentiment": "positive", "confidence": 0.85}

# 创建并启动代理
text_agent = TextAgent()
text_agent.start()
print("文本代理已启动并等待请求...")
```

## 3. 代理之间的通信

让我们创建一个示例，展示两个代理如何相互通信：

```javascript
// 导入必要的库
const { AgentNetwork, Agent, MessageTypes } = require('a2a-core');

// 创建代理网络
const network = new AgentNetwork({
  name: "示例网络",
  description: "一个简单的代理网络示例"
});

// 创建问题解决代理
const problemSolverAgent = new Agent({
  id: 'problem-solver',
  name: '问题解决器',
  description: '接收用户问题并协调其他代理解决',
  capabilities: ['problem_decomposition', 'solution_synthesis']
});

// 创建数学代理
const mathAgent = new Agent({
  id: 'math-agent',
  name: '数学助手',
  description: '处理数学计算',
  capabilities: ['arithmetic', 'algebra']
});

// 注册代理到网络
network.registerAgent(problemSolverAgent);
network.registerAgent(mathAgent);

// 设置问题解决代理的处理逻辑
problemSolverAgent.registerHandler(MessageTypes.REQUEST, async (message) => {
  console.log(`收到问题: ${message.content.question}`);
  
  // 如果是数学问题，委托给数学代理
  if (message.content.question.includes('计算')) {
    // 创建发送给数学代理的消息
    const mathRequest = {
      sender: problemSolverAgent.id,
      receiver: 'math-agent',
      message_type: MessageTypes.REQUEST,
      content: {
        operation: 'addition',
        numbers: [5, 3, 2]
      }
    };
    
    // 发送请求给数学代理并等待响应
    const mathResponse = await network.sendMessage(mathRequest);
    
    // 处理并返回结果
    return {
      type: MessageTypes.RESPONSE,
      content: {
        answer: `计算结果是: ${mathResponse.content.result}`
      }
    };
  }
  
  // 处理其他类型的问题
  return {
    type: MessageTypes.RESPONSE,
    content: {
      answer: "我不确定如何解答这个问题。"
    }
  };
});

// 设置数学代理的处理逻辑
mathAgent.registerHandler(MessageTypes.REQUEST, (message) => {
  const { operation, numbers } = message.content;
  let result;
  
  switch(operation) {
    case 'addition':
      result = numbers.reduce((a, b) => a + b, 0);
      break;
    // 其他操作...
  }
  
  return {
    type: MessageTypes.RESPONSE,
    content: {
      result: result,
      operation: operation
    }
  };
});

// 启动网络
network.start();
console.log("代理网络已启动...");

// 模拟用户发送问题
setTimeout(() => {
  const userQuestion = {
    sender: 'user',
    receiver: 'problem-solver',
    message_type: MessageTypes.REQUEST,
    content: {
      question: "请计算5+3+2的结果"
    }
  };
  
  network.sendMessage(userQuestion)
    .then(response => {
      console.log(`回答: ${response.content.answer}`);
    });
}, 1000);
```

## A2A协议标准消息格式

所有A2A代理通信都应遵循以下标准消息格式：

```typescript
interface A2AMessage {
  // 消息元数据
  message_id: string;       // 唯一标识符
  conversation_id?: string; // 对话ID (可选)
  timestamp: string;        // ISO格式时间戳
  
  // 通信方
  sender: string;           // 发送代理ID
  receiver: string;         // 接收代理ID
  
  // 消息内容
  message_type: string;     // 消息类型 (REQUEST, RESPONSE, EVENT, etc.)
  content: any;             // 消息主体内容
  
  // 上下文信息
  context?: {
    parent_message_id?: string;  // 父消息ID (用于回复)
    thread_id?: string;          // 线程ID
    priority?: number;           // 优先级
    metadata?: Record<string, any>; // 其他元数据
  };
}
```

## A2A协议消息类型

A2A协议定义了多种标准消息类型：

1. **REQUEST**：请求执行特定任务
2. **RESPONSE**：对请求的响应
3. **EVENT**：通知其他代理发生的事件
4. **ERROR**：报告错误情况
5. **STATUS**：报告状态变化
6. **DISCOVERY**：代理能力发现和注册
7. **CONTROL**：控制代理行为的消息

## 高级特性

### 多代理协商

```javascript
// 代理间协商过程示例
const negotiationProtocol = {
  // 提出建议
  propose: (options) => ({
    type: "NEGOTIATE",
    action: "PROPOSE",
    options: options
  }),
  
  // 接受建议
  accept: (proposalId) => ({
    type: "NEGOTIATE",
    action: "ACCEPT",
    proposalId: proposalId
  }),
  
  // 拒绝建议
  reject: (proposalId, reason) => ({
    type: "NEGOTIATE",
    action: "REJECT",
    proposalId: proposalId,
    reason: reason
  }),
  
  // 提出修改方案
  counterPropose: (proposalId, amendments) => ({
    type: "NEGOTIATE",
    action: "COUNTER_PROPOSE",
    proposalId: proposalId,
    amendments: amendments
  })
};
```

### 知识共享

```javascript
// 知识共享示例
const knowledgeExchange = {
  // 发布知识
  publish: (topic, knowledge) => ({
    type: "KNOWLEDGE",
    action: "PUBLISH",
    topic: topic,
    content: knowledge
  }),
  
  // 请求知识
  request: (topic, query) => ({
    type: "KNOWLEDGE",
    action: "REQUEST",
    topic: topic,
    query: query
  }),
  
  // 订阅知识更新
  subscribe: (topic, criteria) => ({
    type: "KNOWLEDGE",
    action: "SUBSCRIBE",
    topic: topic,
    criteria: criteria
  })
};
```

## 最佳实践

### 代理设计原则

1. **单一职责**：每个代理应专注于特定领域或任务类型
2. **明确接口**：清晰定义代理能接收和发送的消息类型
3. **状态管理**：妥善处理代理内部状态，确保一致性
4. **错误处理**：优雅处理各种错误情况和边界条件
5. **可监控性**：加入适当的日志和监控机制

### 安全考虑

1. **身份验证**：确保只有授权代理能发送和接收消息
2. **消息加密**：敏感信息应进行加密传输
3. **权限控制**：实施适当的访问控制机制
4. **输入验证**：验证所有输入，防止注入攻击
5. **审计日志**：保留关键操作的审计记录

## 下一步

恭喜！您已经了解了A2A协议的基础知识。接下来，您可以：

1. 查看我们的[示例项目库](https://github.com/a2a-protocol/examples)
2. 阅读[完整的协议规范](/docs/a2a/protocol-spec)
3. 学习[高级开发指南](/docs/a2a/development)
4. 参与[社区讨论](https://discord.gg/a2a-protocol)

通过A2A协议，您可以构建复杂而强大的多代理协作系统，让各种专业AI代理协同工作，解决更广泛的问题! 