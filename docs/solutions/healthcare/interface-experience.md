# 6. 接口与体验

## 6.1 开放API

### API设计

智能医疗系统提供RESTful API和DICOM协议接口，支持多种医疗系统接入：

#### API架构

**基础URL**：
```
https://api.medical-ai.com/v1/healthcare
```

**核心接口**：

**1. 影像诊断接口（Image Diagnosis）**
```
POST /api/v1/diagnosis/image
Content-Type: multipart/form-data

{
    "image_file": <DICOM文件>,
    "modality": "CT",
    "patient_id": "P123456",
    "study_id": "S789012",
    "clinical_history": "患者主诉..."
}

Response:
{
    "diagnosis_id": "D123456",
    "status": "processing",
    "estimated_time": 30
}
```

**2. 获取诊断结果（Get Diagnosis Result）**
```
GET /api/v1/diagnosis/{diagnosis_id}

Response:
{
    "diagnosis_id": "D123456",
    "status": "completed",
    "findings": [
        {
            "location": "右肺上叶",
            "size": "2.5cm×2.0cm",
            "type": "结节",
            "confidence": 0.95
        }
    ],
    "diagnosis": "右肺上叶结节，建议进一步检查",
    "differential_diagnosis": ["良性结节", "恶性肿瘤"],
    "recommendations": ["CT增强扫描", "3个月后复查"]
}
```

**3. 病历分析接口（Medical Record Analysis）**
```
POST /api/v1/analysis/record
Content-Type: application/json

{
    "patient_id": "P123456",
    "record_text": "患者，男，45岁，主诉咳嗽、咳痰1周...",
    "analysis_type": "diagnosis_assistant"
}

Response:
{
    "analysis_id": "A123456",
    "structured_data": {
        "chief_complaint": "咳嗽、咳痰1周",
        "present_illness": "...",
        "diagnosis_suggestions": ["肺炎", "支气管炎"]
    },
    "medication_recommendations": [
        {
            "drug": "阿莫西林",
            "dosage": "0.5g，每日3次",
            "duration": "7天"
        }
    ]
}
```

**4. 知识检索接口（Knowledge Retrieval）**
```
POST /api/v1/knowledge/retrieve
Content-Type: application/json

{
    "query": "肺炎的诊断标准",
    "query_type": "disease",
    "limit": 10
}

Response:
{
    "results": [
        {
            "title": "社区获得性肺炎诊断标准",
            "content": "...",
            "source": "临床指南",
            "relevance_score": 0.95
        }
    ],
    "total": 25
}
```

### 认证授权

#### API密钥认证

**请求头格式**：
```
Authorization: Bearer {api_key}
X-API-Key: {api_key}
```

**实现示例**：
```python
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

app = FastAPI()
security = HTTPBearer()

def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    """验证API密钥"""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        api_key = payload.get("api_key")
        
        # 验证API密钥有效性
        if not is_valid_api_key(api_key):
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        return api_key
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/v1/diagnosis/image")
async def diagnose_image(
    image_file: UploadFile,
    api_key: str = Depends(verify_api_key)
):
    """影像诊断接口"""
    # 处理诊断请求
    pass
```

#### OAuth 2.0认证

**授权流程**：
1. 客户端请求授权码
2. 用户授权
3. 获取访问令牌
4. 使用访问令牌访问API

### API文档

**Swagger UI**：
- 访问地址：`https://api.medical-ai.com/docs`
- 提供交互式API文档
- 支持在线测试API

**OpenAPI规范**：
```yaml
openapi: 3.0.0
info:
  title: 智能医疗API
  version: 1.0.0
paths:
  /api/v1/diagnosis/image:
    post:
      summary: 影像诊断
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                image_file:
                  type: string
                  format: binary
      responses:
        '200':
          description: 诊断成功
```

## 6.2 多终端SDK

### SDK类型

#### Python SDK

**安装**：
```bash
pip install medical-ai-sdk
```

**使用示例**：
```python
from medical_ai import MedicalAIClient

# 初始化客户端
client = MedicalAIClient(
    api_key="your_api_key",
    base_url="https://api.medical-ai.com"
)

# 影像诊断
result = client.diagnose_image(
    image_path="path/to/image.dcm",
    modality="CT",
    patient_id="P123456"
)

print(f"诊断结果: {result.diagnosis}")
print(f"置信度: {result.confidence}")

# 病历分析
analysis = client.analyze_record(
    record_text="患者主诉...",
    analysis_type="diagnosis_assistant"
)

print(f"诊断建议: {analysis.diagnosis_suggestions}")
```

#### JavaScript/TypeScript SDK

**安装**：
```bash
npm install @medical-ai/sdk
```

**使用示例**：
```typescript
import { MedicalAIClient } from '@medical-ai/sdk';

const client = new MedicalAIClient({
  apiKey: 'your_api_key',
  baseURL: 'https://api.medical-ai.com'
});

// 影像诊断
const result = await client.diagnoseImage({
  imageFile: file,
  modality: 'CT',
  patientId: 'P123456'
});

console.log('诊断结果:', result.diagnosis);
```

#### Java SDK

**Maven依赖**：
```xml
<dependency>
    <groupId>com.medical-ai</groupId>
    <artifactId>medical-ai-sdk</artifactId>
    <version&gt;1.0.0</version>
</dependency>
```

**使用示例**：
```java
MedicalAIClient client = new MedicalAIClient.Builder()
    .apiKey("your_api_key")
    .baseURL("https://api.medical-ai.com")
    .build();

// 影像诊断
DiagnosisRequest request = DiagnosisRequest.builder()
    .imageFile(imageFile)
    .modality("CT")
    .patientId("P123456")
    .build();

DiagnosisResult result = client.diagnoseImage(request);
System.out.println("诊断结果: " + result.getDiagnosis());
```

### SDK功能

**核心功能**：
- 影像诊断：上传影像，获取AI诊断结果
- 病历分析：分析病历文本，提取结构化信息
- 知识检索：检索医疗知识库
- 用药建议：获取用药推荐
- 诊断辅助：获取诊断建议和鉴别诊断

**高级功能**：
- 批量处理：支持批量影像诊断
- 异步处理：支持异步任务提交和结果查询
- 流式处理：支持大文件流式上传
- 错误重试：自动重试失败的请求

## 6.3 可视化运营后台

### 功能模块

#### 1. 诊断管理模块

**功能**：
- 查看所有诊断记录
- 筛选和搜索诊断记录
- 查看诊断详情和报告
- 导出诊断报告
- 诊断质量统计

**界面设计**：
- 诊断列表：表格展示，支持排序和筛选
- 诊断详情：侧边栏展示，包含影像、诊断结果、建议等
- 统计看板：展示诊断数量、准确率、效率等指标

#### 2. 模型管理模块

**功能**：
- 查看模型列表和状态
- 模型性能监控
- 模型版本管理
- 模型A/B测试
- 模型部署和下线

**界面设计**：
- 模型列表：卡片式展示，显示模型名称、版本、状态等
- 性能监控：图表展示模型准确率、响应时间等指标
- A/B测试：对比不同版本模型的效果

#### 3. 知识库管理模块

**功能**：
- 知识库内容管理
- 知识检索测试
- 知识库版本管理
- 知识质量评估

**界面设计**：
- 知识列表：树形结构展示知识分类
- 知识编辑：富文本编辑器，支持Markdown
- 检索测试：输入查询，查看检索结果

#### 4. 用户管理模块

**功能**：
- 用户列表和权限管理
- 用户行为统计
- 用户使用情况分析

**界面设计**：
- 用户列表：表格展示用户信息
- 权限配置：角色权限配置界面
- 使用统计：图表展示用户使用情况

### 数据看板

#### 核心指标看板

**诊断指标**：
- 今日诊断数量：实时显示今日完成的诊断数量
- 诊断准确率：显示AI诊断的准确率趋势
- 平均诊断时间：显示平均每个诊断所需时间
- 诊断分布：按科室、疾病类型等维度展示诊断分布

**系统指标**：
- 系统可用性：显示系统可用性百分比
- API调用量：显示API调用次数和趋势
- 响应时间：显示API平均响应时间
- 错误率：显示API错误率

**实现示例**：
```python
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

@app.get("/admin/dashboard", response_class=HTMLResponse)
async def dashboard():
    """数据看板页面"""
    # 获取统计数据
    stats = {
        'today_diagnoses': get_today_diagnosis_count(),
        'accuracy_rate': get_accuracy_rate(),
        'avg_diagnosis_time': get_avg_diagnosis_time(),
        'system_availability': get_system_availability()
    }
    
    # 渲染HTML模板
    return render_template('dashboard.html', stats=stats)
```

### 运营工具

#### 1. 诊断质量审核工具

**功能**：
- 抽样审核AI诊断结果
- 标记诊断错误
- 生成质量报告
- 反馈给模型优化团队

#### 2. 知识库维护工具

**功能**：
- 批量导入知识
- 知识去重和清洗
- 知识质量评估
- 知识更新通知

#### 3. 系统配置工具

**功能**：
- 系统参数配置
- 模型路由规则配置
- 告警规则配置
- 用户权限配置

#### 4. 数据分析工具

**功能**：
- 自定义报表生成
- 数据导出
- 数据可视化
- 趋势分析
