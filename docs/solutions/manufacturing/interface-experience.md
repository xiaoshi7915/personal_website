# 6. 接口与体验

## 6.1 开放API

### API设计

智能制造/工业4.0解决方案提供RESTful API接口，遵循REST设计原则：

#### API设计原则

- **资源导向**：API以资源为中心，使用名词而非动词
- **HTTP方法**：使用标准HTTP方法（GET、POST、PUT、DELETE）
- **状态码**：使用标准HTTP状态码
- **版本控制**：API版本通过URL路径或Header指定
- **统一格式**：请求和响应使用JSON格式

#### API端点设计

**生产调度API**：

```
POST /api/v1/production/schedule
  功能：智能生产调度
  请求体：
  {
    "order_id": "ORD123456",
    "product_type": "产品A",
    "quantity": 1000,
    "delivery_date": "2024-02-01",
    "priority": "high"
  }
  响应：
  {
    "schedule_id": "SCH789",
    "start_time": "2024-01-15T08:00:00Z",
    "end_time": "2024-01-20T18:00:00Z",
    "device_allocation": [
      {
        "device_id": "DEV001",
        "start_time": "2024-01-15T08:00:00Z",
        "end_time": "2024-01-18T18:00:00Z",
        "product": "产品A",
        "quantity": 1000
      }
    ],
    "utilization_rate": 0.85,
    "total_cost": 50000.00,
    "feasibility": true
  }

GET /api/v1/production/schedule/{schedule_id}
  功能：查询排产方案详情
  响应：
  {
    "schedule_id": "SCH789",
    "status": "executing",
    "progress": 0.65,
    "device_allocation": [...]
  }
```

**质量检测API**：

```
POST /api/v1/quality/inspect
  功能：智能质量检测
  请求体：
  {
    "product_id": "PROD123",
    "product_type": "产品A",
    "image_url": "https://example.com/images/prod123.jpg",
    "inspection_standard": "标准A"
  }
  响应：
  {
    "product_id": "PROD123",
    "inspection_result": "不合格",
    "defects": [
      {
        "defect_type": "划痕",
        "location": {
          "x": 100,
          "y": 200,
          "width": 50,
          "height": 30
        },
        "severity": "中等",
        "confidence": 0.95
      }
    ],
    "overall_quality_score": 0.75
  }

GET /api/v1/quality/inspection/{product_id}
  功能：查询检测历史
  响应：
  {
    "product_id": "PROD123",
    "inspection_history": [
      {
        "timestamp": "2024-01-15T10:00:00Z",
        "result": "不合格",
        "defects": [...]
      }
    ]
  }
```

**设备维护API**：

```
POST /api/v1/equipment/predict
  功能：设备故障预测
  请求体：
  {
    "device_id": "DEV001",
    "device_type": "CNC机床",
    "status_data": {
      "temperature": 75.5,
      "vibration": 2.3,
      "current": 15.2,
      "running_time": 7200
    }
  }
  响应：
  {
    "device_id": "DEV001",
    "health_score": 0.75,
    "failure_probability": 0.25,
    "predicted_failure_time": "2024-01-25T10:00:00Z",
    "maintenance_recommendation": {
      "maintenance_type": "预防性维护",
      "recommended_time": "2024-01-20T08:00:00Z",
      "maintenance_content": "更换轴承，清洁润滑系统",
      "urgency": "中"
    }
  }

GET /api/v1/equipment/status/{device_id}
  功能：查询设备状态
  响应：
  {
    "device_id": "DEV001",
    "status": "运行中",
    "health_score": 0.75,
    "last_maintenance": "2024-01-01T08:00:00Z",
    "next_maintenance": "2024-01-20T08:00:00Z"
  }
```

**供应链API**：

```
POST /api/v1/supply-chain/predict
  功能：需求预测
  请求体：
  {
    "product_type": "产品A",
    "date_range": {
      "start": "2024-02-01",
      "end": "2024-02-28"
    },
    "factors": ["历史销量", "市场趋势", "季节性"]
  }
  响应：
  {
    "product_type": "产品A",
    "predictions": [
      {
        "date": "2024-02-01",
        "predicted_demand": 1000,
        "confidence": 0.90
      }
    ],
    "total_demand": 28000,
    "recommended_inventory": 3500
  }

POST /api/v1/supply-chain/optimize
  功能：库存优化
  请求体：
  {
    "product_type": "产品A",
    "current_inventory": 2000,
    "predicted_demand": 28000,
    "lead_time": 7
  }
  响应：
  {
    "product_type": "产品A",
    "optimal_inventory": 3500,
    "reorder_point": 2000,
    "reorder_quantity": 1500,
    "cost_saving": 50000.00
  }
```

### API认证与授权

#### 认证机制

- **API Key认证**：
  - 使用API Key进行身份验证
  - API Key通过Header传递：`X-API-Key: {api-key}`
  - 适用于服务间调用

- **OAuth 2.0认证**：
  - 支持标准OAuth 2.0流程
  - 使用Bearer Token：`Authorization: Bearer {token}`
  - 适用于第三方应用集成

- **JWT Token认证**：
  - 使用JWT Token进行身份验证
  - Token通过Header传递：`Authorization: Bearer {jwt-token}`
  - Token包含用户信息和权限信息

#### 授权机制

- **基于角色的访问控制（RBAC）**：
  - 定义角色：管理员、生产调度员、质量检测员、设备维护工程师、供应链管理员
  - 分配权限：每个角色有特定的API访问权限
  - 权限检查：API调用时检查用户角色和权限

- **资源级权限控制**：
  - 用户可以访问自己负责的资源
  - 管理员可以访问所有资源
  - 支持资源分享和协作

## 6.2 用户界面设计

### Web界面

#### 生产调度平台

- **订单管理界面**：
  - 订单列表展示
  - 订单详情查看
  - 订单状态跟踪
  - 订单筛选和搜索

- **排产方案界面**：
  - 排产方案可视化展示（甘特图）
  - 资源分配展示
  - 方案对比和选择
  - 方案调整功能

- **生产监控大屏**：
  - 实时生产进度展示
  - 设备利用率展示
  - 生产指标统计
  - 异常告警展示

#### 质量检测平台

- **实时检测界面**：
  - 检测结果实时展示
  - 缺陷图像展示
  - 检测统计信息
  - 检测历史查询

- **质量分析报表**：
  - 质量趋势分析
  - 缺陷类型统计
  - 质量指标对比
  - 质量改进建议

#### 设备维护平台

- **设备状态监控大屏**：
  - 设备状态实时展示
  - 健康分数展示
  - 故障预警展示
  - 维护计划展示

- **维护管理界面**：
  - 维护计划管理
  - 维护历史查询
  - 维护成本统计
  - 维护效果分析

### 移动端界面

#### 移动应用功能

- **生产管理**：
  - 订单查看
  - 生产进度查询
  - 异常上报

- **质量检测**：
  - 检测结果查看
  - 缺陷拍照上传
  - 质量报告查看

- **设备维护**：
  - 设备状态查看
  - 维护任务接收
  - 维护记录上传

#### 移动应用设计

- **响应式设计**：适配不同屏幕尺寸
- **离线功能**：支持离线查看和操作
- **推送通知**：重要消息推送通知

## 6.3 多终端支持

### PC端

- **浏览器支持**：Chrome、Firefox、Safari、Edge
- **分辨率支持**：1920x1080及以上
- **功能完整**：所有功能完整支持

### 移动端

- **iOS应用**：支持iPhone和iPad
- **Android应用**：支持Android 8.0及以上
- **功能精简**：核心功能支持

### 平板端

- **iPad应用**：优化iPad体验
- **Android平板**：支持Android平板
- **功能完整**：大部分功能支持

## 6.4 用户体验优化

### 性能优化

- **页面加载优化**：
  - 代码分割和懒加载
  - 图片懒加载和压缩
  - CDN加速
  - 缓存策略

- **交互优化**：
  - 响应时间优化
  - 动画效果优化
  - 操作反馈优化

### 可访问性

- **无障碍设计**：
  - 支持键盘导航
  - 支持屏幕阅读器
  - 颜色对比度符合WCAG标准
  - 文字大小可调整

### 国际化支持

- **多语言支持**：
  - 中文（简体、繁体）
  - 英文
  - 日文
  - 其他语言（按需添加）

- **时区支持**：
  - 支持多时区显示
  - 自动时区转换

