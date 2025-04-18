---
sidebar_position: 2
---

# 基础开发指南

本指南将帮助您快速上手检索增强生成(RAG)技术，从环境准备到构建一个简单的RAG系统。

## 环境准备

### 基础要求

开始构建RAG系统前，请确保您的环境满足以下要求：

- **Python 3.8+**
- **至少8GB RAM**（处理大型语言模型和向量存储）
- **至少10GB可用磁盘空间**（用于存储依赖库、模型和向量数据）

### 安装依赖库

以下是构建基础RAG系统常用的Python库：

```bash
# 创建虚拟环境
python -m venv rag-env
source rag-env/bin/activate  # Linux/Mac
# 或 rag-env\Scripts\activate  # Windows

# 安装基础依赖
pip install -U pip setuptools wheel
pip install langchain openai tiktoken faiss-cpu 
pip install pypdf sentence-transformers chromadb
pip install gradio python-dotenv
```

### 配置API访问

如果您使用OpenAI或其他需要API密钥的服务，请创建`.env`文件存储密钥：

```bash
# .env文件示例
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
SERPER_API_KEY=your_google_serper_api_key
```

并在代码中加载：

```python
from dotenv import load_dotenv
import os

# 加载环境变量
load_dotenv()

# 获取密钥
openai_api_key = os.getenv("OPENAI_API_KEY")
```

## 构建基础RAG系统

### 步骤1: 文档处理

首先，我们需要加载和处理文档：

```python
from langchain.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 加载单个PDF文件
loader = PyPDFLoader("path/to/your/document.pdf")
documents = loader.load()

# 或者加载整个目录的PDF文件
directory_loader = DirectoryLoader("path/to/documents/", glob="**/*.pdf", loader_cls=PyPDFLoader)
documents = directory_loader.load()

# 文本分块
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,  # 每块的目标字符数
    chunk_overlap=100,  # 块之间的重叠字符数
    length_function=len,
    is_separator_regex=False,
)

chunks = text_splitter.split_documents(documents)

print(f"文档已分割为{len(chunks)}个块")
```

### 步骤2: 创建向量存储

接下来，将文本块转换为向量并存储：

```python
from langchain.embeddings import OpenAIEmbeddings, HuggingFaceEmbeddings
from langchain.vectorstores import FAISS, Chroma

# 选择嵌入模型
# 方式1: 使用OpenAI的嵌入
embeddings = OpenAIEmbeddings()

# 方式2: 使用Hugging Face的嵌入模型
# embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# 创建向量存储 - FAISS (基于内存)
vectorstore = FAISS.from_documents(chunks, embeddings)
# 可选: 保存向量存储到磁盘
vectorstore.save_local("faiss_index")

# 或使用Chroma (可持久化到磁盘)
# vectorstore = Chroma.from_documents(
#     documents=chunks, 
#     embedding=embeddings,
#     persist_directory="./chroma_db"
# )
# vectorstore.persist()

print("向量存储创建完成")
```

### 步骤3: 实现检索器

现在，创建一个检索器来查找相关文本：

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor

# 基本检索器
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": a})

# 高级: 压缩检索器 (使用LLM优化检索结果)
# from langchain.chat_models import ChatOpenAI
# llm = ChatOpenAI(temperature=0)
# compressor = LLMChainExtractor.from_llm(llm)
# compression_retriever = ContextualCompressionRetriever(
#     base_compressor=compressor,
#     base_retriever=retriever
# )

# 测试检索
query = "请解释什么是RAG?"
docs = retriever.get_relevant_documents(query)
print(f"检索到{len(docs)}个相关文档片段")
for i, doc in enumerate(docs):
    print(f"文档 {i+1}:")
    print(doc.page_content[:200] + "...\n")
```

### 步骤4: 构建RAG链

将检索器与语言模型集成：

```python
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# 初始化语言模型
llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

# 创建提示模板
template = """
你是一个专业的助手，使用以下上下文信息回答用户的问题。
如果你不知道答案，请如实告知，不要试图编造信息。

上下文信息:
{context}

用户问题: {question}

请提供准确、详细、有条理的回答:
"""

QA_PROMPT = PromptTemplate(
    template=template,
    input_variables=["context", "question"]
)

# 创建检索问答链
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # 简单地将所有检索到的文档放入提示
    retriever=retriever,
    return_source_documents=True,  # 返回来源文档
    chain_type_kwargs={"prompt": QA_PROMPT}
)

# 运行检索问答
result = qa_chain({"query": "请解释RAG技术的优势是什么?"})
print("回答:", result["result"])
print("\n来源文档数量:", len(result["source_documents"]))
```

### 步骤5: 创建简单的交互界面

最后，添加一个简单的界面：

```python
import gradio as gr

def process_query(query):
    if not query:
        return "请输入问题"
    
    # 执行RAG查询
    result = qa_chain({"query": query})
    
    # 格式化来源引用
    sources = []
    for i, doc in enumerate(result["source_documents"]):
        source_info = f"来源 {i+1}: "
        if hasattr(doc.metadata, 'source') and doc.metadata['source']:
            source_info += doc.metadata['source']
        if hasattr(doc.metadata, 'page') and doc.metadata['page']:
            source_info += f", 页码: {doc.metadata['page']}"
        sources.append(source_info)
    
    # 构建响应
    response = f"{result['result']}\n\n"
    if sources:
        response += "参考来源:\n" + "\n".join(sources)
    
    return response

# 创建Gradio界面
demo = gr.Interface(
    fn=process_query,
    inputs=gr.Textbox(lines=3, placeholder="输入您的问题..."),
    outputs="text",
    title="RAG 问答系统",
    description="一个基于检索增强生成技术的问答系统"
)

# 启动界面
demo.launch()
```

## 进阶实现

### 改进检索策略

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import EmbeddingsFilter

# 嵌入过滤器 - 进一步提高相关性
embeddings_filter = EmbeddingsFilter(
    embeddings=embeddings,
    similarity_threshold=0.76  # 设置相似度阈值
)

# 压缩检索器
compression_retriever = ContextualCompressionRetriever(
    base_compressor=embeddings_filter,
    base_retriever=retriever
)

# 混合检索 - 结合BM25和向量搜索
from langchain.retrievers import BM25Retriever, EnsembleRetriever

# 创建BM25检索器
bm25_retriever = BM25Retriever.from_documents(chunks)
bm25_retriever.k = 3  # 每次检索的文档数

# 创建集成检索器
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, retriever],
    weights=[0.3, 0.7]  # 权重分配
)
```

### 查询转换

```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

# 查询扩展器
query_expansion_prompt = PromptTemplate(
    input_variables=["question"],
    template="""基于用户的原始问题，生成3个语义相关但表达不同的查询版本，用于文档检索。确保这些变体能覆盖原始问题可能涉及的不同方面。

原始问题: {question}

生成的查询变体:
1."""
)

query_expansion_chain = LLMChain(
    llm=llm, 
    prompt=query_expansion_prompt,
    output_key="expanded_queries"
)

# 使用
expanded = query_expansion_chain.run("RAG技术如何减少模型幻觉?")
print("扩展查询:", expanded)

# 将扩展查询分割成单独的查询
import re
expanded_queries = re.split(r'\d+\.\s', expanded)[1:]
expanded_queries = [q.strip() for q in expanded_queries if q.strip()]

# 为每个扩展查询检索文档
all_docs = []
for query in expanded_queries:
    docs = retriever.get_relevant_documents(query)
    all_docs.extend(docs)

# 去重
unique_docs = []
seen_content = set()
for doc in all_docs:
    if doc.page_content not in seen_content:
        seen_content.add(doc.page_content)
        unique_docs.append(doc)
```

### 多模型协作RAG

```python
from langchain.chat_models import ChatOpenAI
from langchain.chains import MapReduceDocumentsChain, StuffDocumentsChain, LLMChain

# 初始化模型
map_llm = ChatOpenAI(model_name="gpt-3.5-turbo-0613", temperature=0)  # 处理单个文档
reduce_llm = ChatOpenAI(model_name="gpt-4", temperature=0)  # 综合处理结果

# 映射提示
map_template = """以下是一个文档片段:
{document}

基于这个片段，提取与以下问题相关的要点和信息:
{question}

要点:"""
map_prompt = PromptTemplate.from_template(map_template)
map_chain = LLMChain(llm=map_llm, prompt=map_prompt)

# 归约提示
reduce_template = """基于以下从多个文档中提取的要点，综合回答用户的问题。
如果信息不足以回答问题，请如实说明，不要编造信息。

问题: {question}

要点列表:
{document_summaries}

综合回答:"""
reduce_prompt = PromptTemplate.from_template(reduce_template)
reduce_chain = LLMChain(llm=reduce_llm, prompt=reduce_prompt)

# 组合链
combine_documents_chain = StuffDocumentsChain(
    llm_chain=reduce_chain,
    document_variable_name="document_summaries"
)

map_reduce_chain = MapReduceDocumentsChain(
    llm_chain=map_chain,
    reduce_documents_chain=combine_documents_chain,
    document_variable_name="document",
    return_intermediate_steps=True
)

# 使用多模型链
docs = retriever.get_relevant_documents("RAG系统中如何进行有效的文档分块?")
result = map_reduce_chain({"input_documents": docs, "question": "RAG系统中如何进行有效的文档分块?"})
print("最终回答:", result["output_text"])
print("\n中间步骤:", len(result["intermediate_steps"]), "个要点提取")
```

## 评估RAG系统

评估RAG系统是确保其有效性的关键环节：

```python
from langchain.evaluation import QAEvalChain

# 准备评估数据
eval_examples = [
    {"query": "RAG系统的主要组件有哪些?", "answer": "RAG系统的主要组件包括文档处理管道、向量化与索引、检索系统和生成增强。"},
    {"query": "如何减少RAG系统中的幻觉?", "answer": "通过提供高质量的检索结果、优化提示工程、使用相关性过滤和实施事实核查机制可减少幻觉。"},
    # 添加更多测试用例
]

# 运行RAG系统获取预测
predictions = []
for ex in eval_examples:
    result = qa_chain({"query": ex["query"]})
    predictions.append({"query": ex["query"], "answer": result["result"]})

# 使用LLM评估回答质量
eval_llm = ChatOpenAI(model_name="gpt-4", temperature=0)
eval_chain = QAEvalChain.from_llm(eval_llm)
graded_outputs = eval_chain.evaluate(eval_examples, predictions)

# 显示评估结果
for i, (example, prediction) in enumerate(zip(eval_examples, predictions)):
    print(f"示例 {i+1}:")
    print(f"问题: {example['query']}")
    print(f"参考答案: {example['answer']}")
    print(f"系统回答: {prediction['answer']}")
    print(f"评分: {graded_outputs[i]['text']}")
    print("-" * 50)
```

## 部署最佳实践

部署RAG系统时，请考虑以下最佳实践：

1. **向量数据库选择**：
   - 小规模应用: FAISS、Chroma
   - 中型应用: Milvus、Qdrant、Weaviate
   - 大型应用: Pinecone、Elasticsearch with kNN

2. **缓存策略**：
   - 为常见查询实施结果缓存
   - 缓存嵌入向量计算结果
   - 定期刷新高频查询的缓存

3. **性能优化**：
   - 批量处理文档嵌入
   - 实施异步处理流程
   - 考虑使用流式响应

4. **监控与日志**：
   - 跟踪查询延迟和检索质量
   - 记录用户反馈
   - 监控API使用和成本

## 下一步学习

恭喜！您已经了解了构建RAG系统的基本步骤。要进一步提升您的RAG技能，建议探索：

1. [RAG高级开发指南](/docs/rag/development)，学习更复杂的RAG架构和技术
2. [向量数据库优化](/docs/rag/vector-databases)，深入了解向量存储的高级特性
3. [提示工程最佳实践](/docs/rag/prompt-engineering)，优化RAG系统中的提示设计
4. [评估与优化](/docs/rag/evaluation)，系统性地改进RAG性能

RAG技术正在快速发展，持续学习和实验是掌握这一领域的关键。 