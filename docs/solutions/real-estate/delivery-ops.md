# 11. 交付与运维

## 11.1 一键部署

### 部署方案

智能房地产解决方案采用容器化部署，支持一键部署到Kubernetes集群：

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
      - DATABASE_URL=postgresql://user:password@db:5432/real_estate_ai
      - REDIS_URL=redis://redis:6379/0
      - MILVUS_URL=http://milvus:19530
    depends_on:
      - db
      - redis
      - milvus
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=real_estate_ai
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
  name: real-estate-ai-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: real-estate-ai-api
  template:
    metadata:
      labels:
        app: real-estate-ai-api
    spec:
      containers:
      - name: api
        image: real-estate-ai-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: real-estate-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: real-estate-secrets
              key: redis-url
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 2Gi
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
  name: real-estate-ai-api
spec:
  selector:
    app: real-estate-ai-api
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
  name: real-estate-ai-ingress
spec:
  rules:
  - host: api.real-estate.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: real-estate-ai-api
            port:
              number: 80
```

### 一键部署脚本

#### 部署脚本示例

```bash
#!/bin/bash

# 一键部署脚本
set -e

echo "开始部署智能房地产解决方案..."

# 1. 检查环境
echo "检查环境..."
kubectl version --client
docker version

# 2. 构建镜像
echo "构建Docker镜像..."
docker build -t real-estate-ai-api:latest .

# 3. 推送镜像
echo "推送镜像到镜像仓库..."
docker tag real-estate-ai-api:latest registry.example.com/real-estate-ai-api:latest
docker push registry.example.com/real-estate-ai-api:latest

# 4. 部署到Kubernetes
echo "部署到Kubernetes..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 5. 等待部署完成
echo "等待部署完成..."
kubectl wait --for=condition=available --timeout=300s deployment/real-estate-ai-api -n real-estate

# 6. 验证部署
echo "验证部署..."
kubectl get pods -n real-estate
kubectl get services -n real-estate

echo "部署完成！"
```

## 11.2 配置管理

### 配置分类

#### 环境配置

- **开发环境配置**：
  - 数据库连接配置
  - Redis连接配置
  - 外部服务配置

- **测试环境配置**：
  - 测试数据库配置
  - 测试Redis配置
  - 测试外部服务配置

- **生产环境配置**：
  - 生产数据库配置
  - 生产Redis配置
  - 生产外部服务配置

#### 应用配置

- **功能开关**：
  - 功能启用/禁用
  - A/B测试配置
  - 灰度发布配置

- **业务配置**：
  - 推荐算法参数
  - 评估模型参数
  - 审查规则配置

### 配置管理方案

#### ConfigMap配置

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: real-estate-config
data:
  app.properties: |
    # 应用配置
    app.name=智能房地产解决方案
    app.version=1.0.0
    
    # 推荐配置
    recommendation.model=hybrid
    recommendation.top_k=10
    
    # 评估配置
    evaluation.model=xgboost
    evaluation.confidence_threshold=0.8
```

#### Secret配置

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: real-estate-secrets
type: Opaque
data:
  database-url: <base64-encoded-value>
  redis-url: <base64-encoded-value>
  api-key: <base64-encoded-value>
```

## 11.3 版本管理

### 版本发布流程

#### 版本命名规则

- **语义化版本号**：
  - 格式：主版本号.次版本号.修订号（如1.2.3）
  - 主版本号：重大架构变更
  - 次版本号：新功能添加
  - 修订号：Bug修复

#### 发布流程

1. **开发阶段**：
   - 功能开发
   - 单元测试
   - 代码审查

2. **测试阶段**：
   - 集成测试
   - 系统测试
   - 用户验收测试

3. **预发布阶段**：
   - 预发布环境部署
   - 预发布验证
   - 性能测试

4. **发布阶段**：
   - 生产环境部署
   - 灰度发布
   - 全量发布

5. **验证阶段**：
   - 生产环境验证
   - 监控告警
   - 问题修复

### 灰度发布

#### 灰度策略

- **用户灰度**：
  - 10%用户灰度
  - 50%用户灰度
  - 100%用户全量

- **地域灰度**：
  - 单个地域灰度
  - 多个地域灰度
  - 全国全量

#### 灰度监控

- **指标监控**：
  - 错误率监控
  - 响应时间监控
  - 业务指标监控

- **回滚机制**：
  - 自动回滚（错误率&gt;5%）
  - 手动回滚
  - 回滚验证

## 11.4 运维监控

### 监控指标

#### 系统监控

- **资源监控**：
  - CPU使用率
  - 内存使用率
  - 磁盘使用率
  - 网络使用率

- **服务监控**：
  - 服务可用性
  - 服务响应时间
  - 服务错误率

#### 业务监控

- **业务指标监控**：
  - 推荐任务数
  - 推荐成功率
  - 评估任务数
  - 评估准确率

### 告警机制

#### 告警规则

- **系统告警**：
  - CPU使用率 > 90%
  - 内存使用率 > 90%
  - 磁盘使用率 > 90%
  - 服务不可用

- **业务告警**：
  - 推荐成功率 < 90%
  - 评估准确率 < 90%
  - 错误率 > 1%

#### 告警通知

- **通知渠道**：
  - 邮件通知
  - 短信通知
  - 钉钉/企业微信通知

- **告警升级**：
  - 一级告警：通知值班人员
  - 二级告警：通知技术负责人
  - 三级告警：通知管理层

## 11.5 故障处理

### 故障分类

#### 故障级别

- **P0级别**：系统完全不可用，需要立即处理
- **P1级别**：核心功能不可用，影响业务
- **P2级别**：部分功能不可用，影响部分用户
- **P3级别**：轻微问题，不影响业务

### 故障处理流程

#### 故障发现

- **监控告警**：监控系统自动告警
- **用户报告**：用户报告问题
- **主动发现**：运维人员主动发现

#### 故障处理

1. **故障确认**：确认故障现象和影响范围
2. **故障隔离**：隔离故障影响
3. **故障分析**：分析故障原因
4. **故障修复**：修复故障问题
5. **故障验证**：验证故障修复
6. **故障总结**：总结故障经验

### 故障预案

#### 常见故障预案

- **数据库故障预案**：
  - 主从切换
  - 数据恢复
  - 服务降级

- **缓存故障预案**：
  - 缓存重建
  - 服务降级
  - 数据回源

- **模型服务故障预案**：
  - 模型降级
  - 规则引擎备用
  - 服务降级

## 11.6 备份与恢复

### 数据备份

#### 备份策略

- **全量备份**：
  - 每日全量备份
  - 备份保留30天
  - 异地备份

- **增量备份**：
  - 每小时增量备份
  - 备份保留7天

#### 备份验证

- **备份完整性验证**：验证备份文件完整性
- **备份恢复测试**：定期恢复测试
- **备份监控**：监控备份状态

### 灾难恢复

#### 灾难恢复预案

- **RTO（恢复时间目标）**：≤ 4小时
- **RPO（恢复点目标）**：≤ 1小时

#### 恢复流程

1. **灾难评估**：评估灾难影响
2. **恢复准备**：准备恢复环境
3. **数据恢复**：恢复数据
4. **服务恢复**：恢复服务
5. **验证验证**：验证恢复效果

