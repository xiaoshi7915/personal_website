# 6. 接口与体验

## 6.1 API接口设计

### RESTful API规范

智能物流解决方案提供RESTful API接口，遵循RESTful设计原则：

#### API基础信息

- **Base URL**：`https://api.logistics.example.com/v1`
- **认证方式**：JWT Token（Bearer Token）
- **数据格式**：JSON
- **字符编码**：UTF-8

#### API版本管理

- **版本号**：`v1`、`v2`等
- **版本策略**：向后兼容，新版本不破坏旧版本接口
- **版本切换**：通过URL路径指定版本

### 核心API接口

#### 订单管理API

**1. 创建订单**
```http
POST /v1/orders
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "customer_id": "12345",
  "origin_address": "北京市海淀区中关村大街1号",
  "dest_address": "北京市朝阳区建国路88号",
  "weight": 10.5,
  "volume": 0.5,
  "delivery_time_window_start": "2024-01-01T10:00:00Z",
  "delivery_time_window_end": "2024-01-01T18:00:00Z",
  "priority": 1,
  "items": [
    {
      "sku_id": "SKU001",
      "quantity": 2,
      "weight": 5.0,
      "volume": 0.25
    }
  ]
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "order_id": "ORD202401010001",
    "order_no": "ORD202401010001",
    "status": "created",
    "created_at": "2024-01-01T09:00:00Z"
  }
}
```

**2. 查询订单**
```http
GET /v1/orders/{order_id}
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "order_id": "ORD202401010001",
    "order_no": "ORD202401010001",
    "customer_id": "12345",
    "origin_address": "北京市海淀区中关村大街1号",
    "dest_address": "北京市朝阳区建国路88号",
    "status": "in_transit",
    "current_location": {
      "lat": 39.983424,
      "lng": 116.316833,
      "address": "北京市海淀区..."
    },
    "estimated_arrival_time": "2024-01-01T15:00:00Z",
    "created_at": "2024-01-01T09:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z"
  }
}
```

**3. 更新订单**
```http
PUT /v1/orders/{order_id}
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "status": "delivered",
  "delivered_at": "2024-01-01T14:30:00Z"
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "order_id": "ORD202401010001",
    "status": "delivered",
    "updated_at": "2024-01-01T14:30:00Z"
  }
}
```

#### 路径规划API

**1. 路径规划**
```http
POST /v1/route-planning
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "order_ids": ["ORD202401010001", "ORD202401010002"],
  "vehicle_id": "VEH001",
  "driver_id": "DRV001",
  "optimization_target": "cost",  // cost, time, distance
  "constraints": {
    "max_distance": 100,
    "max_time": 480,
    "time_window": {
      "start": "2024-01-01T08:00:00Z",
      "end": "2024-01-01T18:00:00Z"
    }
  }
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "plan_id": "PLAN202401010001",
    "vehicle_id": "VEH001",
    "driver_id": "DRV001",
    "order_ids": ["ORD202401010001", "ORD202401010002"],
    "route": {
      "total_distance": 45.6,
      "total_time": 120,
      "total_cost": 156.8,
      "waypoints": [
        {
          "order_id": "ORD202401010001",
          "sequence": 1,
          "lat": 39.983424,
          "lng": 116.316833,
          "address": "北京市海淀区...",
          "estimated_arrival_time": "2024-01-01T10:30:00Z"
        },
        {
          "order_id": "ORD202401010002",
          "sequence": 2,
          "lat": 39.918276,
          "lng": 116.475442,
          "address": "北京市朝阳区...",
          "estimated_arrival_time": "2024-01-01T12:00:00Z"
        }
      ]
    },
    "created_at": "2024-01-01T09:00:00Z"
  }
}
```

**2. 查询路径规划**
```http
GET /v1/route-planning/{plan_id}
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "plan_id": "PLAN202401010001",
    "status": "completed",
    "route": {
      "total_distance": 45.6,
      "total_time": 120,
      "total_cost": 156.8,
      "waypoints": [...]
    },
    "created_at": "2024-01-01T09:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

#### 仓储管理API

**1. 查询库存**
```http
GET /v1/inventory
Authorization: Bearer {token}
Query Parameters:
  warehouse_id: 仓库ID
  sku_id: SKU ID（可选）

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "warehouse_id": "WH001",
    "inventory": [
      {
        "sku_id": "SKU001",
        "location_code": "A-01-02-03",
        "quantity": 100,
        "reserved_quantity": 20,
        "available_quantity": 80
      }
    ],
    "total_skus": 1000,
    "total_quantity": 50000
  }
}
```

**2. 生成拣货任务**
```http
POST /v1/picking-tasks
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "warehouse_id": "WH001",
  "order_ids": ["ORD202401010001", "ORD202401010002"],
  "optimization": true
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "task_id": "TASK202401010001",
    "warehouse_id": "WH001",
    "picking_items": [
      {
        "order_id": "ORD202401010001",
        "sku_id": "SKU001",
        "location_code": "A-01-02-03",
        "quantity": 2,
        "sequence": 1
      }
    ],
    "estimated_time": 30,
    "created_at": "2024-01-01T09:00:00Z"
  }
}
```

#### 风险预警API

**1. 查询风险预警**
```http
GET /v1/risk-alerts
Authorization: Bearer {token}
Query Parameters:
  alert_type: 预警类型（可选）
  alert_level: 预警等级（可选）
  status: 状态（可选）

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "alerts": [
      {
        "alert_id": "ALERT202401010001",
        "alert_type": "delay",
        "alert_level": "high",
        "related_order_id": "ORD202401010001",
        "related_vehicle_id": "VEH001",
        "alert_content": "订单ORD202401010001预计延误30分钟",
        "status": "active",
        "created_at": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 20
  }
}
```

**2. 创建风险预警**
```http
POST /v1/risk-alerts
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "alert_type": "delay",
  "alert_level": "high",
  "related_order_id": "ORD202401010001",
  "alert_content": "订单ORD202401010001预计延误30分钟",
  "suggestions": ["调整路径", "增加车辆"]
}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "alert_id": "ALERT202401010001",
    "status": "active",
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

### API错误处理

#### 错误码定义

- **200**：成功
- **400**：请求参数错误
- **401**：未授权
- **403**：禁止访问
- **404**：资源不存在
- **500**：服务器内部错误

#### 错误响应格式

```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "error_code": "INVALID_PARAMETER",
    "error_message": "订单ID不能为空",
    "error_details": {
      "field": "order_id",
      "reason": "required"
    }
  }
}
```

## 6.2 SDK开发

### Python SDK

#### SDK安装

```bash
pip install logistics-sdk
```

#### SDK使用示例

```python
from logistics_sdk import LogisticsClient

# 初始化客户端
client = LogisticsClient(
    api_key="your_api_key",
    base_url="https://api.logistics.example.com/v1"
)

# 创建订单
order = client.orders.create(
    customer_id="12345",
    origin_address="北京市海淀区中关村大街1号",
    dest_address="北京市朝阳区建国路88号",
    weight=10.5,
    volume=0.5,
    delivery_time_window_start="2024-01-01T10:00:00Z",
    delivery_time_window_end="2024-01-01T18:00:00Z"
)
print(f"订单创建成功：{order.order_no}")

# 查询订单
order_info = client.orders.get(order.order_id)
print(f"订单状态：{order_info.status}")

# 路径规划
route_plan = client.route_planning.create(
    order_ids=[order.order_id],
    vehicle_id="VEH001",
    driver_id="DRV001",
    optimization_target="cost"
)
print(f"路径规划完成：总距离{route_plan.route.total_distance}km")

# 查询库存
inventory = client.inventory.query(
    warehouse_id="WH001",
    sku_id="SKU001"
)
print(f"库存数量：{inventory.quantity}")

# 查询风险预警
alerts = client.risk_alerts.query(
    alert_type="delay",
    alert_level="high"
)
print(f"风险预警数量：{len(alerts)}")
```

### JavaScript SDK

#### SDK安装

```bash
npm install logistics-sdk
```

#### SDK使用示例

```javascript
const LogisticsClient = require('logistics-sdk');

// 初始化客户端
const client = new LogisticsClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.logistics.example.com/v1'
});

// 创建订单
const order = await client.orders.create({
  customer_id: '12345',
  origin_address: '北京市海淀区中关村大街1号',
  dest_address: '北京市朝阳区建国路88号',
  weight: 10.5,
  volume: 0.5,
  delivery_time_window_start: '2024-01-01T10:00:00Z',
  delivery_time_window_end: '2024-01-01T18:00:00Z'
});
console.log(`订单创建成功：${order.order_no}`);

// 查询订单
const orderInfo = await client.orders.get(order.order_id);
console.log(`订单状态：${orderInfo.status}`);

// 路径规划
const routePlan = await client.routePlanning.create({
  order_ids: [order.order_id],
  vehicle_id: 'VEH001',
  driver_id: 'DRV001',
  optimization_target: 'cost'
});
console.log(`路径规划完成：总距离${routePlan.route.total_distance}km`);

// 查询库存
const inventory = await client.inventory.query({
  warehouse_id: 'WH001',
  sku_id: 'SKU001'
});
console.log(`库存数量：${inventory.quantity}`);

// 查询风险预警
const alerts = await client.riskAlerts.query({
  alert_type: 'delay',
  alert_level: 'high'
});
console.log(`风险预警数量：${alerts.length}`);
```

## 6.3 用户体验设计

### Web管理端

#### 界面设计原则

- **简洁明了**：界面简洁，信息清晰
- **操作便捷**：操作流程简单，减少用户操作步骤
- **响应迅速**：界面响应速度快，提供加载提示
- **错误友好**：错误提示清晰，提供解决方案

#### 核心功能界面

**1. 调度管理界面**
- **路径规划**：订单选择 → 车辆选择 → 路径规划 → 方案确认
- **车辆调度**：车辆列表 → 任务分配 → 调度确认
- **订单管理**：订单列表 → 订单详情 → 订单操作

**2. 仓储管理界面**
- **库存管理**：库存查询 → 库存分析 → 库存调整
- **拣货管理**：拣货任务 → 拣货执行 → 拣货完成
- **仓储规划**：仓储布局 → 货位管理 → 布局优化

**3. 数据分析界面**
- **运营分析**：运营数据 → 数据可视化 → 分析报告
- **成本分析**：成本数据 → 成本分析 → 成本优化建议
- **效率分析**：效率数据 → 效率分析 → 效率提升建议

### 移动端APP

#### 界面设计原则

- **移动优先**：针对移动设备优化
- **操作简单**：操作流程简单，适合单手操作
- **离线支持**：支持离线操作，数据同步
- **实时更新**：实时更新数据，及时通知

#### 核心功能界面

**1. 配送任务界面**
- **任务列表**：任务列表 → 任务详情 → 任务操作
- **导航功能**：路径导航 → 实时位置 → 到达提醒
- **签收功能**：签收确认 → 异常上报 → 完成确认

**2. 消息通知界面**
- **消息列表**：消息列表 → 消息详情 → 消息操作
- **通知设置**：通知设置 → 通知类型 → 通知时间

### 数据大屏

#### 界面设计原则

- **信息丰富**：展示丰富的数据信息
- **可视化强**：使用图表、地图等可视化方式
- **实时更新**：实时更新数据，自动刷新
- **响应式设计**：适配不同屏幕尺寸

#### 核心展示内容

**1. 实时监控**
- **车辆位置**：地图展示车辆实时位置
- **订单状态**：订单状态统计和分布
- **配送进度**：配送进度实时更新

**2. 数据分析**
- **运营数据**：运营数据统计和趋势
- **成本数据**：成本数据分析和对比
- **效率数据**：效率数据分析和优化建议

**3. 预警信息**
- **风险预警**：风险预警列表和详情
- **异常告警**：异常告警信息
- **系统告警**：系统告警信息

## 6.4 接口性能优化

### 性能指标

- **响应时间**：API响应时间P95 < 500ms
- **吞吐量**：API吞吐量 > 1000 QPS
- **并发数**：支持并发数 > 1000
- **可用性**：API可用性 > 99.9%

### 优化策略

#### 缓存策略

- **Redis缓存**：热点数据缓存，减少数据库查询
- **CDN缓存**：静态资源缓存，加速访问
- **本地缓存**：客户端本地缓存，减少请求

#### 数据库优化

- **索引优化**：优化数据库索引，提升查询性能
- **查询优化**：优化SQL查询，减少查询时间
- **分库分表**：数据分库分表，提升并发性能

#### 异步处理

- **消息队列**：异步处理耗时任务，提升响应速度
- **任务队列**：任务队列处理，提升系统吞吐量

#### 负载均衡

- **API网关**：API网关负载均衡，提升系统可用性
- **服务集群**：服务集群部署，提升系统性能

