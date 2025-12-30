# 3. 数据与知识治理

## 3.1 私有数据接入

### 数据源类型

智能营销系统需要接入多种类型的数据源，构建全面的营销数据资产：

#### 用户行为数据源
- **电商平台数据**：用户浏览、点击、加购、购买等行为数据，通过API或数据同步获取
- **社交媒体数据**：用户在微信、微博、抖音等平台的互动数据（点赞、评论、分享等）
- **网站分析数据**：通过Google Analytics、百度统计等工具收集的用户访问数据
- **APP行为数据**：用户在移动App中的行为数据，通过埋点SDK收集

**接入示例**：
```python
# 电商平台数据接入示例
import requests
import pandas as pd
from datetime import datetime, timedelta

# 调用电商平台API获取用户行为数据
def fetch_user_behavior_data(start_date, end_date):
    url = "https://api.ecommerce.com/v1/user-behavior"
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "fields": "user_id,product_id,action_type,timestamp"
    }
    headers = {"Authorization": "Bearer YOUR_API_KEY"}
    
    response = requests.get(url, params=params, headers=headers)
    data = response.json()
    
    # 转换为DataFrame
    df = pd.DataFrame(data['records'])
    return df

# 获取最近7天的用户行为数据
end_date = datetime.now()
start_date = end_date - timedelta(days=7)
behavior_data = fetch_user_behavior_data(start_date, end_date)
```

#### 用户属性数据源
- **CRM系统数据**：用户基本信息、联系方式、会员等级等，通过CRM系统API获取
- **订单数据**：订单信息、购买历史、消费金额等，从订单系统获取
- **用户画像数据**：已有的用户标签、兴趣偏好等，从用户画像系统获取

**接入示例**：
```python
# CRM系统数据接入示例
from sqlalchemy import create_engine
import pandas as pd

# 连接CRM数据库
engine = create_engine('mysql+pymysql://user:password@host/crm_db')

# 查询用户属性数据
query = """
SELECT 
    user_id,
    gender,
    age,
    city,
    member_level,
    registration_date,
    last_login_date
FROM users
WHERE status = 'active'
"""
user_attributes = pd.read_sql(query, engine)
```

#### 内容数据源
- **产品信息**：产品名称、描述、价格、分类等，从产品管理系统获取
- **营销素材**：历史营销文案、海报、视频等，从内容管理系统获取
- **竞品数据**：竞品信息、价格、营销策略等，通过爬虫或第三方API获取

**接入示例**：
```python
# 产品信息接入示例
from langchain.document_loaders import CSVLoader

# 加载产品信息CSV文件
loader = CSVLoader("products.csv")
documents = loader.load()

# 转换为结构化数据
products = []
for doc in documents:
    product = {
        "id": doc.metadata.get("product_id"),
        "name": doc.page_content.split("\n")[0],
        "description": doc.page_content,
        "metadata": doc.metadata
    }
    products.append(product)
```

#### 广告数据源
- **广告平台数据**：从百度、Google、Facebook等广告平台获取的广告效果数据
- **SEM数据**：关键词排名、点击率、转化率等，从SEM工具获取
- **社交媒体广告数据**：微信、抖音等平台的广告投放数据

**接入示例**：
```python
# 广告平台数据接入示例
import requests

def fetch_ad_performance_data(platform, start_date, end_date):
    """
    获取广告平台效果数据
    """
    if platform == "baidu":
        url = "https://api.baidu.com/sem/v3/report"
    elif platform == "google":
        url = "https://api.google.com/ads/v1/reports"
    else:
        raise ValueError(f"Unsupported platform: {platform}")
    
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "metrics": "impressions,clicks,conversions,cost"
    }
    
    response = requests.get(url, params=params)
    return response.json()
```

### 数据接入流程

数据接入采用标准化的ETL流程，确保数据质量和一致性：

```mermaid
graph LR
    A[数据源] --> B[数据抽取]
    B --> C[数据清洗]
    C --> D[数据转换]
    D --> E[数据验证]
    E --> F[数据加载]
    F --> G[数据融合]
    G --> H[用户画像]
    F --> I[向量化]
    I --> J[知识库]
```

#### 步骤1：数据抽取（Extract）
- **批量抽取**：定时任务批量抽取数据，支持全量和增量抽取
- **实时抽取**：通过消息队列（Kafka）实时抽取变更数据
- **API抽取**：调用外部API获取实时数据
- **流式抽取**：通过Flink等流处理框架实时抽取数据流

**实现示例**：
```python
# 使用n8n工作流进行数据抽取
# 配置数据源连接（数据库、API、文件等）
# 设置抽取频率（每小时/每天/实时）
# 配置数据过滤条件
# 设置错误重试机制
```

#### 步骤2：数据清洗（Clean）
- **去重处理**：识别并去除重复数据，基于用户ID、时间戳等去重
- **格式统一**：统一数据格式，处理编码问题（UTF-8）
- **缺失值处理**：填充缺失值或标记为无效数据
- **异常值检测**：识别和处理异常数据（如异常高的消费金额）
- **数据标准化**：统一时间格式、地址格式、分类标准等

**清洗规则示例**：
```python
import re
import pandas as pd

def clean_user_data(df):
    """
    清洗用户数据
    """
    # 去除重复记录
    df = df.drop_duplicates(subset=['user_id', 'timestamp'])
    
    # 统一手机号格式
    df['phone'] = df['phone'].apply(lambda x: re.sub(r'[^\d]', '', str(x)) if pd.notna(x) else x)
    
    # 处理缺失值
    df['age'] = df['age'].fillna(df['age'].median())
    df['city'] = df['city'].fillna('未知')
    
    # 异常值处理（年龄在0-120之间）
    df = df[(df['age'] >= 0) & (df['age'] <= 120)]
    
    return df
```

#### 步骤3：数据转换（Transform）
- **格式转换**：转换为统一的数据格式（JSON、Parquet等）
- **结构化处理**：提取关键信息，构建结构化数据
- **特征工程**：构建用户特征、产品特征、行为特征等
- **数据聚合**：按时间、用户、产品等维度聚合数据

**特征工程示例**：
```python
def create_user_features(df):
    """
    创建用户特征
    """
    # 计算用户活跃度
    df['activity_score'] = df['login_count'] * 0.3 + df['purchase_count'] * 0.7
    
    # 计算用户价值（RFM模型）
    df['recency'] = (datetime.now() - df['last_purchase_date']).dt.days
    df['frequency'] = df['purchase_count']
    df['monetary'] = df['total_spent']
    
    # 用户分群（基于RFM）
    df['user_segment'] = pd.cut(
        df['activity_score'],
        bins=[0, 0.3, 0.7, 1.0],
        labels=['低活跃', '中活跃', '高活跃']
    )
    
    return df
```

#### 步骤4：数据验证（Validate）
- **格式验证**：验证数据格式是否符合要求
- **完整性验证**：检查必填字段是否完整
- **一致性验证**：验证不同数据源中同一实体的信息是否一致
- **质量评分**：对数据质量进行评分，低质量数据需要人工审核

#### 步骤5：数据加载（Load）
- **存储到数据仓库**：结构化数据存储到数据仓库（如ClickHouse、Hive）
- **存储到对象存储**：原始数据存储到OSS/S3
- **存储到数据库**：用户画像、营销活动等数据存储到MySQL/PostgreSQL
- **索引构建**：构建全文索引和向量索引

#### 步骤6：数据融合（Fusion）
- **用户数据融合**：融合来自不同数据源的用户数据，构建360度用户画像
- **行为数据融合**：融合用户在不同平台的行为数据
- **数据关联**：关联用户、产品、行为、广告等数据

### 数据质量保证

#### 数据质量指标
- **完整性**：数据完整率≥95%，关键字段缺失率&lt;1%
- **准确性**：数据准确率≥98%，通过抽样验证
- **一致性**：数据一致性≥95%，同一实体在不同数据源中的信息一致
- **及时性**：数据更新延迟&lt;1小时，实时数据延迟&lt;1分钟
- **有效性**：数据有效性≥99%，无效数据自动过滤

#### 质量监控
- **实时监控**：实时监控数据质量指标，异常自动告警
- **定期审计**：每周进行数据质量审计，生成质量报告
- **质量评分**：对每个数据源进行质量评分，低分数据源需要优化
- **异常处理**：自动识别和处理数据异常，记录异常日志

## 3.2 向量知识库

### 知识库构建

智能营销系统需要构建多个知识库，支持内容生成、推荐、分析等功能：

#### 产品知识库
- **产品信息**：产品名称、描述、规格、价格等
- **产品分类**：产品分类体系、标签体系
- **产品关系**：产品关联关系、搭配推荐等

**构建示例**：
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Milvus

# 创建文本分割器
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,  # 每块500字符
    chunk_overlap=50,  # 重叠50字符
    length_function=len,
)

# 分割产品文档
product_docs = text_splitter.split_documents(product_documents)

# 创建向量存储
embeddings = OpenAIEmbeddings()
vector_store = Milvus.from_documents(
    product_docs,
    embeddings,
    connection_args={"host": "localhost", "port": "19530"},
    collection_name="products"
)
```

#### 营销知识库
- **营销文案库**：历史营销文案、优秀案例、模板等
- **营销策略库**：营销策略、最佳实践、行业案例等
- **竞品分析库**：竞品信息、营销策略、价格策略等

**构建示例**：
```python
# 构建营销文案知识库
marketing_docs = []
for campaign in historical_campaigns:
    doc = {
        "content": f"{campaign.title}\n{campaign.description}\n目标受众：{campaign.target_audience}\n效果：{campaign.results}",
        "metadata": {
            "type": "marketing_copy",
            "campaign_id": campaign.id,
            "platform": campaign.platform,
            "effectiveness": campaign.roi
        }
    }
    marketing_docs.append(doc)

# 向量化并存储
vector_store.add_documents(marketing_docs)
```

#### 用户画像知识库
- **用户特征库**：用户标签、兴趣偏好、行为特征等
- **用户分群库**：用户分群规则、分群特征等
- **用户行为模式库**：用户行为模式、购买路径等

### 向量化策略

#### 文本向量化
- **模型选择**：使用text-embedding-ada-002、bge-large-zh等模型
- **分块策略**：根据内容类型选择合适的分块大小（产品描述500字符，营销文案1000字符）
- **元数据保留**：保留关键元数据（产品ID、用户ID、时间戳等）

**向量化示例**：
```python
from langchain.embeddings import HuggingFaceEmbeddings

# 使用中文向量模型
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-zh-v1.5",
    model_kwargs={'device': 'cuda'}
)

# 向量化文档
vectors = embeddings.embed_documents([doc.page_content for doc in documents])
```

#### 多模态向量化
- **图片向量化**：使用CLIP等模型对产品图片、营销海报进行向量化
- **视频向量化**：提取视频关键帧，进行向量化
- **音频向量化**：提取音频特征，进行向量化

### 检索优化

#### 混合检索
- **向量检索**：基于语义相似度的向量检索
- **关键词检索**：基于BM25等算法的关键词检索
- **混合检索**：结合向量检索和关键词检索，提升检索准确率

**混合检索示例**：
```python
from langchain.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever

# 创建BM25检索器
bm25_retriever = BM25Retriever.from_documents(documents)
bm25_retriever.k = 5

# 创建向量检索器
vector_retriever = vector_store.as_retriever(search_kwargs={"k": 5})

# 创建混合检索器
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.3, 0.7]  # 向量检索权重更高
)
```

#### 检索优化策略
- **重排序**：使用重排序模型对检索结果进行重新排序
- **过滤优化**：基于元数据过滤，提升检索精度
- **缓存策略**：缓存热门查询结果，提升检索速度

## 3.3 数据版本与血缘

### 版本管理

#### 数据版本控制
- **版本标识**：为每个数据集分配唯一版本号（如v1.0.0）
- **版本快照**：定期创建数据快照，支持数据回滚
- **版本对比**：支持版本间数据对比，识别数据变化

**版本管理示例**：
```python
# 使用DVC进行数据版本管理
import dvc.api

# 读取特定版本的数据
data = dvc.api.read(
    'data/user_profiles.csv',
    rev='v1.0.0'
)

# 创建新版本
# dvc add data/user_profiles.csv
# git commit -m "Update user profiles v1.1.0"
```

#### 模型版本管理
- **模型版本**：为每个AI模型分配版本号
- **模型快照**：保存模型训练时的数据快照
- **模型回滚**：支持模型版本回滚

### 血缘追踪

#### 数据血缘
- **数据来源追踪**：追踪每个数据的来源（数据源、处理流程等）
- **数据流向追踪**：追踪数据的使用流向（哪些模型、哪些报表使用了该数据）
- **影响分析**：分析数据变更对下游系统的影响

**血缘追踪示例**：
```python
# 使用OpenLineage进行数据血缘追踪
from openlineage.client import OpenLineageClient
from openlineage.client.facet import DataSourceDatasetFacet

client = OpenLineageClient(url="http://localhost:5000")

# 记录数据血缘
run_id = str(uuid.uuid4())
client.create_run(
    job_name="user_profile_processing",
    run_id=run_id,
    facets={
        "source": DataSourceDatasetFacet(
            name="crm_database",
            uri="mysql://host:3306/crm"
        ),
        "destination": DataSourceDatasetFacet(
            name="data_warehouse",
            uri="clickhouse://host:9000/marketing"
        )
    }
)
```

#### 模型血缘
- **训练数据追踪**：追踪模型使用的训练数据
- **特征追踪**：追踪模型使用的特征来源
- **模型依赖**：追踪模型之间的依赖关系

### 数据治理流程

#### 数据治理组织
- **数据治理委员会**：制定数据治理策略和标准
- **数据管理员**：负责数据质量监控和维护
- **数据所有者**：负责业务数据的准确性

#### 数据治理流程
1. **数据规划**：制定数据标准和规范
2. **数据采集**：按照标准采集数据
3. **数据质量监控**：持续监控数据质量
4. **问题处理**：发现和处理数据问题
5. **持续改进**：根据问题持续改进数据质量

#### 数据治理工具
- **数据目录**：使用DataHub、Amundsen等工具管理数据目录
- **数据质量工具**：使用Great Expectations、deequ等工具进行数据质量检查
- **数据血缘工具**：使用OpenLineage等工具追踪数据血缘
