import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'A2A协议',
    icon: 'img/a2a-logo.svg',
    description: '探索Agent-to-Agent协议如何实现AI代理之间的高效协作',
  },
  {
    title: 'MCP协议',
    icon: 'img/mcp/logo.svg',
    description: '了解Model Context Protocol的原理和实现，扩展AI模型的能力',
  },
  {
    title: 'n8n工作流',
    icon: 'img/哪吒11.jpg',
    description: '学习如何使用n8n构建强大的自动化工作流',
  },
  {
    title: 'Dify应用',
    icon: 'img/dify-logo.svg',
    description: '学习如何使用Dify平台构建强大的应用',
  },
  {
    title: 'MaxKB知识库',
    icon: 'img/maxkb-logo.svg',
    description: '探索MaxKB知识库系统的使用方法和最佳实践',
  },
  {
    title: '多模态技术',
    icon: 'img/multimodal-logo.svg',
    description: '探索结合文本、图像、音频的多模态AI技术及其应用场景',
  },
  {
    title: 'RAG技术',
    icon: 'img/rag-logo.svg',
    description: '深入了解检索增强生成技术的原理和应用',
  },
  {
    title: '大模型评测',
    icon: 'img/evaluation-logo.svg',
    description: '深入了解大模型评测的原理和应用',
  },
  {
    title: '提示词工程',
    icon: 'img/prompt-logo.svg',
    description: '深入了解提示词工程的原理和应用',
  },
  {
    title: '微调技术',
    icon: 'img/finetune-logo.svg',
    description: '掌握大型语言模型的微调方法，打造专属于你的AI模型',
  },
  {
    title: 'LangChain框架',
    icon: 'img/langchain-logo.svg',
    description: '探索LangChain框架的使用方法和最佳实践',
  },
];

function Feature({icon, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={icon} className={styles.featureIcon} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
