---
sidebar_position: 4
---

# 提示词工程最佳实践

本文档总结了编写高效提示词的最佳实践。

## 提示词结构最佳实践

### 1. 清晰的角色定义

```python
prompt = """你是一位经验丰富的Python开发专家，擅长代码优化和问题诊断。

任务：{task}
"""
```

### 2. 明确的指令

```python
prompt = """请按照以下步骤完成任务：

1. 分析问题
2. 提供解决方案
3. 给出代码示例
4. 解释关键点

问题：{question}
"""
```

### 3. 提供示例

```python
prompt = """以下是几个示例：

示例1：
输入：如何优化Python代码性能？
输出：[详细的优化建议]

示例2：
输入：如何调试异步代码？
输出：[调试方法]

现在请回答：
输入：{user_input}
输出：
"""
```

## 提示词优化技巧

### 1. 使用思维链（Chain of Thought）

```python
prompt = """让我们一步步思考这个问题：

第一步：理解问题
{problem}

第二步：分析关键点
[分析]

第三步：提供解决方案
[方案]

第四步：验证答案
[验证]
"""
```

### 2. 添加约束条件

```python
prompt = """请回答以下问题，要求：

- 答案不超过200字
- 使用专业术语
- 提供具体示例
- 避免使用"可能"、"也许"等不确定词汇

问题：{question}
"""
```

### 3. 格式化输出

```python
prompt = """请以JSON格式输出结果：

{
  "summary": "总结",
  "key_points": ["要点1", "要点2"],
  "examples": ["示例1", "示例2"]
}

问题：{question}
"""
```

## 领域特定最佳实践

### 1. 代码生成

```python
code_prompt = """作为Python专家，请生成代码：

要求：
- 添加详细注释
- 包含错误处理
- 遵循PEP 8规范
- 提供使用示例

任务：{task}
"""
```

### 2. 文本分析

```python
analysis_prompt = """请分析以下文本：

分析维度：
1. 主题识别
2. 情感分析
3. 关键信息提取
4. 总结

文本：{text}
"""
```

### 3. 问题解答

```python
qa_prompt = """基于以下上下文回答问题：

上下文：{context}

问题：{question}

要求：
- 只基于上下文回答
- 如果上下文没有相关信息，请说明
- 引用具体的上下文片段
"""
```

## 高级技巧

### 1. 少样本学习（Few-shot Learning）

```python
few_shot_prompt = """以下是几个示例：

示例1：
输入：什么是机器学习？
输出：机器学习是人工智能的一个分支，通过算法让计算机从数据中学习模式。

示例2：
输入：什么是深度学习？
输出：深度学习是机器学习的一个子领域，使用多层神经网络学习数据表示。

现在请回答：
输入：{question}
输出：
"""
```

### 2. 角色扮演

```python
roleplay_prompt = """你是一位资深的技术面试官，请模拟技术面试：

面试官角色：
- 提出有挑战性的问题
- 评估答案的质量
- 提供建设性反馈

候选人的回答：{answer}

请给出评价：
"""
```

### 3. 迭代优化

```python
def iterative_prompt_optimization(base_prompt, feedback):
    """基于反馈迭代优化提示词"""
    optimized = f"""{base_prompt}

根据以下反馈进行改进：
{feedback}

优化后的提示词：
"""
    return optimized
```

## 常见错误避免

### 1. 避免模糊指令

❌ 错误示例：
```
请帮我写代码
```

✅ 正确示例：
```
请用Python编写一个函数，实现快速排序算法，要求：
- 函数名为quick_sort
- 参数为整数列表
- 返回排序后的列表
- 包含详细注释
```

### 2. 避免过长提示词

```python
# 保持提示词简洁，关键信息前置
concise_prompt = """任务：{task}
要求：{requirements}
输出格式：{format}
"""
```

### 3. 避免矛盾指令

```python
# 确保指令之间不矛盾
clear_prompt = """请用简洁的语言（不超过100字）详细解释以下概念：
{concept}
"""
# 注意：简洁和详细是矛盾的，需要明确优先级
```

## 提示词测试和评估

### 1. A/B测试

```python
def test_prompts(prompt_variants, test_cases):
    """测试不同版本的提示词"""
    results = {}
    for variant_name, prompt in prompt_variants.items():
        scores = []
        for test_case in test_cases:
            result = generate(prompt.format(**test_case))
            score = evaluate(result, test_case['expected'])
            scores.append(score)
        results[variant_name] = np.mean(scores)
    return results
```

### 2. 质量评估

```python
def evaluate_prompt_quality(response, criteria):
    """评估提示词生成结果的质量"""
    scores = {
        "relevance": check_relevance(response, criteria),
        "completeness": check_completeness(response, criteria),
        "accuracy": check_accuracy(response, criteria),
        "clarity": check_clarity(response)
    }
    return scores
```

## 工具和资源

### 1. 提示词模板库

```python
PROMPT_TEMPLATES = {
    "code_generation": """作为{language}专家，生成代码：
任务：{task}
要求：{requirements}
""",
    "text_summarization": """总结以下文本：
文本：{text}
长度：{max_length}字
""",
    "qa": """基于上下文回答问题：
上下文：{context}
问题：{question}
"""
}
```

### 2. 提示词版本管理

```python
class PromptVersion:
    def __init__(self, version, prompt, metadata):
        self.version = version
        self.prompt = prompt
        self.metadata = metadata  # 包含测试结果、使用场景等
    
    def compare(self, other):
        """比较不同版本的提示词效果"""
        pass
```

## 总结

遵循这些最佳实践可以：

1. **提高生成质量**：通过清晰的结构和明确的指令
2. **减少错误**：通过约束条件和示例
3. **优化性能**：通过迭代测试和改进
4. **提高可维护性**：通过模板化和版本管理

持续学习和实验是提升提示词工程能力的关键。


