import React, { useState } from 'react';
import clsx from 'clsx';
import styles from './ProtocolComparison.module.css';

/**
 * ProtocolComparison组件 - 协议对比分析
 * 支持A2A vs MCP等协议对比，提供表格和卡片两种展示模式
 * 
 * @param {string} protocol1 - 第一个协议名称（如 'A2A'）
 * @param {string} protocol2 - 第二个协议名称（如 'MCP'）
 * @param {object} comparisonData - 对比数据对象
 * @param {string} defaultMode - 默认展示模式（'table' | 'cards'）
 */
export default function ProtocolComparison({
  protocol1 = 'A2A',
  protocol2 = 'MCP',
  comparisonData,
  defaultMode = 'table',
}) {
  const [mode, setMode] = useState(defaultMode);

  // 默认对比数据（A2A vs MCP）
  const defaultData = {
    dimensions: [
      {
        name: '定位与目标',
        a2a: '代理互联网的HTTP，专注于智能体间协作',
        mcp: 'AI应用的USB-C接口，专注于AI与外部工具集成',
      },
      {
        name: '核心组件/原语',
        a2a: 'Agent Card、Task、Message、Artifact',
        mcp: 'Tools、Resources、Prompts',
      },
      {
        name: '通信协议',
        a2a: 'HTTP/gRPC + JSON-RPC 2.0',
        mcp: 'JSON-RPC 2.0',
      },
      {
        name: '传输方式',
        a2a: 'HTTP、gRPC',
        mcp: 'Stdio、HTTP',
      },
      {
        name: '适用场景',
        a2a: '多智能体协作、企业自动化、跨平台服务',
        mcp: 'AI工具集成、知识库访问、提示模板管理',
      },
      {
        name: '核心优势',
        a2a: '标准化智能体通信、支持长任务、多模态支持',
        mcp: '解耦意图与实现、动态发现、安全隔离',
      },
      {
        name: '主要局限',
        a2a: '性能瓶颈、复杂任务编排挑战、生态系统碎片化风险',
        mcp: '技术成熟度待提升、性能开销、学习曲线',
      },
      {
        name: '生态系统',
        a2a: '50+行业伙伴、Linux基金会托管、企业级应用',
        mcp: '5500+公开服务器、Anthropic主导、开源社区',
      },
    ],
    highlights: {
      a2a: {
        title: 'A2A协议',
        subtitle: '代理互联网的HTTP',
        description: '专注于智能体间标准化通信，支持复杂协作流程',
        strengths: [
          '多智能体协作标准化',
          '支持长周期任务管理',
          '多模态数据交换',
          '企业级安全机制',
        ],
        useCases: [
          '跨平台企业自动化',
          '多智能体系统',
          '智能体互联网',
        ],
      },
      mcp: {
        title: 'MCP协议',
        subtitle: 'AI应用的USB-C接口',
        description: '专注于AI与外部系统的解耦集成，简化工具调用',
        strengths: [
          '解耦意图与实现',
          '动态能力发现',
          '安全隔离执行',
          '标准化工具接口',
        ],
        useCases: [
          'AI工具集成',
          '知识库访问',
          '提示模板管理',
        ],
      },
    },
  };

  const data = comparisonData || defaultData;

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
            <line x1="8" y1="1" x2="8" y2="15" />
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
            <rect x="2" y="2" width="5" height="5" rx="1" />
            <rect x="9" y="2" width="5" height="5" rx="1" />
            <rect x="2" y="9" width="5" height="5" rx="1" />
            <rect x="9" y="9" width="5" height="5" rx="1" />
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
                <th className={styles.protocolColumn}>{protocol1}协议</th>
                <th className={styles.protocolColumn}>{protocol2}协议</th>
              </tr>
            </thead>
            <tbody>
              {data.dimensions.map((dimension, index) => (
                <tr key={index}>
                  <td className={styles.dimensionCell}>
                    <strong>{dimension.name}</strong>
                  </td>
                  <td className={styles.protocolCell}>
                    {dimension.a2a || dimension[protocol1.toLowerCase()]}
                  </td>
                  <td className={styles.protocolCell}>
                    {dimension.mcp || dimension[protocol2.toLowerCase()]}
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
          <div className={styles.protocolCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{data.highlights.a2a.title}</h3>
              <p className={styles.cardSubtitle}>{data.highlights.a2a.subtitle}</p>
            </div>
            <p className={styles.cardDescription}>{data.highlights.a2a.description}</p>
            
            <div className={styles.cardSection}>
              <h4 className={styles.sectionTitle}>核心优势</h4>
              <ul className={styles.strengthsList}>
                {data.highlights.a2a.strengths.map((strength, index) => (
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
                {data.highlights.a2a.useCases.map((useCase, index) => (
                  <li key={index} className={styles.useCaseItem}>
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.protocolCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{data.highlights.mcp.title}</h3>
              <p className={styles.cardSubtitle}>{data.highlights.mcp.subtitle}</p>
            </div>
            <p className={styles.cardDescription}>{data.highlights.mcp.description}</p>
            
            <div className={styles.cardSection}>
              <h4 className={styles.sectionTitle}>核心优势</h4>
              <ul className={styles.strengthsList}>
                {data.highlights.mcp.strengths.map((strength, index) => (
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
                {data.highlights.mcp.useCases.map((useCase, index) => (
                  <li key={index} className={styles.useCaseItem}>
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 补充说明 */}
      <div className={styles.footerNote}>
        <p>
          <strong>说明：</strong>
          A2A和MCP协议形成互补关系：MCP专注于AI与外部工具的集成，A2A专注于智能体间的协作。
          在实际应用中，两者可以结合使用，构建更完整的AI生态系统。
        </p>
      </div>
    </div>
  );
}

