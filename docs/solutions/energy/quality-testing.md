# 7. 质量与测试

## 7.1 测试策略

### 测试金字塔

智能能源解决方案采用测试金字塔策略，从下到上包括：

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
from energy_ai.models.load_forecast import LoadForecastModel

class TestLoadForecastModel:
    """负荷预测模型单元测试"""
    
    @pytest.fixture
    def model(self):
        """创建模型实例"""
        return LoadForecastModel(model_path='models/load_forecast_v2.pkl')
    
    @pytest.fixture
    def sample_data(self):
        """创建测试数据"""
        return {
            'historical_load': [1000, 1100, 1200, 1300, 1400],
            'weather': {
                'temperature': [20, 22, 24, 26, 28],
                'humidity': [60, 65, 70, 75, 80]
            },
            'time_features': {
                'hour': [0, 1, 2, 3, 4],
                'day_of_week': [1, 1, 1, 1, 1],
                'is_holiday': [0, 0, 0, 0, 0]
            }
        }
    
    def test_forecast_normal_case(self, model, sample_data):
        """测试正常情况下的预测"""
        result = model.forecast(sample_data)
        assert result is not None
        assert 'forecast_values' in result
        assert len(result['forecast_values']) == 24  # 24小时预测
        assert all(v > 0 for v in result['forecast_values'])  # 负荷值应为正数
    
    def test_forecast_with_missing_data(self, model):
        """测试缺失数据情况"""
        incomplete_data = {
            'historical_load': [1000, None, 1200],  # 缺失数据
            'weather': {'temperature': [20, 22, 24]}
        }
        result = model.forecast(incomplete_data)
        # 应该能够处理缺失数据
        assert result is not None
    
    def test_forecast_with_extreme_values(self, model, sample_data):
        """测试极端值情况"""
        extreme_data = sample_data.copy()
        extreme_data['historical_load'] = [10000, 20000, 30000]  # 极端值
        result = model.forecast(extreme_data)
        # 应该能够处理极端值或给出警告
        assert result is not None
    
    def test_forecast_performance(self, model, sample_data):
        """测试预测性能"""
        import time
        start_time = time.time()
        result = model.forecast(sample_data)
        elapsed_time = time.time() - start_time
        # 预测时间应该小于1秒
        assert elapsed_time < 1.0
```

#### JavaScript单元测试

使用`Vitest`框架进行单元测试：

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { LoadForecastService } from '@/services/loadForecast';

describe('LoadForecastService', () => {
  let service;
  
  beforeEach(() => {
    service = new LoadForecastService({
      apiKey: 'test_api_key',
      baseURL: 'https://api.test.com/v1'
    });
  });
  
  it('should forecast load correctly', async () => {
    const result = await service.forecast({
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-02T00:00:00Z',
      region: '华东地区'
    });
    
    expect(result).toBeDefined();
    expect(result.data.forecastResults).toHaveLength(24);
    expect(result.data.forecastResults[0].loadMw).toBeGreaterThan(0);
  });
  
  it('should handle API errors', async () => {
    // Mock API error
    service.apiClient.get = jest.fn().mockRejectedValue(new Error('API Error'));
    
    await expect(
      service.forecast({
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-02T00:00:00Z',
        region: '华东地区'
      })
    ).rejects.toThrow('API Error');
  });
});
```

## 7.3 集成测试

### API集成测试

#### 使用pytest进行API测试

```python
import pytest
import requests
from energy_ai.test.fixtures import api_client, test_data

class TestLoadForecastAPI:
    """负荷预测API集成测试"""
    
    def test_load_forecast_api_success(self, api_client, test_data):
        """测试负荷预测API成功情况"""
        response = api_client.post('/v1/forecast/load', json={
            'start_time': test_data['start_time'],
            'end_time': test_data['end_time'],
            'region': '华东地区',
            'include_confidence': True
        })
        
        assert response.status_code == 200
        assert response.json()['code'] == 200
        assert 'forecast_results' in response.json()['data']
        assert len(response.json()['data']['forecast_results']) > 0
    
    def test_load_forecast_api_validation_error(self, api_client):
        """测试API参数验证错误"""
        response = api_client.post('/v1/forecast/load', json={
            'start_time': 'invalid_date',  # 无效日期
            'end_time': '2024-01-02T00:00:00Z',
            'region': '华东地区'
        })
        
        assert response.status_code == 400
        assert response.json()['code'] == 400
        assert 'error' in response.json()
    
    def test_load_forecast_api_authentication_error(self):
        """测试API认证错误"""
        response = requests.post(
            'https://api.energy.example.com/v1/forecast/load',
            json={
                'start_time': '2024-01-01T00:00:00Z',
                'end_time': '2024-01-02T00:00:00Z',
                'region': '华东地区'
            }
            # 缺少Authorization header
        )
        
        assert response.status_code == 401
        assert response.json()['code'] == 401
```

### 数据库集成测试

```python
import pytest
from energy_ai.database import get_db_session
from energy_ai.models import Equipment, MaintenanceRecord

class TestDatabaseIntegration:
    """数据库集成测试"""
    
    def test_equipment_query(self, db_session):
        """测试设备查询"""
        equipment = db_session.query(Equipment).filter_by(
            equipment_id='transformer_001'
        ).first()
        
        assert equipment is not None
        assert equipment.equipment_type == 'transformer'
    
    def test_maintenance_record_insert(self, db_session):
        """测试维护记录插入"""
        record = MaintenanceRecord(
            equipment_id='transformer_001',
            maintenance_type='preventive',
            maintenance_date='2024-01-01',
            maintenance_cost=50000
        )
        db_session.add(record)
        db_session.commit()
        
        saved_record = db_session.query(MaintenanceRecord).filter_by(
            equipment_id='transformer_001'
        ).order_by(MaintenanceRecord.maintenance_date.desc()).first()
        
        assert saved_record is not None
        assert saved_record.maintenance_type == 'preventive'
```

## 7.4 端到端测试

### E2E测试框架

使用`Playwright`进行端到端测试：

```python
import pytest
from playwright.sync_api import Page, expect

class TestEnergyManagementE2E:
    """能源管理端到端测试"""
    
    def test_load_forecast_workflow(self, page: Page):
        """测试负荷预测完整流程"""
        # 1. 登录
        page.goto('https://energy.example.com/login')
        page.fill('#username', 'test_user')
        page.fill('#password', 'test_password')
        page.click('#login-button')
        
        # 2. 导航到负荷预测页面
        page.click('#nav-forecast')
        page.click('#load-forecast')
        
        # 3. 输入预测参数
        page.fill('#start-time', '2024-01-01T00:00:00Z')
        page.fill('#end-time', '2024-01-02T00:00:00Z')
        page.select_option('#region', '华东地区')
        page.check('#include-confidence')
        
        # 4. 提交预测请求
        page.click('#submit-forecast')
        
        # 5. 等待预测结果
        expect(page.locator('#forecast-results')).to_be_visible(timeout=30000)
        
        # 6. 验证预测结果
        forecast_results = page.locator('.forecast-result-item')
        expect(forecast_results).to_have_count(24)  # 24小时预测
        
        # 7. 验证图表显示
        expect(page.locator('#forecast-chart')).to_be_visible()
    
    def test_equipment_monitoring_workflow(self, page: Page):
        """测试设备监控完整流程"""
        # 1. 登录
        page.goto('https://energy.example.com/login')
        page.fill('#username', 'test_user')
        page.fill('#password', 'test_password')
        page.click('#login-button')
        
        # 2. 导航到设备管理页面
        page.click('#nav-equipment')
        
        # 3. 选择设备
        page.click('#equipment-transformer_001')
        
        # 4. 查看设备详情
        expect(page.locator('#equipment-details')).to_be_visible()
        
        # 5. 查看监测数据
        page.click('#monitoring-data-tab')
        expect(page.locator('#monitoring-chart')).to_be_visible()
        
        # 6. 查看故障预测
        page.click('#failure-prediction-tab')
        expect(page.locator('#failure-probability')).to_be_visible()
        
        # 7. 查看维护建议
        expect(page.locator('#maintenance-recommendations')).to_be_visible()
```

## 7.5 性能测试

### 负载测试

使用`Locust`进行负载测试：

```python
from locust import HttpUser, task, between

class EnergyAPIUser(HttpUser):
    """能源API负载测试"""
    wait_time = between(1, 3)
    
    def on_start(self):
        """登录获取token"""
        response = self.client.post('/v1/auth/login', json={
            'username': 'test_user',
            'password': 'test_password'
        })
        self.token = response.json()['data']['token']
        self.headers = {'Authorization': f'Bearer {self.token}'}
    
    @task(3)
    def forecast_load(self):
        """负荷预测任务"""
        self.client.post(
            '/v1/forecast/load',
            json={
                'start_time': '2024-01-01T00:00:00Z',
                'end_time': '2024-01-02T00:00:00Z',
                'region': '华东地区'
            },
            headers=self.headers
        )
    
    @task(2)
    def predict_equipment_failure(self):
        """设备故障预测任务"""
        self.client.post(
            '/v1/prediction/equipment-failure',
            json={
                'equipment_id': 'transformer_001',
                'monitoring_data': {
                    'temperature': 75.5,
                    'vibration': 2.3
                }
            },
            headers=self.headers
        )
    
    @task(1)
    def optimize_dispatch(self):
        """调度优化任务"""
        self.client.post(
            '/v1/optimization/dispatch',
            json={
                'load_forecast': {'forecast_id': 'fc_001'},
                'renewable_forecast': {'forecast_id': 'fc_renewable_001'},
                'generators': []
            },
            headers=self.headers
        )
```

### 性能指标

#### API性能指标

- **响应时间**：
  - 简单查询API：< 500ms（P95）
  - 复杂计算API：< 5s（P95）
  
- **吞吐量**：
  - 负荷预测API：> 100 req/s
  - 设备故障预测API：> 200 req/s
  
- **并发能力**：
  - 支持1000+并发用户
  - 支持10000+并发请求

#### 系统性能指标

- **CPU使用率**：< 70%（正常负载）
- **内存使用率**：< 80%（正常负载）
- **磁盘IO**：< 80%（正常负载）
- **网络带宽**：< 70%（正常负载）

## 7.6 测试自动化

### CI/CD集成

#### GitHub Actions配置

```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-test:
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
          pip install -r requirements-test.txt
      - name: Run unit tests
        run: pytest tests/unit --cov=energy_ai --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
  
  integration-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-test.txt
      - name: Run integration tests
        run: pytest tests/integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
  
  e2e-test:
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
          pip install playwright
          playwright install
      - name: Run E2E tests
        run: pytest tests/e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-results
          path: test-results/
```

### 测试覆盖率

#### 覆盖率目标

- **单元测试覆盖率**：> 80%
- **集成测试覆盖率**：> 60%
- **关键路径覆盖率**：> 95%

#### 覆盖率报告

使用`pytest-cov`生成覆盖率报告：

```bash
pytest --cov=energy_ai --cov-report=html --cov-report=term
```

## 7.7 测试数据管理

### 测试数据准备

#### 模拟数据生成

```python
import factory
from energy_ai.models import Equipment, LoadData

class EquipmentFactory(factory.Factory):
    """设备工厂类"""
    class Meta:
        model = Equipment
    
    equipment_id = factory.Sequence(lambda n: f'transformer_{n:03d}')
    equipment_type = 'transformer'
    capacity_mw = factory.Faker('random_int', min=100, max=500)
    installation_date = factory.Faker('date_between', start_date='-10y', end_date='today')

class LoadDataFactory(factory.Factory):
    """负荷数据工厂类"""
    class Meta:
        model = LoadData
    
    timestamp = factory.Faker('date_time_between', start_date='-30d', end_date='now')
    load_mw = factory.Faker('random_int', min=1000, max=10000)
    region = factory.Faker('random_element', elements=['华东地区', '华南地区', '华北地区'])
```

### 测试环境隔离

- **独立测试数据库**：每个测试使用独立的测试数据库
- **测试数据清理**：测试结束后清理测试数据
- **Mock外部服务**：Mock外部API和服务，避免依赖

