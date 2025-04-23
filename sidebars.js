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

  // 文档侧边栏
  docsSidebar: [
    {
      type: 'category',
      label: 'A2A协议',
      items: [
        'a2a/intro',
        'a2a/getting-started',
        'a2a/development',
        'a2a/github-projects',
      ],
    },
    {
      type: 'category',
      label: 'MCP协议',
      items: [
        'mcp/intro',
        {
          type: 'category',
          label: '服务器开发',
          items: [
            'mcp/server/python-implementation',
            'mcp/server/js-implementation',
            {
              type: 'category',
              label: '开发案例',
              items: [
                'mcp/server/examples/python-examples',
                'mcp/server/examples/js-examples',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: '客户端开发',
          items: [
            'mcp/client/javascript',
            'mcp/client/python',
          ],
        },
        {
          type: 'category',
          label: '实际应用案例',
          items: [
            'mcp/examples/index',
            'mcp/examples/knowledge-base-qa',
            'mcp/examples/wechat-bot',
          ],
        },
        'mcp/github-projects',
        'mcp/faq',
      ],
    },
    {
      type: 'category',
      label: 'Dify平台',
      items: [
        'dify/intro',
        'dify/getting-started',
        'dify/development',
        'dify/github-projects',
      ],
    },
    {
      type: 'category',
      label: 'MaxKB知识库',
      items: [
        'maxkb/intro',
        'maxkb/getting-started',
        'maxkb/development',
        'maxkb/github-projects',
      ],
    },
    {
      type: 'category',
      label: '多模态技术',
      items: [
        'multimodal/intro',
        'multimodal/getting-started',
        'multimodal/development',
      ],
    },
    {
      type: 'category',
      label: 'RAG技术',
      items: [
        'rag/intro',
        'rag/getting-started',
        'rag/development',
        'rag/github-projects',
      ],
    },
    {
      type: 'category',
      label: '微调技术',
      items: [
        'finetune/intro',
        'finetune/getting-started',
        'finetune/development',
        'finetune/github-projects',
      ],
    },
    {
      type: 'category',
      label: '大模型评测',
      items: [
        'evaluation/intro',
        'evaluation/getting-started',
        'evaluation/methods',
        'evaluation/metrics',
        'evaluation/development',
      ],
    },
    {
      type: 'category',
      label: '提示词工程',
      items: [
        'prompt/intro',
        'prompt/getting-started',
        'prompt/development',
        'prompt/github-projects',
      ],
    },
    {
      type: 'category',
      label: 'LangChain框架',
      items: [
        'langchain/intro',
        'langchain/getting-started',
        'langchain/development',
        'langchain/github-projects',
      ],
    },
  ],
};

export default sidebars;
