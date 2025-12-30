# 9. 监控与可观测性

## 9.1 指标监控

### 系统指标

#### CPU监控

**监控指标**：
- **CPU使用率**：目标 < 70%，告警阈值 > 80%
- **CPU负载**：目标 < 2.0，告警阈值 > 3.0
- **CPU核心数**：监控CPU核心数变化

**监控配置**：
```yaml
metrics:
  - name: cpu_usage
    type: gauge
    labels: [instance, service]
    threshold:
      warning: 70
      critical: 80
  - name: cpu_load
    type: gauge
    labels: [instance]
    threshold:
      warning: 2.0
      critical: 3.0
```

#### 内存监控

**监控指标**：
- **内存使用率**：目标 < 80%，告警阈值 > 90%
- **内存使用量**：监控内存使用量（GB）
- **内存可用量**：监控可用内存量

**监控配置**：
```yaml
metrics:
  - name: memory_usage
    type: gauge
    labels: [instance, service]
    threshold:
      warning: 80
      critical: 90
  - name: memory_used
    type: gauge
    unit: bytes
  - name: memory_available
    type: gauge
    unit: bytes
```

#### 磁盘监控

**监控指标**：
- **磁盘使用率**：目标 < 80%，告警阈值 > 90%
- **磁盘IOPS**：监控磁盘IOPS
- **磁盘读写速度**：监控磁盘读写速度

**监控配置**：
```yaml
metrics:
  - name: disk_usage
    type: gauge
    labels: [instance, device]
    threshold:
      warning: 80
      critical: 90
  - name: disk_iops
    type: counter
    labels: [instance, device, operation]
  - name: disk_throughput
    type: gauge
    unit: bytes_per_second
```

#### 网络监控

**监控指标**：
- **网络带宽使用率**：目标 < 70%，告警阈值 > 80%
- **网络延迟**：目标 < 50ms，告警阈值 > 100ms
- **网络错误率**：目标 < 0.1%，告警阈值 > 1%

**监控配置**：
```yaml
metrics:
  - name: network_bandwidth_usage
    type: gauge
    labels: [instance, interface]
    threshold:
      warning: 70
      critical: 80
  - name: network_latency
    type: histogram
    labels: [instance, destination]
    buckets: [10, 50, 100, 200, 500]
  - name: network_error_rate
    type: gauge
    threshold:
      warning: 0.1
      critical: 1.0
```

### 应用指标

#### API指标

**监控指标**：
- **请求数（QPS）**：监控每秒请求数
- **响应时间**：P50、P95、P99响应时间
- **错误率**：目标 < 1%，告警阈值 > 5%
- **成功率**：目标 > 99%，告警阈值 < 95%

**监控配置**：
```yaml
metrics:
  - name: http_requests_total
    type: counter
    labels: [method, endpoint, status_code]
  - name: http_request_duration_seconds
    type: histogram
    labels: [method, endpoint]
    buckets: [0.1, 0.5, 1.0, 2.0, 5.0]
  - name: http_errors_total
    type: counter
    labels: [method, endpoint, error_type]
  - name: http_success_rate
    type: gauge
    threshold:
      warning: 99
      critical: 95
```

#### 业务指标

**监控指标**：
- **交通流量预测准确率**：目标 ≥ 90%
- **路径规划成功率**：目标 ≥ 98%
- **停车位预测准确率**：目标 ≥ 90%
- **安全预警准确率**：目标 ≥ 85%

**监控配置**：
```yaml
metrics:
  - name: traffic_prediction_accuracy
    type: gauge
    threshold:
      warning: 90
      critical: 85
  - name: route_planning_success_rate
    type: gauge
    threshold:
      warning: 98
      critical: 95
  - name: parking_prediction_accuracy
    type: gauge
    threshold:
      warning: 90
      critical: 85
  - name: safety_warning_accuracy
    type: gauge
    threshold:
      warning: 85
      critical: 80
```

### 数据指标

#### 数据质量指标

**监控指标**：
- **数据完整率**：目标 ≥ 95%
- **数据准确率**：目标 ≥ 95%
- **数据延迟**：目标 ≤ 30秒
- **数据更新频率**：监控数据更新频率

**监控配置**：
```yaml
metrics:
  - name: data_completeness_rate
    type: gauge
    labels: [data_source, data_type]
    threshold:
      warning: 95
      critical: 90
  - name: data_accuracy_rate
    type: gauge
    labels: [data_source, data_type]
    threshold:
      warning: 95
      critical: 90
  - name: data_latency_seconds
    type: gauge
    labels: [data_source]
    threshold:
      warning: 30
      critical: 60
```

## 9.2 日志管理

### 日志级别

#### 日志级别定义

- **DEBUG**：详细的调试信息，用于开发调试
- **INFO**：一般信息，记录系统正常运行状态
- **WARN**：警告信息，不影响系统运行但需要注意
- **ERROR**：错误信息，影响功能但系统可继续运行
- **CRITICAL**：严重错误，可能导致系统崩溃

#### 日志级别配置

```python
import logging

# 配置日志级别
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('transportation.log'),
        logging.StreamHandler()
    ]
)

# 不同模块设置不同日志级别
logger_api = logging.getLogger('api')
logger_api.setLevel(logging.INFO)

logger_model = logging.getLogger('model')
logger_model.setLevel(logging.DEBUG)

logger_data = logging.getLogger('data')
logger_data.setLevel(logging.WARN)
```

### 日志格式

#### 结构化日志

**日志格式**：
```json
{
  "timestamp": "2024-01-15T08:00:00Z",
  "level": "INFO",
  "service": "transportation-api",
  "module": "route_planning",
  "request_id": "req_123456",
  "user_id": "user_789",
  "message": "路径规划成功",
  "data": {
    "origin": {"latitude": 39.9042, "longitude": 116.4074},
    "destination": {"latitude": 39.9080, "longitude": 116.3974},
    "duration": 720,
    "distance": 5200
  },
  "performance": {
    "response_time_ms": 250,
    "db_query_time_ms": 50,
    "model_inference_time_ms": 150
  }
}
```

#### 日志实现

```python
import json
import logging
from datetime import datetime

class StructuredLogger:
    def __init__(self, service_name):
        self.service_name = service_name
        self.logger = logging.getLogger(service_name)
    
    def log(self, level, module, message, **kwargs):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level,
            "service": self.service_name,
            "module": module,
            "message": message,
            **kwargs
        }
        log_message = json.dumps(log_entry, ensure_ascii=False)
        getattr(self.logger, level.lower())(log_message)
    
    def info(self, module, message, **kwargs):
        self.log("INFO", module, message, **kwargs)
    
    def error(self, module, message, **kwargs):
        self.log("ERROR", module, message, **kwargs)
```

### 日志收集

#### ELK Stack

**Elasticsearch**：
- 存储和索引日志
- 支持全文搜索
- 支持聚合分析

**Logstash**：
- 收集和解析日志
- 数据转换和过滤
- 发送到Elasticsearch

**Kibana**：
- 日志可视化
- 日志搜索和分析
- 仪表盘展示

#### 日志收集配置

```yaml
# Logstash配置
input {
  file {
    path => "/var/log/transportation/*.log"
    type => "transportation"
    codec => "json"
  }
}

filter {
  if [type] == "transportation" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{DATA:message}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "transportation-logs-%{+YYYY.MM.dd}"
  }
}
```

## 9.3 链路追踪

### 分布式追踪

#### OpenTelemetry

**追踪配置**：
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger import JaegerExporter

# 配置追踪
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# 配置Jaeger导出器
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831
)
span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# 使用追踪
@tracer.start_as_current_span("route_planning")
def plan_route(origin, destination):
    # 路径规划逻辑
    pass
```

#### 追踪指标

**追踪指标**：
- **请求追踪**：追踪完整请求链路
- **服务依赖**：分析服务依赖关系
- **性能分析**：分析各服务性能
- **错误追踪**：追踪错误发生位置

## 9.4 告警机制

### 告警规则

#### 系统告警

**CPU告警**：
- **告警条件**：CPU使用率 > 80%持续5分钟
- **告警级别**：Warning
- **告警动作**：发送邮件、发送短信、创建工单

**内存告警**：
- **告警条件**：内存使用率 > 90%持续5分钟
- **告警级别**：Critical
- **告警动作**：发送邮件、发送短信、创建工单、自动扩容

**磁盘告警**：
- **告警条件**：磁盘使用率 > 90%持续10分钟
- **告警级别**：Critical
- **告警动作**：发送邮件、发送短信、创建工单

#### 应用告警

**API告警**：
- **告警条件**：API错误率 > 5%持续5分钟
- **告警级别**：Warning
- **告警动作**：发送邮件、发送短信

**响应时间告警**：
- **告警条件**：P95响应时间 > 1秒持续10分钟
- **告警级别**：Warning
- **告警动作**：发送邮件、发送短信

#### 业务告警

**预测准确率告警**：
- **告警条件**：预测准确率 < 85%持续30分钟
- **告警级别**：Warning
- **告警动作**：发送邮件、通知数据团队

**数据质量告警**：
- **告警条件**：数据完整率 < 90%持续10分钟
- **告警级别**：Critical
- **告警动作**：发送邮件、发送短信、创建工单

### 告警通知

#### 通知渠道

**1. 邮件通知**
- 发送告警邮件到运维团队
- 包含告警详情和处理建议

**2. 短信通知**
- 发送告警短信到值班人员
- 仅发送Critical级别告警

**3. 企业微信/钉钉**
- 发送告警消息到工作群
- 支持@相关人员

**4. 电话通知**
- Critical级别告警自动拨打电话
- 确保及时响应

#### 告警收敛

**告警聚合**：
- 相同告警在短时间内只发送一次
- 避免告警风暴

**告警升级**：
- 告警持续未处理自动升级
- 通知更高级别人员

## 9.5 监控仪表盘

### Grafana仪表盘

#### 系统监控仪表盘

**监控内容**：
- CPU、内存、磁盘、网络使用率
- 系统负载、进程数
- 服务状态、健康检查

#### 应用监控仪表盘

**监控内容**：
- API请求数、响应时间、错误率
- 业务指标（预测准确率、规划成功率）
- 性能指标（吞吐量、并发数）

#### 业务监控仪表盘

**监控内容**：
- 交通流量预测准确率
- 路径规划成功率
- 停车位预测准确率
- 安全预警准确率
- 用户满意度

### 自定义仪表盘

#### 实时监控大屏

**展示内容**：
- 实时交通状况地图
- 关键指标实时更新
- 告警信息滚动显示
- 系统状态总览

