---
sidebar_position: 7
---

# Python 服务器案例

本页面展示了使用Python实现MCP的实际应用案例，帮助您理解如何利用Python构建强大的AI功能扩展。

## 为什么选择Python实现MCP

Python凭借其简洁的语法和丰富的生态系统，是实现MCP服务器的理想选择：

- **简单易用**：Python的简洁语法让开发者能快速实现MCP功能
- **异步支持**：通过`asyncio`提供高效的异步处理能力
- **丰富的库**：从数据处理到机器学习，Python生态系统提供全方位支持
- **跨平台兼容**：可在各种操作系统上运行

## 1. 智能文档分析系统

### 场景描述

构建一个能够接收PDF文档、提取内容、分析关键信息并回答用户问题的MCP服务器。

### MCP服务器实现

```python
import os
import fitz  # PyMuPDF
from mcp import Server, Tool, Resource, BadRequestError, ToolError
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

# 创建MCP服务器
server = Server(
    name="document-analyzer",
    description="智能文档分析和问答服务",
    version="1.0.0"
)

# 加载NLP模型
try:
    nlp = spacy.load("zh_core_web_sm")
except OSError:
    print("下载中文NLP模型...")
    spacy.cli.download("zh_core_web_sm")
    nlp = spacy.load("zh_core_web_sm")

# 文档存储
documents = {}
os.makedirs("data/docs", exist_ok=True)

@server.tool
async def extract_text_from_pdf(file_path: str) -> dict:
    """
    从PDF文件中提取文本
    
    Args:
        file_path: PDF文件路径
        
    Returns:
        包含提取文本的字典
    """
    if not os.path.exists(file_path):
        raise BadRequestError(f"文件不存在: {file_path}")
        
    if not file_path.lower().endswith('.pdf'):
        raise BadRequestError("文件必须是PDF格式")
    
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
        
        # 保存文本到文件
        text_file = os.path.join("data/docs", f"{doc_id}.txt")
        with open(text_file, "w", encoding="utf-8") as f:
            f.write(text)
        
        return {
            "doc_id": doc_id,
            "page_count": len(doc),
            "text_length": len(text),
            "text_preview": text[:200] + "..." if len(text) > 200 else text,
            "saved_to": text_file,
            "status": "success"
        }
    except Exception as e:
        raise ToolError(f"处理PDF时出错: {str(e)}")

@server.tool
async def analyze_document(doc_id: str) -> dict:
    """
    分析文档，提取关键信息
    
    Args:
        doc_id: 文档ID
        
    Returns:
        包含分析结果的字典
    """
    if doc_id not in documents:
        raise BadRequestError(f"文档不存在: {doc_id}")
    
    doc = documents[doc_id]
    text = doc["text"]
    
    # 使用spaCy进行NLP分析
    nlp_doc = nlp(text[:100000])  # 限制处理长度以避免内存问题
    
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
    if len(sentences) > 1:
        vectorizer = TfidfVectorizer(max_features=5000)
        try:
            tfidf_matrix = vectorizer.fit_transform(sentences)
            sentence_scores = tfidf_matrix.sum(axis=1).A1
            
            # 获取前5个最重要的句子
            top_sentence_indices = sentence_scores.argsort()[-5:][::-1]
            key_sentences = [sentences[i] for i in top_sentence_indices]
        except:
            # 如果向量化失败，选择前5个句子
            key_sentences = sentences[:5]
    else:
        key_sentences = sentences
    
    # 更新文档处理状态
    doc["processed"] = True
    doc["entities"] = entities
    doc["key_sentences"] = key_sentences
    
    # 保存分析结果
    analysis_file = os.path.join("data/docs", f"{doc_id}_analysis.json")
    with open(analysis_file, "w", encoding="utf-8") as f:
        json.dump({
            "key_sentences": key_sentences,
            "entity_count": len(entities),
            "top_entities": entities[:20]  # 只保存前20个实体
        }, f, ensure_ascii=False, indent=2)
    
    return {
        "doc_id": doc_id,
        "entity_count": len(entities),
        "entity_preview": entities[:5],
        "key_sentences": key_sentences,
        "analysis_saved_to": analysis_file,
        "status": "success"
    }

@server.tool
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
        raise BadRequestError(f"文档不存在: {doc_id}")
    
    doc = documents[doc_id]
    
    if not doc["processed"]:
        # 如果文档尚未分析，先进行分析
        await analyze_document(doc_id)
    
    text = doc["text"]
    
    # 将文档分成段落
    paragraphs = text.split("\n\n")
    paragraphs = [p for p in paragraphs if len(p.strip()) > 0]
    
    if len(paragraphs) == 0:
        return {
            "answer": "文档没有有效内容，无法回答问题。",
            "relevance_score": 0.0
        }
    
    # 使用TF-IDF计算问题和段落的相似度
    all_texts = [question] + paragraphs
    vectorizer = TfidfVectorizer()
    try:
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
        relevance_scores = [float(similarities[i]) for i in top_paragraph_indices]
        
        # 构建回答
        context = "\n\n".join(relevant_paragraphs)
        
        return {
            "answer": f"根据文档内容，以下信息与您的问题最相关：\n\n{context}",
            "relevance_score": relevance_scores[0],
            "context_paragraphs": relevant_paragraphs,
            "status": "success"
        }
    except:
        # 如果向量化失败，返回文档前3个段落
        return {
            "answer": f"无法计算相关性，这里是文档的开头内容：\n\n{''.join(paragraphs[:3])}",
            "relevance_score": 0.0,
            "status": "partial_success" 
        }

@server.resource(path="/documents")
async def documents_resource():
    """可用文档列表"""
    doc_list = []
    for doc_id, doc_info in documents.items():
        doc_list.append({
            "id": doc_id,
            "path": doc_info["file_path"],
            "processed": doc_info["processed"],
            "text_length": len(doc_info["text"])
        })
    return doc_list

@server.prompt
def document_question():
    """提示用户询问文档问题"""
    return """
    我想询问关于一份文档的问题：
    文档ID：[文档的ID，通常是文件名]
    
    我的问题是：[在此输入您的问题]
    
    请基于文档内容回答我的问题，并引用相关的原文作为依据。
    """

if __name__ == "__main__":
    server.run()
```

### 使用体验

用户可以上传PDF文档，然后提问如：
1. "这份合同的主要条款是什么？"
2. "这篇论文的研究方法有哪些？"
3. "这份报告中的关键发现是什么？"

MCP服务器会分析文档，找出与问题最相关的内容，并给出回答。

### 与Claude Desktop集成

```json
{
  "mcpServers": {
    "docAnalyzer": {
      "command": "python",
      "args": ["path/to/document_analyzer.py"],
      "env": {}
    }
  }
}
```

## 2. 实时数据可视化助手

### 场景描述

创建一个能够加载数据、生成数据可视化并实时返回给用户的MCP服务器。

### MCP服务器实现

```python
import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from mcp import Server, Tool, Resource, BadRequestError
import json
from typing import Optional, List

# 创建MCP服务器
server = Server(
    name="data-visualizer",
    description="数据可视化和分析服务",
    version="1.0.0"
)

# 临时数据存储
datasets = {}
os.makedirs("data/visualizations", exist_ok=True)

@server.tool
async def load_csv_data(file_path: str, dataset_name: str) -> dict:
    """
    加载CSV数据
    
    Args:
        file_path: CSV文件路径
        dataset_name: 数据集名称
        
    Returns:
        包含数据集信息的字典
    """
    if not os.path.exists(file_path):
        raise BadRequestError(f"文件不存在: {file_path}")
        
    if not file_path.lower().endswith('.csv'):
        raise BadRequestError("文件必须是CSV格式")
    
    try:
        df = pd.read_csv(file_path)
        
        # 存储数据集
        datasets[dataset_name] = df
        
        # 数据集描述
        summary = {
            "dataset_name": dataset_name,
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": df.columns.tolist(),
            "column_types": {col: str(df[col].dtype) for col in df.columns},
            "status": "success"
        }
        
        # 保存数据集信息
        info_file = os.path.join("data/visualizations", f"{dataset_name}_info.json")
        with open(info_file, "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        return summary
    except Exception as e:
        raise BadRequestError(f"加载CSV数据时出错: {str(e)}")

@server.tool
async def get_data_summary(dataset_name: str) -> dict:
    """
    获取数据摘要
    
    Args:
        dataset_name: 数据集名称
        
    Returns:
        包含数据摘要的字典
    """
    if dataset_name not in datasets:
        raise BadRequestError(f"数据集不存在: {dataset_name}")
    
    df = datasets[dataset_name]
    
    # 计算数值列的统计摘要
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    if numeric_cols:
        numeric_summary = df[numeric_cols].describe().to_dict()
    else:
        numeric_summary = {}
    
    # 计算分类列的唯一值计数
    categorical_cols = df.select_dtypes(exclude=['number']).columns.tolist()
    categorical_summary = {}
    
    for col in categorical_cols[:5]:  # 只处理前5个分类列以避免过大
        value_counts = df[col].value_counts().head(10).to_dict()  # 只包含前10个值
        categorical_summary[col] = value_counts
    
    summary = {
        "dataset_name": dataset_name,
        "numeric_summary": numeric_summary,
        "categorical_summary": categorical_summary,
        "missing_values": df.isnull().sum().to_dict(),
        "status": "success"
    }
    
    # 保存摘要
    summary_file = os.path.join("data/visualizations", f"{dataset_name}_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    return summary

@server.tool
async def create_visualization(
    dataset_name: str,
    chart_type: str,
    x_column: str,
    y_column: Optional[str] = None,
    hue_column: Optional[str] = None,
    title: Optional[str] = None,
    file_name: Optional[str] = None
) -> dict:
    """
    创建数据可视化
    
    Args:
        dataset_name: 数据集名称
        chart_type: 图表类型 (bar, line, scatter, histogram, boxplot, heatmap, pie)
        x_column: X轴列名
        y_column: Y轴列名 (某些图表类型可选)
        hue_column: 用于分组的列名 (可选)
        title: 图表标题 (可选)
        file_name: 输出文件名 (可选)
        
    Returns:
        包含可视化图像的字典
    """
    if dataset_name not in datasets:
        raise BadRequestError(f"数据集不存在: {dataset_name}")
    
    df = datasets[dataset_name]
    
    if x_column not in df.columns:
        raise BadRequestError(f"列 '{x_column}' 不存在")
    
    if y_column and y_column not in df.columns:
        raise BadRequestError(f"列 '{y_column}' 不存在")
    
    if hue_column and hue_column not in df.columns:
        raise BadRequestError(f"列 '{hue_column}' 不存在")
    
    # 设置中文字体支持
    plt.rcParams['font.sans-serif'] = ['SimHei']  # 用来正常显示中文标签
    plt.rcParams['axes.unicode_minus'] = False    # 用来正常显示负号
    
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
                raise BadRequestError("line图表需要y_column")
            ax = sns.lineplot(x=x_column, y=y_column, hue=hue_column, data=df)
            
        elif chart_type == "scatter":
            if not y_column:
                raise BadRequestError("scatter图表需要y_column")
            ax = sns.scatterplot(x=x_column, y=y_column, hue=hue_column, data=df)
            
        elif chart_type == "histogram":
            ax = sns.histplot(data=df, x=x_column, hue=hue_column)
            
        elif chart_type == "boxplot":
            if y_column:
                ax = sns.boxplot(x=x_column, y=y_column, hue=hue_column, data=df)
            else:
                ax = sns.boxplot(x=x_column, data=df)
                
        elif chart_type == "heatmap":
            if not y_column:
                raise BadRequestError("heatmap图表需要y_column")
            # 将数据透视为矩阵
            pivot_data = df.pivot_table(index=x_column, columns=y_column, aggfunc='size', fill_value=0)
            ax = sns.heatmap(pivot_data, annot=True, cmap="YlGnBu")
            
        elif chart_type == "pie":
            if not y_column:
                # 使用计数作为值
                counts = df[x_column].value_counts()
                plt.pie(counts.values, labels=counts.index, autopct='%1.1f%%')
            else:
                # 根据y_column进行聚合
                grouped = df.groupby(x_column)[y_column].sum()
                plt.pie(grouped.values, labels=grouped.index, autopct='%1.1f%%')
            ax = plt.gca()
            
        else:
            raise BadRequestError(f"不支持的图表类型: {chart_type}")
        
        # 设置标题
        if title:
            plt.title(title)
        else:
            plt.title(f"{chart_type.capitalize()} of {x_column}" + (f" vs {y_column}" if y_column else ""))
        
        # 处理长标签
        if hasattr(ax, 'set_xticklabels'):
            ax.set_xticklabels(ax.get_xticklabels(), rotation=45, ha='right')
        
        # 调整布局
        plt.tight_layout()
        
        # 保存图表
        if not file_name:
            file_name = f"{dataset_name}_{chart_type}_{x_column}" + (f"_{y_column}" if y_column else "") + ".png"
        
        file_path = os.path.join("data/visualizations", file_name)
        plt.savefig(file_path, dpi=300)
        
        # 将图表转换为base64编码的图像
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close()
        
        return {
            "image": f"data:image/png;base64,{image_base64}",
            "chart_type": chart_type,
            "dataset": dataset_name,
            "title": title,
            "file_path": file_path,
            "status": "success"
        }
    except Exception as e:
        plt.close()
        raise BadRequestError(f"创建可视化时出错: {str(e)}")

@server.resource(path="/datasets")
async def datasets_resource():
    """可用数据集列表"""
    dataset_list = []
    for name, df in datasets.items():
        dataset_list.append({
            "name": name,
            "rows": len(df),
            "columns": df.columns.tolist()
        })
    return dataset_list

@server.prompt
def data_visualization_request():
    """提示用户请求数据可视化"""
    return """
    我想基于以下数据集创建可视化：
    数据集名称：[已加载的数据集名称]
    
    我需要的图表类型是：[bar/line/scatter/histogram/boxplot/heatmap/pie]
    
    请使用以下列进行可视化：
    X轴列名：[X轴使用的列]
    Y轴列名：[Y轴使用的列，某些图表类型可选]
    分组列名：[用于分组的列，可选]
    
    图表标题：[图表标题，可选]
    
    请生成可视化并解释图表显示的主要趋势或模式。
    """

if __name__ == "__main__":
    server.run()
```

### 使用体验

用户可以请求：
1. "加载我的sales_data.csv数据并命名为'销售数据'"
2. "生成一个销售数据中月份与销售额的条形图"
3. "创建一个按地区分组的销售表现散点图"

MCP服务器会处理数据并生成可视化图表，用户可以直接查看图像结果和分析。

### 与Claude Desktop集成

```json
{
  "mcpServers": {
    "dataVisualizer": {
      "command": "python",
      "args": ["path/to/data_visualizer.py"],
      "env": {}
    }
  }
}
```

## 3. AI辅助代码审查助手

### 场景描述

构建一个能够分析Python代码、识别问题、提供优化建议并执行基准测试的MCP服务器。

### MCP服务器实现

```python
import ast
import tempfile
import os
import sys
import time
import re
import subprocess
import io
import contextlib
from mcp import Server, Tool, Resource, BadRequestError
import json

# 创建MCP服务器
server = Server(
    name="code-reviewer",
    description="Python代码审查和优化助手",
    version="1.0.0"
)

# 代码存储
code_storage = {}
os.makedirs("data/code", exist_ok=True)

@server.tool
async def analyze_code(code: str, code_id: str = None) -> dict:
    """
    分析Python代码并识别问题
    
    Args:
        code: Python源代码
        code_id: 可选的代码标识符
        
    Returns:
        包含分析结果的字典
    """
    if not code.strip():
        raise BadRequestError("代码不能为空")
    
    # 如果没有提供代码ID，生成一个随机ID
    if not code_id:
        code_id = f"code_{int(time.time())}"
    
    # 存储代码
    code_storage[code_id] = code
    code_file = os.path.join("data/code", f"{code_id}.py")
    with open(code_file, "w", encoding="utf-8") as f:
        f.write(code)
    
    results = {
        "code_id": code_id,
        "issues": [],
        "suggestions": [],
        "complexity": {}
    }
    
    # 1. 语法检查
    try:
        ast.parse(code)
        results["syntax_valid"] = True
    except SyntaxError as e:
        results["syntax_valid"] = False
        results["issues"].append({
            "type": "syntax_error",
            "message": str(e),
            "line": e.lineno,
            "offset": e.offset
        })
        # 如果语法错误，返回初步结果
        return results
    
    # 2. 使用pylint进行代码分析
    try:
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.py', delete=False) as temp:
            temp.write(code)
            temp_path = temp.name
        
        # 运行pylint
        cmd = [sys.executable, "-m", "pylint", "--output-format=json", temp_path]
        process = subprocess.run(cmd, capture_output=True, text=True)
        os.unlink(temp_path)
        
        if process.stdout:
            try:
                pylint_issues = json.loads(process.stdout)
                for issue in pylint_issues:
                    results["issues"].append({
                        "type": "pylint",
                        "code": issue.get("symbol", ""),
                        "message": issue.get("message", ""),
                        "line": issue.get("line", 0)
                    })
            except json.JSONDecodeError:
                # 如果无法解析JSON，记录原始输出
                results["pylint_raw_output"] = process.stdout
    except Exception as e:
        results["issues"].append({
            "type": "tool_error",
            "message": f"Pylint运行错误: {str(e)}"
        })
    
    # 3. 检查代码复杂度
    try:
        tree = ast.parse(code)
        class ComplexityVisitor(ast.NodeVisitor):
            def __init__(self):
                self.function_count = 0
                self.class_count = 0
                self.max_nesting = 0
                self.current_nesting = 0
                self.imports = []
                
            def visit_FunctionDef(self, node):
                self.function_count += 1
                # 分析函数参数
                self.generic_visit(node)
                
            def visit_ClassDef(self, node):
                self.class_count += 1
                self.generic_visit(node)
                
            def visit_For(self, node):
                self.current_nesting += 1
                self.max_nesting = max(self.max_nesting, self.current_nesting)
                self.generic_visit(node)
                self.current_nesting -= 1
                
            def visit_While(self, node):
                self.current_nesting += 1
                self.max_nesting = max(self.max_nesting, self.current_nesting)
                self.generic_visit(node)
                self.current_nesting -= 1
                
            def visit_If(self, node):
                self.current_nesting += 1
                self.max_nesting = max(self.max_nesting, self.current_nesting)
                self.generic_visit(node)
                self.current_nesting -= 1
                
            def visit_Import(self, node):
                for name in node.names:
                    self.imports.append(name.name)
                self.generic_visit(node)
                
            def visit_ImportFrom(self, node):
                if node.module:
                    for name in node.names:
                        self.imports.append(f"{node.module}.{name.name}")
                self.generic_visit(node)
                
        visitor = ComplexityVisitor()
        visitor.visit(tree)
        
        results["complexity"] = {
            "function_count": visitor.function_count,
            "class_count": visitor.class_count,
            "max_nesting_level": visitor.max_nesting,
            "imports": visitor.imports
        }
        
        # 添加基于复杂度的建议
        if visitor.max_nesting > 3:
            results["suggestions"].append({
                "type": "complexity",
                "message": "嵌套层次过深，考虑重构以减少嵌套"
            })
    except Exception as e:
        results["issues"].append({
            "type": "complexity_error",
            "message": f"复杂度分析错误: {str(e)}"
        })
    
    # 4. 检查常见的Python反模式
    pattern_checks = [
        (r"except\s*:", "避免使用裸异常(except:)，应该指定具体的异常类型"),
        (r"import\s+\*", "避免使用'import *'，应该明确导入需要的模块"),
        (r"print\s*\(", "生产代码应考虑使用日志模块而非print语句"),
        (r"exec\s*\(", "慎用exec()，可能存在安全风险"),
        (r"eval\s*\(", "慎用eval()，可能存在安全风险"),
        (r"global\s+", "减少使用全局变量，可能导致代码难以维护")
    ]
    
    for pattern, message in pattern_checks:
        if re.search(pattern, code):
            results["suggestions"].append({
                "type": "anti_pattern",
                "message": message
            })
    
    # 保存分析结果
    analysis_file = os.path.join("data/code", f"{code_id}_analysis.json")
    with open(analysis_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    
    return results

@server.tool
async def optimize_code(code_id: str, target_aspects: list = None) -> dict:
    """
    优化Python代码
    
    Args:
        code_id: 代码标识符
        target_aspects: 要优化的方面 (performance, readability, pep8)
        
    Returns:
        包含优化结果的字典
    """
    if code_id not in code_storage:
        raise BadRequestError(f"代码不存在: {code_id}")
    
    code = code_storage[code_id]
    
    if not target_aspects:
        target_aspects = ["performance", "readability", "pep8"]
    
    valid_aspects = ["performance", "readability", "pep8"]
    for aspect in target_aspects:
        if aspect not in valid_aspects:
            raise BadRequestError(f"无效的优化方面: {aspect}，有效值为: {valid_aspects}")
    
    optimization_notes = []
    optimized_code = code
    
    # PEP 8 格式化
    if "pep8" in target_aspects:
        try:
            import autopep8
            optimized_code = autopep8.fix_code(code)
            optimization_notes.append("应用PEP 8样式优化")
        except ImportError:
            try:
                # 使用black作为备选
                with tempfile.NamedTemporaryFile(mode='w+', suffix='.py', delete=False) as temp:
                    temp.write(code)
                    temp_path = temp.name
                
                cmd = [sys.executable, "-m", "black", "-q", temp_path]
                subprocess.run(cmd)
                
                with open(temp_path, 'r') as f:
                    optimized_code = f.read()
                
                os.unlink(temp_path)
                optimization_notes.append("使用black格式化代码")
            except Exception as e:
                optimization_notes.append(f"PEP 8格式化失败: {str(e)}")
    
    # 性能优化建议
    if "performance" in target_aspects:
        # 检查常见的性能问题
        perf_patterns = [
            (r"for\s+\w+\s+in\s+range\(\w+\):\s*\n\s*\w+\.append", 
             "考虑使用列表推导式代替for循环中的append操作"),
            (r"\.index\(.*\).*\.index\(", 
             "重复使用索引查找效率低，考虑使用字典或集合"),
            (r"for\s+\w+\s+in\s+\w+\s*:.*\s+if\s+\w+\s+in\s+\w+", 
             "在循环中使用'in'检查效率低，考虑先转换为集合"),
            (r"import\s+pandas", 
             "注意pandas操作中使用向量化操作(如.loc, .apply)，避免显式循环"),
            (r"\.join\(\[.*for", 
             "对于字符串连接，使用''.join()比+运算符效率更高")
        ]
        
        for pattern, suggestion in perf_patterns:
            if re.search(pattern, code):
                optimization_notes.append(suggestion)
    
    # 可读性优化
    if "readability" in target_aspects:
        # 分析函数和变量名
        try:
            tree = ast.parse(code)
            
            class NameVisitor(ast.NodeVisitor):
                def __init__(self):
                    self.short_names = []
                    self.long_functions = []
                    
                def visit_FunctionDef(self, node):
                    # 检查函数名长度
                    if len(node.name) <= 1:
                        self.short_names.append(f"函数名 '{node.name}' 过短")
                    
                    # 检查函数体长度
                    if len(node.body) > 30:
                        self.long_functions.append(f"函数 '{node.name}' 过长，有 {len(node.body)} 个语句")
                    
                    self.generic_visit(node)
                    
                def visit_Name(self, node):
                    # 检查变量名长度，忽略一些常用的短名称如i, j, k等
                    if len(node.id) == 1 and node.id not in ['i', 'j', 'k', 'x', 'y', 'z']:
                        self.short_names.append(f"变量名 '{node.id}' 过短")
                    
                    self.generic_visit(node)
            
            visitor = NameVisitor()
            visitor.visit(tree)
            
            for short_name in visitor.short_names[:5]:  # 限制数量
                optimization_notes.append(f"可读性: {short_name}")
            
            for long_function in visitor.long_functions:
                optimization_notes.append(f"可读性: {long_function}，考虑拆分为更小的函数")
            
        except Exception as e:
            optimization_notes.append(f"可读性分析错误: {str(e)}")
    
    # 如果没有具体的优化建议，添加一个通用注释
    if not optimization_notes:
        optimization_notes.append("代码质量良好，没有发现明显的优化机会")
    
    # 保存优化结果
    optimized_file = os.path.join("data/code", f"{code_id}_optimized.py")
    with open(optimized_file, "w", encoding="utf-8") as f:
        f.write(optimized_code)
    
    return {
        "original_code": code,
        "optimized_code": optimized_code,
        "optimization_notes": optimization_notes,
        "optimized_file": optimized_file,
        "status": "success"
    }

@server.tool
async def benchmark_code(code_id: str, iterations: int = 100) -> dict:
    """
    对Python代码进行基准测试
    
    Args:
        code_id: 代码标识符
        iterations: 执行迭代次数
        
    Returns:
        包含基准测试结果的字典
    """
    if code_id not in code_storage:
        raise BadRequestError(f"代码不存在: {code_id}")
    
    code = code_storage[code_id]
    
    if iterations < 1:
        raise BadRequestError("迭代次数必须大于0")
    
    if iterations > 1000:
        raise BadRequestError("迭代次数过大，最大为1000")
    
    # 将代码写入临时文件
    with tempfile.NamedTemporaryFile(mode='w+', suffix='.py', delete=False) as temp:
        temp.write(code)
        temp_path = temp.name
    
    benchmark_results = {}
    
    try:
        # 1. 使用timeit进行简单性能测试
        cmd = [sys.executable, "-m", "timeit", "-n", str(iterations), f"import {os.path.splitext(os.path.basename(temp_path))[0]}"]
        process = subprocess.run(cmd, capture_output=True, text=True, cwd=os.path.dirname(temp_path))
        
        if process.stdout:
            benchmark_results["timeit"] = process.stdout.strip()
        else:
            benchmark_results["timeit_error"] = process.stderr.strip()
        
        # 2. 使用内置的time模块进行详细计时
        start_time = time.time()
        
        # 重定向stdout以防止代码输出污染结果
        original_stdout = sys.stdout
        sys.stdout = io.StringIO()
        
        try:
            # 尝试编译和加载代码
            compiled_code = compile(code, "<string>", "exec")
            global_vars = {}
            local_vars = {}
            
            for _ in range(iterations):
                exec(compiled_code, global_vars, local_vars)
                
            elapsed_time = time.time() - start_time
            benchmark_results["total_time"] = elapsed_time
            benchmark_results["average_time"] = elapsed_time / iterations
            benchmark_results["iterations"] = iterations
        finally:
            # 恢复stdout
            sys.stdout = original_stdout
    
    except Exception as e:
        benchmark_results["error"] = str(e)
    
    finally:
        # 清理临时文件
        try:
            os.unlink(temp_path)
        except:
            pass
    
    # 保存基准测试结果
    benchmark_file = os.path.join("data/code", f"{code_id}_benchmark.json")
    with open(benchmark_file, "w", encoding="utf-8") as f:
        json.dump(benchmark_results, f, indent=2)
    
    return {
        "code_id": code_id,
        "results": benchmark_results,
        "status": "success" if "error" not in benchmark_results else "failed"
    }

@server.resource(path="/code")
async def code_resource():
    """已存储的代码列表"""
    code_list = []
    for code_id, code in code_storage.items():
        code_list.append({
            "id": code_id,
            "size": len(code),
            "preview": code[:100] + "..." if len(code) > 100 else code
        })
    return code_list

@server.prompt
def code_review_request():
    """提示用户请求代码审查"""
    return """
    我想请你帮我审查以下Python代码：
    
    ```python
    [在此粘贴您的Python代码]
    ```
    
    请帮我：
    1. 分析代码中可能存在的问题和缺陷
    2. 提供代码优化建议，包括性能和可读性方面
    3. 检查是否符合PEP 8编码规范
    4. 如果可能，提供优化后的代码版本
    
    我特别关注：[可以提到特定关注点，如性能、安全性、可维护性等]
    """

if __name__ == "__main__":
    server.run()
```

### 使用体验

用户可以：
1. "分析这段Python代码并找出潜在问题"
2. "优化这个函数以提高性能和可读性"
3. "帮我运行这段代码的基准测试"

MCP服务器会分析代码、提供优化建议并生成优化后的代码。

### 与Claude Desktop集成

```json
{
  "mcpServers": {
    "codeReviewer": {
      "command": "python",
      "args": ["path/to/code_reviewer.py"],
      "env": {}
    }
  }
}
```

## 代码审查助手

### 应用场景

在软件开发团队中，代码审查是确保代码质量的重要环节，但常常耗时且需要经验丰富的开发者参与。这个MCP服务器实现了一个代码审查助手，可以：

1. 接收代码文件或代码片段
2. 分析代码结构、潜在bug、性能问题和安全漏洞
3. 提供改进建议和最佳实践指导
4. 根据团队特定的编码规范进行评估

### 服务器实现

```python
import asyncio
import json
import os
import tempfile
import re
from typing import List, Dict, Any, Optional

# 导入MCP库和工具库
from mcp import MCPServer, Resource, PromptTemplate, BadRequestError, ToolError
import pylint.lint
from pylint.reporters.json_reporter import JSONReporter
import bandit
from bandit.core import manager as bandit_manager
import radon.complexity as complexity_analyzer
import radon.metrics as metrics

# 创建MCP服务器实例
server = MCPServer(
    name="code-reviewer",
    description="代码审查助手 - 分析代码质量并提供改进建议",
    version="1.0.0"
)

# 创建临时目录用于存储上传的代码文件
code_dir = os.path.join(tempfile.gettempdir(), "mcp_code_review")
os.makedirs(code_dir, exist_ok=True)

# 存储上传的代码文件信息
code_files = {}

@server.tool("upload_code")
async def upload_code(file_name: str, content: str, language: str = "python") -> Dict[str, Any]:
    """
    上传代码文件或代码片段进行审查
    
    Args:
        file_name: 代码文件名称
        content: 代码内容
        language: 编程语言，默认为python
        
    Returns:
        包含文件ID和基本信息的字典
    """
    # 验证输入
    if not file_name or not content:
        raise BadRequestError("文件名和代码内容不能为空")
    
    # 支持的语言列表
    supported_languages = ["python", "javascript", "typescript", "java", "c", "cpp"]
    if language.lower() not in supported_languages:
        raise BadRequestError(f"不支持的语言: {language}。支持的语言有: {', '.join(supported_languages)}")
    
    # 创建唯一ID
    file_id = f"{len(code_files) + 1}_{file_name}"
    file_path = os.path.join(code_dir, file_id)
    
    # 保存代码到文件
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    # 记录文件信息
    code_files[file_id] = {
        "file_name": file_name,
        "language": language,
        "path": file_path,
        "size": len(content),
        "lines": content.count("\n") + 1
    }
    
    return {
        "file_id": file_id,
        "file_name": file_name,
        "language": language,
        "size_bytes": len(content),
        "line_count": content.count("\n") + 1,
        "status": "已上传，准备审查"
    }

@server.tool("lint_code")
async def lint_code(file_id: str) -> Dict[str, Any]:
    """
    使用静态代码分析工具检查代码质量
    
    Args:
        file_id: 代码文件ID
        
    Returns:
        代码质量分析结果
    """
    # 检查文件ID是否有效
    if file_id not in code_files:
        raise BadRequestError(f"找不到ID为 {file_id} 的代码文件")
    
    file_info = code_files[file_id]
    file_path = file_info["path"]
    language = file_info["language"]
    
    results = {
        "file_id": file_id,
        "file_name": file_info["file_name"],
        "issues": []
    }
    
    try:
        # 针对Python代码使用pylint进行代码质量检查
        if language.lower() == "python":
            # 创建临时文件保存pylint结果
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_path = temp_file.name
            
            # 运行pylint分析
            reporter = JSONReporter()
            pylint.lint.Run(
                [file_path, f"--output={temp_path}", "--reports=n"], 
                reporter=reporter, 
                exit=False
            )
            
            # 读取结果
            with open(temp_path, "r") as f:
                pylint_results = json.load(f)
            
            # 清理临时文件
            os.unlink(temp_path)
            
            # 处理pylint结果
            for issue in pylint_results:
                results["issues"].append({
                    "line": issue.get("line", 0),
                    "column": issue.get("column", 0),
                    "type": issue.get("type", "undefined"),
                    "message": issue.get("message", ""),
                    "symbol": issue.get("symbol", ""),
                    "severity": issue.get("type", "undefined")
                })
        else:
            # 对于其他语言，提供一个占位符消息
            results["issues"].append({
                "line": 0,
                "column": 0,
                "type": "info",
                "message": f"目前不支持对 {language} 语言进行详细的lint分析",
                "severity": "info"
            })
        
        # 添加统计信息
        results["summary"] = {
            "total_issues": len(results["issues"]),
            "errors": len([i for i in results["issues"] if i.get("type") == "error"]),
            "warnings": len([i for i in results["issues"] if i.get("type") == "warning"]),
            "conventions": len([i for i in results["issues"] if i.get("type") == "convention"])
        }
        
        return results
        
    except Exception as e:
        raise ToolError(f"代码lint分析失败: {str(e)}")

@server.tool("analyze_security")
async def analyze_security(file_id: str) -> Dict[str, Any]:
    """
    使用Bandit工具分析Python代码中的安全漏洞
    
    Args:
        file_id: 代码文件ID
        
    Returns:
        安全漏洞分析结果
    """
    # 检查文件ID是否有效
    if file_id not in code_files:
        raise BadRequestError(f"找不到ID为 {file_id} 的代码文件")
    
    file_info = code_files[file_id]
    file_path = file_info["path"]
    language = file_info["language"]
    
    # 仅支持Python代码的安全分析
    if language.lower() != "python":
        return {
            "file_id": file_id,
            "file_name": file_info["file_name"],
            "message": f"目前安全分析仅支持Python代码，不支持{language}",
            "vulnerabilities": []
        }
    
    try:
        # 运行Bandit安全分析
        b_mgr = bandit_manager.BanditManager()
        b_mgr.discover_files([file_path])
        b_mgr.run_tests()
        
        # 处理结果
        vulnerabilities = []
        for issue in b_mgr.get_issue_list():
            vulnerabilities.append({
                "severity": issue.severity,
                "confidence": issue.confidence,
                "line": issue.lineno,
                "test_id": issue.test_id,
                "message": issue.text,
                "code": issue.get_code().strip() if issue.get_code() else ""
            })
        
        # 返回安全分析结果
        return {
            "file_id": file_id,
            "file_name": file_info["file_name"],
            "vulnerabilities": vulnerabilities,
            "summary": {
                "total_vulnerabilities": len(vulnerabilities),
                "high_severity": len([v for v in vulnerabilities if v["severity"] == "HIGH"]),
                "medium_severity": len([v for v in vulnerabilities if v["severity"] == "MEDIUM"]),
                "low_severity": len([v for v in vulnerabilities if v["severity"] == "LOW"])
            }
        }
        
    except Exception as e:
        raise ToolError(f"安全分析失败: {str(e)}")

@server.tool("analyze_complexity")
async def analyze_complexity(file_id: str) -> Dict[str, Any]:
    """
    分析代码复杂度和可维护性
    
    Args:
        file_id: 代码文件ID
        
    Returns:
        代码复杂度和可维护性分析结果
    """
    # 检查文件ID是否有效
    if file_id not in code_files:
        raise BadRequestError(f"找不到ID为 {file_id} 的代码文件")
    
    file_info = code_files[file_id]
    file_path = file_info["path"]
    language = file_info["language"]
    
    # 仅支持Python代码的复杂度分析
    if language.lower() != "python":
        return {
            "file_id": file_id,
            "file_name": file_info["file_name"],
            "message": f"目前复杂度分析仅支持Python代码，不支持{language}",
            "complexity_results": []
        }
    
    try:
        # 读取代码文件
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
        
        # 分析代码复杂度
        cc_results = complexity_analyzer.cc_visit(code)
        mi_result = metrics.mi_visit(code, True)
        
        # 构建结果
        complexity_results = []
        for function_name, cc_result in cc_results:
            complexity_results.append({
                "function_name": function_name,
                "line_number": cc_result.lineno,
                "complexity": cc_result.complexity,
                "rank": complexity_analyzer.rank(cc_result.complexity)
            })
        
        # 解释复杂度等级
        rank_explanation = {
            "A": "低复杂度 - 非常好",
            "B": "低/中复杂度 - 良好",
            "C": "中复杂度 - 略微复杂，可接受",
            "D": "高/中复杂度 - 需要关注",
            "E": "高复杂度 - 需要重构",
            "F": "极高复杂度 - 紧急需要重构"
        }
        
        # 解释可维护性指数
        mi_grade = "A"
        if mi_result < 20: mi_grade = "F"
        elif mi_result < 40: mi_grade = "E"
        elif mi_result < 60: mi_grade = "D"
        elif mi_result < 80: mi_grade = "C"
        elif mi_result < 90: mi_grade = "B"
        
        return {
            "file_id": file_id,
            "file_name": file_info["file_name"],
            "complexity_results": complexity_results,
            "maintainability_index": mi_result,
            "maintainability_grade": mi_grade,
            "summary": {
                "average_complexity": sum(r["complexity"] for r in complexity_results) / len(complexity_results) if complexity_results else 0,
                "max_complexity": max(r["complexity"] for r in complexity_results) if complexity_results else 0,
                "function_count": len(complexity_results),
                "complex_functions": len([r for r in complexity_results if r["rank"] in ["D", "E", "F"]]),
                "rank_explanation": rank_explanation
            }
        }
        
    except Exception as e:
        raise ToolError(f"复杂度分析失败: {str(e)}")

@server.tool("generate_review_report")
async def generate_review_report(file_id: str) -> Dict[str, Any]:
    """
    生成综合代码审查报告，包括问题分析和改进建议
    
    Args:
        file_id: 代码文件ID
        
    Returns:
        综合代码审查报告
    """
    # 检查文件ID是否有效
    if file_id not in code_files:
        raise BadRequestError(f"找不到ID为 {file_id} 的代码文件")
    
    file_info = code_files[file_id]
    
    try:
        # 获取各项分析结果
        lint_results = await lint_code(file_id)
        
        # 对Python代码进行更深入的分析
        if file_info["language"].lower() == "python":
            security_results = await analyze_security(file_id)
            complexity_results = await analyze_complexity(file_id)
        else:
            security_results = {"vulnerabilities": [], "summary": {"total_vulnerabilities": 0}}
            complexity_results = {"complexity_results": [], "summary": {"average_complexity": 0}}
        
        # 读取代码内容
        with open(file_info["path"], 'r', encoding='utf-8') as f:
            code_content = f.read()
        
        # 生成改进建议
        improvement_suggestions = []
        
        # 基于lint结果的建议
        if lint_results["issues"]:
            common_issues = {}
            for issue in lint_results["issues"]:
                issue_type = issue.get("symbol", "未知问题")
                if issue_type not in common_issues:
                    common_issues[issue_type] = 0
                common_issues[issue_type] += 1
            
            # 添加最常见问题的建议
            for issue_type, count in sorted(common_issues.items(), key=lambda x: x[1], reverse=True)[:5]:
                suggestion = {
                    "issue_type": issue_type,
                    "count": count,
                    "recommendation": get_recommendation_for_issue(issue_type)
                }
                improvement_suggestions.append(suggestion)
        
        # 基于安全分析的建议
        if file_info["language"].lower() == "python" and security_results["vulnerabilities"]:
            for vuln in security_results["vulnerabilities"]:
                if vuln["severity"] in ["HIGH", "MEDIUM"]:
                    suggestion = {
                        "issue_type": f"安全漏洞: {vuln['test_id']}",
                        "severity": vuln["severity"],
                        "recommendation": f"修复安全问题: {vuln['message']}"
                    }
                    improvement_suggestions.append(suggestion)
        
        # 基于复杂度分析的建议
        if file_info["language"].lower() == "python" and complexity_results["complexity_results"]:
            complex_functions = [r for r in complexity_results["complexity_results"] if r["rank"] in ["D", "E", "F"]]
            if complex_functions:
                for func in complex_functions:
                    suggestion = {
                        "issue_type": f"复杂度过高的函数: {func['function_name']}",
                        "complexity": func["complexity"],
                        "rank": func["rank"],
                        "recommendation": f"重构函数 '{func['function_name']}' 以降低复杂度，可拆分为多个小函数或简化逻辑。"
                    }
                    improvement_suggestions.append(suggestion)
        
        # 生成整体代码质量评分 (0-100)
        lint_score = max(0, 100 - min(100, lint_results["summary"]["total_issues"] * 5))
        security_score = 100
        if file_info["language"].lower() == "python":
            security_score = max(0, 100 - security_results["summary"]["high_severity"] * 20 - security_results["summary"]["medium_severity"] * 10 - security_results["summary"]["low_severity"] * 5)
            
        complexity_score = 100
        if file_info["language"].lower() == "python" and complexity_results["complexity_results"]:
            # 根据复杂度评级计算得分
            rank_scores = {"A": 100, "B": 90, "C": 75, "D": 60, "E": 40, "F": 20}
            if "maintainability_grade" in complexity_results:
                complexity_score = rank_scores.get(complexity_results["maintainability_grade"], 70)
        
        # 计算综合得分，权重可调整
        overall_score = int(lint_score * 0.4 + security_score * 0.3 + complexity_score * 0.3)
        
        # 根据综合得分生成整体评价
        overall_rating = "优秀"
        if overall_score < 50:
            overall_rating = "不及格"
        elif overall_score < 70:
            overall_rating = "及格"
        elif overall_score < 85:
            overall_rating = "良好"
        
        # 生成最终报告
        report = {
            "file_id": file_id,
            "file_name": file_info["file_name"],
            "language": file_info["language"],
            "line_count": file_info["lines"],
            "scores": {
                "overall_score": overall_score,
                "lint_score": lint_score,
                "security_score": security_score if file_info["language"].lower() == "python" else "不适用",
                "complexity_score": complexity_score if file_info["language"].lower() == "python" else "不适用"
            },
            "overall_rating": overall_rating,
            "summary": {
                "total_issues": lint_results["summary"]["total_issues"],
                "security_vulnerabilities": security_results["summary"]["total_vulnerabilities"] if file_info["language"].lower() == "python" else "不适用",
                "complex_functions": complexity_results["summary"].get("complex_functions", 0) if file_info["language"].lower() == "python" else "不适用"
            },
            "improvement_suggestions": improvement_suggestions
        }
        
        return report
        
    except Exception as e:
        raise ToolError(f"生成审查报告失败: {str(e)}")

def get_recommendation_for_issue(issue_type: str) -> str:
    """为常见的代码问题提供改进建议"""
    recommendations = {
        "missing-docstring": "添加文档字符串以提高代码可读性和可维护性",
        "unused-import": "移除未使用的导入以保持代码整洁",
        "unused-variable": "移除未使用的变量或将变量名前加下划线(_unused_var)表示故意不使用",
        "too-many-arguments": "减少函数参数数量，考虑使用类或数据结构来组织相关参数",
        "too-many-locals": "减少本地变量数量，将部分逻辑拆分为子函数",
        "too-many-branches": "减少条件分支，考虑使用策略模式或字典映射替代多重if-else",
        "too-many-statements": "函数过长，拆分为多个小函数以提高可读性",
        "line-too-long": "缩短行长度，遵循PEP 8每行不超过79个字符的建议",
        "invalid-name": "按照命名规范重命名变量/函数/类 (蛇形命名法或驼峰命名法)",
        "trailing-whitespace": "删除行尾多余的空格",
        # 安全相关
        "hardcoded-password": "避免在代码中硬编码密码，使用环境变量或配置文件",
        "sql-injection": "使用参数化查询防止SQL注入攻击",
        # 复杂度相关
        "too-complex": "降低函数的复杂度，拆分复杂逻辑，减少嵌套"
    }
    
    # 尝试匹配完整的issue_type
    if issue_type in recommendations:
        return recommendations[issue_type]
    
    # 尝试部分匹配
    for key, value in recommendations.items():
        if key in issue_type:
            return value
    
    # 默认建议
    return "检查并修正此问题以提高代码质量"

# 创建代码审查资源
@server.resource("code-review")
async def code_review_resource() -> Dict[str, Any]:
    """提供代码审查功能的资源"""
    # 返回当前已上传的代码文件信息
    code_files_list = []
    for file_id, info in code_files.items():
        code_files_list.append({
            "file_id": file_id,
            "file_name": info["file_name"],
            "language": info["language"],
            "line_count": info["lines"],
            "size_bytes": info["size"]
        })
    
    return {
        "name": "code-review",
        "description": "代码审查助手 - 分析代码质量并提供改进建议",
        "tools": [
            "upload_code",
            "lint_code",
            "analyze_security",
            "analyze_complexity",
            "generate_review_report"
        ],
        "uploaded_files": code_files_list
    }

# 用户提示模板
@server.prompt_template("code-review")
def code_review_prompt() -> PromptTemplate:
    """代码审查助手的提示模板"""
    return PromptTemplate(
        name="代码审查助手",
        description="帮助用户分析代码质量并提供改进建议",
        content="""
        我是一个代码审查助手，可以帮助你分析代码质量并提供改进建议。
        
        你可以：
        1. 上传代码文件或代码片段进行审查
        2. 获取代码质量分析结果
        3. 了解代码中的安全漏洞
        4. 分析代码复杂度和可维护性
        5. 获取综合代码审查报告，包括问题分析和改进建议
        
        请上传你想要审查的代码文件，告诉我你想了解哪些方面的代码质量问题。
        """
    )

# 启动服务器
if __name__ == "__main__":
    asyncio.run(server.start(host="0.0.0.0", port=8080))
```

### 用户体验场景

使用代码审查助手，用户可以：

1. **上传代码**：用户可以将Python代码文件或代码片段上传到系统中
   ```
   > 请帮我审查这段Python代码
   
   import os
   import sqlite3
   
   def get_user_data(user_id, query):
       conn = sqlite3.connect('users.db')
       cursor = conn.cursor()
       cursor.execute(f"SELECT * FROM users WHERE id = {user_id} AND query = '{query}'")
       return cursor.fetchall()
   
   def process_file(filename):
       with open(filename, 'r') as f:
           data = f.read()
       return data
   ```

2. **获取全面的代码审查报告**：系统会生成一份全面的代码审查报告，包括：
   - 代码质量问题（如未使用的导入、缺少文档字符串等）
   - 安全漏洞（如SQL注入风险）
   - 代码复杂度和可维护性分析
   - 总体评分和改进建议

3. **针对具体问题获取详细的改进建议**：
   ```
   > 我想了解这段代码中的SQL注入问题
   
   在get_user_data函数中，你使用了字符串格式化(f-string)直接将用户输入插入到SQL查询中：
   
   cursor.execute(f"SELECT * FROM users WHERE id = {user_id} AND query = '{query}'")
   
   这存在严重的SQL注入风险。攻击者可以通过精心构造的输入来修改SQL查询的结构，例如：
   
   如果query参数值为: '; DROP TABLE users; --
   
   则最终执行的SQL将变为:
   
   SELECT * FROM users WHERE id = 1 AND query = ''; DROP TABLE users; --'
   
   建议修改为使用参数化查询:
   
   cursor.execute("SELECT * FROM users WHERE id = ? AND query = ?", (user_id, query))
   ```

### MCP集成示例

```json
{
  "name": "code-reviewer",
  "command": "python code_review_server.py",
  "description": "代码审查助手 - 分析代码质量并提供改进建议",
  "args": [],
  "env": {
    "PYTHONPATH": "${workspaceFolder}"
  }
}
```

## 知识库问答助手

### 场景描述

这是一个能够连接到多种知识库的智能问答服务器，支持加载Markdown文档、网页内容和自定义数据，并通过向量数据库实现高效的相似内容检索，为用户提供准确的问答服务。

### 实现代码

```python
import os
import json
import re
import requests
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import markdown
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from mcp_server import MCPServer, MCPResource, MCPTool

# 创建知识库问答服务器
server = MCPServer(
    name="knowledge-base-qa",
    description="一个连接多种知识库的智能问答系统，支持加载Markdown文档、网页内容和自定义数据。",
    version="1.0.0"
)

# 定义知识库存储结构
class KnowledgeBase:
    def __init__(self):
        self.documents = []  # 存储文档内容
        self.sources = []    # 存储文档来源
        self.vectorizer = TfidfVectorizer(
            min_df=1, stop_words='english')
        self.vectors = None  # 存储向量化后的文档

    def add_document(self, content: str, source: str):
        """添加文档到知识库"""
        # 将文档分割成段落
        paragraphs = re.split(r'\n\s*\n', content)
        for para in paragraphs:
            if len(para.strip()) > 20:  # 忽略过短的段落
                self.documents.append(para.strip())
                self.sources.append(source)
        
        # 更新向量
        self._update_vectors()
    
    def _update_vectors(self):
        """更新文档向量"""
        if not self.documents:
            return
        self.vectors = self.vectorizer.fit_transform(self.documents)
    
    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """搜索与查询最相关的文档段落"""
        if not self.documents or self.vectors is None:
            return []
        
        # 向量化查询
        query_vector = self.vectorizer.transform([query])
        
        # 计算相似度
        similarities = cosine_similarity(query_vector, self.vectors).flatten()
        
        # 获取最相似的文档索引
        top_indices = similarities.argsort()[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.1:  # 相似度阈值
                results.append({
                    "content": self.documents[idx],
                    "source": self.sources[idx],
                    "similarity": float(similarities[idx])
                })
        
        return results

# 初始化知识库
knowledge_base = KnowledgeBase()

# 确保知识库目录存在
os.makedirs("knowledge_base", exist_ok=True)

# 定义加载Markdown文件工具
@server.tool("load_markdown")
def load_markdown(file_path: str) -> Dict[str, Any]:
    """从Markdown文件加载知识
    
    Args:
        file_path: Markdown文件路径，相对于知识库目录
        
    Returns:
        加载结果，包含成功状态和加载的段落数
    """
    try:
        full_path = os.path.join("knowledge_base", file_path)
        if not os.path.exists(full_path):
            return {
                "success": False,
                "error": f"文件 {file_path} 不存在"
            }
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取纯文本内容
        html = markdown.markdown(content)
        text = BeautifulSoup(html, 'html.parser').get_text()
        
        # 添加到知识库
        old_count = len(knowledge_base.documents)
        knowledge_base.add_document(text, f"markdown:{file_path}")
        new_count = len(knowledge_base.documents)
        
        return {
            "success": True,
            "source": file_path,
            "paragraphs_added": new_count - old_count,
            "total_paragraphs": new_count
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# 定义加载网页内容工具
@server.tool("load_webpage")
def load_webpage(url: str) -> Dict[str, Any]:
    """从网页加载知识
    
    Args:
        url: 网页URL
        
    Returns:
        加载结果，包含成功状态和加载的段落数
    """
    try:
        # 获取网页内容
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # 解析HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 移除脚本和样式
        for script in soup(["script", "style"]):
            script.extract()
        
        # 获取文本
        text = soup.get_text()
        
        # 清理文本
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        # 添加到知识库
        old_count = len(knowledge_base.documents)
        knowledge_base.add_document(text, f"webpage:{url}")
        new_count = len(knowledge_base.documents)
        
        return {
            "success": True,
            "source": url,
            "paragraphs_added": new_count - old_count,
            "total_paragraphs": new_count
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# 定义添加自定义知识工具
@server.tool("add_custom_knowledge")
def add_custom_knowledge(content: str, source_name: str) -> Dict[str, Any]:
    """添加自定义知识到知识库
    
    Args:
        content: 知识内容文本
        source_name: 知识来源名称
        
    Returns:
        添加结果，包含成功状态和添加的段落数
    """
    try:
        if len(content) < 10:
            return {
                "success": False,
                "error": "内容过短，请提供更详细的知识"
            }
        
        # 添加到知识库
        old_count = len(knowledge_base.documents)
        knowledge_base.add_document(content, f"custom:{source_name}")
        new_count = len(knowledge_base.documents)
        
        return {
            "success": True,
            "source": source_name,
            "paragraphs_added": new_count - old_count,
            "total_paragraphs": new_count
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# 定义知识库查询工具
@server.tool("query_knowledge")
def query_knowledge(question: str, top_k: int = 3) -> Dict[str, Any]:
    """查询知识库回答问题
    
    Args:
        question: 用户问题
        top_k: 返回的最相关结果数量
        
    Returns:
        查询结果，包含相关文档段落及其来源
    """
    try:
        if not knowledge_base.documents:
            return {
                "success": False,
                "error": "知识库为空，请先加载知识"
            }
        
        if len(question) < 5:
            return {
                "success": False,
                "error": "问题过短，请提供更具体的问题"
            }
        
        # 搜索相关文档
        results = knowledge_base.search(question, top_k=top_k)
        
        if not results:
            return {
                "success": True,
                "has_results": False,
                "message": "未找到相关信息，请尝试其他问题或加载更多知识"
            }
        
        return {
            "success": True,
            "has_results": True,
            "results": results
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# 定义获取知识库统计信息工具
@server.tool("get_knowledge_stats")
def get_knowledge_stats() -> Dict[str, Any]:
    """获取知识库统计信息
    
    Returns:
        知识库统计信息，包含文档数量和来源分布
    """
    try:
        if not knowledge_base.documents:
            return {
                "success": True,
                "document_count": 0,
                "sources": []
            }
        
        # 统计来源分布
        source_counts = {}
        for source in knowledge_base.sources:
            source_type = source.split(':', 1)[0]
            source_counts[source_type] = source_counts.get(source_type, 0) + 1
        
        source_stats = [{"type": k, "count": v} for k, v in source_counts.items()]
        
        return {
            "success": True,
            "document_count": len(knowledge_base.documents),
            "sources": source_stats
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# 定义知识库资源端点
@server.resource("/knowledge")
def knowledge_resource() -> MCPResource:
    """获取知识库资源信息"""
    stats = get_knowledge_stats()
    
    # 构建资源信息
    if stats["success"]:
        if stats["document_count"] == 0:
            description = "知识库当前为空，请使用相关工具加载知识。"
        else:
            description = f"知识库包含 {stats['document_count']} 个文档段落，来源分布: "
            for source in stats["sources"]:
                description += f"{source['type']}({source['count']}个) "
    else:
        description = "无法获取知识库信息。"
    
    return MCPResource(
        title="知识库信息",
        description=description,
        tools=[
            "load_markdown",
            "load_webpage",
            "add_custom_knowledge",
            "query_knowledge",
            "get_knowledge_stats"
        ]
    )

# 定义用户提示
server.user_prompt = """
我是一个专门连接到知识库的智能问答助手。我可以帮助您:

1. 加载各类知识来源：
   - 通过load_markdown工具加载Markdown文档
   - 通过load_webpage工具加载网页内容
   - 通过add_custom_knowledge工具添加自定义知识

2. 回答基于已加载知识的问题：
   - 使用query_knowledge工具查询知识库
   - 查看知识库状态: get_knowledge_stats

请先加载一些知识，然后我可以回答相关问题。无论是技术文档、产品手册还是其他类型的知识，我都可以提供帮助。

您想要做什么？
"""

# 启动服务器示例
if __name__ == "__main__":
    # 添加一些示例知识
    add_custom_knowledge(
        "MCP协议是一种连接大语言模型与工具的标准化接口协议，"
        "它允许AI模型调用外部工具和资源，从而扩展模型的能力范围。",
        "MCP介绍"
    )
    
    # 启动服务器
    server.run(host="0.0.0.0", port=8080)
```

### 使用方式

1. 准备环境：
```bash
pip install flask scikit-learn beautifulsoup4 markdown numpy requests mcp-server
```

2. 创建知识库目录：
```bash
mkdir knowledge_base
```

3. 在knowledge_base目录中放入Markdown文档，或准备网页URL，或提供自定义知识。

4. 启动服务器：
```bash
python knowledge_qa_server.py
```

5. 使用方式：
   - 首先加载知识：使用`load_markdown`、`load_webpage`或`add_custom_knowledge`工具
   - 查询知识库状态：使用`get_knowledge_stats`工具
   - 提问问题：使用`query_knowledge`工具

### 技术亮点

- **多源知识处理**：支持从多种来源提取和加载知识
- **向量化存储**：使用TF-IDF向量化文本内容，实现高效相似度检索
- **智能分段**：自动将文档分割成段落，提高检索精度
- **相似度阈值**：设置相似度阈值，确保结果质量
- **丰富的工具集**：提供完整的知识管理和查询工具

这个知识库问答助手提供了一个灵活的知识管理和检索系统，能够根据用户问题智能检索相关内容，是企业内部知识库、技术文档查询和客户支持场景的理想解决方案。

## 总结与最佳实践

Python实现的MCP服务器提供了一种强大的方式，让您能够扩展AI模型的能力，使其能与外部系统交互并执行特定领域的任务。通过本文档展示的应用案例，您可以看到MCP技术如何在文档分析、数据可视化和代码审查等场景中产生实际价值。

### MCP Python实现的关键优势

1. **强大的生态系统支持**：Python拥有丰富的库生态系统，从数据处理到机器学习，几乎所有领域都有高质量的工具可用
2. **异步处理能力**：通过`asyncio`，Python MCP服务器可以高效处理并发请求
3. **快速原型开发**：Python简洁的语法使得开发者能够快速实现MCP服务器功能
4. **跨平台兼容性**：Python MCP服务器可以在Windows、Linux和macOS等多种平台上运行

### 实施最佳实践

在实现您自己的MCP服务器时，请考虑以下最佳实践：

1. **使用适当的异常处理**：通过`BadRequestError`和`ToolError`等专用异常提供清晰的错误信息
2. **添加全面的文档**：为您的工具、资源和提示提供详细的文档说明
3. **实现输入验证**：始终验证用户输入，避免安全漏洞和意外行为
4. **设计合理的资源结构**：将相关功能组织为有意义的资源，方便AI模型访问
5. **创建有用的提示模板**：帮助用户更有效地使用您的MCP服务器
6. **优化性能**：对于计算密集型操作实现缓存机制
7. **保持无状态设计**：尽可能使服务器无状态，以提高可靠性和可扩展性

通过Python实现MCP，您可以将AI模型与各种外部系统和服务连接起来，创建功能强大、实用且易于维护的AI扩展工具。这些工具可以帮助用户更高效地完成文档处理、数据分析和代码开发等各种任务。 