---
sidebar_position: 7
---

# Python MCP应用案例

本页面展示了使用Python实现MCP的实际应用案例，帮助您理解如何利用Python构建强大的AI功能扩展。

## 1. 智能文档分析系统

### 场景描述

构建一个能够接收PDF文档、提取内容、分析关键信息并回答用户问题的系统。

### MCP实现

```python
import fitz  # PyMuPDF
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os

# 加载NLP模型
nlp = spacy.load("zh_core_web_sm")

# 文档存储
documents = {}

async def extract_text_from_pdf(file_path: str) -> dict:
    """
    从PDF文件中提取文本
    
    Args:
        file_path: PDF文件路径
        
    Returns:
        包含提取文本的字典
    """
    try:
        doc = fitz.open(file_path)
        text = ""
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text()
            
        # 将文档存储在内存中
        doc_id = os.path.basename(file_path)
        documents[doc_id] = {
            "text": text,
            "file_path": file_path,
            "processed": False
        }
        
        return {
            "doc_id": doc_id,
            "page_count": len(doc),
            "text_length": len(text),
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "failed"
        }

async def analyze_document(doc_id: str) -> dict:
    """
    分析文档，提取关键信息
    
    Args:
        doc_id: 文档ID
        
    Returns:
        包含分析结果的字典
    """
    if doc_id not in documents:
        return {"error": "文档不存在", "status": "failed"}
    
    doc = documents[doc_id]
    text = doc["text"]
    
    # 使用spaCy进行NLP分析
    nlp_doc = nlp(text)
    
    # 提取实体
    entities = []
    for ent in nlp_doc.ents:
        entities.append({
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char
        })
    
    # 提取关键句子
    sentences = [sent.text for sent in nlp_doc.sents]
    
    # 使用TF-IDF找出最重要的句子
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(sentences)
    
    # 计算每个句子的重要性分数
    sentence_scores = tfidf_matrix.sum(axis=1).A1
    
    # 获取前5个最重要的句子
    top_sentence_indices = sentence_scores.argsort()[-5:][::-1]
    key_sentences = [sentences[i] for i in top_sentence_indices]
    
    # 更新文档处理状态
    doc["processed"] = True
    doc["entities"] = entities
    doc["key_sentences"] = key_sentences
    
    return {
        "doc_id": doc_id,
        "entity_count": len(entities),
        "key_sentences": key_sentences,
        "status": "success"
    }

async def answer_question(doc_id: str, question: str) -> dict:
    """
    回答关于文档的问题
    
    Args:
        doc_id: 文档ID
        question: 用户问题
        
    Returns:
        包含回答的字典
    """
    if doc_id not in documents:
        return {"error": "文档不存在", "status": "failed"}
    
    doc = documents[doc_id]
    
    if not doc["processed"]:
        # 如果文档尚未分析，先进行分析
        await analyze_document(doc_id)
    
    text = doc["text"]
    
    # 将文档分成段落
    paragraphs = text.split("\n\n")
    paragraphs = [p for p in paragraphs if len(p.strip()) > 0]
    
    # 使用TF-IDF计算问题和段落的相似度
    all_texts = [question] + paragraphs
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    # 问题的向量
    question_vector = tfidf_matrix[0:1]
    
    # 段落向量
    paragraph_vectors = tfidf_matrix[1:]
    
    # 计算相似度
    similarities = cosine_similarity(question_vector, paragraph_vectors).flatten()
    
    # 获取最相关的3个段落
    top_paragraph_indices = similarities.argsort()[-3:][::-1]
    relevant_paragraphs = [paragraphs[i] for i in top_paragraph_indices]
    
    # 构建回答
    context = "\n".join(relevant_paragraphs)
    
    return {
        "answer": f"根据文档内容，以下信息与您的问题最相关：\n\n{context}",
        "relevance_score": float(similarities[top_paragraph_indices[0]]),
        "status": "success"
    }

# 在MCP服务器中注册这些函数
mcp_server.register_function(
    name="extract_text_from_pdf",
    description="从PDF文件中提取文本",
    parameters={
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "PDF文件的路径"
            }
        },
        "required": ["file_path"]
    },
    handler=extract_text_from_pdf
)

mcp_server.register_function(
    name="analyze_document",
    description="分析文档并提取关键信息",
    parameters={
        "type": "object",
        "properties": {
            "doc_id": {
                "type": "string",
                "description": "要分析的文档ID"
            }
        },
        "required": ["doc_id"]
    },
    handler=analyze_document
)

mcp_server.register_function(
    name="answer_question",
    description="回答关于文档的问题",
    parameters={
        "type": "object",
        "properties": {
            "doc_id": {
                "type": "string",
                "description": "文档ID"
            },
            "question": {
                "type": "string",
                "description": "用户问题"
            }
        },
        "required": ["doc_id", "question"]
    },
    handler=answer_question
)
```

### 用户体验

用户可以上传PDF文档，然后提问如：
1. "这份合同的主要条款是什么？"
2. "这篇论文的研究方法有哪些？"
3. "这份报告中的关键发现是什么？"

AI会使用MCP函数分析文档，找出与问题最相关的内容，并给出回答。

## 2. 实时数据可视化助手

### 场景描述

创建一个能够生成数据可视化并实时返回给用户的助手。

### MCP实现

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from typing import List, Dict, Any, Optional

# 临时数据存储
datasets = {}

async def load_csv_data(file_path: str, dataset_name: str) -> dict:
    """
    加载CSV数据
    
    Args:
        file_path: CSV文件路径
        dataset_name: 数据集名称
        
    Returns:
        包含数据集信息的字典
    """
    try:
        df = pd.read_csv(file_path)
        
        # 存储数据集
        datasets[dataset_name] = df
        
        return {
            "dataset_name": dataset_name,
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": df.columns.tolist(),
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "failed"
        }

async def get_data_summary(dataset_name: str) -> dict:
    """
    获取数据摘要
    
    Args:
        dataset_name: 数据集名称
        
    Returns:
        包含数据摘要的字典
    """
    if dataset_name not in datasets:
        return {"error": "数据集不存在", "status": "failed"}
    
    df = datasets[dataset_name]
    
    # 计算数值列的统计摘要
    numeric_summary = df.describe().to_dict()
    
    # 计算分类列的唯一值计数
    categorical_columns = df.select_dtypes(include=['object']).columns
    categorical_summary = {}
    
    for col in categorical_columns:
        value_counts = df[col].value_counts().to_dict()
        categorical_summary[col] = value_counts
    
    return {
        "dataset_name": dataset_name,
        "numeric_summary": numeric_summary,
        "categorical_summary": categorical_summary,
        "status": "success"
    }

async def create_visualization(
    dataset_name: str,
    chart_type: str,
    x_column: str,
    y_column: Optional[str] = None,
    hue_column: Optional[str] = None,
    title: Optional[str] = None
) -> dict:
    """
    创建数据可视化
    
    Args:
        dataset_name: 数据集名称
        chart_type: 图表类型 (bar, line, scatter, histogram, boxplot)
        x_column: X轴列名
        y_column: Y轴列名 (某些图表类型可选)
        hue_column: 用于分组的列名 (可选)
        title: 图表标题 (可选)
        
    Returns:
        包含可视化图像的字典
    """
    if dataset_name not in datasets:
        return {"error": "数据集不存在", "status": "failed"}
    
    df = datasets[dataset_name]
    
    if x_column not in df.columns:
        return {"error": f"列 '{x_column}' 不存在", "status": "failed"}
    
    if y_column and y_column not in df.columns:
        return {"error": f"列 '{y_column}' 不存在", "status": "failed"}
    
    if hue_column and hue_column not in df.columns:
        return {"error": f"列 '{hue_column}' 不存在", "status": "failed"}
    
    plt.figure(figsize=(10, 6))
    
    try:
        if chart_type == "bar":
            if y_column:
                ax = sns.barplot(x=x_column, y=y_column, hue=hue_column, data=df)
            else:
                # 如果没有提供y_column，使用计数
                ax = sns.countplot(x=x_column, hue=hue_column, data=df)
                
        elif chart_type == "line":
            if not y_column:
                return {"error": "line图表需要y_column", "status": "failed"}
            ax = sns.lineplot(x=x_column, y=y_column, hue=hue_column, data=df)
            
        elif chart_type == "scatter":
            if not y_column:
                return {"error": "scatter图表需要y_column", "status": "failed"}
            ax = sns.scatterplot(x=x_column, y=y_column, hue=hue_column, data=df)
            
        elif chart_type == "histogram":
            ax = sns.histplot(data=df, x=x_column, hue=hue_column)
            
        elif chart_type == "boxplot":
            if y_column:
                ax = sns.boxplot(x=x_column, y=y_column, hue=hue_column, data=df)
            else:
                ax = sns.boxplot(x=x_column, data=df)
        else:
            return {"error": f"不支持的图表类型: {chart_type}", "status": "failed"}
        
        # 设置标题
        if title:
            plt.title(title)
        else:
            plt.title(f"{chart_type.capitalize()} of {x_column}")
        
        # 调整布局
        plt.tight_layout()
        
        # 将图表转换为base64编码的图像
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close()
        
        return {
            "image": f"data:image/png;base64,{image_base64}",
            "chart_type": chart_type,
            "title": title,
            "status": "success"
        }
    except Exception as e:
        plt.close()
        return {
            "error": str(e),
            "status": "failed"
        }

# 注册这些函数到MCP服务器
mcp_server.register_function(
    name="load_csv_data",
    description="加载CSV数据",
    parameters={
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "CSV文件的路径"
            },
            "dataset_name": {
                "type": "string",
                "description": "数据集的名称"
            }
        },
        "required": ["file_path", "dataset_name"]
    },
    handler=load_csv_data
)

mcp_server.register_function(
    name="get_data_summary",
    description="获取数据摘要",
    parameters={
        "type": "object",
        "properties": {
            "dataset_name": {
                "type": "string",
                "description": "数据集的名称"
            }
        },
        "required": ["dataset_name"]
    },
    handler=get_data_summary
)

mcp_server.register_function(
    name="create_visualization",
    description="创建数据可视化",
    parameters={
        "type": "object",
        "properties": {
            "dataset_name": {
                "type": "string",
                "description": "数据集的名称"
            },
            "chart_type": {
                "type": "string",
                "description": "图表类型 (bar, line, scatter, histogram, boxplot)"
            },
            "x_column": {
                "type": "string",
                "description": "X轴列名"
            },
            "y_column": {
                "type": "string",
                "description": "Y轴列名 (某些图表类型可选)"
            },
            "hue_column": {
                "type": "string",
                "description": "用于分组的列名 (可选)"
            },
            "title": {
                "type": "string",
                "description": "图表标题 (可选)"
            }
        },
        "required": ["dataset_name", "chart_type", "x_column"]
    },
    handler=create_visualization
)
```

### 用户体验

用户可以请求：
1. "加载我的sales_data.csv数据并命名为'销售数据'"
2. "生成一个销售数据中月份与销售额的条形图"
3. "创建一个按地区分组的销售表现散点图"

AI会调用相应的MCP函数处理数据并生成可视化图表，然后将图表直接显示给用户。

## 3. AI辅助代码审查和优化

### 场景描述

构建一个能够分析Python代码、识别问题并提供优化建议的系统。

### MCP实现

```python
import ast
import astunparse
import pylint.lint
from pylint.reporters.text import TextReporter
import io
import re
import time
from typing import List, Dict, Any

class CodeAnalysisReporter(TextReporter):
    def __init__(self):
        self.content = []
        super().__init__(io.StringIO())
    
    def handle_message(self, msg):
        self.content.append({
            'line': msg.line,
            'column': msg.column,
            'type': msg.category,
            'symbol': msg.symbol,
            'message': msg.msg
        })

async def analyze_code(code: str) -> dict:
    """
    分析Python代码并识别问题
    
    Args:
        code: Python源代码
        
    Returns:
        包含分析结果的字典
    """
    try:
        # 确保代码可以被解析
        ast.parse(code)
        
        # 使用pylint分析代码
        reporter = CodeAnalysisReporter()
        pylint.lint.Run(
            ["--reports=n", "--score=n", "--persistent=n", "-"], 
            reporter=reporter, 
            exit=False,
            do_exit=False
        )
        
        # 获取分析结果
        issues = reporter.content
        
        # 按类型分组问题
        issues_by_type = {}
        for issue in issues:
            issue_type = issue['type']
            if issue_type not in issues_by_type:
                issues_by_type[issue_type] = []
            issues_by_type[issue_type].append(issue)
        
        return {
            "issue_count": len(issues),
            "issues_by_type": issues_by_type,
            "status": "success"
        }
    except SyntaxError as e:
        return {
            "error": f"语法错误: {str(e)}",
            "status": "failed"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "failed"
        }

async def optimize_code(code: str, target_aspects: List[str] = None) -> dict:
    """
    优化Python代码
    
    Args:
        code: Python源代码
        target_aspects: 要优化的方面 (performance, readability, pep8)
        
    Returns:
        包含优化结果的字典
    """
    if not target_aspects:
        target_aspects = ["performance", "readability", "pep8"]
    
    try:
        # 解析代码
        tree = ast.parse(code)
        
        # 应用优化
        optimized_code = code
        optimization_notes = []
        
        # 基于AST的优化
        class CodeOptimizer(ast.NodeTransformer):
            def __init__(self, aspects):
                self.aspects = aspects
                self.changes = []
                super().__init__()
            
            def visit_For(self, node):
                # 性能优化：将一些for循环转换为列表推导式
                if "performance" in self.aspects and isinstance(node.body, list) and len(node.body) == 1:
                    if isinstance(node.body[0], ast.Assign) and len(node.body[0].targets) == 1:
                        if isinstance(node.body[0].targets[0], ast.Subscript) and isinstance(node.body[0].targets[0].value, ast.Name):
                            target_name = node.body[0].targets[0].value.id
                            
                            # 检查是否在向列表添加元素
                            if isinstance(node.body[0].targets[0].slice, (ast.Index, ast.Slice)) and target_name != node.target.id:
                                self.changes.append("将for循环转换为列表推导式以提高性能")
                
                self.generic_visit(node)
                return node
        
        if "performance" in target_aspects or "readability" in target_aspects:
            optimizer = CodeOptimizer(target_aspects)
            optimizer.visit(tree)
            optimization_notes.extend(optimizer.changes)
        
        # PEP 8 格式化
        if "pep8" in target_aspects:
            # 修复空格和缩进
            optimized_code = re.sub(r'[ \t]+$', '', optimized_code, flags=re.MULTILINE)  # 删除行尾空格
            optimized_code = re.sub(r'\t', '    ', optimized_code)  # 将制表符替换为4个空格
            
            # 确保函数间有两个空行
            optimized_code = re.sub(r'\n{3,}', '\n\n\n', optimized_code)
            
            # 一致的引号使用
            single_quote_count = optimized_code.count("'")
            double_quote_count = optimized_code.count('"')
            
            if single_quote_count > double_quote_count:
                optimization_notes.append("统一使用单引号作为字符串定界符")
            elif double_quote_count > single_quote_count:
                optimization_notes.append("统一使用双引号作为字符串定界符")
            
            optimization_notes.append("应用PEP 8样式指南")
        
        # 如果没有优化，返回原始代码和注释
        if not optimization_notes:
            optimization_notes.append("代码已经很好，没有发现明显的优化机会")
        
        return {
            "original_code": code,
            "optimized_code": optimized_code,
            "optimization_notes": optimization_notes,
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "failed"
        }

async def benchmark_code(code: str, iterations: int = 100) -> dict:
    """
    对Python代码进行基准测试
    
    Args:
        code: Python源代码
        iterations: 执行迭代次数
        
    Returns:
        包含基准测试结果的字典
    """
    try:
        # 准备代码执行环境
        local_vars = {}
        global_vars = {}
        
        # 编译代码
        compiled_code = compile(code, '<string>', 'exec')
        
        # 执行一次确保代码有效
        exec(compiled_code, global_vars, local_vars)
        
        # 运行基准测试
        start_time = time.time()
        
        for _ in range(iterations):
            # 重新创建局部变量环境，以避免缓存效应
            local_vars = {}
            exec(compiled_code, global_vars, local_vars)
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / iterations
        
        return {
            "total_time": total_time,
            "average_time": avg_time,
            "iterations": iterations,
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "failed"
        }

# 注册这些函数到MCP服务器
mcp_server.register_function(
    name="analyze_code",
    description="分析Python代码并识别问题",
    parameters={
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "Python源代码"
            }
        },
        "required": ["code"]
    },
    handler=analyze_code
)

mcp_server.register_function(
    name="optimize_code",
    description="优化Python代码",
    parameters={
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "Python源代码"
            },
            "target_aspects": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "要优化的方面 (performance, readability, pep8)"
            }
        },
        "required": ["code"]
    },
    handler=optimize_code
)

mcp_server.register_function(
    name="benchmark_code",
    description="对Python代码进行基准测试",
    parameters={
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "Python源代码"
            },
            "iterations": {
                "type": "integer",
                "description": "执行迭代次数"
            }
        },
        "required": ["code"]
    },
    handler=benchmark_code
)
```

### 用户体验

用户可以：
1. "分析这段Python代码并找出潜在问题"
2. "优化这个函数以提高性能"
3. "帮我运行这段代码的基准测试"

AI会使用MCP函数分析代码、提供优化建议并生成优化后的代码。

## 总结

这些Python MCP应用案例展示了如何利用Python的强大生态系统扩展AI模型的能力：

1. **智能文档分析系统**：利用NLP和信息检索技术提取和分析文档内容
2. **实时数据可视化助手**：结合pandas和matplotlib创建交互式数据可视化
3. **AI辅助代码审查和优化**：使用AST和代码分析工具提供代码优化建议

通过Python实现MCP，您可以：

- 利用Python丰富的库生态系统
- 快速构建复杂的数据处理和分析功能
- 实现自然语言处理和机器学习集成
- 创建内容生成和多模态应用

这些案例只是开始，您可以根据特定需求进一步扩展和定制这些功能。 