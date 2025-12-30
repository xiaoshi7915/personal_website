# 4. 模型与提示词管理

## 4.1 多模型路由

### 模型选择策略

智能营销系统需要支持多个大语言模型，根据不同场景选择最优模型：

#### 模型池配置

**内容生成模型**：
- **GPT-4**：OpenAI最新模型，内容质量高，适合高质量营销文案生成，成本较高
- **Claude 3**：Anthropic模型，安全性好，适合品牌敏感内容生成
- **通义千问**：阿里云模型，中文优化，适合中文营销内容，成本适中
- **文心一言**：百度模型，中文理解好，API稳定，适合批量内容生成

**快速生成模型**：
- **GPT-3.5-turbo**：成本低，响应快，适合批量内容生成和A/B测试
- **通义千问Turbo**：快速版本，适合实时内容生成
- **ChatGLM3**：开源模型，可本地部署，数据安全

**专用模型**：
- **图像生成模型**：DALL-E、Midjourney、Stable Diffusion，用于营销海报生成
- **视频生成模型**：Runway、Pika，用于营销视频生成
- **语音合成模型**：Azure TTS、百度TTS，用于语音营销内容生成

**模型选择矩阵**：

| 场景 | 推荐模型 | 原因 |
|------|---------|------|
| 高质量营销文案 | GPT-4 | 内容质量高，创意好 |
| 批量内容生成 | GPT-3.5-turbo | 成本低，响应快 |
| 中文营销内容 | 通义千问/文心一言 | 中文优化，效果更好 |
| 品牌敏感内容 | Claude 3 | 安全性好，可控性强 |
| 实时内容生成 | GPT-3.5-turbo | 响应快，成本低 |
| 本地部署场景 | ChatGLM3 | 数据不出域，安全可控 |

#### 选择策略实现

**基于内容类型**：
```python
def select_model_by_content_type(content_type, quality_requirement):
    """
    根据内容类型选择模型
    """
    if content_type == "high_quality_copy":
        return "gpt-4"  # 高质量文案使用GPT-4
    elif content_type == "bulk_generation":
        return "gpt-3.5-turbo"  # 批量生成使用GPT-3.5
    elif content_type == "chinese_content":
        return "qwen-plus"  # 中文内容使用通义千问
    elif content_type == "brand_sensitive":
        return "claude-3"  # 品牌敏感内容使用Claude
    else:
        return "gpt-3.5-turbo"  # 默认使用GPT-3.5
```

**基于质量要求**：
```python
def select_model_by_quality(quality_level, budget):
    """
    根据质量要求和预算选择模型
    """
    if quality_level == "premium" and budget > 0.01:
        return "gpt-4"
    elif quality_level == "standard":
        return "gpt-3.5-turbo"
    elif quality_level == "fast" or budget < 0.001:
        return "qwen-turbo"
    else:
        return "gpt-3.5-turbo"
```

**基于平台特性**：
```python
def select_model_by_platform(platform, content_format):
    """
    根据平台特性选择模型
    """
    platform_models = {
        "wechat": "qwen-plus",  # 微信平台使用中文优化模型
        "douyin": "gpt-3.5-turbo",  # 抖音平台使用快速模型
        "weibo": "qwen-plus",  # 微博平台使用中文优化模型
        "xiaohongshu": "gpt-4",  # 小红书平台使用高质量模型
    }
    
    return platform_models.get(platform, "gpt-3.5-turbo")
```

### 路由规则

#### 路由规则配置

**规则1：按内容类型路由**
- 营销文案 → GPT-4（高质量）
- 批量内容 → GPT-3.5-turbo（成本低）
- 中文内容 → 通义千问/文心一言（中文优化）
- 品牌敏感内容 → Claude 3（安全性好）

**规则2：按用户等级路由**
- VIP客户 → GPT-4（高质量内容）
- 普通客户 → GPT-3.5-turbo（标准内容）
- 测试用户 → 本地模型（成本控制）

**规则3：按时间段路由**
- 高峰期 → GPT-3.5-turbo（高并发）
- 低峰期 → GPT-4（高质量）
- 夜间 → 本地模型（降低成本）

**规则4：按预算路由**
- 高预算活动 → GPT-4（高质量）
- 标准预算 → GPT-3.5-turbo（平衡）
- 低预算 → 通义千问Turbo（成本优化）

**实现示例**：
```python
class MarketingModelRouter:
    def __init__(self):
        self.rules = [
            {"condition": lambda req: req.content_type == "premium_copy", "model": "gpt-4"},
            {"condition": lambda req: req.content_type == "bulk_generation", "model": "gpt-3.5-turbo"},
            {"condition": lambda req: req.platform == "wechat", "model": "qwen-plus"},
            {"condition": lambda req: req.user_level == "VIP", "model": "gpt-4"},
            {"condition": lambda req: is_peak_hour(), "model": "gpt-3.5-turbo"},
            {"condition": lambda req: req.budget < 0.001, "model": "qwen-turbo"},
        ]
    
    def route(self, request):
        """
        根据规则路由到合适的模型
        """
        for rule in self.rules:
            if rule["condition"](request):
                return rule["model"]
        return "gpt-3.5-turbo"  # 默认模型
```

### 负载均衡

#### 负载均衡策略

**轮询策略**：多个模型实例轮询分配请求
**加权轮询**：根据模型性能分配权重
**最少连接**：优先分配给连接数最少的实例
**响应时间**：优先分配给响应时间最短的实例

**实现示例**：
```python
from collections import deque
import time

class ModelLoadBalancer:
    def __init__(self):
        self.instances = {
            "gpt-4": ["instance1", "instance2"],
            "gpt-3.5-turbo": ["instance3", "instance4", "instance5"],
        }
        self.current_index = {model: 0 for model in self.instances}
        self.response_times = {instance: [] for instances in self.instances.values() for instance in instances}
    
    def get_instance(self, model):
        """
        获取可用的模型实例
        """
        instances = self.instances[model]
        # 轮询策略
        instance = instances[self.current_index[model]]
        self.current_index[model] = (self.current_index[model] + 1) % len(instances)
        return instance
    
    def update_response_time(self, instance, response_time):
        """
        更新响应时间统计
        """
        self.response_times[instance].append(response_time)
        # 只保留最近100次记录
        if len(self.response_times[instance]) > 100:
            self.response_times[instance] = self.response_times[instance][-100:]
```

## 4.2 Prompt工程化

### Prompt模板设计

#### 内容生成Prompt模板

**营销文案生成模板**：
```python
MARKETING_COPY_TEMPLATE = """
你是一位资深的营销文案专家，擅长创作吸引人的营销文案。

产品信息：
- 产品名称：{product_name}
- 产品特点：{product_features}
- 目标受众：{target_audience}
- 营销目标：{marketing_goal}

平台要求：
- 平台：{platform}
- 字数限制：{word_limit}
- 风格要求：{style}

请生成一篇符合以下要求的营销文案：
1. 突出产品核心卖点
2. 吸引目标受众注意
3. 符合平台特性
4. 包含行动号召（CTA）

文案：
"""
```

**用户画像分析模板**：
```python
USER_PROFILE_TEMPLATE = """
你是一位资深的数据分析师，擅长分析用户行为数据。

用户数据：
- 基本信息：{basic_info}
- 行为数据：{behavior_data}
- 消费数据：{purchase_data}
- 互动数据：{interaction_data}

请分析该用户的：
1. 兴趣偏好
2. 消费能力
3. 购买意向
4. 推荐产品类别

分析结果：
"""
```

**广告优化建议模板**：
```python
AD_OPTIMIZATION_TEMPLATE = """
你是一位资深的广告优化专家，擅长优化广告效果。

广告数据：
- 广告ID：{ad_id}
- 关键词：{keywords}
- 点击率：{ctr}
- 转化率：{conversion_rate}
- ROI：{roi}

请提供优化建议：
1. 关键词优化建议
2. 创意优化建议
3. 出价策略建议
4. 预算分配建议

优化建议：
"""
```

#### Prompt版本管理

**版本命名规则**：
- 主版本号：重大变更（如模板结构变化）
- 次版本号：功能增强（如新增字段）
- 修订号：bug修复或小幅优化

**版本示例**：
- v1.0.0：初始版本
- v1.1.0：新增平台适配
- v1.1.1：修复格式问题

**版本管理实现**：
```python
class PromptVersionManager:
    def __init__(self):
        self.templates = {}
        self.versions = {}
    
    def register_template(self, template_name, template_content, version="1.0.0"):
        """
        注册Prompt模板
        """
        if template_name not in self.templates:
            self.templates[template_name] = {}
        
        self.templates[template_name][version] = template_content
        self.versions[template_name] = version
    
    def get_template(self, template_name, version=None):
        """
        获取Prompt模板
        """
        if version is None:
            version = self.versions.get(template_name, "latest")
        
        return self.templates[template_name][version]
    
    def list_versions(self, template_name):
        """
        列出所有版本
        """
        return list(self.templates[template_name].keys())
```

### A/B测试

#### A/B测试框架

**测试设计**：
- 对照组：使用原Prompt模板
- 实验组：使用新Prompt模板
- 分流比例：50:50或根据样本量调整

**测试指标**：
- 内容质量评分
- 用户互动率（点赞、评论、分享）
- 转化率
- ROI

**实现示例**：
```python
import random
from datetime import datetime, timedelta

class PromptABTest:
    def __init__(self):
        self.tests = {}
    
    def create_test(self, test_name, template_a, template_b, traffic_split=0.5):
        """
        创建A/B测试
        """
        self.tests[test_name] = {
            "template_a": template_a,
            "template_b": template_b,
            "traffic_split": traffic_split,
            "results_a": [],
            "results_b": [],
            "start_time": datetime.now()
        }
    
    def get_template(self, test_name, user_id):
        """
        根据用户ID分流
        """
        test = self.tests[test_name]
        # 基于用户ID的哈希值进行分流
        hash_value = hash(user_id) % 100
        if hash_value < test["traffic_split"] * 100:
            return test["template_a"]
        else:
            return test["template_b"]
    
    def record_result(self, test_name, template_version, metrics):
        """
        记录测试结果
        """
        test = self.tests[test_name]
        if template_version == "a":
            test["results_a"].append(metrics)
        else:
            test["results_b"].append(metrics)
    
    def get_test_results(self, test_name):
        """
        获取测试结果
        """
        test = self.tests[test_name]
        return {
            "template_a": {
                "count": len(test["results_a"]),
                "avg_quality": sum(r["quality"] for r in test["results_a"]) / len(test["results_a"]) if test["results_a"] else 0,
                "avg_conversion": sum(r["conversion"] for r in test["results_a"]) / len(test["results_a"]) if test["results_a"] else 0,
            },
            "template_b": {
                "count": len(test["results_b"]),
                "avg_quality": sum(r["quality"] for r in test["results_b"]) / len(test["results_b"]) if test["results_b"] else 0,
                "avg_conversion": sum(r["conversion"] for r in test["results_b"]) / len(test["results_b"]) if test["results_b"] else 0,
            }
        }
```

## 4.3 微调与持续学习

### 微调策略

#### 微调场景

**领域适配微调**：
- 针对特定行业（如电商、金融、教育）进行微调
- 使用行业特定数据训练
- 提升行业术语理解和内容生成质量

**品牌调性微调**：
- 针对特定品牌进行微调
- 学习品牌语言风格和调性
- 确保生成内容符合品牌形象

**微调实现示例**：
```python
from transformers import Trainer, TrainingArguments
from datasets import Dataset

def fine_tune_model(base_model, training_data, output_dir):
    """
    微调模型
    """
    # 准备训练数据
    dataset = Dataset.from_dict({
        "input": [item["input"] for item in training_data],
        "output": [item["output"] for item in training_data]
    })
    
    # 训练参数
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=4,
        learning_rate=2e-5,
        logging_steps=100,
        save_steps=500,
    )
    
    # 训练器
    trainer = Trainer(
        model=base_model,
        args=training_args,
        train_dataset=dataset,
    )
    
    # 开始训练
    trainer.train()
    
    # 保存模型
    trainer.save_model()
```

### 持续学习流程

#### 在线学习

**数据收集**：
- 收集用户反馈数据（点赞、评论、转化等）
- 收集内容效果数据（阅读量、互动率等）
- 收集A/B测试数据

**模型更新**：
- 定期使用新数据微调模型
- 增量学习，避免灾难性遗忘
- 版本控制，支持模型回滚

**实现示例**：
```python
class ContinuousLearning:
    def __init__(self, model, feedback_collector):
        self.model = model
        self.feedback_collector = feedback_collector
        self.update_interval = timedelta(days=7)  # 每周更新一次
        self.last_update = datetime.now()
    
    def collect_feedback(self):
        """
        收集用户反馈
        """
        feedback = self.feedback_collector.get_recent_feedback(
            since=self.last_update
        )
        return feedback
    
    def prepare_training_data(self, feedback):
        """
        准备训练数据
        """
        training_data = []
        for item in feedback:
            if item["rating"] >= 4:  # 只使用高质量反馈
                training_data.append({
                    "input": item["input"],
                    "output": item["expected_output"]
                })
        return training_data
    
    def update_model(self):
        """
        更新模型
        """
        if datetime.now() - self.last_update < self.update_interval:
            return
        
        # 收集反馈
        feedback = self.collect_feedback()
        
        if len(feedback) < 100:  # 至少需要100条反馈
            return
        
        # 准备训练数据
        training_data = self.prepare_training_data(feedback)
        
        # 微调模型
        fine_tune_model(self.model, training_data, "models/updated")
        
        # 更新最后更新时间
        self.last_update = datetime.now()
```

### 模型评估

#### 评估指标

**内容质量指标**：
- **BLEU分数**：评估生成内容与参考内容的相似度
- **ROUGE分数**：评估生成内容的召回率和准确率
- **人工评分**：人工评估内容质量（1-5分）

**业务指标**：
- **转化率**：内容带来的转化率
- **互动率**：用户互动率（点赞、评论、分享）
- **ROI**：内容投入产出比

**实现示例**：
```python
from nltk.translate.bleu_score import sentence_bleu
from rouge_score import rouge_scorer

class ModelEvaluator:
    def __init__(self):
        self.rouge_scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
    
    def evaluate_content_quality(self, generated, reference):
        """
        评估内容质量
        """
        # BLEU分数
        bleu_score = sentence_bleu([reference.split()], generated.split())
        
        # ROUGE分数
        rouge_scores = self.rouge_scorer.score(reference, generated)
        
        return {
            "bleu": bleu_score,
            "rouge1": rouge_scores["rouge1"].fmeasure,
            "rouge2": rouge_scores["rouge2"].fmeasure,
            "rougeL": rouge_scores["rougeL"].fmeasure,
        }
    
    def evaluate_business_metrics(self, content_id, metrics):
        """
        评估业务指标
        """
        return {
            "conversion_rate": metrics.get("conversions", 0) / metrics.get("impressions", 1),
            "engagement_rate": metrics.get("engagements", 0) / metrics.get("impressions", 1),
            "roi": metrics.get("revenue", 0) / metrics.get("cost", 1),
        }
```
