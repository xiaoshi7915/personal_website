---
sidebar_position: 4
title: MCP开发指南
description: MCP协议的高级开发指南，包括性能优化、安全考虑和最佳实践
---

# MCP开发指南

本文档提供MCP协议的高级开发指南，帮助您构建生产级的MCP应用。

## 目录

- [性能优化](#性能优化)
- [安全考虑](#安全考虑)
- [错误处理](#错误处理)
- [测试策略](#测试策略)
- [部署指南](#部署指南)

## 性能优化

### 1. 异步处理

MCP服务器应该充分利用异步编程来提高性能：

```python
import asyncio
from mcp.server import Server

app = Server("my-server")

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    # 使用异步操作
    if name == "fetch_data":
        # 并发执行多个请求
        tasks = [
            fetch_from_api(url) for url in arguments["urls"]
        ]
        results = await asyncio.gather(*tasks)
        return results
    
    # 使用异步IO
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            data = await response.json()
            return data
```

### 2. 缓存策略

实现智能缓存以减少重复计算：

```python
from functools import lru_cache
from datetime import datetime, timedelta
import hashlib
import json

class CacheManager:
    def __init__(self, ttl=3600):
        self.cache = {}
        self.ttl = ttl
    
    def get_cache_key(self, tool_name: str, arguments: dict) -> str:
        """生成缓存键"""
        key_data = f"{tool_name}:{json.dumps(arguments, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, key: str):
        """获取缓存"""
        if key in self.cache:
            value, timestamp = self.cache[key]
            if datetime.now() - timestamp < timedelta(seconds=self.ttl):
                return value
            del self.cache[key]
        return None
    
    def set(self, key: str, value):
        """设置缓存"""
        self.cache[key] = (value, datetime.now())

cache = CacheManager(ttl=3600)

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    cache_key = cache.get_cache_key(name, arguments)
    cached_result = cache.get(cache_key)
    
    if cached_result:
        return cached_result
    
    # 执行工具逻辑
    result = await execute_tool(name, arguments)
    cache.set(cache_key, result)
    return result
```

### 3. 批量处理

对于需要处理大量数据的工具，实现批量处理：

```python
@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "process_documents":
        documents = arguments.get("documents", [])
        
        # 批量处理，而不是逐个处理
        batch_size = 10
        results = []
        
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            batch_results = await asyncio.gather(*[
                process_document(doc) for doc in batch
            ])
            results.extend(batch_results)
        
        return results
```

### 4. 连接池管理

对于需要数据库或API连接的工具，使用连接池：

```python
import aiohttp
from aiohttp import ClientSession, TCPConnector

# 创建连接池
connector = TCPConnector(limit=100, limit_per_host=30)
session = ClientSession(connector=connector)

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "fetch_api_data":
        async with session.get(arguments["url"]) as response:
            return await response.json()

# 应用关闭时清理
async def cleanup():
    await session.close()
```

### 5. 资源限制

实现资源限制以防止滥用：

```python
from collections import defaultdict
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, max_calls: int, period: int):
        self.max_calls = max_calls
        self.period = period
        self.calls = defaultdict(list)
    
    def is_allowed(self, key: str) -> bool:
        now = datetime.now()
        # 清理过期记录
        self.calls[key] = [
            call_time for call_time in self.calls[key]
            if now - call_time < timedelta(seconds=self.period)
        ]
        
        if len(self.calls[key]) >= self.max_calls:
            return False
        
        self.calls[key].append(now)
        return True

rate_limiter = RateLimiter(max_calls=100, period=60)  # 每分钟100次

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    client_id = arguments.get("client_id", "default")
    
    if not rate_limiter.is_allowed(client_id):
        raise Exception("请求过于频繁，请稍后重试")
    
    # 执行工具逻辑
    return await execute_tool(name, arguments)
```

## 安全考虑

### 1. 输入验证

始终验证和清理用户输入：

```python
import re
from pathlib import Path

def validate_file_path(file_path: str) -> bool:
    """验证文件路径安全性"""
    # 防止路径遍历攻击
    if ".." in file_path or file_path.startswith("/"):
        return False
    
    # 只允许特定目录
    allowed_dirs = ["/safe/directory", "/another/safe/directory"]
    path = Path(file_path).resolve()
    
    return any(str(path).startswith(allowed) for allowed in allowed_dirs)

def sanitize_sql_query(query: str) -> str:
    """清理SQL查询，防止SQL注入"""
    # 移除危险关键字
    dangerous_keywords = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER"]
    for keyword in dangerous_keywords:
        if keyword in query.upper():
            raise ValueError(f"不允许使用 {keyword} 关键字")
    
    # 使用参数化查询
    return query

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "read_file":
        file_path = arguments.get("file_path")
        if not validate_file_path(file_path):
            raise ValueError("无效的文件路径")
        # 读取文件...
    
    if name == "query_database":
        sql = arguments.get("sql")
        sanitized_sql = sanitize_sql_query(sql)
        # 执行查询...
```

### 2. 认证和授权

实现适当的认证和授权机制：

```python
import jwt
from functools import wraps

SECRET_KEY = "your-secret-key"

def verify_token(token: str) -> dict:
    """验证JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise ValueError("无效的token")

def require_auth(func):
    """装饰器：要求认证"""
    @wraps(func)
    async def wrapper(name: str, arguments: dict):
        token = arguments.get("token")
        if not token:
            raise ValueError("需要认证token")
        
        user_info = verify_token(token)
        arguments["user"] = user_info
        
        # 检查权限
        if not check_permission(user_info, name):
            raise PermissionError("没有权限执行此操作")
        
        return await func(name, arguments)
    return wrapper

@app.call_tool()
@require_auth
async def call_tool(name: str, arguments: dict):
    # 工具逻辑
    pass
```

### 3. 敏感数据保护

保护敏感信息，避免泄露：

```python
import os
from cryptography.fernet import Fernet

class SecretManager:
    def __init__(self):
        key = os.environ.get("ENCRYPTION_KEY")
        if not key:
            key = Fernet.generate_key()
        self.cipher = Fernet(key)
    
    def encrypt(self, data: str) -> str:
        """加密敏感数据"""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """解密数据"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()

secret_manager = SecretManager()

# 存储敏感信息
api_key = secret_manager.encrypt("actual-api-key")

# 使用时解密
decrypted_key = secret_manager.decrypt(api_key)
```

### 4. 日志安全

确保日志不包含敏感信息：

```python
import logging
import re

class SecureLogger:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        # 敏感信息模式
        self.sensitive_patterns = [
            r'password["\']?\s*[:=]\s*["\']?([^"\']+)',
            r'api[_-]?key["\']?\s*[:=]\s*["\']?([^"\']+)',
            r'token["\']?\s*[:=]\s*["\']?([^"\']+)',
        ]
    
    def sanitize(self, message: str) -> str:
        """清理日志中的敏感信息"""
        for pattern in self.sensitive_patterns:
            message = re.sub(pattern, r'\1=***', message, flags=re.IGNORECASE)
        return message
    
    def info(self, message: str):
        self.logger.info(self.sanitize(message))
    
    def error(self, message: str):
        self.logger.error(self.sanitize(message))

logger = SecureLogger()
```

### 5. 环境变量管理

使用环境变量管理配置，不要硬编码敏感信息：

```python
import os
from dotenv import load_dotenv

load_dotenv()

# 从环境变量读取配置
DATABASE_URL = os.getenv("DATABASE_URL")
API_KEY = os.getenv("API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")

# 验证必需的配置
required_vars = ["DATABASE_URL", "API_KEY"]
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    raise ValueError(f"缺少必需的环境变量: {', '.join(missing_vars)}")
```

## 错误处理

### 1. 统一错误处理

实现统一的错误处理机制：

```python
from mcp.types import ErrorCode

class MCPError(Exception):
    def __init__(self, code: ErrorCode, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    try:
        # 验证工具名称
        if name not in available_tools:
            raise MCPError(
                ErrorCode.METHOD_NOT_FOUND,
                f"工具 {name} 不存在"
            )
        
        # 执行工具
        result = await execute_tool(name, arguments)
        return result
    
    except MCPError as e:
        # 重新抛出MCP错误
        raise
    except ValueError as e:
        # 参数错误
        raise MCPError(
            ErrorCode.INVALID_PARAMS,
            f"参数错误: {str(e)}"
        )
    except Exception as e:
        # 未知错误
        logger.error(f"工具执行失败: {e}", exc_info=True)
        raise MCPError(
            ErrorCode.INTERNAL_ERROR,
            "工具执行失败，请稍后重试"
        )
```

### 2. 重试机制

对于可能失败的操作，实现重试机制：

```python
import asyncio
from typing import Callable, Any

async def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0
) -> Any:
    """带指数退避的重试机制"""
    delay = initial_delay
    
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            
            logger.warning(f"尝试 {attempt + 1} 失败，{delay}秒后重试: {e}")
            await asyncio.sleep(delay)
            delay *= backoff_factor
    
    raise Exception("重试次数用尽")

# 使用示例
@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "fetch_api_data":
        async def fetch():
            async with aiohttp.ClientSession() as session:
                async with session.get(arguments["url"]) as response:
                    response.raise_for_status()
                    return await response.json()
        
        return await retry_with_backoff(fetch, max_retries=3)
```

## 测试策略

### 1. 单元测试

为每个工具编写单元测试：

```python
import pytest
from unittest.mock import Mock, patch

@pytest.mark.asyncio
async def test_analyze_document():
    """测试文档分析工具"""
    arguments = {
        "file_path": "test_document.pdf"
    }
    
    with patch("builtins.open", create=True):
        result = await call_tool("analyze_document", arguments)
        assert "文档已分析" in result[0].text

@pytest.mark.asyncio
async def test_query_document():
    """测试文档查询工具"""
    arguments = {
        "question": "文档的主要内容是什么？"
    }
    
    result = await call_tool("query_document", arguments)
    assert len(result) > 0
    assert result[0].type == "text"
```

### 2. 集成测试

测试工具之间的交互：

```python
@pytest.mark.asyncio
async def test_document_workflow():
    """测试完整的文档处理流程"""
    # 1. 分析文档
    analyze_result = await call_tool("analyze_document", {
        "file_path": "test.pdf"
    })
    assert analyze_result[0].text.startswith("文档已分析")
    
    # 2. 查询文档
    query_result = await call_tool("query_document", {
        "question": "文档主题是什么？"
    })
    assert len(query_result) > 0
```

### 3. 性能测试

测试工具的性能：

```python
import time

@pytest.mark.asyncio
async def test_performance():
    """测试工具性能"""
    start_time = time.time()
    
    result = await call_tool("analyze_document", {
        "file_path": "large_document.pdf"
    })
    
    elapsed_time = time.time() - start_time
    
    # 确保响应时间在可接受范围内
    assert elapsed_time < 5.0, f"响应时间过长: {elapsed_time}秒"
```

## 部署指南

### 1. Docker部署

创建Dockerfile：

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 设置环境变量
ENV PYTHONUNBUFFERED=1

# 运行MCP服务器
CMD ["python", "server.py"]
```

### 2. 环境配置

使用docker-compose管理环境：

```yaml
version: '3.8'

services:
  mcp-server:
    build: .
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - API_KEY=${API_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### 3. 监控和日志

集成监控和日志系统：

```python
import logging
from prometheus_client import Counter, Histogram

# Prometheus指标
tool_calls_total = Counter('mcp_tool_calls_total', '工具调用总数', ['tool_name'])
tool_duration = Histogram('mcp_tool_duration_seconds', '工具执行时间', ['tool_name'])

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    tool_calls_total.labels(tool_name=name).inc()
    
    with tool_duration.labels(tool_name=name).time():
        result = await execute_tool(name, arguments)
    
    logger.info(f"工具 {name} 执行成功")
    return result
```

## 最佳实践总结

1. **性能优化**
   - 使用异步编程
   - 实现智能缓存
   - 批量处理数据
   - 使用连接池
   - 实现资源限制

2. **安全考虑**
   - 验证所有输入
   - 实现认证和授权
   - 保护敏感数据
   - 安全日志记录
   - 使用环境变量

3. **错误处理**
   - 统一错误格式
   - 实现重试机制
   - 记录详细日志
   - 提供友好错误信息

4. **测试**
   - 编写单元测试
   - 进行集成测试
   - 性能测试
   - 安全测试

5. **部署**
   - 使用Docker容器化
   - 配置环境变量
   - 设置监控和日志
   - 实现健康检查

## 相关资源

- [MCP最佳实践](/docs/mcp/best-practices)
- [MCP实战案例](/docs/mcp/practical-cases)
- [MCP常见问题](/docs/mcp/faq)

