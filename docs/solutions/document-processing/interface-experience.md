# 6. 接口与体验

## 6.1 开放API

### API设计

智能文档处理系统提供RESTful API，支持多种客户端接入：

#### API架构

**基础URL**：
```
https://api.example.com/v1/document-processing
```

**核心接口**：

**1. 上传文档（Upload Document）**
```
POST /documents
Content-Type: multipart/form-data

{
    "file": <file>,
    "document_type": "contract",
    "metadata": {
        "source": "manual",
        "tags": ["important"]
    }
}

Response:
{
    "document_id": "doc_123",
    "status": "uploaded",
    "created_at": "2024-01-01T10:00:00Z"
}
```

**2. 处理文档（Process Document）**
```
POST /documents/{document_id}/process
Content-Type: application/json

{
    "task_type": "extraction",
    "extraction_fields": ["contract_no", "amount", "date"],
    "options": {
        "ocr": true,
        "language": "zh"
    }
}

Response:
{
    "task_id": "task_456",
    "status": "processing",
    "estimated_time": 30
}
```

**3. 获取处理结果（Get Processing Result）**
```
GET /documents/{document_id}/result

Response:
{
    "document_id": "doc_123",
    "status": "completed",
    "extracted_data": {
        "contract_no": "HT-2024-001",
        "amount": "100万元",
        "date": "2024-01-01"
    },
    "quality_score": 0.95,
    "processed_at": "2024-01-01T10:05:00Z"
}
```

**4. 批量处理（Batch Process）**
```
POST /documents/batch
Content-Type: application/json

{
    "document_ids": ["doc_123", "doc_124", "doc_125"],
    "task_type": "extraction",
    "extraction_fields": ["contract_no", "amount"]
}

Response:
{
    "batch_id": "batch_789",
    "status": "processing",
    "total": 3,
    "processed": 0
}
```

### 认证授权

#### 认证方式

**API Key认证**：
- 每个客户端分配唯一的API Key
- 在请求头中携带：`Authorization: Bearer {api_key}`
- 简单易用，适合服务端调用

**OAuth 2.0认证**：
- 支持标准OAuth 2.0流程
- 获取Access Token后使用
- 适合第三方应用集成

**JWT Token认证**：
- 用户登录后获取JWT Token
- Token包含用户信息和权限
- 适合Web和移动端应用

### API文档

#### 文档工具

**Swagger/OpenAPI**：
- 使用OpenAPI 3.0规范
- 自动生成交互式API文档
- 支持在线测试API

**访问地址**：
```
https://api.example.com/docs
```

## 6.2 多终端SDK

### SDK类型

#### Web SDK（JavaScript）

**功能特性**：
- 文档上传
- 处理状态查询
- 结果获取
- 批量处理

**安装**：
```bash
npm install @company/document-processing-sdk
```

**使用示例**：
```javascript
import { DocumentProcessingSDK } from '@company/document-processing-sdk';

const sdk = new DocumentProcessingSDK({
    apiKey: 'your-api-key',
    endpoint: 'https://api.example.com'
});

// 上传文档
const document = await sdk.uploadDocument({
    file: fileObject,
    documentType: 'contract'
});

// 处理文档
const task = await sdk.processDocument(document.id, {
    taskType: 'extraction',
    extractionFields: ['contract_no', 'amount']
});

// 获取结果
const result = await sdk.getResult(document.id);
console.log(result.extractedData);
```

#### Python SDK

**功能特性**：
- 完整的API封装
- 异步支持
- 类型提示
- 错误处理

**使用示例**：
```python
from document_processing_sdk import DocumentProcessingSDK

sdk = DocumentProcessingSDK(api_key="your-api-key")

# 上传文档
document = sdk.upload_document(
    file_path="contract.pdf",
    document_type="contract"
)

# 处理文档
task = sdk.process_document(
    document_id=document.id,
    task_type="extraction",
    extraction_fields=["contract_no", "amount"]
)

# 获取结果
result = sdk.get_result(document.id)
print(result.extracted_data)
```

### SDK功能

#### 核心功能

**1. 文档管理**
- 上传、查询、删除文档
- 文档状态管理
- 文档历史查询

**2. 文档处理**
- 启动处理任务
- 查询处理状态
- 获取处理结果

**3. 批量处理**
- 批量上传文档
- 批量处理文档
- 批量获取结果

## 6.3 可视化运营后台

### 功能模块

#### 1. 文档管理模块

**功能**：
- 文档上传和管理
- 文档分类和标签
- 文档搜索和筛选
- 文档预览和下载

**界面特性**：
- 拖拽上传
- 批量操作
- 实时预览
- 快速搜索

#### 2. 处理任务模块

**功能**：
- 创建处理任务
- 监控处理进度
- 查看处理结果
- 任务历史查询

**界面特性**：
- 实时进度显示
- 任务状态可视化
- 结果对比展示
- 批量操作支持

#### 3. 知识库管理模块

**功能**：
- 知识库构建和管理
- 知识检索测试
- 知识效果评估
- 知识版本管理

**界面特性**：
- 可视化知识库结构
- 实时检索测试
- 知识质量评分
- 版本对比功能

#### 4. 数据分析模块

**功能**：
- 处理效率分析
- 质量统计分析
- 文档类型分布
- 趋势预测分析

**界面特性**：
- 丰富的图表展示
- 自定义报表生成
- 数据导出功能
- 实时数据更新

### 数据看板

#### 核心指标看板

**实时指标**：
- 当前处理中任务数
- 今日处理文档数
- 平均处理时间
- 系统可用率

**质量指标**：
- OCR识别准确率
- 信息提取准确率
- 文档处理完整率
- 用户满意度

**效率指标**：
- 日/周/月处理量
- 处理速度趋势
- 任务完成率
- 平均处理时间

### 运营工具

#### 1. 批量操作工具

**功能**：
- 批量上传文档
- 批量处理文档
- 批量导出结果
- 批量删除文档

#### 2. 自动化规则工具

**功能**：
- 设置自动处理规则
- 设置自动分类规则
- 设置自动审核规则
- 设置告警规则

#### 3. 测试工具

**功能**：
- 文档解析测试
- OCR识别测试
- 信息提取测试
- 端到端流程测试

#### 4. 报表工具

**功能**：
- 自定义报表设计
- 定时报表生成
- 报表邮件发送
- 报表数据导出