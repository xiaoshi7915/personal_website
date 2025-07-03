---
sidebar_position: 3
---

# 高级开发指南

## 概述

本指南面向需要深度定制毕昇平台功能的高级开发者，涵盖自定义组件开发、高级工作流设计、插件系统、API开发等核心技术内容。通过本指南，您将能够充分利用毕昇平台的扩展能力，构建满足特定业务需求的企业级AI应用。

## 自定义组件开发

毕昇平台支持开发自定义组件来扩展工作流的功能。组件是工作流的基本构建单元，每个组件封装特定的业务逻辑。

### 组件开发基础

#### 1. 组件结构

一个标准的毕昇组件包含以下文件：

```
custom_components/
└── my_component/
    ├── __init__.py
    ├── component.py       # 组件主逻辑
    ├── schema.py          # 组件配置架构
    ├── frontend.py        # 前端展示逻辑
    └── README.md          # 组件说明文档
```

#### 2. 组件基类

所有自定义组件都需要继承`BaseComponent`基类：

```python
from bisheng.components.base import BaseComponent
from bisheng.field_typing import Input, Output, Text, Integer
from typing import Optional

class MyCustomComponent(BaseComponent):
    display_name = "我的自定义组件"
    description = "这是一个示例自定义组件"
    icon = "🔧"
    
    inputs = [
        Input(
            display_name="输入文本",
            name="input_text",
            field_type=Text,
            required=True,
            placeholder="请输入要处理的文本"
        ),
        Input(
            display_name="处理参数",
            name="param",
            field_type=Integer,
            required=False,
            value=10,
            info="处理参数，范围1-100"
        )
    ]
    
    outputs = [
        Output(
            display_name="处理结果",
            name="result",
            field_type=Text
        )
    ]
    
    def build_config(self):
        return {
            "input_text": {"display_name": "输入文本"},
            "param": {"display_name": "处理参数", "value": 10}
        }
    
    def build(self, input_text: str, param: Optional[int] = 10) -> str:
        """
        组件的核心处理逻辑
        """
        # 在这里实现您的业务逻辑
        processed_text = self.process_text(input_text, param)
        
        return processed_text
    
    def process_text(self, text: str, param: int) -> str:
        """
        具体的文本处理逻辑
        """
        # 示例：简单的文本处理
        if param > 50:
            return text.upper()
        else:
            return text.lower()
```

#### 3. 高级组件特性

##### 异步处理

对于需要长时间执行的任务，可以使用异步组件：

```python
import asyncio
from bisheng.components.base import BaseComponent

class AsyncProcessComponent(BaseComponent):
    display_name = "异步处理组件"
    
    async def build(self, input_data: str) -> str:
        # 模拟长时间运行的任务
        await asyncio.sleep(2)
        
        # 执行实际的处理逻辑
        result = await self.async_process(input_data)
        
        return result
    
    async def async_process(self, data: str) -> str:
        # 异步处理逻辑
        return f"异步处理结果: {data}"
```

##### 流式输出

支持流式输出的组件，适用于文本生成等场景：

```python
from typing import Iterator

class StreamingComponent(BaseComponent):
    display_name = "流式输出组件"
    
    def build(self, prompt: str) -> Iterator[str]:
        """
        返回生成器，支持流式输出
        """
        for i, chunk in enumerate(self.generate_text(prompt)):
            yield chunk
    
    def generate_text(self, prompt: str) -> Iterator[str]:
        # 模拟流式文本生成
        words = prompt.split()
        for word in words:
            yield f"{word} "
```

##### 状态管理

组件可以维护内部状态，支持复杂的有状态处理：

```python
class StatefulComponent(BaseComponent):
    display_name = "有状态组件"
    
    def __init__(self):
        super().__init__()
        self.state = {}
        self.counter = 0
    
    def build(self, input_data: str) -> dict:
        self.counter += 1
        
        # 更新状态
        self.state[f"request_{self.counter}"] = {
            "input": input_data,
            "timestamp": datetime.now().isoformat(),
            "processed": True
        }
        
        return {
            "result": f"处理了第{self.counter}个请求",
            "state_size": len(self.state)
        }
```

### 高级组件开发模式

#### 1. 复合组件

将多个简单组件组合成复杂的复合组件：

```python
class CompositeComponent(BaseComponent):
    display_name = "复合处理组件"
    
    def __init__(self):
        super().__init__()
        # 初始化子组件
        self.preprocessor = TextPreprocessor()
        self.analyzer = TextAnalyzer()
        self.formatter = ResultFormatter()
    
    def build(self, raw_text: str) -> dict:
        # 预处理
        cleaned_text = self.preprocessor.clean(raw_text)
        
        # 分析
        analysis_result = self.analyzer.analyze(cleaned_text)
        
        # 格式化输出
        formatted_result = self.formatter.format(analysis_result)
        
        return formatted_result
```

#### 2. 插件化组件

支持动态加载插件的组件架构：

```python
class PluginableComponent(BaseComponent):
    display_name = "插件化组件"
    
    def __init__(self):
        super().__init__()
        self.plugins = {}
        self.load_plugins()
    
    def load_plugins(self):
        """动态加载插件"""
        plugin_dir = "plugins/"
        for plugin_file in os.listdir(plugin_dir):
            if plugin_file.endswith('.py'):
                plugin_name = plugin_file[:-3]
                plugin_module = importlib.import_module(f"plugins.{plugin_name}")
                self.plugins[plugin_name] = plugin_module.Plugin()
    
    def build(self, input_data: str, plugin_name: str = "default") -> str:
        if plugin_name in self.plugins:
            return self.plugins[plugin_name].process(input_data)
        else:
            return f"插件 {plugin_name} 未找到"
```

#### 3. 配置驱动组件

通过配置文件驱动组件行为：

```python
import yaml

class ConfigDrivenComponent(BaseComponent):
    display_name = "配置驱动组件"
    
    def __init__(self, config_path: str = "component_config.yaml"):
        super().__init__()
        self.config = self.load_config(config_path)
    
    def load_config(self, config_path: str) -> dict:
        with open(config_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    
    def build(self, input_data: str) -> str:
        # 根据配置选择处理策略
        strategy = self.config.get('processing_strategy', 'default')
        
        if strategy == 'advanced':
            return self.advanced_process(input_data)
        elif strategy == 'simple':
            return self.simple_process(input_data)
        else:
            return self.default_process(input_data)
    
    def advanced_process(self, data: str) -> str:
        # 高级处理逻辑
        return f"高级处理: {data}"
    
    def simple_process(self, data: str) -> str:
        # 简单处理逻辑
        return f"简单处理: {data}"
    
    def default_process(self, data: str) -> str:
        # 默认处理逻辑
        return f"默认处理: {data}"
```

## 高级工作流设计

### 条件分支与循环

#### 1. 复杂条件分支

创建包含多个条件的复杂分支逻辑：

```python
class AdvancedConditionalFlow:
    def design_flow(self):
        """设计复杂的条件分支工作流"""
        return {
            "nodes": [
                {
                    "id": "input",
                    "type": "InputNode",
                    "config": {"input_type": "text"}
                },
                {
                    "id": "analyzer",
                    "type": "TextAnalyzer",
                    "config": {
                        "analysis_type": ["sentiment", "intent", "language"]
                    }
                },
                {
                    "id": "router",
                    "type": "ConditionalRouter",
                    "config": {
                        "conditions": [
                            {
                                "name": "positive_sentiment",
                                "expression": "sentiment_score > 0.7",
                                "next_node": "positive_handler"
                            },
                            {
                                "name": "negative_sentiment", 
                                "expression": "sentiment_score < 0.3",
                                "next_node": "negative_handler"
                            },
                            {
                                "name": "neutral_sentiment",
                                "expression": "0.3 <= sentiment_score <= 0.7",
                                "next_node": "neutral_handler"
                            }
                        ],
                        "default_node": "fallback_handler"
                    }
                }
            ],
            "edges": [
                {"from": "input", "to": "analyzer"},
                {"from": "analyzer", "to": "router"}
            ]
        }
```

#### 2. 循环处理工作流

实现循环处理逻辑，适用于批量数据处理：

```python
class LoopProcessingFlow:
    def design_batch_flow(self):
        """设计批量循环处理工作流"""
        return {
            "nodes": [
                {
                    "id": "batch_input",
                    "type": "BatchInput",
                    "config": {"batch_size": 10}
                },
                {
                    "id": "loop_controller",
                    "type": "LoopController",
                    "config": {
                        "max_iterations": 100,
                        "continue_condition": "has_more_data"
                    }
                },
                {
                    "id": "item_processor",
                    "type": "ItemProcessor",
                    "config": {"processing_type": "transform"}
                },
                {
                    "id": "aggregator",
                    "type": "ResultAggregator",
                    "config": {"aggregation_method": "collect"}
                }
            ],
            "edges": [
                {"from": "batch_input", "to": "loop_controller"},
                {"from": "loop_controller", "to": "item_processor"},
                {"from": "item_processor", "to": "aggregator"},
                {"from": "aggregator", "to": "loop_controller", "condition": "has_more_items"}
            ]
        }
```

### 并行处理工作流

#### 1. 并行分支处理

创建并行处理的工作流，提高处理效率：

```python
class ParallelProcessingFlow:
    def design_parallel_flow(self):
        """设计并行处理工作流"""
        return {
            "nodes": [
                {
                    "id": "input",
                    "type": "InputNode"
                },
                {
                    "id": "splitter",
                    "type": "DataSplitter",
                    "config": {"split_strategy": "parallel"}
                },
                {
                    "id": "branch_a",
                    "type": "ProcessorA",
                    "config": {"parallel": True}
                },
                {
                    "id": "branch_b",
                    "type": "ProcessorB", 
                    "config": {"parallel": True}
                },
                {
                    "id": "branch_c",
                    "type": "ProcessorC",
                    "config": {"parallel": True}
                },
                {
                    "id": "merger",
                    "type": "ResultMerger",
                    "config": {"merge_strategy": "combine"}
                }
            ],
            "edges": [
                {"from": "input", "to": "splitter"},
                {"from": "splitter", "to": "branch_a"},
                {"from": "splitter", "to": "branch_b"},
                {"from": "splitter", "to": "branch_c"},
                {"from": "branch_a", "to": "merger"},
                {"from": "branch_b", "to": "merger"},
                {"from": "branch_c", "to": "merger"}
            ]
        }
```

#### 2. 异步工作流

设计异步执行的工作流，适用于I/O密集型任务：

```python
class AsyncWorkflow:
    async def execute_async_flow(self, input_data):
        """异步执行工作流"""
        # 异步并行执行多个任务
        tasks = [
            self.async_task_a(input_data),
            self.async_task_b(input_data),
            self.async_task_c(input_data)
        ]
        
        # 等待所有任务完成
        results = await asyncio.gather(*tasks)
        
        # 合并结果
        final_result = self.merge_results(results)
        
        return final_result
    
    async def async_task_a(self, data):
        """异步任务A"""
        await asyncio.sleep(1)  # 模拟I/O操作
        return f"Task A result: {data}"
    
    async def async_task_b(self, data):
        """异步任务B"""
        await asyncio.sleep(2)  # 模拟I/O操作
        return f"Task B result: {data}"
    
    async def async_task_c(self, data):
        """异步任务C"""
        await asyncio.sleep(1.5)  # 模拟I/O操作
        return f"Task C result: {data}"
    
    def merge_results(self, results):
        """合并异步任务结果"""
        return {
            "task_a": results[0],
            "task_b": results[1], 
            "task_c": results[2],
            "timestamp": datetime.now().isoformat()
        }
```

### 工作流模板系统

#### 1. 模板定义

创建可重用的工作流模板：

```python
class WorkflowTemplate:
    def __init__(self, template_name: str):
        self.template_name = template_name
        self.template_config = self.load_template()
    
    def load_template(self) -> dict:
        """加载工作流模板配置"""
        template_path = f"templates/{self.template_name}.yaml"
        
        with open(template_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    
    def instantiate(self, parameters: dict) -> dict:
        """根据参数实例化工作流"""
        # 深拷贝模板配置
        instance_config = copy.deepcopy(self.template_config)
        
        # 替换参数占位符
        instance_config = self.replace_placeholders(instance_config, parameters)
        
        return instance_config
    
    def replace_placeholders(self, config: dict, parameters: dict) -> dict:
        """替换配置中的参数占位符"""
        config_str = json.dumps(config)
        
        for key, value in parameters.items():
            placeholder = f"${{{key}}}"
            config_str = config_str.replace(placeholder, str(value))
        
        return json.loads(config_str)
```

#### 2. 模板配置示例

```yaml
# templates/rag_qa_template.yaml
name: "RAG知识库问答模板"
description: "基于检索增强生成的知识库问答工作流模板"
version: "1.0"

parameters:
  - name: "knowledge_base_id"
    type: "string"
    required: true
    description: "知识库ID"
  - name: "llm_model"
    type: "string"
    required: true
    description: "使用的大语言模型"
  - name: "top_k"
    type: "integer"
    default: 5
    description: "检索返回的文档数量"

nodes:
  - id: "user_input"
    type: "InputNode"
    config:
      input_type: "text"
      placeholder: "请输入您的问题"
  
  - id: "knowledge_retriever"
    type: "KnowledgeRetriever"
    config:
      knowledge_base_id: "${knowledge_base_id}"
      top_k: ${top_k}
      similarity_threshold: 0.7
  
  - id: "context_builder"
    type: "ContextBuilder"
    config:
      template: |
        基于以下知识库内容回答用户问题：
        
        知识库内容：
        {context}
        
        用户问题：{question}
  
  - id: "llm_generator"
    type: "LLMGenerator"
    config:
      model: "${llm_model}"
      temperature: 0.7
      max_tokens: 500

edges:
  - from: "user_input"
    to: "knowledge_retriever"
  - from: "knowledge_retriever" 
    to: "context_builder"
  - from: "context_builder"
    to: "llm_generator"
```

## 插件系统

毕昇平台支持插件系统，允许开发者创建可重用的功能模块。

### 插件开发基础

#### 1. 插件接口定义

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, List

class PluginInterface(ABC):
    """插件接口基类"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """插件名称"""
        pass
    
    @property
    @abstractmethod
    def version(self) -> str:
        """插件版本"""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """插件描述"""
        pass
    
    @abstractmethod
    def initialize(self, config: Dict[str, Any]) -> None:
        """初始化插件"""
        pass
    
    @abstractmethod
    def process(self, input_data: Any) -> Any:
        """处理数据的主要方法"""
        pass
    
    @abstractmethod
    def cleanup(self) -> None:
        """清理资源"""
        pass
```

#### 2. 插件实现示例

```python
class TextProcessingPlugin(PluginInterface):
    """文本处理插件示例"""
    
    def __init__(self):
        self._config = {}
        self._initialized = False
    
    @property
    def name(self) -> str:
        return "TextProcessingPlugin"
    
    @property
    def version(self) -> str:
        return "1.0.0"
    
    @property
    def description(self) -> str:
        return "提供高级文本处理功能的插件"
    
    def initialize(self, config: Dict[str, Any]) -> None:
        """初始化插件配置"""
        self._config = config
        
        # 初始化处理器
        self.processors = {
            'sentiment': SentimentAnalyzer(),
            'ner': NamedEntityRecognizer(),
            'summarizer': TextSummarizer()
        }
        
        self._initialized = True
    
    def process(self, input_data: str) -> Dict[str, Any]:
        """处理文本数据"""
        if not self._initialized:
            raise RuntimeError("插件未初始化")
        
        results = {}
        
        # 根据配置选择处理器
        enabled_processors = self._config.get('enabled_processors', [])
        
        for processor_name in enabled_processors:
            if processor_name in self.processors:
                processor = self.processors[processor_name]
                results[processor_name] = processor.process(input_data)
        
        return results
    
    def cleanup(self) -> None:
        """清理资源"""
        for processor in self.processors.values():
            if hasattr(processor, 'cleanup'):
                processor.cleanup()
        
        self._initialized = False
```

### 插件管理器

#### 1. 插件注册与发现

```python
class PluginManager:
    """插件管理器"""
    
    def __init__(self):
        self.plugins = {}
        self.plugin_configs = {}
    
    def discover_plugins(self, plugin_dir: str) -> List[str]:
        """发现插件目录中的所有插件"""
        discovered_plugins = []
        
        for item in os.listdir(plugin_dir):
            plugin_path = os.path.join(plugin_dir, item)
            
            if os.path.isdir(plugin_path):
                # 检查是否包含插件定义文件
                plugin_file = os.path.join(plugin_path, 'plugin.py')
                config_file = os.path.join(plugin_path, 'config.yaml')
                
                if os.path.exists(plugin_file) and os.path.exists(config_file):
                    discovered_plugins.append(item)
        
        return discovered_plugins
    
    def load_plugin(self, plugin_name: str, plugin_dir: str) -> bool:
        """加载单个插件"""
        try:
            # 加载插件配置
            config_path = os.path.join(plugin_dir, plugin_name, 'config.yaml')
            with open(config_path, 'r', encoding='utf-8') as file:
                plugin_config = yaml.safe_load(file)
            
            # 动态导入插件模块
            plugin_module_path = f"{plugin_dir}.{plugin_name}.plugin"
            plugin_module = importlib.import_module(plugin_module_path)
            
            # 获取插件类
            plugin_class_name = plugin_config.get('class_name')
            plugin_class = getattr(plugin_module, plugin_class_name)
            
            # 创建插件实例
            plugin_instance = plugin_class()
            plugin_instance.initialize(plugin_config.get('config', {}))
            
            # 注册插件
            self.plugins[plugin_name] = plugin_instance
            self.plugin_configs[plugin_name] = plugin_config
            
            return True
            
        except Exception as e:
            logger.error(f"加载插件 {plugin_name} 失败: {e}")
            return False
    
    def get_plugin(self, plugin_name: str) -> PluginInterface:
        """获取插件实例"""
        return self.plugins.get(plugin_name)
    
    def list_plugins(self) -> List[Dict[str, str]]:
        """列出所有已加载的插件"""
        plugin_list = []
        
        for name, plugin in self.plugins.items():
            plugin_info = {
                'name': plugin.name,
                'version': plugin.version,
                'description': plugin.description,
                'status': 'active'
            }
            plugin_list.append(plugin_info)
        
        return plugin_list
    
    def unload_plugin(self, plugin_name: str) -> bool:
        """卸载插件"""
        if plugin_name in self.plugins:
            try:
                # 清理插件资源
                self.plugins[plugin_name].cleanup()
                
                # 从注册表中移除
                del self.plugins[plugin_name]
                del self.plugin_configs[plugin_name]
                
                return True
                
            except Exception as e:
                logger.error(f"卸载插件 {plugin_name} 失败: {e}")
                return False
        
        return False
```

#### 2. 插件配置文件示例

```yaml
# plugins/text_processing/config.yaml
name: "TextProcessingPlugin"
version: "1.0.0"
description: "高级文本处理插件"
author: "开发团队"
class_name: "TextProcessingPlugin"

dependencies:
  - "nltk>=3.8"
  - "spacy>=3.5"
  - "transformers>=4.20"

config:
  enabled_processors:
    - "sentiment"
    - "ner"
    - "summarizer"
  
  sentiment:
    model: "cardiffnlp/twitter-roberta-base-sentiment-latest"
    threshold: 0.5
  
  ner:
    model: "zh_core_web_sm"
    entities: ["PERSON", "ORG", "GPE"]
  
  summarizer:
    model: "facebook/bart-large-cnn"
    max_length: 150
    min_length: 50

permissions:
  - "read_text"
  - "process_text"
  - "cache_results"
```

## API开发与集成

### RESTful API开发

#### 1. 自定义API端点

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List

# 创建API路由器
custom_router = APIRouter(prefix="/api/v1/custom", tags=["自定义功能"])

# 请求模型
class ProcessRequest(BaseModel):
    text: str
    options: Optional[dict] = {}

class ProcessResponse(BaseModel):
    result: str
    metadata: dict
    processing_time: float

# API端点实现
@custom_router.post("/process", response_model=ProcessResponse)
async def process_text(
    request: ProcessRequest,
    user_id: str = Depends(get_current_user_id)
):
    """自定义文本处理API"""
    start_time = time.time()
    
    try:
        # 调用业务逻辑
        processor = TextProcessor(user_id)
        result = await processor.process(request.text, request.options)
        
        processing_time = time.time() - start_time
        
        return ProcessResponse(
            result=result,
            metadata={
                "user_id": user_id,
                "input_length": len(request.text),
                "options": request.options
            },
            processing_time=processing_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@custom_router.get("/workflows", response_model=List[dict])
async def list_custom_workflows(user_id: str = Depends(get_current_user_id)):
    """获取用户的自定义工作流列表"""
    workflow_manager = WorkflowManager(user_id)
    workflows = await workflow_manager.list_workflows()
    
    return workflows

@custom_router.post("/workflows/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: str,
    input_data: dict,
    user_id: str = Depends(get_current_user_id)
):
    """执行指定的工作流"""
    workflow_executor = WorkflowExecutor(user_id)
    
    try:
        result = await workflow_executor.execute(workflow_id, input_data)
        return {"status": "success", "result": result}
        
    except WorkflowNotFoundError:
        raise HTTPException(status_code=404, detail="工作流不存在")
    except WorkflowExecutionError as e:
        raise HTTPException(status_code=500, detail=f"工作流执行失败: {e}")
```

#### 2. API认证与权限

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta

security = HTTPBearer()

class AuthManager:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.algorithm = "HS256"
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """创建访问令牌"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=24)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        
        return encoded_jwt
    
    def verify_token(self, token: str) -> dict:
        """验证访问令牌"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的访问令牌",
                headers={"WWW-Authenticate": "Bearer"},
            )

# 依赖函数
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前用户信息"""
    auth_manager = AuthManager(settings.SECRET_KEY)
    payload = auth_manager.verify_token(credentials.credentials)
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的用户信息"
        )
    
    return user_id

async def check_admin_permission(user_id: str = Depends(get_current_user)):
    """检查管理员权限"""
    user_manager = UserManager()
    user = await user_manager.get_user(user_id)
    
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    return user_id
```

### WebSocket实时通信

#### 1. WebSocket连接管理

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

class ConnectionManager:
    """WebSocket连接管理器"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, List[str]] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str, user_id: str):
        """接受WebSocket连接"""
        await websocket.accept()
        
        self.active_connections[connection_id] = websocket
        
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(connection_id)
    
    def disconnect(self, connection_id: str, user_id: str):
        """断开WebSocket连接"""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if user_id in self.user_connections:
            self.user_connections[user_id].remove(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
    
    async def send_personal_message(self, message: str, connection_id: str):
        """发送个人消息"""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            await websocket.send_text(message)
    
    async def send_user_message(self, message: str, user_id: str):
        """发送用户消息到所有连接"""
        if user_id in self.user_connections:
            for connection_id in self.user_connections[user_id]:
                await self.send_personal_message(message, connection_id)
    
    async def broadcast(self, message: str):
        """广播消息"""
        for websocket in self.active_connections.values():
            await websocket.send_text(message)

# 全局连接管理器
manager = ConnectionManager()

@app.websocket("/ws/{user_id}/{connection_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, connection_id: str):
    """WebSocket端点"""
    await manager.connect(websocket, connection_id, user_id)
    
    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # 处理不同类型的消息
            await handle_websocket_message(message_data, user_id, connection_id)
            
    except WebSocketDisconnect:
        manager.disconnect(connection_id, user_id)
        
        # 通知其他连接用户离线
        await manager.send_user_message(
            json.dumps({
                "type": "user_disconnected",
                "user_id": user_id,
                "connection_id": connection_id
            }),
            user_id
        )

async def handle_websocket_message(message_data: dict, user_id: str, connection_id: str):
    """处理WebSocket消息"""
    message_type = message_data.get("type")
    
    if message_type == "workflow_execute":
        # 异步执行工作流并推送进度
        await execute_workflow_with_progress(
            message_data.get("workflow_id"),
            message_data.get("input_data"),
            user_id,
            connection_id
        )
    
    elif message_type == "chat_message":
        # 处理聊天消息
        await handle_chat_message(message_data, user_id, connection_id)
    
    elif message_type == "system_monitor":
        # 推送系统监控信息
        await send_system_status(user_id, connection_id)

async def execute_workflow_with_progress(workflow_id: str, input_data: dict, user_id: str, connection_id: str):
    """执行工作流并推送进度"""
    workflow_executor = WorkflowExecutor(user_id)
    
    async def progress_callback(step: str, progress: float, message: str):
        """进度回调函数"""
        progress_message = {
            "type": "workflow_progress",
            "workflow_id": workflow_id,
            "step": step,
            "progress": progress,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        await manager.send_personal_message(
            json.dumps(progress_message),
            connection_id
        )
    
    try:
        # 执行工作流
        result = await workflow_executor.execute_with_callback(
            workflow_id,
            input_data,
            progress_callback
        )
        
        # 发送完成消息
        completion_message = {
            "type": "workflow_completed",
            "workflow_id": workflow_id,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        
        await manager.send_personal_message(
            json.dumps(completion_message),
            connection_id
        )
        
    except Exception as e:
        # 发送错误消息
        error_message = {
            "type": "workflow_error",
            "workflow_id": workflow_id,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        
        await manager.send_personal_message(
            json.dumps(error_message),
            connection_id
        )
```

#### 2. 实时流式处理

```python
class StreamingProcessor:
    """流式处理器"""
    
    def __init__(self, user_id: str, connection_id: str):
        self.user_id = user_id
        self.connection_id = connection_id
        self.manager = manager  # 全局连接管理器
    
    async def stream_chat_response(self, messages: List[dict], model: str):
        """流式聊天响应"""
        llm_client = LLMClient(model)
        
        # 发送开始信号
        await self.send_stream_message({
            "type": "stream_start",
            "message_id": str(uuid.uuid4())
        })
        
        try:
            # 流式生成响应
            async for chunk in llm_client.stream_chat(messages):
                await self.send_stream_message({
                    "type": "stream_chunk",
                    "content": chunk,
                    "timestamp": datetime.now().isoformat()
                })
            
            # 发送结束信号
            await self.send_stream_message({
                "type": "stream_end",
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            # 发送错误信号
            await self.send_stream_message({
                "type": "stream_error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
    
    async def send_stream_message(self, message: dict):
        """发送流式消息"""
        await self.manager.send_personal_message(
            json.dumps(message),
            self.connection_id
        )
```

这份高级开发指南的前半部分涵盖了自定义组件开发、高级工作流设计、插件系统和API开发等核心内容。接下来我会继续创建其他必要的文档文件。 