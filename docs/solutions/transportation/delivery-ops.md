# 11. 交付与运维

## 11.1 部署架构

### Docker部署

#### Docker Compose配置

**docker-compose.yml**：
```yaml
version: '3.8'

services:
  transportation-api:
    image: transportation-api:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/transportation_db
      - REDIS_URL=redis://redis:6379
      - API_KEY=${API_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/var/log/transportation
    networks:
      - transportation-network

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=transportation_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - transportation-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - transportation-network

volumes:
  postgres_data:
  redis_data:

networks:
  transportation-network:
```

### Kubernetes部署

#### Deployment配置

**deployment.yaml**：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: transportation-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: transportation-api
  template:
    metadata:
      labels:
        app: transportation-api
    spec:
      containers:
      - name: transportation-api
        image: transportation-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: transportation-secrets
              key: database-url
        resources:
          requests:
            cpu: 1000m
            memory: 2Gi
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

#### Service配置

**service.yaml**：
```yaml
apiVersion: v1
kind: Service
metadata:
  name: transportation-api
spec:
  selector:
    app: transportation-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

#### Ingress配置

**ingress.yaml**：
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: transportation-ingress
spec:
  rules:
  - host: api.transportation-ai.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: transportation-api
            port:
              number: 80
```

### 部署步骤

#### 1. 准备工作

**环境准备**：
- 创建Kubernetes集群
- 配置存储和网络
- 准备镜像仓库

**配置准备**：
- 准备配置文件
- 准备密钥和证书
- 准备数据备份

#### 2. 部署应用

**部署命令**：
```bash
# 创建命名空间
kubectl create namespace transportation-system --dry-run=client -o yaml | kubectl apply -f -

# 创建配置和密钥
kubectl apply -f k8s/config.yaml -n transportation-system

# 部署应用
kubectl apply -f k8s/deployment.yaml -n transportation-system
kubectl apply -f k8s/service.yaml -n transportation-system
kubectl apply -f k8s/ingress.yaml -n transportation-system

# 等待部署完成
kubectl wait --for=condition=available --timeout=300s deployment/transportation-api -n transportation-system
```

#### 3. 验证部署

**验证步骤**：
- 检查Pod状态
- 检查服务状态
- 检查Ingress状态
- 测试API接口

**验证命令**：
```bash
# 检查Pod
kubectl get pods -n transportation-system

# 检查服务
kubectl get svc -n transportation-system

# 检查Ingress
kubectl get ingress -n transportation-system

# 测试API
curl https://api.transportation-ai.com/health
```

## 11.2 配置管理

### 配置分类

#### 1. 应用配置

**配置文件**：`config.yaml`
```yaml
app:
  name: transportation-api
  version: v1.0.0
  debug: false
  log_level: INFO

api:
  host: 0.0.0.0
  port: 8000
  timeout: 30

database:
  host: postgres
  port: 5432
  name: transportation_db
  pool_size: 10
  max_overflow: 20

redis:
  host: redis
  port: 6379
  db: 0
  max_connections: 100
```

#### 2. 环境变量

**环境变量配置**：
```bash
# 数据库配置
DATABASE_URL=postgresql://user:password@postgres:5432/transportation_db

# Redis配置
REDIS_URL=redis://redis:6379

# API配置
API_KEY=your_api_key
API_SECRET=your_api_secret

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=/var/log/transportation-api.log
```

### ConfigMap和Secret

#### ConfigMap配置

**configmap.yaml**：
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: transportation-config
data:
  app.yaml: |
    app:
      name: transportation-api
      log_level: INFO
    api:
      timeout: 30
```

#### Secret配置

**secret.yaml**：
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: transportation-secrets
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc3dvcmRAdXBzdHJlczo1NDMyL3RyYW5zcG9ydGF0aW9uX2Ri  # base64编码
  api-key: eW91cl9hcGlfa2V5  # base64编码
```

## 11.3 版本管理

### 版本命名

#### 语义化版本

**版本格式**：`主版本号.次版本号.修订号`

**版本示例**：
- `1.0.0`：首个稳定版本
- `1.1.0`：新功能版本
- `1.1.1`：Bug修复版本
- `2.0.0`：重大更新版本

### 版本发布流程

#### 1. 开发阶段

**分支管理**：
- `main`：主分支，稳定版本
- `develop`：开发分支
- `feature/*`：功能分支
- `hotfix/*`：热修复分支

#### 2. 测试阶段

**测试流程**：
- 单元测试
- 集成测试
- E2E测试
- 性能测试

#### 3. 发布阶段

**发布流程**：
- 代码审查
- 版本号更新
- 构建镜像
- 部署测试环境
- 部署生产环境

### 回滚机制

#### 快速回滚

**回滚命令**：
```bash
# 回滚到上一个版本
kubectl rollout undo deployment/transportation-api -n transportation-system

# 回滚到指定版本
kubectl rollout undo deployment/transportation-api --to-revision=2 -n transportation-system

# 查看回滚历史
kubectl rollout history deployment/transportation-api -n transportation-system
```

## 11.4 备份恢复

### 数据备份

#### 数据库备份

**备份脚本**：
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backup/transportation
BACKUP_FILE=$BACKUP_DIR/transportation_db_$DATE.sql

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -h postgres -U user -d transportation_db > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

#### 定时备份

**Cron配置**：
```bash
# 每天凌晨2点备份
0 2 * * * /scripts/backup_database.sh
```

### 数据恢复

#### 恢复步骤

**恢复命令**：
```bash
# 停止应用
kubectl scale deployment transportation-api --replicas=0 -n transportation-system

# 恢复数据库
gunzip < backup_file.sql.gz | psql -h postgres -U user -d transportation_db

# 启动应用
kubectl scale deployment transportation-api --replicas=3 -n transportation-system
```

## 11.5 运维监控

### 健康检查

#### 健康检查接口

**实现示例**：
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/ready")
async def ready_check():
    """就绪检查接口"""
    # 检查数据库连接
    db_status = check_database()
    # 检查Redis连接
    redis_status = check_redis()
    
    if db_status and redis_status:
        return {"status": "ready"}
    else:
        return {"status": "not ready"}, 503
```

### 日志管理

#### 日志收集

**日志配置**：
```python
import logging
import sys

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/transportation-api.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
```

### 故障处理

#### 故障响应流程

**1. 故障检测**
- 监控告警
- 用户反馈
- 系统检测

**2. 故障定位**
- 查看日志
- 检查指标
- 分析链路

**3. 故障处理**
- 快速恢复
- 根本修复
- 预防措施

#### 常见故障处理

**数据库连接故障**：
- 检查数据库状态
- 检查网络连接
- 重启数据库服务

**API响应超时**：
- 检查服务负载
- 检查依赖服务
- 扩容服务实例

**内存泄漏**：
- 检查内存使用
- 分析内存泄漏原因
- 修复代码或重启服务

