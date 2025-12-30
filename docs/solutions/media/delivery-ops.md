# 11. 交付与运维

## 11.1 一键部署

### 部署方案

智能媒体/内容解决方案采用容器化部署，支持一键部署到Kubernetes集群：

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
      - DATABASE_URL=postgresql://user:password@db:5432/media_ai
      - REDIS_URL=redis://redis:6379/0
      - VECTOR_DB_URL=http://milvus:19530
    depends_on:
      - db
      - redis
      - milvus
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=media_ai
    volumes:
      - db_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
  
  milvus:
    image: milvusdb/milvus:v2.3.0
    volumes:
      - milvus_data:/var/lib/milvus

volumes:
  db_data:
  redis_data:
  milvus_data:
```

#### Kubernetes部署

**Deployment配置**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: media-ai-api
spec:
  replicas: 5
  selector:
    matchLabels:
      app: media-ai-api
  template:
    metadata:
      labels:
        app: media-ai-api
    spec:
      containers:
      - name: api
        image: media-ai-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: media-ai-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: media-ai-secrets
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
  name: media-ai-api
spec:
  selector:
    app: media-ai-api
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
  name: media-ai-ingress
spec:
  rules:
  - host: api.media-ai.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: media-ai-api
            port:
              number: 80
```

## 11.2 CI/CD流程

### 持续集成

#### GitLab CI配置

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_IMAGE: registry.example.com/media-ai-api
  DOCKER_TAG: $CI_COMMIT_SHORT_SHA

test:
  stage: test
  image: python:3.11
  script:
    - pip install -r requirements.txt
    - pytest --cov=media_ai --cov-report=html
  coverage: '/TOTAL.*\s+(\d+%)$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $DOCKER_IMAGE:$DOCKER_TAG .
    - docker push $DOCKER_IMAGE:$DOCKER_TAG
    - docker tag $DOCKER_IMAGE:$DOCKER_TAG $DOCKER_IMAGE:latest
    - docker push $DOCKER_IMAGE:latest
  only:
    - main
    - develop

deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/media-ai-api api=$DOCKER_IMAGE:$DOCKER_TAG
    - kubectl rollout status deployment/media-ai-api
  only:
    - main
  environment:
    name: production
```

### 持续部署

#### 部署策略

- **蓝绿部署**：
  - 部署新版本到绿色环境
  - 切换流量到绿色环境
  - 保留蓝色环境作为回滚

- **金丝雀部署**：
  - 部署新版本到部分实例
  - 逐步增加流量
  - 监控指标，决定是否全量发布

- **滚动更新**：
  - 逐步更新实例
  - 保证服务可用性
  - 自动回滚机制

## 11.3 运维管理

### 日常运维

#### 监控和告警

- **系统监控**：
  - CPU、内存、磁盘监控
  - 网络流量监控
  - 服务健康监控

- **业务监控**：
  - API性能监控
  - 业务指标监控
  - 错误率监控

- **告警处理**：
  - 告警规则配置
  - 告警通知发送
  - 告警处理流程

#### 日志管理

- **日志收集**：
  - 应用日志收集
  - 系统日志收集
  - 访问日志收集

- **日志分析**：
  - 日志查询
  - 日志分析
  - 日志告警

#### 备份和恢复

- **数据备份**：
  - 数据库备份（每日全量备份，每小时增量备份）
  - 对象存储备份（每日备份）
  - 配置文件备份（每次变更备份）

- **数据恢复**：
  - 恢复流程
  - 恢复测试
  - 恢复演练

### 故障处理

#### 故障分类

- **P0故障**：系统完全不可用，立即处理
- **P1故障**：核心功能不可用，1小时内处理
- **P2故障**：部分功能不可用，4小时内处理
- **P3故障**：非核心功能问题，24小时内处理

#### 故障处理流程

1. **故障发现**：监控告警、用户反馈
2. **故障定位**：日志分析、性能分析
3. **故障处理**：修复问题、恢复服务
4. **故障总结**：故障分析、改进措施

### 容量规划

#### 资源规划

- **计算资源**：
  - 根据业务量规划实例数量
  - 预留20-30%的容量余量
  - 支持快速扩容

- **存储资源**：
  - 根据数据量规划存储容量
  - 预留30-50%的容量余量
  - 数据生命周期管理

- **网络资源**：
  - 根据流量规划带宽
  - 使用CDN减少带宽压力
  - 预留20-30%的带宽余量

#### 扩容计划

- **自动扩容**：
  - 基于监控指标自动扩容
  - 扩容阈值配置
  - 扩容速度控制

- **手动扩容**：
  - 重大活动前手动扩容
  - 扩容计划制定
  - 扩容后验证

## 11.4 运维工具

### 运维平台

#### 监控平台

- **Prometheus + Grafana**：
  - 指标收集和存储
  - 指标可视化
  - 告警配置

#### 日志平台

- **ELK Stack**：
  - 日志收集（Logstash）
  - 日志存储（Elasticsearch）
  - 日志分析（Kibana）

#### 追踪平台

- **Jaeger**：
  - 分布式追踪
  - 性能分析
  - 依赖分析

### 自动化工具

#### 部署工具

- **Helm**：Kubernetes应用部署
- **Terraform**：基础设施即代码
- **Ansible**：配置管理

#### 监控工具

- **Prometheus Operator**：Prometheus自动化管理
- **AlertManager**：告警管理
- **Blackbox Exporter**：黑盒监控

