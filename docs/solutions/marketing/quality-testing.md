# 7. 质量与测试

## 7.1 提示词单元测试

### 测试框架

提示词单元测试是确保AI生成内容质量的关键环节：

#### 测试框架选择

**LangChain Evaluators**：
- LangChain提供的评估框架
- 支持多种评估指标
- 易于集成到现有系统

**自定义测试框架**：
- 基于项目需求定制
- 灵活度高
- 完全可控

#### 测试框架实现

**基础测试框架**：
```python
import unittest
from langchain.evaluators import QAEvalChain

class PromptTestCase(unittest.TestCase):
    def setUp(self):
        self.evaluator = QAEvalChain.from_llm(llm)
        self.test_cases = [
            {
                "input": {
                    "product_name": "护肤品",
                    "target_audience": "25-35岁女性"
                },
                "expected_output": "包含产品特点、目标受众、行动号召",
                "quality_criteria": ["相关性", "吸引力", "可读性"]
            }
        ]
    
    def test_content_quality(self):
        for case in self.test_cases:
            result = generate_content(case["input"])
            evaluation = self.evaluator.evaluate(
                prediction=result,
                reference=case["expected_output"]
            )
            self.assertGreater(evaluation["score"], 0.8)
```

### 测试用例设计

#### 测试用例类型

**1. 功能测试用例**
- **目标**：验证Prompt能否正确生成营销内容
- **示例**：
  - 输入：产品信息、目标受众
  - 期望：生成符合要求的营销文案
  - 验证：内容包含产品特点、目标受众、行动号召

**2. 质量测试用例**
- **目标**：验证生成内容的质量
- **示例**：
  - 输入：不同质量要求
  - 期望：生成内容符合质量要求
  - 验证：内容质量评分≥4.5/5.0

**3. 平台适配测试用例**
- **目标**：验证内容适配不同平台
- **示例**：
  - 输入：不同平台要求（微信、抖音、微博）
  - 期望：生成符合平台特性的内容
  - 验证：内容符合平台字数、风格要求

**4. 边界测试用例**
- **目标**：验证Prompt在边界情况下的表现
- **示例**：
  - 输入：空产品信息、超长描述、特殊字符
  - 期望：正确处理，不崩溃
  - 验证：返回合理内容或错误提示

### 自动化测试

**批量测试**：
```python
def batch_test_prompts(test_cases, prompt_template):
    """
    批量测试Prompt
    """
    results = []
    for case in test_cases:
        result = test_single_prompt(case, prompt_template)
        results.append(result)
    return results

def test_single_prompt(test_case, prompt_template):
    """
    测试单个Prompt
    """
    # 生成内容
    content = generate_content(test_case["input"], prompt_template)
    
    # 评估质量
    quality_score = evaluate_content_quality(content, test_case["criteria"])
    
    # 检查合规性
    compliance_check = check_compliance(content)
    
    return {
        "test_case": test_case,
        "content": content,
        "quality_score": quality_score,
        "compliance": compliance_check,
        "passed": quality_score >= 0.8 and compliance_check["passed"]
    }
```

## 7.2 端到端自动化

### E2E测试流程

**内容生成E2E测试**：
1. 创建内容生成请求
2. 调用内容生成API
3. 验证生成内容质量
4. 验证内容合规性
5. 验证内容存储

**用户画像E2E测试**：
1. 准备用户数据
2. 调用用户画像分析API
3. 验证画像准确性
4. 验证分群结果
5. 验证推荐结果

**营销活动E2E测试**：
1. 创建营销活动
2. 执行营销活动
3. 监控活动效果
4. 验证活动数据
5. 生成活动报告

### 测试覆盖

**功能覆盖**：
- 内容生成功能：100%
- 用户画像功能：100%
- 营销活动功能：100%
- 广告优化功能：100%

**场景覆盖**：
- 正常场景：100%
- 异常场景：80%
- 边界场景：70%

### 持续集成

**CI/CD流程**：
```yaml
# GitHub Actions配置
name: Marketing System CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run unit tests
        run: pytest tests/unit/
      - name: Run integration tests
        run: pytest tests/integration/
      - name: Run E2E tests
        run: pytest tests/e2e/
```

## 7.3 红蓝对抗

### 对抗测试方法

**内容质量对抗测试**：
- 测试AI生成内容的质量稳定性
- 测试不同输入下的内容质量
- 测试内容质量下降的检测能力

**合规性对抗测试**：
- 测试违规内容的检测能力
- 测试敏感内容的过滤能力
- 测试广告合规性检查能力

**安全性对抗测试**：
- 测试注入攻击的防护能力
- 测试数据泄露的防护能力
- 测试API滥用的防护能力

### 安全测试

**安全扫描**：
```python
# 使用Bandit进行安全扫描
# bandit -r marketing_system/

# 使用Safety检查依赖漏洞
# safety check
```

**渗透测试**：
- API安全测试
- 认证授权测试
- 数据安全测试
- 系统安全测试

### 性能测试

**负载测试**：
```python
import locust

class MarketingSystemUser(locust.HttpUser):
    @locust.task
    def generate_content(self):
        self.client.post("/content/generate", json={
            "content_type": "marketing_copy",
            "product_info": {"name": "护肤品"}
        })
    
    @locust.task
    def analyze_profile(self):
        self.client.post("/user-profile/analyze", json={
            "user_id": "user_123"
        })
```

**压力测试**：
- 测试系统最大并发能力
- 测试系统响应时间
- 测试系统资源使用

**稳定性测试**：
- 长时间运行测试
- 内存泄漏检测
- 资源泄漏检测
