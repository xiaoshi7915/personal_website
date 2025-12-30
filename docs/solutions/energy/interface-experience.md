# 6. 接口与体验

## 6.1 API接口设计

### RESTful API设计

#### 接口规范

- **基础URL**：`https://api.energy.example.com/v1`
- **认证方式**：Bearer Token（JWT）
- **数据格式**：JSON
- **字符编码**：UTF-8
- **HTTP方法**：GET、POST、PUT、DELETE、PATCH

#### 接口版本管理

- **URL版本控制**：`/v1/`, `/v2/`等
- **向后兼容**：新版本保持向后兼容
- **废弃通知**：提前通知接口废弃，提供迁移方案

### 核心API接口

#### 负荷预测API

```http
POST /v1/forecast/load
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-02T00:00:00Z",
  "region": "华东地区",
  "include_confidence": true,
  "model_version": "v2.3.1"
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "forecast_id": "fc_20240101_001",
    "forecast_results": [
      {
        "time": "2024-01-01T00:00:00Z",
        "load_mw": 12500.5,
        "confidence_interval": {
          "lower": 12000.0,
          "upper": 13000.0
        }
      }
    ],
    "metrics": {
      "mae": 150.2,
      "rmse": 200.5,
      "mape": 1.2
    }
  }
}
```

#### 新能源预测API

```http
POST /v1/forecast/renewable
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "energy_type": "wind",  // wind, solar
  "station_id": "wind_farm_001",
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-02T00:00:00Z",
  "include_uncertainty": true
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "forecast_id": "fc_renewable_20240101_001",
    "energy_type": "wind",
    "station_id": "wind_farm_001",
    "forecast_results": [
      {
        "time": "2024-01-01T00:00:00Z",
        "power_mw": 850.5,
        "uncertainty": {
          "p10": 800.0,
          "p50": 850.5,
          "p90": 900.0
        }
      }
    ],
    "metrics": {
      "mae": 45.2,
      "rmse": 60.5,
      "mape": 5.3
    }
  }
}
```

#### 设备故障预测API

```http
POST /v1/prediction/equipment-failure
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "equipment_id": "transformer_001",
  "equipment_type": "transformer",
  "monitoring_data": {
    "temperature": 75.5,
    "vibration": 2.3,
    "current": 500.0,
    "voltage": 220.0
  },
  "include_maintenance_recommendation": true
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "equipment_id": "transformer_001",
    "failure_probability": 0.15,
    "failure_type": "insulation_degradation",
    "predicted_failure_time": "2024-02-15T10:00:00Z",
    "risk_level": "medium",
    "remaining_useful_life": {
      "days": 45,
      "confidence": 0.85
    },
    "maintenance_recommendation": {
      "priority": "medium",
      "maintenance_type": "preventive",
      "recommended_actions": [
        "检查绝缘油质量",
        "进行局部放电检测",
        "清洁设备表面"
      ],
      "estimated_cost": 50000,
      "estimated_downtime_hours": 8
    }
  }
}
```

#### 调度优化API

```http
POST /v1/optimization/dispatch
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "load_forecast": {
    "forecast_id": "fc_20240101_001"
  },
  "renewable_forecast": {
    "forecast_id": "fc_renewable_20240101_001"
  },
  "generators": [
    {
      "generator_id": "gen_001",
      "min_power": 100,
      "max_power": 500,
      "cost_coefficient": 0.5
    }
  ],
  "constraints": {
    "voltage_range": [0.95, 1.05],
    "frequency_range": [49.8, 50.2],
    "thermal_limits": {}
  },
  "objectives": [
    "minimize_cost",
    "maximize_renewable_utilization"
  ]
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "optimization_id": "opt_20240101_001",
    "solution": {
      "generation_plan": [
        {
          "generator_id": "gen_001",
          "power_mw": 450.0,
          "start_time": "2024-01-01T00:00:00Z",
          "end_time": "2024-01-01T01:00:00Z"
        }
      ],
      "renewable_utilization": 0.95,
      "estimated_cost": 125000.0,
      "estimated_curtailment": 50.5
    },
    "feasibility": {
      "is_feasible": true,
      "violated_constraints": []
    },
    "optimization_metrics": {
      "computation_time": 12.5,
      "iterations": 150,
      "convergence": true
    }
  }
}
```

#### 能耗分析API

```http
POST /v1/analysis/energy-consumption
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "enterprise_id": "ent_001",
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-31T23:59:59Z",
  "analysis_type": "comprehensive",  // basic, comprehensive, detailed
  "include_recommendations": true
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "analysis_id": "ana_20240101_001",
    "enterprise_id": "ent_001",
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "consumption_summary": {
      "total_consumption_kwh": 1250000,
      "total_cost": 875000,
      "average_daily_consumption": 40322.6,
      "peak_consumption": 85000,
      "peak_time": "2024-01-15T14:00:00Z"
    },
    "consumption_trend": "increasing",
    "anomalies": [
      {
        "time": "2024-01-10T08:00:00Z",
        "consumption": 95000,
        "expected": 40000,
        "deviation": 137.5,
        "anomaly_type": "spike"
      }
    ],
    "energy_efficiency": {
      "efficiency_score": 0.75,
      "benchmark": 0.80,
      "improvement_potential": 0.05
    },
    "recommendations": [
      {
        "type": "equipment_upgrade",
        "description": "建议升级老旧设备，预计可节约15%能耗",
        "estimated_savings": 131250,
        "investment_cost": 500000,
        "payback_period_months": 6.9
      }
    ]
  }
}
```

### 批量处理API

#### 批量预测API

```http
POST /v1/batch/forecast
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "tasks": [
    {
      "task_id": "task_001",
      "type": "load_forecast",
      "parameters": {
        "start_time": "2024-01-01T00:00:00Z",
        "end_time": "2024-01-02T00:00:00Z",
        "region": "华东地区"
      }
    },
    {
      "task_id": "task_002",
      "type": "renewable_forecast",
      "parameters": {
        "energy_type": "wind",
        "station_id": "wind_farm_001",
        "start_time": "2024-01-01T00:00:00Z",
        "end_time": "2024-01-02T00:00:00Z"
      }
    }
  ],
  "callback_url": "https://callback.example.com/batch-result"
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "batch_id": "batch_20240101_001",
    "status": "processing",
    "total_tasks": 2,
    "completed_tasks": 0,
    "estimated_completion_time": "2024-01-01T01:00:00Z"
  }
}
```

### WebSocket实时数据API

#### 实时监控WebSocket

```javascript
// WebSocket连接
const ws = new WebSocket('wss://api.energy.example.com/v1/ws/monitor');

// 订阅设备监控数据
ws.send(JSON.stringify({
  action: 'subscribe',
  channels: ['equipment_status', 'grid_state'],
  equipment_ids: ['transformer_001', 'generator_001']
}));

// 接收实时数据
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  // {
  //   "channel": "equipment_status",
  //   "equipment_id": "transformer_001",
  //   "timestamp": "2024-01-01T12:00:00Z",
  //   "data": {
  //     "temperature": 75.5,
  //     "vibration": 2.3,
  //     "status": "normal"
  //   }
  // }
};
```

## 6.2 SDK开发

### Python SDK

#### 安装

```bash
pip install energy-ai-sdk
```

#### 使用示例

```python
from energy_ai_sdk import EnergyAIClient

# 初始化客户端
client = EnergyAIClient(
    api_key='your_api_key',
    base_url='https://api.energy.example.com/v1'
)

# 负荷预测
forecast_result = client.forecast.load(
    start_time='2024-01-01T00:00:00Z',
    end_time='2024-01-02T00:00:00Z',
    region='华东地区',
    include_confidence=True
)
print(f"预测负荷: {forecast_result.data.forecast_results[0].load_mw} MW")

# 设备故障预测
prediction_result = client.prediction.equipment_failure(
    equipment_id='transformer_001',
    monitoring_data={
        'temperature': 75.5,
        'vibration': 2.3,
        'current': 500.0,
        'voltage': 220.0
    },
    include_maintenance_recommendation=True
)
print(f"故障概率: {prediction_result.data.failure_probability}")
print(f"风险等级: {prediction_result.data.risk_level}")

# 调度优化
optimization_result = client.optimization.dispatch(
    load_forecast={'forecast_id': 'fc_20240101_001'},
    renewable_forecast={'forecast_id': 'fc_renewable_20240101_001'},
    generators=[
        {
            'generator_id': 'gen_001',
            'min_power': 100,
            'max_power': 500,
            'cost_coefficient': 0.5
        }
    ],
    constraints={
        'voltage_range': [0.95, 1.05],
        'frequency_range': [49.8, 50.2]
    },
    objectives=['minimize_cost', 'maximize_renewable_utilization']
)
print(f"优化成本: {optimization_result.data.solution.estimated_cost}")
```

### JavaScript SDK

#### 安装

```bash
npm install energy-ai-sdk
```

#### 使用示例

```javascript
import { EnergyAIClient } from 'energy-ai-sdk';

// 初始化客户端
const client = new EnergyAIClient({
  apiKey: 'your_api_key',
  baseURL: 'https://api.energy.example.com/v1'
});

// 负荷预测
const forecastResult = await client.forecast.load({
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-02T00:00:00Z',
  region: '华东地区',
  includeConfidence: true
});
console.log(`预测负荷: ${forecastResult.data.forecastResults[0].loadMw} MW`);

// 设备故障预测
const predictionResult = await client.prediction.equipmentFailure({
  equipmentId: 'transformer_001',
  monitoringData: {
    temperature: 75.5,
    vibration: 2.3,
    current: 500.0,
    voltage: 220.0
  },
  includeMaintenanceRecommendation: true
});
console.log(`故障概率: ${predictionResult.data.failureProbability}`);
console.log(`风险等级: ${predictionResult.data.riskLevel}`);
```

## 6.3 用户界面设计

### Web界面

#### 调度监控大屏

- **实时数据展示**：电网运行状态、负荷曲线、发电曲线
- **预测结果展示**：负荷预测、新能源预测结果
- **调度方案展示**：最优调度方案、执行状态
- **告警信息**：异常告警、故障告警

#### 设备管理界面

- **设备列表**：设备基本信息、运行状态
- **设备详情**：设备监测数据、历史记录
- **故障预测**：故障概率、风险等级、维护建议
- **维护计划**：维护任务、维护历史

#### 能耗分析界面

- **能耗概览**：总能耗、成本、趋势
- **能耗分析**：分项能耗、异常分析
- **节能建议**：节能方案、投资回报分析
- **报告导出**：分析报告导出

### 移动端界面

#### 移动App功能

- **实时监控**：设备状态、电网状态实时查看
- **告警推送**：异常告警、故障告警推送
- **移动审批**：调度方案、维护计划移动审批
- **数据查询**：历史数据、预测结果查询

## 6.4 用户体验优化

### 响应时间优化

- **API响应时间**：< 500ms（简单查询），< 5s（复杂计算）
- **页面加载时间**：< 2s
- **实时数据更新**：< 1s延迟

### 交互优化

- **操作反馈**：操作后立即反馈，显示加载状态
- **错误提示**：友好的错误提示，提供解决方案
- **操作引导**：新用户操作引导，帮助文档

### 数据可视化

- **图表展示**：使用ECharts、D3.js等库展示数据
- **交互式图表**：支持缩放、筛选、钻取
- **实时更新**：图表数据实时更新

