# 11. 交付与运维

## 11.1 一键部署

### 部署方案

智能法律解决方案支持多种部署方式，提供一键部署脚本：

#### 部署方式

**1. Docker Compose部署**
- **适用场景**：单机部署、开发测试环境
- **优势**：简单快速，易于管理
- **劣势**：不适合大规模生产环境

**2. Kubernetes部署**
- **适用场景**：生产环境、大规模部署
- **优势**：高可用、弹性伸缩、易于管理
- **劣势**：配置复杂，需要Kubernetes集群

**3. 云服务部署**
- **适用场景**：快速上线、弹性扩展
- **优势**：无需维护基础设施，按需付费
- **劣势**：成本较高，依赖云服务商

#### Docker Compose部署

**docker-compose.yml**：
```yaml
version: '3.8'

services:
  # API服务
  legal-api:
    image: legal-api:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/legal_db
      - REDIS_URL=redis://redis:6379
      - VECTOR_DB_URL=http://milvus:19530
    depends_on:
      - postgres
      - redis
      - milvus

  # 数据库
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=legal_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7
    volumes:
      - redis_data:/data

  # 向量数据库
  milvus:
    image: milvusdb/milvus:latest
    volumes:
      - milvus_data:/var/lib/milvus

volumes:
  postgres_data:
  redis_data:
  milvus_data:
```

**部署脚本**：
```bash
#!/bin/bash
# deploy.sh

echo "开始部署智能法律解决方案..."

# 检查Docker和Docker Compose
if ! command -v docker &> /dev/null; then
    echo "错误: 未安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: 未安装Docker Compose"
    exit 1
fi

# 拉取最新镜像
echo "拉取最新镜像..."
docker-compose pull

# 启动服务
echo "启动服务..."
docker-compose up -d

# 等待服务就绪
echo "等待服务就绪..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

echo "部署完成！"
```

#### Kubernetes部署

**部署清单**：
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: legal-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: legal-api
  template:
    metadata:
      labels:
        app: legal-api
    spec:
      containers:
      - name: legal-api
        image: legal-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: legal-secrets
              key: database-url
        resources:
          requests:
            cpu: 1000m
            memory: 2Gi
          limits:
            cpu: 2000m
            memory: 4Gi
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: legal-api-service
spec:
  selector:
    app: legal-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

**部署脚本**：
```bash
#!/bin/bash
# k8s-deploy.sh

echo "开始Kubernetes部署..."

# 检查kubectl
if ! command -v kubectl &> /dev/null; then
    echo "错误: 未安装kubectl"
    exit 1
fi

# 创建命名空间
kubectl create namespace legal-system --dry-run=client -o yaml | kubectl apply -f -

# 部署配置
kubectl apply -f k8s/config.yaml -n legal-system

# 部署服务
kubectl apply -f k8s/deployment.yaml -n legal-system
kubectl apply -f k8s/service.yaml -n legal-system

# 等待部署完成
kubectl wait --for=condition=available --timeout=300s deployment/legal-api -n legal-system

echo "部署完成！"
```

### 部署脚本

#### 一键部署脚本功能

**1. 环境检查**
- 检查Docker/Kubernetes环境
- 检查系统资源
- 检查网络连接

**2. 配置生成**
- 生成配置文件
- 配置环境变量
- 配置密钥

**3. 服务部署**
- 拉取镜像
- 启动服务
- 检查健康状态

**4. 初始化数据**
- 初始化数据库
- 导入初始数据
- 配置知识库

#### 部署脚本示例

**完整部署脚本**：
```bash
#!/bin/bash
# full-deploy.sh

set -e

# 配置
ENVIRONMENT=${ENVIRONMENT:-production}
NAMESPACE=${NAMESPACE:-legal-system}

echo "=========================================="
echo "智能法律解决方案一键部署"
echo "环境: $ENVIRONMENT"
echo "命名空间: $NAMESPACE"
echo "=========================================="

# 1. 环境检查
echo "1. 检查环境..."
./scripts/check-environment.sh

# 2. 生成配置
echo "2. 生成配置..."
./scripts/generate-config.sh $ENVIRONMENT

# 3. 部署服务
echo "3. 部署服务..."
if [ "$ENVIRONMENT" == "production" ]; then
    ./scripts/k8s-deploy.sh $NAMESPACE
else
    ./scripts/docker-deploy.sh
fi

# 4. 初始化数据
echo "4. 初始化数据..."
./scripts/init-data.sh

# 5. 健康检查
echo "5. 健康检查..."
./scripts/health-check.sh

echo "=========================================="
echo "部署完成！"
echo "=========================================="
```

### 环境配置

#### 环境变量配置

**.env文件**：
```bash
# 数据库配置
DATABASE_URL=postgresql://user:password@postgres:5432/legal_db
DATABASE_POOL_SIZE=20

# Redis配置
REDIS_URL=redis://redis:6379
REDIS_DB=0

# 向量数据库配置
VECTOR_DB_URL=http://milvus:19530
VECTOR_DB_COLLECTION=legal_cases

# AI服务配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# 应用配置
APP_ENV=production
APP_DEBUG=false
APP_SECRET_KEY=your_secret_key

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=/var/log/legal-api.log
```

#### 配置文件管理

**使用ConfigMap管理配置**：
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: legal-config
data:
  app.env: "production"
  log.level: "INFO"
  database.pool_size: "20"
```

**使用Secret管理密钥**：
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: legal-secrets
type: Opaque
data:
  database-url: <base64-encoded-url>
  api-key: <base64-encoded-key>
```

## 11.2 灾备与回滚

### 灾备方案

#### 备份策略

**1. 数据备份**
- **数据库备份**：每日全量备份，每6小时增量备份
- **文件备份**：每日备份，保留30天
- **配置备份**：每次变更后备份

**2. 备份存储**
- **本地备份**：快速恢复
- **异地备份**：防止灾难
- **云备份**：长期保存

**3. 备份验证**
- 定期验证备份完整性
- 定期测试恢复流程
- 记录备份日志

#### 灾备架构

**主备架构**：
- **主站点**：承担主要业务流量
- **备站点**：实时同步数据，主备切换时间&lt;5分钟

**异地容灾**：
- **同城双活**：两个机房同时提供服务
- **异地灾备**：异地机房作为灾备

#### 备份脚本

**数据库备份脚本**：
```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR=/backup/database
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=$BACKUP_DIR/legal_db_$DATE.sql

echo "开始备份数据库..."

# 全量备份
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# 压缩备份
gzip $BACKUP_FILE

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "备份完成: $BACKUP_FILE.gz"
```

### 回滚机制

#### 回滚策略

**1. 代码回滚**
- **版本控制**：使用Git管理代码版本
- **镜像版本**：使用Docker镜像版本管理
- **快速回滚**：一键回滚到上一版本

**2. 数据回滚**
- **数据库回滚**：使用数据库事务回滚
- **配置回滚**：回滚配置文件
- **数据恢复**：从备份恢复数据

**3. 服务回滚**
- **蓝绿部署**：使用蓝绿部署支持快速切换
- **金丝雀发布**：逐步发布，发现问题立即回滚

#### 回滚脚本

**Kubernetes回滚脚本**：
```bash
#!/bin/bash
# rollback.sh

DEPLOYMENT_NAME=${1:-legal-api}
NAMESPACE=${2:-legal-system}

echo "回滚部署: $DEPLOYMENT_NAME"

# 获取当前版本
CURRENT_VERSION=$(kubectl get deployment $DEPLOYMENT_NAME -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].image}')

# 回滚到上一版本
kubectl rollout undo deployment/$DEPLOYMENT_NAME -n $NAMESPACE

# 等待回滚完成
kubectl rollout status deployment/$DEPLOYMENT_NAME -n $NAMESPACE

echo "回滚完成"
```

### 数据备份

#### 备份策略

**1. 全量备份**
- **频率**：每日一次
- **时间**：凌晨2点
- **保留**：30天

**2. 增量备份**
- **频率**：每6小时一次
- **保留**：7天

**3. 实时备份**
- **方式**：主从复制
- **延迟**：&lt;1秒

#### 备份恢复

**恢复流程**：
1. 停止服务
2. 恢复数据库
3. 恢复文件
4. 验证数据
5. 启动服务

**恢复脚本**：
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "用法: restore.sh <backup_file>"
    exit 1
fi

echo "开始恢复数据..."

# 停止服务
kubectl scale deployment legal-api --replicas=0 -n legal-system

# 恢复数据库
gunzip -c $BACKUP_FILE | psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# 启动服务
kubectl scale deployment legal-api --replicas=3 -n legal-system

echo "恢复完成"
```

## 11.3 知识移交

### 文档体系

#### 文档分类

**1. 技术文档**
- **架构文档**：系统架构、技术选型
- **API文档**：接口文档、使用示例
- **部署文档**：部署指南、运维手册

**2. 业务文档**
- **业务手册**：业务流程、使用指南
- **操作手册**：操作步骤、常见问题
- **培训材料**：培训PPT、视频教程

**3. 运维文档**
- **运维手册**：日常运维、故障处理
- **监控文档**：监控指标、告警规则
- **安全文档**：安全策略、应急预案

#### 文档管理

**文档存储**：
- 使用Git管理文档版本
- 使用Wiki系统管理文档
- 定期更新文档

**文档结构**：
```
docs/
├── architecture/      # 架构文档
├── api/              # API文档
├── deployment/       # 部署文档
├── operations/       # 运维文档
└── training/         # 培训材料
```

### 培训计划

#### 培训内容

**1. 系统概述**
- 系统功能介绍
- 系统架构说明
- 技术栈介绍

**2. 使用培训**
- 合同审查功能使用
- 案例检索功能使用
- 法条匹配功能使用

**3. 运维培训**
- 日常运维操作
- 故障处理流程
- 监控和告警

**4. 开发培训**
- API使用
- SDK集成
- 二次开发

#### 培训计划

**第一阶段（1周）**：
- 系统概述培训（2小时）
- 功能使用培训（4小时）
- 实际操作练习（2小时）

**第二阶段（1周）**：
- 运维培训（4小时）
- 故障处理培训（2小时）
- 实际操作练习（2小时）

**第三阶段（持续）**：
- 定期技术分享
- 问题解答
- 经验交流

### 技术支持

#### 支持方式

**1. 在线支持**
- **工单系统**：提交工单，24小时内响应
- **在线客服**：工作日9:00-18:00在线支持
- **技术论坛**：技术交流和问题解答

**2. 远程支持**
- **远程协助**：远程协助解决问题
- **视频会议**：定期技术会议
- **电话支持**：紧急问题电话支持

**3. 现场支持**
- **现场培训**：现场培训和技术指导
- **现场部署**：现场部署和调试
- **现场维护**：定期现场维护

#### 支持流程

**1. 问题提交**
- 用户提交问题
- 问题分类和优先级
- 分配给技术支持人员

**2. 问题处理**
- 技术支持人员分析问题
- 提供解决方案
- 跟踪问题处理进度

**3. 问题关闭**
- 验证问题解决
- 用户确认
- 关闭问题

#### 支持SLA

**响应时间**：
- **P0（紧急）**：1小时内响应
- **P1（高）**：4小时内响应
- **P2（中）**：24小时内响应
- **P3（低）**：48小时内响应

**解决时间**：
- **P0**：4小时内解决
- **P1**：24小时内解决
- **P2**：72小时内解决
- **P3**：7天内解决
