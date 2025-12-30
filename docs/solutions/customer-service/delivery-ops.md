# 11. 交付与运维

## 11.1 一键部署

### 部署方案

智能客服系统采用容器化部署，支持一键部署到各种环境：

#### Docker Compose部署

**docker-compose.yml配置**：
```yaml
version: '3.8'

services:
  customer-service:
    image: customer-service:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/dbname
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=dbname
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Kubernetes部署

**deployment.yaml配置**：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: customer-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: customer-service
  template:
    metadata:
      labels:
        app: customer-service
    spec:
      containers:
      - name: customer-service
        image: customer-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
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
---
apiVersion: v1
kind: Service
metadata:
  name: customer-service
spec:
  selector:
    app: customer-service
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

### 部署脚本

#### 自动化部署脚本

**deploy.sh脚本**：
```bash
#!/bin/bash

set -e

# 配置变量
ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}
NAMESPACE=customer-service

echo "开始部署到 $ENVIRONMENT 环境..."

# 构建镜像
echo "构建Docker镜像..."
docker build -t customer-service:$IMAGE_TAG .

# 推送镜像
echo "推送镜像到镜像仓库..."
docker push customer-service:$IMAGE_TAG

# 部署到Kubernetes
echo "部署到Kubernetes..."
kubectl set image deployment/customer-service \
  customer-service=customer-service:$IMAGE_TAG \
  -n $NAMESPACE

# 等待部署完成
echo "等待部署完成..."
kubectl rollout status deployment/customer-service -n $NAMESPACE

# 健康检查
echo "执行健康检查..."
sleep 10
curl -f http://customer-service.$NAMESPACE.svc.cluster.local/health || exit 1

echo "部署完成！"
```

#### 部署流程

**1. 代码构建**
- 拉取最新代码
- 运行测试
- 构建Docker镜像

**2. 镜像推送**
- 推送到镜像仓库
- 打标签
- 版本管理

**3. 部署执行**
- 更新Kubernetes配置
- 执行滚动更新
- 验证部署结果

**4. 健康检查**
- 检查服务健康状态
- 检查关键指标
- 验证功能正常

### 环境配置

#### 环境变量配置

**开发环境**：
```env
ENVIRONMENT=development
DATABASE_URL=postgresql://localhost:5432/customer_service_dev
REDIS_URL=redis://localhost:6379
LOG_LEVEL=DEBUG
OPENAI_API_KEY=sk-dev-key
```

**测试环境**：
```env
ENVIRONMENT=testing
DATABASE_URL=postgresql://test-db:5432/customer_service_test
REDIS_URL=redis://test-redis:6379
LOG_LEVEL=INFO
OPENAI_API_KEY=sk-test-key
```

**生产环境**：
```env
ENVIRONMENT=production
DATABASE_URL=postgresql://prod-db:5432/customer_service_prod
REDIS_URL=redis://prod-redis:6379
LOG_LEVEL=WARNING
OPENAI_API_KEY=sk-prod-key
```

#### 配置管理

**使用ConfigMap**：
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: customer-service-config
data:
  environment: production
  log_level: INFO
  max_concurrent_requests: "100"
```

**使用Secret**：
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: customer-service-secret
type: Opaque
data:
  database_url: <base64-encoded>
  api_key: <base64-encoded>
```

## 11.2 灾备与回滚

### 灾备方案

#### 备份策略

**1. 数据备份**
- **全量备份**：每天凌晨2点执行
- **增量备份**：每小时执行
- **备份保留**：全量备份保留30天，增量备份保留7天

**2. 应用备份**
- **代码备份**：Git版本控制
- **配置备份**：配置文件版本管理
- **镜像备份**：镜像仓库备份

**3. 数据库备份**
```bash
#!/bin/bash
# 数据库备份脚本

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="customer_service"

# 全量备份
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -F c -f "$BACKUP_DIR/full_$DATE.dump"

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "full_*.dump" -mtime +30 -delete
```

#### 灾备演练

**演练频率**：每季度一次
**演练内容**：
1. 模拟数据库故障
2. 模拟服务器故障
3. 模拟网络故障
4. 验证恢复流程

**演练步骤**：
1. 创建测试环境
2. 模拟故障场景
3. 执行恢复流程
4. 验证恢复结果
5. 总结改进措施

### 回滚机制

#### 回滚策略

**1. 代码回滚**
- Git回滚到指定版本
- 重新构建镜像
- 重新部署

**2. 数据库回滚**
- 使用数据库备份恢复
- 执行数据库迁移回滚
- 验证数据一致性

**3. 配置回滚**
- 恢复到之前的配置
- 重新加载配置
- 验证配置生效

#### 回滚脚本

**rollback.sh脚本**：
```bash
#!/bin/bash

set -e

VERSION=${1:-previous}
NAMESPACE=customer-service

echo "回滚到版本 $VERSION..."

# 获取之前的版本
if [ "$VERSION" == "previous" ]; then
    VERSION=$(kubectl get deployment customer-service -n $NAMESPACE \
      -o jsonpath='{.spec.template.spec.containers[0].image}' | cut -d: -f2)
    VERSION=$(git log --oneline | head -2 | tail -1 | cut -d' ' -f1)
fi

# 回滚代码
echo "回滚代码到 $VERSION..."
git checkout $VERSION

# 构建镜像
echo "构建镜像..."
docker build -t customer-service:$VERSION .

# 部署
echo "部署版本 $VERSION..."
kubectl set image deployment/customer-service \
  customer-service=customer-service:$VERSION \
  -n $NAMESPACE

# 等待完成
kubectl rollout status deployment/customer-service -n $NAMESPACE

echo "回滚完成！"
```

### 数据备份

#### 备份方案

**1. 数据库备份**
- PostgreSQL：使用pg_dump
- MySQL：使用mysqldump
- MongoDB：使用mongodump

**2. 文件备份**
- 使用rsync同步
- 使用对象存储备份
- 定期归档

**3. 配置备份**
- Git版本控制
- 配置文件加密存储
- 定期导出

#### 备份恢复

**恢复流程**：
1. 停止服务
2. 恢复数据库
3. 恢复文件
4. 恢复配置
5. 启动服务
6. 验证恢复

**恢复脚本**：
```bash
#!/bin/bash

BACKUP_FILE=$1
DB_NAME="customer_service"

echo "开始恢复数据库..."

# 停止服务
kubectl scale deployment customer-service --replicas=0

# 恢复数据库
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -c $BACKUP_FILE

# 启动服务
kubectl scale deployment customer-service --replicas=3

echo "恢复完成！"
```

## 11.3 知识移交

### 文档体系

#### 文档分类

**1. 技术文档**
- 系统架构文档
- API文档
- 数据库设计文档
- 部署文档

**2. 运维文档**
- 运维手册
- 故障处理手册
- 监控告警手册
- 备份恢复手册

**3. 用户文档**
- 用户使用手册
- 管理员手册
- 常见问题FAQ
- 最佳实践指南

#### 文档管理

**文档存储**：
- 使用Git管理技术文档
- 使用Wiki管理用户文档
- 使用文档管理系统

**文档更新**：
- 定期更新文档
- 版本控制
- 变更记录

### 培训计划

#### 培训内容

**1. 技术培训**
- 系统架构介绍
- 技术栈介绍
- 开发规范
- 代码审查

**2. 运维培训**
- 部署流程
- 监控告警
- 故障处理
- 备份恢复

**3. 业务培训**
- 业务流程介绍
- 功能使用
- 问题处理
- 最佳实践

#### 培训方式

**1. 现场培训**
- 集中培训
- 实操演练
- 答疑解惑

**2. 在线培训**
- 视频教程
- 在线课程
- 远程指导

**3. 文档学习**
- 阅读文档
- 实践操作
- 问题反馈

### 技术支持

#### 支持方式

**1. 在线支持**
- 技术支持群
- 在线文档
- 知识库

**2. 电话支持**
- 7×24小时热线
- 紧急问题处理
- 技术咨询

**3. 现场支持**
- 现场部署
- 现场培训
- 现场问题处理

#### 支持流程

**1. 问题提交**
- 通过工单系统提交
- 描述问题详情
- 提供相关日志

**2. 问题处理**
- 问题分类和优先级
- 分配给技术支持
- 跟踪处理进度

**3. 问题解决**
- 提供解决方案
- 验证解决效果
- 记录问题总结