/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

module.exports = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    {
      type: 'category',
      label: '入门指南',
      items: ['intro', 'getting-started'],
    },
    {
      type: 'category',
      label: '基础教程',
      items: [
        'tutorial-basics/create-a-page',
        'tutorial-basics/create-a-document',
        'tutorial-basics/create-a-blog-post',
        'tutorial-basics/markdown-features',
        'tutorial-basics/custom-components',
      ],
    },
    {
      type: 'category',
      label: '高级教程',
      items: [
        'tutorial-extras/manage-docs-versions',
        'tutorial-extras/translate-your-site',
      ],
    },
    {
      type: 'category',
      label: 'MCP协议指南',
      items: [
        'mcp/intro',
        'mcp/protocol',
        'mcp/python-examples',
        'mcp/github-projects',
        {
          type: 'category',
          label: '服务端开发',
          items: [
            'mcp/server/getting-started',
            'mcp/server/python-implementation',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'A2A协议指南',
      items: [
        'a2a/protocol-spec',
        'a2a/github-projects',
      ],
    },
    {
      type: 'category',
      label: 'Dify开发指南',
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
        'multimodal/github-projects',
      ],
    },
    {
      type: 'category',
      label: 'RAG技术指南',
      items: [
        'rag/intro',
        'rag/getting-started',
        'rag/development',
        'rag/evaluation',
        'rag/vector-databases',
        'rag/github-projects',
      ],
    },
    {
      type: 'category',
      label: '大模型评测指南',
      items: [
        'evaluation/intro',
        'evaluation/getting-started',
        'evaluation/methods',
        'evaluation/metrics',
      ],
    },
    {
      type: 'category',
      label: '提示词工程指南',
      items: [
        'prompt/intro',
        'prompt/getting-started',
        'prompt/development',
        'prompt/github-projects',
      ],
    },
    {
      type: 'category',
      label: '模型微调指南',
      items: [
        'finetune/intro',
        'finetune/getting-started',
        'finetune/github-projects',
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