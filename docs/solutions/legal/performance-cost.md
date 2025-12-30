# 8. 性能与成本

## 8.1 弹性伸缩

### 伸缩策略

智能法律解决方案采用弹性伸缩策略，根据负载自动调整资源：

#### 自动伸缩规则

**1. 基于CPU使用率**
- **扩容阈值**：CPU使用率 &gt; 70%，持续5分钟
- **缩容阈值**：CPU使用率 &lt; 30%，持续10分钟
- **扩容步长**：每次增加2个实例
- **缩容步长**：每次减少1个实例

**2. 基于内存使用率**
- **扩容阈值**：内存使用率 &gt; 80%，持续5分钟
- **缩容阈值**：内存使用率 &lt; 40%，持续10分钟

**3. 基于请求量**
- **扩容阈值**：QPS &gt; 1000，持续3分钟
- **缩容阈值**：QPS &lt; 200，持续15分钟

**4. 基于队列长度**
- **扩容阈值**：任务队列长度 &gt; 100，持续2分钟
- **缩容阈值**：任务队列长度 &lt; 10，持续10分钟

#### Kubernetes HPA配置

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: legal-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: legal-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
```

### 资源调度

#### 资源分配策略

**1. 请求优先级**
- **高优先级**：VIP用户请求、紧急审查任务
- **中优先级**：普通用户请求、常规任务
- **低优先级**：批量任务、非紧急任务

**2. 资源预留**
- **预留资源**：为高优先级任务预留20%资源
- **弹性资源**：剩余80%资源按需分配

**3. 资源隔离**
- **CPU隔离**：使用CPU限制和请求
- **内存隔离**：使用内存限制和请求
- **网络隔离**：使用网络策略

#### 资源调度配置

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: legal-api-pod
spec:
  containers:
    - name: legal-api
      image: legal-api:latest
      resources:
        requests:
          cpu: "1000m"
          memory: "2Gi"
        limits:
          cpu: "2000m"
          memory: "4Gi"
```

### 成本优化

#### 成本优化策略

**1. 实例类型选择**
- **计算密集型任务**：使用CPU优化实例
- **内存密集型任务**：使用内存优化实例
- **GPU任务**：使用GPU实例（按需）

**2. 竞价实例**
- **非关键任务**：使用竞价实例，降低成本50-70%
- **关键任务**：使用按需实例，保证稳定性

**3. 预留实例**
- **长期稳定负载**：购买预留实例，降低成本40-60%
- **1年期预留**：标准预留实例
- **3年期预留**：可转换预留实例

**4. 自动关机**
- **非工作时间**：自动关闭非必要实例
- **低负载时段**：减少实例数量

#### 成本优化示例

**使用Spot实例处理批量任务**：
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-contract-review
spec:
  template:
    spec:
      nodeSelector:
        instance-type: spot
      containers:
        - name: batch-processor
          image: legal-batch-processor:latest
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
```

## 8.2 缓存策略

### 缓存设计

#### 多级缓存架构

**1. L1缓存（本地缓存）**
- **位置**：应用服务器内存
- **存储**：热点数据、频繁访问的数据
- **容量**：每实例100MB
- **过期时间**：5分钟
- **实现**：Redis、Memcached

**2. L2缓存（分布式缓存）**
- **位置**：Redis集群
- **存储**：常用数据、计算结果
- **容量**：10GB
- **过期时间**：30分钟
- **实现**：Redis Cluster

**3. L3缓存（CDN缓存）**
- **位置**：CDN边缘节点
- **存储**：静态资源、API响应
- **容量**：无限（按需）
- **过期时间**：1小时
- **实现**：阿里云CDN、CloudFlare

#### 缓存策略

**1. 缓存键设计**
- **格式**：`{service}:{resource}:{id}:{version}`
- **示例**：`legal:case:12345:v1`
- **版本控制**：使用版本号支持缓存失效

**2. 缓存更新策略**
- **Write-Through**：写入时同时更新缓存
- **Write-Behind**：异步更新缓存
- **Cache-Aside**：应用层管理缓存

**3. 缓存失效策略**
- **TTL过期**：设置过期时间
- **主动失效**：数据更新时主动失效缓存
- **版本失效**：使用版本号控制失效

### 缓存更新

#### 更新策略

**1. 实时更新**
- **适用场景**：关键数据、实时性要求高
- **更新方式**：数据变更时立即更新缓存
- **示例**：法条更新、案例更新

**2. 定时更新**
- **适用场景**：非关键数据、更新频率低
- **更新方式**：定时任务批量更新
- **示例**：统计数据、报表数据

**3. 懒加载更新**
- **适用场景**：访问频率低的数据
- **更新方式**：首次访问时加载，后续使用缓存
- **示例**：历史数据、归档数据

#### 缓存更新实现

**使用Redis Pub/Sub实现缓存失效**：
```python
import redis

class CacheManager:
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379)
        self.pubsub = self.redis_client.pubsub()
        self.pubsub.subscribe('cache_invalidate')
    
    def invalidate_cache(self, cache_key: str):
        """失效缓存"""
        self.redis_client.delete(cache_key)
        # 发布失效消息
        self.redis_client.publish('cache_invalidate', cache_key)
    
    def get_cache(self, cache_key: str):
        """获取缓存"""
        return self.redis_client.get(cache_key)
    
    def set_cache(self, cache_key: str, value: str, ttl: int = 1800):
        """设置缓存"""
        self.redis_client.setex(cache_key, ttl, value)
```

### 缓存命中率优化

#### 优化策略

**1. 预热缓存**
- **启动时预热**：系统启动时加载热点数据
- **定时预热**：定时加载常用数据
- **预测性预热**：基于历史数据预测热点

**2. 缓存分层**
- **热点数据**：L1缓存（本地缓存）
- **常用数据**：L2缓存（Redis）
- **冷数据**：不缓存或L3缓存

**3. 缓存压缩**
- **数据压缩**：压缩缓存数据，提升容量
- **压缩算法**：Gzip、Snappy

**4. 缓存穿透防护**
- **布隆过滤器**：过滤不存在的数据
- **空值缓存**：缓存空结果，避免重复查询

#### 缓存命中率监控

**监控指标**：
- **缓存命中率**：目标 &gt; 80%
- **缓存Miss率**：目标 &lt; 20%
- **缓存响应时间**：目标 &lt; 5ms

**监控实现**：
```python
class CacheMetrics:
    def __init__(self):
        self.hits = 0
        self.misses = 0
    
    def record_hit(self):
        """记录命中"""
        self.hits += 1
    
    def record_miss(self):
        """记录未命中"""
        self.misses += 1
    
    def get_hit_rate(self):
        """计算命中率"""
        total = self.hits + self.misses
        if total == 0:
            return 0
        return self.hits / total
```

## 8.3 成本仪表盘

### 成本监控

#### 成本分类

**1. 计算成本**
- **服务器成本**：ECS实例、Kubernetes节点
- **GPU成本**：GPU实例（如使用）
- **成本占比**：约40%

**2. 存储成本**
- **数据库成本**：MySQL、Redis
- **对象存储成本**：OSS、MinIO
- **向量数据库成本**：Milvus
- **成本占比**：约20%

**3. 网络成本**
- **带宽成本**：公网带宽、CDN
- **跨区域传输成本**：跨区域数据传输
- **成本占比**：约10%

**4. AI服务成本**
- **大模型API成本**：OpenAI、Claude、通义千问
- **Embedding成本**：向量化服务
- **成本占比**：约30%

#### 成本监控实现

**使用Prometheus监控成本**：
```yaml
# prometheus配置
scrape_configs:
  - job_name: 'cost-monitor'
    static_configs:
      - targets: ['cost-exporter:9090']
    metrics_path: '/metrics'
```

**成本指标**：
- `cost_total`：总成本
- `cost_by_service`：按服务分类成本
- `cost_by_user`：按用户分类成本
- `cost_trend`：成本趋势

### 成本分析

#### 成本分析维度

**1. 按服务分析**
- 合同审查服务成本
- 案例检索服务成本
- 法条匹配服务成本

**2. 按用户分析**
- VIP用户成本
- 普通用户成本
- 免费用户成本

**3. 按时间分析**
- 日成本
- 周成本
- 月成本
- 年成本

**4. 按资源分析**
- CPU成本
- 内存成本
- 存储成本
- 网络成本

#### 成本分析报告

**日报**：
- 当日总成本
- 各服务成本占比
- 成本趋势

**周报**：
- 本周总成本
- 成本变化趋势
- 成本优化建议

**月报**：
- 本月总成本
- 成本预算对比
- 成本优化成果

### 成本优化建议

#### 优化建议生成

**1. 资源优化建议**
- 识别闲置资源
- 建议释放或降配
- 预计节省成本

**2. 实例优化建议**
- 识别过度配置实例
- 建议降配
- 预计节省成本

**3. 缓存优化建议**
- 识别缓存命中率低的数据
- 建议调整缓存策略
- 预计节省成本

**4. API调用优化建议**
- 识别高频API调用
- 建议使用缓存或批量处理
- 预计节省成本

#### 成本优化示例

**优化前**：
- 日均API调用：10,000次
- 每次调用成本：$0.01
- 日均成本：$100

**优化后**：
- 使用缓存，缓存命中率80%
- 实际API调用：2,000次
- 日均成本：$20
- **节省成本：80%**

**优化措施**：
1. 实施多级缓存
2. 提升缓存命中率到80%
3. 减少API调用次数
