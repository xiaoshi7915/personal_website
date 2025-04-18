---
sidebar_position: 2
---

# 基础开发指南

本指南将帮助您从零开始进行模型微调，包括环境准备、数据收集和处理、训练过程以及模型评估和部署。

## 环境准备

### 硬件要求

微调LLM对硬件有一定要求，根据模型大小和数据量，推荐配置如下：

- **入门级**：
  - GPU: NVIDIA RTX 3090 (24GB VRAM)
  - RAM: 32GB以上
  - 存储: 1TB SSD
  
- **中等规模**：
  - GPU: NVIDIA RTX 4090或A100 (40GB/80GB)
  - RAM: 64GB以上
  - 存储: 2TB SSD

- **云端替代方案**：
  - Google Colab Pro+
  - AWS SageMaker
  - Azure ML
  - Lambda Labs

### 软件环境

1. **安装基础依赖**

```bash
# 创建虚拟环境
python -m venv finetune-env
source finetune-env/bin/activate  # Linux/Mac
# 或 finetune-env\Scripts\activate  # Windows

# 安装基础库
pip install -U pip setuptools wheel
pip install torch torchvision torchaudio
pip install transformers datasets accelerate
pip install peft bitsandbytes wandb
```

2. **配置Hugging Face账户**

```bash
# 登录Hugging Face
huggingface-cli login
```

## 数据准备

### 数据收集策略

微调数据的质量直接影响模型性能，请考虑以下数据来源：

- 公开数据集（MMLU、TruthfulQA等）
- 内部知识库和文档
- 专家手工编写的问答对
- 特定领域的案例研究
- 已有对话记录（经过清洗）

### 数据格式和结构

对于指令微调，数据通常采用以下格式：

```json
{
  "instruction": "给定一个医学症状描述，提供可能的诊断和建议。",
  "input": "患者出现持续性头痛，伴有视力模糊和轻度恶心，症状持续3天。",
  "output": "根据描述的症状，患者可能存在偏头痛、高血压性头痛或眼部疾病引起的头痛...[详细回答]"
}
```

### 数据处理步骤

1. **数据清洗**

```python
import pandas as pd
import re

def clean_text(text):
    # 删除多余空白
    text = re.sub(r'\s+', ' ', text).strip()
    # 删除HTML标签
    text = re.sub(r'<.*?>', '', text)
    # 其他清洗规则...
    return text

# 读取原始数据
df = pd.read_csv('raw_data.csv')

# 应用清洗
df['instruction'] = df['instruction'].apply(clean_text)
df['input'] = df['input'].apply(clean_text)
df['output'] = df['output'].apply(clean_text)

# 保存清洗后的数据
df.to_csv('cleaned_data.csv', index=False)
```

2. **数据格式转换**

将处理好的数据转换为Hugging Face数据集格式：

```python
from datasets import Dataset

# 转换为Hugging Face数据集
dataset = Dataset.from_pandas(df)

# 分割数据集
train_test = dataset.train_test_split(test_size=0.1, seed=42)
train_dataset = train_test['train']
eval_dataset = train_test['test']

# 保存数据集
train_dataset.save_to_disk("train_dataset")
eval_dataset.save_to_disk("eval_dataset")
```

## 微调过程

### 1. 选择基础模型

根据您的需求和资源选择合适的基础模型：

- **小型模型**：Llama-2-7b, Mistral-7B, Gemma-2b
- **中型模型**：Llama-2-13b, Mixtral-8x7B, Gemma-7b
- **大型模型**：Llama-3-70b, Falcon-40b, Llama-2-70b

### 2. 配置微调参数

创建微调配置文件 `finetune_config.py`：

```python
from transformers import TrainingArguments

# 训练参数配置
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    gradient_accumulation_steps=2,
    evaluation_strategy="steps",
    eval_steps=500,
    logging_dir="./logs",
    logging_steps=100,
    save_strategy="steps",
    save_steps=500,
    save_total_limit=3,
    load_best_model_at_end=True,
    metric_for_best_model="loss",
    greater_is_better=False,
    weight_decay=0.01,
    warmup_steps=500,
    lr_scheduler_type="cosine",
    learning_rate=2e-5,
    bf16=True,  # 使用bfloat16精度
    report_to="wandb",  # 使用Weights & Biases跟踪实验
)
```

### 3. 使用LoRA进行参数高效微调

创建微调脚本 `train.py`：

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_from_disk
from finetune_config import training_args

# 加载模型和分词器
model_id = "meta-llama/Llama-2-13b-hf"  # 或其他模型
tokenizer = AutoTokenizer.from_pretrained(model_id)
tokenizer.pad_token = tokenizer.eos_token

# 加载基础模型（8比特量化以减少内存使用）
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    load_in_8bit=True,
    device_map="auto",
    torch_dtype=torch.float16,
)

# 准备模型进行LoRA训练
model = prepare_model_for_kbit_training(model)

# LoRA配置
lora_config = LoraConfig(
    r=16,  # LoRA矩阵的秩
    lora_alpha=32,  # LoRA的alpha参数
    lora_dropout=0.05,  # LoRA的dropout率
    bias="none",
    task_type="CAUSAL_LM",  # 任务类型
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",  # 注意力模块
        "gate_proj", "up_proj", "down_proj"  # MLP模块
    ],
)

# 应用LoRA适配器
model = get_peft_model(model, lora_config)

# 加载数据集
train_dataset = load_from_disk("train_dataset")
eval_dataset = load_from_disk("eval_dataset")

# 数据预处理函数
def preprocess_function(examples):
    # 拼接指令、输入和输出
    prompts = []
    for instruction, input_text, output in zip(examples["instruction"], examples["input"], examples["output"]):
        if input_text:
            prompt = f"### 指令:\n{instruction}\n\n### 输入:\n{input_text}\n\n### 响应:\n"
        else:
            prompt = f"### 指令:\n{instruction}\n\n### 响应:\n"
        prompts.append(prompt)
    
    # 目标文本是输出
    targets = [f"{output}{tokenizer.eos_token}" for output in examples["output"]]
    
    # 拼接提示和目标用于训练
    model_inputs = tokenizer(prompts, max_length=1024, truncation=True, padding="max_length")
    labels = tokenizer(targets, max_length=1024, truncation=True, padding="max_length")
    
    # 创建标签矩阵
    model_inputs["labels"] = labels["input_ids"].copy()
    
    return model_inputs

# 应用预处理
tokenized_train = train_dataset.map(preprocess_function, batched=True)
tokenized_eval = eval_dataset.map(preprocess_function, batched=True)

# 创建Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_eval,
)

# 开始训练
trainer.train()

# 保存最终模型
model.save_pretrained("./final_model")
tokenizer.save_pretrained("./final_model")
```

### 4. 执行训练

```bash
# 启动训练
python train.py
```

## 模型评估

### 1. 基本性能评估

```python
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import pandas as pd

# 加载基础模型
base_model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-13b-hf",
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-13b-hf")

# 加载LoRA适配器
peft_model = PeftModel.from_pretrained(base_model, "./final_model")

# 创建生成管道
pipe = pipeline("text-generation", model=peft_model, tokenizer=tokenizer)

# 准备测试集
test_prompts = [
    "### 指令:\n解释人工智能中的'幻觉'现象。\n\n### 响应:\n",
    "### 指令:\n总结RLHF技术的工作原理。\n\n### 响应:\n",
    # 添加更多测试提示...
]

# 生成结果
results = []
for prompt in test_prompts:
    output = pipe(prompt, max_length=1024, temperature=0.7)[0]['generated_text']
    # 提取响应部分
    response = output.split("### 响应:\n")[1]
    results.append(response)

# 保存结果
eval_df = pd.DataFrame({
    "prompt": test_prompts,
    "response": results
})
eval_df.to_csv("model_evaluations.csv", index=False)
```

### 2. 使用标准基准测试

```python
# 安装评估库
# pip install lm-eval

# 使用lm-evaluation-harness评估模型
from lm_eval import evaluator
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# 加载模型
base_model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-13b-hf",
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-13b-hf")
peft_model = PeftModel.from_pretrained(base_model, "./final_model")

# 评估任务
tasks = ["mmlu", "truthfulqa"]
results = evaluator.simple_evaluate(
    model="hf",
    model_args={
        "pretrained": peft_model,
        "tokenizer": tokenizer,
    },
    tasks=tasks,
    batch_size=1,
    num_fewshot=5,
)

print(results)
```

## 模型部署

### 1. 模型合并和量化

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# 加载基础模型
base_model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-13b-hf",
    device_map="auto",
)

# 加载LoRA适配器权重
peft_model = PeftModel.from_pretrained(base_model, "./final_model")

# 合并权重
merged_model = peft_model.merge_and_unload()

# 保存完整模型
merged_model.save_pretrained("./merged_model")
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-13b-hf")
tokenizer.save_pretrained("./merged_model")

# 进行GPTQ量化（可选，用于减小模型大小）
from auto_gptq import AutoGPTQForCausalLM, BaseQuantizeConfig

quantize_config = BaseQuantizeConfig(
    bits=4,
    group_size=128,
    desc_act=False,
)

# 加载合并后的模型并量化
quantized_model = AutoGPTQForCausalLM.from_pretrained(
    "./merged_model",
    quantize_config=quantize_config,
)

# 量化并保存
quantized_model.quantize()
quantized_model.save_pretrained("./quantized_model")
```

### 2. 使用FastAPI构建推理服务

创建 `app.py`:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# 创建FastAPI应用
app = FastAPI(title="微调模型API")

# 定义请求和响应模型
class Query(BaseModel):
    instruction: str
    input: str = ""
    max_length: int = 1024
    temperature: float = 0.7
    top_p: float = 0.9

class Response(BaseModel):
    output: str

# 加载模型
@app.on_event("startup")
async def startup_event():
    global model, tokenizer
    
    model_path = "./merged_model"  # 或 "./quantized_model"
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        device_map="auto",
        torch_dtype=torch.float16,
    )
    print("模型已加载")

# 创建生成端点
@app.post("/generate", response_model=Response)
async def generate(query: Query):
    try:
        # 构建提示
        if query.input:
            prompt = f"### 指令:\n{query.instruction}\n\n### 输入:\n{query.input}\n\n### 响应:\n"
        else:
            prompt = f"### 指令:\n{query.instruction}\n\n### 响应:\n"
        
        # 生成回答
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        
        output = model.generate(
            **inputs,
            max_length=query.max_length,
            temperature=query.temperature,
            top_p=query.top_p,
            do_sample=True,
        )
        
        # 解码输出
        full_output = tokenizer.decode(output[0], skip_special_tokens=True)
        
        # 提取响应部分
        result = full_output.split("### 响应:\n")[1]
        
        return Response(output=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 运行服务
# uvicorn app:app --host 0.0.0.0 --port 8000
```

启动服务：

```bash
pip install fastapi uvicorn
uvicorn app:app --host 0.0.0.0 --port 8000
```

## 实际案例：医疗助手微调

### 1. 准备医疗问答数据

示例医疗数据格式：

```json
[
  {
    "instruction": "根据症状提供可能的诊断建议。",
    "input": "患者描述持续高烧39度，伴有咳嗽和呼吸急促，已持续3天。",
    "output": "根据症状描述，患者可能患有肺炎、流感或COVID-19。建议立即就医进行检查，包括胸部X光、血液检查和可能的COVID-19检测。在等待医疗援助期间，注意休息、补充水分并监测体温变化。这些症状需要专业医疗评估，不建议自行用药治疗。"
  },
  {
    "instruction": "解释这种药物的作用机制和可能的副作用。",
    "input": "阿司匹林",
    "output": "阿司匹林(乙酰水杨酸)是一种非甾体抗炎药(NSAID)，主要通过抑制环氧合酶(COX)酶来减少前列腺素的产生，从而发挥解热、镇痛和抗炎作用。低剂量时还具有抗血小板聚集作用，用于预防心血管疾病。常见副作用包括胃部不适、消化性溃疡、胃肠道出血等消化系统问题，以及过敏反应。儿童和青少年使用可能引起罕见但严重的瑞氏综合征，使用前应咨询医生的建议。"
  },
  // ... 更多医疗问答对
]
```

### 2. 修改训练脚本

```python
# 修改模型选择为医疗场景适合的模型
model_id = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"
# 或使用通用大模型
# model_id = "meta-llama/Llama-2-13b-hf" 

# 调整LoRA配置
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
)

# 调整训练参数
training_args = TrainingArguments(
    output_dir="./medical_assistant",
    num_train_epochs=5,  # 增加训练轮次
    per_device_train_batch_size=2,  # 调小批量大小
    gradient_accumulation_steps=4,  # 增加梯度累积
    learning_rate=1e-5,  # 降低学习率
    # ... 其他参数与前面相同
)
```

## 常见问题与解决方案

### 1. GPU内存不足

- 使用8-bit或4-bit量化加载模型
- 减小批量大小并增加梯度累积步数
- 使用更小的基础模型
- 考虑DeepSpeed ZeRO优化

### 2. 过拟合

- 增加训练数据多样性
- 添加正则化（如增加weight_decay）
- 减少训练轮次
- 使用早停策略

### 3. 生成质量问题

- 调整解码参数（温度、top_p、重复惩罚等）
- 优化提示模板
- 检查训练数据质量
- 重新检查预处理步骤

## 下一步

恭喜！您已经完成了微调入门。接下来，您可以探索：

1. [高级微调技巧](/docs/finetune/development)了解更多高级特性和优化方法
2. [多模态模型微调](/docs/finetune/multimodal)学习如何微调处理图像和文本的模型
3. [强化学习微调](/docs/finetune/rlhf)深入研究RLHF技术

微调是一个不断演进的领域，持续实验和学习将帮助您获得最佳结果！ 