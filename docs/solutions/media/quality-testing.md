# 7. 质量与测试

## 7.1 测试策略

### 测试金字塔

智能媒体/内容解决方案采用测试金字塔策略，从下到上包括：

- **单元测试**（70%）：测试各个组件和函数
- **集成测试**（20%）：测试组件间集成
- **端到端测试**（10%）：测试完整业务流程

### 测试类型

#### 功能测试

- **需求验证**：验证功能是否满足需求
- **边界测试**：测试边界条件和极端情况
- **异常测试**：测试异常处理和错误恢复

#### 性能测试

- **负载测试**：测试系统在正常负载下的性能
- **压力测试**：测试系统在极限负载下的表现
- **稳定性测试**：测试系统长时间运行的稳定性

#### 安全测试

- **身份认证测试**：测试用户身份认证
- **权限控制测试**：测试用户权限控制
- **数据安全测试**：测试数据加密和传输安全

#### 兼容性测试

- **浏览器兼容性**：测试不同浏览器的兼容性
- **设备兼容性**：测试不同设备的兼容性
- **数据格式兼容性**：测试不同数据格式的兼容性

## 7.2 单元测试

### 测试框架

#### Python单元测试

使用`pytest`框架进行单元测试：

```python
import pytest
from media_ai.models.content_generation import ContentGenerationModel

class TestContentGenerationModel:
    """内容生成模型单元测试"""
    
    @pytest.fixture
    def model(self):
        """创建模型实例"""
        return ContentGenerationModel(model_path='models/content_gen_v2.pkl')
    
    @pytest.fixture
    def sample_request(self):
        """创建测试请求"""
        return {
            'topic': '人工智能发展趋势',
            'style': '专业',
            'length': 2000,
            'audience': '技术人员'
        }
    
    def test_generate_content_normal_case(self, model, sample_request):
        """测试正常情况下的内容生成"""
        result = model.generate(sample_request)
        assert result is not None
        assert 'content' in result
        assert 'title' in result
        assert len(result['content']) > 0
        assert len(result['title']) > 0
    
    def test_generate_content_with_missing_fields(self, model):
        """测试缺失字段情况"""
        incomplete_request = {
            'topic': '人工智能发展趋势'
            # 缺少style、length、audience字段
        }
        result = model.generate(incomplete_request)
        # 应该能够处理缺失字段或使用默认值
        assert result is not None
    
    def test_generate_content_with_extreme_values(self, model, sample_request):
        """测试极端值情况"""
        extreme_request = sample_request.copy()
        extreme_request['length'] = 100000  # 极端长度
        result = model.generate(extreme_request)
        # 应该能够处理极端值或给出警告
        assert result is not None
    
    def test_generate_content_performance(self, model, sample_request):
        """测试性能"""
        import time
        start_time = time.time()
        result = model.generate(sample_request)
        end_time = time.time()
        elapsed_time = end_time - start_time
        # 生成时间应该在合理范围内（例如&lt;10秒）
        assert elapsed_time < 10
```

#### JavaScript单元测试

使用`Vitest`框架进行前端单元测试：

```javascript
import { describe, it, expect } from 'vitest'
import { generateTags } from '@/utils/tagGeneration'

describe('标签生成工具', () => {
  it('应该能够生成标签', async () => {
    const content = '这是一篇关于人工智能的文章'
    const tags = await generateTags(content)
    expect(tags).toBeDefined()
    expect(Array.isArray(tags)).toBe(true)
    expect(tags.length).toBeGreaterThan(0)
  })
  
  it('应该能够处理空内容', async () => {
    const content = ''
    const tags = await generateTags(content)
    expect(tags).toEqual([])
  })
  
  it('应该能够处理特殊字符', async () => {
    const content = '这是一篇包含特殊字符的文章！@#$%^&*()'
    const tags = await generateTags(content)
    expect(tags).toBeDefined()
  })
})
```

## 7.3 集成测试

### API集成测试

使用`pytest`和`httpx`进行API集成测试：

```python
import pytest
import httpx
from fastapi.testclient import TestClient
from media_ai.main import app

client = TestClient(app)

class TestContentAPI:
    """内容API集成测试"""
    
    def test_create_content(self):
        """测试内容创建API"""
        response = client.post(
            "/api/v1/content/create",
            json={
                "topic": "人工智能发展趋势",
                "style": "专业",
                "length": 2000,
                "audience": "技术人员",
                "type": "article"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "content_id" in data
        assert "title" in data
        assert "content" in data
    
    def test_get_content(self):
        """测试内容查询API"""
        # 先创建内容
        create_response = client.post(
            "/api/v1/content/create",
            json={
                "topic": "人工智能发展趋势",
                "style": "专业",
                "length": 2000,
                "audience": "技术人员",
                "type": "article"
            }
        )
        content_id = create_response.json()["content_id"]
        
        # 查询内容
        response = client.get(f"/api/v1/content/{content_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["content_id"] == content_id
    
    def test_moderate_content(self):
        """测试内容审核API"""
        # 先创建内容
        create_response = client.post(
            "/api/v1/content/create",
            json={
                "topic": "测试内容",
                "style": "专业",
                "length": 1000,
                "audience": "技术人员",
                "type": "article"
            }
        )
        content_id = create_response.json()["content_id"]
        
        # 审核内容
        response = client.post(
            "/api/v1/content/moderate",
            json={
                "content_id": content_id,
                "content": "待审核内容",
                "content_type": "text"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "moderation_result" in data
        assert "quality_score" in data
```

## 7.4 端到端测试

### E2E测试框架

使用`Playwright`进行端到端测试：

```javascript
import { test, expect } from '@playwright/test'

test.describe('内容创作流程', () => {
  test('应该能够创建和发布内容', async ({ page }) => {
    // 登录
    await page.goto('http://localhost:3000/login')
    await page.fill('#username', 'testuser')
    await page.fill('#password', 'testpass')
    await page.click('#login-button')
    
    // 导航到创作页面
    await page.goto('http://localhost:3000/content/create')
    
    // 填写创作表单
    await page.fill('#topic', '人工智能发展趋势')
    await page.selectOption('#style', '专业')
    await page.fill('#length', '2000')
    await page.selectOption('#audience', '技术人员')
    
    // 点击生成按钮
    await page.click('#generate-button')
    
    // 等待内容生成
    await page.waitForSelector('#content-preview', { timeout: 30000 })
    
    // 验证内容已生成
    const content = await page.textContent('#content-preview')
    expect(content).toBeTruthy()
    expect(content.length).toBeGreaterThan(0)
    
    // 生成标签
    await page.click('#generate-tags-button')
    await page.waitForSelector('#tags-list', { timeout: 10000 })
    
    // 发布内容
    await page.click('#publish-button')
    await page.waitForSelector('.success-message', { timeout: 10000 })
    
    // 验证发布成功
    const successMessage = await page.textContent('.success-message')
    expect(successMessage).toContain('发布成功')
  })
})
```

## 7.5 性能测试

### 负载测试

使用`Locust`进行负载测试：

```python
from locust import HttpUser, task, between

class ContentAPIUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def create_content(self):
        """创建内容任务"""
        self.client.post(
            "/api/v1/content/create",
            json={
                "topic": "人工智能发展趋势",
                "style": "专业",
                "length": 2000,
                "audience": "技术人员",
                "type": "article"
            }
        )
    
    @task(2)
    def get_content(self):
        """查询内容任务"""
        self.client.get("/api/v1/content/CONT123456")
    
    @task(1)
    def moderate_content(self):
        """审核内容任务"""
        self.client.post(
            "/api/v1/content/moderate",
            json={
                "content_id": "CONT123456",
                "content": "待审核内容",
                "content_type": "text"
            }
        )
```

### 性能指标

- **响应时间**：
  - P50响应时间：< 500ms
  - P95响应时间：< 2s
  - P99响应时间：< 5s

- **吞吐量**：
  - 内容创建：≥ 100 QPS
  - 内容审核：≥ 500 QPS
  - 内容推荐：≥ 1000 QPS

- **并发能力**：
  - 支持1000+并发用户
  - 支持10000+并发请求

## 7.6 模型测试

### 模型准确率测试

```python
import pytest
from media_ai.models.content_moderation import ContentModerationModel

class TestContentModerationModel:
    """内容审核模型测试"""
    
    @pytest.fixture
    def model(self):
        return ContentModerationModel(model_path='models/moderation_v2.pkl')
    
    @pytest.fixture
    def test_cases(self):
        """测试用例"""
        return [
            {
                'content': '这是一篇正常的文章',
                'expected_result': 'approved',
                'expected_quality_score': 4.0
            },
            {
                'content': '这是一篇违规内容',
                'expected_result': 'rejected',
                'expected_violation_type': 'spam'
            }
        ]
    
    def test_moderation_accuracy(self, model, test_cases):
        """测试审核准确率"""
        correct_count = 0
        total_count = len(test_cases)
        
        for test_case in test_cases:
            result = model.moderate(test_case['content'])
            if result['moderation_result'] == test_case['expected_result']:
                correct_count += 1
        
        accuracy = correct_count / total_count
        assert accuracy >= 0.95  # 准确率应该≥95%
```

### 模型性能测试

```python
def test_model_performance(self, model):
    """测试模型性能"""
    import time
    import numpy as np
    
    # 准备测试数据
    test_contents = ['测试内容' + str(i) for i in range(100)]
    
    # 测试推理时间
    start_time = time.time()
    for content in test_contents:
        model.moderate(content)
    end_time = time.time()
    
    avg_time = (end_time - start_time) / len(test_contents)
    assert avg_time < 0.1  # 平均推理时间应该&lt;100ms
    
    # 测试吞吐量
    throughput = len(test_contents) / (end_time - start_time)
    assert throughput >= 10  # 吞吐量应该≥10 QPS
```

## 7.7 测试覆盖率

### 覆盖率目标

- **单元测试覆盖率**：≥ 80%
- **集成测试覆盖率**：≥ 60%
- **端到端测试覆盖率**：≥ 40%

### 覆盖率报告

使用`pytest-cov`生成覆盖率报告：

```bash
pytest --cov=media_ai --cov-report=html
```

生成的HTML报告包含：
- 代码覆盖率统计
- 未覆盖代码行
- 覆盖率趋势图

