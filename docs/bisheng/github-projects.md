---
sidebar_position: 4
---

# GitHub项目

## 官方项目

### 1. BISHENG毕昇主项目

**项目地址**: [https://github.com/dataelement/bisheng](https://github.com/dataelement/bisheng)

毕昇平台的核心代码仓库，包含完整的前后端代码和部署脚本。

#### 项目结构
```
bisheng/
├── src/
│   ├── backend/          # 后端Python代码
│   │   ├── bisheng/      # 核心业务逻辑
│   │   ├── components/   # 工作流组件
│   │   ├── api/          # API接口
│   │   └── utils/        # 工具函数
│   └── frontend/         # 前端React代码
│       ├── src/
│       ├── public/
│       └── package.json
├── docker/               # Docker配置文件
├── deploy/               # 部署脚本和配置
├── docs/                 # 文档目录
└── tests/                # 测试用例
```

#### 技术栈
- **后端**: Python 3.9+, FastAPI, SQLAlchemy, Celery
- **前端**: React, TypeScript, Ant Design, React Flow
- **数据库**: PostgreSQL, Redis, Milvus
- **容器化**: Docker, Docker Compose

#### 贡献指南
- Fork项目到个人账户
- 创建功能分支: `git checkout -b feature/your-feature`
- 提交更改: `git commit -am 'Add some feature'`
- 推送分支: `git push origin feature/your-feature`
- 创建Pull Request

### 2. BISHENG RT推理服务

**项目地址**: [https://github.com/dataelement/bisheng-rt](https://github.com/dataelement/bisheng-rt)

毕昇平台的模型推理服务，支持多种大语言模型的高性能推理。

#### 主要特性
- 支持多种模型格式（HuggingFace、ONNX、TensorRT）
- GPU加速推理
- 动态批处理
- 模型热更新
- 监控和告警

#### 支持的模型
- **ChatGLM系列**: ChatGLM-6B, ChatGLM2-6B, ChatGLM3-6B
- **Qwen系列**: Qwen-7B, Qwen-14B, Qwen-72B
- **Baichuan系列**: Baichuan-7B, Baichuan-13B
- **LLaMA系列**: LLaMA-7B, LLaMA-13B, LLaMA-30B
- **InternLM系列**: InternLM-7B, InternLM-20B

### 3. BISHENG Unstructured文档解析

**项目地址**: [https://github.com/dataelement/bisheng-unstructured](https://github.com/dataelement/bisheng-unstructured)

专门针对中文优化的文档解析服务，支持多种文档格式的智能解析。

#### 支持的文档格式
- **PDF**: 包括扫描件和文本型PDF
- **Office文档**: Word(.docx), Excel(.xlsx), PowerPoint(.pptx)
- **图片**: PNG, JPEG, TIFF, BMP
- **其他**: HTML, Markdown, 纯文本

#### 解析能力
- OCR文字识别（支持中英文混合）
- 表格结构识别
- 版面分析
- 图片内容提取
- 元数据提取

### 4. BISHENG Knowledge知识库

**项目地址**: [https://github.com/dataelement/bisheng-knowledge](https://github.com/dataelement/bisheng-knowledge)

企业级知识库管理系统，提供知识图谱构建和智能检索功能。

#### 核心功能
- 知识图谱构建
- 实体关系抽取
- 智能标签生成
- 语义检索
- 知识推荐

## 相关开源项目

### LLM基础框架

#### 1. LangChain
**项目地址**: [https://github.com/langchain-ai/langchain](https://github.com/langchain-ai/langchain)

毕昇平台基于LangChain构建，提供了LLM应用开发的基础框架。

**主要贡献者**: Harrison Chase, Ankush Gola
**语言**: Python, TypeScript
**Stars**: 87.2k+

#### 2. LangFlow
**项目地址**: [https://github.com/logspace-ai/langflow](https://github.com/logspace-ai/langflow)

可视化LLM工作流构建工具，毕昇平台在其基础上进行了企业级增强。

**主要贡献者**: Logspace AI Team
**语言**: Python, TypeScript
**Stars**: 23.1k+

### 模型推理框架

#### 1. vLLM
**项目地址**: [https://github.com/vllm-project/vllm](https://github.com/vllm-project/vllm)

高性能LLM推理框架，毕昇RT基于此构建。

**特性**:
- PagedAttention算法
- 连续批处理
- 优化的CUDA内核
- 支持多种模型架构

#### 2. FastChat
**项目地址**: [https://github.com/lm-sys/FastChat](https://github.com/lm-sys/FastChat)

分布式聊天机器人训练和部署平台。

**特性**:
- 多模型支持
- 分布式训练
- Web界面
- API服务

#### 3. Text Generation Inference
**项目地址**: [https://github.com/huggingface/text-generation-inference](https://github.com/huggingface/text-generation-inference)

HuggingFace开发的高性能文本生成推理服务器。

**特性**:
- 张量并行
- 动态批处理
- 优化的注意力机制
- 支持流式输出

### 向量数据库

#### 1. Milvus
**项目地址**: [https://github.com/milvus-io/milvus](https://github.com/milvus-io/milvus)

毕昇平台推荐的向量数据库，提供高性能向量检索能力。

**特性**:
- 万亿级向量数据
- 毫秒级查询响应
- 高度可扩展
- 云原生架构

#### 2. Qdrant
**项目地址**: [https://github.com/qdrant/qdrant](https://github.com/qdrant/qdrant)

用Rust编写的高性能向量搜索引擎。

**特性**:
- 内存安全
- 高并发支持
- 丰富的过滤功能
- REST API

#### 3. ChromaDB
**项目地址**: [https://github.com/chroma-core/chroma](https://github.com/chroma-core/chroma)

轻量级嵌入式向量数据库。

**特性**:
- 简单易用
- 本地部署
- Python原生
- 自动索引

### 文档处理

#### 1. Unstructured
**项目地址**: [https://github.com/Unstructured-IO/unstructured](https://github.com/Unstructured-IO/unstructured)

通用文档解析库，毕昇在此基础上针对中文进行了优化。

**支持格式**:
- PDF, DOCX, PPTX, HTML
- 邮件格式
- 图片中的文本
- 表格数据

#### 2. PyMuPDF
**项目地址**: [https://github.com/pymupdf/PyMuPDF](https://github.com/pymupdf/PyMuPDF)

高性能PDF处理库。

**特性**:
- 快速PDF解析
- 文本和图像提取
- 注释处理
- 格式转换

#### 3. PaddleOCR
**项目地址**: [https://github.com/PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)

百度开源的OCR工具包，支持80+语言识别。

**特性**:
- 超轻量级模型
- 多语言支持
- 高精度识别
- 产业级应用

## 工具和插件

### 开发工具

#### 1. BISHENG CLI
**项目地址**: [https://github.com/dataelement/bisheng-cli](https://github.com/dataelement/bisheng-cli)

毕昇平台的命令行工具，用于项目管理和部署。

**功能**:
```bash
# 创建新项目
bisheng create my-project

# 启动开发服务器
bisheng dev

# 构建生产版本
bisheng build

# 部署到云端
bisheng deploy

# 管理组件
bisheng component list
bisheng component create my-component
```

#### 2. BISHENG VSCode Extension
**项目地址**: [https://github.com/dataelement/bisheng-vscode](https://github.com/dataelement/bisheng-vscode)

VSCode扩展，提供语法高亮、智能提示和调试功能。

**特性**:
- 工作流文件语法高亮
- 组件代码片段
- 调试器集成
- 项目模板

### 监控和运维

#### 1. BISHENG Monitor
**项目地址**: [https://github.com/dataelement/bisheng-monitor](https://github.com/dataelement/bisheng-monitor)

专门为毕昇平台设计的监控系统。

**监控指标**:
- 工作流执行状态
- 模型推理性能
- 系统资源使用
- 用户行为分析

#### 2. BISHENG Operator
**项目地址**: [https://github.com/dataelement/bisheng-operator](https://github.com/dataelement/bisheng-operator)

Kubernetes Operator，用于在K8s环境中管理毕昇集群。

**功能**:
- 自动部署和扩缩容
- 配置管理
- 故障恢复
- 滚动更新

## 社区项目

### 示例和模板

#### 1. BISHENG Examples
**项目地址**: [https://github.com/dataelement/bisheng-examples](https://github.com/dataelement/bisheng-examples)

官方示例项目集合，展示各种应用场景的实现。

**包含示例**:
- 智能客服系统
- 文档问答助手
- 代码生成工具
- 数据分析助手
- 内容创作工具

#### 2. BISHENG Templates
**项目地址**: [https://github.com/dataelement/bisheng-templates](https://github.com/dataelement/bisheng-templates)

工作流模板库，提供可重用的业务模板。

**模板分类**:
- 客户服务类
- 内容创作类
- 数据分析类
- 办公自动化类
- 教育培训类

### 第三方插件

#### 1. BISHENG Integrations
**项目地址**: [https://github.com/bisheng-community/integrations](https://github.com/bisheng-community/integrations)

社区维护的第三方服务集成插件。

**集成服务**:
- 钉钉、企业微信
- Slack、Microsoft Teams
- Jira、Confluence
- Salesforce、HubSpot
- 各类数据库连接器

#### 2. BISHENG Custom Components
**项目地址**: [https://github.com/bisheng-community/custom-components](https://github.com/bisheng-community/custom-components)

社区贡献的自定义组件库。

**组件类型**:
- 数据处理组件
- 机器学习组件
- 可视化组件
- 通知组件
- 文件操作组件

## 学习资源

### 教程项目

#### 1. BISHENG Tutorial
**项目地址**: [https://github.com/dataelement/bisheng-tutorial](https://github.com/dataelement/bisheng-tutorial)

官方教程项目，从基础到高级的完整学习路径。

**教程内容**:
- 快速入门指南
- 工作流设计教程
- 组件开发指南
- 部署和运维教程
- 最佳实践案例

#### 2. BISHENG Workshop
**项目地址**: [https://github.com/dataelement/bisheng-workshop](https://github.com/dataelement/bisheng-workshop)

技术研讨会材料，包含实践练习和案例研究。

**研讨会主题**:
- 企业级AI应用架构
- 大规模知识库构建
- 多模态应用开发
- 性能优化实践

### 文档和资源

#### 1. Awesome BISHENG
**项目地址**: [https://github.com/bisheng-community/awesome-bisheng](https://github.com/bisheng-community/awesome-bisheng)

精选的毕昇相关资源列表。

**资源分类**:
- 官方文档和教程
- 第三方工具和插件
- 博客文章和视频
- 社区项目和案例
- 学习资源和书籍

#### 2. BISHENG Cookbook
**项目地址**: [https://github.com/dataelement/bisheng-cookbook](https://github.com/dataelement/bisheng-cookbook)

实用的代码示例和解决方案集合。

**内容包括**:
- 常见问题解决方案
- 性能优化技巧
- 集成指南
- 故障排查方法

## 贡献指南

### 如何贡献

#### 1. 代码贡献

```bash
# 1. Fork官方仓库
# 2. 克隆到本地
git clone https://github.com/your-username/bisheng.git
cd bisheng

# 3. 创建开发分支
git checkout -b feature/your-feature-name

# 4. 安装开发依赖
pip install -r requirements-dev.txt
npm install

# 5. 进行开发并测试
pytest tests/
npm test

# 6. 提交更改
git add .
git commit -m "Add your feature description"
git push origin feature/your-feature-name

# 7. 创建Pull Request
```

#### 2. 文档贡献

文档改进同样重要：
- 修正错误和不准确的信息
- 添加缺失的文档
- 改进现有文档的清晰度
- 翻译文档到其他语言

#### 3. 社区贡献

- 回答GitHub Issues中的问题
- 参与技术讨论
- 分享使用经验和最佳实践
- 组织和参与社区活动

### 开发规范

#### 代码风格
- Python代码遵循PEP 8标准
- TypeScript代码使用ESLint和Prettier
- 使用有意义的变量和函数名
- 添加适当的注释和文档字符串

#### 测试要求
- 新功能必须包含单元测试
- 确保所有测试都能通过
- 测试覆盖率应该保持在80%以上
- 添加集成测试验证端到端功能

#### 提交规范
使用约定式提交格式：
```
type(scope): description

[optional body]

[optional footer]
```

类型包括：
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 其他杂项

## 许可证信息

### 开源许可证

大多数毕昇相关项目使用以下开源许可证：

- **Apache License 2.0**: 主要项目许可证
- **MIT License**: 部分工具和插件
- **BSD License**: 某些第三方集成

### 商业许可

对于企业用户，还提供商业许可选项：
- 技术支持服务
- 定制开发服务
- 企业级功能扩展
- SLA保障

### 贡献者许可协议

在贡献代码之前，需要签署贡献者许可协议（CLA），确保：
- 代码知识产权清晰
- 项目可以持续维护
- 避免法律纠纷

## 联系方式

### 官方渠道
- **官网**: [https://bisheng.ai](https://bisheng.ai)
- **GitHub组织**: [https://github.com/dataelement](https://github.com/dataelement)
- **邮箱**: opensource@dataelement.com

### 社区渠道
- **微信群**: 扫描官网二维码加入
- **QQ群**: 123456789
- **论坛**: [https://forum.bisheng.ai](https://forum.bisheng.ai)
- **Discord**: [https://discord.gg/bisheng](https://discord.gg/bisheng)

通过参与开源项目，您不仅能学习到最新的AI技术，还能为推动整个AI生态的发展做出贡献。欢迎加入毕昇开源社区！ 