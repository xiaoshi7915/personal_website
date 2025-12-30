---
sidebar_position: 6
title: MCP实战案例
description: MCP协议的实际应用案例，从零到一构建完整的MCP应用
---

# MCP实战案例

本文档提供了多个完整的MCP实战案例，帮助您从零开始构建MCP应用。

## 案例1：智能文档分析系统

### 项目概述

构建一个基于MCP协议的智能文档分析系统，能够自动提取文档关键信息、生成摘要、回答文档相关问题。

### 技术栈

- **MCP服务器**：Python + FastAPI
- **MCP客户端**：Claude Desktop / ChatGPT
- **文档处理**：PyPDF2, python-docx
- **向量数据库**：ChromaDB
- **LLM**：OpenAI GPT-4 / Claude

### 实施步骤

#### 步骤1：环境准备

```bash
# 创建项目目录
mkdir mcp-document-analyzer
cd mcp-document-analyzer

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install mcp fastapi uvicorn pypdf2 python-docx chromadb openai
```

#### 步骤2：创建MCP服务器

创建 `server.py`：

```python
from mcp import Server, types
from mcp.server import serve
import asyncio
from pathlib import Path
import PyPDF2
from docx import Document
import chromadb
from chromadb.config import Settings

# 初始化向量数据库
client = chromadb.Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory="./chroma_db"
))
collection = client.get_or_create_collection(name="documents")

app = Server("document-analyzer")

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="analyze_document",
            description="分析文档并提取关键信息",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "文档文件路径"
                    }
                },
                "required": ["file_path"]
            }
        ),
        types.Tool(
            name="query_document",
            description="基于文档内容回答问题",
            inputSchema={
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "要回答的问题"
                    }
                },
                "required": ["question"]
            }
        ),
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "analyze_document":
        file_path = arguments.get("file_path")
        # 实现文档分析逻辑
        result = analyze_document(file_path)
        return [types.TextContent(type="text", text=result)]
    elif name == "query_document":
        question = arguments.get("question")
        # 实现文档查询逻辑
        result = query_document(question)
        return [types.TextContent(type="text", text=result)]

def analyze_document(file_path: str) -> str:
    """分析文档并提取信息"""
    path = Path(file_path)
    text = ""
    
    if path.suffix == ".pdf":
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = "\n".join([page.extract_text() for page in reader.pages])
    elif path.suffix == ".docx":
        doc = Document(path)
        text = "\n".join([para.text for para in doc.paragraphs])
    
    # 存储到向量数据库
    collection.add(
        documents=[text],
        ids=[str(path)]
    )
    
    return f"文档已分析并存储。共提取 {len(text)} 个字符。"

def query_document(question: str) -> str:
    """基于文档内容回答问题"""
    results = collection.query(
        query_texts=[question],
        n_results=3
    )
    
    context = "\n".join(results['documents'][0])
    # 使用LLM生成答案
    # answer = llm.generate(context, question)
    return f"基于文档内容：{context[:200]}..."

if __name__ == "__main__":
    asyncio.run(serve(app))
```

#### 步骤3：配置MCP客户端

在Claude Desktop的配置文件中添加：

```json
{
  "mcpServers": {
    "document-analyzer": {
      "command": "python",
      "args": ["/path/to/server.py"]
    }
  }
}
```

#### 步骤4：测试使用

1. 启动MCP服务器
2. 在Claude Desktop中，使用工具：
   - "分析这个文档：/path/to/document.pdf"
   - "文档中提到了什么关键信息？"

### 项目亮点

- ✅ 支持多种文档格式（PDF、DOCX）
- ✅ 自动提取和存储文档内容
- ✅ 基于向量数据库的智能检索
- ✅ 与LLM无缝集成

---

## 案例2：实时数据可视化助手

### 项目概述

创建一个MCP服务器，能够连接各种数据源（数据库、API），实时获取数据并生成可视化图表。

### 技术栈

- **MCP服务器**：Node.js + Express
- **数据源**：MySQL, REST API
- **可视化**：Chart.js
- **MCP客户端**：Claude Desktop

### 实施步骤

#### 步骤1：项目初始化

```bash
mkdir mcp-data-visualizer
cd mcp-data-visualizer
npm init -y
npm install @modelcontextprotocol/sdk express mysql2 chart.js
```

#### 步骤2：创建MCP服务器

创建 `server.js`：

```javascript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import mysql from "mysql2/promise";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

const app = express();
const server = new Server({
  name: "data-visualizer",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

// 数据库连接
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "mydb",
});

// 定义工具
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "query_database",
      description: "查询数据库并返回结果",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL查询语句" },
        },
        required: ["sql"],
      },
    },
    {
      name: "create_chart",
      description: "基于数据创建图表",
      inputSchema: {
        type: "object",
        properties: {
          data: { type: "array", description: "图表数据" },
          chartType: { type: "string", description: "图表类型：line, bar, pie" },
        },
        required: ["data", "chartType"],
      },
    },
  ],
}));

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "query_database") {
    const [rows] = await db.execute(args.sql);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  }

  if (name === "create_chart") {
    const chart = new ChartJSNodeCanvas({ width: 800, height: 600 });
    const image = await chart.renderToBuffer({
      type: args.chartType,
      data: {
        labels: args.data.labels,
        datasets: args.data.datasets,
      },
    });
    
    return {
      content: [
        {
          type: "image",
          data: image.toString("base64"),
          mimeType: "image/png",
        },
      ],
    };
  }
});

// 启动服务器
const transport = new StdioServerTransport();
await server.connect(transport);
```

#### 步骤3：使用示例

在Claude Desktop中：

```
用户：查询最近7天的销售数据并生成折线图
Claude：调用query_database工具查询数据，然后调用create_chart工具生成图表
```

### 项目亮点

- ✅ 支持多种数据源
- ✅ 实时数据查询
- ✅ 自动生成可视化图表
- ✅ 灵活的图表类型支持

---

## 案例3：智能代码审查助手

### 项目概述

构建一个MCP服务器，能够分析代码、检测问题、提供改进建议，并与GitHub集成。

### 技术栈

- **MCP服务器**：Python
- **代码分析**：AST, pylint, mypy
- **GitHub集成**：PyGithub
- **LLM**：OpenAI / Claude

### 实施步骤

#### 步骤1：安装依赖

```bash
pip install mcp ast astunparse pylint mypy PyGithub openai
```

#### 步骤2：创建MCP服务器

创建 `code_reviewer.py`：

```python
from mcp import Server, types
import ast
import subprocess
from github import Github
import openai

app = Server("code-reviewer")
g = Github("your_token")
openai.api_key = "your_key"

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="analyze_code",
            description="分析代码并提供改进建议",
            inputSchema={
                "type": "object",
                "properties": {
                    "code": {"type": "string"},
                    "language": {"type": "string"}
                },
                "required": ["code"]
            }
        ),
        types.Tool(
            name="review_pull_request",
            description="审查GitHub Pull Request",
            inputSchema={
                "type": "object",
                "properties": {
                    "repo": {"type": "string"},
                    "pr_number": {"type": "integer"}
                },
                "required": ["repo", "pr_number"]
            }
        ),
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "analyze_code":
        code = arguments.get("code")
        language = arguments.get("language", "python")
        
        # 代码分析
        issues = []
        if language == "python":
            issues.extend(check_syntax(code))
            issues.extend(check_style(code))
            issues.extend(check_types(code))
        
        # 使用LLM生成建议
        suggestions = generate_suggestions(code, issues)
        
        return [types.TextContent(
            type="text",
            text=f"发现 {len(issues)} 个问题：\n" + 
                 "\n".join(issues) + 
                 f"\n\n改进建议：\n{suggestions}"
        )]
    
    elif name == "review_pull_request":
        repo_name = arguments.get("repo")
        pr_number = arguments.get("pr_number")
        
        repo = g.get_repo(repo_name)
        pr = repo.get_pull(pr_number)
        
        # 获取PR的代码变更
        files = pr.get_files()
        review_comments = []
        
        for file in files:
            if file.filename.endswith('.py'):
                patch = file.patch
                # 分析代码变更
                analysis = analyze_code_changes(patch)
                review_comments.append(f"{file.filename}: {analysis}")
        
        return [types.TextContent(
            type="text",
            text="\n".join(review_comments)
        )]

def check_syntax(code: str) -> list[str]:
    """检查语法错误"""
    try:
        ast.parse(code)
        return []
    except SyntaxError as e:
        return [f"语法错误：{e.msg} at line {e.lineno}"]

def check_style(code: str) -> list[str]:
    """检查代码风格"""
    result = subprocess.run(
        ["pylint", "--output-format=text", "-"],
        input=code,
        text=True,
        capture_output=True
    )
    return result.stdout.split("\n") if result.returncode else []

def generate_suggestions(code: str, issues: list[str]) -> str:
    """使用LLM生成改进建议"""
    prompt = f"""
    分析以下代码和问题，提供改进建议：
    
    代码：
    {code}
    
    问题：
    {chr(10).join(issues)}
    
    请提供具体的改进建议。
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content

if __name__ == "__main__":
    asyncio.run(serve(app))
```

### 使用场景

1. **本地代码审查**：分析当前编写的代码
2. **PR审查**：自动审查GitHub Pull Request
3. **代码质量检查**：持续集成中的代码质量检查

---

## 案例4：多语言翻译助手

### 项目概述

创建一个支持多语言实时翻译的MCP服务器，支持文档翻译、代码注释翻译等功能。

### 技术栈

- **MCP服务器**：Python
- **翻译API**：Google Translate API / DeepL API
- **文档处理**：支持多种格式

### 核心功能

```python
@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="translate_text",
            description="翻译文本到目标语言",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "target_lang": {"type": "string"},
                    "source_lang": {"type": "string"}
                },
                "required": ["text", "target_lang"]
            }
        ),
        types.Tool(
            name="translate_document",
            description="翻译整个文档",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string"},
                    "target_lang": {"type": "string"}
                },
                "required": ["file_path", "target_lang"]
            }
        ),
    ]
```

---

## 案例5：智能API测试助手

### 项目概述

构建一个MCP服务器，能够自动生成API测试用例、执行测试、生成测试报告。

### 技术栈

- **MCP服务器**：Python
- **API测试**：requests, pytest
- **OpenAPI解析**：openapi-parser

### 核心功能

- 自动解析OpenAPI规范
- 生成测试用例
- 执行API测试
- 生成测试报告
- 性能测试

---

## 最佳实践总结

### 1. 错误处理

```python
@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    try:
        # 工具逻辑
        result = execute_tool(name, arguments)
        return [types.TextContent(type="text", text=result)]
    except Exception as e:
        return [types.TextContent(
            type="text",
            text=f"错误：{str(e)}"
        )]
```

### 2. 参数验证

```python
def validate_arguments(schema: dict, arguments: dict) -> bool:
    """验证参数是否符合schema"""
    # 实现参数验证逻辑
    return True
```

### 3. 日志记录

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    logger.info(f"调用工具：{name}，参数：{arguments}")
    # ...
```

### 4. 性能优化

- 使用异步操作
- 缓存常用数据
- 批量处理请求

---

## 下一步学习

- [MCP服务器开发指南](/docs/mcp/server/python-implementation)
- [MCP最佳实践](/docs/mcp/best-practices)
- [MCP常见问题](/docs/mcp/faq)

