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

## MCP服务器资源

在开始开发MCP服务器之前，您可以查看以下资源来获取参考和帮助：

### 官方资源
- **官方仓库**: [https://github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

### 第三方MCP服务器平台
以下平台提供了MCP服务器的托管、共享和发现功能：

- **Smithery**: [https://smithery.com/](https://smithery.com/) - MCP服务器开发与托管平台
- **Pulse MCP**: [https://www.pulsemcp.com/](https://www.pulsemcp.com/) - MCP服务发现与集成
- **Awesome MCP Servers**: [https://mcpservers.org/](https://mcpservers.org/) - 优质MCP服务器集合
- **MCP.so**: [https://mcp.so/](https://mcp.so/) - MCP服务器目录与资源
- **Glama.ai**: [https://glama.ai/mcp/servers](https://glama.ai/mcp/servers) - AI驱动的MCP服务器平台
- **Cursor.directory**: [https://cursor.directory/](https://cursor.directory/) - 面向开发者的MCP资源
- **MCP Market**: [https://mcpmarket.cn/](https://mcpmarket.cn/) - 中文MCP服务器市场

## MCP服务器开发案例

下面提供了几个常见的MCP服务器开发案例，您可以参考这些示例来开发自己的服务器。

### 1. 获取当前时间服务器

以下是一个简单的获取当前时间的MCP服务器示例：

```python
import datetime
from zoneinfo import ZoneInfo, available_timezones
from mcp import Server, Tool

# 创建MCP服务器实例
server = Server(
    name="current-time",
    description="提供当前时间信息的服务",
    version="1.0.0",
    vendor="MyCompany"
)

@server.tool
async def get_current_time(timezone: str = "UTC") -> dict:
    """
    获取指定时区的当前时间
    
    Args:
        timezone: 时区名称（如"Asia/Shanghai"、"America/New_York"）。默认为UTC
        
    Returns:
        包含当前时间信息的字典
    """
    try:
        # 验证时区是否有效
        if timezone not in available_timezones():
            return {
                "error": f"无效的时区: {timezone}",
                "valid_timezones_examples": list(available_timezones())[:5]
            }
        
        # 获取指定时区的当前时间
        now = datetime.datetime.now(ZoneInfo(timezone))
        
        return {
            "timezone": timezone,
            "datetime": now.isoformat(),
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M:%S"),
            "timestamp": now.timestamp(),
            "day_of_week": now.strftime("%A"),
            "unix_timestamp": int(now.timestamp())
        }
    except Exception as e:
        return {"error": str(e)}

@server.resource(path="/timezones")
async def timezone_list():
    """可用时区列表"""
    # 返回所有可用的时区
    return list(available_timezones())

# 启动服务器
if __name__ == "__main__":
    server.run()
```

### 2. 天气查询服务器

以下是使用百度地图API的天气查询服务器示例：

```python
import httpx
from mcp import Server, Tool

# 创建MCP服务器实例
server = Server(
    name="weather",
    description="用于获取天气预报和警报信息的服务",
    version="1.0.0",
    vendor="MyCompany"
)

# 百度地图API密钥
API_KEY = "your_baidu_map_api_key"  # 替换为您的百度地图API密钥

@server.tool
async def geocode(address: str) -> dict:
    """
    将地址转换为经纬度坐标和行政区划ID
    
    Args:
        address: 待解析的地址（最多支持84个字节）
        
    Returns:
        包含地理编码信息的字典
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.map.baidu.com/geocoding/v3",
                params={
                    "address": address,
                    "output": "json",
                    "ak": API_KEY
                }
            )
            response.raise_for_status()
            data = response.json()
            
            if data["status"] == 0:
                result = data["result"]
                location = result["location"]
                return {
                    "status": "success",
                    "formatted_address": result.get("formatted_address", ""),
                    "location": {
                        "lat": location["lat"],
                        "lng": location["lng"]
                    },
                    "precise": result.get("precise", 0),
                    "confidence": result.get("confidence", 0),
                    "district_id": result.get("adcode", "")
                }
            else:
                return {
                    "status": "error",
                    "message": data.get("message", "地址解析失败")
                }
                
    except Exception as e:
        return {"error": str(e)}

@server.tool
async def get_forecast(district_id: str) -> dict:
    """
    获取指定行政区划ID的天气预报
    
    Args:
        district_id: 百度地图行政区划ID（例如：北京市朝阳区为110105）
        
    Returns:
        包含实时天气、未来天气预报的信息
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.map.baidu.com/weather/v1",
                params={
                    "district_id": district_id,
                    "data_type": "all",
                    "ak": API_KEY
                }
            )
            response.raise_for_status()
            data = response.json()
            
            if data["status"] == 0:
                result = data["result"]
                return {
                    "status": "success",
                    "location": result.get("location", {}),
                    "now": result.get("now", {}),
                    "forecasts": result.get("forecasts", [])
                }
            else:
                return {
                    "status": "error",
                    "message": data.get("message", "获取天气预报失败")
                }
                
    except Exception as e:
        return {"error": str(e)}

@server.tool
async def get_alerts(district_id: str) -> dict:
    """
    获取指定行政区划ID的天气预警信息
    
    Args:
        district_id: 百度地图行政区划ID（例如：北京市朝阳区为110105）
        
    Returns:
        包含预警类型、等级、详情的天气预警信息
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.map.baidu.com/weather/v1",
                params={
                    "district_id": district_id,
                    "data_type": "all",
                    "ak": API_KEY
                }
            )
            response.raise_for_status()
            data = response.json()
            
            if data["status"] == 0:
                result = data["result"]
                alerts = result.get("alerts", [])
                return {
                    "status": "success",
                    "location": result.get("location", {}),
                    "alerts": alerts,
                    "alert_count": len(alerts)
                }
            else:
                return {
                    "status": "error",
                    "message": data.get("message", "获取天气预警失败")
                }
                
    except Exception as e:
        return {"error": str(e)}

# 启动服务器
if __name__ == "__main__":
    server.run()
```

### 3. MySQL数据库查询服务器

以下是一个MySQL数据库查询服务器示例，提供数据库元数据和数据查询功能：

```python
import mysql.connector
from mcp import Server, Tool

# 创建MCP服务器实例
server = Server(
    name="mysql-query",
    description="用于查询MySQL数据库的服务",
    version="1.0.0",
    vendor="MyCompany"
)

@server.tool
async def get_database_metadata(host: str, user: str, password: str, database: str, port: int) -> dict:
    """
    获取所有数据库的元数据信息，包括表名、字段名、字段注释、字段类型、字段长度、是否为空、是否主键、外键、索引
    
    Args:
        host: 数据库主机地址
        user: 数据库用户名
        password: 数据库密码
        database: 要连接的特定数据库名称
        port: 数据库端口
        
    Returns:
        包含所有数据库元数据信息的字典，格式化为便于阅读的结构
    """
    try:
        # 连接到MySQL数据库
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port
        )
        cursor = conn.cursor(dictionary=True)
        
        # 获取所有表信息
        cursor.execute("""
            SELECT 
                TABLE_NAME, 
                TABLE_COMMENT 
            FROM 
                information_schema.TABLES 
            WHERE 
                TABLE_SCHEMA = %s
        """, (database,))
        
        tables = cursor.fetchall()
        
        result = {"database": database, "tables": []}
        
        # 遍历每个表，获取字段信息
        for table in tables:
            table_name = table["TABLE_NAME"]
            table_comment = table["TABLE_COMMENT"]
            
            # 获取字段信息
            cursor.execute("""
                SELECT 
                    COLUMN_NAME,
                    COLUMN_COMMENT,
                    DATA_TYPE,
                    CHARACTER_MAXIMUM_LENGTH,
                    IS_NULLABLE,
                    COLUMN_KEY
                FROM 
                    information_schema.COLUMNS 
                WHERE 
                    TABLE_SCHEMA = %s AND 
                    TABLE_NAME = %s
            """, (database, table_name))
            
            columns = cursor.fetchall()
            
            # 获取索引信息
            cursor.execute("""
                SELECT 
                    INDEX_NAME,
                    COLUMN_NAME,
                    NON_UNIQUE
                FROM 
                    information_schema.STATISTICS 
                WHERE 
                    TABLE_SCHEMA = %s AND 
                    TABLE_NAME = %s
            """, (database, table_name))
            
            indexes = cursor.fetchall()
            
            # 获取外键信息
            cursor.execute("""
                SELECT 
                    CONSTRAINT_NAME,
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM 
                    information_schema.KEY_COLUMN_USAGE 
                WHERE 
                    TABLE_SCHEMA = %s AND 
                    TABLE_NAME = %s AND
                    REFERENCED_TABLE_NAME IS NOT NULL
            """, (database, table_name))
            
            foreign_keys = cursor.fetchall()
            
            # 构建表信息
            table_info = {
                "name": table_name,
                "comment": table_comment,
                "columns": [],
                "indexes": [],
                "foreign_keys": []
            }
            
            # 添加字段信息
            for column in columns:
                table_info["columns"].append({
                    "name": column["COLUMN_NAME"],
                    "comment": column["COLUMN_COMMENT"],
                    "type": column["DATA_TYPE"],
                    "length": column["CHARACTER_MAXIMUM_LENGTH"],
                    "nullable": column["IS_NULLABLE"] == "YES",
                    "is_primary": column["COLUMN_KEY"] == "PRI"
                })
            
            # 添加索引信息
            for index in indexes:
                table_info["indexes"].append({
                    "name": index["INDEX_NAME"],
                    "column": index["COLUMN_NAME"],
                    "is_unique": index["NON_UNIQUE"] == 0
                })
            
            # 添加外键信息
            for fk in foreign_keys:
                table_info["foreign_keys"].append({
                    "name": fk["CONSTRAINT_NAME"],
                    "column": fk["COLUMN_NAME"],
                    "referenced_table": fk["REFERENCED_TABLE_NAME"],
                    "referenced_column": fk["REFERENCED_COLUMN_NAME"]
                })
            
            result["tables"].append(table_info)
        
        cursor.close()
        conn.close()
        
        return result
    except Exception as e:
        return {"error": str(e)}

@server.tool
async def get_sample_data(host: str, user: str, password: str, database: str, port: int, limit: int = 3) -> dict:
    """
    获取所有数据库每个表的样例数据（默认最多3条）
    
    Args:
        host: 数据库主机地址
        user: 数据库用户名
        password: 数据库密码
        database: 要连接的特定数据库名称
        port: 数据库端口
        limit: 每个表获取的最大样例数据条数，默认为3
        
    Returns:
        包含所有表样例数据的字典，格式化为便于阅读的结构
    """
    try:
        # 连接到MySQL数据库
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port
        )
        cursor = conn.cursor(dictionary=True)
        
        # 获取所有表名
        cursor.execute("""
            SELECT 
                TABLE_NAME 
            FROM 
                information_schema.TABLES 
            WHERE 
                TABLE_SCHEMA = %s
        """, (database,))
        
        tables = cursor.fetchall()
        
        result = {"database": database, "tables": []}
        
        # 遍历每个表，获取样例数据
        for table in tables:
            table_name = table["TABLE_NAME"]
            
            try:
                # 获取表中的样例数据
                cursor.execute(f"SELECT * FROM `{table_name}` LIMIT %s", (limit,))
                sample_data = cursor.fetchall()
                
                # 构建表信息
                table_info = {
                    "name": table_name,
                    "sample_data": sample_data
                }
                
                result["tables"].append(table_info)
            except Exception as table_error:
                # 如果某个表查询失败，记录错误但继续处理其他表
                result["tables"].append({
                    "name": table_name,
                    "error": str(table_error)
                })
        
        cursor.close()
        conn.close()
        
        return result
    except Exception as e:
        return {"error": str(e)}

@server.tool
async def execute_readonly_query(host: str, user: str, password: str, database: str, port: int, query: str, max_rows: int = 100) -> dict:
    """
    在只读事务中执行自定义SQL查询，确保查询不会修改数据库
    
    Args:
        host: 数据库主机地址
        user: 数据库用户名
        password: 数据库密码
        database: 要连接的特定数据库名称
        port: 数据库端口
        query: 要执行的SQL查询语句
        max_rows: 返回的最大行数，默认为100
        
    Returns:
        查询结果的字符串表示，格式化为便于阅读的结构
    """
    try:
        # 检查查询是否为只读查询
        query_upper = query.upper().strip()
        if not query_upper.startswith("SELECT") and not query_upper.startswith("SHOW") and not query_upper.startswith("DESCRIBE") and not query_upper.startswith("EXPLAIN"):
            return {"error": "只允许执行SELECT、SHOW、DESCRIBE或EXPLAIN查询"}
        
        # 连接到MySQL数据库
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port
        )
        cursor = conn.cursor(dictionary=True)
        
        # 开始只读事务
        cursor.execute("SET TRANSACTION READ ONLY")
        cursor.execute("START TRANSACTION")
        
        try:
            # 执行查询
            cursor.execute(query)
            
            # 获取结果
            results = cursor.fetchmany(max_rows)
            has_more = cursor.fetchone() is not None
            
            # 获取列名
            columns = [column[0] for column in cursor.description] if cursor.description else []
            
            # 回滚事务（因为是只读的）
            conn.rollback()
            
            # 构建响应
            response = {
                "query": query,
                "columns": columns,
                "rows": results,
                "row_count": len(results),
                "has_more": has_more,
                "max_rows": max_rows
            }
            
            cursor.close()
            conn.close()
            
            return response
        except Exception as query_error:
            # 如果查询执行失败，回滚事务
            conn.rollback()
            cursor.close()
            conn.close()
            return {"error": str(query_error)}
            
    except Exception as e:
        return {"error": str(e)}

# 添加用户提示
@server.prompt(name="mysql-query-examples")
def mysql_query_examples():
    return """
    以下是一些常用的MySQL查询示例：
    
    1. 查看所有表：
       ```sql
       SHOW TABLES;
       ```
    
    2. 查看表结构：
       ```sql
       DESCRIBE table_name;
       ```
    
    3. 查询表数据：
       ```sql
       SELECT * FROM table_name LIMIT 10;
       ```
    
    4. 按条件查询：
       ```sql
       SELECT column1, column2 FROM table_name WHERE condition LIMIT 10;
       ```
    
    5. 连接查询：
       ```sql
       SELECT a.column1, b.column2 
       FROM table1 a 
       JOIN table2 b ON a.id = b.table1_id
       LIMIT 10;
       ```
    
    6. 分组统计：
       ```sql
       SELECT category, COUNT(*) as count 
       FROM table_name 
       GROUP BY category;
       ```
    """

# 启动服务器
if __name__ == "__main__":
    server.run()
```

## 调试MCP服务器

开发MCP服务器时，使用适当的调试工具可以帮助您识别和解决问题。以下是调试MCP服务器的一些方法：

### 使用Inspector工具

MCP提供了一个官方Inspector工具，可以模拟客户端与服务器之间的交互，检查服务器的响应是否符合预期。

安装Inspector工具：

```bash
# 使用npm安装Inspector
npm install -g @modelcontextprotocol/inspector
```

调试Python服务器：

```bash
# 通用格式
npx @modelcontextprotocol/inspector <command> <arg1> <arg2>

# 调试Python服务器
npx @modelcontextprotocol/inspector python -m your_server_module
# 或
npx @modelcontextprotocol/inspector python your_server.py
```

调试Node.js服务器：

```bash
# 调试Node.js服务器
npx @modelcontextprotocol/inspector node build/index.js
```

Inspector工具的官方文档：[https://github.com/modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector)

### 配置MCP服务器

要将MCP服务器集成到MCP客户端中，您需要创建适当的配置文件。以下是一个示例配置：

```json
{
  "mcpServers": {
    "weather": {
      "command": "python",
      "args": ["path/to/your/weather.py"]
    },
    "mysql-query": {
      "command": "python",
      "args": ["path/to/your/mysql_query.py"]
    }
  }
}
```

对于第三方服务器，如Smithery的顺序思考服务器，配置示例：

```json
"@smithery-ai-server-sequential-thinking": {
  "command": "cmd",
  "args": [
    "/c",
    "npx",
    "-y",
    "@smithery/cli@latest",
    "run",
    "@smithery-ai/server-sequential-thinking",
    "-config",
    "{}"
  ]
}
```

## 最佳实践

开发MCP服务器时，请遵循以下最佳实践：

1. **异常处理**: 在工具函数中包装所有操作，捕获并适当处理异常
2. **文档完善**: 提供详细的工具函数、资源和提示文档
3. **输入验证**: 验证用户输入参数，防止错误或恶意数据
4. **资源组织**: 合理组织资源路径，使其直观易用
5. **提示模板**: 提供有用的提示模板，帮助用户正确使用您的服务器
6. **性能优化**: 使用异步操作处理I/O密集型任务，避免阻塞
7. **无状态设计**: 尽可能使服务器无状态，便于扩展和维护

## 总结

本教程介绍了如何使用Python构建MCP服务器，实现工具、资源和提示模板功能。通过这些功能，您可以大大扩展AI模型的能力，使其能够执行特定领域的任务和访问实时信息。

您可以进一步扩展这个框架，添加更多功能：

1. 数据库集成
2. 用户认证和授权
3. 高级状态管理
4. 指标收集和监控
5. 多种协议支持

通过Python实现MCP服务器，您可以利用Python丰富的生态系统和简洁的语法，快速构建强大的AI功能扩展服务。 