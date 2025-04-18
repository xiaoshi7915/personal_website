---
sidebar_position: 2
---

# Python实现入门

本教程将指导您如何使用Python构建MCP服务器，实现自定义工具、资源和提示模板，以扩展AI模型的能力。

## MCP简介

MCP (Model Context Protocol) 是连接AI模型与应用程序的标准化协议。它允许AI模型通过调用外部函数、访问资源和使用提示模板来扩展其能力。MCP服务器提供了三种主要功能：

1. **资源(Resources)**: 文件式数据，可以被客户端读取（如API响应或文件内容）
2. **工具(Tools)**: 可以被AI模型调用的函数（需要用户批准）
3. **提示(Prompts)**: 预先编写的模板，帮助用户完成特定任务

## 环境准备

在开始之前，请确保您的系统满足以下要求：

- Python 3.10+
- pip包管理器
- 基本的Python编程知识

## 创建项目结构

首先，创建一个新的项目目录并初始化虚拟环境：

```bash
# 创建项目目录
mkdir mcp-python-server
cd mcp-python-server

# 使用uv创建和管理环境（推荐）
curl -LsSf https://astral.sh/uv/install.sh | sh  # MacOS/Linux
# 或在Windows上安装uv

# 初始化虚拟环境
uv venv
source .venv/bin/activate  # MacOS/Linux
# .venv\Scripts\activate  # Windows

# 安装MCP SDK
uv add "mcp[cli]" httpx
```

如果您更习惯使用标准Python工具，也可以这样设置：

```bash
# 使用标准Python工具设置环境
python -m venv venv

# 在Windows上激活虚拟环境
venv\Scripts\activate

# 在Linux/macOS上激活虚拟环境
source venv/bin/activate

# 安装MCP SDK
pip install "mcp[cli]" httpx
```

## 创建简单的天气服务器

让我们构建一个简单的天气查询MCP服务器，它将提供两个工具：`get-forecast`和`get-alerts`。

### 基本服务器实现

创建`weather.py`文件：

```python
import json
import httpx
from mcp import Server, Tool

# 创建MCP服务器实例
server = Server(
    name="weather",
    description="用于获取天气预报和警报信息的服务",
    version="1.0.0",
    vendor="MyCompany"
)

# 存储客户端API密钥的变量
API_KEY = "your_weather_api_key"  # 替换为您的API密钥

@server.tool
async def get_forecast(location: str, days: int = 3) -> dict:
    """
    获取指定位置的天气预报
    
    Args:
        location: 位置名称或经纬度（如"北京"或"39.9042,116.4074"）
        days: 请求的预报天数（默认3天）
        
    Returns:
        包含天气预报信息的字典
    """
    try:
        # 调用天气API获取数据
        # 这里使用了httpx进行异步HTTP请求
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.weatherapi.com/v1/forecast.json",
                params={
                    "key": API_KEY,
                    "q": location,
                    "days": days,
                    "aqi": "no",
                    "alerts": "no"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # 格式化结果
            result = {
                "location": {
                    "name": data["location"]["name"],
                    "region": data["location"]["region"],
                    "country": data["location"]["country"],
                },
                "current": {
                    "temp_c": data["current"]["temp_c"],
                    "condition": data["current"]["condition"]["text"],
                    "wind_kph": data["current"]["wind_kph"],
                    "humidity": data["current"]["humidity"]
                },
                "forecast": []
            }
            
            for day in data["forecast"]["forecastday"]:
                result["forecast"].append({
                    "date": day["date"],
                    "max_temp_c": day["day"]["maxtemp_c"],
                    "min_temp_c": day["day"]["mintemp_c"],
                    "condition": day["day"]["condition"]["text"],
                    "chance_of_rain": day["day"]["daily_chance_of_rain"]
                })
            
            return result
            
        except Exception as e:
        return {"error": str(e)}

@server.tool
async def get_alerts(location: str) -> dict:
    """
    获取指定位置的天气警报信息
    
    Args:
        location: 位置名称或经纬度（如"北京"或"39.9042,116.4074"）
        
    Returns:
        包含天气警报信息的字典
    """
    try:
        # 调用天气API获取警报数据
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.weatherapi.com/v1/forecast.json",
                params={
                    "key": API_KEY,
                    "q": location,
                    "days": 1,
                    "aqi": "no",
                    "alerts": "yes"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # 格式化结果
            alerts = []
            if "alerts" in data and "alert" in data["alerts"]:
                for alert in data["alerts"]["alert"]:
                    alerts.append({
                        "headline": alert.get("headline", "未知警报"),
                        "severity": alert.get("severity", "未知"),
                        "category": alert.get("category", "未知"),
                        "event": alert.get("event", "未知事件"),
                        "effective": alert.get("effective", ""),
                        "expires": alert.get("expires", ""),
                        "desc": alert.get("desc", "无描述")
                    })
            
    return {
                "location": {
                    "name": data["location"]["name"],
                    "region": data["location"]["region"],
                    "country": data["location"]["country"],
                },
                "alerts": alerts,
                "alert_count": len(alerts)
            }
            
    except Exception as e:
        return {"error": str(e)}

# 启动服务器
if __name__ == "__main__":
    server.run()
```

### 添加资源功能

现在让我们扩展服务器，添加一个资源功能来提供天气位置历史数据：

```python
import os
from mcp import Resource

# 添加到weather.py文件中

# 模拟位置历史数据存储
LOCATIONS_HISTORY = [
    {"name": "北京", "country": "中国", "coordinates": "39.9042,116.4074", "popularity": "高"},
    {"name": "上海", "country": "中国", "coordinates": "31.2304,121.4737", "popularity": "高"},
    {"name": "纽约", "country": "美国", "coordinates": "40.7128,-74.0060", "popularity": "高"},
    {"name": "伦敦", "country": "英国", "coordinates": "51.5074,-0.1278", "popularity": "高"},
    {"name": "悉尼", "country": "澳大利亚", "coordinates": "-33.8688,151.2093", "popularity": "中"}
]

# 将位置历史写入JSON文件
os.makedirs("data", exist_ok=True)
with open("data/locations.json", "w", encoding="utf-8") as f:
    json.dump(LOCATIONS_HISTORY, f, ensure_ascii=False, indent=2)

# 注册资源
@server.resource(path="/locations")
async def locations_resource():
    """常用天气查询位置列表"""
    # 读取JSON文件
    with open("data/locations.json", "r", encoding="utf-8") as f:
        return json.load(f)

# 添加使用该资源的工具
@server.tool
async def search_locations(query: str) -> dict:
    """
    搜索常用位置
    
    Args:
        query: 搜索关键词
        
    Returns:
        匹配位置的列表
    """
    with open("data/locations.json", "r", encoding="utf-8") as f:
        locations = json.load(f)
    
    # 简单搜索实现
    results = []
    for location in locations:
        if (query.lower() in location["name"].lower() or 
            query.lower() in location["country"].lower()):
            results.append(location)
    
    return {
        "query": query,
        "results": results,
        "count": len(results)
    }
```

### 添加提示模板

最后，我们来添加提示模板，帮助用户更有效地使用我们的天气服务器：

```python
# 添加到weather.py文件中

# 注册提示模板
@server.prompt
def weather_check():
    """提示用户查询天气情况"""
    return """
    我想查询以下位置的天气情况和可能的恶劣天气警报：
    位置：[请提供城市名称或经纬度]
    天数：[查询未来几天的天气，默认3天]
    
    请提供详细的天气情况，包括：
    - 当前温度和天气状况
    - 未来几天的天气预报
    - 任何可能的天气警报或预警
    """

@server.prompt
def travel_weather_plan():
    """帮助用户规划旅行天气"""
    return """
    我正在计划前往以下地点旅行：
    目的地：[请提供城市名称]
    旅行日期：[您计划的旅行日期范围]
    活动类型：[户外/室内/两者兼有]
    
    请帮我：
    1. 分析目的地在我旅行期间的天气情况
    2. 建议在什么日期适合进行户外活动
    3. 提醒我是否需要为特定天气状况（如雨、极热或极冷）做准备
    4. 检查是否有任何可能影响旅行的天气警报
    """
```

## 测试服务器

保存文件后，您可以在命令行中运行服务器：

```bash
python weather.py
```

服务器将在本地启动，可以通过MCP客户端或MCP Inspector进行测试。

### 使用Claude Desktop

要在Claude Desktop上使用您的天气服务器，您需要更新Claude Desktop的配置文件。在`claude_desktop_config.json`中添加：

```json
{
  "mcpServers": {
    "weather": {
      "command": "python",
      "args": ["<您的服务器路径>/weather.py"],
      "env": {
        "WEATHER_API_KEY": "<您的天气API密钥>"
      }
    }
  }
}
```

## 高级服务器特性

### 实现错误处理

良好的错误处理对于MCP服务器至关重要：

```python
from mcp import ToolError, BadRequestError

@server.tool
async def get_forecast(location: str, days: int = 3) -> dict:
    # 验证输入
    if not location:
        raise BadRequestError("位置不能为空")
    
    if days < 1 or days > 10:
        raise BadRequestError("预报天数必须在1到10之间")
    
    try:
        # API调用代码...
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ToolError("API认证失败，请检查API密钥")
        elif e.response.status_code == 404:
            raise ToolError(f"找不到位置: {location}")
        else:
            raise ToolError(f"API错误: {str(e)}")
    except httpx.RequestError:
        raise ToolError("网络连接错误，无法访问天气API")
    except Exception as e:
        raise ToolError(f"处理请求时发生错误: {str(e)}")
```

### 添加环境变量支持

使用环境变量来管理敏感信息：

```python
import os
from dotenv import load_dotenv

# 加载.env文件中的环境变量
load_dotenv()

# 从环境变量获取API密钥
API_KEY = os.environ.get("WEATHER_API_KEY")
if not API_KEY:
    print("警告: 未设置WEATHER_API_KEY环境变量")
    API_KEY = "demo_key"  # 使用演示密钥或默认值
```

## 更多MCP服务器功能

### 添加状态管理

MCP服务器可以管理状态，记录用户查询历史：

```python
# 简单的状态管理
query_history = {}

@server.tool
async def get_forecast(location: str, days: int = 3) -> dict:
    # 记录查询
    user_id = server.context.get("user_id", "anonymous")
    if user_id not in query_history:
        query_history[user_id] = []
    
    query_history[user_id].append({
        "type": "forecast",
        "location": location,
        "days": days,
        "timestamp": datetime.datetime.now().isoformat()
    })
    
    # 原有代码...

@server.tool
async def get_query_history() -> dict:
    """获取用户的查询历史"""
    user_id = server.context.get("user_id", "anonymous")
    return {
        "history": query_history.get(user_id, [])
    }
```

### 实现缓存机制

为了提高性能，可以实现简单的缓存机制：

```python
import time

# 简单缓存实现
cache = {}
CACHE_TTL = 1800  # 缓存有效期30分钟

def get_cache_key(location, days):
    return f"{location}_{days}"

async def get_with_cache(location, days):
    key = get_cache_key(location, days)
    
    # 检查缓存
    if key in cache:
        entry = cache[key]
        if time.time() - entry["timestamp"] < CACHE_TTL:
            print(f"缓存命中: {key}")
            return entry["data"]
    
    # 缓存未命中，获取新数据
    # 调用API获取数据...
    
    # 存入缓存
    cache[key] = {
        "data": result,
        "timestamp": time.time()
    }
    
    return result
```

## 总结

本教程介绍了如何使用Python构建MCP服务器，实现工具、资源和提示模板功能。通过这些功能，您可以大大扩展AI模型的能力，使其能够执行特定领域的任务和访问实时信息。

您可以进一步扩展这个框架，添加更多功能：

1. 数据库集成
2. 用户认证和授权
3. 高级状态管理
4. 指标收集和监控
5. 多种协议支持

通过Python实现MCP服务器，您可以利用Python丰富的生态系统和简洁的语法，快速构建强大的AI功能扩展服务。 