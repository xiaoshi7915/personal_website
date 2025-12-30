# 7. 质量与测试

## 7.1 提示词单元测试

### 测试框架

智能零售/电商解决方案使用专门的提示词测试框架，确保Prompt的质量和稳定性：

#### 测试框架特性

- **自动化测试**：支持自动化测试Prompt
- **批量测试**：支持批量测试多个Prompt
- **结果评估**：自动评估测试结果
- **回归测试**：支持回归测试，检测Prompt变更影响

#### 测试框架实现

```python
class PromptTestFramework:
    def __init__(self, llm_client):
        self.llm_client = llm_client
        self.test_cases = []
    
    def add_test_case(self, test_case):
        """添加测试用例"""
        self.test_cases.append(test_case)
    
    def run_tests(self, prompt_template):
        """运行测试"""
        results = []
        for test_case in self.test_cases:
            # 构建Prompt
            prompt = prompt_template.format(**test_case.inputs)
            
            # 调用LLM
            response = self.llm_client.generate(prompt)
            
            # 评估结果
            evaluation = self.evaluate(response, test_case.expected)
            
            results.append({
                "test_case": test_case.name,
                "prompt": prompt,
                "response": response,
                "expected": test_case.expected,
                "evaluation": evaluation,
                "passed": evaluation["passed"]
            })
        
        return results
    
    def evaluate(self, response, expected):
        """评估测试结果"""
        # 检查是否包含期望的关键词
        keywords_match = all(
            keyword in response for keyword in expected.get("keywords", [])
        )
        
        # 检查格式是否正确
        format_match = self.check_format(response, expected.get("format"))
        
        # 计算相似度
        similarity = self.calculate_similarity(response, expected.get("text"))
        
        passed = keywords_match and format_match and similarity > 0.8
        
        return {
            "passed": passed,
            "keywords_match": keywords_match,
            "format_match": format_match,
            "similarity": similarity
        }
```

### 测试用例设计

#### 商品推荐Prompt测试用例

```python
test_cases = [
    {
        "name": "正常推荐测试",
        "inputs": {
            "user_id": "USER123",
            "user_profile": "电子产品爱好者",
            "browse_history": ["iPhone", "iPad"],
            "purchase_history": ["MacBook"]
        },
        "expected": {
            "keywords": ["iPhone", "iPad", "MacBook"],
            "format": "json",
            "min_products": 10
        }
    },
    {
        "name": "新用户推荐测试",
        "inputs": {
            "user_id": "NEW_USER",
            "user_profile": None,
            "browse_history": [],
            "purchase_history": []
        },
        "expected": {
            "keywords": ["热门", "推荐"],
            "format": "json",
            "min_products": 10
        }
    }
]
```

#### 智能客服Prompt测试用例

```python
test_cases = [
    {
        "name": "订单查询测试",
        "inputs": {
            "user_question": "我的订单什么时候发货？",
            "order_info": {"order_id": "ORDER123", "status": "待发货"}
        },
        "expected": {
            "keywords": ["订单", "发货"],
            "format": "json",
            "need_human": False
        }
    },
    {
        "name": "复杂问题测试",
        "inputs": {
            "user_question": "我想退货，但是商品已经使用了，可以退吗？",
            "order_info": None
        },
        "expected": {
            "keywords": ["退货", "政策"],
            "format": "json",
            "need_human": True
        }
    }
]
```

## 7.2 模型测试

### 推荐模型测试

- **准确率测试**：
  - 测试推荐准确率（Precision@K）
  - 测试召回率（Recall@K）
  - 测试F1分数

- **覆盖率测试**：
  - 测试推荐覆盖率
  - 测试长尾商品推荐率

- **多样性测试**：
  - 测试推荐多样性
  - 测试推荐新颖性

### 库存预测模型测试

- **预测准确率测试**：
  - 测试MAE（平均绝对误差）
  - 测试RMSE（均方根误差）
  - 测试MAPE（平均绝对百分比误差）

- **预测稳定性测试**：
  - 测试预测稳定性
  - 测试异常值处理能力

## 7.3 集成测试

### API集成测试

- **功能测试**：
  - 测试API功能正确性
  - 测试错误处理
  - 测试边界条件

- **性能测试**：
  - 测试API响应时间
  - 测试并发处理能力
  - 测试负载能力

### 端到端测试

- **业务流程测试**：
  - 测试完整业务流程
  - 测试异常流程处理
  - 测试数据一致性

## 7.4 A/B测试

### A/B测试框架

- **测试设计**：
  - 确定测试目标
  - 设计测试方案
  - 确定样本量

- **测试执行**：
  - 流量分配
  - 数据收集
  - 效果监控

- **结果分析**：
  - 统计分析
  - 显著性检验
  - 决策建议

### 推荐策略A/B测试

- **测试场景**：
  - 不同推荐算法对比
  - 不同推荐数量对比
  - 不同排序策略对比

- **评估指标**：
  - 点击率（CTR）
  - 转化率（CVR）
  - GMV提升

