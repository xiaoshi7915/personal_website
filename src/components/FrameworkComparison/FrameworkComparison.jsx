import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './FrameworkComparison.module.css';

/**
 * FrameworkComparison组件 - 框架对比分析
 * 支持LangChain vs LlamaIndex vs Haystack等框架对比，提供表格和卡片两种展示模式
 * 
 * @param {array} frameworks - 框架名称数组（如 ['LangChain', 'LlamaIndex', 'Haystack']）
 * @param {object} comparisonData - 对比数据对象
 * @param {string} defaultMode - 默认展示模式（'table' | 'cards'）
 */
export default function FrameworkComparison({
  frameworks = ['LangChain', 'LlamaIndex', 'Haystack'],
  comparisonData,
  defaultMode = 'table',
}) {
  const [mode, setMode] = useState(defaultMode);

  // 默认对比数据（LangChain vs LlamaIndex vs Haystack）
  const defaultData = {
    dimensions: [
      {
        name: '定位与目标',
        langchain: '全面的组件库，专注于组合性，适合复杂LLM应用',
        llamaindex: '专注于数据索引和检索，适合简化的RAG应用',
        haystack: '模块化NLP管道，搜索功能强大，适合生产级搜索应用',
      },
      {
        name: '核心特性',
        langchain: '链、代理、记忆、工具、检索增强生成',
        llamaindex: '数据连接器、索引、查询引擎、检索器',
        haystack: '文档存储、检索器、阅读器、管道编排',
      },
      {
        name: '适用场景',
        langchain: '复杂LLM应用、RAG系统、代理、多步骤任务',
        llamaindex: '简化的RAG应用、数据连接、知识库查询',
        haystack: '生产级搜索应用、问答系统、文档检索',
      },
      {
        name: '优势',
        langchain: '全面的组件库、强大的组合性、丰富的生态集成',
        llamaindex: '简化的API、专注检索、易于上手',
        haystack: '生产级稳定性、强大的搜索能力、模块化设计',
      },
      {
        name: '局限',
        langchain: '学习曲线陡峭、配置复杂、性能开销',
        llamaindex: '功能相对单一、扩展性有限',
        haystack: '主要面向搜索场景、LLM集成相对较少',
      },
      {
        name: '生态系统',
        langchain: 'LangChain、LangServe、LangSmith、LangGraph',
        llamaindex: 'LlamaIndex核心、LlamaCloud、LlamaHub',
        haystack: 'Haystack核心、Haystack云、社区扩展',
      },
      {
        name: '学习曲线',
        langchain: '较陡峭，需要理解多个概念',
        llamaindex: '较平缓，API简洁直观',
        haystack: '中等，需要理解管道概念',
      },
      {
        name: '性能表现',
        langchain: '灵活但可能较慢，取决于配置',
        llamaindex: '优化的检索性能，快速查询',
        haystack: '生产级性能，高度优化',
      },
    ],
    highlights: {
      langchain: {
        title: 'LangChain',
        subtitle: '全面的LLM应用框架',
        description: '提供全面的组件库和强大的组合能力，适合构建复杂的LLM应用',
        strengths: [
          '全面的组件库',
          '强大的组合性',
          '丰富的生态集成',
          '支持复杂工作流',
        ],
        useCases: [
          '复杂LLM应用',
          'RAG系统',
          '代理系统',
          '多步骤任务处理',
        ],
      },
      llamaindex: {
        title: 'LlamaIndex',
        subtitle: '数据索引和检索专家',
        description: '专注于数据索引和检索，提供简化的API，适合快速构建RAG应用',
        strengths: [
          '简化的API',
          '专注检索优化',
          '易于上手',
          '快速开发',
        ],
        useCases: [
          '简化的RAG应用',
          '数据连接',
          '知识库查询',
          '快速原型',
        ],
      },
      haystack: {
        title: 'Haystack',
        subtitle: '生产级搜索框架',
        description: '模块化NLP管道，搜索功能强大，适合构建生产级的搜索和问答应用',
        strengths: [
          '生产级稳定性',
          '强大的搜索能力',
          '模块化设计',
          '高度优化',
        ],
        useCases: [
          '生产级搜索应用',
          '问答系统',
          '文档检索',
          '企业级应用',
        ],
      },
    },
  };

  const data = comparisonData || defaultData;
  const [framework1, framework2, framework3] = frameworks;

  // 获取框架数据的辅助函数
  const getFrameworkValue = (dimension, frameworkName) => {
    const key = frameworkName.toLowerCase();
    return dimension[key] || dimension[frameworkName] || '';
  };

  return (
    <div className={styles.comparisonContainer}>
      {/* 模式切换按钮 */}
      <div className={styles.modeSwitcher}>
        <button
          className={clsx(styles.modeButton, mode === 'table' && styles.active)}
          onClick={() => setMode('table')}
          aria-label="表格模式"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="1" y="1" width="14" height="14" rx="2" />
            <line x1="1" y1="5" x2="15" y2="5" />
            <line x1="5.5" y1="1" x2="5.5" y2="15" />
            <line x1="10.5" y1="1" x2="10.5" y2="15" />
          </svg>
          表格对比
        </button>
        <button
          className={clsx(styles.modeButton, mode === 'cards' && styles.active)}
          onClick={() => setMode('cards')}
          aria-label="卡片模式"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="2" width="3" height="3" rx="1" />
            <rect x="7" y="2" width="3" height="3" rx="1" />
            <rect x="12" y="2" width="3" height="3" rx="1" />
            <rect x="2" y="7" width="3" height="3" rx="1" />
            <rect x="7" y="7" width="3" height="3" rx="1" />
            <rect x="12" y="7" width="3" height="3" rx="1" />
          </svg>
          卡片对比
        </button>
      </div>

      {/* 表格模式 */}
      {mode === 'table' && (
        <div className={styles.tableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th className={styles.dimensionColumn}>对比维度</th>
                <th className={styles.frameworkColumn}>{framework1}</th>
                <th className={styles.frameworkColumn}>{framework2}</th>
                <th className={styles.frameworkColumn}>{framework3}</th>
              </tr>
            </thead>
            <tbody>
              {data.dimensions.map((dimension, index) => (
                <tr key={index}>
                  <td className={styles.dimensionCell}>
                    <strong>{dimension.name}</strong>
                  </td>
                  <td className={styles.frameworkCell}>
                    {getFrameworkValue(dimension, framework1)}
                  </td>
                  <td className={styles.frameworkCell}>
                    {getFrameworkValue(dimension, framework2)}
                  </td>
                  <td className={styles.frameworkCell}>
                    {getFrameworkValue(dimension, framework3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 卡片模式 */}
      {mode === 'cards' && (
        <div className={styles.cardsWrapper}>
          {frameworks.map((frameworkName) => {
            const frameworkKey = frameworkName.toLowerCase();
            const highlight = data.highlights[frameworkKey];
            
            if (!highlight) return null;

            return (
              <div key={frameworkKey} className={styles.frameworkCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{highlight.title}</h3>
                  <p className={styles.cardSubtitle}>{highlight.subtitle}</p>
                </div>
                <p className={styles.cardDescription}>{highlight.description}</p>
                
                <div className={styles.cardSection}>
                  <h4 className={styles.sectionTitle}>核心优势</h4>
                  <ul className={styles.strengthsList}>
                    {highlight.strengths.map((strength, index) => (
                      <li key={index} className={styles.strengthItem}>
                        <svg
                          className={styles.checkIcon}
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 8l3 3 7-7" />
                        </svg>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.cardSection}>
                  <h4 className={styles.sectionTitle}>适用场景</h4>
                  <ul className={styles.useCasesList}>
                    {highlight.useCases.map((useCase, index) => (
                      <li key={index} className={styles.useCaseItem}>
                        {useCase}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 补充说明 */}
      <div className={styles.footerNote}>
        <p>
          <strong>说明：</strong>
          三个框架各有优势，选择时应根据具体需求：LangChain适合复杂LLM应用，LlamaIndex适合简化的RAG应用，
          Haystack适合生产级搜索应用。在实际项目中，也可以结合使用多个框架的优势。
        </p>
      </div>
    </div>
  );
}

