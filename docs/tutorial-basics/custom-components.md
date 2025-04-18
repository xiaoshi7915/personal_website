---
sidebar_position: 7
title: 自定义组件
---

# 自定义组件使用指南

本网站提供了多种自定义组件，帮助您更好地展示文档内容。这些组件可以用于强调重要信息、展示代码示例和规范内容格式。

## 自定义组件列表

网站提供以下自定义组件：

1. **InfoCard**: 用于展示信息提示、警告、成功信息等
2. **CodeExample**: 用于展示带有标签页的代码示例

## 使用方法

要使用这些组件，需要在MDX文件顶部导入它们：

```jsx
import InfoCard from '@site/src/components/InfoCard';
import CodeExample from '@site/src/components/CodeExample';
```

### InfoCard组件参数

InfoCard组件接受以下参数：

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| type | string | 'info' | 卡片类型，可选值：'info', 'tip', 'warning', 'danger', 'success' |
| title | string | 根据type自动设置 | 卡片标题 |
| collapsible | boolean | false | 是否可折叠 |

### CodeExample组件参数

CodeExample组件接受以下参数：

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| title | string | - | 代码示例标题 |
| tabs | array | [] | 选项卡配置，每个选项为 `{ label: string }` |

## 最佳实践

- 使用InfoCard突出重要信息，选择适当的类型
- 对复杂或长篇代码示例使用CodeExample
- 为相关但不同语言或环境的代码提供多选项卡示例
- 保持组件内容简洁明了，避免过多嵌套
- 在整个文档中保持一致的样式 