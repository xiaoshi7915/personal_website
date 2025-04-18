# Mr Stone的个人技术网站

这是一个基于 [Docusaurus](https://docusaurus.io/) 构建的个人技术分享网站，集成了AI学习文档、技术博客和各种技术文档。

## 📚 网站内容

本网站主要包括以下内容：

- **AI学习文档**：
  - MCP开发指南 - 详细介绍Model Completion Protocol的实现和应用
  - Dify开发指南 - 介绍Dify平台的使用和开发
  - MaxKB知识库 - 提供知识库相关资料
  - RAG技术指南 - 检索增强生成技术的详细介绍

- **技术博客**：分享技术经验和心得

## 🗂️ 项目结构

```
/opt/docusaurus/chenxiaoshivivid/
├── blog/                     # 博客文章目录
├── build/                    # 构建输出目录
├── docs/                     # 文档目录
│   ├── mcp/                  # MCP开发指南
│   ├── dify/                 # Dify开发指南
│   ├── maxkb/                # MaxKB知识库
│   ├── rag/                  # RAG技术指南
│   └── intro.md              # 文档介绍页
├── src/                      # 源代码目录
│   ├── components/           # React组件
│   ├── css/                  # 样式文件
│   └── pages/                # 自定义页面
│       └── index.js          # 首页
├── static/                   # 静态资源目录
├── docusaurus.config.js      # Docusaurus配置文件
├── package.json              # 项目依赖配置
├── sidebars.js               # 侧边栏配置
└── docker-compose.yml        # Docker部署配置
```

## 💻 本地开发

### 使用Node.js开发

确保安装了Node.js 18.0或更高版本：

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run start
```

开发服务器将在 http://localhost:3000 运行，修改文件后会自动刷新。

### 使用Docker开发

如果您更喜欢使用Docker进行开发：

```bash
# 构建并启动服务
docker-compose up -d
```

网站将在 http://localhost:3000 可访问。

## 🏗️ 构建网站

### 使用Node.js构建

```bash
npm run build
```

构建文件将生成在 `build/` 目录中。

### 使用Docker构建

```bash
docker-compose -f docker-compose.production.yml up -d
```

## 📄 内容管理

### 文档管理

所有文档都存放在 `docs/` 目录下，按照不同的主题分类：

1. 添加新文档：
   - 在相应的主题目录下创建 .md 或 .mdx 文件
   - 在文件头部添加元数据，例如：
     ```md
     ---
     sidebar_position: 1
     title: 文档标题
     ---
     ```

2. 组织文档：
   - 修改 `sidebars.js` 文件来调整文档的组织结构和显示顺序

### 博客管理

博客文章存放在 `blog/` 目录下：

1. 创建新博客文章：
   - 使用格式 `YYYY-MM-DD-标题.md` 命名文件
   - 添加元数据：
     ```md
     ---
     slug: 自定义-url
     title: 博客标题
     authors: [作者ID]
     tags: [标签1, 标签2]
     ---
     ```

2. 作者和标签配置：
   - 在 `blog/authors.yml` 中配置作者信息
   - 在 `blog/tags.yml` 中配置标签信息

## 🎨 自定义外观

### 主题配置

在 `docusaurus.config.js` 文件中配置网站的主题和外观：

- 修改网站标题、标语和logo
- 配置导航栏和页脚链接
- 调整主题颜色和其他视觉设置

### 样式自定义

- 在 `src/css/custom.css` 中修改全局CSS变量
- 可以添加自定义CSS来调整网站样式

## 📱 响应式设计

网站已适配移动端和桌面端浏览，无需额外配置。

## 🚀 部署网站

### 服务器部署

1. 将构建好的 `build/` 目录上传到服务器
2. 配置Web服务器（Nginx、Apache等）指向该目录

### 使用Docker部署

```bash
# 在服务器上
docker-compose -f docker-compose.production.yml up -d
```

### 其他部署方式

Docusaurus支持多种部署方式，包括GitHub Pages、Netlify、Vercel等，详见[Docusaurus部署文档](https://docusaurus.io/docs/deployment)。

## 🔄 更新网站

### 内容更新

1. 修改或添加相应的文档或博客文件
2. 重新构建网站
3. 部署更新后的构建文件

### 依赖更新

```bash
npm update
```

## 🌟 未来计划

- 添加更多AI相关技术文档
- 优化网站性能和用户体验
- 添加多语言支持

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 网站：[chenxiaoshivivid.com.cn](http://chenxiaoshivivid.com.cn)
- 管理平台：[chenxiaoshivivid.com.cn:3005](http://chenxiaoshivivid.com.cn:3005)

---

© 2023 mr stone的个人网站。保留所有权利。
