# 11. 交付与运维

## 11.1 一键部署

### 部署方案

智能人力资源系统采用容器化部署，支持一键部署到各种环境：

#### Docker Compose部署

**docker-compose.yml配置**：
```yaml
version: '3.8'

services:
  hr-ai-service:
    image: hr-ai-service:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/hr_ai
      - REDIS_URL=redis://redis:6379
      - MILVUS_HOST=milvus
      - MILVUS_PORT=19530
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
      - redis
      - milvus
    volumes:
      - ./logs:/app/logs
      - ./models:/app/models
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=hr_ai
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=hr_ai
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  milvus:
    image: milvusdb/milvus:latest
    ports:
      - "19530:19530"
    volumes:
      - milvus_data:/var/lib/milvus
    environment:
      - ETCD_ENDPOINTS=etcd:2379
    depends_on:
      - etcd
    restart: unless-stopped

  etcd:
    image: quay.io/coreos/etcd:v3.5.0
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
    volumes:
      - etcd_data:/etcd
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  milvus_data:
  etcd_data:
```

**部署命令**：
```bash
# 创建环境变量文件
cat > .env << EOF
DB_PASSWORD=your_password
OPENAI_API_KEY=your_api_key
EOF

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f hr-ai-service
```

#### Kubernetes部署

**deployment.yaml配置**：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hr-ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hr-ai-service
  template:
    metadata:
      labels:
        app: hr-ai-service
    spec:
      containers:
      - name: hr-ai-service
        image: hr-ai-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: hr-ai-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: hr-ai-secrets
              key: redis-url
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
---
apiVersion: v1
kind: Service
metadata:
  name: hr-ai-service
spec:
  selector:
    app: hr-ai-service
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

**部署命令**：
```bash
# 创建命名空间
kubectl create namespace hr-ai

# 创建密钥
kubectl create secret generic hr-ai-secrets \
  --from-literal=database-url=postgresql://user:pass@db:5432/hr_ai \
  --from-literal=redis-url=redis://redis:6379 \
  -n hr-ai

# 部署服务
kubectl apply -f deployment.yaml -n hr-ai

# 查看部署状态
kubectl get pods -n hr-ai
kubectl get services -n hr-ai
```

## 11.2 CI/CD流程

### 持续集成

#### CI流程

**GitHub Actions配置**：
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      run: |
        pytest --cov=src --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml

  lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install flake8 black mypy
    
    - name: Run linters
      run: |
        flake8 src
        black --check src
        mypy src
```

### 持续部署

#### CD流程

**GitHub Actions CD配置**：
```yaml
name: CD

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Registry
      uses: docker/login-action@v2
      with:
        registry: registry.example.com
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          registry.example.com/hr-ai-service:latest
          registry.example.com/hr-ai-service:${{ github.sha }}
    
    - name: Deploy to Kubernetes
      uses: kubectl-action@v1
      with:
        kubectl: kubectl
        config: ${{ secrets.KUBECONFIG }}
        command: |
          kubectl set image deployment/hr-ai-service \
            hr-ai-service=registry.example.com/hr-ai-service:${{ github.sha }} \
            -n hr-ai
          kubectl rollout status deployment/hr-ai-service -n hr-ai
```

## 11.3 运维管理

### 监控与告警

#### 监控指标

**系统监控**：
- CPU使用率
- 内存使用率
- 磁盘使用率
- 网络流量

**应用监控**：
- 请求量
- 响应时间
- 错误率
- 可用性

**业务监控**：
- 招聘匹配度
- 简历筛选时间
- 员工留存率
- 培训转化率

#### 告警配置

**Prometheus告警规则**：
```yaml
groups:
- name: hr-ai-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "错误率过高"
      description: "错误率超过1%，持续5分钟"
  
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "响应时间过高"
      description: "P95响应时间超过2秒，持续10分钟"
  
  - alert: LowAvailability
    expr: (up == 0) or (rate(http_requests_total[5m]) == 0)
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "服务不可用"
      description: "服务不可用，持续5分钟"
```

### 日志管理

#### 日志收集

**ELK Stack配置**：
```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

### 备份与恢复

#### 数据备份

**数据库备份**：
```bash
#!/bin/bash
# 数据库备份脚本

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hr_ai_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -h db -U hr_ai -d hr_ai > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_FILE.gz"
```

**文件备份**：
```bash
#!/bin/bash
# 文件备份脚本

BACKUP_DIR="/backup/files"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/files_$DATE.tar.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份文件
tar -czf $BACKUP_FILE /app/data /app/models

# 上传到对象存储
aws s3 cp $BACKUP_FILE s3://backup-bucket/hr-ai/

# 删除本地备份（保留7天）
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_FILE"
```

#### 数据恢复

**数据库恢复**：
```bash
#!/bin/bash
# 数据库恢复脚本

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "用法: $0 <备份文件>"
    exit 1
fi

# 解压备份文件
gunzip -c $BACKUP_FILE > /tmp/restore.sql

# 恢复数据库
psql -h db -U hr_ai -d hr_ai < /tmp/restore.sql

# 清理临时文件
rm /tmp/restore.sql

echo "恢复完成"
```

### 故障处理

#### 故障分类

**P0故障**（严重）：
- 系统完全不可用
- 数据丢失或损坏
- 安全漏洞

**P1故障**（重要）：
- 核心功能不可用
- 性能严重下降
- 部分数据异常

**P2故障**（一般）：
- 非核心功能不可用
- 性能轻微下降
- 不影响主要业务

#### 故障处理流程

1. **故障发现**：监控系统发现故障，触发告警
2. **故障确认**：运维人员确认故障，评估影响范围
3. **故障处理**：根据故障类型采取相应处理措施
4. **故障恢复**：恢复服务，验证功能正常
5. **故障复盘**：分析故障原因，制定改进措施

#### 故障处理手册

**常见故障处理**：

**数据库连接失败**：
1. 检查数据库服务状态
2. 检查网络连接
3. 检查数据库配置
4. 重启数据库服务

**服务响应慢**：
1. 检查系统资源使用情况
2. 检查数据库查询性能
3. 检查缓存命中率
4. 扩容服务实例

**API错误率高**：
1. 检查应用日志
2. 检查依赖服务状态
3. 检查配置是否正确
4. 回滚到上一个稳定版本

