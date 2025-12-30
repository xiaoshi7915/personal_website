# 11. 交付与运维

## 11.1 一键部署

### 部署方案

智能代码生成系统支持多种部署方式，包括Docker容器化部署、Kubernetes集群部署等。

#### Docker Compose部署
适合小规模部署和开发测试环境。

**docker-compose.yml示例**：
```yaml
version: '3.8'

services:
  api:
    image: codegen-api:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/codegen
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
      
  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=codegen
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - db_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
      
  vector-db:
    image: milvusdb/milvus:latest
    ports:
      - "19530:19530"
    volumes:
      - milvus_data:/var/lib/milvus
      
volumes:
  db_data:
  redis_data:
  milvus_data:
```

#### Kubernetes部署
适合生产环境大规模部署。

**部署清单示例**：
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: codegen-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: codegen-api
  template:
    metadata:
      labels:
        app: codegen-api
    spec:
      containers:
      - name: api
        image: codegen-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: codegen-secrets
              key: database-url
        resources:
          requests:
            cpu: "2"
            memory: "4Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: codegen-api
spec:
  selector:
    app: codegen-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

### 部署脚本

#### 一键部署脚本
```bash
#!/bin/bash
# 一键部署脚本

set -e

echo "开始部署智能代码生成系统..."

# 1. 检查环境
echo "检查环境..."
check_environment() {
    if ! command -v docker &> /dev/null; then
        echo "错误: 未安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "错误: 未安装Docker Compose"
        exit 1
    fi
}

# 2. 加载环境变量
echo "加载环境变量..."
if [ -f .env ]; then
    source .env
else
    echo "警告: 未找到.env文件，使用默认配置"
fi

# 3. 创建必要的目录
echo "创建目录..."
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/milvus
mkdir -p logs

# 4. 启动服务
echo "启动服务..."
docker-compose up -d

# 5. 等待服务就绪
echo "等待服务就绪..."
sleep 30

# 6. 健康检查
echo "健康检查..."
check_health() {
    for i in {1..30}; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            echo "服务健康检查通过"
            return 0
        fi
        sleep 2
    done
    echo "错误: 服务健康检查失败"
    return 1
}

check_health

# 7. 初始化数据
echo "初始化数据..."
docker-compose exec api python manage.py migrate
docker-compose exec api python manage.py init_data

echo "部署完成！"
echo "访问地址: http://localhost:8000"
```

### 环境配置

#### 环境变量配置
```bash
# .env文件示例
# 数据库配置
DATABASE_URL=postgresql://user:password@db:5432/codegen

# Redis配置
REDIS_URL=redis://redis:6379/0

# 向量数据库配置
MILVUS_HOST=vector-db
MILVUS_PORT=19530

# API配置
API_HOST=0.0.0.0
API_PORT=8000

# 模型配置
OPENAI_API_KEY=sk-xxx
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AZURE_OPENAI_API_KEY=xxx

# 安全配置
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

#### 配置文件
```yaml
# config.yaml
database:
  url: ${DATABASE_URL}
  pool_size: 20
  max_overflow: 10

redis:
  url: ${REDIS_URL}
  pool_size: 10

milvus:
  host: ${MILVUS_HOST}
  port: ${MILVUS_PORT}

models:
  default: codellama-7b
  available:
    - codellama-7b
    - codellama-34b
    - gpt-4
    - claude-3

cache:
  enabled: true
  ttl: 3600
  max_size: 10000

monitoring:
  enabled: true
  prometheus_port: 9090
```

## 11.2 灾备与回滚

### 灾备方案

#### 数据备份策略
- **全量备份**：每天凌晨进行全量备份
- **增量备份**：每小时进行增量备份
- **备份存储**：备份存储到对象存储（OSS/S3），保留30天
- **备份验证**：定期验证备份完整性

#### 备份脚本
```bash
#!/bin/bash
# 数据备份脚本

BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 数据库备份
echo "备份数据库..."
docker-compose exec db pg_dump -U user codegen > $BACKUP_DIR/db.sql

# Redis备份
echo "备份Redis..."
docker-compose exec redis redis-cli SAVE
docker cp codegen_redis_1:/data/dump.rdb $BACKUP_DIR/redis.rdb

# 向量数据库备份
echo "备份向量数据库..."
docker-compose exec vector-db milvus backup -b $BACKUP_DIR/milvus

# 上传到对象存储
echo "上传备份..."
ossutil cp -r $BACKUP_DIR oss://codegen-backup/$(date +%Y%m%d)/

echo "备份完成: $BACKUP_DIR"
```

#### 灾备恢复流程
```bash
#!/bin/bash
# 灾备恢复脚本

BACKUP_DATE=$1
if [ -z "$BACKUP_DATE" ]; then
    echo "用法: $0 YYYYMMDD"
    exit 1
fi

echo "开始恢复备份: $BACKUP_DATE"

# 1. 停止服务
echo "停止服务..."
docker-compose down

# 2. 下载备份
echo "下载备份..."
ossutil cp -r oss://codegen-backup/$BACKUP_DATE/ /backup/restore/

# 3. 恢复数据库
echo "恢复数据库..."
docker-compose up -d db
sleep 10
docker-compose exec -T db psql -U user codegen < /backup/restore/db.sql

# 4. 恢复Redis
echo "恢复Redis..."
docker-compose up -d redis
docker cp /backup/restore/redis.rdb codegen_redis_1:/data/dump.rdb
docker-compose restart redis

# 5. 恢复向量数据库
echo "恢复向量数据库..."
docker-compose up -d vector-db
docker-compose exec vector-db milvus restore -b /backup/restore/milvus

# 6. 启动服务
echo "启动服务..."
docker-compose up -d

echo "恢复完成"
```

### 回滚机制

#### 版本管理
使用Git管理代码版本，Docker镜像使用版本标签。

**版本标签规则**：
- **主版本号**：重大变更（如v1.0.0）
- **次版本号**：功能更新（如v1.1.0）
- **修订版本号**：bug修复（如v1.1.1）

#### 回滚流程
```bash
#!/bin/bash
# 回滚脚本

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "用法: $0 VERSION"
    echo "可用版本:"
    docker images | grep codegen-api
    exit 1
fi

echo "回滚到版本: $VERSION"

# 1. 备份当前版本
echo "备份当前版本..."
docker tag codegen-api:latest codegen-api:backup-$(date +%Y%m%d-%H%M%S)

# 2. 拉取目标版本
echo "拉取目标版本..."
docker pull codegen-api:$VERSION

# 3. 更新服务
echo "更新服务..."
docker-compose up -d --no-deps api

# 4. 健康检查
echo "健康检查..."
sleep 10
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "回滚成功"
else
    echo "回滚失败，恢复原版本..."
    docker-compose up -d --no-deps api
    exit 1
fi
```

### 数据备份

#### 备份策略
- **备份频率**：全量备份每天1次，增量备份每小时1次
- **备份保留**：全量备份保留30天，增量备份保留7天
- **备份验证**：每周验证备份完整性
- **异地备份**：重要数据异地备份

#### 备份监控
- **备份状态监控**：监控备份任务状态
- **备份告警**：备份失败时告警
- **备份报告**：定期生成备份报告

## 11.3 知识移交

### 文档体系

#### 技术文档
- **架构文档**：系统架构设计文档
- **API文档**：API接口文档
- **部署文档**：部署和运维文档
- **开发文档**：开发指南和最佳实践

#### 运维文档
- **运维手册**：日常运维操作手册
- **故障处理手册**：常见故障处理方法
- **应急预案**：应急处理预案
- **监控告警手册**：监控和告警配置手册

#### 用户文档
- **用户手册**：用户使用手册
- **快速开始**：快速开始指南
- **FAQ**：常见问题解答
- **最佳实践**：使用最佳实践

### 培训计划

#### 技术培训
- **系统架构培训**：系统架构和技术栈培训
- **开发培训**：开发规范和最佳实践培训
- **运维培训**：运维操作和故障处理培训

#### 业务培训
- **功能培训**：系统功能和使用方法培训
- **场景培训**：典型使用场景培训
- **最佳实践培训**：最佳实践和案例分享

#### 培训材料
- **培训PPT**：培训课件
- **操作视频**：操作演示视频
- **实验环境**：实验环境供练习
- **考试题库**：培训考试题库

### 技术支持

#### 支持渠道
- **技术支持邮箱**：support@codegen.com
- **技术支持电话**：400-xxx-xxxx
- **在线客服**：在线客服系统
- **技术社区**：技术社区论坛

#### 支持级别
- **L1支持**：基础问题解答，响应时间&lt;4小时
- **L2支持**：技术问题处理，响应时间&lt;2小时
- **L3支持**：紧急问题处理，响应时间&lt;1小时
- **L4支持**：现场支持，7×24小时

#### SLA承诺
- **可用性**：系统可用性≥99.9%
- **响应时间**：API响应时间P95&lt;3s
- **支持响应**：L1支持响应时间&lt;4小时
- **问题解决**：一般问题24小时内解决，紧急问题4小时内解决
