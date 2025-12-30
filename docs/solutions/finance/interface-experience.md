# 6. 接口与体验

## 6.1 开放API

### API设计

智能金融解决方案提供RESTful API接口，遵循REST设计原则：

#### API设计原则

- **资源导向**：API以资源为中心，使用名词而非动词
- **HTTP方法**：使用标准HTTP方法（GET、POST、PUT、DELETE）
- **状态码**：使用标准HTTP状态码
- **版本控制**：API版本通过URL路径或Header指定
- **统一格式**：请求和响应使用JSON格式

#### API端点设计

**风控API**：

```
POST /api/v1/risk/check
  功能：实时风控检测
  请求体：
  {
    "transaction_id": "TXN123456",
    "customer_id": "CUST789",
    "amount": 10000.00,
    "transaction_type": "transfer",
    "counterparty": "CUST999"
  }
  响应：
  {
    "risk_level": "low",
    "risk_score": 0.15,
    "risk_factors": [],
    "decision": "approved",
    "transaction_id": "TXN123456"
  }

GET /api/v1/risk/history/{transaction_id}
  功能：查询交易风控历史
  响应：
  {
    "transaction_id": "TXN123456",
    "risk_history": [
      {
        "timestamp": "2024-01-01T10:00:00Z",
        "risk_level": "low",
        "risk_score": 0.15,
        "decision": "approved"
      }
    ]
  }
```

**投研API**：

```
POST /api/v1/research/analyze
  功能：投研分析
  请求体：
  {
    "company_name": "腾讯控股",
    "stock_code": "00700",
    "analysis_type": "comprehensive",
    "date_range": {
      "start": "2023-01-01",
      "end": "2023-12-31"
    }
  }
  响应：
  {
    "analysis_id": "ANALYSIS123",
    "status": "completed",
    "report_url": "https://api.example.com/reports/ANALYSIS123.pdf",
    "summary": {
      "investment_recommendation": "买入",
      "target_price": 450.00,
      "risk_level": "medium"
    }
  }

GET /api/v1/research/report/{analysis_id}
  功能：获取投研报告
  响应：
  {
    "analysis_id": "ANALYSIS123",
    "report_content": "...",
    "format": "markdown"
  }
```

**合规API**：

```
POST /api/v1/compliance/review
  功能：合规审查
  请求体：
  {
    "transaction_id": "TXN123456",
    "review_type": "aml",  // 反洗钱
    "customer_id": "CUST789"
  }
  响应：
  {
    "review_id": "REVIEW123",
    "status": "completed",
    "risk_level": "low",
    "compliance_report": "...",
    "recommendation": "approved"
  }
```

#### API文档

使用OpenAPI 3.1规范编写API文档：

```yaml
openapi: 3.1.0
info:
  title: 智能金融解决方案API
  version: 1.0.0
  description: 智能金融解决方案的RESTful API接口

paths:
  /api/v1/risk/check:
    post:
      summary: 实时风控检测
      tags:
        - 风控
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RiskCheckRequest'
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RiskCheckResponse'
        '400':
          description: 请求参数错误
        '500':
          description: 服务器错误

components:
  schemas:
    RiskCheckRequest:
      type: object
      required:
        - transaction_id
        - customer_id
        - amount
      properties:
        transaction_id:
          type: string
          description: 交易ID
        customer_id:
          type: string
          description: 客户ID
        amount:
          type: number
          description: 交易金额
        transaction_type:
          type: string
          description: 交易类型
        counterparty:
          type: string
          description: 交易对手方
    
    RiskCheckResponse:
      type: object
      properties:
        risk_level:
          type: string
          enum: [low, medium, high]
        risk_score:
          type: number
          minimum: 0
          maximum: 1
        decision:
          type: string
          enum: [approved, rejected, manual_review]
```

### 认证授权

#### 认证方式

- **API Key认证**：
  - 每个客户端分配唯一的API Key
  - API Key通过Header传递：`X-API-Key: your-api-key`
  - 适用于服务端调用

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
  - 定义角色：管理员、分析师、操作员、只读用户
  - 分配权限：每个角色有特定的API访问权限
  - 权限检查：API调用时检查用户角色和权限

- **资源级权限控制**：
  - 用户可以访问自己创建的资源
  - 管理员可以访问所有资源
  - 支持资源分享和协作

#### 认证实现示例

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
import jwt

# API Key认证
api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Depends(api_key_header)):
    """验证API Key"""
    if api_key not in valid_api_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    return api_key

# JWT Token认证
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def verify_token(token: str = Depends(oauth2_scheme)):
    """验证JWT Token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# API端点使用认证
@app.post("/api/v1/risk/check")
async def risk_check(
    request: RiskCheckRequest,
    api_key: str = Depends(verify_api_key)
):
    # 处理请求
    pass
```

### API文档

#### 文档生成

使用Swagger UI自动生成API文档：

```python
from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html

app = FastAPI(
    title="智能金融解决方案API",
    version="1.0.0",
    description="智能金融解决方案的RESTful API接口",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# 访问 http://localhost:8000/api/docs 查看Swagger UI文档
```

#### 文档内容

API文档包含以下内容：

- **API概览**：API的整体介绍和使用说明
- **认证说明**：如何获取和使用API Key/Token
- **端点列表**：所有API端点的列表
- **请求示例**：每个端点的请求示例
- **响应示例**：每个端点的响应示例
- **错误码说明**：错误码的含义和处理方法
- **SDK示例**：使用SDK调用API的示例代码

## 6.2 多终端SDK

### SDK类型

智能金融解决方案提供多种语言的SDK，方便不同平台的集成：

#### Python SDK

- **平台**：Python 3.8+
- **安装**：`pip install finance-ai-sdk`
- **功能**：
  - 完整的API封装
  - 异步支持
  - 类型提示
  - 错误处理

**使用示例**：

```python
from finance_ai_sdk import FinanceAIClient

# 初始化客户端
client = FinanceAIClient(
    api_key="your-api-key",
    base_url="https://api.example.com"
)

# 风控检测
result = client.risk.check(
    transaction_id="TXN123456",
    customer_id="CUST789",
    amount=10000.00,
    transaction_type="transfer"
)
print(f"风险等级: {result.risk_level}")
print(f"风险分数: {result.risk_score}")

# 投研分析
analysis = client.research.analyze(
    company_name="腾讯控股",
    stock_code="00700",
    analysis_type="comprehensive"
)
print(f"投资建议: {analysis.summary.investment_recommendation}")
```

#### JavaScript/TypeScript SDK

- **平台**：Node.js 16+, 浏览器
- **安装**：`npm install finance-ai-sdk`
- **功能**：
  - 完整的API封装
  - Promise/async-await支持
  - TypeScript类型定义
  - 错误处理

**使用示例**：

```typescript
import { FinanceAIClient } from 'finance-ai-sdk';

// 初始化客户端
const client = new FinanceAIClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.example.com'
});

// 风控检测
const result = await client.risk.check({
  transactionId: 'TXN123456',
  customerId: 'CUST789',
  amount: 10000.00,
  transactionType: 'transfer'
});
console.log(`风险等级: ${result.riskLevel}`);
console.log(`风险分数: ${result.riskScore}`);

// 投研分析
const analysis = await client.research.analyze({
  companyName: '腾讯控股',
  stockCode: '00700',
  analysisType: 'comprehensive'
});
console.log(`投资建议: ${analysis.summary.investmentRecommendation}`);
```

#### Java SDK

- **平台**：Java 8+
- **安装**：Maven依赖
- **功能**：
  - 完整的API封装
  - 同步和异步支持
  - 类型安全
  - 错误处理

**使用示例**：

```java
import com.financeai.sdk.FinanceAIClient;
import com.financeai.sdk.models.RiskCheckRequest;
import com.financeai.sdk.models.RiskCheckResponse;

// 初始化客户端
FinanceAIClient client = new FinanceAIClient.Builder()
    .apiKey("your-api-key")
    .baseUrl("https://api.example.com")
    .build();

// 风控检测
RiskCheckRequest request = RiskCheckRequest.builder()
    .transactionId("TXN123456")
    .customerId("CUST789")
    .amount(10000.00)
    .transactionType("transfer")
    .build();

RiskCheckResponse response = client.risk().check(request);
System.out.println("风险等级: " + response.getRiskLevel());
System.out.println("风险分数: " + response.getRiskScore());
```

### SDK功能

#### 核心功能

- **API封装**：
  - 封装所有API端点
  - 自动处理请求和响应
  - 类型安全的参数和返回值

- **认证管理**：
  - 自动处理API Key/Token
  - Token自动刷新
  - 安全的密钥存储

- **错误处理**：
  - 统一的错误处理机制
  - 详细的错误信息
  - 重试机制

- **请求重试**：
  - 网络错误自动重试
  - 可配置重试次数和退避策略
  - 幂等性保证

#### 高级功能

- **请求日志**：
  - 记录所有API请求和响应
  - 支持日志级别配置
  - 便于调试和问题排查

- **请求缓存**：
  - 缓存GET请求结果
  - 可配置缓存时间
  - 减少API调用次数

- **批量操作**：
  - 支持批量API调用
  - 自动处理并发和限流
  - 提高处理效率

### 集成示例

#### Web应用集成

```html
<!DOCTYPE html>
<html>
<head>
    <title>智能金融解决方案</title>
    <script src="https://cdn.jsdelivr.net/npm/finance-ai-sdk@latest/dist/index.js"></script>
</head>
<body>
    <script>
        // 初始化客户端
        const client = new FinanceAIClient({
            apiKey: 'your-api-key',
            baseURL: 'https://api.example.com'
        });

        // 风控检测
        async function checkRisk() {
            const result = await client.risk.check({
                transactionId: 'TXN123456',
                customerId: 'CUST789',
                amount: 10000.00,
                transactionType: 'transfer'
            });
            
            document.getElementById('result').innerHTML = 
                `风险等级: ${result.riskLevel}<br>` +
                `风险分数: ${result.riskScore}`;
        }
    </script>
    
    <button onclick="checkRisk()">检测风险</button>
    <div id="result"></div>
</body>
</html>
```

#### 移动应用集成

```dart
// Flutter示例
import 'package:finance_ai_sdk/finance_ai_sdk.dart';

void main() async {
  // 初始化客户端
  final client = FinanceAIClient(
    apiKey: 'your-api-key',
    baseUrl: 'https://api.example.com',
  );

  // 风控检测
  final result = await client.risk.check(
    transactionId: 'TXN123456',
    customerId: 'CUST789',
    amount: 10000.00,
    transactionType: 'transfer',
  );

  print('风险等级: ${result.riskLevel}');
  print('风险分数: ${result.riskScore}');
}
```

## 6.3 可视化运营后台

### 功能模块

运营后台提供完整的管理和运营功能：

#### 系统管理模块

- **用户管理**：
  - 用户列表：查看所有用户信息
  - 用户创建：创建新用户
  - 用户编辑：编辑用户信息
  - 用户删除：删除用户
  - 权限管理：分配用户角色和权限

- **角色管理**：
  - 角色列表：查看所有角色
  - 角色创建：创建新角色
  - 权限配置：配置角色权限
  - 角色分配：将角色分配给用户

- **系统配置**：
  - 系统参数配置
  - 模型配置
  - API配置
  - 通知配置

#### 业务管理模块

- **风控管理**：
  - 风控规则配置：配置风控规则和阈值
  - 风险事件查看：查看和处理风险事件
  - 风控效果分析：分析风控效果和指标
  - 风控报告生成：生成风控分析报告

- **投研管理**：
  - 投研任务管理：创建和管理投研任务
  - 研究报告查看：查看生成的研究报告
  - 投研效果分析：分析投研效果
  - 知识库管理：管理投研知识库

- **合规管理**：
  - 合规规则配置：配置合规规则
  - 合规审查任务：管理合规审查任务
  - 合规报告查看：查看合规审查报告
  - 监管报送：生成和提交监管报告

#### 数据管理模块

- **数据源管理**：
  - 数据源列表：查看所有数据源
  - 数据源配置：配置数据源连接
  - 数据同步监控：监控数据同步状态
  - 数据质量监控：监控数据质量指标

- **知识库管理**：
  - 知识库列表：查看所有知识库
  - 知识库创建：创建新知识库
  - 知识库更新：更新知识库内容
  - 知识库检索测试：测试知识库检索效果

### 数据看板

#### 实时监控看板

- **系统监控**：
  - API调用量：实时API调用量和趋势
  - 响应时间：API平均响应时间和P99响应时间
  - 错误率：API错误率和错误类型分布
  - 系统资源：CPU、内存、磁盘使用率

- **业务监控**：
  - 风控检测量：实时风控检测量和趋势
  - 风险事件数：风险事件数量和趋势
  - 投研任务数：投研任务数量和完成率
  - 合规审查数：合规审查任务数量和完成率

#### 数据分析看板

- **风控分析**：
  - 风险分布：风险等级分布图
  - 风险趋势：风险趋势时间序列图
  - 误报率分析：误报率趋势和原因分析
  - 风控效果：风控准确率和效果评估

- **投研分析**：
  - 投研任务统计：任务数量、完成率、平均耗时
  - 投资建议分布：投资建议类型分布
  - 投研效果评估：投研建议准确率评估
  - 知识库使用：知识库检索次数和效果

- **合规分析**：
  - 合规审查统计：审查任务数量、完成率
  - 风险事件统计：风险事件数量和类型分布
  - 合规报告统计：报告生成数量和趋势
  - 监管报送统计：监管报送次数和状态

#### 数据可视化

使用ECharts进行数据可视化：

```javascript
// 风险分布饼图
const riskDistributionChart = echarts.init(document.getElementById('risk-distribution'));
riskDistributionChart.setOption({
  title: {
    text: '风险分布',
    left: 'center'
  },
  tooltip: {
    trigger: 'item'
  },
  series: [{
    type: 'pie',
    data: [
      { value: 850000, name: '低风险' },
      { value: 120000, name: '中风险' },
      { value: 30000, name: '高风险' }
    ]
  }]
});

// 风险趋势折线图
const riskTrendChart = echarts.init(document.getElementById('risk-trend'));
riskTrendChart.setOption({
  title: {
    text: '风险趋势',
    left: 'center'
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    data: [0.15, 0.18, 0.16, 0.14, 0.17, 0.15],
    type: 'line',
    smooth: true
  }]
});
```

### 运营工具

#### 批量操作工具

- **批量导入**：
  - 支持Excel、CSV文件导入
  - 数据验证和清洗
  - 导入进度显示
  - 导入结果报告

- **批量导出**：
  - 导出数据到Excel、CSV
  - 支持自定义导出字段
  - 大数据量分批导出
  - 导出进度显示

#### 任务调度工具

- **定时任务**：
  - 创建定时任务
  - 配置执行时间和频率
  - 任务执行历史查看
  - 任务执行结果通知

- **工作流编排**：
  - 可视化工作流设计
  - 工作流执行监控
  - 工作流执行历史
  - 工作流错误处理

#### 通知管理工具

- **通知配置**：
  - 配置通知渠道（邮件、短信、企业微信）
  - 配置通知规则和触发条件
  - 通知模板管理

- **通知发送**：
  - 手动发送通知
  - 查看通知发送历史
  - 通知发送状态监控
