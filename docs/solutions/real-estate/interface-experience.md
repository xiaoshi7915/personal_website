# 6. 接口与体验

## 6.1 开放API

### API设计

智能房地产解决方案提供RESTful API接口，遵循REST设计原则：

#### API设计原则

- **资源导向**：API以资源为中心，使用名词而非动词
- **HTTP方法**：使用标准HTTP方法（GET、POST、PUT、DELETE）
- **状态码**：使用标准HTTP状态码
- **版本控制**：API版本通过URL路径或Header指定
- **统一格式**：请求和响应使用JSON格式

#### API端点设计

**房源推荐API**：

```
POST /api/v1/property/recommend
  功能：智能房源推荐
  请求体：
  {
    "user_id": "user123",
    "location": "北京市朝阳区",
    "price_range": {
      "min": 3000000,
      "max": 5000000
    },
    "area_range": {
      "min": 80,
      "max": 120
    },
    "house_type": "2室1厅",
    "other_requirements": "地铁附近，学区房"
  }
  响应：
  {
    "recommendations": [
      {
        "property_id": "prop001",
        "title": "朝阳区XX小区2室1厅",
        "location": "北京市朝阳区XX路",
        "price": 4500000,
        "area": 95,
        "house_type": "2室1厅",
        "score": 0.92,
        "reason": "符合您的需求，位置优越，价格合理",
        "images": ["https://example.com/images/prop001_1.jpg"],
        "distance_to_subway": 500,
        "school_district": true
      }
    ],
    "total": 5,
    "page": 1,
    "page_size": 10
  }

GET /api/v1/property/{property_id}
  功能：查询房源详情
  响应：
  {
    "property_id": "prop001",
    "title": "朝阳区XX小区2室1厅",
    "location": "北京市朝阳区XX路",
    "price": 4500000,
    "area": 95,
    "house_type": "2室1厅",
    "floor": 10,
    "total_floors": 20,
    "orientation": "南",
    "decoration": "精装修",
    "images": [...],
    "vr_url": "https://example.com/vr/prop001",
    "description": "房源描述..."
  }
```

**价格评估API**：

```
POST /api/v1/property/evaluate-price
  功能：智能价格评估
  请求体：
  {
    "property_id": "prop001",
    "location": "北京市朝阳区XX路",
    "area": 95,
    "house_type": "2室1厅",
    "floor": 10,
    "total_floors": 20,
    "orientation": "南",
    "decoration": "精装修"
  }
  响应：
  {
    "property_id": "prop001",
    "estimated_price": 4500000,
    "price_range": {
      "min": 4200000,
      "max": 4800000
    },
    "confidence": 0.92,
    "factors": [
      {
        "factor": "位置优势",
        "impact": "高",
        "description": "位于核心商圈，交通便利"
      },
      {
        "factor": "市场趋势",
        "impact": "中",
        "description": "同区域价格呈上升趋势"
      }
    ],
    "market_comparison": {
      "avg_price": 47000,
      "similar_properties": [
        {
          "property_id": "prop002",
          "price": 4600000,
          "similarity": 0.85
        }
      ]
    }
  }
```

**合同审查API**：

```
POST /api/v1/contract/review
  功能：智能合同审查
  请求体：
  {
    "contract_type": "租赁合同",
    "contract_file": "base64_encoded_file_content",
    "contract_text": "合同文本内容..."
  }
  响应：
  {
    "contract_id": "contract001",
    "risk_level": "中",
    "issues": [
      {
        "type": "风险条款",
        "clause": "第5条",
        "description": "租金调整条款不明确",
        "suggestion": "建议明确租金调整机制和调整幅度",
        "severity": "中"
      },
      {
        "type": "合规问题",
        "clause": "第8条",
        "description": "押金退还条款不符合法律规定",
        "suggestion": "建议按照法律规定修改押金退还条款",
        "severity": "高"
      }
    ],
    "summary": "合同整体风险中等，存在2个需要关注的问题",
    "compliance_score": 0.75
  }
```

**物业管理API**：

```
POST /api/v1/property-management/repair
  功能：提交报修需求
  请求体：
  {
    "user_id": "user123",
    "property_id": "prop001",
    "repair_type": "水电维修",
    "description": "卫生间水管漏水",
    "images": ["https://example.com/images/repair001.jpg"],
    "urgency": "高"
  }
  响应：
  {
    "repair_id": "repair001",
    "status": "已分配",
    "assigned_to": "worker001",
    "estimated_time": "2小时",
    "tracking_url": "https://example.com/tracking/repair001"
  }

GET /api/v1/property-management/repair/{repair_id}
  功能：查询报修状态
  响应：
  {
    "repair_id": "repair001",
    "status": "处理中",
    "progress": 0.6,
    "updates": [
      {
        "time": "2024-01-15T10:00:00Z",
        "status": "已分配",
        "description": "已分配给维修工"
      },
      {
        "time": "2024-01-15T11:00:00Z",
        "status": "处理中",
        "description": "维修工已到达现场"
      }
    ]
  }
```

## 6.2 多终端支持

### Web端

#### 技术栈

- **前端框架**：Vue 3 + TypeScript + Vite
- **UI组件库**：Element Plus
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **数据可视化**：ECharts、D3.js

#### 核心功能

- **房源搜索和推荐**：
  - 多条件搜索
  - 智能推荐
  - 地图展示
  - 筛选和排序

- **价格评估**：
  - 在线评估
  - 评估报告查看
  - 市场对比分析

- **合同审查**：
  - 合同上传
  - 在线审查
  - 审查报告查看

- **物业管理**：
  - 报修提交
  - 费用查询
  - 服务预约

### 移动端

#### iOS应用

- **技术栈**：Swift + SwiftUI
- **核心功能**：
  - 房源搜索和推荐
  - 价格评估
  - 合同审查
  - 物业管理
  - 推送通知

#### Android应用

- **技术栈**：Kotlin + Jetpack Compose
- **核心功能**：
  - 房源搜索和推荐
  - 价格评估
  - 合同审查
  - 物业管理
  - 推送通知

### 小程序

#### 微信小程序

- **技术栈**：原生小程序框架
- **核心功能**：
  - 房源搜索和推荐
  - 价格评估
  - 合同审查
  - 物业管理

## 6.3 用户体验设计

### 交互设计

#### 房源推荐交互

- **需求输入**：
  - 表单输入
  - 语音输入
  - 图片识别（户型图识别）

- **推荐展示**：
  - 列表展示
  - 卡片展示
  - 地图展示
  - VR看房

- **反馈机制**：
  - 点赞/收藏
  - 咨询/预约
  - 评价反馈

#### 价格评估交互

- **信息输入**：
  - 表单输入
  - 图片识别（房源图片）
  - 语音输入

- **结果展示**：
  - 价格展示
  - 价格区间展示
  - 影响因素分析
  - 市场对比

#### 合同审查交互

- **合同上传**：
  - 文件上传
  - 拍照上传
  - 文本输入

- **结果展示**：
  - 风险等级展示
  - 问题列表展示
  - 修改建议展示
  - 审查报告下载

### 响应式设计

#### 断点设计

- **移动端**：< 768px
- **平板端**：768px - 1024px
- **桌面端**：> 1024px

#### 适配策略

- **布局适配**：响应式布局，自适应不同屏幕尺寸
- **字体适配**：根据屏幕尺寸调整字体大小
- **图片适配**：根据屏幕尺寸加载不同尺寸图片

### 性能优化

#### 加载优化

- **懒加载**：图片和内容懒加载
- **代码分割**：按需加载代码
- **CDN加速**：静态资源CDN加速

#### 交互优化

- **防抖和节流**：搜索输入防抖，滚动节流
- **缓存策略**：API结果缓存，减少请求
- **预加载**：预加载下一页数据

## 6.4 无障碍设计

### 无障碍标准

- **WCAG 2.1 AA级标准**：
  - 颜色对比度 ≥ 4.5:1
  - 文字大小可调整
  - 键盘导航支持
  - 屏幕阅读器支持

### 无障碍功能

- **键盘导航**：支持键盘操作
- **屏幕阅读器**：支持屏幕阅读器
- **高对比度模式**：支持高对比度显示
- **文字大小调整**：支持文字大小调整

## 6.5 API文档

### Swagger文档

- **API文档地址**：`https://api.example.com/docs`
- **文档格式**：OpenAPI 3.0
- **文档内容**：
  - API端点说明
  - 请求参数说明
  - 响应格式说明
  - 错误码说明
  - 示例代码

### SDK支持

#### Python SDK

```python
from real_estate_sdk import RealEstateClient

client = RealEstateClient(api_key="your_api_key")

# 房源推荐
recommendations = client.recommend_properties(
    location="北京市朝阳区",
    price_range={"min": 3000000, "max": 5000000},
    area_range={"min": 80, "max": 120}
)

# 价格评估
evaluation = client.evaluate_price(
    property_id="prop001",
    location="北京市朝阳区XX路",
    area=95
)

# 合同审查
review = client.review_contract(
    contract_type="租赁合同",
    contract_file="contract.pdf"
)
```

#### JavaScript SDK

```javascript
import { RealEstateClient } from 'real-estate-sdk';

const client = new RealEstateClient({ apiKey: 'your_api_key' });

// 房源推荐
const recommendations = await client.recommendProperties({
  location: '北京市朝阳区',
  priceRange: { min: 3000000, max: 5000000 },
  areaRange: { min: 80, max: 120 }
});

// 价格评估
const evaluation = await client.evaluatePrice({
  propertyId: 'prop001',
  location: '北京市朝阳区XX路',
  area: 95
});

// 合同审查
const review = await client.reviewContract({
  contractType: '租赁合同',
  contractFile: 'contract.pdf'
});
```

