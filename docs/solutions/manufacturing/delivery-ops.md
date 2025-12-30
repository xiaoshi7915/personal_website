# 11. 交付与运维

## 11.1 一键部署

### 部署方案

智能制造/工业4.0解决方案采用容器化部署，支持一键部署到Kubernetes集群：

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
    libopencv-dev \
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
      - DATABASE_URL=postgresql://user:password@db:5432/manufacturing_ai
      - REDIS_URL=redis://redis:6379/0
      - INFLUXDB_URL=http://influxdb:8086
    depends_on:
      - db
      - redis
      - influxdb
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=manufacturing_ai
    volumes:
      - db_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
  
  influxdb:
    image: influxdb:2.7
    volumes:
      - influxdb_data:/var/lib/influxdb2

volumes:
  db_data:
  redis_data:
  influxdb_data:
```

#### Kubernetes部署

**Deployment配置**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: manufacturing-ai-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: manufacturing-ai-api
  template:
    metadata:
      labels:
        app: manufacturing-ai-api
    spec:
      containers:
      - name: api
        image: manufacturing-ai:latest
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
  name: manufacturing-ai-api
spec:
  selector:
    app: manufacturing-ai-api
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
  name: manufacturing-ai-ingress
spec:
  rules:
  - host: manufacturing-ai.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: manufacturing-ai-api
            port:
              number: 80
```

### 部署脚本

#### 一键部署脚本

```bash
#!/bin/bash

# 一键部署脚本
set -e

echo "开始部署智能制造/工业4.0解决方案..."

# 检查环境
echo "检查环境..."
kubectl version --client
docker version

# 构建镜像
echo "构建Docker镜像..."
docker build -t manufacturing-ai:latest .

# 推送镜像（如果需要）
# docker push manufacturing-ai:latest

# 部署到Kubernetes
echo "部署到Kubernetes..."
kubectl apply -f k8s/

# 等待部署完成
echo "等待部署完成..."
kubectl wait --for=condition=available --timeout=300s deployment/manufacturing-ai-api

# 检查服务状态
echo "检查服务状态..."
kubectl get pods
kubectl get services

echo "部署完成！"
```

## 11.2 配置管理

### 环境配置

#### 配置文件结构

```
config/
├── base.yaml          # 基础配置
├── development.yaml   # 开发环境配置
├── staging.yaml       # 预发布环境配置
└── production.yaml    # 生产环境配置
```

#### 配置示例

```yaml
# base.yaml
database:
  host: localhost
  port: 5432
  name: manufacturing_ai
  pool_size: 10

redis:
  host: localhost
  port: 6379
  db: 0

ai_models:
  scheduling_model:
    path: models/scheduling_model.pkl
    version: v2.0
  quality_model:
    path: models/quality_model.pkl
    version: v1.5
  maintenance_model:
    path: models/maintenance_model.pkl
    version: v2.1

# production.yaml
database:
  host: ${DB_HOST}
  port: ${DB_PORT}
  name: ${DB_NAME}
  username: ${DB_USER}
  password: ${DB_PASSWORD}

redis:
  host: ${REDIS_HOST}
  port: ${REDIS_PORT}
  password: ${REDIS_PASSWORD}

logging:
  level: INFO
  file: /var/log/app.log
  max_size: 100MB
  backup_count: 10
```

### 密钥管理

#### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
stringData:
  url: postgresql://user:password@db:5432/manufacturing_ai
  username: user
  password: password
```

#### 使用密钥

```yaml
env:
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: db-secret
      key: url
```

## 11.3 版本管理

### 版本控制

#### Git工作流

- **主分支（main）**：
  - 生产环境代码
  - 稳定版本
  - 保护分支

- **开发分支（develop）**：
  - 开发环境代码
  - 功能开发
  - 测试集成

- **功能分支（feature）**：
  - 新功能开发
  - 从develop分支创建
  - 完成后合并到develop

- **发布分支（release）**：
  - 版本发布准备
  - 从develop分支创建
  - 完成后合并到main和develop

- **热修复分支（hotfix）**：
  - 紧急修复
  - 从main分支创建
  - 完成后合并到main和develop

#### 版本标签

- **语义化版本号**：
  - 格式：主版本号.次版本号.修订号（如v1.2.3）
  - 主版本号：重大架构变更
  - 次版本号：新功能添加
  - 修订号：Bug修复

- **版本标签**：
  - 生产版本：v1.0.0
  - 预发布版本：v1.0.0-rc1
  - 开发版本：v1.0.0-dev

## 11.4 持续集成/持续部署

### CI/CD流程

#### GitHub Actions配置

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

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
        pytest --cov=app --cov-report=xml
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build Docker image
      run: |
        docker build -t manufacturing-ai:${{ github.sha }} .
    - name: Push to registry
      run: |
        docker tag manufacturing-ai:${{ github.sha }} registry.example.com/manufacturing-ai:${{ github.sha }}
        docker push registry.example.com/manufacturing-ai:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/manufacturing-ai-api api=registry.example.com/manufacturing-ai:${{ github.sha }}
```

### 部署策略

#### 蓝绿部署

- **部署方式**：
  - 蓝环境：当前生产环境
  - 绿环境：新版本环境
  - 切换：流量从蓝环境切换到绿环境

- **优势**：
  - 快速回滚
  - 零停机部署
  - 风险可控

#### 金丝雀部署

- **部署方式**：
  - 逐步切换流量
  - 先切换10%流量
  - 验证无问题后逐步增加

- **优势**：
  - 风险分散
  - 逐步验证
  - 快速发现问题

## 11.5 运维管理

### 日常运维

#### 监控检查

- **每日检查**：
  - 系统健康状态
  - 服务可用性
  - 资源使用情况
  - 告警信息

- **每周检查**：
  - 性能指标分析
  - 日志分析
  - 安全扫描
  - 备份验证

#### 备份管理

- **数据备份**：
  - 数据库每日全量备份
  - 增量备份每6小时一次
  - 备份保留30天

- **配置备份**：
  - 配置文件备份
  - 密钥备份
  - 备份验证

#### 日志管理

- **日志收集**：
  - 应用日志收集
  - 系统日志收集
  - 日志分析

- **日志清理**：
  - 定期清理旧日志
  - 日志归档
  - 日志压缩

### 故障处理

#### 故障分类

- **P0故障**：
  - 服务完全不可用
  - 数据丢失
  - 安全漏洞

- **P1故障**：
  - 服务部分不可用
  - 性能严重下降
  - 功能异常

- **P2故障**：
  - 功能受限
  - 性能轻微下降
  - 用户体验影响

#### 故障处理流程

1. **故障发现**：
   - 监控告警
   - 用户报告
   - 主动检查

2. **故障评估**：
   - 评估故障严重程度
   - 评估影响范围
   - 制定处理计划

3. **故障处理**：
   - 隔离故障
   - 修复问题
   - 恢复服务

4. **故障总结**：
   - 分析故障原因
   - 总结经验教训
   - 改进措施

### 性能优化

#### 性能分析

- **性能监控**：
  - CPU使用率
  - 内存使用率
  - 磁盘I/O
  - 网络I/O

- **性能分析**：
  - 识别性能瓶颈
  - 分析性能问题
  - 制定优化方案

#### 优化措施

- **代码优化**：
  - 算法优化
  - 代码重构
  - 性能测试

- **架构优化**：
  - 缓存优化
  - 数据库优化
  - 负载均衡优化

