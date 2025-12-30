# 11. 交付与运维

## 11.1 一键部署

### 部署方案

智能文档处理系统采用容器化部署，支持一键部署到各种环境：

#### Docker Compose部署

**docker-compose.yml配置**：
```yaml
version: '3.8'

services:
  document-processing:
    image: document-processing:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/dbname
      - REDIS_URL=redis://redis:6379
      - OCR_SERVICE_URL=http://ocr-service:8001
    depends_on:
      - db
      - redis
      - ocr-service
    volumes:
      - ./logs:/app/logs
      - ./documents:/app/documents
    restart: unless-stopped

  ocr-service:
    image: ocr-service:latest
    ports:
      - "8001:8001"
    environment:
      - GPU_ENABLED=true
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
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
  name: document-processing
spec:
  replicas: 3
  selector:
    matchLabels:
      app: document-processing
  template:
    metadata:
      labels:
        app: document-processing
    spec:
      containers:
      - name: document-processing
        image: document-processing:latest
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
            cpu: 1000m
            memory: 2Gi
          limits:
            cpu: 4000m
            memory: 8Gi
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

### 部署脚本

#### 自动化部署脚本

**deploy.sh脚本**：
```bash
#!/bin/bash

set -e

ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}
NAMESPACE=document-processing

echo "开始部署到 $ENVIRONMENT 环境..."

# 构建镜像
echo "构建Docker镜像..."
docker build -t document-processing:$IMAGE_TAG .

# 推送镜像
echo "推送镜像到镜像仓库..."
docker push document-processing:$IMAGE_TAG

# 部署到Kubernetes
echo "部署到Kubernetes..."
kubectl set image deployment/document-processing \
  document-processing=document-processing:$IMAGE_TAG \
  -n $NAMESPACE

# 等待部署完成
echo "等待部署完成..."
kubectl rollout status deployment/document-processing -n $NAMESPACE

# 健康检查
echo "执行健康检查..."
sleep 10
curl -f http://document-processing.$NAMESPACE.svc.cluster.local/health || exit 1

echo "部署完成！"
```

### 环境配置

#### 环境变量配置

**开发环境**：
```env
ENVIRONMENT=development
DATABASE_URL=postgresql://localhost:5432/document_processing_dev
REDIS_URL=redis://localhost:6379
OCR_SERVICE_URL=http://localhost:8001
LOG_LEVEL=DEBUG
```

**生产环境**：
```env
ENVIRONMENT=production
DATABASE_URL=postgresql://prod-db:5432/document_processing_prod
REDIS_URL=redis://prod-redis:6379
OCR_SERVICE_URL=http://ocr-service:8001
LOG_LEVEL=WARNING
```

## 11.2 灾备与回滚

### 灾备方案

#### 备份策略

**1. 数据备份**
- **全量备份**：每天凌晨2点执行
- **增量备份**：每小时执行
- **备份保留**：全量备份保留30天，增量备份保留7天

**2. 文档备份**
- **文档存储备份**：定期备份文档文件
- **处理结果备份**：备份处理结果数据
- **备份保留**：文档备份保留90天

**3. 数据库备份**
```bash
#!/bin/bash
# 数据库备份脚本

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="document_processing"

# 全量备份
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -F c -f "$BACKUP_DIR/full_$DATE.dump"

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "full_*.dump" -mtime +30 -delete
```

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