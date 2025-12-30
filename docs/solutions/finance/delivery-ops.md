# 11. 交付与运维

## 11.1 一键部署

### 部署方案

智能金融解决方案采用容器化部署，支持一键部署到Kubernetes集群：

#### Docker化部署

**Dockerfile示例**：

```dockerfile
# 基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml示例**：

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/finance_ai
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=finance_ai
    volumes:
      - db_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  db_data:
  redis_data:
```

#### Kubernetes部署

**Deployment配置**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-ai-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: finance-ai-api
  template:
    metadata:
      labels:
        app: finance-ai-api
    spec:
      containers:
      - name: api
        image: finance-ai:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: finance-ai-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: finance-ai-secrets
              key: redis-url
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**Service配置**：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: finance-ai-api
spec:
  selector:
    app: finance-ai-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

**Ingress配置**：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: finance-ai-ingress
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: finance-ai-api
            port:
              number: 80
```

### 部署脚本

#### 一键部署脚本

```bash
#!/bin/bash
# deploy.sh - 一键部署脚本

set -e

# 配置变量
NAMESPACE="finance-ai"
IMAGE_TAG="${1:-latest}"
ENVIRONMENT="${2:-staging}"

echo "开始部署智能金融解决方案..."
echo "命名空间: $NAMESPACE"
echo "镜像标签: $IMAGE_TAG"
echo "环境: $ENVIRONMENT"

# 创建命名空间
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# 创建Secret
kubectl create secret generic finance-ai-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=redis-url="$REDIS_URL" \
  --from-literal=api-key="$API_KEY" \
  --namespace=$NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

# 部署应用
kubectl apply -f k8s/deployment.yaml -n $NAMESPACE
kubectl set image deployment/finance-ai-api \
  api=finance-ai:$IMAGE_TAG \
  -n $NAMESPACE

# 等待部署完成
kubectl rollout status deployment/finance-ai-api -n $NAMESPACE

# 部署Service
kubectl apply -f k8s/service.yaml -n $NAMESPACE

# 部署Ingress
kubectl apply -f k8s/ingress.yaml -n $NAMESPACE

echo "部署完成！"
```

#### Helm Chart部署

**Chart.yaml**：

```yaml
apiVersion: v2
name: finance-ai
description: 智能金融解决方案
version: 1.0.0
appVersion: "1.0.0"
```

**values.yaml**：

```yaml
replicaCount: 3

image:
  repository: finance-ai
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80

ingress:
  enabled: true
  host: api.example.com

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 4Gi

database:
  url: postgresql://user:password@db:5432/finance_ai

redis:
  url: redis://redis:6379/0
```

**部署命令**：

```bash
# 安装Chart
helm install finance-ai ./finance-ai-chart \
  --namespace finance-ai \
  --create-namespace \
  --set image.tag=v1.0.0

# 升级Chart
helm upgrade finance-ai ./finance-ai-chart \
  --namespace finance-ai \
  --set image.tag=v1.1.0

# 卸载Chart
helm uninstall finance-ai --namespace finance-ai
```

### 环境配置

#### 环境变量配置

```bash
# .env文件
# 数据库配置
DATABASE_URL=postgresql://user:password@db:5432/finance_ai

# Redis配置
REDIS_URL=redis://redis:6379/0

# API配置
API_KEY=your-api-key
API_SECRET=your-api-secret

# 模型配置
LLM_API_KEY=your-llm-api-key
LLM_API_URL=https://api.openai.com/v1

# 监控配置
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000

# 日志配置
LOG_LEVEL=INFO
LOG_FORMAT=json
```

#### ConfigMap配置

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: finance-ai-config
data:
  database_url: "postgresql://user:password@db:5432/finance_ai"
  redis_url: "redis://redis:6379/0"
  log_level: "INFO"
  log_format: "json"
```

## 11.2 灾备与回滚

### 灾备方案

#### 多机房部署

- **主备机房**：
  - 主机房：承担主要业务流量
  - 备机房：实时同步数据，主备切换时间&lt;5分钟

- **异地容灾**：
  - 同城双活：两个机房同时提供服务，负载均衡
  - 异地灾备：异地机房作为灾备，定期同步数据

#### 数据备份策略

- **数据库备份**：
  - 全量备份：每日凌晨2点全量备份
  - 增量备份：每6小时增量备份
  - 备份保留：全量备份保留30天，增量备份保留7天
  - 备份存储：备份存储到对象存储（S3/OSS）

- **文件备份**：
  - 配置文件备份：版本控制（Git）
  - 日志文件备份：定期归档到对象存储
  - 模型文件备份：定期备份到对象存储

#### 灾备演练

- **演练频率**：每季度一次
- **演练内容**：
  - 主备切换演练
  - 数据恢复演练
  - 服务恢复演练
- **演练记录**：记录演练过程和问题，持续改进

### 回滚机制

#### 版本回滚

- **镜像版本回滚**：
  ```bash
  # 回滚到上一版本
  kubectl rollout undo deployment/finance-ai-api -n finance-ai
  
  # 回滚到指定版本
  kubectl rollout undo deployment/finance-ai-api \
    --to-revision=5 \
    -n finance-ai
  ```

- **配置回滚**：
  ```bash
  # 回滚ConfigMap
  kubectl rollout undo deployment/finance-ai-api -n finance-ai
  
  # 回滚Secret
  kubectl rollout undo deployment/finance-ai-api -n finance-ai
  ```

#### 数据库回滚

- **数据恢复**：
  ```bash
  # 恢复全量备份
  pg_restore -d finance_ai backup_full.dump
  
  # 恢复增量备份
  pg_restore -d finance_ai backup_incremental.dump
  ```

- **时间点恢复**：
  ```bash
  # 恢复到指定时间点
  psql -d finance_ai -c "SELECT pg_xlog_replay_resume()"
  ```

### 数据备份

#### 自动备份脚本

```bash
#!/bin/bash
# backup.sh - 自动备份脚本

set -e

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 数据库备份
echo "开始数据库备份..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -F c -f "$BACKUP_DIR/db_full_$DATE.dump"

# 压缩备份文件
gzip "$BACKUP_DIR/db_full_$DATE.dump"

# 上传到对象存储
aws s3 cp "$BACKUP_DIR/db_full_$DATE.dump.gz" \
  s3://backup-bucket/database/

# 清理旧备份
find $BACKUP_DIR -name "db_full_*.dump.gz" \
  -mtime +$RETENTION_DAYS -delete

echo "备份完成！"
```

#### 备份监控

- **备份状态监控**：
  - 监控备份任务执行状态
  - 监控备份文件大小
  - 监控备份存储空间

- **备份验证**：
  - 定期验证备份文件完整性
  - 定期测试备份恢复流程
  - 记录备份验证结果

## 11.3 知识移交

### 文档体系

#### 技术文档

- **架构文档**：
  - 系统架构设计
  - 技术选型说明
  - 部署架构说明

- **API文档**：
  - API接口说明
  - 请求响应示例
  - 错误码说明

- **数据库文档**：
  - 数据库设计文档
  - 表结构说明
  - 数据字典

- **运维文档**：
  - 部署文档
  - 运维手册
  - 故障处理手册

#### 业务文档

- **业务需求文档**：
  - 业务需求说明
  - 功能规格说明
  - 业务流程说明

- **用户手册**：
  - 用户操作指南
  - 功能使用说明
  - 常见问题解答

- **培训材料**：
  - 培训PPT
  - 培训视频
  - 实操练习

### 培训计划

#### 培训对象

- **开发人员**：
  - 系统架构培训
  - 代码规范培训
  - 开发流程培训

- **运维人员**：
  - 系统部署培训
  - 运维操作培训
  - 故障处理培训

- **业务人员**：
  - 业务功能培训
  - 操作流程培训
  - 问题处理培训

#### 培训内容

- **技术培训**：
  - 系统架构和技术栈
  - 开发环境和工具使用
  - 代码规范和最佳实践
  - 测试和部署流程

- **业务培训**：
  - 业务功能和流程
  - 系统操作指南
  - 常见问题处理
  - 最佳实践分享

#### 培训计划

```markdown
# 培训计划

## 第1周：系统概述
- 系统架构介绍
- 技术栈介绍
- 业务功能概述

## 第2周：开发培训
- 开发环境搭建
- 代码规范和最佳实践
- 开发流程和工具使用

## 第3周：运维培训
- 系统部署流程
- 运维操作手册
- 监控和告警

## 第4周：业务培训
- 业务功能详解
- 操作流程演示
- 问题处理实践

## 第5周：实操练习
- 开发实操练习
- 运维实操练习
- 业务实操练习
```

### 技术支持

#### 支持渠道

- **技术支持热线**：
  - 工作时间：9:00-18:00
  - 紧急支持：7×24小时
  - 联系方式：400-XXX-XXXX

- **在线支持**：
  - 技术支持邮箱：support@example.com
  - 在线工单系统：https://support.example.com
  - 技术论坛：https://forum.example.com

- **远程支持**：
  - 远程协助工具
  - 屏幕共享
  - 远程桌面

#### 支持流程

1. **问题提交**：
   - 通过工单系统提交问题
   - 提供问题描述和日志
   - 指定问题优先级

2. **问题处理**：
   - 技术支持团队接收问题
   - 分析问题原因
   - 提供解决方案

3. **问题跟踪**：
   - 跟踪问题处理进度
   - 更新问题状态
   - 确认问题解决

#### 知识库

- **常见问题（FAQ）**：
  - 整理常见问题和解决方案
  - 分类和标签管理
  - 搜索和检索功能

- **技术文档**：
  - 技术文档在线查看
  - 文档版本管理
  - 文档更新通知

- **最佳实践**：
  - 分享最佳实践案例
  - 经验总结和教训
  - 持续更新和改进
