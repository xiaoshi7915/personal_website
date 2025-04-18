import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

// 特色内容卡片组件
function FeatureCard({title, description, to, icon, imageSrc}) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureCardHeader}>
        {imageSrc ? (
          <div className={styles.featureCardIcon}>
            <img src={imageSrc} alt={title} className={styles.featureCardImage} />
          </div>
        ) : (
          <div className={styles.featureCardIcon}>{icon}</div>
        )}
        <h3>{title}</h3>
      </div>
      <p>{description}</p>
      <Link className="button button--primary button--lg" to={to}>
        了解更多
      </Link>
    </div>
  );
}

// 首页头部组件
function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/mcp/intro">
            开始学习
          </Link>
        </div>
      </div>
    </header>
  );
}

// 特色内容区域组件
function FeatureSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className={styles.featureSectionTitle}>探索内容</h2>
        <div className={styles.featureGrid}>
          <FeatureCard
            title="A2A协议"
            description="探索Agent-to-Agent协议如何实现AI代理之间的高效协作"
            to="/docs/a2a/intro"
            imageSrc="/img/nezha1.jpg"
          />
          <FeatureCard
            title="MCP协议"
            description="了解Model Completion Protocol的原理和实现，扩展AI模型的能力"
            to="/docs/mcp/intro"
            imageSrc="/img/nezha2.jpg"
          />
          <FeatureCard
            title="Dify应用平台"
            description="学习如何使用Dify平台构建强大的AI应用"
            to="/docs/dify/intro"
            imageSrc="/img/nezha3.jpg"
          />
          <FeatureCard
            title="MaxKB知识库"
            description="探索MaxKB知识库系统的使用方法和最佳实践"
            to="/docs/maxkb/intro"
            imageSrc="/img/nezha4.jpg"
          />
          <FeatureCard
            title="RAG技术"
            description="深入了解检索增强生成技术的原理和应用"
            to="/docs/rag/intro"
            imageSrc="/img/nezha5.jpg"
          />
          <FeatureCard
            title="大模型评测"
            description="深入了解大模型评测的原理和应用"
            to="/docs/evaluation/intro"
            imageSrc="/img/nezha6.jpg"
          />
          <FeatureCard
            title="提示词工程"
            description="深入了解提示词工程的原理和应用"
            to="/docs/prompt/intro"
            imageSrc="/img/nezha7.jpg"
          />
          <FeatureCard
            title="微调技术"
            description="掌握大型语言模型的微调方法，打造专属于你的AI模型"
            to="/docs/finetune/intro"
            imageSrc="/img/nezha8.jpg"
          />
        </div>
      </div>
    </section>
  );
}

// 技术栈展示组件
function TechStack() {
  return (
    <section className={styles.techStack}>
      <div className="container">
        <h2>我们使用的技术</h2>
        <div className={styles.techList}>
          <span>Python</span>
          <span>React</span>
          <span>Node.js</span>
          <span>Docker</span>
          <span>Flask</span>
          <span>大语言模型</span>
          <span>向量数据库</span>
          <span>REST API</span>
        </div>
      </div>
    </section>
  );
}

// 页脚CTA组件
function FooterCTA() {
  return (
    <section className={styles.footerCTA}>
      <div className="container">
        <h2>准备好开始了吗？</h2>
        <p>探索我们的文档，开始你的AI开发之旅</p>
        <div className={styles.ctaButtons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/mcp/intro">
            开始学习
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="http://chenxiaoshivivid.com.cn:3005"
            target="_blank"
            rel="noopener noreferrer">
            访问管理平台
          </Link>
        </div>
      </div>
    </section>
  );
}

// 主页组件
export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="mr stone的技术分享网站 - 提供AI学习文档、技术博客和技术分享">
      <HomepageHeader />
      <main>
        <FeatureSection />
        <TechStack />
        <FooterCTA />
      </main>
    </Layout>
  );
}
