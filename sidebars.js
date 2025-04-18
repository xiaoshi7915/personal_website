// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [{type: 'autogenerated', dirName: '.'}],

  // AI学习文档侧边栏
  mcpSidebar: [
    {
      type: 'category',
      label: 'MCP开发指南',
      items: [
        'mcp/intro',
        {
          type: 'category',
          label: 'MCP Server开发',
          items: [
            'mcp/server/getting-started',
            'mcp/server/python-implementation',
          ],
        },
        {
          type: 'category',
          label: 'MCP Client开发',
          items: [
            'mcp/client/getting-started',
          ],
        },
        'mcp/examples',
        'mcp/python-examples',
        'mcp/faq',
      ],
    },
    {
      type: 'category',
      label: 'Dify开发指南',
      items: [
        'dify/intro',
      ],
    },
    {
      type: 'category',
      label: 'MaxKB知识库',
      items: [
        'maxkb/intro',
      ],
    },
    {
      type: 'category',
      label: 'RAG技术指南',
      items: [
        'rag/intro',
      ],
    },
  ],
};

export default sidebars;
