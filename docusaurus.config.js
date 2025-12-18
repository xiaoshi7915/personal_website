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
  onBrokenMarkdownLinks: 'warn',

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
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
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
                href: 'http://115.190.152.96:8081/',
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
    }),
};

export default config;
