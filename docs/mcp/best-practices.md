---
sidebar_position: 6
---

# MCP最佳实践

本文档总结了在开发和使用MCP协议时的最佳实践，帮助您构建更稳定、高效和可维护的MCP应用。

## 服务器开发最佳实践

### 1. 错误处理

#### 完善的错误处理机制

```python
from mcp.server import Server
from mcp.types import ErrorCode

async def handle_tool_call(tool_name: str, arguments: dict):
    try:
        # 参数验证
        if not validate_arguments(arguments):
            return {
                "error": {
                    "code": ErrorCode.INVALID_PARAMS,
                    "message": "参数验证失败"
                }
            }
        
        # 执行工具
        result = await execute_tool(tool_name, arguments)
        return {"content": result}
    
    except ValueError as e:
        return {
            "error": {
                "code": ErrorCode.INVALID_PARAMS,
                "message": str(e)
            }
        }
    except Exception as e:
        # 记录错误但不暴露敏感信息
        logger.error(f"工具执行失败: {e}")
        return {
            "error": {
                "code": ErrorCode.INTERNAL_ERROR,
                "message": "工具执行失败，请稍后重试"
            }
        }
```

### 2. 资源管理

#### 合理使用资源

```python
import asyncio
from contextlib import asynccontextmanager

class ResourceManager:
    def __init__(self):
        self.active_resources = {}
        self.max_resources = 10
    
    @asynccontextmanager
    async def acquire_resource(self, resource_id: str):
        if len(self.active_resources) >= self.max_resources:
            raise Exception("资源池已满")
        
        resource = await create_resource(resource_id)
        self.active_resources[resource_id] = resource
        
        try:
            yield resource
        finally:
            await resource.cleanup()
            del self.active_resources[resource_id]
```

### 3. 性能优化

#### 异步处理

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

async def process_batch(items: list):
    # 使用异步批量处理
    tasks = [process_item(item) for item in items]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

#### 缓存策略

```python
from functools import lru_cache
import time

class CacheManager:
    def __init__(self, ttl=300):
        self.cache = {}
        self.ttl = ttl
    
    def get(self, key: str):
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return value
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value):
        self.cache[key] = (value, time.time())
```

## 客户端开发最佳实践

### 1. 连接管理

#### 连接池管理

```python
import asyncio
from mcp import ClientSession

class ConnectionPool:
    def __init__(self, max_connections=5):
        self.pool = asyncio.Queue(maxsize=max_connections)
        self.max_connections = max_connections
    
    async def get_connection(self):
        if not self.pool.empty():
            return await self.pool.get()
        
        # 创建新连接
        session = await ClientSession.create()
        return session
    
    async def return_connection(self, session):
        if self.pool.qsize() < self.max_connections:
            await self.pool.put(session)
        else:
            await session.close()
```

### 2. 重试机制

#### 智能重试策略

```python
import asyncio
from typing import Callable

async def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0
):
    delay = initial_delay
    
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            
            await asyncio.sleep(delay)
            delay *= backoff_factor
    
    raise Exception("重试次数已用完")
```

### 3. 请求批处理

#### 批量请求优化

```python
class BatchProcessor:
    def __init__(self, batch_size=10, timeout=1.0):
        self.batch_size = batch_size
        self.timeout = timeout
        self.pending_requests = []
    
    async def add_request(self, request):
        self.pending_requests.append(request)
        
        if len(self.pending_requests) >= self.batch_size:
            return await self.process_batch()
    
    async def process_batch(self):
        if not self.pending_requests:
            return []
        
        batch = self.pending_requests[:self.batch_size]
        self.pending_requests = self.pending_requests[self.batch_size:]
        
        results = await asyncio.gather(*batch)
        return results
```

## 安全最佳实践

### 1. 输入验证

#### 严格的输入验证

```python
import re
from typing import Any

def validate_input(input_data: Any, schema: dict) -> bool:
    """验证输入数据是否符合schema定义"""
    if not isinstance(input_data, dict):
        return False
    
    for key, value_type in schema.items():
        if key not in input_data:
            if 'required' in schema[key]:
                return False
            continue
        
        if not isinstance(input_data[key], value_type):
            return False
        
        # 额外的验证规则
        if 'pattern' in schema[key]:
            if not re.match(schema[key]['pattern'], str(input_data[key])):
                return False
    
    return True
```

### 2. 权限控制

#### 基于角色的访问控制

```python
from enum import Enum

class Permission(Enum):
    READ = "read"
    WRITE = "write"
    EXECUTE = "execute"
    ADMIN = "admin"

class RBAC:
    def __init__(self):
        self.permissions = {
            "user": [Permission.READ],
            "developer": [Permission.READ, Permission.WRITE],
            "admin": [Permission.READ, Permission.WRITE, Permission.EXECUTE, Permission.ADMIN]
        }
    
    def has_permission(self, role: str, permission: Permission) -> bool:
        return permission in self.permissions.get(role, [])
```

### 3. 敏感数据保护

#### 数据加密和脱敏

```python
import hashlib
import secrets

class DataProtection:
    @staticmethod
    def hash_sensitive_data(data: str) -> str:
        """对敏感数据进行哈希"""
        salt = secrets.token_hex(16)
        hash_obj = hashlib.sha256((data + salt).encode())
        return f"{salt}:{hash_obj.hexdigest()}"
    
    @staticmethod
    def mask_data(data: str, visible_chars: int = 4) -> str:
        """数据脱敏"""
        if len(data) <= visible_chars:
            return "*" * len(data)
        return data[:visible_chars] + "*" * (len(data) - visible_chars)
```

## 监控和日志最佳实践

### 1. 结构化日志

#### 使用结构化日志

```python
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def log(self, level: str, message: str, **kwargs):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message,
            **kwargs
        }
        self.logger.log(getattr(logging, level.upper()), json.dumps(log_entry))
```

### 2. 性能监控

#### 添加性能指标

```python
import time
from functools import wraps

def monitor_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            
            # 记录性能指标
            logger.info(f"{func.__name__} 执行时间: {duration:.2f}秒")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"{func.__name__} 执行失败，耗时: {duration:.2f}秒", exc_info=e)
            raise
    return wrapper
```

## 测试最佳实践

### 1. 单元测试

#### 完整的测试覆盖

```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_tool_execution():
    # Mock外部依赖
    with patch('mcp.server.external_api') as mock_api:
        mock_api.call.return_value = {"result": "success"}
        
        result = await execute_tool("test_tool", {})
        assert result["result"] == "success"
```

### 2. 集成测试

#### 端到端测试

```python
import pytest
from mcp import ClientSession, Server

@pytest.mark.asyncio
async def test_end_to_end():
    # 启动服务器
    server = Server()
    await server.start()
    
    # 创建客户端
    async with ClientSession() as client:
        result = await client.call_tool("test_tool", {})
        assert result is not None
    
    await server.stop()
```

## 部署最佳实践

### 1. 容器化部署

#### Docker最佳实践

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 使用非root用户
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

CMD ["python", "server.py"]
```

### 2. 配置管理

#### 环境变量管理

```python
import os
from typing import Optional

class Config:
    def __init__(self):
        self.host = os.getenv("MCP_HOST", "localhost")
        self.port = int(os.getenv("MCP_PORT", "8000"))
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
    
    def validate(self):
        """验证配置"""
        if self.port < 1 or self.port > 65535:
            raise ValueError("端口号必须在1-65535之间")
```

## 总结

遵循这些最佳实践可以帮助您：

1. **提高代码质量**：通过错误处理和输入验证
2. **优化性能**：通过异步处理和缓存策略
3. **增强安全性**：通过权限控制和数据保护
4. **改善可维护性**：通过结构化日志和监控
5. **确保可靠性**：通过完善的测试和部署策略

持续学习和改进是保持代码质量的关键。定期审查和更新这些实践，以适应新的需求和挑战。


