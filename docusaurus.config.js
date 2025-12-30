// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'mr stone的个人网站',
  tagline: '技术 分享 成长',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'http://chenxiaoshivivid.com.cn',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'chenxiaoshivivid', // 您的GitHub用户名
  projectName: 'personal-website', // 您的仓库名

  onBrokenLinks: 'warn',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/chenxiaoshivivid/personal-website/tree/main/',
        },
        // Sitemap配置 - SEO优化
        sitemap: {
          changefreq: 'weekly', // 更新频率：weekly（每周）、daily（每天）、monthly（每月）
          priority: 0.5, // 优先级：0.0-1.0，首页建议1.0，文档页0.5-0.8
          ignorePatterns: ['/tags/**', '/search/**'], // 忽略的路径模式
          filename: 'sitemap.xml', // sitemap文件名
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  // 主题配置 - Mermaid支持
  themes: ['@docusaurus/theme-mermaid'],

  // 插件配置 - 本地搜索
  plugins: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        language: ["zh", "en"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
    // Google Analytics插件 - 需要配置trackingID
    // [
    //   '@docusaurus/plugin-google-analytics',
    //   {
    //     trackingID: 'G-XXXXXXXXXX', // 请替换为您的Google Analytics跟踪ID
    //     anonymizeIP: true,
    //   },
    // ],
    // 百度统计插件（可选，如果需要使用百度统计）
    // [
    //   '@docusaurus/plugin-google-gtag',
    //   {
    //     trackingID: 'G-XXXXXXXXXX', // Google Analytics 4
    //     anonymizeIP: true,
    //   },
    // ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      // SEO优化 - Metadata配置
      metadata: [
        {name: 'keywords', content: 'AI学习,人工智能,大语言模型,MCP协议,RAG技术,提示词工程,微调技术,向量数据库,行业解决方案'},
        {name: 'author', content: 'mr stone'},
        // Open Graph标签
        {property: 'og:type', content: 'website'},
        {property: 'og:image', content: 'img/docusaurus-social-card.jpg'},
        {property: 'og:locale', content: 'zh_CN'},
        {property: 'og:site_name', content: 'mr stone的个人网站'},
        // Twitter Cards
        {name: 'twitter:card', content: 'summary_large_image'},
        {name: 'twitter:image', content: 'img/docusaurus-social-card.jpg'},
        {name: 'twitter:title', content: 'mr stone的个人网站'},
        {name: 'twitter:description', content: '技术 分享 成长'},
      ],
      // 深色模式配置
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false, // 启用主题切换按钮
        respectPrefersColorScheme: true, // 尊重系统主题偏好
        // 注意：switchConfig已废弃，如需自定义图标，请使用swizzle功能
      },
      navbar: {
        title: 'mr stone的个人网站',
        logo: {
          alt: '个人网站Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'AI学习文档',
          },
          {
            type: 'docSidebar',
            sidebarId: 'solutionsSidebar',
            position: 'left',
            label: '行业解决方案',
          },
          {
            type: 'html',
            position: 'left',
            value: '<a href="http://121.36.205.70:12345/" target="_blank" rel="noopener noreferrer" class="navbar__item navbar__link">AI工具网站</a>',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: '文档',
            items: [
              {
                label: 'A2A协议',
                to: '/docs/a2a/intro',
              },
              {
                label: 'MCP协议',
                to: '/docs/mcp/intro',
              },
              {
                label: 'n8n工作流',
                to: '/docs/n8n/intro',
              },
              {
                label: 'BISHENG平台',
                to: '/docs/bisheng/intro',
              },
              {
                label: 'Dify应用',
                to: '/docs/dify/intro',
              },
              {
                label: 'MaxKB知识库',
                to: '/docs/maxkb/intro',
              },
              {
                label: 'RAG技术',
                to: '/docs/rag/intro',
              },
              {
                label: '大模型评测',
                to: '/docs/evaluation/intro',
              },
              {
                label: '提示词工程',
                to: '/docs/prompt/intro',
              },
              {
                label: '微调技术',
                to: '/docs/finetune/intro',
              },
            ],
          },
          {
            title: '社区',
            items: [
              {
                label: 'mcp 管理平台',
                href: 'http://121.36.205.70:3005',
              },
              {
                label: '大模型构建管理平台',
                href: 'http://121.36.205.70:5588/',
              },
              {
                label: '公文写作AI助手',
                href: 'http://121.36.205.70:8081/',
              },
              {
                label: '表转接口服务工具',
                href: 'http://121.36.205.70:3003/',
              },
            ],
          }
        ],
        copyright: `Copyright © ${new Date().getFullYear()} mr stone的个人网站`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'typescript', 'jsx', 'tsx', 'python'],
      },
      // 评论系统配置 (Giscus)
      // 注意：需要先在GitHub仓库中启用Discussions功能
      // 然后访问 https://giscus.app 获取repoId和categoryId
        giscus: {
          repo: 'xiaoshi7915/personal_website', // 注意：使用下划线，不是横线
          repoId: 'R_kgDOObiqiQ',
          category: 'Announcements',
          categoryId: 'DIC_kwDOObiqic4Cz-tZ',
          mapping: 'pathname',
          reactionsEnabled: true,
          emitMetadata: false, // 改为false，与用户提供的配置一致
          inputPosition: 'top', // 改为top，与用户提供的配置一致
          lang: 'zh-CN',
          theme: 'light',
          darkTheme: 'dark_dimmed',
          strict: false, // 添加strict配置
        },
    }),
};

export default config;
