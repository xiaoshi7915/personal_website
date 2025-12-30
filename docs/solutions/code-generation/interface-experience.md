# 6. 接口与体验

## 6.1 开放API

### API设计

智能代码生成系统提供RESTful API和GraphQL API，支持第三方系统集成。

#### RESTful API设计
遵循RESTful设计原则，使用标准HTTP方法。

**API端点示例**：
```
POST   /api/v1/code/generate      # 代码生成
POST   /api/v1/code/complete      # 代码补全
POST   /api/v1/code/review        # 代码审查
POST   /api/v1/test/generate      # 测试生成
GET    /api/v1/projects            # 获取项目列表
GET    /api/v1/projects/{id}       # 获取项目详情
POST   /api/v1/projects            # 创建项目
PUT    /api/v1/projects/{id}       # 更新项目
DELETE /api/v1/projects/{id}       # 删除项目
```

#### 请求格式
```json
// 代码生成请求示例
POST /api/v1/code/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "project_id": "proj_123",
  "language": "python",
  "requirement": "创建一个用户登录函数，支持用户名和密码验证",
  "context": {
    "file_path": "src/auth.py",
    "existing_code": "...",
    "style_guide": "pep8"
  },
  "options": {
    "max_tokens": 1000,
    "temperature": 0.7,
    "model": "codellama-7b"
  }
}
```

#### 响应格式
```json
// 代码生成响应示例
{
  "code": "def login(username, password):\n    # 实现代码...",
  "explanation": "生成的代码实现了用户登录功能...",
  "quality_score": 0.92,
  "suggestions": [
    "建议添加密码加密功能",
    "建议添加登录失败次数限制"
  ],
  "metadata": {
    "model": "codellama-7b",
    "tokens_used": 256,
    "response_time": 1.2
  }
}
```

#### GraphQL API设计
提供GraphQL API，支持灵活的查询。

**Schema示例**：
```graphql
type Query {
  project(id: ID!): Project
  projects(filter: ProjectFilter): [Project!]!
  codeGeneration(id: ID!): CodeGeneration
}

type Mutation {
  generateCode(input: CodeGenerationInput!): CodeGeneration!
  reviewCode(input: CodeReviewInput!): CodeReview!
  generateTest(input: TestGenerationInput!): TestGeneration!
}

type CodeGeneration {
  id: ID!
  code: String!
  explanation: String
  qualityScore: Float
  suggestions: [String!]!
  metadata: Metadata!
}
```

### 认证授权

#### 认证方式
- **API Key认证**：使用API Key进行认证，适合服务端集成
- **OAuth 2.0认证**：使用OAuth 2.0进行认证，适合第三方应用集成
- **JWT Token认证**：使用JWT Token进行认证，适合Web应用

#### API Key认证
```bash
# API Key认证示例
curl -X POST https://api.codegen.com/v1/code/generate \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"requirement": "..."}'
```

#### OAuth 2.0认证
```bash
# OAuth 2.0认证流程
# 1. 获取授权码
GET https://api.codegen.com/oauth/authorize?client_id=xxx&redirect_uri=xxx&response_type=code

# 2. 交换访问令牌
POST https://api.codegen.com/oauth/token
{
  "grant_type": "authorization_code",
  "code": "xxx",
  "redirect_uri": "xxx",
  "client_id": "xxx",
  "client_secret": "xxx"
}

# 3. 使用访问令牌
GET https://api.codegen.com/v1/projects \
  -H "Authorization: Bearer {access_token}"
```

#### 权限控制
- **项目级权限**：控制用户对项目的访问权限
- **功能级权限**：控制用户对功能的访问权限
- **资源级权限**：控制用户对资源的访问权限

### API文档

#### 文档工具
- **OpenAPI/Swagger**：使用OpenAPI规范定义API，生成交互式文档
- **ReDoc**：基于OpenAPI生成美观的API文档
- **Postman Collection**：提供Postman Collection，方便测试

#### API文档内容
- **接口说明**：接口功能、参数、返回值说明
- **请求示例**：各种语言的请求示例（Python、JavaScript、curl等）
- **响应示例**：响应格式和示例
- **错误码说明**：错误码和错误信息说明
- **认证说明**：认证方式和示例

#### 文档访问
- **在线文档**：提供在线API文档，支持交互式测试
- **PDF文档**：提供PDF格式的API文档，方便离线查看
- **SDK文档**：各语言SDK的使用文档

## 6.2 多终端SDK

### SDK类型

#### Python SDK
适用于Python开发者和Python项目。

**安装**：
```bash
pip install codegen-sdk
```

**使用示例**：
```python
from codegen import CodeGenClient

# 初始化客户端
client = CodeGenClient(api_key="sk_live_xxx")

# 代码生成
result = client.code.generate(
    project_id="proj_123",
    language="python",
    requirement="创建一个用户登录函数",
    context={
        "file_path": "src/auth.py",
        "style_guide": "pep8"
    }
)

print(result.code)
print(result.quality_score)
```

#### JavaScript/TypeScript SDK
适用于Node.js和浏览器环境。

**安装**：
```bash
npm install @codegen/sdk
```

**使用示例**：
```typescript
import { CodeGenClient } from '@codegen/sdk';

// 初始化客户端
const client = new CodeGenClient({
  apiKey: 'sk_live_xxx'
});

// 代码生成
const result = await client.code.generate({
  projectId: 'proj_123',
  language: 'typescript',
  requirement: '创建一个用户登录函数',
  context: {
    filePath: 'src/auth.ts',
    styleGuide: 'eslint'
  }
});

console.log(result.code);
console.log(result.qualityScore);
```

#### Java SDK
适用于Java开发者。

**安装**：
```xml
<dependency>
    <groupId>com.codegen</groupId>
    <artifactId>codegen-sdk</artifactId>
    <version&gt;1.0.0</version>
</dependency>
```

**使用示例**：
```java
import com.codegen.CodeGenClient;
import com.codegen.models.CodeGenerationRequest;
import com.codegen.models.CodeGenerationResult;

// 初始化客户端
CodeGenClient client = new CodeGenClient("sk_live_xxx");

// 代码生成
CodeGenerationRequest request = CodeGenerationRequest.builder()
    .projectId("proj_123")
    .language("java")
    .requirement("创建一个用户登录函数")
    .context(Map.of(
        "filePath", "src/auth.java",
        "styleGuide", "google-java-style"
    ))
    .build();

CodeGenerationResult result = client.code().generate(request);
System.out.println(result.getCode());
System.out.println(result.getQualityScore());
```

#### Go SDK
适用于Go开发者。

**安装**：
```bash
go get github.com/codegen/sdk-go
```

**使用示例**：
```go
package main

import (
    "fmt"
    "github.com/codegen/sdk-go"
)

func main() {
    // 初始化客户端
    client := codegen.NewClient("sk_live_xxx")
    
    // 代码生成
    req := &codegen.CodeGenerationRequest{
        ProjectID:  "proj_123",
        Language:   "go",
        Requirement: "创建一个用户登录函数",
        Context: map[string]string{
            "file_path":  "src/auth.go",
            "style_guide": "gofmt",
        },
    }
    
    result, err := client.Code.Generate(req)
    if err != nil {
        panic(err)
    }
    
    fmt.Println(result.Code)
    fmt.Println(result.QualityScore)
}
```

### SDK功能

#### 核心功能
- **代码生成**：根据需求生成代码
- **代码补全**：实时代码补全
- **代码审查**：自动化代码审查
- **测试生成**：生成测试用例

#### 辅助功能
- **项目管理**：项目创建、更新、删除
- **配置管理**：代码规范、模型配置管理
- **历史记录**：查看历史生成记录
- **统计分析**：使用统计和分析

### 集成示例

#### VS Code插件集成
```typescript
// VS Code插件集成示例
import * as vscode from 'vscode';
import { CodeGenClient } from '@codegen/sdk';

export function activate(context: vscode.ExtensionContext) {
    const client = new CodeGenClient({
        apiKey: vscode.workspace.getConfiguration().get('codegen.apiKey')
    });
    
    // 注册代码生成命令
    const generateCommand = vscode.commands.registerCommand(
        'codegen.generate',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            
            const requirement = await vscode.window.showInputBox({
                prompt: '请输入代码需求'
            });
            
            if (!requirement) return;
            
            const result = await client.code.generate({
                projectId: getProjectId(),
                language: editor.document.languageId,
                requirement: requirement,
                context: {
                    file_path: editor.document.fileName,
                    existing_code: editor.document.getText()
                }
            });
            
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, result.code);
            });
        }
    );
    
    context.subscriptions.push(generateCommand);
}
```

#### GitHub Actions集成
```yaml
# GitHub Actions集成示例
name: Code Review

on:
  pull_request:
    branches: [ main ]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Code Review
        uses: codegen/action@v1
        with:
          api-key: ${{ secrets.CODEGEN_API_KEY }}
          project-id: ${{ secrets.CODEGEN_PROJECT_ID }}
          
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '代码审查完成，发现3个问题需要修复。'
            })
```

## 6.3 可视化运营后台

### 功能模块

#### 项目管理模块
- **项目列表**：查看所有项目，支持搜索和筛选
- **项目详情**：查看项目详情，包括配置、统计等
- **项目配置**：配置项目代码规范、模型选择等
- **项目成员**：管理项目成员和权限

#### 代码生成模块
- **生成历史**：查看历史代码生成记录
- **生成统计**：统计代码生成次数、成功率等
- **质量分析**：分析生成代码的质量趋势
- **模型对比**：对比不同模型的生成效果

#### 代码审查模块
- **审查记录**：查看代码审查历史
- **问题统计**：统计发现的问题类型和数量
- **修复建议**：查看修复建议和修复率
- **质量趋势**：分析代码质量趋势

#### 测试生成模块
- **测试记录**：查看测试生成历史
- **覆盖率分析**：分析测试覆盖率趋势
- **测试执行**：执行测试用例，查看结果
- **测试报告**：生成测试报告

#### 用户管理模块
- **用户列表**：管理用户账号
- **权限管理**：管理用户权限
- **使用统计**：统计用户使用情况
- **账单管理**：管理用户账单和付费

### 数据看板

#### 概览看板
显示系统整体运行情况。

**指标**：
- **今日代码生成次数**：今日代码生成总次数
- **代码生成成功率**：代码生成成功率
- **平均响应时间**：平均响应时间
- **活跃用户数**：今日活跃用户数
- **API调用量**：API调用总量

#### 项目看板
显示项目维度的统计数据。

**指标**：
- **项目代码生成次数**：项目代码生成总次数
- **代码质量评分**：平均代码质量评分
- **问题发现率**：代码审查问题发现率
- **测试覆盖率**：测试覆盖率

#### 用户看板
显示用户维度的统计数据。

**指标**：
- **用户代码生成次数**：用户代码生成总次数
- **用户代码质量评分**：用户平均代码质量评分
- **用户活跃度**：用户活跃度评分
- **用户使用趋势**：用户使用趋势图

### 运营工具

#### 代码规范管理
- **规范模板**：管理代码规范模板
- **规范配置**：配置项目代码规范
- **规范检查**：检查代码是否符合规范

#### 模型管理
- **模型列表**：查看可用模型列表
- **模型配置**：配置模型参数
- **模型性能**：查看模型性能指标
- **模型切换**：切换使用的模型

#### 提示词管理
- **提示词模板**：管理提示词模板
- **提示词版本**：管理提示词版本
- **A/B测试**：进行提示词A/B测试

#### 数据分析工具
- **数据导出**：导出统计数据
- **数据可视化**：数据可视化图表
- **自定义报表**：创建自定义报表
- **数据对比**：对比不同时间段的数据

#### 告警管理
- **告警规则**：配置告警规则
- **告警历史**：查看告警历史
- **告警通知**：配置告警通知方式
