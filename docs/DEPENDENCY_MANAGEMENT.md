# 依赖管理指南

本文档说明如何管理和更新项目依赖。

## 当前依赖状态

- **Node.js版本要求**: >=18.0
- **主要框架**: Docusaurus 3.9.2
- **React版本**: 18.3.1

## 依赖更新流程

### 1. 检查过时的依赖

```bash
# 检查过时的包
npm outdated

# 或者使用yarn
yarn outdated
```

### 2. 更新依赖

#### 更新所有依赖到最新版本（谨慎使用）

```bash
# 使用npm
npm update

# 使用yarn
yarn upgrade
```

#### 更新特定依赖

```bash
# 更新单个包
npm install package-name@latest

# 更新多个包
npm install package1@latest package2@latest
```

### 3. 安全审计

```bash
# 运行安全审计
npm audit

# 自动修复可修复的漏洞
npm audit fix

# 强制修复（可能包含破坏性更改）
npm audit fix --force
```

### 4. 测试更新后的依赖

```bash
# 清理构建缓存
npm run clear

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 构建项目
npm run build

# 启动开发服务器测试
npm run start
```

## 依赖更新检查清单

- [ ] 检查过时的依赖
- [ ] 查看更新日志（CHANGELOG）
- [ ] 检查破坏性更改（Breaking Changes）
- [ ] 更新依赖版本
- [ ] 运行安全审计
- [ ] 测试构建
- [ ] 测试主要功能
- [ ] 提交更改

## 主要依赖说明

### 核心依赖

- `@docusaurus/core`: Docusaurus核心框架
- `@docusaurus/preset-classic`: Docusaurus经典预设
- `react`: React库
- `react-dom`: React DOM库

### 功能依赖

- `@docusaurus/theme-mermaid`: Mermaid图表支持
- `@easyops-cn/docusaurus-search-local`: 本地搜索功能
- `mermaid`: Mermaid图表库
- `prism-react-renderer`: 代码高亮

### 开发依赖

- `@docusaurus/module-type-aliases`: TypeScript类型别名
- `@docusaurus/types`: Docusaurus类型定义

## 自动化依赖检查

项目已配置GitHub Actions工作流，每周自动检查依赖更新：

- 工作流文件: `.github/workflows/dependency-update.yml`
- 运行时间: 每周一
- 功能: 检查过时依赖和安全漏洞

## 常见问题

### Q: 更新依赖后构建失败怎么办？

A: 
1. 检查依赖的CHANGELOG，查看是否有破坏性更改
2. 清理node_modules和构建缓存
3. 检查Docusaurus版本兼容性
4. 查看GitHub Issues了解已知问题

### Q: 如何回滚依赖更新？

A:
```bash
# 查看git历史
git log package.json

# 回滚到特定版本
git checkout <commit-hash> -- package.json package-lock.json

# 重新安装
npm install
```

### Q: 应该使用npm还是yarn？

A: 项目统一使用npm。如果使用yarn，请删除package-lock.json文件。

## 依赖版本策略

- **主版本更新**: 需要仔细测试，可能有破坏性更改
- **次版本更新**: 通常安全，但建议测试
- **补丁版本更新**: 通常可以直接更新

## 相关资源

- [Docusaurus更新指南](https://docusaurus.io/docs/migration)
- [npm文档](https://docs.npmjs.com/)
- [Node.js版本](https://nodejs.org/)

