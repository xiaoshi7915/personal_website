# 6. 接口与体验

## 6.1 开放API

### API设计

智能客服系统提供RESTful API，支持多种客户端接入：

#### API架构

**基础URL**：
```
https://api.example.com/v1/customer-service
```

**核心接口**：

**1. 创建对话（Create Chat）**
```
POST /chats
Content-Type: application/json

{
    "user_id": "user_123",
    "channel": "web",
    "metadata": {
        "ip": "192.168.1.1",
        "user_agent": "Mozilla/5.0..."
    }
}

Response:
{
    "chat_id": "chat_456",
    "status": "active",
    "created_at": "2024-01-01T10:00:00Z"
}
```

**2. 发送消息（Send Message）**
```
POST /chats/{chat_id}/messages
Content-Type: application/json

{
    "content": "这个产品有什么功能？",
    "type": "text"
}

Response:
{
    "message_id": "msg_789",
    "content": "这个产品具有以下功能：1. 功能A 2. 功能B 3. 功能C",
    "type": "text",
    "timestamp": "2024-01-01T10:00:05Z",
    "confidence": 0.95
}
```

**3. 获取对话历史（Get Chat History）**
```
GET /chats/{chat_id}/messages?limit=50&offset=0

Response:
{
    "messages": [
        {
            "message_id": "msg_001",
            "role": "user",
            "content": "问题1",
            "timestamp": "2024-01-01T10:00:00Z"
        },
        {
            "message_id": "msg_002",
            "role": "assistant",
            "content": "回答1",
            "timestamp": "2024-01-01T10:00:05Z"
        }
    ],
    "total": 100,
    "limit": 50,
    "offset": 0
}
```

**4. 评价对话（Rate Chat）**
```
POST /chats/{chat_id}/rating
Content-Type: application/json

{
    "rating": 5,
    "comment": "回答很准确，服务很好"
}

Response:
{
    "status": "success",
    "message": "评价已提交"
}
```

#### API设计原则

**RESTful设计**：
- 使用标准HTTP方法（GET、POST、PUT、DELETE）
- 资源导向的URL设计
- 状态码正确使用（200、201、400、404、500等）

**版本管理**：
- URL中包含版本号（/v1/、/v2/）
- 向后兼容，旧版本至少支持6个月
- 版本变更文档化

**错误处理**：
```json
{
    "error": {
        "code": "INVALID_PARAMETER",
        "message": "参数user_id不能为空",
        "details": {
            "field": "user_id",
            "reason": "required"
        }
    }
}
```

### 认证授权

#### 认证方式

**API Key认证**：
- 每个客户端分配唯一的API Key
- 在请求头中携带：`Authorization: Bearer {api_key}`
- 简单易用，适合服务端调用

**OAuth 2.0认证**：
- 支持标准OAuth 2.0流程
- 获取Access Token后使用
- 适合第三方应用集成

**JWT Token认证**：
- 用户登录后获取JWT Token
- Token包含用户信息和权限
- 适合Web和移动端应用

#### 权限控制

**角色定义**：
- **普通用户**：只能访问自己的对话
- **客服管理员**：可以访问所有对话，管理知识库
- **系统管理员**：拥有所有权限

**权限检查**：
```python
from functools import wraps

def require_permission(permission):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user.has_permission(permission):
                raise PermissionError("权限不足")
            return func(*args, **kwargs)
        return wrapper
    return decorator

@require_permission("chat.read")
def get_chat_history(chat_id):
    # 获取对话历史
    pass
```

### API文档

#### 文档工具

**Swagger/OpenAPI**：
- 使用OpenAPI 3.0规范
- 自动生成交互式API文档
- 支持在线测试API

**访问地址**：
```
https://api.example.com/docs
```

**文档内容**：
- API端点列表
- 请求/响应示例
- 参数说明
- 错误码说明
- 认证方式说明

## 6.2 多终端SDK

### SDK类型

#### Web SDK（JavaScript）

**功能特性**：
- 对话管理
- 消息发送和接收
- 实时通信（WebSocket）
- 历史记录查询
- 文件上传

**安装**：
```bash
npm install @company/customer-service-sdk
```

**使用示例**：
```javascript
import { CustomerServiceSDK } from '@company/customer-service-sdk';

const sdk = new CustomerServiceSDK({
    apiKey: 'your-api-key',
    endpoint: 'https://api.example.com'
});

// 创建对话
const chat = await sdk.createChat({
    userId: 'user_123'
});

// 发送消息
const response = await sdk.sendMessage(chat.id, {
    content: '这个产品有什么功能？'
});

console.log(response.content);
```

#### 移动端SDK

**iOS SDK（Swift）**：
```swift
import CustomerServiceSDK

let sdk = CustomerServiceSDK(apiKey: "your-api-key")
let chat = try await sdk.createChat(userId: "user_123")
let response = try await sdk.sendMessage(
    chatId: chat.id,
    content: "这个产品有什么功能？"
)
print(response.content)
```

**Android SDK（Kotlin）**：
```kotlin
import com.company.customerservice.CustomerServiceSDK

val sdk = CustomerServiceSDK(apiKey = "your-api-key")
val chat = sdk.createChat(userId = "user_123")
val response = sdk.sendMessage(
    chatId = chat.id,
    content = "这个产品有什么功能？"
)
println(response.content)
```

#### Python SDK

**功能特性**：
- 完整的API封装
- 异步支持
- 类型提示
- 错误处理

**使用示例**：
```python
from customer_service_sdk import CustomerServiceSDK

sdk = CustomerServiceSDK(api_key="your-api-key")

# 创建对话
chat = sdk.create_chat(user_id="user_123")

# 发送消息
response = sdk.send_message(
    chat_id=chat.id,
    content="这个产品有什么功能？"
)

print(response.content)
```

### SDK功能

#### 核心功能

**1. 对话管理**
- 创建、查询、关闭对话
- 对话状态管理
- 对话历史查询

**2. 消息处理**
- 发送文本、图片、文件消息
- 接收实时消息推送
- 消息状态跟踪

**3. 实时通信**
- WebSocket连接管理
- 自动重连机制
- 心跳保活

**4. 文件上传**
- 图片上传和预览
- 文件上传进度跟踪
- 文件类型验证

### 集成示例

#### Vue 3集成示例

```vue
<template>
  <div class="chat-container">
    <div class="messages">
      <div v-for="msg in messages" :key="msg.id" :class="msg.role">
        {{ msg.content }}
      </div>
    </div>
    <input v-model="inputText" @keyup.enter="sendMessage" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CustomerServiceSDK } from '@company/customer-service-sdk'

const sdk = new CustomerServiceSDK({
  apiKey: import.meta.env.VITE_API_KEY
})

const messages = ref([])
const inputText = ref('')
let chatId = null

onMounted(async () => {
  const chat = await sdk.createChat({ userId: 'user_123' })
  chatId = chat.id
  
  // 监听新消息
  sdk.onMessage((message) => {
    messages.value.push(message)
  })
})

const sendMessage = async () => {
  if (!inputText.value) return
  
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: inputText.value
  })
  
  const response = await sdk.sendMessage(chatId, {
    content: inputText.value
  })
  
  messages.value.push({
    id: response.message_id,
    role: 'assistant',
    content: response.content
  })
  
  inputText.value = ''
}
</script>
```

## 6.3 可视化运营后台

### 功能模块

#### 1. 对话管理模块

**功能**：
- 实时对话监控
- 对话历史查询
- 对话统计分析
- 异常对话标记

**界面特性**：
- 实时更新对话列表
- 支持多条件筛选
- 对话详情查看
- 批量操作支持

#### 2. 知识库管理模块

**功能**：
- 知识文档上传和管理
- 知识分类和标签
- 知识检索测试
- 知识效果评估

**界面特性**：
- 可视化文档编辑器
- 拖拽式分类管理
- 实时检索测试
- 知识质量评分

#### 3. 模型配置模块

**功能**：
- 模型选择和配置
- Prompt模板管理
- A/B测试配置
- 模型效果监控

**界面特性**：
- 可视化Prompt编辑器
- 模型性能对比图表
- A/B测试结果展示
- 一键切换模型

#### 4. 数据分析模块

**功能**：
- 服务质量分析
- 用户行为分析
- 问题分类统计
- 趋势预测分析

**界面特性**：
- 丰富的图表展示
- 自定义报表生成
- 数据导出功能
- 实时数据更新

### 数据看板

#### 核心指标看板

**实时指标**：
- 当前在线用户数
- 当前处理中对话数
- 平均响应时间
- 系统可用率

**服务质量指标**：
- 首次解决率（FCR）
- 客户满意度（CSAT）
- 平均对话轮次
- 转人工率

**业务指标**：
- 日/周/月对话量
- 问题分类分布
- 高峰时段分析
- 用户留存率

#### 可视化图表

**折线图**：展示指标趋势变化
**柱状图**：对比不同分类的数据
**饼图**：展示占比分布
**热力图**：展示时段分布

**技术实现**：
- 使用ECharts或Chart.js
- 实时数据更新
- 交互式图表
- 数据钻取功能

### 运营工具

#### 1. 批量操作工具

**功能**：
- 批量导入知识
- 批量更新配置
- 批量导出数据
- 批量标记对话

#### 2. 自动化规则工具

**功能**：
- 设置自动回复规则
- 设置自动转人工规则
- 设置自动标签规则
- 设置告警规则

**配置示例**：
```json
{
    "rule_name": "自动转人工",
    "conditions": [
        {
            "field": "sentiment",
            "operator": "equals",
            "value": "negative"
        },
        {
            "field": "confidence",
            "operator": "less_than",
            "value": 0.7
        }
    ],
    "action": "transfer_to_human"
}
```

#### 3. 测试工具

**功能**：
- 知识库检索测试
- Prompt效果测试
- 端到端流程测试
- 性能压力测试

#### 4. 报表工具

**功能**：
- 自定义报表设计
- 定时报表生成
- 报表邮件发送
- 报表数据导出

**报表类型**：
- 日报、周报、月报
- 服务质量报表
- 业务分析报表
- 成本分析报表