---
sidebar_position: 4
---

# A2A 协议规范

本文档详细介绍了Agent-to-Agent (A2A) 协议的技术规范，包括通信格式、消息结构、状态管理等核心要素。

## 协议概述

A2A 协议是一种专为智能代理（Agent）之间通信设计的协议框架，旨在实现多个智能体之间的协作、信息交换和任务委托。协议基于标准化的JSON消息格式，支持异步通信和会话管理。

### 设计原则

- **简单性**：易于实现和集成到现有系统
- **灵活性**：适应不同类型的代理和任务场景
- **可扩展性**：支持自定义消息类型和功能扩展
- **安全性**：内置身份验证和权限控制机制

## 消息结构

A2A协议中的所有通信都采用标准化的消息结构：

```json
{
  "message_id": "msg_123456789",
  "session_id": "session_987654321",
  "timestamp": "2023-04-18T10:30:00Z",
  "sender": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "recipient": {
    "agent_id": "agent_bob",
    "agent_type": "expert"
  },
  "message_type": "request",
  "content": {
    // 消息具体内容，根据消息类型而异
  },
  "metadata": {
    // 可选的元数据
  }
}
```

### 核心字段说明

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| message_id | string | 是 | 消息的唯一标识符 |
| session_id | string | 是 | 会话的唯一标识符 |
| timestamp | string | 是 | ISO 8601格式的时间戳 |
| sender | object | 是 | 发送者信息 |
| recipient | object | 是 | 接收者信息 |
| message_type | string | 是 | 消息类型（如request、response、error等） |
| content | object | 是 | 消息主体内容 |
| metadata | object | 否 | 附加信息 |

## 消息类型

A2A协议支持以下基本消息类型：

### 1. 请求消息 (Request)

用于代理向其他代理请求信息或服务。

```json
{
  "message_id": "msg_req_12345",
  "session_id": "session_987654321",
  "timestamp": "2023-04-18T10:30:00Z",
  "sender": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "recipient": {
    "agent_id": "agent_bob",
    "agent_type": "expert"
  },
  "message_type": "request",
  "content": {
    "request_type": "information",
    "query": "What is the current weather in New York?",
    "priority": "normal",
    "timeout": 30
  }
}
```

### 2. 响应消息 (Response)

用于代理回应其他代理的请求。

```json
{
  "message_id": "msg_res_67890",
  "session_id": "session_987654321",
  "timestamp": "2023-04-18T10:32:00Z",
  "sender": {
    "agent_id": "agent_bob",
    "agent_type": "expert"
  },
  "recipient": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "message_type": "response",
  "content": {
    "in_response_to": "msg_req_12345",
    "status": "success",
    "data": {
      "temperature": 72,
      "conditions": "sunny",
      "location": "New York, NY"
    }
  }
}
```

### 3. 通知消息 (Notification)

用于代理向其他代理发送主动通知，无需回复。

```json
{
  "message_id": "msg_not_24680",
  "session_id": "session_987654321",
  "timestamp": "2023-04-18T10:40:00Z",
  "sender": {
    "agent_id": "agent_system",
    "agent_type": "system"
  },
  "recipient": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "message_type": "notification",
  "content": {
    "notification_type": "alert",
    "message": "System maintenance scheduled in 30 minutes",
    "severity": "info"
  }
}
```

### 4. 错误消息 (Error)

用于代理返回错误状态或异常情况。

```json
{
  "message_id": "msg_err_13579",
  "session_id": "session_987654321",
  "timestamp": "2023-04-18T10:35:00Z",
  "sender": {
    "agent_id": "agent_bob",
    "agent_type": "expert"
  },
  "recipient": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "message_type": "error",
  "content": {
    "in_response_to": "msg_req_12345",
    "error_code": "resource_not_found",
    "error_message": "The requested weather data is not available",
    "severity": "warning"
  }
}
```

## 会话管理

A2A协议使用会话（Session）来管理相关消息的上下文和状态。

### 会话创建

会话创建通过特殊的会话初始化消息完成：

```json
{
  "message_id": "msg_init_11111",
  "session_id": "session_new_123456",
  "timestamp": "2023-04-18T10:25:00Z",
  "sender": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "recipient": {
    "agent_id": "agent_bob",
    "agent_type": "expert"
  },
  "message_type": "session_control",
  "content": {
    "action": "create",
    "session_parameters": {
      "purpose": "weather_inquiry",
      "timeout": 300,
      "priority": "normal"
    }
  }
}
```

### 会话终止

会话可以通过会话控制消息显式终止：

```json
{
  "message_id": "msg_term_22222",
  "session_id": "session_987654321",
  "timestamp": "2023-04-18T11:00:00Z",
  "sender": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "recipient": {
    "agent_id": "agent_bob",
    "agent_type": "expert"
  },
  "message_type": "session_control",
  "content": {
    "action": "terminate",
    "reason": "task_completed"
  }
}
```

## 安全机制

A2A协议实现了多层安全机制：

### 身份验证

每个代理必须提供有效的认证凭证：

```json
{
  "message_id": "msg_auth_33333",
  "timestamp": "2023-04-18T10:20:00Z",
  "sender": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "recipient": {
    "agent_id": "agent_auth",
    "agent_type": "system"
  },
  "message_type": "authentication",
  "content": {
    "auth_method": "token",
    "credentials": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiration": "2023-04-19T10:20:00Z"
    }
  }
}
```

### 加密

A2A协议支持端到端加密，可选择不同的加密算法：

```json
{
  "message_id": "msg_enc_44444",
  "session_id": "session_987654321",
  "timestamp": "2023-04-18T10:22:00Z",
  "sender": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "recipient": {
    "agent_id": "agent_bob",
    "agent_type": "expert"
  },
  "message_type": "session_control",
  "content": {
    "action": "set_encryption",
    "encryption_parameters": {
      "algorithm": "AES-256-GCM",
      "public_key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A..."
    }
  },
  "metadata": {
    "encryption": {
      "status": "initialization"
    }
  }
}
```

## 任务委托模式

A2A协议支持代理之间的任务委托，允许一个代理将任务分配给其他代理处理：

```json
{
  "message_id": "msg_task_55555",
  "session_id": "session_987654321",
  "timestamp": "2023-04-18T10:45:00Z",
  "sender": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "recipient": {
    "agent_id": "agent_bob",
    "agent_type": "expert"
  },
  "message_type": "task_delegation",
  "content": {
    "task_id": "task_123456",
    "task_type": "data_analysis",
    "description": "Analyze weather patterns in New York for the last 30 days",
    "parameters": {
      "data_source": "weather_database",
      "time_range": {
        "start": "2023-03-19T00:00:00Z",
        "end": "2023-04-18T00:00:00Z"
      },
      "location": "New York, NY"
    },
    "deadline": "2023-04-18T11:45:00Z",
    "priority": "high"
  }
}
```

## 实现指南

### 服务器实现

支持A2A协议的服务器应实现以下基本功能：

1. 消息路由和传递
2. 会话管理
3. 代理认证和授权
4. 消息持久化存储
5. 错误处理和重试机制

### 客户端实现

代理客户端应实现以下功能：

1. 消息序列化和反序列化
2. 会话状态维护
3. 身份认证
4. 错误处理和超时机制
5. 消息加密和解密

## 协议扩展

A2A协议设计为可扩展的，支持通过自定义消息类型和内容格式进行功能扩展。扩展应遵循以下命名约定：

- 自定义消息类型应使用`x-`前缀
- 自定义字段应使用`x_`前缀

示例：

```json
{
  "message_id": "msg_ext_66666",
  "session_id": "session_987654321",
  "timestamp": "2023-04-18T10:50:00Z",
  "sender": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "recipient": {
    "agent_id": "agent_bob",
    "agent_type": "expert"
  },
  "message_type": "x-collaborative_planning",
  "content": {
    "plan_id": "plan_789012",
    "x_visualization_format": "gantt",
    "x_priority_algorithm": "custom_priority_v2"
  }
}
```

## 兼容性和版本控制

A2A协议使用语义化版本控制（Semantic Versioning）来管理协议版本：

```json
{
  "message_id": "msg_version_77777",
  "session_id": "session_987654321",
  "timestamp": "2023-04-18T09:55:00Z",
  "sender": {
    "agent_id": "agent_alice",
    "agent_type": "assistant"
  },
  "recipient": {
    "agent_id": "agent_bob",
    "agent_type": "expert"
  },
  "message_type": "session_control",
  "content": {
    "action": "negotiate_version",
    "supported_versions": ["1.0.0", "1.1.0", "1.2.0"]
  },
  "metadata": {
    "protocol_version": "1.2.0"
  }
}
```

## 示例场景

### 多代理协作场景

下面是一个涉及多个代理协作完成任务的完整示例：

1. 用户向主助手代理提出复杂问题
2. 主助手将问题分解并委托给专家代理
3. 专家代理处理并返回结果
4. 主助手整合结果并回复用户

```json
// 步骤1: 用户向主助手提问 (不在A2A协议范围内)

// 步骤2: 主助手向数据分析专家发送任务委托
{
  "message_id": "msg_task_88888",
  "session_id": "session_user_q123",
  "timestamp": "2023-04-18T14:00:00Z",
  "sender": {
    "agent_id": "agent_main_assistant",
    "agent_type": "assistant"
  },
  "recipient": {
    "agent_id": "agent_data_expert",
    "agent_type": "expert"
  },
  "message_type": "task_delegation",
  "content": {
    "task_id": "subtask_data_1",
    "task_type": "data_analysis",
    "description": "Analyze sales data for Q1 2023",
    "parameters": {
      "data_source": "sales_database",
      "time_range": {
        "start": "2023-01-01T00:00:00Z",
        "end": "2023-03-31T23:59:59Z"
      },
      "metrics": ["revenue", "growth", "customer_acquisition"]
    },
    "deadline": "2023-04-18T14:10:00Z"
  }
}

// 步骤3: 数据专家向主助手返回分析结果
{
  "message_id": "msg_res_99999",
  "session_id": "session_user_q123",
  "timestamp": "2023-04-18T14:08:00Z",
  "sender": {
    "agent_id": "agent_data_expert",
    "agent_type": "expert"
  },
  "recipient": {
    "agent_id": "agent_main_assistant",
    "agent_type": "assistant"
  },
  "message_type": "response",
  "content": {
    "in_response_to": "msg_task_88888",
    "status": "success",
    "data": {
      "analysis_results": {
        "revenue": {
          "total": 1250000,
          "unit": "USD",
          "change_from_previous": 0.15
        },
        "growth": {
          "rate": 0.15,
          "top_product": "Product X",
          "trend": "increasing"
        },
        "customer_acquisition": {
          "new_customers": 520,
          "cost_per_acquisition": 42.5,
          "retention_rate": 0.78
        }
      },
      "summary": "Q1 2023 showed strong performance with 15% revenue growth and 520 new customers acquired at a favorable CAC of $42.50.",
      "recommendations": [
        "Focus marketing budget on Product X which shows strongest growth",
        "Implement customer retention program to improve 78% retention rate",
        "Expand sales team in Northeast region which showed highest growth"
      ]
    }
  }
}

// 步骤4: 主助手向用户返回整合结果 (不在A2A协议范围内)
```

## 最佳实践

实现A2A协议时的建议：

1. **幂等性设计**：消息处理应具有幂等性，确保重复接收相同消息不会导致不一致
2. **超时处理**：实现适当的超时机制，避免无限等待
3. **向后兼容**：新版本应保持向后兼容性
4. **错误优雅降级**：在错误情况下实现优雅降级策略
5. **日志记录**：维护详细的通信日志以便调试和审计
6. **限流机制**：实现适当的请求限流，防止过载

## API参考

完整的API参考可在[A2A协议GitHub仓库](https://github.com/a2a-protocol/specification)中找到。 