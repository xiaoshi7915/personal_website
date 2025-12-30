# 8. 性能与成本

## 8.1 弹性伸缩

### 伸缩策略

智能营销系统需要根据负载自动伸缩，确保服务稳定和成本优化：

#### 水平伸缩（Horizontal Scaling）

**自动伸缩规则**：
- **CPU使用率**：&gt;70%时扩容，&lt;30%时缩容
- **内存使用率**：&gt;80%时扩容，&lt;40%时缩容
- **请求队列长度**：&gt;200时扩容，&lt;20时缩容
- **响应时间**：P95&gt;1000ms时扩容

**Kubernetes HPA配置**：
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: marketing-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: marketing-service
  minReplicas: 3
  maxReplicas: 50
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 5
        periodSeconds: 15
      selectPolicy: Max
```

#### 垂直伸缩（Vertical Scaling）

**资源调整规则**：
- 根据历史负载预测资源需求
- 在业务高峰期前提前扩容
- 在业务低峰期自动缩容

**VPA配置**：
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: marketing-service-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: marketing-service
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: marketing-service
      minAllowed:
        cpu: 500m
        memory: 512Mi
      maxAllowed:
        cpu: 4
        memory: 8Gi
```

### 资源调度

**优先级调度**：
- VIP用户请求优先处理
- 高价值营销活动优先处理
- 实时内容生成优先处理

**资源分配策略**：
- 根据业务优先级分配资源
- 根据用户等级分配资源
- 根据营销活动价值分配资源

## 8.2 缓存策略

### 缓存设计

#### 多级缓存架构

**L1缓存（本地缓存）**：
- 使用内存缓存（如Caffeine）
- 缓存热点数据
- TTL：5-10分钟

**L2缓存（Redis缓存）**：
- 使用Redis集群
- 缓存常用数据
- TTL：30分钟-1小时

**L3缓存（数据库缓存）**：
- 数据库查询缓存
- 缓存查询结果
- TTL：1-24小时

**缓存实现示例**：
```python
from functools import lru_cache
import redis

# L1缓存（本地缓存）
@lru_cache(maxsize=1000)
def get_user_profile_local(user_id):
    return fetch_user_profile(user_id)

# L2缓存（Redis缓存）
redis_client = redis.Redis(host='localhost', port=6379)

def get_user_profile_redis(user_id):
    cache_key = f"user_profile:{user_id}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    profile = fetch_user_profile(user_id)
    redis_client.setex(cache_key, 3600, json.dumps(profile))
    return profile
```

### 缓存更新

**缓存更新策略**：
- **主动更新**：数据变更时主动更新缓存
- **被动更新**：缓存过期时被动更新
- **定时更新**：定时刷新热点数据

**缓存失效策略**：
- **TTL过期**：设置合理的过期时间
- **事件驱动**：数据变更时失效相关缓存
- **手动失效**：支持手动清除缓存

### 缓存命中率优化

**优化策略**：
- 分析缓存命中率，优化缓存策略
- 增加热点数据缓存时间
- 预加载常用数据到缓存
- 使用缓存预热机制

**监控指标**：
- 缓存命中率：目标≥80%
- 缓存响应时间：目标&lt;10ms
- 缓存内存使用率：目标&lt;70%

## 8.3 成本仪表盘

### 成本监控

**成本分类**：
- **计算成本**：服务器、GPU等计算资源成本
- **存储成本**：数据库、对象存储等存储成本
- **网络成本**：CDN、带宽等网络成本
- **API成本**：第三方API调用成本（如OpenAI API）

**成本监控实现**：
```python
class CostMonitor:
    def __init__(self):
        self.cost_data = {
            "compute": 0,
            "storage": 0,
            "network": 0,
            "api": 0
        }
    
    def record_api_cost(self, model, tokens, cost_per_token):
        """
        记录API调用成本
        """
        cost = tokens * cost_per_token
        self.cost_data["api"] += cost
    
    def record_compute_cost(self, instance_type, hours, cost_per_hour):
        """
        记录计算资源成本
        """
        cost = hours * cost_per_hour
        self.cost_data["compute"] += cost
    
    def get_total_cost(self):
        """
        获取总成本
        """
        return sum(self.cost_data.values())
    
    def get_cost_by_category(self):
        """
        按类别获取成本
        """
        return self.cost_data
```

### 成本分析

**成本分析维度**：
- **按时间维度**：日成本、周成本、月成本
- **按业务维度**：内容生成成本、用户画像成本、营销活动成本
- **按用户维度**：不同用户等级的成本
- **按模型维度**：不同AI模型的调用成本

**成本优化建议**：
- 使用成本更低的模型（如GPT-3.5替代GPT-4）
- 优化缓存策略，减少API调用
- 使用批量处理，提升效率
- 优化资源使用，减少浪费

### 成本优化建议

**模型选择优化**：
- 简单任务使用GPT-3.5，复杂任务使用GPT-4
- 中文内容使用通义千问，成本更低
- 批量生成使用快速模型，实时生成使用高质量模型

**资源优化**：
- 使用Spot实例降低成本
- 优化资源利用率，减少闲置资源
- 使用自动伸缩，按需分配资源

**缓存优化**：
- 增加缓存命中率，减少API调用
- 使用本地缓存，减少网络成本
- 预加载常用数据，减少实时计算

**批量处理优化**：
- 批量生成内容，提升效率
- 批量处理用户画像，减少API调用
- 使用异步处理，提升吞吐量
