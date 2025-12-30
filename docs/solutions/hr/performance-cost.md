# 8. 性能与成本

## 8.1 弹性伸缩

### 伸缩策略

智能人力资源系统需要根据负载自动伸缩，确保服务稳定和成本优化：

#### 水平伸缩（Horizontal Scaling）

**自动伸缩规则**：
- **CPU使用率**：&gt;80%时扩容，&lt;30%时缩容
- **内存使用率**：&gt;80%时扩容，&lt;30%时缩容
- **请求队列长度**：&gt;50时扩容，&lt;5时缩容
- **响应时间**：P95&gt;2秒时扩容
- **错误率**：&gt;1%时扩容

**Kubernetes HPA配置**：
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hr-ai-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hr-ai-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: request_queue_length
      target:
        type: AverageValue
        averageValue: "10"
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
        value: 2
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
  name: hr-ai-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hr-ai-service
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: hr-ai-service
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 4
        memory: 8Gi
```

### 预测性伸缩

#### 基于历史数据的预测

**预测模型**：
- 使用时间序列分析预测未来负载
- 考虑工作日、节假日等周期性因素
- 考虑业务增长趋势

**预测实现**：
```python
from sklearn.linear_model import LinearRegression
import numpy as np

class LoadPredictor:
    """负载预测器"""
    
    def __init__(self):
        self.model = LinearRegression()
    
    def train(self, historical_data: np.ndarray):
        """训练预测模型"""
        # 特征工程：提取时间特征、周期性特征等
        features = self.extract_features(historical_data)
        
        # 训练模型
        self.model.fit(features, historical_data)
    
    def predict(self, future_time: int) -> float:
        """预测未来负载"""
        features = self.extract_features_for_time(future_time)
        return self.model.predict([features])[0]
```

## 8.2 成本优化

### 计算资源优化

#### 模型选择优化

**成本效益分析**：
- **高准确率模型**：成本高，适合关键场景
- **标准模型**：成本中等，适合一般场景
- **快速模型**：成本低，适合非关键场景

**模型路由策略**：
```python
def select_model_by_cost_benefit(task_importance: str, cost_budget: float):
    """根据成本效益选择模型"""
    if task_importance == "critical" and cost_budget > 1.0:
        return "premium-model"  # 高准确率模型
    elif task_importance == "normal":
        return "standard-model"  # 标准模型
    else:
        return "fast-model"  # 快速模型
```

#### 缓存策略

**多级缓存**：
- **L1缓存**：本地内存缓存，响应最快
- **L2缓存**：Redis缓存，响应较快
- **L3缓存**：数据库缓存，响应较慢

**缓存实现**：
```python
from functools import lru_cache
import redis

class MultiLevelCache:
    """多级缓存"""
    
    def __init__(self):
        self.local_cache = {}
        self.redis_client = redis.Redis(host='localhost', port=6379)
    
    @lru_cache(maxsize=1000)
    def get_from_local_cache(self, key: str):
        """从本地缓存获取"""
        return self.local_cache.get(key)
    
    def get_from_redis_cache(self, key: str):
        """从Redis缓存获取"""
        return self.redis_client.get(key)
    
    def get(self, key: str):
        """多级缓存获取"""
        # 先查本地缓存
        value = self.get_from_local_cache(key)
        if value:
            return value
        
        # 再查Redis缓存
        value = self.get_from_redis_cache(key)
        if value:
            # 写入本地缓存
            self.local_cache[key] = value
            return value
        
        # 最后查数据库
        value = self.get_from_database(key)
        if value:
            # 写入缓存
            self.redis_client.set(key, value, ex=3600)
            self.local_cache[key] = value
        
        return value
```

### API调用优化

#### 批量处理

**批量接口**：
- 支持批量简历解析
- 支持批量人才匹配
- 减少API调用次数

**批量实现**：
```python
def batch_parse_resumes(resume_files: List[str]) -> List[Dict]:
    """批量解析简历"""
    results = []
    
    # 分批处理，每批10个
    batch_size = 10
    for i in range(0, len(resume_files), batch_size):
        batch = resume_files[i:i+batch_size]
        batch_results = process_batch(batch)
        results.extend(batch_results)
    
    return results
```

#### 请求合并

**请求合并策略**：
- 合并相似请求
- 减少重复计算
- 提高处理效率

### 存储优化

#### 数据压缩

**压缩策略**：
- 简历文件压缩存储
- 历史数据压缩归档
- 减少存储成本

#### 数据生命周期管理

**数据分级存储**：
- **热数据**：SSD存储，快速访问
- **温数据**：HDD存储，中等访问
- **冷数据**：对象存储，归档存储

**数据清理策略**：
- 定期清理过期数据
- 归档历史数据
- 删除无效数据

## 8.3 性能监控

### 性能指标监控

#### 响应时间监控

**指标定义**：
- **P50响应时间**：50%请求的响应时间
- **P95响应时间**：95%请求的响应时间
- **P99响应时间**：99%请求的响应时间

**目标值**：
- P50 ≤ 500ms
- P95 ≤ 2s
- P99 ≤ 5s

#### 吞吐量监控

**指标定义**：
- **QPS**：每秒查询数
- **TPS**：每秒事务数

**目标值**：
- QPS ≥ 100
- TPS ≥ 50

### 成本监控

#### 资源成本监控

**成本指标**：
- **CPU成本**：CPU使用成本
- **内存成本**：内存使用成本
- **存储成本**：存储使用成本
- **网络成本**：网络使用成本

**成本优化**：
- 识别高成本资源
- 优化资源使用
- 降低资源成本

#### API成本监控

**成本指标**：
- **API调用成本**：API调用费用
- **模型推理成本**：模型推理费用

**成本优化**：
- 减少不必要的API调用
- 使用成本更低的模型
- 优化API调用策略

## 8.4 成本预算

### 预算规划

#### 月度预算

**资源预算**：
- **计算资源**：5000元/月
- **存储资源**：1000元/月
- **网络资源**：500元/月

**API预算**：
- **模型API**：3000元/月
- **第三方API**：1000元/月

**总预算**：10000元/月

#### 预算控制

**预算告警**：
- 预算使用率达到80%时告警
- 预算使用率达到100%时停止服务

**预算优化**：
- 定期分析成本结构
- 识别优化机会
- 实施成本优化措施

