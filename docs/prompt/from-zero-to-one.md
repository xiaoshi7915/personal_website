---
sidebar_position: 8
title: 从零到一：构建智能提示词应用
description: 一个完整的教程，从环境搭建到部署上线的提示词工程应用开发全流程
---

# 从零到一：构建智能提示词应用

本教程将带您从零开始，构建一个完整的提示词工程应用。我们将创建一个**智能提示词生成和管理平台**，能够帮助用户创建、优化和管理提示词模板。

## 项目概述

### 功能特性

- ✅ 提示词模板管理
- ✅ 提示词优化建议
- ✅ 多模型测试对比
- ✅ 提示词版本控制
- ✅ Web界面管理
- ✅ API接口

### 技术栈

- **后端**：Python 3.11+ + FastAPI
- **数据库**：SQLite / PostgreSQL
- **LLM**：OpenAI API / Anthropic Claude
- **前端**：React + TypeScript
- **部署**：Docker

## 第一步：环境准备

### 1.1 创建项目目录

```bash
mkdir prompt-manager
cd prompt-manager
```

### 1.2 安装依赖

创建 `requirements.txt`：

```txt
fastapi>=0.104.0
uvicorn>=0.24.0
sqlalchemy>=2.0.0
pydantic>=2.5.0
openai>=1.0.0
anthropic>=0.7.0
python-dotenv>=1.0.0
```

## 第二步：实现核心功能

### 2.1 提示词模板模型

```python
"""提示词模板模型"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class PromptTemplate(Base):
    """提示词模板"""
    __tablename__ = "prompt_templates"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100))
    template = Column(Text, nullable=False)
    variables = Column(JSON)  # 模板变量列表
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 2.2 提示词优化器

```python
"""提示词优化器"""
from openai import OpenAI
from typing import Dict, List

class PromptOptimizer:
    """提示词优化器"""
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
    
    def optimize(self, prompt: str, context: Dict = None) -> Dict:
        """优化提示词"""
        optimization_prompt = f"""
        分析以下提示词，并提供优化建议：
        
        原始提示词：
        {prompt}
        
        请提供：
        1. 优化后的提示词
        2. 优化说明
        3. 预期改进效果
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "你是一个提示词工程专家。"},
                {"role": "user", "content": optimization_prompt}
            ],
            temperature=0.7
        )
        
        return {
            "optimized_prompt": response.choices[0].message.content,
            "suggestions": self._extract_suggestions(response.choices[0].message.content)
        }
    
    def _extract_suggestions(self, content: str) -> List[str]:
        """提取优化建议"""
        # 简单的建议提取逻辑
        suggestions = []
        lines = content.split('\n')
        for line in lines:
            if line.strip().startswith('-') or line.strip().startswith('•'):
                suggestions.append(line.strip())
        return suggestions
```

### 2.3 API接口

```python
"""FastAPI应用"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI()

class PromptTemplateCreate(BaseModel):
    name: str
    category: Optional[str] = None
    template: str
    variables: Optional[List[str]] = None
    description: Optional[str] = None

class PromptOptimizeRequest(BaseModel):
    prompt: str
    context: Optional[dict] = None

@app.post("/templates")
async def create_template(template: PromptTemplateCreate):
    """创建提示词模板"""
    # 实现创建逻辑
    pass

@app.post("/optimize")
async def optimize_prompt(request: PromptOptimizeRequest):
    """优化提示词"""
    optimizer = PromptOptimizer(os.getenv("OPENAI_API_KEY"))
    result = optimizer.optimize(request.prompt, request.context)
    return result
```

## 第三步：部署

### 3.1 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 总结

本教程展示了如何构建一个提示词管理平台，包括模板管理、优化建议等功能。您可以根据需求扩展更多功能。

