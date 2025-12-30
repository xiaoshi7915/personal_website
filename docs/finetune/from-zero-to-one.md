---
sidebar_position: 8
title: 从零到一：微调大语言模型
description: 一个完整的教程，从环境搭建到部署上线的模型微调全流程
---

# 从零到一：微调大语言模型

本教程将带您从零开始，微调一个大语言模型用于特定任务。我们将创建一个**专业客服助手模型**，能够更好地理解和回答特定领域的问题。

## 项目概述

### 功能特性

- ✅ 数据准备和清洗
- ✅ 模型微调（LoRA）
- ✅ 模型评估
- ✅ 模型部署
- ✅ API接口

### 技术栈

- **框架**：Transformers + PEFT
- **模型**：Llama 2 / Qwen / ChatGLM
- **微调方法**：LoRA（低秩适应）
- **训练**：PyTorch + Accelerate
- **部署**：vLLM / TensorRT-LLM

## 第一步：环境准备

### 1.1 安装依赖

创建 `requirements.txt`：

```txt
torch>=2.0.0
transformers>=4.35.0
peft>=0.6.0
accelerate>=0.24.0
datasets>=2.14.0
bitsandbytes>=0.41.0
trl>=0.7.0
```

安装依赖：

```bash
pip install -r requirements.txt
```

### 1.2 准备GPU环境

确保有可用的GPU：

```bash
nvidia-smi  # 检查GPU
```

## 第二步：数据准备

### 2.1 收集数据

创建 `data/raw/` 目录，收集客服对话数据：

```python
# 数据格式示例
data = [
    {
        "instruction": "用户询问产品价格",
        "input": "这个产品多少钱？",
        "output": "您好，这款产品的价格是299元。目前有优惠活动，可以享受9折优惠。"
    },
    {
        "instruction": "用户询问退换货政策",
        "input": "可以退货吗？",
        "output": "您好，我们支持7天无理由退货。商品需保持原包装和标签完整。"
    },
    # ... 更多数据
]
```

### 2.2 数据清洗

```python
"""数据清洗脚本"""
import json
from typing import List, Dict

def clean_data(raw_data: List[Dict]) -> List[Dict]:
    """清洗数据"""
    cleaned = []
    
    for item in raw_data:
        # 检查必要字段
        if not all(k in item for k in ["instruction", "input", "output"]):
            continue
        
        # 检查数据质量
        if len(item["output"]) < 10:  # 输出太短
            continue
        
        # 清理文本
        item["instruction"] = item["instruction"].strip()
        item["input"] = item["input"].strip()
        item["output"] = item["output"].strip()
        
        cleaned.append(item)
    
    return cleaned

# 使用示例
with open("data/raw/train.json", "r") as f:
    raw_data = json.load(f)

cleaned_data = clean_data(raw_data)

with open("data/cleaned/train.json", "w") as f:
    json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
```

### 2.3 数据格式化

```python
"""数据格式化"""
from datasets import Dataset

def format_data(data: List[Dict]) -> Dataset:
    """格式化数据为训练格式"""
    formatted = []
    
    for item in data:
        # 构建提示词
        prompt = f"""### 指令：
{item['instruction']}

### 输入：
{item['input']}

### 输出：
{item['output']}"""
        
        formatted.append({
            "text": prompt
        })
    
    return Dataset.from_list(formatted)

# 使用示例
dataset = format_data(cleaned_data)
dataset.save_to_disk("data/formatted/train")
```

## 第三步：模型微调

### 3.1 加载基础模型

```python
"""模型加载"""
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model, TaskType

# 加载模型和分词器
model_name = "Qwen/Qwen-7B-Chat"  # 或使用其他模型
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto"
)

# 配置LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,  # LoRA秩
    lora_alpha=32,  # LoRA缩放参数
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"]  # 目标模块
)

# 应用LoRA
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()  # 查看可训练参数
```

### 3.2 训练配置

```python
"""训练配置"""
from transformers import TrainingArguments, Trainer

training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    fp16=True,  # 混合精度训练
    logging_steps=10,
    save_steps=500,
    evaluation_strategy="steps",
    eval_steps=500,
    save_total_limit=3,
    load_best_model_at_end=True,
    report_to="tensorboard"
)
```

### 3.3 训练模型

```python
"""训练模型"""
from transformers import DataCollatorForLanguageModeling

# 数据整理器
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False
)

# 创建训练器
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    data_collator=data_collator,
)

# 开始训练
trainer.train()

# 保存模型
model.save_pretrained("./fine-tuned-model")
tokenizer.save_pretrained("./fine-tuned-model")
```

## 第四步：模型评估

### 4.1 评估指标

```python
"""模型评估"""
from transformers import pipeline

# 创建文本生成管道
generator = pipeline(
    "text-generation",
    model="./fine-tuned-model",
    tokenizer=tokenizer,
    device=0
)

# 测试样本
test_cases = [
    "用户询问：这个产品有什么特点？",
    "用户询问：如何申请退款？",
    # ... 更多测试用例
]

# 评估
for test_case in test_cases:
    result = generator(test_case, max_length=200, temperature=0.7)
    print(f"输入：{test_case}")
    print(f"输出：{result[0]['generated_text']}")
    print("-" * 50)
```

### 4.2 对比评估

```python
"""对比基础模型和微调模型"""
def compare_models(base_model, fine_tuned_model, test_cases):
    """对比两个模型的表现"""
    base_generator = pipeline("text-generation", model=base_model)
    fine_tuned_generator = pipeline("text-generation", model=fine_tuned_model)
    
    for test_case in test_cases:
        base_result = base_generator(test_case, max_length=200)
        fine_tuned_result = fine_tuned_generator(test_case, max_length=200)
        
        print(f"测试：{test_case}")
        print(f"基础模型：{base_result[0]['generated_text']}")
        print(f"微调模型：{fine_tuned_result[0]['generated_text']}")
        print("-" * 50)
```

## 第五步：模型部署

### 5.1 使用vLLM部署

```python
"""vLLM部署"""
from vllm import LLM, SamplingParams

# 加载模型
llm = LLM(model="./fine-tuned-model", tensor_parallel_size=1)

# 采样参数
sampling_params = SamplingParams(
    temperature=0.7,
    top_p=0.9,
    max_tokens=200
)

# 生成
prompts = ["用户询问：产品价格是多少？"]
outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    print(output.outputs[0].text)
```

### 5.2 API服务

```python
"""FastAPI服务"""
from fastapi import FastAPI
from pydantic import BaseModel
from vllm import LLM, SamplingParams

app = FastAPI()

# 加载模型
llm = LLM(model="./fine-tuned-model")
sampling_params = SamplingParams(temperature=0.7, max_tokens=200)

class QueryRequest(BaseModel):
    prompt: str

@app.post("/generate")
async def generate(request: QueryRequest):
    """生成文本"""
    outputs = llm.generate([request.prompt], sampling_params)
    return {"response": outputs[0].outputs[0].text}
```

## 总结

本教程展示了如何微调大语言模型：

1. 数据准备和清洗
2. 模型加载和LoRA配置
3. 模型训练
4. 模型评估
5. 模型部署

通过微调，可以让通用模型适应特定领域，提升在特定任务上的表现。

