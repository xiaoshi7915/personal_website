---
sidebar_position: 6
title: A2A协议实战案例
description: A2A协议的实际应用案例，从零到一构建完整的A2A应用
---

# A2A协议实战案例

本文档提供了多个完整的A2A实战案例，帮助您从零开始构建A2A应用。

## 案例1：多代理协作系统

### 项目概述

构建一个多代理协作系统，实现代理之间的高效通信和任务协作。

### 技术栈

- **协议**：A2A协议
- **语言**：Python
- **框架**：FastAPI
- **消息队列**：Redis/RabbitMQ

### 实施步骤

#### 步骤1：环境准备

```bash
pip install fastapi uvicorn redis pydantic
```

#### 步骤2：定义代理接口

```python
from pydantic import BaseModel
from typing import Dict, Any, List
from enum import Enum

class MessageType(str, Enum):
    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"

class AgentMessage(BaseModel):
    from_agent: str
    to_agent: str
    message_type: MessageType
    payload: Dict[str, Any]
    timestamp: float
    message_id: str
```

#### 步骤3：实现代理管理器

```python
import asyncio
from typing import Dict
import redis
import json

class AgentManager:
    def __init__(self, redis_host='localhost', redis_port=6379):
        self.redis_client = redis.Redis(host=redis_host, port=redis_port)
        self.agents: Dict[str, 'Agent'] = {}
    
    def register_agent(self, agent_id: str, agent: 'Agent'):
        """注册代理"""
        self.agents[agent_id] = agent
        # 在Redis中注册
        self.redis_client.sadd("agents", agent_id)
        print(f"代理 {agent_id} 已注册")
    
    async def send_message(self, message: AgentMessage):
        """发送消息"""
        channel = f"agent:{message.to_agent}"
        message_json = message.json()
        self.redis_client.publish(channel, message_json)
    
    async def broadcast(self, message: AgentMessage):
        """广播消息给所有代理"""
        for agent_id in self.agents.keys():
            message.to_agent = agent_id
            await self.send_message(message)
```

#### 步骤4：实现代理

```python
class Agent:
    def __init__(self, agent_id: str, manager: AgentManager):
        self.agent_id = agent_id
        self.manager = manager
        self.capabilities = []
    
    async def handle_message(self, message: AgentMessage):
        """处理接收到的消息"""
        if message.message_type == MessageType.REQUEST:
            response = await self.process_request(message.payload)
            response_message = AgentMessage(
                from_agent=self.agent_id,
                to_agent=message.from_agent,
                message_type=MessageType.RESPONSE,
                payload=response,
                timestamp=time.time(),
                message_id=str(uuid.uuid4())
            )
            await self.manager.send_message(response_message)
    
    async def process_request(self, payload: Dict[str, Any]):
        """处理请求"""
        # 实现具体的处理逻辑
        return {"status": "success", "result": "processed"}
```

## 案例2：智能任务分配系统

### 项目概述

构建一个智能任务分配系统，根据代理能力自动分配任务。

### 实施步骤

```python
class TaskAllocator:
    def __init__(self, agent_manager: AgentManager):
        self.agent_manager = agent_manager
    
    async def allocate_task(self, task: Dict[str, Any]):
        """分配任务给合适的代理"""
        # 分析任务需求
        required_capabilities = task.get("required_capabilities", [])
        
        # 找到有能力的代理
        suitable_agents = []
        for agent_id, agent in self.agent_manager.agents.items():
            if all(cap in agent.capabilities for cap in required_capabilities):
                suitable_agents.append(agent_id)
        
        if not suitable_agents:
            raise Exception("没有找到合适的代理")
        
        # 选择负载最低的代理
        best_agent = self.select_best_agent(suitable_agents)
        
        # 发送任务
        message = AgentMessage(
            from_agent="task_allocator",
            to_agent=best_agent,
            message_type=MessageType.REQUEST,
            payload=task,
            timestamp=time.time(),
            message_id=str(uuid.uuid4())
        )
        
        await self.agent_manager.send_message(message)
        return best_agent
    
    def select_best_agent(self, agents: List[str]) -> str:
        """选择最佳代理（基于负载）"""
        # 简化实现：选择第一个
        # 实际应该考虑代理的当前负载
        return agents[0]
```

## 案例3：代理链式调用

### 项目概述

实现代理之间的链式调用，完成复杂任务。

### 实施步骤

```python
class AgentChain:
    def __init__(self, agent_manager: AgentManager):
        self.agent_manager = agent_manager
        self.chain: List[str] = []
    
    def add_agent(self, agent_id: str):
        """添加代理到链中"""
        self.chain.append(agent_id)
        return self
    
    async def execute(self, initial_data: Dict[str, Any]):
        """执行代理链"""
        current_data = initial_data
        
        for agent_id in self.chain:
            message = AgentMessage(
                from_agent="chain_executor",
                to_agent=agent_id,
                message_type=MessageType.REQUEST,
                payload=current_data,
                timestamp=time.time(),
                message_id=str(uuid.uuid4())
            )
            
            # 发送消息并等待响应
            response = await self.agent_manager.send_and_wait(message)
            current_data = response.payload
        
        return current_data
```

## 案例4：代理状态同步

### 项目概述

实现代理之间的状态同步机制。

### 实施步骤

```python
class StateSyncAgent(Agent):
    def __init__(self, agent_id: str, manager: AgentManager):
        super().__init__(agent_id, manager)
        self.local_state = {}
    
    async def sync_state(self, state: Dict[str, Any]):
        """同步状态给其他代理"""
        message = AgentMessage(
            from_agent=self.agent_id,
            to_agent="*",  # 广播
            message_type=MessageType.NOTIFICATION,
            payload={"state": state},
            timestamp=time.time(),
            message_id=str(uuid.uuid4())
        )
        
        await self.manager.broadcast(message)
    
    async def handle_state_sync(self, message: AgentMessage):
        """处理状态同步消息"""
        if message.message_type == MessageType.NOTIFICATION:
            remote_state = message.payload.get("state", {})
            # 合并状态
            self.local_state.update(remote_state)
```

## 案例5：故障恢复系统

### 项目概述

实现代理故障检测和自动恢复机制。

### 实施步骤

```python
import asyncio
from datetime import datetime, timedelta

class HealthMonitor:
    def __init__(self, agent_manager: AgentManager):
        self.agent_manager = agent_manager
        self.agent_health: Dict[str, datetime] = {}
        self.health_check_interval = 30  # 秒
    
    async def start_monitoring(self):
        """开始健康监控"""
        while True:
            await self.check_agent_health()
            await asyncio.sleep(self.health_check_interval)
    
    async def check_agent_health(self):
        """检查代理健康状态"""
        for agent_id in self.agent_manager.agents.keys():
            try:
                # 发送心跳消息
                message = AgentMessage(
                    from_agent="health_monitor",
                    to_agent=agent_id,
                    message_type=MessageType.REQUEST,
                    payload={"type": "heartbeat"},
                    timestamp=time.time(),
                    message_id=str(uuid.uuid4())
                )
                
                # 等待响应（超时5秒）
                response = await asyncio.wait_for(
                    self.agent_manager.send_and_wait(message),
                    timeout=5.0
                )
                
                if response:
                    self.agent_health[agent_id] = datetime.now()
                else:
                    await self.handle_agent_failure(agent_id)
                    
            except asyncio.TimeoutError:
                await self.handle_agent_failure(agent_id)
    
    async def handle_agent_failure(self, agent_id: str):
        """处理代理故障"""
        print(f"代理 {agent_id} 无响应，标记为故障")
        # 实现故障恢复逻辑
        # 例如：重新分配任务、重启代理等
```

## 最佳实践

1. **消息序列化**：使用JSON或Protocol Buffers序列化消息
2. **错误处理**：实现完善的错误处理和重试机制
3. **日志记录**：记录所有消息和操作
4. **性能监控**：监控代理性能和消息延迟
5. **安全认证**：实现消息认证和授权

## 相关资源

- [A2A协议深度解析](/docs/a2a/comprehensive-intro)
- [MCP协议](/docs/mcp/intro)
- [开发指南](/docs/a2a/development)

