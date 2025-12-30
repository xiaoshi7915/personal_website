# 8. 性能与成本

## 8.1 弹性伸缩

### 伸缩策略

智能金融解决方案采用自动弹性伸缩策略，根据负载自动调整资源：

#### 水平伸缩（Horizontal Scaling）

- **基于CPU使用率**：
  - 扩容阈值：CPU使用率 > 70% 持续5分钟
  - 缩容阈值：CPU使用率 < 30% 持续10分钟
  - 扩容步长：每次增加2个实例
  - 最大实例数：20个

- **基于内存使用率**：
  - 扩容阈值：内存使用率 > 80% 持续5分钟
  - 缩容阈值：内存使用率 < 40% 持续10分钟
  - 扩容步长：每次增加2个实例

- **基于请求量**：
  - 扩容阈值：QPS > 1000 持续3分钟
  - 缩容阈值：QPS < 500 持续10分钟
  - 扩容步长：每次增加2个实例

- **基于队列长度**：
  - 扩容阈值：任务队列长度 > 1000 持续5分钟
  - 缩容阈值：任务队列长度 < 100 持续10分钟

#### 垂直伸缩（Vertical Scaling）

- **基于资源需求**：
  - 监控实例的资源使用情况
  - 自动升级实例规格（CPU、内存）
  - 适用于资源密集型任务

#### Kubernetes HPA配置

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: finance-ai-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: finance-ai-api
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
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 600
      policies:
      - type: Pods
        value: 1
        periodSeconds: 300
```

### 资源调度

#### 调度策略

- **节点选择**：
  - 优先选择资源充足的节点
  - 避免将Pod调度到资源紧张的节点
  - 支持节点亲和性和反亲和性

- **Pod优先级**：
  - 关键业务Pod优先级高
  - 非关键业务Pod优先级低
  - 低优先级Pod可以被驱逐

- **资源限制**：
  - 设置Pod的CPU和内存限制
  - 防止单个Pod占用过多资源
  - 保证系统稳定性

#### Kubernetes调度配置

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: finance-ai-api
spec:
  containers:
  - name: api
    image: finance-ai:latest
    resources:
      requests:
        cpu: "500m"
        memory: "1Gi"
      limits:
        cpu: "2000m"
        memory: "4Gi"
  nodeSelector:
    node-type: compute
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: app
              operator: In
              values:
              - finance-ai-api
          topologyKey: kubernetes.io/hostname
```

### 成本优化

#### 成本优化策略

- **使用Spot实例**：
  - 对于非关键任务，使用Spot实例
  - Spot实例价格比按需实例低60-90%
  - 适用于可以容忍中断的任务

- **预留实例**：
  - 对于长期运行的任务，使用预留实例
  - 预留实例价格比按需实例低30-50%
  - 适用于稳定负载

- **自动启停**：
  - 非业务时间自动停止非关键服务
  - 业务时间自动启动服务
  - 节省非业务时间的成本

- **资源优化**：
  - 定期分析资源使用情况
  - 调整资源分配，避免资源浪费
  - 使用资源配额限制资源使用

#### 成本优化实现

```python
class CostOptimizer:
    def __init__(self, k8s_client):
        self.k8s_client = k8s_client
    
    def optimize_resources(self):
        """优化资源使用"""
        # 分析资源使用情况
        usage = self.analyze_resource_usage()
        
        # 识别资源浪费
        waste = self.identify_waste(usage)
        
        # 优化资源分配
        for pod in waste:
            self.scale_down_pod(pod)
    
    def schedule_spot_instances(self):
        """调度Spot实例"""
        # 识别可以使用Spot实例的任务
        tasks = self.identify_spot_tasks()
        
        # 将任务调度到Spot实例
        for task in tasks:
            self.schedule_to_spot(task)
    
    def auto_start_stop(self):
        """自动启停服务"""
        current_hour = datetime.now().hour
        
        # 非业务时间（22:00-08:00）停止非关键服务
        if current_hour >= 22 or current_hour < 8:
            self.stop_non_critical_services()
        else:
            self.start_non_critical_services()
```

## 8.2 缓存策略

### 缓存设计

#### 缓存层级

- **L1缓存（本地缓存）**：
  - 存储位置：应用内存
  - 容量：较小（几MB到几十MB）
  - 速度：最快
  - 用途：存储热点数据、频繁访问的数据

- **L2缓存（分布式缓存）**：
  - 存储位置：Redis集群
  - 容量：较大（几GB到几十GB）
  - 速度：快
  - 用途：存储共享数据、会话数据

- **L3缓存（数据库缓存）**：
  - 存储位置：数据库查询缓存
  - 容量：取决于数据库配置
  - 速度：中等
  - 用途：缓存查询结果

#### 缓存策略

- **Cache-Aside（旁路缓存）**：
  - 应用先查询缓存，缓存未命中时查询数据库
  - 更新数据时，先更新数据库，再删除缓存
  - 适用于读多写少的场景

- **Write-Through（写穿透）**：
  - 更新数据时，同时更新缓存和数据库
  - 保证缓存和数据库的一致性
  - 适用于写操作频繁的场景

- **Write-Back（写回）**：
  - 更新数据时，只更新缓存
  - 定期将缓存数据写回数据库
  - 适用于写操作频繁且可以容忍数据丢失的场景

#### 缓存实现

```python
import redis
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_result(expiration=3600):
    """缓存装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            
            # 尝试从缓存获取
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
            
            # 执行函数
            result = func(*args, **kwargs)
            
            # 写入缓存
            redis_client.setex(
                cache_key,
                expiration,
                json.dumps(result)
            )
            
            return result
        return wrapper
    return decorator

# 使用示例
@cache_result(expiration=1800)
def get_risk_score(transaction_id, customer_id):
    """获取风险分数（带缓存）"""
    # 查询数据库或调用API
    return calculate_risk_score(transaction_id, customer_id)
```

### 缓存更新

#### 更新策略

- **TTL过期**：
  - 设置缓存的过期时间
  - 过期后自动删除，下次访问时重新加载
  - 适用于数据更新不频繁的场景

- **主动失效**：
  - 数据更新时，主动删除相关缓存
  - 保证缓存和数据库的一致性
  - 适用于数据更新频繁的场景

- **版本控制**：
  - 使用版本号标识缓存数据
  - 数据更新时，更新版本号
  - 缓存未命中或版本不匹配时，重新加载

#### 缓存更新实现

```python
class CacheManager:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def invalidate_cache(self, pattern):
        """失效缓存"""
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)
    
    def update_cache(self, key, value, expiration=3600):
        """更新缓存"""
        self.redis.setex(key, expiration, json.dumps(value))
    
    def get_or_set(self, key, func, expiration=3600):
        """获取或设置缓存"""
        cached = self.redis.get(key)
        if cached:
            return json.loads(cached)
        
        value = func()
        self.update_cache(key, value, expiration)
        return value
```

### 缓存命中率优化

#### 优化策略

- **预热缓存**：
  - 系统启动时，预加载热点数据到缓存
  - 减少缓存未命中率
  - 提高系统响应速度

- **缓存分层**：
  - 热点数据存储在L1缓存
  - 次热点数据存储在L2缓存
  - 提高缓存命中率

- **缓存预取**：
  - 预测用户可能访问的数据
  - 提前加载到缓存
  - 减少缓存未命中

#### 缓存命中率监控

```python
class CacheMonitor:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.hits = 0
        self.misses = 0
    
    def record_hit(self):
        """记录命中"""
        self.hits += 1
    
    def record_miss(self):
        """记录未命中"""
        self.misses += 1
    
    def get_hit_rate(self):
        """获取命中率"""
        total = self.hits + self.misses
        if total == 0:
            return 0
        return self.hits / total * 100
    
    def get_stats(self):
        """获取统计信息"""
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": self.get_hit_rate(),
            "total": self.hits + self.misses
        }
```

## 8.3 成本仪表盘

### 成本监控

#### 监控指标

- **资源成本**：
  - 计算资源成本（CPU、内存）
  - 存储资源成本（磁盘、数据库）
  - 网络资源成本（带宽、CDN）

- **服务成本**：
  - API调用成本（大模型API）
  - 第三方服务成本（数据服务、通知服务）
  - 云服务成本（对象存储、消息队列）

- **人力成本**：
  - 开发成本
  - 运维成本
  - 支持成本

#### 成本监控实现

```python
class CostMonitor:
    def __init__(self, cloud_client):
        self.cloud_client = cloud_client
    
    def get_resource_costs(self, start_date, end_date):
        """获取资源成本"""
        costs = {
            "compute": 0,
            "storage": 0,
            "network": 0
        }
        
        # 查询计算资源成本
        compute_usage = self.cloud_client.get_compute_usage(
            start_date, end_date
        )
        costs["compute"] = self.calculate_compute_cost(compute_usage)
        
        # 查询存储资源成本
        storage_usage = self.cloud_client.get_storage_usage(
            start_date, end_date
        )
        costs["storage"] = self.calculate_storage_cost(storage_usage)
        
        # 查询网络资源成本
        network_usage = self.cloud_client.get_network_usage(
            start_date, end_date
        )
        costs["network"] = self.calculate_network_cost(network_usage)
        
        return costs
    
    def get_service_costs(self, start_date, end_date):
        """获取服务成本"""
        costs = {
            "llm_api": 0,
            "third_party": 0,
            "cloud_services": 0
        }
        
        # 查询LLM API调用成本
        llm_calls = self.get_llm_api_calls(start_date, end_date)
        costs["llm_api"] = self.calculate_llm_cost(llm_calls)
        
        # 查询第三方服务成本
        third_party_usage = self.get_third_party_usage(
            start_date, end_date
        )
        costs["third_party"] = self.calculate_third_party_cost(
            third_party_usage
        )
        
        return costs
```

### 成本分析

#### 成本分析维度

- **按服务分析**：
  - 各服务的成本占比
  - 各服务的成本趋势
  - 识别高成本服务

- **按时间分析**：
  - 每日成本趋势
  - 每周成本趋势
  - 每月成本趋势

- **按用户分析**：
  - 各用户的成本贡献
  - 识别高成本用户
  - 优化用户成本

#### 成本分析报告

```python
def generate_cost_report(start_date, end_date):
    """生成成本分析报告"""
    monitor = CostMonitor(cloud_client)
    
    # 获取成本数据
    resource_costs = monitor.get_resource_costs(start_date, end_date)
    service_costs = monitor.get_service_costs(start_date, end_date)
    
    # 计算总成本
    total_cost = (
        sum(resource_costs.values()) +
        sum(service_costs.values())
    )
    
    # 生成报告
    report = f"""
# 成本分析报告

## 时间范围
- 开始日期: {start_date}
- 结束日期: {end_date}

## 总成本
- 总成本: ¥{total_cost:,.2f}

## 资源成本
- 计算资源: ¥{resource_costs['compute']:,.2f}
- 存储资源: ¥{resource_costs['storage']:,.2f}
- 网络资源: ¥{resource_costs['network']:,.2f}

## 服务成本
- LLM API: ¥{service_costs['llm_api']:,.2f}
- 第三方服务: ¥{service_costs['third_party']:,.2f}
- 云服务: ¥{service_costs['cloud_services']:,.2f}

## 成本占比
- 计算资源: {resource_costs['compute']/total_cost*100:.2f}%
- LLM API: {service_costs['llm_api']/total_cost*100:.2f}%
- ...
"""
    return report
```

### 成本优化建议

#### 优化建议生成

```python
class CostOptimizer:
    def generate_recommendations(self, cost_data):
        """生成成本优化建议"""
        recommendations = []
        
        # 分析资源使用情况
        resource_usage = self.analyze_resource_usage(cost_data)
        
        # 识别资源浪费
        waste = self.identify_waste(resource_usage)
        if waste:
            recommendations.append({
                "type": "资源优化",
                "description": f"发现{waste['count']}个未充分利用的资源",
                "savings": f"预计可节省¥{waste['savings']:,.2f}/月",
                "action": "建议调整资源规格或释放未使用的资源"
            })
        
        # 分析LLM API调用
        llm_usage = self.analyze_llm_usage(cost_data)
        
        # 识别优化机会
        if llm_usage['cache_hit_rate'] < 0.5:
            recommendations.append({
                "type": "缓存优化",
                "description": "LLM API缓存命中率较低",
                "savings": f"预计可节省¥{llm_usage['potential_savings']:,.2f}/月",
                "action": "建议增加缓存策略，提高缓存命中率"
            })
        
        # 分析Spot实例使用
        spot_usage = self.analyze_spot_usage(cost_data)
        if spot_usage['usage_rate'] < 0.3:
            recommendations.append({
                "type": "实例优化",
                "description": "Spot实例使用率较低",
                "savings": f"预计可节省¥{spot_usage['potential_savings']:,.2f}/月",
                "action": "建议将非关键任务迁移到Spot实例"
            })
        
        return recommendations
```

#### 成本优化仪表盘

使用Grafana构建成本监控仪表盘：

```json
{
  "dashboard": {
    "title": "成本监控仪表盘",
    "panels": [
      {
        "title": "总成本趋势",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(cost_total)"
          }
        ]
      },
      {
        "title": "资源成本分布",
        "type": "piechart",
        "targets": [
          {
            "expr": "cost_compute",
            "legendFormat": "计算资源"
          },
          {
            "expr": "cost_storage",
            "legendFormat": "存储资源"
          },
          {
            "expr": "cost_network",
            "legendFormat": "网络资源"
          }
        ]
      },
      {
        "title": "服务成本趋势",
        "type": "graph",
        "targets": [
          {
            "expr": "cost_llm_api",
            "legendFormat": "LLM API"
          },
          {
            "expr": "cost_third_party",
            "legendFormat": "第三方服务"
          }
        ]
      }
    ]
  }
}
```
