# 6. 接口与体验

## 6.1 开放API

### API设计

智能交通解决方案提供RESTful API接口，支持第三方系统集成：

#### 核心API接口

**1. 交通流量预测API**
```http
POST /api/v1/traffic/prediction
Content-Type: application/json

{
  "road_id": "road_12345",
  "time_horizon": 60,  # 预测时长（分钟）
  "prediction_time": "2024-01-15T08:00:00Z",
  "include_factors": true
}

Response:
{
  "prediction_id": "pred_123456",
  "road_id": "road_12345",
  "predictions": [
    {
      "timestamp": "2024-01-15T08:00:00Z",
      "traffic_volume": 1200,
      "speed": 45.5,
      "congestion_level": "moderate",
      "confidence": 0.92
    }
  ],
  "factors": {
    "periodicity": "工作日早高峰",
    "weather": "晴天，影响较小",
    "events": "无特殊事件"
  }
}
```

**2. 路径规划API**
```http
POST /api/v1/route/planning
Content-Type: application/json

{
  "origin": {
    "latitude": 39.9042,
    "longitude": 116.4074
  },
  "destination": {
    "latitude": 39.9080,
    "longitude": 116.3974
  },
  "optimization_objectives": ["time", "distance"],
  "constraints": {
    "avoid_tolls": false,
    "avoid_highways": false,
    "avoid_construction": true
  },
  "departure_time": "2024-01-15T08:00:00Z"
}

Response:
{
  "route_id": "route_123456",
  "origin": {...},
  "destination": {...},
  "routes": [
    {
      "route_index": 0,
      "distance": 5200,  # 米
      "duration": 720,  # 秒
      "steps": [
        {
          "step": 1,
          "road_name": "长安街",
          "distance": 2000,
          "duration": 300,
          "traffic_status": "smooth",
          "instruction": "沿长安街行驶2公里"
        }
      ],
      "traffic_summary": {
        "smooth": 3000,
        "slow": 1500,
        "congested": 700
      }
    }
  ],
  "recommendation": 0
}
```

**3. 停车位查询API**
```http
POST /api/v1/parking/query
Content-Type: application/json

{
  "location": {
    "latitude": 39.9042,
    "longitude": 116.4074
  },
  "radius": 1000,  # 米
  "target_time": "2024-01-15T10:00:00Z",
  "duration": 120  # 分钟
}

Response:
{
  "parking_lots": [
    {
      "parking_lot_id": "lot_12345",
      "name": "XX商场停车场",
      "location": {
        "latitude": 39.9045,
        "longitude": 116.4078
      },
      "distance": 300,  # 米
      "current_availability": 45,
      "total_spaces": 200,
      "predicted_availability": {
        "time": "2024-01-15T10:00:00Z",
        "available_spaces": 35,
        "confidence": 0.88
      },
      "pricing": {
        "hourly_rate": 5.0,
        "daily_max": 50.0
      },
      "features": ["indoor", "security", "ev_charging"]
    }
  ],
  "recommendations": [
    {
      "parking_lot_id": "lot_12345",
      "reason": "距离最近，价格合理，预测可用车位充足",
      "estimated_wait_time": 0
    }
  ]
}
```

**4. 多模态出行规划API**
```http
POST /api/v1/trip/planning
Content-Type: application/json

{
  "origin": {
    "latitude": 39.9042,
    "longitude": 116.4074,
    "address": "北京市朝阳区XX路XX号"
  },
  "destination": {
    "latitude": 39.9080,
    "longitude": 116.3974,
    "address": "北京市海淀区XX路XX号"
  },
  "departure_time": "2024-01-15T08:00:00Z",
  "preferences": {
    "priority": "time",  # time, cost, comfort
    "modes": ["driving", "public_transit", "bike", "walking"],
    "walking_max_distance": 1000,  # 米
    "transfer_max_count": 2
  }
}

Response:
{
  "trip_id": "trip_123456",
  "plans": [
    {
      "plan_id": "plan_1",
      "modes": ["driving"],
      "total_time": 720,  # 秒
      "total_cost": 15.0,  # 元
      "total_distance": 5200,  # 米
      "comfort_score": 0.9,
      "steps": [
        {
          "step": 1,
          "mode": "driving",
          "start": {...},
          "end": {...},
          "distance": 5200,
          "duration": 720,
          "cost": 15.0,
          "instruction": "沿长安街行驶5.2公里"
        }
      ]
    },
    {
      "plan_id": "plan_2",
      "modes": ["metro", "walking"],
      "total_time": 1800,
      "total_cost": 6.0,
      "total_distance": 8500,
      "comfort_score": 0.7,
      "steps": [
        {
          "step": 1,
          "mode": "walking",
          "start": {...},
          "end": {...},
          "distance": 500,
          "duration": 600,
          "instruction": "步行500米到地铁站"
        },
        {
          "step": 2,
          "mode": "metro",
          "start": {...},
          "end": {...},
          "distance": 8000,
          "duration": 1200,
          "cost": 6.0,
          "instruction": "乘坐地铁1号线，8站后下车"
        }
      ]
    }
  ],
  "recommendation": {
    "plan_id": "plan_1",
    "reason": "时间最短，舒适度最高"
  }
}
```

**5. 安全预警API**
```http
POST /api/v1/safety/warning
Content-Type: application/json

{
  "location": {
    "latitude": 39.9042,
    "longitude": 116.4074
  },
  "radius": 500,  # 米
  "warning_types": ["accident", "congestion", "weather"]
}

Response:
{
  "warnings": [
    {
      "warning_id": "warn_123456",
      "type": "accident",
      "severity": "high",
      "location": {
        "latitude": 39.9045,
        "longitude": 116.4078
      },
      "distance": 300,  # 米
      "description": "前方300米发生交通事故，建议绕行",
      "detected_time": "2024-01-15T08:00:00Z",
      "estimated_duration": 1800,  # 秒
      "suggested_route": {
        "alternative_route": [...],
        "additional_time": 300  # 秒
      }
    }
  ]
}
```

### API认证授权

#### API Key认证

```http
GET /api/v1/traffic/prediction
Authorization: Bearer {api_key}
X-API-Key: {api_key}
```

#### OAuth 2.0认证

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id={client_id}&
client_secret={client_secret}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### API限流

#### 限流规则

- **免费用户**：100请求/小时
- **标准用户**：1000请求/小时
- **企业用户**：10000请求/小时

#### 限流响应

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642233600

{
  "error": "Rate limit exceeded",
  "message": "请求频率超过限制，请稍后再试",
  "retry_after": 3600
}
```

## 6.2 SDK集成

### Python SDK

**安装**：
```bash
pip install transportation-ai-sdk
```

**使用示例**：
```python
from transportation_ai_sdk import TransportationAIClient

# 初始化客户端
client = TransportationAIClient(
    api_key="your_api_key",
    base_url="https://api.transportation-ai.com"
)

# 交通流量预测
prediction = client.traffic.prediction(
    road_id="road_12345",
    time_horizon=60,
    prediction_time="2024-01-15T08:00:00Z"
)

# 路径规划
route = client.route.planning(
    origin={"latitude": 39.9042, "longitude": 116.4074},
    destination={"latitude": 39.9080, "longitude": 116.3974},
    optimization_objectives=["time", "distance"]
)

# 停车位查询
parking = client.parking.query(
    location={"latitude": 39.9042, "longitude": 116.4074},
    radius=1000,
    target_time="2024-01-15T10:00:00Z"
)
```

### JavaScript SDK

**安装**：
```bash
npm install transportation-ai-sdk
```

**使用示例**：
```javascript
import { TransportationAIClient } from 'transportation-ai-sdk';

// 初始化客户端
const client = new TransportationAIClient({
  apiKey: 'your_api_key',
  baseURL: 'https://api.transportation-ai.com'
});

// 交通流量预测
const prediction = await client.traffic.prediction({
  roadId: 'road_12345',
  timeHorizon: 60,
  predictionTime: '2024-01-15T08:00:00Z'
});

// 路径规划
const route = await client.route.planning({
  origin: { latitude: 39.9042, longitude: 116.4074 },
  destination: { latitude: 39.9080, longitude: 116.3974 },
  optimizationObjectives: ['time', 'distance']
});
```

### Java SDK

**Maven依赖**：
```xml
<dependency>
    <groupId>com.transportationai</groupId>
    <artifactId>transportation-ai-sdk</artifactId>
    <version&gt;1.0.0</version>
</dependency>
```

**使用示例**：
```java
import com.transportationai.sdk.TransportationAIClient;
import com.transportationai.sdk.models.*;

// 初始化客户端
TransportationAIClient client = new TransportationAIClient.Builder()
    .apiKey("your_api_key")
    .baseURL("https://api.transportation-ai.com")
    .build();

// 交通流量预测
TrafficPredictionRequest request = new TrafficPredictionRequest();
request.setRoadId("road_12345");
request.setTimeHorizon(60);
TrafficPredictionResponse response = client.traffic().prediction(request);
```

## 6.3 Web组件集成

### React组件

**安装**：
```bash
npm install @transportation-ai/react-components
```

**使用示例**：
```jsx
import { RoutePlanner, ParkingFinder, TrafficMap } from '@transportation-ai/react-components';

function App() {
  return (
    <div>
      <RoutePlanner
        apiKey="your_api_key"
        onRouteSelected={(route) => console.log(route)}
      />
      <ParkingFinder
        apiKey="your_api_key"
        location={{ latitude: 39.9042, longitude: 116.4074 }}
      />
      <TrafficMap
        apiKey="your_api_key"
        center={{ latitude: 39.9042, longitude: 116.4074 }}
        zoom={13}
      />
    </div>
  );
}
```

### Vue组件

**安装**：
```bash
npm install @transportation-ai/vue-components
```

**使用示例**：
```vue
<template>
  <div>
    <RoutePlanner
      :api-key="apiKey"
      @route-selected="handleRouteSelected"
    />
    <ParkingFinder
      :api-key="apiKey"
      :location="location"
    />
  </div>
</template>

<script>
import { RoutePlanner, ParkingFinder } from '@transportation-ai/vue-components';

export default {
  components: {
    RoutePlanner,
    ParkingFinder
  },
  data() {
    return {
      apiKey: 'your_api_key',
      location: { latitude: 39.9042, longitude: 116.4074 }
    };
  },
  methods: {
    handleRouteSelected(route) {
      console.log(route);
    }
  }
};
</script>
```

## 6.4 移动端集成

### iOS SDK

**安装**：
```ruby
pod 'TransportationAISDK', '~> 1.0.0'
```

**使用示例**：
```swift
import TransportationAISDK

let client = TransportationAIClient(apiKey: "your_api_key")

// 路径规划
let request = RoutePlanningRequest(
    origin: Location(latitude: 39.9042, longitude: 116.4074),
    destination: Location(latitude: 39.9080, longitude: 116.3974)
)
client.planRoute(request) { result in
    switch result {
    case .success(let route):
        print(route)
    case .failure(let error):
        print(error)
    }
}
```

### Android SDK

**Gradle依赖**：
```gradle
dependencies {
    implementation 'com.transportationai:sdk:1.0.0'
}
```

**使用示例**：
```kotlin
import com.transportationai.sdk.TransportationAIClient

val client = TransportationAIClient(apiKey = "your_api_key")

// 路径规划
val request = RoutePlanningRequest(
    origin = Location(39.9042, 116.4074),
    destination = Location(39.9080, 116.3974)
)
client.planRoute(request) { result ->
    when (result) {
        is Result.Success -> println(result.data)
        is Result.Error -> println(result.error)
    }
}
```

## 6.5 用户体验设计

### 界面设计原则

**1. 简洁明了**
- 界面布局清晰，信息层次分明
- 减少不必要的操作步骤
- 提供清晰的操作反馈

**2. 实时更新**
- 实时显示交通状况
- 动态更新路径规划
- 及时推送安全预警

**3. 个性化**
- 根据用户偏好推荐方案
- 记录用户常用路线
- 提供个性化设置选项

**4. 多终端适配**
- 支持Web、移动端、小程序
- 响应式设计，适配不同屏幕
- 统一的用户体验

### 交互设计

**1. 路径规划交互**
- 一键规划最优路径
- 实时显示路况信息
- 支持拖拽调整路线
- 提供多个备选方案

**2. 停车查询交互**
- 地图可视化显示停车位
- 实时显示可用车位数量
- 一键导航到停车场
- 支持预约停车位

**3. 安全预警交互**
- 及时推送预警信息
- 地图标注风险区域
- 提供绕行建议
- 支持预警详情查看

