---
sidebar_position: 6
title: 微调技术实战案例
description: 微调技术的实际应用案例，从零到一进行模型微调
---

# 微调技术实战案例

本文档提供了多个完整的微调实战案例，帮助您从零开始进行模型微调。

## 案例1：领域特定文本分类

### 项目概述

微调BERT模型用于特定领域的文本分类任务。

### 技术栈

- **基础模型**：BERT-base-chinese
- **框架**：Transformers + PyTorch
- **任务**：医疗文本分类

### 实施步骤

#### 步骤1：准备数据

```python
import pandas as pd
from sklearn.model_selection import train_test_split

# 加载数据
df = pd.read_csv('medical_texts.csv')
train_df, val_df = train_test_split(df, test_size=0.2, random_state=42)

print(f"训练集: {len(train_df)}, 验证集: {len(val_df)}")
```

#### 步骤2：数据预处理

```python
from transformers import BertTokenizer
from torch.utils.data import Dataset
import torch

tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')

class MedicalDataset(Dataset):
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

train_dataset = MedicalDataset(
    train_df['text'].tolist(),
    train_df['label'].tolist(),
    tokenizer
)
```

#### 步骤3：模型微调

```python
from transformers import BertForSequenceClassification, Trainer, TrainingArguments

# 加载模型
model = BertForSequenceClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=5  # 5个医疗类别
)

# 训练参数
training_args = TrainingArguments(
    output_dir='./medical_bert',
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    warmup_steps=500,
    weight_decay=0.01,
    logging_dir='./logs',
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
)

# 训练器
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
)

# 开始训练
trainer.train()
```

## 案例2：代码生成模型微调

### 项目概述

微调CodeT5模型用于特定编程语言的代码生成。

### 实施步骤

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
from transformers import Trainer, TrainingArguments

# 加载模型
model_name = 'Salesforce/codet5-base'
tokenizer = T5Tokenizer.from_pretrained(model_name)
model = T5ForConditionalGeneration.from_pretrained(model_name)

# 准备数据
def prepare_code_data(code_pairs):
    """准备代码对数据"""
    inputs = []
    targets = []
    
    for pair in code_pairs:
        inputs.append(f"生成代码: {pair['description']}")
        targets.append(pair['code'])
    
    return inputs, targets

# 训练
training_args = TrainingArguments(
    output_dir='./codet5_finetuned',
    num_train_epochs=5,
    per_device_train_batch_size=8,
    learning_rate=5e-5,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
)

trainer.train()
```

## 案例3：LoRA微调

### 项目概述

使用LoRA（Low-Rank Adaptation）进行高效微调。

### 实施步骤

```python
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM

# 加载模型
model = AutoModelForCausalLM.from_pretrained("gpt2")

# 配置LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,  # LoRA rank
    lora_alpha=32,  # LoRA alpha
    target_modules=["c_attn", "c_proj"],  # 目标模块
    lora_dropout=0.1,
)

# 应用LoRA
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()  # 查看可训练参数

# 训练（只训练LoRA参数）
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
)
trainer.train()
```

## 案例4：多任务微调

### 项目概述

在一个模型上同时微调多个相关任务。

### 实施步骤

```python
from transformers import AutoModelForSequenceClassification
from transformers import Trainer, TrainingArguments

# 加载模型
model = AutoModelForSequenceClassification.from_pretrained(
    'bert-base-chinese',
    num_labels=10  # 多任务标签
)

# 多任务数据加载器
class MultiTaskDataset(Dataset):
    def __init__(self, task1_data, task2_data, task3_data):
        self.data = []
        # 合并多个任务的数据
        self.data.extend(task1_data)
        self.data.extend(task2_data)
        self.data.extend(task3_data)
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        return self.data[idx]

# 训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=multi_task_dataset,
)
trainer.train()
```

## 案例5：持续学习

### 项目概述

在新数据上持续微调模型，避免灾难性遗忘。

### 实施步骤

```python
from transformers import Trainer
import torch

class ContinualLearningTrainer(Trainer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.previous_weights = None
    
    def training_step(self, model, inputs):
        # 保存旧权重
        if self.previous_weights is None:
            self.previous_weights = {
                name: param.clone() 
                for name, param in model.named_parameters()
            }
        
        # 标准训练步骤
        loss = super().training_step(model, inputs)
        
        # 计算权重变化
        weight_change = 0
        for name, param in model.named_parameters():
            if name in self.previous_weights:
                weight_change += torch.norm(
                    param - self.previous_weights[name]
                ).item()
        
        # 添加正则化项防止过度变化
        loss += 0.01 * weight_change
        
        return loss

# 使用持续学习训练器
trainer = ContinualLearningTrainer(
    model=model,
    args=training_args,
    train_dataset=new_task_dataset,
)
trainer.train()
```

## 最佳实践

1. **数据质量**：确保训练数据质量高且标注准确
2. **学习率**：使用较小的学习率（通常1e-5到5e-5）
3. **早停机制**：使用验证集进行早停
4. **超参数调优**：使用验证集调优超参数
5. **模型评估**：在测试集上评估模型性能

## 相关资源

- [微调技术深度解析](/docs/finetune/comprehensive-intro)
- [Transformer架构](/docs/transformer/intro)
- [开发指南](/docs/finetune/development)

