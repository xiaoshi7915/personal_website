# 7. 质量与测试

## 7.1 提示词单元测试

### 测试框架

智能交通解决方案使用专门的提示词测试框架，确保Prompt质量和稳定性：

#### 测试框架选择

**LangSmith**：
- LangChain官方测试框架
- 支持Prompt测试和评估
- 集成LangChain生态

**PromptTest**：
- 自定义测试框架
- 支持交通领域特定测试
- 集成CI/CD流程

#### 测试框架实现

```python
import pytest
from prompt_test import PromptTester, TestCase

class TransportationPromptTester(PromptTester):
    def __init__(self):
        super().__init__()
        self.test_cases = []
    
    def add_test_case(self, test_case: TestCase):
        """添加测试用例"""
        self.test_cases.append(test_case)
    
    def run_tests(self):
        """运行所有测试"""
        results = []
        for test_case in self.test_cases:
            result = self.run_single_test(test_case)
            results.append(result)
        return results
    
    def run_single_test(self, test_case: TestCase):
        """运行单个测试"""
        # 执行Prompt
        output = self.execute_prompt(test_case.prompt, test_case.input)
        
        # 评估结果
        score = self.evaluate(output, test_case.expected_output)
        
        return {
            "test_case": test_case.name,
            "passed": score >= test_case.threshold,
            "score": score,
            "output": output
        }
```

### 测试用例设计

#### 交通流量预测测试用例

**测试用例1：工作日早高峰预测**
```python
test_case_1 = TestCase(
    name="工作日早高峰预测",
    prompt=TRAFFIC_PREDICTION_PROMPT,
    input={
        "historical_data": [100, 120, 110, 130, 125],
        "time_horizon": 60,
        "day_type": "weekday",
        "time_period": "morning_rush"
    },
    expected_output={
        "predictions": [
            {
                "timestamp": "2024-01-15T08:00:00Z",
                "traffic_volume": 135,
                "confidence": 0.85
            }
        ],
        "factors": {
            "periodicity": "工作日早高峰",
            "trend": "上升趋势"
        }
    },
    threshold=0.8
)
```

**测试用例2：节假日预测**
```python
test_case_2 = TestCase(
    name="节假日预测",
    prompt=TRAFFIC_PREDICTION_PROMPT,
    input={
        "historical_data": [80, 90, 85, 95, 88],
        "time_horizon": 120,
        "day_type": "holiday",
        "weather": "sunny"
    },
    expected_output={
        "predictions": [
            {
                "timestamp": "2024-01-15T10:00:00Z",
                "traffic_volume": 100,
                "confidence": 0.75
            }
        ],
        "factors": {
            "periodicity": "节假日",
            "weather": "晴天，出行增加"
        }
    },
    threshold=0.75
)
```

#### 路径规划测试用例

**测试用例1：最短路径规划**
```python
test_case_3 = TestCase(
    name="最短路径规划",
    prompt=ROUTE_PLANNING_PROMPT,
    input={
        "origin": {"latitude": 39.9042, "longitude": 116.4074},
        "destination": {"latitude": 39.9080, "longitude": 116.3974},
        "optimization_objectives": ["distance"]
    },
    expected_output={
        "route": {
            "total_distance": 5200,
            "total_duration": 720,
            "steps": [
                {
                    "road_name": "长安街",
                    "distance": 2000
                }
            ]
        }
    },
    threshold=0.9
)
```

**测试用例2：避开拥堵路径规划**
```python
test_case_4 = TestCase(
    name="避开拥堵路径规划",
    prompt=ROUTE_PLANNING_PROMPT,
    input={
        "origin": {"latitude": 39.9042, "longitude": 116.4074},
        "destination": {"latitude": 39.9080, "longitude": 116.3974},
        "optimization_objectives": ["time"],
        "constraints": {"avoid_congestion": True}
    },
    expected_output={
        "route": {
            "total_distance": 6000,
            "total_duration": 600,
            "traffic_status": "smooth"
        }
    },
    threshold=0.85
)
```

## 7.2 模型评估

### 评估指标

#### 交通流量预测评估指标

**1. 准确率指标**
- **MAE（平均绝对误差）**：目标≤50辆/小时
- **RMSE（均方根误差）**：目标≤80辆/小时
- **MAPE（平均绝对百分比误差）**：目标≤10%

**2. 相关性指标**
- **相关系数（R）**：目标≥0.9
- **决定系数（R²）**：目标≥0.8

**3. 时间准确性**
- **预测时间误差**：目标≤5分钟

#### 路径规划评估指标

**1. 路径质量**
- **路径长度误差**：目标≤5%
- **路径时间误差**：目标≤10%
- **路径可行性**：目标≥95%

**2. 规划效率**
- **规划响应时间**：目标≤30秒
- **规划成功率**：目标≥98%

#### 停车位预测评估指标

**1. 预测准确率**
- **车位可用性预测准确率**：目标≥90%
- **占用率预测误差**：目标≤5%

**2. 时间准确性**
- **预测时间范围**：支持30分钟-2小时预测
- **预测时间误差**：目标≤10分钟

### 评估流程

**1. 数据准备**
- 准备测试数据集
- 划分训练集和测试集
- 数据标注和验证

**2. 模型评估**
- 使用测试数据集评估模型
- 计算各项评估指标
- 分析模型性能

**3. 结果分析**
- 分析模型优缺点
- 识别改进方向
- 生成评估报告

**4. 模型优化**
- 根据评估结果优化模型
- 重新训练和评估
- 持续改进

## 7.3 集成测试

### 测试场景

#### 场景1：完整出行规划流程

**测试步骤**：
1. 用户输入起点和终点
2. 系统获取实时路况
3. 系统规划多模态出行方案
4. 用户选择出行方案
5. 系统提供实时导航
6. 系统动态调整路线
7. 用户到达目的地

**验证点**：
- 数据获取是否正常
- 路径规划是否准确
- 导航指引是否清晰
- 路线调整是否及时

#### 场景2：停车管理流程

**测试步骤**：
1. 用户查询停车位
2. 系统预测停车位可用情况
3. 系统推荐最优停车位
4. 用户选择停车位
5. 系统提供导航指引
6. 用户到达停车场
7. 系统确认停车
8. 用户离开后系统结算

**验证点**：
- 停车位预测是否准确
- 推荐是否合理
- 导航是否准确
- 结算是否正确

#### 场景3：交通调度流程

**测试步骤**：
1. 系统检测到交通异常
2. 系统预测未来交通流量
3. 系统生成调度方案
4. 系统执行信号调整
5. 系统监控调度效果
6. 系统优化调度方案

**验证点**：
- 异常检测是否及时
- 预测是否准确
- 调度方案是否合理
- 效果监控是否有效

### 测试工具

#### 自动化测试框架

**1. pytest**
- Python测试框架
- 支持参数化测试
- 支持测试报告生成

**2. Locust**
- 性能测试工具
- 支持分布式测试
- 支持实时监控

**3. Selenium**
- Web自动化测试
- 支持浏览器测试
- 支持截图和录屏

## 7.4 E2E测试

### 测试用例

#### E2E测试用例1：用户出行规划

**前置条件**：
- 用户已注册并登录
- 系统正常运行
- 实时数据正常接入

**测试步骤**：
1. 用户打开出行规划页面
2. 用户输入起点"北京市朝阳区XX路"
3. 用户输入终点"北京市海淀区XX路"
4. 用户选择出发时间"明天上午8点"
5. 用户点击"规划路线"按钮
6. 系统显示多个出行方案
7. 用户选择推荐方案
8. 系统显示详细导航指引
9. 用户开始导航
10. 系统实时更新路线

**预期结果**：
- 系统在30秒内返回出行方案
- 出行方案包含多个选项
- 推荐方案合理（时间短、成本低）
- 导航指引清晰准确
- 路线更新及时

#### E2E测试用例2：停车位查询和导航

**前置条件**：
- 用户已注册并登录
- 系统正常运行
- 停车数据正常接入

**测试步骤**：
1. 用户打开停车查询页面
2. 用户输入目的地"XX商场"
3. 用户选择目标时间"今天下午2点"
4. 用户点击"查询停车位"按钮
5. 系统显示附近停车场列表
6. 用户选择推荐停车场
7. 系统显示停车场详情和导航
8. 用户点击"导航"按钮
9. 系统打开导航应用
10. 用户到达停车场
11. 系统确认停车

**预期结果**：
- 系统在10秒内返回停车位信息
- 停车位预测准确（误差≤10%）
- 推荐停车场合理（距离近、价格合理、可用车位充足）
- 导航准确
- 停车确认及时

### 测试执行

#### 测试环境

**1. 测试环境配置**
- 独立的测试环境
- 测试数据准备
- 测试工具配置

**2. 测试数据**
- 模拟真实交通数据
- 模拟用户行为
- 模拟异常场景

#### 测试报告

**1. 测试结果统计**
- 测试用例总数
- 通过用例数
- 失败用例数
- 通过率

**2. 问题记录**
- 问题描述
- 问题严重程度
- 问题复现步骤
- 问题修复状态

**3. 性能指标**
- 响应时间
- 吞吐量
- 错误率
- 资源使用率

## 7.5 持续测试

### CI/CD集成

#### GitHub Actions配置

```yaml
name: Transportation AI Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      - name: Run unit tests
        run: pytest tests/unit --cov=src --cov-report=xml
      - name: Run integration tests
        run: pytest tests/integration
      - name: Run E2E tests
        run: pytest tests/e2e
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

### 测试覆盖率

#### 覆盖率目标

- **单元测试覆盖率**：目标≥80%
- **集成测试覆盖率**：目标≥60%
- **E2E测试覆盖率**：目标≥40%

#### 覆盖率监控

- 使用pytest-cov监控测试覆盖率
- 集成到CI/CD流程
- 定期生成覆盖率报告

