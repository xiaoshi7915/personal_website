import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';

/**
 * 结构化数据组件 - 为页面添加JSON-LD结构化数据
 * 支持Article、Organization、HowTo等Schema.org类型
 */
function StructuredDataInner() {
  const {siteConfig} = useDocusaurusContext();
  const location = useLocation();
  const baseUrl = useBaseUrl('/');

  // 判断是否为文档页面
  const isDocPage = location.pathname.startsWith('/docs/');
  const isSolutionPage = location.pathname.startsWith('/docs/solutions/');

  // 获取当前页面的标题和描述（仅在客户端）
  const getPageMetadata = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // 服务端渲染时使用默认值
      return {
        title: siteConfig.title,
        description: siteConfig.tagline,
        url: siteConfig.url + location.pathname,
      };
    }
    
    // 从页面标题和描述中提取信息
    const title = document.title || siteConfig.title;
    const description = document.querySelector('meta[name="description"]')?.content || siteConfig.tagline;
    const url = siteConfig.url + location.pathname;
    
    return {title, description, url};
  };

  // 生成Organization结构化数据
  const getOrganizationSchema = () => {
    const logoUrl = siteConfig.themeConfig?.navbar?.logo?.src 
      ? siteConfig.url + useBaseUrl(siteConfig.themeConfig.navbar.logo.src)
      : siteConfig.url + '/img/logo.svg';
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteConfig.title,
      url: siteConfig.url,
      logo: logoUrl,
      description: siteConfig.tagline,
      sameAs: [
        // 可以添加社交媒体链接
      ],
    };
  };

  // 生成Article结构化数据（用于技术文档）
  const getArticleSchema = () => {
    const {title, description, url} = getPageMetadata();
    const baseUrl = useBaseUrl('/');
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      url: url,
      author: {
        '@type': 'Person',
        name: 'mr stone',
      },
      publisher: {
        '@type': 'Organization',
        name: siteConfig.title,
        logo: {
          '@type': 'ImageObject',
          url: siteConfig.url + useBaseUrl(siteConfig.themeConfig.navbar.logo.src),
        },
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
    };
  };

  // 生成WebSite结构化数据
  const getWebSiteSchema = () => {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.title,
      url: siteConfig.url,
      description: siteConfig.tagline,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
  };

  // 生成BreadcrumbList结构化数据
  const getBreadcrumbSchema = () => {
    if (!isDocPage) return null;

    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: siteConfig.url,
      },
    ];

    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      breadcrumbs.push({
        '@type': 'ListItem',
        position: index + 2,
        name: part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        item: siteConfig.url + currentPath,
      });
    });

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs,
    };
  };

  // 生成HowTo结构化数据（用于教程类文档）
  const getHowToSchema = () => {
    if (!isDocPage) return null;
    
    // 在服务端渲染时跳过HowTo，因为它需要访问DOM
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    const {title, description} = getPageMetadata();
    
    // 尝试从页面内容中提取步骤
    const steps = [];
    const headings = document.querySelectorAll('h2, h3');
    
    headings.forEach((heading, index) => {
      if (index < 5) { // 限制步骤数量
        steps.push({
          '@type': 'HowToStep',
          position: index + 1,
          name: heading.textContent,
          text: heading.nextElementSibling?.textContent?.substring(0, 200) || description,
        });
      }
    });

    if (steps.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: title,
      description: description,
      step: steps,
    };
  };

  // 组合所有结构化数据
  const structuredData = [];

  try {
    // 始终添加Organization和WebSite
    const orgSchema = getOrganizationSchema();
    const webSiteSchema = getWebSiteSchema();
    if (orgSchema) structuredData.push(orgSchema);
    if (webSiteSchema) structuredData.push(webSiteSchema);

    // 如果是文档页面，添加Article和Breadcrumb
    if (isDocPage) {
      const articleSchema = getArticleSchema();
      if (articleSchema) structuredData.push(articleSchema);
      
      const breadcrumb = getBreadcrumbSchema();
      if (breadcrumb) {
        structuredData.push(breadcrumb);
      }
      
      // 如果是教程类文档，添加HowTo
      if (location.pathname.includes('/getting-started') || 
          location.pathname.includes('/development') ||
          location.pathname.includes('/tutorial')) {
        const howTo = getHowToSchema();
        if (howTo) {
          structuredData.push(howTo);
        }
      }
    }
  } catch (error) {
    console.error('Error generating structured data:', error);
    // 即使出错也至少返回基本的Schema
    try {
      structuredData.push(getOrganizationSchema());
      structuredData.push(getWebSiteSchema());
    } catch (e) {
      // 如果连基本Schema都生成失败，返回null
      return null;
    }
  }

  // 如果没有结构化数据，返回null而不是空Fragment
  if (structuredData.length === 0) {
    return null;
  }

  return (
    <>
      {structuredData.map((data, index) => {
        if (!data) return null;
        try {
          return (
            <script
              key={index}
              type="application/ld+json"
              dangerouslySetInnerHTML={{__html: JSON.stringify(data, null, 2)}}
            />
          );
        } catch (error) {
          console.error('Error rendering structured data:', error);
          return null;
        }
      })}
    </>
  );
}

/**
 * 结构化数据组件 - 使用BrowserOnly确保在客户端渲染
 * 这样可以避免服务端渲染时访问document对象
 */
export default function StructuredData() {
  return (
    <BrowserOnly fallback={null}>
      {() => <StructuredDataInner />}
    </BrowserOnly>
  );
}

