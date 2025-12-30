# 6. 接口与体验

## 6.1 开放API

### API设计

智能法律解决方案提供RESTful API接口，支持第三方系统集成：

#### 核心API接口

**1. 合同审查API**
```http
POST /api/v1/contract/review
Content-Type: application/json

{
  "document": "base64_encoded_document",
  "document_type": "pdf|word|image",
  "contract_type": "买卖合同|租赁合同|服务合同",
  "risk_level": "high|medium|low",
  "focus_areas": ["违约责任", "争议解决"],
  "options": {
    "include_suggestions": true,
    "include_compliance_check": true
  }
}

Response:
{
  "task_id": "task_123456",
  "status": "processing|completed|failed",
  "result": {
    "contract_type": "买卖合同",
    "key_clauses": [...],
    "risks": [...],
    "compliance_check": {...},
    "modification_suggestions": [...]
  }
}
```

**2. 案例检索API**
```http
POST /api/v1/case/retrieve
Content-Type: application/json

{
  "case_description": "案情描述",
  "case_type": "民事|刑事|行政|商事",
  "dispute_focus": "争议焦点",
  "key_facts": ["关键事实1", "关键事实2"],
  "top_k": 10,
  "filters": {
    "court_level": "最高法院|高级法院|中级法院",
    "date_range": {
      "start": "2020-01-01",
      "end": "2024-12-31"
    }
  }
}

Response:
{
  "cases": [
    {
      "case_id": "case_123",
      "case_name": "案例名称",
      "relevance_score": 0.95,
      "court": "审理法院",
      "date": "2023-01-01",
      "summary": "案例摘要",
      "relevant_laws": [...]
    }
  ],
  "total": 10
}
```

**3. 法条匹配API**
```http
POST /api/v1/law/match
Content-Type: application/json

{
  "legal_question": "法律问题",
  "case_description": "案件描述（可选）",
  "law_types": ["法律", "法规", "司法解释"],
  "top_k": 20
}

Response:
{
  "matched_laws": [
    {
      "law_name": "法律名称",
      "article_number": "条文编号",
      "article_content": "条文内容",
      "relevance_score": 0.95,
      "applicability": "适用性分析",
      "application_conditions": "适用条件"
    }
  ],
  "legal_basis_summary": "法律依据总结"
}
```

**4. 文档解析API**
```http
POST /api/v1/document/parse
Content-Type: multipart/form-data

{
  "file": "文件内容",
  "file_type": "pdf|word|excel|image",
  "options": {
    "extract_tables": true,
    "extract_images": false,
    "ocr": true
  }
}

Response:
{
  "document_id": "doc_123",
  "text_content": "解析后的文本",
  "structure": {
    "sections": [...],
    "tables": [...],
    "images": [...]
  }
}
```

#### API设计原则

**RESTful设计**：
- 使用标准HTTP方法（GET、POST、PUT、DELETE）
- 使用RESTful URL结构
- 使用标准HTTP状态码

**统一响应格式**：
```json
{
  "code": 200,
  "message": "success",
  "data": {...},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**错误处理**：
```json
{
  "code": 400,
  "message": "Invalid request",
  "error": {
    "type": "ValidationError",
    "details": "具体错误信息"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 认证授权

#### 认证方式

**1. API Key认证**
- 每个客户端分配唯一的API Key
- 在请求头中携带API Key：`Authorization: Bearer {api_key}`
- 适用于服务端调用

**2. OAuth 2.0认证**
- 支持OAuth 2.0标准认证流程
- 适用于第三方应用集成
- 支持授权码模式、客户端模式

**3. JWT Token认证**
- 用户登录后获得JWT Token
- Token有效期24小时
- 支持Token刷新机制

#### 授权机制

**基于角色的访问控制（RBAC）**：
- **管理员**：所有API权限
- **律师**：合同审查、案例检索、法条匹配权限
- **法务**：合同审查、合规审查权限
- **访客**：只读权限

**API权限配置**：
```yaml
api_permissions:
  - role: "lawyer"
    apis:
      - "/api/v1/contract/review"
      - "/api/v1/case/retrieve"
      - "/api/v1/law/match"
  - role: "legal_affairs"
    apis:
      - "/api/v1/contract/review"
      - "/api/v1/compliance/check"
```

### API文档

#### OpenAPI规范

使用OpenAPI 3.1规范编写API文档：

```yaml
openapi: 3.1.0
info:
  title: 智能法律解决方案API
  version: 1.0.0
  description: 智能法律解决方案的RESTful API接口文档

paths:
  /api/v1/contract/review:
    post:
      summary: 合同审查
      tags:
        - 合同审查
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ContractReviewRequest'
      responses:
        '200':
          description: 审查成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContractReviewResponse'
        '400':
          description: 请求错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  schemas:
    ContractReviewRequest:
      type: object
      required:
        - document
      properties:
        document:
          type: string
          description: Base64编码的文档内容
        document_type:
          type: string
          enum: [pdf, word, image]
        contract_type:
          type: string
          description: 合同类型
```

**API文档工具**：
- Swagger UI：交互式API文档
- ReDoc：美观的API文档展示
- Postman Collection：API测试集合

## 6.2 多终端SDK

### SDK类型

智能法律解决方案提供多平台SDK，方便开发者集成：

#### Python SDK

**安装**：
```bash
pip install legal-ai-sdk
```

**使用示例**：
```python
from legal_ai_sdk import LegalAIClient

# 初始化客户端
client = LegalAIClient(
    api_key="your_api_key",
    base_url="https://api.legal-ai.com"
)

# 合同审查
result = client.contract.review(
    document="合同内容",
    document_type="pdf",
    contract_type="买卖合同"
)

# 案例检索
cases = client.case.retrieve(
    case_description="案情描述",
    case_type="民事",
    top_k=10
)

# 法条匹配
laws = client.law.match(
    legal_question="法律问题",
    top_k=20
)
```

#### JavaScript/TypeScript SDK

**安装**：
```bash
npm install @legal-ai/sdk
```

**使用示例**：
```typescript
import { LegalAIClient } from '@legal-ai/sdk';

// 初始化客户端
const client = new LegalAIClient({
  apiKey: 'your_api_key',
  baseURL: 'https://api.legal-ai.com'
});

// 合同审查
const result = await client.contract.review({
  document: '合同内容',
  documentType: 'pdf',
  contractType: '买卖合同'
});

// 案例检索
const cases = await client.case.retrieve({
  caseDescription: '案情描述',
  caseType: '民事',
  topK: 10
});

// 法条匹配
const laws = await client.law.match({
  legalQuestion: '法律问题',
  topK: 20
});
```

#### Java SDK

**Maven依赖**：
```xml
<dependency>
    <groupId>com.legal-ai</groupId>
    <artifactId>legal-ai-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

**使用示例**：
```java
import com.legalai.sdk.LegalAIClient;
import com.legalai.sdk.models.*;

// 初始化客户端
LegalAIClient client = new LegalAIClient.Builder()
    .apiKey("your_api_key")
    .baseURL("https://api.legal-ai.com")
    .build();

// 合同审查
ContractReviewRequest request = ContractReviewRequest.builder()
    .document("合同内容")
    .documentType("pdf")
    .contractType("买卖合同")
    .build();
ContractReviewResponse response = client.contract().review(request);

// 案例检索
CaseRetrieveRequest caseRequest = CaseRetrieveRequest.builder()
    .caseDescription("案情描述")
    .caseType("民事")
    .topK(10)
    .build();
CaseRetrieveResponse cases = client.case().retrieve(caseRequest);
```

### SDK功能

#### 核心功能

**1. 文档处理**
- 文档上传和解析
- 多格式支持（PDF、Word、Excel、图片）
- OCR识别

**2. 合同审查**
- 智能合同审查
- 风险识别
- 合规检查
- 修改建议

**3. 案例检索**
- 相似案例检索
- 案例详情查看
- 案例报告生成

**4. 法条匹配**
- 法条检索
- 适用性分析
- 法律依据总结

#### SDK特性

**异步支持**：
- 支持异步调用，提升性能
- 支持回调函数和Promise

**错误处理**：
- 统一的错误处理机制
- 详细的错误信息

**重试机制**：
- 自动重试失败请求
- 可配置重试策略

**类型安全**：
- TypeScript类型定义
- Java类型安全

### 集成示例

#### Web应用集成

```html
<!DOCTYPE html>
<html>
<head>
    <title>智能法律系统</title>
    <script src="https://cdn.legal-ai.com/sdk/v1/legal-ai-sdk.js"></script>
</head>
<body>
    <div id="app">
        <h1>合同审查</h1>
        <input type="file" id="fileInput" accept=".pdf,.doc,.docx">
        <button onclick="reviewContract()">审查合同</button>
        <div id="result"></div>
    </div>

    <script>
        const client = new LegalAIClient({
            apiKey: 'your_api_key'
        });

        async function reviewContract() {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('请选择文件');
                return;
            }

            const reader = new FileReader();
            reader.onload = async function(e) {
                const base64Content = e.target.result.split(',')[1];
                
                try {
                    const result = await client.contract.review({
                        document: base64Content,
                        documentType: file.name.split('.').pop(),
                        contractType: '买卖合同'
                    });
                    
                    document.getElementById('result').innerHTML = 
                        JSON.stringify(result, null, 2);
                } catch (error) {
                    console.error('审查失败:', error);
                }
            };
            reader.readAsDataURL(file);
        }
    </script>
</body>
</html>
```

## 6.3 可视化运营后台

### 功能模块

#### 1. 数据看板

**核心指标展示**：
- 今日审查合同数量
- 今日检索案例数量
- 今日匹配法条数量
- 系统使用率
- 用户活跃度

**趋势分析**：
- 合同审查趋势图
- 案例检索趋势图
- 用户增长趋势图

**实时监控**：
- 实时请求量
- 实时错误率
- 实时响应时间

#### 2. 用户管理

**用户列表**：
- 用户基本信息
- 用户权限配置
- 用户使用统计

**权限管理**：
- 角色管理
- 权限分配
- 权限审计

#### 3. 内容管理

**法律知识库管理**：
- 法条管理
- 案例管理
- 合同模板管理

**数据更新**：
- 法条更新
- 案例更新
- 模板更新

#### 4. 系统配置

**模型配置**：
- 模型选择
- 参数配置
- A/B测试配置

**Prompt管理**：
- Prompt版本管理
- Prompt测试
- Prompt优化

### 数据看板

#### 看板设计

**概览看板**：
- 核心业务指标
- 系统健康状态
- 最近活动

**业务看板**：
- 合同审查统计
- 案例检索统计
- 法条匹配统计

**技术看板**：
- API调用统计
- 错误率统计
- 性能指标

#### 看板实现

**使用Grafana构建看板**：
```yaml
dashboard:
  title: 智能法律系统监控看板
  panels:
    - title: 合同审查数量
      type: graph
      targets:
        - expr: sum(contract_review_total)
          legendFormat: 审查数量
    
    - title: API响应时间
      type: graph
      targets:
        - expr: histogram_quantile(0.95, api_request_duration_seconds_bucket)
          legendFormat: P95响应时间
    
    - title: 错误率
      type: graph
      targets:
        - expr: rate(api_errors_total[5m])
          legendFormat: 错误率
```

### 运营工具

#### 1. 批量处理工具

**批量合同审查**：
- 上传多个合同文件
- 批量审查处理
- 批量导出结果

**批量案例检索**：
- 批量案情输入
- 批量检索处理
- 批量结果导出

#### 2. 数据分析工具

**使用情况分析**：
- 用户使用习惯分析
- 功能使用频率分析
- 使用时间分布分析

**质量分析**：
- 审查准确率分析
- 检索准确率分析
- 用户满意度分析

#### 3. 报告生成工具

**自动报告生成**：
- 日报生成
- 周报生成
- 月报生成

**自定义报告**：
- 自定义报告模板
- 自定义数据源
- 自定义图表
