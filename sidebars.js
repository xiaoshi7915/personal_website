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
    'learning-paths',
    'changelog',
    {
      type: 'category',
      label: 'A2A协议',
      items: [
        'a2a/intro',
        'a2a/comprehensive-intro',
        'a2a/getting-started',
        'a2a/development',
        'a2a/github-projects',
        'a2a/best-practices',
        'a2a/faq',
      ],
    },
    {
      type: 'category',
      label: 'MCP协议',
      items: [
        'mcp/intro',
        'mcp/comprehensive-intro',
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
        'mcp/best-practices',
        'mcp/faq',
      ],
    },
    {
      type: 'category',
      label: 'n8n工作流',
      items: [
        'n8n/intro',
        'n8n/getting-started',
        'n8n/advanced-development',
        'n8n/github-projects',
        'n8n/workflow-cases',
        'n8n/best-practices',
        'n8n/faq',
      ],
    },
    {
      type: 'category',
      label: 'BISHENG平台',
      items: [
        'bisheng/intro',
        'bisheng/getting-started',
        'bisheng/advanced-development',
        'bisheng/github-projects',
        'bisheng/classic-cases',
        'bisheng/best-practices',
        'bisheng/faq',
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
        'dify/best-practices',
        'dify/faq',
        'dify/practical-cases',
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
        'maxkb/best-practices',
        'maxkb/faq',
      ],
    },
    {
      type: 'category',
      label: '多模态技术',
      items: [
        'multimodal/intro',
        'multimodal/getting-started',
        'multimodal/development',
        'multimodal/best-practices',
        'multimodal/faq',
      ],
    },
    {
      type: 'category',
      label: 'RAG技术',
      items: [
        'rag/intro',
        'rag/comprehensive-intro',
        'rag/getting-started',
        'rag/development',
        'rag/github-projects',
        'rag/best-practices',
        'rag/faq',
        'rag/practical-cases',
      ],
    },
    {
      type: 'category',
      label: '微调技术',
      items: [
        'finetune/intro',
        'finetune/comprehensive-intro',
        'finetune/getting-started',
        'finetune/development',
        'finetune/github-projects',
        'finetune/best-practices',
        'finetune/faq',
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
        'evaluation/best-practices',
        'evaluation/faq',
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
        'prompt/best-practices',
        'prompt/faq',
        'prompt/practical-cases',
      ],
    },
    {
      type: 'category',
      label:"向量数据库",
      items:[
        'vector-database/intro',
        'vector-database/comprehensive-intro',
        'vector-database/principles',
        'vector-database/architecture',
        'vector-database/applications',
        'vector-database/mainstream',
        'vector-database/best-practices',
        'vector-database/faq',
      ],
    },
    {
      type: 'category',
      label: 'LangChain框架',
      items: [
        'langchain/intro',
        'langchain/comprehensive-intro',
        'langchain/getting-started',
        'langchain/development',
        'langchain/github-projects',
        'langchain/best-practices',
        'langchain/faq',
      ],
    },
    {
      type: 'category',
      label: 'Transformer架构',
      items: [
        'transformer/intro',
        'transformer/comprehensive-intro',
        'transformer/architecture',
        'transformer/implementation',
        'transformer/variants',
        'transformer/applications',
        'transformer/best-practices',
        'transformer/faq',
      ],
    },
  ],
};

export default sidebars;
