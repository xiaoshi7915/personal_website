---
sidebar_position: 2
---

# 使用Python实现MCP服务器

本教程将指导您如何使用Python构建MCP服务器，实现自定义函数并与AI模型集成。

## 环境准备

在开始之前，请确保您的系统满足以下要求：

- Python 3.8+
- pip包管理器
- 基本的Python编程知识

## 创建项目结构

首先，创建一个新的项目目录并初始化虚拟环境：

```bash
mkdir mcp-python-server
cd mcp-python-server
python -m venv venv

# 在Windows上激活虚拟环境
venv\Scripts\activate

# 在Linux/macOS上激活虚拟环境
source venv/bin/activate
```

安装必要的依赖：

```bash
pip install fastapi uvicorn pydantic python-dotenv
```

创建以下项目结构：

```
mcp-python-server/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI入口点
│   ├── mcp/
│   │   ├── __init__.py
│   │   ├── server.py    # MCP服务器实现
│   │   └── schemas.py   # 数据模型定义
│   ├── functions/
│   │   ├── __init__.py
│   │   └── basic.py     # 基本函数实现
│   └── config.py        # 配置文件
├── .env                 # 环境变量
└── requirements.txt     # 依赖列表
```

## 定义数据模型

创建`app/mcp/schemas.py`文件：

```python
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field


class FunctionParameter(BaseModel):
    """函数参数的模式定义"""
    type: str
    description: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    required: Optional[List[str]] = None
    additionalProperties: Optional[bool] = None


class FunctionDefinition(BaseModel):
    """MCP函数定义"""
    name: str
    description: str
    parameters: FunctionParameter


class FunctionCall(BaseModel):
    """函数调用请求"""
    name: str
    parameters: Dict[str, Any]


class MCPRequest(BaseModel):
    """MCP请求模型"""
    function_call: FunctionCall


class ProgressUpdate(BaseModel):
    """长时间运行操作的进度更新"""
    percent: int = Field(..., ge=0, le=100)
    message: Optional[str] = None


class MCPResponse(BaseModel):
    """MCP响应模型"""
    content: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    progress: Optional[ProgressUpdate] = None
```

## 实现MCP服务器核心

创建`app/mcp/server.py`文件：

```python
import inspect
from typing import Dict, Any, Callable, List, Optional, AsyncGenerator
import asyncio
from .schemas import FunctionDefinition, FunctionParameter, MCPRequest, MCPResponse


class MCPServer:
    """Python实现的MCP服务器"""
    
    def __init__(self, namespace: str):
        """
        初始化MCP服务器
        
        Args:
            namespace: 函数命名空间，用于区分不同服务的函数
        """
        self.namespace = namespace
        self.functions: Dict[str, Dict[str, Any]] = {}
    
    def register_function(self, name: str, description: str, parameters: Dict[str, Any], handler: Callable):
        """
        注册一个函数到MCP服务器
        
        Args:
            name: 函数名称
            description: 函数描述
            parameters: 函数参数模式
            handler: 处理函数
        """
        function_name = f"{self.namespace}_{name}"
        
        # 创建函数定义
        function_def = {
            "name": name,
            "description": description,
            "parameters": parameters,
            "handler": handler
        }
        
        self.functions[function_name] = function_def
    
    def get_tools_config(self) -> List[FunctionDefinition]:
        """获取用于AI模型的工具配置"""
        tools = []
        
        for func_name, func_info in self.functions.items():
            tools.append({
                "name": func_name,
                "description": func_info["description"],
                "parameters": func_info["parameters"]
            })
        
        return tools
    
    async def handle_request(self, request: MCPRequest) -> MCPResponse:
        """
        处理MCP请求
        
        Args:
            request: MCP请求对象
            
        Returns:
            MCPResponse: MCP响应对象
        """
        function_call = request.function_call
        function_name = function_call.name
        parameters = function_call.parameters
        
        # 检查函数是否存在
        if function_name not in self.functions:
            return MCPResponse(error={
                "message": f"函数 '{function_name}' 不存在",
                "code": "FUNCTION_NOT_FOUND"
            })
        
        function_info = self.functions[function_name]
        handler = function_info["handler"]
        
        try:
            # 调用处理函数
            if inspect.iscoroutinefunction(handler):
                # 异步函数
                result = await handler(**parameters)
            elif inspect.isasyncgenfunction(handler):
                # 异步生成器函数 (用于流式处理)
                async for update in handler(**parameters):
                    if isinstance(update, dict) and "progress" in update:
                        # 如果是进度更新，立即返回
                        return MCPResponse(progress=update["progress"])
                    else:
                        # 最终结果
                        result = update
                        break
            else:
                # 同步函数
                result = handler(**parameters)
            
            # 返回结果
            return MCPResponse(content=result)
            
        except Exception as e:
            # 返回错误信息
            return MCPResponse(error={
                "message": str(e),
                "code": "FUNCTION_EXECUTION_ERROR"
            })
```

## 实现基本函数

创建`app/functions/basic.py`文件：

```python
import time
import asyncio
from typing import Dict, Any, Optional, AsyncGenerator


async def echo(message: str) -> Dict[str, Any]:
    """
    简单的回显函数
    
    Args:
        message: 要回显的消息
        
    Returns:
        包含原始消息的响应
    """
    return {
        "content": message
    }


async def add(a: float, b: float) -> Dict[str, Any]:
    """
    将两个数相加
    
    Args:
        a: 第一个数
        b: 第二个数
        
    Returns:
        包含结果的响应
    """
    return {
        "result": a + b
    }


async def long_running_operation(steps: int = 5, delay: float = 1.0) -> AsyncGenerator[Dict[str, Any], None]:
    """
    示例长时间运行操作，支持进度更新
    
    Args:
        steps: 操作的步骤数
        delay: 每步之间的延迟时间（秒）
        
    Yields:
        进度更新和最终结果
    """
    for i in range(steps):
        # 模拟处理时间
        await asyncio.sleep(delay)
        
        # 发送进度更新
        yield {
            "progress": {
                "percent": round((i + 1) / steps * 100),
                "message": f"完成步骤 {i+1}/{steps}"
            }
        }
    
    # 返回最终结果
    yield {
        "result": "操作完成",
        "steps_completed": steps
    }
```

## 创建配置文件

创建`app/config.py`文件：

```python
import os
from dotenv import load_dotenv
from functools import lru_cache

# 加载.env文件
load_dotenv()

class Settings:
    # 应用名称
    APP_NAME: str = "Python MCP Server"
    
    # 服务器配置
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # MCP配置
    MCP_NAMESPACE: str = os.getenv("MCP_NAMESPACE", "mcp_python")
    

@lru_cache()
def get_settings():
    """获取缓存的设置实例"""
    return Settings()
```

## 创建FastAPI应用

创建`app/main.py`文件：

```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

from .config import get_settings
from .mcp.server import MCPServer
from .mcp.schemas import MCPRequest, MCPResponse
from .functions.basic import echo, add, long_running_operation

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 获取设置
settings = get_settings()

# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    description="Python实现的MCP服务器",
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 创建MCP服务器实例
mcp_server = MCPServer(namespace=settings.MCP_NAMESPACE)

# 注册函数
mcp_server.register_function(
    name="echo",
    description="回显输入的消息",
    parameters={
        "type": "object",
        "properties": {
            "message": {
                "type": "string",
                "description": "要回显的消息"
            }
        },
        "required": ["message"],
        "additionalProperties": False
    },
    handler=echo
)

mcp_server.register_function(
    name="add",
    description="将两个数相加",
    parameters={
        "type": "object",
        "properties": {
            "a": {
                "type": "number",
                "description": "第一个数"
            },
            "b": {
                "type": "number",
                "description": "第二个数"
            }
        },
        "required": ["a", "b"],
        "additionalProperties": False
    },
    handler=add
)

mcp_server.register_function(
    name="long_running_operation",
    description="示例长时间运行操作，支持进度更新",
    parameters={
        "type": "object",
        "properties": {
            "steps": {
                "type": "integer",
                "description": "操作的步骤数",
                "default": 5
            },
            "delay": {
                "type": "number",
                "description": "每步之间的延迟时间（秒）",
                "default": 1.0
            }
        },
        "additionalProperties": False
    },
    handler=long_running_operation
)

@app.get("/")
async def root():
    """根路径处理程序"""
    return {"message": "欢迎使用Python MCP服务器"}

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok"}

@app.post("/mcp", response_model=MCPResponse)
async def mcp_endpoint(request: MCPRequest):
    """MCP请求处理端点"""
    try:
        logger.info(f"收到MCP请求: {request}")
        response = await mcp_server.handle_request(request)
        logger.info(f"MCP响应: {response}")
        return response
    except Exception as e:
        logger.error(f"处理MCP请求时出错: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tools")
async def get_tools():
    """获取可用工具列表"""
    return mcp_server.get_tools_config()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app", 
        host=settings.HOST, 
        port=settings.PORT,
        reload=True
    )
```

## 创建环境变量文件

创建`.env`文件：

```
HOST=0.0.0.0
PORT=8000
MCP_NAMESPACE=mcp_python
```

## 创建依赖文件

创建`requirements.txt`文件：

```
fastapi>=0.100.0
uvicorn>=0.23.0
pydantic>=2.0.0
python-dotenv>=1.0.0
```

## 启动服务器

现在可以启动MCP服务器：

```bash
# 在项目根目录运行
python -m app.main
```

或者使用uvicorn直接运行：

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

服务器将在http://localhost:8000/上运行，您可以访问以下端点：

- `/`: 欢迎页面
- `/health`: 健康检查
- `/tools`: 获取可用工具列表
- `/mcp`: MCP请求处理端点（POST）
- `/docs`: API文档（由FastAPI自动生成）

## 测试MCP服务器

使用curl测试echo函数：

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "function_call": {
      "name": "mcp_python_echo",
      "parameters": {
        "message": "Hello, Python MCP!"
      }
    }
  }'
```

预期响应：

```json
{
  "content": {
    "content": "Hello, Python MCP!"
  },
  "error": null,
  "progress": null
}
```

## 与Claude集成

要将Python MCP服务器与Claude模型集成，您需要创建一个客户端应用：

```python
import requests
import os

# Claude API密钥
CLAUDE_API_KEY = os.environ.get("CLAUDE_API_KEY")

# MCP服务器URL
MCP_SERVER_URL = "http://localhost:8000"

def get_tools():
    """获取MCP工具配置"""
    response = requests.get(f"{MCP_SERVER_URL}/tools")
    return response.json()

def call_claude(prompt, tools):
    """调用Claude模型API"""
    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    
    body = {
        "model": "claude-3-opus-20240229",
        "max_tokens": 1000,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "tools": tools
    }
    
    response = requests.post(
        "https://api.anthropic.com/v1/messages",
        json=body,
        headers=headers
    )
    
    return response.json()

def handle_tool_use(tool_use, message_id):
    """处理工具调用"""
    # 准备函数调用请求
    mcp_request = {
        "function_call": {
            "name": tool_use["name"],
            "parameters": tool_use["parameters"]
        }
    }
    
    # 调用MCP服务器
    response = requests.post(f"{MCP_SERVER_URL}/mcp", json=mcp_request)
    tool_result = response.json()
    
    # 将结果发送回Claude
    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    
    tool_response = {
        "tool_responses": [
            {
                "tool_use_id": tool_use["id"],
                "content": tool_result.get("content")
            }
        ]
    }
    
    response = requests.post(
        f"https://api.anthropic.com/v1/messages/{message_id}/tool_responses",
        json=tool_response,
        headers=headers
    )
    
    return response.json()

def main():
    # 获取工具配置
    tools = get_tools()
    
    # 调用Claude
    prompt = "请计算1234和5678的和。"
    claude_response = call_claude(prompt, tools)
    
    message = claude_response["content"][0]
    
    # 处理工具调用
    if message["type"] == "tool_use":
        tool_use = message["tool_use"]
        message_id = claude_response["id"]
        
        # 处理工具调用
        final_response = handle_tool_use(tool_use, message_id)
        print("最终响应:", final_response["content"][0]["text"])
    else:
        print("Claude响应:", message["text"])

if __name__ == "__main__":
    main()
```

## 总结

本教程介绍了如何使用Python构建MCP服务器，实现自定义函数，并与Claude AI模型集成。您可以根据需要扩展这个框架，添加更多功能，如：

1. 数据库集成
2. 用户认证和授权
3. 高级错误处理
4. 指标和监控
5. 负载均衡和水平扩展

通过Python实现MCP服务器，您可以利用Python丰富的生态系统和简洁的语法，快速构建强大的AI功能扩展服务。 