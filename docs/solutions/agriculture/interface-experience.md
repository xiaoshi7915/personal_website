# 6. 接口与体验

## 6.1 开放API

### API设计

智能农业解决方案提供RESTful API接口，支持第三方系统集成：

#### 核心API接口

**1. 病虫害识别API**
```http
POST /api/v1/pest-disease/identify
Content-Type: multipart/form-data

{
  "image": "base64_encoded_image",
  "crop_type": "水稻|小麦|玉米",
  "growth_stage": "苗期|分蘖期|抽穗期",
  "location": "地理位置",
  "options": {
    "include_suggestions": true,
    "include_pesticide_recommendations": true
  }
}

Response:
{
  "task_id": "task_123456",
  "status": "processing|completed|failed",
  "result": {
    "pest_disease_type": "病虫害类型",
    "pest_disease_name": "具体病虫害名称",
    "severity": "严重程度",
    "severity_score": 0.75,
    "symptoms": "症状描述",
    "control_suggestions": {...},
    "confidence": 0.95
  }
}
```

**2. 作物监测API**
```http
POST /api/v1/crop/monitor
Content-Type: application/json

{
  "farmland_id": "farmland_123",
  "monitor_type": "growth|yield|health",
  "time_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "options": {
    "include_prediction": true,
    "include_suggestions": true
  }
}

Response:
{
  "monitor_result": {
    "growth_status": "正常|异常",
    "growth_score": 0.85,
    "anomalies": [...],
    "predictions": {...},
    "suggestions": [...]
  }
}
```

**3. 产量预测API**
```http
POST /api/v1/yield/predict
Content-Type: application/json

{
  "farmland_id": "farmland_123",
  "crop_type": "水稻",
  "variety": "品种名称",
  "sensor_data": {...},
  "weather_forecast": {...},
  "historical_yield": [...],
  "prediction_horizon": 30
}

Response:
{
  "predicted_yield": 650.5,
  "yield_unit": "公斤/亩",
  "prediction_confidence": 0.85,
  "prediction_basis": "预测依据",
  "key_factors": [...],
  "uncertainty_analysis": {...},
  "management_suggestions": [...]
}
```

**4. 灌溉决策API**
```http
POST /api/v1/irrigation/decide
Content-Type: application/json

{
  "farmland_id": "farmland_123",
  "soil_data": {
    "moisture": 0.45,
    "temperature": 25.5,
    "ph": 6.5
  },
  "weather_data": {...},
  "options": {
    "auto_control": false
  }
}

Response:
{
  "irrigation_needed": true,
  "irrigation_amount": 20.5,
  "irrigation_unit": "毫米",
  "irrigation_time": "2024-01-15T06:00:00Z",
  "irrigation_method": "滴灌|喷灌|沟灌",
  "reasoning": "决策依据"
}
```

## 6.2 多终端支持

### Web端

**技术栈**：
- Vue 3 + TypeScript + Vite
- TailwindCSS + Element Plus
- Pinia状态管理
- Axios HTTP客户端

**核心功能**：
- 农田管理：农田信息管理、农田地图展示
- 实时监测：实时数据展示、图表可视化
- 病虫害识别：图片上传、识别结果展示
- 报告查看：监测报告、分析报告查看和导出

### 移动端

**技术栈**：
- React Native / Flutter
- 原生功能集成（相机、GPS、推送通知）

**核心功能**：
- 快速识别：拍照识别病虫害
- 实时提醒：异常情况推送通知
- 田间记录：田间操作记录
- 离线功能：支持离线查看历史数据

### 小程序

**技术栈**：
- 微信小程序 / 支付宝小程序
- 小程序原生API

**核心功能**：
- 轻量级识别：快速识别病虫害
- 知识查询：农业知识查询
- 消息通知：重要消息推送

## 6.3 用户体验设计

### 界面设计原则

**1. 简洁明了**
- 界面布局清晰，信息层次分明
- 减少不必要的操作步骤
- 使用直观的图标和颜色

**2. 响应迅速**
- 优化加载速度，减少等待时间
- 提供加载状态提示
- 支持离线功能

**3. 易于使用**
- 操作流程简单，符合用户习惯
- 提供操作指引和帮助文档
- 支持语音输入和语音播报

### 交互设计

**1. 图片上传**
- 支持拍照和相册选择
- 实时预览和裁剪
- 批量上传支持

**2. 结果展示**
- 清晰展示识别结果
- 提供详细说明和建议
- 支持结果分享和导出

**3. 数据可视化**
- 使用图表展示数据趋势
- 支持多维度数据对比
- 交互式图表操作

