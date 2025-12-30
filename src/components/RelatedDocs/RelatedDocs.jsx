import React from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';

/**
 * 相关文档推荐组件
 * 根据当前文档路径推荐相关文档，包括前置知识和后续学习
 */
export default function RelatedDocs() {
  const location = useLocation();

  // 定义文档关联关系 - 包含前置知识和后续学习
  const docRelations = {
    '/docs/mcp/intro': {
      prerequisites: [
        { path: '/docs/prompt/intro', title: '提示词工程', reason: '了解提示词有助于理解MCP协议的应用场景' },
      ],
      related: [
        { path: '/docs/mcp/comprehensive-intro', title: 'MCP协议深度解析' },
        { path: '/docs/mcp/server/python-implementation', title: 'MCP服务器开发' },
        { path: '/docs/a2a/intro', title: 'A2A协议' },
      ],
      next: [
        { path: '/docs/mcp/getting-started', title: 'MCP快速开始', reason: '开始使用MCP协议' },
        { path: '/docs/mcp/server/python-implementation', title: 'MCP服务器开发', reason: '学习如何开发MCP服务器' },
      ],
    },
    '/docs/rag/intro': {
      prerequisites: [
        { path: '/docs/prompt/intro', title: '提示词工程', reason: 'RAG技术需要结合提示词工程' },
        { path: '/docs/vector-database/intro', title: '向量数据库', reason: 'RAG技术依赖向量数据库存储和检索' },
      ],
      related: [
        { path: '/docs/rag/comprehensive-intro', title: 'RAG技术深度解析' },
        { path: '/docs/langchain/intro', title: 'LangChain框架', reason: 'LangChain提供了RAG实现工具' },
        { path: '/docs/dify/intro', title: 'Dify平台', reason: 'Dify平台内置RAG功能' },
      ],
      next: [
        { path: '/docs/rag/getting-started', title: 'RAG快速开始', reason: '开始构建RAG应用' },
        { path: '/docs/rag/development', title: 'RAG开发指南', reason: '深入学习RAG开发' },
      ],
    },
    '/docs/prompt/intro': {
      prerequisites: [],
      related: [
        { path: '/docs/prompt/getting-started', title: '提示词工程入门' },
        { path: '/docs/rag/intro', title: 'RAG技术', reason: 'RAG技术需要提示词工程' },
        { path: '/docs/finetune/intro', title: '微调技术', reason: '提示词工程和微调是互补技术' },
      ],
      next: [
        { path: '/docs/prompt/development', title: '提示词开发指南', reason: '深入学习提示词工程' },
        { path: '/docs/prompt/practical-cases', title: '提示词实战案例', reason: '通过案例学习提示词应用' },
      ],
    },
    '/docs/finetune/intro': {
      prerequisites: [
        { path: '/docs/transformer/intro', title: 'Transformer架构', reason: '理解Transformer有助于理解微调原理' },
        { path: '/docs/prompt/intro', title: '提示词工程', reason: '提示词工程是微调的替代方案' },
      ],
      related: [
        { path: '/docs/finetune/comprehensive-intro', title: '微调技术深度解析' },
        { path: '/docs/evaluation/intro', title: '大模型评测', reason: '微调后需要评测模型效果' },
        { path: '/docs/transformer/intro', title: 'Transformer架构', reason: '理解底层架构有助于微调' },
      ],
      next: [
        { path: '/docs/finetune/getting-started', title: '微调快速开始', reason: '开始进行模型微调' },
        { path: '/docs/finetune/development', title: '微调开发指南', reason: '深入学习微调技术' },
      ],
    },
    '/docs/dify/intro': {
      prerequisites: [
        { path: '/docs/prompt/intro', title: '提示词工程', reason: 'Dify平台需要提示词工程知识' },
      ],
      related: [
        { path: '/docs/dify/getting-started', title: 'Dify快速开始' },
        { path: '/docs/maxkb/intro', title: 'MaxKB知识库', reason: 'MaxKB是另一个知识库平台' },
        { path: '/docs/bisheng/intro', title: 'BISHENG平台', reason: 'BISHENG是企业级AI平台' },
      ],
      next: [
        { path: '/docs/dify/getting-started', title: 'Dify快速开始', reason: '开始使用Dify平台' },
        { path: '/docs/dify/development', title: 'Dify开发指南', reason: '学习Dify开发' },
      ],
    },
    '/docs/n8n/intro': {
      prerequisites: [],
      related: [
        { path: '/docs/n8n/getting-started', title: 'n8n快速开始' },
        { path: '/docs/n8n/workflow-cases', title: '工作流案例' },
        { path: '/docs/mcp/intro', title: 'MCP协议', reason: 'n8n可以集成MCP协议' },
      ],
      next: [
        { path: '/docs/n8n/getting-started', title: 'n8n快速开始', reason: '开始使用n8n' },
        { path: '/docs/n8n/workflow-cases', title: '工作流案例', reason: '学习实际工作流案例' },
      ],
    },
    '/docs/vector-database/intro': {
      prerequisites: [],
      related: [
        { path: '/docs/vector-database/comprehensive-intro', title: '向量数据库深度解析' },
        { path: '/docs/rag/intro', title: 'RAG技术', reason: 'RAG技术依赖向量数据库' },
        { path: '/docs/langchain/intro', title: 'LangChain框架', reason: 'LangChain支持多种向量数据库' },
      ],
      next: [
        { path: '/docs/vector-database/principles', title: '向量数据库原理', reason: '理解向量数据库原理' },
        { path: '/docs/rag/intro', title: 'RAG技术', reason: '学习RAG技术应用' },
      ],
    },
    '/docs/langchain/intro': {
      prerequisites: [
        { path: '/docs/prompt/intro', title: '提示词工程', reason: 'LangChain需要提示词工程知识' },
      ],
      related: [
        { path: '/docs/langchain/comprehensive-intro', title: 'LangChain深度解析' },
        { path: '/docs/rag/intro', title: 'RAG技术', reason: 'LangChain常用于构建RAG应用' },
        { path: '/docs/mcp/intro', title: 'MCP协议', reason: 'LangChain和MCP都是AI应用框架' },
      ],
      next: [
        { path: '/docs/langchain/getting-started', title: 'LangChain快速开始', reason: '开始使用LangChain' },
        { path: '/docs/langchain/development', title: 'LangChain开发指南', reason: '深入学习LangChain开发' },
      ],
    },
    '/docs/transformer/intro': {
      prerequisites: [],
      related: [
        { path: '/docs/transformer/comprehensive-intro', title: 'Transformer深度解析' },
        { path: '/docs/transformer/architecture', title: 'Transformer架构详解' },
        { path: '/docs/finetune/intro', title: '微调技术', reason: '微调基于Transformer架构' },
      ],
      next: [
        { path: '/docs/transformer/architecture', title: 'Transformer架构详解', reason: '深入学习架构原理' },
        { path: '/docs/finetune/intro', title: '微调技术', reason: '学习如何微调Transformer模型' },
      ],
    },
    '/docs/a2a/intro': {
      prerequisites: [
        { path: '/docs/mcp/intro', title: 'MCP协议', reason: 'A2A协议与MCP协议相关' },
      ],
      related: [
        { path: '/docs/a2a/comprehensive-intro', title: 'A2A协议深度解析' },
        { path: '/docs/mcp/intro', title: 'MCP协议', reason: 'A2A和MCP都是AI协议' },
      ],
      next: [
        { path: '/docs/a2a/getting-started', title: 'A2A快速开始', reason: '开始使用A2A协议' },
        { path: '/docs/a2a/development', title: 'A2A开发指南', reason: '学习A2A开发' },
      ],
    },
    '/docs/transformer/intro': {
      prerequisites: [],
      related: [
        { path: '/docs/transformer/comprehensive-intro', title: 'Transformer深度解析' },
        { path: '/docs/transformer/architecture', title: 'Transformer架构详解' },
        { path: '/docs/finetune/intro', title: '微调技术', reason: '微调基于Transformer架构' },
      ],
      next: [
        { path: '/docs/transformer/architecture', title: 'Transformer架构详解', reason: '深入学习架构原理' },
        { path: '/docs/finetune/intro', title: '微调技术', reason: '学习如何微调Transformer模型' },
        { path: '/docs/transformer/practical-cases', title: 'Transformer实战案例', reason: '通过案例学习应用' },
      ],
    },
    '/docs/vector-database/intro': {
      prerequisites: [],
      related: [
        { path: '/docs/vector-database/comprehensive-intro', title: '向量数据库深度解析' },
        { path: '/docs/rag/intro', title: 'RAG技术', reason: 'RAG技术依赖向量数据库' },
        { path: '/docs/langchain/intro', title: 'LangChain框架', reason: 'LangChain支持多种向量数据库' },
      ],
      next: [
        { path: '/docs/vector-database/principles', title: '向量数据库原理', reason: '理解向量数据库原理' },
        { path: '/docs/rag/intro', title: 'RAG技术', reason: '学习RAG技术应用' },
        { path: '/docs/vector-database/practical-cases', title: '向量数据库实战案例', reason: '通过案例学习应用' },
      ],
    },
    '/docs/multimodal/intro': {
      prerequisites: [
        { path: '/docs/transformer/intro', title: 'Transformer架构', reason: '多模态技术基于Transformer' },
        { path: '/docs/prompt/intro', title: '提示词工程', reason: '多模态需要提示词工程' },
      ],
      related: [
        { path: '/docs/multimodal/comprehensive-intro', title: '多模态技术深度解析' },
        { path: '/docs/rag/intro', title: 'RAG技术', reason: 'RAG可以结合多模态' },
      ],
      next: [
        { path: '/docs/multimodal/getting-started', title: '多模态快速开始', reason: '开始使用多模态技术' },
        { path: '/docs/multimodal/development', title: '多模态开发指南', reason: '深入学习多模态开发' },
      ],
    },
    '/docs/evaluation/intro': {
      prerequisites: [
        { path: '/docs/finetune/intro', title: '微调技术', reason: '评测用于评估微调效果' },
        { path: '/docs/transformer/intro', title: 'Transformer架构', reason: '理解模型架构有助于评测' },
      ],
      related: [
        { path: '/docs/evaluation/methods', title: '评测方法' },
        { path: '/docs/evaluation/metrics', title: '评测指标' },
        { path: '/docs/finetune/intro', title: '微调技术', reason: '微调后需要评测' },
      ],
      next: [
        { path: '/docs/evaluation/getting-started', title: '评测快速开始', reason: '开始进行模型评测' },
        { path: '/docs/evaluation/development', title: '评测开发指南', reason: '深入学习评测技术' },
      ],
    },
    '/docs/bisheng/intro': {
      prerequisites: [
        { path: '/docs/prompt/intro', title: '提示词工程', reason: 'BISHENG需要提示词知识' },
        { path: '/docs/rag/intro', title: 'RAG技术', reason: 'BISHENG支持RAG功能' },
      ],
      related: [
        { path: '/docs/bisheng/getting-started', title: 'BISHENG快速开始' },
        { path: '/docs/dify/intro', title: 'Dify平台', reason: 'Dify是另一个AI平台' },
        { path: '/docs/maxkb/intro', title: 'MaxKB知识库', reason: 'MaxKB是知识库平台' },
      ],
      next: [
        { path: '/docs/bisheng/getting-started', title: 'BISHENG快速开始', reason: '开始使用BISHENG' },
        { path: '/docs/bisheng/advanced-development', title: 'BISHENG高级开发', reason: '学习BISHENG开发' },
      ],
    },
    '/docs/maxkb/intro': {
      prerequisites: [
        { path: '/docs/rag/intro', title: 'RAG技术', reason: 'MaxKB基于RAG技术' },
        { path: '/docs/vector-database/intro', title: '向量数据库', reason: 'MaxKB使用向量数据库' },
      ],
      related: [
        { path: '/docs/maxkb/getting-started', title: 'MaxKB快速开始' },
        { path: '/docs/dify/intro', title: 'Dify平台', reason: 'Dify也提供知识库功能' },
        { path: '/docs/bisheng/intro', title: 'BISHENG平台', reason: 'BISHENG是另一个平台' },
      ],
      next: [
        { path: '/docs/maxkb/getting-started', title: 'MaxKB快速开始', reason: '开始使用MaxKB' },
        { path: '/docs/maxkb/development', title: 'MaxKB开发指南', reason: '学习MaxKB开发' },
      ],
    },
  };

  // 获取当前文档的关联信息
  const docInfo = docRelations[location.pathname];

  // 如果没有找到，尝试根据路径前缀匹配
  if (!docInfo) {
    const pathPrefix = location.pathname.split('/').slice(0, 3).join('/');
    const matched = Object.entries(docRelations).find(([path]) => 
      path.startsWith(pathPrefix)
    );
    if (matched) {
      return (
        <div className="related-docs">
          <h3 className="related-docs__title">相关文档</h3>
          <ul className="related-docs__list">
            {matched[1].related?.slice(0, 3).map((doc, index) => (
              <li key={index} className="related-docs__item">
                <Link to={doc.path} className="related-docs__link">
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  }

  const { prerequisites, related, next } = docInfo;

  return (
    <div className="related-docs">
      {/* 前置知识 */}
      {prerequisites && prerequisites.length > 0 && (
        <div className="related-docs__section">
          <h4 className="related-docs__section-title">
            <span className="related-docs__icon">📚</span>
            前置知识
          </h4>
          <p className="related-docs__section-desc">建议先学习以下内容：</p>
          <ul className="related-docs__list">
            {prerequisites.map((doc, index) => (
              <li key={index} className="related-docs__item">
                <Link to={doc.path} className="related-docs__link">
                  {doc.title}
                </Link>
                {doc.reason && (
                  <span className="related-docs__reason"> - {doc.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 相关文档 */}
      {related && related.length > 0 && (
        <div className="related-docs__section">
          <h4 className="related-docs__section-title">
            <span className="related-docs__icon">🔗</span>
            相关文档
          </h4>
          <ul className="related-docs__list">
            {related.map((doc, index) => (
              <li key={index} className="related-docs__item">
                <Link to={doc.path} className="related-docs__link">
                  {doc.title}
                </Link>
                {doc.reason && (
                  <span className="related-docs__reason"> - {doc.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 后续学习 */}
      {next && next.length > 0 && (
        <div className="related-docs__section">
          <h4 className="related-docs__section-title">
            <span className="related-docs__icon">➡️</span>
            后续学习
          </h4>
          <p className="related-docs__section-desc">继续学习以下内容：</p>
          <ul className="related-docs__list">
            {next.map((doc, index) => (
              <li key={index} className="related-docs__item">
                <Link to={doc.path} className="related-docs__link">
                  {doc.title}
                </Link>
                {doc.reason && (
                  <span className="related-docs__reason"> - {doc.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
