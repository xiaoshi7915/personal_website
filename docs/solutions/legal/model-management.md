# 4. 模型与提示词管理

## 4.1 多模型路由

### 模型选择策略

智能法律解决方案需要根据不同的业务场景选择合适的AI模型：

#### 模型类型和应用场景

**1. 大语言模型（LLM）**
- **GPT-4**：
  - 适用场景：复杂法律分析、法律推理、报告生成
  - 优势：理解能力强，推理能力好，支持长文本
  - 劣势：成本较高，响应速度较慢
  - 使用场景：合同审查、法律分析、报告生成

- **Claude 3**：
  - 适用场景：长文档处理、法律文档审查
  - 优势：支持超长上下文（200K tokens），理解能力强
  - 劣势：成本较高
  - 使用场景：大型合同审查、长文档分析

- **通义千问**：
  - 适用场景：中文法律文本处理、成本敏感场景
  - 优势：中文理解好，成本较低，响应速度快
  - 劣势：推理能力相对较弱
  - 使用场景：法条匹配、案例检索、常规审查

- **本地部署模型（Qwen、ChatGLM等）**：
  - 适用场景：数据安全要求高、成本敏感场景
  - 优势：数据不出域，成本可控
  - 劣势：性能相对较弱，需要GPU资源
  - 使用场景：企业内部法律系统、敏感数据处理

**2. Embedding模型**
- **OpenAI text-embedding-3-large**：
  - 适用场景：高质量向量检索
  - 优势：检索准确率高，支持多语言
  - 劣势：成本较高
  - 使用场景：案例检索、法条匹配

- **法律领域微调模型（BGE-Legal等）**：
  - 适用场景：法律领域专业检索
  - 优势：对法律领域理解深入，检索准确率高
  - 劣势：需要训练和维护
  - 使用场景：法律知识库检索

**3. 分类模型**
- **BERT/RoBERTa法律领域微调**：
  - 适用场景：文档分类、实体识别
  - 优势：准确率高，速度快
  - 使用场景：合同类型分类、法律实体识别

#### 模型选择规则

**基于任务复杂度**：
- **简单任务**（法条匹配、关键词检索）：使用成本较低的模型（通义千问、本地模型）
- **中等任务**（合同审查、案例检索）：使用中等性能模型（GPT-3.5、Claude Haiku）
- **复杂任务**（法律分析、报告生成）：使用高性能模型（GPT-4、Claude Opus）

**基于数据敏感性**：
- **公开数据**：可以使用云端模型（GPT-4、Claude等）
- **敏感数据**：使用本地部署模型或私有化部署

**基于成本考虑**：
- **高频任务**：优先使用成本较低的模型
- **低频高价值任务**：可以使用成本较高的模型

**基于响应时间要求**：
- **实时任务**：优先使用响应速度快的模型
- **批量任务**：可以使用响应速度较慢但性能更好的模型

### 路由规则

#### 路由策略

**1. 基于任务类型的路由**
```yaml
routing_rules:
  - task_type: "contract_review"
    model: "gpt-4"
    fallback: "claude-3"
    conditions:
      - condition: "document_length > 10000"
        model: "claude-3"  # 长文档使用Claude
      - condition: "document_length < 1000"
        model: "qwen-plus"  # 短文档使用通义千问
  
  - task_type: "case_retrieval"
    model: "qwen-plus"
    fallback: "gpt-3.5-turbo"
    conditions:
      - condition: "query_complexity > 0.8"
        model: "gpt-4"  # 复杂查询使用GPT-4
  
  - task_type: "legal_analysis"
    model: "gpt-4"
    fallback: "claude-3"
    conditions:
      - condition: "analysis_depth == 'deep'"
        model: "gpt-4"
      - condition: "analysis_depth == 'standard'"
        model: "claude-3"
```

**2. 基于用户等级的路由**
- **VIP用户**：优先使用高性能模型（GPT-4、Claude Opus）
- **普通用户**：使用标准模型（GPT-3.5、通义千问）
- **免费用户**：使用成本较低的模型（本地模型）

**3. 基于负载的路由**
- **低负载**：使用高性能模型
- **高负载**：自动降级到成本较低的模型
- **负载均衡**：在多个模型实例间负载均衡

#### 路由实现

**路由服务架构**：
```python
from typing import Dict, Any
from enum import Enum

class ModelType(Enum):
    GPT4 = "gpt-4"
    CLAUDE3 = "claude-3"
    QWEN_PLUS = "qwen-plus"
    LOCAL_MODEL = "local-model"

class ModelRouter:
    def __init__(self):
        self.routing_rules = self._load_routing_rules()
        self.model_clients = self._init_model_clients()
    
    def route(self, task_type: str, **kwargs) -> ModelType:
        """根据任务类型和条件选择模型"""
        rule = self.routing_rules.get(task_type)
        if not rule:
            return ModelType.QWEN_PLUS  # 默认模型
        
        # 检查条件
        for condition in rule.get("conditions", []):
            if self._evaluate_condition(condition, kwargs):
                return ModelType(condition["model"])
        
        # 返回默认模型
        return ModelType(rule["model"])
    
    def _evaluate_condition(self, condition: Dict, kwargs: Dict) -> bool:
        """评估路由条件"""
        # 实现条件评估逻辑
        pass
```

### 负载均衡

#### 负载均衡策略

**1. 轮询（Round Robin）**
- 依次分配请求到各个模型实例
- 简单高效，适用于性能相近的实例

**2. 加权轮询（Weighted Round Robin）**
- 根据模型实例性能分配权重
- 高性能实例分配更多请求

**3. 最少连接（Least Connections）**
- 分配请求到连接数最少的实例
- 适用于长连接场景

**4. 响应时间（Response Time）**
- 分配请求到响应时间最短的实例
- 提升用户体验

#### 负载均衡实现

**使用Nginx进行负载均衡**：
```nginx
upstream llm_backend {
    least_conn;  # 最少连接策略
    server gpt4-instance1:8000 weight=3;
    server gpt4-instance2:8000 weight=3;
    server qwen-instance1:8000 weight=1;
    server qwen-instance2:8000 weight=1;
}

server {
    listen 80;
    location /api/llm {
        proxy_pass http://llm_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 4.2 Prompt工程化

### Prompt模板设计

#### 法律领域Prompt模板

**1. 合同审查Prompt模板**
```python
CONTRACT_REVIEW_PROMPT = """
你是一位经验丰富的法律专家，专门负责合同审查。

请审查以下合同，并完成以下任务：

1. **合同类型识别**：识别合同类型（如买卖合同、租赁合同、服务合同等）

2. **关键条款识别**：识别合同中的关键条款，包括：
   - 合同主体信息
   - 标的物或服务描述
   - 价格和支付方式
   - 履行期限和方式
   - 违约责任
   - 争议解决方式
   - 其他重要条款

3. **风险识别**：识别合同中的潜在风险，包括：
   - 法律风险：违反法律法规的条款
   - 商业风险：对己方不利的条款
   - 执行风险：难以执行的条款
   - 其他风险

4. **合规检查**：对照相关法律法规，检查合同合规性

5. **修改建议**：针对识别出的风险，提供具体的修改建议

**合同内容**：
{contract_content}

**标准模板**（可选）：
{standard_template}

**审查要求**：
- 风险等级：{risk_level}（高/中/低）
- 重点关注：{focus_areas}
- 输出格式：JSON格式

请按照以下JSON格式输出审查结果：
{{
    "contract_type": "合同类型",
    "key_clauses": [
        {{
            "clause_name": "条款名称",
            "clause_content": "条款内容",
            "clause_type": "条款类型"
        }}
    ],
    "risks": [
        {{
            "risk_type": "风险类型",
            "risk_level": "风险等级",
            "risk_description": "风险描述",
            "risk_location": "风险位置（条款编号或位置）",
            "suggestion": "修改建议"
        }}
    ],
    "compliance_check": {{
        "is_compliant": true/false,
        "violations": [
            {{
                "law_name": "违反的法律法规",
                "violation_description": "违反内容"
            }}
        ]
    }},
    "modification_suggestions": [
        {{
            "clause_location": "条款位置",
            "original_text": "原文",
            "suggested_text": "建议修改为",
            "reason": "修改原因"
        }}
    ]
}}
"""
```

**2. 案例检索Prompt模板**
```python
CASE_RETRIEVAL_PROMPT = """
你是一位法律检索专家，负责从案例库中检索相似案例。

**案情描述**：
{case_description}

**检索要求**：
- 案件类型：{case_type}
- 争议焦点：{dispute_focus}
- 关键事实：{key_facts}
- 检索数量：{retrieval_count}

**检索到的案例**：
{retrieved_cases}

请分析检索到的案例，并完成以下任务：

1. **案例相关性分析**：评估每个案例与当前案情的相关性（0-1分）

2. **案例相似度排序**：按照相似度对案例进行排序

3. **法条匹配**：为每个案例匹配相关的法律法规

4. **法律分析**：基于检索到的案例和法条，进行法律分析

请按照以下JSON格式输出：
{{
    "case_analysis": [
        {{
            "case_id": "案例ID",
            "case_name": "案例名称",
            "relevance_score": 0.95,
            "similarity_reasons": ["相似原因1", "相似原因2"],
            "relevant_laws": [
                {{
                    "law_name": "法律名称",
                    "article": "条文内容",
                    "applicability": "适用性分析"
                }}
            ],
            "legal_analysis": "法律分析"
        }}
    ],
    "summary": "检索总结"
}}
"""
```

**3. 法条匹配Prompt模板**
```python
LAW_MATCHING_PROMPT = """
你是一位法律专家，负责匹配相关的法律法规。

**法律问题**：
{legal_question}

**案件描述**（可选）：
{case_description}

**检索到的法条**：
{retrieved_laws}

请完成以下任务：

1. **法条相关性分析**：评估每个法条与法律问题的相关性

2. **法条适用性分析**：分析法条的适用性和适用条件

3. **法条冲突检查**：检查法条之间是否存在冲突

4. **法条优先级排序**：按照适用优先级对法条进行排序

5. **法律依据总结**：总结适用的法律依据

请按照以下JSON格式输出：
{{
    "matched_laws": [
        {{
            "law_name": "法律名称",
            "article_number": "条文编号",
            "article_content": "条文内容",
            "relevance_score": 0.95,
            "applicability": "适用性分析",
            "application_conditions": "适用条件",
            "priority": 1
        }}
    ],
    "law_conflicts": [
        {{
            "law1": "法律1",
            "law2": "法律2",
            "conflict_description": "冲突描述",
            "resolution": "解决建议"
        }}
    ],
    "legal_basis_summary": "法律依据总结"
}}
"""
```

### 版本管理

#### Prompt版本管理策略

**1. 语义版本控制**
- 使用语义版本号（如v1.0.0、v1.1.0等）
- 主版本号：重大变更（如Prompt结构变化）
- 次版本号：功能增加（如新增字段）
- 修订版本号：错误修复或优化

**2. 版本标签**
- **stable**：稳定版本，用于生产环境
- **beta**：测试版本，用于测试环境
- **experimental**：实验版本，用于A/B测试

**3. 版本对比**
- 支持不同版本Prompt的对比
- 可视化版本差异
- 支持版本回滚

#### Prompt版本管理实现

**Prompt版本存储**：
```python
class PromptVersion:
    def __init__(self, prompt_id: str, version: str, content: str, metadata: Dict):
        self.prompt_id = prompt_id
        self.version = version
        self.content = content
        self.metadata = metadata
        self.created_at = datetime.now()
    
    def to_dict(self):
        return {
            "prompt_id": self.prompt_id,
            "version": self.version,
            "content": self.content,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat()
        }
```

**Prompt版本管理服务**：
```python
class PromptVersionManager:
    def __init__(self):
        self.versions = {}  # {prompt_id: [versions]}
    
    def create_version(self, prompt_id: str, content: str, metadata: Dict):
        """创建新版本"""
        version = self._generate_version(prompt_id)
        prompt_version = PromptVersion(prompt_id, version, content, metadata)
        if prompt_id not in self.versions:
            self.versions[prompt_id] = []
        self.versions[prompt_id].append(prompt_version)
        return prompt_version
    
    def get_version(self, prompt_id: str, version: str = "latest"):
        """获取指定版本"""
        if version == "latest":
            return self.versions[prompt_id][-1]
        return next(v for v in self.versions[prompt_id] if v.version == version)
    
    def compare_versions(self, prompt_id: str, version1: str, version2: str):
        """对比两个版本"""
        v1 = self.get_version(prompt_id, version1)
        v2 = self.get_version(prompt_id, version2)
        return self._diff(v1.content, v2.content)
```

### A/B测试

#### A/B测试策略

**1. 测试目标**
- **准确率提升**：测试不同Prompt对准确率的影响
- **成本优化**：测试不同Prompt对成本的影响
- **响应时间优化**：测试不同Prompt对响应时间的影响

**2. 测试设计**
- **对照组**：使用当前生产版本的Prompt
- **实验组**：使用新版本的Prompt
- **分流比例**：通常50/50，或根据流量调整

**3. 测试指标**
- **准确率**：审查准确率、检索准确率、匹配准确率
- **用户满意度**：用户评分、NPS
- **业务指标**：审查效率、成本、响应时间

#### A/B测试实现

**A/B测试框架**：
```python
class ABTestManager:
    def __init__(self):
        self.experiments = {}
    
    def create_experiment(self, experiment_id: str, variants: List[Dict]):
        """创建A/B测试实验"""
        experiment = {
            "experiment_id": experiment_id,
            "variants": variants,
            "traffic_split": {v["id"]: v["traffic"] for v in variants},
            "metrics": [],
            "status": "running"
        }
        self.experiments[experiment_id] = experiment
        return experiment
    
    def get_variant(self, experiment_id: str, user_id: str):
        """为用户分配实验组"""
        experiment = self.experiments[experiment_id]
        # 基于用户ID的哈希值分配
        hash_value = hash(user_id) % 100
        cumulative = 0
        for variant_id, traffic in experiment["traffic_split"].items():
            cumulative += traffic
            if hash_value < cumulative:
                return variant_id
        return list(experiment["traffic_split"].keys())[0]
    
    def record_metric(self, experiment_id: str, variant_id: str, metric_name: str, value: float):
        """记录指标"""
        experiment = self.experiments[experiment_id]
        experiment["metrics"].append({
            "variant_id": variant_id,
            "metric_name": metric_name,
            "value": value,
            "timestamp": datetime.now()
        })
    
    def analyze_results(self, experiment_id: str):
        """分析A/B测试结果"""
        experiment = self.experiments[experiment_id]
        # 统计分析各组的指标
        # 计算显著性检验
        # 返回分析报告
        pass
```

## 4.3 微调与持续学习

### 微调策略

#### 法律领域模型微调

**1. 数据准备**
- **训练数据**：法律文档、案例、法条等
- **数据标注**：法律实体标注、关系标注、分类标注
- **数据质量**：确保数据准确性和完整性

**2. 微调方法**
- **全量微调（Full Fine-tuning）**：微调所有参数
- **LoRA微调**：只微调少量参数，成本低
- **Prompt Tuning**：只微调Prompt，成本最低

**3. 微调评估**
- **准确率**：在测试集上评估准确率
- **F1分数**：评估分类任务的F1分数
- **BLEU/ROUGE**：评估生成任务的质量

#### 微调实现

**使用LoRA进行微调**：
```python
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM, AutoTokenizer

# 加载基础模型
model = AutoModelForCausalLM.from_pretrained("qwen/Qwen-7B")
tokenizer = AutoTokenizer.from_pretrained("qwen/Qwen-7B")

# 配置LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,  # LoRA rank
    lora_alpha=32,
    lora_dropout=0.1,
    target_modules=["q_proj", "v_proj"]  # 目标模块
)

# 应用LoRA
model = get_peft_model(model, lora_config)

# 训练
# ... 训练代码 ...
```

### 持续学习流程

#### 持续学习策略

**1. 在线学习**
- 实时收集用户反馈
- 定期更新模型
- 快速适应新数据

**2. 增量学习**
- 基于新数据增量训练
- 保留历史知识
- 避免灾难性遗忘

**3. 主动学习**
- 识别高质量样本
- 优先标注和学习
- 提升学习效率

#### 持续学习流程

**1. 数据收集**
- 收集用户反馈数据
- 收集错误案例
- 收集新法律数据

**2. 数据标注**
- 人工标注高质量样本
- 使用半监督学习减少标注量
- 质量控制

**3. 模型训练**
- 增量训练模型
- 验证模型性能
- 对比基线模型

**4. 模型部署**
- A/B测试新模型
- 逐步推广
- 监控模型性能

### 模型评估

#### 评估指标

**1. 准确率指标**
- **准确率（Accuracy）**：整体准确率
- **精确率（Precision）**：正例预测准确率
- **召回率（Recall）**：正例识别率
- **F1分数**：精确率和召回率的调和平均

**2. 业务指标**
- **审查准确率**：合同审查准确率
- **检索准确率**：案例检索准确率
- **匹配准确率**：法条匹配准确率
- **用户满意度**：用户评分

**3. 性能指标**
- **响应时间**：平均响应时间
- **吞吐量**：每秒处理请求数
- **成本**：每次请求的成本

#### 模型评估实现

**评估框架**：
```python
class ModelEvaluator:
    def __init__(self):
        self.metrics = {}
    
    def evaluate(self, model, test_dataset, metrics: List[str]):
        """评估模型"""
        results = {}
        predictions = []
        ground_truth = []
        
        for sample in test_dataset:
            pred = model.predict(sample["input"])
            predictions.append(pred)
            ground_truth.append(sample["label"])
        
        # 计算指标
        if "accuracy" in metrics:
            results["accuracy"] = self._calculate_accuracy(predictions, ground_truth)
        if "f1" in metrics:
            results["f1"] = self._calculate_f1(predictions, ground_truth)
        if "precision" in metrics:
            results["precision"] = self._calculate_precision(predictions, ground_truth)
        if "recall" in metrics:
            results["recall"] = self._calculate_recall(predictions, ground_truth)
        
        return results
    
    def compare_models(self, models: List, test_dataset):
        """对比多个模型"""
        results = {}
        for model_name, model in models:
            results[model_name] = self.evaluate(model, test_dataset)
        return results
```
