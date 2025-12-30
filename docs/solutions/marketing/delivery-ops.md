# 11. 交付与运维

## 11.1 一键部署

### 部署方案

智能营销系统采用容器化部署，支持一键部署到各种环境：

#### Docker Compose部署

**docker-compose.yml配置**：
```yaml
version: '3.8'

services:
  marketing-service:
    image: marketing-service:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/marketing
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
      - POSTGRES_DB=marketing
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

**部署命令**：
```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

#### Kubernetes部署

**deployment.yaml配置**：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: marketing-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: marketing-service
  template:
    metadata:
      labels:
        app: marketing-service
    spec:
      containers:
      - name: marketing-service
        image: marketing-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2
            memory: 4Gi
```

**部署命令**：
```bash
# 部署应用
kubectl apply -f deployment.yaml

# 查看状态
kubectl get pods

# 查看日志
kubectl logs -f deployment/marketing-service
```

### 部署脚本

**自动化部署脚本**：
```bash
#!/bin/bash

# 部署脚本
set -e

echo "开始部署智能营销系统..."

# 1. 检查环境
echo "检查环境..."
python --version
docker --version
kubectl version --client

# 2. 构建镜像
echo "构建Docker镜像..."
docker build -t marketing-service:latest .

# 3. 推送镜像
echo "推送镜像到镜像仓库..."
docker push registry.example.com/marketing-service:latest

# 4. 部署到Kubernetes
echo "部署到Kubernetes..."
kubectl apply -f k8s/

# 5. 等待部署完成
echo "等待部署完成..."
kubectl wait --for=condition=available --timeout=300s deployment/marketing-service

# 6. 健康检查
echo "健康检查..."
curl -f http://localhost:8000/health || exit 1

echo "部署完成！"
```

### 环境配置

**环境变量配置**：
```bash
# .env文件
DATABASE_URL=postgresql://user:pass@localhost:5432/marketing
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-xxx
LOG_LEVEL=INFO
ENVIRONMENT=production
```

**配置管理**：
- 使用ConfigMap管理配置
- 使用Secret管理敏感信息
- 支持多环境配置（开发、测试、生产）

## 11.2 灾备与回滚

### 灾备方案

**多机房部署**：
- 主机房：主要服务
- 备机房：备份服务
- 数据同步：实时数据同步

**数据备份**：
- **全量备份**：每天全量备份
- **增量备份**：每小时增量备份
- **备份存储**：异地备份存储
- **备份验证**：定期验证备份可用性

**灾备演练**：
- 定期进行灾备演练
- 验证灾备方案有效性
- 优化灾备流程

### 回滚机制

**版本管理**：
- 使用Git管理代码版本
- 使用Docker Tag管理镜像版本
- 使用Helm管理Kubernetes部署版本

**回滚流程**：
1. 识别问题版本
2. 选择回滚目标版本
3. 执行回滚操作
4. 验证回滚结果

**回滚实现**：
```bash
#!/bin/bash

# 回滚脚本
VERSION=$1

if [ -z "$VERSION" ]; then
    echo "请指定回滚版本"
    exit 1
fi

echo "回滚到版本: $VERSION"

# 1. 回滚代码
git checkout $VERSION

# 2. 构建镜像
docker build -t marketing-service:$VERSION .

# 3. 更新Kubernetes部署
kubectl set image deployment/marketing-service \
    marketing-service=marketing-service:$VERSION

# 4. 等待回滚完成
kubectl rollout status deployment/marketing-service

echo "回滚完成！"
```

### 数据备份

**备份策略**：
- **数据库备份**：每天全量备份，每小时增量备份
- **文件备份**：每天备份重要文件
- **配置备份**：每次变更后备份配置

**备份实现**：
```bash
#!/bin/bash

# 数据库备份脚本
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 全量备份
pg_dump -h localhost -U user marketing > $BACKUP_DIR/full_backup.sql

# 压缩备份
gzip $BACKUP_DIR/full_backup.sql

# 上传到对象存储
aws s3 cp $BACKUP_DIR/full_backup.sql.gz \
    s3://backup-bucket/marketing/$(date +%Y%m%d)/

echo "备份完成: $BACKUP_DIR"
```

## 11.3 知识移交

### 文档体系

**技术文档**：
- 系统架构文档
- API文档
- 部署文档
- 运维手册

**业务文档**：
- 业务流程图
- 用户手册
- 操作指南
- 常见问题

**运维文档**：
- 监控告警配置
- 故障处理手册
- 应急预案
- 变更记录

### 培训计划

**培训内容**：
- 系统架构和原理
- 功能使用培训
- 运维操作培训
- 故障处理培训

**培训方式**：
- 现场培训
- 在线培训
- 视频教程
- 文档学习

**培训计划**：
- **第1周**：系统架构和原理培训
- **第2周**：功能使用培训
- **第3周**：运维操作培训
- **第4周**：故障处理培训

### 技术支持

**支持方式**：
- **在线支持**：7×24小时在线支持
- **电话支持**：工作时间电话支持
- **邮件支持**：邮件技术支持
- **远程支持**：远程协助支持

**支持流程**：
1. 接收支持请求
2. 分析问题
3. 提供解决方案
4. 跟踪问题解决
5. 总结问题经验

**支持工具**：
- 工单系统
- 知识库
- 远程协助工具
- 监控系统
