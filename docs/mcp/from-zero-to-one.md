---
sidebar_position: 7
title: 从零到一：构建完整的MCP应用
description: 一个完整的教程，从环境搭建到部署上线的MCP应用开发全流程
---

# 从零到一：构建完整的MCP应用

本教程将带您从零开始，构建一个完整的MCP应用。我们将创建一个**智能代码审查助手**，它能够分析代码、检测问题、提供改进建议。

## 项目概述

### 功能特性

- ✅ 代码语法检查
- ✅ 代码风格分析
- ✅ 类型检查
- ✅ 安全漏洞检测
- ✅ 性能优化建议
- ✅ 与GitHub集成

### 技术栈

- **语言**：Python 3.11+
- **MCP SDK**：mcp
- **代码分析**：ast, pylint, mypy, bandit
- **GitHub集成**：PyGithub
- **LLM**：OpenAI API

## 第一步：环境准备

### 1.1 创建项目目录

```bash
mkdir mcp-code-reviewer
cd mcp-code-reviewer
```

### 1.2 创建虚拟环境

```bash
# 使用venv
python -m venv venv

# 激活虚拟环境
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 1.3 安装依赖

创建 `requirements.txt`：

```txt
mcp>=0.1.0
pylint>=3.0.0
mypy>=1.5.0
bandit>=1.7.0
PyGithub>=1.59.0
openai>=1.0.0
python-dotenv>=1.0.0
```

安装依赖：

```bash
pip install -r requirements.txt
```

### 1.4 创建项目结构

```bash
mkdir -p src tests config
touch src/__init__.py
touch src/server.py
touch src/tools.py
touch src/utils.py
touch .env.example
touch README.md
```

## 第二步：配置环境变量

创建 `.env` 文件：

```bash
# GitHub配置
GITHUB_TOKEN=your_github_token_here

# OpenAI配置
OPENAI_API_KEY=your_openai_api_key_here

# MCP服务器配置
MCP_SERVER_NAME=code-reviewer
MCP_SERVER_VERSION=1.0.0
```

创建 `.env.example`：

```bash
GITHUB_TOKEN=
OPENAI_API_KEY=
MCP_SERVER_NAME=code-reviewer
MCP_SERVER_VERSION=1.0.0
```

## 第三步：实现核心功能

### 3.1 创建工具模块 (`src/tools.py`)

```python
"""MCP工具实现模块"""
import ast
import subprocess
import tempfile
import os
from typing import List, Dict, Any
from github import Github
import openai
from dotenv import load_dotenv

load_dotenv()

g = Github(os.getenv("GITHUB_TOKEN"))
openai.api_key = os.getenv("OPENAI_API_KEY")


def analyze_code_syntax(code: str, language: str = "python") -> Dict[str, Any]:
    """分析代码语法"""
    if language != "python":
        return {"valid": True, "errors": []}
    
    try:
        ast.parse(code)
        return {"valid": True, "errors": []}
    except SyntaxError as e:
        return {
            "valid": False,
            "errors": [{
                "type": "syntax_error",
                "message": e.msg,
                "line": e.lineno,
                "column": e.col_offset
            }]
        }


def analyze_code_style(code: str) -> Dict[str, Any]:
    """分析代码风格"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        temp_file = f.name
    
    try:
        result = subprocess.run(
            ["pylint", temp_file, "--output-format=json"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        import json
        issues = json.loads(result.stdout) if result.stdout else []
        
        return {
            "score": calculate_style_score(issues),
            "issues": issues[:10]  # 只返回前10个问题
        }
    except Exception as e:
        return {"score": 0, "issues": [{"message": str(e)}]}
    finally:
        os.unlink(temp_file)


def analyze_code_types(code: str) -> Dict[str, Any]:
    """类型检查"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        temp_file = f.name
    
    try:
        result = subprocess.run(
            ["mypy", temp_file, "--show-error-codes"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        return {
            "valid": result.returncode == 0,
            "errors": result.stdout.split("\n") if result.stdout else []
        }
    except Exception as e:
        return {"valid": False, "errors": [str(e)]}
    finally:
        os.unlink(temp_file)


def analyze_security(code: str) -> Dict[str, Any]:
    """安全漏洞检测"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        temp_file = f.name
    
    try:
        result = subprocess.run(
            ["bandit", "-f", "json", "-ll", temp_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        import json
        report = json.loads(result.stdout) if result.stdout else {}
        
        return {
            "high_risk": len([i for i in report.get("results", []) if i.get("issue_severity") == "HIGH"]),
            "medium_risk": len([i for i in report.get("results", []) if i.get("issue_severity") == "MEDIUM"]),
            "issues": report.get("results", [])[:10]
        }
    except Exception as e:
        return {"high_risk": 0, "medium_risk": 0, "issues": [{"message": str(e)}]}
    finally:
        os.unlink(temp_file)


def generate_suggestions(code: str, analysis_results: Dict[str, Any]) -> str:
    """使用LLM生成改进建议"""
    syntax_valid = analysis_results.get('syntax', {}).get('valid', False)
    style_score = analysis_results.get('style', {}).get('score', 0)
    types_valid = analysis_results.get('types', {}).get('valid', False)
    high_risk = analysis_results.get('security', {}).get('high_risk', 0)
    medium_risk = analysis_results.get('security', {}).get('medium_risk', 0)
    
    syntax_status = '通过' if syntax_valid else '失败'
    types_status = '通过' if types_valid else '失败'
    
    # 构建提示词，避免在f-string中使用嵌套代码块
    code_block = f"```python\n{code}\n```"
    prompt = f"""
    分析以下Python代码，并提供改进建议：
    
    代码：
    {code_block}
    
    分析结果：
    - 语法检查：{syntax_status}
    - 代码风格得分：{style_score}/10
    - 类型检查：{types_status}
    - 安全风险：高风险 {high_risk} 个，中风险 {medium_risk} 个
    
    请提供具体的改进建议，包括：
    1. 代码质量问题
    2. 性能优化建议
    3. 安全改进建议
    4. 最佳实践建议
    """
    
    try:
        system_msg = "你是一个专业的代码审查助手。"
        user_msg = prompt
        
        # 构建消息列表
        message_system = dict(role="system", content=system_msg)
        message_user = dict(role="user", content=user_msg)
        messages_list = [message_system, message_user]
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages_list,
            temperature=0.7,
            max_tokens=1000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"生成建议时出错：{str(e)}"


def calculate_style_score(issues: List[Dict]) -> float:
    """计算代码风格得分"""
    if not issues:
        return 10.0
    
    # 根据问题数量和严重程度计算得分
    error_count = len([i for i in issues if i.get("type") == "error"])
    warning_count = len([i for i in issues if i.get("type") == "warning"])
    
    score = 10.0 - (error_count * 0.5) - (warning_count * 0.1)
    return max(0.0, min(10.0, score))


def review_github_pr(repo_name: str, pr_number: int) -> Dict[str, Any]:
    """审查GitHub Pull Request"""
    try:
        repo = g.get_repo(repo_name)
        pr = repo.get_pull(pr_number)
        
        review_comments = []
        
        for file in pr.get_files():
            if file.filename.endswith('.py'):
                # 获取文件内容
                content = repo.get_contents(file.filename, ref=pr.head.sha).decoded_content.decode()
                
                # 分析代码
                syntax_result = analyze_code_syntax(content)
                style_result = analyze_code_style(content)
                types_result = analyze_code_types(content)
                security_result = analyze_security(content)
                
                analysis = {
                    "file": file.filename,  # 文件名
                    "syntax": syntax_result,
                    "style": style_result,
                    "types": types_result,
                    "security": security_result
                }
                
                review_comments.append(analysis)
        
        return {
            "pr_number": pr_number,
            "repo": repo_name,
            "files_reviewed": len(review_comments),
            "reviews": review_comments
        }
    except Exception as e:
        return {"error": str(e)}
```

### 3.2 创建MCP服务器 (`src/server.py`)

```python
"""MCP服务器主文件"""
import asyncio
import os
from mcp.server import Server
from mcp.types import Tool, TextContent
from dotenv import load_dotenv
from .tools import (
    analyze_code_syntax,
    analyze_code_style,
    analyze_code_types,
    analyze_security,
    generate_suggestions,
    review_github_pr
)

load_dotenv()

app = Server(
    name=os.getenv("MCP_SERVER_NAME", "code-reviewer"),
    version=os.getenv("MCP_SERVER_VERSION", "1.0.0")
)


@app.list_tools()
async def list_tools() -> list[Tool]:
    """列出所有可用工具"""
    return [
        Tool(
            name="analyze_code",
            description="分析代码并提供详细报告，包括语法、风格、类型和安全检查",
            inputSchema={
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "要分析的代码"
                    },
                    "language": {
                        "type": "string",
                        "description": "编程语言，默认为python",
                        "default": "python"
                    }
                },
                "required": ["code"]
            }
        ),
        Tool(
            name="review_github_pr",
            description="审查GitHub Pull Request中的所有Python文件",
            inputSchema={
                "type": "object",
                "properties": {
                    "repo": {
                        "type": "string",
                        "description": "GitHub仓库名称，格式：owner/repo"
                    },
                    "pr_number": {
                        "type": "integer",
                        "description": "Pull Request编号"
                    }
                },
                "required": ["repo", "pr_number"]
            }
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """处理工具调用"""
    try:
        if name == "analyze_code":
            code = arguments.get("code")
            language = arguments.get("language", "python")
            
            # 执行各种分析
            syntax_result = analyze_code_syntax(code, language)
            style_result = analyze_code_style(code)
            types_result = analyze_code_types(code)
            security_result = analyze_security(code)
            
            # 生成综合报告
            analysis_results = {
                "syntax": syntax_result,
                "style": style_result,
                "types": types_result,
                "security": security_result
            }
            
            # 生成改进建议
            suggestions = generate_suggestions(code, analysis_results)
            
            # 格式化报告
            syntax_valid = syntax_result.get('valid', False)
            style_score = style_result.get('score', 0)
            style_issues_count = len(style_result.get('issues', []))
            types_valid = types_result.get('valid', False)
            types_errors = types_result.get('errors', [])[:5]
            high_risk = security_result.get('high_risk', 0)
            medium_risk = security_result.get('medium_risk', 0)
            
            syntax_status = '✅ 通过' if syntax_valid else '❌ 失败'
            types_status = '✅ 通过' if types_valid else '❌ 失败'
            types_errors_str = chr(10).join(types_errors)
            
            report = f"""
# 代码分析报告

## 语法检查
{syntax_status}
{syntax_result.get('errors', [])}

## 代码风格
得分：{style_score}/10
问题数量：{style_issues_count}

## 类型检查
{types_status}
{types_errors_str}

## 安全分析
高风险：{high_risk} 个
中风险：{medium_risk} 个

## 改进建议
{suggestions}
"""
            
            return [TextContent(type="text", text=report)]
        
        elif name == "review_github_pr":
            repo = arguments.get("repo")
            pr_number = arguments.get("pr_number")
            
            result = review_github_pr(repo, pr_number)
            
            if "error" in result:
                error_msg = result['error']
                return [TextContent(type="text", text=f"错误：{error_msg}")]
            
            # 格式化PR审查报告
            repo_name = result['repo']
            pr_num = result['pr_number']
            files_count = result['files_reviewed']
            
            report = f"""
# GitHub PR审查报告

**仓库**：{repo_name}
**PR编号**：#{pr_num}
**审查文件数**：{files_count}

## 文件审查详情

"""
            for review in result.get('reviews', []):
                review_file = review['file']
                review_syntax_valid = review['syntax'].get('valid', False)
                review_style_score = review['style'].get('score', 0)
                review_types_valid = review['types'].get('valid', False)
                review_high_risk = review['security'].get('high_risk', 0)
                
                syntax_icon = '✅' if review_syntax_valid else '❌'
                types_icon = '✅' if review_types_valid else '❌'
                
                report += f"""
### {review_file}

- 语法：{syntax_icon}
- 风格得分：{review_style_score}/10
- 类型：{types_icon}
- 安全风险：高风险 {review_high_risk} 个

"""
            
            return [TextContent(type="text", text=report)]
        
        else:
            unknown_tool_msg = f"未知工具：{name}"
            return [TextContent(type="text", text=unknown_tool_msg)]
    
    except Exception as e:
        error_msg = f"执行工具时出错：{str(e)}"
        return [TextContent(type="text", text=error_msg)]


async def main():
    """启动MCP服务器"""
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
```

## 第四步：配置MCP客户端

### 4.1 Claude Desktop配置

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) 或 `%APPDATA%\Claude\claude_desktop_config.json` (Windows)：

```json
{
  "mcpServers": {
    "code-reviewer": {
      "command": "python",
      "args": [
        "/path/to/mcp-code-reviewer/src/server.py"
      ],
      "env": {
        "GITHUB_TOKEN": "your_token",
        "OPENAI_API_KEY": "your_key"
      }
    }
  }
}
```

## 第五步：测试应用

### 5.1 本地测试

创建测试文件 `tests/test_tools.py`：

```python
import pytest
from src.tools import analyze_code_syntax, analyze_code_style

def test_syntax_analysis():
    """测试语法分析"""
    valid_code = "def hello():\n    print('Hello')"
    result = analyze_code_syntax(valid_code)
    assert result["valid"] == True
    
    invalid_code = "def hello(\n    print('Hello')"
    result = analyze_code_syntax(invalid_code)
    assert result["valid"] == False

def test_style_analysis():
    """测试风格分析"""
    code = "def hello():\n    print('Hello')"
    result = analyze_code_style(code)
    assert "score" in result
    assert 0 <= result["score"] <= 10
```

运行测试：

```bash
pytest tests/
```

### 5.2 使用测试

在Claude Desktop中测试：

```
用户：分析这段代码：
def calculate(x, y):
    return x+y

Claude：调用analyze_code工具分析代码...
```

## 第六步：部署

### 6.1 创建Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY src/ ./src/
COPY .env.example .env

# 运行服务器
CMD ["python", "-m", "src.server"]
```

### 6.2 创建docker-compose.yml

```yaml
version: '3.8'

services:
  mcp-code-reviewer:
    build: .
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

## 第七步：优化和扩展

### 7.1 添加缓存

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def cached_analyze_code(code_hash: str):
    """缓存代码分析结果"""
    # 分析逻辑...
    pass
```

### 7.2 添加日志

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    logger.info(f"调用工具：{name}")
    # ...
```

## 总结

通过本教程，您已经：

1. ✅ 创建了完整的MCP应用
2. ✅ 实现了代码分析功能
3. ✅ 集成了GitHub API
4. ✅ 添加了LLM改进建议
5. ✅ 配置了测试和部署

## 下一步

- [MCP开发指南](/docs/mcp/development) - 深入学习MCP开发
- [MCP最佳实践](/docs/mcp/best-practices) - 了解最佳实践
- [MCP实战案例](/docs/mcp/practical-cases) - 查看更多案例

