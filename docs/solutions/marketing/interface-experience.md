# 6. 接口与体验

## 6.1 开放API

### API设计

智能营销系统提供RESTful API，支持多种客户端接入：

#### API架构

**基础URL**：
```
https://api.example.com/v1/marketing
```

**核心接口**：

**1. 生成营销内容（Generate Content）**
```
POST /content/generate
Content-Type: application/json

{
    "content_type": "marketing_copy",
    "product_info": {
        "name": "护肤品",
        "features": ["保湿", "美白", "抗衰老"]
    },
    "target_audience": "25-35岁女性",
    "platform": "wechat",
    "style": "温馨、专业",
    "word_limit": 500
}

Response:
{
    "content_id": "content_123",
    "content": "【新品上市】专为25-35岁女性打造的护肤新体验...",
    "quality_score": 0.92,
    "created_at": "2024-01-01T10:00:00Z"
}
```

**2. 分析用户画像（Analyze User Profile）**
```
POST /user-profile/analyze
Content-Type: application/json

{
    "user_id": "user_123",
    "data_range": "last_30_days"
}

Response:
{
    "user_id": "user_123",
    "profile": {
        "age": 28,
        "gender": "female",
        "interests": ["美妆", "时尚", "旅游"],
        "purchase_power": "high",
        "preferred_brands": ["品牌A", "品牌B"]
    },
    "segments": ["高价值用户", "美妆爱好者"],
    "recommendations": ["护肤品", "化妆品"]
}
```

**3. 创建营销活动（Create Campaign）**
```
POST /campaigns
Content-Type: application/json

{
    "name": "春季促销活动",
    "target_segments": ["高价值用户", "新用户"],
    "content_ids": ["content_123", "content_456"],
    "start_date": "2024-03-01",
    "end_date": "2024-03-31",
    "budget": 100000
}

Response:
{
    "campaign_id": "campaign_789",
    "status": "draft",
    "created_at": "2024-01-01T10:00:00Z"
}
```

**4. 优化广告（Optimize Ad）**
```
POST /ads/{ad_id}/optimize
Content-Type: application/json

{
    "optimization_type": "keywords",
    "target_metrics": ["ctr", "conversion_rate"]
}

Response:
{
    "ad_id": "ad_123",
    "optimization_suggestions": {
        "keywords": ["护肤品", "保湿", "美白"],
        "bid_adjustments": {
            "护肤品": 1.2,
            "保湿": 1.1
        },
        "creative_suggestions": ["突出产品功效", "增加用户评价"]
    },
    "expected_improvement": {
        "ctr": "+15%",
        "conversion_rate": "+10%"
    }
}
```

### 认证授权

**API Key认证**：
```python
import requests

headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://api.example.com/v1/marketing/content/generate",
    headers=headers,
    json={"content_type": "marketing_copy"}
)
```

**OAuth 2.0认证**：
```python
# 获取访问令牌
token_response = requests.post(
    "https://api.example.com/oauth/token",
    data={
        "grant_type": "client_credentials",
        "client_id": "YOUR_CLIENT_ID",
        "client_secret": "YOUR_CLIENT_SECRET"
    }
)

access_token = token_response.json()["access_token"]

# 使用令牌调用API
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}
```

### API文档

使用OpenAPI 3.0规范编写API文档，支持Swagger UI可视化：

```yaml
openapi: 3.0.0
info:
  title: 智能营销API
  version: 1.0.0
paths:
  /content/generate:
    post:
      summary: 生成营销内容
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateContentRequest'
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContentResponse'
```

## 6.2 多终端SDK

### SDK类型

#### Python SDK
- **平台**：Python 3.8+
- **功能**：内容生成、用户画像分析、营销活动管理
- **安装**：`pip install marketing-sdk`

**使用示例**：
```python
from marketing_sdk import MarketingClient

client = MarketingClient(api_key="YOUR_API_KEY")

# 生成内容
content = client.generate_content(
    content_type="marketing_copy",
    product_info={"name": "护肤品"},
    target_audience="25-35岁女性"
)

# 分析用户画像
profile = client.analyze_user_profile(user_id="user_123")
```

#### JavaScript SDK
- **平台**：Node.js 14+, 浏览器
- **功能**：内容生成、用户画像分析、营销活动管理
- **安装**：`npm install marketing-sdk`

**使用示例**：
```javascript
const MarketingClient = require('marketing-sdk');

const client = new MarketingClient({
  apiKey: 'YOUR_API_KEY'
});

// 生成内容
const content = await client.generateContent({
  contentType: 'marketing_copy',
  productInfo: { name: '护肤品' },
  targetAudience: '25-35岁女性'
});

// 分析用户画像
const profile = await client.analyzeUserProfile('user_123');
```

#### Java SDK
- **平台**：Java 8+
- **功能**：内容生成、用户画像分析、营销活动管理
- **安装**：Maven依赖

**使用示例**：
```java
import com.marketing.sdk.MarketingClient;

MarketingClient client = new MarketingClient("YOUR_API_KEY");

// 生成内容
GenerateContentRequest request = GenerateContentRequest.builder()
    .contentType("marketing_copy")
    .productInfo(Map.of("name", "护肤品"))
    .targetAudience("25-35岁女性")
    .build();

ContentResponse response = client.generateContent(request);
```

### SDK功能

**内容生成**：
- 生成营销文案
- 生成海报文案
- 生成视频脚本
- 批量生成内容

**用户画像**：
- 分析用户画像
- 用户分群
- 个性化推荐

**营销活动**：
- 创建营销活动
- 管理营销活动
- 查看活动效果

**广告优化**：
- 优化关键词
- 优化出价
- 优化创意

### 集成示例

**Web前端集成**：
```html
<script src="https://cdn.example.com/marketing-sdk.js"></script>
<script>
const client = new MarketingClient({
  apiKey: 'YOUR_API_KEY'
});

client.generateContent({
  contentType: 'marketing_copy',
  productInfo: { name: '护肤品' }
}).then(content => {
  document.getElementById('content').innerText = content.content;
});
</script>
```

**移动App集成**：
```swift
// iOS Swift示例
import MarketingSDK

let client = MarketingClient(apiKey: "YOUR_API_KEY")

client.generateContent(
    contentType: "marketing_copy",
    productInfo: ["name": "护肤品"]
) { result in
    switch result {
    case .success(let content):
        print(content.content)
    case .failure(let error):
        print(error)
    }
}
```

## 6.3 可视化运营后台

### 功能模块

#### 内容管理模块
- **内容生成**：快速生成营销内容
- **内容审核**：审核AI生成的内容
- **内容库**：管理历史内容
- **内容分析**：分析内容效果

#### 用户画像模块
- **用户画像**：查看用户画像详情
- **用户分群**：管理用户分群
- **用户标签**：管理用户标签
- **用户分析**：分析用户行为

#### 营销活动模块
- **活动创建**：创建营销活动
- **活动管理**：管理活动生命周期
- **活动效果**：查看活动效果数据
- **A/B测试**：管理A/B测试

#### 广告管理模块
- **广告创建**：创建广告计划
- **广告优化**：优化广告效果
- **广告监控**：监控广告数据
- **ROI分析**：分析广告ROI

### 数据看板

#### 核心指标看板
- **内容指标**：内容生成量、内容质量评分、内容使用率
- **用户指标**：用户画像完整度、用户分群准确度、用户活跃度
- **营销指标**：营销转化率、营销ROI、获客成本
- **广告指标**：广告ROI、点击率、转化率

**看板示例**：
```javascript
// 使用ECharts创建数据看板
import * as echarts from 'echarts';

const chart = echarts.init(document.getElementById('dashboard'));

chart.setOption({
  title: { text: '营销效果看板' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['转化率', 'ROI'] },
  xAxis: { type: 'category', data: ['1月', '2月', '3月'] },
  yAxis: { type: 'value' },
  series: [
    { name: '转化率', type: 'line', data: [2.5, 3.2, 4.1] },
    { name: 'ROI', type: 'line', data: [2.0, 2.5, 3.2] }
  ]
});
```

#### 实时监控看板
- **实时内容生成**：实时显示内容生成情况
- **实时用户行为**：实时显示用户行为数据
- **实时营销效果**：实时显示营销效果数据
- **实时告警**：实时显示系统告警信息

### 运营工具

#### 内容创作工具
- **智能写作助手**：辅助内容创作
- **内容模板库**：提供内容模板
- **内容优化建议**：提供内容优化建议
- **多平台适配**：自动适配不同平台

#### 数据分析工具
- **数据报表**：生成数据报表
- **数据可视化**：数据可视化分析
- **趋势分析**：分析数据趋势
- **预测分析**：预测未来趋势

#### 自动化工具
- **自动化内容生成**：定时自动生成内容
- **自动化营销活动**：自动创建和执行营销活动
- **自动化广告优化**：自动优化广告效果
- **自动化报告**：自动生成分析报告
