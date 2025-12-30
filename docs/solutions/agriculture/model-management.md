# 4. 模型与提示词管理

## 4.1 多模型路由

### 模型选择策略

智能农业解决方案需要根据不同的业务场景选择合适的AI模型：

#### 模型类型和应用场景

**1. 图像识别模型**
- **ResNet/EfficientNet（农业领域微调）**：
  - 适用场景：病虫害识别、作物生长状态识别、成熟度检测
  - 优势：准确率高，速度快，支持多种作物
  - 劣势：需要大量标注数据
  - 使用场景：病虫害识别、作物监测

- **YOLO（目标检测）**：
  - 适用场景：成熟度检测、杂草识别、作物计数
  - 优势：实时性好，可以检测多个目标
  - 劣势：对小目标检测效果较差
  - 使用场景：收获规划、田间管理

- **语义分割模型（DeepLab、U-Net）**：
  - 适用场景：作物区域分割、病虫害区域识别
  - 优势：可以精确分割区域
  - 劣势：计算量大，速度较慢
  - 使用场景：精准农业、区域分析

**2. 时序预测模型**
- **LSTM/GRU**：
  - 适用场景：产量预测、生长趋势预测、气象预测
  - 优势：对时序数据建模能力强
  - 劣势：长期依赖建模能力有限
  - 使用场景：产量预测、生长预测

- **Transformer（时间序列）**：
  - 适用场景：长期产量预测、复杂时序模式识别
  - 优势：长期依赖建模能力强，准确率高
  - 劣势：计算量大，需要更多数据
  - 使用场景：长期预测、复杂模式识别

**3. 大语言模型（LLM）**
- **GPT-4**：
  - 适用场景：农业知识问答、报告生成、决策建议
  - 优势：理解能力强，推理能力好，支持长文本
  - 劣势：成本较高，响应速度较慢
  - 使用场景：农业咨询、报告生成

- **通义千问**：
  - 适用场景：中文农业文本处理、成本敏感场景
  - 优势：中文理解好，成本较低，响应速度快
  - 劣势：推理能力相对较弱
  - 使用场景：农业知识问答、文本分析

- **本地部署模型（Qwen、ChatGLM等）**：
  - 适用场景：数据安全要求高、成本敏感场景
  - 优势：数据不出域，成本可控
  - 劣势：性能相对较弱，需要GPU资源
  - 使用场景：企业内部农业系统、敏感数据处理

**4. Embedding模型**
- **OpenAI text-embedding-3-large**：
  - 适用场景：高质量向量检索
  - 优势：检索准确率高，支持多语言
  - 劣势：成本较高
  - 使用场景：农业知识库检索

- **农业领域微调模型（BGE-Agriculture等）**：
  - 适用场景：农业领域专业检索
  - 优势：对农业领域理解深入，检索准确率高
  - 劣势：需要训练和维护
  - 使用场景：农业知识库检索

#### 模型选择规则

**基于任务复杂度**：
- **简单任务**（病虫害识别、图像分类）：使用轻量级模型（ResNet、EfficientNet）
- **中等任务**（产量预测、生长预测）：使用中等性能模型（LSTM、Transformer）
- **复杂任务**（农业知识问答、报告生成）：使用高性能模型（GPT-4、Claude）

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
  - task_type: "pest_disease_identification"
    model: "resnet-agriculture"
    fallback: "efficientnet-agriculture"
    conditions:
      - image_quality > 0.8: "resnet-agriculture"
      - image_quality < 0.5: "efficientnet-agriculture"
  
  - task_type: "yield_prediction"
    model: "transformer-timeseries"
    fallback: "lstm"
    conditions:
      - prediction_horizon > 30: "transformer-timeseries"
      - prediction_horizon < 7: "lstm"
  
  - task_type: "agricultural_qa"
    model: "gpt-4"
    fallback: "qwen-plus"
    conditions:
      - query_complexity > 0.8: "gpt-4"
      - query_complexity < 0.5: "qwen-plus"
```

**2. 基于数据特征的路由**
```yaml
routing_rules:
  - data_type: "image"
    conditions:
      - image_size > 2048: "high_resolution_model"
      - image_size < 512: "lightweight_model"
      - crop_type == "rice": "rice_specialized_model"
      - crop_type == "wheat": "wheat_specialized_model"
  
  - data_type: "time_series"
    conditions:
      - sequence_length > 365: "long_sequence_model"
      - sequence_length < 30: "short_sequence_model"
```

**3. 基于负载的路由**
```yaml
routing_rules:
  - load_balancing:
      - current_load < 0.5: "primary_model"
      - current_load >= 0.5 and current_load < 0.8: "secondary_model"
      - current_load >= 0.8: "fallback_model"
```

## 4.2 提示词工程

### Prompt模板设计

#### 病虫害识别Prompt模板

```python
PEST_DISEASE_IDENTIFICATION_PROMPT = """
你是一位经验丰富的农业专家，专门负责病虫害识别。

请识别以下作物图片中的病虫害，并完成以下任务：

1. **病虫害类型识别**：识别病虫害的类型（如病害、虫害、生理性病害等）

2. **具体病虫害名称**：识别具体的病虫害名称（如稻瘟病、蚜虫、缺氮等）

3. **严重程度评估**：评估病虫害的严重程度（轻度、中度、重度）

4. **症状描述**：描述病虫害的症状特征

5. **防治建议**：提供具体的防治建议，包括：
   - 防治方法（农业防治、生物防治、化学防治）
   - 推荐农药（如适用）
   - 用药方案（用药量、用药时间、用药方法）
   - 注意事项

**图片信息**：
- 作物类型：{crop_type}
- 生长阶段：{growth_stage}
- 拍摄时间：{capture_time}
- 地理位置：{location}

**图片**：
{image_data}

请按照以下JSON格式输出识别结果：
{{
    "pest_disease_type": "病虫害类型",
    "pest_disease_name": "具体病虫害名称",
    "severity": "严重程度（轻度/中度/重度）",
    "severity_score": 0.75,
    "symptoms": "症状描述",
    "control_suggestions": {{
        "agricultural_control": "农业防治方法",
        "biological_control": "生物防治方法",
        "chemical_control": "化学防治方法",
        "recommended_pesticides": [
            {{
                "pesticide_name": "农药名称",
                "dosage": "用药量",
                "application_time": "用药时间",
                "application_method": "用药方法",
                "precautions": "注意事项"
            }}
        ]
    }},
    "confidence": 0.95
}}
"""
```

#### 产量预测Prompt模板

```python
YIELD_PREDICTION_PROMPT = """
你是一位农业数据分析专家，专门负责作物产量预测。

请基于以下数据预测作物产量，并完成以下任务：

1. **数据理解**：理解提供的传感器数据、气象数据、历史产量数据

2. **产量预测**：预测未来产量（单位：公斤/亩）

3. **预测依据**：说明预测的依据和关键因素

4. **不确定性分析**：分析预测的不确定性（如天气变化、病虫害风险等）

5. **管理建议**：基于预测结果，提供管理建议（如是否需要调整灌溉、施肥等）

**输入数据**：
- 作物类型：{crop_type}
- 品种：{variety}
- 种植面积：{area}亩
- 种植时间：{planting_date}
- 当前生长阶段：{growth_stage}

**传感器数据**（最近30天）：
{sensor_data}

**气象数据**（未来30天预测）：
{weather_forecast}

**历史产量数据**：
{historical_yield}

请按照以下JSON格式输出预测结果：
{{
    "predicted_yield": 650.5,
    "yield_unit": "公斤/亩",
    "prediction_confidence": 0.85,
    "prediction_basis": "预测依据说明",
    "key_factors": [
        {{
            "factor": "关键因素名称",
            "impact": "影响说明",
            "importance": 0.9
        }}
    ],
    "uncertainty_analysis": {{
        "weather_risk": "天气风险分析",
        "pest_disease_risk": "病虫害风险分析",
        "other_risks": "其他风险分析"
    }},
    "management_suggestions": [
        {{
            "suggestion_type": "建议类型（灌溉/施肥/病虫害防治等）",
            "suggestion_content": "具体建议内容",
            "priority": "优先级（高/中/低）"
        }}
    ]
}}
"""
```

#### 农业知识问答Prompt模板

```python
AGRICULTURAL_QA_PROMPT = """
你是一位农业专家，专门回答农业相关问题。

请基于提供的农业知识库，回答以下问题：

**用户问题**：
{user_question}

**检索到的相关知识**：
{retrieved_knowledge}

**上下文信息**：
- 作物类型：{crop_type}
- 地理位置：{location}
- 当前季节：{season}

请完成以下任务：

1. **问题理解**：理解用户问题的意图和关键信息

2. **知识检索**：从提供的知识库中检索相关信息

3. **答案生成**：基于检索到的知识，生成准确、详细的答案

4. **答案验证**：验证答案的准确性和完整性

5. **补充建议**：如适用，提供补充建议或相关资源

请按照以下格式输出答案：
{{
    "answer": "详细答案",
    "key_points": [
        "关键点1",
        "关键点2",
        "关键点3"
    ],
    "source_knowledge": [
        {{
            "knowledge_id": "知识ID",
            "relevance": 0.95,
            "excerpt": "相关知识片段"
        }}
    ],
    "additional_suggestions": [
        "补充建议1",
        "补充建议2"
    ],
    "confidence": 0.9
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
- 提升识别准确率
- 提升用户满意度
- 降低响应时间
- 降低成本

**2. 测试设计**
- **对照组**：使用当前版本的Prompt
- **实验组**：使用新版本的Prompt
- **分流比例**：50:50或90:10（根据风险调整）

**3. 测试指标**
- **准确率指标**：识别准确率、预测准确率
- **效率指标**：响应时间、处理速度
- **用户指标**：用户满意度、用户留存率

#### A/B测试实现

```python
class PromptABTest:
    def __init__(self):
        self.tests = {}
    
    def create_test(self, test_id: str, prompt_a: str, prompt_b: str, 
                    traffic_split: float = 0.5):
        """创建A/B测试"""
        test = {
            "test_id": test_id,
            "prompt_a": prompt_a,
            "prompt_b": prompt_b,
            "traffic_split": traffic_split,
            "results": {"a": [], "b": []}
        }
        self.tests[test_id] = test
        return test
    
    def route_request(self, test_id: str, user_id: str):
        """路由请求到A或B组"""
        test = self.tests[test_id]
        # 基于用户ID的哈希值决定分组
        hash_value = hash(user_id) % 100
        if hash_value < test["traffic_split"] * 100:
            return "a"
        else:
            return "b"
    
    def record_result(self, test_id: str, group: str, result: Dict):
        """记录测试结果"""
        self.tests[test_id]["results"][group].append(result)
    
    def analyze_results(self, test_id: str):
        """分析测试结果"""
        test = self.tests[test_id]
        results_a = test["results"]["a"]
        results_b = test["results"]["b"]
        
        # 计算指标
        accuracy_a = sum(r["accuracy"] for r in results_a) / len(results_a)
        accuracy_b = sum(r["accuracy"] for r in results_b) / len(results_b)
        
        return {
            "accuracy_a": accuracy_a,
            "accuracy_b": accuracy_b,
            "improvement": (accuracy_b - accuracy_a) / accuracy_a * 100,
            "statistical_significance": self._calculate_significance(results_a, results_b)
        }
```

## 4.3 模型监控与优化

### 模型性能监控

#### 监控指标

**1. 准确率指标**
- **识别准确率**：病虫害识别准确率、作物识别准确率
- **预测准确率**：产量预测准确率、生长预测准确率
- **目标值**：识别准确率≥90%，预测准确率≥85%

**2. 效率指标**
- **响应时间**：平均响应时间、P95响应时间、P99响应时间
- **吞吐量**：每秒处理请求数（QPS）
- **目标值**：平均响应时间≤5秒，QPS≥100

**3. 成本指标**
- **API调用成本**：每次API调用的成本
- **总成本**：每日/每月总成本
- **目标值**：单次调用成本≤0.1元

#### 监控实现

```python
class ModelMonitor:
    def __init__(self):
        self.metrics = {
            "accuracy": [],
            "latency": [],
            "cost": [],
            "errors": []
        }
    
    def record_accuracy(self, model_name: str, accuracy: float):
        """记录准确率"""
        self.metrics["accuracy"].append({
            "model": model_name,
            "accuracy": accuracy,
            "timestamp": datetime.now()
        })
    
    def record_latency(self, model_name: str, latency: float):
        """记录响应时间"""
        self.metrics["latency"].append({
            "model": model_name,
            "latency": latency,
            "timestamp": datetime.now()
        })
    
    def check_anomalies(self):
        """检查异常"""
        anomalies = []
        
        # 检查准确率下降
        recent_accuracy = [m["accuracy"] for m in self.metrics["accuracy"][-100:]]
        if len(recent_accuracy) > 0:
            avg_accuracy = sum(recent_accuracy) / len(recent_accuracy)
            if avg_accuracy < 0.85:  # 阈值
                anomalies.append({
                    "type": "accuracy_degradation",
                    "value": avg_accuracy,
                    "threshold": 0.85
                })
        
        # 检查响应时间增加
        recent_latency = [m["latency"] for m in self.metrics["latency"][-100:]]
        if len(recent_latency) > 0:
            avg_latency = sum(recent_latency) / len(recent_latency)
            if avg_latency > 10:  # 阈值（秒）
                anomalies.append({
                    "type": "latency_increase",
                    "value": avg_latency,
                    "threshold": 10
                })
        
        return anomalies
```

### 模型优化策略

#### 优化方向

**1. 准确率优化**
- **数据增强**：增加训练数据，提升模型泛化能力
- **模型微调**：在农业领域数据上微调模型
- **集成学习**：使用多个模型集成，提升准确率

**2. 效率优化**
- **模型压缩**：使用模型剪枝、量化等技术压缩模型
- **模型蒸馏**：使用大模型蒸馏小模型
- **缓存优化**：缓存常见查询结果

**3. 成本优化**
- **模型选择**：根据任务选择合适的模型，避免过度使用昂贵模型
- **批量处理**：批量处理请求，降低API调用成本
- **本地部署**：对高频任务使用本地部署模型

#### 优化流程

**1. 问题识别**
- 监控模型性能指标
- 识别性能瓶颈和问题

**2. 优化方案设计**
- 分析问题原因
- 设计优化方案

**3. 优化实施**
- 实施优化方案
- 进行A/B测试验证

**4. 效果评估**
- 评估优化效果
- 决定是否上线

**5. 持续监控**
- 持续监控模型性能
- 及时发现和解决问题

