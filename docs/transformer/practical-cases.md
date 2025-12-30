---
sidebar_position: 6
title: Transformer实战案例
description: Transformer架构的实际应用案例，从零到一构建完整的Transformer应用
---

# Transformer实战案例

本文档提供了多个完整的Transformer实战案例，帮助您从零开始构建Transformer应用。

## 案例1：文本分类系统

### 项目概述

构建一个基于BERT的文本分类系统，能够对新闻文章进行自动分类。

### 技术栈

- **模型**：BERT-base-chinese
- **框架**：PyTorch + Transformers
- **数据处理**：Pandas + NumPy
- **评估**：sklearn

### 实施步骤

#### 步骤1：环境准备

```bash
pip install torch transformers pandas numpy scikit-learn
```

#### 步骤2：数据准备

```python
import pandas as pd
from sklearn.model_selection import train_test_split

# 加载数据
df = pd.read_csv('news_data.csv')
train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)

print(f"训练集大小: {len(train_df)}")
print(f"测试集大小: {len(test_df)}")
```

#### 步骤3：模型训练

```python
from transformers import BertTokenizer, BertForSequenceClassification
from transformers import Trainer, TrainingArguments
import torch

# 加载模型和分词器
model_name = 'bert-base-chinese'
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForSequenceClassification.from_pretrained(
    model_name,
    num_labels=10  # 10个分类
)

# 准备数据集
class NewsDataset(torch.utils.data.Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

train_dataset = NewsDataset(
    train_df['text'].tolist(),
    train_df['label'].tolist(),
    tokenizer
)

# 训练参数
training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir='./logs',
)

# 训练器
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
)

# 开始训练
trainer.train()
```

#### 步骤4：模型评估

```python
from sklearn.metrics import accuracy_score, classification_report

# 评估
test_dataset = NewsDataset(
    test_df['text'].tolist(),
    test_df['label'].tolist(),
    tokenizer
)

predictions = trainer.predict(test_dataset)
predicted_labels = predictions.predictions.argmax(axis=-1)

accuracy = accuracy_score(test_df['label'], predicted_labels)
print(f"准确率: {accuracy:.4f}")

print(classification_report(test_df['label'], predicted_labels))
```

## 案例2：问答系统

### 项目概述

构建一个基于BERT的问答系统，能够根据上下文回答问题。

### 实施步骤

```python
from transformers import BertForQuestionAnswering, BertTokenizer
import torch

# 加载模型
model = BertForQuestionAnswering.from_pretrained('bert-base-chinese')
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')

def answer_question(question, context):
    # 编码输入
    inputs = tokenizer.encode_plus(
        question,
        context,
        add_special_tokens=True,
        return_tensors='pt',
        max_length=512,
        truncation=True
    )
    
    # 获取答案
    with torch.no_grad():
        outputs = model(**inputs)
        start_scores = outputs.start_logits
        end_scores = outputs.end_logits
    
    # 找到答案位置
    start_idx = torch.argmax(start_scores)
    end_idx = torch.argmax(end_scores)
    
    # 解码答案
    answer_tokens = inputs['input_ids'][0][start_idx:end_idx+1]
    answer = tokenizer.decode(answer_tokens)
    
    return answer

# 使用示例
context = "人工智能是计算机科学的一个分支，旨在创建能够执行通常需要人类智能的任务的系统。"
question = "人工智能是什么？"
answer = answer_question(question, context)
print(f"答案: {answer}")
```

## 案例3：文本生成

### 项目概述

使用GPT-2进行文本生成。

### 实施步骤

```python
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

# 加载模型
model_name = 'gpt2'  # 或使用中文模型
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPT2LMHeadModel.from_pretrained(model_name)

def generate_text(prompt, max_length=100, temperature=0.7):
    # 编码输入
    inputs = tokenizer.encode(prompt, return_tensors='pt')
    
    # 生成文本
    with torch.no_grad():
        outputs = model.generate(
            inputs,
            max_length=max_length,
            temperature=temperature,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    # 解码输出
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated_text

# 使用示例
prompt = "人工智能的未来"
generated = generate_text(prompt, max_length=150)
print(generated)
```

## 案例4：命名实体识别

### 项目概述

使用BERT进行命名实体识别（NER）。

### 实施步骤

```python
from transformers import BertForTokenClassification, BertTokenizer
import torch

# 加载模型
model = BertForTokenClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=9  # BIO标注：O, B-PER, I-PER, B-ORG, I-ORG, B-LOC, I-LOC, B-MISC, I-MISC
)
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')

def extract_entities(text):
    # 编码输入
    inputs = tokenizer(
        text,
        return_tensors='pt',
        padding=True,
        truncation=True,
        max_length=512
    )
    
    # 预测
    with torch.no_grad():
        outputs = model(**inputs)
        predictions = torch.argmax(outputs.logits, dim=-1)
    
    # 解码实体
    tokens = tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
    entities = []
    
    for token, pred in zip(tokens, predictions[0]):
        if pred.item() != 0:  # 不是O标签
            entities.append((token, pred.item()))
    
    return entities

# 使用示例
text = "苹果公司位于美国加利福尼亚州库比蒂诺。"
entities = extract_entities(text)
print(entities)
```

## 案例5：情感分析系统

### 项目概述

构建一个情感分析系统，判断文本的情感倾向。

### 实施步骤

```python
from transformers import BertForSequenceClassification, BertTokenizer
import torch

# 加载模型
model = BertForSequenceClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=3  # 正面、中性、负面
)
tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')

def analyze_sentiment(text):
    # 编码输入
    inputs = tokenizer(
        text,
        return_tensors='pt',
        padding=True,
        truncation=True,
        max_length=128
    )
    
    # 预测
    with torch.no_grad():
        outputs = model(**inputs)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
    
    # 获取情感标签
    labels = ['负面', '中性', '正面']
    predicted_label = labels[torch.argmax(predictions).item()]
    confidence = torch.max(predictions).item()
    
    return {
        'label': predicted_label,
        'confidence': confidence,
        'scores': {label: score.item() for label, score in zip(labels, predictions[0])}
    }

# 使用示例
text = "这个产品非常好用，强烈推荐！"
result = analyze_sentiment(text)
print(f"情感: {result['label']}, 置信度: {result['confidence']:.4f}")
```

## 最佳实践

1. **数据预处理**：确保数据质量和格式统一
2. **超参数调优**：使用验证集调优学习率、批次大小等
3. **模型微调**：在特定任务上微调预训练模型
4. **评估指标**：选择合适的评估指标（准确率、F1分数等）
5. **模型部署**：使用ONNX或TorchScript优化部署

## 相关资源

- [Transformer架构详解](/docs/transformer/architecture)
- [微调技术](/docs/finetune/intro)
- [开发指南](/docs/transformer/development)

