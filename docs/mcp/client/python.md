# Python实现入门

本教程将指导您如何使用Python开发MCP客户端，与MCP服务器进行交互，实现功能扩展。

## 环境准备

### 依赖安装

```bash
pip install requests websockets pydantic
```

### 项目结构

```
mcp-python-client/
├── mcp_client.py      # MCP客户端核心代码
├── examples/          # 示例代码
│   ├── weather_query.py
│   └── document_analysis.py
└── README.md          # 项目说明
```

## 基础客户端实现

### 创建基本客户端类

```python
import json
import requests
from typing import Dict, List, Any, Optional, Union

class MCPClient:
    """MCP协议客户端实现"""
    
    def __init__(self, server_url: str, api_key: Optional[str] = None):
        """
        初始化MCP客户端
        
        Args:
            server_url: MCP服务器URL
            api_key: 可选的API密钥
        """
        self.server_url = server_url
        self.headers = {
            "Content-Type": "application/json"
        }
        
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
            
    def get_server_info(self) -> Dict[str, Any]:
        """
        获取服务器信息
        
        Returns:
            服务器信息字典
        """
        response = requests.get(
            f"{self.server_url}/",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def list_resources(self) -> List[Dict[str, Any]]:
        """
        获取可用资源列表
        
        Returns:
            资源列表
        """
        response = requests.get(
            f"{self.server_url}/resources",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_resource(self, resource_name: str) -> Dict[str, Any]:
        """
        获取特定资源详情
        
        Args:
            resource_name: 资源名称
            
        Returns:
            资源详情
        """
        response = requests.get(
            f"{self.server_url}/resources/{resource_name}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def call_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        调用工具
        
        Args:
            tool_name: 工具名称
            params: 工具参数
            
        Returns:
            工具调用结果
        """
        response = requests.post(
            f"{self.server_url}/tools/{tool_name}",
            headers=self.headers,
            json=params
        )
        response.raise_for_status()
        return response.json()
    
    def send_prompt(self, resource_name: str, prompt: str, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        发送提示词
        
        Args:
            resource_name: 资源名称
            prompt: 提示词内容
            history: 对话历史
            
        Returns:
            模型响应
        """
        payload = {
            "prompt": prompt
        }
        
        if history:
            payload["history"] = history
            
        response = requests.post(
            f"{self.server_url}/resources/{resource_name}/prompt",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
```

## 高级功能实现

### 添加异步支持

```python
import aiohttp
import asyncio
from typing import Dict, List, Any, Optional, Union

class AsyncMCPClient:
    """异步MCP客户端"""
    
    def __init__(self, server_url: str, api_key: Optional[str] = None):
        """
        初始化异步MCP客户端
        
        Args:
            server_url: MCP服务器URL
            api_key: 可选的API密钥
        """
        self.server_url = server_url
        self.headers = {
            "Content-Type": "application/json"
        }
        
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
        
        self.session = None
    
    async def __aenter__(self):
        """创建会话"""
        self.session = aiohttp.ClientSession(headers=self.headers)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """关闭会话"""
        if self.session:
            await self.session.close()
    
    async def get_server_info(self) -> Dict[str, Any]:
        """
        异步获取服务器信息
        
        Returns:
            服务器信息字典
        """
        async with self.session.get(f"{self.server_url}/") as response:
            response.raise_for_status()
            return await response.json()
    
    async def call_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        异步调用工具
        
        Args:
            tool_name: 工具名称
            params: 工具参数
            
        Returns:
            工具调用结果
        """
        async with self.session.post(
            f"{self.server_url}/tools/{tool_name}",
            json=params
        ) as response:
            response.raise_for_status()
            return await response.json()
```

### 流式响应处理

```python
import json
import requests
from typing import Dict, List, Any, Optional, Union, Callable, Iterator

class StreamingMCPClient(MCPClient):
    """支持流式响应的MCP客户端"""
    
    def stream_prompt(self, resource_name: str, prompt: str, 
                      history: Optional[List[Dict[str, str]]] = None) -> Iterator[str]:
        """
        流式发送提示词
        
        Args:
            resource_name: 资源名称
            prompt: 提示词内容
            history: 对话历史
            
        Returns:
            响应流迭代器
        """
        payload = {
            "prompt": prompt,
            "stream": True
        }
        
        if history:
            payload["history"] = history
            
        response = requests.post(
            f"{self.server_url}/resources/{resource_name}/prompt",
            headers=self.headers,
            json=payload,
            stream=True
        )
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                if line.startswith(b"data: "):
                    data = json.loads(line[6:])
                    yield data.get("text", "")
```

## 使用示例

### 查询天气示例

```python
from mcp_client import MCPClient

# 创建客户端
client = MCPClient("http://localhost:8000", api_key="your_api_key")

# 获取服务器信息
server_info = client.get_server_info()
print(f"服务器名称: {server_info.get('name')}")
print(f"服务器版本: {server_info.get('version')}")

# 调用天气查询工具
result = client.call_tool("get_weather", {
    "city": "北京",
    "days": 3
})

# 打印天气信息
for day in result.get("forecast", []):
    print(f"{day['date']}: {day['condition']}, {day['temperature']}°C")
```

### 文档分析示例

```python
import asyncio
from mcp_client import AsyncMCPClient

async def analyze_document():
    async with AsyncMCPClient("http://localhost:8000", api_key="your_api_key") as client:
        # 上传文档
        upload_result = await client.call_tool("upload_document", {
            "file_path": "example.pdf"
        })
        
        document_id = upload_result.get("document_id")
        
        # 分析文档
        analysis = await client.call_tool("analyze_document", {
            "document_id": document_id
        })
        
        # 打印分析结果
        print(f"文档标题: {analysis.get('title')}")
        print(f"关键词: {', '.join(analysis.get('keywords', []))}")
        print(f"摘要: {analysis.get('summary')}")

# 运行异步函数
asyncio.run(analyze_document())
```

## 安全最佳实践

在开发MCP客户端时，请遵循以下安全最佳实践：

1. **API密钥保护**：不要在代码中硬编码API密钥，应使用环境变量或配置文件
2. **HTTPS连接**：始终使用HTTPS连接到MCP服务器
3. **输入验证**：验证所有用户输入，防止注入攻击
4. **错误处理**：妥善处理错误，不泄露敏感信息
5. **最小权限原则**：只请求所需的最小权限

## 故障排查

### 常见问题

1. **连接超时**：检查服务器URL是否正确，网络连接是否稳定
2. **认证失败**：验证API密钥是否正确
3. **参数错误**：确保按照工具要求提供所有必需参数
4. **服务器错误**：查看服务器日志以获取更多信息

### 调试技巧

```python
import logging

# 启用HTTP请求日志
logging.basicConfig(level=logging.DEBUG)
```

## 总结

通过本教程，您已经学习了如何使用Python开发MCP客户端，实现与MCP服务器的交互。您可以基于这些基础功能，构建更复杂的应用程序。

如有任何问题，请参考MCP协议规范或联系我们的技术支持团队。 